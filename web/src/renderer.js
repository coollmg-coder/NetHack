import * as THREE from 'three';
import { classifyGlyph } from './glyphs.js';
import { getGlyphConstants, colorHex } from './constants.js';

const COLS = 80;
const ROWS = 21;
const CELL = 1.0;

const WALL_HEIGHT = 1.1;
const FLOOR_H = 0.12;
const CONTENT_H = 0.7;
const EYE_HEIGHT = 0.62;

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
    this.facing = new THREE.Vector3(0, 0, 1); // world-space facing (north)
    this._lookPoint = new THREE.Vector3(0, EYE_HEIGHT, 6);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05050a);

    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;
    this.camera = new THREE.PerspectiveCamera(75, w / h, 0.05, 500);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    container.appendChild(this.renderer.domElement);

    // Lights
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dir = new THREE.DirectionalLight(0xffffff, 0.5);
    dir.position.set(10, 20, 10);
    this.scene.add(dir);

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Shared geometries
    this.geoFloor = new THREE.BoxGeometry(CELL, FLOOR_H, CELL);
    this.geoWall = new THREE.BoxGeometry(CELL, WALL_HEIGHT, CELL);
    this.geoContent = new THREE.BoxGeometry(0.6, CONTENT_H, 0.6);

    this._buildStaticFloor();

    window.addEventListener('resize', () => this._resize());
    this._loop();
  }

  // A faint full-grid base slab so empty areas are visible.
  _buildStaticFloor() {
    const geo = new THREE.BoxGeometry(COLS * CELL, 0.05, ROWS * CELL);
    const mat = new THREE.MeshLambertMaterial({ color: 0x0d0f14 });
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

    // Hero tracking + facing from the most recent movement.
    if (ch === '@') {
      const dx = x - this.hero.x;
      const dy = y - this.hero.y;
      if (dx !== 0 || dy !== 0) {
        // world X grows east (+x), world Z grows north (-y)
        this.facing.set(dx, 0, -dy);
      }
      this.hero = { x, y };
    }

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
      if (kind === 'void') {
        this._setMesh(cell, 'floor', null);
      } else {
        const fm = new THREE.Mesh(this.geoFloor, this._material(color));
        fm.position.copy(this._cellToWorld(x, y, FLOOR_H / 2));
        this._setMesh(cell, 'floor', fm);
      }
    }

    // Content. The hero '@' is skipped (first-person: no self mesh); other
    // monsters/objects/stairs markers are rendered standing on the floor.
    if (ch === '@') {
      this._setMesh(cell, 'content', null);
    } else if (isContent || ch === '<' || ch === '>' || ch === '^') {
      const cm = new THREE.Mesh(this.geoContent, this._material(color));
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

    const eye = this._cellToWorld(this.hero.x, this.hero.y, EYE_HEIGHT);
    const look = eye.clone().addScaledVector(this.facing, 8);

    // Smooth the eye position and look point for a nicer feel.
    this.camera.position.lerp(eye, 0.3);
    this._lookPoint.lerp(look, 0.25);
    this.camera.lookAt(this._lookPoint);

    this.renderer.render(this.scene, this.camera);
  }
}
