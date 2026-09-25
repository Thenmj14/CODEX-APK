// =============================================================
//  src/blocks/mark2.js
//  Mark2 block VISUAL definitions only.
//  Code generators live in BlockCanvas.jsx (registerArduinoGenerators)
// =============================================================

export function defineBlocks(Blockly, Blocks) {

  const COLOR_CONTROL = "#3b82f6"; // pick any color you like for Mark2

  // ── mark2_begin ──────────────────────────────────────────────
  Blocks["mark2_begin"] = {
    init() {
      this.appendDummyInput().appendField(" Setup Mark2 Robot");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_CONTROL);
      this.setTooltip("Initialise the Mark2 robot. Always place this first.");
    },
  };
const COLOR_MOTION2 = "#e27756"; // same orange as Mark1, or pick your own

  // ── mark2_forward ────────────────────────────────────────────
  Blocks["mark2_forward"] = {
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
      this.setColour(COLOR_MOTION2);
      this.setTooltip("Move the Mark2 robot in a direction at a given speed (0–255).");
    },
  };

  // ── mark2_move_timed ─────────────────────────────────────────
  Blocks["mark2_move_timed"] = {
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
      this.setColour(COLOR_MOTION2);
      this.setTooltip("Move in a direction for a set time (ms) then stop automatically.");
    },
  };

  // ── mark2_stop ───────────────────────────────────────────────
  Blocks["mark2_stop"] = {
    init() {
      this.appendDummyInput().appendField(" Stop Robot");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_MOTION2);
      this.setTooltip("Stop both motors immediately.");
    },
  };

  // ── mark2_set_speed ──────────────────────────────────────────
  Blocks["mark2_set_speed"] = {
    init() {
      this.appendDummyInput().appendField(" Set Motor Speed");
      this.appendValueInput("LEFT").setCheck("Number").appendField("Left");
      this.appendValueInput("RIGHT").setCheck("Number").appendField("Right");
      this.appendDummyInput().appendField("(-255 to 255)");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_MOTION2);
      this.setTooltip("Set each motor speed independently. Negative = reverse.");
    },
  };

  // ── mark2_arm_up ─────────────────────────────────────────────
Blocks["mark2_arm_up"] = {
  init() {
    this.appendDummyInput().appendField("Arm Up");
    this.appendValueInput("DURATION").setCheck("Number").appendField("for");
    this.appendDummyInput().appendField("ms");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(COLOR_MOTION2);
    this.setTooltip("Move Mark2 arm upward for given time.");
  },
};

// ── mark2_arm_down ───────────────────────────────────────────
Blocks["mark2_arm_down"] = {
  init() {
    this.appendDummyInput().appendField("Arm Down");
    this.appendValueInput("DURATION").setCheck("Number").appendField("for");
    this.appendDummyInput().appendField("ms");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(COLOR_MOTION2);
    this.setTooltip("Move Mark2 arm downward for given time.");
  },
};

// ── mark2_gripper_open ───────────────────────────────────────
Blocks["mark2_gripper_open"] = {
  init() {
    this.appendDummyInput().appendField("Gripper Open");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(COLOR_MOTION2);
    this.setTooltip("Open the Mark2 gripper.");
  },
};

// ── mark2_gripper_close ──────────────────────────────────────
Blocks["mark2_gripper_close"] = {
  init() {
    this.appendDummyInput().appendField("Gripper Close");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(COLOR_MOTION2);
    this.setTooltip("Close the Mark2 gripper.");
  },
};

const COLOR_LED2 = "#ce4ada"; // same pink as Mark1, or your own

// ── mark2_led_color ──────────────────────────────────────────
Blocks["mark2_led_color"] = {
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
    this.setColour(COLOR_LED2);
    this.setTooltip("Set both Mark2 NeoPixel LEDs to a preset color.");
  },
};

// ── mark2_led_rgb ────────────────────────────────────────────
Blocks["mark2_led_rgb"] = {
  init() {
    this.appendDummyInput().appendField(" Set LED RGB");
    this.appendValueInput("R").setCheck("Number").appendField("R");
    this.appendValueInput("G").setCheck("Number").appendField("G");
    this.appendValueInput("B").setCheck("Number").appendField("B");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(COLOR_LED2);
    this.setTooltip("Set both LEDs to a custom color (0–255 each).");
  },
};

// ── mark2_led_off ────────────────────────────────────────────
Blocks["mark2_led_off"] = {
  init() {
    this.appendDummyInput().appendField(" Turn LED Off");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(COLOR_LED2);
    this.setTooltip("Turn both LEDs off.");
  },
};

// ── mark2_led_blink ──────────────────────────────────────────
Blocks["mark2_led_blink"] = {
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
    this.setColour(COLOR_LED2);
    this.setTooltip("Blink both LEDs a number of times with a given interval.");
  },
};

// ── mark2_led_brightness ─────────────────────────────────────
Blocks["mark2_led_brightness"] = {
  init() {
    this.appendDummyInput().appendField(" Set LED Brightness");
    this.appendValueInput("BRIGHTNESS").setCheck("Number").appendField("to");
    this.appendDummyInput().appendField("(0–255)");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(COLOR_LED2);
    this.setTooltip("Set brightness for both LEDs (0 = off, 255 = full).");
  },
};

const COLOR_SENSOR2 = "#4f77bd"; // same blue as Mark1, or your own

// ── mark2_read_ir ─────────────────────────────────────────────
Blocks["mark2_read_ir"] = {
  init() {
    this.appendDummyInput()
      .appendField(" Read")
      .appendField(new Blockly.FieldDropdown([
        ["Left Sensor", "left"],
        ["Left-Mid Sensor", "left_mid"],
        ["Mid Sensor", "mid"],
        ["Right-Mid Sensor", "right_mid"],
        ["Right Sensor", "right"],
      ]), "SENSOR");
    this.setOutput(true, null);
    this.setColour(COLOR_SENSOR2);
    this.setTooltip("Read a Mark2 IR sensor. Returns true (line detected) or false.");
  },
};

// ── mark2_read_ultrasonic ────────────────────────────────────
Blocks["mark2_read_ultrasonic"] = {
  init() {
    this.appendDummyInput().appendField(" Read Ultrasonic Distance (cm)");
    this.setOutput(true, null);
    this.setColour(COLOR_SENSOR2);
    this.setTooltip("Returns the distance measured by the Mark2 ultrasonic sensor, in cm.");
  },
};
}