// =============================================================
//  src/blocks/mark1.js
//  Mark1 block VISUAL definitions only.
//  Code generators live in BlockCanvas.jsx (registerArduinoGenerators)
//  To add a new block: add the Blockly.Blocks entry here,
//  then add the generator in BlockCanvas.jsx
// =============================================================

export function defineBlocks(Blockly, Blocks) {

  const COLOR_MOTION  = "#e27756";
  const COLOR_LED     = "#ce4ada";
  const COLOR_SENSOR  = "#4f77bd";
  const COLOR_CONTROL = "#52c58c";

  // ── mark1_forward ────────────────────────────────────────────
  Blocks["mark1_forward"] = {
    init() {
      this.appendDummyInput()
        .appendField(" Move")
        .appendField(new Blockly.FieldDropdown([
          ["Forward", "forward"],
          ["Backward", "backward"],
          ["Left", "left"],
          ["Right", "right"],
        ]), "DIRECTION");
      this.appendValueInput("SPEED").setCheck("Number").appendField("at speed");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_MOTION);
      this.setTooltip("Move the Mark1 robot in a direction at a given speed (0–255).");
    },
  };

  // ── mark1_move_timed ─────────────────────────────────────────
  Blocks["mark1_move_timed"] = {
    init() {
      this.appendDummyInput()
        .appendField("Move")
        .appendField(new Blockly.FieldDropdown([
          ["Forward", "forward"],
          ["Backward", "backward"],
          ["Left", "left"],
          ["Right", "right"],
        ]), "DIRECTION");
      this.appendValueInput("SPEED").setCheck("Number").appendField("speed");
      this.appendValueInput("DURATION").setCheck("Number").appendField("for");
      this.appendDummyInput().appendField("ms then stop");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_MOTION);
      this.setTooltip("Move in a direction for a set time (ms) then stop automatically.");
    },
  };

  // ── mark1_stop ───────────────────────────────────────────────
  Blocks["mark1_stop"] = {
    init() {
      this.appendDummyInput().appendField(" Stop Robot");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_MOTION);
      this.setTooltip("Stop both motors immediately.");
    },
  };

  // ── mark1_set_speed ──────────────────────────────────────────
  Blocks["mark1_set_speed"] = {
    init() {
      this.appendDummyInput().appendField(" Set Motor Speed");
      this.appendValueInput("LEFT").setCheck("Number").appendField("Left");
      this.appendValueInput("RIGHT").setCheck("Number").appendField("Right");
      this.appendDummyInput().appendField("(-255 to 255)");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_MOTION);
      this.setTooltip("Set each motor speed independently. Negative = reverse.");
    },
  };
// ── mark1_arm1_up ─────────────────────────────────────────────
  Blocks["mark1_arm1_up"] = {
    init() {
      this.appendDummyInput().appendField("Arm 1 Up");
      this.appendValueInput("SPEED").setCheck("Number").appendField("speed");
      this.appendValueInput("DURATION").setCheck("Number").appendField("for");
      this.appendDummyInput().appendField("ms");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_MOTION);
      this.setTooltip("Move Arm Joint 1 upward for given time.");
    },
  };

  // ── mark1_arm1_down ───────────────────────────────────────────
  Blocks["mark1_arm1_down"] = {
    init() {
      this.appendDummyInput().appendField("Arm 1 Down");
      this.appendValueInput("SPEED").setCheck("Number").appendField("speed");
      this.appendValueInput("DURATION").setCheck("Number").appendField("for");
      this.appendDummyInput().appendField("ms");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_MOTION);
      this.setTooltip("Move Arm Joint 1 downward for given time.");
    },
  };

  // ── mark1_arm2_up ─────────────────────────────────────────────
  Blocks["mark1_arm2_up"] = {
    init() {
      this.appendDummyInput().appendField("Gripper Open");
      this.appendValueInput("SPEED").setCheck("Number").appendField("speed");
      this.appendValueInput("DURATION").setCheck("Number").appendField("for");
      this.appendDummyInput().appendField("ms");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_MOTION);
      this.setTooltip("Move Arm Joint 2 upward for given time.");
    },
  };

  // ── mark1_arm2_down ───────────────────────────────────────────
  Blocks["mark1_arm2_down"] = {
    init() {
      this.appendDummyInput().appendField("Gripper Close");
      this.appendValueInput("SPEED").setCheck("Number").appendField("speed");
      this.appendValueInput("DURATION").setCheck("Number").appendField("for");
      this.appendDummyInput().appendField("ms");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_MOTION);
      this.setTooltip("Move Arm Joint 2 downward for given time.");
    },
  };

  // ── mark1_led_color ──────────────────────────────────────────
  Blocks["mark1_led_color"] = {
    init() {
      this.appendDummyInput()
        .appendField(" Set LED to")
        .appendField(new Blockly.FieldDropdown([
          ["Red", "COLOR_RED"],
          ["Green", "COLOR_GREEN"],
          ["Blue", "COLOR_BLUE"],
          ["White", "COLOR_WHITE"],
          ["Yellow", "COLOR_YELLOW"],
          ["Orange", "COLOR_ORANGE"],
          ["Purple", "COLOR_PURPLE"],
          ["Cyan", "COLOR_CYAN"],
          ["Off", "COLOR_OFF"],
        ]), "COLOR");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_LED);
      this.setTooltip("Set the NeoPixel LED to a preset color.");
    },
  };

  // ── mark1_led_rgb ────────────────────────────────────────────
  Blocks["mark1_led_rgb"] = {
    init() {
      this.appendDummyInput().appendField(" Set LED RGB");
      this.appendValueInput("R").setCheck("Number").appendField("R");
      this.appendValueInput("G").setCheck("Number").appendField("G");
      this.appendValueInput("B").setCheck("Number").appendField("B");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_LED);
      this.setTooltip("Set LED to a custom color using Red, Green, Blue values (0–255).");
    },
  };

  // ── mark1_led_off ────────────────────────────────────────────
  Blocks["mark1_led_off"] = {
    init() {
      this.appendDummyInput().appendField(" Turn LED Off");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_LED);
      this.setTooltip("Turn the LED off.");
    },
  };

  // ── mark1_led_blink ──────────────────────────────────────────
  Blocks["mark1_led_blink"] = {
    init() {
      this.appendDummyInput()
        .appendField(" Blink LED")
        .appendField(new Blockly.FieldDropdown([
          ["Red", "COLOR_RED"],
          ["Green", "COLOR_GREEN"],
          ["Blue", "COLOR_BLUE"],
          ["White", "COLOR_WHITE"],
          ["Yellow", "COLOR_YELLOW"],
          ["Orange", "COLOR_ORANGE"],
        ]), "COLOR");
      this.appendValueInput("TIMES").setCheck("Number").appendField("times");
      this.appendValueInput("INTERVAL").setCheck("Number").appendField("every");
      this.appendDummyInput().appendField("ms");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_LED);
      this.setTooltip("Blink the LED a number of times with a given interval.");
    },
  };

  // ── mark1_led_brightness ─────────────────────────────────────
  Blocks["mark1_led_brightness"] = {
    init() {
      this.appendDummyInput().appendField(" Set LED Brightness");
      this.appendValueInput("BRIGHTNESS").setCheck("Number").appendField("to");
      this.appendDummyInput().appendField("(0–255)");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_LED);
      this.setTooltip("Set the LED brightness (0 = off, 255 = full brightness).");
    },
  };

  // ── mark1_read_sensor ────────────────────────────────────────
  Blocks["mark1_read_sensor"] = {
    init() {
      this.appendDummyInput()
        .appendField(" Read")
        .appendField(new Blockly.FieldDropdown([
          ["Left Sensor", "left"],
          ["Right Sensor", "right"],
        ]), "SENSOR");
         this.setOutput(true, null);
      this.setColour(COLOR_SENSOR);
      this.setTooltip("Read an IR sensor. Returns true (line detected) or false.");
    },
  };

  // ── mark1_on_line ────────────────────────────────────────────
  Blocks["mark1_on_line"] = {
    init() {
      this.appendDummyInput().appendField(" On Line (both sensors)");
      this.setOutput(true, null);
      this.setColour(COLOR_SENSOR);
      this.setTooltip("Returns true when both IR sensors detect the line.");
    },
  };

  // ── mark1_begin ──────────────────────────────────────────────
  Blocks["mark1_begin"] = {
    init() {
      this.appendDummyInput().appendField(" Setup Mark1 Robot");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_CONTROL);
      this.setTooltip("Initialise the Mark1 robot. Always place this first.");
    },
  };

  // ── time_delay ───────────────────────────────────────────────
  Blocks["time_delay"] = {
    init() {
      this.appendDummyInput().appendField(" Wait");
      this.appendValueInput("DELAY_TIME_MILI").setCheck("Number");
      this.appendDummyInput().appendField("milliseconds");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#A29BFE");
      this.setTooltip("Pause for given milliseconds.");
    },
  };



  // ── arduino_setup ────────────────────────────────────────────
  Blocks["arduino_setup"] = {
    init() {
      this.appendDummyInput().appendField(" Arduino Setup");
      this.appendStatementInput("DO").setCheck(null);
      this.setNextStatement(true, null);   // only a bottom tab — nothing connects above Setup
      this.setColour("#2C3E50");
      this.setTooltip("Code here runs once when the Arduino starts.");
    },
  };

  // ── arduino_loop ─────────────────────────────────────────────
  Blocks["arduino_loop"] = {
    init() {
      this.appendDummyInput().appendField(" Arduino Loop");
      this.appendStatementInput("DO").setCheck(null);
      this.setPreviousStatement(true, null);   // only a top notch — nothing connects below Loop
      this.setColour("#27AE60");
      this.setTooltip("Code here runs repeatedly forever.");
    },
  };
}