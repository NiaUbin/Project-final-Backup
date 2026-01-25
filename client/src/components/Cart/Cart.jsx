import React, { useState, useMemo, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import axios from 'axios';
import LoadingSpinner from '../Common/LoadingSpinner';
import LoginPopup from '../Common/LoginPopup';

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { cart, loading, updateCartItemQuantity, removeCartItem, clearCart, getSelectedVariantsForProduct } = useCart();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [clearing, setClearing] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [discountCode, setDiscountCode] = useState('');
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [userCoupons, setUserCoupons] = useState([]);

  // Group products by store
  const productsByStore = useMemo(() => {
    if (!cart?.products) return {};
    const grouped = {};
    cart.products.forEach(item => {
      const storeId = item.product.store?.id || 'no-store';
      const storeName = item.product.store?.name || 'ร้านค้าทั่วไป';
      if (!grouped[storeId]) {
        grouped[storeId] = { name: storeName, items: [] };
      }
      grouped[storeId].items.push(item);
    });
    return grouped;
  }, [cart?.products]);

  const allSelected = useMemo(() => {
    const allItemIds = cart?.products?.map(item => item.id) || [];
    return allItemIds.length > 0 && allItemIds.every(id => selectedItems.has(id));
  }, [cart?.products, selectedItems]);

  const toggleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedItems(new Set());
    } else {
      const allIds = cart?.products?.map(item => item.id) || [];
      setSelectedItems(new Set(allIds));
    }
  };

  const selectedTotal = useMemo(() => {
    return cart?.products
      ?.filter(item => selectedItems.has(item.id))
      .reduce((sum, item) => sum + (item.price * item.count), 0) || 0;
  }, [cart?.products, selectedItems]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return appliedCoupon.discountAmount || 0;
  }, [appliedCoupon]);

  const finalTotal = useMemo(() => {
    return Math.max(0, selectedTotal - discountAmount);
  }, [selectedTotal, discountAmount]);

  // Load user coupons
  useEffect(() => {
    if (user) {
      const loadCoupons = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get('/api/coupon/my-coupons', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserCoupons(response.data.coupons || []);
        } catch (error) {
          console.error('Error loading coupons:', error);
        }
      };
      loadCoupons();
    }
  }, [user]);

  const selectedCount = useMemo(() => {
    return cart?.products
      ?.filter(item => selectedItems.has(item.id))
      .reduce((sum, item) => sum + item.count, 0) || 0;
  }, [cart?.products, selectedItems]);

  const handleApplyCoupon = async (codeToUse = null) => {
    const code = codeToUse || discountCode.trim();
    if (!code) {
      showError('กรุณาระบุโค้ดส่วนลด', { position: 'bottom-right' });
      return;
    }

    if (!user) {
      setShowLoginPopup(true);
      return;
    }

    try {
      setValidatingCoupon(true);
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/coupon/validate', 
        { code: code.toUpperCase(), cartTotal: selectedTotal },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.valid) {
        setAppliedCoupon(response.data.coupon);
        setDiscountCode('');
        setShowDiscountInput(false);
        showSuccess(`ใช้โค้ดส่วนลดสำเร็จ! ได้รับส่วนลด ฿${response.data.coupon.discountAmount.toLocaleString()}`, { position: 'bottom-right', duration: 3000 });
      }
    } catch (error) {
      showError(error.response?.data?.message || 'โค้ดส่วนลดไม่ถูกต้อง', { position: 'bottom-right' });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountCode('');
    showSuccess('ลบโค้ดส่วนลดแล้ว', { position: 'bottom-right' });
  };

  const handleCheckout = async () => {
    if (selectedItems.size === 0) {
      showError('กรุณาเลือกสินค้า', { position: 'bottom-right' });
      return;
    }
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token || !user) {
      setShowLoginPopup(true);
      return;
    }

    try {
      setCheckoutLoading(true);
      const response = await axios.post('/api/user/order', {
        couponId: appliedCoupon?.id,
        discountAmount: discountAmount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const orderId = response.data?.order?.id;
      if (orderId) {
        showSuccess('สร้างคำสั่งซื้อสำเร็จ! กำลังไปหน้าชำระเงิน...', { position: 'center', duration: 2000 });
        setTimeout(() => {
          setAppliedCoupon(null);
          navigate(`/payment/${orderId}`);
        }, 2000);
      }
    } catch (error) {
      showError(error.response?.data?.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ', { position: 'bottom-right' });
      setCheckoutLoading(false);
    }
  };

  const handleQuantityChange = async (cartItemId, newQuantity, productTitle) => {
    if (newQuantity < 0) return;
    setUpdatingItems(prev => new Set(prev).add(cartItemId));
    try {
      await updateCartItemQuantity(cartItemId, newQuantity);
      showSuccess(`ปรับจำนวนสินค้า "${productTitle}" เป็น ${newQuantity} ชิ้นแล้ว`, { position: 'bottom-right', duration: 2000 });
    } catch (error) {
      showError('เกิดข้อผิดพลาดในการปรับจำนวนสินค้า', { position: 'bottom-right' });
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartItemId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (cartItemId, productTitle) => {
    setUpdatingItems(prev => new Set(prev).add(cartItemId));
    try {
      await removeCartItem(cartItemId);
      showSuccess(`ลบสินค้า "${productTitle}" ออกจากตะกร้าแล้ว`, { position: 'bottom-right', duration: 2500 });
    } catch (error) {
      showError('เกิดข้อผิดพลาดในการลบสินค้า', { position: 'bottom-right' });
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartItemId);
        return newSet;
      });
    }
  };

  // ✅ ฟังก์ชันลบสินค้าทั้งหมด
  const handleClearCart = async () => {
    // ยืนยันก่อนลบ
    const confirmed = window.confirm('คุณต้องการลบสินค้าทั้งหมดออกจากตะกร้าหรือไม่?');
    if (!confirmed) return;

    try {
      setClearing(true);
      await clearCart();
      setSelectedItems(new Set()); // Clear selected items
      showSuccess('ลบสินค้าทั้งหมดเรียบร้อยแล้ว', { position: 'center', duration: 2500 });
    } catch (error) {
      showError('เกิดข้อผิดพลาดในการลบสินค้า', { position: 'bottom-right' });
    } finally {
      setClearing(false);
    }
  };

  if (loading && !cart) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingSpinner size="lg" color="orange" text="กำลังโหลดตะกร้าสินค้า..." />
    </div>
  );

  // Show login prompt if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-white rounded-full"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className="fas fa-shopping-bag text-white text-lg"></i>
                  <span className="absolute text-orange-500 font-black text-sm" style={{ top: '8px', left: '8px' }}>S</span>
                </div>
              </div>
              <Link to="/products">
                <span className="text-xl font-bold text-gray-900">ตะกร้าสินค้า</span>
              </Link>
            </div>
          </div>

          {/* Login Prompt */}
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="inline-flex items-center justify-center h-20 w-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mb-4">
              <i className="fas fa-shopping-cart text-white text-3xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">กรุณาเข้าสู่ระบบเพื่อดูตะกร้าสินค้า</h2>
            <p className="text-gray-600 mb-6">เข้าสู่ระบบเพื่อดูสินค้าในตะกร้าและดำเนินการชำระเงิน</p>
            <div className="flex gap-3 justify-center">
              <Link
                to="/login"
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
              >
                สมัครสมาชิก
              </Link>
            </div>
            <Link
              to="/products"
              className="mt-4 inline-block text-sm text-gray-500 hover:text-orange-500 transition"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              กลับไปช้อปปิ้ง
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        {/* Header - Shopee Style */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <div className="absolute inset-1 bg-white rounded-full"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <i className="fas fa-shopping-bag text-white text-lg"></i>
                <span className="absolute text-orange-500 font-black text-sm" style={{ top: '12px', left: '2px' }}>BoxiFY</span>
              </div>
            </div>
            <span className="text-xl font-bold text-gray-900">ตะกร้าสินค้า</span>
          </div>
          <div className="flex-1 max-w-md ml-4">
            <div className="flex">
              <input
                type="text"
                placeholder="ค้นหาสินค้าในตะกร้า"
                className="w-full px-4 py-2 rounded-l-md border border-gray-300 focus:outline-none text-sm"
              />
              <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-r-md">
                <i className="fas fa-search"></i>
              </button>
            </div>
          </div>
        </div>

        {cart?.products?.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm">
            {/* Column Headers */}
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-gray-200 text-sm font-medium text-gray-700">
              <div className="col-span-1">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
              </div>
              <div className="col-span-4">สินค้า</div>
              <div className="col-span-2 text-center">ราคาต่อชิ้น</div>
              <div className="col-span-2 text-center">จำนวน</div>
              <div className="col-span-2 text-center">ราคารวม</div>
              <div className="col-span-1 text-center">แอคชั่น</div>
            </div>

            {/* Products by Store */}
            <div className="divide-y divide-gray-200">
              {Object.entries(productsByStore).map(([storeId, store]) => (
                <div key={storeId} className="p-4">
                  {/* Store Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={store.items.every(item => selectedItems.has(item.id))}
                      onChange={() => {
                        const allStoreItemsSelected = store.items.every(item => selectedItems.has(item.id));
                        if (allStoreItemsSelected) {
                          setSelectedItems(prev => {
                            const newSet = new Set(prev);
                            store.items.forEach(item => newSet.delete(item.id));
                            return newSet;
                          });
                        } else {
                          setSelectedItems(prev => {
                            const newSet = new Set(prev);
                            store.items.forEach(item => newSet.add(item.id));
                            return newSet;
                          });
                        }
                      }}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <i className="fas fa-store text-orange-500"></i>
                    <span className="text-sm font-medium text-gray-900">{store.name}</span>
                  </div>

                  {/* Store Products */}
                  <div className="space-y-4 ml-6">
                    {store.items.map(item => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 md:gap-4 items-start py-3 border-b border-gray-100 last:border-0">
                        {/* Checkbox - col 1 */}
                        <div className="col-span-1 flex items-start pt-2">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => toggleSelectItem(item.id)}
                            className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                          />
                        </div>

                        {/* Product - col 4 */}
                        <div className="col-span-12 md:col-span-4 flex gap-3">
                          <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                            <img
                              src={item.product.images?.[0]?.url || 'https://via.placeholder.com/300x300?text=No+Image'}
                              alt={item.product.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                              {item.product.title}
                            </h3>
                          {/* Selected Variants/Options */}
                          {(() => {
                            let selected = null;
                            
                            // 1. Try to get from item directly (from DB)
                            if (item.selectedVariants) {
                              try {
                                selected = typeof item.selectedVariants === 'string' 
                                  ? JSON.parse(item.selectedVariants) 
                                  : item.selectedVariants;
                              } catch (e) {
                                console.error('Error parsing variants', e);
                              }
                            }
                            
                            // 2. Fallback to localStorage or other sources
                            if (!selected) {
                              selected = item?.product?.selectedVariants || getSelectedVariantsForProduct(item?.product?.id);
                            }

                            if (selected && typeof selected === 'object' && Object.keys(selected).length > 0) {
                              const variantText = Object.entries(selected)
                                .map(([name, value]) => `${name}: ${value}`)
                                .join(', ');
                              return (
                                <div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                                  <span className="text-gray-700">ตัวเลือก:</span>
                                  <span className="truncate">{variantText}</span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded">
                                ส่วนลด
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded">
                                จัดส่งฟรี
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-500">
                              <i className="fas fa-truck mr-1"></i>
                              ส่วนลดค่าจัดส่ง ฿300
                            </div>
                          </div>
                        </div>

                        {/* Price per item - col 2 */}
                        <div className="col-span-3 md:col-span-2 text-center">
                          <div className="text-gray-900 font-medium text-sm">฿{item.price.toLocaleString()}</div>
                        </div>

                        {/* Quantity - col 2 */}
                        <div className="col-span-4 md:col-span-2 flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.count - 1, item.product?.title || 'สินค้า')}
                            disabled={updatingItems.has(item.id) || item.count <= 1}
                            className="w-7 h-7 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center text-xs"
                          >
                            <i className="fas fa-minus"></i>
                          </button>
                          <div className="w-10 h-7 border border-gray-300 rounded flex items-center justify-center text-sm font-medium">
                            {updatingItems.has(item.id) ? (
                              <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              item.count
                            )}
                          </div>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.count + 1, item.product?.title || 'สินค้า')}
                            disabled={updatingItems.has(item.id)}
                            className="w-7 h-7 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center text-xs"
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>

                        {/* Total Price - col 2 */}
                        <div className="col-span-3 md:col-span-2 text-center">
                          <div className="text-orange-600 font-bold text-sm md:text-base">฿{(item.price * item.count).toLocaleString()}</div>
                        </div>

                        {/* Actions - col 1 */}
                        <div className="col-span-1 flex flex-col items-center gap-1">
                          <button
                            onClick={() => handleRemoveItem(item.id, item.product?.title || 'สินค้า')}
                            disabled={updatingItems.has(item.id)}
                            className="text-red-600 hover:text-red-700 text-xs disabled:opacity-50"
                          >
                            {updatingItems.has(item.id) ? (
                              <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              'ลบ'
                            )}
                          </button>
                          <button className="text-orange-500 hover:text-orange-600 text-[10px] flex items-center gap-1">
                            ค้นหาสินค้าที่คล้ายกัน
                            <i className="fas fa-chevron-down text-[8px]"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="min-h-[60vh] flex items-center justify-center py-12">
            <div className="text-center max-w-md mx-auto px-4">
              {/* Shopping Bag Illustration */}
              <div className="relative mb-8 flex justify-center">
                {/* Green Circle Background */}
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <div className="absolute inset-0 bg-green-200 rounded-full opacity-30"></div>
                  
                  {/* Shopping Bag */}
                  <div className="relative z-10 transform rotate-[-5deg]">
                    {/* Bag Body */}
                    <div className="w-32 h-40 bg-gradient-to-b from-amber-200 to-amber-300 rounded-t-3xl rounded-b-xl shadow-lg relative">
                      {/* Bag Handle (smiling mouth) */}
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <svg width="60" height="30" viewBox="0 0 60 30" className="overflow-visible">
                          <path
                            d="M 10 15 Q 20 5, 30 15 Q 40 25, 50 15"
                            stroke="#d4a574"
                            strokeWidth="4"
                            fill="none"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      
                      {/* Bag Opening Shadow */}
                      <div className="absolute top-2 left-2 right-2 h-3 bg-amber-400/30 rounded-t-full"></div>
                    </div>
                    
                    {/* Price Tag */}
                    <div className="absolute -bottom-2 -right-4">
                      <div className="bg-blue-300 rounded-lg px-3 py-1.5 shadow-md transform rotate-12">
                        <span className="text-white font-bold text-sm">$</span>
                      </div>
                      <div className="absolute top-0 left-0 w-0.5 h-3 bg-amber-400 transform -translate-x-1"></div>
                    </div>
                  </div>
                  
                  {/* Decorative Dots */}
                  <div className="absolute top-4 left-8 w-3 h-3 bg-orange-400 rounded-full opacity-60"></div>
                  <div className="absolute top-12 right-6 w-2 h-2 bg-blue-300 rounded-full opacity-60"></div>
                  <div className="absolute bottom-8 left-6 w-2.5 h-2.5 bg-orange-300 rounded-full opacity-60"></div>
                  <div className="absolute bottom-16 right-10 w-2 h-2 bg-blue-400 rounded-full opacity-60"></div>
                </div>
              </div>

              {/* Message */}
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                ไม่มีสินค้าในตะกร้า!
              </h2>

              {/* Action Button */}
              <Link
                to="/products"
                className="inline-block px-8 py-4 bg-[#F05438] hover:bg-[#E0452E] text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                ช้อปปิ้งกันเลย
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Fixed Bar - Shopee Style */}
      {cart?.products?.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* Left Section */}
              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">เลือกทั้งหมด ({cart.products.length})</span>
                </label>
                <button
                  onClick={handleClearCart}
                  disabled={clearing}
                  className="text-red-600 hover:text-red-700 text-sm disabled:opacity-50"
                >
                  {clearing ? (
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'ลบ'
                  )}
                </button>
                <Link to="/wishlist" className="text-gray-600 hover:text-gray-700 text-sm">
                  ย้ายไปยังสินค้าที่ถูกใจ
                </Link>
              </div>

              {/* Middle Section - Discount Code & Coins */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <i className="fas fa-tag text-orange-500"></i>
                  <span className="text-sm text-gray-700">โค้ดส่วนลดของ Shopee</span>
                  <button
                    onClick={() => setShowDiscountInput(!showDiscountInput)}
                    className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                  >
                    กดใช้โค้ด
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-coins text-orange-500"></i>
                  <span className="text-sm text-gray-700">Shopee Coins</span>
                  <span className="text-sm text-gray-500">
                    {selectedItems.size > 0 ? `-฿0` : 'คุณยังไม่ได้เลือกสินค้า'}
                  </span>
                </div>
              </div>

              {/* Right Section - Total & Checkout */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    รวม ({selectedCount} สินค้า):
                  </div>
                  {appliedCoupon && discountAmount > 0 && (
                    <div className="text-xs text-green-600 mb-1">
                      ส่วนลด: -฿{discountAmount.toLocaleString()}
                    </div>
                  )}
                  <div className={`text-2xl font-bold ${appliedCoupon ? 'text-green-600' : 'text-orange-600'}`}>
                    ฿{finalTotal.toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading || selectedItems.size === 0}
                  className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {checkoutLoading ? 'กำลังสร้างคำสั่งซื้อ...' : 'สั่งสินค้า'}
                </button>
              </div>
            </div>

            {/* Discount Code Input */}
            {showDiscountInput && (
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                {/* Applied Coupon */}
                {appliedCoupon && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-check-circle text-green-600"></i>
                      <span className="text-sm font-medium text-green-800">
                        ใช้โค้ด: <span className="font-bold">{appliedCoupon.code}</span> - ส่วนลด ฿{discountAmount.toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )}

                {/* Available Coupons */}
                {!appliedCoupon && userCoupons.filter(c => !c.isUsed && (!c.expiresAt || new Date(c.expiresAt) > new Date())).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600 mb-2">โค้ดส่วนลดที่ใช้ได้:</p>
                    <div className="flex flex-wrap gap-2">
                      {userCoupons
                        .filter(c => !c.isUsed && (!c.expiresAt || new Date(c.expiresAt) > new Date()))
                        .map(coupon => (
                          <button
                            key={coupon.id}
                            onClick={() => handleApplyCoupon(coupon.code)}
                            className="px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-xs font-medium text-orange-700 hover:bg-orange-100 transition-colors"
                          >
                            {coupon.code} - ฿{coupon.discountAmount.toLocaleString()}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Discount Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    placeholder="ใส่โค้ดส่วนลด"
                    disabled={validatingCoupon || appliedCoupon}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || appliedCoupon || !discountCode.trim()}
                    className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {validatingCoupon ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'ใช้โค้ด'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowDiscountInput(false);
                      if (!appliedCoupon) setDiscountCode('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Login Popup */}
      <LoginPopup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        title="เข้าสู่ระบบเพื่อชำระเงิน"
        message="กรุณาเข้าสู่ระบบเพื่อดำเนินการชำระเงินและสั่งซื้อสินค้า"
      />
    </div>
  );
};

export default Cart;
