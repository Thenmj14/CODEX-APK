// =============================================================
//  src/components/SerialMonitor.jsx
//  Uses WebSerial API to read/write to the selected COM port.
// =============================================================

import { useState, useEffect, useRef } from "react";
import { colors, fonts, fontSizes, spacing, radius } from "../theme/tokens.js";

const BAUD_RATES = [9600, 19200, 38400, 57600, 74880, 115200, 230400, 250000];

export default function SerialMonitor({
  isOpen,         // Should the monitor be visible
  onClose,        // Callback to close
}) {
  const [port, setPort] = useState(null);
  const [baudRate, setBaudRate] = useState(115200);
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState([]);
  const [input, setInput] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);

  const readerRef = useRef(null);
  const keepReadingRef = useRef(true);
  const logsEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // ── WebSerial Connection ────────────────────────────────────
  const connect = async () => {
    if (!("serial" in navigator)) {
      alert("WebSerial is not supported in your browser. Please use Chrome or Edge.");
      return;
    }

    try {
      const selectedPort = await navigator.serial.requestPort();
      await selectedPort.open({ baudRate });
      setPort(selectedPort);
      setConnected(true);
      setLogs((prev) => [...prev, `[Connected at ${baudRate} baud]`]);
      keepReadingRef.current = true;
      readLoop(selectedPort);
    } catch (err) {
      console.error(err);
      setLogs((prev) => [...prev, `[Connection failed: ${err.message}]`]);
    }
  };

  const disconnect = async () => {
    keepReadingRef.current = false;
    if (readerRef.current) {
      await readerRef.current.cancel();
    }
    if (port) {
      try {
        await port.close();
      } catch (err) {}
      setPort(null);
    }
    setConnected(false);
    setLogs((prev) => [...prev, `[Disconnected]`]);
  };

  const readLoop = async (activePort) => {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = activePort.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    readerRef.current = reader;

    try {
      while (keepReadingRef.current) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          // split lines and add to log
          const newLines = value.replace(/\r/g, "").split("\n").filter(l => l.trim() !== "");
          if (newLines.length > 0) {
            setLogs((prev) => {
              const updated = [...prev, ...newLines];
              return updated.slice(-200); // keep last 200 lines to prevent lag
            });
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      reader.releaseLock();
    }
  };

  const sendData = async () => {
    if (!port || !connected) return;
    const textEncoder = new TextEncoderStream();
    const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
    const writer = textEncoder.writable.getWriter();
    await writer.write(input + "\n");
    writer.releaseLock();
    setLogs((prev) => [...prev, `> ${input}`]);
    setInput("");
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: spacing.lg,
      right: spacing.lg,
      width: "450px",
      height: "350px",
      backgroundColor: colors.codePanel,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.md,
      boxShadow: shadows.lg,
      display: "flex",
      flexDirection: "column",
      zIndex: 1000,
      overflow: "hidden"
    }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: spacing.sm,
        backgroundColor: colors.sidebarDark,
        borderBottom: `1px solid ${colors.border}`
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
          <span style={{ color: colors.textPrimary, fontFamily: fonts.ui, fontWeight: 700 }}>
            🔌 Serial Monitor
          </span>
          <select
            value={baudRate}
            onChange={(e) => setBaudRate(Number(e.target.value))}
            disabled={connected}
            style={selectStyle}
          >
            {BAUD_RATES.map(b => <option key={b} value={b}>{b} baud</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: spacing.sm }}>
          {connected ? (
            <button onClick={disconnect} style={{ ...btnStyle, backgroundColor: colors.error }}>Disconnect</button>
          ) : (
            <button onClick={connect} style={{ ...btnStyle, backgroundColor: colors.primaryGreen }}>Connect</button>
          )}
          <button onClick={onClose} style={btnStyle}>✖</button>
        </div>
      </div>

      {/* ── Log Area ───────────────────────────────────────── */}
      <div style={{
        flex: 1,
        padding: spacing.sm,
        overflowY: "auto",
        fontFamily: fonts.code,
        fontSize: fontSizes.sm,
        color: colors.textCode,
        backgroundColor: colors.codePanel
      }}>
        {logs.map((log, i) => (
          <div key={i} style={{ wordBreak: "break-all" }}>{log}</div>
        ))}
        <div ref={logsEndRef} />
      </div>

      {/* ── Input Area ─────────────────────────────────────── */}
      <div style={{
        display: "flex",
        padding: spacing.sm,
        backgroundColor: colors.sidebarDark,
        borderTop: `1px solid ${colors.border}`,
        gap: spacing.sm
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendData()}
          disabled={!connected}
          placeholder="Send command..."
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            color: colors.textPrimary,
            padding: spacing.xs,
            borderRadius: radius.sm,
            fontFamily: fonts.code
          }}
        />
        <button
          onClick={sendData}
          disabled={!connected || !input.trim()}
          style={{ ...btnStyle, backgroundColor: connected && input.trim() ? colors.primaryGreen : colors.surface }}
        >
          Send
        </button>
        <button
          onClick={() => setLogs([])}
          style={btnStyle}
          title="Clear Output"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

const selectStyle = {
  fontFamily: fonts.ui,
  fontSize: fontSizes.xs,
  padding: "2px 4px",
  backgroundColor: colors.surface,
  color: colors.textPrimary,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.sm,
};

const btnStyle = {
  fontFamily: fonts.ui,
  fontSize: fontSizes.xs,
  fontWeight: 600,
  padding: "4px 8px",
  border: "none",
  borderRadius: radius.sm,
  cursor: "pointer",
  color: "#fff",
  backgroundColor: "rgba(0,0,0,0.3)"
};

const shadows = {
  lg: "0 8px 24px rgba(0,0,0,0.6)",
};
