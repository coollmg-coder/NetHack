import { describe, expect, it } from 'vitest';
import { createStatusStore, fieldLabel } from './status.js';

describe('status field labels', () => {
  it('maps known field indices to labels', () => {
    expect(fieldLabel(1)).toBe('Str');
    expect(fieldLabel(18)).toBe('HP');
    expect(fieldLabel(20)).toBe('Dlvl');
  });

  it('falls back to the numeric index for unknown fields', () => {
    expect(fieldLabel(99)).toBe('99');
  });
});

describe('status store', () => {
  it('updates and retrieves field values', () => {
    const store = createStatusStore();
    store.update(18, '18');
    store.update(19, '18');
    expect(store.get(18)).toBe('18');
    expect(store.get(19)).toBe('18');
    expect(store.entries()).toHaveLength(2);
  });
});
