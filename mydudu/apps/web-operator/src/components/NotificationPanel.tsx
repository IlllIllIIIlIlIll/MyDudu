import { X, Bell, CheckCircle, AlertTriangle, Info, Trash2 } from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Validasi Diperlukan',
    message: 'Ada 3 pemeriksaan baru yang memerlukan validasi dokter',
    time: '5 menit yang lalu',
    read: false
  },
  {
    id: '2',
    type: 'warning',
    title: 'Baterai Alat Rendah',
    message: 'Alat Dudu 5 memiliki baterai 15%. Segera lakukan pengisian.',
    time: '1 jam yang lalu',
    read: false
  },
  {
    id: '3',
    type: 'success',
    title: 'Laporan Berhasil Dibuat',
    message: 'Laporan bulanan Januari 2026 telah berhasil dibuat',
    time: '3 jam yang lalu',
    read: false
  },
  {
    id: '4',
    type: 'info',
    title: 'Pemeriksaan Selesai',
    message: '42 anak telah diperiksa hari ini di Posyandu Melati',
    time: '5 jam yang lalu',
    read: true
  },
  {
    id: '5',
    type: 'success',
    title: 'Data Tersinkronisasi',
    message: 'Semua data dari Alat Dudu telah tersinkronisasi',
    time: 'Kemarin',
    read: true
  }
];

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getBgColor = (type: string, read: boolean) => {
    if (read) return 'bg-white';
    switch (type) {
      case 'success':
        return 'bg-green-50';
      case 'warning':
        return 'bg-orange-50';
      case 'info':
        return 'bg-blue-50';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-start justify-center md:justify-end z-50 transition-opacity">
      <div className="bg-white w-full h-[85vh] md:w-[420px] md:h-screen flex flex-col rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none shadow-2xl animate-in slide-in-from-bottom md:slide-in-from-right duration-300">
        {/* Header */}
        <div className="gradient-primary p-6 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6" />
            <div>
              <h2 className="text-[20px] font-bold">Notifikasi</h2>
              <p className="text-white/90 text-[13px]">
                {mockNotifications.filter(n => !n.read).length} belum dibaca
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="px-6 py-3 border-b border-gray-200 flex gap-2 flex-shrink-0">
          <button
            onClick={() => alert("Marked all as read")}
            className="text-[14px] text-[#11998E] font-semibold hover:underline"
          >
            Tandai semua sudah dibaca
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {mockNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${getBgColor(notification.type, notification.read)}`}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-[15px]">{notification.title}</h3>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-[#11998E] rounded-full flex-shrink-0 mt-1.5"></div>
                    )}
                  </div>
                  <p className="text-[14px] text-gray-600 mb-2">{notification.message}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-500">{notification.time}</span>
                    <button
                      onClick={() => alert(`Deleted notification: ${notification.id}`)}
                      className="p-1 hover:bg-white rounded transition-colors"
                      title="Hapus notifikasi"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={() => alert("Redirecting to full notifications page...")}
            className="w-full text-center text-[14px] text-[#11998E] font-semibold hover:underline"
          >
            Lihat Semua Notifikasi
          </button>
        </div>
      </div>
    </div>
  );
}
