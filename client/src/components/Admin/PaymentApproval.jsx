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
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
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
      loadPendingPayments(); // รีเฟรชข้อมูล
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
      loadPendingPayments(); // รีเฟรชข้อมูล
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

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash': return '💵';
      case 'promptpay': return '📱';
      case 'credit_card': return '💳';
      case 'bank_transfer': return '🏦';
      default: return '💰';
    }
  };

  const getPaymentMethodName = (method) => {
    switch (method) {
      case 'cash': return 'เงินสด';
      case 'promptpay': return 'พร้อมเพย์';
      case 'credit_card': return 'บัตรเครดิต';
      case 'bank_transfer': return 'โอนเงิน';
      default: return method;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                🔔 การอนุมัติการชำระเงิน
              </h1>
              <p className="text-orange-100 text-lg">
                จัดการคำขอชำระเงินที่รอการอนุมัติ
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {pendingPayments.length}
              </div>
              <div className="text-orange-100 text-sm">
                รายการรอการอนุมัติ
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Payments */}
      {pendingPayments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">ไม่มีรายการรอการอนุมัติ</h3>
          <p className="text-gray-600">การชำระเงินทั้งหมดได้รับการดำเนินการแล้ว</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {pendingPayments.map((notification) => {
            const payment = notification.payment;
            const order = notification.order;
            const customer = order.orderedBy;

            return (
              <div key={notification.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl">
                        {getPaymentMethodIcon(payment.method)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">การชำระเงิน #{payment.id}</h3>
                        <p className="text-yellow-100">
                          {getPaymentMethodName(payment.method)} • ฿{payment.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-yellow-100">รอการอนุมัติ</div>
                      <div className="text-lg font-semibold">
                        {new Date(notification.createdAt).toLocaleString('th-TH')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Customer Info */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">ข้อมูลลูกค้า</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-user text-gray-400"></i>
                          <span>{customer.name || 'ไม่ระบุชื่อ'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-envelope text-gray-400"></i>
                          <span>{customer.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-phone text-gray-400"></i>
                          <span>{payment.customerPhone || 'ไม่ระบุเบอร์โทร'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Info */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">ข้อมูลคำสั่งซื้อ</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-shopping-cart text-gray-400"></i>
                          <span>คำสั่งซื้อ #{order.id}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-box text-gray-400"></i>
                          <span>{order.products.length} รายการ</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-money-bill text-gray-400"></i>
                          <span>รวม ฿{order.cartTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Products */}
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">สินค้าที่สั่งซื้อ</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid gap-2">
                        {order.products.map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                            <div>
                              <span className="font-medium">{item.product.title}</span>
                              <span className="text-gray-500 ml-2">x{item.count}</span>
                            </div>
                            <span className="font-semibold">฿{(item.price * item.count).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">รายละเอียดการชำระเงิน</h4>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Transaction ID:</span>
                          <div className="font-mono font-medium">{payment.transactionId}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">สกุลเงิน:</span>
                          <div className="font-medium">{payment.currency}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                  <button
                    onClick={() => openRejectModal(payment.id)}
                    disabled={processing === payment.id}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {processing === payment.id ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        กำลังปฏิเสธ...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-times mr-2"></i>
                        ปฏิเสธ
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleApprove(payment.id)}
                    disabled={processing === payment.id}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    {processing === payment.id ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        กำลังอนุมัติ...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check mr-2"></i>
                        อนุมัติการชำระเงิน
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">ปฏิเสธการชำระเงิน</h3>
            <p className="text-gray-600 mb-4">กรุณาระบุเหตุผลในการปฏิเสธการชำระเงิน</p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              rows="4"
              placeholder="เหตุผลในการปฏิเสธ..."
            />

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeRejectModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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
