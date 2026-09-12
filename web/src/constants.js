// NetHack color palette (CLR_* indices) mapped to hex for the voxel renderer.
// Values match include/color.h and the js_constants_init() COLORS scope.
export const NH_COLORS = {
  CLR_BLACK: 0x000000,
  CLR_RED: 0xff3030,
  CLR_GREEN: 0x30c030,
  CLR_BROWN: 0xa06020,
  CLR_BLUE: 0x3030ff,
  CLR_MAGENTA: 0xff30ff,
  CLR_CYAN: 0x30ffff,
  CLR_GRAY: 0x808080,
  // NO_COLOR index 8 has no single color
  CLR_ORANGE: 0xffa020,
  CLR_BRIGHT_GREEN: 0x30ff30,
  CLR_YELLOW: 0xffff30,
  CLR_BRIGHT_BLUE: 0x9090ff,
  CLR_BRIGHT_MAGENTA: 0xff90ff,
  CLR_BRIGHT_CYAN: 0x90ffff,
  CLR_WHITE: 0xffffff,
};

// The shim exposes the real glyph offsets at runtime via
// globalThis.nethackGlobal.constants.GLYPH.<NAME> (installed by
// js_constants_init() during startup).  There are no useful hardcoded
// fallbacks because the offsets depend on NUMMONS / NUM_OBJECTS, so callers
// must use the runtime values.
export function getGlyphConstants() {
  const c = globalThis.nethackGlobal?.constants?.GLYPH;
  if (!c || c.GLYPH_MON_OFF === undefined) {
    throw new Error('glyph constants not installed yet');
  }
  return c;
}

export function getColorConstants() {
  return globalThis.nethackGlobal?.constants?.COLORS || null;
}

export function getStatusFields() {
  return globalThis.nethackGlobal?.constants?.STATUS_FIELD || {};
}

export function colorHex(colorIndex) {
  const c = NH_COLORS[colorIndex];
  if (c !== undefined) return c;
  const named = Object.keys(NH_COLORS)[colorIndex];
  return named ? NH_COLORS[named] : 0x888888;
}
