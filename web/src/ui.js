import { NHW_MESSAGE } from './bridge.js';

// Status field indices (include/botl.h) -> display label / handling.
const FIELD_LABELS = {
  0: { key: 'title', text: true },
  1: { key: 'Str' }, 2: { key: 'Dx' }, 3: { key: 'Co' },
  4: { key: 'In' }, 5: { key: 'Wi' }, 6: { key: 'Ch' },
  7: { key: 'align', text: true },
  8: { key: 'score' }, 9: { key: 'cap' }, 10: { key: 'gold' },
  11: { key: 'ene' }, 12: { key: 'enemax' }, 13: { key: 'xp' },
  14: { key: 'ac' }, 15: { key: 'hd' }, 16: { key: 'time' },
  17: { key: 'hunger' }, 18: { key: 'hp' }, 19: { key: 'hpmax' },
  20: { key: 'leveldesc', text: true }, 21: { key: 'lvl' },
  22: { key: 'cond' },
};

const HUNGER = ['', 'Satiated', '', 'Hungry', 'Weak', 'Fainting', 'Fainted', 'Starved'];

export class UI {
  constructor(bridge) {
    this.bridge = bridge;
    this.status = {};
    this.messages = [];
    this.menuState = null; // { win, how, menuListPtr, items, prompt, selected:Set }

    this.el = {
      status: document.getElementById('status'),
      messages: document.getElementById('messages'),
      promptbar: document.getElementById('promptbar'),
      promptlabel: document.getElementById('promptlabel'),
      promptinput: document.getElementById('promptinput'),
      menubar: document.getElementById('menubar'),
      menupanel: document.getElementById('menupanel'),
      splash: document.getElementById('splash'),
      savebox: document.getElementById('savebox'),
      savepanel: document.getElementById('savepanel'),
      btnNew: document.getElementById('btn-new'),
      btnLoad: document.getElementById('btn-load'),
    };

    this._bindBridge();
    this._bindSplash();
  }

  // ---- bridge events -----------------------------------------------------

  _bindBridge() {
    const b = this.bridge;
    b.on('status:init', () => { this.status = {}; });
    b.on('status:update', (field, value) => {
      const meta = FIELD_LABELS[field];
      if (!meta) return;
      this.status[meta.key] = value;
      this._renderStatus();
    });
    b.on('putstr', (winType, attr, str) => {
      if (winType === NHW_MESSAGE) this._log(str);
    });
    b.on('rawprint', (str) => this._log(str));
    b.on('bell', () => { /* could flash the window */ });
    b.on('exitmsg', (str) => { this._log(str || ''); });
    b.on('gameover', (envelope) => this._onGameOver(envelope));

    // Blocking prompts: show the right widget.
    b.on('blocking', (kind, args) => {
      switch (kind) {
        case 'askname': this._showPrompt('Your name:', (t) => this._submitName(t)); break;
        case 'yesno': this._showKeyPrompt(args[0]); break;
        case 'line': this._showPrompt(args[0], (t) => b.submit.line(t)); break;
        case 'message_menu': this._showKeyPrompt(args[2] || ''); break;
        case 'menu': this._showMenu(args); break;
        case 'extcmd': this._showExtCmd(); break;
        default: break;
      }
    });
  }

  _bindSplash() {
    this.el.btnNew.addEventListener('click', () => {
      this.hideSplash();
      this._onNewGame();
    });
    this.el.btnLoad.addEventListener('click', () => this._showLoadBox());
    this.el.promptinput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._submitPrompt();
      if (e.key === 'Escape') { this.hidePrompt(); this._cancelPrompt(); }
    });
  }

  // ---- prompt / input ----------------------------------------------------

  _showPrompt(label, onSubmit) {
    this._promptOnSubmit = onSubmit;
    this.el.promptlabel.textContent = label;
    this.el.promptinput.value = '';
    this.el.promptinput.style.display = '';
    this.el.promptbar.style.display = 'flex';
    this.el.promptinput.focus();
  }

  // Show a prompt that only expects a single keypress (yes/no, message menu).
  _showKeyPrompt(text) {
    this._promptOnSubmit = null;
    this.el.promptlabel.textContent = text || '';
    this.el.promptinput.style.display = 'none';
    this.el.promptbar.style.display = 'flex';
  }

  hidePrompt() {
    this.el.promptbar.style.display = 'none';
    this._promptOnSubmit = null;
  }

  _submitPrompt() {
    const t = this.el.promptinput.value;
    const cb = this._promptOnSubmit;
    this.hidePrompt();
    if (cb) cb(t);
  }

  _cancelPrompt() {
    const b = this.bridge;
    const p = b.pending;
    if (!p) return;
    if (p.kind === 'yesno') b.submit.yesno('n'.charCodeAt(0));
    else if (p.kind === 'line') b.submit.line('');
    else if (p.kind === 'message_menu') b.submit.message_menu(0);
    else if (p.kind === 'askname') this._submitName('');
  }

  _submitName(name) {
    const b = this.bridge;
    // Write the player name into the C global (svp.plname) exposed by the shim.
    const g = globalThis.nethackGlobal;
    if (g && g.globals && g.globals['svp.plname'] !== undefined) {
      g.globals['svp.plname'] = (name || '').slice(0, 31);
    }
    b._finish('askname', undefined);
  }

  // ---- menu --------------------------------------------------------------

  _showMenu(args) {
    const [win, how, menuListPtr] = args;
    const b = this.bridge;
    const menu = b.menus.get(win);
    if (!menu) { b.submit.menu([]); return; }
    this.menuState = { win, how, menuListPtr, ...menu, selected: new Set() };
    this._renderMenu();
  }

  _renderMenu() {
    const s = this.menuState;
    const panel = this.el.menupanel;
    let html = `<div class="title">${this._esc(s.prompt || '')}</div>`;
    s.items.forEach((item, i) => {
      const sel = s.selected.has(i) ? ' selected' : '';
      const accel = item.gch ? ` <span class="accel">[${this._esc(String.fromCharCode(item.gch))}]</span>` : '';
      html += `<div class="item${sel}" data-i="${i}">${this._esc(item.str)}${accel}</div>`;
    });
    html += `<div class="hint">${this._menuHint()}</div>`;
    panel.innerHTML = html;
    this.el.menubar.style.display = 'flex';

    panel.querySelectorAll('.item').forEach((node) => {
      node.addEventListener('click', () => this._menuPick(parseInt(node.dataset.i, 10)));
    });
  }

  _menuHint() {
    const s = this.menuState;
    if (s.how === 1) return 'Click or press a letter to select. Esc to cancel.';
    if (s.how === 2) return 'Click to toggle. Enter to confirm. Esc to cancel.';
    return 'Press a key to continue.';
  }

  _menuPick(i) {
    const s = this.menuState;
    const b = this.bridge;
    if (s.how === 1) { // PICK_ONE
      b.submit.menu([s.items[i]]);
      this._closeMenu();
    } else if (s.how === 2) { // PICK_ANY
      if (s.selected.has(i)) s.selected.delete(i); else s.selected.add(i);
      this._renderMenu();
    } else { // PICK_NONE
      b.submit.menu([]);
      this._closeMenu();
    }
  }

  menuKey(e) {
    const s = this.menuState;
    if (!s) return;
    const b = this.bridge;
    if (e.key === 'Escape') {
      e.preventDefault();
      b.submit.menu(s.how === 2 ? [] : []);
      this._closeMenu();
      return;
    }
    if (s.how === 0) { // PICK_NONE: any key dismisses
      e.preventDefault();
      b.submit.menu([]);
      this._closeMenu();
      return;
    }
    if (e.key === 'Enter' && s.how === 2) {
      e.preventDefault();
      const sel = s.items.filter((_, i) => s.selected.has(i));
      b.submit.menu(sel);
      this._closeMenu();
      return;
    }
    // letter selection
    const code = e.key.length === 1 ? e.key.charCodeAt(0) : 0;
    const idx = s.items.findIndex((it) => it.ch === code);
    if (idx >= 0) { e.preventDefault(); this._menuPick(idx); }
  }

  _closeMenu() {
    this.menuState = null;
    this.el.menubar.style.display = 'none';
  }

  _showExtCmd() {
    const b = this.bridge;
    const cmds = b.readExtCmdList();
    if (!cmds.length) { b.submit.extcmd(0); return; }
    const panel = this.el.menupanel;
    let html = `<div class="title">Extended command (#)</div>`;
    cmds.forEach((c) => {
      html += `<div class="item" data-c="${c.index}">#${this._esc(c.name)}</div>`;
    });
    panel.innerHTML = html;
    this.el.menubar.style.display = 'flex';
    panel.querySelectorAll('.item').forEach((node) => {
      node.addEventListener('click', () => {
        b.submit.extcmd(parseInt(node.dataset.c, 10));
        this.el.menubar.style.display = 'none';
      });
    });
  }

  // ---- status HUD --------------------------------------------------------

  _renderStatus() {
    const s = this.status;
    const title = s.title || '';
    const attrs = ['Str', 'Dx', 'Co', 'In', 'Wi', 'Ch'].map((k) => `${k}:${s[k] ?? ''}`).join(' ');
    const hp = `${s.hp ?? '?'}/${s.hpmax ?? '?'}`;
    const pw = `${s.ene ?? '?'}`;
    const parts = [];
    if (title) parts.push(`<b>${this._esc(title)}</b>`);
    parts.push(attrs);
    parts.push(`HP:${hp}`, `Pw:${pw}`, `AC:${s.ac ?? '?'}`, `Xp:${s.lvl ?? ''}/${s.xp ?? ''}`);
    if (s.gold !== undefined) parts.push(`$${s.gold}`);
    if (s.leveldesc) parts.push(`<b>${this._esc(s.leveldesc)}</b>`);
    if (s.hunger > 1) parts.push(HUNGER[s.hunger] || '');
    this.el.status.innerHTML = parts.map((p) => `<span>${p}</span>`).join('');
  }

  _log(text) {
    if (!text) return;
    this.messages.push(text);
    if (this.messages.length > 6) this.messages.shift();
    this.el.messages.innerHTML = this.messages
      .map((m) => `<div class="msg-line">${this._esc(m)}</div>`).join('');
  }

  _esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  // ---- splash / save box -------------------------------------------------

  hideSplash() { this.el.splash.classList.add('hidden'); }
  showSplash() { this.el.splash.classList.remove('hidden'); }

  _onNewGame() {
    this._onNewGameCb?.();
  }

  _showLoadBox() {
    this._showSavePanel('load', (text) => this._onLoadCb?.(text));
  }

  _onGameOver(envelope) {
    if (!envelope) { this.showSplash(); return; }
    this._showSavePanel('save', null, envelope);
  }

  _showSavePanel(mode, onLoad, envelope) {
    const panel = this.el.savepanel;
    let html = '';
    if (mode === 'save') {
      html = `<div class="title">Game saved</div>
        <p>Your save file is ready. Download it (default) or copy it to the clipboard.</p>
        <textarea readonly id="savetext"></textarea>
        <div class="row">
          <button id="btn-dl">Download .nhsave</button>
          <button id="btn-copy">Copy to clipboard</button>
          <button id="btn-close-save">Close</button>
        </div>`;
    } else {
      html = `<div class="title">Load game</div>
        <p>Paste a save-file text (or drop a .nhsave file) below:</p>
        <textarea id="loadtext"></textarea>
        <div class="row">
          <button id="btn-do-load">Load</button>
          <button id="btn-close-save">Cancel</button>
        </div>`;
    }
    panel.innerHTML = html;
    this.el.savebox.style.display = 'flex';

    if (mode === 'save') {
      const ta = document.getElementById('savetext');
      ta.value = envelope;
      ta.addEventListener('click', () => ta.select());
      document.getElementById('btn-dl').addEventListener('click', () => {
        const blob = new Blob([envelope], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'nethack.nhsave';
        a.click();
        URL.revokeObjectURL(a.href);
      });
      document.getElementById('btn-copy').addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(envelope);
          document.getElementById('btn-copy').textContent = 'Copied!';
        } catch { /* clipboard unavailable */ }
      });
      document.getElementById('btn-close-save').addEventListener('click', () => {
        this.el.savebox.style.display = 'none';
        this.showSplash();
      });
    } else {
      const ta = document.getElementById('loadtext');
      document.getElementById('btn-do-load').addEventListener('click', () => {
        this.el.savebox.style.display = 'none';
        if (onLoad) onLoad(ta.value);
      });
      document.getElementById('btn-close-save').addEventListener('click', () => {
        this.el.savebox.style.display = 'none';
      });
    }
  }
}
