import axios from 'axios';

// สร้าง axios instance ที่สามารถกำหนด baseURL ได้
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '', // ถ้าไม่ตั้งค่า จะใช้ relative path (proxy)
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - เพิ่ม token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - จัดการ 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

