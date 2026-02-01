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

  // Filter & Pagination Logic
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.categoryId === parseInt(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

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
    if (quantity <= 0) return { label: 'สินค้าหมด', color: 'bg-slate-100 text-slate-500 border-slate-200' };
    if (quantity < 10) return { label: 'สินค้าใกล้หมด', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'มีสินค้า', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อสินค้า, รายละเอียด..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
            <i className="fas fa-search absolute left-3 top-3 text-slate-400 text-sm"></i>
          </div>
          
          <div className="md:col-span-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
            >
              <option value="">ทุกหมวดหมู่</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
             <select
              value={productsPerPage}
              onChange={(e) => setProductsPerPage(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
            >
              <option value="10">แสดง 10 รายการ</option>
              <option value="20">แสดง 20 รายการ</option>
              <option value="50">แสดง 50 รายการ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider font-semibold">
              <th className="p-4 pl-6">สินค้า</th>
              <th className="p-4">หมวดหมู่</th>
              <th className="p-4">ราคา</th>
              <th className="p-4 text-center">สถานะ</th>
              <th className="p-4 text-right pr-6">จัดการ</th>
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
                  <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white border border-slate-200 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img 
                                src={product.images[0].url || product.images[0].secure_url} 
                                alt={product.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <i className="fas fa-image text-slate-300"></i>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-slate-800 truncate max-w-xs">{product.title}</h4>
                          <p className="text-xs text-slate-500 truncate max-w-xs mt-0.5">
                            {product.description?.substring(0, 50) || 'ไม่มีรายละเอียด'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {product.category?.name || 'ไม่ระบุ'}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-700">
                      ฿{Number(product.price).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${stockStatus.color}`}>
                        {stockStatus.label} ({product.quantity})
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                             setEditingProduct(product);
                             setShowCreateForm(true);
                          }}
                          className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 rounded-lg transition-all shadow-sm"
                          title="แก้ไข"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 rounded-lg transition-all shadow-sm"
                          title="ลบ"
                        >
                          <i className="fas fa-trash-alt"></i>
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
