const mongoose = require('mongoose');

// Paste the schema definition here to test validation
const productSchema = new mongoose.Schema({
  id:            { type: String, unique: true, index: true },
  name:          { type: String, required: true, trim: true },
  price:         { type: Number, required: true, min: 0 },
  quantity:      { type: Number, default: 0, min: 0 },
  stock:         { type: Number, default: 0, min: 0 },
  image:         { type: String, default: '' },
  mediaType:     { type: String, enum: ['upload', 'url', 'embed'], default: 'upload' },
  embedCode:     { type: String, default: '' },
  rating:        { type: Number, default: 5, min: 1, max: 5 },
  bucket:        { type: String, default: 'Tops', trim: true },
  subCategory:   { type: String, default: 'Tshirt', trim: true },
  specs:         [{ type: String }],
  colors:        [{ type: String }],
  sizes:         [{ type: String }],
  sizeStock:     { type: Map, of: Number, default: {} },
  lifestyleImage: { type: String, default: '' },
  variantImages: { type: Map, of: String, default: {} },
  gallery:       [{ type: String }],
});

const Product = mongoose.model('Product', productSchema);

const DEFAULT_FORM = {
  id:             '',
  name:           'Test Product',
  price:          100,
  quantity:       0,
  stock:          0,
  image:          '',
  mediaType:      'url',
  embedCode:      '',
  rating:         5,
  bucket:         'Tops',
  subCategory:    'General',
  specs:          [],
  colors:         [],
  sizes:          [],
  sizeStock:      {},
  lifestyleImage: '',
  variantImages:  {},
  gallery:        [],
};

const productData = { ...DEFAULT_FORM, id: 'PRD-123' };

const product = new Product(productData);
const err = product.validateSync();

if (err) {
  console.error("Validation Error:", err.errors);
} else {
  console.log("Validation Passed!");
}
