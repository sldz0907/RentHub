import { useState, useEffect } from 'react';
import { X, MapPin, ChevronLeft, ChevronRight, Phone, Mail, User, ShieldAlert, Award, Calendar, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

interface PropertyDetail {
  id: number;
  title: string;
  description: string;
  price: string | number;
  area: number;
  address: string;
  city: string;
  district: string;
  property_type: string;
  images: string[];
  features: string[];
  owner_username: string;
  owner_email: string;
  owner_phone: string;
  video_url?: string;
  created_at?: string;
}

interface PropertyDetailModalProps {
  propertyId: number | null;
  onClose: () => void;
}

function getYouTubeEmbedUrl(url: string) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return null;
}

const FEATURE_MAP: Record<string, string> = {
  ac: 'Điều hòa',
  balcony: 'Ban công',
  pets: 'Cho nuôi thú cưng',
  parking: 'Bãi đậu xe',
  wifi: 'WiFi miễn phí',
  furniture: 'Nội thất đầy đủ',
  kitchen: 'Bếp nấu ăn',
  washer: 'Máy giặt',
  gym: 'Phòng gym',
  pool: 'Hồ bơi',
  security: 'Bảo vệ 24/7',
  elevator: 'Thang máy',
};

const TYPE_MAP: Record<string, string> = {
  apartment: 'Căn hộ',
  house: 'Nhà nguyên căn',
  room: 'Phòng trọ',
  condo: 'Chung cư mini',
};

const REPORT_REASONS = [
  'Lừa đảo / Yêu cầu đặt cọc đáng ngờ',
  'Thông tin, hình ảnh không đúng thực tế',
  'Số điện thoại không liên lạc được / Giả mạo',
  'Bất động sản này đã được thuê / Không còn trống',
  'Sai lệch giá cả',
  'Khác (vui lòng ghi rõ chi tiết bên dưới)',
];

export function PropertyDetailModal({ propertyId, onClose }: PropertyDetailModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const handleOpenReport = () => {
    if (!propertyId) return;
    if (!user) {
      toast.error("Bạn cần đăng nhập để báo cáo tin đăng.");
      navigate('/login');
      return;
    }
    setShowReportModal(true);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) return;

    const finalReason = reportReason === 'Khác (vui lòng ghi rõ chi tiết bên dưới)'
      ? customReason.trim()
      : reportReason;

    if (!finalReason) {
      toast.error("Vui lòng chọn hoặc nhập lý do báo cáo.");
      return;
    }

    try {
      setIsSubmittingReport(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || "https://rent-hub-xnoh.onrender.com/api"}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('renthub_token')}`
        },
        body: JSON.stringify({ property_id: propertyId, reason: finalReason })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Báo cáo thành công. Ban quản trị sẽ xử lý sớm!");
        setShowReportModal(false);
        setReportReason('');
        setCustomReason('');
      } else {
        toast.error(data.message || "Lỗi báo cáo");
      }
    } catch (error) {
      toast.error("Lỗi kết nối tới server");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  useEffect(() => {
    if (!propertyId) return;

    const fetchPropertyDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL || "https://rent-hub-xnoh.onrender.com/api"}/properties/${propertyId}`);
        const data = await response.json();
        if (data.success) {
          setProperty(data.data);
        } else {
          toast.error(data.message || 'Lỗi khi tải chi tiết tin đăng');
          onClose();
        }
      } catch (err) {
        console.error('Error fetching property details:', err);
        toast.error('Lỗi kết nối tới máy chủ');
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetails();
  }, [propertyId, onClose]);

  if (!propertyId) return null;

  const nextImage = () => {
    if (!property) return;
    setActiveImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = () => {
    if (!property) return;
    setActiveImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  const formatPrice = (price: string | number) => {
    return typeof price === 'number' || !isNaN(Number(price))
      ? Number(price).toLocaleString('vi-VN') + ' đ/tháng'
      : price;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 z-10 transition duration-200"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-medium">Đang tải thông tin chi tiết...</p>
          </div>
        ) : property ? (
          <div>
            {/* Image Slider */}
            <div className="relative h-64 md:h-96 bg-gray-100 flex items-center justify-center group overflow-hidden">
              <img
                src={property.images && property.images.length > 0 ? property.images[activeImageIndex] : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'}
                alt={property.title}
                className="w-full h-full object-cover transition-all duration-300"
              />
              
              {property.images && property.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-2 transition opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-2 transition opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  
                  {/* Indicator Dots */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/35 px-3 py-1.5 rounded-full">
                    {property.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === activeImageIndex ? 'bg-white scale-125' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              <span className="absolute top-4 left-4 bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                {TYPE_MAP[property.property_type] || property.property_type}
              </span>
            </div>

            {/* Content Details */}
            <div className="p-6">
              {/* Title & Price */}
              <div className="mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 leading-snug">
                  {property.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span>{property.address}, {property.district}, {property.city}</span>
                  </div>
                </div>
              </div>

              {/* Major attributes grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-y border-gray-200 py-4 mb-6">
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase mb-1">Giá thuê</p>
                  <p className="text-lg font-bold text-blue-700">{formatPrice(property.price)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase mb-1">Diện tích</p>
                  <p className="text-lg font-bold text-gray-800">{property.area} m²</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs text-gray-400 font-medium uppercase mb-1">Ngày đăng</p>
                  <p className="text-lg font-bold text-gray-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold">
                      {property.created_at ? new Date(property.created_at).toLocaleDateString('vi-VN') : 'Mới đây'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 text-base mb-2 border-b pb-1">Mô tả chi tiết</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                  {property.description || 'Không có mô tả chi tiết cho bài đăng này.'}
                </p>
              </div>

              {/* Features/Amenities */}
              {property.features && property.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-800 text-base mb-2 border-b pb-1">Tiện ích đi kèm</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.features.map((feat) => (
                      <span
                        key={feat}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-md text-xs font-medium"
                      >
                        <Award className="w-3.5 h-3.5 text-blue-700" />
                        {FEATURE_MAP[feat] || feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Video Tour */}
              {property.video_url && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-800 text-base mb-2 border-b pb-1 flex items-center gap-1.5">
                    <Video className="w-5 h-5 text-blue-700" />
                    Video giới thiệu
                  </h3>
                  {getYouTubeEmbedUrl(property.video_url) ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-black">
                      <iframe
                        src={getYouTubeEmbedUrl(property.video_url)!}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      />
                    </div>
                  ) : (
                    <a
                      href={property.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-700 text-white hover:bg-blue-800 rounded-md text-sm font-semibold transition shadow-sm"
                    >
                      <Video className="w-4 h-4" />
                      Xem Video giới thiệu (Mở tab mới)
                    </a>
                  )}
                </div>
              )}

              {/* Owner Info Panel */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mt-6">
                <h3 className="font-bold text-gray-800 text-sm uppercase mb-3 tracking-wide flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-700" />
                  Thông tin liên hệ người đăng
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-800 font-bold text-lg rounded-full flex items-center justify-center flex-shrink-0">
                      {property.owner_username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Người đăng tin</p>
                      <p className="font-semibold text-gray-800">{property.owner_username}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 justify-center">
                    <a
                      href={`tel:${property.owner_phone}`}
                      className="inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 font-semibold transition"
                    >
                      <Phone className="w-4 h-4 text-blue-600" />
                      <span>{property.owner_phone}</span>
                    </a>
                    <a
                      href={`mailto:${property.owner_email}`}
                      className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
                    >
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{property.owner_email}</span>
                    </a>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={handleOpenReport}
                    className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition cursor-pointer"
                    title="Báo cáo vi phạm"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Tố cáo tin đăng này</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="font-medium">Không tìm thấy thông tin bất động sản này.</p>
          </div>
        )}

      </div>

      {showReportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform animate-in zoom-in-95 duration-200">
            <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600 animate-bounce" />
              <h3 className="text-lg font-bold text-red-700">Báo cáo vi phạm</h3>
            </div>
            
            <form onSubmit={handleReportSubmit} className="p-6">
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                Chúng tôi cam kết xây dựng cộng đồng tin cậy. Báo cáo của bạn sẽ giúp đội ngũ kiểm duyệt rà soát tin đăng nhanh chóng.
              </p>

              <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn lý do báo cáo:</label>
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                      reportReason === reason
                        ? 'border-red-500 bg-red-50/30 ring-1 ring-red-500'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason}
                      checked={reportReason === reason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="mt-0.5 text-red-600 focus:ring-red-500 h-4 w-4 border-gray-300"
                    />
                    <span className="text-sm text-gray-700 font-medium leading-tight">{reason}</span>
                  </label>
                ))}
              </div>

              {(reportReason === 'Khác (vui lòng ghi rõ chi tiết bên dưới)' || !reportReason) && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả chi tiết:</label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả cụ thể vi phạm giúp quản trị viên dễ kiểm tra..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    required={reportReason === 'Khác (vui lòng ghi rõ chi tiết bên dưới)'}
                    className="w-full text-sm border border-gray-300 rounded-lg p-3 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition duration-200 resize-none text-gray-800"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition cursor-pointer"
                  disabled={isSubmittingReport}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 active:bg-red-800 transition shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  disabled={isSubmittingReport}
                >
                  {isSubmittingReport ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    'Gửi báo cáo'
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
