import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Components
import Navbar from './components/Navbar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import OAuthCallback from './components/Auth/OAuthCallback';
import Dashboard from './components/Dashboard/Dashboard';
import UserDashboard from './components/Dashboard/UserDashboard';
import AdminPanel from './components/Admin/AdminPanel';
import Products from './components/Products/Products';
import DiscountProducts from './components/Products/DiscountProducts';
import Cart from './components/Cart/Cart';
import Orders from './components/Orders/Orders';
import Profile from './components/Profile/Profile';
import RoleGuide from './components/RoleGuide/RoleGuide';
import PaymentCheckout from './components/Payment/PaymentCheckout';
import Footer from './components/Footer';
import Contact from './components/Contect/Contect';
import ProductDetail from './components/Products/ProductDetail';
import SellerOnboarding from './components/Seller/SellerOnboarding';
import StoreList from './components/Seller/StoreList';
import StoreDetail from './components/Seller/StoreDetail';
import SellerAddProduct from './components/Seller/SellerAddProduct';
import SellerDashboard from './components/Seller/SellerDashboard';
import StoreOrderManagement from './components/Seller/StoreOrderManagement';
import ScrollToTop from './components/Common/ScrollToTop';
import NewProductNotifications from './components/Notifications/NewProductNotifications';
// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import HelpPageShopeeStyle from './components/Help/help';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const AppContent = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <ScrollToTop />
      <Navbar />
      <main className="pt-16">
        <Routes>
          <Route 
            path="/" 
            element={<UserDashboard user={null} stats={{}} loading={false} />} 
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          
          {/* Public Routes */}
          <Route path="/products" element={<Products />} />
          <Route path="/discount-products" element={<DiscountProducts />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/help" element={<HelpPageShopeeStyle />} />
          <Route path="/notifications" element={<NewProductNotifications />} />
          {/* Protected Routes */}
          <Route path="/stores" element={<StoreList />} />
          <Route path="/store/:id" element={<StoreDetail />} />
          <Route 
            path="/become-seller" 
            element={
              <ProtectedRoute>
                <SellerOnboarding />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/seller" 
            element={
              <ProtectedRoute>
                <SellerOnboarding />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/seller/dashboard" 
            element={
              <ProtectedRoute>
                <SellerDashboard />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/seller/products/new" 
            element={
              <ProtectedRoute>
                <SellerAddProduct />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/seller/orders" 
            element={
              <ProtectedRoute>
                <StoreOrderManagement />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/cart" element={<Cart />} />
          
          <Route 
            path="/orders" 
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/roles" 
            element={
              <ProtectedRoute>
                <RoleGuide />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/payment/:orderId" 
            element={
              <ProtectedRoute>
                <PaymentCheckout />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <Router future={{ v7_relativeSplatPath: true }}>
      <NotificationProvider>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;
