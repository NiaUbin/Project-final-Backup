import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import LoginPopup from '../Common/LoginPopup';
import OutOfStockAlert from '../Common/OutOfStockAlert';
import ReviewList from '../Reviews/ReviewList';
import { isProductOnDiscount, getCurrentPrice, getDiscountedPrice, getDiscountPercentage, getRemainingDiscountTime } from '../../utils/productDiscount';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showOutOfStockAlert, setShowOutOfStockAlert] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(Math.floor(Math.random() * 1000) + 100);

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);

      const [productResponse, relatedResponse] = await Promise.all([
        axios.get(`/api/product/${id}`),
        axios.get('/api/products/100')
      ]);

      const currentProduct = productResponse.data.product;
      const allProducts = relatedResponse.data.products || [];

      setProduct(currentProduct);

      let parsedVariants = [];

      if (currentProduct.variants !== undefined && currentProduct.variants !== null) {
        if (Array.isArray(currentProduct.variants)) {
          parsedVariants = currentProduct.variants.filter(v => {
            const isValid = v &&
              v.name &&
              typeof v.name === 'string' &&
              v.name.trim() !== '' &&
              v.options &&
              Array.isArray(v.options) &&
              v.options.length > 0;
            return isValid;
          });
        } else if (typeof currentProduct.variants === 'string') {
          try {
            const parsed = JSON.parse(currentProduct.variants);
            if (Array.isArray(parsed)) {
              parsedVariants = parsed.filter(v =>
                v &&
                v.name &&
                typeof v.name === 'string' &&
                v.name.trim() !== '' &&
                v.options &&
                Array.isArray(v.options) &&
                v.options.length > 0
              );
            }
          } catch (e) {
            console.error('Error parsing variants:', e);
          }
        }
      }

      const defaultVariants = {};
      parsedVariants.forEach(variant => {
        if (variant && variant.name && variant.options && variant.options.length > 0) {
          // Support both old format (string) and new format (object with name/price)
          const firstOption = variant.options[0];
          defaultVariants[variant.name] = typeof firstOption === 'object' ? firstOption.name : firstOption;
        }
      });
      setSelectedVariants(defaultVariants);

      const related = allProducts.filter(p =>
        p.id !== parseInt(id) &&
        p.category?.id === currentProduct.category?.id
      ).slice(0, 6);
      setRelatedProducts(related);

    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    // Only scroll to top if there is no hash
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    loadProduct();
  }, [loadProduct, location.hash]);

  // Handle hash scrolling after product loads
  useEffect(() => {
    if (location.hash && product) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location.hash, product]);

  const handlePrevProduct = useCallback(async () => {
    try {
      const response = await axios.get('/api/products/100');
      const allProducts = response.data.products || [];

      const currentIndex = allProducts.findIndex(p => p.id === parseInt(id));
      if (currentIndex > 0) {
        const prevProduct = allProducts[currentIndex - 1];
        navigate(`/product/${prevProduct.id}`);
      } else {
        toast.info('นี่คือสินค้าแรกแล้ว');
      }
    } catch (error) {
      console.error('Error navigating:', error);
    }
  }, [id, navigate]);

  const handleNextProduct = useCallback(async () => {
    try {
      const response = await axios.get('/api/products/100');
      const allProducts = response.data.products || [];

      const currentIndex = allProducts.findIndex(p => p.id === parseInt(id));
      if (currentIndex < allProducts.length - 1) {
        const nextProduct = allProducts[currentIndex + 1];
        navigate(`/product/${nextProduct.id}`);
      } else {
        toast.info('นี่คือสินค้าสุดท้ายแล้ว');
      }
    } catch (error) {
      console.error('Error navigating:', error);
    }
  }, [id, navigate]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrevProduct();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNextProduct();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handlePrevProduct, handleNextProduct]);

  const handleAddToCart = async () => {
    if (!user) {
      setShowLoginPopup(true);
      return;
    }

    if (product.quantity === 0 || product.quantity < 1) {
      setShowOutOfStockAlert(true);
      return;
    }

    if (productVariants.length > 0) {
      const missingVariants = productVariants.filter(variant =>
        !selectedVariants[variant.name] || selectedVariants[variant.name] === ''
      );

      if (missingVariants.length > 0) {
        toast.warning(`กรุณาเลือก${missingVariants.map(v => v.name).join(', ')}`);
        return;
      }
    }

    // Use variant price if available, otherwise use product price
    const priceToUse = getVariantTotalPrice();

    const productData = {
      id: product.id,
      title: product.title,
      images: product.images || [],
      selectedVariants: selectedVariants
    };

    await addToCart(product.id, quantity, priceToUse, productData);

    const variantText = Object.entries(selectedVariants)
      .map(([name, value]) => `${name}: ${value}`)
      .join(', ');

    if (variantText) {
      toast.success(`เพิ่ม ${product.title} (${variantText}) ลงตะกร้าแล้ว`);
    } else {
      toast.success(`เพิ่ม ${product.title} ลงตะกร้าแล้ว`);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      setShowLoginPopup(true);
      return;
    }

    if (product.quantity === 0 || product.quantity < 1) {
      setShowOutOfStockAlert(true);
      return;
    }

    await handleAddToCart();
    navigate('/cart');
  };

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
    setFavoriteCount(prev => isFavorite ? prev - 1 : prev + 1);
  };

  const productVariants = useMemo(() => {
    if (!product) return [];

    if (product.variants !== undefined && product.variants !== null) {
      if (Array.isArray(product.variants)) {
        return product.variants.filter(v => {
          const isValid = v &&
            v.name &&
            typeof v.name === 'string' &&
            v.name.trim() !== '' &&
            v.options &&
            Array.isArray(v.options) &&
            v.options.length > 0;
          return isValid;
        });
      } else if (typeof product.variants === 'string') {
        try {
          const parsed = JSON.parse(product.variants);
          if (Array.isArray(parsed)) {
            return parsed.filter(v =>
              v &&
              v.name &&
              typeof v.name === 'string' &&
              v.name.trim() !== '' &&
              v.options &&
              Array.isArray(v.options) &&
              v.options.length > 0
            );
          }
        } catch (e) {
          console.error('Error parsing variants:', e);
        }
      }
    }

    return [];
  }, [product]);

  // Raw total from variant option prices only (no discount) - for showing original when on discount
  const getVariantRawTotalPrice = () => {
    if (!product || productVariants.length === 0) return 0;
    let sum = 0;
    productVariants.forEach(variant => {
      const selectedOptionName = selectedVariants[variant.name];
      if (selectedOptionName && variant.options) {
        const opt = variant.options.find(o => (typeof o === 'object' ? o.name : o) === selectedOptionName);
        if (opt && typeof opt === 'object' && opt.price > 0) sum += opt.price;
      }
    });
    return sum;
  };

  // Calculate total price based on selected variant options (applies product discount when on sale)
  const getVariantTotalPrice = () => {
    if (!product) return 0;

    let basePrice = getCurrentPrice(product);

    if (productVariants.length > 0) {
      let hasVariantPrice = false;
      let variantPrice = 0;

      productVariants.forEach(variant => {
        const selectedOptionName = selectedVariants[variant.name];
        if (selectedOptionName && variant.options) {
          const selectedOption = variant.options.find(opt => {
            const optName = typeof opt === 'object' ? opt.name : opt;
            return optName === selectedOptionName;
          });

          if (selectedOption && typeof selectedOption === 'object' && selectedOption.price > 0) {
            hasVariantPrice = true;
            variantPrice += selectedOption.price;
          }
        }
      });

      if (hasVariantPrice) {
        return getDiscountedPrice(product, variantPrice);
      }
    }

    return basePrice;
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.quantity || 99)) {
      setQuantity(newQuantity);
    }
  };

  // Generate random sold count for demo
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
          <p className="text-[#ee4d2d] font-medium">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center pt-20">
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <i className="fas fa-box-open text-gray-400 text-3xl"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">ไม่พบสินค้า</h2>
          <p className="text-gray-500 mb-4">สินค้าที่คุณค้นหาอาจถูกลบหรือไม่พร้อมจำหน่าย</p>
          <Link to="/products" className="inline-block px-6 py-2 bg-[#ee4d2d] text-white rounded-sm hover:bg-[#d73211] transition-colors">
            ดูสินค้าทั้งหมด
          </Link>
        </div>
      </div>
    );
  }

  const mainImage = product.images && product.images.length > 0
    ? product.images[currentImageIndex]
    : null;

  const onDiscount = isProductOnDiscount(product);
  const discountPercent = onDiscount ? getDiscountPercentage(product) : 0;
  const remainingTime = onDiscount ? getRemainingDiscountTime(product) : null;
  
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="max-w-[1000px] mx-auto px-4 pt-20 sm:pt-24 pb-6">

        {/* Breadcrumb */}
        <nav className="mb-4 text-xs sm:text-sm text-gray-500">
          <div className="flex items-center gap-1 flex-wrap">
            <Link to="/" className="hover:text-[#ee4d2d] transition-colors">หน้าหลัก</Link>
            <i className="fas fa-chevron-right text-[8px] text-gray-400"></i>
            <Link to="/products" className="hover:text-[#ee4d2d] transition-colors">สินค้าทั้งหมด</Link>
            {product.category && (
              <>
                <i className="fas fa-chevron-right text-[8px] text-gray-400"></i>
                <Link to={`/products?category=${product.category.id}`} className="hover:text-[#ee4d2d] transition-colors">
                  {product.category.name}
                </Link>
              </>
            )}
            <i className="fas fa-chevron-right text-[8px] text-gray-400"></i>
            <span className="text-gray-700 line-clamp-1">{product.title}</span>
          </div>
        </nav>

        {/* Main Product Section */}
        <div className="bg-white rounded-sm shadow-sm p-4 sm:p-6 mb-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left: Images */}
            <div className="lg:col-span-5">
              {/* Main Image */}
              <div className="relative bg-white rounded-sm border border-gray-200 aspect-square flex items-center justify-center overflow-hidden mb-3">
                {mainImage ? (
                  <img
                    src={mainImage.url || mainImage.secure_url}
                    alt={product.title}
                    className="w-full h-full object-contain"
                    onError={e => { e.target.src = 'https://via.placeholder.com/500x500?text=No+Image'; }}
                  />
                ) : (
                  <div className="text-gray-400 text-center">
                    <i className="fas fa-image text-6xl mb-4"></i>
                    <p>ไม่มีรูปภาพ</p>
                  </div>
                )}

                {/* Discount Badge */}
                {onDiscount && (
                  <div className="absolute top-0 right-0 bg-[#ee4d2d] text-white px-2 py-1">
                    <span className="text-xs font-bold">-{discountPercent}%</span>
                  </div>
                )}

                {/* Image Navigation Arrows - แสดงเฉพาะเมื่อมีรูปมากกว่า 1 รูป */}
                {product.images && product.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(prev => prev === 0 ? product.images.length - 1 : prev - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white text-gray-700 hover:text-[#ee4d2d] rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg border border-gray-200"
                    >
                      <i className="fas fa-chevron-left text-sm"></i>
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(prev => prev === product.images.length - 1 ? 0 : prev + 1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white text-gray-700 hover:text-[#ee4d2d] rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg border border-gray-200"
                    >
                      <i className="fas fa-chevron-right text-sm"></i>
                    </button>
                    {/* Image Counter */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 text-white text-xs rounded-full">
                      {currentImageIndex + 1} / {product.images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 border-2 rounded-sm overflow-hidden transition-all ${currentImageIndex === index
                          ? 'border-[#ee4d2d]'
                          : 'border-gray-200 hover:border-gray-400'
                        }`}
                    >
                      <img
                        src={image.url || image.secure_url}
                        alt={`${product.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Share & Favorite */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">แชร์:</span>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 bg-[#0084ff] text-white rounded-full flex items-center justify-center hover:opacity-80 transition">
                      <i className="fab fa-facebook-messenger text-sm"></i>
                    </button>
                    <button className="w-8 h-8 bg-[#1877f2] text-white rounded-full flex items-center justify-center hover:opacity-80 transition">
                      <i className="fab fa-facebook-f text-sm"></i>
                    </button>
                    <button className="w-8 h-8 bg-[#1da1f2] text-white rounded-full flex items-center justify-center hover:opacity-80 transition">
                      <i className="fab fa-twitter text-sm"></i>
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleFavoriteToggle}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#ee4d2d] transition-colors"
                >
                  <i className={`${isFavorite ? 'fas' : 'far'} fa-heart ${isFavorite ? 'text-[#ee4d2d]' : ''}`}></i>
                  <span>ถูกใจ ({favoriteCount.toLocaleString()})</span>
                </button>
              </div>
            </div>

            {/* Right: Product Info */}
            <div className="lg:col-span-7">
              {/* Title */}
              <div className="mb-3">
                <div className="flex items-start gap-2 mb-2">
                  {product.store && (
                    <span className="flex-shrink-0 px-1.5 py-0.5 bg-[#ee4d2d] text-white text-[10px] font-bold rounded-sm">Mall</span>
                  )}
                  <h1 className="text-base sm:text-lg lg:text-xl font-medium text-gray-800 leading-tight">
                    {product.title}
                  </h1>
                </div>
              </div>

              {/* Price Section */}
              <div className="bg-[#fafafa] p-4 sm:p-5 mb-4">
                {(() => {
                  const variantPrice = getVariantTotalPrice();
                  const hasVariantPricing = productVariants.some(v => 
                    v.options?.some(opt => typeof opt === 'object' && opt.price > 0)
                  );
                  
                  if (hasVariantPricing) {
                    const rawVariant = getVariantRawTotalPrice();
                    return (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500">ราคาตามตัวเลือก</span>
                        </div>
                        {onDiscount && rawVariant > 0 && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-gray-500 line-through">฿{rawVariant.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-2xl sm:text-3xl font-medium text-[#ee4d2d]">
                            ฿{variantPrice.toLocaleString()}
                          </span>
                          {onDiscount && (
                            <span className="px-1.5 py-0.5 bg-[#ee4d2d] text-white text-xs font-bold rounded-sm">
                              -{discountPercent}% ลด
                            </span>
                          )}
                        </div>
                        {onDiscount && remainingTime && (
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <i className="fas fa-clock text-[#ee4d2d]"></i>
                            <span className="text-[#ee4d2d] font-medium">สิ้นสุดใน {remainingTime}</span>
                          </div>
                        )}
                        {Object.keys(selectedVariants).length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            {Object.entries(selectedVariants).map(([name, value]) => (
                              <span key={name} className="mr-2 px-2 py-0.5 bg-gray-100 rounded">
                                {name}: {value}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  } else if (onDiscount) {
                    return (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-500 line-through">฿{product.price.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl sm:text-3xl font-medium text-[#ee4d2d]">
                            ฿{getCurrentPrice(product).toLocaleString()}
                          </span>
                          <span className="px-1.5 py-0.5 bg-[#ee4d2d] text-white text-xs font-bold rounded-sm">
                            -{discountPercent}% ลด
                          </span>
                        </div>
                        {remainingTime && (
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <i className="fas fa-clock text-[#ee4d2d]"></i>
                            <span className="text-[#ee4d2d] font-medium">สิ้นสุดใน {remainingTime}</span>
                          </div>
                        )}
                      </>
                    );
                  } else {
                    return (
                      <span className="text-2xl sm:text-3xl font-medium text-[#ee4d2d]">
                        ฿{product.price.toLocaleString()}
                      </span>
                    );
                  }
                })()}
              </div>

              {/* Shipping */}
              <div className="flex items-start gap-4 py-4 border-b border-gray-100">
                <span className="text-sm text-gray-500 w-24 flex-shrink-0">การจัดส่ง</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <img src="https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/d9e992985b18d96aab90969636ebfd0e.png" alt="Free Shipping" className="h-4" />
                    <span className="text-sm text-teal-600 font-medium">ส่งฟรี</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <i className="fas fa-truck text-gray-400"></i>
                    <span>ส่งถึง กรุงเทพมหานคร</span>
                    <span className="text-gray-400">|</span>
                    <span>ค่าส่ง ฿0</span>
                  </div>
                </div>
              </div>

              {/* Variants */}
              {productVariants && productVariants.length > 0 && productVariants.map((variant, variantIndex) => {
                if (!variant || !variant.name || !variant.options || !Array.isArray(variant.options) || variant.options.length === 0) {
                  return null;
                }

                return (
                  <div key={variantIndex} className="flex items-start gap-4 py-4 border-b border-gray-100">
                    <span className="text-sm text-gray-500 w-24 flex-shrink-0 pt-2">{variant.name}</span>
                    <div className="flex-1">
                      <div className="flex gap-2 flex-wrap">
                        {variant.options.map((option, optIndex) => {
                          // Support both old format (string) and new format (object with name/price)
                          const optionName = typeof option === 'object' ? option.name : option;
                          const optionPrice = typeof option === 'object' ? option.price : null;
                          const isSelected = selectedVariants[variant.name] === optionName;
                          
                          return (
                            <button
                              key={optIndex}
                              onClick={() => setSelectedVariants(prev => ({ ...prev, [variant.name]: optionName }))}
                              className={`px-4 py-2 rounded-sm border text-sm transition-all flex flex-col items-center ${isSelected
                                  ? 'border-[#ee4d2d] text-[#ee4d2d] bg-[#fff0ed]'
                                  : 'border-gray-300 text-gray-700 hover:border-[#ee4d2d] hover:text-[#ee4d2d]'
                                }`}
                            >
                              <span>{optionName}</span>
                              {optionPrice !== null && optionPrice > 0 && (
                                <span className={`text-xs mt-0.5 ${isSelected ? 'text-[#ee4d2d]' : 'text-gray-500'}`}>
                                  {onDiscount ? (
                                    <>
                                      <span className="line-through text-gray-400 mr-1">฿{optionPrice.toLocaleString()}</span>
                                      <span>฿{getDiscountedPrice(product, optionPrice).toLocaleString()}</span>
                                    </>
                                  ) : (
                                    <>฿{optionPrice.toLocaleString()}</>
                                  )}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Quantity */}
              <div className="flex items-center gap-4 py-4 border-b border-gray-100">
                <span className="text-sm text-gray-500 w-24 flex-shrink-0">จำนวน</span>
                <div className="flex items-center">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="w-8 h-8 border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="fas fa-minus text-xs"></i>
                  </button>
                  <div className="w-14 h-8 border-t border-b border-gray-300 flex items-center justify-center text-gray-800 font-medium">
                    {quantity}
                  </div>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= (product?.quantity || 99)}
                    className="w-8 h-8 border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="fas fa-plus text-xs"></i>
                  </button>
                  <span className="ml-4 text-sm text-gray-500">
                    มีสินค้าทั้งหมด {product.quantity?.toLocaleString() || 0} ชิ้น
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6">
                {product.quantity === 0 ? (
                  <button
                    disabled
                    className="flex-1 h-12 bg-gray-300 text-gray-500 rounded-sm cursor-not-allowed font-medium"
                  >
                    สินค้าหมด
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 h-12 bg-[#fff0ed] border border-[#ee4d2d] text-[#ee4d2d] rounded-sm hover:bg-[#fce4df] transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-cart-plus"></i>
                      <span>เพิ่มไปยังรถเข็น</span>
                    </button>
                    <button
                      onClick={handleBuyNow}
                      className="flex-1 h-12 bg-[#ee4d2d] text-white rounded-sm hover:bg-[#d73211] transition-colors font-medium"
                    >
                      ซื้อสินค้า
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Store Info */}
        {product.store && (
          <div className="bg-white rounded-sm shadow-sm p-4 sm:p-6 mb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#ee4d2d] rounded-full flex items-center justify-center overflow-hidden border-2 border-[#ee4d2d]">
                  {product.store.logo ? (
                    <img src={product.store.logo} alt={product.store.name} className="w-full h-full object-cover" />
                  ) : (
                    <i className="fas fa-store text-white text-2xl"></i>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-800 mb-1">{product.store.name}</div>
                  <div className="text-xs text-gray-500 mb-2">Online 5 นาทีที่แล้ว</div>
                  <div className="flex gap-2">
                    <button className="px-4 py-1.5 border border-[#ee4d2d] text-[#ee4d2d] text-sm rounded-sm hover:bg-[#fff0ed] transition-colors flex items-center gap-1">
                      <i className="far fa-comment-dots"></i>
                      <span>แชทเลย</span>
                    </button>
                    <Link
                      to={`/store/${product.store.id}`}
                      className="px-4 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-sm hover:bg-gray-50 transition-colors flex items-center gap-1"
                    >
                      <i className="fas fa-store"></i>
                      <span>ดูร้านค้า</span>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="flex gap-8 text-sm">
                <div className="text-center">
                  <div className="text-[#ee4d2d] font-medium">48</div>
                  <div className="text-gray-500">สินค้า</div>
                </div>
                <div className="text-center">
                  <div className="text-[#ee4d2d] font-medium">4.9</div>
                  <div className="text-gray-500">คะแนน</div>
                </div>
                <div className="text-center">
                  <div className="text-[#ee4d2d] font-medium">95%</div>
                  <div className="text-gray-500">ตอบกลับ</div>
                </div>
                <div className="text-center">
                  <div className="text-[#ee4d2d] font-medium">25.1k</div>
                  <div className="text-gray-500">ผู้ติดตาม</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Details */}
        <div className="bg-white rounded-sm shadow-sm mb-4">
          <div className="p-4 sm:p-6">
            <div className="bg-[#fafafa] px-4 py-3 mb-4">
              <h2 className="text-lg font-medium text-gray-800">รายละเอียดสินค้า</h2>
            </div>

            {/* Specs */}
            <div className="space-y-3 mb-6">
              {product.category && (
                <div className="flex text-sm">
                  <span className="text-gray-500 w-32 flex-shrink-0">หมวดหมู่</span>
                  <Link to={`/products?category=${product.category.id}`} className="text-[#ee4d2d] hover:underline">
                    {product.category.name}
                  </Link>
                </div>
              )}
              <div className="flex text-sm">
                <span className="text-gray-500 w-32 flex-shrink-0">สต็อกสินค้า</span>
                <span className={product.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                  {product.quantity > 0 ? `${product.quantity.toLocaleString()} ชิ้น` : 'สินค้าหมด'}
                </span>
              </div>
              <div className="flex text-sm">
                <span className="text-gray-500 w-32 flex-shrink-0">รหัสสินค้า</span>
                <span className="text-gray-700">#{product.id}</span>
              </div>
              {product.store && (
                <div className="flex text-sm">
                  <span className="text-gray-500 w-32 flex-shrink-0">ร้านค้า</span>
                  <Link to={`/store/${product.store.id}`} className="text-[#ee4d2d] hover:underline">
                    {product.store.name}
                  </Link>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-[#fafafa] px-4 py-3 mb-4">
              <h3 className="text-base font-medium text-gray-800">คำอธิบายสินค้า</h3>
            </div>
            {product.description && product.description.trim() ? (
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-file-alt text-gray-300 text-4xl mb-3"></i>
                <p className="text-gray-500">ยังไม่มีคำอธิบายสินค้า</p>
              </div>
            )}

            {/* Features */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-sm">
                  <i className="fas fa-check-circle text-green-500"></i>
                  <span className="text-sm text-gray-700">สินค้าแท้ 100%</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-sm">
                  <i className="fas fa-shipping-fast text-blue-500"></i>
                  <span className="text-sm text-gray-700">จัดส่งฟรี</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-sm">
                  <i className="fas fa-undo text-orange-500"></i>
                  <span className="text-sm text-gray-700">คืนได้ 7 วัน</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div id="reviews" className="bg-white rounded-sm shadow-sm p-4 sm:p-6 mb-4">
          <ReviewList productId={product.id} />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-4">
            <div className="bg-white rounded-sm shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-700">สินค้าที่คล้ายกัน</h2>
                <Link to="/products" className="text-sm text-[#ee4d2d] hover:underline flex items-center gap-1">
                  <span>ดูทั้งหมด</span>
                  <i className="fas fa-chevron-right text-xs"></i>
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {relatedProducts.map((relatedProduct) => {
                  const relatedSold = getRandomSold(relatedProduct.id);
                  return (
                    <Link
                      key={relatedProduct.id}
                      to={`/product/${relatedProduct.id}`}
                      className="group bg-white border border-gray-100 rounded-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
                    >
                      <div className="aspect-square bg-gray-50 relative overflow-hidden">
                        {relatedProduct.images && relatedProduct.images.length > 0 ? (
                          <img
                            src={relatedProduct.images[0].url || relatedProduct.images[0].secure_url}
                            alt={relatedProduct.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <i className="fas fa-image text-3xl"></i>
                          </div>
                        )}
                        {isProductOnDiscount(relatedProduct) && (
                          <div className="absolute top-0 right-0 bg-[#ee4d2d] text-white text-xs font-bold px-1 py-0.5">
                            -{getDiscountPercentage(relatedProduct)}%
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <h3 className="text-xs text-gray-800 line-clamp-2 min-h-[32px] mb-1">
                          {relatedProduct.title}
                        </h3>
                        <div className="text-[#ee4d2d] font-medium text-sm">
                          ฿{getCurrentPrice(relatedProduct).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">
                          ขายแล้ว {relatedSold > 1000 ? `${(relatedSold / 1000).toFixed(1)}พัน` : relatedSold}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Login Popup */}
      <LoginPopup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        productTitle={product?.title || ''}
      />

      <OutOfStockAlert
        isVisible={showOutOfStockAlert}
        onClose={() => setShowOutOfStockAlert(false)}
        productTitle={product?.title || ''}
      />
    </div>
  );
};

export default ProductDetail;