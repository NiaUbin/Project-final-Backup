import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate(result.user?.role === 'seller' ? '/become-seller' : '/dashboard');
      } else {
        setError(result.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
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
        <div className="bg-white rounded-sm shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-4">
            <h1 className="text-xl font-medium text-center text-gray-800">เข้าสู่ระบบ</h1>
          </div>

          {/* Form */}
          <form className="px-8 pb-6 space-y-4" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="อีเมล/หมายเลขโทรศัพท์"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-gray-500 transition-colors"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="รหัสผ่าน"
                className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-gray-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border-l-2 border-red-500 px-3 py-2">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#ee4d2d] hover:bg-[#d73211] text-white font-medium rounded-sm uppercase text-sm transition-colors disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fas fa-spinner fa-spin"></i> กำลังเข้าสู่ระบบ...
                </span>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </button>

            {/* Forgot Password
            <div className="flex items-center justify-between text-xs">
              <Link to="#" className="text-[#0055aa] hover:text-[#ee4d2d]">ลืมรหัสผ่าน</Link>
              <Link to="#" className="text-[#0055aa] hover:text-[#ee4d2d]">เข้าสู่ระบบด้วย SMS</Link>
            </div> */}
          </form>

          {/* Divider */}
          <div className="px-8 pb-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs text-gray-400">หรือ</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>
          </div>

          {/* Social Login */}
          <div className="px-8 pb-6 flex gap-2">
            <button type="button" className="flex-1 py-2.5 border border-gray-300 rounded-sm flex items-center justify-center gap-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <i className="fab fa-facebook text-blue-600"></i>
              <span>Facebook</span>
            </button>
            <a href="http://localhost:3000/api/auth/google" className="flex-1 py-2.5 border border-gray-300 rounded-sm flex items-center justify-center gap-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <i className="fab fa-google text-red-500"></i>
              <span>Google</span>
            </a>
          </div>

          {/* Register Link */}
          <div className="bg-[#fafafa] px-8 py-5 text-center border-t border-gray-100">
            <span className="text-sm text-gray-500">ยังไม่มีบัญชี? </span>
            <Link to="/register" className="text-sm text-[#ee4d2d] font-medium hover:underline">สมัครใหม่</Link>
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

export default Login;