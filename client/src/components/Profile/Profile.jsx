import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const dateInputRef = useRef(null);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    gender: user?.gender || 'ชาย',
    dateOfBirth: user?.dateOfBirth || '',
    profilePicture: user?.profilePicture || null
  });

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [userCoupons, setUserCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [creatingCoupon, setCreatingCoupon] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        gender: user.gender || 'ชาย',
        dateOfBirth: user.dateOfBirth || '',
        profilePicture: user.profilePicture || null
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'discounts' && user) {
      loadCoupons();
    }
  }, [activeTab, user]);

  const loadCoupons = async () => {
    try {
      setLoadingCoupons(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('กรุณาเข้าสู่ระบบก่อน');
        return;
      }
      const response = await axios.get('/api/coupon/my-coupons', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserCoupons(response.data.coupons || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดโค้ดส่วนลด');
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success(`คัดลอกโค้ด "${code}" เรียบร้อยแล้ว!`);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = code;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedCode(code);
        toast.success(`คัดลอกโค้ด "${code}" เรียบร้อยแล้ว!`);
        setTimeout(() => setCopiedCode(null), 2000);
      } catch (err) {
        toast.error('ไม่สามารถคัดลอกโค้ดได้');
      }
      document.body.removeChild(textArea);
    }
  };

  const handleCreateTestCoupon = async () => {
    try {
      setCreatingCoupon(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('กรุณาเข้าสู่ระบบก่อน');
        return;
      }
      const response = await axios.post('/api/coupon/create-test', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.coupon) {
        toast.success('สร้างโค้ดส่วนลดสำเร็จ!');
        await loadCoupons();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'ไม่สามารถสร้างโค้ดส่วนลดได้');
    } finally {
      setCreatingCoupon(false);
    }
  };

  const hasChanges = () => {
    return profileData.name !== (user?.name || '') || profileData.email !== (user?.email || '');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
      toast.error('รองรับเฉพาะไฟล์ .JPEG และ .PNG');
      return;
    }

    if (file.size > 1048576) {
      toast.error('ขนาดไฟล์ต้องไม่เกิน 1 MB');
      return;
    }

    setUploadingImage(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await axios.post('/api/user/upload-profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.profilePicture) {
        setProfileData(prev => ({
          ...prev,
          profilePicture: response.data.profilePicture
        }));
        updateUser({
          ...user,
          profilePicture: response.data.profilePicture
        });
        toast.success('อัพโหลดรูปภาพสำเร็จ!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const maskEmail = (email) => {
    if (!email) return '';
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 3) return email;
    const masked = localPart.slice(0, 2) + '*'.repeat(localPart.length - 2);
    return `${masked}@${domain}`;
  };

  const maskPhone = (phone) => {
    if (!phone) return '';
    if (phone.length <= 4) return phone;
    return '*'.repeat(phone.length - 2) + phone.slice(-2);
  };

  const maskDateOfBirth = (date) => {
    if (!date) return '**/**/****';
    const parts = date.split('-');
    if (parts.length === 3) {
      return `**/**/${parts[0]}`;
    }
    return '**/**/****';
  };

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [addressData, setAddressData] = useState({
    address: user?.address || '',
    phone: user?.phone || ''
  });

  useEffect(() => {
    if (user) {
      setAddressData({
        address: user.address || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!profileData.name || !profileData.name.trim()) {
      toast.error('กรุณากรอกชื่อ');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await axios.post('/api/user/update-profile', {
        name: profileData.name.trim(),
        email: profileData.email.trim(),
        picture: profileData.profilePicture
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.message || response.data.user) {
        const updatedUser = {
          ...user,
          name: profileData.name.trim(),
          email: profileData.email.trim(),
          profilePicture: profileData.profilePicture || user?.profilePicture
        };
        updateUser(updatedUser);
        setIsEditingEmail(false);
        toast.success('บันทึกข้อมูลสำเร็จ!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!addressData.address || !addressData.address.trim()) {
      toast.error('กรุณากรอกที่อยู่ในการจัดส่ง');
      setLoading(false);
      return;
    }

    if (!addressData.phone || !addressData.phone.trim()) {
      toast.error('กรุณากรอกเบอร์โทรศัพท์');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await axios.post('/api/user/update-profile', {
        name: user?.name || '',
        address: addressData.address.trim(),
        phone: addressData.phone.trim(),
        picture: user?.profilePicture || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.message || response.data.user) {
        updateUser({
          ...user,
          address: addressData.address.trim(),
          phone: addressData.phone.trim()
        });
        toast.success('บันทึกที่อยู่สำเร็จ!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกที่อยู่');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword || !passwordData.currentPassword.trim()) {
      toast.error('กรุณากรอกรหัสผ่านปัจจุบัน');
      return;
    }

    if (!passwordData.newPassword || !passwordData.newPassword.trim()) {
      toast.error('กรุณากรอกรหัสผ่านใหม่');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านปัจจุบัน');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const response = await axios.post('/api/user/change-password', {
        currentPassword: passwordData.currentPassword.trim(),
        newPassword: passwordData.newPassword.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.message) {
        toast.success('เปลี่ยนรหัสผ่านสำเร็จ!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, formType) => {
    const { name, value } = e.target;
    if (formType === 'profile') {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    } else if (formType === 'password') {
      setPasswordData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const navigationItems = [
    {
      category: 'บัญชีของฉัน',
      items: [
        { id: 'profile', name: 'ข้อมูลส่วนตัว', icon: 'fas fa-user' },
        { id: 'address', name: 'ที่อยู่จัดส่ง', icon: 'fas fa-map-marker-alt' },
        { id: 'password', name: 'เปลี่ยนรหัสผ่าน', icon: 'fas fa-lock' },
      ]
    },
    {
      category: 'สิทธิพิเศษ',
      items: [
        { id: 'discounts', name: 'โค้ดส่วนลดของฉัน', icon: 'fas fa-tag' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] pt-16">
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-sm shadow-sm overflow-hidden">
              {/* Profile Summary */}
              <div className="p-4 bg-gradient-to-r from-[#ee4d2d] to-[#f7522e]">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-white/20 flex items-center justify-center border-2 border-white/30">
                    {profileData.profilePicture ? (
                      <img
                        src={profileData.profilePicture}
                        alt={profileData.name || 'Profile'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <i className="fas fa-user text-white text-xl"></i>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-sm truncate">
                      {profileData.name || user?.name || 'ผู้ใช้'}
                    </h3>
                    <p className="text-white/80 text-xs truncate">
                      {profileData.email || user?.email || ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="p-2">
                {navigationItems.map((category, catIdx) => (
                  <div key={catIdx} className={catIdx > 0 ? 'mt-3 pt-3 border-t border-gray-100' : ''}>
                    <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase">
                      {category.category}
                    </div>
                    <ul className="space-y-0.5">
                      {category.items.map((item) => (
                        <li key={item.id}>
                          <button
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-sm transition-colors ${activeTab === item.id
                                ? 'bg-[#fef0ed] text-[#ee4d2d] font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                              }`}
                          >
                            <i className={`${item.icon} w-4 text-center ${activeTab === item.id ? 'text-[#ee4d2d]' : 'text-gray-400'}`}></i>
                            <span>{item.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-sm shadow-sm">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="font-medium text-gray-900">ข้อมูลของฉัน</h2>
                  <p className="text-xs text-gray-500 mt-0.5">จัดการข้อมูลส่วนตัวเพื่อความปลอดภัยของบัญชี</p>
                </div>

                <form onSubmit={handleProfileUpdate} className="p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form Fields */}
                    <div className="lg:col-span-2 space-y-4">
                      {/* Username */}
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">ชื่อผู้ใช้</label>
                        <input
                          type="text"
                          value={user?.username || user?.email?.split('@')[0] || user?.name || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-sm bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                          disabled
                        />
                      </div>

                      {/* Name */}
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">ชื่อ</label>
                        <input
                          type="text"
                          name="name"
                          value={profileData.name}
                          onChange={(e) => handleInputChange(e, 'profile')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#ee4d2d]"
                          placeholder="กรุณากรอกชื่อ"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">อีเมล</label>
                        <div className="flex items-center gap-2">
                          {isEditingEmail ? (
                            <>
                              <input
                                type="email"
                                name="email"
                                value={profileData.email}
                                onChange={(e) => handleInputChange(e, 'profile')}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#ee4d2d]"
                                placeholder="กรอกอีเมลใหม่"
                              />
                              <button
                                type="button"
                                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                                onClick={() => {
                                  setIsEditingEmail(false);
                                  setProfileData(prev => ({ ...prev, email: user?.email || '' }));
                                }}
                              >
                                ยกเลิก
                              </button>
                            </>
                          ) : (
                            <>
                              <input
                                type="text"
                                value={maskEmail(profileData.email)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-sm bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                                disabled
                              />
                              <button
                                type="button"
                                className="px-3 py-2 text-sm text-[#ee4d2d] hover:text-[#d73211]"
                                onClick={() => setIsEditingEmail(true)}
                              >
                                เปลี่ยน
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">เบอร์โทรศัพท์</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={maskPhone(profileData.phone)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-sm bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                            disabled
                          />
                          <button
                            type="button"
                            className="px-3 py-2 text-sm text-[#ee4d2d] hover:text-[#d73211]"
                            onClick={() => setActiveTab('address')}
                          >
                            เปลี่ยน
                          </button>
                        </div>
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">เพศ</label>
                        <div className="flex gap-4">
                          {['ชาย', 'หญิง', 'อื่นๆ'].map((gender) => (
                            <label key={gender} className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name="gender"
                                value={gender}
                                checked={profileData.gender === gender}
                                onChange={(e) => handleInputChange(e, 'profile')}
                                className="w-4 h-4 text-[#ee4d2d] border-gray-300 focus:ring-[#ee4d2d]"
                              />
                              <span className={`ml-2 text-sm ${profileData.gender === gender ? 'text-[#ee4d2d]' : 'text-gray-600'}`}>
                                {gender}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={loading || !hasChanges()}
                          className={`px-8 py-2 rounded-sm text-sm font-medium transition-colors ${hasChanges() && !loading
                              ? 'bg-[#ee4d2d] hover:bg-[#d73211] text-white'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                          {loading ? (
                            <><i className="fas fa-spinner fa-spin mr-2"></i>กำลังบันทึก...</>
                          ) : (
                            'บันทึก'
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Profile Picture */}
                    <div className="lg:col-span-1">
                      <div className="flex flex-col items-center p-4 bg-gray-50 rounded-sm">
                        <div className="w-24 h-24 rounded-full overflow-hidden mb-4 bg-[#ee4d2d] flex items-center justify-center border-4 border-white shadow-md">
                          {profileData.profilePicture ? (
                            <img
                              src={profileData.profilePicture}
                              alt={profileData.name || 'Profile'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <i className="fas fa-user text-white text-3xl"></i>
                          )}
                        </div>

                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/jpeg,image/png"
                          onChange={handleImageUpload}
                          className="hidden"
                        />

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="px-4 py-2 border border-gray-300 text-gray-600 rounded-sm hover:bg-gray-100 text-sm transition-colors disabled:opacity-50 mb-2"
                        >
                          {uploadingImage ? (
                            <><i className="fas fa-spinner fa-spin mr-2"></i>อัพโหลด...</>
                          ) : (
                            'เลือกรูป'
                          )}
                        </button>

                        <div className="text-xs text-gray-400 text-center">
                          <p>ขนาดไฟล์: สูงสุด 1 MB</p>
                          <p>ไฟล์: .JPEG, .PNG</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="bg-white rounded-sm shadow-sm">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="font-medium text-gray-900">เปลี่ยนรหัสผ่าน</h2>
                  <p className="text-xs text-gray-500 mt-0.5">เปลี่ยนรหัสผ่านเพื่อความปลอดภัย</p>
                </div>

                <form onSubmit={handlePasswordChange} className="p-4 max-w-xl">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">รหัสผ่านปัจจุบัน</label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={(e) => handleInputChange(e, 'password')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#ee4d2d]"
                        placeholder="กรอกรหัสผ่านปัจจุบัน"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">รหัสผ่านใหม่</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={(e) => handleInputChange(e, 'password')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#ee4d2d]"
                        placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">ยืนยันรหัสผ่านใหม่</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={(e) => handleInputChange(e, 'password')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#ee4d2d]"
                        placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                      />
                    </div>

                    <div className="p-3 bg-yellow-50 rounded-sm border border-yellow-200">
                      <div className="flex items-start gap-2">
                        <i className="fas fa-exclamation-triangle text-yellow-500 mt-0.5"></i>
                        <p className="text-xs text-yellow-700">รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร</p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-2 bg-[#ee4d2d] hover:bg-[#d73211] text-white rounded-sm text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {loading ? (
                          <><i className="fas fa-spinner fa-spin mr-2"></i>กำลังเปลี่ยน...</>
                        ) : (
                          'เปลี่ยนรหัสผ่าน'
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Address Tab */}
            {activeTab === 'address' && (
              <div className="bg-white rounded-sm shadow-sm">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="font-medium text-gray-900">ที่อยู่จัดส่ง</h2>
                  <p className="text-xs text-gray-500 mt-0.5">จัดการที่อยู่สำหรับจัดส่งสินค้า</p>
                </div>

                <form onSubmit={handleAddressUpdate} className="p-4 max-w-xl">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">
                        ที่อยู่จัดส่ง <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="address"
                        value={addressData.address}
                        onChange={(e) => setAddressData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="บ้านเลขที่, หมู่บ้าน, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์"
                        className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#ee4d2d] resize-none"
                        rows={4}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">
                        เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={addressData.phone}
                        onChange={(e) => setAddressData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="0812345678"
                        className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#ee4d2d]"
                        required
                      />
                    </div>

                    {user?.address && (
                      <div className="p-3 bg-gray-50 rounded-sm border border-gray-200">
                        <p className="text-xs font-medium text-gray-600 mb-1">ที่อยู่ปัจจุบัน:</p>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{user.address}</p>
                        {user.phone && <p className="text-xs text-gray-500 mt-1">โทร: {user.phone}</p>}
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading || !addressData.address.trim() || !addressData.phone.trim()}
                        className={`px-8 py-2 rounded-sm text-sm font-medium transition-colors ${addressData.address.trim() && addressData.phone.trim() && !loading
                            ? 'bg-[#ee4d2d] hover:bg-[#d73211] text-white'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                      >
                        {loading ? (
                          <><i className="fas fa-spinner fa-spin mr-2"></i>กำลังบันทึก...</>
                        ) : (
                          'บันทึกที่อยู่'
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Discounts Tab */}
            {activeTab === 'discounts' && (
              <div className="bg-white rounded-sm shadow-sm">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-medium text-gray-900">โค้ดส่วนลดของฉัน</h2>
                    <p className="text-xs text-gray-500 mt-0.5">จัดการโค้ดส่วนลดที่คุณมี</p>
                  </div>
                  <button
                    onClick={handleCreateTestCoupon}
                    disabled={creatingCoupon}
                    className="px-4 py-1.5 bg-[#ee4d2d] hover:bg-[#d73211] text-white rounded-sm text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {creatingCoupon ? (
                      <><i className="fas fa-spinner fa-spin"></i>กำลังสร้าง...</>
                    ) : (
                      <><i className="fas fa-plus"></i>สร้างโค้ดทดสอบ</>
                    )}
                  </button>
                </div>

                <div className="p-4">
                  {loadingCoupons ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-4 border-orange-100 border-t-[#ee4d2d] rounded-full animate-spin"></div>
                    </div>
                  ) : userCoupons.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-tag text-gray-400 text-2xl"></i>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">ยังไม่มีโค้ดส่วนลด</h3>
                      <p className="text-sm text-gray-500">โค้ดส่วนลดที่คุณได้รับจะแสดงที่นี่</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userCoupons.map((coupon) => {
                        const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                        const isUsed = coupon.isUsed;
                        const isValid = !isUsed && !isExpired;
                        const isCopied = copiedCode === coupon.code;

                        return (
                          <div
                            key={coupon.id}
                            className={`p-4 rounded-sm border ${isValid
                                ? 'bg-[#fef0ed] border-[#ee4d2d]/30'
                                : 'bg-gray-50 border-gray-200 opacity-60'
                              }`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className={`font-mono text-lg font-bold ${isValid ? 'text-[#ee4d2d]' : 'text-gray-400'}`}>
                                    {coupon.code}
                                  </span>
                                  {isValid && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs font-medium rounded">ใช้ได้</span>
                                  )}
                                  {isUsed && (
                                    <span className="px-2 py-0.5 bg-gray-200 text-gray-500 text-xs font-medium rounded">ใช้แล้ว</span>
                                  )}
                                  {isExpired && (
                                    <span className="px-2 py-0.5 bg-red-100 text-red-500 text-xs font-medium rounded">หมดอายุ</span>
                                  )}
                                </div>
                                <p className={`text-sm font-medium ${isValid ? 'text-gray-900' : 'text-gray-500'}`}>
                                  ส่วนลด ฿{coupon.discountAmount.toLocaleString()}
                                </p>
                                {coupon.expiresAt && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    <i className="fas fa-calendar-alt mr-1"></i>
                                    หมดอายุ {new Date(coupon.expiresAt).toLocaleDateString('th-TH')}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => handleCopyCode(coupon.code)}
                                disabled={!isValid}
                                className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${isValid
                                    ? isCopied
                                      ? 'bg-green-500 text-white'
                                      : 'bg-[#ee4d2d] hover:bg-[#d73211] text-white'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  }`}
                              >
                                {isCopied ? (
                                  <><i className="fas fa-check mr-1"></i>คัดลอกแล้ว</>
                                ) : (
                                  <><i className="fas fa-copy mr-1"></i>คัดลอก</>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;