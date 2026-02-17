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
  { id: 'pemeriksaan', label: 'Pemeriksaan', icon: Activity },

];

const adminMenuItems = [
  { id: 'admin-dashboard', label: 'System Overview', icon: LayoutDashboard },
  { id: 'admin-users', label: 'User Management', icon: UserCog },
  { id: 'admin-devices', label: 'Device Registry', icon: Smartphone },
  { id: 'admin-logs', label: 'System Logs', icon: FileText },
  // { id: 'admin-monitoring', label: 'Monitoring', icon: Activity },
  // { id: 'admin-security', label: 'Security & Audit', icon: Shield }
];

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { user } = useAuth();

  // Use consistent logic with ClientApp
  // Use consistent logic with ClientApp
  const role = user?.role;
  const isAdmin = role === 'admin';

  let menuItems = isAdmin ? adminMenuItems : [...operatorMenuItems];

  // Add User Management for Puskesmas
  if (role === 'puskesmas') {
    menuItems.push({ id: 'users', label: 'User Management', icon: Users });
  }

  return (
    <div className="w-72 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 flex items-center justify-center">
            <img src="/logo_mydudu.png" alt="MyDudu Logo" className="w-full h-full object-contain" />
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
            const isValidation = item.id === 'validation';

            return (
              <li key={item.id}>
                <button
                  onClick={() => !isValidation && onNavigate(item.id)}
                  disabled={isValidation}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 
                    ${isValidation
                      ? 'bg-transparent text-gray-300 cursor-not-allowed' // Completely disabled look
                      : isActive
                        ? 'gradient-primary text-white shadow-md scale-[1.02]'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm active:scale-95'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-[14px]">{item.label}</span>
                  {isValidation && (
                    <span className="ml-auto text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Soon
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-[12px] text-gray-400 text-center">
          © Innovillage 2025 by Telkom
        </p>
      </div>
    </div>
  );
}
