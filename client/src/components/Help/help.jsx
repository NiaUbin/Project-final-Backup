import React, { useState } from 'react';

// ===== Colors (Shopee tone) =====
const primaryOrange = '#EE4D2D';
const lightBackground = '#F5F5F5';
const navyBlue = '#113366';

// ===== Categories =====
const helpCategories = [
  { icon: '📦', title: 'การสั่งซื้อและการจัดส่ง' },
  { icon: '💰', title: 'การชำระเงินและโปรโมชั่น' },
  { icon: '↩️', title: 'การคืนสินค้าและคืนเงิน' },
  { icon: '🛒', title: 'การใช้งานบัญชี Shopee' },
];

// ===== FAQ Data =====
const helpArticles = [
  {
    question: 'จะติดตามสถานะคำสั่งซื้อได้อย่างไร?',
    answer:
      'คุณสามารถตรวจสอบสถานะคำสั่งซื้อได้ที่เมนู "การซื้อของฉัน" จากนั้นเลือกคำสั่งซื้อที่ต้องการตรวจสอบ',
  },
  {
    question: 'วิธียกเลิกคำสั่งซื้อ',
    answer:
      'สามารถยกเลิกคำสั่งซื้อได้ก่อนผู้ขายจัดส่งสินค้า โดยเข้าไปที่หน้ารายละเอียดคำสั่งซื้อ',
  },
  {
    question: 'การขอคืนเงินใช้เวลากี่วัน?',
    answer:
      'โดยปกติการคืนเงินจะใช้เวลาประมาณ 3–7 วันทำการ ขึ้นอยู่กับช่องทางการชำระเงิน',
  },
  {
    question: 'ปัญหาเกี่ยวกับการรับสินค้า',
    answer:
      'หากไม่ได้รับสินค้า หรือสินค้าเสียหาย สามารถแจ้งปัญหาและขอคืนสินค้าได้ผ่านระบบ Shopee',
  },
];

// ===== FAQ Dropdown Component =====
const FAQDropdown = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggle = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      {helpArticles.map((item, index) => (
        <div key={index}>
          {/* Question */}
          <div
            onClick={() => toggle(index)}
            style={{
              padding: '16px 20px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #eee',
            }}
          >
            <span style={{ color: navyBlue, fontWeight: 'bold' }}>
              {item.question}
            </span>

            <span
              style={{
                color: primaryOrange,
                fontSize: '20px',
                transform:
                  activeIndex === index ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.25s ease',
              }}
            >
              ›
            </span>
          </div>

          {/* Answer */}
          <div
            style={{
              maxHeight: activeIndex === index ? '200px' : '0',
              overflow: 'hidden',
              transition: 'max-height 0.3s ease',
              backgroundColor: '#fafafa',
            }}
          >
            <p
              style={{
                padding: '15px 20px',
                margin: 0,
                fontSize: '15px',
                color: '#555',
              }}
            >
              {item.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ===== Main Page =====
const HelpPageShopeeStyle = () => {
  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        backgroundColor: lightBackground,
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: primaryOrange,
          padding: '16px 24px',
          color: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 'bold' }}>
            ศูนย์ช่วยเหลือ
          </h1>
        </div>
      </header>

      {/* Search */}
      <div style={{ maxWidth: '1200px', margin: '25px auto', padding: '0 20px' }}>
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '30px',
            display: 'flex',
            alignItems: 'center',
            padding: '10px 18px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          }}
        >
          <span style={{ marginRight: '10px' }}>🔍</span>
          <input
            type="text"
            placeholder="ค้นหาคำถาม หรือวิธีแก้ปัญหา"
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '16px',
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Categories */}
        <h2 style={{ color: navyBlue, marginBottom: '15px' }}>
          หมวดหมู่ยอดนิยม
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
          }}
        >
          {helpCategories.map((cat, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '12px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = 'translateY(-4px)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = 'translateY(0)')
              }
            >
              <div style={{ fontSize: '34px', marginBottom: '12px' }}>
                {cat.icon}
              </div>
              <p style={{ margin: 0, fontWeight: 'bold', color: navyBlue }}>
                {cat.title}
              </p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h2 style={{ color: navyBlue, margin: '40px 0 15px' }}>
          คำถามที่พบบ่อย
        </h2>

        <FAQDropdown />

        {/* Contact */}
        <div
          style={{
            marginTop: '40px',
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            textAlign: 'center',
            border: `1px solid ${primaryOrange}`,
          }}
        >
          <p style={{ fontSize: '18px', color: navyBlue }}>
            ยังไม่พบคำตอบที่ต้องการ?
          </p>
          <button
            style={{
              backgroundColor: primaryOrange,
              color: 'white',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '30px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ติดต่อฝ่ายบริการลูกค้า
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpPageShopeeStyle;
