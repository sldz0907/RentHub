import { useState, useEffect } from 'react';
import { Home, Users, FileText, DollarSign, Bell, Menu, X, TrendingUp, AlertTriangle, Ban, CheckCircle, LogOut, Shield } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';





export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [users, setUsers] = useState<any[]>([]);
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [propertyStats, setPropertyStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('renthub_token');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const [revRes, statRes, repRes, usersRes, propRes] = await Promise.all([
          fetch('http://localhost:5000/api/admin/stats/revenue', { headers }),
          fetch('http://localhost:5000/api/admin/stats/properties', { headers }),
          fetch('http://localhost:5000/api/admin/reports', { headers }),
          fetch('http://localhost:5000/api/admin/users', { headers }),
          fetch('http://localhost:5000/api/admin/properties/list', { headers })
        ]);

        const revData = await revRes.json();
        const statData = await statRes.json();
        const repData = await repRes.json();
        const usersData = await usersRes.json();
        const propData = await propRes.json();

        if (revData.success) {
          setRevenue(revData.data.revenue);
          setChartData(revData.data.chartData || []);
          setRecentTransactions(revData.data.recentTransactions || []);
        }
        if (statData.success) setPropertyStats(statData.data);
        if (repData.success) setReports(repData.data);
        if (usersData.success) setUsers(usersData.data);
        if (propData.success) setAllProperties(propData.data);

        setLoading(false);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu admin:", err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const processReport = async (reportId: number, action: 'ban' | 'dismiss') => {
    try {
      let reason = '';
      if (action === 'ban') {
        reason = window.prompt('Vui lòng nhập lý do khóa bài đăng do vi phạm:') || '';
        if (!reason.trim()) {
          toast.error('Bắt buộc phải nhập lý do khóa bài');
          return;
        }
      }

      const res = await fetch(`http://localhost:5000/api/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('renthub_token')}`
        },
        body: JSON.stringify({ action, reason })
      });
      const data = await res.json();
      if (data.success) {
        setReports(reports.filter((report) => report.id !== reportId));
      } else {
        toast.error("Có lỗi xảy ra: " + data.message);
      }
    } catch (err) {
      toast.error("Lỗi kết nối");
    }
  };

  const handleBan = (reportId: number) => {
    if (confirm("Bạn có chắc chắn muốn khóa tin đăng này?")) {
      processReport(reportId, 'ban');
    }
  };

  const handleDismiss = (reportId: number) => {
    processReport(reportId, 'dismiss');
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('renthub_token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setUsers(users.map(u => u._id === userId ? { ...u, is_active: data.data.is_active } : u));
      } else {
        toast.error(data.message || 'Lỗi cập nhật trạng thái');
      }
    } catch (err) {
      toast.error('Lỗi kết nối');
    }
  };

  const handleTogglePropertyStatus = async (propertyId: string) => {
    try {
      const property = allProperties.find(p => p._id === propertyId);
      const isBanning = property && property.status !== 'BANNED';
      
      let reason = '';
      if (isBanning) {
        reason = window.prompt('Vui lòng nhập lý do khóa bài đăng này:') || '';
        if (!reason.trim()) {
          toast.error('Bắt buộc phải nhập lý do khóa bài');
          return;
        }
      }

      const res = await fetch(`http://localhost:5000/api/admin/properties/${propertyId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('renthub_token')}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setAllProperties(allProperties.map(p => p._id === propertyId ? { ...p, status: data.data.status } : p));
      } else {
        toast.error(data.message || 'Lỗi cập nhật trạng thái tin đăng');
      }
    } catch (err) {
      toast.error('Lỗi kết nối');
    }
  };

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'users', label: 'Quản lý người dùng', icon: <Users className="w-5 h-5" /> },
    { id: 'moderation', label: 'Kiểm duyệt', icon: <AlertTriangle className="w-5 h-5" />, badge: reports.length },
    { id: 'properties', label: 'Quản lý tin đăng', icon: <FileText className="w-5 h-5" /> },
  ];

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center gap-2">
        <Home className="w-6 h-6 text-blue-700" />
        <span className="font-bold text-blue-700">Admin Panel</span>
      </div>

      <nav className="flex-1 p-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded mb-1 text-sm ${activeTab === item.id
              ? 'bg-blue-700 text-white'
              : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge ? (
              <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-2">
          <div className="flex items-center gap-1 mb-1">
            <Shield className="w-3.5 h-3.5 text-blue-700" />
            <span className="text-xs font-medium text-blue-700">ADMIN</span>
          </div>
          <p className="text-sm font-medium text-gray-800 truncate">{user?.email}</p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 border border-red-300 rounded text-sm text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 bg-white border-r border-gray-200 min-h-screen">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-white">
            <div className="flex justify-end p-3 border-b border-gray-200">
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-xs text-gray-500">Quản lý hệ thống</p>
          </div>
        </header>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-20 text-gray-500">Đang tải dữ liệu Admin...</div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div>
                  {/* Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white border border-gray-200 rounded p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-700" />
                        </div>
                        <span className="text-xs text-green-600">Active</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">Quản trị viên</p>
                      <p className="text-2xl font-bold text-gray-800">1</p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center">
                          <FileText className="w-5 h-5 text-green-700" />
                        </div>
                        <span className="text-xs text-green-600">Tổng hệ thống</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">Tin đăng (Tất cả)</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {propertyStats.reduce((sum, item) => sum + item.count, 0)}
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-purple-100 rounded flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-purple-700" />
                        </div>
                        <span className="text-xs text-green-600">Tháng này</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">Doanh thu tháng</p>
                      <p className="text-2xl font-bold text-gray-800">{Number(revenue).toLocaleString('vi-VN')} đ</p>
                    </div>
                  </div>

                  {/* Chart and Transactions */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white border border-gray-200 rounded p-4">
                      <h3 className="font-bold text-gray-800 mb-4">Biểu đồ doanh thu thực tế</h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                          <YAxis 
                            stroke="#6b7280" 
                            fontSize={12} 
                            tickFormatter={(value) => `${value / 1000}k`} 
                            domain={[0, (dataMax: number) => Math.max(dataMax, 400000)]}
                          />
                          <Tooltip
                            formatter={(value: number) => [`${value.toLocaleString('vi-VN')} VNĐ`, 'Doanh thu']}
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '4px',
                              fontSize: '12px',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#1d4ed8"
                            strokeWidth={2}
                            dot={{ fill: '#1d4ed8', r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Recent Transactions Table */}
                    <div className="bg-white border border-gray-200 rounded p-4">
                      <h3 className="font-bold text-gray-800 mb-4">Giao dịch gần đây</h3>
                      <div className="overflow-y-auto max-h-[280px] pr-2">
                        {recentTransactions.length > 0 ? (
                          <div className="space-y-3">
                            {recentTransactions.map((tx) => (
                              <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
                                    {tx.user.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-800 truncate max-w-[100px]" title={tx.user}>{tx.user}</p>
                                    <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString('vi-VN')}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-green-600">+{tx.amount.toLocaleString('vi-VN')}đ</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center mt-10">Chưa có giao dịch nào.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Moderation Tab */}
              {activeTab === 'moderation' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-gray-800">Báo cáo chờ xử lý</h2>
                    <span className="px-3 py-1 bg-red-100 text-red-700 border border-red-300 rounded text-sm font-medium">
                      {reports.length} báo cáo
                    </span>
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block bg-white border border-gray-200 rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-gray-600 font-medium">Người báo cáo</th>
                          <th className="px-4 py-3 text-left text-gray-600 font-medium">Lý do</th>
                          <th className="px-4 py-3 text-left text-gray-600 font-medium">Tin đăng</th>
                          <th className="px-4 py-3 text-left text-gray-600 font-medium">Ngày</th>
                          <th className="px-4 py-3 text-left text-gray-600 font-medium">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map((report) => (
                          <tr key={report.id} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">{report.reporter}</td>
                            <td className="px-4 py-3 text-gray-600">{report.reason}</td>
                            <td className="px-4 py-3 text-gray-700">{report.property} (ID: {report.propertyId})</td>
                            <td className="px-4 py-3 text-gray-500">{new Date(report.created_at).toLocaleDateString('vi-VN')}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleBan(report.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  Khóa tin
                                </button>
                                <button
                                  onClick={() => handleDismiss(report.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Bỏ qua
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {reports.map((report) => (
                  <div key={report.id} className="bg-white border border-gray-200 rounded p-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-800 text-sm">{report.reporter}</span>
                      <span className="text-xs text-gray-400">{report.date}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{report.reason}</p>
                    <p className="text-sm text-gray-700 font-medium mb-3">{report.property}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBan(report.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded text-sm font-medium"
                      >
                        <Ban className="w-4 h-4" />
                        Khóa tin
                      </button>
                      <button
                        onClick={() => handleDismiss(report.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Bỏ qua
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {reports.length === 0 && (
                <div className="bg-white border border-gray-200 rounded p-10 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-800 mb-1">Tất cả ổn!</h3>
                  <p className="text-sm text-gray-500">Không có báo cáo nào chờ xử lý</p>
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-gray-800">Danh sách người dùng</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 border border-blue-300 rounded text-sm font-medium">
                  {users.length} tài khoản
                </span>
              </div>

              <div className="bg-white border border-gray-200 rounded overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-600 font-medium">Người dùng</th>
                        <th className="px-4 py-3 text-left text-gray-600 font-medium">Liên hệ</th>
                        <th className="px-4 py-3 text-left text-gray-600 font-medium">Vai trò</th>
                        <th className="px-4 py-3 text-left text-gray-600 font-medium">Trạng thái</th>
                        <th className="px-4 py-3 text-left text-gray-600 font-medium">Số bài đăng</th>
                        <th className="px-4 py-3 text-left text-gray-600 font-medium">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {u.username.charAt(0)}
                              </div>
                              <span className="font-medium text-gray-800">{u.username}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-gray-800">{u.email}</p>
                            <p className="text-xs text-gray-500">{u.phone}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                              {u.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-max ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {u.is_active ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                              {u.is_active ? 'Hoạt động' : 'Bị khóa'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700 font-medium">
                            {u.post_count || 0} bài
                          </td>
                          <td className="px-4 py-3">
                            {u.role !== 'ADMIN' || user?.email !== u.email ? (
                              <button
                                onClick={() => handleToggleUserStatus(u._id)}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer ${u.is_active ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'}`}
                              >
                                {u.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Không thể tự khóa</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            Chưa có dữ liệu người dùng
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}



          {/* Properties Tab */}
          {activeTab === 'properties' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-gray-800">Quản lý tin đăng</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 border border-blue-300 rounded text-sm font-medium">
                  {allProperties.length} bài đăng
                </span>
              </div>

              <div className="bg-white border border-gray-200 rounded overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-600 font-medium">Bất động sản</th>
                        <th className="px-4 py-3 text-left text-gray-600 font-medium">Chi tiết</th>
                        <th className="px-4 py-3 text-left text-gray-600 font-medium">Người đăng</th>
                        <th className="px-4 py-3 text-left text-gray-600 font-medium">Trạng thái</th>
                        <th className="px-4 py-3 text-left text-gray-600 font-medium">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allProperties.map((p) => (
                        <tr key={p._id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                {p.images && p.images.length > 0 ? (
                                  <img src={p.images[0]} alt="Property" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Home className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800 max-w-[200px] truncate" title={p.title}>{p.title}</p>
                                <p className="text-xs text-gray-500">{p.district}, {p.city}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-blue-600">{p.price.toLocaleString('vi-VN')} VNĐ</p>
                            <p className="text-xs text-gray-500">{p.area} m² - {p.property_type}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-gray-800 font-medium">{p.owner_id ? p.owner_id.username : 'Ẩn danh'}</p>
                            <p className="text-xs text-gray-500">{p.owner_id ? p.owner_id.email : ''}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-max ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : p.status === 'BANNED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {p.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                              {p.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleTogglePropertyStatus(p._id)}
                              className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer ${p.status === 'ACTIVE' ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'}`}
                            >
                              {p.status === 'ACTIVE' ? 'Khóa bài' : 'Mở khóa'}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {allProperties.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            Chưa có tin đăng nào
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
