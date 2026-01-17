import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'blue', text = 'กำลังโหลด...' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colorClasses = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    purple: 'border-purple-500',
    red: 'border-red-500',
    orange: 'border-orange-500'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative">
        {/* Main spinner */}
        <div className={`animate-spin rounded-full ${sizeClasses[size]} border-4 border-gray-200 ${colorClasses[color]}`}></div>
        
        {/* Inner spinner */}
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full ${
          size === 'xl' ? 'h-8 w-8' : size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'
        } border-2 border-gray-100 border-t-${color}-400`} style={{animationDirection: 'reverse'}}></div>
      </div>
      
      {text && (
        <p className={`mt-4 text-gray-600 font-medium ${
          size === 'xl' ? 'text-lg' : size === 'lg' ? 'text-base' : 'text-sm'
        }`}>
          {text}
        </p>
      )}
      
      {/* Pulse dots */}
      <div className="flex items-center space-x-1 mt-2">
        <div className={`w-2 h-2 bg-${color}-500 rounded-full animate-pulse`} style={{animationDelay: '0ms'}}></div>
        <div className={`w-2 h-2 bg-${color}-500 rounded-full animate-pulse`} style={{animationDelay: '150ms'}}></div>
        <div className={`w-2 h-2 bg-${color}-500 rounded-full animate-pulse`} style={{animationDelay: '300ms'}}></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
