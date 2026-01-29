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
  
  // Steps: 1 = Basic Info, 2 = Identity Verification
  const [currentStep, setCurrentStep] = useState(1);
  const [storeStatus, setStoreStatus] = useState(null);
  
  const [form, setForm] = useState({ 
    name: '', 
    description: '', 
    logo: '',
    idCard: '',
    address: ''
  });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get('/api/my/store');
        if (data.store) {
          if (data.store.status === 'approved') {
            navigate('/seller/dashboard');
          } else {
            setStoreStatus(data.store.status);
          }
        }
      } catch {
        // No store yet
      } finally {
        setCheckingStore(false);
      }
    };
    if (user) load();
  }, [user, navigate]);

  const handleNextStep = (e) => {
    e.preventDefault();
    if (currentStep === 1) {
      if (!form.name.trim()) {
        toast.error('กรุณากรอกชื่อร้าน');
        return;
      }
      setCurrentStep(2);
      window.scrollTo(0, 0);
    }
  };

  const handleBackStep = (e) => {
    e.preventDefault();
    setCurrentStep(1);
    window.scrollTo(0, 0);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.idCard.trim()) {
      toast.error('กรุณากรอกเลขบัตรประชาชน');
      return;
    }
    if (!form.address.trim()) {
      toast.error('กรุณากรอกที่อยู่ตามบัตรประชาชน');
      return;
    }
    
    try {
      setLoading(true);
      const { data } = await axios.post('/api/store', form);
      toast.success(data.message);
      setStoreStatus('pending');
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  if (checkingStore) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ee4d2d]"></div>
      </div>
    );
  }

  if (storeStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            <i className="fas fa-clock"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">รอการอนุมัติ</h2>
          <p className="text-gray-600 mb-6">
            ข้อมูลร้านค้าของคุณถูกส่งเรียบร้อยแล้ว กรุณารอการตรวจสอบและอนุมัติจากผู้ดูแลระบบ
            <br className="hidden sm:block" />
            ซึ่งอาจใช้เวลา 1-2 วันทำการ
          </p>
          <button 
            onClick={() => navigate('/')}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            กลับสู่หน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  if (storeStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            <i className="fas fa-times-circle"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">คำขอถูกปฏิเสธ</h2>
          <p className="text-gray-600 mb-6">
            ขออภัย คำขอเปิดร้านค้าของคุณไม่ผ่านการอนุมัติ
            กรุณาติดต่อผู้ดูแลระบบเพื่อขอข้อมูลเพิ่มเติม
          </p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => navigate('/')}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              หน้าหลัก
            </button>
            <a 
              href="mailto:support@example.com"
              className="bg-[#ee4d2d] text-white px-6 py-2 rounded-lg hover:bg-[#d73211] transition-colors font-medium"
            >
              ติดต่อเรา
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] pt-32 pb-10 px-4 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#ee4d2d] mb-2 flex justify-center items-center gap-2">
            <i className="fas fa-shopping-bag"></i> Seller Center
          </h1>
          <p className="text-gray-600">ลงทะเบียนร้านค้า แล้วเริ่มขายสินค้าได้ทันที</p>
        </div>

        {/* Stepper */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-0"></div>
            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${currentStep >= 1 ? 'bg-[#ee4d2d] text-white' : 'bg-gray-200 text-gray-500'}`}>
              1
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-gray-600">ข้อมูลร้านค้า</div>
            </div>
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#ee4d2d] transition-all duration-500 -z-0`} style={{ width: currentStep === 2 ? '100%' : '50%' }}></div>
            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${currentStep >= 2 ? 'bg-[#ee4d2d] text-white' : 'bg-gray-200 text-gray-500'}`}>
              2
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-gray-600">ยืนยันตัวตน</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[500px]">
          {/* Left Side - Info & Benefits (Static) */}
          <div className="md:w-5/12 bg-gradient-to-br from-[#ee4d2d] to-[#ff7337] p-8 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-6">
                {currentStep === 1 ? 'สร้างร้านค้าของคุณ' : 'ยืนยันตัวตนผู้ขาย'}
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                    <i className={`fas ${currentStep === 1 ? 'fa-store' : 'fa-id-card'} text-xl`}></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {currentStep === 1 ? 'ข้อมูลเบื้องต้น' : 'ความปลอดภัย'}
                    </h3>
                    <p className="text-orange-100 text-sm">
                      {currentStep === 1 ? 'ตั้งชื่อร้านและใส่โลโก้ให้โดดเด่น' : 'เราเก็บข้อมูลของคุณเป็นความลับและปลอดภัย'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                    <i className="fas fa-check-circle text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">อนุมัติไว</h3>
                    <p className="text-orange-100 text-sm">ระบบตรวจสอบอัตโนมัติ เริ่มขายได้ทันที</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full blur-2xl -ml-10 -mb-10"></div>
          </div>

          {/* Right Side - Form */}
          <div className="md:w-7/12 p-8 md:p-10">
            {currentStep === 1 ? (
              // Step 1: Store Information
              <form onSubmit={handleNextStep} className="space-y-6 animate-fadeIn">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">ข้อมูลร้านค้า</h2>
                  <p className="text-gray-500 text-sm mt-1">กรอกข้อมูลทั่วไปสำหรับร้านค้าของคุณ</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อร้านค้า <span className="text-[#ee4d2d]">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      className="w-full border border-gray-300 rounded-md px-4 py-2.5 pl-10 focus:outline-none focus:ring-1 focus:ring-[#ee4d2d] focus:border-[#ee4d2d] transition-colors" 
                      placeholder="ระบุชื่อร้านค้าของคุณ" 
                      value={form.name} 
                      onChange={(e)=>setForm({...form, name:e.target.value})} 
                      required
                      autoFocus
                    />
                    <i className="fas fa-store absolute left-3.5 top-3.5 text-gray-400"></i>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    โลโก้ร้าน (URL Image)
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      className="w-full border border-gray-300 rounded-md px-4 py-2.5 pl-10 focus:outline-none focus:ring-1 focus:ring-[#ee4d2d] focus:border-[#ee4d2d] transition-colors" 
                      placeholder="https://example.com/logo.jpg" 
                      value={form.logo} 
                      onChange={(e)=>setForm({...form, logo:e.target.value})} 
                    />
                    <i className="fas fa-image absolute left-3.5 top-3.5 text-gray-400"></i>
                  </div>
                  {form.logo && (
                    <div className="mt-3 flex items-center gap-3 bg-gray-50 p-3 rounded-md border border-gray-100">
                      <img 
                        src={form.logo} 
                        alt="Logo Preview" 
                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/150?text=No+Img";
                        }}
                      />
                      <span className="text-xs text-gray-500">ตัวอย่างการแสดงผล</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    รายละเอียดร้านค้า
                  </label>
                  <textarea 
                    className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#ee4d2d] focus:border-[#ee4d2d] transition-colors resize-none" 
                    rows={3} 
                    placeholder="รายละเอียดเกี่ยวกับร้านค้าและสินค้าของคุณ..."
                    value={form.description} 
                    onChange={(e)=>setForm({...form, description:e.target.value})}
                  ></textarea>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="bg-[#ee4d2d] text-white font-medium px-8 py-2.5 rounded-md hover:bg-[#d73211] transition-colors shadow-sm text-sm"
                  >
                    ถัดไป <i className="fas fa-arrow-right ml-2"></i>
                  </button>
                </div>
              </form>
            ) : (
              // Step 2: Identity Verification
              <form onSubmit={submit} className="space-y-6 animate-fadeIn">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">ยืนยันตัวตน</h2>
                  <p className="text-gray-500 text-sm mt-1">ข้อมูลบัตรประชาชนและที่อยู่สำหรับการตรวจสอบ</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เลขบัตรประจำตัวประชาชน <span className="text-[#ee4d2d]">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      maxLength={13}
                      className="w-full border border-gray-300 rounded-md px-4 py-2.5 pl-10 focus:outline-none focus:ring-1 focus:ring-[#ee4d2d] focus:border-[#ee4d2d] transition-colors" 
                      placeholder="เลขบัตรประชาชน 13 หลัก" 
                      value={form.idCard} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, ''); // Only numbers
                        setForm({...form, idCard: val});
                      }}
                      required
                      autoFocus
                    />
                    <i className="fas fa-id-card absolute left-3.5 top-3.5 text-gray-400"></i>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">กรอกเฉพาะตัวเลข 13 หลัก</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ที่อยู่ตามบัตรประชาชน <span className="text-[#ee4d2d]">*</span>
                  </label>
                  <textarea 
                    className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#ee4d2d] focus:border-[#ee4d2d] transition-colors resize-none" 
                    rows={4} 
                    placeholder="บ้านเลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด, รหัสไปรษณีย์"
                    value={form.address} 
                    onChange={(e)=>setForm({...form, address:e.target.value})}
                    required
                  ></textarea>
                </div>

                <div className="pt-4 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={handleBackStep}
                    className="text-gray-600 hover:text-gray-800 font-medium px-4 py-2.5 rounded-md hover:bg-gray-100 transition-colors text-sm"
                  >
                    <i className="fas fa-arrow-left mr-2"></i> ย้อนกลับ
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#ee4d2d] text-white font-medium px-8 py-2.5 rounded-md hover:bg-[#d73211] transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>กำลังบันทึก...</span>
                      </>
                    ) : (
                      <>
                        <span>ยืนยันข้อมูล</span>
                        <i className="fas fa-check"></i>
                      </>
                    )}
                  </button>
                </div>
                
                <p className="text-xs text-gray-400 text-center mt-4">
                  ข้อมูลของคุณจะถูกเก็บเป็นความลับและใช้เพื่อการตรวจสอบเท่านั้น
                </p>
              </form>
            )}
          </div>
        </div>
        
        <div className="text-center mt-8 text-xs text-gray-400">
          &copy; 2024 BoxiFY Seller Centre. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default SellerOnboarding;
