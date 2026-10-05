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

    private static final String PACK_VERSION = "2";
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
            boolean esp = fqbn.startsWith("esp32");
            ensureReady();
            if (esp) ensureEsp32Ready();

            File sketchDir = new File(base, "work/sketch");
            sketchDir.mkdirs();
            try (FileOutputStream fos = new FileOutputStream(new File(sketchDir, "sketch.ino"))) {
                fos.write(code.getBytes(StandardCharsets.UTF_8));
            }
            File build = new File(base, esp ? "work/build-esp32" : "work/build");
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
            if (esp) env.put("ARDUINO_DIRECTORIES_DATA", base.getPath());
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
            File hex = new File(build, esp ? "sketch.ino.merged.bin" : "sketch.ino.hex");
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

    // ---- ESP32 (IoT Cube) setup -------------------------------------------------
    private static final String ESP32_VERSION = "1";

    private void ensureEsp32Ready() throws Exception {
        File marker = new File(base, ".esp32-ready-v" + ESP32_VERSION);
        if (marker.exists()) return;
        unpack("esp32.zip");
        String b = base.getPath();
        fillPlaceholders(new File(base, "packages/esp32/hardware/esp32/3.3.11/platform.txt"), b);
        fillPlaceholders(new File(base, "packages/esp32/tools/esptool_py/4.8.1/esptool"), b);
        String glibc = new File(base, "glibc").getPath();
        String gccRoot = new File(base, "esp32-gcc").getPath();
        String extra = gccRoot + "/lib:" + gccRoot + "/bin:" + gccRoot + "/libexec/gcc/xtensa-esp-elf/14.2.0";
        wrapElfs(new File(base, "esp32-gcc"), glibc, extra, gccRoot + "/lib/gcc/");
        wrapElfs(new File(base, "pyroot"), glibc);
        File srcDir = new File(base, ".arduino15/packages/builtin/tools/ctags/5.8-arduino11");
        File dstDir = new File(base, "packages/builtin/tools/ctags/5.8-arduino11");
        dstDir.mkdirs();
        copyFile(new File(srcDir, "ctags"), new File(dstDir, "ctags"));
        copyFile(new File(srcDir, "ctags.real"), new File(dstDir, "ctags.real"));
        new FileOutputStream(marker).close();
    }

    private void fillPlaceholders(File f, String basePath) throws Exception {
        if (!f.exists()) return;
        java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
        try (InputStream in = new FileInputStream(f)) {
            byte[] buf = new byte[1 << 16];
            int n;
            while ((n = in.read(buf)) > 0) bos.write(buf, 0, n);
        }
        String text = new String(bos.toByteArray(), StandardCharsets.UTF_8).replace("@BASE@", basePath);
        try (FileOutputStream fos = new FileOutputStream(f)) {
            fos.write(text.getBytes(StandardCharsets.UTF_8));
        }
    }

    private void copyFile(File src, File dst) throws Exception {
        if (!src.exists()) return;
        try (InputStream in = new FileInputStream(src);
             FileOutputStream os = new FileOutputStream(dst)) {
            byte[] buf = new byte[1 << 16];
            int n;
            while ((n = in.read(buf)) > 0) os.write(buf, 0, n);
        }
        dst.setExecutable(true, false);
        dst.setReadable(true, false);
    }
    // ---- helpers -----------------------------------------------------------------
    private void unpack(String asset) throws Exception {
        String basePath = base.getCanonicalPath();
        try (ZipInputStream zis = new ZipInputStream(
                new BufferedInputStream(ctx.getAssets().open(asset), 1 << 16))) {
            byte[] buf = new byte[1 << 16];
            ZipEntry e;
            while ((e = zis.getNextEntry()) != null) {
                File out = new File(base, e.getName().replace('\\', '/'));
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
        return wrapElfs(dir, glibc, null, null);
    }

    // Same, but can add extra library folders and a GCC_EXEC_PREFIX (used for the ESP32 compiler).
    private int wrapElfs(File dir, String glibc, String extraLibs, String gccPrefix) throws Exception {
        int count = 0;
        File[] files = dir.listFiles();
        if (files == null) return 0;
        String libPath = (extraLibs == null) ? glibc : glibc + ":" + extraLibs;
        for (File f : files) {
            if (f.isDirectory()) { count += wrapElfs(f, glibc, extraLibs, gccPrefix); continue; }
            if (f.getName().endsWith(".real")) continue;
            if (!hasInterpreter(f)) continue;
            File real = new File(f.getPath() + ".real");
            if (!f.renameTo(real)) continue;
            StringBuilder sb = new StringBuilder("#!/system/bin/sh\n");
            if (extraLibs != null) {
                sb.append("export LD_LIBRARY_PATH=").append(libPath).append("\n");
            }
            if (gccPrefix != null && (f.getName().endsWith("gcc") || f.getName().endsWith("g++"))) {
                sb.append("export GCC_EXEC_PREFIX=").append(gccPrefix).append("\n");
            }
            sb.append("exec ").append(glibc).append("/ld-linux-aarch64.so.1 --library-path ")
              .append(libPath).append(" \"$0.real\" \"$@\"\n");
            try (FileOutputStream fos = new FileOutputStream(f)) {
                fos.write(sb.toString().getBytes(StandardCharsets.UTF_8));
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
