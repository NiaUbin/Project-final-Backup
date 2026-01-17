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

