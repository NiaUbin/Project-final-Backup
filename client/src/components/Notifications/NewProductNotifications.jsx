import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const NewProductNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/notifications/new-products?page=${page}&limit=20`);
      setNotifications(response.data.notifications || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'เมื่อสักครู่';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} วันที่แล้ว`;
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getFilteredNotifications = () => {
    if (filter === 'all') return notifications;
    
    const now = new Date();
    return notifications.filter(n => {
      const date = new Date(n.createdAt);
      const diffInMs = now - date;
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
      
      if (filter === 'today') return diffInDays < 1;
      if (filter === 'week') return diffInDays < 7;
      return true;
    });
  };

  const filteredNotifications = getFilteredNotifications();

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
          <div className="flex gap-4">
            <div className="w-28 h-28 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 space-y-3 py-2">
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-5 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-14">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-xl text-center text-bold sm:text-2xl font-bold text-white mb-1 mt-4">
            <i className="fas fa-box-open text-3xl text-orange-400"></i> สินค้าใหม่
          </h1>
          <p className="text-orange-100 text-sm text-center text-bold">
            อัปเดตสินค้าใหม่ล่าสุดจากร้านค้าของเรา • {notifications.length} รายการ
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'ทั้งหมด' },
            { key: 'today', label: 'วันนี้' },
            { key: 'week', label: 'สัปดาห์นี้' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
          
          <button
            onClick={loadNotifications}
            disabled={loading}
            className="ml-auto p-2 bg-white text-gray-500 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
          </button>
        </div>

        {/* Notifications Grid */}
        {loading ? (
          <LoadingSkeleton />
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl">
            <div className="w-20 h-20 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <i className="fas fa-box-open text-3xl text-orange-400"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">ยังไม่มีสินค้าใหม่</h3>
            <p className="text-gray-500 text-sm mb-4">รอติดตามสินค้าใหม่ได้เร็วๆ นี้</p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-5 py-2 bg-orange-500 text-white text-sm font-medium rounded-full hover:bg-orange-600 transition-colors"
            >
              ดูสินค้าทั้งหมด
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotifications.map((notification) => (
              <Link
                key={notification.id}
                to={`/product/${notification.data?.productId || notification.productId}`}
                className="block bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="flex">
                  {/* Product Image */}
                  <div className="relative w-32 h-32 flex-shrink-0 bg-gray-100">
                    {notification.data?.productImage ? (
                      <img
                        src={notification.data.productImage}
                        alt={notification.data?.productTitle || 'สินค้าใหม่'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="fas fa-image text-3xl text-gray-300"></i>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-medium px-2 py-0.5 rounded">
                      ใหม่
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                    {/* Store Info */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs overflow-hidden flex-shrink-0">
                        {notification.data?.storeLogo ? (
                          <img src={notification.data.storeLogo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <i className="fas fa-store text-[10px]"></i>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 truncate">
                        {notification.data?.storeName || 'ร้านค้า'}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>

                    {/* Product Title */}
                    <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2">
                      {notification.data?.productTitle || notification.title}
                    </h3>

                    {/* Price */}
                    <div className="text-lg font-bold text-orange-500">
                      ฿{notification.data?.productPrice?.toLocaleString() || '-'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-chevron-left text-sm"></i>
            </button>
            
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={i}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-chevron-right text-sm"></i>
            </button>
          </div>
        )}

        {/* Back to Products */}
        <div className="text-center mt-8">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium text-sm"
          >
            <i className="fas fa-arrow-left"></i>
            กลับไปหน้าสินค้า
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NewProductNotifications;
