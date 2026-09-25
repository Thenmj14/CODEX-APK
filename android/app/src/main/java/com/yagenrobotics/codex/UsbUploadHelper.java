package com.yagenrobotics.codex;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.hoho.android.usbserial.driver.UsbSerialDriver;
import com.hoho.android.usbserial.driver.UsbSerialPort;
import com.hoho.android.usbserial.driver.UsbSerialProber;

import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

// Finds a USB-serial adapter (the Uno's onboard USB chip), asks the user for
// permission if needed, and uploads a compiled .hex file to it over STK500v1.
class UsbUploadHelper {

    private static final String ACTION_USB_PERMISSION = "com.yagenrobotics.codex.USB_PERMISSION";

    static JSObject listPorts(Context ctx) {
        JSObject out = new JSObject();
        UsbManager manager = (UsbManager) ctx.getSystemService(Context.USB_SERVICE);
        List<UsbSerialDriver> drivers = UsbSerialProber.getDefaultProber().findAllDrivers(manager);
        com.getcapacitor.JSArray arr = new com.getcapacitor.JSArray();
        for (UsbSerialDriver d : drivers) {
            UsbDevice dev = d.getDevice();
            JSObject o = new JSObject();
            o.put("deviceId", dev.getDeviceId());
            o.put("name", String.format("USB %04X:%04X", dev.getVendorId(), dev.getProductId()));
            arr.put(o);
        }
        out.put("ports", arr);
        return out;
    }

    // Uploads hexPath to the given deviceId (or the first available device if -1).
    // Blocks the calling thread until done or failed - call this from a background thread.
    static JSObject upload(Context ctx, String hexPath, int deviceId, StringBuilder log) {
        JSObject out = new JSObject();
        try {
            UsbManager manager = (UsbManager) ctx.getSystemService(Context.USB_SERVICE);
            List<UsbSerialDriver> drivers = UsbSerialProber.getDefaultProber().findAllDrivers(manager);
            if (drivers.isEmpty()) {
                out.put("success", false);
                out.put("log", "No USB-serial device found. Check the cable and OTG adapter.");
                return out;
            }

            UsbSerialDriver driver = null;
            for (UsbSerialDriver d : drivers) {
                if (deviceId < 0 || d.getDevice().getDeviceId() == deviceId) { driver = d; break; }
            }
            if (driver == null) driver = drivers.get(0);
            UsbDevice device = driver.getDevice();

            if (!manager.hasPermission(device)) {
                log.append("Requesting USB permission...\n");
                if (!requestPermission(ctx, manager, device)) {
                    out.put("success", false);
                    out.put("log", log + "\nUSB permission was denied.");
                    return out;
                }
            }

            android.hardware.usb.UsbDeviceConnection connection = manager.openDevice(device);
            if (connection == null) {
                out.put("success", false);
                out.put("log", log + "\nCould not open the USB device.");
                return out;
            }

            UsbSerialPort port = driver.getPorts().get(0);
            port.open(connection);
            try {
                port.setParameters(115200, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE);

                log.append("Reading compiled hex file...\n");
                IntelHex hex = IntelHex.parse(hexPath);
                log.append("Program size: ").append(hex.length).append(" bytes\n");

                Stk500 stk = new Stk500(port, 128, log);
                log.append("Resetting board and syncing bootloader...\n");
                stk.resetAndSync();

                log.append("Uploading...\n");
                stk.writeFlash(hex.data);

                log.append("Verifying board is responsive after upload...\n");
                stk.leaveProgMode();

                out.put("success", true);
                out.put("log", log + "\nUpload complete.");
            } finally {
                try { port.close(); } catch (Exception ignored) { }
            }
        } catch (Exception e) {
            out.put("success", false);
            out.put("log", log + "\nUpload failed: " + e);
        }
        return out;
    }

    // Shows the Android system USB-permission dialog and waits (max 20s) for the answer.
    private static boolean requestPermission(Context ctx, UsbManager manager, UsbDevice device) {
        final CountDownLatch latch = new CountDownLatch(1);
        final boolean[] granted = {false};

        BroadcastReceiver receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (ACTION_USB_PERMISSION.equals(intent.getAction())) {
                    synchronized (this) {
                        granted[0] = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false);
                        latch.countDown();
                    }
                }
            }
        };

        int flags = Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0;
        PendingIntent pi = PendingIntent.getBroadcast(
                ctx, 0, new Intent(ACTION_USB_PERMISSION), flags);

        IntentFilter filter = new IntentFilter(ACTION_USB_PERMISSION);
        if (Build.VERSION.SDK_INT >= 33) {
            ctx.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            ctx.registerReceiver(receiver, filter);
        }

        try {
            manager.requestPermission(device, pi);
            latch.await(20, TimeUnit.SECONDS);
        } catch (InterruptedException ignored) {
        } finally {
            try { ctx.unregisterReceiver(receiver); } catch (Exception ignored) { }
        }
        return granted[0];
    }
}
