import React, { useState } from 'react';

const ProductRefreshButton = ({ onRefresh, loading }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 500); // Small delay for visual feedback
    } catch (error) {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={loading || isRefreshing}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
        loading || isRefreshing
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-700'
      }`}
      title="รีเฟรชรายการสินค้า"
    >
      <i className={`fas fa-sync-alt mr-2 ${isRefreshing ? 'animate-spin' : ''}`}></i>
      {isRefreshing ? 'กำลังโหลด...' : 'รีเฟรช'}
    </button>
  );
};

export default ProductRefreshButton;
