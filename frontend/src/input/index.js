import { runtime } from '../runtime/index.js';
import { translateKey } from './keys.js';

const SPECIAL_KEYS = {
  Enter: '\n',
  Escape: '\u001b',
  ' ': ' ',
  Backspace: '\b',
  Tab: '\t',
};

function getFacing() {
  return runtime.state.get('facing') ?? 0;
}

function rotate(delta) {
  runtime.state.set('facing', (getFacing() + delta + 8) % 8);
}

function handleKey(event) {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }

  const key = event.key;
  const special = SPECIAL_KEYS[key];
  if (special !== undefined) {
    runtime.sendCommand(special);
    event.preventDefault();
    return;
  }

  const result = translateKey(key);
  if (result === null) {
    return;
  }
  if (result.rotate !== undefined) {
    rotate(result.rotate);
  } else {
    if (result.facing !== undefined) {
      runtime.state.set('facing', result.facing);
    }
    runtime.sendCommand(result.command);
  }
  event.preventDefault();
}

export function attach() {
  if (runtime.state.get('facing') === undefined) {
    runtime.state.set('facing', Math.floor(Math.random() * 8));
  }
  window.addEventListener('keydown', handleKey);
}

export function detach() {
  window.removeEventListener('keydown', handleKey);
}

export const input = { attach, detach };
