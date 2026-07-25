import { describe, it, expect } from 'vitest';
import { getColorName, getClosestColorName } from '../utils/color-namer.js';

describe('Color Namer Utility', () => {
  it('should prioritize explicit merchant color names in pipe format (#hex|Name)', () => {
    expect(getColorName('#85110e|Burgundy')).toBe('Burgundy');
    expect(getColorName('#000080|Navy Blue')).toBe('Navy Blue');
    expect(getColorName('#5F9EA0|Teal')).toBe('Teal');
  });

  it('should correctly convert raw hex codes to true human-readable colors', () => {
    expect(getColorName('#85110e')).toBe('Burgundy');
    expect(getColorName('#000080')).toBe('Navy Blue');
    expect(getColorName('#000000')).toBe('Black');
    expect(getColorName('#ffffff')).toBe('White');
    expect(getColorName('#5f9ea0')).toBe('Teal');
    expect(getColorName('#1b4d3e')).toBe('Forest Green');
  });

  it('should correctly handle dual hex split swatches (#hex|#hex)', () => {
    expect(getColorName('#5F9EA0|#FFFFFF')).toBe('Teal / White');
  });

  it('should leave plain color names untouched', () => {
    expect(getColorName('Burgundy')).toBe('Burgundy');
    expect(getColorName('Olive Green')).toBe('Olive Green');
  });
});
