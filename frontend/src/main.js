import './style.css';
import { input } from './input/index.js';
import { renderer } from './renderer/index.js';
import { runtime } from './runtime/index.js';
import { ui } from './ui/index.js';

runtime.init().then(() => {
  renderer.init(document.querySelector('#main-view'));
});
input.attach();
ui.init();
