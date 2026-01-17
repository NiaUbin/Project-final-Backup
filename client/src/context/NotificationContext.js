import React, { createContext, useContext, useState } from 'react';
import ShopeeNotification from '../components/Common/ShopeeNotification';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = 'success', options = {}) => {
    const id = Date.now() + Math.random();
    const notification = { 
      id, 
      message, 
      type, 
      isVisible: true,
      position: options.position || 'bottom-right',
      duration: options.duration || 3000
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto remove after animation completes
    const totalDuration = (options.duration || 3000) + 300; // duration + exit animation
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, totalDuration);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Convenience methods
  const showSuccess = (message, options) => showNotification(message, 'success', options);
  const showError = (message, options) => showNotification(message, 'error', options);
  const showWarning = (message, options) => showNotification(message, 'warning', options);
  const showInfo = (message, options) => showNotification(message, 'info', options);

  const value = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Render all notifications */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {notifications.map((notification, index) => {
          const position = notification.position || 'bottom-right';
          const isCenter = position === 'center';
          
          // Group notifications by position
          const samePositionNotifications = notifications.filter(n => (n.position || 'bottom-right') === position);
          const notificationIndex = samePositionNotifications.findIndex(n => n.id === notification.id);
          
          return (
            <div 
              key={notification.id}
              className="pointer-events-auto"
              style={
                isCenter ? {} : {
                  transform: `translateY(-${notificationIndex * 90}px)`
                }
              }
            >
              <ShopeeNotification
                message={notification.message}
                type={notification.type}
                isVisible={notification.isVisible}
                onClose={() => removeNotification(notification.id)}
                position={position}
                duration={notification.duration || 3000}
              />
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};
