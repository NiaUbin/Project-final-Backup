import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const SellerOnboarding = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingStore, setCheckingStore] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', logo: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get('/api/my/store');
        if (data.store) {
          // If already has store, redirect to dashboard
          navigate('/seller/dashboard');
        }
      } catch {
        // No store yet, stay on onboarding
      } finally {
        setCheckingStore(false);
      }
    };
    if (user) load();
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('กรุณากรอกชื่อร้าน');
      return;
    }
    
    try {
      setLoading(true);
      await axios.post('/api/store', form);
      toast.success('สร้างร้านค้าสำเร็จ! 🎉');
      
      // Upgrade role locally
      if (user && user.role !== 'seller') {
        updateUser({ ...user, role: 'seller' });
      }
      
      // Redirect to dashboard after 1 second
      setTimeout(() => {
        navigate('/seller/dashboard');
      }, 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  if (checkingStore) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10 mt-10">
        
        {/* Welcome Section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl mb-4 shadow-lg transform hover:scale-105 transition-transform">
            <i className="fas fa-store text-white text-xl sm:text-2xl"></i>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
            เริ่มต้นธุรกิจออนไลน์ของคุณ
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            สร้างร้านค้าและเริ่มขายสินค้าได้ในไม่กี่นาที
          </p>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 text-center border border-gray-100 hover:border-orange-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <i className="fas fa-store text-orange-600 text-lg sm:text-xl"></i>
            </div>
            <h3 className="font-bold text-gray-900 mb-1 text-sm">สร้างร้านฟรี</h3>
            <p className="text-xs text-gray-600">ไม่มีค่าธรรมเนียม</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 text-center border border-gray-100 hover:border-orange-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <i className="fas fa-box text-red-600 text-lg sm:text-xl"></i>
            </div>
            <h3 className="font-bold text-gray-900 mb-1 text-sm">จัดการง่าย</h3>
            <p className="text-xs text-gray-600">เพิ่ม แก้ไข ลบสินค้าได้ง่ายๆ</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 text-center border border-gray-100 hover:border-orange-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <i className="fas fa-users text-yellow-600 text-lg sm:text-xl"></i>
            </div>
            <h3 className="font-bold text-gray-900 mb-1 text-sm">เข้าถึงลูกค้า</h3>
            <p className="text-xs text-gray-600">สินค้าแสดงให้ทุกคนเห็น</p>
          </div>
        </div>

        {/* Onboarding Form */}
        <div className="bg-white rounded-xl shadow-lg p-5 sm:p-6 md:p-8 border border-gray-100">
          <div className="mb-5 sm:mb-6">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-1.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="fas fa-store text-white text-sm sm:text-base"></i>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">ข้อมูลร้านค้า</h2>
                <p className="text-xs sm:text-sm text-gray-600">กรอกข้อมูลเพื่อสร้างร้านค้าของคุณ</p>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4 sm:space-y-5">
            {/* Store Name */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                <i className="fas fa-store mr-1.5 text-orange-500 text-xs"></i>
                ชื่อร้านค้า <span className="text-red-500">*</span>
              </label>
              <input 
                className="w-full border-2 border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm" 
                placeholder="กรอกชื่อร้านค้าของคุณ" 
                value={form.name} 
                onChange={(e)=>setForm({...form, name:e.target.value})} 
                required
              />
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1 flex items-center gap-1">
                <i className="fas fa-info-circle text-gray-400 text-[10px]"></i>
                ชื่อที่ลูกค้าจะเห็นและค้นหาได้
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                <i className="fas fa-align-left mr-1.5 text-orange-500 text-xs"></i>
                คำอธิบายร้าน
              </label>
              <textarea 
                className="w-full border-2 border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm resize-none" 
                rows={3} 
                placeholder="บอกลูกค้าเกี่ยวกับร้านของคุณ สินค้าที่ขาย และจุดเด่นของร้าน..."
                value={form.description} 
                onChange={(e)=>setForm({...form, description:e.target.value})}
              ></textarea>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1 flex items-center gap-1">
                <i className="fas fa-lightbulb text-yellow-500 text-[10px]"></i>
                แนะนำให้กรอกเพื่อดึงดูดลูกค้า
              </p>
            </div>

            {/* Logo URL */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                <i className="fas fa-image mr-1.5 text-orange-500 text-xs"></i>
                โลโก้ร้าน (URL รูปภาพ)
              </label>
              <input 
                className="w-full border-2 border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm" 
                placeholder="https://example.com/logo.png" 
                value={form.logo} 
                onChange={(e)=>setForm({...form, logo:e.target.value})} 
              />
              <div className="mt-2 p-2.5 sm:p-3 bg-orange-50 rounded-lg border border-orange-100">
                <p className="text-[10px] sm:text-xs text-orange-900 font-medium mb-0.5 flex items-center gap-1">
                  <i className="fas fa-info-circle text-orange-500 text-[10px]"></i>
                  รองรับ URL จากแหล่งใดก็ได้
                </p>
                <p className="text-[10px] sm:text-xs text-orange-700">
                  Google Images, Imgur, Cloudinary, หรือ CDN อื่นๆ
                </p>
              </div>
            </div>

            {/* Preview */}
            {(form.name || form.logo) && (
              <div className="p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border-2 border-orange-200 animate-fadeIn">
                <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-1.5">
                  <i className="fas fa-eye text-orange-500 text-xs"></i>
                  ตัวอย่างร้านค้า
                </p>
                <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 border-2 border-gray-200">
                    {form.logo ? (
                      <img 
                        src={form.logo} 
                        alt="preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${form.logo ? 'hidden' : 'flex'}`}>
                      <i className="fas fa-store text-gray-400 text-lg"></i>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{form.name || 'ชื่อร้านของคุณ'}</p>
                    <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{form.description || 'คำอธิบายร้าน...'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-3 sm:pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all font-bold text-sm sm:text-base shadow-lg transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>กำลังสร้างร้านค้า...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-store text-sm sm:text-base"></i>
                    <span>สร้างร้านค้าของฉัน</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-4 sm:mt-5 text-center">
            <p className="text-[10px] sm:text-xs text-gray-500 flex items-center justify-center gap-1">
              <i className="fas fa-check-circle text-green-500 text-[10px]"></i>
              หลังสร้างร้าน คุณจะสามารถเพิ่มสินค้าและจัดการร้านได้ทันที
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-6 sm:mt-8 bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 text-center flex items-center justify-center gap-2">
            <i className="fas fa-star text-orange-500 text-sm"></i>
            <span>สิ่งที่คุณจะได้รับ</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-orange-50 transition-colors group">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                <i className="fas fa-check text-white text-xs"></i>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">Dashboard สำหรับผู้ขาย</p>
                <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5">จัดการร้านและสินค้าในที่เดียว</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-orange-50 transition-colors group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                <i className="fas fa-check text-white text-xs"></i>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">เพิ่มสินค้าไม่จำกัด</p>
                <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5">อัปโหลดรูปภาพและรายละเอียดสินค้า</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-orange-50 transition-colors group">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                <i className="fas fa-check text-white text-xs"></i>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">หน้าร้านสวยงาม</p>
                <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5">ลูกค้าสามารถเข้าชมร้านและสินค้า</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-orange-50 transition-colors group">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                <i className="fas fa-check text-white text-xs"></i>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">สถิติและรายงาน</p>
                <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5">ติดตามยอดขายและสินค้า</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerOnboarding;
