package com.yagenrobotics.codex;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import android.os.Handler;
import android.os.Looper;

// JS side: window.Capacitor.Plugins.Toolchain.prepare() / .compile({ code, fqbn })
//          .listPorts() / .upload({ hexPath?, fqbn?, port? })
@CapacitorPlugin(name = "Toolchain")
public class ToolchainPlugin extends Plugin {

    @PluginMethod
    public void prepare(final PluginCall call) {
        new Thread(() -> {
            try {
                Toolchain.get(getContext()).ensureReady();
                JSObject r = new JSObject();
                r.put("ready", true);
                r.put("version", "1.5.2-rc.1");
                call.resolve(r);
            } catch (Exception e) {
                call.reject("Toolchain setup failed: " + e);
            }
        }).start();
    }

    @PluginMethod
    public void compile(final PluginCall call) {
        final String code = call.getString("code", "");
        final String fqbn = call.getString("fqbn", "arduino:avr:uno");
        new Thread(() -> call.resolve(Toolchain.get(getContext()).compile(code, fqbn))).start();
    }

    @PluginMethod
    public void listPorts(final PluginCall call) {
        new Thread(() -> {
            try {
                call.resolve(AvrdudeUploader.listPorts());
            } catch (Exception e) {
                call.reject("Could not list ports: " + e);
            }
        }).start();
    }

    // Uploads using avrdude against /dev/ttyUSB0 (or the given port).
    // If hexPath is omitted, uses the .hex from the most recent compile() for this fqbn.
    @PluginMethod
    public void upload(final PluginCall call) {
        final String fqbn = call.getString("fqbn", "arduino:avr:uno");
        final String port = call.getString("port", null);
        new Thread(() -> {
            try {
                Toolchain tc = Toolchain.get(getContext());
                if (serialPort != null) {
                    serialPort.close();
                    serialPort = null;
                    mainHandler.post(() -> {
                        JSObject d = new JSObject();
                        d.put("error", "Serial monitor disconnected for upload.");
                        notifyListeners("serialError", d);
                    });
                }
                String hexPath = call.getString("hexPath");
                if (hexPath == null || hexPath.isEmpty()) {
                    hexPath = tc.lastHexPathFor(fqbn);
                }
                boolean esp = fqbn.startsWith("esp32") || (hexPath != null && hexPath.endsWith(".bin"));
                if (esp) call.resolve(EspUploader.upload(tc.getBase(), hexPath, port));
                else call.resolve(AvrdudeUploader.upload(tc.getBase(), hexPath, port));
            } catch (Exception e) {
                call.reject("Upload failed: " + e);
            }
        }).start();
    }
        // ---- Serial Monitor -------------------------------------------------------
    private SerialPort serialPort;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @PluginMethod
    public void connectSerial(final PluginCall call) {
        final String port = call.getString("port", null);
        final int baud = call.getInt("baud", 9600);
        new Thread(() -> {
            try {
                if (port == null || port.isEmpty()) {
                    call.reject("No port specified.");
                    return;
                }
                if (serialPort != null) {
                    serialPort.close();
                    serialPort = null;
                }
                serialPort = new SerialPort(port);
                serialPort.open(baud, new SerialPort.Listener() {
                    @Override
                    public void onData(String text) {
                        mainHandler.post(() -> {
                            JSObject data = new JSObject();
                            data.put("line", text);
                            notifyListeners("serialData", data);
                        });
                    }
                    @Override
                    public void onError(String message) {
                        mainHandler.post(() -> {
                            JSObject data = new JSObject();
                            data.put("error", message);
                            notifyListeners("serialError", data);
                        });
                    }
                });
                JSObject r = new JSObject();
                r.put("connected", true);
                call.resolve(r);
            } catch (Exception e) {
                call.reject("Could not open port: " + e);
            }
        }).start();
    }

    @PluginMethod
    public void disconnectSerial(final PluginCall call) {
        if (serialPort != null) {
            serialPort.close();
            serialPort = null;
        }
        JSObject r = new JSObject();
        r.put("connected", false);
        call.resolve(r);
    }

    @PluginMethod
    public void sendSerial(final PluginCall call) {
        final String data = call.getString("data", "");
        if (serialPort != null) serialPort.write(data);
        call.resolve();
    }
}
