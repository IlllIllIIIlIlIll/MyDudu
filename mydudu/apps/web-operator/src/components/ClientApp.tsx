'use client';

import { useState } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { Login } from '../views/Login';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { ProfileModal } from '../components/ProfileModal';
import { NotificationPanel } from '../components/NotificationPanel';

// Operator Pages
import { Dashboard } from '../views/Dashboard';
import { ChildRecords } from '../views/ChildRecords';
import { DeviceMonitoring } from '../views/DeviceMonitoring';
import { DoctorValidation } from '../views/DoctorValidation';
import { ReportsAnalytics } from '../views/ReportsAnalytics';

// Admin Pages
import { AdminDashboard } from '../views/admin/AdminDashboard';
import { UserManagement } from '../views/admin/UserManagement';
import { SystemLogs } from '../views/admin/SystemLogs';
import { DeviceRegistry } from '../views/admin/DeviceRegistry';

function AppContent() {
    const { user, signInWithGoogle, loading } = useAuth();
    const isAuthenticated = !!user;

    // Temporary: Derive admin role from email for demonstration
    // In a real app, this should come from the user's custom claims or database profile
    const isAdmin = user?.email?.includes('admin') || user?.email?.includes('dudu');

    const [activePage, setActivePage] = useState('dashboard'); // Default safe start

    // Effect to switch default page when role is confirmed
    // This fixes the issue where user logs in but stays on the wrong dashboard
    const [hasRedirected, setHasRedirected] = useState(false);

    const [showProfile, setShowProfile] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Redirect logic once loaded
    if (user && !hasRedirected) {
        if (isAdmin && activePage !== 'admin-dashboard') {
            setActivePage('admin-dashboard');
            setHasRedirected(true);
        } else if (!isAdmin && !activePage.startsWith('admin')) {
            setHasRedirected(true);
        }
    }

    if (!isAuthenticated) {
        return <Login onLogin={signInWithGoogle} />;
    }

    const renderPage = () => {


        // Admin pages
        if (isAdmin) {
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

export default function ClientApp() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
