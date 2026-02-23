"use client";

import { useState } from 'react';
import { FileCheck, FileText, RefreshCcw, Smartphone, Users, Clipboard, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { OverviewCard } from '../components/OverviewCard';
import { useAuth } from '../context/AuthContext';
import useSWR from 'swr';
import { fetchWithAuth } from '@/lib/api';
import { OperatorDashboardOverview, NutritionCategory } from '../types/operator';
import { ManualEntryDialog } from '../components/ManualEntryDialog';
import { RegisterParentDialog } from '../components/RegisterParentDialog';
import { RegisterChildDialog } from '../components/RegisterChildDialog';
import { ScheduleDialog } from '../components/ScheduleDialog';
import { Plus } from 'lucide-react';

const sessionStatusConfig: Record<string, { label: string; bg: string; text: string }> = {
  IN_PROGRESS: { label: 'Sedang Diukur', bg: 'bg-blue-100', text: 'text-blue-700' },
  MEASURED: { label: 'Terukur', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  CLINICAL_ACTIVE: { label: 'Kuis Berlangsung', bg: 'bg-orange-100', text: 'text-orange-700' },
  CLINICALLY_DONE: { label: 'Selesai', bg: 'bg-green-100', text: 'text-green-700' },
};

export function Dashboard() {
  const { user } = useAuth();
  const { data, mutate, isLoading } = useSWR<OperatorDashboardOverview>(
    user?.id ? `/operator/overview?userId=${user.id}` : null,
    fetchWithAuth,
  );

  const overview = data;

  const [reportPeriod, setReportPeriod] = useState('monthly');



  const handleDownloadReport = async () => {
    try {
      const query = new URLSearchParams({ period: reportPeriod, userId: user?.id?.toString() || '' }).toString();
      // Trigger download (simulated or real endpoint)
      window.open(`http://localhost:3000/reports/download?${query}`, '_blank');
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (value: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (value: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const headerDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1>Beranda</h1>
          <p className="text-gray-600 text-[15px] mt-1">
            {headerDate}
          </p>
        </div>
        {user?.role === 'posyandu' && (
          <div className="flex items-center gap-3 w-full overflow-x-auto pb-2 sm:pb-0 justify-end">
            <RegisterParentDialog onSuccess={() => mutate()} />
            <RegisterChildDialog onSuccess={() => mutate()} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <OverviewCard
          title={user?.role === 'puskesmas' ? 'Total Anak Terdata' : 'Pemeriksaan Hari Ini'}
          value={user?.role === 'puskesmas' ? overview?.counts.uniqueChildren || 0 : overview?.counts.sessionsToday || 0}
          icon={Users}
          color="#11998E"
          subtitle={user?.role === 'puskesmas' ? 'Berdasarkan pengukuran' : 'Sesi ter-record hari ini'}
        />
        <OverviewCard
          title="Total Alat Dudu"
          value={overview?.counts.devicesTotal || 0}
          icon={Smartphone}
          color="#38EF7D"
          subtitle={`${overview?.counts.devicesActive || 0} aktif`}
        />
        <OverviewCard
          title="Menunggu Validasi"
          value={overview?.counts.pendingValidations || 0}
          icon={FileCheck}
          color="#FF9800"
          subtitle="Memerlukan tinjauan"
        />
        <OverviewCard
          title="Total Anak"
          value={overview?.counts.uniqueChildren || 0}
          icon={Users}
          color="#3B82F6"
          subtitle="Data anak terdaftar"
        />
      </div>

      {
        isLoading ? (
          <div className="bg-white rounded-lg border border-gray-100 p-6 text-gray-500">
            Memuat ringkasan terbaru...
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-[18px] font-bold">Pemeriksaan Terbaru</h3>
                  <p className="text-[13px] text-gray-500 mt-1">
                    Menampilkan {overview?.recentSessions?.length || 0} sesi pemeriksaan terakhir
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {user?.role === 'posyandu' && (
                    <ManualEntryDialog
                      onSuccess={() => mutate()}
                      trigger={
                        <button className="bg-[#11998E] hover:bg-[#0e8076] text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer text-[14px]">
                          <Plus className="w-4 h-4" />
                          <span className="font-semibold">Input</span>
                        </button>
                      }
                    />
                  )}
                  {/* <Select value={reportPeriod} onValueChange={setReportPeriod}>
                    <SelectTrigger className="w-[140px] bg-gray-50 border-gray-200">
                      <SelectValue placeholder="Periode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Harian</SelectItem>
                      <SelectItem value="weekly">Mingguan</SelectItem>
                      <SelectItem value="monthly">Bulanan</SelectItem>
                      <SelectItem value="yearly">Tahunan</SelectItem>
                    </SelectContent>
                  </Select> */}
                  {/* <Button
                    variant="outline"
                    size="icon"
                    className="bg-[#11998E] text-white border-none hover:bg-[#0e8076] transition-all shadow-md active:scale-95"
                    onClick={handleDownloadReport}
                    title="Unduh Laporan"
                  >
                    <Download className="w-5 h-5" />
                  </Button> */}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-center text-[13px] font-bold text-gray-700">Anak</th>
                      <th className="px-4 py-3 text-center text-[13px] font-bold text-gray-700">Tanggal</th>
                      <th className="px-4 py-3 text-center text-[13px] font-bold text-gray-700">Alat</th>
                      <th className="px-4 py-3 text-center text-[13px] font-bold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-center text-[13px] font-bold text-gray-700">Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview?.recentSessions?.map((session) => (
                      <tr key={session.id} className="border-b border-gray-100">
                        <td className="px-4 py-3 text-[14px] font-semibold text-center">{session.child?.fullName || '-'}</td>
                        <td className="px-4 py-3 text-[14px] text-gray-600 text-center">{formatDate(session.recordedAt)}</td>
                        <td className="px-4 py-3 text-[14px] text-gray-600 text-center">
                          {session.device?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-[14px] text-center">
                          {(() => {
                            const cfg = sessionStatusConfig[session.status] ?? { label: session.status, bg: 'bg-gray-100', text: 'text-gray-700' };
                            return (
                              <span className={`px-3 py-1 rounded-full text-[12px] font-semibold ${cfg.bg} ${cfg.text}`}>
                                {cfg.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3 text-[14px] text-gray-600 text-center">
                          Berat {session.weight ?? '-'} kg, Tinggi {session.height ?? '-'} cm, Suhu {session.temperature ?? '-'} °C, Detak {session.heartRate ?? '-'} bpm, Kebisingan {session.noiseLevel ?? '-'} dB
                        </td>
                      </tr>
                    ))}
                    {!overview?.recentSessions?.length && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-[14px]">
                          Belum ada sesi pemeriksaan yang tercatat.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {user?.role === 'puskesmas' && overview?.posyanduSummary && overview.posyanduSummary.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-[18px] font-bold mb-4">Persebaran Penyakit Anak</h3>

              </div>
            )}

            {/* Agenda Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[18px] font-bold">Agenda Posyandu Mendatang</h3>
                {user?.role === 'posyandu' && (
                  <ScheduleDialog
                    onSuccess={() => mutate()}
                    trigger={
                      <button className="bg-[#11998E] hover:bg-[#0e8076] text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer text-[14px]">
                        <Plus className="w-4 h-4" />
                        <span className="font-semibold">Tambah Agenda</span>
                      </button>
                    }
                  />
                )}
              </div>
              <div className="space-y-3">
                {overview?.upcomingSchedules?.map((schedule: any) => (
                  <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[15px] font-semibold">{schedule.title}</p>
                        <p className="text-[13px] text-gray-500">
                          {schedule.posyanduName || schedule.villageName || 'Lokasi tidak diketahui'}
                          {schedule.districtName ? ` • ${schedule.districtName}` : ''}
                        </p>
                      </div>
                      <span className="text-[13px] font-semibold text-[#11998E]">
                        {formatDate(schedule.eventDate)}
                      </span>
                    </div>
                    {schedule.description && (
                      <p className="text-[13px] text-gray-600 mt-2">{schedule.description}</p>
                    )}
                    {(schedule.startTime || schedule.endTime) && (
                      <p className="text-[12px] text-gray-500 mt-1">
                        {schedule.startTime ? formatTime(schedule.startTime) : ''} - {schedule.endTime ? formatTime(schedule.endTime) : ''}
                      </p>
                    )}
                  </div>
                ))}
                {(!overview?.upcomingSchedules || overview.upcomingSchedules.length === 0) && (
                  <div className="text-center py-6 text-gray-500 text-[14px]">
                    Tidak ada agenda posyandu mendatang.
                  </div>
                )}
              </div>
            </div>
          </>
        )
      }
    </div>
  );
}
