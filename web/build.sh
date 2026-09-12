#!/bin/sh
# Build the NetHack web frontend: compiles the WASM module and bundles the
# Vite site into web/dist/ (which is what gets deployed to GitHub Pages).
#
# Prerequisites:
#   - Emscripten SDK activated (source ~/emsdk/emsdk_env.sh)
#   - Node.js + npm on PATH
#
# Usage:  sh web/build.sh
set -e

TOP=$(cd "$(dirname "$0")/.." && pwd)
cd "$TOP"

# 1. Generate makefiles (idempotent) and fetch Lua if not present.
if [ ! -f src/Makefile ]; then
  (cd sys/unix && sh setup.sh hints/linux.500)
fi
if [ ! -d lib/lua-5.4.8 ]; then
  make fetch-lua
fi

# 2. Build the WASM module (targets/wasm/nethack.js + nethack.wasm).
make CROSS_TO_WASM=1 all

# 3. Stage the wasm artifacts for Vite (served from web/public).
mkdir -p web/public
cp targets/wasm/nethack.js targets/wasm/nethack.wasm web/public/

# 4. Bundle the frontend.
cd web
npm install
npm run build

echo
echo "Build complete.  Deployable site is in web/dist/"
