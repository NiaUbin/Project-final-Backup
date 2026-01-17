import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProductImageUpload from './ProductImageUpload';

const ProductForm = ({ editingProduct, onClose, onSuccess, onRefresh, createEndpoint = '/api/product', updateEndpointBase = '/api/product' }) => {
  const [categories, setCategories] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [imageUploadRef, setImageUploadRef] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    price: '',
    quantity: '',
    categoryId: '',
    productSubcategories: [],
    discountPrice: '',
    discountStartDate: '',
    discountEndDate: '',
    freeShipping: false,
    variants: []
  });
  const [availableSubcategories, setAvailableSubcategories] = useState([]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (editingProduct || !editingProduct) {
      loadCategories();
    }
  }, [editingProduct]);

  useEffect(() => {
    if (productForm.categoryId && categories.length > 0) {
      const selectedCategory = categories.find(c => c.id === parseInt(productForm.categoryId));
      if (selectedCategory && selectedCategory.subcategories) {
        setAvailableSubcategories(selectedCategory.subcategories);
      } else {
        setAvailableSubcategories([]);
      }
    } else {
      setAvailableSubcategories([]);
    }
  }, [productForm.categoryId, categories]);

  const prevCategoryIdRef = useRef(productForm.categoryId || '');
  const isInitialLoadRef = useRef(true);
  const isEditingProductRef = useRef(!!editingProduct);

  useEffect(() => {
    isEditingProductRef.current = !!editingProduct;
  }, [editingProduct]);

  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      prevCategoryIdRef.current = productForm.categoryId || '';
      return;
    }
    if (isEditingProductRef.current && prevCategoryIdRef.current === productForm.categoryId) {
      return;
    }
    if (prevCategoryIdRef.current !== productForm.categoryId && prevCategoryIdRef.current !== '') {
      setProductForm(prev => ({ ...prev, productSubcategories: [] }));
    }
    prevCategoryIdRef.current = productForm.categoryId || '';
  }, [productForm.categoryId]);

  useEffect(() => {
    if (editingProduct) {
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      let parsedVariants = [];
      let parsedDescription = editingProduct.description || '';
      let parsedFreeShipping = false;
      let parsedProductSubcategories = [];

      if (editingProduct.variants) {
        try {
          if (typeof editingProduct.variants === 'string') {
            parsedVariants = JSON.parse(editingProduct.variants);
          } else if (Array.isArray(editingProduct.variants)) {
            parsedVariants = editingProduct.variants;
          }
        } catch (e) {
          console.error('Error parsing variants:', e);
        }
      }

      if (parsedVariants.length === 0 && editingProduct.description) {
        try {
          const metadata = JSON.parse(editingProduct.description);
          if (metadata && typeof metadata === 'object') {
            if (metadata.variants && Array.isArray(metadata.variants)) {
              parsedVariants = metadata.variants;
            }
            if (metadata.description) {
              parsedDescription = metadata.description;
            }
            if (metadata.freeShipping !== undefined) {
              parsedFreeShipping = metadata.freeShipping;
            }
            if (metadata.productSubcategories && Array.isArray(metadata.productSubcategories)) {
              parsedProductSubcategories = metadata.productSubcategories;
            }
          }
        } catch (e) {
          parsedDescription = editingProduct.description || '';
        }
      }

      if (editingProduct.description) {
        try {
          const metadata = JSON.parse(editingProduct.description);
          if (metadata && typeof metadata === 'object') {
            if (metadata.freeShipping !== undefined && !parsedFreeShipping) {
              parsedFreeShipping = metadata.freeShipping;
            }
            if (metadata.productSubcategories && Array.isArray(metadata.productSubcategories) && parsedProductSubcategories.length === 0) {
              parsedProductSubcategories = metadata.productSubcategories;
            }
          }
        } catch (e) {
          // Not JSON
        }
      }

      if (parsedVariants.length > 0) {
        parsedVariants = parsedVariants.filter(v =>
          v && v.name && typeof v.name === 'string' && v.name.trim() !== '' && v.options && Array.isArray(v.options) && v.options.length > 0
        );
      }

      setProductForm({
        title: editingProduct.title || '',
        description: parsedDescription,
        price: editingProduct.price?.toString() || '',
        quantity: editingProduct.quantity?.toString() || '',
        categoryId: editingProduct.categoryId?.toString() || '',
        productSubcategories: parsedProductSubcategories,
        discountPrice: editingProduct.discountPrice?.toString() || '',
        discountStartDate: formatDateForInput(editingProduct.discountStartDate),
        discountEndDate: formatDateForInput(editingProduct.discountEndDate),
        freeShipping: parsedFreeShipping,
        variants: parsedVariants
      });

      prevCategoryIdRef.current = editingProduct.categoryId?.toString() || '';
      isInitialLoadRef.current = false;

      if (editingProduct.categoryId && categories.length > 0) {
        const selectedCategory = categories.find(c => c.id === editingProduct.categoryId);
        if (selectedCategory && selectedCategory.subcategories) {
          setAvailableSubcategories(selectedCategory.subcategories);
        }
      }
    } else {
      isInitialLoadRef.current = true;
    }
  }, [editingProduct, categories]);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await axios.get('/api/category');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('ไม่สามารถโหลดหมวดหมู่ได้');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImagesSelect = useCallback((images) => {
    setSelectedImages(images);
  }, []);

  const handleImageUrlsSelect = useCallback((urls) => {
    setImageUrls(urls);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSubmitting) return;

    if (!productForm.title.trim()) {
      toast.error('กรุณากรอกชื่อสินค้า');
      return;
    }
    if (!productForm.price || parseFloat(productForm.price) <= 0) {
      toast.error('กรุณากรอกราคาที่ถูกต้อง');
      return;
    }
    if (!productForm.quantity || parseInt(productForm.quantity) < 0) {
      toast.error('กรุณากรอกจำนวนที่ถูกต้อง');
      return;
    }
    if (!productForm.categoryId) {
      toast.error('กรุณาเลือกหมวดหมู่');
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('title', productForm.title);

      let finalDescription = productForm.description;
      let metadata = {};

      try {
        const parsed = JSON.parse(productForm.description);
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          metadata = { ...parsed };
          if (!metadata.description) {
            metadata.description = productForm.description;
          }
        } else {
          metadata = { description: productForm.description };
        }
      } catch (e) {
        metadata = { description: productForm.description };
      }

      metadata.freeShipping = productForm.freeShipping || false;

      if (productForm.productSubcategories && Array.isArray(productForm.productSubcategories) && productForm.productSubcategories.length > 0) {
        metadata.productSubcategories = productForm.productSubcategories;
      } else {
        delete metadata.productSubcategories;
      }

      const hasOtherMetadata = metadata.freeShipping !== undefined || (metadata.productSubcategories && metadata.productSubcategories.length > 0);

      if (hasOtherMetadata) {
        finalDescription = JSON.stringify(metadata);
      } else if (Object.keys(metadata).length === 1 && metadata.description) {
        finalDescription = metadata.description;
      } else {
        finalDescription = JSON.stringify(metadata);
      }

      formData.append('description', finalDescription);
      formData.append('price', productForm.price);
      formData.append('quantity', productForm.quantity);
      formData.append('categoryId', productForm.categoryId);

      if (productForm.discountPrice) {
        formData.append('discountPrice', productForm.discountPrice);
      }
      if (productForm.discountStartDate) {
        formData.append('discountStartDate', productForm.discountStartDate);
      }
      if (productForm.discountEndDate) {
        formData.append('discountEndDate', productForm.discountEndDate);
      }

      const validVariants = productForm.variants.filter(v =>
        v && v.name && typeof v.name === 'string' && v.name.trim() !== '' && v.options && Array.isArray(v.options) && v.options.length > 0
      );

      if (validVariants.length > 0) {
        formData.append('variants', JSON.stringify(validVariants));
      }

      if (selectedImages.length > 0) {
        selectedImages.forEach((file) => {
          formData.append('images', file);
        });
      }

      let finalImageUrls = imageUrls || [];
      let imagesToDeleteData = [];
      let remainingImagesData = [];

      if (imageUploadRef && typeof imageUploadRef.getFinalImages === 'function') {
        try {
          const imageData = imageUploadRef.getFinalImages();
          if (imageData && imageData.imageUrls && Array.isArray(imageData.imageUrls) && imageData.imageUrls.length > 0) {
            finalImageUrls = imageData.imageUrls;
          }
          if (editingProduct) {
            imagesToDeleteData = imageData.imagesToDelete || [];
            remainingImagesData = imageData.remainingImages || [];
            formData.append('imagesToDelete', JSON.stringify(imagesToDeleteData));
            formData.append('remainingImages', JSON.stringify(remainingImagesData));
          }
        } catch (error) {
          console.warn('Error getting image data from ref:', error);
        }
      } else if (editingProduct) {
        formData.append('imagesToDelete', JSON.stringify([]));
        formData.append('remainingImages', JSON.stringify([]));
      }

      if (finalImageUrls && finalImageUrls.length > 0) {
        formData.append('imageUrls', JSON.stringify(finalImageUrls));
      } else if (imageUrls && imageUrls.length > 0) {
        formData.append('imageUrls', JSON.stringify(imageUrls));
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      };

      if (editingProduct) {
        const updateUrl = `${updateEndpointBase}/${editingProduct.id}`;
        await axios.put(updateUrl, formData, config);
        toast.success('อัพเดตสินค้าสำเร็จ!');
      } else {
        await axios.post(createEndpoint, formData, config);
        toast.success('เพิ่มสินค้าใหม่สำเร็จ!');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error.response?.data?.message || error.message || 'เกิดข้อผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#f5f5f5] rounded-sm shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <i className={`fas ${editingProduct ? 'fa-edit text-[#ee4d2d]' : 'fa-plus text-[#ee4d2d]'}`}></i>
              {editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Basic Information */}
          <div className="bg-white rounded-sm shadow-sm p-4">
            <h3 className="font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <i className="fas fa-info-circle text-[#ee4d2d]"></i>
              ข้อมูลพื้นฐาน
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">
                  ชื่อสินค้า <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={productForm.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#ee4d2d] focus:ring-1 focus:ring-[#ee4d2d]"
                  placeholder="กรอกชื่อสินค้า"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1.5">
                  หมวดหมู่ <span className="text-red-500">*</span>
                </label>
                <select
                  name="categoryId"
                  value={productForm.categoryId}
                  onChange={handleInputChange}
                  disabled={categoriesLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#ee4d2d] focus:ring-1 focus:ring-[#ee4d2d] bg-white"
                  required
                >
                  <option value="">
                    {categoriesLoading ? 'กำลังโหลด...' : 'เลือกหมวดหมู่'}
                  </option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1.5">
                  ราคา (บาท) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={productForm.price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#ee4d2d] focus:ring-1 focus:ring-[#ee4d2d]"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1.5">
                  จำนวน <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={productForm.quantity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#ee4d2d] focus:ring-1 focus:ring-[#ee4d2d]"
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Subcategories */}
          {productForm.categoryId && availableSubcategories.length > 0 && (
            <div className="bg-white rounded-sm shadow-sm p-4">
              <h3 className="font-medium text-gray-900 mb-3 pb-2 border-b border-gray-100 flex items-center gap-2">
                <i className="fas fa-tags text-purple-500"></i>
                หมวดหมู่ย่อย
                <span className="text-xs text-gray-400 font-normal">(เลือกได้สูงสุด 3 อย่าง)</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableSubcategories.map((subcat) => {
                  const isSelected = productForm.productSubcategories && Array.isArray(productForm.productSubcategories) && productForm.productSubcategories.includes(subcat);
                  return (
                    <label
                      key={subcat}
                      className={`px-3 py-1.5 rounded-sm text-sm cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-[#ee4d2d] text-white border-[#ee4d2d]'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-[#ee4d2d] hover:text-[#ee4d2d]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          const currentSubcategories = Array.isArray(productForm.productSubcategories) 
                            ? productForm.productSubcategories : [];
                          
                          if (e.target.checked) {
                            if (currentSubcategories.length < 3) {
                              setProductForm(prev => ({
                                ...prev,
                                productSubcategories: [...currentSubcategories, subcat]
                              }));
                            } else {
                              toast.warning('เลือกได้สูงสุด 3 หมวดหมู่');
                              e.target.checked = false;
                            }
                          } else {
                            setProductForm(prev => ({
                              ...prev,
                              productSubcategories: currentSubcategories.filter(s => s !== subcat)
                            }));
                          }
                        }}
                        className="sr-only"
                      />
                      {isSelected && <i className="fas fa-check mr-1 text-xs"></i>}
                      {subcat}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Features */}
          <div className="bg-white rounded-sm shadow-sm p-4">
            <h3 className="font-medium text-gray-900 mb-3 pb-2 border-b border-gray-100 flex items-center gap-2">
              <i className="fas fa-star text-yellow-500"></i>
              คุณสมบัติพิเศษ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className={`flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-all ${
                productForm.freeShipping ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-300'
              }`}>
                <input
                  type="checkbox"
                  name="freeShipping"
                  checked={productForm.freeShipping}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-green-500 border-gray-300 rounded focus:ring-green-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-truck text-green-500"></i>
                    <span className="font-medium text-gray-800 text-sm">ส่งฟรี</span>
                  </div>
                  <p className="text-xs text-gray-500">แสดง badge "ส่งฟรี" ในหน้าสินค้า</p>
                </div>
              </label>

              <div className={`flex items-center gap-3 p-3 rounded-sm border ${
                productForm.discountPrice && productForm.discountStartDate && productForm.discountEndDate 
                  ? 'border-orange-400 bg-orange-50' : 'border-gray-200'
              }`}>
                <div className="w-4 h-4 flex items-center justify-center">
                  {productForm.discountPrice && productForm.discountStartDate && productForm.discountEndDate 
                    ? <i className="fas fa-check-circle text-orange-500"></i>
                    : <i className="fas fa-circle text-gray-300 text-xs"></i>
                  }
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-tag text-orange-500"></i>
                    <span className="font-medium text-gray-800 text-sm">ลดราคา</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {productForm.discountPrice && productForm.discountStartDate && productForm.discountEndDate 
                      ? 'เปิดใช้งานแล้ว' : 'กรอกข้อมูลด้านล่างเพื่อเปิดใช้'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Discount Section */}
          <div className="bg-white rounded-sm shadow-sm p-4">
            <h3 className="font-medium text-gray-900 mb-3 pb-2 border-b border-gray-100 flex items-center gap-2">
              <i className="fas fa-percent text-[#ee4d2d]"></i>
              การลดราคา
              <span className="text-xs text-gray-400 font-normal">(ไม่บังคับ)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">ราคาลดพิเศษ (บาท)</label>
                <input
                  type="number"
                  name="discountPrice"
                  value={productForm.discountPrice}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#ee4d2d]"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">วันที่เริ่ม</label>
                <input
                  type="datetime-local"
                  name="discountStartDate"
                  value={productForm.discountStartDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#ee4d2d]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">วันที่สิ้นสุด</label>
                <input
                  type="datetime-local"
                  name="discountEndDate"
                  value={productForm.discountEndDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#ee4d2d]"
                />
              </div>
            </div>
            {productForm.discountPrice && productForm.discountStartDate && productForm.discountEndDate && productForm.price && (
              <div className="mt-3 p-3 bg-orange-50 rounded-sm border border-orange-200 text-sm">
                <i className="fas fa-info-circle text-orange-500 mr-2"></i>
                ลดจาก <span className="font-medium">฿{parseFloat(productForm.price || 0).toLocaleString()}</span> เหลือ 
                <span className="font-bold text-[#ee4d2d] ml-1">฿{parseFloat(productForm.discountPrice).toLocaleString()}</span>
                <span className="text-gray-500 ml-2">
                  ({Math.round(((productForm.price - productForm.discountPrice) / productForm.price) * 100)}% off)
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-sm shadow-sm p-4">
            <h3 className="font-medium text-gray-900 mb-3 pb-2 border-b border-gray-100 flex items-center gap-2">
              <i className="fas fa-align-left text-blue-500"></i>
              รายละเอียดสินค้า
            </h3>
            <textarea
              name="description"
              value={productForm.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#ee4d2d] focus:ring-1 focus:ring-[#ee4d2d] resize-none"
              placeholder="กรอกรายละเอียดสินค้า..."
            />
          </div>

          {/* Product Variants */}
          <div className="bg-white rounded-sm shadow-sm p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <i className="fas fa-palette text-purple-500"></i>
                ตัวเลือกสินค้า
                <span className="text-xs text-gray-400 font-normal">(สี, ขนาด, ฯลฯ)</span>
              </h3>
              {productForm.variants.length > 0 && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded text-xs font-medium">
                  {productForm.variants.length} ตัวเลือก
                </span>
              )}
            </div>

            {productForm.variants.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <i className="fas fa-palette text-3xl mb-2"></i>
                <p className="text-sm">ยังไม่มีตัวเลือกสินค้า</p>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {productForm.variants.map((variant, variantIndex) => (
                  <div key={variantIndex} className="p-3 bg-gray-50 rounded-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => {
                          const newVariants = [...productForm.variants];
                          newVariants[variantIndex].name = e.target.value;
                          setProductForm(prev => ({ ...prev, variants: newVariants }));
                        }}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#ee4d2d]"
                        placeholder="ชื่อตัวเลือก (เช่น สี, ขนาด)"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newVariants = productForm.variants.filter((_, i) => i !== variantIndex);
                          setProductForm(prev => ({ ...prev, variants: newVariants }));
                        }}
                        className="ml-2 px-2 py-1.5 text-red-500 hover:bg-red-50 rounded-sm text-sm"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                    
                    <input
                      type="text"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = e.target.value.trim();
                          if (value && !variant.options.includes(value)) {
                            const newVariants = [...productForm.variants];
                            newVariants[variantIndex].options = [...newVariants[variantIndex].options, value];
                            setProductForm(prev => ({ ...prev, variants: newVariants }));
                            e.target.value = '';
                          }
                        }
                      }}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#ee4d2d] mb-2"
                      placeholder="พิมพ์ตัวเลือกแล้วกด Enter (เช่น แดง, น้ำเงิน)"
                    />
                    
                    <div className="flex flex-wrap gap-1.5">
                      {variant.options.map((option, optIndex) => (
                        <span
                          key={optIndex}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-[#ee4d2d] text-white rounded-sm text-xs"
                        >
                          {option}
                          <button
                            type="button"
                            onClick={() => {
                              const newVariants = [...productForm.variants];
                              newVariants[variantIndex].options = newVariants[variantIndex].options.filter((_, i) => i !== optIndex);
                              setProductForm(prev => ({ ...prev, variants: newVariants }));
                            }}
                            className="hover:text-red-200"
                          >
                            <i className="fas fa-times text-[10px]"></i>
                          </button>
                        </span>
                      ))}
                      {variant.options.length === 0 && (
                        <span className="text-xs text-gray-400 italic">พิมพ์แล้วกด Enter เพื่อเพิ่ม</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setProductForm(prev => ({
                  ...prev,
                  variants: [...prev.variants, { name: '', options: [] }]
                }));
              }}
              className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-sm hover:border-[#ee4d2d] hover:text-[#ee4d2d] transition-colors text-sm flex items-center justify-center gap-2"
            >
              <i className="fas fa-plus"></i>
              เพิ่มตัวเลือกสินค้า
            </button>
          </div>

          {/* Image Upload */}
          <div className="bg-white rounded-sm shadow-sm p-4">
            <h3 className="font-medium text-gray-900 mb-3 pb-2 border-b border-gray-100 flex items-center gap-2">
              <i className="fas fa-images text-[#ee4d2d]"></i>
              รูปภาพสินค้า
            </h3>
            <ProductImageUpload 
              onImagesSelect={handleImagesSelect}
              onImageUrlsSelect={handleImageUrlsSelect}
              existingImages={editingProduct?.images || []}
              ref={setImageUploadRef}
            />
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-sm shadow-sm p-4 flex items-center justify-end gap-3 sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-600 rounded-sm hover:bg-gray-50 transition-colors text-sm"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-sm text-sm font-medium transition-all ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#ee4d2d] text-white hover:bg-[#d73211]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  กำลังดำเนินการ...
                </>
              ) : editingProduct ? (
                <>
                  <i className="fas fa-save mr-2"></i>
                  บันทึกการแก้ไข
                </>
              ) : (
                <>
                  <i className="fas fa-plus mr-2"></i>
                  เพิ่มสินค้า
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
