import * as THREE from 'three';
import { assets } from '../assets/index.js';
import { runtime } from '../runtime/index.js';
import { facingToDirection } from './geometry.js';

const CAMERA_HEIGHT = 0.8;
const WALL_HEIGHT = 1.6;
const SPRITE_HEIGHT = 0.8;

const NEIGHBORS = [
  { dx: 0, dy: -1, x: 0, z: -0.5, rotY: 0 },
  { dx: 0, dy: 1, x: 0, z: 0.5, rotY: Math.PI },
  { dx: 1, dy: 0, x: 0.5, z: 0, rotY: -Math.PI / 2 },
  { dx: -1, dy: 0, x: -0.5, z: 0, rotY: Math.PI / 2 },
];

let container = null;
let scene = null;
let camera = null;
let glRenderer = null;
let terrainGroup = null;
let spriteGroup = null;
let ready = false;
const textureCache = new Map();

function mapSize() {
  const ng = globalThis.nethackGlobal;
  const map = ng && ng.constants ? ng.constants.MAP : {};
  return { COLNO: map.COLNO || 80, ROWNO: map.ROWNO || 21 };
}

function getTexture(canvas) {
  if (!textureCache.has(canvas)) {
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    textureCache.set(canvas, texture);
  }
  return textureCache.get(canvas);
}

function clearGroup(group) {
  while (group.children.length > 0) {
    const child = group.children.pop();
    child.geometry && child.geometry.dispose();
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    materials.forEach((m) => m && m.dispose());
  }
}

function buildFloor(x, y) {
  const asset = assets.terrain(runtime.getTerrain(x, y));
  if (!asset.floor) {
    return null;
  }
  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.MeshBasicMaterial({
    map: getTexture(asset.floor),
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0, y);
  return mesh;
}

function buildWall(nx, ny, px, pz, rotY) {
  let wallCanvas = null;
  if (runtime.isSeen(nx, ny)) {
    wallCanvas = assets.terrain(runtime.getTerrain(nx, ny)).wall;
  }
  if (!wallCanvas) {
    wallCanvas = assets.terrain(0).wall;
  }
  const geometry = new THREE.PlaneGeometry(1, WALL_HEIGHT);
  const material = new THREE.MeshBasicMaterial({
    map: getTexture(wallCanvas),
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.y = rotY;
  mesh.position.set(px, WALL_HEIGHT / 2, pz);
  return mesh;
}

function isBlocked(x, y) {
  if (!runtime.isSeen(x, y)) {
    return true;
  }
  return Boolean(assets.terrain(runtime.getTerrain(x, y)).wall);
}

function buildTerrain() {
  const { COLNO, ROWNO } = mapSize();
  for (let x = 1; x < COLNO; x++) {
    for (let y = 0; y < ROWNO; y++) {
      if (!runtime.isSeen(x, y)) {
        continue;
      }
      const floor = buildFloor(x, y);
      if (floor) {
        terrainGroup.add(floor);
        for (const neighbor of NEIGHBORS) {
          const nx = x + neighbor.dx;
          const ny = y + neighbor.dy;
          if (isBlocked(nx, ny)) {
            const wall = buildWall(
              nx,
              ny,
              x + neighbor.x,
              y + neighbor.z,
              neighbor.rotY,
            );
            if (wall) {
              terrainGroup.add(wall);
            }
          }
        }
      }
    }
  }
}

function buildSprite(canvas, hue, scale, x, y, height) {
  const material = new THREE.SpriteMaterial({
    map: getTexture(canvas),
    color: new THREE.Color(hue),
    transparent: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.set(x, height, y);
  sprite.scale.set(scale, scale, 1);
  return sprite;
}

function buildSprites() {
  for (const monster of runtime.getMonsters()) {
    if (!monster.visible) {
      continue;
    }
    const asset = assets.monster(monster.type, monster.color);
    spriteGroup.add(
      buildSprite(
        asset.sprite,
        asset.hue,
        asset.scale,
        monster.x,
        monster.y,
        SPRITE_HEIGHT,
      ),
    );
  }
  for (const item of runtime.getItems()) {
    if (!runtime.isSeen(item.x, item.y)) {
      continue;
    }
    const asset = assets.item(item.type, item.color);
    spriteGroup.add(
      buildSprite(
        asset.sprite,
        asset.hue,
        asset.scale * 0.6,
        item.x,
        item.y,
        SPRITE_HEIGHT * 0.5,
      ),
    );
  }
}

function updateCamera() {
  const hero = runtime.getHero();
  const direction = facingToDirection(runtime.state.get('facing') ?? 0);
  camera.position.set(hero.x, CAMERA_HEIGHT, hero.y);
  camera.lookAt(
    hero.x + direction.x,
    CAMERA_HEIGHT,
    hero.y + direction.z,
  );
}

function render() {
  glRenderer.render(scene, camera);
}

function rebuild() {
  clearGroup(terrainGroup);
  clearGroup(spriteGroup);
  buildTerrain();
  buildSprites();
  updateCamera();
  render();
}

function resize() {
  const width = container.clientWidth || 1;
  const height = container.clientHeight || 1;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  glRenderer.setSize(width, height);
  render();
}

async function init(target) {
  if (ready) {
    return;
  }
  container = target;
  await assets.load();

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);

  glRenderer = new THREE.WebGLRenderer({ antialias: true });
  glRenderer.setPixelRatio(window.devicePixelRatio || 1);
  glRenderer.domElement.style.width = '100%';
  glRenderer.domElement.style.height = '100%';
  glRenderer.domElement.style.display = 'block';
  container.appendChild(glRenderer.domElement);

  terrainGroup = new THREE.Group();
  spriteGroup = new THREE.Group();
  scene.add(terrainGroup, spriteGroup);

  runtime.onTurnChange(rebuild);
  runtime.state.on('facing', updateCamera);
  window.addEventListener('resize', resize);

  ready = true;
  resize();
  rebuild();
}

export const renderer = { init };
