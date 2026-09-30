package com.yagenrobotics.codex;

import com.getcapacitor.JSObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.Map;

// Uploads a compiled .hex file to the board using avrdude - the same proven
// tool the Windows exe uses. avrdude opens /dev/ttyUSB0 directly (world
// read/write on this tablet), so no USB permission dialog is needed at all.
class AvrdudeUploader {

    static String findPort() {
        if (new File("/dev/ttyUSB0").exists()) return "/dev/ttyUSB0";
        if (new File("/dev/ttyACM0").exists()) return "/dev/ttyACM0";
        return null;
    }

    static JSObject listPorts() {
        JSObject out = new JSObject();
        com.getcapacitor.JSArray arr = new com.getcapacitor.JSArray();
        String port = findPort();
        if (port != null) {
            JSObject o = new JSObject();
            o.put("deviceId", -1);
            o.put("name", port);
            arr.put(o);
        }
        out.put("ports", arr);
        return out;
    }

    static JSObject upload(File base, String hexPath, String port) {
        JSObject out = new JSObject();
        StringBuilder log = new StringBuilder();
        try {
            if (hexPath == null || hexPath.isEmpty()) {
                out.put("success", false);
                out.put("log", "No compiled program found. Compile first, then upload.");
                return out;
            }
            File hex = new File(hexPath);
            if (!hex.exists()) {
                out.put("success", false);
                out.put("log", "Compiled hex file is missing: " + hexPath);
                return out;
            }

            String serial = port;
            if (serial == null || serial.isEmpty()) serial = findPort();
            if (serial == null) {
                out.put("success", false);
                out.put("log", "No USB board found. Check the cable and that the board is powered.");
                return out;
            }

            File avrdudeDir = new File(base,
                    ".arduino15/packages/arduino/tools/avrdude/8.0.0-arduino1/avrdude");
            File bin = new File(avrdudeDir, "bin/avrdude");
            File conf = new File(avrdudeDir, "etc/avrdude.conf");
            if (!bin.exists()) {
                out.put("success", false);
                out.put("log", "avrdude is not installed in this app build.");
                return out;
            }

            log.append("Uploading to ").append(serial).append(" ...\n");
            ProcessBuilder pb = new ProcessBuilder(
                    bin.getPath(),
                    "-C", conf.getPath(),
                    "-p", "atmega328p",
                    "-c", "arduino",
                    "-P", serial,
                    "-b", "115200",
                    "-D",
                    "-U", "flash:w:" + hex.getPath() + ":i"
            );
            Map<String, String> env = pb.environment();
            env.put("HOME", base.getPath());
            pb.redirectErrorStream(true);
            Process p = pb.start();

            BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream()));
            String line;
            while ((line = r.readLine()) != null) {
                log.append(line).append("\n");
            }
            int exit = p.waitFor();
            boolean ok = exit == 0 && log.toString().contains("bytes of flash verified");
            out.put("success", ok);
            out.put("log", log.toString());
        } catch (Exception e) {
            out.put("success", false);
            out.put("log", log + "\nUpload failed: " + e);
        }
        return out;
    }
}
