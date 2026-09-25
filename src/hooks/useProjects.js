// =============================================================
//  src/hooks/useProjects.js
//  All localStorage project management in one place.
//  Components never touch localStorage directly.
// =============================================================

import { useState, useCallback } from "react";

const STORAGE_KEY   = "mark1_projects";
const ACTIVE_KEY    = "mark1_activeProject";
const DEFAULT_NAME  = "My First Project";

// ── Helpers ───────────────────────────────────────────────────
function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveAll(projects) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

// ── Hook ──────────────────────────────────────────────────────
export function useProjects() {
  const [projects,      setProjectsState] = useState(() => loadAll());
  const [activeProject, setActiveProject] = useState(
    () => localStorage.getItem(ACTIVE_KEY) || DEFAULT_NAME
  );

  // ── Internal setter (keeps state + storage in sync) ─────────
  const _setProjects = useCallback((updated) => {
    saveAll(updated);
    setProjectsState(updated);
  }, []);

  const _setActive = useCallback((name) => {
    localStorage.setItem(ACTIVE_KEY, name);
    setActiveProject(name);
  }, []);

  // ── Create ───────────────────────────────────────────────────
  const createProject = useCallback((name) => {
    const trimmed = name.trim() || DEFAULT_NAME;
    const all = loadAll();
    if (all[trimmed]) return { success: false, error: "Name already exists" };

    const updated = {
      ...all,
      [trimmed]: {
        xml:          "<xml></xml>",
        board:        "arduino:avr:nano:cpu=atmega328",
        port:         "",
        lastModified: new Date().toISOString(),
      },
    };
    _setProjects(updated);
    _setActive(trimmed);
    return { success: true };
  }, [_setProjects, _setActive]);

  // ── Save current workspace ───────────────────────────────────
  const saveProject = useCallback((name, xml, board, port) => {
    const all = loadAll();
    const updated = {
      ...all,
      [name]: {
        xml:          xml  || all[name]?.xml  || "<xml></xml>",
        board:        board || all[name]?.board || "",
        port:         port  || all[name]?.port  || "",
        lastModified: new Date().toISOString(),
      },
    };
    _setProjects(updated);
  }, [_setProjects]);

  // ── Load a project (returns its data) ────────────────────────
  const loadProject = useCallback((name) => {
    const all = loadAll();
    const project = all[name];
    if (!project) return null;
    _setActive(name);
    return project;
  }, [_setActive]);

  // ── Rename ───────────────────────────────────────────────────
  const renameProject = useCallback((oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return { success: false, error: "Name cannot be empty" };
    const all = loadAll();
    if (all[trimmed] && trimmed !== oldName)
      return { success: false, error: "Name already exists" };

    const { [oldName]: data, ...rest } = all;
    const updated = { ...rest, [trimmed]: data };
    _setProjects(updated);
    if (activeProject === oldName) _setActive(trimmed);
    return { success: true };
  }, [activeProject, _setProjects, _setActive]);

  // ── Delete ───────────────────────────────────────────────────
  const deleteProject = useCallback((name) => {
    const all = loadAll();
    const { [name]: _, ...rest } = all;
    _setProjects(rest);

    // Switch active to first remaining, or create default
    const remaining = Object.keys(rest);
    if (remaining.length === 0) {
      createProject(DEFAULT_NAME);
      return { newActiveName: DEFAULT_NAME, newActiveData: { xml: "<xml></xml>" } };
    } else if (activeProject === name) {
      const nextName = remaining[0];
      _setActive(nextName);
      return { newActiveName: nextName, newActiveData: rest[nextName] };
    }
    return { newActiveName: activeProject, newActiveData: rest[activeProject] };
  }, [activeProject, _setProjects, _setActive, createProject]);
  
  // ── Export XML ───────────────────────────────────────────────
  const exportXML = useCallback((name, xml) => {
    const blob = new Blob([xml], { type: "text/xml" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${name}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // ── Import XML ───────────────────────────────────────────────
  const importXML = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }, []);

  return {
    projects,
    activeProject,
    createProject,
    saveProject,
    loadProject,
    renameProject,
    deleteProject,
    exportXML,
    importXML,
    setActiveProject: _setActive,
  };
}
