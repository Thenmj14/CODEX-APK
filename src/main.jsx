// =============================================================
//  src/main.jsx — React entry point
// =============================================================

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { injectCSSVariables } from "./theme/tokens.js";

// Inject all design tokens as CSS custom properties
injectCSSVariables();

// Global reset
const globalCSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; width: 100%; overflow: hidden; }
  body {
    background: var(--color-panel-dark);
    color: var(--color-text-primary);
    font-family: var(--font-ui);
    -webkit-font-smoothing: antialiased;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--color-scrollbar-thumb); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--color-border-light); }

  /* Blockly overrides */
  .blocklyToolboxDiv { background: var(--color-sidebar-dark) !important; }
  .blocklyFlyout {
  background: var(--color-surface) !important;
  position: fixed !important; }  
  .blocklyTreeRow:hover { background: rgba(29,185,84,0.15) !important; }
  .blocklyTreeSelected { background: rgba(29,185,84,0.25) !important; }
  .blocklyTreeLabel { font-family: var(--font-ui) !important; font-size: 13px !important; }
`;

const style = document.createElement("style");
style.textContent = globalCSS;
document.head.appendChild(style);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
