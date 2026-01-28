import { X, Bell, CheckCircle, AlertTriangle, Info, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { user } = useAuth();
  const { notifications, loading, markAllAsRead, unreadCount } = useNotification();

  const handleMarkAllRead = async () => {
    if (confirm("Tandai semua sebagai sudah dibaca?")) {
      await markAllAsRead();
    }
  };



  const handleDelete = async (id: number) => {
    // For now just hide strictly from UI or implement delete API if needed.
    // User requested "Remove placeholder... make Tandai semua functional".
    // I'll leave delete purely as UI optimistic update or just disable it if not backed by API.
    // But mark as read is specific request.
    // Let's implement single mark as read as a fallback for "Trash" or actually use the mark read API?
    // User wanted "Tandai semua".
    // I'll implement single read on click maybe? No, let's just leave delete button as "Hidden" or non-functional alert for now to avoid scope creep beyond request.
    alert("Fitur hapus belum tersedia.");
  }


  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'RESULT':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'REMINDER':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'SYSTEM':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getBgColor = (read: boolean, type: string) => {
    if (read) return 'bg-white';
    switch (type) {
      case 'RESULT': return 'bg-green-50';
      case 'REMINDER': return 'bg-orange-50';
      case 'SYSTEM': return 'bg-blue-50';
      default: return 'bg-gray-50';
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
                {unreadCount} belum dibaca
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
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className={`text-[14px] font-semibold hover:underline ${unreadCount === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-[#11998E]'}`}
          >
            Tandai semua sudah dibaca
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Memuat...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Tidak ada notifikasi</div>
          ) : (
            notifications.map((notification) => {
              const isRead = notification.status === 'READ';
              return (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${getBgColor(isRead, notification.type)}`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-[15px]">{notification.type}</h3>
                        {!isRead && (
                          <div className="w-2 h-2 bg-[#11998E] rounded-full flex-shrink-0 mt-1.5"></div>
                        )}
                      </div>
                      <p className="text-[14px] text-gray-600 mb-2">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-gray-500">{new Date(notification.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>


      </div>
    </div>
  );
}
