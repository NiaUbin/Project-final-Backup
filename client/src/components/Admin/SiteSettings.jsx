
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

const SiteSettings = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState({
        siteName: "",
        description: "",
        contactEmail: "",
        contactPhone: "",
        address: "",
        shippingFee: 0,
        freeShippingThreshold: 0,
        facebook: "",
        line: "",
        maintenanceMode: false
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setIsLoading(true);
            const { data } = await axios.get('/api/config/settings');
            if (data) {
                setSettings({
                    siteName: data.siteName || "",
                    description: data.description || "",
                    contactEmail: data.contactEmail || "",
                    contactPhone: data.contactPhone || "",
                    address: data.address || "",
                    shippingFee: data.shippingFee || 0,
                    freeShippingThreshold: data.freeShippingThreshold || 0,
                    facebook: data.facebook || "",
                    line: data.line || "",
                    maintenanceMode: data.maintenanceMode || false
                });
            }
        } catch (error) {
            console.error(error);
            toast.error("ไม่สามารถโหลดการตั้งค่าได้");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!user || user.role !== 'admin') {
            return toast.error("คุณไม่มีสิทธิ์ในการบันทึกการตั้งค่า");
        }

        setIsSaving(true);
        try {
            await axios.post('/api/config/settings', settings, {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            });
            toast.success("บันทึกการตั้งค่าเรียบร้อยแล้ว");
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึก");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-10 text-center"><i className="fas fa-circle-notch fa-spin text-indigo-500 text-3xl"></i></div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <form onSubmit={handleSave}>
                {/* General Settings */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <i className="fas fa-globe text-indigo-500"></i>
                            ข้อมูลทั่วไป
                        </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">ชื่อเว็บไซต์ (Site Name)</label>
                            <input
                                type="text"
                                name="siteName"
                                value={settings.siteName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 hover:bg-white transition-all outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">คำอธิบาย (Meta Description)</label>
                            <input
                                type="text"
                                name="description"
                                value={settings.description}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 hover:bg-white transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <i className="fas fa-address-book text-emerald-500"></i>
                            ข้อมูลการติดต่อ
                        </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">อีเมลติดต่อ</label>
                            <input
                                type="email"
                                name="contactEmail"
                                value={settings.contactEmail}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 hover:bg-white transition-all outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">เบอร์โทรศัพท์</label>
                            <input
                                type="text"
                                name="contactPhone"
                                value={settings.contactPhone}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 hover:bg-white transition-all outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-2">ที่อยู่ร้านค้า (สำหรับใบเสร็จ)</label>
                            <textarea
                                name="address"
                                value={settings.address}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 hover:bg-white transition-all outline-none resize-none"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Shipping & System */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                             <i className="fas fa-shipping-fast text-amber-500"></i>
                            การจัดส่ง & ระบบ
                        </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">ค่าล่งเริ่มต้น (บาท)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="shippingFee"
                                    value={settings.shippingFee}
                                    onChange={handleChange}
                                    className="w-full pl-4 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 hover:bg-white transition-all outline-none"
                                />
                                <span className="absolute right-4 top-2 text-slate-400 text-sm">฿</span>
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">ส่งฟรีเมื่อซื้อครบ (บาท)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="freeShippingThreshold"
                                    value={settings.freeShippingThreshold}
                                    onChange={handleChange}
                                    className="w-full pl-4 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 hover:bg-white transition-all outline-none"
                                />
                                <span className="absolute right-4 top-2 text-slate-400 text-sm">฿</span>
                            </div>
                        </div>
                        
                         <div className="md:col-span-2 pt-4 border-t border-slate-100">
                             <div className="flex items-center justify-between">
                                 <div>
                                     <h4 className="text-sm font-bold text-slate-800">โหมดปิดปรับปรุง (Maintenance Mode)</h4>
                                     <p className="text-xs text-slate-500">เมื่อเปิดใช้งาน ลูกค้าทั่วไปจะไม่สามารถเข้าใช้งานหน้าเว็บไซต์ได้</p>
                                 </div>
                                 <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        name="maintenanceMode"
                                        checked={settings.maintenanceMode} 
                                        onChange={handleChange}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                                </label>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Social Media */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                     <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <i className="fas fa-share-alt text-blue-500"></i>
                            โซเชียลมีเดีย
                        </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-2">Facebook URL</label>
                             <div className="relative">
                                <i className="fab fa-facebook absolute left-4 top-2.5 text-blue-600"></i>
                                <input
                                    type="text"
                                    name="facebook"
                                    value={settings.facebook}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 hover:bg-white transition-all outline-none"
                                />
                             </div>
                        </div>
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-2">Line ID</label>
                             <div className="relative">
                                <i className="fab fa-line absolute left-4 top-2.5 text-green-500"></i>
                                <input
                                    type="text"
                                    name="line"
                                    value={settings.line}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 hover:bg-white transition-all outline-none"
                                />
                             </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 lg:pl-64 flex items-center justify-end gap-3 z-40 shadow-lg">
                    <button 
                        type="button" 
                        onClick={() => window.location.reload()}
                        className="px-6 py-2.5 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                    >
                        {isSaving && <i className="fas fa-circle-notch fa-spin"></i>}
                        <span>บันทึกการตั้งค่า</span>
                    </button>
                </div>
            </form>
            <div className="h-16"></div> {/* Spacer for sticky footer */}
        </div>
    );
};

export default SiteSettings;
