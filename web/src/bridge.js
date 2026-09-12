// Bridge between the NetHack shim WASM port and the web UI.
//
// The shim port forwards every window-port call to a JS callback
// (globalThis.<cbName>).  Non-blocking calls are dispatched straight to
// subscribers; blocking calls (nhgetch, yn_function, getlin, select_menu,
// message_menu, get_ext_cmd, nh_poskey) return a Promise that is resolved by
// the input layer via bridge.submit.*().

// Window types (include/wintype.h)
export const NHW_MESSAGE = 1;
export const NHW_STATUS = 2;
export const NHW_MAP = 3;
export const NHW_MENU = 4;
export const NHW_TEXT = 5;

export class NethackBridge {
  constructor() {
    this.Module = null;
    this.listeners = new Map(); // event name -> Set<fn>
    this.pending = null; // { kind, resolve, ... }
    this.menus = new Map(); // winid -> { items, prompt }
    this.winTypes = new Map(); // winid -> NHW_* type
    this.ready = false;
    this.running = false;
  }

  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(fn);
    return () => this.listeners.get(event)?.delete(fn);
  }

  emit(event, ...args) {
    const s = this.listeners.get(event);
    if (s) for (const fn of s) fn(...args);
  }

  // ---- loading -----------------------------------------------------------

  async load() {
    // The Emscripten glue (nethack.js) and nethack.wasm are placed in public/
    // and served at the site root.  Load the glue dynamically so Vite does
    // not try to bundle it (it is already an ES module).
    const glueUrl = new URL('nethack.js', document.baseURI).href;
    const mod = await import(/* @vite-ignore */ glueUrl);
    const factory = mod.default;
    this.Module = await factory({ noInitialRun: true });
    this._installGlobals();
    this.ready = true;
  }

  // Run the helper/constant/global installers that libnhmain.c exposes, then
  // install our shim callback.
  _installGlobals() {
    const M = this.Module;
    // js_helpers_init / js_constants_init / js_globals_init are not exported;
    // they run during main().  We set up the global object shell here so the
    // helpers can attach to it, and rely on main() to populate constants.
    globalThis.nethackGlobal = globalThis.nethackGlobal || {
      helpers: {},
      constants: {},
      globals: {},
      pointers: {},
    };
    // The callback name registered via shim_graphics_set_callback.
    globalThis.__nethackCallback = (name, ...args) => this._dispatch(name, args);
  }

  // ---- game start / stop -------------------------------------------------

  async start(argv) {
    if (!this.ready) await this.load();
    const M = this.Module;
    this.running = true;

    // Register the callback, then run main().
    M.ccall('shim_graphics_set_callback', null, ['string'],
      ['__nethackCallback'], { async: true });

    const argPtrs = argv.map((a) => {
      const len = (a.length + 1) * 2;
      const p = M._malloc(len);
      M.stringToUTF8(a, p, len);
      return p;
    });
    const argvPtr = M._malloc(argPtrs.length * 4);
    argPtrs.forEach((p, i) => M.setValue(argvPtr + i * 4, p, 'i32'));

    try {
      await M.ccall('main', 'number', ['number', 'number'],
        [argPtrs.length, argvPtr], { async: true });
    } catch (e) {
      // A normal exit() throws an ExitStatus; treat that as a clean end.
      if (!(e && (e.name === 'ExitStatus' || /terminated with exit/.test(e.message || '')))) {
        throw e;
      }
    } finally {
      argPtrs.forEach((p) => M._free(p));
      M._free(argvPtr);
    }

    this.running = false;
    this.emit('exit');
    // If a save file exists now, expose it to the UI.
    const env = this.exportSave();
    this.emit('gameover', env);
  }

  exportSave() {
    const M = this.Module;
    const ptr = M._nethack_export_save();
    if (!ptr) return null;
    const env = M.UTF8ToString(ptr);
    M._nethack_free(ptr);
    return env || null;
  }

  importSave(envelope) {
    return this.Module.ccall('nethack_import_save', 'number', ['string'],
      [envelope]);
  }

  // Read the extended-command table (exposed via nethackGlobal.pointers) so
  // the UI can offer a # command picker.
  readExtCmdList() {
    const M = this.Module;
    const base = globalThis.nethackGlobal?.pointers?.extcmdlist;
    if (!base) return [];
    const list = [];
    // struct ext_func_tab { uchar key; const char *ef_txt, *ef_desc;
    //                       int (*ef_funct)(); unsigned flags; const char *f_text; }
    for (let i = 0; ; i++) {
      const entry = base + i * 24;
      const txtPtr = M.getValue(entry + 4, 'i32');
      if (!txtPtr) break;
      const descPtr = M.getValue(entry + 8, 'i32');
      list.push({ index: i, name: M.UTF8ToString(txtPtr), desc: descPtr ? M.UTF8ToString(descPtr) : '' });
    }
    return list;
  }

  // ---- shim callback dispatch -------------------------------------------

  async _dispatch(name, args) {
    const short = name.replace(/^shim_/, '');
    const M = this.Module;

    switch (short) {
      case 'init_nhwindows': return this.emit('init', args);
      case 'player_selection_or_tty': return true; // use generic (menu) setup
      case 'askname': return this._blocking('askname');
      case 'get_nh_event': return undefined;
      case 'exit_nhwindows': this.emit('exitmsg', args[0]); return undefined;
      case 'suspend_nhwindows': return undefined;
      case 'resume_nhwindows': this.emit('resume'); return undefined;
      case 'create_nhwindow': {
        const type = args[0];
        const win = (this._winSeq = (this._winSeq || 0) + 1);
        this.winTypes.set(win, type);
        this.emit('win:create', win, type);
        return win;
      }
      case 'clear_nhwindow':
        if (this.winTypes.get(args[0]) === NHW_MAP) this.emit('map:clear');
        else this.emit('win:clear', args[0]);
        return undefined;
      case 'display_nhwindow':
        if (this.winTypes.get(args[0]) === NHW_MAP) this.emit('map:display', args[1]);
        else this.emit('win:display', args[0], args[1]);
        return undefined;
      case 'destroy_nhwindow': this.emit('win:destroy', args[0]); return undefined;
      case 'curs': this.emit('curs', args[0], args[1], args[2]); return undefined;
      case 'putstr':
        this.emit('putstr', this.winTypes.get(args[0]) || 0, args[1], args[2]);
        return undefined;
      case 'putmixed':
        this.emit('putstr', this.winTypes.get(args[0]) || 0, args[1], args[2]);
        return undefined;
      case 'display_file': this.emit('display_file', args[0], args[1]); return undefined;
      case 'start_menu':
        this.menus.set(args[0], { items: [], prompt: '' });
        return undefined;
      case 'add_menu':
        this._addMenu(args); return undefined;
      case 'end_menu': {
        const m = this.menus.get(args[0]);
        if (m) m.prompt = args[1] || '';
        return undefined;
      }
      case 'select_menu': return this._blocking('menu', args);
      case 'message_menu': return this._blocking('message_menu', args);
      case 'mark_synch': this.emit('synch'); return undefined;
      case 'wait_synch': this.emit('synch'); return undefined;
      case 'print_glyph': this._printGlyph(args); return undefined;
      case 'raw_print': this.emit('rawprint', args[0]); return undefined;
      case 'raw_print_bold': this.emit('rawprint', args[0]); return undefined;
      case 'nhgetch': return this._blocking('key');
      case 'nh_poskey': return this._blocking('poskey', args);
      case 'nhbell': this.emit('bell'); return undefined;
      case 'doprev_message': return 0;
      case 'yn_function': return this._blocking('yesno', args);
      case 'getlin': return this._blocking('line', args);
      case 'get_ext_cmd': return this._blocking('extcmd', args);
      case 'number_pad': return undefined;
      case 'delay_output': this.emit('delay'); return undefined;
      case 'change_color': return undefined;
      case 'get_color_string': return '';
      case 'preference_update': return undefined;
      case 'getmsghistory': this.emit('msghistory:get', args[0]); return '';
      case 'putmsghistory': this.emit('msghistory:put', args[0], args[1]); return undefined;
      case 'status_init': this.emit('status:init'); return undefined;
      case 'status_enablefield':
        this.emit('status:enablefield', args[0], this._str(args[1]), args[3]);
        return undefined;
      case 'status_update': this._statusUpdate(args); return undefined;
      case 'update_inventory': this.emit('inventory:update', args[0]); return undefined;
      case 'ctrl_nhwindow': return 0;
      case 'outrip': this.emit('outrip', args[0]); return undefined;
      default:
        return undefined;
    }
  }

  // Read a C string from a pointer.
  _str(ptr) {
    return ptr ? this.Module.UTF8ToString(ptr) : '';
  }

  _addMenu(args) {
    const [win, glyphInfoPtr, identifierPtr, ch, gch, attr, clr, str, flags] = args;
    const m = this.menus.get(win);
    if (!m) return;
    // identifier is an ANY_P union (8 bytes); copy it faithfully so it can be
    // written back on selection.
    const M = this.Module;
    const idLo = identifierPtr ? M.getValue(identifierPtr, 'i32') : 0;
    const idHi = identifierPtr ? M.getValue(identifierPtr + 4, 'i32') : 0;
    m.items.push({
      id: [idLo, idHi],
      ch, gch, attr, clr, str: str || '', flags: flags || 0,
    });
  }

  _printGlyph(args) {
    const [win, x, y, glyphInfoPtr, bgGlyphInfoPtr] = args;
    if (this.winTypes.get(win) !== NHW_MAP) return;
    const M = this.Module;
    const info = {
      glyph: M.getValue(glyphInfoPtr, 'i32'),
      ttychar: M.getValue(glyphInfoPtr + 4, 'i32'),
      framecolor: M.getValue(glyphInfoPtr + 8, 'i32'),
      color: M.getValue(glyphInfoPtr + 16, 'i32'),
      symidx: M.getValue(glyphInfoPtr + 20, 'i32'),
    };
    this.emit('map:glyph', x, y, info);
  }

  _statusUpdate(args) {
    const [field, ptr, chg, percent, color] = args;
    const M = this.Module;
    let value = null;
    // String fields; every other field carries an int/long via pointer.
    const STRING_FIELDS = new Set([0, 7, 20]); // BL_TITLE, BL_ALIGN, BL_LEVELDESC
    if (STRING_FIELDS.has(field)) {
      value = ptr ? M.UTF8ToString(ptr) : '';
    } else if (field >= 0) {
      value = ptr ? M.getValue(ptr, 'i32') : 0;
    }
    this.emit('status:update', field, value, chg, percent, color);
  }

  _blocking(kind, args) {
    return new Promise((resolve) => {
      this.pending = { kind, args, resolve };
      this.emit('blocking', kind, args);
    });
  }

  // ---- input resolution (called by input.js / ui.js) ---------------------

  submit = {
    key: (code) => this._finish('key', code),
    yesno: (ch) => this._finish('yesno', ch),
    line: (text) => {
      if (this.pending?.kind !== 'line') return;
      const bufp = this.pending.args[1];
      const M = this.Module;
      const s = text.slice(0, 255);
      if (bufp) M.stringToUTF8(s, bufp, 256);
      this._finish('line', undefined);
    },
    menu: (selected) => {
      if (this.pending?.kind !== 'menu') return;
      const menuListPtr = this.pending.args[2];
      const n = this.buildMenuResult(menuListPtr, selected);
      this._finish('menu', n);
    },
    message_menu: (ch) => this._finish('message_menu', ch),
    extcmd: (cmd) => this._finish('extcmd', cmd),
    poskey: (x, y, mod, result) => {
      if (this.pending?.kind !== 'poskey') return;
      const M = this.Module;
      const [, xPtr, yPtr, modPtr] = this.pending.args;
      M.setValue(xPtr, x, 'i16');
      M.setValue(yPtr, y, 'i16');
      M.setValue(modPtr, mod, 'i32');
      this._finish('poskey', result);
    },
  };

  _finish(kind, value) {
    if (this.pending && this.pending.kind === kind) {
      const p = this.pending;
      this.pending = null;
      p.resolve(value);
    }
  }

  // Build the menu_item array in WASM memory and return the selection count.
  buildMenuResult(menuListPtr, selectedItems) {
    const M = this.Module;
    const n = selectedItems.length;
    if (n === 0) { M.setValue(menuListPtr, 0, 'i32'); return 0; }
    const arr = M._malloc(n * 16);
    selectedItems.forEach((item, i) => {
      const b = arr + i * 16;
      M.setValue(b, item.id[0], 'i32');
      M.setValue(b + 4, item.id[1], 'i32');
      M.setValue(b + 8, 1, 'i32'); // count
      M.setValue(b + 12, item.flags || 0, 'i32'); // itemflags
    });
    M.setValue(menuListPtr, arr, 'i32');
    return n;
  }
}
