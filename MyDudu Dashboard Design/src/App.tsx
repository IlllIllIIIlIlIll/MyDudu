import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { ProfileModal } from './components/ProfileModal';
import { NotificationPanel } from './components/NotificationPanel';

// Operator Pages
import { Dashboard } from './pages/Dashboard';
import { ChildRecords } from './pages/ChildRecords';
import { DeviceMonitoring } from './pages/DeviceMonitoring';
import { DoctorValidation } from './pages/DoctorValidation';
import { ReportsAnalytics } from './pages/ReportsAnalytics';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { SystemLogs } from './pages/admin/SystemLogs';
import { DeviceRegistry } from './pages/admin/DeviceRegistry';

function AppContent() {
  const { user, login, isAuthenticated } = useAuth();
  const [activePage, setActivePage] = useState(() => 
    user?.role === 'admin' ? 'admin-dashboard' : 'dashboard'
  );
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  const renderPage = () => {
    // Admin pages
    if (user?.role === 'admin') {
      switch (activePage) {
        case 'admin-dashboard':
          return <AdminDashboard />;
        case 'admin-users':
          return <UserManagement />;
        case 'admin-logs':
          return <SystemLogs />;
        case 'admin-devices':
          return <DeviceRegistry />;
        case 'admin-monitoring':
          return <div className="p-8"><h1>System Monitoring</h1><p className="text-gray-600 mt-2">Real-time performance monitoring coming soon...</p></div>;
        case 'admin-security':
          return <div className="p-8"><h1>Security & Audit</h1><p className="text-gray-600 mt-2">Security audit and compliance reports coming soon...</p></div>;
        default:
          return <AdminDashboard />;
      }
    }

    // Operator pages
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'children':
        return <ChildRecords />;
      case 'devices':
        return <DeviceMonitoring />;
      case 'validation':
        return <DoctorValidation />;
      case 'reports':
        return <ReportsAnalytics />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <div className="flex h-screen bg-[#F7F9FA] overflow-hidden">
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar 
            onOpenProfile={() => setShowProfile(true)} 
            onOpenNotifications={() => setShowNotifications(true)}
          />
          <main className="flex-1 overflow-y-auto">
            {renderPage()}
          </main>
        </div>
      </div>

      {/* Modals */}
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
      <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}