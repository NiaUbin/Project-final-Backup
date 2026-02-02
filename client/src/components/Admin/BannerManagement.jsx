
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

const BannerManagement = () => {
  const { user } = useAuth();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const initialFormState = { id: null, title: "", image: null, imageUrl: "", link: "", position: "main", status: true };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/config/banners');
      setBanners(data);
    } catch (error) {
      console.error("Error loading banners:", error);
      // Fallback to empty array but don't show error if it's just empty
      setBanners([]); 
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file, imageUrl: URL.createObjectURL(file) });
    }
  };

  const handleEditClick = (banner) => {
      setIsEditing(true);
      setFormData({
          id: banner.id,
          title: banner.title || "",
          image: null, 
          imageUrl: banner.image,
          link: banner.link || "",
          position: banner.position || "main",
          status: banner.status
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
      setIsEditing(false);
      setFormData(initialFormState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.imageUrl && !formData.image) return toast.error("กรุณาเลือกรูปภาพ");
    
    setUploading(true);
    
    try {
        let imageUrl = formData.imageUrl;

        // If new file selected, upload it first
        if (formData.image) {
            const uploadData = new FormData();
            uploadData.append('image', formData.image);
            
            try {
                const uploadRes = await axios.post('/api/images', uploadData, {
                    headers: { 'Authorization': `Bearer ${user.token}` } // Cleaned up header
                });
                
                if (uploadRes.data && uploadRes.data.url) {
                    imageUrl = uploadRes.data.url;
                } else {
                    throw new Error("Upload response missing URL");
                }
            } catch (err) {
                 console.error("Upload failed:", err);
                 // Check specifically for Cloudinary config error
                 if (err.response && err.response.data && err.response.data.error === 'CLOUDINARY_UPLOAD_ERROR') {
                    toast.error("ไม่สามารถอัพโหลดรูปได้: ตรวจสอบ Cloudinary Config");
                 } else {
                    toast.error("การอัพโหลดรูปภาพล้มเหลว");
                 }
                 setUploading(false);
                 return; // Abort save if upload fails
            }
        }

        const payload = {
            title: formData.title,
            image: imageUrl, // This should be the real server URL
            link: formData.link,
            position: formData.position,
            status: formData.status
        };

        if (isEditing) {
            await axios.put(`/api/config/banner/${formData.id}`, payload, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            toast.success("อัพเดทแบนเนอร์สำเร็จ");
        } else {
            await axios.post('/api/config/banner', payload, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            toast.success("เพิ่มแบนเนอร์สำเร็จ");
        }
        
        loadBanners();
        setFormData(initialFormState);
        setIsEditing(false);
    } catch (error) {
        console.error(error);
        toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
        setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("คุณต้องการลบแบนเนอร์นี้ใช่หรือไม่?")) {
        try {
            await axios.delete(`/api/config/banner/${id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            toast.success("ลบแบนเนอร์สำเร็จ");
            loadBanners();
        } catch (error) {
            toast.error("ไม่สามารถลบข้อมูลได้");
        }
    }
  };

  const toggleStatus = async (id) => {
      try {
          await axios.patch(`/api/config/banner/${id}/status`, {}, {
              headers: { Authorization: `Bearer ${user.token}` }
          });
          loadBanners(); // Reload to get updated status
      } catch (error) {
          toast.error("ไม่สามารถเปลี่ยนสถานะได้");
      }
  };

  const getPositionLabel = (pos) => {
      switch(pos) {
          case 'main': return { label: 'ภาพหลัก', color: 'bg-indigo-100 text-indigo-700' };
          case 'side-top': return { label: 'ด้านข้าง (บน)', color: 'bg-amber-100 text-amber-700' };
          case 'side-bottom': return { label: 'ด้านข้าง (ล่าง)', color: 'bg-orange-100 text-orange-700' };
          default: return { label: 'ทั่วไป', color: 'bg-slate-100 text-slate-600' };
      }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-1">
            <div className={`bg-white p-5 rounded-2xl shadow-sm border ${isEditing ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200'} sticky top-24 transition-all`}>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <i className={`fas ${isEditing ? 'fa-pen-to-square' : 'fa-plus-circle'} ${isEditing ? 'text-indigo-600' : 'text-emerald-600'}`}></i>
                    {isEditing ? 'แก้ไขแบนเนอร์' : 'เพิ่มแบนเนอร์ใหม่'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Position Selector */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">ตำแหน่งการแสดงผล <span className="text-red-500">*</span></label>
                        <select 
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                            value={formData.position}
                            onChange={(e) => setFormData({...formData, position: e.target.value})}
                        >
                            <option value="main">ภาพหลัก (Main Slider) - ใหญ่</option>
                            <option value="side-top">ด้านข้าง (Side Top) - เล็ก</option>
                            <option value="side-bottom">ด้านข้าง (Side Bottom) - เล็ก</option>
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1">
                            {formData.position === 'main' ? 'ขนาดแนะนำ: 1200x400px' : 'ขนาดแนะนำ: 400x200px'}
                        </p>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">หัวข้อ (Optional)</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 hover:bg-white transition-all"
                            placeholder="เช่น โปรโมชั่นหน้าร้อน"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">รูปภาพ</label>
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer relative group">
                            <input 
                                type="file" 
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={handleFileChange}
                            />
                            {formData.imageUrl ? (
                                <div className="relative">
                                    <img src={formData.imageUrl} alt="Preview" className="h-32 w-full object-cover rounded-lg shadow-sm" />
                                    <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs z-0 pointer-events-none">
                                        คลิกเพื่อเปลี่ยนรูป
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setFormData({...formData, image: null, imageUrl: ""});
                                        }}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-md hover:bg-red-600 z-20"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            ) : (
                                <div className="py-4">
                                    <i className="fas fa-cloud-upload-alt text-3xl text-slate-300 mb-2"></i>
                                    <p className="text-xs text-slate-500">คลิกเพื่ออัพโหลดรูปภาพ</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Link */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">ลิงก์ปลายทาง (URL)</label>
                        <div className="relative">
                            <i className="fas fa-link absolute left-3 top-2.5 text-slate-400 text-xs"></i>
                            <input 
                                type="text" 
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 hover:bg-white transition-all"
                                placeholder="/products/promotion"
                                value={formData.link}
                                onChange={(e) => setFormData({...formData, link: e.target.value})}
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">เมื่อคลิกที่รูป จะลิงก์ไปหน้านี้</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        {isEditing && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-all"
                            >
                                ยกเลิก
                            </button>
                        )}
                        <button 
                            type="submit" 
                            disabled={uploading}
                            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2 
                                ${isEditing 
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20' 
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20'
                                } disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                            {uploading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className={`fas ${isEditing ? 'fa-save' : 'fa-plus'}`}></i>}
                            <span>{isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มแบนเนอร์'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <i className="fas fa-images text-slate-400"></i>
                        รายการแบนเนอร์ ({banners.length})
                    </h3>
                </div>
                
                {loading ? (
                    <div className="p-10 text-center text-slate-500">
                        <i className="fas fa-circle-notch fa-spin mr-2"></i> กำลังโหลด...
                    </div>
                ) : banners.length === 0 ? (
                    <div className="p-10 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <i className="fas fa-image text-2xl"></i>
                        </div>
                        <p className="text-slate-500">ยังไม่มีแบนเนอร์</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {banners.map((item) => {
                            const posInfo = getPositionLabel(item.position);
                            
                            return (
                                <div key={item.id} className={`p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center group hover:bg-slate-50 transition-colors ${!item.status ? 'opacity-60 bg-slate-50' : ''}`}>
                                    {/* Drag Handle */}
                                    <div className="text-slate-300 cursor-move hidden sm:block p-2">
                                        <i className="fas fa-grip-vertical"></i>
                                    </div>
                                    
                                    {/* Image Preview */}
                                    <div className="w-full sm:w-40 h-24 rounded-lg overflow-hidden border border-slate-200 relative bg-slate-100 flex-shrink-0">
                                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                        {!item.status && (
                                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                                <i className="fas fa-eye-slash text-white drop-shadow-md"></i>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 w-full">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${posInfo.color} border border-transparent`}>
                                                {posInfo.label}
                                            </span>
                                            {item.status ? (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="font-semibold text-slate-800 text-sm truncate">{item.title || "No Title"}</h4>
                                        <div className="flex items-center text-xs text-slate-500 mt-1 truncate gap-1">
                                            <i className="fas fa-link text-[10px]"></i>
                                            <span className="truncate">{item.link || "No Link"}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto justify-end">
                                        <button 
                                            onClick={() => handleEditClick(item)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all"
                                            title="แก้ไข"
                                        >
                                            <i className="fas fa-pen text-xs"></i>
                                        </button>
                                        <button 
                                            onClick={() => toggleStatus(item.id)}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${item.status ? 'bg-white border-slate-200 text-emerald-600 hover:bg-emerald-50' : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'}`}
                                            title={item.status ? "ปิดการแสดงผล" : "เปิดการแสดงผล"}
                                        >
                                            <i className={`fas ${item.status ? 'fa-eye' : 'fa-eye-slash'} text-xs`}></i>
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(item.id)}
                                            className="w-8 h-8 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 rounded-lg transition-all"
                                            title="ลบ"
                                        >
                                            <i className="fas fa-trash-alt text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default BannerManagement;
