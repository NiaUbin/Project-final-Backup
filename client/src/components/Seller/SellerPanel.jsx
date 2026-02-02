import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import ProductForm from "../Admin/ProductForm";
import CategoryManagement from "../Admin/CategoryManagement";
import LogoutModal from "../Common/LogoutModal";

const SellerPanel = () => {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Store State
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", description: "", logo: "" });

  // Products State
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Sales State
  const [salesData, setSalesData] = useState(null);
  const [loadingSales, setLoadingSales] = useState(false);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [viewingSlip, setViewingSlip] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(new Set());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [activeTab]);

  const menuItems = [
    { id: "dashboard", label: "ภาพรวมร้านค้า", icon: "fas fa-chart-line" },
    { id: "products", label: "สินค้า", icon: "fas fa-box" },
    { id: "orders", label: "คำสั่งซื้อ", icon: "fas fa-shopping-bag" },
    { id: "sales", label: "รายงานการขาย", icon: "fas fa-chart-bar" },
    { id: "categories", label: "หมวดหมู่", icon: "fas fa-tags" },
    { id: "settings", label: "ตั้งค่าร้านค้า", icon: "fas fa-cog" },
  ];

  // Load Store
  const loadStore = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/my/store");
      setStore(data.store);
      if (data.store) {
        setForm({
          name: data.store.name || "",
          description: data.store.description || "",
          logo: data.store.logo || "",
        });
      }
    } catch (error) {
      console.error("Load store error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStore();
  }, [loadStore]);

  // Load Sales
  const loadSales = async () => {
    setLoadingSales(true);
    try {
      const { data } = await axios.get("/api/my/store/sales");
      setSalesData(data);
    } catch (e) {
      toast.error(e.response?.data?.message || "ไม่สามารถโหลดข้อมูลการขายได้");
      setSalesData(null);
    } finally {
      setLoadingSales(false);
    }
  };

  // Load Orders
  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (selectedOrderStatus !== "all") {
        params.append("status", selectedOrderStatus);
      }
      const response = await axios.get(`/api/my/store/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error("Load orders error:", error);
      toast.error(
        error.response?.data?.message || "เกิดข้อผิดพลาดในการโหลดคำสั่งซื้อ",
      );
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [selectedOrderStatus]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeTab === "sales" && store) {
      loadSales();
    } else if (activeTab === "orders" && store) {
      loadOrders();
    }
  }, [activeTab, store, selectedOrderStatus, loadOrders]);

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingStatus((prev) => new Set(prev).add(orderId));
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/my/store/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("อัพเดตสถานะสำเร็จ");
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, oderStatus: newStatus } : order,
        ),
      );
    } catch (error) {
      console.error("Update status error:", error);
      toast.error(
        error.response?.data?.message || "เกิดข้อผิดพลาดในการอัพเดตสถานะ",
      );
    } finally {
      setUpdatingStatus((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // Save Store
  const saveStore = async (e) => {
    e.preventDefault();
    try {
      await axios.put("/api/my/store", form);
      toast.success("บันทึกข้อมูลร้านค้าสำเร็จ");
      loadStore();
    } catch (e) {
      toast.error(e.response?.data?.message || "บันทึกล้มเหลว");
    }
  };

  // Remove Product
  const removeProduct = async (id) => {
    if (!window.confirm("ยืนยันลบสินค้า?")) return;
    try {
      await axios.delete(`/api/seller/product/${id}`);
      toast.success("ลบสินค้าสำเร็จ");
      loadStore();
    } catch (e) {
      toast.error("ลบสินค้าไม่สำเร็จ");
    }
  };

  // Helper functions
  const getStatusBadge = (status) => {
    const statusMap = {
      "Not Process": {
        label: "รอดำเนินการ",
        color: "bg-yellow-100 text-yellow-700 border-yellow-200",
        icon: "fas fa-clock",
      },
      Processing: {
        label: "กำลังดำเนินการ",
        color: "bg-blue-100 text-blue-700 border-blue-200",
        icon: "fas fa-spinner",
      },
      Shipped: {
        label: "จัดส่งแล้ว",
        color: "bg-purple-100 text-purple-700 border-purple-200",
        icon: "fas fa-truck",
      },
      Delivered: {
        label: "จัดส่งสำเร็จ",
        color: "bg-green-100 text-green-700 border-green-200",
        icon: "fas fa-check-circle",
      },
      Cancelled: {
        label: "ยกเลิก",
        color: "bg-red-100 text-red-700 border-red-200",
        icon: "fas fa-times-circle",
      },
    };
    const statusInfo = statusMap[status] || {
      label: status,
      color: "bg-gray-100 text-gray-700 border-gray-200",
      icon: "fas fa-question",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 border ${statusInfo.color}`}
      >
        <i className={statusInfo.icon}></i>
        {statusInfo.label}
      </span>
    );
  };

  const getPaymentMethodBadge = (method) => {
    const methodMap = {
      cash: {
        label: "เก็บเงินปลายทาง",
        icon: "fas fa-money-bill-wave",
        color: "bg-green-50 text-green-700",
      },
      credit_card: {
        label: "บัตรเครดิต/เดบิต",
        icon: "fas fa-credit-card",
        color: "bg-blue-50 text-blue-700",
      },
      qr_code: {
        label: "QR Code",
        icon: "fas fa-qrcode",
        color: "bg-purple-50 text-purple-700",
      },
    };
    const methodInfo = methodMap[method] || {
      label: method,
      icon: "fas fa-wallet",
      color: "bg-gray-50 text-gray-700",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${methodInfo.color}`}
      >
        <i className={methodInfo.icon}></i>
        {methodInfo.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 border-4 border-orange-100 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-[#ee4d2d] rounded-full animate-spin"></div>
          </div>
          <p className="text-[#ee4d2d] font-medium">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // No Store
  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md bg-white rounded-lg shadow-lg p-8">
          <div className="w-20 h-20 bg-[#fef0ed] rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-store text-[#ee4d2d] text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ยังไม่มีร้านค้า
          </h2>
          <p className="text-gray-500 mb-6">
            สร้างร้านค้าของคุณเพื่อเริ่มขายสินค้า
          </p>
          <Link
            to="/become-seller"
            className="inline-block px-6 py-3 bg-[#ee4d2d] text-white rounded-lg hover:bg-[#d73211] transition-all font-medium"
          >
            <i className="fas fa-plus mr-2"></i>สร้างร้านค้า
          </Link>
        </div>
      </div>
    );
  }

  // Suspended Store
  if (store.status === "suspended") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-2xl overflow-hidden relative border border-red-100">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-red-400 to-orange-400"></div>
          <div className="p-10 text-center">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <i className="fas fa-store-slash text-red-500 text-4xl"></i>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              ร้านค้าถูกระงับการใช้งาน
            </h2>
            <p className="text-gray-500 mb-8">
              ร้านค้า{" "}
              <span className="font-semibold text-gray-700">
                "{store.name}"
              </span>{" "}
              ของคุณถูกระงับชั่วคราว
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition-all font-medium"
              >
                <i className="fas fa-headset mr-2"></i>ติดต่อเจ้าหน้าที่
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate Stats
  const totalProducts = store.products?.length || 0;
  const inStockProducts =
    store.products?.filter((p) => p.quantity > 0).length || 0;
  const outOfStockProducts = totalProducts - inStockProducts;
  const totalSold =
    store.products?.reduce((sum, p) => sum + (p.sold || 0), 0) || 0;
  const totalRevenue =
    store.products?.reduce((sum, p) => sum + p.price * (p.sold || 0), 0) || 0;

  const activeMenu = menuItems.find((item) => item.id === activeTab);

  // Render Content
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboard();
      case "products":
        return renderProducts();
      case "orders":
        return renderOrders();
      case "sales":
        return renderSales();
      case "categories":
        return <CategoryManagement />;
      case "settings":
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  // Dashboard Tab
  // Dashboard Tab
  // Dashboard Tab
  const renderDashboard = () => (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 hover:shadow-md transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">สินค้าทั้งหมด</p>
              <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{totalProducts}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">รายการ</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fas fa-box text-blue-500 text-lg"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 hover:shadow-md transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">พร้อมขาย</p>
              <h3 className="text-xl font-bold text-emerald-600">{inStockProducts}</h3>
              <p className="text-[10px] text-emerald-600/70 mt-0.5 flex items-center gap-1">
                <i className="fas fa-check-circle text-[9px]"></i>
                สต็อกพร้อม
              </p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fas fa-check-circle text-emerald-500 text-lg"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 hover:shadow-md transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">สินค้าหมด</p>
              <h3 className="text-xl font-bold text-red-600">{outOfStockProducts}</h3>
               <p className="text-[10px] text-red-600/70 mt-0.5 flex items-center gap-1">
                <i className="fas fa-exclamation-circle text-[9px]"></i>
                ต้องเติมของ
              </p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fas fa-times-circle text-red-500 text-lg"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 hover:shadow-md transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">ขายแล้ว</p>
              <h3 className="text-xl font-bold text-orange-600">{totalSold}</h3>
              <p className="text-[10px] text-orange-600/70 mt-0.5">ชิ้น</p>
            </div>
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fas fa-shopping-cart text-orange-500 text-lg"></i>
            </div>
          </div>
        </div>

        <div className="col-span-1 sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg shadow-indigo-200 p-4 text-white relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-xs font-medium text-indigo-100 mb-1">รายได้รวม</p>
              <h3 className="text-xl font-bold text-white tracking-tight">฿{totalRevenue.toLocaleString()}</h3>
              <p className="text-[10px] text-indigo-200 mt-0.5">รายได้ทั้งหมด</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <i className="fas fa-coins text-white text-lg"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Bestseller Section */}
      {store.products?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-50 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-base">🔥</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">สินค้าขายดี Top 3</h3>
              <p className="text-[10px] text-slate-500">สินค้ายอดนิยมของคุณ</p>
            </div>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[...store.products]
                .sort((a, b) => (b.sold || 0) - (a.sold || 0))
                .slice(0, 3)
                .map((p, index) => {
                  const rankIcons = ["🥇", "🥈", "🥉"];
                  const rankStyles = [
                    "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 hover:shadow-yellow-100", 
                    "bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200 hover:shadow-slate-100", 
                    "bg-gradient-to-br from-orange-50 to-rose-50 border-orange-200 hover:shadow-orange-100"
                  ];
                  
                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-lg border ${rankStyles[index]} flex items-center gap-3 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 group`}
                    >
                      <div className="text-2xl filter drop-shadow-sm group-hover:scale-110 transition-transform">{rankIcons[index]}</div>
                      
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white shadow-sm">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0].url}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                             <i className="fas fa-image text-xs"></i>
                          </div>
                        )}
                        <div className="absolute top-0 right-0 bg-black/50 text-white text-[8px] px-1 py-0.5 rounded-bl-sm font-bold">
                           #{index + 1}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate mb-0.5">
                          {p.title}
                        </p>
                        <div className="flex items-center gap-1.5">
                           <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                             {p.sold || 0} ขายแล้ว
                           </span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">฿{p.price.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Products Tab
  const renderProducts = () => (
    <div className="space-y-5">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <h2 className="font-bold text-slate-800 text-base">สินค้าของฉัน</h2>
            <p className="text-xs text-slate-500 mt-0.5">สินค้าทั้งหมด ({store.products?.length || 0})</p>
          </div>
          <button
            onClick={() => { setEditingProduct(null); setShowProductForm(true); }}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-md hover:shadow-orange-200 transition-all text-xs font-medium flex items-center gap-1.5 transform hover:-translate-y-0.5"
          >
            <i className="fas fa-plus"></i>
            เพิ่มสินค้าใหม่
          </button>
        </div>

        <div className="p-4 bg-slate-50/50 min-h-[400px]">
          {store.products?.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-dashed border-slate-200">
                <i className="fas fa-box-open text-slate-300 text-2xl"></i>
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-2">ยังไม่มีสินค้าในร้าน</h3>
              <p className="text-slate-500 mb-6 max-w-sm text-xs">เริ่มสร้างสินค้าชิ้นแรกของคุณเพื่อเปิดร้านค้าอย่างสมบูรณ์</p>
              <button
                onClick={() => setShowProductForm(true)}
                className="px-5 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-all text-xs font-medium shadow-md shadow-slate-200"
              >
                <i className="fas fa-magic mr-2"></i>เพิ่มสินค้าแรก
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {store.products?.map(p => (
                <div key={p.id} className="group bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 relative">
                  {/* Image Area */}
                  <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                    {p.images?.[0] ? (
                      <img src={p.images[0].url} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                        <i className="fas fa-image text-2xl"></i>
                      </div>
                    )}
                    
                    {/* Floating Status Badge */}
                    <div className="absolute top-2 right-2 z-10">
                      <span className={`px-2 py-0.5 text-[9px] font-bold text-white rounded shadow-sm backdrop-blur-md
                        ${p.quantity > 10 ? 'bg-emerald-500/90' : p.quantity > 0 ? 'bg-amber-500/90' : 'bg-red-500/90'}`}>
                        {p.quantity > 0 ? `เหลือ ${p.quantity}` : 'สินค้าหมด'}
                      </span>
                    </div>

                    {/* Quick Actions Overlay (Desktop) */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                        <Link to={`/product/${p.id}`} className="w-8 h-8 bg-white text-slate-700 rounded-lg flex items-center justify-center hover:bg-orange-500 hover:text-white transition-colors shadow-sm" title="ดูสินค้า">
                          <i className="fas fa-eye text-[10px]"></i>
                        </Link>
                        <button onClick={(e) => { e.preventDefault(); setEditingProduct(p); setShowProductForm(true); }} className="w-8 h-8 bg-white text-slate-700 rounded-lg flex items-center justify-center hover:bg-blue-500 hover:text-white transition-colors shadow-sm" title="แก้ไข">
                          <i className="fas fa-edit text-[10px]"></i>
                        </button>
                        <button onClick={(e) => { e.preventDefault(); removeProduct(p.id); }} className="w-8 h-8 bg-white text-slate-700 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors shadow-sm" title="ลบ">
                          <i className="fas fa-trash text-[10px]"></i>
                        </button>
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="mb-2">
                      <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-[2px] rounded-full mb-1.5 inline-block">
                         {p.category?.name || 'ทั่วไป'}
                      </span>
                      <h3 className="text-xs font-bold text-slate-800 line-clamp-2 h-8 leading-snug" title={p.title}>{p.title}</h3>
                    </div>
                    
                    <div className="flex items-end justify-between">
                      <div>
                         <p className="text-[9px] text-slate-400 mb-0.5">ราคาขาย</p>
                         <p className="text-sm font-bold text-slate-800">฿{p.price.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] text-slate-400 mb-0.5">ยอดขาย</p>
                         <p className="text-[10px] font-bold text-orange-600">{p.sold || 0} ชิ้น</p>
                      </div>
                    </div>
                    
                    {/* Mobile Actions */}
                    <div className="mt-3 pt-2 border-t border-slate-50 flex items-center justify-between lg:hidden">
                       <button onClick={() => { setEditingProduct(p); setShowProductForm(true); }} className="flex-1 text-center py-1 text-[10px] font-medium text-slate-600 bg-slate-50 rounded mx-0.5">
                          แก้ไข
                       </button>
                       <button onClick={() => removeProduct(p.id)} className="flex-1 text-center py-1 text-[10px] font-medium text-red-600 bg-red-50 rounded mx-0.5">
                          ลบ
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Orders Tab
  const renderOrders = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
              <i className="fas fa-shopping-bag text-orange-500"></i>
              จัดการคำสั่งซื้อ
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">อัพเดตสถานะและจัดการการจัดส่งสินค้า</p>
          </div>
          <button 
            onClick={loadOrders} 
            className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-xs font-medium flex items-center justify-center gap-1.5 transition-all hover:shadow-sm"
          >
            <i className={`fas fa-sync-alt ${loadingOrders ? 'animate-spin' : ''}`}></i>
            <span>รีเฟรชข้อมูล</span>
          </button>
        </div>

        {/* Status Filter */}
        <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {[
              { value: 'all', label: 'ทั้งหมด', icon: 'fas fa-list' },
              { value: 'Not Process', label: 'รอดำเนินการ', icon: 'fas fa-clock' },
              { value: 'Processing', label: 'กำลังดำเนินการ', icon: 'fas fa-cog' },
              { value: 'Shipped', label: 'จัดส่งแล้ว', icon: 'fas fa-truck' },
              { value: 'Delivered', label: 'สำเร็จ', icon: 'fas fa-check-circle' },
              { value: 'Cancelled', label: 'ยกเลิก', icon: 'fas fa-times-circle' },
            ].map(status => (
              <button
                key={status.value}
                onClick={() => setSelectedOrderStatus(status.value)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${selectedOrderStatus === status.value
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-orange-200 hover:text-orange-500 hover:bg-orange-50'
                }`}
              >
                <i className={status.icon}></i>
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="p-4 bg-slate-50 min-h-[400px]">
          {loadingOrders ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-3"></div>
              <p className="text-slate-500 text-xs font-medium">กำลังโหลดรายการคำสั่งซื้อ...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 border border-slate-100">
                <i className="fas fa-inbox text-slate-300 text-2xl"></i>
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-0.5">ไม่พบคำสั่งซื้อ</h3>
              <p className="text-slate-500 text-xs">ยังไม่มีรายการคำสั่งซื้อในสถานะนี้</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div key={order.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Order Header */}
                  <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
                       onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px] border border-slate-200">
                        #{order.id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-slate-800 text-sm">คำสั่งซื้อ #{order.id}</span>
                          {getStatusBadge(order.oderStatus)}
                        </div>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <i className="far fa-clock"></i>
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-4 pl-11 sm:pl-0">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 mb-0.5">ยอดสุทธิ</p>
                        <p className="text-sm font-bold text-orange-600">฿{(order.storeOrderTotal || order.cartTotal)?.toLocaleString()}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 ${expandedOrder === order.id ? 'bg-orange-100 text-orange-600 rotate-180' : 'bg-slate-100 text-slate-400'}`}>
                        <i className="fas fa-chevron-down text-[10px]"></i>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {expandedOrder === order.id && (
                    <div className="border-t border-slate-100 bg-slate-50/30">
                      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column: Products */}
                        <div className="space-y-4">
                            <div>
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <i className="fas fa-box"></i> รายการสินค้า
                              </h4>
                              <div className="space-y-2">
                                {order.storeProducts?.map((item, idx) => (
                                  <div key={idx} className="flex items-start gap-3 p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                                    <div className="w-12 h-12 bg-slate-100 rounded-md overflow-hidden flex-shrink-0 border border-slate-200">
                                      {item.product?.images?.[0] ? (
                                        <img src={item.product.images[0].url || item.product.images[0].secure_url} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                          <i className="fas fa-image text-[10px]"></i>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0 py-0.5">
                                      <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug mb-0.5">{item.product?.title || 'สินค้าไม่ระบุชื่อ'}</p>
                                      <p className="text-[10px] text-slate-500">จำนวน: <span className="font-semibold text-slate-700">{item.count}</span> ชิ้น</p>
                                    </div>
                                    <div className="text-right py-0.5">
                                      <p className="text-xs font-bold text-slate-700">฿{(item.price * item.count).toLocaleString()}</p>
                                      <p className="text-[9px] text-slate-400">฿{item.price.toLocaleString()}/ชิ้น</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                        </div>

                        {/* Right Column: Info & Actions */}
                        <div className="space-y-4">
                            <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <i className="fas fa-user"></i> ข้อมูลการจัดส่ง
                              </h4>
                              <div className="space-y-2 text-xs">
                                <div className="flex gap-2">
                                  <span className="text-slate-400 min-w-[50px]">ลูกค้า:</span>
                                  <span className="font-medium text-slate-700">{order.orderedBy?.name || 'ไม่ระบุ'}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-slate-400 min-w-[50px]">ติดต่อ:</span>
                                  <div className="flex flex-col">
                                    <span className="text-slate-700">{order.orderedBy?.phone || '-'}</span>
                                    <span className="text-slate-500 text-[10px]">{order.orderedBy?.email}</span>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-slate-400 min-w-[50px]">ที่อยู่:</span>
                                  <span className="text-slate-700 leading-relaxed">{order.shippingAddress || '-'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Payment Logic */}
                             {order.payments && order.payments.length > 0 && (
                                <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <i className="fas fa-wallet"></i> การชำระเงิน
                                  </h4>
                                  {order.payments.map((payment, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                         {getPaymentMethodBadge(payment.method)}
                                         {payment.paymentSlipUrl && (
                                           <button onClick={() => setViewingSlip(payment.paymentSlipUrl)} className="text-[10px] text-blue-600 hover:text-blue-800 underline ml-2">
                                             ดูสลีป
                                           </button>
                                         )}
                                      </div>
                                      <div className="text-right">
                                        <p className={`text-[10px] font-bold ${payment.status === 'completed' ? 'text-emerald-600' : 'text-amber-500'}`}>
                                           {payment.status === 'completed' ? 'ชำระแล้ว' : 'รอชำระเงิน'}
                                        </p>
                                        <p className="text-xs font-bold text-slate-800">฿{payment.amount?.toLocaleString()}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                             )}

                            {/* Actions */}
                            <div>
                               <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">อัพเดตสถานะ</h4>
                               <div className="flex flex-wrap gap-1.5">
                                 {['Not Process', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                                   order.oderStatus !== status && (
                                     <button
                                       key={status}
                                       onClick={() => {
                                         if (status === 'Cancelled' && !window.confirm('ยืนยันยกเลิกคำสั่งซื้อ?')) return;
                                         handleUpdateOrderStatus(order.id, status);
                                       }}
                                       disabled={updatingStatus.has(order.id)}
                                       className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all ${
                                          status === 'Cancelled' ? 'border-red-200 text-red-600 hover:bg-red-50' :
                                          status === 'Delivered' ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' :
                                          status === 'Shipped' ? 'border-indigo-200 text-indigo-600 hover:bg-indigo-50' :
                                          'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-orange-600'
                                       }`}
                                     >
                                       {status === 'Not Process' && 'ตั้งเป็นรอดำเนินการ'}
                                       {status === 'Processing' && 'รับออเดอร์ (Processing)'}
                                       {status === 'Shipped' && 'จัดส่งแล้ว (Shipped)'}
                                       {status === 'Delivered' && 'สำเร็จ (Delivered)'}
                                       {status === 'Cancelled' && 'ยกเลิก (Cancel)'}
                                     </button>
                                   )
                                 ))}
                               </div>
                            </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Sales Tab
  const renderSales = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
            <i className="fas fa-chart-pie text-orange-500"></i>
            รายงานการขาย
          </h2>
          <div className="text-xs text-slate-500">
             สรุปยอดขายทั้งหมด
          </div>
        </div>

        {loadingSales ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500 font-medium">กำลังคำนวณยอดขาย...</p>
          </div>
        ) : salesData && salesData.summary ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                  <p className="text-xs font-medium text-slate-500 mb-0.5">ยอดขายรวม</p>
                  <p className="text-2xl font-bold text-slate-800 tracking-tight">฿{salesData.summary.totalRevenue?.toLocaleString() || 0}</p>
                </div>
                <div className="mt-3 flex items-center text-[10px] font-medium text-blue-600 bg-blue-50 w-fit px-1.5 py-0.5 rounded-lg">
                   <i className="fas fa-arrow-up mr-1"></i> รายได้สะสม
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                  <p className="text-xs font-medium text-slate-500 mb-0.5">จำนวนออเดอร์</p>
                  <p className="text-2xl font-bold text-slate-800 tracking-tight">{salesData.summary.totalOrders || 0}</p>
                </div>
                <div className="mt-3 flex items-center text-[10px] font-medium text-emerald-600 bg-emerald-50 w-fit px-1.5 py-0.5 rounded-lg">
                   <i className="fas fa-shopping-bag mr-1"></i> รายการสั่งซื้อ
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-bl-full transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                  <p className="text-xs font-medium text-slate-500 mb-0.5">จำนวนสินค้าที่ขายได้</p>
                  <p className="text-2xl font-bold text-slate-800 tracking-tight">{salesData.summary.totalQuantity || 0} <span className="text-base font-normal text-slate-400">ชิ้น</span></p>
                </div>
                <div className="mt-3 flex items-center text-[10px] font-medium text-purple-600 bg-purple-50 w-fit px-1.5 py-0.5 rounded-lg">
                   <i className="fas fa-box-open mr-1"></i> สินค้าที่ออก
                </div>
              </div>
            </div>

            {/* Sales Details Table */}
            <div>
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-1.5 text-sm">
                 <i className="fas fa-list-ul text-slate-400 text-xs"></i>
                 รายละเอียดสินค้าขายดี
              </h3>
              <div className="overflow-hidden rounded-lg border border-slate-100 bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold">สินค้า</th>
                      <th className="py-3 px-4 font-semibold text-center">ราคาขาย</th>
                      <th className="py-3 px-4 font-semibold text-center">ขายได้ (ชิ้น)</th>
                      <th className="py-3 px-4 font-semibold text-right">ยอดรวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {salesData.sales?.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${index < 3 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                              {index + 1}
                            </span>
                            <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                              {item.product.images && item.product.images[0] ? (
                                <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <i className="fas fa-image text-[10px]"></i>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]" title={item.product.title}>{item.product.title}</p>
                              <p className="text-[10px] text-slate-400">{item.product.category?.name || 'อื่นๆ'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-xs font-medium text-slate-600">฿{item.product.price.toLocaleString()}</td>
                        <td className="py-3 px-4 text-center">
                           <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">{item.totalQuantity}</span>
                        </td>
                        <td className="py-3 px-4 text-right text-xs font-bold text-emerald-600">฿{item.totalRevenue.toLocaleString()}</td>
                      </tr>
                    ))}
                    {(!salesData.sales || salesData.sales.length === 0) && (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-xs text-slate-400">
                          <div className="flex flex-col items-center">
                            <i className="far fa-file-alt text-xl mb-1.5 opacity-50"></i>
                             ยังไม่มีข้อมูลการขาย
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
           <div className="text-center py-12 flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                 <i className="fas fa-chart-area text-slate-300 text-xl"></i>
              </div>
              <p className="text-slate-500 font-medium text-xs">ไม่มีข้อมูลการขายที่จะแสดง</p>
           </div>
        )}
      </div>
    </div>
  );

  // Settings Tab
  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 text-lg mb-6">
          ตั้งค่าร้านค้า
        </h2>

        {/* Store Info */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
          <div className="w-16 h-16 bg-[#ee4d2d] rounded-xl flex items-center justify-center overflow-hidden">
            {store.logo ? (
              <img
                src={store.logo}
                alt={store.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <i className="fas fa-store text-white text-2xl"></i>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{store.name}</h3>
            <p className="text-sm text-gray-500">
              {store.description || "ไม่มีคำอธิบาย"}
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={saveStore} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อร้าน *
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="ชื่อร้านค้า"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                โลโก้ (URL)
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="https://..."
                value={form.logo}
                onChange={(e) => setForm({ ...form, logo: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              คำอธิบายร้าน
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows={3}
              placeholder="รายละเอียดร้านค้า..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            ></textarea>
          </div>
          <div className="flex justify-end gap-3">
            <Link
              to={`/store/${store.id}`}
              className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium transition-all shadow-sm"
            >
              <i className="fas fa-eye mr-2 text-gray-400"></i>ดูหน้าร้าน
            </Link>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all text-sm font-medium transform hover:-translate-y-0.5"
            >
              <i className="fas fa-save mr-2"></i>บันทึกการเปลี่ยนแปลง
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Modern & Floating feel on desktop */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 shadow-xl lg:shadow-slate-200/50
        transform transition-all duration-300 ease-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="h-full flex flex-col">
          {/* Logo Area */}
          <div className="h-20 flex items-center px-6 border-b border-slate-50">
            <Link
              to="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 ring-2 ring-orange-50">
                <i className="fas fa-store text-white text-lg"></i>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-800 text-xl tracking-tight leading-none">
                  BoxiFY
                </span>
                <span className="text-[10px] uppercase font-bold text-orange-600 tracking-widest mt-1">
                  Seller Centre
                </span>
              </div>
            </Link>
          </div>

          {/* Store Profile Card */}
          <div className="px-4 py-6">
            <div className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110"></div>

              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 bg-white rounded-xl shadow-md p-1 ring-1 ring-slate-100">
                  <div className="w-full h-full rounded-lg overflow-hidden relative bg-slate-100">
                    {store.logo ? (
                      <img
                        src={store.logo}
                        alt={store.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-orange-50 text-orange-300">
                        <i className="fas fa-store text-xl"></i>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 text-sm truncate">
                    {store.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs text-slate-500 font-medium">
                      ออนไลน์
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Navigation */}
          <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar-hide space-y-1">
            <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              เมนูหลัก
            </p>
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group
                        ${
                          isActive
                            ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-200 translate-x-1"
                            : "text-slate-500 hover:bg-orange-50 hover:text-orange-600 hover:translate-x-1"
                        }
                      `}
                    >
                      <i
                        className={`${item.icon} w-5 text-center transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-orange-500"}`}
                      ></i>
                      <span>{item.label}</span>
                      {isActive && (
                        <i className="fas fa-chevron-right ml-auto text-xs opacity-50"></i>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Profile Footer */}
          <div className="p-4 mt-auto border-t border-slate-50 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-9 h-9 bg-white p-0.5 rounded-full shadow-sm ring-1 ring-slate-200">
                <img
                  src={
                    user?.picture ||
                    "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  }
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-700 truncate">
                  {user?.name || "Seller"}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-red-500 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-100 rounded-lg transition-all"
            >
              <i className="fas fa-sign-out-alt"></i>
              ออกจากระบบ
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:ml-64 min-h-screen relative transition-all duration-300">
        {/* Header - Sticky & Blurred */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between transition-all">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-xl transition-colors bg-white shadow-sm border border-slate-100"
            >
              <i className="fas fa-bars"></i>
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-3 capitalize">
                {activeMenu?.label}
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block mt-0.5">
                จัดการข้อมูล{activeMenu?.label}ของคุณได้ที่นี่
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-emerald-700 font-bold tracking-wide">
                SHOP LIVE
              </span>
            </div>

            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-orange-600 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-100 rounded-lg shadow-sm hover:shadow transition-all"
            >
              <i className="fas fa-external-link-alt text-xs"></i>
              <span className="hidden sm:inline">ดูหน้าร้าน</span>
            </Link>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-4 lg:p-8 max-w-[1600px] mx-auto animate-fade-in">
          {renderContent()}
        </div>
      </main>

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm
          editingProduct={editingProduct}
          onSuccess={() => {
            setShowProductForm(false);
            setEditingProduct(null);
            loadStore();
          }}
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
          isSeller={true}
          createEndpoint="/api/seller/product"
          updateEndpointBase="/api/seller/product"
        />
      )}

      {/* Slip Viewer Modal */}
      {viewingSlip && (
        <div
          className="fixed inset-0 bg-slate-900/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setViewingSlip(null)}
        >
          <div
            className="max-w-md w-full bg-white rounded-2xl overflow-hidden shadow-2xl transform scale-100 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <h3 className="font-bold text-slate-800">หลักฐานการโอนเงิน</h3>
              <button
                onClick={() => setViewingSlip(null)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>
            <div className="p-4 bg-slate-100">
              <img
                src={viewingSlip}
                alt="Payment Slip"
                className="w-full rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
      />
    </div>
  );
};

export default SellerPanel;
