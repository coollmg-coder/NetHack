import { getGlyphConstants } from './constants.js';

// Classify a raw glyph number into a coarse category for the renderer.
// Categories:
//   terrain   - walls, floors, doors, stairs, water, lava, traps, etc.
//   object    - items lying on the floor
//   monster   - hostile monsters
//   pet       - tame monsters
//   hero      - the player character
//   invisible - remembered/paranoid monster locations
//   detect    - detected monster locations
//   body      - remembered dead monster / corpse locations
//   ridden    - monster being ridden by hero
//   statue    - petrified monsters
//   piletop   - the top item of an object pile
//   explosion - zap/explosion animations
//   warning   - warning flashes
//   nothing   - out of sight
const FLOOR_CHARS = new Set(['.', '#', ':']); // room floor, corridor, lit
const WALL_CHARS = new Set([
  ' ', '|', '-', '}', // stone / vwall / hwall / lavawall
]);
const DOOR_CHARS = new Set(['+']); // closed / trapped door
const OPEN_DOOR_CHARS = new Set(['-', '|']); // open doors (context dependent)
const STAIR_CHARS = new Set(['<', '>']);
const WATER_CHARS = new Set(['~']); // water pools
const TRAP_CHARS = new Set(['^']);
const ALTAR_CHARS = new Set(['_']);
const FOUNTAIN_CHARS = new Set(['{']); // also sink/grave share some chars

export function classifyGlyph(glyph, G) {
  if (glyph < G.GLYPH_MON_OFF) return 'unknown';
  if (glyph < G.GLYPH_PET_OFF) return 'monster';
  if (glyph < G.GLYPH_INVIS_OFF) return 'pet';
  if (glyph < G.GLYPH_DETECT_OFF) return 'invisible';
  if (glyph < G.GLYPH_BODY_OFF) return 'detect';
  if (glyph < G.GLYPH_RIDDEN_OFF) return 'body';
  if (glyph < G.GLYPH_OBJ_OFF) return 'ridden';
  if (glyph < G.GLYPH_CMAP_OFF) return 'object';
  if (glyph < G.GLYPH_ZAP_OFF) return 'terrain';
  if (glyph < G.GLYPH_SWALLOW_OFF) return 'zap';
  if (glyph < G.GLYPH_EXPLODE_OFF) return 'swallow';
  if (glyph < G.GLYPH_WARNING_OFF) return 'warning';
  if (glyph < G.GLYPH_STATUE_OFF) return 'statue';
  if (glyph < G.GLYPH_PILETOP_OFF) return 'piletop';
  if (glyph < G.GLYPH_UNEXPLORED_OFF) return 'unexplored';
  return 'nothing';
}

// Whether a terrain glyph's ttychar represents a blocking wall.
export function isWallChar(ch) {
  return ch === ' ' || ch === '|' || ch === '-' || ch === '}' || ch === '\\';
}

// Roughly: is this terrain cell passable / "floor-like"?
export function isFloorChar(ch) {
  return ch === '.' || ch === '#' || ch === ':' || ch === '`';
}
