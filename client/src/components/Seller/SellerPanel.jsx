import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import ProductForm from '../Admin/ProductForm';
import CategoryManagement from '../Admin/CategoryManagement';
import LogoutModal from '../Common/LogoutModal';

const SellerPanel = () => {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Store State
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', logo: '' });
  
  // Products State
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Sales State
  const [salesData, setSalesData] = useState(null);
  const [loadingSales, setLoadingSales] = useState(false);
  
  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [viewingSlip, setViewingSlip] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(new Set());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [activeTab]);

  const menuItems = [
    { id: 'dashboard', label: 'ภาพรวมร้านค้า', icon: 'fas fa-chart-line' },
    { id: 'products', label: 'สินค้า', icon: 'fas fa-box' },
    { id: 'orders', label: 'คำสั่งซื้อ', icon: 'fas fa-shopping-bag' },
    { id: 'sales', label: 'รายงานการขาย', icon: 'fas fa-chart-bar' },
    { id: 'categories', label: 'หมวดหมู่', icon: 'fas fa-tags' },
    { id: 'settings', label: 'ตั้งค่าร้านค้า', icon: 'fas fa-cog' }
  ];

  // Load Store
  const loadStore = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/my/store');
      setStore(data.store);
      if (data.store) {
        setForm({
          name: data.store.name || '',
          description: data.store.description || '',
          logo: data.store.logo || ''
        });
      }
    } catch (error) {
      console.error('Load store error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStore(); }, [loadStore]);

  // Load Sales
  const loadSales = async () => {
    setLoadingSales(true);
    try {
      const { data } = await axios.get('/api/my/store/sales');
      setSalesData(data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'ไม่สามารถโหลดข้อมูลการขายได้');
      setSalesData(null);
    } finally {
      setLoadingSales(false);
    }
  };

  // Load Orders
  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (selectedOrderStatus !== 'all') {
        params.append('status', selectedOrderStatus);
      }
      const response = await axios.get(`/api/my/store/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Load orders error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดคำสั่งซื้อ');
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [selectedOrderStatus]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeTab === 'sales' && store) {
      loadSales();
    } else if (activeTab === 'orders' && store) {
      loadOrders();
    }
  }, [activeTab, store, selectedOrderStatus, loadOrders]);

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(prev => new Set(prev).add(orderId));
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/my/store/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('อัพเดตสถานะสำเร็จ');
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, oderStatus: newStatus } : order
      ));
    } catch (error) {
      console.error('Update status error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัพเดตสถานะ');
    } finally {
      setUpdatingStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // Save Store
  const saveStore = async (e) => {
    e.preventDefault();
    try {
      await axios.put('/api/my/store', form);
      toast.success('บันทึกข้อมูลร้านค้าสำเร็จ');
      loadStore();
    } catch (e) {
      toast.error(e.response?.data?.message || 'บันทึกล้มเหลว');
    }
  };

  // Remove Product
  const removeProduct = async (id) => {
    if (!window.confirm('ยืนยันลบสินค้า?')) return;
    try {
      await axios.delete(`/api/seller/product/${id}`);
      toast.success('ลบสินค้าสำเร็จ');
      loadStore();
    } catch (e) {
      toast.error('ลบสินค้าไม่สำเร็จ');
    }
  };

  // Helper functions
  const getStatusBadge = (status) => {
    const statusMap = {
      'Not Process': { label: 'รอดำเนินการ', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: 'fas fa-clock' },
      'Processing': { label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: 'fas fa-spinner' },
      'Shipped': { label: 'จัดส่งแล้ว', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: 'fas fa-truck' },
      'Delivered': { label: 'จัดส่งสำเร็จ', color: 'bg-green-100 text-green-700 border-green-200', icon: 'fas fa-check-circle' },
      'Cancelled': { label: 'ยกเลิก', color: 'bg-red-100 text-red-700 border-red-200', icon: 'fas fa-times-circle' }
    };
    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-700 border-gray-200', icon: 'fas fa-question' };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 border ${statusInfo.color}`}>
        <i className={statusInfo.icon}></i>
        {statusInfo.label}
      </span>
    );
  };

  const getPaymentMethodBadge = (method) => {
    const methodMap = {
      'cash': { label: 'เก็บเงินปลายทาง', icon: 'fas fa-money-bill-wave', color: 'bg-green-50 text-green-700' },
      'credit_card': { label: 'บัตรเครดิต/เดบิต', icon: 'fas fa-credit-card', color: 'bg-blue-50 text-blue-700' },
      'qr_code': { label: 'QR Code', icon: 'fas fa-qrcode', color: 'bg-purple-50 text-purple-700' }
    };
    const methodInfo = methodMap[method] || { label: method, icon: 'fas fa-wallet', color: 'bg-gray-50 text-gray-700' };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${methodInfo.color}`}>
        <i className={methodInfo.icon}></i>
        {methodInfo.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 border-4 border-orange-100 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-[#ee4d2d] rounded-full animate-spin"></div>
          </div>
          <p className="text-[#ee4d2d] font-medium">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // No Store
  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md bg-white rounded-lg shadow-lg p-8">
          <div className="w-20 h-20 bg-[#fef0ed] rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-store text-[#ee4d2d] text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ยังไม่มีร้านค้า</h2>
          <p className="text-gray-500 mb-6">สร้างร้านค้าของคุณเพื่อเริ่มขายสินค้า</p>
          <Link
            to="/become-seller"
            className="inline-block px-6 py-3 bg-[#ee4d2d] text-white rounded-lg hover:bg-[#d73211] transition-all font-medium"
          >
            <i className="fas fa-plus mr-2"></i>สร้างร้านค้า
          </Link>
        </div>
      </div>
    );
  }

  // Suspended Store
  if (store.status === 'suspended') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-2xl overflow-hidden relative border border-red-100">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-red-400 to-orange-400"></div>
          <div className="p-10 text-center">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <i className="fas fa-store-slash text-red-500 text-4xl"></i>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">ร้านค้าถูกระงับการใช้งาน</h2>
            <p className="text-gray-500 mb-8">
              ร้านค้า <span className="font-semibold text-gray-700">"{store.name}"</span> ของคุณถูกระงับชั่วคราว
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact" className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition-all font-medium">
                <i className="fas fa-headset mr-2"></i>ติดต่อเจ้าหน้าที่
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate Stats
  const totalProducts = store.products?.length || 0;
  const inStockProducts = store.products?.filter(p => p.quantity > 0).length || 0;
  const outOfStockProducts = totalProducts - inStockProducts;
  const totalSold = store.products?.reduce((sum, p) => sum + (p.sold || 0), 0) || 0;
  const totalRevenue = store.products?.reduce((sum, p) => sum + (p.price * (p.sold || 0)), 0) || 0;

  const activeMenu = menuItems.find(item => item.id === activeTab);

  // Render Content
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'products':
        return renderProducts();
      case 'orders':
        return renderOrders();
      case 'sales':
        return renderSales();
      case 'categories':
        return <CategoryManagement />;
      case 'settings':
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  // Dashboard Tab
  const renderDashboard = () => (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">สินค้าทั้งหมด</p>
              <p className="text-lg font-bold text-gray-900">{totalProducts}</p>
            </div>
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-box text-blue-600 text-sm"></i>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">พร้อมขาย</p>
              <p className="text-lg font-bold text-green-600">{inStockProducts}</p>
            </div>
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-check-circle text-green-600 text-sm"></i>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">สินค้าหมด</p>
              <p className="text-lg font-bold text-red-600">{outOfStockProducts}</p>
            </div>
            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-times-circle text-red-600 text-sm"></i>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">ขายแล้ว</p>
              <p className="text-lg font-bold text-orange-600">{totalSold} ชิ้น</p>
            </div>
            <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-shopping-cart text-orange-600 text-sm"></i>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">💰 รายได้</p>
              <p className="text-base font-bold text-green-600">฿{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-coins text-green-600 text-sm"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Bestseller Section */}
      {store.products?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔥</span>
            <h3 className="font-semibold text-gray-900 text-sm">สินค้าขายดี Top 3</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[...store.products]
              .sort((a, b) => (b.sold || 0) - (a.sold || 0))
              .slice(0, 3)
              .map((p, index) => {
                const rankIcons = ['🥇', '🥈', '🥉'];
                const rankBg = ['bg-yellow-50 border-yellow-200', 'bg-gray-50 border-gray-200', 'bg-amber-50 border-amber-200'];
                return (
                  <div key={p.id} className={`p-3 rounded-lg border ${rankBg[index]} flex items-center gap-3`}>
                    <span className="text-xl">{rankIcons[index]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{p.title}</p>
                      <p className="text-xs text-orange-600">ขายแล้ว {p.sold || 0} ชิ้น</p>
                    </div>
                    {p.images?.[0] && (
                      <img src={p.images[0].url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );

  // Products Tab
  const renderProducts = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">สินค้าของฉัน</h2>
            <p className="text-xs text-gray-500">จัดการสินค้าในร้านค้า</p>
          </div>
          <button
            onClick={() => { setEditingProduct(null); setShowProductForm(true); }}
            className="px-3 py-1.5 bg-[#ee4d2d] text-white rounded-lg hover:bg-[#d73211] transition-colors text-xs flex items-center gap-1.5"
          >
            <i className="fas fa-plus text-xs"></i>
            เพิ่มสินค้า
          </button>
        </div>

        <div className="p-3">
          {store.products?.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-box-open text-gray-400 text-xl"></i>
              </div>
              <h3 className="font-medium text-gray-900 text-sm mb-1">ยังไม่มีสินค้า</h3>
              <p className="text-xs text-gray-500 mb-3">เริ่มเพิ่มสินค้าแรกของคุณเพื่อเริ่มขาย</p>
              <button
                onClick={() => setShowProductForm(true)}
                className="px-3 py-1.5 bg-[#ee4d2d] text-white rounded-lg hover:bg-[#d73211] text-xs"
              >
                <i className="fas fa-plus mr-1"></i>เพิ่มสินค้าแรก
              </button>
            </div>
          ) : (

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {store.products?.map(p => (
                <div key={p.id} className="group bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    {p.images?.[0] ? (
                      <img src={p.images[0].url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <i className="fas fa-image text-xl"></i>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 text-[10px] font-bold text-white rounded ${p.quantity > 10 ? 'bg-green-500' : p.quantity > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                        {p.quantity > 0 ? `${p.quantity}` : 'หมด'}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm text-gray-800 line-clamp-2 min-h-[40px] mb-2">{p.title}</h3>
                    <p className="text-[#ee4d2d] font-semibold text-base mb-1">฿{p.price.toLocaleString()}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span className="truncate">{p.category?.name || 'อื่นๆ'}</span>
                      <span className="text-orange-600">ขาย {p.sold || 0}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Link to={`/product/${p.id}`} className="py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-all text-center text-xs">
                        <i className="fas fa-eye"></i>
                      </Link>
                      <button onClick={() => { setEditingProduct(p); setShowProductForm(true); }} className="py-1.5 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition-all text-xs">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button onClick={() => removeProduct(p.id)} className="py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-all text-[10px]">
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Orders Tab
  const renderOrders = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">จัดการคำสั่งซื้อ</h2>
            <p className="text-sm text-gray-500">ดูและอัพเดตสถานะคำสั่งซื้อ</p>
          </div>
          <button onClick={loadOrders} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm flex items-center gap-2">
            <i className="fas fa-sync-alt"></i>
            รีเฟรช
          </button>
        </div>

        {/* Status Filter */}
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'ทั้งหมด' },
              { value: 'Not Process', label: 'รอดำเนินการ' },
              { value: 'Processing', label: 'กำลังดำเนินการ' },
              { value: 'Shipped', label: 'จัดส่งแล้ว' },
              { value: 'Delivered', label: 'จัดส่งสำเร็จ' },
              { value: 'Cancelled', label: 'ยกเลิก' },
            ].map(status => (
              <button
                key={status.value}
                onClick={() => setSelectedOrderStatus(status.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedOrderStatus === status.value
                  ? 'bg-[#ee4d2d] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-[#ee4d2d] hover:text-[#ee4d2d]'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="p-5">
          {loadingOrders ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-orange-100 border-t-[#ee4d2d] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-inbox text-gray-400 text-3xl"></i>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">ยังไม่มีคำสั่งซื้อ</h3>
              <p className="text-sm text-gray-500">เมื่อมีลูกค้าสั่งซื้อ จะแสดงที่นี่</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900">#{order.id}</span>
                      {getStatusBadge(order.oderStatus)}
                      <span className="text-sm text-gray-500">{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#ee4d2d] font-semibold">฿{order.storeOrderTotal?.toLocaleString() || order.cartTotal?.toLocaleString()}</span>
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm"
                      >
                        <i className={`fas fa-chevron-${expandedOrder === order.id ? 'up' : 'down'}`}></i>
                      </button>
                    </div>
                  </div>

                  {expandedOrder === order.id && (
                    <div className="p-5 space-y-5">
                      {/* Products */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase">สินค้าในคำสั่งซื้อ</h4>
                        <div className="space-y-2">
                          {order.storeProducts?.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                              <div className="w-14 h-14 bg-white rounded-lg overflow-hidden border border-gray-200">
                                {item.product?.images?.[0] ? (
                                  <img src={item.product.images[0].url || item.product.images[0].secure_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <i className="fas fa-image"></i>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.product?.title || 'สินค้า'}</p>
                                <p className="text-xs text-gray-500">x{item.count} • ฿{item.price.toLocaleString()}</p>
                              </div>
                              <span className="font-semibold text-[#ee4d2d]">฿{(item.price * item.count).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Payment Info */}
                      {order.payments && order.payments.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase">การชำระเงิน</h4>
                          {order.payments.map((payment, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {getPaymentMethodBadge(payment.method)}
                                  <span className={`text-xs font-medium ${payment.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {payment.status === 'completed' ? '✓ ชำระแล้ว' : 'รอชำระ'}
                                  </span>
                                </div>
                                <span className="font-medium text-gray-900">฿{payment.amount?.toLocaleString()}</span>
                              </div>
                              {payment.paymentSlipUrl && (
                                <button
                                  onClick={() => setViewingSlip(payment.paymentSlipUrl)}
                                  className="text-sm text-[#ee4d2d] hover:underline flex items-center gap-1"
                                >
                                  <i className="fas fa-image"></i>
                                  ดูสลีปการโอนเงิน
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Customer Info */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase">ข้อมูลลูกค้า</h4>
                        <div className="p-4 bg-gray-50 rounded-lg text-sm space-y-1">
                          <p><span className="text-gray-500">ชื่อ:</span> {order.orderedBy?.name || 'ไม่ระบุ'}</p>
                          <p><span className="text-gray-500">อีเมล:</span> {order.orderedBy?.email || 'ไม่ระบุ'}</p>
                          {order.orderedBy?.phone && <p><span className="text-gray-500">โทร:</span> {order.orderedBy.phone}</p>}
                          {order.shippingAddress && <p><span className="text-gray-500">ที่อยู่:</span> {order.shippingAddress}</p>}
                        </div>
                      </div>

                      {/* Update Status */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase">อัพเดตสถานะ</h4>
                        <div className="flex flex-wrap gap-2">
                          {['Not Process', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                            order.oderStatus !== status && (
                              <button
                                key={status}
                                onClick={() => {
                                  if (status === 'Cancelled' && !window.confirm('ยืนยันยกเลิกคำสั่งซื้อ?')) return;
                                  handleUpdateOrderStatus(order.id, status);
                                }}
                                disabled={updatingStatus.has(order.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${status === 'Cancelled'
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                  : status === 'Delivered'
                                    ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                    : status === 'Shipped'
                                      ? 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                }`}
                              >
                                {status === 'Not Process' && 'รอดำเนินการ'}
                                {status === 'Processing' && 'กำลังดำเนินการ'}
                                {status === 'Shipped' && 'จัดส่งแล้ว'}
                                {status === 'Delivered' && 'จัดส่งสำเร็จ'}
                                {status === 'Cancelled' && 'ยกเลิก'}
                              </button>
                            )
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Sales Tab
  const renderSales = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 text-lg mb-4">รายงานการขาย</h2>
        {loadingSales ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-orange-100 border-t-[#ee4d2d] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        ) : salesData && salesData.summary ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-600 mb-1">ยอดขายรวม</p>
                <p className="text-2xl font-bold text-blue-700">฿{salesData.summary.totalRevenue?.toLocaleString() || 0}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <p className="text-sm text-green-600 mb-1">จำนวนออเดอร์</p>
                <p className="text-2xl font-bold text-green-700">{salesData.summary.totalOrders || 0}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl">
                <p className="text-sm text-purple-600 mb-1">จำนวนสินค้าที่ขายได้</p>
                <p className="text-2xl font-bold text-purple-700">{salesData.summary.totalQuantity || 0} ชิ้น</p>
              </div>
            </div>

            {/* Sales Details Table */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">รายละเอียดสินค้าขายดี</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-y border-gray-200 text-xs text-gray-500 uppercase">
                      <th className="py-3 px-4 font-medium">สินค้า</th>
                      <th className="py-3 px-4 font-medium text-center">ราคาขาย</th>
                      <th className="py-3 px-4 font-medium text-center">ขายได้ (ชิ้น)</th>
                      <th className="py-3 px-4 font-medium text-right">ยอดรวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {salesData.sales?.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-400 w-4">{index + 1}</span>
                            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                              {item.product.images && item.product.images[0] ? (
                                <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <i className="fas fa-image text-xs"></i>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{item.product.title}</p>
                              <p className="text-xs text-gray-500">{item.product.category?.name || 'อื่นๆ'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-gray-600">฿{item.product.price.toLocaleString()}</td>
                        <td className="py-3 px-4 text-center text-sm font-medium text-gray-900">{item.totalQuantity}</td>
                        <td className="py-3 px-4 text-right text-sm font-bold text-green-600">฿{item.totalRevenue.toLocaleString()}</td>
                      </tr>
                    ))}
                    {(!salesData.sales || salesData.sales.length === 0) && (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-sm text-gray-500">
                          ยังไม่มีข้อมูลการขาย
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">ไม่มีข้อมูลการขาย</p>
        )}
      </div>
    </div>
  );

  // Settings Tab
  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 text-lg mb-6">ตั้งค่าร้านค้า</h2>
        
        {/* Store Info */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
          <div className="w-16 h-16 bg-[#ee4d2d] rounded-xl flex items-center justify-center overflow-hidden">
            {store.logo ? (
              <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
            ) : (
              <i className="fas fa-store text-white text-2xl"></i>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{store.name}</h3>
            <p className="text-sm text-gray-500">{store.description || 'ไม่มีคำอธิบาย'}</p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={saveStore} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อร้าน *</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="ชื่อร้านค้า"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">โลโก้ (URL)</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="https://..."
                value={form.logo}
                onChange={(e) => setForm({ ...form, logo: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">คำอธิบายร้าน</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows={3}
              placeholder="รายละเอียดร้านค้า..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            ></textarea>
          </div>
          <div className="flex justify-end gap-3">
            <Link to={`/store/${store.id}`} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm">
              <i className="fas fa-eye mr-2"></i>ดูหน้าร้าน
            </Link>
            <button type="submit" className="px-6 py-2 bg-[#ee4d2d] text-white rounded-lg hover:bg-[#d73211] text-sm">
              <i className="fas fa-save mr-2"></i>บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed */}
      <aside className={`
        fixed top-0 left-0 h-screen w-56 bg-gradient-to-b from-white via-white to-orange-50 border-r border-orange-100 z-50 
        transform transition-transform duration-200 shadow-sm
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-14 flex items-center px-4 border-b border-orange-100/50 flex-shrink-0 bg-white/50 backdrop-blur-sm">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-orange-200 shadow-md">
                <i className="fas fa-store text-white text-sm"></i>
              </div>
              <div>
                <span className="font-bold text-gray-800 tracking-tight text-lg">BoxiFY</span>
                <span className="text-[11px] text-orange-600 block -mt-1 font-medium tracking-wider">จัดการร้านค้า (SELLER)</span>
              </div>
            </Link>
          </div>

          {/* Store Info */}
          <div className="p-4 border-b border-orange-100/50">
            <div className="flex items-center gap-3 p-2 bg-orange-50/50 rounded-xl border border-orange-100">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                {store.logo ? (
                  <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                ) : (
                  <i className="fas fa-store text-orange-400 text-sm"></i>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate">{store.name}</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <p className="text-[10px] text-gray-500 truncate">ออนไลน์</p>
                </div>
              </div>
            </div>
          </div>

          {/* Menu - scrollable if needed */}
          <nav className="flex-1 p-3 overflow-y-auto">
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 mt-1">เมนูหลัก</p>
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group relative overflow-hidden ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 shadow-sm'
                        : 'text-gray-600 hover:bg-white hover:shadow-sm hover:text-orange-600'
                    }`}
                  >
                    {activeTab === item.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-r-full"></div>
                    )}
                    <i className={`${item.icon} w-5 text-center text-sm ${activeTab === item.id ? 'text-orange-500' : 'text-gray-400 group-hover:text-orange-400'}`}></i>
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* User & Logout - fixed at bottom */}
          <div className="p-3 border-t border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center overflow-hidden border border-orange-200">
                {store.logo || user?.picture ? (
                  <img 
                    src={store.logo || user?.picture} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-xs font-bold">{user?.name?.charAt(0)?.toUpperCase() || 'S'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{user?.name || 'Seller'}</p>
                <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <i className="fas fa-sign-out-alt text-xs"></i>
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content - with left margin on desktop */}
      <main className="lg:ml-56 min-h-screen bg-gray-50 relative">
        {/* Header - sticky */}
        <header className="h-14 bg-white/90 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-3 lg:px-6 sticky top-0 z-30 shadow-sm transition-all">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <i className="fas fa-bars text-sm"></i>
            </button>
            <h1 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-orange-500 rounded-full inline-block"></span>
              {activeMenu?.label}
            </h1>
          </div>

          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] text-green-700 font-medium">ร้านค้าเปิดอยู่</span>
            </div>

            <Link 
              to="/" 
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50/50 rounded-lg transition-all border border-transparent hover:border-orange-100"
            >
              <i className="fas fa-external-link-alt text-xs"></i>
              <span>ดูหน้าร้าน</span>
            </Link>
          </div>
        </header>

        {/* Comfortable Backdrop - Warm & Soft */}
        <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-orange-100/80 to-gray-50 z-0"></div>

        {/* Content */}
        <div className="p-3 lg:p-6 relative z-10">
          {renderContent()}
        </div>
      </main>

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm
          editingProduct={editingProduct}
          onSuccess={() => { setShowProductForm(false); setEditingProduct(null); loadStore(); }}
          onClose={() => { setShowProductForm(false); setEditingProduct(null); }}
          isSeller={true}
          createEndpoint="/api/seller/product"
          updateEndpointBase="/api/seller/product"
        />
      )}


      {/* Slip Viewer Modal */}
      {viewingSlip && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={() => setViewingSlip(null)}>
          <div className="max-w-sm w-full bg-white rounded-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-semibold text-gray-900 text-sm">สลีปการโอนเงิน</h3>
              <button onClick={() => setViewingSlip(null)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded-md transition-colors">
                <i className="fas fa-times text-xs"></i>
              </button>
            </div>
            <div className="p-3 bg-black/5">
              <img src={viewingSlip} alt="Payment Slip" className="w-full rounded border border-gray-200 shadow-sm" />
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <LogoutModal 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
      />
    </div>
  );
};

export default SellerPanel;
