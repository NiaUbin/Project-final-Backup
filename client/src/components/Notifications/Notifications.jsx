import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดการแจ้งเตือน');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // อัพเดต state
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'payment_pending':
        return { icon: 'fas fa-clock', color: 'text-yellow-500' };
      case 'payment_approved':
        return { icon: 'fas fa-check-circle', color: 'text-green-500' };
      case 'payment_rejected':
        return { icon: 'fas fa-times-circle', color: 'text-red-500' };
      default:
        return { icon: 'fas fa-bell', color: 'text-blue-500' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                🔔 การแจ้งเตือน
              </h1>
              <p className="text-blue-100 text-lg">
                ข้อมูลสำคัญและการอัพเดตล่าสุด
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {unreadCount}
              </div>
              <div className="text-blue-100 text-sm">
                ยังไม่ได้อ่าน
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {unreadCount > 0 && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <i className="fas fa-check-double mr-2"></i>
            ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว
          </button>
        </div>
      )}

      {/* Notifications */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">📬</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">ไม่มีการแจ้งเตือน</h3>
          <p className="text-gray-600">คุณไม่มีการแจ้งเตือนใหม่ในขณะนี้</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const iconInfo = getNotificationIcon(notification.type);

            return (
              <div
                key={notification.id}
                onClick={() => !notification.isRead && markAsRead(notification.id)}
                className={`bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden cursor-pointer transition-all hover:shadow-xl ${!notification.isRead ? 'border-l-4 border-l-blue-500' : ''
                  }`}
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${!notification.isRead ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                      <i className={`${iconInfo.icon} ${iconInfo.color} text-xl`}></i>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`text-lg font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                            {notification.title}
                          </h3>
                          <p className={`mt-1 ${!notification.isRead ? 'text-gray-800' : 'text-gray-600'
                            }`}>
                            {notification.message}
                          </p>
                        </div>

                        {/* Status */}
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.isRead && (
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          )}
                          <span className="text-sm text-gray-500">
                            {new Date(notification.createdAt).toLocaleDateString('th-TH')}
                          </span>
                        </div>
                      </div>

                      {/* Additional Info */}
                      {notification.order && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">คำสั่งซื้อ #{notification.order.id}</span>
                            {notification.payment && (
                              <>
                                <span className="mx-2">•</span>
                                <span>฿{notification.payment.amount.toLocaleString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
