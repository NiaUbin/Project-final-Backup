import React from 'react';

const PageLoading = ({ text = 'กำลังโหลด...' }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
      <div className="text-center">
        {/* Main Spinner with Glow Effect */}
        <div className="relative inline-block mb-8">
          {/* Glow effect */}
          <div className="absolute inset-0 w-20 h-20 -m-2 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full opacity-20 blur-xl animate-pulse"></div>
          
          {/* Outer ring */}
          <div className="relative w-20 h-20 border-4 border-orange-100 rounded-full"></div>
          
          {/* Spinning ring with gradient */}
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-orange-500 border-r-orange-400 rounded-full animate-spin"></div>
          
          {/* Middle ring (counter spin) */}
          <div className="absolute top-2 left-2 w-16 h-16 border-[3px] border-transparent border-b-orange-300 border-l-orange-200 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          
          {/* Inner dot with pulse */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full animate-pulse shadow-lg shadow-orange-500/50"></div>
        </div>
        
        {/* Text with gradient */}
        {text && (
          <div className="mb-6">
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 font-semibold text-xl mb-2 animate-pulse">
              {text}
            </p>
            {/* Progress bar animation */}
            <div className="w-48 h-1 bg-orange-100 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 rounded-full animate-[loading_1.5s_ease-in-out_infinite]"></div>
            </div>
          </div>
        )}
        
        {/* Animated dots with gradient */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full animate-bounce shadow-md shadow-orange-500/30" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full animate-bounce shadow-md shadow-orange-500/30" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full animate-bounce shadow-md shadow-orange-500/30" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default PageLoading;

