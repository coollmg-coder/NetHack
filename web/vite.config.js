import { defineConfig } from 'vite';

// GitHub Pages serves the site from a project subdirectory (or a custom
// domain), so every asset path must be relative.  Vite's `base: './'` makes
// the emitted index.html reference ./assets/... so the page works from any
// subpath.
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    // The wasm files live next to the bundle; do not inline them.
    assetsInlineLimit: 0,
  },
});
