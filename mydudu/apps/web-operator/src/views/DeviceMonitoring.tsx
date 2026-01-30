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

  const availableDevices = devices.filter(d => d.status === 'AVAILABLE').length;
  const waitingDevices = devices.filter(d => d.status === 'WAITING').length;
  const inactiveDevices = devices.filter(d => d.status === 'INACTIVE').length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Pemantauan Alat Dudu</h1>
          <p className="text-gray-600 text-[15px] mt-1">
            Pantau status perangkat di{' '}
            {user?.role === 'posyandu'
              ? `Desa ${user?.assignedLocation?.village}`
              : `Kecamatan ${user?.assignedLocation?.kecamatan}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Total Alat</p>
          <p className="text-[28px] font-bold text-[#11998E]">{devices.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-green-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Available</p>
          <p className="text-[28px] font-bold text-green-600">{availableDevices}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-yellow-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Waiting</p>
          <p className="text-[28px] font-bold text-yellow-600">{waitingDevices}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Inactive</p>
          <p className="text-[28px] font-bold text-gray-600">{inactiveDevices}</p>
        </div>
      </div>

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
