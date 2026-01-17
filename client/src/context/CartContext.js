import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import CartSuccessPopup from '../components/Cart/CartSuccessPopup';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [cartProductInfo, setCartProductInfo] = useState(null);
  const [clientCartMeta, setClientCartMeta] = useState(() => {
    try {
      const raw = localStorage.getItem('cart_meta');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  });
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  // Load cart when user logs in
  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      setCart(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadCart = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await axios.get('/api/user/cart');
      setCart(response.data.cart);
    } catch (error) {
      console.error('Error loading cart:', error);
      if (error.response?.status !== 404) {
        showError('เกิดข้อผิดพลาดในการโหลดตะกร้า');
      }
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, count, price, productInfo = null) => {
    try {
      setLoading(true);

      let response;
      // If the product already exists in the cart, increment its quantity instead of creating a new line
      const existingItem = cart?.products?.find(p => p.product?.id === parseInt(productId));
      if (existingItem) {
        // Use quantity update endpoint to prevent flicker/duplication
        response = await axios.put('/api/user/cart/quantity', {
          cartItemId: parseInt(existingItem.id),
          newQuantity: parseInt(existingItem.count) + parseInt(count)
        });
      } else {
        response = await axios.post('/api/user/cart', {
          productId: parseInt(productId),
          count: parseInt(count),
          price: parseFloat(price)
        });
      }
      
      setCart(response.data.cart);
      
      // Show popup if product info is provided
      if (productInfo) {
        setCartProductInfo({
          ...productInfo,
          price: parseFloat(price),
          quantity: parseInt(count)
        });
        // persist selected variants for product (client-side only)
        if (productInfo.selectedVariants && typeof productInfo.selectedVariants === 'object') {
          setClientCartMeta(prev => {
            const next = { ...prev, [String(productId)]: { selectedVariants: productInfo.selectedVariants } };
            try { localStorage.setItem('cart_meta', JSON.stringify(next)); } catch (e) {}
            return next;
          });
        }
        setShowCartPopup(true);
      } else {
        // Fallback to notification if no product info
        showSuccess('เพิ่มสินค้าลงตะกร้าสำเร็จ', { position: 'bottom-right', duration: 2000 });
      }
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มสินค้า';
      showError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const getSelectedVariantsForProduct = (productId) => {
    const key = String(productId);
    return clientCartMeta?.[key]?.selectedVariants || null;
  };

  const closeCartPopup = () => {
    setShowCartPopup(false);
    setCartProductInfo(null);
  };

  const removeFromCart = async () => {
    try {
      setLoading(true);
      const response = await axios.delete('/api/user/cart');
      setCart(response.data.cart);
      showSuccess('ล้างตะกร้าสำเร็จ');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการล้างตะกร้า';
      showError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Alias for removeFromCart - ลบสินค้าทั้งหมด
  const clearCart = removeFromCart;

  const updateCartItemQuantity = async (cartItemId, newQuantity) => {
    try {
      setLoading(true);
      const response = await axios.put('/api/user/cart/quantity', {
        cartItemId: parseInt(cartItemId),
        newQuantity: parseInt(newQuantity)
      });
      
      setCart(response.data.cart);
      showSuccess('อัพเดตจำนวนสินค้าสำเร็จ');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัพเดตจำนวน';
      showError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const removeCartItem = async (cartItemId) => {
    try {
      setLoading(true);
      const response = await axios.delete('/api/user/cart/item', {
        data: { cartItemId: parseInt(cartItemId) }
      });
      
      setCart(response.data.cart);
      showSuccess('ลบสินค้าออกจากตะกร้าสำเร็จ');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบสินค้า';
      showError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const getCartItemCount = () => {
    if (!user || !cart || !cart.products) return 0;
    return cart.products.reduce((total, item) => total + item.count, 0);
  };

  const getCartTotal = () => {
    if (!user) return 0;
    return cart?.cartTotal || 0;
  };

  const value = {
    cart,
    loading,
    loadCart,
    addToCart,
    removeFromCart,
    clearCart,
    updateCartItemQuantity,
    removeCartItem,
    getCartItemCount,
    getCartTotal,
    getSelectedVariantsForProduct
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartSuccessPopup
        product={cartProductInfo}
        quantity={cartProductInfo?.quantity || 1}
        show={showCartPopup}
        onClose={closeCartPopup}
      />
    </CartContext.Provider>
  );
};
