// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import axios from 'axios';

// // --- Components ย่อยเพื่อความสะอาด ---

// /**
//  * 1. AdminHeader Component:
//  * แยส่วน Header ออกมาเพื่อลดความซับซ้อนใน Component หลัก
//  */
// const AdminHeader = ({ user, totalUsers }) => (
//   <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
//     {/* Decorative elements */}
//     <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full transform translate-x-4 -translate-y-4"></div>
//     <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full transform -translate-x-4 translate-y-4"></div>

//     <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
//       <div>
//         <h1 className="text-3xl font-bold mb-1">ยินดีต้อนรับ, Admin {user.name} 👑</h1>
//         <p className="text-red-100">Dashboard การจัดการระบบ E-commerce</p>
//         <div className="mt-3 flex flex-wrap gap-2">
//           <span className="bg-yellow-400 text-red-800 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
//             <i className="fas fa-star"></i> Administrator
//           </span>
//           <span className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
//             <i className="fas fa-shield-check"></i> Full Access
//           </span>
//         </div>
//       </div>
//       <div className="text-center md:text-right">
//         <p className="text-4xl font-extrabold">{totalUsers}</p>
//         <p className="text-red-100 text-sm mt-1">ผู้ใช้ทั้งหมด</p>
//       </div>
//     </div>
//   </div>
// );

// /**
//  * 2. StatCard Component:
//  * สร้าง Card ที่นำกลับมาใช้ซ้ำได้
//  * - ปรับปรุง: ลบ border-l-4 ออก ใช้เงาที่สอดคล้องกันแทน
//  * - ใช้ `themeColor` เพื่อกำหนดสีของ text และ bg-light ของไอคอน
//  */
// const StatCard = ({ title, value, sub, icon, themeColor }) => {
//   const colors = {
//     blue: { text: 'text-blue-600', bg: 'bg-blue-100' },
//     green: { text: 'text-green-600', bg: 'bg-green-100' },
//     purple: { text: 'text-purple-600', bg: 'bg-purple-100' },
//     orange: { text: 'text-orange-600', bg: 'bg-orange-100' },
//   };
//   const color = colors[themeColor] || colors.blue;

//   return (
//     <div className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow duration-300">
//       <div className="flex items-center justify-between">
//         <div>
//           <p className="text-sm text-gray-500">{title}</p>
//           <p className={`text-2xl font-bold ${color.text}`}>{value}</p>
//           <p className={`text-xs text-gray-500 mt-1`}>
//             {/* อาจปรับไอคอนให้มีความหมายมากขึ้น เช่น เพิ่มขึ้น/ลดลง */}
//             {sub}
//           </p>
//         </div>
//         <div className={`w-12 h-12 ${color.bg} rounded-lg flex items-center justify-center`}>
//           <i className={`fas fa-${icon} ${color.text} text-xl`}></i>
//         </div>
//       </div>
//     </div>
//   );
// };

// /**
//  * 3. QuickActionsGrid Component:
//  * - ปรับปรุง: เปลี่ยนสไตล์ไอคอนจาก bg-color-500 (สีทึบ)
//  * เป็น bg-color-100 (สีอ่อน) เพื่อให้เข้ากับ StatCards
//  */
// const QuickActionsGrid = ({ actions }) => {
//   const themeClasses = {
//     blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
//     green: { bg: 'bg-green-100', text: 'text-green-600' },
//     purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
//     orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
//     gray: { bg: 'bg-gray-100', text: 'text-gray-600' },
//     red: { bg: 'bg-red-100', text: 'text-red-600' },
//   };

//   return (
//     <div className="bg-white rounded-xl shadow-lg overflow-hidden">
//       <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
//         <i className="fas fa-bolt text-yellow-500 text-lg"></i>
//         <h2 className="text-lg font-semibold">การจัดการด่วน</h2>
//       </div>
//       <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
//         {actions.map((action, idx) => {
//           const theme = themeClasses[action.theme] || themeClasses.gray;
//           return (
//             <Link key={idx} to={action.link} className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 hover:shadow transition-shadow">
//               <div className={`w-10 h-10 ${theme.bg} rounded-lg flex items-center justify-center text-white mr-3 flex-shrink-0`}>
//                 <i className={`${action.icon} ${theme.text} text-lg`}></i>
//               </div>
//               <div>
//                 <h3 className="text-sm font-semibold text-gray-900">{action.title}</h3>
//                 <p className="text-xs text-gray-500">{action.description}</p>
//                 <p className={`text-xs ${theme.text} font-medium`}>{action.stats}</p>
//               </div>
//             </Link>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// /**
//  * 4. RecentActivityList Component:
//  * (ดีไซน์เดิมค่อนข้างดีอยู่แล้ว แค่แยกออกมา)
//  */
// const RecentActivityList = ({ activities }) => (
//   <div className="bg-white rounded-xl shadow-lg">
//     <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
//       <i className="fas fa-history text-blue-500 text-lg"></i>
//       <h2 className="text-lg font-semibold">กิจกรรมล่าสุด</h2>
//     </div>
//     <div className="p-6 space-y-4">
//       {activities.map(activity => (
//         <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
//           <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
//             <i className={`${activity.icon} ${activity.color} text-sm`}></i>
//           </div>
//           <div className="flex-1 min-w-0">
//             <p className="text-sm font-medium text-gray-900 truncate">{activity.action}</p>
//             <p className="text-xs text-gray-500">โดย: {activity.user}</p>
//           </div>
//           <div className="text-xs text-gray-400 text-right flex-shrink-0">{activity.time}</div>
//         </div>
//       ))}
//       <div className="text-center mt-3">
//         <Link to="/admin" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
//           ดูกิจกรรมทั้งหมด →
//         </Link>
//       </div>
//     </div>
//   </div>
// );

// /**
//  * 5. SystemStatusGrid Component:
//  * (ดีไซน์เดิมดีอยู่แล้ว แค่แยกออกมา)
//  */
// const SystemStatusGrid = ({ statuses }) => (
//   <div className="bg-white rounded-xl shadow-lg p-6">
//     <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
//       <i className="fas fa-server text-green-500"></i> สถานะระบบ
//     </h2>
//     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
//       {statuses.map((item, idx) => (
//         <div key={idx} className="bg-gray-50 rounded-xl p-4 shadow hover:shadow-md transition-shadow">
//           <div className={`w-16 h-16 bg-${item.color}-100 rounded-full flex items-center justify-center mx-auto mb-3`}>
//             <i className={`fas fa-${item.icon} text-${item.color}-600 text-2xl`}></i>
//           </div>
//           <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
//           <p className={`text-${item.color}-600 text-sm font-medium mb-1`}>{item.status}</p>
//           <p className="text-gray-400 text-xs">{item.info}</p>
//         </div>
//       ))}
//     </div>
//   </div>
// );


// // --- Component หลัก ---

// const AdminDashboard = ({ user, stats, loading }) => {
//   /**
//    * ปรับปรุง State:
//    * รวมค่าจาก props `stats` เข้ามาเป็นค่าเริ่มต้น
//    * ทำให้ `systemStats` เป็นแหล่งข้อมูลเดียว (Single Source of Truth)
//    */
//   const [systemStats, setSystemStats] = useState({
//     totalUsers: 0,
//     activeUsers: 0,
//     totalProducts: 0,
//     totalOrders: stats.orders || 0, // รับค่าจาก props
//     totalRevenue: stats.revenue || 0, // (สมมติว่ามี revenue ใน props)
//     pendingOrders: stats.pendingOrders || 0, // (สมมติว่ามี pendingOrders ใน props)
//   });
//   const [recentActivities, setRecentActivities] = useState([]);

//   // useEffect นี้จะอัปเดต state เมื่อ props `stats` เปลี่ยนแปลง
//   useEffect(() => {
//     setSystemStats(prev => ({
//       ...prev,
//       totalOrders: stats.orders || 0,
//       totalRevenue: stats.revenue || 0,
//       pendingOrders: stats.pendingOrders || 0,
//     }));
//   }, [stats]);

//   // useEffect นี้จะดึงข้อมูลที่ Component นี้ต้องรับผิดชอบเอง (แค่ครั้งเดียว)
//   useEffect(() => {
//     loadAdminStats();
//     loadRecentActivities(); // แยก function เพื่อความชัดเจน
//   }, []);

//   const loadAdminStats = async () => {
//     try {
//       // ใช้ Promise.all เพื่อดึงข้อมูลพร้อมกัน
//       const [usersResponse, productsResponse] = await Promise.all([
//         axios.get('/api/users'),
//         axios.get('/api/products/100') // อาจจะต้องปรับ endpoint นี้ถ้าสินค้ามีเยอะ
//       ]);

//       const totalUsers = usersResponse.data.count || 0;
//       const activeUsers = usersResponse.data.users?.filter(u => u.enabled).length || 0;
//       const totalProducts = productsResponse.data.products?.length || 0;

//       setSystemStats(prev => ({
//         ...prev,
//         totalUsers,
//         activeUsers,
//         totalProducts
//       }));
//     } catch (error) {
//       console.error('Error loading admin stats:', error);
//     }
//   };

//   const loadRecentActivities = () => {
//     // ในอนาคต ส่วนนี้สามารถเปลี่ยนเป็น API call จริงได้
//     setRecentActivities([
//       { id: 1, type: 'user', action: 'ผู้ใช้ใหม่สมัครสมาชิก', user: 'john@example.com', time: '5 นาทีที่แล้ว', icon: 'fas fa-user-plus', color: 'text-green-600' },
//       { id: 2, type: 'order', action: 'คำสั่งซื้อใหม่', user: 'jane@example.com', time: '15 นาทีที่แล้ว', icon: 'fas fa-shopping-cart', color: 'text-blue-600' },
//       { id: 3, type: 'product', action: 'สินค้าใหม่ถูกเพิ่ม', user: 'admin', time: '1 ชั่วโมงที่แล้ว', icon: 'fas fa-box', color: 'text-purple-600' },
//       { id: 4, type: 'user', action: 'ผู้ใช้เข้าสู่ระบบ', user: 'mike@example.com', time: '2 ชั่วโมงที่แล้ว', icon: 'fas fa-sign-in-alt', color: 'text-gray-600' }
//     ]);
//   };

//   /**
//    * ปรับปรุง Data:
//    * เปลี่ยน 'color' เป็น 'theme' เพื่อให้สอดคล้องกับ Components ใหม่
//    */
//   const adminQuickActions = [
//     { title: 'จัดการผู้ใช้', description: `${systemStats.totalUsers} ผู้ใช้ทั้งหมด`, icon: 'fas fa-users', theme: 'blue', link: '/admin', stats: `${systemStats.activeUsers} คนใช้งานอยู่` },
//     { title: 'จัดการสินค้า', description: `${systemStats.totalProducts} สินค้าทั้งหมด`, icon: 'fas fa-box', theme: 'green', link: '/admin', stats: 'เพิ่มสินค้าใหม่' },
//     { title: 'จัดการคำสั่งซื้อ', description: 'ตรวจสอบคำสั่งซื้อ', icon: 'fas fa-receipt', theme: 'purple', link: '/admin', stats: `${systemStats.pendingOrders} รอดำเนินการ` },
//     { title: 'รายงานและสถิติ', description: 'ดูข้อมูลการขาย', icon: 'fas fa-chart-bar', theme: 'orange', link: '/admin', stats: 'วิเคราะห์ข้อมูล' },
//     { title: 'การตั้งค่าระบบ', description: 'จัดการการตั้งค่า', icon: 'fas fa-cog', theme: 'gray', link: '/admin', stats: 'ปรับแต่งระบบ' },
//     { title: 'ความปลอดภัย', description: 'ตรวจสอบความปลอดภัย', icon: 'fas fa-shield-alt', theme: 'red', link: '/admin', stats: 'ระบบปลอดภัย' }
//   ];

//   // Data สำหรับ Stat Cards
//   const statCardsData = [
//     { title: 'ผู้ใช้ทั้งหมด', value: systemStats.totalUsers, sub: `${systemStats.activeUsers} คนใช้งานอยู่`, themeColor: 'blue', icon: 'users' },
//     { title: 'สินค้าทั้งหมด', value: systemStats.totalProducts, sub: 'พร้อมขาย', themeColor: 'green', icon: 'box' },
//     { title: 'คำสั่งซื้อ', value: systemStats.totalOrders, sub: `${systemStats.pendingOrders} รอดำเนินการ`, themeColor: 'purple', icon: 'receipt' },
//     { title: 'รายได้รวม', value: `฿${systemStats.totalRevenue.toLocaleString()}`, sub: 'เดือนนี้', themeColor: 'orange', icon: 'dollar-sign' }
//   ];

//   // Data สำหรับ System Status
//   const systemStatusData = [
//     { title: 'เซิร์ฟเวอร์', status: 'ทำงานปกติ', color: 'green', icon: 'check-circle', info: 'Uptime: 99.9%' },
//     { title: 'ฐานข้อมูล', status: 'เชื่อมต่อแล้ว', color: 'blue', icon: 'database', info: 'Response: 15ms' },
//     { title: 'ความปลอดภัย', status: 'ปลอดภัย', color: 'purple', icon: 'shield-alt', info: 'SSL Active' }
//   ];

//   // Loading State
//   if (loading) {
//     return (
//       <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
//         <div className="flex items-center justify-center h-64">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
//         </div>
//       </div>
//     );
//   }

//   // --- Render ส่วนหลัก ---
//   // โค้ดส่วนนี้จะสะอาดขึ้นมาก เพราะเรียกใช้ Components ย่อย
//   return (
//     <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">

//       {/* 1. Header */}
//       <AdminHeader user={user} totalUsers={systemStats.totalUsers} />

//       {/* 2. Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {statCardsData.map((card, idx) => (
//           <StatCard
//             key={idx}
//             title={card.title}
//             value={card.value}
//             sub={card.sub}
//             icon={card.icon}
//             themeColor={card.themeColor}
//           />
//         ))}
//       </div>

//       {/* 3. Quick Actions + Recent Activities */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//         <QuickActionsGrid actions={adminQuickActions} />
//         <RecentActivityList activities={recentActivities} />
//       </div>

//       {/* 4. System Status */}
//       <SystemStatusGrid statuses={systemStatusData} />

//     </div>
//   );
// };

// export default AdminDashboard;
