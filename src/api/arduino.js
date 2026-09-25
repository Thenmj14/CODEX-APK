// =============================================================
//  src/api/arduino.js
//  Talks to the backend. Two modes:
//   - Android app (Capacitor): uses the native "Toolchain" plugin (offline compile).
//   - Everything else (Windows exe / browser): uses the Flask backend as before.
// =============================================================

const isNative = () =>
  !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const toolchain = () => window.Capacitor.Plugins.Toolchain;

// Boards shown in the Android app (same as boards.py in the exe)
const NATIVE_BOARDS = [
  { id: "mark1",   name: "MARK 1",   fqbn: "arduino:avr:uno",    group: "Robots" },
  { id: "mark2",   name: "MARK 2",   fqbn: "arduino:avr:uno",    group: "Robots" },
  { id: "iotcube", name: "IoT CUBE", fqbn: "esp32:esp32:esp32",  group: "Robots" },
];

let boardsCache = null;

async function getBoardFqbn(boardId) {
  if (!boardsCache) boardsCache = await fetchBoards();
  const board = boardsCache.find(b => b.id === boardId);
  return board ? board.fqbn : boardId; // fallback: assume it's already an fqbn
}

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.protocol === "file:" ? "http://127.0.0.1:5000" : "");

async function apiFetch(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  return await response.json();
}

// ---- ports ------------------------------------------------------------------
let nativePortsCache = [];

export async function fetchPorts() {
  if (isNative()) {
    try {
      const r = await toolchain().listPorts();
      nativePortsCache = r.ports || [];
      if (nativePortsCache.length === 0) return ["No USB device found"];
      return nativePortsCache.map((p) => p.name);
    } catch (err) {
      console.error("[api] native listPorts failed:", err);
      return ["No USB device found"];
    }
  }
  try {
    const data = await apiFetch("/api/ports");
    return data.ports || [];
  } catch (err) {
    console.error("[api] fetchPorts failed:", err);
    return [];
  }
}

// ---- boards -----------------------------------------------------------------
export async function fetchBoards() {
  if (isNative()) return NATIVE_BOARDS;
  try {
    const data = await apiFetch("/api/boards");
    return data.boards || [];
  } catch (err) {
    console.error("[api] fetchBoards failed:", err);
    return [];
  }
}

// ---- CLI status -------------------------------------------------------------
export async function fetchCliStatus() {
  if (isNative()) {
    try {
      const r = await toolchain().prepare(); // first run unpacks the toolchain
      return { available: true, version: r.version };
    } catch (err) {
      return { available: false, error: String(err) };
    }
  }
  try {
    return await apiFetch("/api/cli-status");
  } catch (err) {
    return { available: false, error: "Backend unreachable" };
  }
}

// ---- compile ----------------------------------------------------------------
export async function compileSketch(code, boardId) {
  const fqbn = await getBoardFqbn(boardId);
  if (isNative()) {
    try {
      const r = await toolchain().compile({ code, fqbn });
      return { success: !!r.success, log: r.log || "" };
    } catch (err) {
      return { success: false, log: `Native compile error.\n${err}` };
    }
  }
  try {
    return await apiFetch("/api/compile", {
      method: "POST",
      body: JSON.stringify({ code, fqbn }),
    });
  } catch (err) {
    return { success: false, log: `Connection error.\n${err.message}` };
  }
}

// ---- flash ------------------------------------------------------------------
export async function flashSketch(boardId, port) {
  if (isNative()) {
    try {
      const fqbn = await getBoardFqbn(boardId);
      const match = nativePortsCache.find((p) => p.name === port);
      const deviceId = match ? match.deviceId : -1;
      const r = await toolchain().upload({ fqbn, deviceId });
      return { success: !!r.success, log: r.log || "" };
    } catch (err) {
      return { success: false, log: `Native upload error.\n${err}` };
    }
  }
  try {
    const fqbn = await getBoardFqbn(boardId);
    return await apiFetch("/api/flash", {
      method: "POST",
      body: JSON.stringify({ fqbn, port }),
    });
  } catch (err) {
    return { success: false, log: `Connection error.\n${err.message}` };
  }
}

// ---- compile + upload in one call (kept for compatibility) ------------------
export async function uploadSketch(code, boardId, port) {
  if (isNative()) {
    const c = await compileSketch(code, boardId);
    if (!c.success) return c;
    const f = await flashSketch(boardId, port);
    return { success: f.success, log: c.log + "\n\n" + f.log };
  }
  try {
    const fqbn = await getBoardFqbn(boardId);
    return await apiFetch("/api/upload", {
      method: "POST",
      body: JSON.stringify({ code, fqbn, port }),
    });
  } catch (err) {
    return {
      success: false,
      log: `Connection error: Could not reach backend.\n${err.message}`,
    };
  }
}
