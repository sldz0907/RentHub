import { useState } from 'react';
import { Home, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setLoading(true);
      const success = await register(
        formData.username, 
        formData.password, 
        formData.email, 
        formData.phone
      );
      setLoading(false);
      
      if (success) {
        // Redirect to login page upon successful registration
        navigate('/login');
      } else {
        setError('Đăng ký thất bại. Tên đăng nhập hoặc Email đã được sử dụng.');
      }
    } catch (err) {
      setLoading(false);
      setError('Lỗi kết nối tới server. Vui lòng kiểm tra và thử lại.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Home className="w-10 h-10 text-blue-700" />
            <span className="text-2xl font-bold text-blue-700">RentHub</span>
          </div>
          <p className="text-gray-600 text-sm">Tạo tài khoản thành viên RentHub mới</p>
        </div>

        {/* Register Form */}
        <div className="bg-white border border-gray-200 rounded p-6 shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-5 text-center">Đăng ký thành viên</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="VD: Nguyễn Văn A"
                className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email liên hệ *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="VD: a@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="VD: 0912345678"
                className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Ít nhất 6 ký tự"
                className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu *</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Nhập lại mật khẩu"
                className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm"
                required
              />
            </div>

            <div className="flex items-start gap-2 mb-5">
              <input
                type="checkbox"
                required
                className="w-4 h-4 mt-0.5"
              />
              <label className="text-sm text-gray-600">
                Tôi đồng ý với{' '}
                <button type="button" className="text-blue-700 hover:underline">Điều khoản sử dụng</button>
                {' '}và{' '}
                <button type="button" className="text-blue-700 hover:underline">Chính sách bảo mật</button>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 bg-blue-700 text-white py-2.5 rounded font-medium hover:bg-blue-800 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
            </button>
          </form>

          <hr className="my-5" />

          <p className="text-sm text-gray-600 text-center">
            Đã có tài khoản?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-700 font-medium hover:underline"
            >
              Đăng nhập
            </button>
          </p>

          <div className="mt-3 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-500 hover:underline"
            >
              ← Về trang chủ
            </button>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-4 bg-white border border-gray-200 rounded p-3">
          <p className="text-xs font-medium text-gray-700 mb-2">Lợi ích khi đăng ký:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✓ Kết nối dữ liệu SQL Server trực tiếp</li>
            <li>✓ Đăng tin cho thuê bất động sản chính chủ</li>
            <li>✓ Tìm phòng trọ & Căn hộ cho thuê nhanh chóng</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
