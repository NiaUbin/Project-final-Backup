import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import CreditCardForm from './CreditCardForm';
import PaymentStatus from './PaymentStatus';
import { QRCodeSVG } from 'qrcode.react';

const PaymentCheckout = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [order, setOrder] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [cardInfo, setCardInfo] = useState(null);
  const [cardValid, setCardValid] = useState(false);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [note, setNote] = useState('');
  const [selectedShipping, setSelectedShipping] = useState('standard');

  const fetchOrder = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/user/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const foundOrder = response.data.orders.find(o => o.id === parseInt(orderId));
      if (foundOrder) {
        setOrder(foundOrder);

        if (foundOrder.payments && foundOrder.payments.length > 0) {
          const pendingPayment = foundOrder.payments.find(p =>
            p.status === 'pending' && p.method === 'qr_code'
          );

          if (pendingPayment) {
            setPayment({
              id: pendingPayment.id,
              amount: pendingPayment.amount,
              method: pendingPayment.method,
              status: pendingPayment.status,
              transactionId: pendingPayment.transactionId,
              qrCodeData: pendingPayment.qrCodeData,
              paymentSlipUrl: pendingPayment.paymentSlipUrl
            });
            setSelectedMethod('qr_code');

            if (pendingPayment.paymentSlipUrl) {
              setSlipPreview(pendingPayment.paymentSlipUrl);
            }

            setStep(2);
            toast.info('พบการชำระเงินที่ยังไม่เสร็จสิ้น');
          }
        }
      } else {
        toast.error('ไม่พบคำสั่งซื้อ');
        navigate('/orders');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ');
      navigate('/orders');
    }
  }, [orderId, navigate]);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, fetchOrder]);

  const handleMethodSelect = (methodId) => {
    setSelectedMethod(methodId);
  };

  const handleCardInfoChange = (nextCard, meta) => {
    setCardInfo(nextCard);
    setCardValid(!!meta?.valid);
  };

  const shippingOptions = [
    { id: 'standard', name: 'ส่งปกติ', price: 0, days: '3-5 วัน', icon: 'fa-truck' },
    { id: 'express', name: 'ส่งด่วน', price: 50, days: '1-2 วัน', icon: 'fa-shipping-fast' }
  ];

  const shippingFee = shippingOptions.find(s => s.id === selectedShipping)?.price || 0;
  const discountAmount = order?.discountAmount || 0;
  const originalSubtotal = order?.products?.reduce((sum, item) => sum + (item.price * item.count), 0) || 0;
  const subtotal = originalSubtotal > 0 ? originalSubtotal : ((order?.cartTotal || 0) + discountAmount);
  const finalSubtotal = order?.cartTotal || 0;
  const totalAmount = finalSubtotal + shippingFee;

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.warning('กรุณาเลือกวิธีการชำระเงิน');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      let method = 'cash';
      if (selectedMethod === 'credit_card') method = 'credit_card';
      else if (selectedMethod === 'qr_code') method = 'qr_code';

      const response = await axios.post('/api/payment', {
        orderId: order.id,
        method: method,
        shippingFee: shippingFee,
        customerInfo: {
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          address: user?.address || ''
        },
        cardInfo: selectedMethod === 'credit_card' ? {
          last4: (cardInfo?.cardNumber || '').replace(/\D/g, '').slice(-4),
          brand: 'VISA',
          exp: cardInfo?.expiry || ''
        } : undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPayment(response.data.payment);

      if (method === 'qr_code') {
        setStep(2);
      } else {
        setStep(3);
      }

      toast.success(response.data.message || 'สร้างคำสั่งชำระเงินสำเร็จ');

    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างคำสั่งชำระเงิน');
    } finally {
      setLoading(false);
    }
  };

  const handleSlipFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('ไฟล์รูปภาพใหญ่เกินไป (จำกัด 5MB)');
        return;
      }

      setSlipFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSlip = async () => {
    if (!slipFile && !payment?.paymentSlipUrl) {
      toast.warning('กรุณาเลือกรูปสลีปการโอนเงิน');
      return;
    }

    if (slipFile) {
      try {
        setUploadingSlip(true);
        const token = localStorage.getItem('token');

        const formData = new FormData();
        formData.append('slip', slipFile);

        const response = await axios.post(`/api/payment/${payment.id}/upload-slip`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        toast.success('อัพโหลดสลีปสำเร็จ!');
        setPayment(response.data.payment);

        setTimeout(() => {
          setStep(3);
        }, 1500);

      } catch (error) {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัพโหลดสลีป');
      } finally {
        setUploadingSlip(false);
      }
    } else if (payment?.paymentSlipUrl && payment?.status === 'pending') {
      try {
        setUploadingSlip(true);
        const token = localStorage.getItem('token');

        const response = await axios.get(`/api/payment/${payment.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const updatedPayment = response.data.payment;
        setPayment({
          id: updatedPayment.id,
          amount: updatedPayment.amount,
          method: updatedPayment.method,
          status: updatedPayment.status,
          transactionId: updatedPayment.transactionId,
          qrCodeData: updatedPayment.qrCodeData,
          paymentSlipUrl: updatedPayment.paymentSlipUrl
        });

        if (updatedPayment.status === 'completed') {
          toast.success('การชำระเงินเสร็จสิ้นแล้ว');
          setTimeout(() => {
            setStep(3);
          }, 1500);
        } else {
          toast.info('กำลังตรวจสอบสถานะการชำระเงิน...');
        }
      } catch (error) {
        toast.error('เกิดข้อผิดพลาดในการตรวจสอบสถานะ');
      } finally {
        setUploadingSlip(false);
      }
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setPayment(null);
      setSlipFile(null);
      setSlipPreview(null);
    } else if (step === 3) {
      setStep(1);
      setPayment(null);
    } else {
      navigate('/orders');
    }
  };

  const handleRetry = () => {
    setStep(1);
    setPayment(null);
    setSelectedMethod(null);
    setSlipFile(null);
    setSlipPreview(null);
  };

  if (!order || !user) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-100 border-t-[#ee4d2d] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] pt-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-[1200px] mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Link to="/orders" className="text-gray-500 hover:text-gray-700">
              <i className="fas fa-arrow-left"></i>
            </Link>
            <h1 className="text-lg font-medium text-gray-900">ชำระเงิน</h1>
            <div className="flex-1"></div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className={step >= 1 ? 'text-[#ee4d2d] font-medium' : ''}>เลือกการชำระ</span>
              <i className="fas fa-chevron-right text-xs"></i>
              <span className={step >= 2 ? 'text-[#ee4d2d] font-medium' : ''}>ชำระเงิน</span>
              <i className="fas fa-chevron-right text-xs"></i>
              <span className={step >= 3 ? 'text-[#ee4d2d] font-medium' : ''}>สำเร็จ</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-4">
        {step === 1 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-3">
              {/* Shipping Address */}
              <div className="bg-white rounded-sm shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <i className="fas fa-map-marker-alt text-[#ee4d2d]"></i>
                  <h3 className="font-medium text-gray-900">ที่อยู่จัดส่ง</h3>
                </div>
                <div className="flex items-start justify-between">
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{user.name || 'ไม่ระบุชื่อ'}</p>
                    <p className="text-gray-600 mt-1">{user.phone || user.email || '-'}</p>
                    <p className="text-gray-600 mt-1 whitespace-pre-line">{user.address || 'กรุณาระบุที่อยู่ในโปรไฟล์'}</p>
                  </div>
                  <Link to="/profile" className="text-sm text-[#ee4d2d] hover:underline">แก้ไข</Link>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-sm shadow-sm">
                <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                  <i className="fas fa-store text-[#ee4d2d] text-sm"></i>
                  <span className="font-medium text-sm text-gray-900">
                    {order.products?.[0]?.product?.store?.name || 'ร้านค้า'}
                  </span>
                </div>

                <div className="divide-y divide-gray-50">
                  {order.products?.map((item, idx) => (
                    <div key={idx} className="p-3 flex gap-3">
                      <div className="w-16 h-16 rounded-sm overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0].url || item.product.images[0].secure_url}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <i className="fas fa-image text-gray-300"></i>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm text-gray-900 line-clamp-1">{item.product?.title || 'สินค้า'}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">ตัวเลือก: {item.variant || 'ไม่ระบุ'}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-400">x{item.count || 1}</span>
                          <span className="text-sm font-medium text-[#ee4d2d]">฿{(item.price * (item.count || 1)).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Note */}
                <div className="p-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 whitespace-nowrap">หมายเหตุ:</span>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="ฝากข้อความถึงร้านค้า..."
                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-[#ee4d2d]"
                    />
                  </div>
                </div>

                {/* Shipping */}
                <div className="p-3 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">ตัวเลือกการจัดส่ง</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {shippingOptions.map((option) => (
                      <label
                        key={option.id}
                        className={`p-2 border rounded-sm cursor-pointer transition-all ${selectedShipping === option.id
                            ? 'border-[#ee4d2d] bg-[#fef0ed]'
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="shipping"
                            value={option.id}
                            checked={selectedShipping === option.id}
                            onChange={(e) => setSelectedShipping(e.target.value)}
                            className="hidden"
                          />
                          <i className={`fas ${option.icon} ${selectedShipping === option.id ? 'text-[#ee4d2d]' : 'text-gray-400'}`}></i>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{option.name}</p>
                            <p className="text-xs text-gray-500">{option.days}</p>
                          </div>
                          <span className={`text-sm font-medium ${selectedShipping === option.id ? 'text-[#ee4d2d]' : 'text-gray-600'}`}>
                            {option.price === 0 ? 'ฟรี' : `฿${option.price}`}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Payment */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-28 space-y-3">
                {/* Payment Methods */}
                <div className="bg-white rounded-sm shadow-sm p-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <i className="fas fa-credit-card text-[#ee4d2d]"></i>
                    วิธีชำระเงิน
                  </h3>

                  <div className="space-y-2">
                    {[
                      { id: 'cod', name: 'เก็บเงินปลายทาง', icon: 'fa-money-bill-wave', color: 'text-green-600' },
                      { id: 'credit_card', name: 'บัตรเครดิต/เดบิต', icon: 'fa-credit-card', color: 'text-blue-600' },
                      { id: 'qr_code', name: 'สแกน QR Code', icon: 'fa-qrcode', color: 'text-purple-600' },
                    ].map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-all ${selectedMethod === method.id
                            ? 'border-[#ee4d2d] bg-[#fef0ed]'
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={selectedMethod === method.id}
                          onChange={(e) => handleMethodSelect(e.target.value)}
                          className="hidden"
                        />
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedMethod === method.id ? 'bg-[#ee4d2d]' : 'bg-gray-100'}`}>
                          <i className={`fas ${method.icon} ${selectedMethod === method.id ? 'text-white' : method.color} text-sm`}></i>
                        </div>
                        <span className={`text-sm ${selectedMethod === method.id ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                          {method.name}
                        </span>
                        {selectedMethod === method.id && (
                          <i className="fas fa-check text-[#ee4d2d] ml-auto"></i>
                        )}
                      </label>
                    ))}
                  </div>

                  {selectedMethod === 'credit_card' && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <CreditCardForm value={cardInfo} onChange={handleCardInfoChange} />
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                <div className="bg-white rounded-sm shadow-sm p-4">
                  <h3 className="font-medium text-gray-900 mb-3">สรุปคำสั่งซื้อ</h3>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">รวมค่าสินค้า</span>
                      <span className="text-gray-900">฿{subtotal.toLocaleString()}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span className="flex items-center gap-1">
                          <i className="fas fa-tag text-xs"></i>
                          ส่วนลด {order?.discountCode && `(${order.discountCode})`}
                        </span>
                        <span>-฿{discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">ค่าจัดส่ง</span>
                      <span className={shippingFee === 0 ? 'text-green-600' : 'text-gray-900'}>
                        {shippingFee === 0 ? 'ฟรี' : `฿${shippingFee.toLocaleString()}`}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-900">ยอดชำระทั้งหมด</span>
                      <span className="text-xl font-bold text-[#ee4d2d]">฿{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={!selectedMethod || loading || (selectedMethod === 'credit_card' && !cardValid)}
                    className={`w-full mt-4 py-2.5 rounded-sm font-medium text-sm transition-all ${selectedMethod && !loading && (selectedMethod !== 'credit_card' || cardValid)
                        ? 'bg-[#ee4d2d] hover:bg-[#d73211] text-white'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {loading ? (
                      <><i className="fas fa-spinner fa-spin mr-2"></i>กำลังดำเนินการ...</>
                    ) : (
                      'ยืนยันชำระเงิน'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : step === 2 ? (
          // QR Code Step
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-sm shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-[#ee4d2d] to-[#f7522e] text-center">
                <i className="fas fa-qrcode text-white text-3xl mb-2"></i>
                <h2 className="text-lg font-medium text-white">ชำระเงินด้วย QR Code</h2>
                <p className="text-white/80 text-sm">สแกน QR แล้วอัพโหลดสลีป</p>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* QR Code */}
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">สแกน QR Code นี้</p>
                    <div className="bg-white p-3 rounded-sm border-2 border-gray-200 inline-block">
                      {payment?.qrCodeData ? (
                        <QRCodeSVG value={payment.qrCodeData} size={180} level="H" includeMargin={true} />
                      ) : (
                        <div className="w-[180px] h-[180px] bg-gray-100 flex items-center justify-center">
                          <i className="fas fa-qrcode text-4xl text-gray-300"></i>
                        </div>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-[#ee4d2d] mt-3">฿{totalAmount.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">Ref: {payment?.transactionId}</p>
                  </div>

                  {/* Upload Slip */}
                  <div>
                    <p className="text-sm text-gray-600 mb-3 text-center md:text-left">อัพโหลดสลีปการโอน</p>

                    {slipPreview ? (
                      <div className="relative">
                        <img src={slipPreview} alt="Slip" className="w-full h-48 object-contain rounded-sm border border-gray-200" />
                        <button
                          onClick={() => { setSlipFile(null); setSlipPreview(null); }}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ) : (
                      <label className="block w-full h-48 border-2 border-dashed border-gray-300 rounded-sm cursor-pointer hover:border-[#ee4d2d] transition-colors">
                        <div className="flex flex-col items-center justify-center h-full">
                          <i className="fas fa-cloud-upload-alt text-3xl text-gray-300 mb-2"></i>
                          <p className="text-sm text-gray-500">คลิกเพื่อเลือกรูป</p>
                          <p className="text-xs text-gray-400">PNG, JPG (max 5MB)</p>
                        </div>
                        <input type="file" accept="image/*" onChange={handleSlipFileChange} className="hidden" />
                      </label>
                    )}

                    <button
                      onClick={handleUploadSlip}
                      disabled={(!slipFile && !payment?.paymentSlipUrl) || uploadingSlip || payment?.status === 'completed'}
                      className={`w-full mt-3 py-2 rounded-sm font-medium text-sm transition-all ${((slipFile || payment?.paymentSlipUrl) && !uploadingSlip && payment?.status !== 'completed')
                          ? 'bg-[#ee4d2d] hover:bg-[#d73211] text-white'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                      {uploadingSlip ? (
                        <><i className="fas fa-spinner fa-spin mr-2"></i>กำลังอัพโหลด...</>
                      ) : payment?.status === 'completed' ? (
                        <><i className="fas fa-check mr-2"></i>ชำระเรียบร้อย</>
                      ) : (
                        <><i className="fas fa-upload mr-2"></i>ยืนยันการชำระเงิน</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="mt-4 p-3 bg-blue-50 rounded-sm">
                  <p className="text-sm font-medium text-blue-800 mb-2">วิธีการชำระเงิน:</p>
                  <ol className="text-xs text-blue-700 space-y-1">
                    <li>1. เปิดแอพธนาคารและเลือก "สแกน QR"</li>
                    <li>2. สแกน QR Code ด้านบน</li>
                    <li>3. ตรวจสอบยอดเงินและกดยืนยัน</li>
                    <li>4. อัพโหลดรูปสลีปและกดยืนยัน</li>
                  </ol>
                </div>

                <button
                  onClick={handleBack}
                  className="w-full mt-3 py-2 border border-gray-300 text-gray-600 rounded-sm text-sm hover:bg-gray-50"
                >
                  <i className="fas fa-arrow-left mr-2"></i>ย้อนกลับ
                </button>
              </div>
            </div>
          </div>
        ) : (
          <PaymentStatus payment={payment} onBack={handleBack} onRetry={handleRetry} />
        )}
      </div>
    </div>
  );
};

export default PaymentCheckout;
