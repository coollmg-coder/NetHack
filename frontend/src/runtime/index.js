import createModule from './nethack.js';
import wasmUrl from './nethack.wasm?url';
import { state } from './state.js';

const SHIM_CALLBACK_NAME = '__nh_shim_callback';

const eventListeners = new Map();
const pending = {};
const keyQueue = [];
const menuItems = [];
let menuPrompt = '';
let nextWindowId = 1;
const windowTypeById = new Map();
let module = null;

function emit(event, payload) {
  const cbs = eventListeners.get(event);
  if (!cbs) {
    return;
  }
  for (const cb of [...cbs]) {
    cb(payload);
  }
}

function on(event, cb) {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set());
  }
  eventListeners.get(event).add(cb);
  return () => eventListeners.get(event).delete(cb);
}

function waitFor(type) {
  return new Promise((resolve) => {
    pending[type] = resolve;
  });
}

function resolvePending(type, value) {
  const resolver = pending[type];
  if (resolver) {
    pending[type] = null;
    resolver(value);
    return true;
  }
  return false;
}

function winTypeConstants() {
  const ng = globalThis.nethackGlobal;
  return ng && ng.constants ? ng.constants.WIN_TYPE || {} : {};
}

function statusFieldConstants() {
  const ng = globalThis.nethackGlobal;
  return ng && ng.constants ? ng.constants.STATUS_FIELD || {} : {};
}

function mapConstants() {
  const ng = globalThis.nethackGlobal;
  return ng && ng.constants ? ng.constants.MAP || {} : {};
}

function readStatusValue(field, ptr) {
  if (!ptr) {
    return '';
  }
  if (field === statusFieldConstants().BL_CONDITION) {
    return module.getValue(ptr, 'i32');
  }
  return module.UTF8ToString(ptr);
}

function shimCallback(name, ...args) {
  switch (name) {
    case 'shim_create_nhwindow': {
      const winid = nextWindowId++;
      windowTypeById.set(winid, args[0]);
      return Promise.resolve(winid);
    }
    case 'shim_destroy_nhwindow':
      windowTypeById.delete(args[0]);
      return Promise.resolve();
    case 'shim_putstr': {
      const [winid, , str] = args;
      if (windowTypeById.get(winid) === winTypeConstants().NHW_MESSAGE) {
        emit('message', str);
      }
      return Promise.resolve();
    }
    case 'shim_raw_print':
    case 'shim_raw_print_bold':
      emit('message', args[0]);
      return Promise.resolve();
    case 'shim_status_update': {
      const [field, ptr, chg, percent, color] = args;
      emit('status', {
        field,
        value: readStatusValue(field, ptr),
        chg,
        percent,
        color,
      });
      return Promise.resolve();
    }
    case 'shim_start_menu':
      menuItems.length = 0;
      return Promise.resolve();
    case 'shim_add_menu': {
      const [, , , ch, , attr, clr, str, itemflags] = args;
      menuItems.push({ text: str, ch, attr, clr, flags: itemflags });
      return Promise.resolve();
    }
    case 'shim_end_menu':
      menuPrompt = args[1];
      return Promise.resolve();
    case 'shim_select_menu': {
      const [window, how] = args;
      emit('menu', { window, how, prompt: menuPrompt, items: [...menuItems] });
      return waitFor('menu');
    }
    case 'shim_message_menu': {
      const [, how, mesg] = args;
      emit('menu', { how, prompt: mesg, items: [] });
      return Promise.resolve(0);
    }
    case 'shim_yn_function': {
      const [query, resp, def] = args;
      emit('yesNo', { query, choices: resp, default: def });
      return waitFor('yesNo');
    }
    case 'shim_getlin': {
      const [query, bufp] = args;
      emit('getLine', { query });
      return waitFor('line').then((value) => {
        module.stringToUTF8(value, bufp, 256);
      });
    }
    case 'shim_nhgetch':
      if (keyQueue.length > 0) {
        return Promise.resolve(keyQueue.shift());
      }
      return waitFor('getch');
    case 'shim_get_ext_cmd':
    case 'shim_doprev_message':
    case 'shim_nh_poskey':
      return Promise.resolve(0);
    case 'shim_player_selection_or_tty':
      emit('playerSelection');
      return Promise.resolve(false);
    case 'shim_mark_synch':
    case 'shim_wait_synch':
      emit('turnChange');
      return Promise.resolve();
    case 'shim_get_color_string':
      return Promise.resolve('');
    case 'shim_getmsghistory':
      return Promise.resolve('');
    case 'set_shim_font_name':
      return Promise.resolve(0);
    default:
      return Promise.resolve();
  }
}

function buildArgv(args) {
  const argPtrs = args.map((arg) => {
    const ptr = module._malloc(arg.length + 1);
    module.stringToUTF8(arg, ptr, arg.length + 1);
    return ptr;
  });
  const argvPtr = module._malloc((argPtrs.length + 1) * 4);
  argPtrs.forEach((ptr, i) => {
    module.setValue(argvPtr + i * 4, ptr, 'i32');
  });
  module.setValue(argvPtr + argPtrs.length * 4, 0, 'i32');
  return { argc: argPtrs.length, argvPtr };
}

function getTerrain(x, y) {
  return module._nh_get_terrain(x, y);
}

function isSeen(x, y) {
  return module._nh_is_seen(x, y) !== 0;
}

function isExplored(x, y) {
  return module._nh_is_explored(x, y) !== 0;
}

function getHero() {
  return { x: module._nh_get_hero_x(), y: module._nh_get_hero_y() };
}

function getTurn() {
  return module._nh_get_turn();
}

function getMonsters() {
  const { COLNO, ROWNO } = mapConstants();
  const result = [];
  if (!COLNO || !ROWNO) {
    return result;
  }
  for (let x = 1; x < COLNO; x++) {
    for (let y = 0; y < ROWNO; y++) {
      const type = module._nh_monster_at(x, y);
      if (type >= 0) {
        result.push({
          x,
          y,
          type,
          color: module._nh_monster_color_at(x, y),
          visible: module._nh_monster_visible_at(x, y) !== 0,
        });
      }
    }
  }
  return result;
}

function getItems() {
  const { COLNO, ROWNO } = mapConstants();
  const result = [];
  if (!COLNO || !ROWNO) {
    return result;
  }
  for (let x = 1; x < COLNO; x++) {
    for (let y = 0; y < ROWNO; y++) {
      const type = module._nh_item_at(x, y);
      if (type >= 0) {
        result.push({
          x,
          y,
          type,
          color: module._nh_item_color_at(x, y),
        });
      }
    }
  }
  return result;
}

function sendCommand(cmd) {
  const key = typeof cmd === 'string' ? cmd.charCodeAt(0) : cmd;
  if (!resolvePending('getch', key)) {
    keyQueue.push(key);
  }
}

function answerMenu(index) {
  resolvePending('menu', index);
}

function answerYesNo(ch) {
  resolvePending('yesNo', typeof ch === 'string' ? ch.charCodeAt(0) : ch);
}

function replyString(value) {
  resolvePending('line', value);
}

async function init() {
  if (module) {
    return;
  }
  module = await createModule({
    noInitialRun: true,
    locateFile: (path) => (path.endsWith('.wasm') ? wasmUrl : path),
  });
  globalThis[SHIM_CALLBACK_NAME] = shimCallback;
  module.ccall('shim_graphics_set_callback', null, ['string'], [
    SHIM_CALLBACK_NAME,
  ]);
  const argv = buildArgv(['nethack']);
  module.ccall('main', 'number', ['number', 'number'], [argv.argc, argv.argvPtr], {
    async: true,
  });
}

export const runtime = {
  init,
  getTerrain,
  isSeen,
  isExplored,
  getHero,
  getMonsters,
  getItems,
  getTurn,
  sendCommand,
  answerMenu,
  answerYesNo,
  replyString,
  onTurnChange: (cb) => on('turnChange', cb),
  onMessage: (cb) => on('message', cb),
  onStatus: (cb) => on('status', cb),
  onMenu: (cb) => on('menu', cb),
  onYesNo: (cb) => on('yesNo', cb),
  onGetLine: (cb) => on('getLine', cb),
  state,
};
