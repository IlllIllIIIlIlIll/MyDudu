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
import { fetchWithAuth } from '../lib/api';
import { OperatorDashboardOverview, NutritionCategory } from '../types/operator';

const nutritionLabels: Record<NutritionCategory, string> = {
  NORMAL: 'Normal',
  STUNTED: 'Stunting',
  WASTED: 'Gizi Kurang',
  OBESE: 'Obesitas',
};

export function Dashboard() {
  const { user } = useAuth();
  const { data, mutate, isLoading } = useSWR<OperatorDashboardOverview>(
    user?.id ? `/operator/overview?userId=${user.id}` : null,
    fetchWithAuth,
  );

  const overview = data;

  const [manualForm, setManualForm] = useState({
    motherName: '',
    childName: '',
    weight: '',
    height: '',
    temperature: '',
  });
  const [reportPeriod, setReportPeriod] = useState('monthly');

  const handleManualSubmit = async () => {
    if (!manualForm.motherName || !manualForm.childName) {
      alert("Nama Ibu dan Anak wajib diisi");
      return;
    }
    try {
      await fetchWithAuth('/devices/manual-telemetry', {
        method: 'POST',
        body: JSON.stringify({
          motherName: manualForm.motherName,
          childName: manualForm.childName,
          weight: manualForm.weight ? parseFloat(manualForm.weight) : undefined,
          height: manualForm.height ? parseFloat(manualForm.height) : undefined,
          temperature: manualForm.temperature ? parseFloat(manualForm.temperature) : undefined,
        })
      });
      alert("Data berhasil dikirim!");
      setManualForm({ motherName: '', childName: '', weight: '', height: '', temperature: '' });
      mutate();
    } catch (e: any) {
      alert("Gagal mengirim data: " + e.message);
    }
  };

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
          <h1>Beranda Dashboard</h1>
          <p className="text-gray-600 text-[15px] mt-1">
            Ringkasan data kesehatan anak - {headerDate}
          </p>
          {user?.assignedLocation && user.role === 'posyandu' && (
            <p className="text-[13px] text-[#11998E] font-semibold mt-1">
              {user.assignedLocation.posyanduName}, {user.assignedLocation.village}
            </p>
          )}
          {user?.assignedLocation && user.role === 'puskesmas' && (
            <p className="text-[13px] text-blue-600 font-semibold mt-1">
              {user.assignedLocation.puskesmasName} • {user.assignedLocation.kecamatan}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Select value={reportPeriod} onValueChange={setReportPeriod}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Harian</SelectItem>
              <SelectItem value="weekly">Mingguan</SelectItem>
              <SelectItem value="monthly">Bulanan</SelectItem>
              <SelectItem value="q1">Kuartal 1</SelectItem>
              <SelectItem value="q2">Kuartal 2</SelectItem>
              <SelectItem value="q3">Kuartal 3</SelectItem>
              <SelectItem value="q4">Kuartal 4</SelectItem>
              <SelectItem value="yearly">Tahunan</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center gap-2" onClick={handleDownloadReport}>
            <Download className="w-4 h-4" />
            Unduh
          </Button>
        </div>
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
          title="Laporan Bulan Ini"
          value={overview?.counts.reportsThisMonth || 0}
          icon={FileText}
          color="#3B82F6"
          subtitle="Dokumen dihasilkan"
        />
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-100 p-6 text-gray-500">
          Memuat ringkasan terbaru...
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-bold">Pemeriksaan Terbaru</h3>
              <span className="text-[13px] text-gray-500">
                {overview?.recentSessions?.length || 0} sesi terbaru
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-[13px] font-bold text-gray-700">Anak</th>
                    <th className="px-4 py-3 text-left text-[13px] font-bold text-gray-700">Tanggal</th>
                    <th className="px-4 py-3 text-left text-[13px] font-bold text-gray-700">Alat</th>
                    <th className="px-4 py-3 text-left text-[13px] font-bold text-gray-700">Status Gizi</th>
                    <th className="px-4 py-3 text-left text-[13px] font-bold text-gray-700">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {overview?.recentSessions?.map((session) => (
                    <tr key={session.id} className="border-b border-gray-100">
                      <td className="px-4 py-3 text-[14px] font-semibold">{session.child?.fullName || '-'}</td>
                      <td className="px-4 py-3 text-[14px] text-gray-600">{formatDate(session.recordedAt)}</td>
                      <td className="px-4 py-3 text-[14px] text-gray-600">
                        {session.device?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-[14px]">
                        <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-gray-100 text-gray-700">
                          {session.nutritionCategory ? nutritionLabels[session.nutritionCategory] : 'Belum Dinilai'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[14px] text-gray-600">
                        Berat {session.weight ?? '-'} kg, Tinggi {session.height ?? '-'} cm
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
              <h3 className="text-[18px] font-bold mb-4">Ringkasan per Posyandu</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overview.posyanduSummary.map((item) => (
                  <div key={item.posyanduId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-[15px] font-semibold">{item.posyanduName}</h4>
                        <p className="text-[12px] text-gray-500">{item.villageName || '-'}</p>
                      </div>
                      <span className="text-[20px] font-bold text-[#11998E]">{item.childrenCount}</span>
                    </div>
                    <div className="mt-3 text-[13px] text-gray-600 space-y-1">
                      <p>Alat: {item.devicesCount} (aktif {item.activeDevicesCount})</p>
                      <p>Normal: {item.nutrition.NORMAL}</p>
                      <p>Stunting: {item.nutrition.STUNTED}</p>
                      <p>Gizi Kurang: {item.nutrition.WASTED}</p>
                      <p>Obesitas: {item.nutrition.OBESE}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Agenda Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-[18px] font-bold mb-4">Agenda Posyandu Mendatang (Februari 2026)</h3>
              <div className="space-y-3">
                {/* Hardcoded Example for Feb 2026 as requested */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[15px] font-semibold">Posyandu Rutin (Imunisasi)</p>
                      <p className="text-[13px] text-gray-500">
                        Posyandu Melati â€¢ Kelurahan Sehat
                      </p>
                    </div>
                    <span className="text-[13px] font-semibold text-[#11998E]">
                      10 Feb 2026
                    </span>
                  </div>
                  <p className="text-[13px] text-gray-600 mt-2">Pemeriksaan rutin dan imunisasi dasar lengkap.</p>
                  <p className="text-[12px] text-gray-500 mt-1">08:00 - 12:00</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[15px] font-semibold">Penyuluhan Gizi Anak</p>
                      <p className="text-[13px] text-gray-500">
                        Balai Desa â€¢ Kecamatan Contoh
                      </p>
                    </div>
                    <span className="text-[13px] font-semibold text-[#11998E]">
                      24 Feb 2026
                    </span>
                  </div>
                  <p className="text-[13px] text-gray-600 mt-2">Edukasi gizi seimbang untuk balita dan ibu hamil.</p>
                  <p className="text-[12px] text-gray-500 mt-1">09:00 - 11:30</p>
                </div>
              </div>
            </div>

            {/* Manual Entry Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-[18px] font-bold mb-4 flex items-center gap-2">
                <Clipboard className="w-5 h-5 text-[#11998E]" />
                Input Pemeriksaan Manual
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nama Ibu</Label>
                    <Input placeholder="Cari nama ibu..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Anak</Label>
                    <Input placeholder="Nama anak..." />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Berat (kg)</Label>
                    <Input type="number" placeholder="0.0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tinggi (cm)</Label>
                    <Input type="number" placeholder="0.0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Suhu (Â°C)</Label>
                    <Input type="number" placeholder="36.5" />
                  </div>
                </div>
                <Button className="w-full bg-[#11998E] hover:bg-[#0e8076]">
                  Kirim Data Pemeriksaan
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
