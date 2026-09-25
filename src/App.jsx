// =============================================================
//  src/App.jsx
//  Root component. Owns all shared state.
//  Wires Toolbar ↔ BlockCanvas ↔ CodePanel ↔ LogPanel ↔ ProjectManager.
// =============================================================

import { useState, useCallback, useRef, useEffect } from "react";
import { colors } from "./theme/tokens.js";
import { useProjects } from "./hooks/useProjects.js";

import Toolbar        from "./components/Toolbar.jsx";
import BlockCanvas    from "./components/BlockCanvas.jsx";
import CodePanel      from "./components/CodePanel.jsx";
import LogPanel       from "./components/LogPanel.jsx";
import ProjectManager from "./components/ProjectManager.jsx";
import SerialMonitor  from "./components/SerialMonitor.jsx";

export default function App() {

  // ── Code state ───────────────────────────────────────────────
  const [generatedCode,  setGeneratedCode]  = useState("");
  const [currentXML,     setCurrentXML]     = useState("<xml></xml>");
  const [loadXML,        setLoadXML]        = useState(null);  // {xml, key} triggers canvas load
  const loadKeyRef = useRef(0);
  const canvasRef = useRef(null);

  const pushXMLToCanvas = useCallback((xml) => {
    loadKeyRef.current += 1;
    setLoadXML({ xml, key: loadKeyRef.current });
  }, []);

  // ── Upload state ─────────────────────────────────────────────
  const [uploadLog,      setUploadLog]      = useState("");
  const [isUploading,    setIsUploading]    = useState(false);
  const [uploadSuccess,  setUploadSuccess]  = useState(null);  // null | true | false

  // ── Board / port ─────────────────────────────────────────────
  const [selectedBoard, setSelectedBoard]   = useState("");
  const [selectedPort,  setSelectedPort]    = useState("");

  // ── Project panel visibility ─────────────────────────────────
  const [showProjects, setShowProjects]     = useState(false);

  // ── Serial Monitor state ─────────────────────────────────────
  const [showSerialMonitor, setShowSerialMonitor] = useState(false);

  // ── Resizable layout state ───────────────────────────────────
  const [codeWidth,    setCodeWidth]        = useState(
    typeof window !== "undefined" ? Math.min(320, window.innerWidth * 0.4) : 320
  );
  const isDragging                          = useRef(false);

  // ── Projects hook ────────────────────────────────────────────
  const {
    projects,
    activeProject,
    createProject,
    saveProject,
    loadProject,
    renameProject,
    deleteProject,
    exportXML,
    importXML,
  } = useProjects();

    // ── Load the active project's saved code once on startup ─────
  useEffect(() => {
    const data = loadProject(activeProject);
    if (data) {
      setCurrentXML(data.xml);   // ← ADD THIS LINE
      pushXMLToCanvas(data.xml);
      if (data.board) setSelectedBoard(data.board);
      if (data.port)  setSelectedPort(data.port);
    } else {
      setCurrentXML("<xml></xml>");   // ← ADD THIS LINE
      pushXMLToCanvas("<xml></xml>");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ─────────────────────────────────────────────────

  const onDrag = useCallback((e) => {
    if (!isDragging.current) return;
    let newWidth = window.innerWidth - e.clientX;
    if (newWidth < 200) newWidth = 200;
    if (newWidth > window.innerWidth * 0.6) newWidth = window.innerWidth * 0.6;
    setCodeWidth(newWidth);
  }, []);

  const stopDrag = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
    window.dispatchEvent(new Event('resize')); // force blockly resize
  }, [onDrag]);

  const startDrag = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
  }, [onDrag, stopDrag]);

  const handleCodeChange = useCallback((code) => {
    setGeneratedCode(code);
  }, []);

  const handleXMLChange = useCallback((xml) => {
    setCurrentXML(xml);
  }, []);

  const handleSave = useCallback(() => {
    const liveXML = canvasRef.current?.getCurrentXML() || currentXML;
    saveProject(activeProject, liveXML, selectedBoard, selectedPort);
  }, [activeProject, currentXML, selectedBoard, selectedPort, saveProject]);

  const handleLoadProject = useCallback((name) => {
    const data = loadProject(name);
    if (!data) return;
    setCurrentXML(data.xml);   // ← ADD THIS LINE
    pushXMLToCanvas(data.xml);
    if (data.board) setSelectedBoard(data.board);
    if (data.port)  setSelectedPort(data.port);
  }, [loadProject, pushXMLToCanvas]);

  const handleNewProject = useCallback((name) => {
    const result = createProject(name);
    if (result.success) {
      setCurrentXML("<xml></xml>");   // ← ADD THIS LINE
      pushXMLToCanvas("<xml></xml>");
      setGeneratedCode("");
    } else {
      alert(result.error);
    }
  }, [createProject, pushXMLToCanvas]);

  const handleRename = useCallback((newName) => {
    const result = renameProject(activeProject, newName);
    if (!result.success) alert(result.error);
  }, [activeProject, renameProject]);

  const handleDelete = useCallback((name) => {
    const result = deleteProject(name);
    if (result?.newActiveData) {
      setCurrentXML(result.newActiveData.xml);   // ← ADD THIS LINE
      pushXMLToCanvas(result.newActiveData.xml);
    }
  }, [deleteProject, pushXMLToCanvas]);

  const handleExport = useCallback((name) => {
    const data = loadProject(name);
    if (data) exportXML(name, data.xml);
  }, [loadProject, exportXML]);

  const handleImport = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const xml  = e.target.result;
      const name = file.name.replace(".xml", "");
      createProject(name);
      saveProject(name, xml, "", "");
      handleLoadProject(name);
      setShowProjects(false);
    };
    reader.readAsText(file);
  }, [createProject, saveProject, handleLoadProject]);

  const handleUploadStart = useCallback(() => {
    setIsUploading(true);
    setUploadLog("⏳ Starting upload...\n");
    setUploadSuccess(null);
  }, []);

  const handleUploadDone = useCallback((result) => {
    setIsUploading(false);
    setUploadLog(result.log);
    setUploadSuccess(result.success);
  }, []);

  // ── Layout ───────────────────────────────────────────────────
  return (
    <div style={{
      display:       "flex",
      flexDirection: "column",
      height:        "100vh",
      width:         "100vw",
      overflow:      "hidden",
      background:    colors.panelDark,
    }}>

      {/* ── Top toolbar ────────────────────────────────────── */}
      <Toolbar
        projectName={activeProject}
        onRenameProject={handleRename}
        onNewProject={handleNewProject}
        onSaveProject={handleSave}
        onToggleProjectPanel={() => setShowProjects(v => !v)}
        code={generatedCode}
        selectedBoard={selectedBoard} onBoardChange={setSelectedBoard}
        selectedPort={selectedPort}   onPortChange={setSelectedPort}
        onUploadStart={handleUploadStart}
        onUploadDone={handleUploadDone}
        onOpenSerialMonitor={() => setShowSerialMonitor(true)}
      />

      {/* ── Main area: canvas + code panel ─────────────────── */}
      <div style={{
        display:  "flex",
        flex:     1,
        overflow: "hidden",
      }}>

        {/* Block canvas — takes remaining width */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <BlockCanvas
            ref={canvasRef}
            onCodeChange={handleCodeChange}
            onXMLChange={handleXMLChange}
            loadXML={loadXML}
          />
        </div>

        {/* Resizer handle */}
        <div 
          onMouseDown={startDrag}
          style={{
            width: "6px",
            cursor: "col-resize",
            background: colors.border,
            zIndex: 10,
            transition: "background 0.2s"
          }}
          onMouseEnter={e => e.target.style.background = colors.primaryGreen}
          onMouseLeave={e => e.target.style.background = colors.border}
        />

        {/* Code panel — resizable width right column */}
        <div style={{ width: `${codeWidth}px`, flexShrink: 0, display: "flex", flexDirection: "column" }}>
          <CodePanel
            code={generatedCode}
            onCodeChange={setGeneratedCode}
          />
        </div>

      </div>

      {/* ── Bottom log panel ───────────────────────────────── */}
      <LogPanel
        log={uploadLog}
        isUploading={isUploading}
        lastUploadSuccess={uploadSuccess}
      />

      {/* ── Project manager overlay ─────────────────────────── */}
      <ProjectManager
        visible={showProjects}
        projects={projects}
        activeProject={activeProject}
        onNew={handleNewProject}
        onLoad={handleLoadProject}
        onRename={(old, nw) => renameProject(old, nw)}
        onDelete={handleDelete}
        onExport={handleExport}
        onImport={handleImport}
        onClose={() => setShowProjects(false)}
      />

      {/* ── Serial Monitor ───────────────────────────────────── */}
      <SerialMonitor
        isOpen={showSerialMonitor}
        onClose={() => setShowSerialMonitor(false)}
      />

    </div>
  );
}
