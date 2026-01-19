import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'user', address: '', phone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('seller') === '1') {
      setFormData(prev => ({ ...prev, role: 'seller' }));
    }
  }, [location.search]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      return;
    }
    if (formData.role === 'user') {
      if (!formData.address?.trim()) { setError('กรุณากรอกที่อยู่ในการจัดส่ง'); return; }
      if (!formData.phone?.trim()) { setError('กรุณากรอกเบอร์โทรศัพท์'); return; }
    }

    setLoading(true);
    try {
      const result = await register(formData.email, formData.password, formData.name, formData.role, formData.address, formData.phone);
      if (result.success) {
        navigate(formData.role === 'seller' ? '/become-seller' : '/login');
      } else {
        setError(result.message || 'การสมัครสมาชิกล้มเหลว');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#ee4d2d] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-[400px]">
        {/* Form Card */}
        <div className="bg-white rounded-sm shadow-lg overflow-hidden mt-12">
          {/* Header */}
          <div className="px-8 pt-8 pb-4">
            <h1 className="text-xl font-medium text-center text-gray-800">สมัครใหม่</h1>
          </div>

          {/* Form */}
          <form className="px-8 pb-6 space-y-3" onSubmit={handleSubmit}>
            {/* Name */}
            <input
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="ชื่อ-นามสกุล"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-gray-500"
            />

            {/* Email */}
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="อีเมล"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-gray-500"
            />

            {/* Password */}
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-gray-500"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <input
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="ยืนยันรหัสผ่าน"
                className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-gray-500"
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
              </button>
            </div>

            {/* Phone */}
            {formData.role === 'user' && (
              <input
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="เบอร์โทรศัพท์"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-gray-500"
              />
            )}

            {/* Address */}
            {formData.role === 'user' && (
              <textarea
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                placeholder="ที่อยู่ในการจัดส่ง"
                rows={2}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-gray-500 resize-none"
              />
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border-l-2 border-red-500 px-3 py-2">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* Terms */}
            <p className="text-xs text-gray-500 leading-relaxed">
              เมื่อกดสมัคร คุณยอมรับ <span className="text-[#ee4d2d] cursor-pointer hover:underline">เงื่อนไขการใช้งาน</span> และ <span className="text-[#ee4d2d] cursor-pointer hover:underline">นโยบายความเป็นส่วนตัว</span>
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#ee4d2d] hover:bg-[#d73211] text-white font-medium rounded-sm uppercase text-sm transition-colors disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fas fa-spinner fa-spin"></i> กำลังสมัคร...
                </span>
              ) : (
                'สมัคร'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="px-8 pb-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs text-gray-400">หรือ</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>
          </div>

          {/* Social Register */}
          <div className="px-8 pb-6 flex gap-2">
            <button type="button" className="flex-1 py-2.5 border border-gray-300 rounded-sm flex items-center justify-center gap-2 text-sm text-gray-700 hover:bg-gray-50">
              <i className="fab fa-facebook text-blue-600"></i>
              <span>Facebook</span>
            </button>
            <a href="http://localhost:3000/api/auth/google" className="flex-1 py-2.5 border border-gray-300 rounded-sm flex items-center justify-center gap-2 text-sm text-gray-700 hover:bg-gray-50">
              <i className="fab fa-google text-red-500"></i>
              <span>Google</span>
            </a>
          </div>

          {/* Login Link */}
          <div className="bg-[#fafafa] px-8 py-5 text-center border-t border-gray-100">
            <span className="text-sm text-gray-500">มีบัญชีแล้ว? </span>
            <Link to="/login" className="text-sm text-[#ee4d2d] font-medium hover:underline">เข้าสู่ระบบ</Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white/80 text-xs">
          <p>© 2024 BoxiFY. สงวนลิขสิทธิ์</p>
        </div>
      </div>
    </div>
  );
};

export default Register;