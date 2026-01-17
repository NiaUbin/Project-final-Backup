import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ReviewForm = ({ orderItemId, productTitle, onSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  const submit = async () => {
    if (!rating) {
      toast.warning('กรุณาเลือกคะแนน');
      return;
    }
    try {
      setLoading(true);
      await axios.post('/api/review', { orderItemId, rating, comment }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onSubmitted) onSubmitted();
    } catch (e) {
      const message = e.response?.data?.message || 'เกิดข้อผิดพลาดในการส่งรีวิว';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="text-sm font-medium text-gray-900 mb-2">ให้คะแนนสินค้า: {productTitle}</div>
      <div className="flex items-center gap-2 mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            onClick={() => setRating(i + 1)}
            className="text-yellow-400"
          >
            <i className={`fas fa-star ${i < rating ? '' : 'text-gray-300'}`}></i>
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="เขียนความคิดเห็นของคุณ..."
        className="w-full border border-gray-300 rounded p-2 text-sm mb-2"
        rows={3}
      />
      <button
        onClick={submit}
        disabled={loading}
        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded disabled:opacity-50"
      >
        {loading ? 'กำลังบันทึก...' : 'ส่งรีวิว'}
      </button>
    </div>
  );
};

export default ReviewForm;


