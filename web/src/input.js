// Maps DOM key events to NetHack key codes and routes them to the bridge's
// blocking-input resolvers based on what the engine is currently waiting for.

const ESC = 27;
const ENTER = 13;
const ERASE = 127; // NetHack's erase char

function keyToNetHack(e) {
  // Control keys: Ctrl+A..Ctrl+Z -> 1..26
  if (e.ctrlKey && !e.altKey && !e.metaKey) {
    const c = e.key.toUpperCase();
    if (c.length === 1 && c >= 'A' && c <= 'Z') return c.charCodeAt(0) - 64;
  }
  switch (e.key) {
    case 'Enter': return ENTER;
    case 'Escape': return ESC;
    case 'Backspace': return ERASE;
    case 'Tab': return 9;
    case ' ': return 32;
    case 'ArrowUp': return 'k'.charCodeAt(0);
    case 'ArrowDown': return 'j'.charCodeAt(0);
    case 'ArrowLeft': return 'h'.charCodeAt(0);
    case 'ArrowRight': return 'l'.charCodeAt(0);
    case 'Home': return 'y'.charCodeAt(0);   // up-left
    case 'PageUp': return 'u'.charCodeAt(0); // up-right
    case 'End': return 'b'.charCodeAt(0);    // down-left
    case 'PageDown': return 'n'.charCodeAt(0); // down-right
    default: break;
  }
  // Printable single character (letters are case-sensitive for NetHack).
  if (e.key.length === 1) return e.key.charCodeAt(0);
  return null;
}

export class Input {
  constructor(bridge, ui) {
    this.bridge = bridge;
    this.ui = ui;

    document.addEventListener('keydown', (e) => {
      const p = bridge.pending;
      if (!p) return; // nothing waiting

      // Text input: the UI owns the <input>; typing is captured there.
      if (p.kind === 'line') return;

      // Menus: UI handles navigation, but Esc cancels.
      if (p.kind === 'menu') {
        this.ui.menuKey(e);
        return;
      }

      if (p.kind === 'extcmd') {
        if (e.key === 'Escape') { bridge.submit.extcmd(0); }
        return;
      }

      const code = keyToNetHack(e);
      if (code == null) return;

      switch (p.kind) {
        case 'key':
          e.preventDefault();
          bridge.submit.key(code);
          break;
        case 'poskey':
          // Keyboard input flows through nh_poskey too (the 5.0 primary
          // input); report no mouse coordinates.
          e.preventDefault();
          bridge.submit.poskey(0, 0, 0, code);
          break;
        case 'yesno': {
          // resp may be empty when the engine passes NULL (e.g. "Shall I
          // pick ...? [ynaq]"); in that case any single character is valid.
          const resp = p.args[1] || '';
          const def = p.args[2] || 0; // char code, or 0 for no default
          if (e.key === 'Escape') {
            e.preventDefault();
            bridge.submit.yesno(def ? def : ESC);
            break;
          }
          const ch = String.fromCharCode(code).toLowerCase();
          if (!resp || resp.includes(ch) || resp.includes('*')) {
            e.preventDefault();
            bridge.submit.yesno(ch.charCodeAt(0));
          }
          break;
        }
        case 'message_menu': {
          if (e.key === 'Escape') {
            e.preventDefault();
            bridge.submit.message_menu(0);
          } else {
            e.preventDefault();
            bridge.submit.message_menu(code);
          }
          break;
        }
        default:
          break;
      }
    });

    // Mouse: for now, send a synthetic "left click" on the map via nh_poskey.
    // (Keyboard-only getpos already works; mouse aiming is a future TODO.)
    document.addEventListener('mousedown', (e) => {
      const p = bridge.pending;
      if (p && p.kind === 'poskey') {
        bridge.submit.poskey(0, 0, 1, 0); // CLICK_1 modifier, no selection
      }
    });
  }
}
