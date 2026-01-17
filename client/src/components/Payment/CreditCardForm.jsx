import React, { useEffect, useState } from 'react';

const initialState = {
	cardNumber: '',
	cardName: '',
	expiry: '',
	cvc: ''
};

const CreditCardForm = ({ value, onChange, disabled }) => {
	const [card, setCard] = useState({ ...initialState, ...(value || {}) });
	const [errors, setErrors] = useState({});

	useEffect(() => {
		setCard(prev => ({ ...prev, ...(value || {}) }));
	}, [value]);

	const luhnCheck = (num) => {
		const sanitized = (num || '').replace(/\s+/g, '');
		if (!/^[0-9]{12,19}$/.test(sanitized)) return false;
		let sum = 0;
		let shouldDouble = false;
		for (let i = sanitized.length - 1; i >= 0; i--) {
			let digit = parseInt(sanitized.charAt(i), 10);
			if (shouldDouble) {
				digit *= 2;
				if (digit > 9) digit -= 9;
			}
			sum += digit;
			shouldDouble = !shouldDouble;
		}
		return sum % 10 === 0;
	};

	const validate = (next) => {
		const v = next ?? card;
		const nextErrors = {};
		// Card number
		const numberSanitized = v.cardNumber.replace(/\D/g, '');
		if (numberSanitized.length < 13 || numberSanitized.length > 19 || !luhnCheck(numberSanitized)) {
			nextErrors.cardNumber = 'หมายเลขบัตรไม่ถูกต้อง';
		}
		// Name
		if (!v.cardName || v.cardName.trim().length < 3) {
			nextErrors.cardName = 'กรุณากรอกชื่อบนบัตร';
		}
		// Expiry MM/YY
		const expMatch = v.expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
		if (!expMatch) {
			nextErrors.expiry = 'รูปแบบหมดอายุไม่ถูกต้อง (MM/YY)';
		} else {
			const mm = parseInt(expMatch[1], 10);
			const yy = parseInt(expMatch[2], 10);
			const now = new Date();
			const year = 2000 + yy;
			const expDate = new Date(year, mm);
			if (expDate <= now) {
				nextErrors.expiry = 'บัตรหมดอายุแล้ว';
			}
		}
		// CVC 3-4 digits
		if (!/^[0-9]{3,4}$/.test(v.cvc)) {
			nextErrors.cvc = 'CVC ไม่ถูกต้อง';
		}
		setErrors(nextErrors);
		return nextErrors;
	};

	const emit = (next) => {
		if (onChange) onChange(next, { valid: Object.keys(validate(next)).length === 0 });
	};

	const handleChange = (field, value) => {
		let next = { ...card, [field]: value };
		// formatting
		if (field === 'cardNumber') {
			const digits = value.replace(/\D/g, '').slice(0, 19);
			next.cardNumber = digits.replace(/(.{4})/g, '$1 ').trim();
		}
		if (field === 'expiry') {
			const digits = value.replace(/\D/g, '').slice(0, 4);
			next.expiry = digits.length > 2 ? `${digits.slice(0,2)}/${digits.slice(2)}` : digits;
		}
		if (field === 'cvc') {
			next.cvc = value.replace(/\D/g, '').slice(0, 4);
		}
		setCard(next);
		emit(next);
	};

	return (
		<div className="bg-white rounded-2xl shadow-lg p-6">
			<h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
				<i className="fas fa-credit-card mr-2 text-purple-500"></i>
				ข้อมูลบัตรเครดิต
			</h3>
			<div className="grid md:grid-cols-2 gap-4">
				<div className="md:col-span-2">
					<label className="block text-sm font-medium text-gray-700 mb-2">หมายเลขบัตร</label>
					<input
						type="text"
						inputMode="numeric"
						value={card.cardNumber}
						onChange={(e) => handleChange('cardNumber', e.target.value)}
						className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.cardNumber ? 'border-red-400' : 'border-gray-300'}`}
						placeholder="1234 5678 9012 3456"
						disabled={disabled}
					/>
					{errors.cardNumber && <p className="text-xs text-red-500 mt-1">{errors.cardNumber}</p>}
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">ชื่อบนบัตร</label>
					<input
						type="text"
						value={card.cardName}
						onChange={(e) => handleChange('cardName', e.target.value)}
						className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.cardName ? 'border-red-400' : 'border-gray-300'}`}
						placeholder="TANAKORN SUWANNAPONG"
						disabled={disabled}
					/>
					{errors.cardName && <p className="text-xs text-red-500 mt-1">{errors.cardName}</p>}
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">หมดอายุ (MM/YY)</label>
						<input
							type="text"
							inputMode="numeric"
							value={card.expiry}
							onChange={(e) => handleChange('expiry', e.target.value)}
							className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.expiry ? 'border-red-400' : 'border-gray-300'}`}
							placeholder="MM/YY"
							disabled={disabled}
						/>
						{errors.expiry && <p className="text-xs text-red-500 mt-1">{errors.expiry}</p>}
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">CVC</label>
						<input
							type="password"
							inputMode="numeric"
							value={card.cvc}
							onChange={(e) => handleChange('cvc', e.target.value)}
							className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.cvc ? 'border-red-400' : 'border-gray-300'}`}
							placeholder="123"
							disabled={disabled}
						/>
						{errors.cvc && <p className="text-xs text-red-500 mt-1">{errors.cvc}</p>}
					</div>
				</div>
			</div>
		</div>
	);
};

export default CreditCardForm;


