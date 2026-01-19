import { Bell } from 'lucide-react';

interface NotificationBellProps {
  count: number;
  onClick: () => void;
}

export function NotificationBell({ count, onClick }: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 hover:bg-white/10 rounded-xl transition-colors"
    >
      <Bell className="w-6 h-6 text-white" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}
