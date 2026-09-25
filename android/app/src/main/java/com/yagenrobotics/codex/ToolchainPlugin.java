package com.yagenrobotics.codex;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// JS side: window.Capacitor.Plugins.Toolchain.prepare() / .compile({ code, fqbn })
//          .listPorts() / .upload({ hexPath, deviceId, fqbn })
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
                call.resolve(UsbUploadHelper.listPorts(getContext()));
            } catch (Exception e) {
                call.reject("Could not list USB ports: " + e);
            }
        }).start();
    }

    // Expects { hexPath: string, deviceId?: number }. If hexPath is omitted,
    // it uses the .hex produced by the most recent compile() call for this fqbn.
    @PluginMethod
    public void upload(final PluginCall call) {
        final String fqbn = call.getString("fqbn", "arduino:avr:uno");
        final int deviceId = call.getInt("deviceId", -1);
        new Thread(() -> {
            try {
                String hexPath = call.getString("hexPath");
                StringBuilder log = new StringBuilder();
                if (hexPath == null || hexPath.isEmpty()) {
                    hexPath = Toolchain.get(getContext()).lastHexPathFor(fqbn);
                    if (hexPath == null) {
                        JSObject fail = new JSObject();
                        fail.put("success", false);
                        fail.put("log", "No compiled program found. Compile first, then upload.");
                        call.resolve(fail);
                        return;
                    }
                }
                call.resolve(UsbUploadHelper.upload(getContext(), hexPath, deviceId, log));
            } catch (Exception e) {
                call.reject("Upload failed: " + e);
            }
        }).start();
    }
}
