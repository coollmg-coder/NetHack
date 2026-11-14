import { describe, expect, it } from 'vitest';
import { translateKey, FACING } from './keys.js';

describe('translateKey', () => {
  it('maps arrow keys to NetHack movement commands and facing', () => {
    expect(translateKey('ArrowUp')).toEqual({ command: 'k', facing: 0 });
    expect(translateKey('ArrowRight')).toEqual({ command: 'l', facing: 2 });
    expect(translateKey('ArrowDown')).toEqual({ command: 'j', facing: 4 });
    expect(translateKey('ArrowLeft')).toEqual({ command: 'h', facing: 6 });
  });

  it('maps hjkl/yubn keys to facing values', () => {
    for (const [cmd, facing] of Object.entries(FACING)) {
      expect(translateKey(cmd)).toEqual({ command: cmd, facing });
    }
  });

  it('rotates in place for Q and E', () => {
    expect(translateKey('q')).toEqual({ rotate: -1 });
    expect(translateKey('e')).toEqual({ rotate: 1 });
    expect(translateKey('Q')).toEqual({ rotate: -1 });
    expect(translateKey('E')).toEqual({ rotate: 1 });
  });

  it('passes through other single-character commands', () => {
    expect(translateKey('a')).toEqual({ command: 'a' });
    expect(translateKey('S')).toEqual({ command: 'S' });
  });

  it('ignores multi-character non-command keys', () => {
    expect(translateKey('F1')).toBeNull();
    expect(translateKey('Shift')).toBeNull();
  });
});
