import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ShopeeNotification = ({ 
  message, 
  type = 'success', 
  isVisible, 
  onClose,
  position = 'bottom-right', // 'bottom-right', 'bottom-left', 'center'
  duration = 3000,
  showIcon = true
}) => {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(() => onClose(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <i className="fas fa-check-circle text-xl"></i>;
      case 'error':
        return <i className="fas fa-times-circle text-xl"></i>;
      case 'warning':
        return <i className="fas fa-exclamation-circle text-xl"></i>;
      case 'info':
        return <i className="fas fa-info-circle text-xl"></i>;
      default:
        return <i className="fas fa-check-circle text-xl"></i>;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-white',
          border: 'border-l-4 border-orange-500',
          iconBg: 'bg-green-50',
          iconColor: 'text-green-600',
          text: 'text-gray-800'
        };
      case 'error':
        return {
          bg: 'bg-white',
          border: 'border-l-4 border-red-500',
          iconBg: 'bg-red-50',
          iconColor: 'text-red-600',
          text: 'text-gray-800'
        };
      case 'warning':
        return {
          bg: 'bg-white',
          border: 'border-l-4 border-yellow-500',
          iconBg: 'bg-yellow-50',
          iconColor: 'text-yellow-600',
          text: 'text-gray-800'
        };
      case 'info':
        return {
          bg: 'bg-white',
          border: 'border-l-4 border-blue-500',
          iconBg: 'bg-blue-50',
          iconColor: 'text-blue-600',
          text: 'text-gray-800'
        };
      default:
        return {
          bg: 'bg-white',
          border: 'border-l-4 border-orange-500',
          iconBg: 'bg-orange-50',
          iconColor: 'text-orange-600',
          text: 'text-gray-800'
        };
    }
  };

  const colors = getColors();

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      default:
        return 'bottom-4 right-4';
    }
  };

  const getAnimationVariants = () => {
    if (position === 'center') {
      return {
        initial: { opacity: 0, scale: 0.8, y: -20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.8, y: -20 }
      };
    } else if (position === 'bottom-left') {
      return {
        initial: { opacity: 0, x: -100, y: 0 },
        animate: { opacity: 1, x: 0, y: 0 },
        exit: { opacity: 0, x: -100, y: 0 }
      };
    } else {
      return {
        initial: { opacity: 0, x: 100, y: 0 },
        animate: { opacity: 1, x: 0, y: 0 },
        exit: { opacity: 0, x: 100, y: 0 }
      };
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`fixed ${getPositionClasses()} z-50 ${position === 'center' ? 'w-96' : 'w-80'} max-w-[calc(100vw-2rem)]`}
          variants={getAnimationVariants()}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 30,
            duration: 0.3
          }}
        >
          <div 
            className={`${colors.bg} ${colors.border} rounded-lg shadow-2xl p-4 flex items-center gap-3 border-t border-r border-b border-gray-200`}
          >
            {/* Icon */}
            {showIcon && (
              <div className={`${colors.iconBg} ${colors.iconColor} w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0`}>
                {getIcon()}
              </div>
            )}
            
            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className={`${colors.text} text-sm font-medium leading-relaxed`}>
                {message}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                setShow(false);
                setTimeout(() => onClose(), 300);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
            >
              <i className="fas fa-times text-sm"></i>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShopeeNotification;

