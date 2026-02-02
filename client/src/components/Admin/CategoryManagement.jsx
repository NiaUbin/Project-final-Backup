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
      console.error(e);
      const message = e.response?.data?.message || 'ลบไม่สำเร็จ';
      toast.error(message);
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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-4 flex flex-col items-center"
              >
                {/* Circular Image */}
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3 overflow-hidden border border-gray-100 relative group">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <i className="fas fa-image text-gray-300 text-2xl"></i>
                  )}
                </div>
                
                {/* Name */}
                <h3 className="text-sm font-bold text-gray-800 mb-3 text-center line-clamp-2 min-h-[2.5em] flex items-center justify-center">
                  {category.name}
                </h3>
                
                {/* Actions */}
                <div className="flex w-full gap-2 mt-auto">
                  <button
                    onClick={() => handleEdit(category)}
                    className="flex-1 py-1.5 bg-amber-400 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    <i className="fas fa-edit"></i>
                    แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    <i className="fas fa-trash"></i>
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form - Compact */}
      {/* Modal Form - Compact & Beautiful */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[380px] overflow-hidden flex flex-col transform transition-all animate-fadeInUp">
            
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
              <h3 className="text-sm font-bold text-gray-800">
                {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}
              </h3>
              <button 
                onClick={handleCloseForm} 
                className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 max-h-[70vh]">
              {/* Image Upload - Compact */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">รูปภาพ</label>
                <div className="flex items-start gap-3">
                  <label className="flex-shrink-0 relative w-20 h-20 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all flex flex-col items-center justify-center overflow-hidden group bg-gray-50">
                    {imagePreview ? (
                       <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <i className="fas fa-camera text-white text-sm"></i>
                        </div>
                       </>
                    ) : (
                      <div className="text-center p-1">
                        <i className="fas fa-cloud-upload-alt text-gray-400 text-lg mb-0.5"></i>
                        <span className="text-[9px] text-gray-500 block">อัพโหลด</span>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageFileChange} />
                  </label>
                  
                  <div className="flex-1 min-w-0">
                    {!selectedImageFile ? (
                        <div>
                             <input
                                type="url"
                                value={formData.image}
                                onChange={(e) => {
                                setFormData({ ...formData, image: e.target.value });
                                if (e.target.value) setImagePreview(e.target.value);
                                }}
                                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-orange-200 focus:border-orange-400 transition-all outline-none bg-gray-50/50"
                                placeholder="หรือวางลิงก์รูปภาพ..."
                            />
                            <p className="text-[10px] text-gray-400 mt-1 leading-tight">แนะนำ: รูปสี่เหลี่ยมจัตุรัส (1:1)</p>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col justify-center">
                            <p className="text-xs font-medium text-gray-800 truncate">{selectedImageFile.name}</p>
                            <p className="text-[10px] text-gray-500">{(selectedImageFile.size / 1024).toFixed(1)} KB</p>
                            <button onClick={() => { setSelectedImageFile(null); setImagePreview(formData.image || null); }} className="text-red-500 text-[10px] mt-0.5 hover:underline text-left">ลบไฟล์</button>
                        </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  ชื่อหมวดหมู่ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-orange-200 focus:border-orange-400 transition-all outline-none font-medium bg-gray-50/50"
                  placeholder="เช่น เสื้อผ้า, อุปกรณ์ไอที"
                />
              </div>

              {/* Subcategories */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  หมวดหมู่ย่อย ({formData.subcategories.length})
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSubcategory}
                    onChange={(e) => setNewSubcategory(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubcategory(); }}}
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-orange-200 focus:border-orange-400 transition-all outline-none bg-gray-50/50"
                    placeholder="เพิ่มหมวดหมู่ย่อย..."
                  />
                  <button
                    type="button"
                    onClick={handleAddSubcategory}
                    disabled={!newSubcategory.trim()}
                    className="px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-xs"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-gray-50/80 rounded-lg border border-gray-100">
                  {formData.subcategories.length > 0 ? (
                    formData.subcategories.map((sub, index) => (
                      <span key={index} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 bg-white border border-gray-200 rounded-md text-[10px] font-medium text-gray-600 shadow-sm animate-fadeIn">
                        {sub}
                        <button
                          type="button"
                          onClick={() => handleRemoveSubcategory(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-red-50"
                        >
                          <i className="fas fa-times text-[8px]"></i>
                        </button>
                      </span>
                    ))
                  ) : (
                    <div className="w-full text-center py-1 text-gray-400 text-[10px] italic">
                       - ไม่มีหมวดหมู่ย่อย -
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/50">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.name.trim()}
                className={`px-6 py-2 text-white rounded-lg text-xs font-bold shadow-md transition-all transform active:scale-95 ${
                  isSubmitting || !formData.name.trim() 
                    ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                    : 'bg-[#ee4d2d] hover:bg-[#d73211] shadow-orange-100'
                }`}
              >
                {isSubmitting ? '...' : (editingCategory ? 'บันทึก' : 'สร้าง')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
