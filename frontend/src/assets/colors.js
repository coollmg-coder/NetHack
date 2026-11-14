export const CLR = {
  BLACK: 0,
  RED: 1,
  GREEN: 2,
  BROWN: 3,
  BLUE: 4,
  MAGENTA: 5,
  CYAN: 6,
  GRAY: 7,
  NO_COLOR: 8,
  ORANGE: 9,
  BRIGHT_GREEN: 10,
  YELLOW: 11,
  BRIGHT_BLUE: 12,
  BRIGHT_MAGENTA: 13,
  BRIGHT_CYAN: 14,
  WHITE: 15,
};

const PALETTE = [
  '#000000',
  '#c00000',
  '#00c000',
  '#8b5a2b',
  '#0000c0',
  '#c000c0',
  '#00c0c0',
  '#c0c0c0',
  '#808080',
  '#ff8000',
  '#00ff00',
  '#ffff00',
  '#8080ff',
  '#ff80ff',
  '#00ffff',
  '#ffffff',
];

export function colorToHex(index) {
  return PALETTE[index] ?? PALETTE[CLR.NO_COLOR];
}
