package com.yagenrobotics.codex;

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

    Stk500(UsbSerialPort port, int pageSize, StringBuilder log) {
        this.port = port;
        this.pageSize = pageSize;
        this.log = log;
    }

    // Pulses DTR low->high the way Arduino's auto-reset circuit expects,
    // then waits for the bootloader to be ready.
    void resetAndSync() throws IOException, TimeoutException {
        port.setDTR(true);
        port.setRTS(true);
        sleep(50);
        port.setDTR(false);
        port.setRTS(false);
        sleep(50);
        port.setDTR(true);
        port.setRTS(true);
        sleep(50);
        drain();
        // Optiboot needs a moment after reset before it starts listening.
        sleep(300);

        Exception last = null;
        for (int attempt = 0; attempt < 15; attempt++) {
            try {
                send(new byte[]{CMD_GET_SYNC, CRC_EOP});
                expectOk(1000);
                log.append("Synced with bootloader\n");
                return;
            } catch (Exception e) {
                last = e;
                sleep(150);
            }
        }
        throw new TimeoutException("Could not sync with bootloader: "
                + (last != null ? last.getMessage() : "no response"));
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
