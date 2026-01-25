import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import LoadingSpinner from "../Common/LoadingSpinner";
import {
  getSocket,
  joinUserRoom,
  onOrderStatusUpdated,
} from "../../utils/socket";
import ReviewForm from "../Reviews/ReviewForm";

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openReviewItemId, setOpenReviewItemId] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [reorderingOrderId, setReorderingOrderId] = useState(null);

  useEffect(() => {
    loadOrders();

    const socket = getSocket();
    if (user?.id) {
      joinUserRoom(user.id);
    }

    const off = onOrderStatusUpdated((payload) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === payload.orderId ? { ...o, oderStatus: payload.status } : o,
        ),
      );
      toast.info(`อัพเดตสถานะออเดอร์ #${payload.orderId}: ${payload.status}`);
    });

    return () => {
      off && off();
      socket && socket.close();
    };
  }, [user?.id]);

  const loadOrders = async (isRefresh = false) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/user/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.orders) {
        setOrders(response.data.orders);
        if (isRefresh) toast.success("รีเฟรชข้อมูลสำเร็จ");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "เกิดข้อผิดพลาดในการโหลดคำสั่งซื้อ",
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "topay" && order.oderStatus === "Not Process") ||
      (selectedStatus === "toship" && order.oderStatus === "Processing") ||
      (selectedStatus === "toreceive" && order.oderStatus === "Shipped") ||
      (selectedStatus === "completed" && order.oderStatus === "Delivered") ||
      (selectedStatus === "cancelled" && order.oderStatus === "Cancelled") ||
      (selectedStatus === "return" && order.oderStatus === "Return");

    const matchesSearch =
      !searchQuery ||
      order.id.toString().includes(searchQuery) ||
      order.products?.some(
        (item) =>
          item.product?.title
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          item.product?.store?.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );

    return matchesStatus && matchesSearch;
  });

  const statusTabs = [
    { id: "all", label: "ทั้งหมด", icon: "fa-list" },
    { id: "topay", label: "ที่ต้องชำระ", icon: "fa-wallet" },
    { id: "toship", label: "ที่ต้องจัดส่ง", icon: "fa-box" },
    { id: "toreceive", label: "ที่ต้องได้รับ", icon: "fa-truck" },
    { id: "completed", label: "สำเร็จแล้ว", icon: "fa-check-circle" },
    { id: "cancelled", label: "ยกเลิก", icon: "fa-times-circle" },
  ];

  const getStatusConfig = (status) => {
    switch (status) {
      case "Not Process":
        return {
          label: "รอชำระเงิน",
          color: "text-red-600",
          bg: "bg-red-50",
          icon: "fa-clock",
        };
      case "Processing":
        return {
          label: "กำลังจัดเตรียม",
          color: "text-blue-600",
          bg: "bg-blue-50",
          icon: "fa-cog fa-spin",
        };
      case "Shipped":
        return {
          label: "กำลังจัดส่ง",
          color: "text-orange-600",
          bg: "bg-orange-50",
          icon: "fa-shipping-fast",
        };
      case "Delivered":
        return {
          label: "จัดส่งสำเร็จ",
          color: "text-green-600",
          bg: "bg-green-50",
          icon: "fa-check",
        };
      case "Cancelled":
        return {
          label: "ยกเลิกแล้ว",
          color: "text-gray-600",
          bg: "bg-gray-100",
          icon: "fa-ban",
        };
      case "Return":
        return {
          label: "คืนเงิน/คืนสินค้า",
          color: "text-purple-600",
          bg: "bg-purple-50",
          icon: "fa-undo",
        };
      default:
        return {
          label: status,
          color: "text-gray-600",
          bg: "bg-gray-50",
          icon: "fa-info",
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ฟังก์ชัน ซื้ออีกครั้ง - เพิ่มสินค้าทั้งหมดในออเดอร์ลงตะกร้า แล้วไปหน้าตะกร้า
  const handleBuyAgain = async (order) => {
    if (!order.products || order.products.length === 0) {
      toast.error("ไม่พบสินค้าในคำสั่งซื้อนี้");
      return;
    }

    setReorderingOrderId(order.id);
    let addedCount = 0;
    let failedCount = 0;

    for (const item of order.products) {
      if (!item.product?.id) {
        failedCount++;
        continue;
      }

      const productPrice = item.price || item.product?.price || 0;

      try {
        // ไม่ส่ง productInfo เพื่อไม่ให้แสดง popup (จะไปหน้าตะกร้าเลย)
        const result = await addToCart(
          item.product.id,
          item.count || 1,
          productPrice,
          null
        );

        if (result.success) {
          addedCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        failedCount++;
      }
    }

    setReorderingOrderId(null);

    if (addedCount > 0) {
      toast.success(`เพิ่มสินค้า ${addedCount} รายการลงตะกร้าสำเร็จ`);
      // นำทางไปหน้าตะกร้าพร้อมชำระเงิน
      navigate("/cart");
    } else {
      toast.error("ไม่สามารถเพิ่มสินค้าลงตะกร้าได้");
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <LoadingSpinner size="lg" color="gray" text="กำลังโหลดคำสั่งซื้อ..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] pt-16">
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-sm shadow-sm overflow-hidden sticky top-20">
              {/* Profile Header */}
              <div className="p-4 bg-gradient-to-r from-[#ee4d2d] to-[#f7522e]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-white/20 flex items-center justify-center border-2 border-white/30">
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <i className="fas fa-user text-white text-lg"></i>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-sm truncate">
                      {user?.name || "ผู้ใช้"}
                    </h3>
                    <Link
                      to="/profile"
                      className="text-white/80 text-xs hover:text-white flex items-center gap-1"
                    >
                      <i className="fas fa-edit text-[10px]"></i> แก้ไขโปรไฟล์
                    </Link>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="p-2">
                <ul className="space-y-0.5">
                  <li>
                    <div className="flex items-center gap-2.5 px-3 py-2 text-sm bg-[#fef0ed] text-[#ee4d2d] font-medium rounded-sm">
                      <i className="fas fa-receipt w-4 text-center"></i>
                      <span>การซื้อของฉัน</span>
                    </div>
                  </li>
                </ul>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Status Tabs */}
            <div className="bg-white rounded-sm shadow-sm">
              <div className="flex items-center overflow-x-auto">
                {statusTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedStatus(tab.id)}
                    className={`flex-1 min-w-0 px-3 py-3 text-sm font-medium transition-colors text-center whitespace-nowrap relative ${
                      selectedStatus === tab.id
                        ? "text-[#ee4d2d]"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <i className={`fas ${tab.icon} mr-1.5 text-xs`}></i>
                    <span className="hidden sm:inline">{tab.label}</span>
                    {selectedStatus === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ee4d2d]"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-sm shadow-sm p-3">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาโดยชื่อร้าน, หมายเลขคำสั่งซื้อ หรือชื่อสินค้า"
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-[#ee4d2d]"
                />
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length > 0 ? (
              <div className="space-y-3">
                {filteredOrders.map((order) => {
                  const statusConfig = getStatusConfig(order.oderStatus);
                  const isExpanded = expandedOrder === order.id;

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-sm shadow-sm overflow-hidden"
                    >
                      {/* Order Header */}
                      <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <i className="fas fa-store text-[#ee4d2d] text-sm"></i>
                            <span className="font-medium text-sm text-gray-900">
                              {order.products?.[0]?.product?.store?.name ||
                                "ร้านค้า"}
                            </span>
                          </div>
                          {order.products?.[0]?.product?.store?.id && (
                            <Link
                              to={`/store/${order.products[0].product.store.id}`}
                              className="text-xs text-[#ee4d2d] hover:underline"
                            >
                              ดูร้าน
                            </Link>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}
                          >
                            <i className={`fas ${statusConfig.icon} mr-1`}></i>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>

                      {/* Products */}
                      <div className="divide-y divide-gray-50">
                        {order.products?.map((item, idx) => {
                          const productPrice =
                            item.price || item.product?.price || 0;
                          const isDelivered = order.oderStatus === "Delivered";

                          return (
                            <div key={idx} className="p-3">
                              <div className="flex gap-3">
                                {/* Product Image */}
                                <Link
                                  to={`/product/${item.product?.id}`}
                                  className="w-16 h-16 rounded-sm overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 hover:opacity-80"
                                >
                                  {item.product?.images?.[0] ? (
                                    <img
                                      src={
                                        item.product.images[0].url ||
                                        item.product.images[0].secure_url
                                      }
                                      alt={item.product.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <i className="fas fa-image text-gray-300"></i>
                                    </div>
                                  )}
                                </Link>

                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                  <Link
                                    to={`/product/${item.product?.id}`}
                                    className="text-sm text-gray-900 hover:text-[#ee4d2d] line-clamp-1"
                                  >
                                    {item.product?.title || "สินค้า"}
                                  </Link>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {item.variant || "ไม่ระบุตัวเลือก"}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    x{item.count || 1}
                                  </p>
                                </div>

                                {/* Price */}
                                <div className="text-right flex-shrink-0">
                                  <p className="text-sm font-medium text-[#ee4d2d]">
                                    ฿{productPrice.toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              {/* Review Button (for delivered orders) */}
                              {isDelivered && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() =>
                                        setOpenReviewItemId(
                                          openReviewItemId === item.id
                                            ? null
                                            : item.id,
                                        )
                                      }
                                      className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                                        openReviewItemId === item.id
                                          ? "bg-gray-100 text-gray-600"
                                          : "bg-[#ee4d2d] text-white hover:bg-[#d73211]"
                                      }`}
                                    >
                                      <i
                                        className={`fas ${openReviewItemId === item.id ? "fa-times" : "fa-star"} mr-1`}
                                      ></i>
                                      {openReviewItemId === item.id
                                        ? "ปิด"
                                        : "ให้คะแนน"}
                                    </button>
                                  </div>

                                  {/* Review Form */}
                                  {openReviewItemId === item.id && (
                                    <div className="mt-3 p-3 bg-orange-50 rounded-sm border border-orange-200">
                                      <ReviewForm
                                        orderItemId={item.id}
                                        productTitle={item.product?.title}
                                        onSubmitted={() => {
                                          setOpenReviewItemId(null);
                                          toast.success("ส่งรีวิวสำเร็จ!");
                                          loadOrders(true);
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Order Footer */}
                      <div className="p-3 bg-[#fffbf8] border-t border-orange-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>#{order.id}</span>
                            <span>•</span>
                            <span>{formatDate(order.createdAt)}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-xs text-gray-500">
                                รวมทั้งหมด:{" "}
                              </span>
                              <span className="text-lg font-bold text-[#ee4d2d]">
                                ฿{(order.cartTotal || 0).toLocaleString()}
                              </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              {order.oderStatus === "Not Process" && (
                                <button
                                  onClick={() =>
                                    navigate(`/payment/${order.id}`)
                                  }
                                  className="px-4 py-1.5 bg-[#ee4d2d] text-white rounded-sm text-sm font-medium hover:bg-[#d73211]"
                                >
                                  ชำระเงิน
                                </button>
                              )}
                              {order.oderStatus === "Delivered" && (
                                <button
                                  onClick={() => handleBuyAgain(order)}
                                  disabled={reorderingOrderId === order.id}
                                  className={`px-4 py-1.5 bg-[#ee4d2d] text-white rounded-sm text-sm font-medium hover:bg-[#d73211] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5`}
                                >
                                  {reorderingOrderId === order.id ? (
                                    <>
                                      <i className="fas fa-spinner fa-spin"></i>
                                      กำลังเพิ่ม...
                                    </>
                                  ) : (
                                    <>
                                      <i className="fas fa-redo"></i>
                                      ซื้ออีกครั้ง
                                    </>
                                  )}
                                </button>
                              )}
                              {(order.oderStatus === "Processing" ||
                                order.oderStatus === "Shipped") && (
                                <button className="px-4 py-1.5 border border-gray-300 text-gray-600 rounded-sm text-sm font-medium hover:bg-gray-50">
                                  ติดตามพัสดุ
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-sm shadow-sm p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-shopping-bag text-gray-300 text-3xl"></i>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">
                  {selectedStatus !== "all" || searchQuery
                    ? "ไม่พบคำสั่งซื้อ"
                    : "ยังไม่มีคำสั่งซื้อ"}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {selectedStatus !== "all" || searchQuery
                    ? "ลองเปลี่ยนตัวกรองหรือคำค้นหา"
                    : "เมื่อคุณสั่งซื้อสินค้า คำสั่งซื้อจะแสดงที่นี่"}
                </p>
                {(!selectedStatus || selectedStatus === "all") &&
                  !searchQuery && (
                    <Link
                      to="/products"
                      className="inline-flex items-center px-6 py-2 bg-[#ee4d2d] text-white rounded-sm hover:bg-[#d73211] text-sm font-medium"
                    >
                      <i className="fas fa-shopping-cart mr-2"></i>
                      เริ่มช็อปปิ้ง
                    </Link>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;
