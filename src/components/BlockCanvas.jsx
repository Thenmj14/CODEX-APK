// =============================================================
//  src/components/BlockCanvas.jsx
//  Uses npm blockly — no CDN race conditions.
// =============================================================

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import * as Blockly from "blockly/core";
import "blockly/blocks";
import * as En from "blockly/msg/en";
Blockly.setLocale(En);

import { javascriptGenerator } from "blockly/javascript";
import { colors } from "../theme/tokens.js";
import { registerAllBlocks } from "../blocks/index.js";

// ── Arduino code generator ────────────────────────────────────
function buildArduinoGenerator() {
  const gen = { ...javascriptGenerator };

  gen.workspaceToCode = (workspace) => {
    const allBlocks = workspace.getAllBlocks(false);
    const hasSetupBlock = allBlocks.some(b => b.type === "arduino_setup");
    const hasLoopBlock = allBlocks.some(b => b.type === "arduino_loop");
    const usesMark1 = allBlocks.some(b => b.type.startsWith("mark1_"));
    const usesMark2 = allBlocks.some(b => b.type.startsWith("mark2_"));
    const usesMark2Ultrasonic = allBlocks.some(b => b.type === "mark2_read_ultrasonic");
    const usesCube = allBlocks.some(b => b.type.startsWith("cube_"));
    const usesCubeDigitalClock = allBlocks.some(b => b.type === "cube_show_digital_clock");
    const topBlocks = workspace.getTopBlocks(true);
    const usesCubeAnalogClock = allBlocks.some(b => b.type === "cube_show_analog_clock");
    const usesCubeNameShowcase = allBlocks.some(b => b.type === "cube_show_name_showcase");
    const usesCubeEyes = allBlocks.some(b => b.type === "cube_show_eyes");
    const usesCubeHeartbeat = allBlocks.some(b => b.type === "cube_show_heartbeat");
    const usesCubeFire = allBlocks.some(b => b.type === "cube_show_fire");

    const includes = new Set();
    let globalCode = "";

    //Declare every workspace variable as a global int
    const allVars = workspace.getAllVariables();
    allVars.forEach(v => {
      const safeName = "var_" + v.name.replace(/[^a-zA-Z0-9_]/g, "_");
      globalCode += `int ${safeName} = 0;\n`;
    });

    if (usesMark1) {
      includes.add('#include <Adafruit_NeoPixel.h>');
      globalCode += `Adafruit_NeoPixel strip(1, 2, NEO_GRB + NEO_KHZ800);\n`;
    }
    if (usesMark2) {
      includes.add('#include <Adafruit_NeoPixel.h>');
      includes.add('#include <Servo.h>');
      globalCode += `Adafruit_NeoPixel strip2(2, 7, NEO_GRB + NEO_KHZ800);\n`;
      globalCode += `Servo gripper2;\n`;
    }
    if (usesMark2Ultrasonic) {
      globalCode += `\nlong readUltrasonicMark2() {\n  digitalWrite(2, LOW);\n  delayMicroseconds(2);\n  digitalWrite(2, HIGH);\n  delayMicroseconds(10);\n  digitalWrite(2, LOW);\n  long duration = pulseIn(4, HIGH);\n  return duration * 0.034 / 2;\n}\n`;
    }

    if (usesCube) {
      includes.add('#include <Adafruit_NeoPixel.h>');
      globalCode += `Adafruit_NeoPixel cubeStrip(192, 4, NEO_GRB + NEO_KHZ800);

#define FACE_TOP   0
#define FACE_LEFT  64
#define FACE_FRONT 128

const uint8_t cubeFont5x7[][5] PROGMEM = {
  {0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x5F,0x00,0x00},{0x00,0x07,0x00,0x07,0x00},{0x14,0x7F,0x14,0x7F,0x14},
  {0x24,0x2A,0x7F,0x2A,0x12},{0x23,0x13,0x08,0x64,0x62},{0x36,0x49,0x55,0x22,0x50},{0x00,0x05,0x03,0x00,0x00},
  {0x00,0x1C,0x22,0x41,0x00},{0x00,0x41,0x22,0x1C,0x00},{0x14,0x08,0x3E,0x08,0x14},{0x08,0x08,0x3E,0x08,0x08},
  {0x00,0x50,0x30,0x00,0x00},{0x08,0x08,0x08,0x08,0x08},{0x00,0x60,0x60,0x00,0x00},{0x20,0x10,0x08,0x04,0x02},
  {0x3E,0x51,0x49,0x45,0x3E},{0x00,0x42,0x7F,0x40,0x00},{0x42,0x61,0x51,0x49,0x46},{0x21,0x41,0x45,0x4B,0x31},
  {0x18,0x14,0x12,0x7F,0x10},{0x27,0x45,0x45,0x45,0x39},{0x3C,0x4A,0x49,0x49,0x30},{0x01,0x71,0x09,0x05,0x03},
  {0x36,0x49,0x49,0x49,0x36},{0x06,0x49,0x49,0x29,0x1E},{0x00,0x36,0x36,0x00,0x00},{0x00,0x56,0x36,0x00,0x00},
  {0x08,0x14,0x22,0x41,0x00},{0x14,0x14,0x14,0x14,0x14},{0x00,0x41,0x22,0x14,0x08},{0x02,0x01,0x51,0x09,0x06},
  {0x32,0x49,0x79,0x41,0x3E},{0x7E,0x11,0x11,0x11,0x7E},{0x7F,0x49,0x49,0x49,0x36},{0x3E,0x41,0x41,0x41,0x22},
  {0x7F,0x41,0x41,0x22,0x1C},{0x7F,0x49,0x49,0x49,0x41},{0x7F,0x09,0x09,0x09,0x01},{0x3E,0x41,0x49,0x49,0x7A},
  {0x7F,0x08,0x08,0x08,0x7F},{0x00,0x41,0x7F,0x41,0x00},{0x20,0x40,0x41,0x3F,0x01},{0x7F,0x08,0x14,0x22,0x41},
  {0x7F,0x40,0x40,0x40,0x40},{0x7F,0x02,0x0C,0x02,0x7F},{0x7F,0x04,0x08,0x10,0x7F},{0x3E,0x41,0x41,0x41,0x3E},
  {0x7F,0x09,0x09,0x09,0x06},{0x3E,0x41,0x51,0x21,0x5E},{0x7F,0x09,0x19,0x29,0x46},{0x46,0x49,0x49,0x49,0x31},
  {0x01,0x01,0x7F,0x01,0x01},{0x3F,0x40,0x40,0x40,0x3F},{0x1F,0x20,0x40,0x20,0x1F},{0x3F,0x40,0x38,0x40,0x3F},
  {0x63,0x14,0x08,0x14,0x63},{0x07,0x08,0x70,0x08,0x07},{0x61,0x51,0x49,0x45,0x43},{0x00,0x7F,0x41,0x41,0x00},
  {0x02,0x04,0x08,0x10,0x20},{0x00,0x41,0x41,0x7F,0x00},{0x04,0x02,0x01,0x02,0x04},{0x40,0x40,0x40,0x40,0x40},
};

int cubeLocalXY(int x, int y) { return (y * 8 + (7 - x)); }
int cubeLocalXY_TOP(int x, int y) { return ((7 - x) * 8 + (7 - y)); }

void cubeSetPixel(int faceStart, int x, int y, uint32_t color) {
  if (x < 0 || x > 7 || y < 0 || y > 7) return;
  int idx = (faceStart == FACE_TOP) ? cubeLocalXY_TOP(x, y) : cubeLocalXY(x, y);
  cubeStrip.setPixelColor(faceStart + idx, color);
}

void cubeClearFace(int faceStart) { for (int i = 0; i < 64; i++) cubeStrip.setPixelColor(faceStart + i, 0); }
void cubeFillFace(int faceStart, uint32_t color) { for (int i = 0; i < 64; i++) cubeStrip.setPixelColor(faceStart + i, color); }
void cubeClearAllFaces() { cubeClearFace(FACE_TOP); cubeClearFace(FACE_LEFT); cubeClearFace(FACE_FRONT); }

void cubeGetGlyph(char c, uint8_t out[5]) {
  if (c >= 'a' && c <= 'z') c -= 32;
  int index = c - 0x20;
  if (index < 0 || index > (0x5F - 0x20)) index = 0;
  for (int i = 0; i < 5; i++) out[i] = pgm_read_byte(&cubeFont5x7[index][i]);
}

struct CubeScroller { int faceStart; const char* message; uint32_t color; int offset; unsigned long lastStep; int stepDelayMs; };

void cubeInitScroller(CubeScroller &s, int faceStart, const char* msg, uint32_t color, int speed);
void cubeUpdateScroller(CubeScroller &s);
void cubeInitClockScroller(CubeScroller &s, int faceStart, uint32_t color, int speed);
void cubeUpdateClockScroller(CubeScroller &s);

void cubeInitScroller(CubeScroller &s, int faceStart, const char* msg, uint32_t color, int speed) {
  s.faceStart = faceStart; s.message = msg; s.color = color; s.offset = -8; s.lastStep = 0; s.stepDelayMs = speed;
}

void cubeUpdateScroller(CubeScroller &s) {
  if (millis() - s.lastStep < (unsigned long)s.stepDelayMs) return;
  s.lastStep = millis();
  cubeClearFace(s.faceStart);
  int msgLen = strlen(s.message);
  int totalCols = msgLen * 6;
  for (int screenCol = 0; screenCol < 8; screenCol++) {
    int virtualCol = s.offset + screenCol;
    if (virtualCol < 0) continue;
    int charIndex = virtualCol / 6;
    int colInChar = virtualCol % 6;
    if (charIndex >= msgLen || colInChar >= 5) continue;
    uint8_t glyph[5];
    cubeGetGlyph(s.message[charIndex], glyph);
    uint8_t colBits = glyph[colInChar];
    for (int row = 0; row < 7; row++) {
      if (colBits & (1 << row)) { int y = 7 - row; cubeSetPixel(s.faceStart, screenCol, y, s.color); }
    }
  }
  s.offset++;
  if (s.offset > totalCols) s.offset = -8;
}

#define CLOCK_START_HOUR 9
#define CLOCK_START_MIN  41
#define CLOCK_START_SEC  0
char cubeClockText[9];

void cubeComputeClockHMS(int &h, int &m, int &s) {
  unsigned long totalSeconds = (CLOCK_START_HOUR * 3600UL) + (CLOCK_START_MIN * 60UL) + CLOCK_START_SEC + (millis() / 1000UL);
  h = (totalSeconds / 3600UL) % 24; m = (totalSeconds / 60UL) % 60; s = totalSeconds % 60;
}

void cubeUpdateClockText() {
  int h, m, s; cubeComputeClockHMS(h, m, s);
  snprintf(cubeClockText, sizeof(cubeClockText), "%02d:%02d:%02d", h, m, s);
}

void cubeInitClockScroller(CubeScroller &s, int faceStart, uint32_t color, int speed) {
  cubeUpdateClockText();
  cubeInitScroller(s, faceStart, cubeClockText, color, speed);
}

void cubeUpdateClockScroller(CubeScroller &s) {
  static unsigned long lastClockUpdate = 0;
  if (millis() - lastClockUpdate >= 1000) { lastClockUpdate = millis(); cubeUpdateClockText(); }
  cubeUpdateScroller(s);
}

CubeScroller cubeScrollers[3];
`;
    }

    if (usesCubeDigitalClock) {
      globalCode += `
void cubeDigitalClockMode() {
  static bool inited = false;
  if (!inited) {
    cubeClearAllFaces();
    cubeInitClockScroller(cubeScrollers[2], FACE_TOP, cubeStrip.Color(255, 60, 0), 150);
    cubeInitScroller(cubeScrollers[0], FACE_LEFT,  "HI  ", cubeStrip.Color(0, 255, 0), 120);
    cubeInitScroller(cubeScrollers[1], FACE_FRONT, "HI  ", cubeStrip.Color(0, 100, 255), 120);
    inited = true;
  }
  cubeUpdateClockScroller(cubeScrollers[2]);
  cubeUpdateScroller(cubeScrollers[0]);
  cubeUpdateScroller(cubeScrollers[1]);
  cubeStrip.show();
}
`;
    }

    if (usesCubeAnalogClock) {
      globalCode += `
void cubeDrawLine(int faceStart, int x0, int y0, int x1, int y1, uint32_t color) {
  int dx = abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  int dy = -abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  int err = dx + dy;
  while (true) {
    cubeSetPixel(faceStart, x0, y0, color);
    if (x0 == x1 && y0 == y1) break;
    int e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

void cubeDrawHand(int faceStart, float angle, float length, uint32_t color) {
  float cx = 3.5, cy = 3.5;
  int x1 = round(cx + sin(angle) * length);
  int y1 = round(cy + cos(angle) * length);
  cubeDrawLine(faceStart, round(cx), round(cy), x1, y1, color);
}

CubeScroller cubeAnalogScrollers[2];

void cubeAnalogClockMode() {
  static bool inited = false;
  static unsigned long lastUpdate = 0;
  if (!inited) {
    cubeClearAllFaces();
    cubeInitScroller(cubeAnalogScrollers[0], FACE_LEFT,  "Hello  ", cubeStrip.Color(0, 255, 0), 120);
    cubeInitScroller(cubeAnalogScrollers[1], FACE_FRONT, "Hello  ", cubeStrip.Color(0, 100, 255), 120);
    inited = true;
  }
  if (millis() - lastUpdate >= 200) {
    lastUpdate = millis();
    cubeClearFace(FACE_TOP);
    uint32_t centerColor = cubeStrip.Color(255, 255, 255);
    cubeSetPixel(FACE_TOP, 3, 3, centerColor);
    cubeSetPixel(FACE_TOP, 4, 3, centerColor);
    cubeSetPixel(FACE_TOP, 3, 4, centerColor);
    cubeSetPixel(FACE_TOP, 4, 4, centerColor);

    int h, m, s;
    cubeComputeClockHMS(h, m, s);
    float hourAngle = ((h % 12) + m / 60.0) / 12.0 * 2 * PI;
    float secAngle  = (s / 60.0) * 2 * PI;
    cubeDrawHand(FACE_TOP, hourAngle, 2, cubeStrip.Color(255, 60, 0));
    cubeDrawHand(FACE_TOP, secAngle, 3, cubeStrip.Color(0, 200, 255));
  }
  cubeUpdateScroller(cubeAnalogScrollers[0]);
  cubeUpdateScroller(cubeAnalogScrollers[1]);
  cubeStrip.show();
}
`;
    }

    if (usesCubeNameShowcase) {
      globalCode += `
void cubeUpdateBreathingGlow(int faceStart, uint8_t r, uint8_t g, uint8_t b, float periodSec) {
  static unsigned long startT = 0;
  if (startT == 0) startT = millis();
  float t = (millis() - startT) / 1000.0;
  float intensity = (sin(t * 2 * PI / periodSec) + 1.0) / 2.0;
  cubeFillFace(faceStart, cubeStrip.Color(r * intensity, g * intensity, b * intensity));
}

CubeScroller cubeNameScrollers[2];

void cubeNameShowcaseMode() {
  static bool inited = false;
  if (!inited) {
    cubeClearAllFaces();
    cubeInitScroller(cubeNameScrollers[0], FACE_LEFT,  "YAGEN ROBOTICS  ", cubeStrip.Color(0, 255, 0), 100);
    cubeInitScroller(cubeNameScrollers[1], FACE_FRONT, "YAGEN ROBOTICS  ", cubeStrip.Color(0, 100, 255), 100);
    inited = true;
  }
  cubeUpdateScroller(cubeNameScrollers[0]);
  cubeUpdateScroller(cubeNameScrollers[1]);
  cubeUpdateBreathingGlow(FACE_TOP, 255, 60, 0, 4.0);
  cubeStrip.show();
}
`;
    }

    if (usesCubeEyes && !usesCubeNameShowcase) {
      globalCode += `
void cubeUpdateBreathingGlow(int faceStart, uint8_t r, uint8_t g, uint8_t b, float periodSec) {
  static unsigned long startT = 0;
  if (startT == 0) startT = millis();
  float t = (millis() - startT) / 1000.0;
  float intensity = (sin(t * 2 * PI / periodSec) + 1.0) / 2.0;
  cubeFillFace(faceStart, cubeStrip.Color(r * intensity, g * intensity, b * intensity));
}
`;
    }

    if (usesCubeEyes) {
      globalCode += `
#define CUBE_EYE_COLOR cubeStrip.Color(0, 200, 255)

struct CubeBlinkFrame { int height; unsigned long holdMs; };
CubeBlinkFrame cubeBlinkSeq[] = {
  {4, 0},
  {2, 80},
  {1, 100},
  {2, 80},
};
int cubeBlinkIndex = 0;
unsigned long cubeBlinkFrameStart = 0;
unsigned long cubeNextBlinkAt = 0;

void cubeDrawEyeShape(int faceStart, int xStart, int heightRows, uint32_t color) {
  int startY, endY;
  if (heightRows == 4)      { startY = 2; endY = 5; }
  else if (heightRows == 2) { startY = 3; endY = 4; }
  else                      { startY = 3; endY = 3; }

  for (int y = startY; y <= endY; y++)
    for (int x = xStart; x < xStart + 3; x++)
      cubeSetPixel(faceStart, x, y, color);

  if (heightRows == 4)
    cubeSetPixel(faceStart, xStart + 1, 3, cubeStrip.Color(0, 0, 0));
}

void cubeUpdateEyes() {
  unsigned long now = millis();
  cubeClearFace(FACE_TOP);

  int h = cubeBlinkSeq[cubeBlinkIndex].height;
  cubeDrawEyeShape(FACE_TOP, 0, h, CUBE_EYE_COLOR);
  cubeDrawEyeShape(FACE_TOP, 5, h, CUBE_EYE_COLOR);

  if (cubeBlinkIndex == 0) {
    if (cubeNextBlinkAt == 0) cubeNextBlinkAt = now + random(2000, 5000);
    if (now >= cubeNextBlinkAt) { cubeBlinkIndex = 1; cubeBlinkFrameStart = now; }
  } else {
    if (now - cubeBlinkFrameStart >= cubeBlinkSeq[cubeBlinkIndex].holdMs) {
      cubeBlinkIndex++;
      cubeBlinkFrameStart = now;
      if (cubeBlinkIndex >= 4) { cubeBlinkIndex = 0; cubeNextBlinkAt = 0; }
    }
  }
}

void cubeEyesMode() {
  static bool inited = false;
  if (!inited) {
    cubeClearAllFaces();
    cubeBlinkIndex = 0;
    cubeNextBlinkAt = 0;
    inited = true;
  }
  cubeUpdateEyes();
  cubeUpdateBreathingGlow(FACE_LEFT,  0, 100, 255, 5.0);
  cubeUpdateBreathingGlow(FACE_FRONT, 0, 100, 255, 5.0);
  cubeStrip.show();
}
`;
    }

    if (usesCubeHeartbeat) {
      globalCode += `
void cubeUpdateHeartbeat() {
  static unsigned long startT = 0;
  if (startT == 0) startT = millis();
  float t = (millis() - startT) / 1000.0;
  float cyclePos = fmod(t, 1.2);

  float intensity;
  if (cyclePos < 0.15)      intensity = cyclePos / 0.15;
  else if (cyclePos < 0.30) intensity = 1.0 - (cyclePos - 0.15) / 0.15;
  else if (cyclePos < 0.45) intensity = (cyclePos - 0.30) / 0.15 * 0.7;
  else if (cyclePos < 0.60) intensity = 0.7 - (cyclePos - 0.45) / 0.15 * 0.7;
  else                      intensity = 0;

  intensity = constrain(intensity, 0.0f, 1.0f);
  uint32_t color = cubeStrip.Color((uint8_t)(255 * intensity), 0, 0);

  cubeFillFace(FACE_TOP, color);
  cubeFillFace(FACE_LEFT, color);
  cubeFillFace(FACE_FRONT, color);
}

void cubeHeartbeatMode() {
  static bool inited = false;
  if (!inited) {
    cubeClearAllFaces();
    inited = true;
  }
  cubeUpdateHeartbeat();
  cubeStrip.show();
}
`;
    }

    if (usesCubeFire) {
      globalCode += `
void cubeUpdateFireFace(int faceStart) {
  for (int x = 0; x < 8; x++) {
    for (int y = 0; y < 8; y++) {
      int heat = random(0, 256) - (y * 24);
      heat = constrain(heat, 0, 255);
      uint8_t r = heat;
      uint8_t g = heat / 4;
      cubeSetPixel(faceStart, x, y, cubeStrip.Color(r, g, 0));
    }
  }
}

void cubeFireMode() {
  static bool inited = false;
  static unsigned long lastUpdate = 0;
  if (!inited) {
    cubeClearAllFaces();
    inited = true;
  }
  if (millis() - lastUpdate >= 60) {
    lastUpdate = millis();
    cubeUpdateFireFace(FACE_TOP);
    cubeUpdateFireFace(FACE_LEFT);
    cubeUpdateFireFace(FACE_FRONT);
  }
  cubeStrip.show();
}
`;
    }

    let includeCode = [...includes].join("\n") + (includes.size ? "\n" : "");
    let setupCode = "";
    let loopCode = "";

    for (const topBlock of topBlocks) {
      // Walk this top block AND every block chained below it (e.g. Setup → Loop stacked together)
      let block = topBlock;
      while (block) {
        if (block.type === "arduino_setup") {
          setupCode += genChain(block.getInputTargetBlock("DO"), gen);
        } else if (block.type === "arduino_loop") {
          loopCode += genChain(block.getInputTargetBlock("DO"), gen);
        } else {
          loopCode += genChain(block, gen);
        }
        block = block.getNextBlock();
      }
    }

    if (!hasSetupBlock && !hasLoopBlock) {
      // Neither Structure block on the canvas yet —
      // show nothing so CodePanel falls back to its placeholder text.
      return "";
    }

    const sections = [includeCode, globalCode, ""];

    if (hasSetupBlock) {
      sections.push(
        "void setup() {",
        setupCode ? indentCode(setupCode) : "  // setup code here",
        "}"
      );
    }

    if (hasSetupBlock && hasLoopBlock) {
      sections.push(""); // blank line between the two sections
    }

    if (hasLoopBlock) {
      sections.push(
        "void loop() {",
        loopCode ? indentCode(loopCode) : "  // loop code here",
        "}"
      );
    }

    return sections.join("\n");
  };
  return gen;
}

function indentCode(code) {
  return code.split("\n").map(l => l ? "  " + l : l).join("\n");
}

function genChain(block, gen) {
  let code = "", current = block;
  while (current) {
    const fn = gen[current.type];
    if (fn) {
      const r = fn.call(gen, current);
      code += Array.isArray(r) ? r[0] : (r || "");
    }
    current = current.getNextBlock();
  }
  return code;
}

function getInput(block, name, gen) {
  const child = block.getInputTargetBlock(name);
  if (!child) return null;
  const fn = gen[child.type];
  if (!fn) return null;
  const r = fn.call(gen, child);
  return Array.isArray(r) ? r[0] : r;
}

function registerArduinoGenerators(gen) {

  // ── Pin constants (matches Mark1.h) ──────────────────────────
  const L1 = 5, L2 = 3;   // Left motor
  const R1 = 9, R2 = 6;   // Right motor
  const ARM1_1 = 15, ARM1_2 = 16;  // Arm joint 1
  const ARM2_1 = 18, ARM2_2 = 17;  // Arm joint 2
  const LED_PIN = 2, NUM_LEDS = 1; // NeoPixel
  const SENSOR_LEFT = 14, SENSOR_RIGHT = 8; // IR sensors

  // ── Setup ─────────────────────────────────────────────────────
  gen["mark1_begin"] = () => [
    `pinMode(${L1}, OUTPUT);`,
    `pinMode(${L2}, OUTPUT);`,
    `pinMode(${R1}, OUTPUT);`,
    `pinMode(${R2}, OUTPUT);`,
    `pinMode(${ARM1_1}, OUTPUT);`,
    `pinMode(${ARM1_2}, OUTPUT);`,
    `pinMode(${ARM2_1}, OUTPUT);`,
    `pinMode(${ARM2_2}, OUTPUT);`,
    `pinMode(${SENSOR_LEFT}, INPUT);`,
    `pinMode(${SENSOR_RIGHT}, INPUT);`,
    `strip.begin();`,
    `strip.setBrightness(80);`,
    `strip.show();`,
    `analogWrite(${L1}, 0);`,
    `analogWrite(${L2}, 0);`,
    `analogWrite(${R1}, 0);`,
    `analogWrite(${R2}, 0);`,
  ].join("\n") + "\n";

  // ── Mark2 pin constants ───────────────────────────────────────
  const M2_L1 = 9, M2_L2 = 5;      // Left motor
  const M2_R1 = 6, M2_R2 = 3;      // Right motor
  const M2_ARM_UP = "A4", M2_ARM_DOWN = "A5"; // Arm joint (on/off, no speed)
  const M2_GRIPPER_PIN = "A2";     // Gripper servo signal
  const M2_GRIPPER_OPEN = 165, M2_GRIPPER_CLOSE = 85;
  const M2_LED_PIN = 7, M2_NUM_LEDS = 2;
  const M2_SENSOR_LEFT = "A1", M2_SENSOR_LEFT_MID = "A3", M2_SENSOR_MID = "A0",
    M2_SENSOR_RIGHT_MID = 8, M2_SENSOR_RIGHT = 10;
  const M2_TRIG = 2, M2_ECHO = 4;

  gen["mark2_begin"] = () => [
    `pinMode(${M2_L1}, OUTPUT);`,
    `pinMode(${M2_L2}, OUTPUT);`,
    `pinMode(${M2_R1}, OUTPUT);`,
    `pinMode(${M2_R2}, OUTPUT);`,
    `pinMode(${M2_ARM_UP}, OUTPUT);`,
    `pinMode(${M2_ARM_DOWN}, OUTPUT);`,
    `pinMode(${M2_SENSOR_LEFT}, INPUT);`,
    `pinMode(${M2_SENSOR_LEFT_MID}, INPUT);`,
    `pinMode(${M2_SENSOR_MID}, INPUT);`,
    `pinMode(${M2_SENSOR_RIGHT_MID}, INPUT);`,
    `pinMode(${M2_SENSOR_RIGHT}, INPUT);`,
    `pinMode(${M2_TRIG}, OUTPUT);`,
    `pinMode(${M2_ECHO}, INPUT);`,
    `gripper2.attach(${M2_GRIPPER_PIN});`,
    `gripper2.write(${M2_GRIPPER_OPEN});`,
    `strip2.begin();`,
    `strip2.setBrightness(80);`,
    `strip2.show();`,
    `analogWrite(${M2_L1}, 0);`,
    `analogWrite(${M2_L2}, 0);`,
    `analogWrite(${M2_R1}, 0);`,
    `analogWrite(${M2_R2}, 0);`,
  ].join("\n") + "\n";
  // ── Mark2 Stop ────────────────────────────────────────────────
  gen["mark2_stop"] = () => [
    `analogWrite(${M2_L1}, 0);`,
    `analogWrite(${M2_L2}, 0);`,
    `analogWrite(${M2_R1}, 0);`,
    `analogWrite(${M2_R2}, 0);`,
  ].join("\n") + "\n";

  // ── Mark2 Move ────────────────────────────────────────────────
  gen["mark2_forward"] = (b) => {
    const dir = b.getFieldValue("DIRECTION");
    const spd = getInput(b, "SPEED", gen) || "150";

    if (dir === "forward") return [
      `analogWrite(${M2_L1}, ${spd});`,
      `analogWrite(${M2_L2}, 0);`,
      `analogWrite(${M2_R1}, ${spd});`,
      `analogWrite(${M2_R2}, 0);`,
    ].join("\n") + "\n";

    if (dir === "backward") return [
      `analogWrite(${M2_L1}, 0);`,
      `analogWrite(${M2_L2}, ${spd});`,
      `analogWrite(${M2_R1}, 0);`,
      `analogWrite(${M2_R2}, ${spd});`,
    ].join("\n") + "\n";

    if (dir === "left") return [
      `analogWrite(${M2_L1}, 0);`,
      `analogWrite(${M2_L2}, ${spd});`,
      `analogWrite(${M2_R1}, ${spd});`,
      `analogWrite(${M2_R2}, 0);`,
    ].join("\n") + "\n";

    if (dir === "right") return [
      `analogWrite(${M2_L1}, ${spd});`,
      `analogWrite(${M2_L2}, 0);`,
      `analogWrite(${M2_R1}, 0);`,
      `analogWrite(${M2_R2}, ${spd});`,
    ].join("\n") + "\n";

    return [
      `analogWrite(${M2_L1}, 0);`,
      `analogWrite(${M2_L2}, 0);`,
      `analogWrite(${M2_R1}, 0);`,
      `analogWrite(${M2_R2}, 0);`,
    ].join("\n") + "\n";
  };

  // ── Mark2 Move Timed ──────────────────────────────────────────
  gen["mark2_move_timed"] = (b) => {
    const dir = b.getFieldValue("DIRECTION");
    const spd = getInput(b, "SPEED", gen) || "150";
    const dur = getInput(b, "DURATION", gen) || "1000";

    let moveCode = "";
    if (dir === "forward") moveCode = [
      `analogWrite(${M2_L1}, ${spd});`,
      `analogWrite(${M2_L2}, 0);`,
      `analogWrite(${M2_R1}, ${spd});`,
      `analogWrite(${M2_R2}, 0);`,
    ].join("\n");
    else if (dir === "backward") moveCode = [
      `analogWrite(${M2_L1}, 0);`,
      `analogWrite(${M2_L2}, ${spd});`,
      `analogWrite(${M2_R1}, 0);`,
      `analogWrite(${M2_R2}, ${spd});`,
    ].join("\n");
    else if (dir === "left") moveCode = [
      `analogWrite(${M2_L1}, 0);`,
      `analogWrite(${M2_L2}, ${spd});`,
      `analogWrite(${M2_R1}, ${spd});`,
      `analogWrite(${M2_R2}, 0);`,
    ].join("\n");
    else if (dir === "right") moveCode = [
      `analogWrite(${M2_L1}, ${spd});`,
      `analogWrite(${M2_L2}, 0);`,
      `analogWrite(${M2_R1}, 0);`,
      `analogWrite(${M2_R2}, ${spd});`,
    ].join("\n");

    return [
      moveCode,
      `delay(${dur});`,
      `analogWrite(${M2_L1}, 0);`,
      `analogWrite(${M2_L2}, 0);`,
      `analogWrite(${M2_R1}, 0);`,
      `analogWrite(${M2_R2}, 0);`,
    ].join("\n") + "\n";
  };

  // ── Mark2 Set Speed (raw signed) ───────────────────────────────
  gen["mark2_set_speed"] = (b) => {
    const l = getInput(b, "LEFT", gen) || "0";
    const r = getInput(b, "RIGHT", gen) || "0";
    return [
      `analogWrite(${M2_L1}, ${l} > 0 ? ${l} : 0);`,
      `analogWrite(${M2_L2}, ${l} < 0 ? -${l} : 0);`,
      `analogWrite(${M2_R1}, ${r} > 0 ? ${r} : 0);`,
      `analogWrite(${M2_R2}, ${r} < 0 ? -${r} : 0);`,
    ].join("\n") + "\n";
  };

  // ── Mark2 Arm Up ────────────────────────────────────────────────
  gen["mark2_arm_up"] = (b) => {
    const dur = getInput(b, "DURATION", gen) || "1000";
    return [
      `digitalWrite(${M2_ARM_UP}, HIGH);`,
      `digitalWrite(${M2_ARM_DOWN}, LOW);`,
      `delay(${dur});`,
      `digitalWrite(${M2_ARM_UP}, LOW);`,
      `digitalWrite(${M2_ARM_DOWN}, LOW);`,
    ].join("\n") + "\n";
  };

  // ── Mark2 Arm Down ──────────────────────────────────────────────
  gen["mark2_arm_down"] = (b) => {
    const dur = getInput(b, "DURATION", gen) || "1000";
    return [
      `digitalWrite(${M2_ARM_UP}, LOW);`,
      `digitalWrite(${M2_ARM_DOWN}, HIGH);`,
      `delay(${dur});`,
      `digitalWrite(${M2_ARM_UP}, LOW);`,
      `digitalWrite(${M2_ARM_DOWN}, LOW);`,
    ].join("\n") + "\n";
  };

  // ── Mark2 Gripper Open ────────────────────────────────────────
  gen["mark2_gripper_open"] = () => [
    `gripper2.write(${M2_GRIPPER_OPEN});`,
  ].join("\n") + "\n";

  // ── Mark2 Gripper Close ───────────────────────────────────────
  gen["mark2_gripper_close"] = () => [
    `gripper2.write(${M2_GRIPPER_CLOSE});`,
  ].join("\n") + "\n";

  // ── Mark2 LED Color (preset) ───────────────────────────────────
  gen["mark2_led_color"] = (b) => {
    const colorMap = {
      COLOR_RED: "255, 0, 0",
      COLOR_GREEN: "0, 255, 0",
      COLOR_BLUE: "0, 0, 255",
      COLOR_WHITE: "255, 255, 255",
      COLOR_YELLOW: "255, 200, 0",
      COLOR_ORANGE: "255, 80, 0",
      COLOR_PURPLE: "150, 0, 255",
      COLOR_CYAN: "0, 220, 255",
      COLOR_OFF: "0, 0, 0",
    };
    const color = b.getFieldValue("COLOR");
    const rgb = colorMap[color] || "0, 0, 0";
    return [
      `strip2.setPixelColor(0, strip2.Color(${rgb}));`,
      `strip2.setPixelColor(1, strip2.Color(${rgb}));`,
      `strip2.show();`,
    ].join("\n") + "\n";
  };

  // ── Mark2 LED RGB (custom) ──────────────────────────────────────
  gen["mark2_led_rgb"] = (b) => {
    const r = getInput(b, "R", gen) || "0";
    const g = getInput(b, "G", gen) || "0";
    const bv = getInput(b, "B", gen) || "0";
    return [
      `strip2.setPixelColor(0, strip2.Color(${r}, ${g}, ${bv}));`,
      `strip2.setPixelColor(1, strip2.Color(${r}, ${g}, ${bv}));`,
      `strip2.show();`,
    ].join("\n") + "\n";
  };

  // ── Mark2 LED Off ────────────────────────────────────────────────
  gen["mark2_led_off"] = () => [
    `strip2.setPixelColor(0, strip2.Color(0, 0, 0));`,
    `strip2.setPixelColor(1, strip2.Color(0, 0, 0));`,
    `strip2.show();`,
  ].join("\n") + "\n";

  // ── Mark2 LED Blink ───────────────────────────────────────────────
  gen["mark2_led_blink"] = (b) => {
    const colorMap = {
      COLOR_RED: "255, 0, 0",
      COLOR_GREEN: "0, 255, 0",
      COLOR_BLUE: "0, 0, 255",
      COLOR_WHITE: "255, 255, 255",
      COLOR_YELLOW: "255, 200, 0",
      COLOR_ORANGE: "255, 80, 0",
    };
    const color = b.getFieldValue("COLOR");
    const rgb = colorMap[color] || "0, 0, 0";
    const times = getInput(b, "TIMES", gen) || "3";
    const intv = getInput(b, "INTERVAL", gen) || "300";
    return [
      `for (int _i = 0; _i < ${times}; _i++) {`,
      `  strip2.setPixelColor(0, strip2.Color(${rgb}));`,
      `  strip2.setPixelColor(1, strip2.Color(${rgb}));`,
      `  strip2.show();`,
      `  delay(${intv});`,
      `  strip2.setPixelColor(0, strip2.Color(0, 0, 0));`,
      `  strip2.setPixelColor(1, strip2.Color(0, 0, 0));`,
      `  strip2.show();`,
      `  delay(${intv});`,
      `}`,
    ].join("\n") + "\n";
  };

  // ── Mark2 LED Brightness ─────────────────────────────────────────
  gen["mark2_led_brightness"] = (b) => {
    const br = getInput(b, "BRIGHTNESS", gen) || "80";
    return [
      `strip2.setBrightness(${br});`,
      `strip2.show();`,
    ].join("\n") + "\n";
  };

  // ── Mark2 Read IR Sensor ────────────────────────────────────────
  gen["mark2_read_ir"] = (b) => {
    const pinMap = {
      left: M2_SENSOR_LEFT,
      left_mid: M2_SENSOR_LEFT_MID,
      mid: M2_SENSOR_MID,
      right_mid: M2_SENSOR_RIGHT_MID,
      right: M2_SENSOR_RIGHT,
    };
    const pin = pinMap[b.getFieldValue("SENSOR")] ?? M2_SENSOR_MID;
    return [`digitalRead(${pin})`, 0];
  };

  // ── Mark2 Read Ultrasonic ────────────────────────────────────────
  gen["mark2_read_ultrasonic"] = () => [`readUltrasonicMark2()`, 0];

  // ── Cube pin constants ──────────────────────────────────────────
  const CUBE_LED_PIN = 4, CUBE_LED_COUNT = 192;
  const CUBE_BRIGHTNESS = 30;

  gen["cube_begin"] = () => [
    `cubeStrip.begin();`,
    `cubeStrip.setBrightness(${CUBE_BRIGHTNESS});`,
    `cubeStrip.clear();`,
    `cubeStrip.show();`,
    `randomSeed(analogRead(0));`,
  ].join("\n") + "\n";

  gen["cube_show_digital_clock"] = () => `cubeDigitalClockMode();\n`;

  gen["cube_show_analog_clock"] = () => `cubeAnalogClockMode();\n`;

  gen["cube_show_name_showcase"] = () => `cubeNameShowcaseMode();\n`;

  gen["cube_show_eyes"] = () => `cubeEyesMode();\n`;

  gen["cube_show_heartbeat"] = () => `cubeHeartbeatMode();\n`;

  gen["cube_show_fire"] = () => `cubeFireMode();\n`;

  // ── Stop ──────────────────────────────────────────────────────
  gen["mark1_stop"] = () => [
    `analogWrite(${L1}, 0);`,
    `analogWrite(${L2}, 0);`,
    `analogWrite(${R1}, 0);`,
    `analogWrite(${R2}, 0);`,
  ].join("\n") + "\n";

  // ── Move (forward / backward / left / right) ──────────────────
  gen["mark1_forward"] = (b) => {
    const dir = b.getFieldValue("DIRECTION");
    const spd = getInput(b, "SPEED", gen) || "150";

    if (dir === "forward") return [
      `analogWrite(${L1}, ${spd});`,
      `analogWrite(${L2}, 0);`,
      `analogWrite(${R1}, ${spd});`,
      `analogWrite(${R2}, 0);`,
    ].join("\n") + "\n";

    if (dir === "backward") return [
      `analogWrite(${L1}, 0);`,
      `analogWrite(${L2}, ${spd});`,
      `analogWrite(${R1}, 0);`,
      `analogWrite(${R2}, ${spd});`,
    ].join("\n") + "\n";

    if (dir === "left") return [
      `analogWrite(${L1}, 0);`,
      `analogWrite(${L2}, ${spd});`,
      `analogWrite(${R1}, ${spd});`,
      `analogWrite(${R2}, 0);`,
    ].join("\n") + "\n";

    if (dir === "right") return [
      `analogWrite(${L1}, ${spd});`,
      `analogWrite(${L2}, 0);`,
      `analogWrite(${R1}, 0);`,
      `analogWrite(${R2}, ${spd});`,
    ].join("\n") + "\n";

    // stop fallback
    return [
      `analogWrite(${L1}, 0);`,
      `analogWrite(${L2}, 0);`,
      `analogWrite(${R1}, 0);`,
      `analogWrite(${R2}, 0);`,
    ].join("\n") + "\n";
  };

  // ── Move Timed ────────────────────────────────────────────────
  gen["mark1_move_timed"] = (b) => {
    const dir = b.getFieldValue("DIRECTION");
    const spd = getInput(b, "SPEED", gen) || "150";
    const dur = getInput(b, "DURATION", gen) || "1000";

    let moveCode = "";
    if (dir === "forward") moveCode = [
      `analogWrite(${L1}, ${spd});`,
      `analogWrite(${L2}, 0);`,
      `analogWrite(${R1}, ${spd});`,
      `analogWrite(${R2}, 0);`,
    ].join("\n");
    else if (dir === "backward") moveCode = [
      `analogWrite(${L1}, 0);`,
      `analogWrite(${L2}, ${spd});`,
      `analogWrite(${R1}, 0);`,
      `analogWrite(${R2}, ${spd});`,
    ].join("\n");
    else if (dir === "left") moveCode = [
      `analogWrite(${L1}, 0);`,
      `analogWrite(${L2}, ${spd});`,
      `analogWrite(${R1}, ${spd});`,
      `analogWrite(${R2}, 0);`,
    ].join("\n");
    else if (dir === "right") moveCode = [
      `analogWrite(${L1}, ${spd});`,
      `analogWrite(${L2}, 0);`,
      `analogWrite(${R1}, 0);`,
      `analogWrite(${R2}, ${spd});`,
    ].join("\n");

    return [
      moveCode,
      `delay(${dur});`,
      `analogWrite(${L1}, 0);`,
      `analogWrite(${L2}, 0);`,
      `analogWrite(${R1}, 0);`,
      `analogWrite(${R2}, 0);`,
    ].join("\n") + "\n";
  };

  // ── Set Speed (raw signed) ────────────────────────────────────
  gen["mark1_set_speed"] = (b) => {
    const l = getInput(b, "LEFT", gen) || "0";
    const r = getInput(b, "RIGHT", gen) || "0";
    return [
      `analogWrite(${L1}, ${l} > 0 ? ${l} : 0);`,
      `analogWrite(${L2}, ${l} < 0 ? -${l} : 0);`,
      `analogWrite(${R1}, ${r} > 0 ? ${r} : 0);`,
      `analogWrite(${R2}, ${r} < 0 ? -${r} : 0);`,
    ].join("\n") + "\n";
  };

  // ── Arm 1 Up ──────────────────────────────────────────────────
  gen["mark1_arm1_up"] = (b) => {
    const spd = getInput(b, "SPEED", gen) || "150";
    const dur = getInput(b, "DURATION", gen) || "1000";
    return [
      `analogWrite(${ARM1_1}, ${spd});`,
      `analogWrite(${ARM1_2}, 0);`,
      `delay(${dur});`,
      `analogWrite(${ARM1_1}, 0);`,
      `analogWrite(${ARM1_2}, 0);`,
    ].join("\n") + "\n";
  };

  // ── Arm 1 Down ────────────────────────────────────────────────
  gen["mark1_arm1_down"] = (b) => {
    const spd = getInput(b, "SPEED", gen) || "150";
    const dur = getInput(b, "DURATION", gen) || "1000";
    return [
      `analogWrite(${ARM1_1}, 0);`,
      `analogWrite(${ARM1_2}, ${spd});`,
      `delay(${dur});`,
      `analogWrite(${ARM1_1}, 0);`,
      `analogWrite(${ARM1_2}, 0);`,
    ].join("\n") + "\n";
  };

  // ── Arm 2 Up (gripper open) ───────────────────────────────────
  gen["mark1_arm2_up"] = (b) => {
    const spd = getInput(b, "SPEED", gen) || "150";
    const dur = getInput(b, "DURATION", gen) || "500";
    return [
      `analogWrite(${ARM2_1}, ${spd});`,
      `analogWrite(${ARM2_2}, 0);`,
      `delay(${dur});`,
      `analogWrite(${ARM2_1}, 0);`,
      `analogWrite(${ARM2_2}, 0);`,
    ].join("\n") + "\n";
  };

  // ── Arm 2 Down (gripper close) ────────────────────────────────
  gen["mark1_arm2_down"] = (b) => {
    const spd = getInput(b, "SPEED", gen) || "150";
    const dur = getInput(b, "DURATION", gen) || "500";
    return [
      `analogWrite(${ARM2_1}, 0);`,
      `analogWrite(${ARM2_2}, ${spd});`,
      `delay(${dur});`,
      `analogWrite(${ARM2_1}, 0);`,
      `analogWrite(${ARM2_2}, 0);`,
    ].join("\n") + "\n";
  };

  // ── LED Color (preset) ────────────────────────────────────────
  gen["mark1_led_color"] = (b) => {
    const colorMap = {
      COLOR_RED: "255, 0, 0",
      COLOR_GREEN: "0, 255, 0",
      COLOR_BLUE: "0, 0, 255",
      COLOR_WHITE: "255, 255, 255",
      COLOR_YELLOW: "255, 200, 0",
      COLOR_ORANGE: "255, 80, 0",
      COLOR_PURPLE: "150, 0, 255",
      COLOR_CYAN: "0, 220, 255",
      COLOR_OFF: "0, 0, 0",
    };
    const color = b.getFieldValue("COLOR");
    const rgb = colorMap[color] || "0, 0, 0";
    return [
      `strip.setPixelColor(0, strip.Color(${rgb}));`,
      `strip.show();`,
    ].join("\n") + "\n";
  };

  // ── LED RGB (custom) ──────────────────────────────────────────
  gen["mark1_led_rgb"] = (b) => {
    const r = getInput(b, "R", gen) || "0";
    const g = getInput(b, "G", gen) || "0";
    const bv = getInput(b, "B", gen) || "0";
    return [
      `strip.setPixelColor(0, strip.Color(${r}, ${g}, ${bv}));`,
      `strip.show();`,
    ].join("\n") + "\n";
  };

  // ── LED Off ───────────────────────────────────────────────────
  gen["mark1_led_off"] = () => [
    `strip.setPixelColor(0, strip.Color(0, 0, 0));`,
    `strip.show();`,
  ].join("\n") + "\n";

  // ── LED Blink ─────────────────────────────────────────────────
  gen["mark1_led_blink"] = (b) => {
    const colorMap = {
      COLOR_RED: "255, 0, 0",
      COLOR_GREEN: "0, 255, 0",
      COLOR_BLUE: "0, 0, 255",
      COLOR_WHITE: "255, 255, 255",
      COLOR_YELLOW: "255, 200, 0",
      COLOR_ORANGE: "255, 80, 0",
    };
    const color = b.getFieldValue("COLOR");
    const rgb = colorMap[color] || "0, 0, 0";
    const times = getInput(b, "TIMES", gen) || "3";
    const intv = getInput(b, "INTERVAL", gen) || "300";
    return [
      `for (int _i = 0; _i < ${times}; _i++) {`,
      `  strip.setPixelColor(0, strip.Color(${rgb}));`,
      `  strip.show();`,
      `  delay(${intv});`,
      `  strip.setPixelColor(0, strip.Color(0, 0, 0));`,
      `  strip.show();`,
      `  delay(${intv});`,
      `}`,
    ].join("\n") + "\n";
  };

  // ── LED Brightness ────────────────────────────────────────────
  gen["mark1_led_brightness"] = (b) => {
    const br = getInput(b, "BRIGHTNESS", gen) || "80";
    return [
      `strip.setBrightness(${br});`,
      `strip.show();`,
    ].join("\n") + "\n";
  };

  // ── Sensors ───────────────────────────────────────────────────
  gen["mark1_read_sensor"] = (b) => {
    const pin = b.getFieldValue("SENSOR") === "left" ? SENSOR_LEFT : SENSOR_RIGHT;
    return [`digitalRead(${pin})`, 0];
  };

  gen["mark1_on_line"] = () => [
    `(digitalRead(${SENSOR_LEFT}) && digitalRead(${SENSOR_RIGHT}))`, 0
  ];

  // ── Standard blocks ───────────────────────────────────────────
  gen["math_number"] = (b) => [b.getFieldValue("NUM"), 0];
  gen["logic_boolean"] = (b) => [b.getFieldValue("BOOL") === "TRUE" ? "true" : "false", 0];
  gen["time_delay"] = (b) => `delay(${getInput(b, "DELAY_TIME_MILI", gen) || 1000});\n`;
  gen["controls_repeat_ext"] = (b) => {
    const times = getInput(b, "TIMES", gen) || "10";
    const body = genChain(b.getInputTargetBlock("DO"), gen);
    return `for (int i = 0; i < ${times}; i++) {\n${indentCode(body)}}\n`;
  };
  // ── If / If-Else ─────────────────────────────────────────────
  const genControlsIf = (block) => {
    let n = 0;
    let code = "";
    do {
      const condition = getInput(block, 'IF' + n, gen) || 'false';
      const branch = genChain(block.getInputTargetBlock('DO' + n), gen);
      code += (n === 0 ? 'if' : 'else if') + ` (${condition}) {\n${indentCode(branch)}}`;
      n++;
    } while (block.getInput('IF' + n));
    if (block.getInput('ELSE')) {
      const branch = genChain(block.getInputTargetBlock('ELSE'), gen);
      code += ` else {\n${indentCode(branch)}}`;
    }
    return code + "\n";
  };
  gen["controls_if"] = genControlsIf;
  gen["controls_ifelse"] = genControlsIf;

  // ── Comparison (==, !=, <, <=, >, >=) ──────────────────────────
  gen["logic_compare"] = (block) => {
    const OPS = { EQ: "==", NEQ: "!=", LT: "<", LTE: "<=", GT: ">", GTE: ">=" };
    const op = OPS[block.getFieldValue("OP")];
    const a = getInput(block, "A", gen) || "0";
    const b = getInput(block, "B", gen) || "0";
    return [`(${a} ${op} ${b})`, 0];
  };

  // ── AND / OR ─────────────────────────────────────────────────
  gen["logic_operation"] = (block) => {
    const op = block.getFieldValue("OP") === "AND" ? "&&" : "||";
    const a = getInput(block, "A", gen) || "true";
    const b = getInput(block, "B", gen) || "true";
    return [`(${a} ${op} ${b})`, 0];
  };

  // ── NOT ──────────────────────────────────────────────────────
  gen["logic_negate"] = (block) => {
    const a = getInput(block, "BOOL", gen) || "true";
    return [`(!${a})`, 0];
  };

  // ── While / Until Loop ───────────────────────────────────────
  gen["controls_whileUntil"] = (block) => {
    const isUntil = block.getFieldValue("MODE") === "UNTIL";
    let condition = getInput(block, "BOOL", gen) || "false";
    if (isUntil) condition = `!(${condition})`;
    const branch = genChain(block.getInputTargetBlock("DO"), gen);
    return `while (${condition}) {\n${indentCode(branch)}}\n`;
  };

  // ── Math: + - * / ────────────────────────────────────────────
  gen["math_arithmetic"] = (block) => {
    const OPS = { ADD: "+", MINUS: "-", MULTIPLY: "*", DIVIDE: "/" };
    const op = block.getFieldValue("OP");
    const a = getInput(block, "A", gen) || "0";
    const b = getInput(block, "B", gen) || "0";
    if (op === "POWER") return [`pow(${a}, ${b})`, 0];
    return [`(${a} ${OPS[op]} ${b})`, 0];
  };

  // ── Variables (get / set) ───────────────────────────────────
  const sanitizeVarName = (name) => "var_" + name.replace(/[^a-zA-Z0-9_]/g, "_");

  gen["variables_get"] = (block) => {
    const name = block.getField("VAR").getText();
    return [sanitizeVarName(name), 0];
  };

  gen["variables_set"] = (block) => {
    const name = block.getField("VAR").getText();
    const value = getInput(block, "VALUE", gen) || "0";
    return `${sanitizeVarName(name)} = ${value};\n`;
  };
}

// ── Custom Scratch-style Category ─────────────────────────────
class CustomCategory extends Blockly.ToolboxCategory {
  createLabelDom_(name) {
    const label = document.createElement("div");
    label.textContent = name;
    label.style.fontSize = "11px";
    label.style.marginTop = "4px";
    label.style.color = "#555";
    label.style.textAlign = "center";
    return label;
  }

  createIconDom_() {
    const icon = document.createElement("div");
    icon.style.width = "28px";
    icon.style.height = "28px";
    icon.style.borderRadius = "50%";
    icon.style.backgroundColor = this.colour_ || "#ccc";
    icon.style.margin = "0 auto";
    return icon;
  }

  createRowContainer_() {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";
    container.style.padding = "10px 4px";
    container.style.cursor = "pointer";
    container.className = "custom-category-row";
    return container;
  }
}
Blockly.registry.register(
  Blockly.registry.Type.TOOLBOX_ITEM,
  Blockly.ToolboxCategory.registrationName,
  CustomCategory,
  true
);

// ── Toolbox ───────────────────────────────────────────────────
const TOOLBOX = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category", name: "Structure", colour: "#e6543a", contents: [
        { kind: "block", type: "arduino_setup" },
        { kind: "block", type: "arduino_loop" },
      ]
    },

    {
      kind: "category", name: "Mark1", colour: "#5BA55B", contents: [
        { kind: "label", text: "Setup" },
        { kind: "block", type: "mark1_begin" },
        { kind: "label", text: "Motion" },
        { kind: "block", type: "mark1_forward", inputs: { SPEED: { block: { type: "math_number", fields: { NUM: 150 } } } } },
        { kind: "block", type: "mark1_move_timed", inputs: { SPEED: { block: { type: "math_number", fields: { NUM: 150 } } }, DURATION: { block: { type: "math_number", fields: { NUM: 1000 } } } } },
        { kind: "block", type: "mark1_stop" },
        { kind: "block", type: "mark1_set_speed", inputs: { LEFT: { block: { type: "math_number", fields: { NUM: 150 } } }, RIGHT: { block: { type: "math_number", fields: { NUM: 150 } } } } },
        { kind: "label", text: "Arm" },
        { kind: "block", type: "mark1_arm1_up", inputs: { SPEED: { block: { type: "math_number", fields: { NUM: 150 } } }, DURATION: { block: { type: "math_number", fields: { NUM: 1000 } } } } },
        { kind: "block", type: "mark1_arm1_down", inputs: { SPEED: { block: { type: "math_number", fields: { NUM: 150 } } }, DURATION: { block: { type: "math_number", fields: { NUM: 1000 } } } } },
        { kind: "block", type: "mark1_arm2_up", inputs: { SPEED: { block: { type: "math_number", fields: { NUM: 150 } } }, DURATION: { block: { type: "math_number", fields: { NUM: 500 } } } } },
        { kind: "block", type: "mark1_arm2_down", inputs: { SPEED: { block: { type: "math_number", fields: { NUM: 150 } } }, DURATION: { block: { type: "math_number", fields: { NUM: 500 } } } } },
        { kind: "label", text: "LED" },
        { kind: "block", type: "mark1_led_color" },
        { kind: "block", type: "mark1_led_rgb", inputs: { R: { block: { type: "math_number", fields: { NUM: 255 } } }, G: { block: { type: "math_number", fields: { NUM: 0 } } }, B: { block: { type: "math_number", fields: { NUM: 0 } } } } },
        { kind: "block", type: "mark1_led_off" },
        { kind: "block", type: "mark1_led_blink", inputs: { TIMES: { block: { type: "math_number", fields: { NUM: 3 } } }, INTERVAL: { block: { type: "math_number", fields: { NUM: 300 } } } } },
        { kind: "block", type: "mark1_led_brightness", inputs: { BRIGHTNESS: { block: { type: "math_number", fields: { NUM: 80 } } } } },
        { kind: "label", text: "Sensors" },
        { kind: "block", type: "mark1_read_sensor" },
        { kind: "block", type: "mark1_on_line" },
      ]
    },
    {
      kind: "category", name: "Mark2", colour: "#3b82f6", contents: [
        { kind: "label", text: "Setup" },
        { kind: "block", type: "mark2_begin" },
        { kind: "label", text: "Motion" },
        { kind: "block", type: "mark2_forward", inputs: { SPEED: { block: { type: "math_number", fields: { NUM: 150 } } } } },
        { kind: "block", type: "mark2_move_timed", inputs: { SPEED: { block: { type: "math_number", fields: { NUM: 150 } } }, DURATION: { block: { type: "math_number", fields: { NUM: 1000 } } } } },
        { kind: "block", type: "mark2_stop" },
        { kind: "block", type: "mark2_set_speed", inputs: { LEFT: { block: { type: "math_number", fields: { NUM: 150 } } }, RIGHT: { block: { type: "math_number", fields: { NUM: 150 } } } } },
        { kind: "label", text: "Arm" },
        { kind: "block", type: "mark2_arm_up", inputs: { DURATION: { block: { type: "math_number", fields: { NUM: 1000 } } } } },
        { kind: "block", type: "mark2_arm_down", inputs: { DURATION: { block: { type: "math_number", fields: { NUM: 1000 } } } } },
        { kind: "block", type: "mark2_gripper_open" },
        { kind: "block", type: "mark2_gripper_close" },
        { kind: "label", text: "LED" },
        { kind: "block", type: "mark2_led_color" },
        { kind: "block", type: "mark2_led_rgb", inputs: { R: { block: { type: "math_number", fields: { NUM: 255 } } }, G: { block: { type: "math_number", fields: { NUM: 0 } } }, B: { block: { type: "math_number", fields: { NUM: 0 } } } } },
        { kind: "block", type: "mark2_led_off" },
        { kind: "block", type: "mark2_led_blink", inputs: { TIMES: { block: { type: "math_number", fields: { NUM: 3 } } }, INTERVAL: { block: { type: "math_number", fields: { NUM: 300 } } } } },
        { kind: "block", type: "mark2_led_brightness", inputs: { BRIGHTNESS: { block: { type: "math_number", fields: { NUM: 80 } } } } },
        { kind: "label", text: "Sensors" },
        { kind: "block", type: "mark2_read_ir" },
        { kind: "block", type: "mark2_read_ultrasonic" },
      ]
    },

    {
      kind: "category", name: "IoT LED Cube", colour: "#8e44ad", contents: [
        { kind: "label", text: "Setup" },
        { kind: "block", type: "cube_begin" },
        { kind: "label", text: "Modes" },
        { kind: "block", type: "cube_show_digital_clock" },
        { kind: "block", type: "cube_show_analog_clock" },
        { kind: "block", type: "cube_show_name_showcase" },
        { kind: "block", type: "cube_show_eyes" },
        { kind: "block", type: "cube_show_heartbeat" },
        { kind: "block", type: "cube_show_fire" },
      ]
    },

    {
      kind: "category", name: "Time", colour: "#A29BFE", contents: [
        { kind: "block", type: "time_delay", inputs: { DELAY_TIME_MILI: { block: { type: "math_number", fields: { NUM: 1000 } } } } },
      ]
    },
    {
      kind: "category", name: "Loops", colour: "#51acd6", contents: [
        { kind: "block", type: "controls_repeat_ext", inputs: { TIMES: { block: { type: "math_number", fields: { NUM: 10 } } } } },
        { kind: "block", type: "controls_whileUntil" },
      ]
    },
    {
      kind: "category", name: "Logic", colour: "#5C81A6", contents: [
        { kind: "block", type: "controls_if" },
        { kind: "block", type: "logic_compare" },
        { kind: "block", type: "logic_operation" },
        { kind: "block", type: "logic_boolean" },
      ]
    },
    {
      kind: "category", name: "Math", colour: "#5B67A5", contents: [
        { kind: "block", type: "math_number" },
        { kind: "block", type: "math_arithmetic" },
      ]
    },
    { kind: "category", name: "Variables", colour: "#A55B80", custom: "VARIABLE" },
    { kind: "category", name: "Functions", colour: "#995BA5", custom: "PROCEDURE" },
  ],
};

// ── Theme ─────────────────────────────────────────────────────
const MARK1_THEME = Blockly.Theme.defineTheme("mark1Light", {
  base: Blockly.Themes.Classic,
  componentStyles: {
    workspaceBackgroundColour: colors.canvasBg,
    toolboxBackgroundColour: colors.sidebarDark,
    toolboxForegroundColour: colors.textPrimary,
    flyoutBackgroundColour: colors.surface,
    flyoutForegroundColour: colors.textPrimary,
    flyoutOpacity: 0.97,
    scrollbarColour: colors.scrollbarThumb,
    insertionMarkerColour: colors.primaryGreen,
    scrollbarOpacity: 0.6,
    cursorColour: colors.primaryGreen,
  },
});

// ── Component ─────────────────────────────────────────────────
const BlockCanvas = forwardRef(function BlockCanvas({ onCodeChange, onXMLChange, loadXML }, ref) {
  const containerRef = useRef(null);
  const workspaceRef = useRef(null);
  const arduinoGen = useRef(null);
  const prevXMLRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getCurrentXML: () => {
      if (!workspaceRef.current) return "<xml></xml>";
      return Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspaceRef.current));
    },
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    registerAllBlocks(Blockly, Blockly.Blocks);

    // Keep flyout content at default scale when the main workspace zooms.
    Blockly.Flyout.prototype.getFlyoutScale = function () {
      return 1;
    };

    // Electron doesn't support window.prompt/confirm — replace Blockly's
    // dialogs with simple custom popups so "Create Variable" etc. work.
    Blockly.dialog.setPrompt((message, defaultValue, callback) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
      overlay.innerHTML = `
        <div style="background:#fff;padding:20px;border-radius:8px;min-width:280px;font-family:Arial,sans-serif;">
          <div style="margin-bottom:10px;font-size:14px;">${message}</div>
          <input id="bkDialogInput" type="text" style="width:100%;padding:6px;box-sizing:border-box;margin-bottom:12px;font-size:14px;" />
          <div style="display:flex;justify-content:flex-end;gap:8px;">
            <button id="bkDialogCancel" style="padding:6px 14px;">Cancel</button>
            <button id="bkDialogOk" style="padding:6px 14px;background:#4CAF50;color:#fff;border:none;border-radius:4px;">OK</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      const input = overlay.querySelector('#bkDialogInput');
      input.value = defaultValue || '';
      input.focus();
      input.select();
      const close = (result) => { document.body.removeChild(overlay); callback(result); };
      overlay.querySelector('#bkDialogOk').onclick = () => close(input.value);
      overlay.querySelector('#bkDialogCancel').onclick = () => close(null);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') close(input.value);
        if (e.key === 'Escape') close(null);
      });
    });

    Blockly.dialog.setConfirm((message, callback) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
      overlay.innerHTML = `
        <div style="background:#fff;padding:20px;border-radius:8px;min-width:280px;font-family:Arial,sans-serif;">
          <div style="margin-bottom:14px;font-size:14px;">${message}</div>
          <div style="display:flex;justify-content:flex-end;gap:8px;">
            <button id="bkConfirmNo" style="padding:6px 14px;">Cancel</button>
            <button id="bkConfirmYes" style="padding:6px 14px;background:#4CAF50;color:#fff;border:none;border-radius:4px;">OK</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      const close = (result) => { document.body.removeChild(overlay); callback(result); };
      overlay.querySelector('#bkConfirmYes').onclick = () => close(true);
      overlay.querySelector('#bkConfirmNo').onclick = () => close(false);
    });

    Blockly.dialog.setAlert((message, callback) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
      overlay.innerHTML = `
        <div style="background:#fff;padding:20px;border-radius:8px;min-width:280px;font-family:Arial,sans-serif;">
          <div style="margin-bottom:14px;font-size:14px;">${message}</div>
          <div style="display:flex;justify-content:flex-end;">
            <button id="bkAlertOk" style="padding:6px 14px;background:#4CAF50;color:#fff;border:none;border-radius:4px;">OK</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#bkAlertOk').onclick = () => {
        document.body.removeChild(overlay);
        callback?.();
      };
    });

    const gen = buildArduinoGenerator();
    registerArduinoGenerators(gen);
    arduinoGen.current = gen;

    const workspace = Blockly.inject(containerRef.current, {
      toolbox: TOOLBOX,
      theme: MARK1_THEME,
      grid: { spacing: 25, length: 3, colour: colors.canvasGrid, snap: true },
      zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
      trashcan: true,
      scrollbars: true,
      sounds: false,

    });
    workspaceRef.current = workspace;
    const handleResize = () => Blockly.svgResize(workspace);
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    setTimeout(handleResize, 300);

    const handleChange = (event) => {
      if (
        event.type === Blockly.Events.VIEWPORT_CHANGE ||
        event.type === Blockly.Events.SELECTED ||
        event.type === Blockly.Events.CLICK
      ) return;

      // Always capture XML first — must succeed independently of
      // code generation, so Save/project switching never uses stale data.
      let xml;
      try {
        xml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
      } catch (err) {
        console.error("[BlockCanvas] XML capture error:", err);
        return;
      }

      if (xml !== prevXMLRef.current) {
        prevXMLRef.current = xml;
        onXMLChange?.(xml);
      }

      // Code generation can fail on its own without corrupting saved state.
      try {
        const code = arduinoGen.current.workspaceToCode(workspace);
        onCodeChange?.(code);
      } catch (err) {
        console.error("[BlockCanvas] codegen error:", err);
      }
    };

    workspace.addChangeListener(handleChange);

    return () => {
      workspace.removeChangeListener(handleChange);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      workspace.dispose();
      workspaceRef.current = null;;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loadXML || !workspaceRef.current) return;
    try {
      const dom = Blockly.utils.xml.textToDom(loadXML.xml);
      workspaceRef.current.clear(); 
      Blockly.Xml.domToWorkspace(dom, workspaceRef.current);
      prevXMLRef.current = loadXML.xml;
    } catch (err) {
      console.error("[BlockCanvas] Failed to load XML:", err);
    }
  }, [loadXML?.key]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: colors.canvasBg }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
});

export default BlockCanvas;
