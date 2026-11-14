import './ui.css';
import { assets } from '../assets/index.js';
import { runtime } from '../runtime/index.js';
import { renderMinimap } from './minimap.js';
import { createStatusStore, fieldLabel } from './status.js';

const statusStore = createStatusStore();

let overlayEl = null;
let minimapCanvas = null;
let minimapContainer = null;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

function heroRoleRace() {
  const ng = globalThis.nethackGlobal;
  const flags = ng && ng.globals ? ng.globals.flags : null;
  return {
    role: flags ? Number(flags.initrole) || 0 : 0,
    race: flags ? Number(flags.initrace) || 0 : 0,
  };
}

function buildPlayerPanel() {
  const panel = document.querySelector('#player-panel');
  panel.replaceChildren();

  const portraitWrap = el('div', 'portrait');
  const portrait = assets.playerPortrait(
    heroRoleRace().role,
    heroRoleRace().race,
  );
  portraitWrap.appendChild(portrait);
  panel.appendChild(portraitWrap);

  const statEls = new Map();
  const rows = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 10, 14],
    ['hp', 13, 20],
  ];
  for (const row of rows) {
    const rowEl = el('div');
    for (const key of row) {
      const stat = el('div', 'stat');
      const label = el('span', 'label', key === 'hp' ? 'HP' : fieldLabel(key));
      const value = el('span', 'value', '');
      stat.append(label, value);
      rowEl.appendChild(stat);
      statEls.set(key, value);
    }
    panel.appendChild(rowEl);
  }

  return statEls;
}

function renderStats(statEls) {
  const hp = statusStore.get(18) ?? '';
  const hpMax = statusStore.get(19) ?? '';
  for (const [key, node] of statEls.entries()) {
    if (key === 'hp') {
      node.textContent = `${hp}/${hpMax}`;
    } else {
      node.textContent = statusStore.get(key) ?? '';
    }
  }
}

function buildActionPanel() {
  const panel = document.querySelector('#action-panel');
  panel.replaceChildren();

  const actions = [
    ['Inventory', 'i'],
    ['Save', 'S'],
    ['Quit', '#'],
  ];
  for (const [label, command] of actions) {
    const button = el('button', null, label);
    button.addEventListener('click', () => runtime.sendCommand(command));
    panel.appendChild(button);
  }

  const minimapButton = el('button', null, 'Minimap');
  minimapButton.addEventListener('click', () => {
    runtime.state.set('minimapOn', !runtime.state.get('minimapOn'));
  });
  panel.appendChild(minimapButton);
}

function buildLogPanel() {
  const panel = document.querySelector('#log-panel');
  panel.replaceChildren();
  return panel;
}

function appendLog(panel, message) {
  const entry = el('div', 'entry', message);
  panel.appendChild(entry);
  panel.scrollTop = panel.scrollHeight;
}

function ensureOverlay() {
  if (!overlayEl) {
    overlayEl = el('div', 'overlay');
    overlayEl.style.display = 'none';
    document.body.appendChild(overlayEl);
  }
  return overlayEl;
}

function showOverlay(box) {
  const overlay = ensureOverlay();
  overlay.replaceChildren(box);
  overlay.style.display = 'flex';
}

function hideOverlay() {
  if (overlayEl) {
    overlayEl.style.display = 'none';
    overlayEl.replaceChildren();
  }
}

function showMenu(menu) {
  const box = el('div', 'box');
  if (menu.prompt) {
    box.appendChild(el('div', 'title', menu.prompt));
  }
  menu.items.forEach((item, index) => {
    const button = el('button', 'item', item.text || `[${index}]`);
    button.addEventListener('click', () => {
      hideOverlay();
      runtime.answerMenu(index);
    });
    box.appendChild(button);
  });
  if (menu.how === 0) {
    const dismiss = el('button', 'item', 'Dismiss');
    dismiss.addEventListener('click', () => {
      hideOverlay();
      runtime.answerMenu(-1);
    });
    box.appendChild(dismiss);
  }
  showOverlay(box);
}

function showYesNo(question) {
  const box = el('div', 'box');
  box.appendChild(el('div', 'title', question.query || ''));
  const actions = el('div', 'actions');
  const choices = question.choices || 'yn';
  for (const ch of choices) {
    const label = ch === 'y' ? 'Yes' : ch === 'n' ? 'No' : ch;
    const button = el('button', null, label);
    button.addEventListener('click', () => {
      hideOverlay();
      runtime.answerYesNo(ch);
    });
    actions.appendChild(button);
  }
  box.appendChild(actions);
  showOverlay(box);
}

function showGetLine(question) {
  const box = el('div', 'box');
  box.appendChild(el('div', 'title', question.query || ''));
  const input = el('input');
  input.type = 'text';
  const actions = el('div', 'actions');
  const submit = el('button', null, 'OK');
  submit.addEventListener('click', () => {
    hideOverlay();
    runtime.replyString(input.value);
  });
  actions.appendChild(submit);
  box.append(input, actions);
  showOverlay(box);
  input.focus();
}

function buildMinimap() {
  minimapContainer = document.querySelector('#minimap');
  minimapCanvas = document.createElement('canvas');
  minimapContainer.appendChild(minimapCanvas);
}

function updateMinimap() {
  if (runtime.state.get('minimapOn')) {
    renderMinimap(minimapCanvas, runtime);
  }
}

export function init() {
  const statEls = buildPlayerPanel();
  buildActionPanel();
  const logPanel = buildLogPanel();
  buildMinimap();

  runtime.onStatus((status) => {
    statusStore.update(status.field, status.value);
    renderStats(statEls);
  });
  runtime.onMessage((message) => appendLog(logPanel, message));
  runtime.onMenu(showMenu);
  runtime.onYesNo(showYesNo);
  runtime.onGetLine(showGetLine);
  runtime.onTurnChange(updateMinimap);

  runtime.state.on('minimapOn', (on) => {
    minimapContainer.style.display = on ? 'block' : 'none';
    if (on) {
      updateMinimap();
    }
  });
  runtime.state.on('facing', updateMinimap);
}

export const ui = { init };
