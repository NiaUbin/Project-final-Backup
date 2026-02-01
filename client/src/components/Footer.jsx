import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Footer = () => {
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  // Hide Footer on Admin/Dashboard pages
  if (location.pathname.startsWith('/admin') || location.pathname === '/dashboard') {
    return null;
  }

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-white pt-16 pb-8 px-6 md:px-12 lg:px-20 border-t-2 border-gray-200">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-6">
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14">
                  {/* Outer Glow */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 opacity-80 blur-[4px]"></div>
                  {/* Glass Icon Container */}
                  <div className="relative w-full h-full bg-white/20 backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-shopping-bag text-white text-2xl drop-shadow-lg"></i>
                  </div>
                  {/* B Badge */}
                  <span className="absolute -bottom-1 -right-1 bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-sm font-extrabold px-[6px] py-[1px] rounded-full shadow-md">
                    B
                  </span>
                </div>
                <span className="text-white text-3xl font-black tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  BoxiFY
                </span>
              </div>
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              แพลตฟอร์มช้อปปิ้งออนไลน์ที่เชื่อถือได้ พร้อมสินค้าคุณภาพและบริการที่ดีที่สุด
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <i className="fas fa-shield-alt text-orange-500"></i>
              <span>ปลอดภัย 100%</span>
            </div>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-1">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fas fa-envelope text-orange-500"></i>
              ติดตามข่าวสารจากเรา
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">กรอกอีเมลของคุณ</label>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 bg-white transition-all" 
                    placeholder="email@example.com" 
                  />
                  <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 text-sm font-bold hover:from-orange-600 hover:to-red-600 transition-all duration-300 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105">
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </div>
              </div>
              <div className="flex items-start space-x-2 text-sm">
                <input type="checkbox" id="newsletter" className="mt-1 h-4 w-4 accent-orange-500 cursor-pointer" />
                <label htmlFor="newsletter" className="text-gray-600 leading-tight cursor-pointer hover:text-gray-900 transition-colors">
                  สมัครรับข่าวสารและโปรโมชั่นพิเศษ
                </label>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="lg:col-span-1">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fas fa-headset text-orange-500"></i>
              ติดต่อเรา
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600 hover:text-orange-600 transition-colors">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-phone text-orange-500"></i>
                </div>
                <span className="font-medium">0926243340</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 hover:text-orange-600 transition-colors">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-envelope text-orange-500"></i>
                </div>
                <span className="font-medium">aofsang44@gmail.com</span>
              </div>
              {/* Social Icons */}
              <div className="flex gap-3 pt-4">
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center text-white hover:shadow-lg hover:scale-110 transition-all duration-300"
                  aria-label="Instagram"
                >
                  <i className="fab fa-instagram text-lg"></i>
                </a>
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white hover:shadow-lg hover:scale-110 transition-all duration-300"
                  aria-label="Facebook"
                >
                  <i className="fab fa-facebook-f text-lg"></i>
                </a>
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center text-white hover:shadow-lg hover:scale-110 transition-all duration-300"
                  aria-label="Twitter"
                >
                  <i className="fab fa-twitter text-lg"></i>
                </a>
                <a 
                  href="https://youtube.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center text-white hover:shadow-lg hover:scale-110 transition-all duration-300"
                  aria-label="YouTube"
                >
                  <i className="fab fa-youtube text-lg"></i>
                </a>
                <a 
                  href="https://line.me" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white hover:shadow-lg hover:scale-110 transition-all duration-300"
                  aria-label="Line"
                >
                  <i className="fab fa-line text-lg"></i>
                </a>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="lg:col-span-1">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fas fa-link text-orange-500"></i>
              ลิงก์ด่วน
            </h3>
            <div className="space-y-3">
              <Link to="/help" className="block text-sm text-gray-600 hover:text-orange-600 transition-colors duration-200 flex items-center gap-2 group">
                <i className="fas fa-chevron-right text-xs text-transparent group-hover:text-orange-500 group-hover:translate-x-1 transition-all"></i>
                <span>นโยบายความเป็นส่วนตัว</span>
              </Link>
              <Link to="/help" className="block text-sm text-gray-600 hover:text-orange-600 transition-colors duration-200 flex items-center gap-2 group">
                <i className="fas fa-chevron-right text-xs text-transparent group-hover:text-orange-500 group-hover:translate-x-1 transition-all"></i>
                <span>เงื่อนไขการใช้งาน</span>
              </Link>
              <Link to="/help" className="block text-sm text-gray-600 hover:text-orange-600 transition-colors duration-200 flex items-center gap-2 group">
                <i className="fas fa-chevron-right text-xs text-transparent group-hover:text-orange-500 group-hover:translate-x-1 transition-all"></i>
                <span>นโยบายการจัดส่ง</span>
              </Link>
              <Link to="/help" className="block text-sm text-gray-600 hover:text-orange-600 transition-colors duration-200 flex items-center gap-2 group">
                <i className="fas fa-chevron-right text-xs text-transparent group-hover:text-orange-500 group-hover:translate-x-1 transition-all"></i>
                <span>นโยบายการคืนสินค้า</span>
              </Link>
              <Link to="/help" className="block text-sm text-gray-600 hover:text-orange-600 transition-colors duration-200 flex items-center gap-2 group">
                <i className="fas fa-chevron-right text-xs text-transparent group-hover:text-orange-500 group-hover:translate-x-1 transition-all"></i>
                <span>คำถามที่พบบ่อย</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t-2 border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © {currentYear} <span className="font-bold text-orange-600">BoxiFY</span>. สร้างและดูแลโดย BoxiFY Online Store
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <i className="fas fa-shield-check text-green-500"></i>
                ปลอดภัย 100%
              </span>
              <span className="flex items-center gap-1">
                <i className="fas fa-truck text-blue-500"></i>
                จัดส่งฟรี
              </span>
              <span className="flex items-center gap-1">
                <i className="fas fa-undo text-purple-500"></i>
                คืนสินค้าง่าย
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
