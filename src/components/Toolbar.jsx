// =============================================================
//  src/components/Toolbar.jsx
//  Top green bar: logo, project name, board/port selectors,
//  upload button, save/load controls. Responsive: shrinks text
//  size and padding on narrow screens instead of hiding things.
// =============================================================

import { useState, useEffect } from "react";
import { colors, fonts, fontSizes, spacing, radius, shadows } from "../theme/tokens.js";
import { fetchBoards, fetchPorts, fetchCliStatus, compileSketch, flashSketch } from "../api/arduino.js";

export default function Toolbar({
  projectName,
  onRenameProject,
  onNewProject,
  onSaveProject,
  onToggleProjectPanel,
  code,
  selectedBoard, onBoardChange,
  selectedPort,  onPortChange,
  onUploadStart, onUploadDone,
  onOpenSerialMonitor,
}) {
  const [boards,     setBoards]     = useState([]);
  const [ports,      setPorts]      = useState([]);
  const [uploading,  setUploading]  = useState(false);
  const [uploadStep, setUploadStep] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cliOk,      setCliOk]      = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput,   setNameInput]   = useState(projectName);

  const [compact, setCompact] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1000 : false
  );
  useEffect(() => {
    const onResize = () => setCompact(window.innerWidth < 1000);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  useEffect(() => {
    fetchBoards().then(setBoards);
    fetchCliStatus().then(r => setCliOk(r.available));
    refreshPorts();
  }, []);

  useEffect(() => { setNameInput(projectName); }, [projectName]);

  const refreshPorts = () => {
    fetchPorts().then(ports => {
      setPorts(ports);
      if (ports.length > 0 && !selectedPort) onPortChange(ports[0]);
    });
  };

  const handleUpload = async () => {
    if (!code)          return alert("No code to upload. Add some blocks first.");
    if (!selectedBoard) return alert("Please select a board.");
    if (!selectedPort)  return alert("Please select a port.");

    setUploading(true);
    setUploadStep("Compiling...");
    setUploadProgress(30);
    onUploadStart?.();

    const compResult = await compileSketch(code, selectedBoard);
    if (!compResult.success) {
      setUploading(false);
      onUploadDone?.(compResult);
      return;
    }

    setUploadStep("Uploading...");
    setUploadProgress(80);
    const flashResult = await flashSketch(selectedBoard, selectedPort);

    setUploadProgress(100);
    setTimeout(() => {
      setUploading(false);
      onUploadDone?.({
        success: flashResult.success,
        log: compResult.log + "\n\n" + flashResult.log
      });
    }, 500);
  };

  const commitRename = () => {
    setEditingName(false);
    if (nameInput.trim() && nameInput !== projectName) {
      onRenameProject?.(nameInput.trim());
    }
  };

  const fs = (full, small) => compact ? small : full;

  return (
    <header style={{
      display:        "flex",
      alignItems:     "center",
      gap:            compact ? "4px" : spacing.md,
      padding:        compact ? "0 6px" : `0 ${spacing.lg}`,
      height:         "56px",
      background:     colors.primaryGreen,
      boxShadow:      shadows.md,
      flexShrink:     0,
      zIndex:         100,
      overflowX:      "auto",
      overflowY:      "hidden",
      WebkitOverflowScrolling: "touch",
    }}>

      <span style={{
        fontFamily:  fonts.display,
        fontSize:    fs(fontSizes.xxl, "16px"),
        color:       "#fff",
        letterSpacing: "-0.5px",
        whiteSpace:  "nowrap",
        userSelect:  "none",
        flexShrink:  0,
      }}>
        CODEX
      </span>

      <div style={{ width: "1px", height: compact ? "24px" : "32px", background: "#ffffff44", flexShrink: 0 }} />

      <div style={{ display: "flex", alignItems: "center", gap: spacing.xs, flexShrink: 0 }}>
        {editingName ? (
          <input
            autoFocus
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setEditingName(false); }}
            style={{
              fontFamily:  fonts.ui,
              fontSize:    fs(fontSizes.md, fontSizes.sm),
              fontWeight:  700,
              color:       "#fff",
              background:  "rgba(0,0,0,0.2)",
              border:      "1px solid rgba(255,255,255,0.5)",
              borderRadius: radius.sm,
              padding:     `${spacing.xs} ${spacing.sm}`,
              outline:     "none",
              minWidth:    compact ? "90px" : "160px",
            }}
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            title="Click to rename project"
            style={{
              fontFamily:  fonts.ui,
              fontSize:    fs(fontSizes.md, fontSizes.sm),
              fontWeight:  700,
              color:       "#fff",
              background:  "transparent",
              border:      "none",
              cursor:      "pointer",
              padding:     `${spacing.xs} ${spacing.xs}`,
              display:     "flex",
              alignItems:  "center",
              gap:         "6px",
              whiteSpace:  "nowrap",
            }}
          >
            {projectName}
          </button>
        )}
      </div>

      <ToolBtn onClick={onSaveProject} title="Save project" label="Save" compact={compact} />
      <ToolBtn onClick={onToggleProjectPanel} title="All projects" label="Projects" compact={compact} />

      <div style={{ flex: 1, minWidth: compact ? "4px" : "0px" }} />

      {cliOk === false && (
        <span style={{
          fontFamily: fonts.ui,
          fontSize:   fs(fontSizes.xs, "10px"),
          color:      colors.accentYellow,
          background: "rgba(0,0,0,0.3)",
          padding:    `2px ${compact ? "4px" : spacing.sm}`,
          borderRadius: radius.sm,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}>
          {compact ? "⚠️ CLI missing" : "⚠️ arduino-cli not found"}
        </span>
      )}

      {!compact && <label style={labelStyle}>Board</label>}
      <select
        value={selectedBoard}
        onChange={e => onBoardChange(e.target.value)}
        style={{ ...selectStyle, minWidth: compact ? "80px" : "120px", fontSize: fs(fontSizes.sm, "11px"), padding: compact ? "2px 4px" : `${spacing.xs} ${spacing.sm}` }}
      >
        <option value="">{compact ? "Board" : "Select board..."}</option>
        {boards.map(b => (
          <option key={b.fqbn} value={b.fqbn}>{b.name}</option>
        ))}
      </select>

      {!compact && <label style={labelStyle}>Port</label>}
      <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}>
        <select
          value={selectedPort}
          onChange={e => onPortChange(e.target.value)}
          style={{ ...selectStyle, minWidth: compact ? "60px" : "90px", fontSize: fs(fontSizes.sm, "11px"), padding: compact ? "2px 4px" : `${spacing.xs} ${spacing.sm}` }}
        >
          <option value="">{compact ? "Port" : "Select port..."}</option>
          {ports.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button
          onClick={refreshPorts}
          title="Refresh ports"
          style={{ ...selectStyle, padding: compact ? "2px 6px" : "0 8px", cursor: "pointer", minWidth: "unset", fontSize: fs(fontSizes.sm, "11px") }}
        >
          {compact ? "⟳" : "Refresh"}
        </button>
      </div>

      <button
        onClick={!uploading ? handleUpload : undefined}
        style={{
          fontFamily:    fonts.ui,
          fontSize:      fs(fontSizes.md, "12px"),
          fontWeight:    800,
          padding:       compact ? "4px 10px" : `${spacing.sm} ${spacing.xl}`,
          background:    uploading
            ? `linear-gradient(to right, ${colors.primaryGreenDark} ${uploadProgress}%, rgba(29,185,84,0.3) ${uploadProgress}%)`
            : colors.primaryGreenDark,
          color:         "#fff",
          border:        "none",
          borderRadius:  radius.md,
          cursor:        uploading ? "not-allowed" : "pointer",
          boxShadow:     shadows.md,
          transition:    "background 0.3s ease",
          whiteSpace:    "nowrap",
          letterSpacing: "0.03em",
          minWidth:      compact ? "60px" : "120px",
          flexShrink:    0,
          position:      "relative",
          overflow:      "hidden",
        }}
      >
        {uploading ? `${uploadProgress}%` : "Upload"}
      </button>

    </header>
  );
}

function ToolBtn({ onClick, title, label, compact }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        fontFamily:  fonts.ui,
        fontSize:    compact ? "11px" : fontSizes.sm,
        fontWeight:  600,
        color:       "#fff",
        background:  "rgba(0,0,0,0.15)",
        border:      "1px solid rgba(255,255,255,0.25)",
        borderRadius: radius.sm,
        padding:     compact ? "3px 6px" : `${spacing.xs} ${spacing.md}`,
        cursor:      "pointer",
        display:     "flex",
        alignItems:  "center",
        gap:         "5px",
        whiteSpace:  "nowrap",
        transition:  "background 0.1s",
        flexShrink:  0,
      }}
    >
      {label}
    </button>
  );
}

const labelStyle = {
  fontFamily:  fonts.ui,
  fontSize:    fontSizes.xs,
  fontWeight:  900,
  color:       "rgb(255, 255, 255)",
  whiteSpace:  "nowrap",
  letterSpacing: "0.05em",
};

const selectStyle = {
  fontFamily:  fonts.ui,
  background:  "rgba(0,0,0,0.25)",
  color:       "#fff",
  border:      "1px solid rgba(255,255,255,0.3)",
  borderRadius: "4px",
  cursor:      "pointer",
  outline:     "none",
};