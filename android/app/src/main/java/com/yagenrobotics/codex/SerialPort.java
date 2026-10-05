package com.yagenrobotics.codex;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

// Opens a tty device directly as a file, after setting its baud rate with stty.
// No USB permission dialog needed - the device node is already world read/write.
class SerialPort {

    interface Listener {
        void onData(String text);
        void onError(String message);
    }

    private final String devicePath;
    private FileInputStream in;
    private FileOutputStream out;
    private Thread readThread;
    private volatile boolean running = false;

    SerialPort(String devicePath) {
        this.devicePath = devicePath;
    }

    void open(int baud, Listener listener) throws IOException {
        File dev = new File(devicePath);
        if (!dev.exists()) throw new IOException("Port not found: " + devicePath);

        // Configure baud rate / raw mode via stty before opening the stream.
        try {
            Process p = new ProcessBuilder("/system/bin/stty", "-F", devicePath, String.valueOf(baud), "raw", "-echo").start();
            p.waitFor();
        } catch (Exception e) {
            throw new IOException("Could not configure port: " + e);
        }

        in = new FileInputStream(dev);
        out = new FileOutputStream(dev);
        running = true;

        readThread = new Thread(() -> {
            byte[] buf = new byte[1024];
            StringBuilder line = new StringBuilder();
            try {
                while (running) {
                    int n = in.read(buf);
                    if (n <= 0) continue;
                    for (int i = 0; i < n; i++) {
                        char c = (char) (buf[i] & 0xff);
                        if (c == '\n') {
                            listener.onData(line.toString());
                            line.setLength(0);
                        } else if (c != '\r') {
                            line.append(c);
                        }
                    }
                }
            } catch (Exception e) {
                if (running) listener.onError(String.valueOf(e));
            }
        });
        readThread.setDaemon(true);
        readThread.start();
    }

    void write(String data) {
        if (out == null) return;
        try {
            out.write(data.getBytes());
            out.flush();
        } catch (IOException ignored) { }
    }

    void close() {
        running = false;
        try { if (in != null) in.close(); } catch (IOException ignored) { }
        try { if (out != null) out.close(); } catch (IOException ignored) { }
    }
}
