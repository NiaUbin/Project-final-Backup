import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeUserStatus = async (userId, currentStatus) => {
    try {
      await axios.post('/api/change-status', {
        id: userId,
        enabled: !currentStatus
      });
      toast.success('เปลี่ยนสถานะผู้ใช้สำเร็จ');
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    if (!window.confirm(`คุณต้องการเปลี่ยนสิทธิ์เป็น ${newRole} หรือไม่?`)) return;

    try {
      await axios.post('/api/change-role', {
        id: userId,
        role: newRole
      });
      toast.success('เปลี่ยนสิทธิ์ผู้ใช้สำเร็จ');
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`⚠️ คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ "${userName}"?\nข้อมูลทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้!`)) return;

    try {
      await axios.delete('/api/delete-user', { data: { id: userId } });
      toast.success('ลบผู้ใช้สำเร็จ');
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'seller': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  // Helper function for date formatting (Thai Buddhist Year)
  const formatThaiDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function for relative time (Time Ago)
  const timeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' ปีที่แล้ว';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' เดือนที่แล้ว';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' วันที่แล้ว';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' ชั่วโมงที่แล้ว';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' นาทีที่แล้ว';
    return Math.floor(seconds) + ' วินาทีที่แล้ว';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <i className="fas fa-users text-indigo-500"></i>
          จัดการผู้ใช้
          <span className="text-sm font-normal text-slate-500 ml-2">({users.length} คน)</span>
        </h2>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="ค้นหาชื่อ หรืออีเมล..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <i className="fas fa-search absolute left-3 top-2.5 text-slate-400 text-sm"></i>
          </div>
          <button
            onClick={loadUsers}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-all text-sm font-semibold shadow-sm"
          >
            <i className="fas fa-sync mr-2"></i>
            รีเฟรช
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider font-semibold">
              <th className="p-4 rounded-tl-lg">ลำดับ</th>
              <th className="p-4">ผู้ใช้งาน</th>
              <th className="p-4">อีเมล</th>
              <th className="p-4 text-center">สิทธิ์</th>
              <th className="p-4 text-center">สถานะ</th>
              <th className="p-4">วันที่สมัคร</th>
              <th className="p-4 text-center rounded-tr-lg">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-10 text-center text-slate-500">
                  <i className="fas fa-circle-notch fa-spin mr-2"></i> กำลังโหลดข้อมูล...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-10 text-center text-slate-500">
                  ไม่พบข้อมูลผู้ใช้
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, index) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4 text-slate-500 text-sm font-medium">{index + 1}</td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-700">{user.username}</div>
                  </td>
                  <td className="p-4 text-slate-600 text-sm">{user.email || '-'}</td>
                  <td className="p-4 text-center">
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeUserRole(user.id, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border appearance-none cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 outline-none transition-all ${getRoleBadgeColor(user.role)}`}
                    >
                      <option value="user">User</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleChangeUserStatus(user.id, user.enabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        user.enabled ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`${
                          user.enabled ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </button>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {user.enabled ? 'ใช้งานได้' : 'ถูกระงับ'}
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 text-sm">
                    {formatThaiDate(user.createdAt)}
                    <div className="text-xs text-slate-400">{timeAgo(user.createdAt)}</div>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="ลบผู้ใช้"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
