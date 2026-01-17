import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ReviewList = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ count: 0, average: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/review/product/${productId}`);
        if (!cancelled) {
          setReviews(res.data.reviews || []);
          setSummary(res.data.summary || { count: 0, average: 0 });
        }
      } catch (e) {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (productId) load();
    return () => { cancelled = true; };
  }, [productId]);

  if (loading) {
    return (
      <div className="py-4 text-sm text-gray-600">กำลังโหลดรีวิว...</div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-lg font-semibold text-gray-900">รีวิวจากลูกค้า</div>
        <div className="text-sm text-gray-600">({summary.count} รีวิว, เฉลี่ย {summary.average.toFixed ? summary.average.toFixed(1) : summary.average} ดาว)</div>
      </div>
      {reviews.length === 0 ? (
        <div className="text-sm text-gray-500">ยังไม่มีรีวิวสินค้า</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((rv) => (
            <div key={rv.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex-shrink-0 flex items-center justify-center border-2 border-orange-300 shadow-sm">
                  {rv.user?.picture ? (
                    <img 
                      src={rv.user.picture} 
                      alt={rv.user?.name || 'user'} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center ${rv.user?.picture ? 'hidden' : 'flex'}`}>
                    <i className="fas fa-user text-white text-sm"></i>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900">{rv.user?.name || 'ผู้ใช้'}</div>
                <div className="flex items-center text-yellow-400 ml-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <i key={i} className={`fas fa-star ${i < rv.rating ? '' : 'text-gray-300'}`}></i>
                  ))}
                </div>
              </div>
              {rv.comment && <div className="text-sm text-gray-700">{rv.comment}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewList;


