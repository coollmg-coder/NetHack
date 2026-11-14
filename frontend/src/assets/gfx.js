export function makeCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function noiseGrid(ctx, size, cell, palette) {
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      const shade = palette[(x / cell + y / cell) % palette.length];
      ctx.fillStyle = shade;
      ctx.fillRect(x, y, cell, cell);
    }
  }
}

export function floorTexture(size = 64) {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  noiseGrid(ctx, size, 8, ['#202020', '#262626', '#1c1c1c', '#222222']);
  return canvas;
}

export function wallTexture(size = 64) {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#5a4632';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#3a2d20';
  ctx.lineWidth = 2;
  for (let y = 0; y < size; y += 16) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
    for (let x = y % 32; x < size; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 16);
      ctx.stroke();
    }
  }
  return canvas;
}

export function waterTexture(size = 64) {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1a3f6b';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#2c5d94';
  ctx.lineWidth = 2;
  for (let y = 8; y < size; y += 12) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(size / 3, y - 6, (2 * size) / 3, y + 6, size, y);
    ctx.stroke();
  }
  return canvas;
}

export function lavaTexture(size = 64) {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#a02800';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#ff5000';
  for (let i = 0; i < 6; i++) {
    const x = (i * 13) % size;
    const y = (i * 23) % size;
    ctx.beginPath();
    ctx.arc(x, y, 6 + (i % 3) * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  return canvas;
}

export function doorTexture(size = 64) {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#6b4a24';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#4a3014';
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, size - 8, size - 8);
  ctx.beginPath();
  ctx.moveTo(size / 2, 4);
  ctx.lineTo(size / 2, size - 4);
  ctx.stroke();
  ctx.fillStyle = '#c09050';
  ctx.fillRect(size / 2 - 4, size / 2 - 2, 8, 4);
  return canvas;
}

export function stairsTexture(size = 64) {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  noiseGrid(ctx, size, 16, ['#3a3a3a', '#444444']);
  ctx.strokeStyle = '#888888';
  ctx.lineWidth = 2;
  for (let y = 8; y < size; y += 16) {
    ctx.beginPath();
    ctx.moveTo(8, y);
    ctx.lineTo(size - 8, y);
    ctx.stroke();
  }
  return canvas;
}

export function furnitureTexture(size = 64) {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  noiseGrid(ctx, size, 8, ['#303030', '#2a2a2a']);
  ctx.fillStyle = '#606060';
  ctx.fillRect(size / 4, size / 4, size / 2, size / 2);
  return canvas;
}

export function monsterSprite(size = 64) {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.3, size * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(size / 2, size * 0.5);
  ctx.lineTo(size * 0.2, size * 0.95);
  ctx.lineTo(size * 0.8, size * 0.95);
  ctx.closePath();
  ctx.fill();
  return canvas;
}

export function itemSprite(size = 64) {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(size / 2, size * 0.1);
  ctx.lineTo(size * 0.9, size / 2);
  ctx.lineTo(size / 2, size * 0.9);
  ctx.lineTo(size * 0.1, size / 2);
  ctx.closePath();
  ctx.fill();
  return canvas;
}

export function portraitSprite(size = 64) {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#c8a080';
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.45, size * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#202020';
  ctx.beginPath();
  ctx.arc(size * 0.38, size * 0.42, size * 0.05, 0, Math.PI * 2);
  ctx.arc(size * 0.62, size * 0.42, size * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.55, size * 0.12, 0, Math.PI);
  ctx.fill();
  return canvas;
}
