// =============================================================
//  src/components/LogPanel.jsx
//  Collapsible bottom panel with Log + Serial Monitor tabs.
//  Persists across uploads. Color-coded success/error.
// =============================================================

import { useEffect, useRef, useState, useCallback } from "react";
import { colors, fonts, fontSizes, spacing, radius } from "../theme/tokens.js";

export default function LogPanel({ log, isUploading, lastUploadSuccess, selectedPort }) {
  const [collapsed,  setCollapsed]  = useState(false);
  const [activeTab,  setActiveTab]  = useState("log");
  const [panelHeight, setPanelHeight] = useState(180);
  const scrollRef    = useRef(null);
  const isDragging   = useRef(false);

  const startResize = useCallback((e) => {
    e.preventDefault();
    const startY      = e.clientY;
    const startHeight = panelHeight;

    const onMouseMove = (e) => {
      const delta     = startY - e.clientY;
      const newHeight = Math.min(Math.max(startHeight + delta, 80), 600);
      setPanelHeight(newHeight);
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup",   onMouseUp);
      window.dispatchEvent(new Event("resize"));
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup",   onMouseUp);
  }, [panelHeight]);

  // Auto-scroll to bottom when new log arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // Auto-expand and switch to log tab on new upload
    if (log) {
      setCollapsed(false);
      setActiveTab("log");
    }
  }, [log]);

  // Status color for header strip
  const headerBg = isUploading
    ? colors.info
    : lastUploadSuccess === true
      ? colors.success
      : lastUploadSuccess === false
        ? colors.error
        : colors.surface;

  const headerLabel = isUploading
    ? "Uploading..."
    : lastUploadSuccess === true
      ? "Upload Successful"
      : lastUploadSuccess === false
        ? "Upload Failed"
        : "Log";

  return (
    <div style={{
      flexShrink:    0,
      borderTop:     `1px solid ${colors.border}`,
      background:    colors.codePanel,
      transition:    "height 0.2s ease",
      height: collapsed ? "36px" : `${panelHeight}px`,
      display:       "flex",
      flexDirection: "column",
      overflow:      "hidden",
    }}>

      {/* ── Resize handle ────────────────────────────────────── */}
      {!collapsed && (
        <div
          onMouseDown={startResize}
          style={{
            height:      "8px",
            marginTop:   "-6px",
            paddingTop:  "6px",
            paddingBottom:"6px",
            cursor:     "ns-resize",
            background: colors.border,
            flexShrink: 0,
            transition: "background 0.2s",
          }}
          onMouseEnter={e => e.target.style.background = colors.primaryGreen}
          onMouseLeave={e => e.target.style.background = colors.border}
        />
      )}
      {/* ── Header strip ─────────────────────────────────────── */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        height:         "36px",
        background:     headerBg,
        flexShrink:     0,
        transition:     "background 0.3s",
        userSelect:     "none",
      }}>

        {/* ── Tabs ─────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: "2px" }}>
          <TabBtn
            label={headerLabel}
            active={activeTab === "log"}
            highlight={isUploading || lastUploadSuccess != null}
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab("log");
              if (collapsed) setCollapsed(false);
            }}
          />
          <TabBtn
            label="Serial Monitor"
            active={activeTab === "serial"}
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab("serial");
              if (collapsed) setCollapsed(false);
            }}
          />
        </div>

        {/* ── Collapse toggle ──────────────────────────────── */}
        <span
          onClick={() => setCollapsed(c => !c)}
          style={{
            fontFamily: fonts.ui,
            fontSize:   fontSizes.xs,
            color:      colors.textMuted,
            cursor:     "pointer",
            padding:    `0 ${spacing.md}`,
            lineHeight: "36px",
          }}
        >
          {collapsed ? "▲" : "▼"}
        </span>
      </div>

      {/* ── Log content ──────────────────────────────────────── */}
      {!collapsed && activeTab === "log" && (
        <div
          ref={scrollRef}
          style={{
            flex:      1,
            overflowY: "auto",
            padding:   `${spacing.sm} ${spacing.md}`,
            fontFamily: fonts.code,
            fontSize:  fontSizes.xs,
            lineHeight: "1.7",
            color:     log
              ? (lastUploadSuccess === false ? colors.error : colors.textCode)
              : colors.textMuted,
            whiteSpace: "pre-wrap",
            wordBreak:  "break-word",
          }}
        >
          {log || "Upload log will appear here after you click Upload."}
        </div>
      )}

      {/* ── Serial Monitor ───────────────────────────────────── */}
      {!collapsed && activeTab === "serial" && (
        <SerialMonitor selectedPort={selectedPort} />
      )}

    </div>
  );
}

// ── Tab button ────────────────────────────────────────────────
function TabBtn({ label, active, onClick, highlight }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily:    fonts.ui,
        fontSize:      fontSizes.xs,
        fontWeight:    active ? 800 : 600,
        color:         active || highlight ? "#1e6d07" : colors.textMuted,
        background:    active ? "rgba(255,255,255,0.15)" : "transparent",
        border:        "none",
        borderBottom:  active ? "2px solid #1e6d07" : "2px solid transparent",
        padding:       `0 ${spacing.lg}`,
        height:        "36px",
        cursor:        "pointer",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        transition:    "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

// ── Serial Monitor sub-component ─────────────────────────────
function SerialMonitor({ selectedPort }) {
  const [baud,      setBaud]      = useState("9600");
  const [connected, setConnected] = useState(false);
  const [output,    setOutput]    = useState("");
  const [input,     setInput]     = useState("");
  const esRef     = useRef(null);
  const scrollRef = useRef(null);

  const BAUD_RATES = ["9600", "19200", "38400", "57600", "115200"];

  // Auto-scroll output
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [output]);

  // Cleanup SSE on unmount
  useEffect(() => () => esRef.current?.close(), []);

  const connect = useCallback(() => {
    if (!selectedPort) { alert("Select a port from the toolbar first."); return; }
    const es = new EventSource(
      `http://127.0.0.1:5000/api/serial/stream?port=${encodeURIComponent(selectedPort)}&baud=${baud}`
    );
    esRef.current = es;
    es.onmessage = (e) => setOutput(prev => prev + e.data + "\n");
    es.onerror   = ()  => { setConnected(false); es.close(); };
    setConnected(true);
    setOutput("");
  }, [selectedPort, baud]);

  const disconnect = useCallback(() => {
    esRef.current?.close();
    setConnected(false);
    fetch("http://127.0.0.1:5000/api/serial/stop", { method: "POST" }).catch(() => {});
  }, []);

  const sendLine = useCallback(() => {
    if (!input.trim() || !connected) return;
    fetch("http://127.0.0.1:5000/api/serial/send", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ data: input + "\n" }),
    });
    setInput("");
  }, [input, connected]);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>

      {/* Controls row */}
      <div style={{
        display:      "flex",
        gap:          spacing.sm,
        padding:      `${spacing.xs} ${spacing.md}`,
        background:   colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        alignItems:   "center",
        flexShrink:   0,
      }}>
        <span style={{ fontFamily: fonts.ui, fontSize: fontSizes.xs, color: colors.textSecondary }}>
          Baud:
        </span>
        <select
          value={baud}
          onChange={e => setBaud(e.target.value)}
          disabled={connected}
          style={selStyle}
        >
          {BAUD_RATES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <button
          onClick={connected ? disconnect : connect}
          style={{
            fontFamily:   fonts.ui,
            fontSize:     fontSizes.xs,
            fontWeight:   700,
            padding:      `2px ${spacing.md}`,
            background:   connected ? colors.error : colors.primaryGreen,
            color:        "#fff",
            border:       "none",
            borderRadius: radius.sm,
            cursor:       "pointer",
          }}
        >
          {connected ? "Disconnect" : "Connect"}
        </button>

        {connected && (
          <span style={{ fontFamily: fonts.ui, fontSize: fontSizes.xs, color: colors.success }}>
            Connected
          </span>
        )}

        <button
          onClick={() => setOutput("")}
          style={{
            marginLeft:   "auto",
            fontFamily:   fonts.ui,
            fontSize:     fontSizes.xs,
            padding:      `2px ${spacing.sm}`,
            background:   "transparent",
            color:        colors.textMuted,
            border:       `1px solid ${colors.border}`,
            borderRadius: radius.sm,
            cursor:       "pointer",
          }}
        >
          Clear
        </button>
      </div>

      {/* Output area */}
      <div
        ref={scrollRef}
        style={{
          flex:       1,
          overflowY:  "auto",
          padding:    `${spacing.sm} ${spacing.md}`,
          fontFamily: fonts.code,
          fontSize:   fontSizes.xs,
          lineHeight: "1.7",
          color:      colors.textCode,
          whiteSpace: "pre-wrap",
          wordBreak:  "break-word",
        }}
      >
        {output || <span style={{ color: colors.textMuted }}>Serial output will appear here after connecting...</span>}
      </div>

      {/* Send row */}
      <div style={{
        display:      "flex",
        gap:          spacing.xs,
        padding:      `${spacing.xs} ${spacing.md}`,
        background:   colors.surface,
        borderTop:    `1px solid ${colors.border}`,
        flexShrink:   0,
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendLine()}
          placeholder="Send data..."
          disabled={!connected}
          style={{ ...selStyle, flex: 1 }}
        />
        <button
          onClick={sendLine}
          disabled={!connected}
          style={{
            fontFamily:   fonts.ui,
            fontSize:     fontSizes.xs,
            fontWeight:   700,
            padding:      `2px ${spacing.md}`,
            background:   connected ? colors.primaryGreen : colors.surface,
            color:        "#fff",
            border:       "none",
            borderRadius: radius.sm,
            cursor:       connected ? "pointer" : "not-allowed",
          }}
        >
          Send
        </button>
      </div>

    </div>
  );
}

const selStyle = {
  fontFamily:   fonts.ui,
  fontSize:     fontSizes.xs,
  padding:      `2px ${spacing.sm}`,
  background:   colors.surface,
  color:        colors.textPrimary,
  border:       `1px solid ${colors.border}`,
  borderRadius: radius.sm,
  outline:      "none",
};
