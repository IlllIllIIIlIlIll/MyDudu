import { X, User, Mail, MapPin, Shield, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.fullName || '');

  if (!isOpen || !user) return null;

  const handleSave = () => {
    alert('Profil berhasil diperbarui');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="gradient-primary p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-[24px] font-bold">Pengaturan Profil</h2>
          <p className="text-white/90 text-[14px] mt-1">Kelola informasi akun Anda</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors">
                <Camera className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <p className="text-[13px] text-gray-500 mt-2">Klik untuk mengubah foto profil</p>
          </div>

          {/* Personal Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-[14px] font-semibold text-gray-700 mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-[15px] text-gray-600"
                />
              </div>
              <p className="text-[12px] text-gray-500 mt-1">Email tidak dapat diubah</p>
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-gray-700 mb-2">
                Role / Peran
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={user.role === 'admin' ? 'IT Administrator' : user.role === 'puskesmas' ? 'Operator Puskesmas' : 'Operator Posyandu'}
                  disabled
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-[15px] text-gray-600"
                />
              </div>
            </div>

            {user.assignedLocation && (
              <div>
                <label className="block text-[14px] font-semibold text-gray-700 mb-2">
                  Lokasi Penugasan
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={user.assignedLocation.name}
                    disabled
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-[15px] text-gray-600"
                  />
                </div>
                {user.assignedLocation.desa && (
                  <p className="text-[12px] text-gray-500 mt-1">
                    {user.assignedLocation.desa}, {user.assignedLocation.kecamatan}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Notification Preferences */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-bold text-[16px] mb-4">Preferensi Notifikasi</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-[#11998E] focus:ring-[#11998E]" />
                <span className="text-[15px]">Notifikasi validasi dokter</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-[#11998E] focus:ring-[#11998E]" />
                <span className="text-[15px]">Notifikasi pemeriksaan baru</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-[#11998E] focus:ring-[#11998E]" />
                <span className="text-[15px]">Peringatan baterai alat rendah</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-[#11998E] focus:ring-[#11998E]" />
                <span className="text-[15px]">Laporan bulanan otomatis</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-[15px] hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="flex-1 gradient-primary text-white px-6 py-3 rounded-lg font-semibold text-[15px] hover:opacity-90 transition-opacity"
            >
              Simpan Perubahan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
