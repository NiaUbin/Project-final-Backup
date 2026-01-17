import React, { useState } from 'react';
import CreditCardForm from './CreditCardForm';

const PaymentMethods = ({ onSelectMethod, selectedMethod, orderTotal }) => {
  const [customerInfo, setCustomerInfo] = useState({ email: '', name: '', phone: '' });
  const [cardInfo, setCardInfo] = useState(null);
  const [cardValid, setCardValid] = useState(false);

  const paymentMethods = [
    {
      id: 'cash',
      name: 'ชำระปลายทาง',
      description: 'ชำระเงินสดตอนรับสินค้า',
      icon: '💵',
      color: 'bg-gray-600',
      instant: true
    },
    {
      id: 'credit_card',
      name: 'บัตรเครดิต/เดบิต',
      description: 'ชำระผ่านบัตรเครดิตหรือเดบิต',
      icon: '💳',
      color: 'bg-gray-600',
      instant: false
    }
  ];

  const handleMethodSelect = (method) => {
    onSelectMethod(method, customerInfo, { cardInfo, cardValid });
  };

  const handleCustomerInfoChange = (field, value) => {
    const updatedInfo = { ...customerInfo, [field]: value };
    setCustomerInfo(updatedInfo);
    if (selectedMethod) {
      onSelectMethod(selectedMethod, updatedInfo, { cardInfo, cardValid });
    }
  };

  const handleCardInfoChange = (nextCard, meta) => {
    setCardInfo(nextCard);
    setCardValid(!!meta?.valid);
    if (selectedMethod?.id === 'credit_card') {
      onSelectMethod(selectedMethod, customerInfo, { cardInfo: nextCard, cardValid: !!meta?.valid });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-50 rounded-xl shadow-md">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">วิธีการชำระเงิน</h2>
        <p className="text-gray-600">
          ยอดรวมที่ต้องชำระ: <span className="text-xl font-bold text-green-600">฿{orderTotal?.toLocaleString()}</span>
        </p>
      </div>

      {/* Customer Information
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">ข้อมูลลูกค้า</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <input
            type="email"
            value={customerInfo.email}
            onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
            placeholder="อีเมล"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <input
            type="text"
            value={customerInfo.name}
            onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
            placeholder="ชื่อ-นามสกุล"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <input
            type="tel"
            value={customerInfo.phone}
            onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
            placeholder="เบอร์โทรศัพท์"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div> */}

      {/* Payment Methods */}
      <div className="grid grid-cols-1 gap-4">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            onClick={() => handleMethodSelect(method)}
            className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-200
              ${selectedMethod?.id === method.id ? 'border-green-500 bg-green-50 shadow' : 'border-gray-300 bg-white hover:border-gray-400'}`}
          >
            <div className={`w-12 h-12 ${method.color} rounded-xl flex items-center justify-center text-xl mr-4`}>
              {method.icon}
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{method.name}</h4>
              <p className="text-gray-500 text-sm">{method.description}</p>
            </div>
            {selectedMethod?.id === method.id && (
              <div className="ml-auto text-green-500 font-bold"><i className="fas fa-check"></i></div>
            )}
          </div>
        ))}
      </div>

      {/* Credit Card Details */}
      {selectedMethod?.id === 'credit_card' && (
        <div className="mt-4">
          <CreditCardForm value={cardInfo} onChange={handleCardInfoChange} />
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-6 p-3 bg-gray-100 rounded text-center text-sm text-gray-600 flex items-center justify-center">
        <i className="fas fa-lock mr-2 text-green-500"></i>
        การชำระเงินของคุณได้รับการปกป้องด้วยระบบความปลอดภัย
      </div>
    </div>
  );
};

export default PaymentMethods;
