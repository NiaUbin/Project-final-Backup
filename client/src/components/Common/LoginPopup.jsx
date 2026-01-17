import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginPopup = ({ isOpen, onClose, title, message, productTitle }) => {
  // Default title and message
  const defaultTitle = productTitle 
    ? 'เข้าสู่ระบบเพื่อเพิ่มสินค้าลงตะกร้า'
    : 'เข้าสู่ระบบเพื่อดำเนินการต่อ';
  const defaultMessage = productTitle
    ? `กรุณาเข้าสู่ระบบเพื่อเพิ่มสินค้า "${productTitle}" ลงตะกร้าและช้อปปิ้งต่อ`
    : 'กรุณาเข้าสู่ระบบเพื่อชำระเงินหรือดำเนินการต่อ';
  
  const finalTitle = title || defaultTitle;
  const finalMessage = message || defaultMessage;
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        onClose();
        // Refresh page to load cart
        window.location.reload();
      } else {
        setError(result.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
    setLoading(false);
  };

  const quickLogin = async (email, password) => {
    setLoading(true);
    setError(null);
    setFormData({ email, password });
    try {
      const result = await login(email, password);
      if (result.success) {
        onClose();
        window.location.reload();
      } else {
        setError('ข้อมูลล็อกอินอัตโนมัติไม่ถูกต้อง');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Popup Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md"
        >
          <i className="fas fa-times text-lg"></i>
        </button>

        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-24 h-24 bg-white rounded-full blur-2xl"></div>
            <div className="absolute bottom-4 right-4 w-32 h-32 bg-white rounded-full blur-2xl"></div>
          </div>
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg mb-3">
              <i className="fas fa-lock text-white text-2xl"></i>
            </div>
            <h2 className="text-xl font-bold mb-2">{finalTitle}</h2>
            <p className="text-sm text-white/90">{finalMessage}</p>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="popup-email" className="block text-xs font-semibold text-gray-700 mb-1.5">
                อีเมล / หมายเลขโทรศัพท์
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-envelope text-gray-400 text-sm"></i>
                </div>
                <input
                  id="popup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="กรอกอีเมลของคุณ"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="popup-password" className="block text-xs font-semibold text-gray-700 mb-1.5">
                รหัสผ่าน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-lock text-gray-400 text-sm"></i>
                </div>
                <input
                  id="popup-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="กรอกรหัสผ่าน"
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-3 py-2 rounded">
                <div className="flex items-center">
                  <i className="fas fa-exclamation-circle mr-2 text-xs"></i>
                  <span className="text-xs">{error}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span className="text-sm">กำลังเข้าสู่ระบบ...</span>
                </div>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-500">
                หรือเข้าสู่ระบบด้วย
              </span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-2 mb-4">
            <button
              type="button"
              onClick={() => quickLogin('admin@boxify.com', 'admin123')}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-60 flex items-center justify-center"
            >
              <i className="fab fa-facebook text-blue-600 text-lg mr-2"></i>
              <span>Facebook</span>
            </button>
            <button
              type="button"
              onClick={() => quickLogin('user@boxify.com', 'user123')}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-60 flex items-center justify-center"
            >
              <i className="fab fa-google text-red-500 text-lg mr-2"></i>
              <span>Google</span>
            </button>
          </div>

          {/* Register Link */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-2">
              ยังไม่มีบัญชี?{' '}
              <Link 
                to="/register" 
                onClick={onClose}
                className="text-orange-500 font-semibold hover:text-orange-600 transition"
              >
                สมัครสมาชิก
              </Link>
            </p>
            <button 
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-700 transition"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPopup;
