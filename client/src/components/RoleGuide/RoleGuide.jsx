import React from 'react';

const RoleGuide = () => {
  const adminPermissions = [
    {
      category: 'การจัดการผู้ใช้',
      icon: 'fas fa-users',
      color: 'bg-blue-500',
      permissions: [
        'ดูรายชื่อผู้ใช้ทั้งหมด',
        'เปลี่ยนสิทธิ์ผู้ใช้ (User ↔ Admin)',
        'เปิด/ปิดการใช้งานบัญชีผู้ใช้',
        'ดูข้อมูลส่วนตัวของผู้ใช้',
        'ตรวจสอบกิจกรรมของผู้ใช้'
      ]
    },
    {
      category: 'การจัดการสินค้า',
      icon: 'fas fa-box',
      color: 'bg-green-500',
      permissions: [
        'เพิ่มสินค้าใหม่',
        'แก้ไขข้อมูลสินค้า',
        'ลบสินค้า',
        'จัดการหมวดหมู่สินค้า',
        'ตั้งราคาและจำนวนสินค้า'
      ]
    },
    {
      category: 'การจัดการคำสั่งซื้อ',
      icon: 'fas fa-receipt',
      color: 'bg-purple-500',
      permissions: [
        'ดูคำสั่งซื้อทั้งหมด',
        'เปลี่ยนสถานะคำสั่งซื้อ',
        'ยกเลิกคำสั่งซื้อ',
        'ออกใบเสร็จ',
        'จัดการการจัดส่ง'
      ]
    },
    {
      category: 'รายงานและสถิติ',
      icon: 'fas fa-chart-bar',
      color: 'bg-orange-500',
      permissions: [
        'ดูสถิติการขาย',
        'ดูรายงานผู้ใช้',
        'วิเคราะห์ข้อมูลการซื้อ',
        'Export ข้อมูลเป็น Excel/PDF',
        'ตั้งค่าการแจ้งเตือน'
      ]
    },
    {
      category: 'การตั้งค่าระบบ',
      icon: 'fas fa-cog',
      color: 'bg-gray-500',
      permissions: [
        'ตั้งค่าการเชื่อมต่อฐานข้อมูล',
        'จัดการความปลอดภัย',
        'ตั้งค่า JWT Token',
        'จัดการ CORS',
        'Backup และ Restore ข้อมูล'
      ]
    }
  ];

  const userPermissions = [
    {
      category: 'การซื้อสินค้า',
      icon: 'fas fa-shopping-cart',
      color: 'bg-blue-500',
      permissions: [
        'ดูรายการสินค้าทั้งหมด',
        'ค้นหาและกรองสินค้า',
        'เพิ่มสินค้าลงตะกร้า',
        'จัดการตะกร้าสินค้า',
        'สั่งซื้อสินค้า'
      ]
    },
    {
      category: 'การจัดการคำสั่งซื้อ',
      icon: 'fas fa-receipt',
      color: 'bg-green-500',
      permissions: [
        'ดูประวัติคำสั่งซื้อของตนเอง',
        'ติดตามสถานะการจัดส่ง',
        'ดาวน์โหลดใบเสร็จ',
        'ยกเลิกคำสั่งซื้อ (ก่อนจัดส่ง)',
        'ให้คะแนนและรีวิวสินค้า'
      ]
    },
    {
      category: 'การจัดการข้อมูลส่วนตัว',
      icon: 'fas fa-user',
      color: 'bg-purple-500',
      permissions: [
        'ดูและแก้ไขข้อมูลส่วนตัว',
        'เปลี่ยนรหัสผ่าน',
        'จัดการที่อยู่จัดส่ง',
        'ตั้งค่าการแจ้งเตือน',
        'ดูประวัติการใช้งาน'
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          <i className="fas fa-shield-alt text-blue-500 mr-3"></i>
          สิทธิ์การใช้งานระบบ
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          ระบบแบ่งสิทธิ์การใช้งานเป็น 2 ระดับ เพื่อความปลอดภัยและการจัดการที่มีประสิทธิภาพ
        </p>
      </div>

      {/* Admin Permissions */}
      <div className="mb-12">
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white mb-8">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-yellow-400 rounded-lg flex items-center justify-center mr-4">
              <i className="fas fa-crown text-red-600 text-2xl"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Administrator (ผู้ดูแลระบบ)</h2>
              <p className="text-red-100">สิทธิ์สูงสุด สามารถจัดการระบบทั้งหมดได้</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminPermissions.map((category, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg border-l-4 border-red-500">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center mr-3`}>
                    <i className={`${category.icon} text-white text-xl`}></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{category.category}</h3>
                </div>
                <ul className="space-y-2">
                  {category.permissions.map((permission, permIndex) => (
                    <li key={permIndex} className="flex items-start">
                      <i className="fas fa-check-circle text-green-500 mr-2 mt-0.5 flex-shrink-0"></i>
                      <span className="text-sm text-gray-700">{permission}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Permissions */}
      <div className="mb-12">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white mb-8">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
              <i className="fas fa-user text-white text-2xl"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">User (ผู้ใช้งานทั่วไป)</h2>
              <p className="text-blue-100">สิทธิ์การซื้อสินค้าและจัดการข้อมูลส่วนตัว</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userPermissions.map((category, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg border-l-4 border-blue-500">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center mr-3`}>
                    <i className={`${category.icon} text-white text-xl`}></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{category.category}</h3>
                </div>
                <ul className="space-y-2">
                  {category.permissions.map((permission, permIndex) => (
                    <li key={permIndex} className="flex items-start">
                      <i className="fas fa-check-circle text-green-500 mr-2 mt-0.5 flex-shrink-0"></i>
                      <span className="text-sm text-gray-700">{permission}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            <i className="fas fa-balance-scale text-purple-500 mr-2"></i>
            เปรียบเทียบสิทธิ์การใช้งาน
          </h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">ฟังก์ชัน</th>
                  <th className="text-center py-3 px-4 font-semibold text-blue-600">
                    <i className="fas fa-user mr-2"></i>User
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-red-600">
                    <i className="fas fa-crown mr-2"></i>Admin
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { name: 'ดูสินค้า', user: true, admin: true },
                  { name: 'เพิ่มสินค้าลงตะกร้า', user: true, admin: true },
                  { name: 'สั่งซื้อสินค้า', user: true, admin: true },
                  { name: 'ดูคำสั่งซื้อของตนเอง', user: true, admin: true },
                  { name: 'แก้ไขข้อมูลส่วนตัว', user: true, admin: true },
                  { name: 'ดูข้อมูลผู้ใช้ทั้งหมด', user: false, admin: true },
                  { name: 'เปลี่ยนสิทธิ์ผู้ใช้', user: false, admin: true },
                  { name: 'เปิด/ปิดใช้งานบัญชี', user: false, admin: true },
                  { name: 'จัดการสินค้า (เพิ่ม/ลบ/แก้ไข)', user: false, admin: true },
                  { name: 'ดูคำสั่งซื้อทั้งหมด', user: false, admin: true },
                  { name: 'จัดการสถานะคำสั่งซื้อ', user: false, admin: true },
                  { name: 'ดูรายงานและสถิติ', user: false, admin: true },
                  { name: 'ตั้งค่าระบบ', user: false, admin: true }
                ].map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{item.name}</td>
                    <td className="py-3 px-4 text-center">
                      {item.user ? (
                        <i className="fas fa-check-circle text-green-500 text-lg"></i>
                      ) : (
                        <i className="fas fa-times-circle text-red-500 text-lg"></i>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.admin ? (
                        <i className="fas fa-check-circle text-green-500 text-lg"></i>
                      ) : (
                        <i className="fas fa-times-circle text-red-500 text-lg"></i>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Security Notes */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mr-4">
            <i className="fas fa-shield-alt text-white text-xl"></i>
          </div>
          <div>
            <h3 className="text-lg font-medium text-yellow-800 mb-2">ข้อมูลความปลอดภัย</h3>
            <div className="text-sm text-yellow-700 space-y-2">
              <p>• สิทธิ์ Admin มีอำนาจสูงสุด ควรให้เฉพาะบุคคลที่ไว้วางใจได้</p>
              <p>• การเปลี่ยนสิทธิ์จะมีผลทันที และต้องการการยืนยันตัวตน</p>
              <p>• ระบบจะบันทึก log การดำเนินการทั้งหมดเพื่อความปลอดภัย</p>
              <p>• หากพบการใช้งานที่ผิดปกติ ระบบจะล็อคบัญชีอัตโนมัติ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleGuide;
