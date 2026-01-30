import { User, Bell, Settings, LogOut, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

interface TopbarProps {
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
}

export function Topbar({ onOpenProfile, onOpenNotifications }: TopbarProps) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotification();
  const [showMenu, setShowMenu] = useState(false);

  if (!user) return null;

  const getRoleLabel = () => {
    switch (user.role) {
      case 'admin':
        return 'IT ADMIN';
      case 'puskesmas':
        return 'OPERATOR PUSKESMAS';
      case 'posyandu':
        return 'OPERATOR POSYANDU';
      default:
        return user.role?.toUpperCase() || 'USER';
    }
  };

  const getLocationDisplay = () => {
    if (!user.assignedLocation) return null;

    if (user.role === 'posyandu') {
      return (
        <div className="flex items-center gap-1 text-gray-500">
          <MapPin className="w-3.5 h-3.5" />
          <p className="text-[13px]">
            {user.assignedLocation.posyanduName} • {user.assignedLocation.village}
          </p>
        </div>
      );
    }

    if (user.role === 'puskesmas') {
      return (
        <div className="flex items-center gap-1 text-gray-500">
          <MapPin className="w-3.5 h-3.5" />
          <p className="text-[13px]">
            {user.assignedLocation.puskesmasName} • {user.assignedLocation.kecamatan}
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div> */}
        <div>
          <div className="flex flex-col">
            <p className="font-semibold text-[20px] leading-tight text-gray-900">{user.fullName}</p>
            <p className="text-[12px] font-bold text-gray-500 tracking-wider mt-0.5">{getRoleLabel()}</p>
            {user.role !== 'admin' && user.assignedLocation && (
              <p className="text-[13px] text-gray-500 mt-1 flex items-center gap-1 font-medium italic">
                {user.role === 'posyandu'
                  ? `Desa ${user.assignedLocation.village}`
                  : `Kecamatan ${user.assignedLocation.kecamatan}`}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          className="relative p-3 hover:bg-gray-100 rounded-lg transition-colors"
          title="Notifikasi"
        >
          <Bell className="w-5 h-5 text-gray-700" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Settings/Profile */}
        <button
          onClick={onOpenProfile}
          className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
          title="Pengaturan Profil"
        >
          <Settings className="w-5 h-5 text-gray-700" />
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="gradient-primary text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-semibold text-[15px]">Keluar</span>
        </button>
      </div>
    </div>
  );
}
