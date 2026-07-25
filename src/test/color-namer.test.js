import { describe, it, expect } from 'vitest';
import { getColorName, getClosestColorName } from '../utils/color-namer.js';

describe('Color Namer Utility', () => {
  it('should strictly return exact merchant display name when provided (#code|Name or Name|#code)', () => {
    expect(getColorName('#85110e|Burgundy')).toBe('Burgundy');
    expect(getColorName('#8c535d|Dusty Rose')).toBe('Dusty Rose');
    expect(getColorName('#3f4e5a|Slate Blue')).toBe('Slate Blue');
    expect(getColorName('rgb(133,17,14)|Deep Red')).toBe('Deep Red');
    expect(getColorName('Burgundy|#85110e')).toBe('Burgundy');
  });

  it('should decompose split swatches accurately when both halves are codes or names (#code|#code or Name|Name)', () => {
    expect(getColorName('#5F9EA0|#FFFFFF')).toBe('Cadet Teal / White');
    expect(getColorName('Teal|White')).toBe('Teal / White');
  });

  it('should accurately differentiate dark neutrals without defaulting to Taupe', () => {
    expect(getColorName('#3a403a')).toBe('Dark Olive');
    expect(getColorName('#42382e')).toBe('Espresso');
    expect(getColorName('#2d2926')).toBe('Dark Charcoal');
    expect(getColorName('#3f4e5a')).toBe('Slate Blue');
  });

  it('should correctly convert unlabelled raw hex codes to true human-readable colors', () => {
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
