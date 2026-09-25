// =============================================================
//  src/blocks/index.js
//  Auto-registers all block plugin files.
//  To add a new robot library:
//    1. Create src/blocks/myrobot.js exporting defineBlocks()
//    2. Add one import + one call below — nothing else changes.
// =============================================================

import { defineBlocks as defineMark1 } from "./mark1.js";
import { defineBlocks as defineMark2 } from "./mark2.js";
import { defineBlocks as defineCube }  from "./cube.js";
// ── Future robot libraries (uncomment to activate) ────────────
// import { defineBlocks as defineMark2 }      from "./mark2.js";
// import { defineBlocks as defineSensorPack } from "./sensor_pack.js";

/**
 * Register all custom block definitions with Blockly.
 * Call this once before the Blockly workspace is created.
 *
 * @param {object} Blockly - The Blockly instance
 * @param {object} Blocks - The Blockly.Blocks dictionary
 */
export function registerAllBlocks(Blockly, Blocks) {
  defineMark1(Blockly, Blocks);
  defineMark2(Blockly, Blocks);
  defineCube(Blockly, Blocks);
}


