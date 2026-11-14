import { describe, expect, it, beforeAll } from 'vitest';
import { assets } from './index.js';

function mockContext() {
  return new Proxy(
    {},
    {
      get(target, prop) {
        if (prop in target) {
          return target[prop];
        }
        return () => {};
      },
      set(target, prop, value) {
        target[prop] = value;
        return true;
      },
    },
  );
}

function mockCanvas() {
  return {
    width: 0,
    height: 0,
    getContext: () => mockContext(),
  };
}

beforeAll(async () => {
  globalThis.document = {
    createElement: () => mockCanvas(),
  };
  await assets.load();
});

describe('assets', () => {
  it('maps terrain identifiers to wall or floor textures', () => {
    expect(assets.terrain(1)).toHaveProperty('wall');
    expect(assets.terrain(19)).toHaveProperty('floor');
    expect(assets.terrain(38)).toHaveProperty('floor');
    expect(assets.terrain(15)).toHaveProperty('wall');
  });

  it('maps monsters and items to sprite descriptors', () => {
    const mon = assets.monster(5, 1);
    expect(mon).toHaveProperty('sprite');
    expect(mon).toHaveProperty('scale');
    expect(mon).toHaveProperty('hue');

    const it = assets.item(30, 11);
    expect(it).toHaveProperty('sprite');
    expect(it).toHaveProperty('scale');
    expect(it).toHaveProperty('hue');
  });

  it('returns a player portrait', () => {
    expect(assets.playerPortrait(1, 2)).toBeTruthy();
  });
});
