import { X, User, Mail, MapPin, Shield, Camera, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { ImageCropper } from './ImageCropper';
import { getCroppedImg } from '@/utils/getCroppedImg';
import { Area } from 'react-easy-crop';
import styles from './Dialogs.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dbUser, setDbUser] = useState<any>(null); // Store full DB user object including ID
  const [loading, setLoading] = useState(false);

  // Image Cropper State
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  // Fetch DB user details when modal opens or user changes
  useEffect(() => {
    if (isOpen && user?.email) {
      const fetchData = async () => {
        try {
          const token = await auth.currentUser?.getIdToken();
          const res = await fetch(`${API_URL}/users/details?email=${user.email}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await res.json();
          setDbUser(data);
          if (data?.fullName) setDisplayName(data.fullName);
          if (data?.phoneNumber) setPhoneNumber(data.phoneNumber);
        } catch (err) {
          console.error("Failed to fetch user details", err);
        }
      };
      fetchData();
    }
  }, [isOpen, user?.email]);

  if (!isOpen || !user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImageSrc(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ''; // Reset input
  };

  // Upload Logic
  const handleSaveCroppedImage = async (croppedAreaPixels: Area, rotation: number) => {
    if (!tempImageSrc || !croppedAreaPixels || !dbUser?.id) return;

    try {
      setLoading(true);
      const croppedImageBlob = await getCroppedImg(tempImageSrc, croppedAreaPixels, rotation);

      if (croppedImageBlob) {
        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(croppedImageBlob);
        reader.onloadend = async () => {
          const base64data = reader.result;

          // Send PATCH request with new profile picture
          const token = await auth.currentUser?.getIdToken();
          const res = await fetch(`${API_URL}/users/${dbUser.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ profilePicture: base64data })
          });

          if (res.ok) {
            const updated = await res.json();
            setDbUser(updated); // Update local state
            setShowCropper(false);
            setTempImageSrc(null);
            // Optional: Force reload or notify AuthContext if needed
          } else {
            alert("Failed to upload image");
          }
        };
      }
    } catch (e) {
      console.error("Failed to process/upload image", e);
      alert("Error processing image");
    } finally {
      setLoading(false);
    }
  };

  // Profile Update (Name)
  const handleSave = async () => {
    if (!dbUser?.id) return;
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_URL}/users/${dbUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fullName: displayName, phoneNumber: phoneNumber })
      });

      if (res.ok) {
        alert('Profil berhasil diperbarui');
        onClose();
      } else {
        alert('Gagal memperbarui profil');
      }
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      {/* Image Cropper Modal Layer */}
      {showCropper && tempImageSrc && (
        <ImageCropper
          imageSrc={tempImageSrc}
          onCancel={() => { setShowCropper(false); setTempImageSrc(null); }}
          onConfirm={handleSaveCroppedImage}
        />
      )}

      <div className="bg-white rounded-t-2xl md:rounded-xl shadow-2xl w-full max-w-lg h-[85vh] md:h-auto md:max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom md:slide-in-from-bottom-4 duration-300">
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
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                {dbUser?.profilePicture ? (
                  <img src={dbUser.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>


              <label className="absolute bottom-0 right-0 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer" title="Change Photo">
                <Camera className="w-4 h-4 text-gray-600" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className={`hidden ${styles.hiddenInput}`}
                />
              </label>
            </div>
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
                  value={user.email || ''}
                  disabled
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-[15px] text-gray-600"
                />
              </div>
              <p className="text-[12px] text-gray-500 mt-1">Email tidak dapat diubah</p>
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-gray-700 mb-2">
                Nomor Telepon
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
                />
              </div>
            </div>

            {/* Role and Location (Read Only) */}
            {dbUser && (
              <>
                <div>
                  <label className="block text-[14px] font-semibold text-gray-700 mb-2">Role / Peran</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={dbUser.role}
                      disabled
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-[15px] text-gray-600"
                    />
                  </div>
                </div>
              </>
            )}

            {/* ... other fields ... */}
          </div>

          {/* ... Notification Preferences ... */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-bold text-[16px] mb-4">Preferensi Notifikasi</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-[#11998E] focus:ring-[#11998E]" />
                <span className="text-[15px]">Notifikasi validasi dokter</span>
              </label>
              {/* Other checkboxes */}
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
              disabled={loading}
              className="flex-1 gradient-primary text-white px-6 py-3 rounded-lg font-semibold text-[15px] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
