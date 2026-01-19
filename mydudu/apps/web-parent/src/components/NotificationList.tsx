import { Bell, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

interface Notification {
  id: string;
  type: 'screening' | 'schedule' | 'alert' | 'success';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

interface NotificationListProps {
  notifications: Notification[];
  onNotificationClick?: (id: string) => void;
}

export function NotificationList({ notifications, onNotificationClick }: NotificationListProps) {
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'screening':
        return <Bell className="w-5 h-5" />;
      case 'schedule':
        return <Calendar className="w-5 h-5" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5" />;
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getIconColor = (type: Notification['type']) => {
    switch (type) {
      case 'screening':
        return 'bg-blue-50 text-blue-600';
      case 'schedule':
        return 'bg-purple-50 text-purple-600';
      case 'alert':
        return 'bg-orange-50 text-orange-600';
      case 'success':
        return 'bg-green-50 text-green-600';
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">Tidak ada notifikasi baru</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          onClick={() => onNotificationClick?.(notification.id)}
          className={`
            p-4 rounded-2xl border cursor-pointer transition-all duration-200
            ${notification.isRead 
              ? 'bg-white border-gray-100' 
              : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
            }
            hover:shadow-md
          `}
        >
          <div className="flex gap-3">
            <div className={`flex-shrink-0 p-2 rounded-xl ${getIconColor(notification.type)}`}>
              {getIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-base font-semibold text-gray-900">
                  {notification.title}
                </h3>
                {!notification.isRead && (
                  <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-1.5"></span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
              <span className="text-xs text-gray-400">{notification.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
