import React, { useState } from 'react';

// ===== Categories Data =====
const helpCategories = [
  { icon: 'fas fa-truck', title: 'การสั่งซื้อและการจัดส่ง', desc: 'ติดตามสถานะ, ค่าจัดส่ง' },
  { icon: 'fas fa-wallet', title: 'การชำระเงินและโปรโมชั่น', desc: 'วิธีชำระเงิน, โค้ดส่วนลด' },
  { icon: 'fas fa-undo-alt', title: 'การคืนสินค้าและคืนเงิน', desc: 'นโยบายคืนสินค้า, ตรวจสอบสถานะ' },
  { icon: 'fas fa-user-circle', title: 'การใช้งานบัญชี', desc: 'ตั้งค่าบัญชี, ความปลอดภัย' },
  { icon: 'fas fa-store', title: 'สำหรับร้านค้า', desc: 'ลงขายสินค้า, จัดการร้านค้า' },
  { icon: 'fas fa-shield-alt', title: 'นโยบายและความปลอดภัย', desc: 'ข้อกำหนด, ความเป็นส่วนตัว' },
];

// ===== FAQ Data =====
const helpArticles = [
  {
    question: 'จะติดตามสถานะคำสั่งซื้อได้อย่างไร?',
    answer: 'คุณสามารถตรวจสอบสถานะคำสั่งซื้อได้ที่เมนู "การซื้อของฉัน" โดยระบบจะแสดงสถานะปัจจุบันและเลขพัสดุเมื่อร้านค้าทำการจัดส่งแล้ว',
  },
  {
    question: 'ฉันจะยกเลิกคำสั่งซื้อได้อย่างไร?',
    answer: 'สามารถยกเลิกคำสั่งซื้อได้ทันทีก่อนที่ผู้ขายจะทำการจัดส่งสินค้า โดยเข้าไปที่หน้ารายละเอียดคำสั่งซื้อและกดปุ่ม "ยกเลิกคำสั่งซื้อ"',
  },
  {
    question: 'การขอคืนเงินใช้เวลากี่วัน?',
    answer: 'ระยะเวลาการคืนเงินขึ้นอยู่กับช่องทางการชำระเงิน โดยปกติจะใช้เวลาประมาณ 3–7 วันทำการสำหรับบัตรเครดิต/เดบิต และ ShopeePay',
  },
  {
    question: 'หากได้รับสินค้าไม่ครบหรือเสียหายต้องทำอย่างไร?',
    answer: 'โปรดถ่ายภาพหรือวิดีโอขณะแกะกล่องสินค้าไว้เป็นหลักฐาน และกด "ขอคืนเงิน/คืนสินค้า" ในหน้ารายละเอียดคำสั่งซื้อ พร้อมแนบหลักฐานเพื่อดำเนินการตรวจสอบ',
  },
  {
    question: 'วิธีใช้งานโค้ดส่วนลด',
    answer: 'คุณสามารถเลือกใช้โค้ดส่วนลดได้ในหน้าชำระเงิน โดยระบบจะคำนวณส่วนลดที่ดีที่สุดให้โดยอัตโนมัติ หรือเลือกกรอกโค้ดด้วยตนเอง',
  },
];

const HelpPage = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans mt-14 pb-20">
      {/* ===== Hero / Header Section ===== */}
      <div className="relative bg-gradient-to-r from-[#ee4d2d] via-[#ff5b37] to-[#ff7337] pt-12 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full blur-2xl translate-y-12 -translate-x-12"></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight drop-shadow-md">
            ศูนย์ช่วยเหลือ
          </h1>
          <p className="text-white/90 text-lg mb-8 font-medium">
            มีอะไรให้เราช่วยไหม? ค้นหาคำตอบได้ที่นี่
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <i className="fas fa-search text-gray-400 text-lg group-focus-within:text-[#ee4d2d] transition-colors"></i>
            </div>
            <input
              type="text"
              placeholder="ค้นหาคำถาม, วิธีการใช้งาน, หรือปัญหาที่พบ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-transparent shadow-lg focus:shadow-xl outline-none text-gray-700 bg-white placeholder-gray-400 text-base transition-all duration-300 focus:border-white/50 focus:ring-4 focus:ring-orange-500/20"
            />
          </div>
        </div>
      </div>

      {/* ===== Content Section ===== */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        
        {/* Popular Categories Grid */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="bg-orange-100 text-orange-500 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                <i className="fas fa-star"></i>
            </span>
            หมวดหมู่ยอดนิยม
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpCategories.map((cat, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 group hover:-translate-y-1 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-150 group-hover:bg-orange-100/50"></div>
                
                <div className="relative z-10 w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center mb-4 group-hover:bg-orange-500 transition-colors duration-300 shadow-sm group-hover:shadow-orange-500/30">
                  <i className={`${cat.icon} text-2xl text-[#ee4d2d] group-hover:text-white transition-colors duration-300`}></i>
                </div>
                <h3 className="relative z-10 text-lg font-bold text-gray-800 mb-2 group-hover:text-[#ee4d2d] transition-colors">{cat.title}</h3>
                <p className="relative z-10 text-sm text-gray-500 group-hover:text-gray-600">{cat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 px-2">คำถามที่พบบ่อย</h2>
          <div className="space-y-4">
            {helpArticles.map((item, index) => (
              <div 
                key={index} 
                className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                    activeIndex === index 
                    ? 'border-orange-200 shadow-lg shadow-orange-500/5 ring-1 ring-orange-100' 
                    : 'border-gray-100 shadow-sm hover:shadow-md hover:border-orange-100'
                }`}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center bg-white outline-none group"
                >
                  <span className={`text-base font-semibold transition-colors duration-200 ${activeIndex === index ? 'text-[#ee4d2d]' : 'text-gray-700 group-hover:text-orange-600'}`}>
                    {item.question}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      activeIndex === index 
                      ? 'bg-orange-100 text-orange-600 rotate-180' 
                      : 'bg-gray-100 text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-500'
                  }`}>
                    <i className="fas fa-chevron-down text-xs"></i>
                  </div>
                </button>
                <div
                  className={`border-t border-dashed border-orange-100 transition-all duration-300 ease-in-out ${
                    activeIndex === index ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0 border-none'
                  }`}
                >
                  <div className="px-6 py-5 text-gray-600 leading-relaxed text-sm bg-orange-50/10">
                    {item.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 md:p-14 text-center text-white relative overflow-hidden shadow-2xl mx-auto max-w-5xl">
           {/* Decorative circles */}
           <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
           <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl translate-y-1/2 translate-x-1/2"></div>
           <div className="absolute top-1/2 left-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md mb-6 border border-white/20 shadow-inner">
                <i className="fas fa-headset text-3xl text-orange-400"></i>
            </div>
            
            <h2 className="text-2xl md:text-4xl font-bold mb-4">ยังไม่พบคำตอบที่ต้องการ?</h2>
            <p className="text-indigo-200 mb-8 max-w-2xl text-lg">
              ทีมงานฝ่ายบริการลูกค้าของเราพร้อมให้ความช่วยเหลือคุณตลอด 24 ชั่วโมง
              <br/>ไม่ว่าจะเรื่องเล็กหรือใหญ่ เราใส่ใจเสมอ
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 justify-center w-full max-w-lg">
              <button className="flex-1 px-6 py-3.5 bg-gradient-to-r from-[#ee4d2d] to-[#ff5b37] hover:brightness-110 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3 group">
                <i className="fas fa-comment-dots text-lg group-hover:animate-bounce"></i> 
                <span>แชทกับเรา</span>
              </button>
              <button className="flex-1 px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold backdrop-blur-sm transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3 group">
                <i className="fas fa-envelope text-lg group-hover:rotate-12 transition-transform"></i>
                <span>ส่งอีเมลหาเรา</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HelpPage;
