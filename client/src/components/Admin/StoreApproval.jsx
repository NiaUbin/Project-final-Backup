import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const StoreApproval = () => {
  const [viewMode, setViewMode] = useState('pending'); // 'pending' | 'all' | 'approved' | 'suspended'
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    loadStores();
  }, [viewMode]);

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
    const styles = {
        'approved': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'pending': 'bg-amber-100 text-amber-700 border-amber-200',
        'rejected': 'bg-rose-100 text-rose-700 border-rose-200',
        'suspended': 'bg-slate-100 text-slate-600 border-slate-200'
    };
    const labels = {
        'approved': 'เปิดใช้งาน',
        'pending': 'รอตรวจสอบ',
        'rejected': 'ปฏิเสธ',
        'suspended': 'ถูกระงับ'
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {labels[status] || status}
        </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
           <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                <i className="fas fa-store-alt"></i>
            </span>
            จัดการร้านค้า
           </h2>
           <p className="text-slate-500 text-sm mt-1 ml-12">ตรวจสอบและอนุมัติร้านค้าในระบบ</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
           {/* Custom Tab component */}
           {[
               { id: 'pending', label: 'รออนุมัติ', count: stores.length },
               { id: 'approved', label: 'เปิดใช้งาน' },
               { id: 'suspended', label: 'ถูกระงับ' },
               { id: 'all', label: 'ทั้งหมด' }
           ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                    viewMode === tab.id
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                  {tab.label}
                  {tab.id === 'pending' && viewMode === 'pending' && stores.length > 0 && (
                      <span className="ml-2 bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded text-[10px]">{stores.length}</span>
                  )}
              </button>
           ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-4"></div>
          <span className="text-slate-500 font-medium">กำลังโหลดข้อมูลร้านค้า...</span>
        </div>
      ) : stores.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
            <i className={`fas ${viewMode === 'pending' ? 'fa-clipboard-check' : 'fa-store-slash'} text-3xl text-slate-300`}></i>
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">ไม่พบข้อมูลร้านค้า</h3>
          <p className="text-slate-500 mb-4 text-sm max-w-xs mx-auto">
            {viewMode === 'pending' 
              ? 'ไม่มีคำขอเปิดร้านค้าที่รอการตรวจสอบในขณะนี้' 
              : `ยังไม่มีร้านค้าในสถานะ "${viewMode}"`}
          </p>
          <button onClick={loadStores} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-medium rounded-lg transition-colors border border-slate-200">
            <i className="fas fa-sync-alt mr-2"></i> รีเฟรชข้อมูล
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">ร้านค้า</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">สถานะ</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">เจ้าของ</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">สินค้า</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">วันที่สมัคร</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stores.map((store) => (
                <tr key={store.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex-shrink-0 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center">
                        {store.logo ? (
                          <img className="w-full h-full object-cover" src={store.logo} alt="" />
                        ) : (
                          <i className="fas fa-store text-slate-300 text-lg"></i>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-800 truncate max-w-[150px]">{store.name}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">{store.description || 'ไม่มีคำอธิบาย'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(store.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">{store.owner?.name || 'Unknown'}</span>
                      <span className="text-xs text-slate-400">{store.owner?.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {store._count?.products || 0} รายการ
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(store.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      {store.status === 'approved' && (
                        <a 
                          href={`/store/${store.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all bg-white"
                          title="ไปที่หน้าร้านค้า"
                        >
                          <i className="fas fa-external-link-alt text-xs"></i>
                        </a>
                      )}
                      <button 
                        onClick={() => openDetails(store)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-all bg-white"
                        title="ดูรายละเอียด"
                      >
                        <i className="fas fa-cog text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modern Detail Modal */}
      {showModal && selectedStore && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
            {/* Modal Header */}
            <div className="relative bg-slate-50 border-b border-slate-100 p-6 flex flex-col items-center">
                 <button 
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200/50 transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>

                <div className="w-20 h-20 rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden mb-3 relative group">
                    {isEditing ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 cursor-pointer text-slate-400 hover:text-orange-500">
                             <i className="fas fa-camera mb-1"></i>
                             <span className="text-[10px]">Change</span>
                             <input 
                                type="text"
                                name="logo"
                                value={editFormData.logo}
                                onChange={handleChange}
                                placeholder="Logo URL"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                    ) : (
                         selectedStore.logo ? <img src={selectedStore.logo} alt="" className="w-full h-full object-cover" /> : 
                         <div className="w-full h-full flex items-center justify-center text-slate-300 text-2xl"><i className="fas fa-store"></i></div>
                    )}
                </div>

                <div className="text-center w-full">
                     {isEditing ? (
                         <input
                            name="name"
                            value={editFormData.name}
                            onChange={handleChange}
                            className="text-center font-bold text-xl text-slate-800 bg-white border border-slate-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-orange-500 outline-none w-full max-w-[250px]"
                         />
                     ) : (
                        <h3 className="text-xl font-bold text-slate-800">{selectedStore.name}</h3>
                     )}
                     <div className="flex items-center justify-center gap-2 mt-2">
                         <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">ID: {selectedStore.id}</span>
                         {getStatusBadge(selectedStore.status)}
                     </div>
                </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 {/* Basic Info */}
                 <div className="space-y-4">
                     <div>
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">คำอธิบายร้านค้า</label>
                         {isEditing ? (
                             <textarea
                                name="description"
                                value={editFormData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full text-sm border-slate-200 rounded-lg focus:ring-orange-500"
                             />
                         ) : (
                             <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                                {selectedStore.description || 'ไม่มีคำอธิบาย'}
                             </p>
                         )}
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">ที่อยู่</label>
                             {isEditing ? (
                                 <textarea
                                    name="address"
                                    value={editFormData.address}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full text-sm border-slate-200 rounded-lg focus:ring-orange-500"
                                 />
                             ) : (
                                 <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 min-h-[80px]">
                                    <i className="fas fa-map-marker-alt text-slate-400 mr-2"></i>
                                    {selectedStore.address || '-'}
                                 </p>
                             )}
                         </div>

                         <div>
                             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">ข้อมูลเจ้าของ</label>
                             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">ชื่อ:</span>
                                    <span className="font-medium text-slate-800">{selectedStore.owner?.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">อีเมล:</span>
                                    <span className="font-medium text-slate-800">{selectedStore.owner?.email}</span>
                                </div>
                                <div className="pt-2 border-t border-slate-200 mt-2">
                                    <span className="text-xs text-slate-400 block mb-1">เลขบัตรประชาชน</span>
                                    {isEditing ? (
                                        <input
                                            name="idCard"
                                            value={editFormData.idCard}
                                            onChange={handleChange}
                                            className="w-full text-sm font-mono p-1 border rounded"
                                        />
                                    ) : (
                                        <div className="font-mono text-slate-700 font-medium tracking-wider bg-white px-2 py-1 rounded border border-slate-200 inline-block">
                                            {selectedStore.idCard || '-'}
                                        </div>
                                    )}
                                </div>
                             </div>
                         </div>
                     </div>
                 </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                 <div>
                    {!isEditing && (
                        <button 
                            onClick={() => handleDelete(selectedStore.id)}
                            className="text-rose-500 hover:text-rose-700 text-sm font-medium transition-colors"
                        >
                            <i className="fas fa-trash-alt mr-1"></i> ลบร้านค้า
                        </button>
                    )}
                 </div>

                 <div className="flex items-center gap-3">
                     {isEditing ? (
                         <>
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800">ยกเลิก</button>
                            <button onClick={handleUpdateStore} disabled={actionLoading} className="px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 shadow-sm transition-all">
                                {actionLoading ? 'บันทึก...' : 'บันทึกการแก้ไข'}
                            </button>
                         </>
                     ) : (
                         <>
                            {selectedStore.status === 'pending' && (
                                <>
                                    <button onClick={() => updateStoreStatus(selectedStore.id, 'rejected')} disabled={actionLoading} className="px-4 py-2 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 text-sm font-semibold">ปฏิเสธ</button>
                                    <button onClick={() => updateStoreStatus(selectedStore.id, 'approved')} disabled={actionLoading} className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-semibold shadow-md shadow-emerald-200">อนุมัติร้านค้า</button>
                                </>
                            )}
                            {selectedStore.status === 'approved' && (
                                <button onClick={() => updateStoreStatus(selectedStore.id, 'suspended')} disabled={actionLoading} className="px-4 py-2 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 text-sm font-semibold">
                                    <i className="fas fa-ban mr-1"></i> ระงับการใช้งาน
                                </button>
                            )}
                            {(selectedStore.status === 'suspended' || selectedStore.status === 'rejected') && (
                                <button onClick={() => updateStoreStatus(selectedStore.id, 'approved')} disabled={actionLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold">
                                    <i className="fas fa-undo mr-1"></i> คืนสถานะ
                                </button>
                            )}
                            
                            <button onClick={() => setIsEditing(true)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 shadow-sm ml-2">
                                <i className="fas fa-edit"></i>
                            </button>
                         </>
                     )}
                 </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreApproval;
