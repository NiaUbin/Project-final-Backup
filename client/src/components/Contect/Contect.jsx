import React, { useState } from 'react';
import { toast } from 'react-toastify';

const developers = [
  { name: 'ณัฐวัฒน์ แสงทอง', role: 'ผู้ดูแลระบบ', image: 'https://scontent.fbkk12-1.fna.fbcdn.net/v/t39.30808-6/615854368_1683013313104927_3868910406563709780_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=5Rf0GYCM2RgQ7kNvwGRcEo8&_nc_oc=AdkewxDLmfSPXBqh1HDC5AcwQTT4QNehlNx2Z3MeSeWAZ5yQLf4NvYwkGgM1Bf_eElUXGnwY5Ka1exaEckjiXbzC&_nc_zt=23&_nc_ht=scontent.fbkk12-1.fna&_nc_gid=RnvghZ0kQztm9ZWyB05wEA&oh=00_AfpKXxzyvZ0flWaw_1YBZpM02x2Ywf8bw-8KZH8ZT6iYXw&oe=6982B255' },
  { name: 'ธนกรณ์ มั่งมี', role: 'ผู้ดูแลระบบ', image: 'https://scontent.fbkk9-2.fna.fbcdn.net/v/t39.30808-6/487122420_4079433615717201_4199270183300070670_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=a5f93a&_nc_ohc=S9ThZOwMrHoQ7kNvwELMUpu&_nc_oc=AdnEMnnlHDxFXThISaTxX2t7Lg0q-6WJA3LOhm7shUXS1eNWw3OipGCrzgF5mN8hPyCTA83SJJmy-3eTWnAxDIUK&_nc_zt=23&_nc_ht=scontent.fbkk9-2.fna&_nc_gid=noo-kiiQ2_1qsipQ5xlUzQ&oh=00_AfrIqCl1tZqfJpTI1l-7LPv3Fo1P2aBcX4YMs85noudRtA&oe=6982A11B' },
];

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, subject, message } = formData;
    if (!name || !email || !subject || !message) {
      return toast.error('กรุณากรอกข้อมูลให้ครบทุกช่อง');
    }

    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('ส่งข้อความสำเร็จ! เราจะติดต่อกลับโดยเร็วที่สุด');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการส่งข้อความ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Banner with Geometric Pattern */}
      <div className="relative bg-[#ee4d2d] overflow-hidden text-white py-20 px-4">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative max-w-6xl mx-auto text-center z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight drop-shadow-sm">
            ติดต่อเรา
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-light">
            มีคำถามหรือข้อสงสัย? เราพร้อมให้ความช่วยเหลือคุณตลอด 24 ชั่วโมง
          </p>
        </div>
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 rounded-full bg-yellow-400/20 blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-10 pb-20 relative z-20">
        
        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden flex flex-col md:flex-row mb-16 border border-gray-100">
          
          {/* Left Side: Contact Information */}
          <div className="md:w-5/12 bg-gradient-to-br from-slate-800 to-slate-900 text-white p-10 flex flex-col justify-between relative overflow-hidden">
             
             {/* Decorative pattern for dark side */}
             <div className="absolute bottom-0 right-0 opacity-5 text-[150px] leading-none pointer-events-none -mr-10 -mb-10 animate-pulse">
                <i className="fas fa-headset"></i>
             </div>

             <div>
                <h3 className="text-2xl font-bold mb-6 text-[#ee4d2d]">ข้อมูลการติดต่อ</h3>
                <p className="text-slate-300 mb-8 font-light">สามารถติดต่อเราได้ตามช่องทางด้านล่างนี้ หรือกรอกแบบฟอร์มเพื่อส่งข้อความถึงเรา</p>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-[#ee4d2d]/20 text-[#ee4d2d] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <i className="fas fa-map-marker-alt text-lg"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white group-hover:text-[#ee4d2d] transition-colors">ที่อยู่</h4>
                      <p className="text-slate-300 text-sm mt-1">123/45 ถนนสุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-[#ee4d2d]/20 text-[#ee4d2d] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <i className="fas fa-phone-alt text-lg"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white group-hover:text-[#ee4d2d] transition-colors">โทรศัพท์</h4>
                      <p className="text-slate-300 text-sm mt-1 cursor-pointer hover:underline">+66 1234 5678</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-[#ee4d2d]/20 text-[#ee4d2d] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <i className="fas fa-envelope text-lg"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white group-hover:text-[#ee4d2d] transition-colors">อีเมล</h4>
                      <p className="text-slate-300 text-sm mt-1 cursor-pointer hover:underline">support@example.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-[#ee4d2d]/20 text-[#ee4d2d] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <i className="fas fa-clock text-lg"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white group-hover:text-[#ee4d2d] transition-colors">เวลาทำการ</h4>
                      <p className="text-slate-300 text-sm mt-1">จันทร์ - ศุกร์ 09:00 - 18:00 น.</p>
                    </div>
                  </div>
                </div>
             </div>

             <div className="mt-10">
                <h4 className="text-sm font-semibold text-slate-400 uppercase mb-4 tracking-wider">Social Media</h4>
                <div className="flex gap-4">
                   <button className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center hover:bg-[#3b5998] hover:text-white transition-all transform hover:-translate-y-1 cursor-pointer border-none outline-none">
                      <i className="fab fa-facebook-f"></i>
                   </button>
                   <button className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center hover:bg-[#1DA1F2] hover:text-white transition-all transform hover:-translate-y-1 cursor-pointer border-none outline-none">
                      <i className="fab fa-twitter"></i>
                   </button>
                   <button className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center hover:bg-[#E1306C] hover:text-white transition-all transform hover:-translate-y-1 cursor-pointer border-none outline-none">
                      <i className="fab fa-instagram"></i>
                   </button>
                   <button className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center hover:bg-[#0077b5] hover:text-white transition-all transform hover:-translate-y-1 cursor-pointer border-none outline-none">
                      <i className="fab fa-linkedin-in"></i>
                   </button>
                </div>
             </div>
          </div>

          {/* Right Side: Contact Form */}
          <div className="md:w-7/12 p-8 md:p-12 bg-white relative">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">ส่งข้อความถึงเรา</h3>
            <p className="text-gray-500 mb-8 text-sm">เราจะตอบกลับทางอีเมลภายใน 24 ชั่วโมง</p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                   <label className="text-xs font-semibold text-gray-600 uppercase">ชื่อของคุณ</label>
                   <input
                    type="text"
                    name="name"
                    placeholder="ระบุชื่อ-นามสกุล"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ee4d2d]/50 focus:border-[#ee4d2d] transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                   <label className="text-xs font-semibold text-gray-600 uppercase">อีเมล</label>
                   <input
                    type="email"
                    name="email"
                    placeholder="example@mail.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ee4d2d]/50 focus:border-[#ee4d2d] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-xs font-semibold text-gray-600 uppercase">หัวข้อเรื่อง</label>
                 <input
                  type="text"
                  name="subject"
                  placeholder="เรื่องที่ต้องการติดต่อ..."
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ee4d2d]/50 focus:border-[#ee4d2d] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                 <label className="text-xs font-semibold text-gray-600 uppercase">ข้อความ</label>
                 <textarea
                  name="message"
                  placeholder="รายละเอียด..."
                  rows="4"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ee4d2d]/50 focus:border-[#ee4d2d] transition-all resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#ee4d2d] hover:bg-[#d73211] text-white rounded-lg font-bold shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-4"
              >
                {loading ? (
                   <>
                     <i className="fas fa-spinner fa-spin"></i> กำลังส่ง...
                   </>
                ) : (
                   <>
                     <i className="fas fa-paper-plane"></i> ส่งข้อความ
                   </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Developers Section */}
        <div className="mb-20">
           <div className="text-center mb-10">
              <span className="text-[#ee4d2d] font-bold tracking-wider uppercase text-sm">Our Team</span>
              <h2 className="text-3xl font-bold text-gray-800 mt-1">ทีมผู้พัฒนา</h2>
              <div className="w-16 h-1 bg-[#ee4d2d] mx-auto mt-4 rounded-full"></div>
           </div>

           <div className="flex flex-wrap justify-center gap-8 md:gap-12">
              {developers.map((dev, idx) => (
                <div key={idx} className="group flex flex-col items-center">
                   <div className="relative mb-4">
                      <div className="w-32 h-32 rounded-full p-1 border-2 border-dashed border-gray-300 group-hover:border-[#ee4d2d] transition-colors relative z-10">
                         <img src={dev.image} alt={dev.name} className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="absolute inset-0 bg-[#ee4d2d] rounded-full blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                   </div>
                   <h3 className="font-bold text-lg text-gray-800 group-hover:text-[#ee4d2d] transition-colors">{dev.name}</h3>
                   <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-500 rounded-full mt-1 group-hover:bg-red-50 group-hover:text-[#ee4d2d] transition-colors">{dev.role}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Map Section */}
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
           <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3874.976053697684!2d100.63575197556804!3d13.780317086614495!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x311d621ebf896443%3A0xe92d160fcde72d8e!2z4Lih4Lir4Liy4Lin4Li04LiX4Lii4Liy4Lil4Lix4Lii4Lij4Lix4LiV4LiZ4Lia4Lix4LiT4LiR4Li04LiVKFJCQUMp!5e0!3m2!1sth!2sth!4v1760892952037!5m2!1sth!2sth"
            width="100%"
            height="400"
            className="rounded-lg"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            title="office-map"
          />
        </div>

      </div>
    </div>
  );
};

export default Contact;
