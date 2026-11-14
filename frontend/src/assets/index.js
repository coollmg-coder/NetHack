import { colorToHex } from './colors.js';
import {
  doorTexture,
  floorTexture,
  furnitureTexture,
  itemSprite,
  lavaTexture,
  monsterSprite,
  portraitSprite,
  stairsTexture,
  wallTexture,
  waterTexture,
} from './gfx.js';

const WALL = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 17, 18, 41, 47]);
const CLOSED_DOOR = new Set([15, 16, 44, 45]);
const WATER = new Set([38, 48]);
const LAVA = new Set([40]);
const STAIRS = new Set([25, 26, 27, 28, 29, 30, 31, 32]);
const FURNITURE = new Set([33, 34, 35, 36, 37]);

let loaded = false;
let textures = {};
let monsterBase = null;
let itemBase = null;

function terrain(type) {
  if (WALL.has(type)) {
    return { wall: textures.wall };
  }
  if (CLOSED_DOOR.has(type)) {
    return { wall: textures.door };
  }
  if (WATER.has(type)) {
    return { floor: textures.water };
  }
  if (LAVA.has(type)) {
    return { floor: textures.lava };
  }
  if (STAIRS.has(type)) {
    return { floor: textures.stairs };
  }
  if (FURNITURE.has(type)) {
    return { floor: textures.furniture };
  }
  return { floor: textures.floor };
}

function spriteFor(base, type, color) {
  return {
    sprite: base,
    scale: 1 + (type % 4) * 0.12,
    hue: colorToHex(color),
  };
}

function monster(type, color) {
  return spriteFor(monsterBase, type, color);
}

function item(type, color) {
  return spriteFor(itemBase, type, color);
}

function playerPortrait(role, race) {
  const canvas = portraitSprite();
  const hue = colorToHex((role + race) % 15);
  if (hue !== '#808080') {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = hue;
    ctx.globalAlpha = 0.15;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }
  return canvas;
}

async function load() {
  if (loaded) {
    return;
  }
  textures = {
    floor: floorTexture(),
    wall: wallTexture(),
    water: waterTexture(),
    lava: lavaTexture(),
    door: doorTexture(),
    stairs: stairsTexture(),
    furniture: furnitureTexture(),
  };
  monsterBase = monsterSprite();
  itemBase = itemSprite();
  loaded = true;
}

export const assets = {
  load,
  monster,
  item,
  playerPortrait,
  terrain,
};
