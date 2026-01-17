import React, { useState } from 'react';
import axios from 'axios';

const TestAdminFeatures = () => {
  const [testResults, setTestResults] = useState([]);
  const [testing, setTesting] = useState(false);

  const addResult = (test, success, message) => {
    setTestResults(prev => [...prev, { test, success, message, timestamp: new Date() }]);
  };

  const runAllTests = async () => {
    setTesting(true);
    setTestResults([]);

    try {
      // Test 1: Create Category
      try {
        const categoryResponse = await axios.post('/api/category', {
          name: `Test Category ${Date.now()}`
        });
        addResult('สร้างหมวดหมู่', true, categoryResponse.data.message);
      } catch (error) {
        addResult('สร้างหมวดหมู่', false, error.response?.data?.message);
      }

      // Test 2: Create Product
      try {
        const categoriesResponse = await axios.get('/api/category');
        const categoryId = categoriesResponse.data.categories[0]?.id;
        
        if (categoryId) {
          const productResponse = await axios.post('/api/product', {
            title: `Test Product ${Date.now()}`,
            description: 'This is a test product created from admin panel',
            price: 299.99,
            quantity: 50,
            categoryId: categoryId,
            images: [{
              asset_id: 'test-admin',
              public_id: 'test-admin',
              url: 'https://via.placeholder.com/300x300?text=Admin+Test',
              secure_url: 'https://via.placeholder.com/300x300?text=Admin+Test'
            }]
          });
          addResult('สร้างสินค้า', true, productResponse.data.message);
        } else {
          addResult('สร้างสินค้า', false, 'ไม่พบหมวดหมู่สำหรับทดสอบ');
        }
      } catch (error) {
        addResult('สร้างสินค้า', false, error.response?.data?.message);
      }

      // Test 3: List Users
      try {
        const usersResponse = await axios.get('/api/users');
        addResult('ดูรายชื่อผู้ใช้', true, `พบผู้ใช้ ${usersResponse.data.count} คน`);
      } catch (error) {
        addResult('ดูรายชื่อผู้ใช้', false, error.response?.data?.message);
      }

      // Test 4: Create Test User
      try {
        const testEmail = `testuser${Date.now()}@example.com`;
        const registerResponse = await axios.post('/api/register', {
          email: testEmail,
          password: '123456',
          name: 'Test User for Admin'
        });
        addResult('สร้างผู้ใช้ทดสอบ', true, registerResponse.data.message);

        // Test 5: Change User Role
        try {
          const usersResponse = await axios.get('/api/users');
          const testUser = usersResponse.data.users.find(u => u.email === testEmail);
          
          if (testUser) {
            const roleResponse = await axios.post('/api/change-role', {
              id: testUser.id,
              role: 'admin'
            });
            addResult('เปลี่ยนสิทธิ์ผู้ใช้', true, roleResponse.data.message);

            // Test 6: Delete Test User
            const deleteResponse = await axios.delete('/api/delete-user', {
              data: { id: testUser.id }
            });
            addResult('ลบผู้ใช้', true, deleteResponse.data.message);
          }
        } catch (error) {
          addResult('เปลี่ยนสิทธิ์/ลบผู้ใช้', false, error.response?.data?.message);
        }
      } catch (error) {
        addResult('สร้างผู้ใช้ทดสอบ', false, error.response?.data?.message);
      }

    } catch (error) {
      console.error('Test error:', error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            <i className="fas fa-flask text-blue-500 mr-2"></i>
            ทดสอบฟังก์ชัน Admin
          </h2>
          <p className="text-sm text-gray-600 mt-1">ทดสอบการสร้าง แก้ไข และลบข้อมูล</p>
        </div>
        <button
          onClick={runAllTests}
          disabled={testing}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          {testing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
              กำลังทดสอบ...
            </>
          ) : (
            <>
              <i className="fas fa-play mr-2"></i>
              เริ่มทดสอบ
            </>
          )}
        </button>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ผลการทดสอบ:</h3>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  result.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                } fade-in`}
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    result.success 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}>
                    <i className={`fas ${result.success ? 'fa-check' : 'fa-times'} text-sm`}></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{result.test}</p>
                    <p className={`text-sm ${
                      result.success ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.message}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {result.timestamp.toLocaleTimeString('th-TH')}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <i className="fas fa-info-circle text-blue-500 mr-2"></i>
              <div>
                <p className="text-sm font-medium text-blue-800">
                  ผลสรุป: {testResults.filter(r => r.success).length}/{testResults.length} ทดสอบผ่าน
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  การทดสอบเสร็จสิ้น - ระบบพร้อมใช้งาน
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
          คำแนะนำการใช้งาน
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium mb-2">🏷️ การจัดการหมวดหมู่:</h4>
            <ul className="space-y-1 text-xs">
              <li>• เพิ่มหมวดหมู่ใหม่สำหรับจัดกลุ่มสินค้า</li>
              <li>• แก้ไขชื่อหมวดหมู่ได้ตามต้องการ</li>
              <li>• ลบหมวดหมู่ที่ไม่ใช้แล้ว</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">📦 การจัดการสินค้า:</h4>
            <ul className="space-y-1 text-xs">
              <li>• เพิ่มสินค้าใหม่พร้อมรูปภาพ</li>
              <li>• แก้ไขราคาและจำนวนสินค้า</li>
              <li>• ลบสินค้าที่ไม่ขายแล้ว</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">👥 การจัดการผู้ใช้:</h4>
            <ul className="space-y-1 text-xs">
              <li>• เปลี่ยนสิทธิ์ User ↔ Admin</li>
              <li>• เปิด/ปิดการใช้งานบัญชี</li>
              <li>• ลบบัญชีที่ไม่ต้องการ</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">⚠️ ข้อควรระวัง:</h4>
            <ul className="space-y-1 text-xs">
              <li>• การลบข้อมูลไม่สามารถยกเลิกได้</li>
              <li>• ระบบจะยืนยันก่อนลบข้อมูลสำคัญ</li>
              <li>• Admin ไม่สามารถลบตัวเองได้</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAdminFeatures;
