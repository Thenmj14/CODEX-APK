package com.yagenrobotics.codex;

import com.getcapacitor.JSObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.Map;

// Uploads a compiled ESP32 image (sketch.ino.merged.bin) with esptool, using the
// same command that was proven by hand on the IoT Cube.
class EspUploader {

    static JSObject upload(File base, String binPath, String port) {
        JSObject out = new JSObject();
        StringBuilder log = new StringBuilder();
        try {
            if (binPath == null || binPath.isEmpty()) {
                out.put("success", false);
                out.put("log", "No compiled program found. Compile first, then upload.");
                return out;
            }
            File bin = new File(binPath);
            if (!bin.exists()) {
                out.put("success", false);
                out.put("log", "Compiled image is missing: " + binPath);
                return out;
            }

            String serial = port;
            if (serial == null || serial.isEmpty()) serial = AvrdudeUploader.findPort();
            if (serial == null) {
                out.put("success", false);
                out.put("log", "No USB board found. Check the cable and that the board is powered.");
                return out;
            }

            File esptool = new File(base, "packages/esp32/tools/esptool_py/4.8.1/esptool");
            if (!esptool.exists()) {
                out.put("success", false);
                out.put("log", "esptool is not installed yet. Compile once for the IoT Cube first.");
                return out;
            }

            log.append("Uploading to ").append(serial).append(" ...\n");
            ProcessBuilder pb = new ProcessBuilder(
                    esptool.getPath(),
                    "--chip", "esp32",
                    "--port", serial,
                    "--baud", "460800",
                    "write_flash", "0x0", bin.getPath()
            );
            Map<String, String> env = pb.environment();
            env.put("HOME", base.getPath());
            env.put("TMPDIR", new File(base, "tmp").getPath());
            pb.redirectErrorStream(true);
            Process p = pb.start();

            BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream()));
            String line;
            while ((line = r.readLine()) != null) {
                log.append(line).append("\n");
            }
            int exit = p.waitFor();
            boolean ok = exit == 0 && log.toString().contains("Hash of data verified");
            out.put("success", ok);
            out.put("log", log.toString());
        } catch (Exception e) {
            out.put("success", false);
            out.put("log", log + "\nUpload failed: " + e);
        }
        return out;
    }
}