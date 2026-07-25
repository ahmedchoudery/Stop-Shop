/**
 * @fileoverview color-namer.js
 * Authoritative e-commerce color name resolution engine for Stop & Shop.
 * Prioritizes merchant-specified display names (#code|Name) and uses
 * NTC CIELAB 1976 perceptual color space for unlabelled code fallbacks.
 */

const NTC_PALETTE = [
  // Grays / Black / White / Neutrals
  { name: 'Black', hex: '#000000' },
  { name: 'Off White', hex: '#FAF9F6' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Ivory', hex: '#FFFFF0' },
  { name: 'Cream', hex: '#FFFDD0' },
  { name: 'Bone', hex: '#E3DAC9' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Sand', hex: '#C2B280' },
  { name: 'Khaki', hex: '#C3B091' },
  { name: 'Tan', hex: '#D2B48C' },
  { name: 'Camel', hex: '#C19A6B' },
  { name: 'Taupe', hex: '#8B8589' },
  { name: 'Dark Taupe', hex: '#483C32' },
  { name: 'Light Gray', hex: '#D3D3D3' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Slate Gray', hex: '#708090' },
  { name: 'Charcoal', hex: '#36454F' },
  { name: 'Dark Charcoal', hex: '#2d2926' },
  { name: 'Graphite', hex: '#343434' },

  // Browns / Espresso
  { name: 'Dark Brown', hex: '#3b2f2f' },
  { name: 'Espresso', hex: '#42382e' },
  { name: 'Chocolate', hex: '#7B3F00' },
  { name: 'Coffee', hex: '#6F4E37' },
  { name: 'Brown', hex: '#A52A2A' },
  { name: 'Cognac', hex: '#9A463D' },
  { name: 'Chestnut', hex: '#954535' },

  // Reds / Wines / Pinks
  { name: 'Red', hex: '#FF0000' },
  { name: 'Crimson', hex: '#DC143C' },
  { name: 'Deep Red', hex: '#85110e' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Burgundy', hex: '#800020' },
  { name: 'Deep Wine', hex: '#581c38' },
  { name: 'Wine', hex: '#722F37' },
  { name: 'Rose', hex: '#FF007F' },
  { name: 'Dusty Rose', hex: '#8c535d' },
  { name: 'Blush Pink', hex: '#DE5D83' },
  { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Coral', hex: '#FF7F50' },
  { name: 'Peach', hex: '#FFDAB9' },
  { name: 'Terracotta', hex: '#E2725B' },
  { name: 'Rust', hex: '#B7410E' },

  // Purples
  { name: 'Purple', hex: '#800080' },
  { name: 'Dark Purple', hex: '#382338' },
  { name: 'Eggplant', hex: '#311432' },
  { name: 'Plum', hex: '#8E4585' },
  { name: 'Mauve', hex: '#E0B0FF' },
  { name: 'Lavender', hex: '#E6E6FA' },
  { name: 'Lilac', hex: '#C8A2C8' },
  { name: 'Violet', hex: '#EE82EE' },
  { name: 'Indigo', hex: '#4B0082' },

  // Blues
  { name: 'Navy Blue', hex: '#000080' },
  { name: 'Dark Navy', hex: '#0F172A' },
  { name: 'Midnight Blue', hex: '#191970' },
  { name: 'Slate Blue', hex: '#3f4e5a' },
  { name: 'Steel Blue', hex: '#4682B4' },
  { name: 'Royal Blue', hex: '#4169E1' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Sky Blue', hex: '#87CEEB' },
  { name: 'Baby Blue', hex: '#89CFF0' },

  // Teals / Cyans
  { name: 'Teal', hex: '#008080' },
  { name: 'Dark Teal', hex: '#004D40' },
  { name: 'Cadet Teal', hex: '#5F9EA0' },
  { name: 'Light Teal', hex: '#20B2AA' },
  { name: 'Cyan', hex: '#00FFFF' },

  // Greens
  { name: 'Dark Olive', hex: '#3a403a' },
  { name: 'Dark Green', hex: '#041f17' },
  { name: 'Forest Green', hex: '#1b4d3e' },
  { name: 'Emerald Green', hex: '#50C878' },
  { name: 'Green', hex: '#008000' },
  { name: 'Olive Green', hex: '#556B2F' },
  { name: 'Olive', hex: '#808000' },
  { name: 'Army Green', hex: '#4B5320' },
  { name: 'Sage Green', hex: '#9CAF88' },
  { name: 'Mint Green', hex: '#98FF98' },

  // Yellows / Oranges / Gold
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Mustard', hex: '#FFDB58' },
  { name: 'Gold', hex: '#FFD700' },
  { name: 'Amber', hex: '#FFBF00' },
  { name: 'Orange', hex: '#FFA500' }
];

const hexToRgb = (hex) => {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6) return null;
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return null;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

const rgbToLab = (r, g, b) => {
  let r1 = r / 255, g1 = g / 255, b1 = b / 255;
  r1 = r1 > 0.04045 ? Math.pow((r1 + 0.055) / 1.055, 2.4) : r1 / 12.92;
  g1 = g1 > 0.04045 ? Math.pow((g1 + 0.055) / 1.055, 2.4) : g1 / 12.92;
  b1 = b1 > 0.04045 ? Math.pow((b1 + 0.055) / 1.055, 2.4) : b1 / 12.92;

  const x = (r1 * 0.4124 + g1 * 0.3576 + b1 * 0.1805) * 100 / 95.047;
  const y = (r1 * 0.2126 + g1 * 0.7152 + b1 * 0.0722) * 100 / 100.000;
  const z = (r1 * 0.0193 + g1 * 0.1192 + b1 * 0.9505) * 100 / 108.883;

  const fx = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + (16/116);
  const fy = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + (16/116);
  const fz = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + (16/116);

  const L = (116 * fy) - 16;
  const a = 500 * (fx - fy);
  const bVal = 200 * (fy - fz);

  return [L, a, bVal];
};

const PALETTE_LAB = NTC_PALETTE.map(item => {
  const rgb = hexToRgb(item.hex);
  const lab = rgb ? rgbToLab(...rgb) : [0, 0, 0];
  return { ...item, lab };
});

export const getClosestColorName = (hexStr) => {
  if (!hexStr) return '';
  const rgb = hexToRgb(hexStr);
  if (!rgb) return hexStr;

  const targetLab = rgbToLab(...rgb);
  let minDelta = Infinity;
  let closestName = hexStr;

  for (const c of PALETTE_LAB) {
    const dL = targetLab[0] - c.lab[0];
    const da = targetLab[1] - c.lab[1];
    const db = targetLab[2] - c.lab[2];
    const deltaE = Math.sqrt(dL * dL + da * da + db * db);

    if (deltaE < minDelta) {
      minDelta = deltaE;
      closestName = c.name;
    }
  }

  return closestName;
};

export const getColorName = (color) => {
  if (!color) return '';

  const isColorCode = (str) => {
    const s = str.trim();
    return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s) ||
           /^rgba?\(|\bhsla?\(/i.test(s);
  };

  if (color.includes('|')) {
    const parts = color.split('|');
    const part0 = parts[0].trim();
    const part1 = parts[1].trim();

    const isCode0 = isColorCode(part0);
    const isCode1 = isColorCode(part1);

    // If part0 is a color code (#hex / rgb / hsl) and part1 is an explicit merchant name (e.g. #85110e|Burgundy)
    if (isCode0 && !isCode1) return part1;

    // If part1 is a color code and part0 is an explicit merchant name (e.g. Burgundy|#85110e)
    if (!isCode0 && isCode1) return part0;

    // If both are color codes (e.g. #5F9EA0|#FFFFFF)
    if (isCode0 && isCode1) {
      const name0 = getClosestColorName(part0);
      const name1 = getClosestColorName(part1);
      return name0.toLowerCase() !== name1.toLowerCase() ? `${name0} / ${name1}` : name0;
    }

    // If both are text names (e.g. Teal|White)
    if (!isCode0 && !isCode1) {
      return part0.toLowerCase() !== part1.toLowerCase() ? `${part0} / ${part1}` : part0;
    }
  }

  if (isColorCode(color)) {
    return getClosestColorName(color);
  }

  return color;
};

export const getBackgroundStyle = (color) => {
  if (!color) return {};

  const isColorCode = (str) => {
    const s = str.trim();
    return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s) ||
           /^rgba?\(|\bhsla?\(/i.test(s);
  };

  if (color.includes('|')) {
    const parts = color.split('|');
    const part0 = parts[0].trim();
    const part1 = parts[1].trim();

    const isCode0 = isColorCode(part0);
    const isCode1 = isColorCode(part1);

    if (isCode0 && !isCode1) return { backgroundColor: part0 };
    if (!isCode0 && isCode1) return { backgroundColor: part1 };

    if (isCode0 && isCode1) {
      return { background: `linear-gradient(135deg, ${part0} 50%, ${part1} 50%)` };
    }

    return { background: `linear-gradient(135deg, ${part0} 50%, ${part1} 50%)` };
  }

  return { backgroundColor: color };
};

export default getColorName;
