/**
 * @fileoverview color-namer.js
 * Converts Hex color codes (e.g. #85110E, #000000) into human-readable color names.
 */

const COLOR_NAMES_MAP = [
  { name: 'Black', hex: '#000000', rgb: [0, 0, 0] },
  { name: 'Charcoal', hex: '#36454F', rgb: [54, 69, 79] },
  { name: 'Dark Gray', hex: '#555555', rgb: [85, 85, 85] },
  { name: 'Gray', hex: '#808080', rgb: [128, 128, 128] },
  { name: 'Silver', hex: '#C0C0C0', rgb: [192, 192, 192] },
  { name: 'Light Gray', hex: '#D3D3D3', rgb: [211, 211, 211] },
  { name: 'White', hex: '#FFFFFF', rgb: [255, 255, 255] },
  { name: 'Ivory', hex: '#FFFFF0', rgb: [255, 255, 240] },
  { name: 'Off White', hex: '#FAF9F6', rgb: [250, 249, 246] },
  { name: 'Cream', hex: '#FFFDD0', rgb: [255, 253, 208] },
  { name: 'Beige', hex: '#F5F5DC', rgb: [245, 245, 220] },
  { name: 'Khaki', hex: '#C3B091', rgb: [195, 176, 145] },
  { name: 'Sand', hex: '#C2B280', rgb: [194, 178, 128] },
  { name: 'Tan', hex: '#D2B48C', rgb: [210, 180, 140] },
  { name: 'Camel', hex: '#C19A6B', rgb: [193, 154, 107] },
  { name: 'Taupe', hex: '#483C32', rgb: [72, 60, 50] },
  { name: 'Brown', hex: '#A52A2A', rgb: [165, 42, 42] },
  { name: 'Chocolate', hex: '#7B3F00', rgb: [123, 63, 0] },
  { name: 'Coffee', hex: '#6F4E37', rgb: [111, 78, 55] },
  { name: 'Burgundy', hex: '#800020', rgb: [128, 0, 32] },
  { name: 'Maroon', hex: '#800000', rgb: [128, 0, 0] },
  { name: 'Deep Red', hex: '#85110E', rgb: [133, 17, 14] },
  { name: 'Red', hex: '#FF0000', rgb: [255, 0, 0] },
  { name: 'Crimson', hex: '#DC143C', rgb: [220, 20, 60] },
  { name: 'Ruby', hex: '#E0115F', rgb: [224, 17, 95] },
  { name: 'Rust', hex: '#B7410E', rgb: [183, 65, 14] },
  { name: 'Terracotta', hex: '#E2725B', rgb: [226, 114, 91] },
  { name: 'Coral', hex: '#FF7F50', rgb: [255, 127, 80] },
  { name: 'Orange', hex: '#FFA500', rgb: [255, 165, 0] },
  { name: 'Peach', hex: '#FFDAB9', rgb: [255, 218, 185] },
  { name: 'Mustard', hex: '#FFDB58', rgb: [255, 219, 88] },
  { name: 'Amber', hex: '#FFBF00', rgb: [255, 191, 0] },
  { name: 'Gold', hex: '#FFD700', rgb: [255, 215, 0] },
  { name: 'Yellow', hex: '#FFFF00', rgb: [255, 255, 0] },
  { name: 'Olive', hex: '#808000', rgb: [128, 128, 0] },
  { name: 'Olive Green', hex: '#556B2F', rgb: [85, 107, 47] },
  { name: 'Army Green', hex: '#4B5320', rgb: [75, 83, 32] },
  { name: 'Forest Green', hex: '#228B22', rgb: [34, 139, 34] },
  { name: 'Green', hex: '#008000', rgb: [0, 128, 0] },
  { name: 'Emerald', hex: '#50C878', rgb: [80, 200, 120] },
  { name: 'Mint Green', hex: '#98FF98', rgb: [152, 255, 152] },
  { name: 'Sage Green', hex: '#9CAF88', rgb: [156, 175, 136] },
  { name: 'Teal', hex: '#008080', rgb: [0, 128, 128] },
  { name: 'Cyan', hex: '#00FFFF', rgb: [0, 255, 255] },
  { name: 'Sky Blue', hex: '#87CEEB', rgb: [135, 206, 235] },
  { name: 'Light Blue', hex: '#ADD8E6', rgb: [173, 216, 230] },
  { name: 'Baby Blue', hex: '#89CFF0', rgb: [137, 207, 240] },
  { name: 'Royal Blue', hex: '#4169E1', rgb: [65, 105, 225] },
  { name: 'Blue', hex: '#0000FF', rgb: [0, 0, 255] },
  { name: 'Navy Blue', hex: '#000080', rgb: [0, 0, 128] },
  { name: 'Dark Navy', hex: '#0A1128', rgb: [10, 17, 40] },
  { name: 'Indigo', hex: '#4B0082', rgb: [75, 0, 130] },
  { name: 'Purple', hex: '#800080', rgb: [128, 0, 128] },
  { name: 'Plum', hex: '#8E4585', rgb: [142, 69, 133] },
  { name: 'Violet', hex: '#EE82EE', rgb: [238, 130, 238] },
  { name: 'Lavender', hex: '#E6E6FA', rgb: [230, 230, 250] },
  { name: 'Lilac', hex: '#C8A2C8', rgb: [200, 162, 200] },
  { name: 'Magenta', hex: '#FF00FF', rgb: [255, 0, 255] },
  { name: 'Pink', hex: '#FFC0CB', rgb: [255, 192, 203] },
  { name: 'Rose', hex: '#FF007F', rgb: [255, 0, 127] },
  { name: 'Dusty Rose', hex: '#DCAE96', rgb: [220, 174, 150] },
  { name: 'Blush Pink', hex: '#DE5D83', rgb: [222, 93, 131] }
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

export const getClosestColorName = (hexStr) => {
  if (!hexStr) return '';
  const targetRgb = hexToRgb(hexStr);
  if (!targetRgb) return hexStr;

  let minDistance = Infinity;
  let closestName = hexStr;

  for (const c of COLOR_NAMES_MAP) {
    const dr = targetRgb[0] - c.rgb[0];
    const dg = targetRgb[1] - c.rgb[1];
    const db = targetRgb[2] - c.rgb[2];
    const dist = Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);
    if (dist < minDistance) {
      minDistance = dist;
      closestName = c.name;
    }
  }

  return closestName;
};

export const getColorName = (color) => {
  if (!color) return '';

  const isHex = (str) => /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(str.trim());

  if (color.includes('|')) {
    const parts = color.split('|');
    const part0 = parts[0].trim();
    const part1 = parts[1].trim();

    const name0 = isHex(part0) ? getClosestColorName(part0) : part0;
    const name1 = isHex(part1) ? getClosestColorName(part1) : part1;

    if (name0 && name1 && name0.toLowerCase() !== name1.toLowerCase()) {
      return `${name0} / ${name1}`;
    }
    return name0 || name1;
  }

  if (isHex(color)) {
    return getClosestColorName(color);
  }

  return color;
};

export default getColorName;
