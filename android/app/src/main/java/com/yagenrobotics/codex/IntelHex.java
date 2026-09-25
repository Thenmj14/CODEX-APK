package com.yagenrobotics.codex;

import java.io.BufferedReader;
import java.io.FileReader;
import java.util.ArrayList;
import java.util.List;

// Minimal Intel HEX parser: turns a .hex file into one contiguous flash image
// starting at address 0, padded with 0xFF (erased-flash value) between gaps.
class IntelHex {

    final byte[] data;   // flash image, index 0 == flash address 0
    final int length;    // highest address used + 1

    private IntelHex(byte[] data, int length) {
        this.data = data;
        this.length = length;
    }

    static IntelHex parse(String path) throws Exception {
        List<int[]> records = new ArrayList<>(); // {address, byte}
        int highAddr = 0;
        int maxAddr = 0;

        try (BufferedReader r = new BufferedReader(new FileReader(path))) {
            String line;
            while ((line = r.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.charAt(0) != ':') continue;
                int byteCount = hex(line, 1, 2);
                int addr = hex(line, 3, 4);
                int type = hex(line, 7, 2);
                if (type == 1) break;          // end-of-file record
                if (type == 4) {                // extended linear address
                    highAddr = hex(line, 9, byteCount * 2);
                    continue;
                }
                if (type != 0) continue;        // ignore other record types
                for (int i = 0; i < byteCount; i++) {
                    int b = hex(line, 9 + i * 2, 2);
                    int full = (highAddr << 16) + addr + i;
                    records.add(new int[]{full, b});
                    if (full > maxAddr) maxAddr = full;
                }
            }
        }

        int size = maxAddr + 1;
        byte[] out = new byte[size];
        java.util.Arrays.fill(out, (byte) 0xFF);
        for (int[] rec : records) out[rec[0]] = (byte) rec[1];
        return new IntelHex(out, size);
    }

    private static int hex(String s, int offset, int len) {
        return Integer.parseInt(s.substring(offset, offset + len), 16);
    }
}
