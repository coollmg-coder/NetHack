import { describe, expect, it } from 'vitest';
import { facingToDirection } from './geometry.js';

describe('facingToDirection', () => {
  it('maps facing 0 to north (-Z)', () => {
    const d = facingToDirection(0);
    expect(d.x).toBeCloseTo(0);
    expect(d.z).toBeCloseTo(-1);
  });

  it('maps facing 2 to east (+X)', () => {
    const d = facingToDirection(2);
    expect(d.x).toBeCloseTo(1);
    expect(d.z).toBeCloseTo(0);
  });

  it('maps facing 4 to south (+Z)', () => {
    const d = facingToDirection(4);
    expect(d.x).toBeCloseTo(0);
    expect(d.z).toBeCloseTo(1);
  });

  it('maps facing 6 to west (-X)', () => {
    const d = facingToDirection(6);
    expect(d.x).toBeCloseTo(-1);
    expect(d.z).toBeCloseTo(0);
  });

  it('normalizes facing beyond 0..7', () => {
    const a = facingToDirection(8);
    expect(a.x).toBeCloseTo(0);
    expect(a.z).toBeCloseTo(-1);
  });
});
