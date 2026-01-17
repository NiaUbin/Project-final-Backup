import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProductRefreshButton from './ProductRefreshButton';
import ProductForm from './ProductForm';

const ProductManagement = ({ onEditProduct, refreshTrigger }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const [categoryForm, setCategoryForm] = useState({
    name: ''
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  // Refresh when triggered from parent
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadProducts();
    }
  }, [refreshTrigger]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/product');
      setProducts(response.data.products || []);
      console.log('Loaded products:', response.data.products?.length || 0);
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
      toast.error('ไม่สามารถโหลดหมวดหมู่ได้');
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
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

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to top of products section
    const productsSection = document.getElementById('products-section');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.key === 'ArrowLeft' && currentPage > 1) {
        handlePageChange(currentPage - 1);
      } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
        handlePageChange(currentPage + 1);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, totalPages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Products Section */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              <i className="fas fa-box text-green-500 mr-2"></i>
              จัดการสินค้า ({filteredProducts.length} รายการ)
              {filteredProducts.length !== products.length && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  จากทั้งหมด {products.length} รายการ
                </span>
              )}
            </h2>
            <div className="flex items-center space-x-3">
              <ProductRefreshButton onRefresh={loadProducts} loading={loading} />
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setShowCreateForm(true);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200"
              >
                <i className="fas fa-plus mr-2"></i>
                เพิ่มสินค้าใหม่
              </button>
            </div>
          </div>
        </div>

        {/* Product Form */}
        {showCreateForm && (
          <ProductForm
            editingProduct={editingProduct}
            onClose={() => {
              setShowCreateForm(false);
              setEditingProduct(null);
            }}
            onSuccess={async () => {
              try {
                toast.success(editingProduct ? 'อัพเดตสินค้าสำเร็จ!' : 'เพิ่มสินค้าใหม่สำเร็จ!');
                setShowCreateForm(false);
                setEditingProduct(null);
                await loadProducts();
              } catch (error) {
                console.error('Error in onSuccess:', error);
              }
            }}
            onRefresh={loadProducts}
          />
        )}

        {/* Search and Filter Controls */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ค้นหาสินค้า
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อสินค้า..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมวดหมู่
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">ทุกหมวดหมู่</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Products Per Page */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                แสดงต่อหน้า
              </label>
              <select
                value={productsPerPage}
                onChange={(e) => {
                  setProductsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={5}>5 รายการ</option>
                <option value={10}>10 รายการ</option>
                <option value={20}>20 รายการ</option>
                <option value={50}>50 รายการ</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                แสดง {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)} จาก {filteredProducts.length} รายการ
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div id="products-section" className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สินค้า</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">หมวดหมู่</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ราคา</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">คงเหลือ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0].url || product.images[0].secure_url}
                              alt={product.title}
                              className="w-12 h-12 object-cover rounded-lg"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                              }}
                            />
                          ) : (
                            <i className="fas fa-image text-gray-400"></i>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.title}</div>
                          <div className="text-sm text-gray-500">{product.description?.substring(0, 50)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.category?.name || 'ไม่ระบุ'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ฿{product.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        product.quantity > 10 
                          ? 'bg-green-100 text-green-800'
                          : product.quantity > 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.quantity} ชิ้น
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            console.log('ProductManagement: Edit button clicked for product:', product);
                            setEditingProduct(product);
                            setShowCreateForm(true);
                          }}
                          className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-xs transition-colors duration-200"
                        >
                          <i className="fas fa-edit mr-1"></i>
                          แก้ไข
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(`⚠️ คุณแน่ใจหรือไม่ที่จะลบสินค้า "${product.title}"?\n\nการดำเนินการนี้ไม่สามารถยกเลิกได้!`)) {
                              try {
                                await axios.delete(`/api/product/${product.id}`);
                                toast.success('ลบสินค้าสำเร็จ');
                                loadProducts();
                              } catch (error) {
                                console.error('Error:', error);
                                toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบสินค้า');
                              }
                            }
                          }}
                          className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-xs transition-colors duration-200"
                        >
                          <i className="fas fa-trash mr-1"></i>
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Simple Pagination with < > buttons */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="flex items-center justify-center space-x-6">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-300 ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-xl transform hover:scale-110 active:scale-95'
                  }`}
                  title="หน้าก่อนหน้า (ปุ่มลูกศรซ้าย)"
                >
                  &lt;
                </button>

                {/* Page Info */}
                <div className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    หน้า {currentPage} จาก {totalPages}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    แสดง {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)} จาก {filteredProducts.length} รายการ
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    💡 ใช้ปุ่มลูกศรซ้าย/ขวา หรือคลิกปุ่ม &lt; &gt;
                  </div>
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-300 ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-xl transform hover:scale-110 active:scale-95'
                  }`}
                  title="หน้าถัดไป (ปุ่มลูกศรขวา)"
                >
                  &gt;
                </button>
              </div>

              {/* Quick Page Navigation */}
              {totalPages > 10 && (
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <span className="text-sm text-gray-500">ไปหน้า:</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= totalPages) {
                        handlePageChange(page);
                      }
                    }}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-sm text-gray-500">จาก {totalPages}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              <i className="fas fa-tags text-purple-500 mr-2"></i>
              จัดการหมวดหมู่ ({categories.length} รายการ)
            </h2>
            <button
              onClick={() => {
                setEditingCategory(null);
                setCategoryForm({ name: '' });
                setShowCategoryForm(true);
              }}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors duration-200"
            >
              <i className="fas fa-plus mr-2"></i>
              เพิ่มหมวดหมู่ใหม่
            </button>
          </div>
        </div>

        {/* Category Form */}
        {showCategoryForm && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (editingCategory) {
                  await axios.put(`/api/category/${editingCategory.id}`, categoryForm);
                  toast.success('อัพเดตหมวดหมู่สำเร็จ');
                } else {
                  await axios.post('/api/category', categoryForm);
                  toast.success('เพิ่มหมวดหมู่ใหม่สำเร็จ');
                }
                setCategoryForm({ name: '' });
                setEditingCategory(null);
                setShowCategoryForm(false);
                loadCategories();
              } catch (error) {
                console.error('Error:', error);
                toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกหมวดหมู่');
              }
            }} className="flex items-end space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อหมวดหมู่</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  required
                  placeholder="กรอกชื่อหมวดหมู่"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors duration-200"
              >
                <i className="fas fa-save mr-2"></i>
                {editingCategory ? 'อัพเดต' : 'เพิ่ม'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCategoryForm(false);
                  setEditingCategory(null);
                }}
                className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200"
              >
                <i className="fas fa-times mr-2"></i>
                ยกเลิก
              </button>
            </form>
          </div>
        )}

        {/* Categories Table */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <i className="fas fa-tag text-white"></i>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
                      <p className="text-xs text-gray-600">
                        {products.filter(p => p.categoryId === category.id).length} สินค้า
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setCategoryForm({ name: category.name });
                        setShowCategoryForm(true);
                      }}
                      className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md transition-colors duration-200"
                      title="แก้ไข"
                    >
                      <i className="fas fa-edit text-xs"></i>
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm(`⚠️ คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่ "${category.name}"?\n\nการดำเนินการนี้ไม่สามารถยกเลิกได้!`)) {
                          try {
                            await axios.delete(`/api/category/${category.id}`);
                            toast.success('ลบหมวดหมู่สำเร็จ');
                            loadCategories();
                          } catch (error) {
                            console.error('Error:', error);
                            toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบหมวดหมู่');
                          }
                        }
                      }}
                      className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-md transition-colors duration-200"
                      title="ลบ"
                    >
                      <i className="fas fa-trash text-xs"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;
