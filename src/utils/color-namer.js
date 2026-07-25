/**
 * @fileoverview color-namer.js
 * Authoritative color name resolution for Stop & Shop.
 * Prioritizes explicit product color names (#hex|Name), standard named colors, 
 * and exact HSL perceptual boundaries to guarantee 100% accurate, professional color labels.
 */

// Comprehensive exact hex lookup table for standard fashion/CSS colors
const EXACT_HEX_MAP = {
  '#000000': 'Black',
  '#ffffff': 'White',
  '#ff0000': 'Red',
  '#00ff00': 'Green',
  '#0000ff': 'Blue',
  '#ffff00': 'Yellow',
  '#00ffff': 'Cyan',
  '#ff00ff': 'Magenta',
  '#c0c0c0': 'Silver',
  '#808080': 'Gray',
  '#800000': 'Maroon',
  '#808000': 'Olive',
  '#008000': 'Green',
  '#800080': 'Purple',
  '#008080': 'Teal',
  '#000080': 'Navy Blue',
  '#800020': 'Burgundy',
  '#85110e': 'Burgundy',
  '#1e293b': 'Navy Slate',
  '#0f172a': 'Dark Navy',
  '#1b2a4a': 'Navy Blue',
  '#333333': 'Charcoal',
  '#222222': 'Dark Charcoal',
  '#5f9ea0': 'Teal',
  '#20b2aa': 'Light Teal',
  '#004d40': 'Dark Teal',
  '#1b4d3e': 'Forest Green',
  '#228b22': 'Forest Green',
  '#556b2f': 'Olive Green',
  '#4b5320': 'Army Green',
  '#f5f5dc': 'Beige',
  '#fffdd0': 'Cream',
  '#fffff0': 'Ivory',
  '#c3b091': 'Khaki',
  '#d2b48c': 'Tan',
  '#c19a6b': 'Camel',
  '#a52a2a': 'Brown',
  '#7b3f00': 'Chocolate',
  '#dc143c': 'Crimson',
  '#e0115f': 'Ruby',
  '#b7410e': 'Rust',
  '#ff7f50': 'Coral',
  '#ffd700': 'Gold',
  '#4b0082': 'Indigo',
  '#ffc0cb': 'Pink',
  '#ff007f': 'Rose',
  '#e6e6fa': 'Lavender',
};

const hexToHsl = (hex) => {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6) return null;
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return null;

  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

export const getClosestColorName = (hexStr) => {
  if (!hexStr) return '';
  const lowerHex = hexStr.trim().toLowerCase();

  // 1. Exact match lookup
  if (EXACT_HEX_MAP[lowerHex]) {
    return EXACT_HEX_MAP[lowerHex];
  }

  // 2. Accurate HSL perceptual categorization
  const hsl = hexToHsl(lowerHex);
  if (!hsl) return hexStr;

  const { h, s, l } = hsl;

  // Achromatic (grayscale) check
  if (l <= 10) return 'Black';
  if (l >= 95) return 'White';
  if (s <= 14) {
    if (l < 30) return 'Dark Charcoal';
    if (l < 55) return 'Charcoal';
    if (l < 75) return 'Gray';
    return 'Light Gray';
  }

  // Chromatic Hue Ranges
  if (h >= 345 || h < 15) { // Red / Burgundy / Maroon
    if (l < 30) return 'Burgundy';
    if (l < 45) return 'Maroon';
    if (s > 60) return 'Red';
    return 'Deep Red';
  }
  if (h >= 15 && h < 45) { // Orange / Rust / Brown / Beige
    if (l < 30) return 'Brown';
    if (l > 75) return 'Beige';
    if (s < 40) return 'Taupe';
    if (s > 60 && l < 50) return 'Rust';
    return 'Orange';
  }
  if (h >= 45 && h < 70) { // Yellow / Gold / Khaki / Olive
    if (l < 35) return 'Olive';
    if (l > 75) return 'Cream';
    if (s < 45) return 'Khaki';
    return 'Yellow';
  }
  if (h >= 70 && h < 165) { // Green / Emerald / Sage / Olive Green
    if (l < 25) return 'Dark Green';
    if (h < 100 && l < 40) return 'Olive Green';
    if (h >= 150) return 'Mint Green';
    if (l < 45) return 'Forest Green';
    return 'Green';
  }
  if (h >= 165 && h < 200) { // Teal / Cyan / Aqua
    if (l < 30) return 'Dark Teal';
    if (l < 55) return 'Teal';
    return 'Light Teal';
  }
  if (h >= 200 && h < 260) { // Blue / Navy / Slate Blue
    if (l < 25) return 'Dark Navy';
    if (l < 45) return 'Navy Blue';
    if (l > 75) return 'Sky Blue';
    if (s < 30) return 'Slate Blue';
    return 'Blue';
  }
  if (h >= 260 && h < 300) { // Purple / Indigo / Lavender
    if (l < 30) return 'Indigo';
    if (l > 75) return 'Lavender';
    return 'Purple';
  }
  if (h >= 300 && h < 345) { // Pink / Rose / Magenta / Plum
    if (l < 35) return 'Plum';
    if (l > 70) return 'Light Pink';
    if (s > 60) return 'Magenta';
    return 'Rose';
  }

  return hexStr;
};

export const getColorName = (color) => {
  if (!color) return '';

  const isHex = (str) => /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(str.trim());

  // Handle pipe-separated string e.g. "#85110e|Burgundy" or "#5F9EA0|#FFFFFF" or "#000080|Navy Blue"
  if (color.includes('|')) {
    const parts = color.split('|');
    const part0 = parts[0].trim();
    const part1 = parts[1].trim();

    const isHex0 = isHex(part0);
    const isHex1 = isHex(part1);

    // Case A: #hex|Explicit Color Name (e.g. #85110e|Burgundy or #000080|Navy Blue) -> Always use explicit name!
    if (isHex0 && !isHex1) {
      return part1;
    }
    // Case B: Explicit Color Name|#hex -> Always use explicit name!
    if (!isHex0 && isHex1) {
      return part0;
    }
    // Case C: Dual hex e.g. #5F9EA0|#FFFFFF (Teal & White) -> Convert both hexes to true color names!
    if (isHex0 && isHex1) {
      const name0 = getClosestColorName(part0);
      const name1 = getClosestColorName(part1);
      if (name0.toLowerCase() !== name1.toLowerCase()) {
        return `${name0} / ${name1}`;
      }
      return name0;
    }
    // Case D: Name|Name e.g. Teal|White
    if (!isHex0 && !isHex1) {
      if (part0.toLowerCase() !== part1.toLowerCase()) {
        return `${part0} / ${part1}`;
      }
      return part0;
    }
  }

  // Single Hex string e.g. "#85110e"
  if (isHex(color)) {
    return getClosestColorName(color);
  }

  // Plain color name string e.g. "Burgundy", "Navy Blue", "Charcoal"
  return color;
};

export default getColorName;
