import { useState, useEffect } from 'react';
import { Home, List, Bell, Settings, Edit, Eye, EyeOff, Trash2, Menu, X, LogOut, PlusCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { EditPropertyModal } from './EditPropertyModal';
import { toast } from 'sonner';

type PropertyStatus = 'ACTIVE' | 'PENDING_PAYMENT' | 'BANNED' | 'RENTED';

interface Property {
  id: number;
  title: string;
  price: string | number;
  status: PropertyStatus;
  views: number;
  images?: string[];
}

const STATUS_LABELS: Record<PropertyStatus, string> = {
  'ACTIVE': 'Đang hiển thị',
  'RENTED': 'Đã cho thuê',
  'PENDING_PAYMENT': 'Chờ thanh toán',
  'BANNED': 'Bị khóa',
};

const STATUS_COLORS: Record<PropertyStatus, string> = {
  'ACTIVE': 'bg-green-100 text-green-800 border border-green-300',
  'RENTED': 'bg-blue-100 text-blue-800 border border-blue-300',
  'PENDING_PAYMENT': 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  'BANNED': 'bg-red-100 text-red-800 border border-red-300',
};

export function UserDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('listings');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [editingPropertyId, setEditingPropertyId] = useState<number | null>(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<number | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const fetchMyProperties = async () => {
    try {
      const token = localStorage.getItem('renthub_token');
      if (!token) {
        setLoading(false);
        return;
      }
      const response = await fetch('http://localhost:5000/api/properties/user/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setProperties(data.data);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách tin đăng:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('renthub_token');
      if (!token) return;
      const res = await fetch('http://localhost:5000/api/users/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
        setUnreadNotifications(data.data.filter((n: any) => !n.is_read).length);
      }
    } catch (err) {
      console.error('Lỗi khi lấy thông báo:', err);
    }
  };

  useEffect(() => {
    fetchMyProperties();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (activeTab === 'notifications' && unreadNotifications > 0) {
      const markAsRead = async () => {
        try {
          const token = localStorage.getItem('renthub_token');
          await fetch('http://localhost:5000/api/users/notifications/read', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          setUnreadNotifications(0);
          setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (err) {
          console.error(err);
        }
      };
      markAsRead();
    }
  }, [activeTab, unreadNotifications]);

  const toggleStatus = async (id: number) => {
    const prop = properties.find(p => p.id === id);
    if (!prop) return;
    
    if (prop.status === 'BANNED') {
      toast.error('Tin đăng này đã bị khóa bởi quản trị viên, không thể thay đổi trạng thái.');
      return;
    }
    
    // Toggle status: ACTIVE -> RENTED, RENTED -> ACTIVE, or others to ACTIVE
    const newStatus = prop.status === 'ACTIVE' ? 'RENTED' : 'ACTIVE';
    
    try {
      const token = localStorage.getItem('renthub_token');
      const response = await fetch(`http://localhost:5000/api/properties/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        setProperties(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      } else {
        toast.error(data.message || 'Lỗi khi cập nhật trạng thái.');
      }
    } catch (err) {
      console.error('Lỗi toggle status:', err);
      toast.error('Lỗi kết nối tới máy chủ.');
    }
  };

  const confirmDelete = async () => {
    if (!deletePassword) {
      setDeleteError('Vui lòng nhập mật khẩu xác nhận.');
      return;
    }
    
    try {
      setDeleteLoading(true);
      setDeleteError('');
      const token = localStorage.getItem('renthub_token');
      const response = await fetch(`http://localhost:5000/api/properties/${deletingPropertyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: deletePassword })
      });
      const data = await response.json();
      if (data.success) {
        setProperties(prev => prev.filter(p => p.id !== deletingPropertyId));
        setDeletingPropertyId(null);
        setDeletePassword('');
        toast.success('Xóa bài đăng thành công!');
      } else {
        setDeleteError(data.message || 'Mật khẩu xác minh không chính xác!');
      }
    } catch (err) {
      console.error('Lỗi khi xóa tin đăng:', err);
      setDeleteError('Lỗi kết nối tới máy chủ.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatPrice = (price: string | number) => {
    return typeof price === 'number' || !isNaN(Number(price))
      ? Number(price).toLocaleString('vi-VN') + ' VND/tháng'
      : price;
  };

  const navItems = [
    { id: 'listings', label: 'Tin đăng của tôi', icon: <List className="w-5 h-5" /> },
    { id: 'notifications', label: 'Thông báo', icon: <Bell className="w-5 h-5" />, badge: unreadNotifications },
  ];

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center gap-2">
        <Home className="w-6 h-6 text-blue-700" />
        <span className="font-bold text-blue-700">RentHub</span>
      </div>

      <nav className="flex-1 p-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded mb-1 text-sm ${
              activeTab === item.id
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
        <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-2">
          <p className="text-xs text-gray-500">Đăng nhập với</p>
          <p className="text-sm font-medium text-gray-800 truncate">{user?.email}</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="w-full py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 mb-2"
        >
          Về trang chủ
        </button>
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

      {/* Mobile Sidebar Overlay */}
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
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded">
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
        </header>

        <div className="p-4">
          {/* Listings Tab */}
          {activeTab === 'listings' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-gray-800">Tin đăng của tôi</h2>
                <button
                  onClick={() => navigate('/post-property')}
                  className="flex items-center gap-1 px-3 py-2 bg-blue-700 text-white rounded text-sm font-medium hover:bg-blue-800"
                >
                  <PlusCircle className="w-4 h-4" />
                  Thêm tin mới
                </button>
              </div>

              {/* Loading State */}
              {loading ? (
                <div className="text-center py-12 bg-white border border-gray-200 rounded">
                  <p className="text-gray-500 font-medium">Đang tải danh sách bài đăng...</p>
                </div>
              ) : properties.length === 0 ? (
                <div className="text-center py-12 bg-white border border-gray-200 rounded">
                  <p className="text-gray-500 font-medium">Bạn chưa có bài đăng nào.</p>
                  <button
                    onClick={() => navigate('/post-property')}
                    className="mt-3 inline-flex items-center gap-1 px-4 py-2 bg-blue-700 text-white rounded text-sm font-medium hover:bg-blue-800"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Đăng tin đầu tiên
                  </button>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block bg-white border border-gray-200 rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-gray-600 font-medium">Bất động sản</th>
                          <th className="px-4 py-3 text-left text-gray-600 font-medium">Giá thuê</th>
                          <th className="px-4 py-3 text-left text-gray-600 font-medium">Trạng thái</th>
                          <th className="px-4 py-3 text-left text-gray-600 font-medium">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {properties.map((property) => (
                          <tr key={property.id} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={property.images && property.images.length > 0 ? property.images[0] : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'}
                                  alt={property.title}
                                  className="w-14 h-14 object-cover rounded border border-gray-200"
                                />
                                <span className="font-medium text-gray-800">{property.title}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{formatPrice(property.price)}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[property.status] || ''}`}>
                                {STATUS_LABELS[property.status] || property.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => toggleStatus(property.id)}
                                  className="p-1.5 text-blue-700 hover:bg-blue-50 rounded"
                                  title={property.status === 'ACTIVE' ? 'Đánh dấu đã cho thuê' : 'Bật hiển thị'}
                                >
                                  {property.status === 'ACTIVE' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => setEditingPropertyId(property.id)}
                                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => { setDeletingPropertyId(property.id); setDeletePassword(''); setDeleteError(''); }}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                  title="Xóa tin đăng"
                                >
                                  <Trash2 className="w-4 h-4" />
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
                    {properties.map((property) => (
                      <div key={property.id} className="bg-white border border-gray-200 rounded p-4">
                        <div className="flex gap-3 mb-3">
                          <img
                            src={property.images && property.images.length > 0 ? property.images[0] : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'}
                            alt={property.title}
                            className="w-20 h-20 object-cover rounded border border-gray-200"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800 text-sm mb-1">{property.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{formatPrice(property.price)}</p>
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[property.status] || ''}`}>
                              {STATUS_LABELS[property.status] || property.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-end items-center pt-2 border-t border-gray-100">
                          <div className="flex gap-1">
                            <button
                              onClick={() => toggleStatus(property.id)}
                              className="p-1.5 text-blue-700 hover:bg-blue-50 rounded"
                              title={property.status === 'ACTIVE' ? 'Đánh dấu đã cho thuê' : 'Bật hiển thị'}
                            >
                              {property.status === 'ACTIVE' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setEditingPropertyId(property.id)}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setDeletingPropertyId(property.id); setDeletePassword(''); setDeleteError(''); }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Xóa tin đăng"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white border border-gray-200 rounded p-4">
              <h3 className="font-bold text-gray-800 mb-4">Thông báo</h3>
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Bạn chưa có thông báo nào.</p>
                ) : (
                  notifications.map(notification => (
                    <div key={notification._id} className={`p-3 border rounded text-sm ${
                      notification.type === 'ERROR' ? 'bg-red-50 border-red-200 text-red-800' :
                      notification.type === 'SUCCESS' ? 'bg-green-50 border-green-200 text-green-800' :
                      notification.type === 'WARNING' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                      'bg-blue-50 border-blue-200 text-blue-800'
                    }`}>
                      <p>{notification.message}</p>
                      <span className={`text-xs mt-1 block ${
                        notification.type === 'ERROR' ? 'text-red-600' :
                        notification.type === 'SUCCESS' ? 'text-green-600' :
                        notification.type === 'WARNING' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`}>
                        {new Date(notification.created_at).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}


        </div>
      </main>

      {/* Edit Property Modal */}
      {editingPropertyId !== null && (
        <EditPropertyModal
          propertyId={editingPropertyId}
          onClose={() => setEditingPropertyId(null)}
          onSuccess={fetchMyProperties}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingPropertyId !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => { setDeletingPropertyId(null); setShowDeletePassword(false); }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center border border-red-100 shadow-sm shadow-red-100 mb-3 animate-pulse">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Xác nhận xóa bài đăng</h3>
              <p className="text-xs text-gray-500 mt-1">
                Bài đăng này sẽ bị xóa vĩnh viễn và không thể khôi phục.
              </p>
            </div>

            <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100 text-left">
              Để xác minh bạn là chủ sở hữu, vui lòng nhập mật khẩu tài khoản đăng nhập: 
              <span className="block mt-1 font-semibold text-gray-800 truncate">{user?.email || user?.username}</span>
            </p>

            {deleteError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium flex items-start gap-1">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
            >
              <div className="mb-4 relative">
                <input
                  type={showDeletePassword ? "text" : "password"}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Mật khẩu của bạn"
                  className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none text-sm transition-all"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePassword(!showDeletePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setDeletingPropertyId(null); setShowDeletePassword(false); }}
                  disabled={deleteLoading}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-red-200"
                >
                  {deleteLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang xóa...</span>
                    </>
                  ) : (
                    <span>Xác nhận xóa</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
