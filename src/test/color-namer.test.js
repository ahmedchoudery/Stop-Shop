import { describe, it, expect } from 'vitest';
import { getColorName, getClosestColorName } from '../utils/color-namer.js';

describe('Color Namer Utility', () => {
  it('should prioritize explicit merchant color names in pipe format (#hex|Name)', () => {
    expect(getColorName('#85110e|Burgundy')).toBe('Burgundy');
    expect(getColorName('#000080|Navy Blue')).toBe('Navy Blue');
    expect(getColorName('#5F9EA0|Teal')).toBe('Teal');
  });

  it('should accurately match specific screenshot colors via CIELAB perceptual space', () => {
    expect(getColorName('#041f17')).toBe('Dark Green');
    expect(getColorName('#3f4e5a')).toBe('Slate Blue');
    expect(getColorName('#581c38')).toBe('Deep Wine');
    expect(getColorName('#382338')).toBe('Dark Purple');
    expect(getColorName('#8c535d')).toBe('Dusty Rose');
  });

  it('should correctly convert standard raw hex codes to true human-readable colors', () => {
    expect(getColorName('#85110e')).toBe('Deep Red');
    expect(getColorName('#000080')).toBe('Navy Blue');
    expect(getColorName('#000000')).toBe('Black');
    expect(getColorName('#ffffff')).toBe('White');
    expect(getColorName('#1b4d3e')).toBe('Forest Green');
  });

  it('should correctly handle dual hex split swatches (#hex|#hex)', () => {
    expect(getColorName('#5F9EA0|#FFFFFF')).toBe('Cadet Teal / White');
  });

  it('should leave plain color names untouched', () => {
    expect(getColorName('Burgundy')).toBe('Burgundy');
    expect(getColorName('Olive Green')).toBe('Olive Green');
  });
});
