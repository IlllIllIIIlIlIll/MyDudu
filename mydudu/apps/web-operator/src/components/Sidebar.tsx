import { LayoutDashboard, Users, Smartphone, FileCheck, BarChart3, Shield, UserCog, Activity, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const operatorMenuItems = [
  { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
  { id: 'children', label: 'Data Anak', icon: Users },
  { id: 'devices', label: 'Alat Dudu', icon: Smartphone },
  { id: 'validation', label: 'Validasi Medis', icon: FileCheck },
  { id: 'reports', label: 'Laporan', icon: BarChart3 }
];

const adminMenuItems = [
  { id: 'admin-dashboard', label: 'System Overview', icon: LayoutDashboard },
  { id: 'admin-users', label: 'User Management', icon: UserCog },
  { id: 'admin-devices', label: 'Device Registry', icon: Smartphone },
  { id: 'admin-logs', label: 'System Logs', icon: FileText },
  { id: 'admin-monitoring', label: 'Monitoring', icon: Activity },
  { id: 'admin-security', label: 'Security & Audit', icon: Shield }
];

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { user } = useAuth();

  // Use consistent logic with ClientApp
  const isAdmin = user?.email?.includes('admin') || user?.email?.includes('dudu');
  const menuItems = isAdmin ? adminMenuItems : operatorMenuItems;

  return (
    <div className="w-72 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-[16px] font-extrabold leading-none">MD</div>
              <div className="text-[6px] font-semibold">LOGO</div>
            </div>
          </div>
          <div>
            <h1 className="text-[22px] font-extrabold gradient-text leading-none">MyDudu</h1>
            <p className="text-[11px] text-gray-500 mt-0.5">Dashboard</p>
          </div>
        </div>
        <p className="text-[12px] text-gray-500">Sistem Pemantauan Kesehatan Anak</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-lg transition-all ${isActive
                    ? 'gradient-primary text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="font-semibold text-[16px]">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-[12px] text-gray-400 text-center">
          © 2026 MyDudu Dashboard
        </p>
      </div>
    </div>
  );
}
