import React, { useState } from 'react';
import { toast } from 'react-toastify';

const developers = [
  { name: 'ณัฐวัฒน์ แสงทอง', role: 'Front-end Developer', image: 'https://scontent.fbkk13-3.fna.fbcdn.net/v/t39.30808-6/518395830_1534583677947892_4475559807523069493_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=j0KgWOcnJ_kQ7kNvwEU4jpT&_nc_oc=AdkX6EslMbUBhjjkdzxeCKQ1afzvYva6QGWdd7ZiomLiyNh48hNlTLdZuQBYb4AXcbIM1O0_SzO884N6uZc9BAfh&_nc_zt=23&_nc_ht=scontent.fbkk13-3.fna&_nc_gid=YrMKOFz4fTZonUJmW4PEJA&oh=00_AfdS4IrobT6cAaI2W5WEvn3CXnHxNJpLB8i0SINds_fNBQ&oe=68FBC5CD' },
  { name: 'พลอย ชาญวิทย์', role: 'Back-end Developer', image: 'https://scontent.fbkk13-3.fna.fbcdn.net/v/t39.30808-6/518395830_1534583677947892_4475559807523069493_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=j0KgWOcnJ_kQ7kNvwEU4jpT&_nc_oc=AdkX6EslMbUBhjjkdzxeCKQ1afzvYva6QGWdd7ZiomLiyNh48hNlTLdZuQBYb4AXcbIM1O0_SzO884N6uZc9BAfh&_nc_zt=23&_nc_ht=scontent.fbkk13-3.fna&_nc_gid=YrMKOFz4fTZonUJmW4PEJA&oh=00_AfdS4IrobT6cAaI2W5WEvn3CXnHxNJpLB8i0SINds_fNBQ&oe=68FBC5CD' },
  { name: 'ธีรพล พัฒน์', role: 'Full-stack Developer', image: 'https://scontent.fbkk13-3.fna.fbcdn.net/v/t39.30808-6/518395830_1534583677947892_4475559807523069493_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=j0KgWOcnJ_kQ7kNvwEU4jpT&_nc_oc=AdkX6EslMbUBhjjkdzxeCKQ1afzvYva6QGWdd7ZiomLiyNh48hNlTLdZuQBYb4AXcbIM1O0_SzO884N6uZc9BAfh&_nc_zt=23&_nc_ht=scontent.fbkk13-3.fna&_nc_gid=YrMKOFz4fTZonUJmW4PEJA&oh=00_AfdS4IrobT6cAaI2W5WEvn3CXnHxNJpLB8i0SINds_fNBQ&oe=68FBC5CD' },
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
      // ตัวอย่างส่งข้อมูล API
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('ส่งข้อความสำเร็จ!');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการส่งข้อความ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 space-y-16">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold text-green-400">ติดต่อเรา</h1>
          <p className="text-gray-400 text-lg">เราพร้อมช่วยเหลือคุณทุกเรื่องเกี่ยวกับสินค้าและบริการ</p>
        </div>

                        {/* Developers */}
                        <div className="text-center space-y-12">
          <h2 className="text-4xl font-bold text-green-400 mb-8">ทีมผู้พัฒนา</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 justify-items-center items-center">
            {/* 2 คนบน */}
            {developers.slice(0, 2).map((dev, idx) => (
              <div key={idx} className="flex flex-col items-center space-y-2">
                <img src={dev.image} alt={dev.name} className="w-32 h-32 rounded-full object-cover shadow-lg hover:scale-105 transition" />
                <h3 className="font-semibold text-lg">{dev.name}</h3>
                <p className="text-gray-400 text-sm">{dev.role}</p>
              </div>
            ))}
            {/* 1 คนล่าง */}
            <div className="col-span-2 flex justify-center md:col-span-1">
              <div className="flex flex-col items-center space-y-2">
                <img src={developers[2].image} alt={developers[2].name} className="w-32 h-32 rounded-full object-cover shadow-lg hover:scale-105 transition" />
                <h3 className="font-semibold text-lg">{developers[2].name}</h3>
                <p className="text-gray-400 text-sm">{developers[2].role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

          {/* Contact Info */}
          <div className="space-y-6">
            {[
              { icon: 'fas fa-map-marker-alt', title: 'ที่อยู่', desc: '123/45 ถนนสุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110' },
              { icon: 'fas fa-phone-alt', title: 'โทรศัพท์', desc: '+66 1234 5678' },
              { icon: 'fas fa-envelope', title: 'อีเมล', desc: 'support@example.com' },
              { icon: 'fas fa-clock', title: 'เวลาทำการ', desc: 'จันทร์ - ศุกร์ 09:00 - 18:00 น.' },
            ].map((info, idx) => (
              <div key={idx} className="bg-gray-800 p-6 rounded-xl shadow-lg flex items-start space-x-4 hover:shadow-2xl transition">
                <i className={`${info.icon} text-green-400 text-2xl mt-1`}></i>
                <div>
                  <h3 className="font-semibold text-lg">{info.title}</h3>
                  <p className="text-gray-400 text-sm">{info.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-green-400">ส่งข้อความถึงเรา</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="ชื่อของคุณ"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <input
                type="email"
                name="email"
                placeholder="อีเมลของคุณ"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <input
                type="text"
                name="subject"
                placeholder="หัวข้อ"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <textarea
                name="message"
                placeholder="ข้อความของคุณ"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
              ></textarea>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl font-bold hover:from-green-600 hover:to-blue-600 disabled:opacity-50 text-white text-lg"
              >
                {loading ? 'กำลังส่งข้อความ...' : 'ส่งข้อความ'}
              </button>
            </form>
          </div>

        </div>


        {/* Google Map */}
        <div className="rounded-xl overflow-hidden shadow-2xl">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3874.976053697684!2d100.63575197556804!3d13.780317086614495!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x311d621ebf896443%3A0xe92d160fcde72d8e!2z4Lih4Lir4Liy4Lin4Li04LiX4Lii4Liy4Lil4Lix4Lii4Lij4Lix4LiV4LiZ4Lia4Lix4LiT4LiR4Li04LiVKFJCQUMp!5e0!3m2!1sth!2sth!4v1760892952037!5m2!1sth!2sth"
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            title="ร้านของเรา"
          />
        </div>


      </div>
    </div>
  );
};

export default Contact;
