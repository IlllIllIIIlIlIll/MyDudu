import { User, Bell, Settings, LogOut, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface TopbarProps {
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
}

export function Topbar({ onOpenProfile, onOpenNotifications }: TopbarProps) {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  if (!user) return null;

  const getRoleBadge = () => {
    switch (user.role) {
      case 'admin':
        return <span className="text-[13px] px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold">IT Admin</span>;
      case 'puskesmas':
        return <span className="text-[13px] px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">Puskesmas</span>;
      case 'posyandu':
        return <span className="text-[13px] px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">Posyandu</span>;
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
        <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-[17px]">{user.fullName}</p>
            {getRoleBadge()}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {getLocationDisplay()}
            {!user.assignedLocation && (
              <p className="text-[13px] text-gray-500">Akses Sistem Penuh</p>
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