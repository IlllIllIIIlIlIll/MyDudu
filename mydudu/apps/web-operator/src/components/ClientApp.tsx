'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { Login } from '../views/Login';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { ProfileModal } from '../components/ProfileModal';
import { NotificationPanel } from '../components/NotificationPanel';
import { fetchWithAuth } from '../lib/api';

// Operator Pages
import { Dashboard } from '../views/Dashboard';
import { ChildRecords } from '../views/ChildRecords';
import { DeviceMonitoring } from '../views/DeviceMonitoring';
import { DoctorValidation } from '../views/DoctorValidation';
import { ScreeningFlow } from '../views/Pemeriksaan/ScreeningFlow';

// Admin Pages
import { AdminDashboard } from '../views/admin/AdminDashboard';
import { UserManagement } from '../views/admin/UserManagement';
import { SystemLogs } from '../views/admin/SystemLogs';
import { DeviceRegistry } from '../views/admin/DeviceRegistry';

function AppContent() {
    const { user, signInWithGoogle, loading } = useAuth();
    const isAuthenticated = !!user;

    // MOCK OVERRIDE REMOVED - Using AuthContext with src/lib/firebase.ts mock


    // Use consistent logic with Sidebar
    const isAdmin = user?.role === 'admin';

    const [activePage, setActivePage] = useState('dashboard'); // Default safe start

    // Effect to switch default page when role is confirmed
    // This fixes the issue where user logs in but stays on the wrong dashboard
    const [hasRedirected, setHasRedirected] = useState(false);

    const [showProfile, setShowProfile] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [pemeriksaanGateOpen, setPemeriksaanGateOpen] = useState(false);
    const [pemeriksaanGateMessage, setPemeriksaanGateMessage] = useState('');

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

    const handleNavigate = async (page: string) => {
        if (page !== 'pemeriksaan') {
            setActivePage(page);
            return;
        }

        if (!user?.id) {
            setPemeriksaanGateMessage('Sesi pengguna tidak ditemukan. Silakan login ulang.');
            setPemeriksaanGateOpen(true);
            return;
        }

        try {
            const queue = await fetchWithAuth(`/operator/pemeriksaan/queue?userId=${user.id}`) as unknown[];
            if (!Array.isArray(queue) || queue.length === 0) {
                setPemeriksaanGateMessage('Belum ada sesi pemeriksaan yang tersedia saat ini.');
                setPemeriksaanGateOpen(true);
                return;
            }
            setActivePage('pemeriksaan');
        } catch (error: any) {
            setPemeriksaanGateMessage(error?.message || 'Gagal memeriksa antrian pemeriksaan.');
            setPemeriksaanGateOpen(true);
        }
    };

    // Standalone Full-Screen Pages
    if (activePage === 'pemeriksaan') {
        return (
            <ScreeningFlow onExit={() => setActivePage('dashboard')} />
        );
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
                return <ChildRecords onNavigate={handleNavigate} />;
            case 'devices':
                return <DeviceMonitoring />;
            case 'validation':
                return <DoctorValidation />;
            case 'users':
                if (user?.role === 'puskesmas') {
                    return <UserManagement />;
                }
                return <Dashboard />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <>
            <div className="flex h-screen bg-[#F7F9FA] overflow-hidden">
                <Sidebar activePage={activePage} onNavigate={handleNavigate} />
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
            {pemeriksaanGateOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 px-4">
                    <div className="relative w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-2xl p-5 text-left">
                        <button
                            type="button"
                            onClick={() => setPemeriksaanGateOpen(false)}
                            className="absolute top-3 right-3 rounded-md p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            aria-label="Tutup"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-bold text-slate-900 pr-8">Pemeriksaan Tidak Tersedia</h3>
                        <p className="text-sm text-slate-600 mt-2">{pemeriksaanGateMessage}</p>
                    </div>
                </div>
            )}
        </>
    );
}

import { NotificationProvider } from '../context/NotificationContext';

export default function ClientApp() {
    return (
        <AuthProvider>
            <NotificationProvider>
                <AppContent />
            </NotificationProvider>
        </AuthProvider>
    );
}
