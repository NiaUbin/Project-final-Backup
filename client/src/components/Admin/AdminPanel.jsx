import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import ProductManagement from './ProductManagement';
import TestAdminFeatures from './TestAdminFeatures';
import PaymentApproval from './PaymentApproval';
import OrderManagement from './OrderManagement';
import Analytics from './Analytics';
import ErrorBoundary from './ErrorBoundary';
import StoreApproval from './StoreApproval';
import CategoryManagement from './CategoryManagement';
import UserManagement from './UserManagement';
import LogoutModal from '../Common/LogoutModal';

const AdminPanel = () => {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [activeTab]);

  const menuItems = [
    { id: 'analytics', label: 'แดชบอร์ด', icon: 'fas fa-chart-line' },
    { id: 'users', label: 'ผู้ใช้งาน', icon: 'fas fa-users' },
    { id: 'store_approval', label: 'อนุมัติร้านค้า', icon: 'fas fa-store' },
    { id: 'products', label: 'สินค้า', icon: 'fas fa-box' },
    { id: 'categories', label: 'หมวดหมู่', icon: 'fas fa-folder' },
    { id: 'orders', label: 'คำสั่งซื้อ', icon: 'fas fa-shopping-cart' },
    { id: 'payments', label: 'การชำระเงิน', icon: 'fas fa-credit-card' },
    { id: 'test', label: 'ทดสอบระบบ', icon: 'fas fa-cog' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'users': return <UserManagement />;
      case 'store_approval': return <StoreApproval />;
      case 'products': return <ProductManagement />;
      case 'categories': return <CategoryManagement />;
      case 'orders': return <OrderManagement />;
      case 'analytics': return <Analytics />;
      case 'payments': return <PaymentApproval />;
      case 'test': return <TestAdminFeatures />;
      default: return <Analytics />;
    }
  };

  const activeMenu = menuItems.find(item => item.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed */}
      <aside className={`
        fixed top-0 left-0 h-screen w-56 bg-slate-900 border-r border-slate-800 z-50 
        transform transition-transform duration-200
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-14 flex items-center px-4 border-b border-slate-800 flex-shrink-0">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <i className="fas fa-user-shield text-white text-sm"></i>
              </div>
              <div>
                <span className="font-bold text-white tracking-wide text-lg">BoxiFY</span>
                <span className="text-[11px] text-indigo-400 block -mt-1 font-medium tracking-wider">ผู้ดูแลระบบ (ADMIN)</span>
              </div>
            </Link>
          </div>

          {/* Menu - scrollable if needed */}
          <nav className="flex-1 p-3 overflow-y-auto">
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">เมนูหลัก</p>
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group ${
                      activeTab === item.id
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <i className={`${item.icon} w-5 text-center text-xs ${activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}></i>
                    <span>{item.label}</span>
                    {activeTab === item.id && <i className="fas fa-chevron-right ml-auto text-[10px] opacity-50"></i>}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* User & Logout - fixed at bottom */}
          <div className="p-3 border-t border-slate-800 flex-shrink-0 bg-slate-900">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-8 h-8 bg-slate-700 text-indigo-400 rounded-lg flex items-center justify-center font-bold text-xs ring-2 ring-slate-800">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email || 'admin@boxify.com'}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-2 py-2 text-xs text-slate-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/50 border border-transparent rounded-lg transition-all"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content - with left margin on desktop */}
      <main className="lg:ml-56 min-h-screen bg-slate-100">
        {/* Header - sticky */}
        <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <i className="fas fa-bars"></i>
            </button>
            <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              <span className="w-1 h-4 bg-indigo-500 rounded-full inline-block"></span>
              {activeMenu?.label}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700/50">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] text-slate-300 font-medium">System Online</span>
            </div>
            
            <div className="h-8 w-px bg-slate-700 mx-1 hidden sm:block"></div>

            <Link 
              to="/" 
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-indigo-600 rounded-lg transition-all border border-transparent hover:border-indigo-500/30"
            >
              <i className="fas fa-external-link-alt"></i>
              <span>ดูหน้าเว็บไซต์</span>
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-6">
          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      <LogoutModal 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
      />
    </div>
  );
};

export default AdminPanel;


