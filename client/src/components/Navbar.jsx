import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import axios from 'axios';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { getCartItemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [categories, setCategories] = useState([]);
  const dropdownRef = useRef(null);
  const languageDropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const suggestionRefs = useRef([]);

  // โหลดหมวดหมู่สินค้าทั้งหมด
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await axios.get('/api/category');
        setCategories(response.data.categories || []);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  // อ่าน query parameter จาก URL เมื่อ component mount หรือ location เปลี่ยน
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
    }
  }, [location]);

  // Real-time search suggestions
  useEffect(() => {
    let isActive = true;

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // แสดง dropdown ทันทีเมื่อมีข้อความ (แม้ยังไม่มีผลลัพธ์)
    if (searchQuery.trim().length > 0) {
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce search - wait 300ms after user stops typing
    searchTimeoutRef.current = setTimeout(async () => {
      if (!isActive) return;

      try {
        setIsSearching(true);
        console.log('🔍 Searching for:', searchQuery.trim());

        const query = searchQuery.trim().toLowerCase();

        // ค้นหาหมวดหมู่ที่ตรงกับคำค้นหา
        const matchedCategories = categories.filter(category =>
          category.name && category.name.toLowerCase().includes(query)
        );

        if (isActive) {
          setCategorySuggestions(matchedCategories);
        }

        // ค้นหาสินค้าที่ตรงกับคำค้นหา
        const response = await axios.post('/api/search/filters', {
          query: query
        });

        if (!isActive) return;

        console.log('✅ Search response:', response.data);
        const products = response.data.products || [];
        console.log('📦 Products found:', products.length);
        console.log('📁 Categories found:', matchedCategories.length);

        // แสดงผลลัพธ์ทั้งหมดที่ตรงกับคำค้นหา (ไม่จำกัดจำนวน)
        setSearchSuggestions(products);
        // แสดง dropdown เสมอเมื่อมีข้อความ (แม้ไม่มีผลลัพธ์)
        setShowSuggestions(true);
      } catch (error) {
        if (!isActive) return;
        console.error('❌ Search error:', error);
        console.error('Error details:', error.response?.data || error.message);
        setSearchSuggestions([]);
        setCategorySuggestions([]);
        // แสดง dropdown แม้เกิด error (เพื่อให้ผู้ใช้เห็นว่ากำลังค้นหา)
        setShowSuggestions(true);
      } finally {
        if (isActive) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      isActive = false;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, categories]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = [
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ];

  // Load language from localStorage or default to 'ไทย'
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    return savedLanguage || 'ไทย';
  });

  // Save language to localStorage when changed
  useEffect(() => {
    localStorage.setItem('selectedLanguage', selectedLanguage);
  }, [selectedLanguage]);

  // ฟังก์ชันค้นหาสินค้า
  const handleSearch = () => {
    setShowSuggestions(false);
    setSelectedIndex(-1);
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  // ฟังก์ชันเลือก suggestion (สินค้า)
  const handleSelectSuggestion = (product) => {
    setSearchQuery(product.title);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    navigate(`/product/${product.id}`);
  };

  // ฟังก์ชันเลือกหมวดหมู่
  const handleSelectCategory = (category) => {
    setSearchQuery(category.name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    navigate(`/products?category=${category.id}`);
  };

  // รวม suggestions ทั้งหมวดหมู่และสินค้า
  const allSuggestions = useMemo(() => {
    return [
      ...categorySuggestions.map(cat => ({ type: 'category', data: cat })),
      ...searchSuggestions.map(prod => ({ type: 'product', data: prod }))
    ];
  }, [categorySuggestions, searchSuggestions]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    const totalItems = allSuggestions.length;
    if (!showSuggestions || totalItems === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < totalItems - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < totalItems) {
          const selected = allSuggestions[selectedIndex];
          if (selected.type === 'category') {
            handleSelectCategory(selected.data);
          } else {
            handleSelectSuggestion(selected.data);
          }
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        searchInputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  // Scroll to selected item
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(e.target)) {
        setIsLanguageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userNavigation = [
    { name: 'โปรไฟล์', href: '/profile', icon: 'fas fa-user' },
    { name: 'ประวัติการสั่งซื้อ', href: '/orders', icon: 'fas fa-receipt' },
    // { name: 'สิทธิ์การใช้งาน', href: '/roles', icon: 'fas fa-shield-alt' },
  ];

  return (
    <nav className="fixed w-full top-0 z-50">
      {/* Top Thin Bar */}
      <div className="bg-orange-600 text-white text-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-1.5 sm:py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <Link to="/seller" className="hover:underline text-[11px] sm:text-xs">Seller Centre</Link>
              <Link to="/stores" className="hover:underline text-[11px] sm:text-xs">ร้านค้า</Link>
              <div className="hidden md:flex items-center gap-2">
                <i className="fab fa-facebook text-sm cursor-pointer hover:opacity-80"></i>
                <i className="fab fa-instagram text-sm cursor-pointer hover:opacity-80"></i>
                <i className="fab fa-line text-sm cursor-pointer hover:opacity-80"></i>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <Link to="/notifications" className="flex items-center gap-1 hover:underline text-[11px] sm:text-xs">
                <i className="fas fa-bell text-xs"></i>
                <span className="hidden sm:inline">สินค้าใหม่</span>
              </Link>
              <Link to="/help" className="flex items-center gap-1 hover:underline text-[11px] sm:text-xs">
                <i className="fas fa-question-circle text-xs"></i>
                <span className="hidden sm:inline">ช่วยเหลือ</span>
              </Link>
              <div className="relative hidden md:block" ref={languageDropdownRef}>
                <button
                  onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                  className="flex items-center gap-1.5 hover:text-white/80 text-[11px] sm:text-xs cursor-pointer transition-all duration-200 px-2 py-1 rounded hover:bg-white/10"
                >
                  <i className="fas fa-globe text-xs"></i>
                  <span>{selectedLanguage}</span>
                  <i className={`fas fa-chevron-down text-[10px] transition-transform duration-300 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`}></i>
                </button>

                {/* Dropdown with beautiful animation */}
                <div className={`absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 transition-all duration-300 ease-out transform origin-top-right ${isLanguageDropdownOpen
                  ? 'opacity-100 scale-100 translate-y-0'
                  : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                  }`}>
                  {/* Header */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 px-4 py-2.5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-globe text-orange-500 text-sm"></i>
                      <span className="text-xs font-semibold text-gray-700">เลือกภาษา</span>
                    </div>
                  </div>

                  {/* Language List */}
                  <div className="py-1.5">
                    {languages.map((lang, index) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setSelectedLanguage(lang.name);
                          setIsLanguageDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-200 flex items-center gap-3 hover:bg-orange-50 hover:translate-x-1 ${selectedLanguage === lang.name
                          ? 'bg-orange-50 text-orange-600 font-semibold border-l-4 border-orange-500'
                          : 'text-gray-700 hover:text-orange-600'
                          }`}
                        style={{
                          animationDelay: `${index * 30}ms`
                        }}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span className="flex-1">{lang.name}</span>
                        {selectedLanguage === lang.name && (
                          <i className="fas fa-check-circle text-orange-500 text-xs"></i>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {!user ? (
                <>
                  <Link to="/register" className="hover:underline text-[11px] sm:text-xs">สมัครใหม่</Link>
                  <Link to="/login" className="hover:underline text-[11px] sm:text-xs">เข้าสู่ระบบ</Link>
                </>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-1.5 hover:text-white/80 text-[11px] sm:text-xs transition-all duration-200 px-2 py-1 rounded hover:bg-white/10"
                  >
                    <span>{user.name || 'ผู้ใช้'}</span>
                    <i className={`fas fa-chevron-down text-[10px] transition-transform duration-300 ${isProfileDropdownOpen ? 'rotate-180' : ''}`}></i>
                  </button>

                  {/* Profile Dropdown with beautiful Shopee-style animation */}
                  <div className={`absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 transition-all duration-300 ease-out transform origin-top-right ${isProfileDropdownOpen
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }`}>
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-r from-orange-500 via-orange-500 to-red-500 px-4 py-4 text-white">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg ${user.role === 'admin'
                          ? 'bg-white/20 backdrop-blur-sm'
                          : user.role === 'seller'
                            ? 'bg-white/20 backdrop-blur-sm'
                            : 'bg-white/20 backdrop-blur-sm'
                          }`}>
                          <i className={`fas text-lg ${user.role === 'admin' ? 'fa-crown' : user.role === 'seller' ? 'fa-store' : 'fa-user'
                            }`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm truncate">{user.name}</p>
                          <p className="text-xs text-white/80 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm border border-white/30 ${user.role === 'admin'
                        ? 'text-white'
                        : user.role === 'seller'
                          ? 'text-white'
                          : 'text-white'
                        }`}>
                        <i className={`fas ${user.role === 'admin' ? 'fa-crown' : user.role === 'seller' ? 'fa-store' : 'fa-user'
                          } text-xs`}></i>
                        {user.role === 'admin' ? 'ผู้ดูแลระบบ' : user.role === 'seller' ? 'ร้านค้า' : 'ผู้ใช้ทั่วไป'}
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      {user.role === 'seller' ? (
                        <>
                          <Link
                            to="/seller/dashboard"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 hover:translate-x-1 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-orange-100 group-hover:bg-orange-500 flex items-center justify-center transition-colors">
                              <i className="fas fa-box text-orange-600 group-hover:text-white text-xs"></i>
                            </div>
                            <span className="font-medium">จัดการสินค้า</span>
                          </Link>
                          <Link
                            to="/profile"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 hover:translate-x-1 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-blue-100 group-hover:bg-blue-500 flex items-center justify-center transition-colors">
                              <i className="fas fa-user text-blue-600 group-hover:text-white text-xs"></i>
                            </div>
                            <span className="font-medium">โปรไฟล์</span>
                          </Link>
                        </>
                      ) : isAdmin ? (
                        <>
                          <Link
                            to="/admin"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 transition-all duration-200 hover:translate-x-1 group font-semibold"
                          >
                            <div className="w-8 h-8 rounded-lg bg-amber-100 group-hover:bg-amber-500 flex items-center justify-center transition-colors">
                              <i className="fas fa-tools text-amber-600 group-hover:text-white text-xs"></i>
                            </div>
                            <span>จัดการระบบ</span>
                          </Link>
                          <Link
                            to="/profile"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 hover:translate-x-1 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-blue-100 group-hover:bg-blue-500 flex items-center justify-center transition-colors">
                              <i className="fas fa-user text-blue-600 group-hover:text-white text-xs"></i>
                            </div>
                            <span className="font-medium">โปรไฟล์</span>
                          </Link>
                        </>
                      ) : (
                        <>
                          {userNavigation.map((item, index) => (
                            <Link
                              key={item.name}
                              to={item.href}
                              onClick={() => setIsProfileDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 hover:translate-x-1 group"
                              style={{
                                animationDelay: `${index * 50}ms`
                              }}
                            >
                              <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-orange-500 flex items-center justify-center transition-colors">
                                <i className={`${item.icon} text-gray-600 group-hover:text-white text-xs`}></i>
                              </div>
                              <span className="font-medium">{item.name}</span>
                            </Link>
                          ))}
                        </>
                      )}

                      {/* Logout Button */}
                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <button
                          onClick={() => {
                            logout();
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 hover:translate-x-1 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-100 group-hover:bg-red-500 flex items-center justify-center transition-colors">
                            <i className="fas fa-sign-out-alt text-red-600 group-hover:text-white text-xs"></i>
                          </div>
                          <span className="font-medium">ออกจากระบบ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Bar - ชิดกับ Top Bar โดยไม่มีช่องว่าง */}
      <div className="bg-orange-600 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-2.5">
          <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12">

                {/* Outer Glow (Fixed) */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 opacity-80 blur-[4px]"></div>

                {/* Glass Icon Container */}
                <div className="relative w-full h-full bg-white/20 backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center shadow-lg">
                  <i className="fas fa-shopping-bag text-white text-xl sm:text-2xl drop-shadow-lg"></i>
                </div>

                {/* B Badge */}
                <span className="absolute -bottom-1 -right-1 bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-xs sm:text-sm font-extrabold px-[6px] py-[1px] rounded-full shadow-md">
                  B
                </span>
              </div>

              {/* Brand Text */}
              <span className="text-white text-xl sm:text-3xl font-black tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                BoxiFY
              </span>
            </Link>

            {/* Search */}
            <div className="flex-1 max-w-2xl mx-4 relative" ref={searchInputRef}>
              <div className="flex items-stretch">
                <div className="relative flex-1">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedIndex(-1);
                      // แสดง dropdown ทันทีเมื่อเริ่มพิมพ์
                      if (e.target.value.trim().length > 0) {
                        setShowSuggestions(true);
                      } else {
                        setShowSuggestions(false);
                      }
                    }}
                    onFocus={() => {
                      // แสดง dropdown เมื่อ focus และมีข้อความ
                      if (searchQuery.trim().length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="ค้นหาสินค้า..."
                    className="w-full px-4 py-2.5 pr-10 rounded-l-sm text-sm text-gray-900 focus:outline-none border-0"
                  />
                  {/* Clear Button (X) */}
                  {searchQuery.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSearchQuery('');
                        setShowSuggestions(false);
                        setSelectedIndex(-1);
                        searchInputRef.current?.focus();
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full"
                      type="button"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  className="px-5 bg-[#fb6445] hover:bg-[#f04d2e] text-white rounded-r-sm flex items-center justify-center"
                >
                  {isSearching ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <i className="fas fa-search"></i>
                  )}
                </button>
              </div>

              {/* Search Suggestions Dropdown - Autocomplete Style */}
              {showSuggestions && searchQuery.trim().length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 z-[9999] max-h-[500px] overflow-y-auto">
                  {/* Suggestions List - แสดงหมวดหมู่และสินค้า */}
                  <div className="py-1">
                    {isSearching ? (
                      <div className="px-4 py-12 text-center">
                        {/* Glow effect */}
                        <div className="absolute inset-0 w-16 h-16 mx-auto bg-gradient-to-r from-orange-400 to-orange-600 rounded-full opacity-10 blur-xl animate-pulse"></div>

                        <div className="relative inline-block mb-5">
                          {/* Outer ring */}
                          <div className="w-14 h-14 border-4 border-orange-100 rounded-full"></div>
                          {/* Spinning ring with gradient */}
                          <div className="absolute top-0 left-0 w-14 h-14 border-4 border-transparent border-t-orange-500 border-r-orange-400 rounded-full animate-spin"></div>
                          {/* Middle ring (counter spin) */}
                          <div className="absolute top-1.5 left-1.5 w-11 h-11 border-[3px] border-transparent border-b-orange-300 border-l-orange-200 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                          {/* Inner dot */}
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full animate-pulse shadow-md shadow-orange-500/50"></div>
                        </div>

                        <div className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500 font-semibold mb-3">
                          กำลังค้นหา...
                        </div>

                        {/* Progress bar */}
                        <div className="w-32 h-1 bg-orange-100 rounded-full mx-auto overflow-hidden mb-3">
                          <div className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 rounded-full animate-[loading_1.5s_ease-in-out_infinite]"></div>
                        </div>

                        {/* Animated dots */}
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-2 h-2 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full animate-bounce shadow-sm shadow-orange-500/30" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full animate-bounce shadow-sm shadow-orange-500/30" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full animate-bounce shadow-sm shadow-orange-500/30" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    ) : allSuggestions.length > 0 ? (
                      <>
                        {/* แสดงหมวดหมู่ก่อน */}
                        {categorySuggestions.length > 0 && (
                          <div className="border-b border-gray-200 pb-1">
                            {categorySuggestions.map((category, catIndex) => {
                              const index = catIndex;
                              const isSelected = selectedIndex === index;
                              return (
                                <div
                                  key={`category-${category.id}`}
                                  ref={(el) => (suggestionRefs.current[index] = el)}
                                  onClick={() => handleSelectCategory(category)}
                                  className={`px-4 py-3 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-0 group ${isSelected
                                    ? 'bg-gradient-to-r from-orange-50 to-orange-100/50'
                                    : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-orange-50/30'
                                    }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${isSelected
                                        ? 'bg-orange-500 text-white shadow-md'
                                        : 'bg-orange-100 text-orange-600 group-hover:bg-orange-500 group-hover:text-white'
                                        }`}>
                                        <i className="fas fa-tag text-xs"></i>
                                      </div>
                                      <span className={`text-sm font-medium transition-colors duration-200 flex-1 truncate ${isSelected
                                        ? 'text-orange-700'
                                        : 'text-gray-800 group-hover:text-orange-600'
                                        }`}>
                                        {category.name}
                                      </span>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleSelectCategory(category);
                                      }}
                                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 flex-shrink-0 ${isSelected
                                        ? 'bg-orange-500 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-700 hover:bg-orange-500 hover:text-white'
                                        }`}
                                    >
                                      หมวดหมู่
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* แสดงสินค้าหลัง */}
                        {searchSuggestions.length > 0 && (
                          <div className={categorySuggestions.length > 0 ? 'pt-1' : ''}>
                            {searchSuggestions.map((product, prodIndex) => {
                              const index = categorySuggestions.length + prodIndex;
                              const isSelected = selectedIndex === index;
                              return (
                                <div
                                  key={`product-${product.id}`}
                                  ref={(el) => (suggestionRefs.current[index] = el)}
                                  onClick={() => handleSelectSuggestion(product)}
                                  className={`px-4 py-3 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-0 group ${isSelected
                                    ? 'bg-gradient-to-r from-blue-50 to-blue-100/50'
                                    : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30'
                                    }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${isSelected
                                      ? 'bg-blue-500 text-white shadow-md'
                                      : 'bg-blue-100 text-blue-600 group-hover:bg-blue-500 group-hover:text-white'
                                      }`}>
                                      <i className="fas fa-box text-xs"></i>
                                    </div>
                                    <span className={`text-sm font-medium transition-colors duration-200 flex-1 truncate ${isSelected
                                      ? 'text-blue-700'
                                      : 'text-gray-800 group-hover:text-blue-600'
                                      }`}>
                                      {product.title}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* View All Results Button */}
                        {allSuggestions.length > 0 && (
                          <div
                            onClick={handleSearch}
                            className="sticky bottom-0 bg-orange-500 px-4 py-2.5 text-center text-white font-semibold text-sm hover:bg-orange-600 cursor-pointer transition-colors duration-200 border-t border-orange-400 mt-1"
                          >
                            <i className="fas fa-search mr-2"></i>
                            ดูผลการค้นหาทั้งหมด ({allSuggestions.length} รายการ)
                          </div>
                        )}
                      </>
                    ) : !isSearching && searchQuery.trim().length > 0 ? (
                      <div className="px-4 py-8 text-center">
                        <i className="fas fa-search text-gray-300 text-4xl mb-3"></i>
                        <div className="text-sm text-gray-600 font-medium">ไม่พบสินค้าหรือหมวดหมู่ที่ค้นหา</div>
                        <div className="text-xs text-gray-500 mt-1">ลองค้นหาด้วยคำอื่น</div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
              <div className="mt-1 hidden md:flex gap-2 lg:gap-3 text-[10px] sm:text-[11px] text-white/90 flex-wrap">
                <Link to="/discount-products" className="text-white font-bold text-xs sm:text-sm cursor-pointer whitespace-nowrap transition-all duration-300 hover:text-yellow-300 hover:scale-105 drop-shadow-lg hover:drop-shadow-xl relative group">
                  <span className="relative z-10">สินค้าลดราคาพิเศษ</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></span>
                </Link>
                <span className="text-white/50 cursor-not-allowed whitespace-nowrap opacity-60">โทรศัพท์ ราคา 1 บาท</span>
                <span className="text-white/50 cursor-not-allowed whitespace-nowrap opacity-60">ไอโฟน 13</span>
                <span className="text-white/50 cursor-not-allowed whitespace-nowrap opacity-60">รองเท้า 1 บาท</span>
                <span className="text-white/50 cursor-not-allowed whitespace-nowrap opacity-60">พัดลมราคา 1 บาท</span>
                <span className="text-white/50 cursor-not-allowed whitespace-nowrap opacity-60">ครีมทาผิว</span>
              </div>
            </div>

            {/* Cart */}
            <Link to="/cart" className="text-white hover:text-white/90 relative flex-shrink-0">
              <i className="fas fa-shopping-cart text-xl sm:text-2xl"></i>
              {getCartItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] sm:text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{getCartItemCount()}</span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;