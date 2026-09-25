// =============================================================
//  src/components/ProjectManager.jsx
//  Slide-in left panel for create / load / rename / delete
//  named projects. All storage via useProjects hook.
// =============================================================

import { useState } from "react";
import { colors, fonts, fontSizes, spacing, radius, shadows } from "../theme/tokens.js";

export default function ProjectManager({
  visible,
  projects,
  activeProject,
  onNew,
  onLoad,
  onRename,
  onDelete,
  onExport,
  onImport,
  onClose,
}) {
  const [newName,     setNewName]     = useState("");
  const [renamingKey, setRenamingKey] = useState(null);
  const [renameVal,   setRenameVal]   = useState("");
  const [confirmDel,  setConfirmDel]  = useState(null);

  const projectList = Object.entries(projects).sort(
    ([, a], [, b]) => new Date(b.lastModified) - new Date(a.lastModified)
  );

  const handleCreate = () => {
    if (!newName.trim()) return;
    onNew(newName.trim());
    setNewName("");
  };

  const commitRename = (oldName) => {
    if (renameVal.trim() && renameVal !== oldName) onRename(oldName, renameVal.trim());
    setRenamingKey(null);
  };

  const handleImportClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xml";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) onImport(file);
    };
    input.click();
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 200,
        }}
      />

      {/* Panel */}
      <aside style={{
        position:    "fixed",
        top:         0,
        left:        0,
        width:       "320px",
        height:      "100vh",
        background:  colors.sidebarDark,
        borderRight: `1px solid ${colors.border}`,
        boxShadow:   shadows.lg,
        zIndex:      201,
        display:     "flex",
        flexDirection: "column",
        overflow:    "hidden",
      }}>

        {/* Header */}
        <div style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          padding:        `${spacing.lg} ${spacing.lg}`,
          borderBottom:   `1px solid ${colors.border}`,
          flexShrink:     0,
          background:     colors.primaryGreen,
        }}>
          <span style={{ fontFamily: fonts.display, fontSize: fontSizes.xl, color: "#fff" }}>
            📁 Projects
          </span>
          <button onClick={onClose} style={iconBtn}>✕</button>
        </div>

        {/* New project input */}
        <div style={{
          padding:      spacing.lg,
          borderBottom: `1px solid ${colors.border}`,
          flexShrink:   0,
        }}>
          <div style={{ display: "flex", gap: spacing.sm }}>
            <input
              placeholder="New project name..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              style={inputStyle}
            />
            <button onClick={handleCreate} style={greenBtn}>+ New</button>
          </div>
        </div>

        {/* Import XML */}
        <div style={{
          padding:      `${spacing.sm} ${spacing.lg}`,
          borderBottom: `1px solid ${colors.border}`,
          flexShrink:   0,
        }}>
          <button onClick={handleImportClick} style={outlineBtn}>
            📂 Import from XML file
          </button>
        </div>

        {/* Project list */}
        <div style={{ flex: 1, overflowY: "auto", padding: spacing.sm }}>
          {projectList.length === 0 && (
            <p style={{ fontFamily: fonts.ui, fontSize: fontSizes.sm, color: colors.textMuted, textAlign: "center", marginTop: spacing.xl }}>
              No projects yet. Create one above!
            </p>
          )}

          {projectList.map(([name, data]) => {
            const isActive = name === activeProject;
            return (
              <div
                key={name}
                style={{
                  background:   isActive ? colors.primaryGreen + "22" : colors.surface,
                  border:       `1px solid ${isActive ? colors.primaryGreen : colors.border}`,
                  borderRadius: radius.md,
                  padding:      spacing.md,
                  marginBottom: spacing.sm,
                  transition:   "all 0.15s",
                }}
              >
                {/* Name row */}
                {renamingKey === name ? (
                  <div style={{ display: "flex", gap: spacing.xs, marginBottom: spacing.sm }}>
                    <input
                      autoFocus
                      value={renameVal}
                      onChange={e => setRenameVal(e.target.value)}
                      onBlur={() => commitRename(name)}
                      onKeyDown={e => {
                        if (e.key === "Enter") commitRename(name);
                        if (e.key === "Escape") setRenamingKey(null);
                      }}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button onClick={() => commitRename(name)} style={greenBtn}>✓</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: spacing.xs, marginBottom: "4px" }}>
                    {isActive && (
                      <span style={{ fontSize: "10px", color: colors.primaryGreen, fontWeight: 800 }}>▶</span>
                    )}
                    <span style={{
                      fontFamily: fonts.ui,
                      fontSize:   fontSizes.md,
                      fontWeight: isActive ? 800 : 600,
                      color:      isActive ? colors.primaryGreen : colors.textPrimary,
                      flex:       1,
                      overflow:   "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {name}
                    </span>
                  </div>
                )}

                {/* Last modified */}
                <p style={{ fontFamily: fonts.ui, fontSize: fontSizes.xs, color: colors.textMuted, margin: `0 0 ${spacing.sm}` }}>
                  {new Date(data.lastModified).toLocaleDateString()} {new Date(data.lastModified).toLocaleTimeString()}
                </p>

                {/* Actions */}
                <div style={{ display: "flex", gap: spacing.xs, flexWrap: "wrap" }}>
                  <ActionBtn onClick={() => { onLoad(name); onClose(); }} label="Open" color={colors.primaryGreen} />
                  <ActionBtn onClick={() => { setRenamingKey(name); setRenameVal(name); }} label="Rename" color={colors.info} />
                  <ActionBtn onClick={() => onExport(name)} label="Export" color={colors.textSecondary} />

                  {confirmDel === name ? (
                    <>
                      <ActionBtn onClick={() => { onDelete(name); setConfirmDel(null); }} label="Confirm ✘" color={colors.error} />
                      <ActionBtn onClick={() => setConfirmDel(null)} label="Cancel" color={colors.textMuted} />
                    </>
                  ) : (
                    <ActionBtn onClick={() => setConfirmDel(name)} label="Delete" color={colors.error} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </aside>
    </>
  );
}

function ActionBtn({ onClick, label, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily:   fonts.ui,
        fontSize:     fontSizes.xs,
        fontWeight:   600,
        padding:      `3px ${spacing.sm}`,
        background:   "transparent",
        color:        color,
        border:       `1px solid ${color}66`,
        borderRadius: "3px",
        cursor:       "pointer",
      }}
    >
      {label}
    </button>
  );
}

const iconBtn = {
  background:  "rgba(255,255,255,0.2)",
  border:      "none",
  color:       "#fff",
  fontSize:    fontSizes.md,
  cursor:      "pointer",
  borderRadius: radius.sm,
  padding:     "4px 8px",
  fontFamily:  fonts.ui,
};

const inputStyle = {
  fontFamily:  fonts.ui,
  fontSize:    fontSizes.sm,
  padding:     `${spacing.xs} ${spacing.sm}`,
  background:  colors.surface,
  color:       colors.textPrimary,
  border:      `1px solid ${colors.border}`,
  borderRadius: radius.sm,
  outline:     "none",
  flex:        1,
};

const greenBtn = {
  fontFamily:  fonts.ui,
  fontSize:    fontSizes.sm,
  fontWeight:  700,
  padding:     `${spacing.xs} ${spacing.md}`,
  background:  colors.primaryGreen,
  color:       "#fff",
  border:      "none",
  borderRadius: radius.sm,
  cursor:      "pointer",
  whiteSpace:  "nowrap",
};

const outlineBtn = {
  fontFamily:   fonts.ui,
  fontSize:     fontSizes.sm,
  fontWeight:   600,
  padding:      `${spacing.xs} ${spacing.md}`,
  background:   "transparent",
  color:        colors.textSecondary,
  border:       `1px solid ${colors.border}`,
  borderRadius: radius.sm,
  cursor:       "pointer",
  width:        "100%",
};
