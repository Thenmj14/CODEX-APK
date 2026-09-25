package com.yagenrobotics.codex;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.widget.Toast;

import com.hoho.android.usbserial.driver.UsbSerialPort;

import java.io.IOException;
import java.util.concurrent.TimeoutException;

// STK500v1: the protocol Arduino Uno / Nano bootloaders speak (what avrdude
// calls "arduino" programmer type). Talks over the already-open serial port.
class Stk500 {

    private static final byte CRC_EOP = 0x20;
    private static final byte CMD_GET_SYNC = 0x30;
    private static final byte CMD_ENTER_PROGMODE = 0x50;
    private static final byte CMD_LEAVE_PROGMODE = 0x51;
    private static final byte CMD_LOAD_ADDRESS = 0x55;
    private static final byte CMD_PROG_PAGE = 0x64;
    private static final byte RESP_INSYNC = 0x14;
    private static final byte RESP_OK = 0x10;

    private final UsbSerialPort port;
    private final int pageSize;      // bytes per flash page (128 for atmega328p)
    private final StringBuilder log;
    private final Context ctx;       // used only to show a real on-screen prompt, may be null

    Stk500(UsbSerialPort port, int pageSize, StringBuilder log, Context ctx) {
        this.port = port;
        this.pageSize = pageSize;
        this.log = log;
        this.ctx = ctx;
    }

    private void showToast(String message) {
        if (ctx == null) return;
        new Handler(Looper.getMainLooper()).post(() ->
                Toast.makeText(ctx, message, Toast.LENGTH_LONG).show());
    }

    // Pulses DTR/RTS the way Arduino's auto-reset circuit expects, then
    // sends GET_SYNC quickly and repeatedly, because the stock bootloader
    // (optiboot) only listens for about 1 second after reset before it
    // gives up and jumps to whatever program is already on the board.
    // If we miss that window, we pulse reset again and try once more.
    void resetAndSync() throws IOException, TimeoutException {
        Exception last = null;
        for (int cycle = 0; cycle < 3; cycle++) {
            pulseReset();
            try {
                syncBurst(1200);
                log.append("Synced with bootloader\n");
                return;
            } catch (Exception e) {
                last = e;
                log.append("Sync attempt ").append(cycle + 1).append(" missed the bootloader window, retrying reset...\n");
            }
        }

        // Automatic (software) reset did not work - this happens on some
        // clone boards that do not wire up the auto-reset circuit the same
        // way a genuine Uno does. Fall back to a manual reset: give the
        // person a window to press the board's own RESET button, and keep
        // listening the whole time so we catch the bootloader whenever it
        // wakes up, however they time the button press.
        log.append("\nAutomatic reset did not get a response.\n");
        log.append("PRESS THE RESET BUTTON ON THE BOARD NOW - listening for 10 seconds...\n");
        showToast("Press the RESET button on the board now!");
        try {
            syncBurst(10000);
            log.append("Synced with bootloader after manual reset\n");
            return;
        } catch (Exception e) {
            last = e;
        }

        throw new TimeoutException("Could not sync with bootloader (auto-reset and manual reset both failed): "
                + (last != null ? last.getMessage() : "no response"));
    }

    private void pulseReset() throws IOException {
        port.setDTR(true);
        port.setRTS(true);
        sleep(50);
        port.setDTR(false);
        port.setRTS(false);
        sleep(50);
        port.setDTR(true);
        port.setRTS(true);
        drain();
    }

    // Fires GET_SYNC every ~40ms for up to 1.2s using short per-byte reads,
    // so several attempts fit inside the bootloader's short listen window.
    private void syncBurst(long windowMs) throws IOException, TimeoutException {
        long deadline = System.currentTimeMillis() + windowMs;
        int totalBytesSeen = 0;
        StringBuilder rawSeen = new StringBuilder();
        int writeAttempts = 0;
        while (System.currentTimeMillis() < deadline) {
            try {
                send(new byte[]{CMD_GET_SYNC, CRC_EOP});
                writeAttempts++;
            } catch (IOException e) {
                log.append("  write failed: ").append(e).append("\n");
                throw e;
            }
            int[] seenCount = new int[1];
            if (tryReadOk(120, seenCount, rawSeen)) return;
            totalBytesSeen += seenCount[0];
        }
        log.append("  diagnostic: sent ").append(writeAttempts)
           .append(" sync commands, received ").append(totalBytesSeen).append(" total byte(s) back");
        if (rawSeen.length() > 0) {
            log.append(" [").append(rawSeen).append("]");
        }
        log.append("\n");
        throw new TimeoutException("no response");
    }

    // Like expectOk, but returns false on timeout instead of throwing,
    // and uses a short timeout so we can retry fast within the sync burst.
    // Also reports how many bytes it saw and what they were, for diagnostics.
    private boolean tryReadOk(int timeoutMs, int[] seenCountOut, StringBuilder rawSeen) throws IOException {
        byte[] buf = new byte[1];
        long deadline = System.currentTimeMillis() + timeoutMs;
        int state = 0; // 0 = waiting for INSYNC, 1 = waiting for OK
        while (System.currentTimeMillis() < deadline) {
            int n = port.read(buf, 30);
            if (n <= 0) continue;
            seenCountOut[0]++;
            if (rawSeen.length() < 40) {
                if (rawSeen.length() > 0) rawSeen.append(",");
                rawSeen.append(String.format("%02X", buf[0]));
            }
            if (state == 0) {
                if (buf[0] == RESP_INSYNC) state = 1;
                // else: stray byte, ignore and keep waiting
            } else {
                if (buf[0] == RESP_OK) return true;
                state = 0; // unexpected byte, start over
            }
        }
        return false;
    }

    void enterProgMode() throws IOException, TimeoutException {
        send(new byte[]{CMD_ENTER_PROGMODE, CRC_EOP});
        expectOk(1000);
    }

    void leaveProgMode() throws IOException, TimeoutException {
        send(new byte[]{CMD_LEAVE_PROGMODE, CRC_EOP});
        expectOk(1000);
    }

    // Writes the whole flash image, one page at a time.
    void writeFlash(byte[] image) throws IOException, TimeoutException {
        int total = image.length;
        int pages = (total + pageSize - 1) / pageSize;
        for (int p = 0; p < pages; p++) {
            int byteAddr = p * pageSize;
            int wordAddr = byteAddr / 2; // STK500 addresses flash in words
            int len = Math.min(pageSize, total - byteAddr);

            byte[] page = new byte[pageSize];
            java.util.Arrays.fill(page, (byte) 0xFF);
            System.arraycopy(image, byteAddr, page, 0, len);

            loadAddress(wordAddr);
            progPage(page);

            if (p % 8 == 0 || p == pages - 1) {
                log.append("Flashed page ").append(p + 1).append("/").append(pages).append("\n");
            }
        }
    }

    private void loadAddress(int wordAddr) throws IOException, TimeoutException {
        byte lo = (byte) (wordAddr & 0xFF);
        byte hi = (byte) ((wordAddr >> 8) & 0xFF);
        send(new byte[]{CMD_LOAD_ADDRESS, lo, hi, CRC_EOP});
        expectOk(1000);
    }

    private void progPage(byte[] page) throws IOException, TimeoutException {
        byte lenHi = (byte) ((page.length >> 8) & 0xFF);
        byte lenLo = (byte) (page.length & 0xFF);
        byte[] cmd = new byte[4 + page.length + 1];
        cmd[0] = CMD_PROG_PAGE;
        cmd[1] = lenHi;
        cmd[2] = lenLo;
        cmd[3] = 'F'; // flash memory type
        System.arraycopy(page, 0, cmd, 4, page.length);
        cmd[cmd.length - 1] = CRC_EOP;
        send(cmd);
        expectOk(2000);
    }

    // ---- low-level serial helpers ----

    private void send(byte[] data) throws IOException {
        port.write(data, 2000);
    }

    private void expectOk(int timeoutMs) throws IOException, TimeoutException {
        byte b1 = readByte(timeoutMs);
        if (b1 != RESP_INSYNC) throw new IOException("Expected INSYNC, got " + (b1 & 0xFF));
        byte b2 = readByte(timeoutMs);
        if (b2 != RESP_OK) throw new IOException("Expected OK, got " + (b2 & 0xFF));
    }

    private byte readByte(int timeoutMs) throws IOException, TimeoutException {
        byte[] buf = new byte[1];
        long deadline = System.currentTimeMillis() + timeoutMs;
        while (System.currentTimeMillis() < deadline) {
            int n = port.read(buf, 200);
            if (n > 0) return buf[0];
        }
        throw new TimeoutException("No response from board");
    }

    private void drain() throws IOException {
        byte[] buf = new byte[64];
        while (port.read(buf, 50) > 0) { /* discard */ }
    }

    private void sleep(int ms) {
        try { Thread.sleep(ms); } catch (InterruptedException ignored) { }
    }
}
