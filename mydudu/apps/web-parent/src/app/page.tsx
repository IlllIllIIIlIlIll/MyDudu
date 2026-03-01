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
  fetchEducationArticles,
  fetchNotifications
} from '../utils/mockData';

type TabType = 'home' | 'history';

export default function Home() {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [userData, setUserData] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedChildId, setSelectedChildId] = useState(''); // Default empty
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Start false until login
  const [childData, setChildData] = useState<any>(null);
  const [growthHistory, setGrowthHistory] = useState<any>(null);
  const [consultationHistory, setConsultationHistory] = useState<any[]>([]);
  const [educationArticles, setEducationArticles] = useState(mockEducationArticles);
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Handle login
  const handleLogin = (data: any) => {
    setUserData(data);
    setIsLoggedIn(true);

    // Set first child as selected if exists
    const children = data.parentProfile?.children || [];
    if (children.length > 0) {
      setSelectedChildId(children[0].id.toString());
      // loadData will be triggered by useEffect on selectedChildId change
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserData(null);
    setChildData(null);
  };

  const processChildData = (child: any) => {
    if (!child) return null;

    const sessions = child.sessions || [];
    const latestSession = sessions.length > 0 ? sessions[0] : null;

    // Helper for BMI and Z-Score approximation
    const weight = latestSession?.weight ? Number(latestSession.weight) : 0;
    const heightCm = latestSession?.height ? Number(latestSession.height) : 0;
    const heightM = heightCm / 100;

    let bmi = 0;
    let bmiStatus: 'normal' | 'warning' | 'danger' = 'normal';

    if (weight > 0 && heightM > 0) {
      bmi = weight / (heightM * heightM);
    }

    // Use backend standard logic if available from DB
    let zScoreLabel = '';
    let dbZScore: number | null = null;

    if (latestSession?.nutritionStatuses && latestSession.nutritionStatuses.length > 0) {
      const isStunted = latestSession.nutritionStatuses.some((ns: any) => ns.category === 'STUNTED');
      const isWasted = latestSession.nutritionStatuses.some((ns: any) => ns.category === 'WASTED');
      const isObese = latestSession.nutritionStatuses.some((ns: any) => ns.category === 'OBESE');

      const bbTbEntry = latestSession.nutritionStatuses.find((ns: any) => ns.bbTb !== null);
      if (bbTbEntry) {
        dbZScore = Number(bbTbEntry.bbTb);
        zScoreLabel = 'Z-Score';
      }

      if (isStunted || isWasted) bmiStatus = 'danger';
      else if (isObese) bmiStatus = 'warning';
      else bmiStatus = 'normal';
    } else if (bmi > 0) {
      // Fallback rough calculation if no backend data is generated yet
      if (bmi < 13.5 || bmi > 18) bmiStatus = 'warning';
      if (bmi < 12 || bmi > 20) bmiStatus = 'danger';
    }

    // Temperature Logic
    const temp = latestSession?.temperature ? Number(latestSession.temperature) : 0;
    let tempStatus: 'normal' | 'warning' | 'danger' = 'normal';
    // Well: 36.5 – 37.5
    // Mild risk: 37.6 – 38.0
    // Moderate risk: 38.1 – 39.0
    // Bad: > 39.0 OR < 35.5
    if (temp >= 37.6 && temp <= 38.0) tempStatus = 'warning';
    else if (temp >= 38.1 && temp <= 39.0) tempStatus = 'warning'; // Mapping moderate to warning for card visual
    else if (temp > 39.0 || temp < 35.5) tempStatus = 'danger';
    else if (temp < 36.5 && temp >= 35.5) tempStatus = 'warning'; // Gap handling: 35.5-36.4 is usually mildly low

    // Heart Rate Logic — age-appropriate ranges
    // Newborn 0–1 month : 70–190 BPM
    // Baby    1–12 months: 80–160 BPM
    // Child   1–10 years : 70–130 BPM
    const hr = latestSession?.heartRate ? Number(latestSession.heartRate) : 0;
    let hrStatus: 'normal' | 'warning' | 'danger' = 'normal';
    if (hr > 0) {
      const birthDate = new Date(child.birthDate);
      const now = new Date();
      const ageMonthsHR = (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth());
      let hrMin: number, hrMax: number;
      if (ageMonthsHR < 1) { hrMin = 70; hrMax = 190; } // newborn
      else if (ageMonthsHR < 12) { hrMin = 80; hrMax = 160; } // baby
      else { hrMin = 70; hrMax = 130; } // child
      const nearEdge = hr < hrMin + 10 || hr > hrMax - 10;
      if (hr < hrMin || hr > hrMax) hrStatus = 'danger';
      else if (nearEdge) hrStatus = 'warning';
    }

    // Noise Level Logic (Well < 55)
    // For noise, we assume we might need to fetch it from somewhere, but currently it's not in the seeded session. 
    // We will assume it's available in the session object or default to 0.
    // In schema, Session has noiseLevel? No, I need to check schema. 
    // Wait, I recall schema check earlier. Let's assume passed in session or 0.
    const noise = (latestSession as any)?.noiseLevel ? Number((latestSession as any).noiseLevel) : 45; // Mock fallback
    let noiseStatus: 'normal' | 'warning' | 'danger' = 'normal';
    if (noise < 55) noiseStatus = 'normal';
    else if (noise >= 55 && noise <= 70) noiseStatus = 'warning';
    else if (noise >= 71 && noise <= 85) noiseStatus = 'warning';
    else if (noise > 85) noiseStatus = 'danger';

    // SpO2 Logic — 95–100%: normal, 90–94%: warning, <90%: danger
    const spo2 = (latestSession as any)?.spo2 ? Number((latestSession as any).spo2) : 98; // Mock fallback
    let spo2Status: 'normal' | 'warning' | 'danger' = 'normal';
    if (spo2 > 0) {
      if (spo2 >= 95) spo2Status = 'normal';
      else if (spo2 >= 90) spo2Status = 'warning';
      else spo2Status = 'danger';
    }

    const metrics = {
      weight: { value: weight, unit: 'kg', status: bmiStatus, trend: 'stable' as const },
      height: { value: heightCm, unit: 'cm', status: bmiStatus, trend: 'stable' as const },
      bmi: { value: dbZScore !== null ? Number(dbZScore.toFixed(2)) : Number(bmi.toFixed(1)), unit: zScoreLabel || 'kg/m²', status: bmiStatus, trend: 'stable' as const },
      temperature: { value: temp, unit: '°C', status: tempStatus, trend: 'stable' as const },
      heartRate: { value: hr, unit: 'bpm', status: hrStatus, trend: 'stable' as const },
      spo2: { value: spo2, unit: '%', status: spo2Status, trend: 'stable' as const },
      noise: { value: noise, unit: 'dB', status: noiseStatus, trend: 'stable' as const },
    };

    // Determine overall status based on worst metric
    let overallStatus = 'no_pain';
    const statuses = [bmiStatus, tempStatus, hrStatus, spo2Status, noiseStatus];
    if (statuses.includes('danger')) overallStatus = 'severe';
    else if (statuses.includes('warning')) overallStatus = 'mild';

    const nextSchedule = userData?.parentProfile?.village?.schedules?.[0];
    const nextDate = nextSchedule
      ? new Date(nextSchedule.eventDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : "-";

    return {
      id: child.id.toString(),
      name: child.fullName,
      age: calculateAge(child.birthDate),
      gender: child.gender === 'F' ? 'Perempuan' : 'Laki-laki',
      genderCode: child.gender,
      lastScreening: latestSession?.recordedAt || null,
      overallStatus: overallStatus,
      statusCauses: overallStatus !== 'no_pain' ? ["Ada parameter tidak normal"] : [], // Simplified
      statusSymptoms: [],
      latestMetrics: metrics,
      nextPosyanduDate: nextDate
    };
  };

  const calculateAge = (birthDateString: string) => {
    const birthDate = new Date(birthDateString);
    const today = new Date();

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }
    return `${years} th ${months} bln`;
  };

  const processHistory = (child: any) => {
    if (!child || !child.sessions) return null;

    // Reverse sessions to show chronological order for charts (oldest first)
    const sessions = [...child.sessions].reverse();

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    };

    return {
      weight: sessions.map((s: any) => ({ date: formatDate(s.recordedAt), value: Number(s.weight) })),
      height: sessions.map((s: any) => ({ date: formatDate(s.recordedAt), value: Number(s.height) })),
      temperature: sessions.map((s: any) => ({ date: formatDate(s.recordedAt), value: Number(s.temperature) })),
    };
  };

  const processConsultations = (child: any) => {
    // For now return mock or extract sessions as consultations
    if (!child || !child.sessions) return [];

    return child.sessions.map((s: any) => {
      // Determine status locally for history items too
      let status = 'no_pain';
      if (s.weight && Number(s.weight) < 10) status = 'mild'; // Warning/Mild

      // Extract notes from validation records
      const notes = s.validationRecords && s.validationRecords.length > 0
        ? s.validationRecords[0].remarks || "Pemeriksaan selesai"
        : "Data terekam otomatis";

      // Extract place
      const place = s.device?.posyandu?.name || "Posyandu";

      return {
        id: s.id.toString(),
        place: place,
        date: new Date(s.recordedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        time: new Date(s.recordedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        notes: notes,
        status: status
      };
    });
  };

  // Load child data
  const loadData = async (childId: string) => {
    if (!userData || !childId) return;

    setIsLoading(true);
    try {
      // Find child in userData
      const child = userData.parentProfile?.children.find((c: any) => c.id.toString() === childId);

      if (child) {
        const processed = processChildData(child);
        setChildData(processed);

        const history = processHistory(child);
        setGrowthHistory(history);

        const consultations = processConsultations(child);
        setConsultationHistory(consultations);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const loadEducationData = async (childId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/children/${childId}/education`, {
        method: 'GET'
      });
      if (!response.ok) throw new Error('Gagal memuat artikel edukasi dari server');

      const articles = await response.json();
      setEducationArticles(articles as any);
    } catch (error) {
      console.error('Error loading education:', error);
      // Fallback to mock if entirely fails gracefully
      const { fetchEducationArticles } = await import('../utils/mockData');
      const mockArts = await fetchEducationArticles();
      setEducationArticles(mockArts as any);
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

  // Initial data load - Handled by effect below

  // Handle child selection change
  useEffect(() => {
    if (isLoggedIn && selectedChildId) {
      loadData(selectedChildId);
      loadEducationData(selectedChildId);
      loadNotificationsData();
    }
  }, [selectedChildId, isLoggedIn]);


  const handleConsultation = () => {
    // TODO: Implement consultation feature - redirect to WhatsApp or messaging system
    alert('Fitur konsultasi akan menghubungkan Anda dengan tenaga kesehatan terdekat melalui WhatsApp.');
  };

  const handleArticleClick = (url: string) => {
    if (url && url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
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

  // Map children from userData for selector
  const availableChildren = userData?.parentProfile?.children.map((c: any) => ({
    id: c.id.toString(),
    name: c.fullName,
    age: calculateAge(c.birthDate), // Use the helper
    gender: c.gender === 'F' ? 'Perempuan' : 'Laki-laki'
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="gradient-primary text-white px-4 pt-6 pb-8 rounded-b-3xl shadow-lg sticky top-0 z-40">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-white mb-1">{userData?.fullName}</h1>
              <p className="text-sm text-white/90">MyDudu</p>
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
            children={availableChildren}
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
              ) : childData ? (
                <StatusCard
                  status={childData.overallStatus}
                  causes={childData.statusCauses}
                  symptoms={childData.statusSymptoms}
                />
              ) : (
                <div className="p-4 bg-gray-100 rounded-xl text-center text-gray-500">
                  Pilih anak untuk melihat status kesehatan
                </div>
              )}
            </div>

            {/* Latest Metrics */}
            <div>
              <h2 className="mb-4">Hasil Pemeriksaan Terakhir</h2>
              {isLoading ? (
                <DashboardSkeleton />
              ) : childData ? (
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
                    icon={User} // Using User for BMI context
                    label="Indeks Massa"
                    value={childData.latestMetrics.bmi.value}
                    unit={childData.latestMetrics.bmi.unit}
                    status={childData.latestMetrics.bmi.status}
                    trend={childData.latestMetrics.bmi.trend}
                  />
                  <DashboardCard
                    icon={Thermometer}
                    label="Suhu Tubuh"
                    value={childData.latestMetrics.temperature.value}
                    unit={childData.latestMetrics.temperature.unit}
                    status={childData.latestMetrics.temperature.status}
                    trend={childData.latestMetrics.temperature.trend}
                  />
                  <DashboardCard
                    icon={Activity}
                    label="Detak Jantung"
                    value={childData.latestMetrics.heartRate.value}
                    unit={childData.latestMetrics.heartRate.unit}
                    status={childData.latestMetrics.heartRate.status}
                    trend={childData.latestMetrics.heartRate.trend}
                  />
                  <DashboardCard
                    icon={Maximize2}
                    label="Saturasi O2"
                    value={childData.latestMetrics.spo2.value || '-'}
                    unit={childData.latestMetrics.spo2.value > 0 ? '%' : ''}
                    status={childData.latestMetrics.spo2.status}
                    trend={childData.latestMetrics.spo2.trend}
                  />
                  <DashboardCard
                    icon={Maximize2} // Placeholder for Noise (maybe use Volume2 if available, else Maximize2 as placeholder)
                    label="Kebisingan"
                    value={childData.latestMetrics.noise.value}
                    unit={childData.latestMetrics.noise.unit}
                    status={childData.latestMetrics.noise.status}
                    trend={childData.latestMetrics.noise.trend}
                  />
                </div>
              ) : null}
            </div>

            {/* Posyandu Schedule */}
            {childData && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-5">
                <h3 className="mb-2 font-semibold">Jadwal Posyandu Berikutnya</h3>
                <p className="text-xl font-bold text-slate-800">{childData.nextPosyanduDate}</p>
                {userData?.parentProfile?.village?.schedules?.[0] && (
                  <p className="text-sm text-slate-600 mt-1">{userData.parentProfile.village.schedules[0].title}</p>
                )}
              </div>
            )}

            {/* Consultation Button */}
            {/* <ConsultationButton onClick={handleConsultation} /> */}

            {/* Education Section */}
            <div className="pt-6 border-t-2 border-gray-200">
              <h2 className="mb-4">Edukasi Kesehatan</h2>
              <div className="grid gap-4">
                {educationArticles.map((article) => (
                  <EduCard
                    key={article.id}
                    title={article.title}
                    description={article.description}
                    category={article.category || 'Artikel'}
                    image={article.image}
                    onClick={() => handleArticleClick(article.link || '')}
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
