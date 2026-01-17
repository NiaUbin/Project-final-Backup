import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { toast } from 'react-toastify';

const ProductImageUpload = forwardRef(({ onImagesSelect, existingImages = [], onImageUrlsSelect }, ref) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [imageUrls, setImageUrls] = useState([]);
  const [urlInput, setUrlInput] = useState('');

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Check total images (files + URLs + existing)
    const currentTotal = selectedImages.length + imageUrls.length + existingImages.length;
    const newTotal = currentTotal + files.length;
    
    if (newTotal > 5) {
      toast.error(`สามารถเพิ่มรูปภาพได้สูงสุด 5 รูป (รวม URL และไฟล์) ตอนนี้มี ${currentTotal} รูปแล้ว`);
      return;
    }

    // ตรวจสอบขนาดไฟล์
    const maxSize = 5 * 1024 * 1024; // 5MB
    const invalidFiles = files.filter(file => file.size > maxSize);
    
    if (invalidFiles.length > 0) {
      toast.error('ไฟล์บางไฟล์ใหญ่เกิน 5MB');
      return;
    }

    // ตรวจสอบประเภทไฟล์
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidTypes = files.filter(file => !allowedTypes.includes(file.type));
    
    if (invalidTypes.length > 0) {
      toast.error('รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, GIF, WebP)');
      return;
    }

    setSelectedImages(files);
    onImagesSelect(files);

    // สร้าง preview
    const previews = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
          file: file,
          url: reader.result,
          name: file.name
        });
        reader.readAsDataURL(file);
      });
    });

    Promise.all(previews).then(setImagePreview);
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreview(newPreviews);
    onImagesSelect(newImages);
  };

  const clearAll = () => {
    setSelectedImages([]);
    setImagePreview([]);
    onImagesSelect([]);
    // Reset input
    const input = document.getElementById('image-upload');
    if (input) input.value = '';
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setImagesToDelete([]); // Clear selection when exiting edit mode
    }
  };

  const markImageForDeletion = (imageId) => {
    if (imagesToDelete.includes(imageId)) {
      setImagesToDelete(prev => prev.filter(id => id !== imageId));
    } else {
      setImagesToDelete(prev => [...prev, imageId]);
    }
  };

  // Validate URL
  const isValidImageUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Add image URL
  const handleAddUrl = () => {
    const trimmedUrl = urlInput.trim();
    
    if (!trimmedUrl) {
      toast.error('กรุณากรอก URL');
      return;
    }

    if (!isValidImageUrl(trimmedUrl)) {
      toast.error('URL ไม่ถูกต้อง กรุณาใส่ URL ที่เริ่มต้นด้วย http:// หรือ https://');
      return;
    }

    if (imageUrls.includes(trimmedUrl)) {
      toast.warning('URL นี้ถูกเพิ่มแล้ว');
      return;
    }

    // Check total images (files + URLs + existing)
    const totalImages = selectedImages.length + imageUrls.length + existingImages.length;
    if (totalImages >= 5) {
      toast.error('สามารถเพิ่มรูปภาพได้สูงสุด 5 รูป');
      return;
    }

    // Test if image loads
    const img = new Image();
    img.onload = () => {
      const newUrls = [...imageUrls, trimmedUrl];
      setImageUrls(newUrls);
      if (onImageUrlsSelect) {
        onImageUrlsSelect(newUrls);
      }
      setUrlInput('');
      toast.success('เพิ่ม URL รูปภาพสำเร็จ');
    };
    img.onerror = () => {
      toast.error('ไม่สามารถโหลดรูปภาพจาก URL นี้ได้ กรุณาตรวจสอบ URL');
    };
    img.src = trimmedUrl;
  };

  // Remove URL
  const removeUrl = (urlToRemove) => {
    const newUrls = imageUrls.filter(url => url !== urlToRemove);
    setImageUrls(newUrls);
    if (onImageUrlsSelect) {
      onImageUrlsSelect(newUrls);
    }
    toast.info('ลบ URL รูปภาพแล้ว');
  };

  // ส่งข้อมูลรูปภาพไปยัง parent component
  useImperativeHandle(ref, () => ({
    getFinalImages: () => {
      // Use current values from closure to avoid dependency issues
      return {
        newImages: selectedImages,
        imageUrls: imageUrls,
        imagesToDelete: imagesToDelete,
        remainingImages: existingImages.filter(img => !imagesToDelete.includes(img.id))
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [selectedImages, imageUrls, imagesToDelete]);

  return (
    <div className="space-y-4">
      {/* URL Input Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-5 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <i className="fas fa-link text-white text-lg"></i>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">เพิ่มรูปภาพจาก URL</h3>
            <p className="text-xs text-gray-600 mt-1">ใส่ URL รูปภาพเพื่อเพิ่มรูปภาพโดยไม่ต้องอัพโหลดไฟล์</p>
          </div>
        </div>
        
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUrl();
              }
            }}
            className="flex-1 px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="https://example.com/image.jpg"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg font-semibold flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            เพิ่ม URL
          </button>
        </div>

        {/* URL Images Preview */}
        {imageUrls.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">
                รูปภาพจาก URL ({imageUrls.length})
              </h4>
              <button
                type="button"
                onClick={() => {
                  setImageUrls([]);
                  if (onImageUrlsSelect) {
                    onImageUrlsSelect([]);
                  }
                  toast.info('ลบ URL ทั้งหมดแล้ว');
                }}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                <i className="fas fa-trash mr-1"></i>
                ลบทั้งหมด
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-purple-300">
                    <img
                      src={url}
                      alt={`Product ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x300?text=Invalid+URL';
                      }}
                    />
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeUrl(url)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                  
                  {/* URL Info */}
                  <div className="mt-1 text-xs text-gray-500 truncate" title={url}>
                    <i className="fas fa-link mr-1"></i>
                    URL {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
          <p className="text-xs text-gray-600">
            <i className="fas fa-info-circle text-purple-500 mr-2"></i>
            <strong>คำแนะนำ:</strong> ใส่ URL รูปภาพที่เริ่มต้นด้วย http:// หรือ https:// แล้วกด Enter หรือคลิกปุ่ม "เพิ่ม URL"
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500 font-medium">หรือ</span>
        </div>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors duration-200">
        <input
          id="image-upload"
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
        <label
          htmlFor="image-upload"
          className="cursor-pointer flex flex-col items-center space-y-2"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <i className="fas fa-cloud-upload-alt text-blue-500 text-xl"></i>
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">
              คลิกเพื่อเลือกรูปภาพ
            </p>
            <p className="text-sm text-gray-500">
              หรือลากไฟล์มาวางที่นี่
            </p>
          </div>
          <div className="text-xs text-gray-400">
            รองรับ: JPEG, PNG, GIF, WebP | สูงสุด 5 รูป (รวม URL และไฟล์) | ไฟล์ละไม่เกิน 5MB
          </div>
        </label>
      </div>

      {/* Image Previews */}
      {imagePreview.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              รูปภาพที่เลือก ({imagePreview.length})
            </h3>
            <button
              type="button"
              onClick={clearAll}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              <i className="fas fa-trash mr-1"></i>
              ลบทั้งหมด
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {imagePreview.map((preview, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={preview.url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                >
                  <i className="fas fa-times"></i>
                </button>
                
                {/* File Info */}
                <div className="mt-1 text-xs text-gray-500 truncate">
                  {preview.name}
                </div>
                <div className="text-xs text-gray-400">
                  {(preview.file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Images Display */}
      {existingImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                รูปภาพปัจจุบัน ({existingImages.length})
              </h3>
              {imagesToDelete.length > 0 && (
                <p className="text-sm text-red-600 mt-1">
                  เลือกลบแล้ว {imagesToDelete.length} รูป
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={toggleEditMode}
              className={`px-3 py-1 text-sm rounded-lg transition-colors duration-200 ${
                isEditing 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <i className={`fas ${isEditing ? 'fa-check' : 'fa-edit'} mr-1`}></i>
              {isEditing ? 'เสร็จสิ้น' : 'แก้ไขรูปภาพ'}
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {existingImages.map((image, index) => (
              <div key={image.id || index} className="relative group">
                <div className={`aspect-square bg-gray-100 rounded-lg overflow-hidden ${
                  imagesToDelete.includes(image.id) ? 'opacity-50 ring-2 ring-red-500' : ''
                }`}>
                  <img
                    src={image.secure_url || image.url}
                    alt={`Current ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                    }}
                  />
                </div>
                
                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                  <span className={`text-white text-xs px-2 py-1 rounded ${
                    imagesToDelete.includes(image.id) 
                      ? 'bg-red-500' 
                      : 'bg-green-500'
                  }`}>
                    {imagesToDelete.includes(image.id) ? 'จะลบ' : 'ปัจจุบัน'}
                  </span>
                </div>

                {/* Delete Button (แสดงเมื่ออยู่ในโหมดแก้ไข) */}
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => markImageForDeletion(image.id)}
                    className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors duration-200 ${
                      imagesToDelete.includes(image.id)
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                    title={imagesToDelete.includes(image.id) ? 'ยกเลิกการลบ' : 'ลบรูปภาพ'}
                  >
                    <i className={`fas ${imagesToDelete.includes(image.id) ? 'fa-undo' : 'fa-trash'}`}></i>
                  </button>
                )}

                {/* File Info */}
                <div className="mt-1 text-xs text-gray-500 truncate">
                  รูปที่ {index + 1}
                </div>
              </div>
            ))}
          </div>

          {/* Edit Mode Info */}
          {isEditing && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center text-yellow-800">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                <span className="text-sm">
                  <strong>โหมดแก้ไขรูปภาพ:</strong> คลิกที่รูปภาพเพื่อเลือกลบ หรือคลิกปุ่ม "เสร็จสิ้น" เพื่อยืนยันการเปลี่ยนแปลง
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">
          <i className="fas fa-info-circle mr-2"></i>
          คำแนะนำการเพิ่มรูปภาพ
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• ใช้รูปภาพที่มีความละเอียดสูงเพื่อการแสดงผลที่ดี</li>
          <li>• รูปภาพแรกจะถูกใช้เป็นรูปหลักของสินค้า</li>
          <li>• สามารถเพิ่มรูปภาพได้ 2 วิธี: ใส่ URL หรืออัพโหลดไฟล์</li>
          <li>• รองรับไฟล์ JPEG, PNG, GIF และ WebP</li>
          <li>• ขนาดไฟล์ไม่เกิน 5MB ต่อไฟล์</li>
          <li>• สามารถเพิ่มได้สูงสุด 5 รูปต่อสินค้า (รวม URL และไฟล์)</li>
        </ul>
      </div>
    </div>
  );
});

ProductImageUpload.displayName = 'ProductImageUpload';

export default ProductImageUpload;
