import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Scroll ขึ้นบนสุดทุกครั้งเมื่อเปลี่ยนหน้า หรือ query parameters
    // ใช้ instant เพื่อให้เร็วและสวยงาม
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // เปลี่ยนเป็น instant เพื่อให้เร็วขึ้น
    });

    // Scroll main element ถ้ามี
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    }

    // Scroll html และ body elements เพื่อความแน่ใจ
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search]); // เพิ่ม search เพื่อให้ scroll เมื่อ query parameters เปลี่ยน

  return null;
};

export default ScrollToTop;

