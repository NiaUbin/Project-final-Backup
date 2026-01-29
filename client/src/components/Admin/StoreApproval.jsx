import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const StoreApproval = () => {
  const [viewMode, setViewMode] = useState('pending'); // 'pending' | 'all'
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  /* Add states for editing */
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    loadStores();
  }, [viewMode]);

  /* ... loadStores ... */ 
  const loadStores = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let endpoint = '/api/admin/stores';
      
      if (viewMode === 'pending') {
        endpoint = '/api/admin/stores/pending';
      } else if (viewMode === 'approved') {
        endpoint = '/api/admin/stores?status=approved';
      } else if (viewMode === 'suspended') {
        endpoint = '/api/admin/stores?status=suspended';
      }
        
      const { data } = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStores(data.stores);
    } catch (error) {
      console.error('Error loading stores:', error);
      toast.error('ไม่สามารถโหลดข้อมูลร้านค้าได้');
    } finally {
      setLoading(false);
    }
  };

  /* ... updateStoreStatus ... */
  const updateStoreStatus = async (storeId, newStatus) => {
    const confirmMessage = {
      approved: 'คุณต้องการอนุมัติร้านค้านี้ใช่หรือไม่?',
      rejected: 'คุณต้องการปฏิเสธ/ระงับร้านค้านี้ใช่หรือไม่?',
      suspended: 'คุณต้องการระงับการใช้งานร้านค้านี้ชั่วคราวใช่หรือไม่?'
    };

    if (!window.confirm(confirmMessage[newStatus] || `เปลี่ยนสถานะเป็น ${newStatus}?`)) return;
    
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.put(`/api/admin/store/${storeId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`อัปเดตสถานะเป็น ${newStatus} เรียบร้อยแล้ว`);
      loadStores();
      setShowModal(false);
    } catch (error) {
      console.error('Update status error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (storeId) => {
    if (!window.confirm('คุณต้องการลบร้านค้านี้และสินค้าทั้งหมดของร้านอย่างถาวรใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้!')) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/store/${storeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('ลบร้านค้าเรียบร้อยแล้ว');
      loadStores();
      setShowModal(false);
    } catch (error) {
      console.error('Delete store error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบร้านค้า');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStore = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/store/${selectedStore.id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('แก้ไขข้อมูลร้านค้าเรียบร้อยแล้ว');
      
      loadStores();
      setSelectedStore({ ...selectedStore, ...editFormData });
      setIsEditing(false);
    } catch (error) {
      console.error('Update store details error:', error);
      toast.error('เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
    } finally {
      setActionLoading(false);
    }
  };

  const openDetails = (store) => {
    setSelectedStore(store);
    setEditFormData({
      name: store.name || '',
      description: store.description || '',
      address: store.address || '',
      idCard: store.idCard || '',
      logo: store.logo || ''
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold border border-green-200">เปิดใช้งาน</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold border border-yellow-200">รอตรวจสอบ</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold border border-red-200">ปฏิเสธ</span>;
      case 'suspended':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold border border-gray-200">ถูกระงับ</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs border border-gray-200">{status}</span>;
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-5">
      {/* ... keeping header and table same ... */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 self-start sm:self-auto">
          <i className="fas fa-store-alt text-orange-500"></i>
          จัดการและอนุมัติร้านค้า
        </h2>
        
        <div className="flex bg-gray-100 p-1 rounded-lg self-start sm:self-auto w-full sm:w-auto">
          <button
            onClick={() => setViewMode('pending')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'pending' 
                ? 'bg-white text-orange-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            รออนุมัติ
            {viewMode === 'pending' && <span className="ml-2 bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full text-xs">{stores.length}</span>}
          </button>
          
          <button
            onClick={() => setViewMode('approved')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'approved' 
                ? 'bg-white text-green-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            เปิดใช้งานแล้ว
          </button>

          <button
            onClick={() => setViewMode('suspended')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'suspended' 
                ? 'bg-white text-red-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ถูกระงับ
          </button>

          <button
            onClick={() => setViewMode('all')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'all' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ทั้งหมด
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 text-gray-400">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-3"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      ) : stores.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className={`fas ${viewMode === 'pending' ? 'fa-clipboard-check' : 'fa-store-slash'} text-3xl text-gray-300`}></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">ไม่พบข้อมูลร้านค้า</h3>
          <p className="text-gray-500 mb-4">
            {viewMode === 'pending' 
              ? 'ไม่มีรายการคำขอเปิดร้านค้าที่รอการตรวจสอบ' 
              : 'ยังไม่มีร้านค้าในรายการนี้'}
          </p>
          <button onClick={loadStores} className="text-orange-500 hover:text-orange-700 font-medium text-sm">
            <i className="fas fa-sync-alt mr-1"></i> โหลดข้อมูลใหม่
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ร้านค้า</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">สถานะ</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">เจ้าของ</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">สินค้า</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">วันที่สมัคร</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">จัดการ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stores.map((store) => (
                  <tr key={store.id} className="hover:bg-orange-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-12 w-12 flex-shrink-0 relative">
                          {store.logo ? (
                            <img className="h-12 w-12 rounded-lg object-cover border border-gray-200 shadow-sm" src={store.logo} alt="" />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center text-orange-500 border border-orange-100">
                              <i className="fas fa-store text-lg"></i>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{store.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[180px]">{store.description || 'ไม่มีคำอธิบาย'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(store.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900 font-medium">{store.owner?.name || 'Unknown'}</span>
                        <span className="text-xs text-gray-500">{store.owner?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <i className="fas fa-box text-gray-400 mr-2"></i>
                        {store._count?.products || 0} รายการ
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(store.createdAt).toLocaleDateString('th-TH', {
                        day: 'numeric', month: 'short', year: '2-digit'
                      })}
                      <div className="text-xs text-gray-400">
                        {new Date(store.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {store.status === 'approved' && (
                          <a 
                            href={`/store/${store.id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-all"
                            title="ไปที่หน้าร้านค้า"
                          >
                            <i className="fas fa-external-link-alt"></i>
                          </a>
                        )}
                        <button 
                          onClick={() => openDetails(store)}
                          className="text-gray-400 hover:text-orange-600 p-2 rounded-full hover:bg-orange-50 transition-all"
                          title="ดูรายละเอียด / จัดการ"
                        >
                          <i className="fas fa-cog"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
            <span>แสดงทั้งหมด {stores.length} รายการ</span>
            <div className="flex gap-2">
              <button onClick={loadStores} className="hover:text-gray-700"><i className="fas fa-sync"></i> รีเฟรช</button>
            </div>
          </div>
        </div>
      )}

      {/* Improved Modal Details (With Edit Mode) */}
      {showModal && selectedStore && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="relative h-32 bg-gradient-to-r from-orange-400 to-red-500 flex-shrink-0">
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => setShowModal(false)}
                  className="bg-black/20 hover:bg-black/40 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="absolute -bottom-10 left-8 flex items-end">
                <div className="w-24 h-24 rounded-xl bg-white p-1 shadow-lg overflow-hidden relative group">
                  {isEditing ? (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-orange-300 relative">
                       {editFormData.logo ? (
                          <img src={editFormData.logo} alt="Logo" className="w-full h-full object-cover opacity-50" />
                       ) : (
                          <i className="fas fa-camera text-gray-400"></i>
                       )}
                       <div className="absolute inset-0 flex items-center justify-center">
                           <input 
                             type="text"
                             name="logo"
                             placeholder="URL รูปโลโก้"
                             value={editFormData.logo}
                             onChange={handleChange}
                             className="text-xs p-1 w-11/12 bg-white/80 border rounded"
                           />
                       </div>
                    </div>
                  ) : selectedStore.logo ? (
                    <img src={selectedStore.logo} alt="Store Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                      <i className="fas fa-store text-4xl"></i>
                    </div>
                  )}
                </div>
                <div className="mb-12 ml-4 text-white flex-1">
                  <h3 className="text-2xl font-bold shadow-black drop-shadow-md">
                     {isEditing ? (
                         <input 
                            type="text" 
                            name="name" 
                            value={editFormData.name} 
                            onChange={handleChange}
                            className="text-gray-900 text-lg px-2 py-1 rounded w-full max-w-xs"
                         />
                     ) : selectedStore.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 opacity-90 text-sm">
                    <span className="bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm">ID: {selectedStore.id}</span>
                    {getStatusBadge(selectedStore.status)}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto pt-14 pb-6 px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Left Column: Store Details */}
                <div className="space-y-6">
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                      <i className="fas fa-info-circle text-orange-500"></i> ข้อมูลร้านค้า
                    </h4>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">คำอธิบาย</label>
                        {isEditing ? (
                            <textarea 
                                name="description"
                                value={editFormData.description}
                                onChange={handleChange}
                                rows="3"
                                className="w-full p-2 text-sm border rounded-md focus:ring-orange-500 focus:border-orange-500"
                            />
                        ) : (
                            <p className="text-sm text-gray-800 leading-relaxed">{selectedStore.description || '-'}</p>
                        )}
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                        <span className="text-xs text-gray-500">วันที่สมัคร</span>
                        <span className="text-xs font-medium text-gray-700">
                          {new Date(selectedStore.createdAt).toLocaleString('th-TH')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                      <i className="fas fa-map-marker-alt text-red-500"></i> ที่อยู่
                    </h4>
                    {isEditing ? (
                        <textarea 
                            name="address"
                            value={editFormData.address}
                            onChange={handleChange}
                            rows="2"
                            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                        />
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-600 leading-relaxed shadow-sm">
                           {selectedStore.address}
                        </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Owner Verification */}
                <div className="space-y-6">
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                      <i className="fas fa-user-shield text-blue-500"></i> ยืนยันตัวตน
                    </h4>
                    <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <i className="fas fa-id-card"></i>
                        </div>
                        <div>
                          <p className="text-xs text-blue-500 font-semibold mb-0.5">เลขบัตรประชาชน</p>
                          {isEditing ? (
                              <input 
                                  type="text"
                                  name="idCard"
                                  value={editFormData.idCard}
                                  onChange={handleChange}
                                  className="text-sm font-mono p-1 border rounded w-full"
                              />
                          ) : (
                              <p className="text-lg font-mono font-bold text-gray-800 tracking-wider">
                                {selectedStore.idCard}
                              </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2 pt-3 border-t border-blue-200/50">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">เจ้าของร้าน:</span>
                          <span className="font-medium text-gray-800">{selectedStore.owner?.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">อีเมล:</span>
                          <span className="font-medium text-gray-800">{selectedStore.owner?.email}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">เบอร์โทร:</span>
                          <span className="font-medium text-gray-800">{selectedStore.owner?.phone || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0 items-center">
              
              {!isEditing && (
                 <button
                    onClick={() => handleDelete(selectedStore.id)}
                    disabled={actionLoading}
                    className="mr-auto px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
                    title="ลบร้านค้าถาวร"
                  >
                    <i className="fas fa-trash-alt"></i> <span className="hidden sm:inline ml-1">ลบร้านค้า</span>
                  </button>
              )}

              {isEditing ? (
                  <>
                     <button 
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                     >
                        ยกเลิก
                     </button>
                     <button 
                        onClick={handleUpdateStore}
                        disabled={actionLoading}
                        className="px-6 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium shadow-sm"
                     >
                        {actionLoading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-save mr-2"></i>}
                        บันทึกการแก้ไข
                     </button>
                  </>
              ) : (
                  <>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2.5 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
                    >
                        <i className="fas fa-edit mr-2"></i> แก้ไขข้อมูล
                    </button>

                    {selectedStore.status === 'pending' && (
                        <>
                        <button
                            onClick={() => updateStoreStatus(selectedStore.id, 'rejected')}
                            disabled={actionLoading}
                            className="flex-1 sm:flex-none px-6 py-2.5 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors shadow-sm disabled:opacity-50"
                        >
                            <i className="fas fa-ban mr-2"></i> ปฏิเสธ
                        </button>
                        <button
                            onClick={() => updateStoreStatus(selectedStore.id, 'approved')}
                            disabled={actionLoading}
                            className="flex-1 sm:flex-none px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors shadow-md shadow-green-200 disabled:opacity-50"
                        >
                            อนุมัติร้านค้า
                        </button>
                        </>
                    )}
                    {selectedStore.status === 'approved' && (
                        <button
                        onClick={() => updateStoreStatus(selectedStore.id, 'suspended')}
                        disabled={actionLoading}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-yellow-50 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-100 font-medium transition-colors shadow-sm disabled:opacity-50"
                        >
                        <i className="fas fa-pause-circle mr-2"></i> ระงับการใช้
                        </button>
                    )}
                    {(selectedStore.status === 'suspended' || selectedStore.status === 'rejected') && (
                        <button
                        onClick={() => updateStoreStatus(selectedStore.id, 'approved')}
                        disabled={actionLoading}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-md disabled:opacity-50"
                        >
                        <i className="fas fa-undo-alt mr-2"></i> คืนสถานะ
                        </button>
                    )}
                     <button 
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2.5 text-gray-500 hover:text-gray-700 font-medium ml-2"
                    >
                        ปิด
                    </button>
                  </>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreApproval;
