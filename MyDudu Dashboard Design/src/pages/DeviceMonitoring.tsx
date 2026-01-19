import { Plus, AlertTriangle } from 'lucide-react';
import { DeviceStatusList } from '../components/DeviceStatusList';
import { mockDevices } from '../data/mockData';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { filterDevicesByUserRole } from '../utils/dataFilter';

export function DeviceMonitoring() {
  const { user } = useAuth();
  const allDevices = filterDevicesByUserRole(mockDevices, user);
  const [devices, setDevices] = useState(allDevices);

  const handleRefresh = () => {
    alert('Status alat diperbarui');
    // In real implementation, this would fetch fresh data from API
  };

  const handleAddDevice = () => {
    alert('Form pendaftaran alat baru akan dibuka');
  };

  const onlineDevices = devices.filter(d => d.status === 'Online').length;
  const offlineDevices = devices.filter(d => d.status === 'Offline').length;
  const errorDevices = devices.filter(d => d.status === 'Error').length;
  const lowBatteryDevices = devices.filter(d => d.battery < 20).length;

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Pemantauan Alat Dudu</h1>
          <p className="text-gray-600 text-[15px] mt-1">
            Monitor status koneksi dan baterai semua perangkat pengukur
          </p>
          {user?.assignedLocation && user.role === 'posyandu' && (
            <p className="text-[13px] text-[#11998E] font-semibold mt-1">
              📍 Alat di {user.assignedLocation.posyanduName}, {user.assignedLocation.village}
            </p>
          )}
          {user?.assignedLocation && user.role === 'puskesmas' && (
            <p className="text-[13px] text-blue-600 font-semibold mt-1">
              📍 Menampilkan semua alat di {user.assignedLocation.kecamatan}
            </p>
          )}
        </div>
        <button
          onClick={handleAddDevice}
          className="gradient-primary text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold">Daftarkan Alat Baru</span>
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Total Alat</p>
          <p className="text-[28px] font-bold text-[#11998E]">{devices.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-green-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Online</p>
          <p className="text-[28px] font-bold text-green-600">{onlineDevices}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Offline</p>
          <p className="text-[28px] font-bold text-gray-600">{offlineDevices}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-red-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Error</p>
          <p className="text-[28px] font-bold text-red-600">{errorDevices}</p>
        </div>
      </div>

      {/* Warning Banner for Low Battery */}
      {lowBatteryDevices > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[15px] text-orange-800">
              Peringatan: {lowBatteryDevices} alat dengan baterai rendah
            </p>
            <p className="text-[14px] text-orange-700 mt-1">
              Segera lakukan pengisian daya atau ganti baterai untuk memastikan pengukuran tidak terganggu.
            </p>
          </div>
        </div>
      )}

      {/* Device List */}
      <DeviceStatusList devices={devices} onRefresh={handleRefresh} />

      {/* Help Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-[14px] text-blue-800">
          <span className="font-semibold">ℹ️ Petunjuk:</span> Status "Online" berarti alat terhubung dengan baik. 
          Jika alat menunjukkan "Offline" lebih dari 2 jam, periksa koneksi internet di Posyandu. 
          Status "Error" memerlukan pemeriksaan teknis.
        </p>
      </div>
    </div>
  );
}