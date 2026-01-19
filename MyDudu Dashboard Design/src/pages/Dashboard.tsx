import { Users, Smartphone, FileCheck, FileText, Download, MapPin } from 'lucide-react';
import { OverviewCard } from '../components/OverviewCard';
import { ReportChart } from '../components/ReportChart';
import { mockStats, monthlyTrends, caseDistribution, villageData, mockChildren, mockDevices } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { filterChildrenByUserRole, filterDevicesByUserRole } from '../utils/dataFilter';

export function Dashboard() {
  const { user } = useAuth();
  const filteredChildren = filterChildrenByUserRole(mockChildren, user);
  const filteredDevices = filterDevicesByUserRole(mockDevices, user);
  
  const handleDownloadReport = () => {
    alert('Laporan bulanan akan diunduh dalam format PDF');
  };

  // Group data by posyandu for Puskesmas view
  const getDataByPosyandu = () => {
    if (user?.role !== 'puskesmas') return [];
    
    const posyandus = Array.from(new Set(filteredChildren.map(c => c.posyandu)));
    return posyandus.map(posyandu => {
      const children = filteredChildren.filter(c => c.posyandu === posyandu);
      const devices = filteredDevices.filter(d => d.posyandu === posyandu);
      const village = children[0]?.village || '';
      
      return {
        posyandu,
        village,
        childrenCount: children.length,
        devicesCount: devices.length,
        normalCount: children.filter(c => c.nutritionStatus === 'Normal').length,
        stuntingCount: children.filter(c => c.nutritionStatus === 'Stunting').length,
        undernourishedCount: children.filter(c => c.nutritionStatus === 'Gizi Kurang').length,
      };
    });
  };

  const posyanduData = getDataByPosyandu();

  return (
    <div className="p-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Beranda Dashboard</h1>
          <p className="text-gray-600 text-[15px] mt-1">
            Ringkasan data kesehatan anak - Senin, 19 Januari 2026
          </p>
          {user?.assignedLocation && user.role === 'posyandu' && (
            <p className="text-[13px] text-[#11998E] font-semibold mt-1">
              📍 {user.assignedLocation.posyanduName}, {user.assignedLocation.village}
            </p>
          )}
          {user?.assignedLocation && user.role === 'puskesmas' && (
            <p className="text-[13px] text-blue-600 font-semibold mt-1">
              📍 {user.assignedLocation.puskesmasName} • Mengelola {posyanduData.length} Posyandu di {user.assignedLocation.kecamatan}
            </p>
          )}
        </div>
        <button
          onClick={handleDownloadReport}
          className="gradient-primary text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Download className="w-5 h-5" />
          <span className="font-semibold">Unduh Laporan Bulanan</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <OverviewCard
          title={user?.role === 'puskesmas' ? 'Total Anak Terdaftar' : 'Anak Diperiksa Hari Ini'}
          value={user?.role === 'puskesmas' ? filteredChildren.length : mockStats.childrenMeasuredToday}
          icon={Users}
          color="#11998E"
          subtitle={user?.role === 'puskesmas' ? `Di ${user.assignedLocation?.kecamatan}` : 'Data terbaru'}
        />
        <OverviewCard
          title={user?.role === 'puskesmas' ? 'Total Alat Dudu' : 'Alat Dudu Aktif'}
          value={user?.role === 'puskesmas' ? filteredDevices.length : mockStats.devicesOnline}
          icon={Smartphone}
          color="#38EF7D"
          subtitle={user?.role === 'puskesmas' ? `${filteredDevices.filter(d => d.status === 'Online').length} online` : 'Dari 10 total alat'}
        />
        <OverviewCard
          title="Menunggu Validasi Dokter"
          value={mockStats.pendingReviews}
          icon={FileCheck}
          color="#FF9800"
          subtitle="Perlu persetujuan"
        />
        <OverviewCard
          title="Laporan Dibuat Bulan Ini"
          value={mockStats.reportsGenerated}
          icon={FileText}
          color="#3B82F6"
          subtitle="Januari 2026"
        />
      </div>

      {/* Puskesmas-specific: Overview by Posyandu */}
      {user?.role === 'puskesmas' && posyanduData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="w-5 h-5 text-[#11998E]" />
            <h3 className="text-[18px] font-bold">Ringkasan Data per Posyandu</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posyanduData.map((data, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-[16px] text-gray-800">{data.posyandu}</h4>
                    <p className="text-[13px] text-gray-500">{data.village}</p>
                  </div>
                  <span className="text-[24px] font-bold text-[#11998E]">{data.childrenCount}</span>
                </div>
                <div className="space-y-2 text-[14px]">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status Normal:</span>
                    <span className="font-semibold text-green-600">{data.normalCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stunting:</span>
                    <span className="font-semibold text-red-600">{data.stuntingCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gizi Kurang:</span>
                    <span className="font-semibold text-orange-600">{data.undernourishedCount}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Alat Dudu:</span>
                    <span className="font-semibold text-blue-600">{data.devicesCount} unit</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportChart
          type="bar"
          data={monthlyTrends}
          title="Tren Status Gizi 7 Bulan Terakhir"
        />
        <ReportChart
          type="pie"
          data={caseDistribution}
          title="Distribusi Kasus Januari 2026"
        />
      </div>

      {/* Village Statistics - only for Puskesmas */}
      {user?.role === 'puskesmas' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-[18px] font-bold mb-6">Jumlah Anak per Desa di {user.assignedLocation?.kecamatan}</h3>
          <div className="space-y-4">
            {villageData.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[15px] font-semibold">{item.village}</span>
                  <span className="text-[15px] font-bold text-[#11998E]">{item.children} anak</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full gradient-primary rounded-full transition-all"
                    style={{ width: `${(item.children / 50) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Information Banner */}
      <div className="bg-gradient-to-r from-[#11998E] to-[#38EF7D] rounded-xl p-6 text-white">
        <h3 className="text-[20px] font-bold mb-2">💡 Tips Penggunaan Dashboard</h3>
        <ul className="space-y-2 text-[15px]">
          {user?.role === 'posyandu' && (
            <>
              <li>• Data yang ditampilkan hanya untuk {user.assignedLocation?.posyanduName}</li>
              <li>• Klik ikon notifikasi untuk melihat pembaruan terbaru dari sistem</li>
              <li>• Gunakan menu "Validasi Dokter" untuk memeriksa pemeriksaan yang perlu persetujuan</li>
            </>
          )}
          {user?.role === 'puskesmas' && (
            <>
              <li>• Anda dapat melihat data dari semua posyandu di {user.assignedLocation?.kecamatan}</li>
              <li>• Gunakan menu "Validasi Dokter" untuk meninjau dan menyetujui hasil pemeriksaan</li>
              <li>• Unduh laporan bulanan untuk diserahkan ke Dinas Kesehatan</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}