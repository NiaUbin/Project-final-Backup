import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ProductForm from '../Admin/ProductForm';
import { CategoryManagement } from '../Admin/AdminPanel';

const SellerDashboard = () => {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingStore, setEditingStore] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', logo: '' });
  const [activeTab, setActiveTab] = useState('products');
  const [salesData, setSalesData] = useState(null);
  const [loadingSales, setLoadingSales] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [viewingSlip, setViewingSlip] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(new Set());

  const load = async () => {
    try {
      const { data } = await axios.get('/api/my/store');
      setStore(data.store);
      if (data.store) {
        setForm({
          name: data.store.name || '',
          description: data.store.description || '',
          logo: data.store.logo || ''
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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

  useEffect(() => {
    if (activeTab === 'sales' && store) {
      loadSales();
    } else if (activeTab === 'orders' && store) {
      loadOrders();
    }
  }, [activeTab, store, selectedOrderStatus]);

  const loadOrders = async () => {
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
  };

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
        order.id === orderId
          ? { ...order, oderStatus: newStatus }
          : order
      ));

      setUpdatingStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    } catch (error) {
      console.error('Update status error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัพเดตสถานะ');
      setUpdatingStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const saveStore = async (e) => {
    e.preventDefault();
    try {
      await axios.put('/api/my/store', form);
      toast.success('บันทึกข้อมูลร้านค้าสำเร็จ');
      setEditingStore(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'บันทึกล้มเหลว');
    }
  };

  const removeProduct = async (id) => {
    if (!window.confirm('ยืนยันลบสินค้า?')) return;
    try {
      await axios.delete(`/api/seller/product/${id}`);
      toast.success('ลบสินค้าสำเร็จ');
      load();
    } catch (e) {
      toast.error('ลบสินค้าไม่สำเร็จ');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center pt-20">
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

  if (!store) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-6 pt-24">
        <div className="text-center max-w-md bg-white rounded-lg shadow-lg p-8">
          <div className="w-20 h-20 bg-[#fef0ed] rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-store text-[#ee4d2d] text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ยังไม่มีร้านค้า</h2>
          <p className="text-gray-500 mb-6">สร้างร้านค้าของคุณเพื่อเริ่มขายสินค้าบน Shopee</p>
          <Link
            to="/become-seller"
            className="inline-block px-6 py-3 bg-[#ee4d2d] text-white rounded-sm hover:bg-[#d73211] transition-all font-medium"
          >
            <i className="fas fa-plus mr-2"></i>สร้างร้านค้า
          </Link>
        </div>
      </div>
    );
  }

  const totalProducts = store.products?.length || 0;
  const inStockProducts = store.products?.filter(p => p.quantity > 0).length || 0;
  const outOfStockProducts = totalProducts - inStockProducts;
  const totalSold = store.products?.reduce((sum, p) => sum + (p.sold || 0), 0) || 0;
  const totalRevenue = store.products?.reduce((sum, p) => sum + (p.price * (p.sold || 0)), 0) || 0;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-16">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Store Info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#ee4d2d] rounded-full flex items-center justify-center overflow-hidden border-2 border-[#ee4d2d]">
                {store.logo ? (
                  <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                ) : (
                  <i className="fas fa-store text-white text-xl"></i>
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{store.name}</h1>
                <p className="text-xs text-gray-500">{store.description || 'ไม่มีคำอธิบาย'}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link
                to={`/store/${store.id}`}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-sm hover:bg-gray-50 transition-colors text-sm flex items-center gap-1"
              >
                <i className="fas fa-eye"></i>
                <span className="hidden sm:inline">ดูหน้าร้าน</span>
              </Link>
              <button
                onClick={() => setEditingStore(!editingStore)}
                className="px-4 py-2 bg-[#ee4d2d] text-white rounded-sm hover:bg-[#d73211] transition-colors text-sm flex items-center gap-1"
              >
                <i className="fas fa-edit"></i>
                <span className="hidden sm:inline">{editingStore ? 'ยกเลิก' : 'แก้ไขร้าน'}</span>
              </button>
            </div>
          </div>

          {/* Edit Store Form */}
          {editingStore && (
            <div className="pb-4 border-t border-gray-100 pt-4">
              <form onSubmit={saveStore} className="bg-white border border-gray-200 rounded-sm p-4">
                <h3 className="font-medium text-gray-900 mb-3 text-sm">แก้ไขข้อมูลร้านค้า</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">ชื่อร้าน *</label>
                    <input
                      className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#ee4d2d]"
                      placeholder="ชื่อร้านค้า"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">โลโก้ (URL)</label>
                    <input
                      className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#ee4d2d]"
                      placeholder="https://..."
                      value={form.logo}
                      onChange={(e) => setForm({ ...form, logo: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">คำอธิบายร้าน</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#ee4d2d]"
                    rows={2}
                    placeholder="รายละเอียดร้านค้า..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  ></textarea>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStore(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-600 rounded-sm hover:bg-gray-50 text-sm"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#ee4d2d] text-white rounded-sm hover:bg-[#d73211] text-sm"
                  >
                    <i className="fas fa-save mr-1"></i>บันทึก
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex">
            {[
              { id: 'products', icon: 'fa-box', label: 'สินค้า' },
              { id: 'orders', icon: 'fa-shopping-bag', label: 'คำสั่งซื้อ' },
              { id: 'sales', icon: 'fa-chart-line', label: 'รายงานการขาย' },
              { id: 'categories', icon: 'fa-tags', label: 'หมวดหมู่' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                    ? 'text-[#ee4d2d] border-[#ee4d2d]'
                    : 'text-gray-600 border-transparent hover:text-[#ee4d2d]'
                  }`}
              >
                <i className={`fas ${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-4 py-4">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
          <div className="bg-white rounded-sm shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">สินค้าทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                <i className="fas fa-box text-blue-500"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-sm shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">พร้อมขาย</p>
                <p className="text-2xl font-bold text-green-600">{inStockProducts}</p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                <i className="fas fa-check-circle text-green-500"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-sm shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">สินค้าหมด</p>
                <p className="text-2xl font-bold text-red-600">{outOfStockProducts}</p>
              </div>
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                <i className="fas fa-times-circle text-red-500"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-sm shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">ขายแล้ว</p>
                <p className="text-2xl font-bold text-[#ee4d2d]">{totalSold}</p>
                <p className="text-[10px] text-gray-400">ชิ้น</p>
              </div>
              <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                <i className="fas fa-shopping-cart text-[#ee4d2d]"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-sm shadow-sm p-4 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">💰 รายได้</p>
                <p className="text-xl font-bold text-green-600">฿{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                <i className="fas fa-coins text-green-500"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-sm shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-medium text-gray-900">สินค้าของฉัน</h2>
                <p className="text-xs text-gray-500">จัดการสินค้าในร้านค้า</p>
              </div>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setShowProductForm(true);
                }}
                className="px-4 py-2 bg-[#ee4d2d] text-white rounded-sm hover:bg-[#d73211] transition-colors text-sm flex items-center gap-1"
              >
                <i className="fas fa-plus"></i>
                เพิ่มสินค้า
              </button>
            </div>

            <div className="p-4">
              {store.products?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-box-open text-gray-400 text-2xl"></i>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">ยังไม่มีสินค้า</h3>
                  <p className="text-sm text-gray-500 mb-4">เริ่มเพิ่มสินค้าแรกของคุณเพื่อเริ่มขาย</p>
                  <button
                    onClick={() => setShowProductForm(true)}
                    className="px-4 py-2 bg-[#ee4d2d] text-white rounded-sm hover:bg-[#d73211] text-sm"
                  >
                    <i className="fas fa-plus mr-1"></i>เพิ่มสินค้าแรก
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                  {store.products?.map(p => (
                    <div key={p.id} className="group bg-white border border-gray-100 rounded-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
                      {/* Product Image */}
                      <div className="aspect-square bg-gray-50 relative overflow-hidden">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0].url}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <i className="fas fa-image text-3xl"></i>
                          </div>
                        )}

                        {/* Stock Badge */}
                        <div className="absolute top-0 right-0">
                          <span className={`px-1.5 py-0.5 text-[10px] font-bold text-white ${p.quantity > 10 ? 'bg-green-500' : p.quantity > 0 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}>
                            {p.quantity > 0 ? `สต็อก ${p.quantity}` : 'หมด'}
                          </span>
                        </div>

                        {/* Discount Badge */}
                        {(() => {
                          const now = new Date();
                          const isOnDiscount = p.discountPrice &&
                            p.discountStartDate &&
                            p.discountEndDate &&
                            now >= new Date(p.discountStartDate) &&
                            now <= new Date(p.discountEndDate);
                          if (isOnDiscount) {
                            const discountPercent = Math.round(((p.price - p.discountPrice) / p.price) * 100);
                            return (
                              <div className="absolute top-0 left-0 bg-[#ee4d2d] text-white text-[10px] font-bold px-1.5 py-0.5">
                                -{discountPercent}%
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Product Info */}
                      <div className="p-2">
                        <h3 className="text-xs text-gray-800 line-clamp-2 min-h-[32px] mb-1">{p.title}</h3>

                        {/* Price */}
                        {(() => {
                          const now = new Date();
                          const isOnDiscount = p.discountPrice &&
                            p.discountStartDate &&
                            p.discountEndDate &&
                            now >= new Date(p.discountStartDate) &&
                            now <= new Date(p.discountEndDate);

                          return isOnDiscount ? (
                            <div className="mb-1">
                              <span className="text-[#ee4d2d] font-medium text-sm">฿{p.discountPrice.toLocaleString()}</span>
                              <span className="text-gray-400 text-[10px] line-through ml-1">฿{p.price.toLocaleString()}</span>
                            </div>
                          ) : (
                            <p className="text-[#ee4d2d] font-medium text-sm mb-1">฿{p.price.toLocaleString()}</p>
                          );
                        })()}

                        {/* Stats */}
                        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-2">
                          <span>{p.category?.name || 'อื่นๆ'}</span>
                          <span className="text-[#ee4d2d]">ขาย {p.sold || 0}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-1">
                          <Link
                            to={`/product/${p.id}`}
                            className="py-1.5 bg-blue-50 text-blue-600 rounded-sm hover:bg-blue-100 transition-all text-center text-[10px]"
                          >
                            <i className="fas fa-eye"></i>
                          </Link>
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setShowProductForm(true);
                            }}
                            className="py-1.5 bg-yellow-50 text-yellow-600 rounded-sm hover:bg-yellow-100 transition-all text-[10px]"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => removeProduct(p.id)}
                            className="py-1.5 bg-red-50 text-red-600 rounded-sm hover:bg-red-100 transition-all text-[10px]"
                          >
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
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-sm shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-medium text-gray-900">จัดการคำสั่งซื้อ</h2>
                <p className="text-xs text-gray-500">ดูและอัพเดตสถานะคำสั่งซื้อ</p>
              </div>
              <button
                onClick={loadOrders}
                className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-sm hover:bg-gray-50 text-xs flex items-center gap-1"
              >
                <i className="fas fa-sync-alt"></i>
                รีเฟรช
              </button>
            </div>

            {/* Status Filter */}
            <div className="p-3 bg-[#fafafa] border-b border-gray-100">
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
                    className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${selectedOrderStatus === status.value
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
            <div className="p-4">
              {loadingOrders ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-orange-100 border-t-[#ee4d2d] rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-inbox text-gray-400 text-2xl"></i>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">ยังไม่มีคำสั่งซื้อ</h3>
                  <p className="text-sm text-gray-500">เมื่อมีลูกค้าสั่งซื้อ จะแสดงที่นี่</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map(order => (
                    <div key={order.id} className="border border-gray-200 rounded-sm overflow-hidden">
                      {/* Order Header */}
                      <div className="p-3 bg-[#fafafa] border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900">#{order.id}</span>
                            {getStatusBadge(order.oderStatus)}
                            <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[#ee4d2d] font-medium">฿{order.storeOrderTotal?.toLocaleString() || order.cartTotal?.toLocaleString()}</span>
                            <button
                              onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                              className="px-2 py-1 border border-gray-300 rounded-sm hover:bg-gray-50 text-xs"
                            >
                              <i className={`fas fa-chevron-${expandedOrder === order.id ? 'up' : 'down'}`}></i>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Order Details Expanded */}
                      {expandedOrder === order.id && (
                        <div className="p-4 space-y-4">
                          {/* Products */}
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase">สินค้าในคำสั่งซื้อ</h4>
                            <div className="space-y-2">
                              {order.storeProducts?.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-sm">
                                  <div className="w-12 h-12 bg-white rounded-sm overflow-hidden border border-gray-200">
                                    {item.product?.images?.[0] ? (
                                      <img src={item.product.images[0].url || item.product.images[0].secure_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <i className="fas fa-image"></i>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm text-gray-800 line-clamp-1">{item.product?.title || 'สินค้า'}</p>
                                    <p className="text-xs text-gray-500">x{item.count} • ฿{item.price.toLocaleString()}</p>
                                  </div>
                                  <span className="text-sm font-medium text-[#ee4d2d]">฿{(item.price * item.count).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Payment Info */}
                          {order.payments && order.payments.length > 0 && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase">การชำระเงิน</h4>
                              {order.payments.map((payment, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-sm">
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
                                      className="text-xs text-[#ee4d2d] hover:underline flex items-center gap-1"
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
                            <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase">ข้อมูลลูกค้า</h4>
                            <div className="p-3 bg-gray-50 rounded-sm text-sm space-y-1">
                              <p><span className="text-gray-500">ชื่อ:</span> {order.orderedBy?.name || 'ไม่ระบุ'}</p>
                              <p><span className="text-gray-500">อีเมล:</span> {order.orderedBy?.email || 'ไม่ระบุ'}</p>
                              {order.orderedBy?.phone && <p><span className="text-gray-500">โทร:</span> {order.orderedBy.phone}</p>}
                              {order.shippingAddress && <p><span className="text-gray-500">ที่อยู่:</span> {order.shippingAddress}</p>}
                            </div>
                          </div>

                          {/* Update Status */}
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase">อัพเดตสถานะ</h4>
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
                                    className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors disabled:opacity-50 ${status === 'Cancelled'
                                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                        : status === 'Delivered'
                                          ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                          : status === 'Shipped'
                                            ? 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                                            : status === 'Processing'
                                              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                              : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                                      }`}
                                  >
                                    {getStatusBadge(status).props.children.find(c => typeof c === 'string')}
                                  </button>
                                )
                              ))}
                              {updatingStatus.has(order.id) && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <i className="fas fa-spinner fa-spin"></i>
                                  กำลังอัพเดต...
                                </span>
                              )}
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
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div className="bg-white rounded-sm shadow-sm">
            {loadingSales ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 border-4 border-orange-100 border-t-[#ee4d2d] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm text-gray-500">กำลังโหลดข้อมูลการขาย...</p>
              </div>
            ) : !salesData || !salesData.sales || salesData.sales.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-chart-line text-gray-400 text-2xl"></i>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">ยังไม่มีข้อมูลการขาย</h3>
                <p className="text-sm text-gray-500">เมื่อมีลูกค้าสั่งซื้อสินค้า ข้อมูลจะแสดงที่นี่</p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="p-4 bg-[#fafafa] border-b border-gray-100">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-3 rounded-sm border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">สินค้าที่ขาย</p>
                      <p className="text-xl font-bold text-gray-900">{salesData.summary.totalProducts}</p>
                    </div>
                    <div className="bg-white p-3 rounded-sm border border-green-200">
                      <p className="text-xs text-gray-500 mb-1">ยอดขายรวม</p>
                      <p className="text-xl font-bold text-green-600">฿{salesData.summary.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-3 rounded-sm border border-blue-200">
                      <p className="text-xs text-gray-500 mb-1">จำนวน</p>
                      <p className="text-xl font-bold text-blue-600">{salesData.summary.totalQuantity} ชิ้น</p>
                    </div>
                    <div className="bg-white p-3 rounded-sm border border-purple-200">
                      <p className="text-xs text-gray-500 mb-1">คำสั่งซื้อ</p>
                      <p className="text-xl font-bold text-purple-600">{salesData.summary.totalOrders}</p>
                    </div>
                  </div>
                </div>

                {/* Sales List */}
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-4">รายการสินค้าที่ขาย</h3>
                  <div className="space-y-3">
                    {salesData.sales.map((item) => (
                      <div key={item.product.id} className="border border-gray-200 rounded-sm overflow-hidden">
                        <div
                          className="p-3 bg-[#fafafa] cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => setExpandedProduct(expandedProduct === item.product.id ? null : item.product.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-sm overflow-hidden border border-gray-200">
                              {item.product.images?.[0] ? (
                                <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <i className="fas fa-image"></i>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm line-clamp-1">{item.product.title}</p>
                              <p className="text-xs text-gray-500">{item.product.category?.name || 'อื่นๆ'}</p>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="text-center">
                                <p className="font-bold text-[#ee4d2d]">{item.totalQuantity}</p>
                                <p className="text-[10px] text-gray-500">ชิ้น</p>
                              </div>
                              <div className="text-center">
                                <p className="font-bold text-green-600">฿{item.totalRevenue.toLocaleString()}</p>
                                <p className="text-[10px] text-gray-500">รายได้</p>
                              </div>
                              <i className={`fas fa-chevron-${expandedProduct === item.product.id ? 'up' : 'down'} text-gray-400`}></i>
                            </div>
                          </div>
                        </div>

                        {expandedProduct === item.product.id && (
                          <div className="p-4 border-t border-gray-100">
                            <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">รายละเอียดการขาย ({item.sales.length} รายการ)</h4>
                            <div className="space-y-2">
                              {item.sales.map((sale, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-sm flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{sale.customer.name}</p>
                                    <p className="text-xs text-gray-500">{sale.customer.email}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                      {new Date(sale.orderDate).toLocaleDateString('th-TH')} • Order #{sale.orderId}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm">x{sale.quantity}</p>
                                    <p className="font-medium text-green-600">฿{sale.revenue.toLocaleString()}</p>
                                    <span className={`text-[10px] ${sale.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                                      {sale.paymentStatus === 'paid' ? '✓ ชำระแล้ว' : 'รอชำระ'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-sm shadow-sm">
            <CategoryManagement />
          </div>
        )}
      </div>

      {/* Payment Slip Modal */}
      {viewingSlip && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingSlip(null)}
        >
          <div
            className="bg-white rounded-sm max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">สลีปการโอนเงิน</h3>
              <button onClick={() => setViewingSlip(null)} className="text-gray-500 hover:text-gray-700">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-4">
              <img src={viewingSlip} alt="Payment slip" className="w-full h-auto rounded-sm" />
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm
          editingProduct={editingProduct}
          createEndpoint="/api/seller/product"
          updateEndpointBase="/api/seller/product"
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
          onSuccess={() => {
            setShowProductForm(false);
            setEditingProduct(null);
            load();
          }}
        />
      )}
    </div>
  );
};

export default SellerDashboard;
