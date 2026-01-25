import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const LoginPopup = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />
          
          {/* Popup Content */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 25,
              duration: 0.3
            }}
            className="relative bg-white rounded-lg shadow-xl w-full max-w-[600px] p-10 text-center flex flex-col items-center"
          >
            
            {/* Icon */}
            <div className="w-32 h-32 border-[3px] border-orange-500 rounded-full flex items-center justify-center mb-6">
                <span className="text-6xl text-orange-500 font-light">!</span>
            </div>

            {/* Text */}
            <h2 className="text-2xl text-gray-600 font-semibold mb-3 tracking-wide">
               กรุณาเข้าสู่ระบบ เดี๋ยวตีเลยไอ้ต้าวบ๊าา !!!
            </h2>
            <p className="text-gray-600 text-base mb-8 font-light leading-relaxed">
                คุณต้องเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า
            </p>

            {/* Actions */}
            <Link
              to="/login"
              className="bg-orange-500 hover:bg-orange-600 text-white text-base font-medium px-8 py-2.5 rounded shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
            >
              เข้าสู่ระบบ
            </Link>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoginPopup;
