import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";
import LoginPopup from "../Common/LoginPopup";
import OutOfStockAlert from "../Common/OutOfStockAlert";
import DiscountAlert from "../Common/DiscountAlert";
import {
  isProductOnDiscount,
  getCurrentPrice,
  getDiscountPercentage,
  getRemainingDiscountTime,
} from "../../utils/productDiscount";

const UserDashboard = ({ user, stats, loading }) => {
  const { addToCart } = useCart();
  const { user: authUser } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [selectedProductTitle, setSelectedProductTitle] = useState("");
  const [showOutOfStockAlert, setShowOutOfStockAlert] = useState(false);
  const [outOfStockProductTitle, setOutOfStockProductTitle] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [discountProducts, setDiscountProducts] = useState([]);
  const [discountLoading, setDiscountLoading] = useState(true);
  const [showDiscountAlert, setShowDiscountAlert] = useState(false);
  const [maxDiscountProduct, setMaxDiscountProduct] = useState(null);
  const [prevAuthUser, setPrevAuthUser] = useState(authUser);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [allProducts, setAllProducts] = useState([]);
  const [allProductsLoading, setAllProductsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [lowStockPage, setLowStockPage] = useState(0);
  const itemsPerPage = 6;

  useEffect(() => {
    loadFeaturedProducts();
    loadDiscountProducts();
    loadCategories();
    loadAllProducts();
  }, []);

  useEffect(() => {
    setShowDiscountAlert(false);
    setMaxDiscountProduct(null);
    setTimeout(() => setIsInitialMount(false), 100);
  }, []);

  useEffect(() => {
    if (isInitialMount) {
      setPrevAuthUser(authUser);
      return;
    }
    const wasLoggedOut = prevAuthUser === null || prevAuthUser === undefined;
    const isNowLoggedIn =
      authUser !== null && authUser !== undefined && authUser?.id;
    if (wasLoggedOut && isNowLoggedIn) {
      const alertKey = `discountAlertShown_${authUser.id}`;
      if (
        localStorage.getItem(alertKey) !== "true" &&
        !discountLoading &&
        discountProducts.length > 0
      ) {
        const maxDiscount = discountProducts[0];
        if (maxDiscount) {
          setMaxDiscountProduct(maxDiscount);
          setTimeout(() => {
            setShowDiscountAlert(true);
            localStorage.setItem(alertKey, "true");
          }, 1200);
        }
      }
    }
    setPrevAuthUser(authUser);
  }, [
    authUser,
    prevAuthUser,
    discountLoading,
    discountProducts,
    isInitialMount,
  ]);

  useEffect(() => {
    if (isInitialMount || !authUser?.id || showDiscountAlert) return;
    const alertKey = `discountAlertShown_${authUser.id}`;
    if (
      localStorage.getItem(alertKey) !== "true" &&
      !discountLoading &&
      discountProducts.length > 0
    ) {
      if (prevAuthUser === null || prevAuthUser === undefined) {
        const maxDiscount = discountProducts[0];
        if (maxDiscount) {
          setMaxDiscountProduct(maxDiscount);
          setTimeout(() => {
            setShowDiscountAlert(true);
            localStorage.setItem(alertKey, "true");
          }, 1200);
        }
      }
    }
  }, [
    discountLoading,
    discountProducts,
    authUser,
    prevAuthUser,
    showDiscountAlert,
    isInitialMount,
  ]);

  useEffect(() => {
    if (isInitialMount) return;
    if (prevAuthUser && !authUser && prevAuthUser.id) {
      localStorage.removeItem(`discountAlertShown_${prevAuthUser.id}`);
    }
  }, [authUser, prevAuthUser, isInitialMount]);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await axios.get("/api/category");
      console.log("📦 Categories response:", response.data);
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("❌ Error loading categories:", error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadFeaturedProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await axios.get("/api/products/100");
      console.log("📦 Featured products response:", response.data);
      const products = response.data.products || [];
      const limitedStock = products
        .filter((p) => p.quantity > 0 && p.quantity < 20)
        .sort((a, b) => a.quantity - b.quantity);
      setFeaturedProducts(limitedStock);
      console.log("📦 Limited stock products:", limitedStock.length);
    } catch (error) {
      console.error("❌ Error loading featured products:", error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
    } finally {
      setProductsLoading(false);
    }
  };

  const loadDiscountProducts = async () => {
    try {
      setDiscountLoading(true);
      const response = await axios.get("/api/products/100");
      const products = response.data.products || [];
      const onDiscount = products
        .filter((p) => isProductOnDiscount(p) && p.quantity > 0)
        .sort((a, b) => getDiscountPercentage(b) - getDiscountPercentage(a));
      setDiscountProducts(onDiscount);
    } catch (error) {
      console.error("Error loading discount products:", error);
      setApiError("ไม่สามารถโหลดสินค้าได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setDiscountLoading(false);
    }
  };

  const loadAllProducts = async () => {
    try {
      setAllProductsLoading(true);
      setApiError(null);
      const response = await axios.get("/api/products/50");
      console.log("📦 All products response:", response.data);
      const products = response.data.products || [];
      // แสดงเฉพาะสินค้าที่มีสต็อก
      const availableProducts = products.filter((p) => p.quantity > 0);
      setAllProducts(availableProducts);
      console.log("📦 Available products:", availableProducts.length);
    } catch (error) {
      console.error("❌ Error loading all products:", error);
      setApiError("ไม่สามารถโหลดสินค้าได้ กรุณาตรวจสอบการเชื่อมต่อ");
      toast.error("เกิดข้อผิดพลาดในการโหลดสินค้า");
    } finally {
      setAllProductsLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    if (!authUser) {
      setSelectedProductTitle(product.title);
      setShowLoginPopup(true);
      return;
    }
    if (product.quantity < 1) {
      setOutOfStockProductTitle(product.title);
      setShowOutOfStockAlert(true);
      return;
    }
    await addToCart(product.id, 1, getCurrentPrice(product), {
      id: product.id,
      title: product.title,
      images: product.images || [],
    });
  };



  if (loading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="w-10 h-10 border-4 border-orange-100 border-t-[#ee4d2d] rounded-full animate-spin"></div>
      </div>
    );
  }

  const ProductCard = ({ product, isFlashSale = false }) => {
    const hasDiscount = isProductOnDiscount(product);
    const discountPercent = hasDiscount ? getDiscountPercentage(product) : 0;
    const isOutOfStock = product.quantity < 1;
    const soldCount = product.sold || 0;

    return (
      <div className="bg-white rounded-sm overflow-hidden hover:shadow-md transition-all group">
        <Link to={`/product/${product.id}`} className="block">
          <div className="aspect-square bg-gray-50 relative overflow-hidden">
            {product.images?.[0] ? (
              <img
                src={product.images[0].url || product.images[0].secure_url}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <i className="fas fa-image text-gray-200 text-3xl"></i>
              </div>
            )}
            {hasDiscount && (
              <span className="absolute top-0 left-0 px-1.5 py-0.5 bg-[#ee4d2d] text-white text-[10px] font-bold">
                -{discountPercent}%
              </span>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white text-xs font-medium">หมดสต็อก</span>
              </div>
            )}
            {!isOutOfStock && product.quantity < 20 && (
              <span className="absolute top-0 right-0 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold">
                เหลือ {product.quantity}
              </span>
            )}
          </div>
          <div className="p-2">
            <h3 className="text-xs text-gray-800 line-clamp-2 mb-1 min-h-[2rem] group-hover:text-[#ee4d2d]">
              {product.title}
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-[#ee4d2d]">
                ฿{getCurrentPrice(product).toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-[10px] text-gray-400 line-through">
                  ฿{product.price.toLocaleString()}
                </span>
              )}
            </div>
            {isFlashSale && soldCount > 0 && (
              <div className="mt-1">
                <div className="h-1 bg-[#ffeee8] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#ee4d2d] rounded-full"
                    style={{
                      width: `${Math.min((soldCount / (soldCount + product.quantity)) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  ขายแล้ว {soldCount} ชิ้น
                </p>
              </div>
            )}
          </div>
        </Link>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Hero Banner - Shopee Style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-1">
          {/* Main Banner - Single Image */}
          <div className="lg:col-span-3 relative h-52 sm:h-60 overflow-hidden shadow-lg">
            <img
              src="/000000.jpg"
              alt="ช้อปปิ้งออนไลน์"
              className="w-full h-full object-cover"
              onError={(e) =>
                (e.target.src = "https://picsum.photos/seed/shop1/1200/400")
              }
            />
          </div>
          {/* Side Promo Banners */}
          <div className="hidden lg:flex flex-col gap-1 h-52 sm:h-60">
            <Link
              to="/it-products"
              className="flex-1 min-h-0 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group/promo"
            >
              <div className="relative w-full h-full">
                <img
                  src="/unnamed.jpg"
                  alt="IT Computer Equipment"
                  className="w-full h-full object-cover group-hover/promo:scale-105 transition-transform duration-300"
                  onError={(e) =>
                    (e.target.src = "https://picsum.photos/seed/promo1/400/200")
                  }
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover/promo:opacity-100 transition-opacity duration-300"></div>
              </div>
            </Link>
            <Link
              to="/discount-products"
              className="flex-1 min-h-0 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group/promo"
            >
              <div className="relative w-full h-full">
                <img
                  src="/unnamed555.jpg"
                  alt="promo-2"
                  className="w-full h-full object-cover group-hover/promo:scale-105 transition-transform duration-300"
                  onError={(e) =>
                    (e.target.src = "https://picsum.photos/seed/promo2/400/200")
                  }
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover/promo:opacity-100 transition-opacity duration-300"></div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Categories */}
      <div className="max-w-[1200px] mx-auto px-4 py-3">
        <div className="bg-white rounded-sm p-3 shadow-md">
          <div className="flex items-center gap-4 overflow-x-auto justify-center">
            {[
              {
                icon: "fa-bolt",
                label: "Flash Sale",
                color: "#ee4d2d",
                link: "/discount-products",
              },
              {
                icon: "fa-store",
                label: "ร้านค้า",
                color: "#ee4d2d",
                link: "/stores",
              },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.link}
                className="flex flex-col items-center gap-1 min-w-[60px] group"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <i
                    className={`fas ${item.icon}`}
                    style={{ color: item.color }}
                  ></i>
                </div>
                <span className="text-[10px] text-gray-600 group-hover:text-[#ee4d2d] whitespace-nowrap">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Categories */}
<div className="max-w-[1200px] mx-auto px-4 py-2">
  <div className="bg-white rounded-sm shadow-md">
    <div className="p-3 border-b border-gray-100">
      <h2 className="font-medium text-gray-900">หมวดหมู่</h2>
    </div>
    <div className="p-4"> {/* เพิ่ม padding รอบนอกเล็กน้อย */}
      {categoriesLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center animate-pulse">
              {/* ปรับ skeleton ให้ใหญ่ตามรูปจริง */}
              <div className="w-16 h-16 bg-gray-200 rounded-full mb-2"></div>
              <div className="w-16 h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className="flex flex-col items-center group"
            >
              {/* ปรับขนาดวงกลมจาก w-12 h-12 เป็น w-16 h-16 (หรือ w-20 h-20 ถ้าต้องการใหญ่มาก) */}
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 group-hover:border-[#ee4d2d] overflow-hidden transition-all duration-200 shadow-sm">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                  />
                ) : (
                  <i className="fas fa-tag text-[#ee4d2d] text-xl"></i>
                )}
              </div>
              
              {/* ปรับ font size จาก text-[10px] เป็น text-sm และเพิ่ม font-medium */}
              <span className="text-sm font-medium text-gray-700 text-center line-clamp-2 mt-2 group-hover:text-[#ee4d2d] transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  </div>
</div>

      {/* Flash Sale */}
      {discountProducts.length > 0 && (
        <div className="max-w-[1200px] mx-auto px-4 py-3">
          <div className="bg-white rounded-sm shadow-md">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#ee4d2d] to-[#f7522e]">
              <div className="flex items-center gap-2">
                <i className="fas fa-bolt text-yellow-300 text-lg animate-pulse"></i>
                <span className="font-bold text-white">FLASH SALE</span>
              </div>
              <Link
                to="/discount-products"
                className="text-white text-sm hover:underline"
              >
                ดูทั้งหมด <i className="fas fa-chevron-right text-xs"></i>
              </Link>
            </div>
            <div className="p-3">
              {discountLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-orange-100 border-t-[#ee4d2d] rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {discountProducts.slice(0, 6).map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isFlashSale
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Low Stock */}
      {featuredProducts.length > 0 && (
        <div className="max-w-[1200px] mx-auto px-4 py-3">
          <div className="bg-white rounded-sm shadow-md">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="fas fa-fire text-orange-500"></i>
                <span className="font-medium text-gray-900">สินค้าใกล้หมด</span>
                <span className="text-xs text-gray-500">({featuredProducts.length} รายการ)</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Navigation Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setLowStockPage(prev => Math.max(0, prev - 1))}
                    disabled={lowStockPage === 0}
                    className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                      lowStockPage === 0
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-gray-300 text-gray-600 hover:border-[#ee4d2d] hover:text-[#ee4d2d] hover:bg-[#fef0ed]'
                    }`}
                  >
                    <i className="fas fa-chevron-left text-xs"></i>
                  </button>
                  <span className="text-xs text-gray-500 min-w-[50px] text-center">
                    {lowStockPage + 1} / {Math.ceil(featuredProducts.length / itemsPerPage)}
                  </span>
                  <button
                    onClick={() => setLowStockPage(prev => Math.min(Math.ceil(featuredProducts.length / itemsPerPage) - 1, prev + 1))}
                    disabled={lowStockPage >= Math.ceil(featuredProducts.length / itemsPerPage) - 1}
                    className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                      lowStockPage >= Math.ceil(featuredProducts.length / itemsPerPage) - 1
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-gray-300 text-gray-600 hover:border-[#ee4d2d] hover:text-[#ee4d2d] hover:bg-[#fef0ed]'
                    }`}
                  >
                    <i className="fas fa-chevron-right text-xs"></i>
                  </button>
                </div>
                <Link
                  to="/products"
                  className="text-[#ee4d2d] text-sm hover:underline"
                >
                  ดูทั้งหมด <i className="fas fa-chevron-right text-xs"></i>
                </Link>
              </div>
            </div>
            <div className="p-3">
              {productsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-orange-100 border-t-[#ee4d2d] rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {featuredProducts.slice(lowStockPage * itemsPerPage, (lowStockPage + 1) * itemsPerPage).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All Products Section */}
      <div className="max-w-[1200px] mx-auto px-4 py-3">
        <div className="bg-white rounded-sm shadow-md">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="fas fa-box text-[#ee4d2d]"></i>
              <span className="font-medium text-gray-900">สินค้าทั้งหมด</span>
            </div>
            <Link
              to="/products"
              className="text-[#ee4d2d] text-sm hover:underline"
            >
              ดูทั้งหมด <i className="fas fa-chevron-right text-xs"></i>
            </Link>
          </div>
          <div className="p-3">
            {apiError ? (
              <div className="text-center py-8">
                <div className="text-red-500 mb-2">
                  <i className="fas fa-exclamation-circle text-2xl mb-2"></i>
                  <p className="text-sm">{apiError}</p>
                </div>
                <button
                  onClick={loadAllProducts}
                  className="mt-4 px-4 py-2 bg-[#ee4d2d] text-white rounded-sm hover:bg-[#d43a1a] transition-colors text-sm"
                >
                  ลองใหม่อีกครั้ง
                </button>
              </div>
            ) : allProductsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-orange-100 border-t-[#ee4d2d] rounded-full animate-spin"></div>
              </div>
            ) : allProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {allProducts.slice(0, 12).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-box-open text-4xl mb-2"></i>
                <p className="text-sm">ยังไม่มีสินค้า</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-[1200px] mx-auto px-4 py-4">
        <div className="text-center">
          <Link
            to="/products"
            className="inline-flex shadow-md items-center gap-2 px-8 py-2 border border-[#ee4d2d] text-[#ee4d2d] rounded-sm text-sm font-medium hover:bg-[#fef0ed] transition-colors"
          >
            ดูสินค้าเพิ่มเติม <i className="fas fa-chevron-down text-xs"></i>
          </Link>
        </div>
      </div>

      {/* Popups */}
      <LoginPopup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        productTitle={selectedProductTitle}
      />
      <OutOfStockAlert
        isVisible={showOutOfStockAlert}
        onClose={() => setShowOutOfStockAlert(false)}
        productTitle={outOfStockProductTitle}
      />
      {maxDiscountProduct && showDiscountAlert && (
        <DiscountAlert
          isVisible={showDiscountAlert}
          onClose={() => setShowDiscountAlert(false)}
          maxDiscount={getDiscountPercentage(maxDiscountProduct)}
          product={maxDiscountProduct}
        />
      )}
    </div>
  );
};

export default UserDashboard;
