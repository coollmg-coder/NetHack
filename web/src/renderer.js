import * as THREE from 'three';
import { classifyGlyph, isWallChar } from './glyphs.js';
import { getGlyphConstants, colorHex } from './constants.js';

const COLS = 80;
const ROWS = 21;
const CELL = 1.0;

const WALL_HEIGHT = 0.9;
const FLOOR_H = 0.12;
const CONTENT_H = 0.45;

// NetHack symbol -> terrain kind
function terrainKind(ch) {
  switch (ch) {
    case ' ': return 'void';
    case '|': case '-': case '\\': return 'wall';
    case '+': return 'door';
    case '#': return 'corridor';
    case '.': return 'floor';
    case '<': case '>': return 'stairs';
    case '}': return 'lavawall';
    case '~': return 'water';
    case '^': return 'trap';
    case '_': return 'altar';
    case '{': return 'fountain';
    default: return 'floor';
  }
}

export class VoxelRenderer {
  constructor(container) {
    this.container = container;
    this.cells = new Map(); // "x,y" -> { kind, color, content }
    this.hero = { x: 40, y: 11 };
    this.ready = false;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0b0f);

    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;
    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 500);
    this.camera.position.set(0, 26, 22);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    container.appendChild(this.renderer.domElement);

    // Lights (Lambert/Standard materials need them)
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(10, 30, 10);
    this.scene.add(dir);

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Shared geometries
    this.geoFloor = new THREE.BoxGeometry(CELL, FLOOR_H, CELL);
    this.geoWall = new THREE.BoxGeometry(CELL, WALL_HEIGHT, CELL);
    this.geoContent = new THREE.BoxGeometry(0.55, CONTENT_H, 0.55);

    this._buildStaticFloor();

    window.addEventListener('resize', () => this._resize());
    this._loop();
  }

  // A faint full-grid base slab so empty areas are visible.
  _buildStaticFloor() {
    const geo = new THREE.BoxGeometry(COLS * CELL, 0.05, ROWS * CELL);
    const mat = new THREE.MeshLambertMaterial({ color: 0x111318 });
    const slab = new THREE.Mesh(geo, mat);
    slab.position.set(0, -0.04, 0);
    this.scene.add(slab);
  }

  _cellToWorld(x, y, cy) {
    return new THREE.Vector3(
      (x - 1 - COLS / 2) * CELL,
      cy,
      (ROWS / 2 - y) * CELL,
    );
  }

  _key(x, y) { return `${x},${y}`; }

  _material(color) {
    return new THREE.MeshLambertMaterial({ color });
  }

  _setMesh(cell, name, mesh) {
    if (cell[name]) { this.group.remove(cell[name]); cell[name].geometry.dispose(); cell[name].material.dispose(); }
    cell[name] = mesh;
    if (mesh) this.group.add(mesh);
  }

  setCell(x, y, info) {
    let G;
    try { G = getGlyphConstants(); } catch { return; }

    const category = classifyGlyph(info.glyph, G);
    const ch = String.fromCharCode(info.ttychar);
    const color = colorHex(info.color);

    // Hero tracking
    if (ch === '@') this.hero = { x, y };

    const key = this._key(x, y);
    let cell = this.cells.get(key);
    if (!cell) { cell = {}; this.cells.set(key, cell); }

    const isContent = category === 'monster' || category === 'pet' ||
      category === 'ridden' || category === 'statue' || category === 'object' ||
      category === 'invisible' || category === 'detect' || category === 'body';

    // Terrain (only for non-content glyphs)
    if (category === 'terrain') {
      const kind = terrainKind(ch);
      cell.kind = kind;
      if (kind === 'wall' || kind === 'door' || kind === 'lavawall') {
        const wm = new THREE.Mesh(this.geoWall, this._material(color));
        wm.position.copy(this._cellToWorld(x, y, WALL_HEIGHT / 2));
        this._setMesh(cell, 'wall', wm);
        this._setMesh(cell, 'content', null);
      } else {
        this._setMesh(cell, 'wall', null);
      }
      // floor (water/lava get tinted)
      if (kind === 'void') {
        this._setMesh(cell, 'floor', null);
      } else {
        const fm = new THREE.Mesh(this.geoFloor, this._material(color));
        fm.position.copy(this._cellToWorld(x, y, FLOOR_H / 2));
        this._setMesh(cell, 'floor', fm);
      }
    }

    // Content (monster/object/hero/stairs marker) rendered as a colored block
    if (isContent || ch === '<' || ch === '>' || ch === '^') {      const cm = new THREE.Mesh(this.geoContent, this._material(color));
      cm.position.copy(this._cellToWorld(x, y, CONTENT_H / 2 + FLOOR_H));
      this._setMesh(cell, 'content', cm);
    } else if (category === 'terrain') {
      this._setMesh(cell, 'content', null);
    }
  }

  clearMap() {
    for (const cell of this.cells.values()) {
      this._setMesh(cell, 'floor', null);
      this._setMesh(cell, 'wall', null);
      this._setMesh(cell, 'content', null);
    }
    this.cells.clear();
  }

  _resize() {
    const w = this.container.clientWidth || 800;
    const h = this.container.clientHeight || 600;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  _loop() {
    requestAnimationFrame(() => this._loop());
    // Smooth camera follow of the hero.
    const target = this._cellToWorld(this.hero.x, this.hero.y, 0);
    const camTarget = target.clone().add(new THREE.Vector3(0, 0, 12));
    this.camera.position.lerp(
      new THREE.Vector3(camTarget.x, 26, camTarget.z), 0.06);
    this.camera.lookAt(target.x, 0, target.z);
    this.renderer.render(this.scene, this.camera);
  }
}
