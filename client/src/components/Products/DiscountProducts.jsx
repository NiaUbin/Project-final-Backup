import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import LoginPopup from '../Common/LoginPopup';
import OutOfStockAlert from '../Common/OutOfStockAlert';
import { isProductOnDiscount, getCurrentPrice, getDiscountPercentage, getRemainingDiscountTime } from '../../utils/productDiscount';

const DiscountProducts = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user: authUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(30);
  const [sortBy, setSortBy] = useState('discount-high');
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showOutOfStockAlert, setShowOutOfStockAlert] = useState(false);
  const [outOfStockProductTitle, setOutOfStockProductTitle] = useState('');

  useEffect(() => {
    loadDiscountProducts();
  }, []);

  const loadDiscountProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/products/100');
      const allProducts = response.data.products || [];

      const discountProducts = allProducts.filter(product =>
        isProductOnDiscount(product) && product.quantity > 0
      );

      const sortedProducts = discountProducts.sort((a, b) =>
        getDiscountPercentage(b) - getDiscountPercentage(a)
      );

      setProducts(sortedProducts);
    } catch (error) {
      console.error('Error loading discount products:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดสินค้าลดราคา');
    } finally {
      setLoading(false);
    }
  };

  const sortedProducts = useMemo(() => {
    const sorted = [...products];

    if (sortBy === 'discount-high') {
      return sorted.sort((a, b) => getDiscountPercentage(b) - getDiscountPercentage(a));
    } else if (sortBy === 'discount-low') {
      return sorted.sort((a, b) => getDiscountPercentage(a) - getDiscountPercentage(b));
    } else if (sortBy === 'price-low') {
      return sorted.sort((a, b) => getCurrentPrice(a) - getCurrentPrice(b));
    } else if (sortBy === 'price-high') {
      return sorted.sort((a, b) => getCurrentPrice(b) - getCurrentPrice(a));
    }

    return sorted;
  }, [products, sortBy]);

  const { currentProducts, totalPages } = useMemo(() => {
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    return {
      currentProducts: sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct),
      totalPages: Math.ceil(sortedProducts.length / productsPerPage),
    };
  }, [sortedProducts, currentPage, productsPerPage]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = async (product) => {
    if (!authUser) {
      setShowLoginPopup(true);
      return;
    }

    if (product.quantity === 0 || product.quantity < 1) {
      setOutOfStockProductTitle(product.title);
      setShowOutOfStockAlert(true);
      return;
    }

    const priceToUse = getCurrentPrice(product);
    await addToCart(product.id, 1, priceToUse, {
      id: product.id,
      title: product.title,
      images: product.images || []
    });
    toast.success('เพิ่มสินค้าลงตะกร้าแล้ว');
  };

  // Generate random sold count
  const getRandomSold = (productId) => {
    const hash = productId.toString().split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash) % 10000;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center pt-20">
        <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 border-4 border-orange-100 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-[#ee4d2d] rounded-full animate-spin"></div>
          </div>
          <p className="text-[#ee4d2d] font-medium">กำลังโหลดสินค้าลดราคา...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Flash Sale Banner */}
      <div className="bg-[#ee4d2d] pt-20 sm:pt-24 pb-6">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex items-center justify-center gap-4 py-4">
            <i className="fas fa-bolt text-yellow-300 text-3xl sm:text-4xl animate-pulse"></i>
            <div className="text-center">
              <h1 className="text-white font-bold text-2xl sm:text-3xl md:text-4xl uppercase tracking-wide">
                Flash Sale
              </h1>
              <p className="text-white/90 text-sm sm:text-base">
                สินค้าลดราคาพิเศษ ลดสูงสุด {products.length > 0 ? getDiscountPercentage(products[0]) : 0}%
              </p>
            </div>
            <i className="fas fa-bolt text-yellow-300 text-3xl sm:text-4xl animate-pulse"></i>
          </div>
        </div>
      </div>

      {/* Sort Bar */}
      <div className="max-w-[1200px] mx-auto px-4 -mt-3 relative z-10">
        <div className="bg-[#ededed] rounded-sm p-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>พบ</span>
            <span className="text-[#ee4d2d] font-bold">{sortedProducts.length}</span>
            <span>สินค้า</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 hidden sm:block">เรียงตาม</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-white border-none rounded-sm text-gray-700 text-sm cursor-pointer min-w-[150px] focus:outline-none focus:ring-1 focus:ring-[#ee4d2d]"
            >
              <option value="discount-high">ส่วนลด: สูง → ต่ำ</option>
              <option value="discount-low">ส่วนลด: ต่ำ → สูง</option>
              <option value="price-low">ราคา: ต่ำ → สูง</option>
              <option value="price-high">ราคา: สูง → ต่ำ</option>
            </select>

            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 ml-4">
              <span className="text-[#ee4d2d] font-medium">{currentPage}</span>
              <span>/</span>
              <span>{totalPages || 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-[1200px] mx-auto px-4 py-4">
        {sortedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
              {currentProducts.map((product) => {
                const discountPercent = getDiscountPercentage(product);
                const remainingTime = getRemainingDiscountTime(product);
                const soldCount = getRandomSold(product.id);
                const totalStock = soldCount + (product.quantity || 0);
                const soldPercentage = totalStock > 0 ? Math.min(Math.round((soldCount / totalStock) * 100), 95) : 0;
                const isOutOfStock = product.quantity === 0 || product.quantity < 1;

                return (
                  <div
                    key={product.id}
                    className={`bg-white rounded-sm overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_13px_0_rgba(0,0,0,0.1)] ${isOutOfStock ? 'opacity-60' : ''
                      }`}
                    onClick={() => !isOutOfStock && navigate(`/product/${product.id}`)}
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square bg-gray-100 overflow-hidden">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0].url || product.images[0].secure_url}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={e => (e.target.src = 'https://via.placeholder.com/200')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <i className="fas fa-image text-3xl"></i>
                        </div>
                      )}

                      {/* Discount Badge */}
                      {!isOutOfStock && (
                        <div className="absolute top-0 right-0 bg-[#ee4d2d] text-white">
                          <div className="text-xs font-bold px-1.5 py-0.5">
                            <span className="text-[10px]">-</span>{discountPercent}%
                          </div>
                          <div className="bg-[#ffeee8] text-[#ee4d2d] text-[8px] font-bold px-1.5 py-0.5 text-center">
                            GIẢM
                          </div>
                        </div>
                      )}

                      {/* Out of Stock Badge */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold">
                            สินค้าหมด
                          </span>
                        </div>
                      )}

                      {/* Time Remaining */}
                      {remainingTime && !isOutOfStock && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] py-1 px-2 flex items-center justify-center gap-1">
                          <i className="fas fa-clock text-[8px]"></i>
                          <span>เหลือ {remainingTime}</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-2">
                      {/* Title */}
                      <h3 className="text-xs text-gray-800 line-clamp-2 min-h-[32px] mb-1.5 leading-tight">
                        {product.title}
                      </h3>

                      {/* Price Section */}
                      <div className="flex items-end gap-1 mb-1.5">
                        <span className="text-[#ee4d2d] font-medium text-sm sm:text-base">
                          ฿{getCurrentPrice(product).toLocaleString()}
                        </span>
                        <span className="text-gray-400 text-[10px] line-through">
                          ฿{product.price.toLocaleString()}
                        </span>
                      </div>

                      {/* Sold Progress Bar */}
                      {!isOutOfStock && (
                        <div className="relative h-4 bg-[#ffeee8] rounded-full overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#ee4d2d] to-[#ff6633] rounded-full transition-all duration-500"
                            style={{ width: `${soldPercentage}%` }}
                          ></div>
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white drop-shadow-sm">
                            {soldCount > 100 ? 'กำลังขายดี' : `ขายแล้ว ${soldCount}`}
                          </span>
                        </div>
                      )}

                      {/* Store Name */}
                      {product.store && (
                        <div className="mt-1.5 text-[10px] text-gray-400 flex items-center gap-1 truncate">
                          <i className="fas fa-store text-[8px]"></i>
                          <span className="truncate">{product.store.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-1.5">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`w-9 h-9 flex items-center justify-center rounded-sm bg-white border transition-colors ${currentPage === 1
                      ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                      : 'border-gray-300 text-gray-600 hover:bg-[#ee4d2d] hover:text-white hover:border-[#ee4d2d]'
                    }`}
                >
                  <i className="fas fa-chevron-left text-xs"></i>
                </button>

                {Array.from({ length: totalPages }, (_, i) => {
                  const pageNum = i + 1;
                  if (totalPages <= 7) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 flex items-center justify-center rounded-sm text-sm transition-colors ${currentPage === pageNum
                            ? 'bg-[#ee4d2d] text-white'
                            : 'bg-white border border-gray-300 text-gray-600 hover:bg-[#ee4d2d] hover:text-white hover:border-[#ee4d2d]'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }

                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 flex items-center justify-center rounded-sm text-sm transition-colors ${currentPage === pageNum
                            ? 'bg-[#ee4d2d] text-white'
                            : 'bg-white border border-gray-300 text-gray-600 hover:bg-[#ee4d2d] hover:text-white hover:border-[#ee4d2d]'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }

                  if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                  }

                  return null;
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`w-9 h-9 flex items-center justify-center rounded-sm bg-white border transition-colors ${currentPage === totalPages
                      ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                      : 'border-gray-300 text-gray-600 hover:bg-[#ee4d2d] hover:text-white hover:border-[#ee4d2d]'
                    }`}
                >
                  <i className="fas fa-chevron-right text-xs"></i>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-sm">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <i className="fas fa-fire text-gray-300 text-4xl"></i>
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">ไม่มีสินค้าลดราคา</h3>
            <p className="text-gray-500 text-sm mb-4">ขณะนี้ยังไม่มีสินค้าที่กำลังลดราคา</p>
            <Link
              to="/products"
              className="inline-block px-6 py-2 bg-[#ee4d2d] text-white rounded-sm hover:bg-[#d73211] transition-colors text-sm"
            >
              ดูสินค้าทั้งหมด
            </Link>
          </div>
        )}
      </div>

      {/* Back to Home */}
      <div className="max-w-[1200px] mx-auto px-4 pb-8">
        <div className="flex justify-center">
          <Link
            to="/"
            className="px-6 py-2 border border-gray-300 text-gray-600 rounded-sm hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
          >
            <i className="fas fa-home"></i>
            <span>กลับหน้าหลัก</span>
          </Link>
        </div>
      </div>

      {/* Login Popup */}
      <LoginPopup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        productTitle=""
      />

      <OutOfStockAlert
        isVisible={showOutOfStockAlert}
        onClose={() => setShowOutOfStockAlert(false)}
        productTitle={outOfStockProductTitle}
      />
    </div>
  );
};

export default DiscountProducts;
