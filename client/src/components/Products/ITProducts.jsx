import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoginPopup from '../Common/LoginPopup';
import OutOfStockAlert from '../Common/OutOfStockAlert';
import { isProductOnDiscount, getCurrentPrice, getDiscountPercentage } from '../../utils/productDiscount';

const ITProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(30);
  const [sortBy, setSortBy] = useState('popular');
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showOutOfStockAlert, setShowOutOfStockAlert] = useState(false);
  const [outOfStockProductTitle] = useState('');

  // IT keywords สำหรับกรองสินค้า (เฉพาะเจาะจงมากขึ้น)
  const itKeywords = [
    'notebook', 'โน๊ตบุ๊ค', 'โน้ตบุ๊ค', 'laptop', 'แล็ปท็อป',
    'computer', 'คอมพิวเตอร์', 'desktop', 'pc gaming',
    'mouse gaming', 'เมาส์', 'keyboard gaming', 'คีย์บอร์ด',
    'monitor', 'จอคอม', 'จอมอนิเตอร์',
    'ram ddr', 'ssd', 'hdd', 'hard disk', 'ฮาร์ดดิสก์',
    'gpu', 'graphics card', 'การ์ดจอ', 'vga',
    'cpu', 'processor', 'โปรเซสเซอร์',
    'motherboard', 'เมนบอร์ด', 'mainboard',
    'gaming gear', 'เกมมิ่ง',
    'headset gaming', 'หูฟังเกมมิ่ง',
    'webcam', 'เว็บแคม',
    'printer', 'เครื่องพิมพ์', 'ปริ้นเตอร์',
    'router', 'เราเตอร์', 'wifi',
    'flash drive', 'แฟลชไดรฟ์', 'thumb drive',
    'power supply', 'psu', 'พาวเวอร์ซัพพลาย',
    'cooling', 'พัดลม', 'heatsink',
    'case pc', 'เคสคอม',
    'acer', 'asus', 'msi', 'lenovo', 'dell', 'hp pavilion', 'gigabyte', 'razer'
  ];

  // Keywords ที่ต้องไม่รวม (เสื้อผ้า, แฟชั่น ฯลฯ)
  const excludeKeywords = [
    'เสื้อ', 'กางเกง', 'รองเท้า', 'เดรส', 'กระโปรง', 'ชุด', 'แฟชั่น',
    'cardigan', 'sweater', 'shirt', 't-shirt', 'jacket', 'jeans', 'pants',
    'dress', 'skirt', 'shoes', 'sneaker', 'adidas', 'nike', 'polo',
    'yankees', 'majestic', 'fashion', 'clothing', 'apparel'
  ];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadITProducts();
  }, []);

  const loadITProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/products/100');
      const allProducts = response.data.products || [];

      const itProducts = allProducts.filter(product => {
        const title = product.title?.toLowerCase() || '';
        const description = product.description?.toLowerCase() || '';
        const categoryName = product.category?.name?.toLowerCase() || '';
        const searchText = `${title} ${categoryName}`;
        
        // ตรวจสอบว่าไม่ใช่สินค้าที่ต้อง exclude
        const isExcluded = excludeKeywords.some(keyword => 
          title.includes(keyword.toLowerCase())
        );
        
        if (isExcluded) return false;
        
        // ตรวจสอบว่ามี IT keyword
        return itKeywords.some(keyword => 
          searchText.includes(keyword.toLowerCase())
        );
      });

      setProducts(itProducts);
    } catch (error) {
      console.error('Error loading IT products:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดสินค้า IT');
    } finally {
      setLoading(false);
    }
  };

  const sortedProducts = useMemo(() => {
    const sorted = [...products];

    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => getCurrentPrice(a) - getCurrentPrice(b));
      case 'price-high':
        return sorted.sort((a, b) => getCurrentPrice(b) - getCurrentPrice(a));
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'discount':
        return sorted.sort((a, b) => getDiscountPercentage(b) - getDiscountPercentage(a));
      default:
        return sorted;
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center pt-20">
        <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 border-4 border-orange-100 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-[#ee4d2d] rounded-full animate-spin"></div>
          </div>
          <p className="text-[#ee4d2d] font-medium">กำลังโหลดสินค้า IT...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header Banner - Shopee Style */}
      <div className="bg-[#ee4d2d] pt-20 sm:pt-24 pb-4">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex items-center justify-center gap-3 py-3">
            <i className="fas fa-desktop text-white text-2xl"></i>
            <h1 className="text-white font-bold text-xl sm:text-2xl">
              สินค้า IT & คอมพิวเตอร์
            </h1>
            <i className="fas fa-laptop text-white text-xl"></i>
          </div>
          <p className="text-white/90 text-center text-sm">
            รวมอุปกรณ์คอมพิวเตอร์ โน๊ตบุ๊ค และอุปกรณ์ IT ทั้งหมด
          </p>
        </div>
      </div>

      {/* Filter & Sort Bar - Shopee Style */}
      <div className="max-w-[1200px] mx-auto px-4 py-3">
        <div className="bg-[#ededed] rounded-sm p-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>พบ</span>
            <span className="text-[#ee4d2d] font-bold">{sortedProducts.length}</span>
            <span>รายการ</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 hidden sm:block">เรียงตาม:</span>
            
            {/* Sort Buttons - Shopee Style */}
            <div className="flex items-center gap-1">
              {[
                { value: 'popular', label: 'ยอดนิยม' },
                { value: 'newest', label: 'ใหม่ล่าสุด' },
                { value: 'price-low', label: 'ราคาต่ำ-สูง' },
                { value: 'price-high', label: 'ราคาสูง-ต่ำ' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`px-3 py-1.5 text-xs sm:text-sm rounded-sm transition-colors ${
                    sortBy === option.value
                      ? 'bg-[#ee4d2d] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 ml-2">
              <span className="text-[#ee4d2d] font-medium">{currentPage}</span>
              <span>/</span>
              <span>{totalPages || 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid - Shopee Style */}
      <div className="max-w-[1200px] mx-auto px-4 pb-6">
        {sortedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {currentProducts.map((product) => {
                const hasDiscount = isProductOnDiscount(product);
                const discountPercent = hasDiscount ? getDiscountPercentage(product) : 0;
                const isOutOfStock = product.quantity === 0 || product.quantity < 1;

                return (
                  <div
                    key={product.id}
                    className={`bg-white rounded-sm overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_13px_0_rgba(0,0,0,0.1)] ${isOutOfStock ? 'opacity-60' : ''}`}
                    onClick={() => !isOutOfStock && navigate(`/product/${product.id}`)}
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square bg-white overflow-hidden border-b border-gray-100">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0].url || product.images[0].secure_url}
                          alt={product.title}
                          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                          onError={e => (e.target.src = 'https://via.placeholder.com/200')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <i className="fas fa-image text-3xl"></i>
                        </div>
                      )}

                      {/* Discount Badge - Shopee Style */}
                      {hasDiscount && !isOutOfStock && (
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

                      {/* Low Stock Warning */}
                      {!isOutOfStock && product.quantity > 0 && product.quantity < 10 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-[#ee4d2d] text-white text-[10px] py-0.5 px-2 text-center">
                          เหลือ {product.quantity} ชิ้น
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-2">
                      <h3 className="text-xs text-gray-800 line-clamp-2 min-h-[32px] mb-1 leading-tight group-hover:text-[#ee4d2d]">
                        {product.title}
                      </h3>

                      {/* Price Section - Shopee Style */}
                      <div className="flex items-baseline gap-1">
                        <span className="text-[#ee4d2d] font-bold text-sm">
                          ฿{getCurrentPrice(product).toLocaleString()}
                        </span>
                        {hasDiscount && (
                          <span className="text-gray-400 text-[10px] line-through">
                            ฿{product.price.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Sold Count */}
                      <div className="mt-1 text-[10px] text-gray-400">
                        ขายแล้ว {product.sold || Math.floor(Math.random() * 1000)} ชิ้น
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination - Shopee Style */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-1">
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
              <i className="fas fa-desktop text-gray-300 text-4xl"></i>
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">ไม่พบสินค้า IT</h3>
            <p className="text-gray-500 text-sm mb-4">ขณะนี้ยังไม่มีสินค้า IT ในระบบ</p>
            <Link
              to="/products"
              className="inline-block px-6 py-2 bg-[#ee4d2d] text-white rounded-sm hover:bg-[#d73211] transition-colors text-sm"
            >
              ดูสินค้าทั้งหมด
            </Link>
          </div>
        )}
      </div>

      {/* Back to Home - Shopee Style */}
      <div className="max-w-[1200px] mx-auto px-4 pb-8">
        <div className="flex justify-center">
          <Link
            to="/"
            className="px-8 py-2 border border-gray-300 text-gray-600 rounded-sm hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
          >
            <i className="fas fa-home"></i>
            <span>กลับหน้าหลัก</span>
          </Link>
        </div>
      </div>

      {/* Popups */}
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

export default ITProducts;
