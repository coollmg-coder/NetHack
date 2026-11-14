import { describe, expect, it } from 'vitest';
import { terrainColor } from './minimap.js';

describe('minimap terrain colors', () => {
  it('distinguishes walls, water, lava, and floor', () => {
    expect(terrainColor(1)).toBe('#56504a'); // wall
    expect(terrainColor(38)).toBe('#234a8a'); // water
    expect(terrainColor(40)).toBe('#a3351f'); // lava
    expect(terrainColor(19)).toBe('#2a2a2a'); // floor
  });

  it('uses stair and door colors', () => {
    expect(terrainColor(26)).toBe('#c8b020'); // down stair
    expect(terrainColor(15)).toBe('#8a6a35'); // closed door
  });
});
