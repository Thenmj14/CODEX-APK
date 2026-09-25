package com.yagenrobotics.codex;

import android.content.Context;

import com.getcapacitor.JSObject;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

// Owns the on-device Arduino toolchain: unpack, wrap glibc programs, compile.
class Toolchain {

    private final java.util.Map<String, String> lastHexByFqbn = new java.util.HashMap<>();

    private static final String PACK_VERSION = "1";
    private static Toolchain instance;

    private final Context ctx;
    private final File base;
    private boolean libsRefreshed = false;

    String lastHexPathFor(String fqbn) { return lastHexByFqbn.get(fqbn); }

    static synchronized Toolchain get(Context c) {
        if (instance == null) instance = new Toolchain(c.getApplicationContext());
        return instance;
    }

    private Toolchain(Context c) {
        ctx = c;
        base = new File(c.getFilesDir(), "toolchain");
    }

    // ---- setup -------------------------------------------------------------------
    synchronized void ensureReady() throws Exception {
        File marker = new File(base, ".ready-v" + PACK_VERSION);
        if (!marker.exists()) {
            deleteRecursive(base);
            base.mkdirs();
            unpack("pack.zip");
            wrapElfs(new File(base, ".arduino15"), new File(base, "glibc").getPath());
            new FileOutputStream(marker).close();
        }
        if (!libsRefreshed) {
            try { unpack("libs.zip"); } catch (Exception ignored) { }
            libsRefreshed = true;
        }
        ensureLtoPlugin();
    }

    // ---- compile -----------------------------------------------------------------
    synchronized JSObject compile(String code, String fqbn) {
        JSObject out = new JSObject();
        StringBuilder log = new StringBuilder();
        try {
            if (fqbn.startsWith("esp32")) {
                out.put("success", false);
                out.put("log", "ESP32 (IoT CUBE) support is not installed in the Android app yet.\n");
                return out;
            }
            ensureReady();

            File sketchDir = new File(base, "work/sketch");
            sketchDir.mkdirs();
            try (FileOutputStream fos = new FileOutputStream(new File(sketchDir, "sketch.ino"))) {
                fos.write(code.getBytes(StandardCharsets.UTF_8));
            }
            File build = new File(base, "work/build");
            build.mkdirs();
            File tmp = new File(base, "tmp");
            tmp.mkdirs();

            ProcessBuilder pb = new ProcessBuilder(
                    new File(base, "arduino-cli").getPath(),
                    "compile", "--fqbn", fqbn,
                    "--build-path", build.getPath(),
                    sketchDir.getPath());
            Map<String, String> env = pb.environment();
            env.put("HOME", base.getPath());
            env.put("TMPDIR", tmp.getPath());
            env.put("ARDUINO_DIRECTORIES_USER", new File(base, "user").getPath());
            pb.directory(base);
            pb.redirectErrorStream(true);
            Process p = pb.start();

            BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream()));
            String line;
            while ((line = r.readLine()) != null) {
                line = line.replaceAll("\u001B\\[[;\\d]*m", "");
                if (line.contains("Download failed") || line.contains("Error initializing")
                        || line.startsWith("Downloading") || line.contains("Loading index file")) {
                    continue;
                }
                log.append(line).append("\n");
            }
            int exit = p.waitFor();
            File hex = new File(build, "sketch.ino.hex");
            boolean ok = exit == 0 && hex.exists();
            out.put("success", ok);
            out.put("log", log.toString());
            out.put("hexPath", hex.getPath());
            if (ok) lastHexByFqbn.put(fqbn, hex.getPath());
        } catch (Exception e) {
            out.put("success", false);
            out.put("log", log.toString() + "\nInternal error: " + e + "\n");
        }
        return out;
    }

    File getBase() { return base; }

    // ---- helpers -----------------------------------------------------------------
    private void unpack(String asset) throws Exception {
        String basePath = base.getCanonicalPath();
        try (ZipInputStream zis = new ZipInputStream(
                new BufferedInputStream(ctx.getAssets().open(asset), 1 << 16))) {
            byte[] buf = new byte[1 << 16];
            ZipEntry e;
            while ((e = zis.getNextEntry()) != null) {
                File out = new File(base, e.getName());
                if (!out.getCanonicalPath().startsWith(basePath)) continue;
                if (e.isDirectory()) { out.mkdirs(); continue; }
                out.getParentFile().mkdirs();
                try (FileOutputStream fos = new FileOutputStream(out)) {
                    int n;
                    while ((n = zis.read(buf)) > 0) fos.write(buf, 0, n);
                }
                out.setExecutable(true, false);
                out.setReadable(true, false);
            }
        }
    }

    private void ensureLtoPlugin() throws Exception {
        File dir = new File(base,
                ".arduino15/packages/arduino/tools/avr-gcc/7.3.0-atmel3.6.1-arduino7/libexec/gcc/avr/7.3.0");
        File src = new File(dir, "liblto_plugin.so.0.0.0");
        if (!src.exists()) return;
        for (String n : new String[]{"liblto_plugin.so", "liblto_plugin.so.0"}) {
            File d = new File(dir, n);
            if (d.exists()) continue;
            try (InputStream in = new FileInputStream(src);
                 FileOutputStream os = new FileOutputStream(d)) {
                byte[] buf = new byte[1 << 16];
                int len;
                while ((len = in.read(buf)) > 0) os.write(buf, 0, len);
            }
            d.setExecutable(true, false);
            d.setReadable(true, false);
        }
    }

    // Replace every glibc program with a script that runs it through the bundled loader.
    private int wrapElfs(File dir, String glibc) throws Exception {
        int count = 0;
        File[] files = dir.listFiles();
        if (files == null) return 0;
        for (File f : files) {
            if (f.isDirectory()) { count += wrapElfs(f, glibc); continue; }
            if (f.getName().endsWith(".real")) continue;
            if (!hasInterpreter(f)) continue;
            File real = new File(f.getPath() + ".real");
            if (!f.renameTo(real)) continue;
            String script = "#!/system/bin/sh\n"
                    + "exec " + glibc + "/ld-linux-aarch64.so.1 --library-path " + glibc
                    + " \"$0.real\" \"$@\"\n";
            try (FileOutputStream fos = new FileOutputStream(f)) {
                fos.write(script.getBytes(StandardCharsets.UTF_8));
            }
            f.setExecutable(true, false);
            f.setReadable(true, false);
            real.setExecutable(true, false);
            real.setReadable(true, false);
            count++;
        }
        return count;
    }

    // True only for ARM64 ELF files that request a program interpreter (PT_INTERP).
    private boolean hasInterpreter(File f) {
        try (RandomAccessFile raf = new RandomAccessFile(f, "r")) {
            if (raf.length() < 64) return false;
            byte[] h = new byte[64];
            raf.readFully(h);
            if (h[0] != 0x7f || h[1] != 'E' || h[2] != 'L' || h[3] != 'F') return false;
            if (h[4] != 2 || h[5] != 1) return false;
            ByteBuffer b = ByteBuffer.wrap(h).order(ByteOrder.LITTLE_ENDIAN);
            if (b.getShort(18) != 183) return false;
            long phoff = b.getLong(32);
            int phentsize = b.getShort(54) & 0xffff;
            int phnum = b.getShort(56) & 0xffff;
            byte[] t = new byte[4];
            for (int i = 0; i < phnum; i++) {
                raf.seek(phoff + (long) i * phentsize);
                raf.readFully(t);
                if (ByteBuffer.wrap(t).order(ByteOrder.LITTLE_ENDIAN).getInt(0) == 3) return true;
            }
        } catch (Exception ignored) { }
        return false;
    }

    private void deleteRecursive(File f) {
        if (!f.exists()) return;
        File[] kids = f.listFiles();
        if (kids != null) for (File k : kids) deleteRecursive(k);
        f.delete();
    }
}
