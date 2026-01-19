import { X } from 'lucide-react';
import { NotificationList } from './NotificationList';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: any[];
  onNotificationClick: (id: string) => void;
}

export function NotificationModal({ 
  isOpen, 
  onClose, 
  notifications,
  onNotificationClick 
}: NotificationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2>Notifikasi</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <NotificationList
            notifications={notifications}
            onNotificationClick={(id) => {
              onNotificationClick(id);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
