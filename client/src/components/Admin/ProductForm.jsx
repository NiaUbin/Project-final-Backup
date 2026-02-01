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

      if (productForm.discountPrice) formData.append('discountPrice', productForm.discountPrice);
      if (productForm.discountStartDate) formData.append('discountStartDate', productForm.discountStartDate);
      if (productForm.discountEndDate) formData.append('discountEndDate', productForm.discountEndDate);

      const validVariants = productForm.variants.filter(v =>
        v && v.name && typeof v.name === 'string' && v.name.trim() !== '' && v.options && Array.isArray(v.options) && v.options.length > 0
      );
      if (validVariants.length > 0) formData.append('variants', JSON.stringify(validVariants));

      if (selectedImages.length > 0) {
        selectedImages.forEach((file) => formData.append('images', file));
      }

      let finalImageUrls = imageUrls || [];
      
      if (imageUploadRef && typeof imageUploadRef.getFinalImages === 'function') {
        try {
          const imageData = imageUploadRef.getFinalImages();
          if (imageData?.imageUrls) finalImageUrls = imageData.imageUrls;
          
          if (editingProduct) {
             formData.append('imagesToDelete', JSON.stringify(imageData.imagesToDelete || []));
             formData.append('remainingImages', JSON.stringify(imageData.remainingImages || []));
          }
        } catch (error) {
          console.warn('Error getting image data:', error);
        }
      } else if (editingProduct) {
        formData.append('imagesToDelete', JSON.stringify([]));
        formData.append('remainingImages', JSON.stringify([]));
      }

      if (finalImageUrls.length > 0) formData.append('imageUrls', JSON.stringify(finalImageUrls));

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      };

      if (editingProduct) {
        await axios.put(`${updateEndpointBase}/${editingProduct.id}`, formData, config);
        toast.success('อัพเดตสินค้าสำเร็จ!');
      } else {
        await axios.post(createEndpoint, formData, config);
        toast.success('เพิ่มสินค้าใหม่สำเร็จ!');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพสินค้า</label>
            <ProductImageUpload
              existingImages={editingProduct?.images || []}
              onImagesSelect={handleImagesSelect}
              onImageUrlsSelect={handleImageUrlsSelect}
              ref={setImageUploadRef}
            />
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อสินค้า <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={productForm.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="กรอกชื่อสินค้า"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                หมวดหมู่ <span className="text-red-500">*</span>
              </label>
              <select
                name="categoryId"
                value={productForm.categoryId}
                onChange={handleInputChange}
                disabled={categoriesLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              >
                <option value="">{categoriesLoading ? 'กำลังโหลด...' : 'เลือกหมวดหมู่'}</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ราคา (บาท) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={productForm.price}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                จำนวนสต็อก <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={productForm.quantity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="0"
                min="0"
                required
              />
            </div>

            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="md:col-span-3">
                 <h3 className="text-sm font-medium text-gray-900 mb-2">ตั้งค่าส่วนลด (Option)</h3>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ราคาลดเหลือ</label>
                <input
                  type="number"
                  name="discountPrice"
                  value={productForm.discountPrice}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เริ่มลด</label>
                <input
                  type="datetime-local"
                  name="discountStartDate"
                  value={productForm.discountStartDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สิ้นสุดลด</label>
                <input
                  type="datetime-local"
                  name="discountEndDate"
                  value={productForm.discountEndDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>


          {/* Subcategories */}
          {productForm.categoryId && availableSubcategories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่ย่อย (เลือกได้สูงสุด 3)</label>
              <div className="flex flex-wrap gap-2">
                {availableSubcategories.map((subcat) => {
                  const isSelected = productForm.productSubcategories?.includes(subcat);
                  return (
                    <label
                      key={subcat}
                      className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer border transition-colors ${
                        isSelected
                          ? 'bg-orange-50 text-orange-600 border-orange-300'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const currentSubcategories = [...(productForm.productSubcategories || [])];
                          if (e.target.checked) {
                            if (currentSubcategories.length < 3) {
                              setProductForm(prev => ({ ...prev, productSubcategories: [...currentSubcategories, subcat] }));
                            } else {
                              toast.warning('เลือกได้สูงสุด 3 หมวดหมู่');
                            }
                          } else {
                            setProductForm(prev => ({ ...prev, productSubcategories: currentSubcategories.filter(s => s !== subcat) }));
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

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดสินค้า</label>
            <textarea
              name="description"
              value={productForm.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
              placeholder="กรอกรายละเอียดสินค้า..."
            />
          </div>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">ตัวเลือกสินค้า</label>
              <button
                type="button"
                onClick={() => setProductForm(prev => ({ ...prev, variants: [...prev.variants, { name: '', options: [] }] }))}
                className="text-sm text-orange-600 hover:text-orange-700"
              >
                <i className="fas fa-plus mr-1"></i> เพิ่มตัวเลือก
              </button>
            </div>
            
            {productForm.variants.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500 text-sm">ยังไม่มีตัวเลือกสินค้า</p>
              </div>
            ) : (
              <div className="space-y-3">
                {productForm.variants.map((variant, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => {
                          const newVariants = [...productForm.variants];
                          newVariants[index].name = e.target.value;
                          setProductForm(prev => ({ ...prev, variants: newVariants }));
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="ชื่อกลุ่มตัวเลือก (เช่น สี, ไซส์)"
                      />
                      <button
                        type="button"
                        onClick={() => setProductForm(prev => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }))}
                        className="text-gray-400 hover:text-red-500 p-2"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                    
                    <div className="flex gap-2">
                      <input type="text" id={`opt-name-${index}`} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="ชื่อตัวเลือก" />
                      <input type="number" id={`opt-price-${index}`} className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="ราคาเพิ่ม" />
                      <button
                        type="button"
                        onClick={() => {
                          const nameEl = document.getElementById(`opt-name-${index}`);
                          const priceEl = document.getElementById(`opt-price-${index}`);
                          if (nameEl.value.trim()) {
                            const newVariants = [...productForm.variants];
                            newVariants[index].options.push({ name: nameEl.value, price: Number(priceEl.value) || 0 });
                            setProductForm(prev => ({ ...prev, variants: newVariants }));
                            nameEl.value = ''; priceEl.value = '';
                          }
                        }}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
                      >
                        เพิ่ม
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {variant.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-sm">
                          <span>{opt.name || opt}</span>
                          {typeof opt === 'object' && opt.price > 0 && (
                            <span className="text-orange-600 text-xs">+฿{opt.price}</span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const newVariants = [...productForm.variants];
                              newVariants[index].options = newVariants[index].options.filter((_, i) => i !== optIdx);
                              setProductForm(prev => ({ ...prev, variants: newVariants }));
                            }}
                            className="text-gray-400 hover:text-red-500 ml-1"
                          >
                            <i className="fas fa-times text-xs"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-6 py-2 text-white rounded-lg text-sm font-medium ${
              isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {isSubmitting && <i className="fas fa-spinner fa-spin mr-2"></i>}
            {editingProduct ? 'บันทึก' : 'เพิ่มสินค้า'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
