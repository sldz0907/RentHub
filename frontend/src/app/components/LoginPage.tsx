import { useState } from 'react';
import { Home, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setLoading(true);
      const loggedInUser = await login(username, password);
      setLoading(false);

      if (loggedInUser) {
        if (loggedInUser.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        setError('Tài khoản hoặc mật khẩu không đúng');
      }
    } catch (err) {
      setLoading(false);
      setError('Kết nối tới server thất bại. Vui lòng thử lại.');
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
          <p className="text-gray-600 text-sm">Đăng nhập vào hệ thống liên kết RentHub</p>
        </div>

        {/* Login Form */}
        <div className="bg-white border border-gray-200 rounded p-6 shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-5 text-center">Đăng nhập</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email đăng nhập *</label>
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập email của bạn"
                className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm"
                required
              />
            </div>

            <div className="flex items-center justify-between mb-5">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" className="w-4 h-4" />
                Ghi nhớ đăng nhập
              </label>
              <button type="button" className="text-sm text-blue-700 hover:underline">
                Quên mật khẩu?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 bg-blue-700 text-white py-2.5 rounded font-medium hover:bg-blue-800 ${loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>

          <hr className="my-5" />

          <p className="text-sm text-gray-600 text-center">
            Chưa có tài khoản?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-blue-700 font-medium hover:underline"
            >
              Đăng ký ngay
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

        {/* Demo hints from actual database */}
      </div>
    </div>
  );
}
