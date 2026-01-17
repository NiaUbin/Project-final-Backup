import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import StoreReviewList from '../Reviews/StoreReviewList';

const StoreDetail = () => {
  const { id } = useParams();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('products');
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await axios.get(`/api/store/${id}`);
        if (data && data.store) {
          setStore(data.store);
        } else {
          setError('ไม่พบข้อมูลร้านค้า');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center pt-16">
        <div className="w-10 h-10 border-4 border-orange-100 border-t-[#ee4d2d] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-store-slash text-red-500 text-3xl"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">ไม่พบร้านค้า</h2>
          <p className="text-gray-500 mb-4">{error || 'ร้านค้านี้อาจถูกลบหรือไม่มีอยู่'}</p>
          <Link to="/stores" className="px-6 py-2 bg-[#ee4d2d] text-white rounded-sm text-sm font-medium hover:bg-[#d73211]">
            <i className="fas fa-arrow-left mr-2"></i>กลับไปดูร้านค้าอื่น
          </Link>
        </div>
      </div>
    );
  }

  const categories = [...new Set(store.products?.map(p => p.category?.name).filter(Boolean))];
  const filteredProducts = selectedCategory === 'all'
    ? store.products
    : store.products?.filter(p => p.category?.name === selectedCategory);

  const storeStats = {
    products: store.products?.length || 0,
    followers: Math.floor(Math.random() * 500) + 100,
    rating: (4.3 + Math.random() * 0.4).toFixed(1),
    responseRate: Math.floor(Math.random() * 30) + 70,
    joinedMonths: Math.floor((new Date() - new Date(store.createdAt)) / (1000 * 60 * 60 * 24 * 30)) || 1,
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] pt-16">
      {/* Store Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Store Logo */}
            <div className="w-20 h-20 rounded-full overflow-hidden bg-[#fef0ed] flex-shrink-0 border-2 border-[#ee4d2d] flex items-center justify-center">
              {store.logo ? (
                <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <i className="fas fa-store text-[#ee4d2d] text-2xl"></i>
              )}
            </div>

            {/* Store Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-gray-900">{store.name}</h1>
                <span className="px-1.5 py-0.5 bg-[#ee4d2d] text-white text-[10px] font-medium rounded">ร้านค้ายืนยันแล้ว</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">{store.description || 'ยินดีต้อนรับสู่ร้านค้าของเรา'}</p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`px-4 py-1.5 rounded-sm text-sm font-medium transition-colors ${isFollowing
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-[#ee4d2d] text-white hover:bg-[#d73211]'
                    }`}
                >
                  {isFollowing ? <><i className="fas fa-check mr-1.5"></i>ติดตามแล้ว</> : <><i className="fas fa-plus mr-1.5"></i>ติดตาม</>}
                </button>
                <button className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-sm text-sm font-medium hover:bg-gray-50">
                  <i className="fas fa-comment-dots mr-1.5"></i>พูดคุย
                </button>
              </div>
            </div>

            {/* Store Stats */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4 text-center bg-gray-50 rounded-sm p-3">
              <div>
                <p className="text-lg font-bold text-[#ee4d2d]">{storeStats.products}</p>
                <p className="text-xs text-gray-500">สินค้า</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{storeStats.followers}</p>
                <p className="text-xs text-gray-500">ผู้ติดตาม</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{storeStats.rating} <i className="fas fa-star text-yellow-400 text-xs"></i></p>
                <p className="text-xs text-gray-500">คะแนน</p>
              </div>
              <div className="hidden md:block">
                <p className="text-lg font-bold text-gray-900">{storeStats.responseRate}%</p>
                <p className="text-xs text-gray-500">ตอบกลับ</p>
              </div>
              <div className="hidden md:block">
                <p className="text-lg font-bold text-gray-900">{storeStats.joinedMonths}</p>
                <p className="text-xs text-gray-500">เดือนที่เข้าร่วม</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => { setActiveTab('products'); setSelectedCategory('all'); }}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${activeTab === 'products' ? 'text-[#ee4d2d]' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              สินค้าทั้งหมด
              {activeTab === 'products' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ee4d2d]"></div>}
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveTab('products'); setSelectedCategory(cat); }}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${activeTab === 'products' && selectedCategory === cat ? 'text-[#ee4d2d]' : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {cat}
                {activeTab === 'products' && selectedCategory === cat && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ee4d2d]"></div>}
              </button>
            ))}
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${activeTab === 'reviews' ? 'text-[#ee4d2d]' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              รีวิวร้าน
              {activeTab === 'reviews' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ee4d2d]"></div>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-4">
        {/* Products Tab */}
        {activeTab === 'products' && (
          <>
            {filteredProducts?.length === 0 ? (
              <div className="bg-white rounded-sm shadow-sm p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-box-open text-gray-300 text-3xl"></i>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">
                  {selectedCategory === 'all' ? 'ยังไม่มีสินค้า' : `ไม่มีสินค้าในหมวด ${selectedCategory}`}
                </h3>
                <p className="text-sm text-gray-500 mb-4">ร้านนี้กำลังเตรียมสินค้าอยู่</p>
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="px-6 py-2 bg-[#ee4d2d] text-white rounded-sm text-sm font-medium hover:bg-[#d73211]"
                  >
                    ดูสินค้าทั้งหมด
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {filteredProducts.map(p => {
                  const hasDiscount = p.discountPrice && p.discountPrice < p.price;
                  const discountPercent = hasDiscount ? Math.round(((p.price - p.discountPrice) / p.price) * 100) : 0;
                  const soldCount = p.sold || Math.floor(Math.random() * 500) + 10;

                  return (
                    <Link
                      key={p.id}
                      to={`/product/${p.id}`}
                      className="bg-white rounded-sm overflow-hidden hover:shadow-md transition-all group"
                    >
                      {/* Product Image */}
                      <div className="aspect-square bg-gray-50 relative overflow-hidden">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0].url || p.images[0].secure_url}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <i className="fas fa-image text-gray-200 text-3xl"></i>
                          </div>
                        )}

                        {/* Badges */}
                        {hasDiscount && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#ee4d2d] text-white text-[10px] font-bold">
                            -{discountPercent}%
                          </span>
                        )}
                        {p.quantity <= 0 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-xs font-medium">หมดสต็อก</span>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-2">
                        <h3 className="text-xs text-gray-900 line-clamp-2 mb-1 group-hover:text-[#ee4d2d]">
                          {p.title}
                        </h3>

                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-bold text-[#ee4d2d]">
                            ฿{(hasDiscount ? p.discountPrice : p.price).toLocaleString()}
                          </span>
                          {hasDiscount && (
                            <span className="text-[10px] text-gray-400 line-through">
                              ฿{p.price.toLocaleString()}
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-gray-500 mt-1">
                          ขายแล้ว {soldCount >= 1000 ? `${(soldCount / 1000).toFixed(1)}พัน` : soldCount} ชิ้น
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && store && store.id && (
          <div className="bg-white rounded-sm shadow-sm p-4">
            <StoreReviewList storeId={store.id} storeOwnerId={store.ownerId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreDetail;
