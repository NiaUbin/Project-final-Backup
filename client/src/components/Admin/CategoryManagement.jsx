import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

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
    if (isSubmitting) return;
    if (!formData.name.trim()) {
      toast.error('กรุณากรอกชื่อหมวดหมู่');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('กรุณาเข้าสู่ระบบก่อน');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      
      if (selectedImageFile) {
        formDataToSend.append('image', selectedImageFile);
      } else if (formData.image.trim()) {
        formDataToSend.append('image', formData.image.trim());
      }
      
      const subcategoriesArray = formData.subcategories.filter(s => s && s.trim() !== '');
      if (subcategoriesArray.length > 0) {
        formDataToSend.append('subcategories', JSON.stringify(subcategoriesArray));
      }

      if (editingCategory) {
        await axios.put(`/api/category/${editingCategory.id}`, formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('อัพเดตหมวดหมู่สำเร็จ');
      } else {
        await axios.post('/api/category', formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('สร้างหมวดหมู่สำเร็จ');
      }
      
      handleCloseForm();
      loadCategories();
    } catch (error) {
      console.error('Error submitting category:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      image: category.image || '',
      subcategories: category.subcategories || []
    });
    setImagePreview(category.image || null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: '', image: '', subcategories: [] });
    setNewSubcategory('');
    setSelectedImageFile(null);
    setImagePreview(null);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ไฟล์รูปภาพใหญ่เกินไป (จำกัด 5MB)');
        return;
      }
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
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

  const handleDelete = async (category) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่ "${category.name}"?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/category/${category.id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      toast.success('ลบสำเร็จ');
      loadCategories();
    } catch (e) {
      toast.error('ลบไม่สำเร็จ');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">จัดการหมวดหมู่</h2>
        <div className="flex gap-2">
          <button
            onClick={loadCategories}
            disabled={loading}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm"
          >
            <i className={`fas fa-sync text-xs ${loading ? 'animate-spin' : ''}`}></i>
          </button>
          <button
            onClick={() => { handleCloseForm(); setShowForm(true); }}
            className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600"
          >
            <i className="fas fa-plus mr-1"></i> เพิ่ม
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading && !categories.length ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <i className="fas fa-folder-open text-gray-300 text-2xl mb-2"></i>
            <p className="text-gray-500 text-sm">ยังไม่มีหมวดหมู่</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow group"
              >
                {/* Compact Image */}
                <div className="h-14 bg-gray-50 relative">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="fas fa-image text-gray-300 text-lg"></i>
                    </div>
                  )}
                </div>
                
                {/* Compact Info */}
                <div className="p-2">
                  <h3 className="text-xs font-medium text-gray-800 truncate" title={category.name}>
                    {category.name}
                  </h3>
                  
                  {category.subcategories?.length > 0 && (
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {category.subcategories.length} หมวดหมู่ย่อย
                    </p>
                  )}
                  
                  {/* Compact Actions */}
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="flex-1 py-1 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded text-[10px]"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="flex-1 py-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded text-[10px]"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form - Compact */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">
                {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}
              </h3>
              <button onClick={handleCloseForm} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">รูปภาพ</label>
                <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 overflow-hidden">
                  {imagePreview ? (
                    <div className="relative w-full h-full">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <i className="fas fa-cloud-upload-alt text-gray-400 text-xl mb-1"></i>
                      <p className="text-xs text-gray-500">อัพโหลดรูป</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageFileChange} />
                </label>
                
                {!selectedImageFile && (
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => {
                      setFormData({ ...formData, image: e.target.value });
                      if (e.target.value) setImagePreview(e.target.value);
                    }}
                    className="mt-2 w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                    placeholder="หรือวางลิงก์รูปภาพ..."
                  />
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  ชื่อหมวดหมู่ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="ชื่อหมวดหมู่"
                />
              </div>

              {/* Subcategories */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  หมวดหมู่ย่อย ({formData.subcategories.length})
                </label>
                <div className="flex gap-1 mb-2">
                  <input
                    type="text"
                    value={newSubcategory}
                    onChange={(e) => setNewSubcategory(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubcategory(); }}}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                    placeholder="เพิ่มหมวดหมู่ย่อย..."
                  />
                  <button
                    type="button"
                    onClick={handleAddSubcategory}
                    disabled={!newSubcategory.trim()}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 text-xs"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-gray-50 rounded-lg border border-gray-200">
                  {formData.subcategories.length > 0 ? (
                    formData.subcategories.map((sub, index) => (
                      <span key={index} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded text-xs">
                        {sub}
                        <button
                          type="button"
                          onClick={() => handleRemoveSubcategory(index)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <i className="fas fa-times text-[10px]"></i>
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 w-full text-center">ยังไม่มี</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-xs"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.name.trim()}
                className={`px-4 py-1.5 text-white rounded-lg text-xs font-medium ${
                  isSubmitting || !formData.name.trim() 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {isSubmitting && <i className="fas fa-spinner fa-spin mr-1"></i>}
                {editingCategory ? 'บันทึก' : 'สร้าง'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
