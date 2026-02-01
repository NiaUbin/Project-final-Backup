import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const PaymentApproval = () => {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);

  useEffect(() => {
    loadPendingPayments();
  }, []);

  const loadPendingPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/notifications/admin/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingPayments(response.data.notifications);
    } catch (error) {
      console.error('Error loading pending payments:', error);
      toast.error('ไม่สามารถโหลดข้อมูลการชำระเงินได้');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paymentId) => {
    try {
      setProcessing(paymentId);
      const token = localStorage.getItem('token');

      await axios.put(`/api/admin/payment/${paymentId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('อนุมัติการชำระเงินสำเร็จ!');
      loadPendingPayments();
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอนุมัติ');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (paymentId) => {
    try {
      setProcessing(paymentId);
      const token = localStorage.getItem('token');

      await axios.put(`/api/admin/payment/${paymentId}/reject`, {
        reason: rejectReason || 'ไม่ระบุเหตุผล'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('ปฏิเสธการชำระเงินสำเร็จ!');
      setShowRejectModal(null);
      setRejectReason('');
      loadPendingPayments();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการปฏิเสธ');
    } finally {
      setProcessing(null);
    }
  };

  const openRejectModal = (paymentId) => {
    setShowRejectModal(paymentId);
    setRejectReason('');
  };

  const closeRejectModal = () => {
    setShowRejectModal(null);
    setRejectReason('');
  };

  const getPaymentMethodInfo = (method) => {
    switch (method) {
      case 'cash': return { icon: 'fa-money-bill-wave', label: 'เก็บเงินปลายทาง', color: 'text-green-600', bg: 'bg-green-50' };
      case 'promptpay': return { icon: 'fa-qrcode', label: 'PromptPay', color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'credit_card': return { icon: 'fa-credit-card', label: 'บัตรเครดิต', color: 'text-indigo-600', bg: 'bg-indigo-50' };
      case 'bank_transfer': return { icon: 'fa-university', label: 'โอนเงิน', color: 'text-purple-600', bg: 'bg-purple-50' };
      default: return { icon: 'fa-wallet', label: method, color: 'text-slate-600', bg: 'bg-slate-50' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
        <span className="text-slate-500 font-medium ml-3">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
           <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600">
                   <i className="fas fa-file-invoice-dollar text-lg"></i>
               </div>
               <h2 className="text-xl font-bold text-slate-800">อนุมัติการชำระเงิน</h2>
           </div>
           <p className="text-slate-500 text-sm mt-1 ml-13">ตรวจสอบหลักฐานและอนุมัติยอดเงินโอน</p>
        </div>
        
        <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex items-center gap-3">
             <span className="text-sm text-slate-500">รายการรอตรวจสอบ</span>
             <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-md text-sm font-bold">{pendingPayments.length}</span>
        </div>
      </div>

      {/* Pending Payments List */}
      {pendingPayments.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-check-circle text-4xl text-emerald-400"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">ไม่มีรายการค้าง</h3>
            <p className="text-slate-500">การชำระเงินทั้งหมดได้รับการตรวจสอบแล้ว</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {pendingPayments.map((notification) => {
            const payment = notification.payment;
            const order = notification.order;
            const customer = order.orderedBy;
            const methodInfo = getPaymentMethodInfo(payment.method);

            return (
              <div key={notification.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                {/* Card Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                   <div className="flex items-center gap-3">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${methodInfo.bg} ${methodInfo.color}`}>
                           <i className={`fas ${methodInfo.icon}`}></i>
                       </div>
                       <div>
                           <h3 className="font-bold text-slate-800">Payment #{payment.id}</h3>
                           <div className="text-xs text-slate-500 flex items-center gap-2">
                               <span className={`font-semibold ${methodInfo.color}`}>{methodInfo.label}</span>
                               <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                               <span>{new Date(notification.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour:'2-digit', minute:'2-digit'})}</span>
                           </div>
                       </div>
                   </div>
                   <div className="text-right">
                       <div className="text-lg font-bold text-slate-800">฿{payment.amount.toLocaleString()}</div>
                       <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded uppercase tracking-wide">รออนุมัติ</span>
                   </div>
                </div>

                {/* Card Content */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                    {/* Left Column: Customer & Payment */}
                    <div className="space-y-4">
                        {/* Customer Info */}
                        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                             <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0 shadow-sm">
                                 <i className="fas fa-user"></i>
                             </div>
                             <div>
                                 <h4 className="text-sm font-bold text-slate-700">ข้อมูลลูกค้า</h4>
                                 <p className="text-sm text-slate-600 font-medium">{customer.name || 'ไม่ระบุชื่อ'}</p>
                                 <p className="text-xs text-slate-500">{customer.email}</p>
                             </div>
                        </div>

                        {/* Payment Details Box */}
                        <div className={`p-4 rounded-xl border space-y-3 ${methodInfo.bg} ${methodInfo.color.replace('text', 'border').replace('600', '200')}`}>
                             <h4 className="text-sm font-bold flex items-center gap-2 text-slate-700">
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/60 ${methodInfo.color}`}>
                                    <i className={`fas ${methodInfo.icon}`}></i>
                                </span>
                                ข้อมูลการชำระเงิน
                             </h4>
                             <div className="grid grid-cols-2 gap-4 text-sm mt-3 pl-1">
                                 <div>
                                     <span className="text-xs text-slate-500 uppercase tracking-wide block mb-0.5">ช่องทาง</span>
                                     <span className={`font-semibold ${methodInfo.color}`}>{methodInfo.label}</span>
                                 </div>
                                 <div className="text-right">
                                     <span className="text-xs text-slate-500 uppercase tracking-wide block mb-0.5">ยอดชำระ</span>
                                     <span className="font-bold text-lg text-slate-800">฿{payment.amount.toLocaleString()}</span>
                                 </div>
                                 <div className="col-span-2 pt-2 border-t border-black/5">
                                     <span className="text-xs text-slate-500 uppercase tracking-wide block mb-0.5">Transaction ID</span>
                                     <span className="font-mono text-xs text-slate-600 break-all bg-white/50 px-2 py-1 rounded inline-block">
                                        {payment.transactionId || '-'}
                                     </span>
                                 </div>
                             </div>
                        </div>
                    </div>

                    {/* Right Column: Ordered Products */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full max-h-[300px]">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
                            <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                <i className="fas fa-box text-slate-400"></i>
                                สินค้าที่สั่งซื้อ ({order.products.length})
                            </h4>
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">Order #{order.id}</span>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar bg-white">
                            {order.products.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                                    <div className="h-12 w-12 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 bg-slate-100">
                                        {item.product?.images?.[0] ? (
                                            <img 
                                                src={item.product.images[0].url || item.product.images[0].secure_url} 
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-slate-300">
                                                <i className="fas fa-image"></i>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors" title={item.product?.title}>
                                            {item.product?.title || 'Unknown Product'}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">x{item.count}</span>
                                            <span>฿{item.price?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                                        ฿{((item.price || 0) * (item.count || 0)).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Total Footer */}
                        <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex justify-between items-center text-sm flex-shrink-0">
                             <span className="text-slate-500">ราคารวมสินค้า</span>
                             <span className="font-bold text-slate-800">฿{order.cartTotal?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3">
                     <button
                        onClick={() => openRejectModal(payment.id)}
                        disabled={processing === payment.id}
                        className="flex-1 py-2.5 border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 font-semibold transition-colors disabled:opacity-50 text-sm"
                     >
                        {processing === payment.id ? <i className="fas fa-spinner fa-spin"></i> : 'ปฏิเสธ'}
                     </button>
                     <button
                        onClick={() => handleApprove(payment.id)}
                        disabled={processing === payment.id}
                        className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-md shadow-emerald-200 transition-all disabled:opacity-50 text-sm"
                     >
                        {processing === payment.id ? <i className="fas fa-spinner fa-spin"></i> : 'อนุมัติการโอน'}
                     </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <h3 className="text-lg font-bold text-slate-800 mb-2">ระบุเหตุผลในการปฏิเสธ</h3>
            <p className="text-slate-500 text-sm mb-4">การปฏิเสธจะแจ้งเตือนไปยังลูกค้า และยกเลิกสถานะการรอตรวจสอบนี้</p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none text-sm min-h-[100px]"
              placeholder="เช่น หลักฐานไม่ชัดเจน, ยอดเงินไม่ตรง..."
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeRejectModal}
                className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                className="px-5 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-semibold shadow-lg shadow-rose-200 transition-all"
              >
                ยืนยันการปฏิเสธ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentApproval;
