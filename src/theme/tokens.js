// =============================================================
//  src/theme/tokens.js
//  ALL colors, fonts, and spacing live here.
//  Change anything here and it cascades across the entire app.
//  Never hardcode colors or fonts in components.
// =============================================================

export const colors = {
  // ── Primary greens (toolbar, buttons, active states) ───────
  primaryGreen:     "#24c28d",
  primaryGreenDark: "#158a3e",
  primaryGreenLight:"#2abe5e",
  primaryGreenMuted:"#1a9c47",

  // ── Panels ─────────────────────────────────────────────────
  panelDark:        "#FFFFFF",   // main block canvas
  sidebarDark:      "#F5F5F5",   // left category panel
  codePanel:        "#000000",   // right code panel
  surface:          "#FFFFFF",   // cards, dropdowns, modals
  surfaceHover:     "#F0F0F0",   // hover state for surface items
  toolbar:          "#1DB954",   // top bar background

  // ── Borders & dividers ──────────────────────────────────────
  border:           "#E0E0E0",
  borderLight:      "#EEEEEE",

  // ── Text ────────────────────────────────────────────────────
  textPrimary:      "#333333",
  textSecondary:    "#666666",
  textMuted:        "#999999",
  textCode:         "#E6EDF3",   // code panel text

  // ── Action colors ───────────────────────────────────────────
  accentOrange:     "#FF6B35",   // upload button CTA
  accentOrangeHover:"#e85a25",
  accentYellow:     "#FFD166",   // warnings
  success:          "#06D6A0",   // upload success
  error:            "#FF4757",   // upload error / compile fail
  info:             "#54A0FF",   // neutral info
  logpannel:       "#f8f8f8",   // background for log panel

  // ── Block canvas ────────────────────────────────────────────
  canvasBg:         "#FFFFFF",
  canvasGrid:       "#E8E8E8",

  // ── Scrollbar ───────────────────────────────────────────────
  scrollbar:        "#E0E0E0",
  scrollbarThumb:   "#BBBBBB",
};

export const fonts = {
  display:  "'Fredoka One', cursive",          // logo, headings
  ui:       "'Nunito', sans-serif",            // all UI labels, buttons
  code:     "'JetBrains Mono', monospace",     // code panel
};

export const fontSizes = {
  xs:   "11px",
  sm:   "12px",
  md:   "14px",
  lg:   "16px",
  xl:   "18px",
  xxl:  "24px",
  logo: "28px",
};

export const spacing = {
  xs:  "4px",
  sm:  "8px",
  md:  "12px",
  lg:  "16px",
  xl:  "24px",
  xxl: "32px",
};

export const radius = {
  sm:   "4px",
  md:   "8px",
  lg:   "12px",
  full: "9999px",
};

export const shadows = {
  sm:   "0 1px 3px rgba(0,0,0,0.4)",
  md:   "0 4px 12px rgba(0,0,0,0.5)",
  lg:   "0 8px 24px rgba(0,0,0,0.6)",
  glow: "0 0 12px rgba(29,185,84,0.4)",   // green glow for active elements
};

// ── CSS variable injection ────────────────────────────────────
// Call injectCSSVariables() once in main.jsx to expose all
// tokens as CSS custom properties (--color-primary-green, etc.)

export function injectCSSVariables() {
  const root = document.documentElement.style;

  // Colors
  Object.entries(colors).forEach(([key, value]) => {
    const cssKey = "--color-" + key.replace(/([A-Z])/g, "-$1").toLowerCase();
    root.setProperty(cssKey, value);
  });

  // Fonts
  root.setProperty("--font-display", fonts.display);
  root.setProperty("--font-ui",      fonts.ui);
  root.setProperty("--font-code",    fonts.code);
}

export default { colors, fonts, fontSizes, spacing, radius, shadows };
