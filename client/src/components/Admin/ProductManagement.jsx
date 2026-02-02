import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProductForm from './ProductForm';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Pagination & Filter state
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStore, setSelectedStore] = useState('');

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/product');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดสินค้า');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await axios.get('/api/category');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Derive unique stores from products
  const uniqueStores = Array.from(
    new Map(
      products
        .filter(p => p.store) // Only products with stores
        .map(p => [p.store.id, p.store])
    ).values()
  );

  // Filter & Pagination Logic
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.categoryId === parseInt(selectedCategory);
    const matchesStore = !selectedStore || (selectedStore === 'admin' ? !product.store : product.store?.id === parseInt(selectedStore));
    
    return matchesSearch && matchesCategory && matchesStore;
  });

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStore]);

  const handleDelete = async (product) => {
    if (!window.confirm(`⚠️ คุณต้องการลบสินค้า "${product.title}" หรือไม่?\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) return;

    try {
      await axios.delete(`/api/product/${product.id}`);
      toast.success('ลบสินค้าสำเร็จ');
      loadProducts();
    } catch (error) {
      console.error('Error:', error);
      toast.error('เกิดข้อผิดพลาดในการลบสินค้า');
    }
  };

  const getStockStatus = (quantity) => {
    if (quantity <= 0) return { label: 'หมด', color: 'bg-red-50 text-red-600 border-red-100 ring-1 ring-red-100' };
    if (quantity < 10) return { label: 'เหลือน้อย', color: 'bg-amber-50 text-amber-600 border-amber-100 ring-1 ring-amber-100' };
    return { label: 'พร้อมขาย', color: 'bg-emerald-50 text-emerald-600 border-emerald-100 ring-1 ring-emerald-100' };
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
      {/* Header & Controls */}
      <div className="p-6 border-b border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-box text-emerald-500"></i>
            สินค้าทั้งหมด
            <span className="text-sm font-normal text-slate-500 ml-2">({filteredProducts.length} รายการ)</span>
          </h2>
          <div className="flex gap-2 w-full sm:w-auto">
             <button
              onClick={loadProducts}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-all text-sm font-semibold flex items-center gap-2 shadow-sm"
            >
              <i className={`fas fa-sync ${loading ? 'animate-spin' : ''}`}></i>
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowCreateForm(true);
              }}
              className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-all text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <i className="fas fa-plus"></i>
              <span>เพิ่มสินค้า</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อสินค้า..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
            <i className="fas fa-search absolute left-3 top-2.5 text-slate-400 text-xs"></i>
          </div>
          
          <div className="md:col-span-3">
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
            >
              <option value="">ทุกร้านค้า</option>
              {/* <option value="admin">Boxify Admin</option> */}
              {uniqueStores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
            >
              <option value="">ทุกหมวดหมู่</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
             <select
              value={productsPerPage}
              onChange={(e) => setProductsPerPage(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
            >
              <option value="10">10 / หน้า</option>
              <option value="20">20 / หน้า</option>
              <option value="50">50 / หน้า</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-medium">
              <th className="py-3 px-6 text-left">สินค้า</th>
              <th className="py-3 px-4 text-left">ร้านค้า</th>
              <th className="py-3 px-4 text-center">หมวดหมู่</th>
              <th className="py-3 px-4 text-right">ราคา</th>
              <th className="py-3 px-4 text-center">สถานะ</th>
              <th className="py-3 px-6 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="5" className="p-10 text-center text-slate-500">กำลังโหลด...</td></tr>
            ) : currentProducts.length === 0 ? (
               <tr>
                <td colSpan="5" className="p-16 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <i className="fas fa-box-open text-4xl mb-3 opacity-50"></i>
                    <p>ไม่พบสินค้าที่ค้นหา</p>
                  </div>
                </td>
              </tr>
            ) : (
              currentProducts.map((product) => {
                const stockStatus = getStockStatus(product.quantity);
                return (
                  <tr key={product.id} className="hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0 group">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-100">
                          {product.images && product.images.length > 0 ? (
                            <img 
                                src={product.images[0].url || product.images[0].secure_url} 
                                alt={product.title} 
                                className="w-full h-full object-cover"
                            />
                          ) : (
                            <i className="fas fa-image text-slate-300 text-xs"></i>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-medium text-slate-700 truncate max-w-[180px]" title={product.title}>{product.title}</h4>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div 
                        className="flex items-center gap-2 cursor-pointer group/store"
                        onClick={() => setSelectedStore(product.store?.id ? String(product.store.id) : 'admin')}
                        title="คลิกเพื่อดูสินค้าจากร้านนี้"
                      >
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-bold border border-slate-200 overflow-hidden group-hover/store:ring-2 group-hover/store:ring-emerald-400 transition-all">
                          {product.store?.logo ? (
                            <img src={product.store.logo} alt={product.store.name} className="w-full h-full object-cover" />
                          ) : (
                            product.store?.name?.charAt(0) || <i className="fas fa-shield-alt text-indigo-500"></i>
                          )}
                        </div>
                        <span className="text-xs text-slate-600 truncate max-w-[120px] group-hover/store:text-emerald-600 transition-colors">
                          {product.store?.name || 'Boxify Admin'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                        {product.category?.name || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700 text-sm">
                      ฿{Number(product.price).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${stockStatus.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1 ${stockStatus.label === 'หมด' ? 'bg-red-400' : stockStatus.label === 'เหลือน้อย' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                        {stockStatus.label} ({product.quantity})
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                             setEditingProduct(product);
                             setShowCreateForm(true);
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                          title="แก้ไข"
                        >
                          <i className="fas fa-pen text-xs"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="w-7 h-7 flex items-center justify-center rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="ลบ"
                        >
                          <i className="fas fa-trash text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

       {/* Pagination Footer */}
       {totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex items-center justify-between">
          <div className="text-xs text-slate-500 hidden sm:block">
            หน้า {currentPage} จาก {totalPages} ({filteredProducts.length} รายการ)
          </div>
          <div className="flex gap-2 mx-auto sm:mx-0">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            
            <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                        pageNum = currentPage - 2 + i;
                        if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                    }
                    
                    return (
                        <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                                currentPage === pageNum 
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' 
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {pageNum}
                        </button>
                    );
                })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {showCreateForm && (
        <ProductForm
          editingProduct={editingProduct}
          onClose={() => {
            setShowCreateForm(false);
            setEditingProduct(null);
          }}
          onSuccess={() => {
            setShowCreateForm(false);
            setEditingProduct(null);
            loadProducts();
          }}
          onRefresh={loadProducts}
        />
      )}
    </div>
  );
};

export default ProductManagement;
