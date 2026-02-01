import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });
    const [deletingOrders, setDeletingOrders] = useState(new Set());
    const [updatingStatus, setUpdatingStatus] = useState(new Set());

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit
            });
            
            if (filter !== 'all') {
                params.append('status', filter);
            }

            const response = await axios.get(`/api/admin/orders?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setOrders(response.data.orders);
            setPagination(prev => ({
                ...prev,
                ...response.data.pagination
            }));
            setError('');
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ');
        } finally {
            setLoading(false);
        }
    }, [filter, pagination.page, pagination.limit]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const getStatusBadge = (status) => {
        const styles = {
            'Not Process': 'bg-slate-100 text-slate-600 border-slate-200',
            'Processing': 'bg-blue-50 text-blue-600 border-blue-200',
            'Shipped': 'bg-indigo-50 text-indigo-600 border-indigo-200',
            'Delivered': 'bg-emerald-50 text-emerald-600 border-emerald-200',
            'Cancelled': 'bg-rose-50 text-rose-600 border-rose-200',
            'Return': 'bg-orange-50 text-orange-600 border-orange-200',
            'Waiting Approval': 'bg-amber-50 text-amber-600 border-amber-200'
        };

        const labels = {
            'Not Process': 'รอดำเนินการ',
            'Processing': 'กำลังเตรียมพัสดุ',
            'Shipped': 'จัดส่งแล้ว',
            'Delivered': 'ส่งมอบสำเร็จ',
            'Cancelled': 'ยกเลิก',
            'Return': 'ขอคืนสินค้า',
            'Waiting Approval': 'รออนุมัติ'
        };
        
        const icons = {
             'Not Process': 'fa-clock',
            'Processing': 'fa-box-open',
            'Shipped': 'fa-shipping-fast',
            'Delivered': 'fa-check-circle',
            'Cancelled': 'fa-times-circle',
            'Return': 'fa-undo',
            'Waiting Approval': 'fa-hourglass-half'
        }

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 w-fit ${styles[status] || styles['Not Process']}`}>
                <i className={`fas ${icons[status] || 'fa-circle'}`}></i>
                {labels[status] || status}
            </span>
        );
    };

    const getPaymentStatusBadge = (paymentStatus) => {
        const styles = {
            'completed': 'bg-emerald-100 text-emerald-700',
            'pending': 'bg-amber-100 text-amber-700',
            'failed': 'bg-rose-100 text-rose-700',
            'waiting_approval': 'bg-blue-100 text-blue-700'
        };

        const labels = {
            'completed': 'ชำระเงินแล้ว',
            'pending': 'รอชำระเงิน',
            'failed': 'ล้มเหลว',
            'waiting_approval': 'รอตรวจสอบสลิป'
        };

        return (
            <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide ${styles[paymentStatus] || 'bg-gray-100 text-gray-700'}`}>
                {labels[paymentStatus] || paymentStatus}
            </span>
        );
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            setUpdatingStatus(prev => new Set([...prev, orderId]));
            const token = localStorage.getItem('token');
            
            await axios.put(`/api/admin/orders/${orderId}/status`, 
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setOrders(prev => prev.map(order => 
                order.id === orderId 
                    ? { ...order, oderStatus: newStatus }
                    : order
            ));

            toast.success(`อัพเดตสถานะเป็นเรียบร้อย`);
        } catch (error) {
            console.error('Error updating order status:', error);
            toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัพเดตสถานะ');
        } finally {
            setUpdatingStatus(prev => {
                const newSet = new Set(prev);
                newSet.delete(orderId);
                return newSet;
            });
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบคำสั่งซื้อนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) return;

        try {
            setDeletingOrders(prev => new Set([...prev, orderId]));
            const token = localStorage.getItem('token');
            
            await axios.delete(`/api/admin/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setOrders(prev => prev.filter(order => order.id !== orderId));
            setPagination(prev => ({ ...prev, total: prev.total - 1 }));

            toast.success('ลบคำสั่งซื้อสำเร็จ');
        } catch (error) {
            console.error('Error deleting order:', error);
            toast.error('เกิดข้อผิดพลาดในการลบคำสั่งซื้อ');
        } finally {
            setDeletingOrders(prev => {
                const newSet = new Set(prev);
                newSet.delete(orderId);
                return newSet;
            });
        }
    };

    return (
        <div className="space-y-4 h-full flex flex-col">
            {/* Header & Filter */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                             <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 text-sm">
                                <i className="fas fa-clipboard-list"></i>
                             </span>
                             จัดการคำสั่งซื้อ
                        </h2>
                        <p className="text-slate-500 text-xs mt-1 ml-10">ตรวจสอบและจัดการสถานะออเดอร์ทั้งหมด ({pagination.total} รายการ)</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {[
                        { value: 'all', label: 'ทั้งหมด', icon: 'fa-list' },
                        { value: 'Not Process', label: 'รอดำเนินการ', icon: 'fa-clock' },
                        { value: 'Processing', label: 'กำลังแพ็ค', icon: 'fa-box' },
                        { value: 'Shipped', label: 'ขนส่งแล้ว', icon: 'fa-shipping-fast' },
                        { value: 'Delivered', label: 'สำเร็จ', icon: 'fa-check' },
                        { value: 'Cancelled', label: 'ยกเลิก', icon: 'fa-times' }
                    ].map(status => (
                        <button
                            key={status.value}
                            onClick={() => setFilter(status.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                filter === status.value
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                        >
                            <i className={`fas ${status.icon} text-[10px] ${filter === status.value ?'text-indigo-200':'text-slate-400'}`}></i>
                            {status.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
                    <span className="text-slate-500 font-medium text-sm">กำลังโหลดรายการคำสั่งซื้อ...</span>
                </div>
            ) : error ? (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-3 text-sm">
                    <i className="fas fa-exclamation-circle text-lg"></i>
                    {error}
                </div>
            ) : orders.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-slate-200 border-dashed text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <i className="fas fa-box-open text-3xl text-slate-300"></i>
                    </div>
                    <h3 className="text-base font-bold text-slate-700 mb-1">ไม่พบคำสั่งซื้อ</h3>
                    <p className="text-slate-500 text-sm">
                        {filter === 'all' ? 'ยังไม่มีรายการคำสั่งซื้อเข้ามาในระบบ' : `ไม่พบคำสั่งซื้อในสถานะ "${filter}"`}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow overflow-hidden group">
                            {/* Order Header Bar */}
                            <div className="bg-slate-50/50 px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                                        <i className="fas fa-receipt text-indigo-500 text-sm"></i>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-slate-800">
                                                Order #{order.id}
                                            </h3>
                                            <span className="text-slate-400 text-[10px] px-1.5 py-0.5 bg-slate-100 rounded font-mono">
                                                {new Date(order.createdAt).toLocaleDateString('th-TH', { 
                                                    day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute:'2-digit' 
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <i className="fas fa-user-circle text-[10px]"></i> {order.orderedBy.name || order.orderedBy.email}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                     {getStatusBadge(order.oderStatus)}
                                     <button
                                        onClick={() => handleDeleteOrder(order.id)}
                                        disabled={deletingOrders.has(order.id)}
                                        className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-colors shadow-sm"
                                        title="ลบคำสั่งซื้อ"
                                    >
                                        {deletingOrders.has(order.id) ? (
                                            <i className="fas fa-circle-notch fa-spin text-[10px]"></i>
                                        ) : (
                                            <i className="fas fa-trash-alt text-[10px]"></i>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left: Products */}
                                <div className="lg:col-span-2 space-y-3">
                                     <div className="flex items-center gap-2 mb-1">
                                        <i className="fas fa-box text-slate-400 text-xs"></i>
                                        <span className="text-xs font-semibold text-slate-700">รายการสินค้า ({order.products.length})</span>
                                     </div>
                                     <div className="space-y-2">
                                        {order.products.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100 group-hover:bg-indigo-50/30 transition-colors">
                                                <div className="w-12 h-12 bg-white rounded-md border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                                     {item.product.images && item.product.images.length > 0 ? (
                                                        <img 
                                                            src={item.product.images[0].url || item.product.images[0].secure_url} 
                                                            alt={item.product.title} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <i className="fas fa-image text-slate-300 text-xs"></i>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-sm font-medium text-slate-800 truncate">{item.product.title}</h4>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                                        <span className="px-1.5 py-0.5 bg-white rounded border border-slate-200">x{item.count}</span>
                                                        <span>ชิ้นละ ฿{item.product.price?.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right font-bold text-slate-700 text-sm">
                                                    ฿{(item.count * item.product.price)?.toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                     </div>
                                     <div className="flex justify-end pt-2 border-t border-slate-100">
                                         <div className="text-right">
                                             <span className="text-xs text-slate-500 mr-2">ยอดรวมสุทธิ</span>
                                             <span className="text-lg font-bold text-indigo-600">฿{order.cartTotal?.toLocaleString()}</span>
                                         </div>
                                     </div>
                                </div>

                                {/* Right: Address & Actions */}
                                <div className="space-y-4 lg:border-l lg:border-slate-100 lg:pl-6">
                                    {/* Shipping Info */}
                                    <div>
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">ที่อยู่จัดส่ง</h4>
                                        <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <p className="font-semibold text-slate-800 mb-0.5">{order.orderedBy.name || 'ไม่ระบุชื่อ'}</p>
                                            <p>{order.shippingAddress || order.orderedBy.address || 'ไม่ระบุที่อยู่'}</p>
                                            <p className="mt-1 text-slate-500 flex items-center gap-1.5">
                                                <i className="fas fa-phone text-[10px]"></i>
                                                {order.shippingPhone || order.orderedBy.phone || '-'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Payment Info */}
                                    <div>
                                         <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">การชำระเงิน</h4>
                                         {order.payments && order.payments.length > 0 ? (
                                             <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                                                 <div className="flex items-center justify-between mb-1.5">
                                                     <span className="text-[10px] font-medium text-slate-600">สถานะ</span>
                                                     {getPaymentStatusBadge(order.payments[0].status)}
                                                 </div>
                                                 <div className="text-xs text-slate-700">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <i className="fas fa-wallet text-emerald-500 text-[10px]"></i>
                                                        <span className="font-medium capitalize">{order.payments[0].method.replace('_', ' ')}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-500">
                                                        {new Date(order.payments[0].createdAt).toLocaleString('th-TH')}
                                                    </div>
                                                 </div>
                                             </div>
                                         ) : (
                                              <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100 text-amber-700 text-xs flex items-center gap-1.5">
                                                  <i className="fas fa-exclamation-triangle"></i>
                                                  ยังไม่มีข้อมูลการชำระเงิน
                                              </div>
                                         )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-3 border-t border-slate-100">
                                         <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">อัพเดตสถานะ</h4>
                                         <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { status: 'Processing', label: 'เตรียมพัสดุ', class: 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200' },
                                                { status: 'Shipped', label: 'ส่งของแล้ว', class: 'hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200' },
                                                { status: 'Delivered', label: 'สำเร็จ', class: 'hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200' },
                                                { status: 'Cancelled', label: 'ยกเลิก', class: 'hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200' }
                                            ].map((action) => (
                                                <button
                                                    key={action.status}
                                                    onClick={() => handleUpdateStatus(order.id, action.status)}
                                                    disabled={order.oderStatus === action.status || updatingStatus.has(order.id)}
                                                    className={`px-2 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 transition-all ${action.class} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white`}
                                                >
                                                    {action.label}
                                                </button>
                                            ))}
                                         </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                 <div className="flex justify-center items-center gap-2 mt-4">
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
                    >
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <span className="text-xs font-medium text-slate-600 px-2">
                        หน้า {pagination.page} / {pagination.pages}
                    </span>
                    <button
                         onClick={() => handlePageChange(pagination.page + 1)}
                         disabled={pagination.page >= pagination.pages}
                         className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
                     >
                        <i className="fas fa-chevron-right"></i>
                    </button>
                 </div>
            )}
        </div>
    );
};

export default OrderManagement;
