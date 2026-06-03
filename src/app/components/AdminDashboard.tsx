import { useState, useEffect } from 'react';
import { Home, Users, FileText, DollarSign, Bell, Menu, X, TrendingUp, AlertTriangle, Ban, CheckCircle, LogOut, Shield } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

const REVENUE_DATA = [
  { month: 'T1', revenue: 120000 },
  { month: 'T2', revenue: 180000 },
  { month: 'T3', revenue: 220000 },
  { month: 'T4', revenue: 250000 },
  { month: 'T5', revenue: 310000 },
  { month: 'T6', revenue: 280000 },
];



export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [reports, setReports] = useState<any[]>([]);
  const [revenue, setRevenue] = useState(0);
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

        const [revRes, statRes, repRes] = await Promise.all([
          fetch('http://localhost:5000/api/admin/stats/revenue', { headers }),
          fetch('http://localhost:5000/api/admin/stats/properties', { headers }),
          fetch('http://localhost:5000/api/admin/reports', { headers })
        ]);

        const revData = await revRes.json();
        const statData = await statRes.json();
        const repData = await repRes.json();

        if (revData.success) setRevenue(revData.data.revenue);
        if (statData.success) setPropertyStats(statData.data);
        if (repData.success) setReports(repData.data);

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
      const res = await fetch(`http://localhost:5000/api/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('renthub_token')}`
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        setReports(reports.filter((report) => report.id !== reportId));
      } else {
        alert("Có lỗi xảy ra: " + data.message);
      }
    } catch (err) {
      alert("Lỗi kết nối");
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

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'users', label: 'Quản lý người dùng', icon: <Users className="w-5 h-5" /> },
    { id: 'moderation', label: 'Kiểm duyệt nội dung', icon: <AlertTriangle className="w-5 h-5" />, badge: reports.length },
    { id: 'revenue', label: 'Doanh thu', icon: <DollarSign className="w-5 h-5" /> },
    { id: 'notifications', label: 'Thông báo hệ thống', icon: <Bell className="w-5 h-5" /> },
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

                  {/* Chart */}
                  <div className="bg-white border border-gray-200 rounded p-4">
                    <h3 className="font-bold text-gray-800 mb-4">Biểu đồ doanh thu (phí đăng tin 10K VND)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={REVENUE_DATA}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip
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
            <div className="bg-white border border-gray-200 rounded p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-bold text-gray-800 mb-1">Quản lý người dùng</h3>
              <p className="text-sm text-gray-500">Quản lý tài khoản và phân quyền người dùng</p>
            </div>
          )}

          {/* Revenue Tab */}
          {activeTab === 'revenue' && (
            <div className="bg-white border border-gray-200 rounded p-4">
              <h3 className="font-bold text-gray-800 mb-4">Phân tích doanh thu</h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={REVENUE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
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
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white border border-gray-200 rounded p-8 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-bold text-gray-800 mb-1">Thông báo hệ thống</h3>
              <p className="text-sm text-gray-500">Xem và quản lý cảnh báo hệ thống</p>
            </div>
          )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
