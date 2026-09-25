// =============================================================
//  src/components/CodePanel.jsx
//  Right panel — live Arduino code preview.
//  Uses @monaco-editor/react (no CDN, no AMD conflicts).
// =============================================================

import { useRef, useState, useCallback } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { colors, fonts, fontSizes, spacing, radius } from "../theme/tokens.js";

// Arduino syntax highlight rules for Monaco
const ARDUINO_LANG_ID = "arduino";

function setupArduinoLanguage(monaco) {
  // Only register once
  if (monaco.languages.getLanguages().some(l => l.id === ARDUINO_LANG_ID)) return;

  monaco.languages.register({ id: ARDUINO_LANG_ID });

  monaco.languages.setMonarchTokensProvider(ARDUINO_LANG_ID, {
    keywords: [
      "void","int","float","double","bool","char","byte","long","unsigned",
      "String","boolean","word","short","return","if","else","while","for",
      "do","switch","case","break","continue","true","false","null","new",
    ],
    builtins: [
      "pinMode","digitalWrite","digitalRead","analogWrite","analogRead",
      "delay","millis","micros","Serial","begin","print","println",
      "map","constrain","abs","min","max","random","setup","loop",
    ],
    tokenizer: {
      root: [
        [/#\w+/,              "keyword.directive"],
        [/\/\/.*$/,           "comment"],
        [/\/\*/,              "comment", "@blockComment"],
        [/"([^"\\]|\\.)*"/,   "string"],
        [/\b(void|int|float|double|bool|char|byte|long|String|boolean)\b/, "type"],
        [/\b(HIGH|LOW|INPUT|OUTPUT|true|false)\b/, "constant"],
        [/\b(setup|loop)\b/,  "tag"],
        [/\b(if|else|while|for|return|break|continue|switch|case)\b/, "keyword"],
        [/\brobot\b/,         "type"],
        [/[0-9]+(\.[0-9]+)?/, "number"],
        [/[{}()[\];,.]/,      "delimiter"],
      ],
      blockComment: [
        [/[^/*]+/, "comment"],
        [/\*\//,   "comment", "@pop"],
        [/[/*]/,   "comment"],
      ],
    },
  });

  monaco.editor.defineTheme("mark1Dark", {
    base:    "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword.directive", foreground: "C586C0" },
      { token: "comment",           foreground: "6A9955", fontStyle: "italic" },
      { token: "keyword",           foreground: "C586C0" },
      { token: "type",              foreground: "4EC9B0" },
      { token: "constant",          foreground: "569CD6" },
      { token: "string",            foreground: "CE9178" },
      { token: "number",            foreground: "B5CEA8" },
      { token: "tag",               foreground: "1DB954", fontStyle: "bold" },
    ],
    colors: {
      "editor.background":             "#0D1117",
      "editor.foreground":             "#E6EDF3",
      "editor.lineHighlightBackground":"#1a1a2e",
      "editorLineNumber.foreground":   "#404060",
      "editorCursor.foreground":       "#1DB954",
      "editor.selectionBackground":    "#264f78",
    },
  });
}

export default function CodePanel({ code, onCodeChange }) {
  const editorRef    = useRef(null);
  const [isEditable, setIsEditable] = useState(false);
  const [copied,     setCopied]     = useState(false);
  const monaco       = useMonaco();

  // Called once when Monaco instance is ready
  const handleEditorDidMount = useCallback((editor, monacoInstance) => {
    editorRef.current = editor;
    setupArduinoLanguage(monacoInstance);
    // Apply theme after language is registered
    monacoInstance.editor.setTheme("mark1Dark");
  }, []);

  // Keep editor content in sync when blocks change
  const handleEditorChange = useCallback((value) => {
    if (isEditable) onCodeChange?.(value || "");
  }, [isEditable, onCodeChange]);

  const handleCopy = () => {
    const val = editorRef.current?.getValue() || "";
    navigator.clipboard.writeText(val).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

const defaultCode = "// Build your program using blocks on the left!\n// Drag in an \"Arduino Setup\" and \"Arduino Loop\" block from Structure to get started.";
  return (
    <div style={{
      display:       "flex",
      flexDirection: "column",
      height:        "100%",
      background:    colors.codePanel,
      borderLeft:    `1px solid ${colors.border}`,
    }}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        padding:        `${spacing.sm} ${spacing.md}`,
        background:     colors.surface,
        borderBottom:   `1px solid ${colors.border}`,
        flexShrink:     0,
      }}>
        <span style={{
          fontFamily:    fonts.ui,
          fontSize:      fontSizes.sm,
          fontWeight:    700,
          color:         colors.textSecondary,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}>
          {"{ } "} Arduino Code
        </span>

        <div style={{ display: "flex", gap: spacing.sm }}>
          <button onClick={handleCopy} style={btnStyle(copied ? colors.success : colors.surface)}>
            {copied ? "✓ Copied" : "⎘ Copy"}
          </button>
          <button
            onClick={() => setIsEditable(e => !e)}
            style={btnStyle(isEditable ? colors.accentYellow : colors.surface, isEditable)}
          >
            {isEditable ? "🔒 Lock" : "✏️ Edit"}
          </button>
        </div>
      </div>

      {/* ── Monaco Editor ────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <Editor
          height="100%"
          language={ARDUINO_LANG_ID}
          theme="mark1Dark"
          value={code || defaultCode}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            readOnly:             !isEditable,
            fontSize:             13,
            fontFamily:           fonts.code,
            lineNumbers:          "on",
            minimap:              { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap:             "on",
            renderLineHighlight:  "line",
            padding:              { top: 12 },
            automaticLayout:      true,
          }}
        />
      </div>

      {/* ── Edit mode warning ─────────────────────────────────── */}
      {isEditable && (
        <div style={{
          padding:    `${spacing.xs} ${spacing.md}`,
          background: colors.accentYellow + "22",
          borderTop:  `1px solid ${colors.accentYellow}44`,
          fontFamily: fonts.ui,
          fontSize:   fontSizes.xs,
          color:      colors.accentYellow,
          flexShrink: 0,
        }}>
          ⚠️ Manual edit mode — block changes will overwrite your edits.
        </div>
      )}
    </div>
  );
}

function btnStyle(bg, active = false) {
  return {
    fontFamily:   fonts.ui,
    fontSize:     fontSizes.xs,
    fontWeight:   600,
    padding:      `${spacing.xs} ${spacing.md}`,
    background:   bg,
    color:        active ? "#000" : colors.textSecondary,
    border:       `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    cursor:       "pointer",
    whiteSpace:   "nowrap",
  };
}
