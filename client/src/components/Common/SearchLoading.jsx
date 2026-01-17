import React from 'react';

const SearchLoading = ({ size = 'md', text = 'กำลังค้นหา...' }) => {
  return (
    <div className="flex items-center justify-center gap-2 py-2">
      <div className="relative">
        {/* Outer ring */}
        <div className={`${
          size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'
        } border-2 border-gray-200 rounded-full`}></div>
        
        {/* Spinning ring */}
        <div className={`${
          size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'
        } absolute top-0 left-0 border-2 border-transparent border-t-gray-600 rounded-full animate-spin`}></div>
      </div>
      {text && (
        <span className={`text-gray-600 ${
          size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
        }`}>
          {text}
        </span>
      )}
    </div>
  );
};

export default SearchLoading;

