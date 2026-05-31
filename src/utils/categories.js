export const CATEGORY_MAP = {
  Tops: ['Polo', 'Shirt', 'Tshirt', 'Sweatshirt', 'Hoodie', 'Jacket'],
  Bottoms: ['Jeans', 'Trousers', 'Shorts'],
  Footwear: ['Shoes', 'Slippers', 'Socks'],
  Accessories: ['Glasses', 'Watches', 'Rings', 'Bracelet', 'Chains', 'Caps', 'Belts', 'Bags'],
};

export const CATEGORIES = Object.keys(CATEGORY_MAP);

// Helper function to get valid sub-categories for a given category
export const getSubCategories = (category) => CATEGORY_MAP[category] || [];

// Helper to get default sub-category if category changes
export const getDefaultSubCategory = (category) => {
  const subs = getSubCategories(category);
  return subs.length > 0 ? subs[0] : '';
};
