// Helper functions for product discount calculations

/**
 * Check if a product is currently on discount
 * @param {Object} product - Product object with discountPrice, discountStartDate, discountEndDate
 * @returns {boolean} - True if product is currently discounted
 */
export const isProductOnDiscount = (product) => {
  if (!product || !product.discountPrice || !product.discountStartDate || !product.discountEndDate) {
    return false;
  }

  const now = new Date();
  const startDate = new Date(product.discountStartDate);
  const endDate = new Date(product.discountEndDate);

  return now >= startDate && now <= endDate;
};

/**
 * Get the current price of a product (discount price if on discount, otherwise regular price)
 * @param {Object} product - Product object
 * @returns {number} - Current price
 */
export const getCurrentPrice = (product) => {
  if (!product) return 0;
  return isProductOnDiscount(product) ? product.discountPrice : product.price;
};

/**
 * Calculate discount percentage
 * @param {Object} product - Product object
 * @returns {number} - Discount percentage (0-100)
 */
export const getDiscountPercentage = (product) => {
  if (!product || !isProductOnDiscount(product)) return 0;
  const discount = product.price - product.discountPrice;
  return Math.round((discount / product.price) * 100);
};

/**
 * Get discount multiplier (0-1) when product is on discount. Multiply any price by this to get discounted value.
 * @param {Object} product - Product object
 * @returns {number} - product.discountPrice/product.price when on discount, else 1
 */
export const getDiscountMultiplier = (product) => {
  if (!product || !isProductOnDiscount(product) || !product.price || product.price <= 0) return 1;
  return product.discountPrice / product.price;
};

/**
 * Apply product discount to a given price (for variants, options, etc.)
 * @param {Object} product - Product object
 * @param {number} originalPrice - Original price to discount
 * @returns {number} - Discounted price when on discount, else originalPrice
 */
export const getDiscountedPrice = (product, originalPrice) => {
  if (originalPrice == null || isNaN(originalPrice)) return 0;
  return originalPrice * getDiscountMultiplier(product);
};

/**
 * Get remaining discount time in a human-readable format
 * @param {Object} product - Product object
 * @returns {string|null} - Remaining time string or null if not on discount
 */
export const getRemainingDiscountTime = (product) => {
  if (!isProductOnDiscount(product)) return null;
  
  const now = new Date();
  const endDate = new Date(product.discountEndDate);
  const diff = endDate - now;
  
  if (diff <= 0) return null;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days} วัน ${hours} ชม.`;
  if (hours > 0) return `${hours} ชม. ${minutes} นาที`;
  return `${minutes} นาที`;
};

