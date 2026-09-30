package com.yagenrobotics.codex;

import android.content.Context;

import com.hoho.android.usbserial.driver.UsbSerialPort;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.concurrent.TimeoutException;

// STK500v1: the protocol Arduino Uno bootloaders speak (what avrdude calls
// the "arduino" programmer). Talks over the already-open USB serial port.
//
// IMPORTANT: replies are read into a buffer at least as big as the USB packet
// size. Asking Android for fewer bytes than the chip sends makes the transfer
// fail and the data is lost, which is what broke the earlier versions.
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
    private final byte[] rxBuf;
    private final ArrayDeque<Byte> rxQueue = new ArrayDeque<>();

    Stk500(UsbSerialPort port, int pageSize, StringBuilder log) {
        this.port = port;
        this.pageSize = pageSize;
        this.log = log;
        int maxPacket = 64;
        try {
            maxPacket = Math.max(64, port.getReadEndpoint().getMaxPacketSize());
        } catch (Exception ignored) { }
        this.rxBuf = new byte[maxPacket];
        log.append("USB read buffer: ").append(maxPacket).append(" bytes\n");
    }

    // Kept so older UsbUploadHelper versions (which pass a Context) still compile.
    Stk500(UsbSerialPort port, int pageSize, StringBuilder log, Context ctx) {
        this(port, pageSize, log);
    }

    // ---- reset + sync ----------------------------------------------------------

    void resetAndSync() throws IOException, TimeoutException {
        Exception last = null;
        for (int cycle = 0; cycle < 4; cycle++) {
            if (cycle == 2) {
                log.append("No reply at 115200 baud, trying 57600 (older bootloader)...\n");
                port.setParameters(57600, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE);
            }
            pulseReset();
            try {
                syncBurst(1500);
                log.append("Synced with bootloader\n");
                return;
            } catch (TimeoutException e) {
                last = e;
                log.append("Sync attempt ").append(cycle + 1).append(" got no reply.\n");
            }
        }
        throw new TimeoutException("Could not sync with the bootloader: "
                + (last != null ? last.getMessage() : "no response"));
    }

    // Same sequence avrdude uses for Arduino boards: release DTR/RTS for 250 ms
    // so the reset capacitor charges, then assert them to pulse the reset line.
    private void pulseReset() throws IOException {
        port.setDTR(false);
        port.setRTS(false);
        sleep(250);
        port.setDTR(true);
        port.setRTS(true);
        sleep(50);
        drain();
    }

    // Sends GET_SYNC repeatedly and looks for INSYNC (0x14) followed by OK (0x10).
    private void syncBurst(long windowMs) throws IOException, TimeoutException {
        long deadline = System.currentTimeMillis() + windowMs;
        int sent = 0;
        int seen = 0;
        int state = 0; // 0 = waiting for INSYNC, 1 = waiting for OK
        StringBuilder raw = new StringBuilder();

        while (System.currentTimeMillis() < deadline) {
            send(new byte[]{CMD_GET_SYNC, CRC_EOP});
            sent++;
            long until = System.currentTimeMillis() + 100;
            while (System.currentTimeMillis() < until) {
                Byte b = rxQueue.poll();
                if (b == null) {
                    fill(30);
                    continue;
                }
                seen++;
                if (raw.length() < 60) {
                    if (raw.length() > 0) raw.append(' ');
                    raw.append(String.format("%02X", b));
                }
                if (state == 0) {
                    if (b == RESP_INSYNC) state = 1;
                } else {
                    if (b == RESP_OK) return;
                    state = (b == RESP_INSYNC) ? 1 : 0;
                }
            }
        }
        log.append("  diagnostic: sent ").append(sent).append(" sync commands, received ")
           .append(seen).append(" byte(s)");
        if (raw.length() > 0) log.append(" [").append(raw).append("]");
        log.append("\n");
        throw new TimeoutException("no response");
    }

    // ---- programming -----------------------------------------------------------

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
        enterProgMode();
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

    // ---- low-level serial helpers ----------------------------------------------

    private void send(byte[] data) throws IOException {
        port.write(data, 2000);
    }

    private void expectOk(int timeoutMs) throws IOException, TimeoutException {
        byte b1 = readByte(timeoutMs);
        if (b1 != RESP_INSYNC) throw new IOException("Expected INSYNC, got " + (b1 & 0xFF));
        byte b2 = readByte(timeoutMs);
        if (b2 != RESP_OK) throw new IOException("Expected OK, got " + (b2 & 0xFF));
    }

    // Reads from the USB port into the big buffer and queues every byte received.
    private int fill(int timeoutMs) throws IOException {
        int n = port.read(rxBuf, timeoutMs);
        for (int i = 0; i < n; i++) rxQueue.add(rxBuf[i]);
        return n;
    }

    private byte readByte(int timeoutMs) throws IOException, TimeoutException {
        long deadline = System.currentTimeMillis() + timeoutMs;
        while (true) {
            Byte b = rxQueue.poll();
            if (b != null) return b;
            long left = deadline - System.currentTimeMillis();
            if (left <= 0) throw new TimeoutException("No response from board");
            fill((int) Math.min(left, 200));
        }
    }

    private void drain() throws IOException {
        rxQueue.clear();
        while (port.read(rxBuf, 50) > 0) { /* discard */ }
    }

    private void sleep(int ms) {
        try { Thread.sleep(ms); } catch (InterruptedException ignored) { }
    }
}
