const WALL = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 17, 18, 41, 47]);
const CLOSED_DOOR = new Set([15, 16, 44, 45]);
const WATER = new Set([38, 48]);
const LAVA = new Set([40]);
const STAIRS = new Set([25, 26, 27, 28, 29, 30, 31, 32]);

export function terrainColor(type) {
  if (WALL.has(type)) {
    return '#56504a';
  }
  if (CLOSED_DOOR.has(type)) {
    return '#8a6a35';
  }
  if (WATER.has(type)) {
    return '#234a8a';
  }
  if (LAVA.has(type)) {
    return '#a3351f';
  }
  if (STAIRS.has(type)) {
    return '#c8b020';
  }
  return '#2a2a2a';
}

export function renderMinimap(canvas, runtime) {
  const ng = globalThis.nethackGlobal;
  const map = ng && ng.constants ? ng.constants.MAP : {};
  const COLNO = map.COLNO || 80;
  const ROWNO = map.ROWNO || 21;
  const tile = 4;

  canvas.width = COLNO * tile;
  canvas.height = ROWNO * tile;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let x = 1; x < COLNO; x++) {
    for (let y = 0; y < ROWNO; y++) {
      if (!runtime.isExplored(x, y)) {
        continue;
      }
      ctx.fillStyle = terrainColor(runtime.getTerrain(x, y));
      ctx.fillRect(x * tile, y * tile, tile, tile);
    }
  }

  const hero = runtime.getHero();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(hero.x * tile, hero.y * tile, tile, tile);

  const direction = facingToDirection(runtime.state.get('facing') ?? 0);
  const cx = (hero.x + 0.5) * tile;
  const cy = (hero.y + 0.5) * tile;
  ctx.strokeStyle = '#ff4040';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + direction.x * tile * 2, cy + direction.z * tile * 2);
  ctx.stroke();
}

function facingToDirection(facing) {
  const angle = (facing % 8) * (Math.PI / 4);
  return { x: Math.sin(angle), z: -Math.cos(angle) };
}
