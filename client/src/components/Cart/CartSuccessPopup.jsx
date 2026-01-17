import React, { useEffect } from 'react';

const CartSuccessPopup = ({ product, quantity, onClose, show }) => {
  useEffect(() => {
    if (show) {
      // Auto close after 2 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show || !product) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-popup-slideUp">
      {/* Notification Card */}
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-sm w-full overflow-hidden">
        {/* Success Indicator Bar */}
        <div className="h-1 bg-gradient-to-r from-green-400 to-green-600"></div>

        {/* Content */}
        <div className="p-4 flex items-center space-x-4">
          {/* Success Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-md">
              <svg 
                className="w-6 h-6 text-white animate-checkmark-bounce" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={3} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start space-x-3">
              {/* Product Image */}
              <div className="flex-shrink-0">
                {product.images && product.images.length > 0 ? (
                  <img 
                    src={product.images[0].url || product.images[0].secure_url || 'https://via.placeholder.com/300x300?text=No+Image'} 
                    alt={product.title}
                    className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                    }}
                  />
                ) : (
                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-image text-gray-400"></i>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 mb-0.5 truncate">
                  เพิ่มลงตะกร้าสำเร็จ!
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {product.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {quantity} ชิ้น • ฿{parseFloat(product.price * quantity).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSuccessPopup;

