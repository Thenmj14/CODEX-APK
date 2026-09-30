package com.yagenrobotics.codex;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

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
                String hexPath = call.getString("hexPath");
                if (hexPath == null || hexPath.isEmpty()) {
                    hexPath = tc.lastHexPathFor(fqbn);
                }
                call.resolve(AvrdudeUploader.upload(tc.getBase(), hexPath, port));
            } catch (Exception e) {
                call.reject("Upload failed: " + e);
            }
        }).start();
    }
}
