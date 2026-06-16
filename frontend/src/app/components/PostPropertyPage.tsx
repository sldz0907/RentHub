import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Upload, X, Check, Home, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

const FEATURES = [
  { id: 'ac', label: 'Điều hòa' },
  { id: 'balcony', label: 'Ban công' },
  { id: 'pets', label: 'Cho nuôi thú cưng' },
  { id: 'parking', label: 'Bãi đậu xe' },
  { id: 'wifi', label: 'WiFi miễn phí' },
  { id: 'furniture', label: 'Nội thất đầy đủ' },
  { id: 'kitchen', label: 'Bếp nấu ăn' },
  { id: 'washer', label: 'Máy giặt' },
  { id: 'gym', label: 'Phòng gym' },
  { id: 'pool', label: 'Hồ bơi' },
  { id: 'security', label: 'Bảo vệ 24/7' },
  { id: 'elevator', label: 'Thang máy' },
];

export function PostPropertyPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isWaitingPayment, setIsWaitingPayment] = useState(false);
  const [paymentCountdown, setPaymentCountdown] = useState(5);
  const [paymentMethod, setPaymentMethod] = useState('');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isWaitingPayment && paymentCountdown > 0) {
      timer = setTimeout(() => {
        setPaymentCountdown(prev => prev - 1);
      }, 1000);
    } else if (isWaitingPayment && paymentCountdown === 0) {
      handleSubmit();
      setIsWaitingPayment(false);
    }
    return () => clearTimeout(timer);
  }, [isWaitingPayment, paymentCountdown]);

  const handlePaymentInitiate = (method: string) => {
    setPaymentMethod(method);
    setIsWaitingPayment(true);
    setPaymentCountdown(5);
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    address: '',
    propertyType: 'apartment',
    area: '',
  });

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId)
        ? prev.filter((id) => id !== featureId)
        : [...prev, featureId]
    );
  };

  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const token = localStorage.getItem('renthub_token');
      if (!token) {
        toast.error('Bạn cần đăng nhập để tải ảnh lên.');
        navigate('/login');
        return;
      }

      const uploadData = new FormData();
      for (let i = 0; i < files.length; i++) {
        uploadData.append('images', files[i]);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || "https://rent-hub-xnoh.onrender.com/api"}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadData
      });

      const data = await response.json();
      if (data.success && data.urls) {
        setUploadedImages((prev) => [...prev, ...data.urls]);
      } else {
        toast.error(data.message || 'Lỗi khi tải ảnh lên.');
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      toast.error('Không thể tải ảnh lên, vui lòng kiểm tra kết nối.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.price || !formData.area || !formData.address) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('renthub_token');
      if (!token) {
        toast.error('Bạn cần đăng nhập để đăng tin.');
        navigate('/login');
        return;
      }

      // Parse city and district from address
      const addressParts = formData.address.split(',');
      let city = 'Hà Nội';
      let district = 'Hà Đông';
      if (addressParts.length >= 2) {
        city = addressParts[addressParts.length - 1].trim();
        district = addressParts[addressParts.length - 2].trim();
      } else if (addressParts.length === 1) {
        city = addressParts[0].trim();
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || "https://rent-hub-xnoh.onrender.com/api"}/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price.replace(/,/g, '')),
          area: parseFloat(formData.area),
          address: formData.address,
          city: city,
          district: district,
          property_type: formData.propertyType,
          images: uploadedImages.length > 0 ? uploadedImages : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'],
          video_url: videoUrl,
          features: selectedFeatures
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowPaymentModal(false);
        toast.success('Đăng tin bất động sản thành công!');
        navigate('/dashboard');
      } else {
        toast.error(data.message || 'Lỗi khi đăng tin.');
      }
    } catch (err) {
      console.error('Lỗi khi đăng tin:', err);
      toast.error('Kết nối tới server thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowPaymentModal(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/');
    }
  };

  const steps = ['Thông tin cơ bản', 'Hình ảnh', 'Tiện ích'];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <nav className="bg-blue-700 text-white">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Home className="w-6 h-6" />
          <span className="text-lg font-bold">Đăng tin cho thuê</span>
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Bước {currentStep} / 3: {steps[currentStep - 1]}</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded h-2">
            <div
              className="bg-blue-700 h-2 rounded"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
          {/* Step indicators */}
          <div className="flex justify-between mt-2">
            {steps.map((step, i) => (
              <span
                key={i}
                className={`text-xs ${i + 1 <= currentStep ? 'text-blue-700 font-medium' : 'text-gray-400'}`}
              >
                {i + 1}. {step}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white border border-gray-200 rounded p-6 shadow-sm">
          {/* Step 1 */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-5">Thông tin cơ bản</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề tin đăng *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="VD: Phòng trọ giá rẻ, gần trường học"
                  className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả về phòng trọ, tiện ích xung quanh..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá thuê/tháng (VND) *</label>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="VD: 5,000,000"
                    className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diện tích (m²) *</label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="VD: 30"
                    className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ đầy đủ *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="VD: 123 Nguyễn Huệ, Phường Hà Đông, Hà Nội"
                  className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại bất động sản *</label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm"
                >
                  <option value="apartment">Căn hộ</option>
                  <option value="house">Nhà nguyên căn</option>
                  <option value="room">Phòng trọ</option>
                  <option value="condo">Chung cư mini</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-5">Hình ảnh</h2>

              <div
                className={`border-2 border-dashed border-gray-300 rounded p-8 text-center mb-4 cursor-pointer hover:border-blue-500 relative ${uploading ? 'opacity-70 pointer-events-none' : ''
                  }`}
                onClick={() => document.getElementById('image-file-input')?.click()}
              >
                <input
                  type="file"
                  id="image-file-input"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {uploading ? (
                  <div className="py-4">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-blue-700 font-medium">Đang tải ảnh...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-1">Kéo thả ảnh vào đây hoặc click để chọn</p>
                    <p className="text-xs text-gray-400 font-medium">Tải ảnh thực tế từ máy tính của bạn (tối đa 10 ảnh)</p>
                    <button
                      type="button"
                      className="mt-3 px-4 py-2 bg-blue-700 text-white rounded text-sm font-medium hover:bg-blue-800"
                    >
                      Chọn ảnh từ máy
                    </button>
                  </>
                )}
              </div>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Ảnh ${index + 1}`}
                        className="w-full h-28 object-cover rounded border border-gray-200"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <hr className="my-4" />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link video (tùy chọn)</label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Link YouTube hoặc Google Drive"
                  className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Video giúp thu hút người thuê nhiều hơn</p>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Tiện ích</h2>
              <p className="text-sm text-gray-500 mb-5">Chọn tất cả tiện ích có trong phòng/nhà của bạn</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                {FEATURES.map((feature) => (
                  <button
                    key={feature.id}
                    type="button"
                    onClick={() => toggleFeature(feature.id)}
                    className={`flex items-center gap-2 px-3 py-2 border rounded text-sm ${selectedFeatures.includes(feature.id)
                      ? 'border-blue-700 bg-blue-50 text-blue-800'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                  >
                    <div
                      className={`w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${selectedFeatures.includes(feature.id)
                        ? 'bg-blue-700 border-blue-700'
                        : 'border-gray-300'
                        }`}
                    >
                      {selectedFeatures.includes(feature.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    {feature.label}
                  </button>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-800">
                  Đã chọn: <strong>{selectedFeatures.length}</strong> tiện ích
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-5 border-t border-gray-200">
            <button
              onClick={handleBack}
              disabled={loading}
              className={`flex items-center gap-2 px-5 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              <ArrowLeft className="w-4 h-4" />
              {currentStep === 1 ? 'Hủy' : 'Quay lại'}
            </button>
            <button
              onClick={handleNext}
              disabled={loading}
              className={`flex items-center gap-2 px-5 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 text-sm font-medium ${loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
            >
              {currentStep === 3 ? (loading ? 'Đang đăng tin...' : 'Xem lại & Đăng tin') : 'Tiếp theo'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded p-6 max-w-sm w-full relative shadow-lg text-center">
            <button
              onClick={() => {
                setShowPaymentModal(false);
                setIsWaitingPayment(false);
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            {!isWaitingPayment ? (
              <>
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <QrCode className="w-7 h-7 text-blue-700" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Phí đăng tin</h3>
                <p className="text-sm text-gray-500 mb-5">Thanh toán để đăng tin ngay lập tức</p>

                <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-5 text-left">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Phí đăng tin</span>
                    <span className="font-medium">10,000 VND</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-800">Tổng thanh toán</span>
                    <span className="text-blue-700 font-bold text-lg">10,000 VND</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => handlePaymentInitiate('Momo')}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded font-medium hover:bg-purple-700 transition"
                  >
                    <QrCode className="w-5 h-5" />
                    Thanh toán qua Momo
                  </button>
                  <button
                    onClick={() => handlePaymentInitiate('VNPAY')}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded font-medium hover:bg-blue-700 transition"
                  >
                    <QrCode className="w-5 h-5" />
                    Thanh toán qua VNPAY
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-4">🔒 Thanh toán bảo mật - Mã hóa SSL</p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Quét mã QR để thanh toán</h3>
                <p className="text-sm text-gray-500 mb-4">Phương thức: {paymentMethod}</p>
                
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 inline-block mb-4">
                  <img 
                    src="https://img.vietqr.io/image/970422-0123456789-compact2.png?amount=10000&addInfo=ThanhToanRentHub&accountName=ADMIN" 
                    alt="VietQR" 
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                
                <div className="bg-blue-50 text-blue-800 p-3 rounded text-sm mb-4">
                  <p className="font-medium flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    Đang chờ xác nhận thanh toán...
                  </p>
                  <p className="mt-1 text-xs text-blue-600">Bài đăng sẽ tự động được duyệt sau khi nhận tiền ({paymentCountdown}s)</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
