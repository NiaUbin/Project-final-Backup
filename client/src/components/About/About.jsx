import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    // 1. Container หลัก (pt-24 เพื่อเว้นระยะจาก Navbar)
    <div className="bg-black text-white pt-24 pb-20">
      {/* ===========================================
        ===           จุดที่แก้ไข (Adjusted)         ===
        ===========================================
      */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">

        {/* --- Section 1: Hero --- */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text Content */}
          <div className="animate-fade-in-up">
            <span className="text-blue-400 font-semibold tracking-wide uppercase">
              About B.BoxiFY
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold mt-4 mb-6 leading-tight"> {/* <-- ปรับขนาด Font ลงเล็กน้อย */}
              เราไม่ใช่แค่ร้านค้า<br />
              แต่เราคือ <span className="text-blue-400">ผู้คัดสรร</span>
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed">
              ที่ B.BoxiFY เราเชื่อว่าการช้อปปิ้งออนไลน์ควรเป็นเรื่องง่าย,
              สนุก, และที่สำคัญที่สุดคือ "น่าเชื่อถือ"
              เราเริ่มต้นจากความหลงใหลในเทคโนโลยีและดีไซน์
              สู่การเป็นแพลตฟอร์มที่รวบรวมสินค้าคุณภาพสูงที่เราคัดเลือกมาด้วยตัวเอง
            </p>
            <Link
              to="/products"
              className="inline-block mt-8 px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
            >
              เลือกซื้อสินค้าเลย
            </Link>
          </div>
          {/* Image */}
          <div className="animate-fade-in">
            <img
              src="https://www.engdict.com/data/dict/media/images_public/00000271638820596662420393_normal.png"
              alt="Our workspace"
              className="rounded-xl shadow-2xl object-cover aspect-[4/5]"
            />
          </div>
        </section>

        {/* --- Section 2: Why Choose Us (Core Values) --- */}
        <section>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ทำไมต้องเป็น B.BoxiFY?
            </h2>
            <p className="text-lg text-gray-400">
              เราทุ่มเทเพื่อมอบประสบการณ์ที่ดีที่สุดในทุกด้าน
              นี่คือคำมั่นสัญญาของเรา
            </p>
          </div>
          
          {/* 3-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            
            {/* Value 1: Curation */}
            <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl text-center transform hover:border-blue-500/50 hover:scale-105 transition-all duration-300">
              <i className="fas fa-check-circle text-blue-400 text-4xl mb-6"></i>
              <h3 className="text-xl font-semibold mb-3">
                การคัดสรรที่เป็นเลิศ
              </h3>
              <p className="text-gray-400">
                สินค้าทุกชิ้นในร้าน
                ผ่านการตรวจสอบและคัดเลือกโดยทีมงานของเรา
                เพื่อให้คุณมั่นใจว่าจะได้รับแต่ของที่มีคุณภาพ
              </p>
            </div>
            
            {/* Value 2: Security */}
            <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl text-center transform hover:border-blue-500/50 hover:scale-105 transition-all duration-300">
              <i className="fas fa-shield-alt text-blue-400 text-4xl mb-6"></i>
              <h3 className="text-xl font-semibold mb-3">
                ปลอดภัยและไร้รอยต่อ
              </h3>
              <p className="text-gray-400">
                ตั้งแต่การเลือกสินค้าจนถึงการชำระเงิน
                เราใช้เทคโนโลยีความปลอดภัยล่าสุด
                เพื่อให้ข้อมูลของคุณปลอดภัยเสมอ
              </p>
            </div>

            {/* Value 3: Support */}
            <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl text-center transform hover:border-blue-500/50 hover:scale-105 transition-all duration-300">
              <i className="fas fa-headset text-blue-400 text-4xl mb-6"></i>
              <h3 className="text-xl font-semibold mb-3">
                บริการด้วยใจ
              </h3>
              <p className="text-gray-400">
                ติดปัญหา? มีคำถาม?
                ทีมซัพพอร์ตของเราพร้อมช่วยเหลือคุณ
                เหมือนเพื่อนที่คอยให้คำแนะนำ
              </p>
            </div>
          </div>
        </section>

        {/* --- Section 3: Our Story (Mission) --- */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div>
            <img
              src="https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%D%D"
              alt="Our team"
              className="rounded-xl shadow-2xl object-cover aspect-[4/3]"
            />
          </div>
          {/* Text Content */}
          <div>
            <span className="text-blue-400 font-semibold tracking-wide uppercase">
              ภารกิจของเรา
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-6">
              เชื่อมต่อคุณกับสิ่งที่ใช่
            </h2>
            <p className="text-lg text-gray-300 mb-6 leading-relaxed">
              ในโลกที่เต็มไปด้วยตัวเลือกมากมาย
              การหาสินค้าที่ "ใช่" จริงๆ อาจเป็นเรื่องยาก
              ภารกิจของเราคือการทำหน้าที่เป็น "ตัวกรอง"
              ที่ช่วยให้คุณเข้าถึงสินค้าสุดเจ๋ง, นวัตกรรมล้ำสมัย,
              และดีไซน์ที่โดดเด่น โดยไม่ต้องเสียเวลาค้นหาเอง
            </p>
            <div className="border-l-4 border-blue-500 pl-6">
              <p className="text-xl italic text-gray-200">
                "เราไม่ได้ขายของทุกอย่าง
                เราขายเฉพาะของที่เราภูมิใจจะแนะนำ"
              </p>
            </div>
          </div>
        </section>
        
        {/* --- Section 4: Call to Action (CTA) --- */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-12 md:p-16 text-center"> {/* <-- ลด Padding ลงเล็กน้อย */}
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            พร้อมสัมผัสประสบการณ์ใหม่หรือยัง?
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            เข้าร่วมชุมชน B.BoxiFY
            และค้นพบสินค้าที่จะยกระดับไลฟ์สไตล์ของคุณ
          </p>
          <Link
            to="/products"
            className="inline-block px-10 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
          >
            เริ่มช้อปปิ้ง
          </Link>
        </section>

      </div>
    </div>
  );
};

export default About;