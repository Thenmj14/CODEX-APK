// =============================================================
//  src/blocks/cube.js
//  IoT LED Cube block VISUAL definitions only.
//  Code generators live in BlockCanvas.jsx (registerArduinoGenerators)
// =============================================================

export function defineBlocks(Blockly, Blocks) {

  const COLOR_CUBE = "#8e44ad"; // purple, matches sidebar icon

  // ── cube_begin ───────────────────────────────────────────────
  Blocks["cube_begin"] = {
    init() {
      this.appendDummyInput().appendField(" Setup LED Cube");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_CUBE);
      this.setTooltip("Initialise the LED Cube (192 pixels, 3 faces). Always place this first.");
    },
  };

   // ── cube_show_digital_clock ─────────────────────────────────
    Blocks["cube_show_digital_clock"] = {
    init() {
        this.appendDummyInput().appendField(" Show Digital Clock");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLOR_CUBE);
        this.setTooltip("Show scrolling clock on TOP, 'HI' scrolling on LEFT/FRONT. Place inside Arduino Loop.");
    },
    };

  // ── cube_show_analog_clock ──────────────────────────────────
Blocks["cube_show_analog_clock"] = {
  init() {
    this.appendDummyInput().appendField(" Show Analog Clock");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(COLOR_CUBE);
    this.setTooltip("Show clock hands on TOP, 'Hello' scrolling on LEFT/FRONT. Place inside Arduino Loop.");
  },
};

  // ── cube_show_name_showcase ──────────────────────────────────
Blocks["cube_show_name_showcase"] = {
  init() {
    this.appendDummyInput().appendField(" Show Name Showcase");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(COLOR_CUBE);
    this.setTooltip("Scrolls 'YAGEN ROBOTICS' on LEFT/FRONT with a breathing glow on TOP. Place inside Arduino Loop.");
  },
};

  // ── cube_show_eyes ────────────────────────────────────────────
Blocks["cube_show_eyes"] = {
  init() {
    this.appendDummyInput().appendField(" Show Blinking Eyes");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(COLOR_CUBE);
    this.setTooltip("Draws blinking cartoon eyes on TOP, soft blue glow on sides. Place inside Arduino Loop.");
  },
};

  // ── cube_show_heartbeat ──────────────────────────────────────
Blocks["cube_show_heartbeat"] = {
  init() {
    this.appendDummyInput().appendField(" Show Heartbeat");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(COLOR_CUBE);
    this.setTooltip("Red double-pulse 'thump-thump' across all 3 faces. Place inside Arduino Loop.");
  },
};

  // ── cube_show_fire ────────────────────────────────────────────
Blocks["cube_show_fire"] = {
  init() {
    this.appendDummyInput().appendField(" Show Fire Effect");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(COLOR_CUBE);
    this.setTooltip("Flickering orange/red flames on all 3 faces, hot at bottom, cool at top. Place inside Arduino Loop.");
  },
};

}