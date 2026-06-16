import { Search, MapPin, Home, LogIn, UserPlus, PlusCircle, LogOut, LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { PropertyDetailModal } from './PropertyDetailModal';

export function LandingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [location, setLocation] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax] = useState('');
  const [propertyType, setPropertyType] = useState('all');
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 8;

  const fetchProperties = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (location.trim()) {
      params.append('city', location.trim());
    }
    if (propertyType && propertyType !== 'all') {
      params.append('property_type', propertyType);
    }
    if (priceMin) {
      params.append('minPrice', priceMin);
    }
    if (priceMax) {
      params.append('maxPrice', priceMax);
    }

    fetch(`${import.meta.env.VITE_API_URL || "https://rent-hub-xnoh.onrender.com/api"}/properties?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProperties(data.data);
          setCurrentPage(0);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi khi tải danh sách bất động sản:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProperties();
  }, [propertyType]);

  const filtered = properties;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const displayProperties = filtered.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = { apartment: 'Căn hộ', house: 'Nhà nguyên căn', room: 'Phòng trọ', condo: 'Chung cư' };
    return map[type] || type;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Home className="w-6 h-6" />
            <span className="text-lg font-bold">RentHub</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white text-blue-700 rounded text-sm font-medium"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/post-property')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-yellow-400 text-blue-900 rounded text-sm font-medium"
                >
                  <PlusCircle className="w-4 h-4" />
                  Đăng tin
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 px-3 py-1.5 text-white hover:underline text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white text-blue-700 rounded text-sm font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  Đăng nhập
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-yellow-400 text-blue-900 rounded text-sm font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  Đăng ký
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-blue-700 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-2">Tìm căn hộ, phòng trọ, nhà phù hợp</h1>
          <p className="text-blue-100 mb-8">Hàng nghìn giao dịch mỗi ngày trên nền tảng</p>

          {/* Search Box */}
          <div className="bg-white rounded p-4 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1 text-left">Địa điểm</label>
                <div className="flex items-center border border-gray-300 rounded px-2 py-2">
                  <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Phường/Thành phố/Quận"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') fetchProperties(); }}
                    className="flex-1 outline-none text-gray-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1 text-left">Giá tối thiểu</label>
                <input
                  type="number"
                  placeholder="VD: 3000000"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') fetchProperties(); }}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1 text-left">Loại bất động sản</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm outline-none"
                >
                  <option value="all">Tất cả loại</option>
                  <option value="apartment">Căn hộ</option>
                  <option value="house">Nhà nguyên căn</option>
                  <option value="room">Phòng trọ</option>
                  <option value="condo">Chung cư</option>
                </select>
              </div>

              <div className="flex items-end">
                <button 
                  onClick={fetchProperties}
                  className="w-full flex items-center justify-center gap-2 bg-blue-700 text-white px-4 py-2 rounded font-medium hover:bg-blue-800 transition"
                >
                  <Search className="w-4 h-4" />
                  Tìm kiếm
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-gray-800 mb-6 border-b-2 border-blue-700 pb-2 inline-block">
          Tin đăng nổi bật
        </h2>
        
        {loading ? (
          <div className="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-500">Không tìm thấy bất động sản nào phù hợp.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {displayProperties.map((listing) => (
                <div key={listing.id} className="border border-gray-200 rounded overflow-hidden bg-white flex flex-col">
                  <div className="relative h-44">
                    <img
                      src={listing.images && listing.images.length > 0 ? listing.images[0] : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 bg-blue-700 text-white text-xs px-2 py-0.5 rounded">
                      {getTypeLabel(listing.property_type)}
                    </span>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1 text-sm line-clamp-2">{listing.title}</h3>
                    <p className="text-blue-700 font-bold mb-1">{Number(listing.price).toLocaleString('vi-VN')} VND/tháng</p>
                    <p className="text-xs text-gray-500 mb-1">{listing.area} m²</p>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-1">{listing.address}, {listing.district}, {listing.city}</p>
                    
                    <div className="mt-auto">
                      <button
                        onClick={() => setSelectedPropertyId(listing.id)}
                        className="w-full border border-blue-700 text-blue-700 py-1.5 rounded text-sm hover:bg-blue-50 text-center font-medium block transition duration-200"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-10 gap-6">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="p-2 rounded-full border border-gray-300 text-gray-600 disabled:opacity-30 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-700 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600 font-medium">
                  Trang {currentPage + 1} / {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="p-2 rounded-full border border-gray-300 text-gray-600 disabled:opacity-30 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-700 transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-blue-700 text-white mt-10 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm">&copy; 2026 RentHub. All rights reserved.</p>
          <p className="text-xs text-blue-200 mt-1">Nền tảng thuê nhà và phòng trọ uy tín</p>
        </div>
      </footer>

      {/* Property Details Modal */}
      {selectedPropertyId !== null && (
        <PropertyDetailModal
          propertyId={selectedPropertyId}
          onClose={() => setSelectedPropertyId(null)}
        />
      )}
    </div>
  );
}
