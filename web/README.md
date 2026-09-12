# NetHack Web (3D voxel frontend)

A browser frontend for NetHack 5.0. It compiles the engine to WebAssembly
via the existing `shim` window port and renders the dungeon as a Three.js
voxel scene. Saves are compressed (zlib) and base64-encoded into a text
string the user can download or copy — no server required, so it works on a
static host like GitHub Pages.

## Layout

```
web/
  index.html        entry page
  src/
    main.js         wiring
    bridge.js       WASM shim -> UI bridge (callback dispatch, input, save API)
    renderer.js     Three.js voxel renderer
    glyphs.js       glyph classification
    constants.js    color/glyph constants
    input.js        keyboard -> NetHack keys
    ui.js           HUD, messages, menus, prompts, save/load dialogs
  public/           nethack.js + nethack.wasm (copied by build.sh; not committed)
  build.sh          full local build
```

## Building locally

1. Install the [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html)
   and activate it: `source ~/emsdk/emsdk_env.sh`.
2. Install Node.js 20+.
3. Run:

   ```sh
   sh web/build.sh
   ```

This produces the deployable site in `web/dist/`. To preview it:

```sh
cd web && npx vite preview --port 4173
```

## Publishing to GitHub Pages

The repo (coollmg-coder/NetHack) includes a GitHub Actions workflow at
`.github/workflows/pages.yml` that builds the WASM module and the frontend on
every push to `NetHack-5.0` and deploys `web/dist/` to GitHub Pages.

### One-time setup (after pushing the code)

1. Push the code (the workflow file, web sources, and the C changes).
2. On GitHub, open **Settings → Pages**.
   - **Source**: *GitHub Actions*.
3. Trigger the workflow (a push to `NetHack-5.0`, or **Actions →
   "Build and deploy to GitHub Pages" → Run workflow**).
4. When the `deploy` job finishes, the site is live at:

   ```
   https://coollmg-coder.github.io/NetHack/
   ```

   (or `https://coollmg-coder.github.io/` if you later move it to a
   `coollmg-coder.github.io` user-pages repo).

### Notes

- The build needs Emscripten (3.1.74) and fetches the Lua 5.4.8 tarball, so
  the first CI run takes a few minutes. Later runs are cached.
- Saves are text strings. "Load from text" (or dropping a `.nhsave` file)
  restores a game; "New Game" starts fresh. After saving, download the
  `.nhsave` file (default) or copy the string to the clipboard.
- Saved games are version-checked by `EDITLEVEL`; an incompatible save is
  rejected.

## Controls

- Movement: `h j k l y u b n` (and the arrow keys / Home-PgUp-PgDn-End).
- Commands use the standard NetHack keys (`S` save, `d` drop, `i` inventory,
  `#` extended commands, etc.).
- Menus are clickable; letters and arrow navigation also work.
