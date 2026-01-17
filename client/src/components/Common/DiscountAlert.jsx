import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DiscountAlert = ({ isVisible, onClose, maxDiscount, product }) => {
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Start animation immediately
      setTimeout(() => setIsAnimating(true), 50);
    } else {
      setIsAnimating(false);
    }
  }, [isVisible]);

  const handleShopNow = () => {
    onClose();
    navigate('/discount-products');
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4" 
      style={{ 
        position: 'fixed',
        zIndex: 99999
      }}
    >
      {/* Backdrop with animation */}
      <div 
        className="absolute inset-0 bg-black/60 transition-opacity duration-300"
        onClick={onClose}
        style={{ zIndex: 99998 }}
      ></div>

      {/* Popup Content with enhanced animations */}
      <div 
        className={`relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all duration-700 ease-out ${
          isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-8'
        }`}
        style={{
          boxShadow: '0 20px 60px rgba(244, 63, 94, 0.3), 0 0 0 2px rgba(244, 63, 94, 0.15)',
          zIndex: 99999
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Pink/Red Glow Border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-400/30 via-red-400/30 to-pink-400/30 blur-2xl animate-pulse"></div>
        <div className="absolute inset-[1px] rounded-2xl bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-orange-500/10 rounded-full blur-2xl"></div>
        
        {/* Close Button - Enhanced */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 bg-white/95 rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 transition-all duration-300 hover:scale-110 hover:rotate-90 group border-2 border-gray-200 hover:border-red-300"
          aria-label="Close"
        >
          <i className="fas fa-times text-gray-600 group-hover:text-red-500 transition-colors text-sm"></i>
        </button>

        {/* Content */}
        <div className="relative z-10 p-5 sm:p-6">
          {/* Header with enhanced styling */}
          <div className="text-center mb-4">
            <div className="inline-block bg-gradient-to-r from-red-600 via-red-500 to-pink-600 text-white px-6 py-2 rounded-full mb-3 shadow-xl transform hover:scale-105 transition-transform relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              <span className="text-3xl sm:text-4xl font-black relative z-10 drop-shadow-lg">11.11</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-red-600 mb-1 drop-shadow-sm">
              ดีลพิเศษช้อปคุ้ม
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm font-medium">
              สินค้าลดราคาพิเศษสุดคุ้ม
            </p>
          </div>

          {/* Discount Badge - Enhanced */}
          <div className="text-center mb-4">
            <div className="inline-block bg-gradient-to-br from-red-500 via-red-500 to-orange-500 text-white px-8 py-4 rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden group">
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="relative z-10">
                <div className="text-sm sm:text-base font-bold mb-1 flex items-center justify-center gap-1.5">
                  <i className="fas fa-bolt text-yellow-300 animate-pulse text-xs"></i>
                  <span>ลดสูงสุด</span>
                </div>
                <div className="text-5xl sm:text-6xl font-black drop-shadow-xl">{maxDiscount}%</div>
              </div>
            </div>
          </div>

          {/* Product Preview (if available) - Enhanced */}
          {product && product.images?.[0] && (
            <div className="mb-4 flex justify-center">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-xl overflow-hidden shadow-lg transform hover:scale-105 transition-transform group">
                <img
                  src={product.images[0].url || product.images[0].secure_url}
                  alt={product.title}
                  className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-110"
                  onError={e => (e.target.src = 'https://via.placeholder.com/200x200?text=Product')}
                />
                {/* Discount Badge on Product */}
                <div className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-orange-500 text-white px-2 py-1 rounded-lg text-xs font-black shadow-lg border-2 border-white/50 animate-bounce">
                  -{maxDiscount}%
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </div>
          )}

          {/* Fire Icon - Enhanced */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <i className="fas fa-fire text-4xl sm:text-5xl text-orange-500 animate-pulse drop-shadow-xl"></i>
              <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-50 animate-pulse"></div>
              <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-30 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>

          {/* CTA Button - Enhanced Shopee Style */}
          <button
            onClick={handleShopNow}
            className="w-full bg-white border-2 border-black rounded-xl py-3.5 px-5 font-black text-base hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group relative overflow-hidden"
          >
            {/* Button glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-orange-500/10 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative z-10">ช้อปเลย</span>
            <i className="fas fa-arrow-right group-hover:translate-x-2 transition-transform relative z-10 text-sm"></i>
          </button>

          {/* Additional Info - Enhanced */}
          <p className="text-center text-xs text-gray-500 mt-3 font-medium">
            <i className="fas fa-clock text-orange-500 mr-1 text-xs"></i>
            *โปรโมชั่นมีจำกัด รีบช้อปก่อนหมด!
          </p>
        </div>
      </div>
    </div>
  );
};

export default DiscountAlert;

