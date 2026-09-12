import { NethackBridge } from './bridge.js';
import { VoxelRenderer } from './renderer.js';
import { UI } from './ui.js';
import { Input } from './input.js';

const bridge = new NethackBridge();
const renderer = new VoxelRenderer(document.getElementById('game'));
const ui = new UI(bridge);
const input = new Input(bridge, ui);

// Renderer wiring
bridge.on('map:glyph', (x, y, info) => renderer.setCell(x, y, info));
bridge.on('map:clear', () => renderer.clearMap());
bridge.on('map:display', () => { /* full frame already streamed via map:glyph */ });

// New game / load callbacks (set by UI buttons)
ui._onNewGameCb = () => {
  const name = (document.getElementById('playername').value || '').trim();
  const argv = name ? ['nethack', '-u', name] : ['nethack'];
  start(argv);
};
ui._onLoadCb = (text) => { load(text); };

// Drag-and-drop a .nhsave text file
document.body.addEventListener('dragover', (e) => e.preventDefault());
document.body.addEventListener('drop', async (e) => {
  e.preventDefault();
  const f = e.dataTransfer?.files?.[0];
  if (!f) return;
  const text = await f.text();
  load(text);
});

async function start(argv) {
  ui.hideSplash();
  try {
    await bridge.start(argv);
  } catch (err) {
    console.error(err);
    ui._log('Failed to start: ' + err.message);
    ui.showSplash();
  }
}

async function load(text) {
  const t = (text || '').trim();
  if (!t.startsWith('NHSAVE1|')) {
    ui._log('Invalid save text.');
    ui.showSplash();
    return;
  }
  const ok = bridge.importSave(t);
  if (!ok) {
    ui._log('Failed to restore save file (wrong version?).');
    ui.showSplash();
    return;
  }
  const name = t.split('|')[1] || 'player';
  await start(['nethack', '-u', name]);
}

// Load the WASM module up front so "New Game" is fast.
bridge.load().catch((e) => {
  console.error(e);
  ui._log('Failed to load WASM module: ' + e.message);
});
