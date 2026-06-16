import React, { useState, useEffect } from 'react';
import { X, Upload, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Property {
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
  status: 'ACTIVE' | 'PENDING_PAYMENT' | 'BANNED' | 'RENTED';
}

interface EditPropertyModalProps {
  propertyId: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

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

export function EditPropertyModal({ propertyId, onClose, onSuccess }: EditPropertyModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    address: '',
    propertyType: 'apartment',
    area: '',
    videoUrl: '',
    status: 'ACTIVE' as 'ACTIVE' | 'PENDING_PAYMENT' | 'BANNED' | 'RENTED',
  });

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  useEffect(() => {
    if (!propertyId) return;

    const fetchDetails = async () => {
      try {
        setFetching(true);
        const response = await fetch(`http://localhost:5000/api/properties/${propertyId}`);
        const data = await response.json();
        if (data.success) {
          const prop: Property = data.data;
          setFormData({
            title: prop.title,
            description: prop.description || '',
            price: prop.price.toString(),
            address: prop.address,
            propertyType: prop.property_type,
            area: prop.area.toString(),
            videoUrl: (prop as any).video_url || '',
            status: prop.status,
          });
          setSelectedFeatures(prop.features || []);
          setUploadedImages(prop.images || []);
        } else {
          toast.error('Lỗi tải thông tin chi tiết bài viết.');
          onClose();
        }
      } catch (err) {
        console.error('Error fetching property details:', err);
        toast.error('Lỗi kết nối máy chủ.');
        onClose();
      } finally {
        setFetching(false);
      }
    };

    fetchDetails();
  }, [propertyId, onClose]);

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId)
        ? prev.filter((id) => id !== featureId)
        : [...prev, featureId]
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const token = localStorage.getItem('renthub_token');
      if (!token) return;

      const uploadData = new FormData();
      for (let i = 0; i < files.length; i++) {
        uploadData.append('images', files[i]);
      }

      const response = await fetch('http://localhost:5000/api/upload', {
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
        toast.error(data.message || 'Lỗi khi tải ảnh.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải ảnh lên.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.price || !formData.area || !formData.address) {
      toast.error('Vui lòng điền đầy đủ các trường bắt buộc (*)');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('renthub_token');
      if (!token) return;

      // Extract city and district from address
      const addressParts = formData.address.split(',');
      let city = 'Hà Nội';
      let district = 'Hà Đông';
      if (addressParts.length >= 2) {
        city = addressParts[addressParts.length - 1].trim();
        district = addressParts[addressParts.length - 2].trim();
      } else if (addressParts.length === 1) {
        city = addressParts[0].trim();
      }

      const response = await fetch(`http://localhost:5000/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          area: parseFloat(formData.area),
          address: formData.address,
          city: city,
          district: district,
          property_type: formData.propertyType,
          images: uploadedImages,
          video_url: formData.videoUrl,
          features: selectedFeatures,
          status: formData.status
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Cập nhật tin đăng thành công!');
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || 'Lỗi cập nhật.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  if (!propertyId) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Chỉnh sửa tin đăng</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {fetching ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="font-medium">Đang tải thông tin chi tiết...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề tin đăng *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm resize-none"
              />
            </div>

            {/* Price & Area & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá thuê/tháng *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diện tích (m²) *</label>
                <input
                  type="number"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái tin *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm"
                >
                  <option value="ACTIVE">Đang hiển thị</option>
                  <option value="RENTED">Đã cho thuê</option>
                  <option value="PENDING_PAYMENT">Chờ thanh toán</option>
                  <option value="BANNED">Bị khóa</option>
                </select>
              </div>
            </div>

            {/* Address & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ đầy đủ *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại nhà đất *</label>
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

            {/* Video URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Video YouTube (tùy chọn)</label>
              <input
                type="text"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="Ví dụ: https://www.youtube.com/watch?v=..."
                className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh bài đăng</label>
              <div
                className={`border-2 border-dashed border-gray-300 rounded p-6 text-center cursor-pointer hover:border-blue-500 mb-3 relative ${
                  uploading ? 'opacity-70 pointer-events-none' : ''
                }`}
                onClick={() => document.getElementById('edit-image-input')?.click()}
              >
                <input
                  type="file"
                  id="edit-image-input"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {uploading ? (
                  <div>
                    <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-blue-700 font-medium">Đang tải ảnh lên Cloudinary...</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Nhấp vào đây để thêm ảnh từ máy tính</p>
                  </div>
                )}
              </div>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt="Đã tải lên"
                        className="w-full h-16 object-cover rounded border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiện ích</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FEATURES.map((feature) => {
                  const isChecked = selectedFeatures.includes(feature.id);
                  return (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() => toggleFeature(feature.id)}
                      className={`flex items-center gap-1.5 px-2 py-1.5 border rounded text-xs transition ${
                        isChecked
                          ? 'border-blue-700 bg-blue-50 text-blue-800'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 border rounded flex items-center justify-center flex-shrink-0 ${
                          isChecked ? 'bg-blue-700 border-blue-700' : 'border-gray-300'
                        }`}
                      >
                        {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className="truncate">{feature.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
