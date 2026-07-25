import { describe, it, expect } from 'vitest';
import { getColorName, getClosestColorName } from '../utils/color-namer.js';

describe('Color Namer Utility', () => {
  it('should decompose split swatches accurately without dropping color halves (#hex|Name or #hex|#hex)', () => {
    expect(getColorName('#5F9EA0|White')).toBe('Cadet Teal / White');
    expect(getColorName('#5F9EA0|#FFFFFF')).toBe('Cadet Teal / White');
  });

  it('should accurately differentiate dark neutrals without defaulting to Taupe', () => {
    expect(getColorName('#3a403a')).toBe('Dark Olive');
    expect(getColorName('#42382e')).toBe('Espresso');
    expect(getColorName('#2d2926')).toBe('Dark Charcoal');
    expect(getColorName('#3f4e5a')).toBe('Slate Blue');
  });

  it('should correctly convert standard raw hex codes to true human-readable colors', () => {
    expect(getColorName('#85110e')).toBe('Deep Red');
    expect(getColorName('#000080')).toBe('Navy Blue');
    expect(getColorName('#000000')).toBe('Black');
    expect(getColorName('#ffffff')).toBe('White');
    expect(getColorName('#1b4d3e')).toBe('Forest Green');
  });

  it('should leave plain color names untouched', () => {
    expect(getColorName('Burgundy')).toBe('Burgundy');
    expect(getColorName('Olive Green')).toBe('Olive Green');
  });
});
