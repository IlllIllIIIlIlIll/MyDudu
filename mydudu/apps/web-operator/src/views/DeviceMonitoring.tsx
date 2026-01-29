import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { DeviceStatusList } from '../components/DeviceStatusList';
import { useAuth } from '../context/AuthContext';
import useSWR from 'swr';
import { fetchWithAuth } from '../lib/api';
import { OperatorDeviceRecord } from '../types/operator';

export function DeviceMonitoring() {
  const { user } = useAuth();
  const { data, mutate, isLoading } = useSWR<OperatorDeviceRecord[]>(
    user?.id ? `/operator/devices?userId=${user.id}` : null,
    fetchWithAuth,
  );

  const devices = data || [];

  const activeDevices = devices.filter(d => d.isActive).length;
  const inactiveDevices = devices.filter(d => !d.isActive).length;
  const staleDevices = devices.filter(d => {
    if (!d.lastSessionAt) return true;
    const last = new Date(d.lastSessionAt);
    if (Number.isNaN(last.getTime())) return true;
    const days = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
    return days > 7;
  }).length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Pemantauan Alat Dudu</h1>
          <p className="text-gray-600 text-[15px] mt-1">
            Pantau status aktivasi dan sesi pengukuran terakhir dari setiap perangkat
          </p>
          {user?.assignedLocation && user.role === 'posyandu' && (
            <p className="text-[13px] text-[#11998E] font-semibold mt-1">
              ðŸ“ Alat di {user.assignedLocation.posyanduName}, {user.assignedLocation.village}
            </p>
          )}
          {user?.assignedLocation && user.role === 'puskesmas' && (
            <p className="text-[13px] text-blue-600 font-semibold mt-1">
              ðŸ“ Menampilkan semua alat di {user.assignedLocation.kecamatan}
            </p>
          )}
        </div>
        <button
          onClick={() => mutate()}
          className="border border-[#11998E] text-[#11998E] px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-[#11998E] hover:text-white transition-colors"
        >
          <RefreshCcw className="w-5 h-5" />
          <span className="font-semibold">Perbarui Data</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Total Alat</p>
          <p className="text-[28px] font-bold text-[#11998E]">{devices.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-green-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Aktif</p>
          <p className="text-[28px] font-bold text-green-600">{activeDevices}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Tidak Aktif</p>
          <p className="text-[28px] font-bold text-gray-600">{inactiveDevices}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Belum Kirim Data</p>
          <p className="text-[28px] font-bold text-orange-600">{staleDevices}</p>
        </div>
      </div>

      {inactiveDevices > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[15px] text-orange-800">
              {inactiveDevices} alat tidak aktif
            </p>
            <p className="text-[14px] text-orange-700 mt-1">
              Periksa status aktivasi perangkat atau hubungi petugas teknis jika diperlukan.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-100 p-6 text-gray-500">
          Memuat data perangkat...
        </div>
      ) : (
        <DeviceStatusList devices={devices} />
      )}
    </div>
  );
}
