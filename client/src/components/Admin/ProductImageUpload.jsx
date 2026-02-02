import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { toast } from 'react-toastify';

const ProductImageUpload = forwardRef(({ onImagesSelect, existingImages = [], onImageUrlsSelect }, ref) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
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
      {/* Upload Methods */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Header Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          <div className="flex-1 p-3 text-center border-r border-gray-100">
             <span className="text-sm font-semibold text-gray-700 flex items-center justify-center gap-2">
               <i className="fas fa-cloud-upload-alt text-orange-500"></i> อัพโหลดไฟล์
             </span>
          </div>
          <div className="flex-1 p-3 text-center">
             <span className="text-sm font-semibold text-gray-700 flex items-center justify-center gap-2">
               <i className="fas fa-link text-blue-500"></i> ลิงก์รูปภาพ
             </span>
          </div>
        </div>

        <div className="p-5 space-y-5">
           {/* File Upload Area */}
           <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-orange-400 hover:bg-orange-50/30 transition-all cursor-pointer group text-center">
              <input
                id="image-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <label htmlFor="image-upload" className="cursor-pointer block">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <i className="fas fa-plus text-gray-400 group-hover:text-orange-500 text-xl transition-colors"></i>
                </div>
                <p className="text-sm font-medium text-gray-700">คลิกเพื่อเลือกรูปรหรือลากไฟล์มาวางที่นี่</p>
                <p className="text-xs text-gray-400 mt-1">สูงสุด 5 รูป (ไฟล์ละไม่เกิน 5MB)</p>
              </label>
           </div>

           {/* URL Input */}
           <div>
             <div className="relative flex items-center">
               <div className="absolute left-3 text-gray-400">
                 <i className="fas fa-link"></i>
               </div>
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
                 className="w-full pl-9 pr-24 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all placeholder-gray-400"
                 placeholder="แปะลิงก์รูปภาพที่นี่ (https://...)"
               />
               <button
                 type="button"
                 onClick={handleAddUrl}
                 className="absolute right-1 top-1 bottom-1 px-3 bg-gray-900 text-white text-xs rounded-md hover:bg-black transition-colors"
               >
                 เพิ่ม
               </button>
             </div>
           </div>
        </div>
      </div>

      {/* Image Previews Section */}
      {(imagePreview.length > 0 || imageUrls.length > 0 || existingImages.length > 0) && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
               <i className="fas fa-images text-gray-400"></i>
               รูปภาพทั้งหมด
               <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">
                 {imagePreview.length + imageUrls.length + existingImages.length}
               </span>
             </h3>
             <button
                type="button"
                onClick={clearAll}
                className="text-xs text-red-500 hover:text-red-600 font-medium"
             >
               ล้างทั้งหมด
             </button>
           </div>

           <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {/* Existing Images */}
              {existingImages.map((image, index) => (
                <div key={image.id || `exist-${index}`} className="group relative aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                  <img
                    src={image.secure_url || image.url}
                    alt=""
                    className={`w-full h-full object-cover transition-opacity ${imagesToDelete.includes(image.id) ? 'opacity-30' : 'group-hover:opacity-90'}`} 
                  />
                  <div className="absolute top-1 right-1">
                     <button
                       type="button"
                       onClick={() => {
                          // Toggle delete status immediately for better UX
                          if (imagesToDelete.includes(image.id)) {
                             setImagesToDelete(prev => prev.filter(id => id !== image.id));
                          } else {
                             setImagesToDelete(prev => [...prev, image.id]);
                          }
                       }}
                       className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm transition-all ${
                         imagesToDelete.includes(image.id)
                           ? 'bg-amber-500 text-white rotate-0'
                           : 'bg-white text-red-500 opacity-0 group-hover:opacity-100'
                       }`}
                     >
                       <i className={`fas ${imagesToDelete.includes(image.id) ? 'fa-undo' : 'fa-trash'}`}></i>
                     </button>
                  </div>
                  {imagesToDelete.includes(image.id) && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded">จะถูกลบ</span>
                    </div>
                  )}
                </div>
              ))}

              {/* URL Images */}
              {imageUrls.map((url, index) => (
                <div key={`url-${index}`} className="group relative aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <button
                       type="button"
                       onClick={() => removeUrl(url)}
                       className="w-7 h-7 bg-white text-red-500 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
                     >
                       <i className="fas fa-trash text-xs"></i>
                     </button>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-black/50 p-1">
                     <p className="text-[9px] text-white text-center truncate"><i className="fas fa-link mr-1"></i>URL</p>
                  </div>
                </div>
              ))}

              {/* File Previews */}
              {imagePreview.map((preview, index) => (
                <div key={`file-${index}`} className="group relative aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                  <img src={preview.url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <button
                       type="button"
                       onClick={() => removeImage(index)}
                       className="w-7 h-7 bg-white text-red-500 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
                     >
                       <i className="fas fa-trash text-xs"></i>
                     </button>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-green-500/80 p-1">
                     <p className="text-[9px] text-white text-center font-medium">ใหม่</p>
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Simplified Tips */}
      <p className="text-xs text-gray-400 text-center">
        * รองรับไฟล์ JPEG, PNG, GIF, WebP และ URL รูปภาพ
      </p>
    </div>
  );
});

ProductImageUpload.displayName = 'ProductImageUpload';

export default ProductImageUpload;
