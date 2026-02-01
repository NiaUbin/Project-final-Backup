import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import UserDashboard from './UserDashboard';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { getCartItemCount } = useCart();
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    users: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Redirect admin to /admin page
  useEffect(() => {
    if (isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, navigate]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load user orders
      const ordersResponse = await axios.get('/api/user/order');
      setRecentOrders(ordersResponse.data.orders?.slice(0, 5) || []);
      setStats(prev => ({ ...prev, orders: ordersResponse.data.count || 0 }));

      // Load admin stats if admin
      if (isAdmin) {
        try {
          const usersResponse = await axios.get('/api/users');
          setStats(prev => ({ ...prev, users: usersResponse.data.count || 0 }));
        } catch (error) {
          console.error('Error loading admin stats:', error);
        }
      }

      // Load products count
      try {
        const productsResponse = await axios.get('/api/products/100');
        setStats(prev => ({ ...prev, products: productsResponse.data.products?.length || 0 }));
      } catch (error) {
        console.error('Error loading products:', error);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const quickActions = [
    {
      title: 'ดูสินค้า',
      description: 'เรียกดูสินค้าทั้งหมด',
      icon: 'fas fa-box',
      color: 'bg-blue-500',
      link: '/products'
    },
    {
      title: 'ตะกร้าสินค้า',
      description: `มีสินค้า ${getCartItemCount()} รายการ`,
      icon: 'fas fa-shopping-cart',
      color: 'bg-green-500',
      link: '/cart'
    },
    {
      title: 'คำสั่งซื้อ',
      description: `มี ${stats.orders} คำสั่งซื้อ`,
      icon: 'fas fa-receipt',
      color: 'bg-purple-500',
      link: '/orders'
    },
    {
      title: 'โปรไฟล์',
      description: 'จัดการข้อมูลส่วนตัว',
      icon: 'fas fa-user',
      color: 'bg-orange-500',
      link: '/profile'
    }
  ];

  if (isAdmin) {
    quickActions.push({
      title: 'จัดการระบบ',
      description: `มีผู้ใช้ ${stats.users} คน`,
      icon: 'fas fa-cog',
      color: 'bg-red-500',
      link: '/admin'
    });
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Admin should be redirected, but show loading just in case
  if (isAdmin) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return <UserDashboard user={user} stats={stats} loading={loading} recentOrders={recentOrders} />;
};

export default Dashboard;
