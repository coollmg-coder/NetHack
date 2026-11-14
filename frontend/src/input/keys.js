export const MOVE_COMMANDS = {
  ArrowUp: 'k',
  ArrowDown: 'j',
  ArrowLeft: 'h',
  ArrowRight: 'l',
  Numpad8: 'k',
  Numpad2: 'j',
  Numpad4: 'h',
  Numpad6: 'l',
  Numpad7: 'y',
  Numpad9: 'u',
  Numpad1: 'b',
  Numpad3: 'n',
};

export const FACING = {
  k: 0,
  u: 1,
  l: 2,
  n: 3,
  j: 4,
  b: 5,
  h: 6,
  y: 7,
};

export const ROTATE = {
  q: -1,
  Q: -1,
  e: 1,
  E: 1,
};

export function translateKey(key) {
  if (key in ROTATE) {
    return { rotate: ROTATE[key] };
  }
  const command = MOVE_COMMANDS[key] ?? (key.length === 1 ? key : null);
  if (command === null) {
    return null;
  }
  if (command in FACING) {
    return { command, facing: FACING[command] };
  }
  return { command };
}
