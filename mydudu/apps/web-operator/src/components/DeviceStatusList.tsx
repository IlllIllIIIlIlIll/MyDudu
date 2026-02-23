import { CheckCircle2, XCircle, Search, Filter, X, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { OperatorDeviceRecord } from '../types/operator';
import { useAuth } from '../context/AuthContext';
import { Badge } from './ui/badge';

interface DeviceStatusListProps {
  devices: OperatorDeviceRecord[];
}

export function DeviceStatusList({ devices }: DeviceStatusListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'AVAILABLE' | 'WAITING' | 'INACTIVE' | ''>('');
  const [selectedDevice, setSelectedDevice] = useState<OperatorDeviceRecord | null>(null);

  const { user } = useAuth();

  const filteredDevices = useMemo(() => {
    return devices
      .filter(device => device.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(device => {
        if (!filterStatus) return true;
        return device.status === filterStatus;
      });
  }, [devices, searchTerm, filterStatus]);

  const handleConnect = (device: OperatorDeviceRecord) => {
    // Determine what "Connect" means. For now, we mimic selecting it or just alerting.
    // Given the previous "Detail" button opened a modal, maybe we keep that but change the button text?
    // User said: "Change the aksi that is previously detail button, into Connect button (only can be pressed when the status is available)."
    // "Available is when the device is connected... can be pressed connect."
    // Maybe connecting sets the device as "Waiting"? Or just "Connects" the operator to it?
    // Without backend logic for connection, I will just open the detail modal BUT only if available. 
    // Wait, the prompt implies "Connect" does something. "will be turned to available if the server has received the measurement payload".
    // So "Waiting" is when being used.
    // If I press Connect, maybe it should transition to Waiting?
    // Since I don't have that logic, I will just display the button.
    // I will assume for now it opens the details/Connect modal.
    setSelectedDevice(device);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-[20px] font-bold">Daftar Alat Dudu</h3>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
              placeholder="Cari alat..."
            />
            <Search className="absolute right-3 top-3 w-4 h-4 text-gray-500" />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="WAITING">Waiting</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <Filter className="absolute right-3 top-3 w-4 h-4 text-gray-500" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Kode Alat</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Nama Alat</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Status</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Desa</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.map((device) => {
              const isAvailable = device.status === 'AVAILABLE';
              return (
                <tr key={device.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-[14px] text-gray-600">{device.deviceUuid}</td>
                  <td className="px-6 py-4 font-semibold text-[15px]">{device.name}</td>
                  <td className="px-6 py-4">
                    <Badge variant={device.status === 'AVAILABLE' ? "default" : "secondary"}
                      className={
                        device.status === 'AVAILABLE' ? "bg-green-100 text-green-700 hover:bg-green-100" :
                          device.status === 'WAITING' ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" :
                            "bg-gray-100 text-gray-600 hover:bg-gray-100"
                      }>
                      {device.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-[15px] text-gray-600">{device.villageName || '-'}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleConnect(device)}
                      disabled={!isAvailable}
                      className={`px-4 py-2 text-[14px] font-semibold rounded-lg transition-colors flex items-center gap-2 ${isAvailable
                        ? "bg-[#11998E] text-white hover:opacity-90"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                    >
                      <Zap className="w-4 h-4" />
                      Connect
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selectedDevice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <div>
                <h4 className="text-[18px] font-bold">{selectedDevice.name}</h4>
                <p className="text-[13px] text-gray-500">{selectedDevice.deviceUuid}</p>
              </div>
              <button
                onClick={() => setSelectedDevice(null)}
                className="p-2 rounded-lg hover:bg-gray-100"
                title="Tutup"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-[14px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500">Status</p>
                  <p className="font-semibold">{selectedDevice.status}</p>
                </div>

                <div>
                  <p className="text-gray-500">Desa</p>
                  <p className="font-semibold">{selectedDevice.villageName || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Kecamatan</p>
                  <p className="font-semibold">{selectedDevice.districtName || '-'}</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg text-blue-800">
                <p className="font-semibold">Device Connection</p>
                <p className="text-sm mt-1">
                  {selectedDevice.status === 'AVAILABLE'
                    ? "Device is available to connect."
                    : `Device is currently ${selectedDevice.status}.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
