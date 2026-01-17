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
        const statusStyles = {
            'Not Process': 'bg-gray-100 text-gray-800 border-gray-300',
            'Processing': 'bg-blue-100 text-blue-800 border-blue-300',
            'Shipped': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'Delivered': 'bg-green-100 text-green-800 border-green-300',
            'Cancelled': 'bg-red-100 text-red-800 border-red-300',
            'Return': 'bg-purple-100 text-purple-800 border-purple-300',
            'Waiting Approval': 'bg-orange-100 text-orange-800 border-orange-300'
        };

        const statusLabels = {
            'Not Process': 'รอดำเนินการ',
            'Processing': 'กำลังดำเนินการ',
            'Shipped': 'จัดส่งแล้ว',
            'Delivered': 'ส่งมอบแล้ว',
            'Cancelled': 'ยกเลิก',
            'Return': 'คืนสินค้า',
            'Waiting Approval': 'รออนุมัติ'
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusStyles[status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                {statusLabels[status] || status}
            </span>
        );
    };

    const getPaymentStatusBadge = (paymentStatus) => {
        const paymentStyles = {
            'completed': 'bg-green-100 text-green-800 border-green-300',
            'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'failed': 'bg-red-100 text-red-800 border-red-300',
            'waiting_approval': 'bg-orange-100 text-orange-800 border-orange-300'
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${paymentStyles[paymentStatus] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                {paymentStatus === 'completed' ? 'ชำระแล้ว' :
                 paymentStatus === 'pending' ? 'รอชำระ' :
                 paymentStatus === 'failed' ? 'ชำระไม่สำเร็จ' :
                 paymentStatus === 'waiting_approval' ? 'รออนุมัติ' : paymentStatus}
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

            // Update order in local state
            setOrders(prev => prev.map(order => 
                order.id === orderId 
                    ? { ...order, oderStatus: newStatus }
                    : order
            ));

            toast.success(`อัพเดตสถานะเป็น "${getStatusLabel(newStatus)}" สำเร็จ`);
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

    const getStatusLabel = (status) => {
        const labels = {
            'Not Process': 'รอดำเนินการ',
            'Processing': 'กำลังดำเนินการ',
            'Shipped': 'จัดส่งแล้ว',
            'Delivered': 'ส่งมอบแล้ว',
            'Cancelled': 'ยกเลิก',
            'Return': 'คืนสินค้า'
        };
        return labels[status] || status;
    };

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบคำสั่งซื้อนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) {
            return;
        }

        try {
            setDeletingOrders(prev => new Set([...prev, orderId]));
            const token = localStorage.getItem('token');
            
            await axios.delete(`/api/admin/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Remove order from local state
            setOrders(prev => prev.filter(order => order.id !== orderId));
            setPagination(prev => ({
                ...prev,
                total: prev.total - 1
            }));

            toast.success('ลบคำสั่งซื้อสำเร็จ');
        } catch (error) {
            console.error('Error deleting order:', error);
            toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบคำสั่งซื้อ');
        } finally {
            setDeletingOrders(prev => {
                const newSet = new Set(prev);
                newSet.delete(orderId);
                return newSet;
            });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                    📋 จัดการคำสั่งซื้อ
                </h2>
                <div className="text-sm text-gray-500">
                    ทั้งหมด {pagination.total} รายการ
                </div>
            </div>

            {/* Filter */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex space-x-2 overflow-x-auto">
                    {[
                        { value: 'all', label: 'ทั้งหมด' },
                        { value: 'Not Process', label: 'ยังไม่ดำเนินการ' },
                        { value: 'Processing', label: 'กำลังดำเนินการ' },
                        { value: 'Shipped', label: 'จัดส่งแล้ว' },
                        { value: 'Delivered', label: 'ส่งมอบแล้ว' },
                        { value: 'Cancelled', label: 'ยกเลิก' }
                    ].map(status => (
                        <button
                            key={status.value}
                            onClick={() => setFilter(status.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                                filter === status.value
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {status.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Orders List */}
            <div className="space-y-4">
                {orders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="text-gray-400 text-6xl mb-4">📦</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบคำสั่งซื้อ</h3>
                        <p className="text-gray-500">
                            {filter === 'all' ? 'ยังไม่มีคำสั่งซื้อในระบบ' : `ไม่พบคำสั่งซื้อที่มีสถานะ "${filter}"`}
                        </p>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="p-6">
                                {/* Order Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            คำสั่งซื้อ #{order.id}
                                        </h3>
                                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1 flex-wrap gap-2">
                                            <span>👤 {order.orderedBy.name || order.orderedBy.email}</span>
                                            <span>📅 {new Date(order.createdAt).toLocaleDateString('th-TH', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}</span>
                                        </div>
                                        
                                        {/* Customer Address & Phone Info */}
                                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                <i className="fas fa-map-marker-alt text-orange-500"></i>
                                                ข้อมูลการจัดส่ง
                                            </h4>
                                            <div className="space-y-1 text-sm text-gray-700">
                                                <p className="font-medium text-gray-900">
                                                    <i className="fas fa-user mr-2 text-gray-500"></i>
                                                    {order.orderedBy.name || 'ไม่ระบุชื่อ'}
                                                </p>
                                                {(order.shippingAddress || order.orderedBy.address) && (
                                                    <p className="whitespace-pre-line text-gray-700">
                                                        <i className="fas fa-map-marker-alt mr-2 text-gray-500"></i>
                                                        {order.shippingAddress || order.orderedBy.address}
                                                    </p>
                                                )}
                                                {(order.shippingPhone || order.orderedBy.phone) && (
                                                    <p className="text-gray-600">
                                                        <i className="fas fa-phone mr-2 text-gray-500"></i>
                                                        โทร: {order.shippingPhone || order.orderedBy.phone}
                                                    </p>
                                                )}
                                                {order.orderedBy.email && (
                                                    <p className="text-gray-600">
                                                        <i className="fas fa-envelope mr-2 text-gray-500"></i>
                                                        {order.orderedBy.email}
                                                    </p>
                                                )}
                                                {!order.shippingAddress && !order.orderedBy.address && (
                                                    <p className="text-red-500 text-xs italic">
                                                        <i className="fas fa-exclamation-triangle mr-1"></i>
                                                        ไม่มีที่อยู่ในการจัดส่ง
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-start justify-end space-x-3 mb-2">
                                            <div>
                                                <div className="text-2xl font-bold text-green-600">
                                                    ฿{order.cartTotal?.toLocaleString() || '0'}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteOrder(order.id)}
                                                disabled={deletingOrders.has(order.id)}
                                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                                                title="ลบคำสั่งซื้อ"
                                            >
                                                {deletingOrders.has(order.id) ? (
                                                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <i className="fas fa-trash text-sm"></i>
                                                )}
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="space-y-1">
                                                {getStatusBadge(order.oderStatus)}
                                                {order.payments && order.payments.length > 0 && (
                                                    <div>
                                                        {getPaymentStatusBadge(order.payments[0].status)}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Status Update Section */}
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <div className="text-xs font-medium text-gray-700 mb-2">เปลี่ยนสถานะ:</div>
                                                <div className="flex flex-wrap gap-1.5 justify-end">
                                                    {order.oderStatus !== 'Not Process' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(order.id, 'Not Process')}
                                                            disabled={updatingStatus.has(order.id)}
                                                            className="px-2.5 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded transition-colors disabled:opacity-50"
                                                            title="รอดำเนินการ"
                                                        >
                                                            <i className="fas fa-clock mr-1"></i>
                                                            รอดำเนินการ
                                                        </button>
                                                    )}
                                                    {order.oderStatus !== 'Processing' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(order.id, 'Processing')}
                                                            disabled={updatingStatus.has(order.id)}
                                                            className="px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors disabled:opacity-50"
                                                            title="กำลังดำเนินการ"
                                                        >
                                                            <i className="fas fa-cog mr-1"></i>
                                                            กำลังดำเนินการ
                                                        </button>
                                                    )}
                                                    {order.oderStatus !== 'Shipped' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(order.id, 'Shipped')}
                                                            disabled={updatingStatus.has(order.id)}
                                                            className="px-2.5 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded transition-colors disabled:opacity-50"
                                                            title="จัดส่งแล้ว"
                                                        >
                                                            <i className="fas fa-truck mr-1"></i>
                                                            จัดส่งแล้ว
                                                        </button>
                                                    )}
                                                    {order.oderStatus !== 'Delivered' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                                                            disabled={updatingStatus.has(order.id)}
                                                            className="px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors disabled:opacity-50 font-semibold"
                                                            title="ส่งมอบแล้ว"
                                                        >
                                                            <i className="fas fa-check-circle mr-1"></i>
                                                            ส่งมอบแล้ว
                                                        </button>
                                                    )}
                                                    {order.oderStatus !== 'Cancelled' && order.oderStatus !== 'Delivered' && (
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('คุณแน่ใจหรือไม่ที่จะยกเลิกคำสั่งซื้อนี้?')) {
                                                                    handleUpdateStatus(order.id, 'Cancelled');
                                                                }
                                                            }}
                                                            disabled={updatingStatus.has(order.id)}
                                                            className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors disabled:opacity-50"
                                                            title="ยกเลิก"
                                                        >
                                                            <i className="fas fa-times mr-1"></i>
                                                            ยกเลิก
                                                        </button>
                                                    )}
                                                </div>
                                                {updatingStatus.has(order.id) && (
                                                    <div className="mt-2 text-xs text-gray-500 flex items-center justify-end gap-1">
                                                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                        กำลังอัพเดต...
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Products */}
                                <div className="border-t border-gray-100 pt-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-3">สินค้าที่สั่งซื้อ:</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {order.products.map((item, index) => (
                                            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                                                    {item.product.images && item.product.images.length > 0 ? (
                                                        <img 
                                                            src={item.product.images[0].url || item.product.images[0].secure_url || `${process.env.REACT_APP_API_URL || ''}/${item.product.images[0]}`}
                                                            alt={item.product.title}
                                                            className="w-full h-full object-cover rounded-lg"
                                                            onError={(e) => {
                                                                e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                                                            }}
                                                        />
                                                    ) : (
                                                        '📦'
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {item.product.title}
                                                    </p>
                                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                                        <span>จำนวน: {item.count}</span>
                                                        <span>฿{item.product.price?.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Payment Info */}
                                {order.payments && order.payments.length > 0 ? (
                                    <div className="border-t border-gray-100 pt-4 mt-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                            <i className="fas fa-credit-card text-orange-500"></i>
                                            ข้อมูลการชำระเงิน
                                        </h4>
                                        {order.payments.map((payment, index) => (
                                            <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                                    <div className="space-y-2">
                                                        <div>
                                                            <span className="text-gray-500 block mb-1">วิธีการชำระ:</span>
                                                            <div className="font-semibold text-blue-700 flex items-center gap-2">
                                                                {payment.method === 'cash' ? (
                                                                    <><i className="fas fa-money-bill-wave"></i> 💵 เงินสด (เก็บเงินปลายทาง)</>
                                                                ) : payment.method === 'promptpay' ? (
                                                                    <><i className="fas fa-qrcode"></i> 📱 PromptPay</>
                                                                ) : payment.method === 'credit_card' ? (
                                                                    <><i className="fas fa-credit-card"></i> 💳 บัตรเครดิต/เดบิต</>
                                                                ) : payment.method === 'bank_transfer' ? (
                                                                    <><i className="fas fa-university"></i> 🏦 โอนเงินผ่านธนาคาร</>
                                                                ) : (
                                                                    <span>{payment.method}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500 block mb-1">สถานะการชำระ:</span>
                                                            <div>
                                                                {getPaymentStatusBadge(payment.status)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div>
                                                            <span className="text-gray-500 block mb-1">จำนวนเงิน:</span>
                                                            <div className="font-bold text-green-600 text-lg">฿{payment.amount.toLocaleString()}</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500 block mb-1">Transaction ID:</span>
                                                            <div className="font-mono text-xs bg-white px-2 py-1 rounded border border-gray-200">{payment.transactionId}</div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div>
                                                            <span className="text-gray-500 block mb-1">วันที่ชำระ:</span>
                                                            <div className="font-medium">{new Date(payment.createdAt).toLocaleDateString('th-TH', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}</div>
                                                        </div>
                                                        {payment.customerName && (
                                                            <div>
                                                                <span className="text-gray-500 block mb-1">ชื่อผู้ชำระ:</span>
                                                                <div className="font-medium">{payment.customerName}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="border-t border-gray-100 pt-4 mt-4">
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                            <div className="flex items-center gap-2 text-yellow-800">
                                                <i className="fas fa-exclamation-triangle"></i>
                                                <span className="text-sm font-medium">ยังไม่มีการชำระเงิน</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex justify-center items-center space-x-2">
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ก่อนหน้า
                    </button>
                    
                    <div className="flex space-x-1">
                        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                            const page = i + 1;
                            return (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                        pagination.page === page
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {page}
                                </button>
                            );
                        })}
                    </div>
                    
                    <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.pages}
                        className="px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ถัดไป
                    </button>
                </div>
            )}
        </div>
    );
};

export default OrderManagement;
