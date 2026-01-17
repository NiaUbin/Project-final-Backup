import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProductManagement from './ProductManagement';
import ProductForm from './ProductForm';
import TestAdminFeatures from './TestAdminFeatures';
import PaymentApproval from './PaymentApproval';
import OrderManagement from './OrderManagement';
import Analytics from './Analytics';
import ErrorBoundary from './ErrorBoundary';

// Category Management Component
const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', image: '', subcategories: [] });
  const [newSubcategory, setNewSubcategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/category', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดหมวดหมู่');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSubmitting) {
      console.log('⚠️ Already submitting, ignoring...');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('กรุณากรอกชื่อหมวดหมู่');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('กรุณาเข้าสู่ระบบก่อน');
        setIsSubmitting(false);
        return;
      }

      // สร้าง FormData สำหรับรองรับการอัพโหลดไฟล์
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      
      // ถ้ามีการเลือกไฟล์ ให้ใช้ไฟล์, ถ้าไม่มีให้ใช้ URL
      if (selectedImageFile) {
        formDataToSend.append('image', selectedImageFile);
      } else if (formData.image.trim()) {
        formDataToSend.append('image', formData.image.trim());
      }
      
      // ส่ง subcategories เป็น JSON string
      const subcategoriesArray = formData.subcategories.filter(s => s && s.trim() !== '');
      if (subcategoriesArray.length > 0) {
        formDataToSend.append('subcategories', JSON.stringify(subcategoriesArray));
      }

      console.log('📤 Submitting category:', {
        isEdit: !!editingCategory,
        categoryId: editingCategory?.id,
        hasFile: !!selectedImageFile,
        hasUrl: !!formData.image.trim(),
        token: token ? 'exists' : 'missing'
      });

      let response;
      if (editingCategory) {
        // Update
        response = await axios.put(`/api/category/${editingCategory.id}`, formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        console.log('✅ Update success:', response.data);
        toast.success('อัพเดตหมวดหมู่สำเร็จ');
      } else {
        // Create
        response = await axios.post('/api/category', formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        console.log('✅ Create success:', response.data);
        toast.success('สร้างหมวดหมู่สำเร็จ');
      }
      
      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: '', image: '', subcategories: [] });
      setNewSubcategory('');
      setSelectedImageFile(null);
      setImagePreview(null);
      await loadCategories();
    } catch (error) {
      console.error('❌ Error submitting category:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      if (error.response?.status === 401) {
        toast.error('กรุณาเข้าสู่ระบบใหม่');
      } else if (error.response?.status === 403) {
        toast.error('คุณไม่มีสิทธิ์ในการจัดการหมวดหมู่ (ต้องเป็น Admin หรือ Seller)');
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || 'ข้อมูลไม่ถูกต้อง');
      } else if (error.response?.status === 404) {
        toast.error('ไม่พบหมวดหมู่ที่ต้องการแก้ไข');
      } else {
        toast.error(error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category) => {
    console.log('✏️ Editing category:', category);
    setEditingCategory(category);
    const newFormData = {
      name: category.name || '',
      image: category.image || '',
      subcategories: category.subcategories || []
    };
    console.log('📋 Form data set to:', newFormData);
    setFormData(newFormData);
    setNewSubcategory('');
    setSelectedImageFile(null);
    setImagePreview(category.image || null);
    setShowForm(true);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // ตรวจสอบประเภทไฟล์
      if (!file.type.startsWith('image/')) {
        toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        return;
      }
      
      // ตรวจสอบขนาดไฟล์ (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ไฟล์รูปภาพใหญ่เกินไป (จำกัด 5MB)');
        return;
      }
      
      setSelectedImageFile(file);
      
      // สร้าง preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // ล้าง URL field ถ้าเลือกไฟล์
      setFormData({ ...formData, image: '' });
    }
  };

  const handleAddSubcategory = () => {
    if (newSubcategory.trim() && !formData.subcategories.includes(newSubcategory.trim())) {
      setFormData({
        ...formData,
        subcategories: [...formData.subcategories, newSubcategory.trim()]
      });
      setNewSubcategory('');
    }
  };

  const handleRemoveSubcategory = (index) => {
    setFormData({
      ...formData,
      subcategories: formData.subcategories.filter((_, i) => i !== index)
    });
  };

  const handleDelete = async (categoryId, categoryName) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่ "${categoryName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/category/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('ลบหมวดหมู่สำเร็จ');
      loadCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบ');
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-4">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 flex items-center gap-2">
          <i className="fas fa-tags text-orange-500 text-sm"></i>
          <span>จัดการหมวดหมู่</span>
        </h2>
        <div className="flex gap-2">
          <button
            onClick={loadCategories}
            disabled={loading}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all text-xs sm:text-sm font-medium"
          >
            <i className="fas fa-sync mr-1.5"></i>
            รีเฟรช
          </button>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setFormData({ name: '', image: '', subcategories: [] });
                    setNewSubcategory('');
                    setShowForm(true);
                  }}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all text-xs sm:text-sm font-medium"
                >
                  <i className="fas fa-plus mr-1.5"></i>
                  เพิ่มหมวดหมู่
                </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingCategory(null);
                    setFormData({ name: '', image: '', subcategories: [] });
                    setNewSubcategory('');
                    setSelectedImageFile(null);
                    setImagePreview(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    ชื่อหมวดหมู่ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => {
                      const newName = e.target.value;
                      console.log('📝 Category name changed:', newName);
                      setFormData({ ...formData, name: newName });
                    }}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="เช่น อิเล็กทรอนิกส์"
                  />
                  {formData.name && (
                    <p className="text-xs text-gray-500 mt-1">
                      ชื่อปัจจุบัน: "{formData.name}" (ความยาว: {formData.name.trim().length} ตัวอักษร)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    รูปภาพ
                  </label>
                  
                  {/* ปุ่มอัพโหลดไฟล์ */}
                  <div className="mb-3">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">คลิกเพื่ออัพโหลด</span> หรือลากไฟล์มาวาง
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF หรือ WEBP (สูงสุด 5MB)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageFileChange}
                      />
                    </label>
                  </div>

                  {/* แสดง preview ถ้ามีไฟล์ที่เลือก */}
                  {imagePreview && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-600 mb-2">ตัวอย่างรูปภาพ:</p>
                      <div className="relative inline-block">
                        <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImageFile(null);
                            setImagePreview(null);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <i className="fas fa-times text-xs"></i>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* หรือใส่ URL */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">หรือ</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => {
                        setFormData({ ...formData, image: e.target.value });
                        // ถ้าใส่ URL ให้ล้างไฟล์ที่เลือก
                        if (e.target.value) {
                          setSelectedImageFile(null);
                          setImagePreview(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                      disabled={!!selectedImageFile}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      วางลิงก์รูปภาพจากอินเทอร์เน็ตที่นี่
                    </p>
                  </div>
                </div>

                {/* Subcategories Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <i className="fas fa-list mr-2 text-blue-500"></i>
                    หมวดหมู่ย่อย (Subcategories)
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    เพิ่มหมวดหมู่ย่อย เช่น โทรศัพท์ → iOS, Android, Samsung, Oppo
                  </p>
                  
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newSubcategory}
                      onChange={(e) => setNewSubcategory(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubcategory();
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="พิมพ์ชื่อหมวดหมู่ย่อย เช่น iOS"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubcategory}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>

                  {formData.subcategories.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.subcategories.map((sub, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium"
                        >
                          {sub}
                          <button
                            type="button"
                            onClick={() => handleRemoveSubcategory(index)}
                            className="ml-1 hover:text-red-200 transition-colors"
                          >
                            <i className="fas fa-times text-xs"></i>
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">ยังไม่มีหมวดหมู่ย่อย</p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingCategory(null);
                      setFormData({ name: '', image: '', subcategories: [] });
                      setNewSubcategory('');
                      setSelectedImageFile(null);
                      setImagePreview(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors font-medium"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={!formData.name || !formData.name.trim() || isSubmitting}
                    onClick={() => {
                      console.log('🔘 Save button clicked:', {
                        formDataName: formData.name,
                        formDataNameTrimmed: formData.name?.trim(),
                        nameLength: formData.name?.length,
                        trimmedLength: formData.name?.trim().length,
                        isSubmitting,
                        editingCategory: !!editingCategory
                      });
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg transition-all font-medium ${
                      !formData.name || !formData.name.trim() || isSubmitting
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        กำลังบันทึก...
                      </>
                    ) : editingCategory ? (
                      'บันทึก'
                    ) : (
                      'สร้าง'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <i className="fas fa-folder-open text-gray-300 text-5xl mb-4"></i>
          <p className="text-gray-600 mb-4">ยังไม่มีหมวดหมู่</p>
          <button
            onClick={() => {
              setEditingCategory(null);
              setFormData({ name: '', image: '', subcategories: [] });
              setNewSubcategory('');
              setShowForm(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all"
          >
            เพิ่มหมวดหมู่แรก
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
            >
              <div className="flex flex-col items-center mb-3">
                <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full ${category.image ? 'hidden' : 'flex'} items-center justify-center bg-gradient-to-br from-orange-400 to-red-500`}>
                    <i className="fas fa-tag text-white text-2xl"></i>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 text-center line-clamp-2">
                  {category.name}
                </h3>
                {category.subcategories && category.subcategories.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    <i className="fas fa-list mr-1"></i>
                    {category.subcategories.length} หมวดหมู่ย่อย
                  </div>
                )}
              </div>
              {category.subcategories && category.subcategories.length > 0 && (
                <div className="mb-3 px-2 py-2 bg-gray-50 rounded border border-gray-200">
                  <div className="text-xs font-medium text-gray-700 mb-1">หมวดหมู่ย่อย:</div>
                  <div className="flex flex-wrap gap-1">
                    {category.subcategories.slice(0, 3).map((sub, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {sub}
                      </span>
                    ))}
                    {category.subcategories.length > 3 && (
                      <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                        +{category.subcategories.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="flex-1 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs font-medium transition-colors"
                >
                  <i className="fas fa-edit mr-1"></i>
                  แก้ไข
                </button>
                <button
                  onClick={() => handleDelete(category.id, category.name)}
                  className="flex-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors"
                >
                  <i className="fas fa-trash mr-1"></i>
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Export CategoryManagement for use in SellerDashboard
export { CategoryManagement };

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [refreshProducts, setRefreshProducts] = useState(0);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeUserStatus = async (userId, currentStatus) => {
    try {
      await axios.post('/api/change-status', {
        id: userId,
        enabled: !currentStatus
      });

      toast.success('เปลี่ยนสถานะผู้ใช้สำเร็จ');
      loadUsers(); // Reload users
    } catch (error) {
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ';
      toast.error(message);
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    if (!window.confirm(`คุณต้องการเปลี่ยนสิทธิ์เป็น ${newRole} หรือไม่?`)) {
      return;
    }

    try {
      await axios.post('/api/change-role', {
        id: userId,
        role: newRole
      });

      toast.success('เปลี่ยนสิทธิ์ผู้ใช้สำเร็จ');
      loadUsers(); // Reload users
    } catch (error) {
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสิทธิ์';
      toast.error(message);
    }
  };

  const handleDeleteUser = async (userId, userName, userEmail) => {
    if (!window.confirm(`⚠️ คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ "${userName || userEmail}"?\n\nการดำเนินการนี้จะลบ:\n- ผู้ใช้ทั้งหมด\n- คำสั่งซื้อทั้งหมด\n- ตะกร้าสินค้า\n- ร้านค้าและสินค้า (ถ้ามี)\n- ข้อมูลการชำระเงิน\n\nการดำเนินการนี้ไม่สามารถยกเลิกได้!`)) {
      return;
    }

    try {
      const response = await axios.delete('/api/delete-user', {
        data: { id: userId }
      });

      toast.success(response.data.message || 'ลบผู้ใช้สำเร็จ - ข้อมูลทั้งหมดถูกลบแล้ว');
      loadUsers(); // Reload users
    } catch (error) {
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบผู้ใช้';
      toast.error(message);
    }
  };

  const tabs = [
    { 
      id: 'users', 
      name: 'จัดการผู้ใช้', 
      icon: 'fas fa-users',
      description: 'จัดการบัญชีผู้ใช้, เปลี่ยนสิทธิ์, เปิด/ปิดการใช้งาน',
      color: 'bg-blue-500'
    },
    { 
      id: 'products', 
      name: 'จัดการสินค้า', 
      icon: 'fas fa-box',
      description: 'เพิ่ม แก้ไข ลบสินค้า',
      color: 'bg-green-500'
    },
    { 
      id: 'categories', 
      name: 'จัดการหมวดหมู่', 
      icon: 'fas fa-tags',
      description: 'เพิ่ม แก้ไข ลบหมวดหมู่ และอัพโหลดรูปภาพ',
      color: 'bg-pink-500'
    },
    { 
      id: 'orders', 
      name: 'จัดการคำสั่งซื้อ', 
      icon: 'fas fa-receipt',
      description: 'ตรวจสอบและจัดการคำสั่งซื้อทั้งหมด',
      color: 'bg-purple-500'
    },
    { 
      id: 'analytics', 
      name: 'รายงานและสถิติ', 
      icon: 'fas fa-chart-bar',
      description: 'ดูสถิติการขาย รายงานผู้ใช้ และข้อมูลสำคัญ',
      color: 'bg-orange-500'
    },
    { 
      id: 'test', 
      name: 'ทดสอบระบบ', 
      icon: 'fas fa-flask',
      description: 'ทดสอบฟังก์ชันต่างๆ ของระบบ',
      color: 'bg-indigo-500'
    },
    { 
      id: 'payments', 
      name: 'อนุมัติการชำระเงิน', 
      icon: 'fas fa-credit-card',
      description: 'อนุมัติหรือปฏิเสธการชำระเงินของลูกค้า',
      color: 'bg-yellow-500'
    },
    { 
      id: 'settings', 
      name: 'การตั้งค่าระบบ', 
      icon: 'fas fa-cog',
      description: 'ตั้งค่าระบบ จัดการการเชื่อมต่อ และความปลอดภัย',
      color: 'bg-gray-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 mx-auto py-3 sm:py-4 px-3 sm:px-4 md:px-6 lg:px-8 mt-16 sm:mt-20">
      {/* Header - Compact */}
      <div className="mb-4 sm:mb-6">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 text-white shadow-md">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fas fa-crown text-white text-sm sm:text-base"></i>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Admin Panel</h1>
              <p className="text-white/90 text-xs sm:text-sm mt-0.5 truncate">จัดการระบบและผู้ใช้งาน</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
        {/* Sidebar - Compact */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 bg-white rounded-lg sm:rounded-xl shadow-md border border-gray-100">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <i className="fas fa-crown text-orange-500 text-sm"></i>
                <span>เมนู</span>
              </h2>
              <p className="text-xs text-gray-600 hidden sm:block">เลือกฟังก์ชันที่ต้องการ</p>
            </div>
            
            {/* Navigation */}
            <nav className="p-2 sm:p-3">
              <ul className="space-y-1.5 sm:space-y-2">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full group flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-orange-50 border border-gray-200 hover:border-orange-200'
                      }`}
                    >
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        activeTab === tab.id 
                          ? 'bg-white bg-opacity-20' 
                          : tab.color + ' bg-opacity-10'
                      }`}>
                        <i className={`${tab.icon} text-xs sm:text-sm ${
                          activeTab === tab.id 
                            ? 'text-white' 
                            : tab.color.replace('bg-', 'text-').replace('-500', '-600')
                        }`}></i>
                      </div>
                      <span className="font-medium truncate text-left flex-1">{tab.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md border border-gray-100">
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="p-3 sm:p-4 md:p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <i className="fas fa-users text-orange-500 text-sm"></i>
                    <span>จัดการผู้ใช้</span>
                  </h2>
                  <button
                    onClick={loadUsers}
                    disabled={loading}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md"
                  >
                    <i className="fas fa-sync mr-1.5"></i>
                    รีเฟรช
                  </button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center h-24 sm:h-32">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-orange-500"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-3 sm:mx-0">
                    <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            ผู้ใช้
                          </th>
                          <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            สิทธิ์
                          </th>
                          <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                            สถานะ
                          </th>
                          <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                            วันที่สมัคร
                          </th>
                          <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            การจัดการ
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-orange-50 transition-colors">
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <i className="fas fa-user text-orange-600 text-xs sm:text-sm"></i>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                    {user.name || 'ไม่มีชื่อ'}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                  user.role === 'admin' 
                                    ? 'bg-red-100 text-red-700 border border-red-200' 
                                    : user.role === 'seller'
                                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                                }`}>
                                  {user.role === 'admin' && <i className="fas fa-crown mr-1 text-[10px]"></i>}
                                  {user.role === 'seller' && <i className="fas fa-store mr-1 text-[10px]"></i>}
                                  {user.role === 'user' && <i className="fas fa-user mr-1 text-[10px]"></i>}
                                  <span className="hidden sm:inline">{user.role === 'admin' ? 'Admin' : user.role === 'seller' ? 'Seller' : 'User'}</span>
                                  <span className="sm:hidden">{user.role === 'admin' ? 'A' : user.role === 'seller' ? 'S' : 'U'}</span>
                                </span>
                                <select
                                  value={user.role}
                                  onChange={(e) => handleChangeUserRole(user.id, e.target.value)}
                                  className="px-1.5 py-1 text-xs font-medium rounded border border-gray-300 hover:border-orange-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white"
                                >
                                  <option value="user">User</option>
                                  <option value="seller">Seller</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </div>
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 hidden sm:table-cell">
                              <button
                                onClick={() => handleChangeUserStatus(user.id, user.enabled)}
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                                  user.enabled
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                              >
                                {user.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                              </button>
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 hidden md:table-cell">
                              {new Date(user.createdAt).toLocaleDateString('th-TH', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                                <button
                                  onClick={() => handleChangeUserStatus(user.id, user.enabled)}
                                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors duration-200 ${
                                    user.enabled
                                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  }`}
                                  title={user.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                                >
                                  <i className={`fas ${user.enabled ? 'fa-pause' : 'fa-play'}`}></i>
                                </button>
                                
                                <button
                                  onClick={() => handleDeleteUser(user.id, user.name, user.email)}
                                  className="px-2 py-1 bg-red-500 text-white hover:bg-red-600 rounded-lg text-xs font-semibold transition-colors duration-200 shadow-sm hover:shadow-md"
                                  title="ลบผู้ใช้"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {users.length === 0 && !loading && (
                  <div className="text-center py-6 sm:py-8">
                    <i className="fas fa-users text-gray-300 text-3xl sm:text-4xl mb-3"></i>
                    <p className="text-gray-500 text-sm">ไม่พบข้อมูลผู้ใช้</p>
                  </div>
                )}
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div className="p-3 sm:p-4 md:p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <i className="fas fa-box text-orange-500 text-sm"></i>
                    <span>จัดการสินค้า</span>
                  </h2>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setShowProductForm(true);
                    }}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 text-xs sm:text-sm font-medium shadow-md hover:shadow-lg"
                  >
                    <i className="fas fa-plus mr-1.5"></i>
                    เพิ่มสินค้าใหม่
                  </button>
                </div>
                <ErrorBoundary>
                  <ProductManagement 
                    onEditProduct={(product) => {
                      console.log('Editing product with images:', product);
                      setEditingProduct(product);
                      setShowProductForm(true);
                    }}
                    refreshTrigger={refreshProducts}
                    key={`products-${refreshProducts}`}
                  />
                </ErrorBoundary>
              </div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <CategoryManagement />
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="p-3 sm:p-4 md:p-5">
                <OrderManagement />
              </div>
            )}

            {/* Test Tab */}
            {activeTab === 'test' && (
              <div className="p-3 sm:p-4 md:p-5">
                <TestAdminFeatures />
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="p-3 sm:p-4 md:p-5">
                <PaymentApproval />
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="p-3 sm:p-4 md:p-5">
                <Analytics />
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="p-3 sm:p-4 md:p-5">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <i className="fas fa-cog text-orange-500 text-sm"></i>
                  <span>การตั้งค่าระบบ</span>
                </h2>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-info-circle text-white text-xs sm:text-sm"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-blue-800 mb-2">ข้อมูลระบบ</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm text-blue-700">
                          <div>
                            <p><strong>เวอร์ชัน:</strong> 1.0.0</p>
                            <p><strong>สถานะ:</strong> ทำงานปกติ</p>
                            <p><strong>จำนวนผู้ใช้:</strong> {users.length} คน</p>
                          </div>
                          <div>
                            <p><strong>เซิร์ฟเวอร์:</strong> Node.js</p>
                            <p><strong>ฐานข้อมูล:</strong> MySQL + Prisma</p>
                            <p><strong>Frontend:</strong> React 18</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-server text-white text-xs sm:text-sm"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-green-800 mb-2">สถานะเซิร์ฟเวอร์</h3>
                        <p className="text-xs sm:text-sm text-green-700 mb-2">
                          เซิร์ฟเวอร์ทำงานปกติ - อัพเดตล่าสุด: {new Date().toLocaleString('th-TH')}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-200 text-green-800">
                            <i className="fas fa-circle text-green-500 mr-1 text-[8px]"></i>
                            API Online
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-200 text-green-800">
                            <i className="fas fa-circle text-green-500 mr-1 text-[8px]"></i>
                            Database Connected
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-shield-alt text-white text-xs sm:text-sm"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-red-800 mb-2">การตั้งค่าความปลอดภัย</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-red-700">JWT Token Expiration</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">24 hours</span>
                          </div>
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-red-700">Password Encryption</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">bcrypt</span>
                          </div>
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-red-700">CORS Protection</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Enabled</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-exclamation-triangle text-white text-xs sm:text-sm"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-yellow-800 mb-2">หมายเหตุสำคัญ</h3>
                        <div className="text-xs sm:text-sm text-yellow-700 space-y-1">
                          <p>• นี่เป็นระบบทดสอบ กรุณาใช้ด้วยความระมัดระวัง</p>
                          <p>• ข้อมูลอาจถูกรีเซ็ตเป็นระยะ</p>
                          <p>• สำหรับการใช้งานจริง กรุณาติดต่อผู้พัฒนา</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <ErrorBoundary>
          <ProductForm
            editingProduct={editingProduct}
            onClose={() => {
              setShowProductForm(false);
              setEditingProduct(null);
            }}
            onSuccess={() => {
              toast.success('การดำเนินการสำเร็จ!');
              setShowProductForm(false);
              setEditingProduct(null);
              setRefreshProducts(prev => prev + 1); // Trigger refresh
            }}
            onRefresh={() => {
              setRefreshProducts(prev => prev + 1); // Trigger refresh
            }}
          />
        </ErrorBoundary>
      )}
    </div>
  );
};

export default AdminPanel;
