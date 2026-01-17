import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const PaymentStatus = ({ payment, onBack, onRetry }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(15 * 60);

  const generateQRCode = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/payment/${payment.id}/promptpay`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQrData(response.data.promptPay);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setLoading(false);
    }
  }, [payment?.id]);

  useEffect(() => {
    if (payment?.method === 'promptpay' && payment?.status === 'pending') {
      generateQRCode();
    }
  }, [payment, generateQRCode]);

  useEffect(() => {
    if (countdown > 0 && payment?.status === 'pending') {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, payment?.status]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getMethodLabel = (method) => {
    switch (method) {
      case 'cash': return { label: 'เก็บเงินปลายทาง', icon: 'fa-money-bill-wave', color: 'text-green-600' };
      case 'credit_card': return { label: 'บัตรเครดิต/เดบิต', icon: 'fa-credit-card', color: 'text-blue-600' };
      case 'qr_code': return { label: 'QR Code', icon: 'fa-qrcode', color: 'text-purple-600' };
      case 'promptpay': return { label: 'พร้อมเพย์', icon: 'fa-mobile-alt', color: 'text-blue-600' };
      case 'bank_transfer': return { label: 'โอนเงิน', icon: 'fa-university', color: 'text-gray-600' };
      default: return { label: method, icon: 'fa-wallet', color: 'text-gray-600' };
    }
  };

  const methodInfo = getMethodLabel(payment?.method);

  return (
    <div className="max-w-lg mx-auto">
      {/* Status Card */}
      <div className="bg-white rounded-sm shadow-sm overflow-hidden">
        {/* Success Header */}
        {payment?.status === 'completed' && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-check text-green-500 text-2xl"></i>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">ชำระเงินสำเร็จ!</h2>
            <p className="text-white/80 text-sm">คำสั่งซื้อของคุณได้รับการยืนยันแล้ว</p>
          </div>
        )}

        {/* Pending Header */}
        {payment?.status === 'pending' && (
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-clock text-yellow-500 text-2xl"></i>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">รอการชำระเงิน</h2>
            <p className="text-white/80 text-sm">กรุณาชำระเงินเพื่อยืนยันคำสั่งซื้อ</p>
          </div>
        )}

        {/* Failed Header */}
        {payment?.status === 'failed' && (
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-times text-red-500 text-2xl"></i>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">การชำระเงินล้มเหลว</h2>
            <p className="text-white/80 text-sm">เกิดข้อผิดพลาดในการชำระเงิน</p>
          </div>
        )}

        {/* Payment Details */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">หมายเลขคำสั่งซื้อ</span>
            <span className="text-sm font-medium text-gray-900">{payment?.transactionId}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">ยอดชำระ</span>
            <span className="text-lg font-bold text-[#ee4d2d]">฿{payment?.amount?.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">วิธีชำระเงิน</span>
            <span className={`text-sm font-medium flex items-center gap-1.5 ${methodInfo.color}`}>
              <i className={`fas ${methodInfo.icon}`}></i>
              {methodInfo.label}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">วันที่</span>
            <span className="text-sm text-gray-900">
              {payment?.createdAt && new Date(payment.createdAt).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-500">สถานะ</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${payment?.status === 'completed' ? 'bg-green-100 text-green-600' :
                payment?.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-red-100 text-red-600'
              }`}>
              {payment?.status === 'completed' ? 'สำเร็จ' : payment?.status === 'pending' ? 'รอดำเนินการ' : 'ล้มเหลว'}
            </span>
          </div>
        </div>

        {/* PromptPay QR Code */}
        {payment?.method === 'promptpay' && payment?.status === 'pending' && (
          <div className="p-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-900 mb-3 text-center">สแกน QR Code เพื่อชำระเงิน</p>

            {loading ? (
              <div className="flex justify-center py-6">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-[#ee4d2d] rounded-full animate-spin"></div>
              </div>
            ) : qrData ? (
              <div className="text-center">
                <div className="bg-gray-50 p-4 rounded-sm border border-gray-200 inline-block mb-3">
                  <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center">
                    <div className="text-center">
                      <i className="fas fa-qrcode text-4xl text-gray-300 mb-2"></i>
                      <p className="text-xs text-gray-400">QR Code</p>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">หมดอายุใน</p>
                  <p className="text-2xl font-bold text-red-500">{formatTime(countdown)}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <button onClick={generateQRCode} className="px-4 py-2 bg-[#ee4d2d] text-white rounded-sm text-sm">
                  สร้าง QR Code
                </button>
              </div>
            )}
          </div>
        )}

        {/* Success Message */}
        {payment?.status === 'completed' && (
          <div className="p-4 bg-green-50 border-t border-green-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-truck text-green-600 text-sm"></i>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">กำลังเตรียมจัดส่ง</p>
                <p className="text-xs text-green-600">ร้านค้าจะดำเนินการจัดส่งสินค้าของคุณโดยเร็วที่สุด</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          {payment?.status === 'completed' ? (
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/orders"
                className="py-2.5 bg-[#ee4d2d] text-white rounded-sm text-sm font-medium text-center hover:bg-[#d73211]"
              >
                <i className="fas fa-receipt mr-1.5"></i>
                ดูคำสั่งซื้อ
              </Link>
              <Link
                to="/products"
                className="py-2.5 border border-gray-300 text-gray-700 rounded-sm text-sm font-medium text-center hover:bg-white"
              >
                <i className="fas fa-shopping-bag mr-1.5"></i>
                ช้อปต่อ
              </Link>
            </div>
          ) : payment?.status === 'failed' ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onRetry}
                className="py-2.5 bg-[#ee4d2d] text-white rounded-sm text-sm font-medium hover:bg-[#d73211]"
              >
                <i className="fas fa-redo mr-1.5"></i>
                ลองใหม่
              </button>
              <button
                onClick={onBack}
                className="py-2.5 border border-gray-300 text-gray-700 rounded-sm text-sm font-medium hover:bg-white"
              >
                <i className="fas fa-arrow-left mr-1.5"></i>
                ย้อนกลับ
              </button>
            </div>
          ) : (
            <button
              onClick={onBack}
              className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-sm text-sm font-medium hover:bg-white"
            >
              <i className="fas fa-arrow-left mr-1.5"></i>
              ย้อนกลับ
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;
