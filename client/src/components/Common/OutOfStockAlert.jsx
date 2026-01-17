import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const OutOfStockAlert = ({ isVisible, onClose, productTitle }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative bg-white rounded-2xl shadow-2xl border-2 border-red-200 max-w-md w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-red-50 opacity-50"></div>
            
            {/* Animated Border Glow */}
            <motion.div
              animate={{ 
                boxShadow: [
                  '0 0 20px rgba(239, 68, 68, 0.3)',
                  '0 0 40px rgba(239, 68, 68, 0.5)',
                  '0 0 20px rgba(239, 68, 68, 0.3)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl"
            />

            {/* Content */}
            <div className="relative z-10 p-8 text-center">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-xl mx-auto mb-6 relative"
              >
                {/* Pulse Effect */}
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-red-500 rounded-full"
                />
                <i className="fas fa-exclamation-triangle text-white text-4xl relative z-10"></i>
              </motion.div>

              {/* Title */}
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-gray-900 mb-3"
              >
                สินค้าหมดสต็อก
              </motion.h3>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 text-base mb-2 leading-relaxed"
              >
                {productTitle ? (
                  <>
                    สินค้า <span className="font-semibold text-red-600">{productTitle}</span> หมดสต็อกแล้ว
                  </>
                ) : (
                  'สินค้านี้หมดสต็อกแล้ว'
                )}
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-500 text-sm mb-6"
              >
                ไม่สามารถเพิ่มลงตะกร้าหรือสั่งซื้อได้
              </motion.p>

              {/* Action Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-semibold hover:from-red-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <i className="fas fa-check-circle mr-2"></i>
                เข้าใจแล้ว
              </motion.button>
            </div>

            {/* Progress Bar */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 3, ease: 'linear' }}
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-600"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OutOfStockAlert;

