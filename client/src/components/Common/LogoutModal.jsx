import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  const handleConfirm = () => {
    // Close modal first to show exit animation
    onClose();
    
    // Wait for animation to finish before actual logout
    setTimeout(() => {
      onConfirm();
    }, 400);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              duration: 0.3
            }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden z-10"
          >
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-red-100">
                <i className="fas fa-sign-out-alt text-red-500 text-3xl ml-1"></i>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">ยืนยันการออกจากระบบ</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                คุณต้องการออกจากระบบใช่หรือไม่? <br/>
                คุณจะต้องเข้าสู่ระบบใหม่เพื่อใช้งาน
              </p>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors duration-200"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 font-medium transition-all duration-200 shadow-lg shadow-red-500/30 transform hover:-translate-y-0.5"
                >
                  ออกจากระบบ
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LogoutModal;
