import Review from '../models/Review.js';
import Product from '../models/Product.js';
import logger from '../utils/logger.js';

/**
 * Recalculate the average rating of a product based on its approved reviews.
 * Rounded to 1 decimal place, then saves the Product document.
 * Since calling product.save() triggers its post-save hooks, the changes will
 * automatically be synced to the Inventory document.
 *
 * @param {string} productId - The product ID (SKU) to recalculate rating for.
 */
export const updateProductAverageRating = async (productId) => {
  if (!productId) return;
  try {
    const reviews = await Review.find({ productId, status: 'approved' }).lean();
    
    let averageRating = 5; // Default rating if no approved reviews exist
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
      averageRating = Math.round((sum / reviews.length) * 10) / 10;
    }

    const product = await Product.findOne({ id: productId });
    if (product) {
      product.rating = averageRating;
      await product.save();
      logger.info({ productId, averageRating }, `[ReviewService] Successfully updated product ${productId} rating to ${averageRating}`);
    } else {
      logger.warn({ productId }, `[ReviewService] Product ${productId} not found for rating update`);
    }
  } catch (err) {
    logger.error({ productId, err: err.message }, `[ReviewService] Error updating product rating for ${productId}`);
  }
};
