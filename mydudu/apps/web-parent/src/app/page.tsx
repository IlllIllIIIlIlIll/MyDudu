'use client';

import { useState, useEffect } from 'react';
import {
  Scale,
  Ruler,
  Thermometer,
  Activity,
  Maximize2,
  User,
  LogOut
} from 'lucide-react';
import { LoginPage } from '../components/LoginPage';
import { ChildSelector } from '../components/ChildSelector';
import { NotificationBell } from '../components/NotificationBell';
import { NotificationModal } from '../components/NotificationModal';
import { DashboardCard } from '../components/DashboardCard';
import { StatusCard } from '../components/StatusCard';
import { TrendChart } from '../components/TrendChart';
import { EduCard } from '../components/EduCard';
import { ConsultationRecord } from '../components/ConsultationRecord';
import { TabNavigation } from '../components/TabNavigation';
import { ConsultationButton } from '../components/ConsultationButton';
import { DashboardSkeleton, ChartSkeleton } from '../components/LoadingSkeleton';
import {
  mockChildren,
  mockChildData,
  mockEducationArticles,
  mockNotifications,
  fetchChildData,
  fetchGrowthHistory,
  fetchConsultationHistory,
  fetchEducationArticles,
  fetchNotifications
} from '../utils/mockData';

type TabType = 'home' | 'history';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedChildId, setSelectedChildId] = useState('child-001');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [childData, setChildData] = useState(mockChildData[selectedChildId as keyof typeof mockChildData]);
  const [growthHistory, setGrowthHistory] = useState<any>(null);
  const [consultationHistory, setConsultationHistory] = useState<any[]>([]);
  const [educationArticles, setEducationArticles] = useState(mockEducationArticles);
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Handle login
  const handleLogin = (phoneNumber: string) => {
    setIsLoggedIn(true);
    loadData(selectedChildId);
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    // TODO: Clear JWT token from localStorage
    // localStorage.removeItem('auth_token');
  };

  // Load child data
  const loadData = async (childId: string) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API calls when backend is ready
      // const data = await fetch(`/api/children/${childId}/status`, {
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      //   }
      // }).then(res => res.json());

      const data = await fetchChildData(childId);
      setChildData(data as any);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistoryData = async (childId: string) => {
    try {
      const [history, consultations] = await Promise.all([
        fetchGrowthHistory(childId),
        fetchConsultationHistory(childId)
      ]);
      setGrowthHistory(history);
      setConsultationHistory(consultations as any[]);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const loadEducationData = async () => {
    try {
      const articles = await fetchEducationArticles();
      setEducationArticles(articles as any);
    } catch (error) {
      console.error('Error loading education:', error);
    }
  };

  const loadNotificationsData = async () => {
    try {
      const notifs = await fetchNotifications('user-001');
      setNotifications(notifs as any);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Initial data load
  useEffect(() => {
    if (isLoggedIn) {
      loadData(selectedChildId);
      loadEducationData();
      loadNotificationsData();
    }
  }, [isLoggedIn]);

  // Handle child selection change
  useEffect(() => {
    if (isLoggedIn) {
      loadData(selectedChildId);
      if (activeTab === 'history') {
        loadHistoryData(selectedChildId);
      }
    }
  }, [selectedChildId]);

  // Load tab-specific data
  useEffect(() => {
    if (isLoggedIn && activeTab === 'history') {
      loadHistoryData(selectedChildId);
    }
  }, [activeTab]);

  const handleConsultation = () => {
    // TODO: Implement consultation feature - redirect to WhatsApp or messaging system
    alert('Fitur konsultasi akan menghubungkan Anda dengan tenaga kesehatan terdekat melalui WhatsApp.');
  };

  const handleArticleClick = (articleId: string) => {
    // TODO: Navigate to article detail page
    console.log('Opening article:', articleId);
    alert('Halaman artikel akan dibuka. Fitur detail artikel dalam pengembangan.');
  };

  const handleNotificationClick = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  // Show login page if not logged in
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="gradient-primary text-white px-4 pt-6 pb-8 rounded-b-3xl shadow-lg sticky top-0 z-40">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-white mb-1">MyDudu</h1>
              <p className="text-sm text-white/90">Kesehatan Anak</p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell
                count={unreadCount}
                onClick={() => setIsNotificationOpen(true)}
              />
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                title="Keluar"
              >
                <LogOut className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          <ChildSelector
            children={mockChildren}
            selectedChildId={selectedChildId}
            onSelect={setSelectedChildId}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 mt-6">
        {/* Home Tab */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Overall Status */}
            <div>
              <h2 className="mb-4">Status Kesehatan Anak</h2>
              {isLoading ? (
                <div className="bg-gray-100 rounded-2xl h-48 animate-pulse" />
              ) : (
                <StatusCard
                  status={childData.overallStatus}
                  causes={childData.statusCauses}
                  symptoms={childData.statusSymptoms}
                />
              )}
            </div>

            {/* Latest Metrics */}
            <div>
              <h2 className="mb-4">Hasil Pemeriksaan Terakhir</h2>
              {isLoading ? (
                <DashboardSkeleton />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <DashboardCard
                    icon={Scale}
                    label="Berat Badan"
                    value={childData.latestMetrics.weight.value}
                    unit={childData.latestMetrics.weight.unit}
                    status={childData.latestMetrics.weight.status}
                    trend={childData.latestMetrics.weight.trend}
                  />
                  <DashboardCard
                    icon={Ruler}
                    label="Tinggi Badan"
                    value={childData.latestMetrics.height.value}
                    unit={childData.latestMetrics.height.unit}
                    status={childData.latestMetrics.height.status}
                    trend={childData.latestMetrics.height.trend}
                  />
                  <DashboardCard
                    icon={Thermometer}
                    label="Suhu Tubuh"
                    value={childData.latestMetrics.temperature.value}
                    unit={childData.latestMetrics.temperature.unit}
                    status={childData.latestMetrics.temperature.status}
                    status={childData.latestMetrics.temperature.status}
                    trend={childData.latestMetrics.temperature.trend}
                  />
                  {/* <DashboardCard
                    icon={Activity}
                    label="Oksigen"
                    value={childData.latestMetrics.oxygen.value}
                    unit={childData.latestMetrics.oxygen.unit}
                    status={childData.latestMetrics.oxygen.status}
                    trend={childData.latestMetrics.oxygen.trend}
                  />
                  <DashboardCard
                    icon={Maximize2}
                    label="Lingkar Lengan"
                    value={childData.latestMetrics.armCircumference.value}
                    unit={childData.latestMetrics.armCircumference.unit}
                    status={childData.latestMetrics.armCircumference.status}
                    trend={childData.latestMetrics.armCircumference.trend}
                  />
                  <DashboardCard
                    icon={User}
                    label="Lingkar Kepala"
                    value={childData.latestMetrics.headCircumference.value}
                    unit={childData.latestMetrics.headCircumference.unit}
                    status={childData.latestMetrics.headCircumference.status}
                    trend={childData.latestMetrics.headCircumference.trend}
                  /> */}
                </div>
              )}
            </div>

            {/* Posyandu Schedule */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-5">
              <h3 className="mb-2">Jadwal Posyandu Berikutnya</h3>
              <p className="text-base text-gray-700 font-medium mb-1">
                {childData.nextPosyanduDate === "2026-01-25" ? "25 Januari 2026" : childData.nextPosyanduDate}
              </p>
              <p className="text-sm text-gray-600">
                Pukul 09:00 WIB • Jangan lupa bawa buku KIA
              </p>
            </div>

            {/* Consultation Button */}
            <ConsultationButton onClick={handleConsultation} />

            {/* Education Section */}
            <div className="pt-6 border-t-2 border-gray-200">
              <h2 className="mb-4">Edukasi Kesehatan</h2>
              <div className="grid gap-4">
                {educationArticles.map((article) => (
                  <EduCard
                    key={article.id}
                    title={article.title}
                    description={article.description}
                    category={article.category}
                    image={article.image}
                    onClick={() => handleArticleClick(article.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Growth Charts */}
            <div>
              <h2 className="mb-4">Grafik Pertumbuhan</h2>
              {!growthHistory ? (
                <div className="space-y-4">
                  <ChartSkeleton />
                  <ChartSkeleton />
                </div>
              ) : (
                <div className="space-y-4">
                  <TrendChart
                    title="Berat Badan"
                    data={growthHistory.weight}
                    color="#11998E"
                    yAxisLabel="kg"
                  />
                  <TrendChart
                    title="Tinggi Badan"
                    data={growthHistory.height}
                    color="#38EF7D"
                    yAxisLabel="cm"
                  />
                  <TrendChart
                    title="Suhu Tubuh"
                    data={growthHistory.temperature}
                    color="#F59E0B"
                    yAxisLabel="°C"
                  />
                  {/* <TrendChart
                    title="Kadar Oksigen"
                    data={growthHistory.oxygen}
                    color="#3B82F6"
                    yAxisLabel="%"
                  />
                  <TrendChart
                    title="Lingkar Lengan"
                    data={growthHistory.armCircumference}
                    color="#8B5CF6"
                    yAxisLabel="cm"
                  />
                  <TrendChart
                    title="Lingkar Kepala"
                    data={growthHistory.headCircumference}
                    color="#EC4899"
                    yAxisLabel="cm"
                  /> */}
                </div>
              )}
            </div>

            {/* Consultation History */}
            <div className="pt-6 border-t-2 border-gray-200">
              <h2 className="mb-4">Riwayat Pemeriksaan</h2>
              {consultationHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Belum ada riwayat pemeriksaan</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {consultationHistory.map((consultation) => (
                    <ConsultationRecord
                      key={consultation.id}
                      id={consultation.id}
                      place={consultation.place}
                      date={consultation.date}
                      time={consultation.time}
                      notes={consultation.notes}
                      status={consultation.status}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Notification Modal */}
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
      />
    </div>
  );
}
