import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const StoreReviewList = ({ storeId, storeOwnerId }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingReviews, setDeletingReviews] = useState(new Set());
  const [summary, setSummary] = useState({ count: 0, average: 0 });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!storeId) {
        setReviews([]);
        setSummary({ count: 0, average: 0 });
        return;
      }
      try {
        setLoading(true);
        const res = await axios.get(`/api/review/store/${storeId}`);
        if (!cancelled) {
          const reviews = res.data.reviews || [];
          setReviews(reviews);
          // Calculate summary
          if (reviews.length > 0) {
            const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
            setSummary({ count: reviews.length, average: Number(avg.toFixed(1)) });
          } else {
            setSummary({ count: 0, average: 0 });
          }
        }
      } catch (e) {
        console.error('Load store reviews error:', e);
        // Don't show error to user, just show empty reviews
        if (!cancelled) {
          setReviews([]);
          setSummary({ count: 0, average: 0 });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [storeId]);

  // Check if user can delete this review (only store owner, not admin)
  const canDeleteReview = (review) => {
    if (!user || !storeOwnerId) {
      return false;
    }
    // Only store owner can delete, not admin
    return user.id === storeOwnerId;
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบรีวิวนี้?')) {
      return;
    }

    try {
      setDeletingReviews(prev => new Set(prev).add(reviewId));
      const token = localStorage.getItem('token');
      await axios.delete(`/api/review/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Remove review from state
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      
      // Recalculate summary
      const updatedReviews = reviews.filter(r => r.id !== reviewId);
      if (updatedReviews.length > 0) {
        const avg = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
        setSummary({ count: updatedReviews.length, average: Number(avg.toFixed(1)) });
      } else {
        setSummary({ count: 0, average: 0 });
      }

      showNotification('ลบรีวิวสำเร็จ', 'success');
    } catch (err) {
      console.error('Delete review error:', err);
      showNotification(
        err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบรีวิว',
        'error'
      );
    } finally {
      setDeletingReviews(prev => {
        const next = new Set(prev);
        next.delete(reviewId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="py-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
        <p className="text-sm text-gray-600 mt-2">กำลังโหลดรีวิว...</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">รีวิวร้านค้า</h3>
          {summary.count > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {summary.count} รีวิว · เฉลี่ย {summary.average} <i className="fas fa-star text-yellow-400 text-xs"></i>
            </p>
          )}
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <i className="fas fa-comment-alt text-gray-300 text-4xl mb-3"></i>
          <p className="text-sm text-gray-500">ยังไม่มีรีวิวสำหรับร้านค้านี้</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border border-gray-200 rounded-xl p-5 bg-white hover:shadow-lg transition-all duration-200 relative">
              {/* Delete Button - Fixed Position */}
              {canDeleteReview(review) && (
                <button
                  onClick={() => handleDeleteReview(review.id)}
                  disabled={deletingReviews.has(review.id)}
                  className="absolute top-3 right-3 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-1.5 shadow-md hover:shadow-lg transform hover:scale-105 z-10"
                  title="ลบรีวิวนี้"
                >
                  {deletingReviews.has(review.id) ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>กำลังลบ...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash-alt text-xs"></i>
                      <span>ลบรีวิว</span>
                    </>
                  )}
                </button>
              )}
              
              <div className="flex items-start gap-3">
                {/* User Avatar */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex-shrink-0 flex items-center justify-center border-2 border-orange-300 shadow-sm">
                  {review.user?.picture ? (
                    <img 
                      src={review.user.picture} 
                      alt={review.user?.name || 'ผู้ใช้'} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center ${review.user?.picture ? 'hidden' : 'flex'}`}>
                    <i className="fas fa-user text-white text-base"></i>
                  </div>
                </div>

                <div className="flex-1 min-w-0 pr-20">
                  {/* User Name and Rating */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {review.user?.name || 'ผู้ใช้'}
                    </span>
                    <div className="flex items-center text-yellow-400 gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <i 
                          key={i} 
                          className={`fas fa-star text-sm ${i < review.rating ? '' : 'text-gray-300'}`}
                        ></i>
                      ))}
                    </div>
                    <span className="text-xs font-bold text-orange-600 ml-1 bg-orange-50 px-2 py-0.5 rounded">
                      {review.rating}/5
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {new Date(review.createdAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Product Link */}
                  {review.product && (
                    <Link 
                      to={`/product/${review.product.id}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg text-xs font-medium mb-3 transition-colors border border-orange-200"
                    >
                      {review.product.images?.[0] && (
                        <img 
                          src={review.product.images[0].url || review.product.images[0]} 
                          alt={review.product.title}
                          className="w-6 h-6 object-cover rounded"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      <i className="fas fa-box text-xs"></i>
                      <span className="line-clamp-1">{review.product.title}</span>
                      <i className="fas fa-chevron-right text-xs ml-auto"></i>
                    </Link>
                  )}

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap leading-relaxed">
                      {review.comment}
                    </p>
                  )}

                  {/* Review Images */}
                  {review.images && (() => {
                    try {
                      const images = typeof review.images === 'string' 
                        ? JSON.parse(review.images) 
                        : review.images;
                      if (Array.isArray(images) && images.length > 0) {
                        return (
                          <div className="flex gap-2 mt-3 flex-wrap">
                            {images.map((img, idx) => (
                              <div key={idx} className="relative group">
                                <img 
                                  src={img} 
                                  alt={`Review ${idx + 1}`}
                                  className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 hover:border-orange-400 transition-all cursor-pointer"
                                  onClick={() => window.open(img, '_blank')}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all flex items-center justify-center">
                                  <i className="fas fa-search-plus text-white opacity-0 group-hover:opacity-100 transition-opacity"></i>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }
                    } catch (e) {
                      return null;
                    }
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoreReviewList;

