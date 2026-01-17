import React from 'react';

// โทนสี Shopee
const primaryOrange = '#EE4D2D';
const lightBackground = '#F5F5F5';
const navyBlue = '#113366';

// ข้อมูลตัวอย่างสำหรับแสดงในหน้า
const helpCategories = [
  { icon: '📦', title: 'การสั่งซื้อและการจัดส่ง' },
  { icon: '💰', title: 'การชำระเงินและโปรโมชั่น' },
  { icon: '↩️', title: 'การคืนสินค้าและคืนเงิน' },
  { icon: '🛒', title: 'การใช้งานบัญชี Shopee' },
];

const helpArticles = [
  'จะติดตามสถานะคำสั่งซื้อได้อย่างไร?',
  'วิธียกเลิกคำสั่งซื้อ',
  'การขอคืนเงินใช้เวลากี่วัน?',
  'ปัญหาเกี่ยวกับการรับสินค้า',
];

const HelpPageShopeeStyle = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'Arial, sans-serif', backgroundColor: lightBackground, minHeight: '100vh' }}>
      
      {/* 1. Header (คล้าย Shopee: ส้ม-ขาว) */}
      <header style={{maxWidth: '1500px', margin: '0 auto', backgroundColor: primaryOrange, padding: '15px 20px', color: 'white' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
          ศูนย์ช่วยเหลือ 💡
        </h1>
      </header>

      {/* 2. Search Bar (ส่วนสำคัญที่สุด - สไตล์มินิมอล มีขอบส้ม) */}
      <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px', backgroundColor: 'white', borderBottom: `1px solid ${lightBackground}` }}>
        <input
          type="text"
          placeholder="ค้นหาวิธีช่วยเหลือ, คำถามที่พบบ่อย..."
          style={{
            width: '100%',
            padding: '12px 15px',
            border: `2px solid ${primaryOrange}`, // ขอบสีส้ม
            borderRadius: '5px',
            fontSize: '16px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* 3. Main Content Container */}
      <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}>
        
        {/* 4. หมวดหมู่การช่วยเหลือ (เน้นไอคอนและสีส้ม) */}
        <h2 style={{ color: navyBlue, marginBottom: '15px', fontSize: '20px' }}>
          หมวดหมู่ยอดนิยม ✨
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {helpCategories.map((cat, index) => (
            <div 
              key={index} 
              style={{ 
                backgroundColor: 'white', 
                padding: '20px', 
                borderRadius: '8px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                textAlign: 'center',
                cursor: 'pointer',
                border: `1px solid ${lightBackground}`,
                transition: 'transform 0.2s'
              }}
            >
              <div style={{ fontSize: '30px', marginBottom: '10px', color: primaryOrange }}>
                {cat.icon}
              </div>
              <p style={{ margin: 0, fontWeight: 'bold', color: navyBlue }}>
                {cat.title}
              </p>
            </div>
          ))}
        </div>

        <hr style={{ border: `0.5px solid ${lightBackground}`, margin: '30px 0' }} />

        {/* 5. คำถามที่พบบ่อย (FAQ - สไตล์รายการ) */}
        <h2 style={{ color: navyBlue, marginBottom: '15px', fontSize: '20px' }}>
          คำถามที่พบบ่อย ❓
        </h2>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {helpArticles.map((article, index) => (
            <div 
              key={index} 
              style={{ 
                padding: '15px 20px', 
                borderBottom: index < helpArticles.length - 1 ? `1px solid ${lightBackground}` : 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: navyBlue
              }}
            >
              {article}
              <span style={{ color: primaryOrange, fontWeight: 'bold' }}>&gt;</span>
            </div>
          ))}
        </div>
        
        {/* 6. ปุ่มติดต่อเรา/ต้องการความช่วยเหลือเพิ่ม */}
        <div style={{ textAlign: 'center', marginTop: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: `1px solid ${primaryOrange}` }}>
            <p style={{ color: navyBlue, fontSize: '18px', margin: '0 0 15px 0' }}>
                ยังไม่พบคำตอบ? 
            </p>
            <button style={{ 
                backgroundColor: primaryOrange, 
                color: 'white', 
                padding: '12px 25px', 
                border: 'none', 
                borderRadius: '5px', 
                fontSize: '16px', 
                cursor: 'pointer',
                fontWeight: 'bold'
            }}>
                ติดต่อทีมงาน Shopee (สมมติ) 💬
            </button>
        </div>

      </div>
    </div>
  );
};

export default HelpPageShopeeStyle;