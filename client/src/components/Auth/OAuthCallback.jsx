import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login', { 
        state: { error: 'การเข้าสู่ระบบด้วยโซเชียลมีเดียล้มเหลว กรุณาลองใหม่อีกครั้ง' }
      });
      return;
    }

    if (token) {
      // Store token
      localStorage.setItem('token', token);

      // Fetch user data using currentUser endpoint
      const fetchUser = async () => {
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const user = data.user || data;
            
            localStorage.setItem('user', JSON.stringify(user));
            updateUser(user);
            
            // Redirect based on role
            if (user.role === 'seller') {
              navigate('/become-seller');
            } else {
              navigate('/dashboard');
            }
          } else {
            throw new Error('Failed to fetch user data');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          navigate('/login', { 
            state: { error: 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้' }
          });
        }
      };

      fetchUser();
    } else {
      navigate('/login', { 
        state: { error: 'ไม่พบข้อมูลการเข้าสู่ระบบ' }
      });
    }
  }, [searchParams, navigate, updateUser]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">กำลังเข้าสู่ระบบ...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;

