import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const StoreList = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get('/api/stores');
        setStores(data.stores || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredStores = stores.filter(s =>
    !searchQuery ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center pt-16">
        <div className="w-10 h-10 border-4 border-orange-100 border-t-[#ee4d2d] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] pt-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#ee4d2d] to-[#f7522e]">
        <div className="max-w-[1200px] mx-auto px-4 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-sm flex items-center justify-center">
                <i className="fas fa-store text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">ร้านค้าทั้งหมด</h1>
                <p className="text-white/80 text-sm">{stores.length} ร้านค้า</p>
              </div>
            </div>

            <div className="w-full md:w-80">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหาร้านค้า..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pr-10 rounded-sm text-sm focus:outline-none"
                />
                <i className="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-4">
        {/* Results */}
        {filteredStores.length > 0 && searchQuery && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              พบ <span className="font-medium text-[#ee4d2d]">{filteredStores.length}</span> ร้านค้า
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-sm text-[#ee4d2d] hover:underline"
            >
              ล้างการค้นหา
            </button>
          </div>
        )}

        {filteredStores.length === 0 ? (
          <div className="bg-white rounded-sm shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-store text-gray-300 text-3xl"></i>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">
              {searchQuery ? 'ไม่พบร้านค้าที่ค้นหา' : 'ยังไม่มีร้านค้า'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery ? 'ลองค้นหาด้วยคำอื่น' : 'เป็นคนแรกที่สร้างร้านค้า'}
            </p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="px-6 py-2 bg-[#ee4d2d] text-white rounded-sm text-sm font-medium hover:bg-[#d73211]"
              >
                ล้างการค้นหา
              </button>
            ) : (
              <Link to="/become-seller" className="px-6 py-2 bg-[#ee4d2d] text-white rounded-sm text-sm font-medium hover:bg-[#d73211] inline-block">
                <i className="fas fa-plus mr-2"></i>สร้างร้านค้า
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredStores.map((s) => (
              <Link
                key={s.id}
                to={`/store/${s.id}`}
                className="bg-white rounded-sm shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
              >
                {/* Store Header */}
                <div className="p-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#fef0ed] rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border-2 border-[#ee4d2d]/20">
                      {s.logo ? (
                        <img src={s.logo} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <i className="fas fa-store text-[#ee4d2d]"></i>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-gray-900 truncate group-hover:text-[#ee4d2d]">
                        {s.name}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {s.description || 'ยินดีต้อนรับ'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Products Preview */}
                {s.products?.length > 0 ? (
                  <div className="p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600">
                        <i className="fas fa-box text-[#ee4d2d] mr-1"></i>
                        {s.products.length} สินค้า
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {s.products.slice(0, 4).map(p => (
                        <div key={p.id} className="aspect-square bg-white rounded-sm overflow-hidden border border-gray-200">
                          {p.images?.[0] ? (
                            <img
                              src={p.images[0].url || p.images[0].secure_url}
                              alt={p.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <i className="fas fa-image text-gray-200 text-xs"></i>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center bg-gray-50">
                    <i className="fas fa-box-open text-gray-200 text-xl"></i>
                    <p className="text-xs text-gray-400 mt-1">ยังไม่มีสินค้า</p>
                  </div>
                )}

                {/* Footer */}
                <div className="px-3 py-2 bg-white border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">
                    {new Date(s.createdAt).toLocaleDateString('th-TH', { month: 'short', year: '2-digit' })}
                  </span>
                  <span className="text-xs text-[#ee4d2d] font-medium group-hover:underline">
                    ดูร้าน <i className="fas fa-chevron-right text-[10px]"></i>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        {filteredStores.length > 0 && (
          <div className="mt-6 bg-gradient-to-r from-[#ee4d2d] to-[#f7522e] rounded-sm p-6 text-center">
            <h2 className="text-lg font-bold text-white mb-2">พร้อมเริ่มขายสินค้าแล้วหรือยัง?</h2>
            <p className="text-white/80 text-sm mb-4">สร้างร้านค้าของคุณและเริ่มขายได้เลย</p>
            <div className="flex items-center justify-center gap-3">
              <Link to="/become-seller" className="px-5 py-2 bg-white text-[#ee4d2d] rounded-sm text-sm font-medium hover:bg-gray-50">
                <i className="fas fa-store mr-1.5"></i>สร้างร้านค้าฟรี
              </Link>
              <Link to="/products" className="px-5 py-2 bg-transparent border border-white/50 text-white rounded-sm text-sm font-medium hover:bg-white/10">
                <i className="fas fa-shopping-bag mr-1.5"></i>ดูสินค้า
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreList;
