import './style.css';
import { input } from './input/index.js';
import { runtime } from './runtime/index.js';

runtime.onMessage((message) => console.log('[nethack]', message));
runtime.onStatus((status) => console.log('[status]', status));
runtime.onMenu((menu) => console.log('[menu]', menu));
runtime.onYesNo((question) => console.log('[yes/no]', question));
runtime.onTurnChange(() => console.log('[turn]', runtime.getTurn()));

runtime.init();
input.attach();
