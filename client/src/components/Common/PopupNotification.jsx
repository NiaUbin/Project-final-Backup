import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PopupNotification = ({ message, type = 'success', isVisible, onClose }) => {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(() => onClose(), 500);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const getIcon = () => {
    const iconClass = {
      success: 'fas fa-check text-green-600',
      error: 'fas fa-times text-red-600',
      warning: 'fas fa-exclamation text-yellow-600',
      info: 'fas fa-info text-blue-600',
    }[type];

    const bgClass = {
      success: 'from-green-100 to-green-200',
      error: 'from-red-100 to-red-200',
      warning: 'from-yellow-100 to-yellow-200',
      info: 'from-blue-100 to-blue-200',
    }[type];

    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 250, damping: 15 }}
        className={`w-20 h-20 bg-gradient-to-br ${bgClass} rounded-full flex items-center justify-center shadow-xl mx-auto relative`}
      >
        {/* Glow Effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-white opacity-20 blur-lg"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {/* Icon */}
        <i className={`${iconClass} text-4xl relative z-10`}></i>
      </motion.div>
    );
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success': return 'border-green-200';
      case 'error': return 'border-red-200';
      case 'warning': return 'border-yellow-200';
      case 'info': return 'border-blue-200';
      default: return 'border-gray-200';
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            className={`relative bg-white rounded-3xl shadow-[0_0_40px_rgba(255,255,255,0.15)] border-2 ${getBorderColor()} p-10 max-w-md w-full mx-6 overflow-hidden`}
          >
            {/* Gradient Background */}
            <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"></div>

            {/* Floating particles */}
            <motion.div
              animate={{ y: [0, -15, 0], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-6 right-6 w-3 h-3 bg-white rounded-full"
            />
            <motion.div
              animate={{ y: [0, 20, 0], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              className="absolute bottom-6 left-8 w-2 h-2 bg-white rounded-full"
            />
            <motion.div
              animate={{ x: [0, 10, 0], y: [0, -10, 0], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
              className="absolute top-10 left-10 w-1.5 h-1.5 bg-white rounded-full"
            />

            {/* Content */}
            <div className="relative z-10 text-center">
              {getIcon()}
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-6 text-2xl font-bold text-gray-800"
              >
                {type === 'success' && 'สำเร็จ!'}
                {type === 'error' && 'เกิดข้อผิดพลาด!'}
                {type === 'warning' && 'คำเตือน!'}
                {type === 'info' && 'ข้อมูล!'}
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-3 text-gray-600 text-base leading-relaxed"
              >
                {message}
              </motion.p>
            </div>

            {/* Progress Bar */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 2.5, ease: 'linear' }}
              className={`absolute bottom-0 left-0 h-2 ${
                type === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                type === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                'bg-gradient-to-r from-blue-500 to-blue-600'
              }`}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PopupNotification;
