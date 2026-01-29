import { CheckCircle2, XCircle, Search, Filter, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { OperatorDeviceRecord } from '../types/operator';
import { useAuth } from '../context/AuthContext';

interface DeviceStatusListProps {
  devices: OperatorDeviceRecord[];
}

export function DeviceStatusList({ devices }: DeviceStatusListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'active' | 'inactive' | ''>('');
  const [selectedDevice, setSelectedDevice] = useState<OperatorDeviceRecord | null>(null);

  const { user } = useAuth();

  const filteredDevices = useMemo(() => {
    return devices
      .filter(device => device.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(device => {
        if (!filterStatus) return true;
        return filterStatus === 'active' ? device.isActive : !device.isActive;
      });
  }, [devices, searchTerm, filterStatus]);

  const formatDateTime = (value: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
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
              {user?.role === 'puskesmas' && (
                <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Posyandu</th>
              )}
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Desa</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Sesi Terakhir</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Total Sesi</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.map((device) => (
              <tr key={device.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-mono text-[14px] text-gray-600">{device.deviceUuid}</td>
                <td className="px-6 py-4 font-semibold text-[15px]">{device.name}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {device.isActive ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-[13px] font-semibold ${
                        device.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {device.isActive ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </div>
                </td>
                {user?.role === 'puskesmas' && (
                  <td className="px-6 py-4 text-[14px] text-gray-600">{device.posyanduName || '-'}</td>
                )}
                <td className="px-6 py-4 text-[15px] text-gray-600">{device.villageName || '-'}</td>
                <td className="px-6 py-4 text-[15px] text-gray-600">{formatDateTime(device.lastSessionAt)}</td>
                <td className="px-6 py-4 text-[15px] text-gray-600">{device.sessionsCount}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setSelectedDevice(device)}
                    className="px-4 py-2 text-[14px] font-semibold text-[#11998E] hover:bg-[#11998E] hover:text-white border-2 border-[#11998E] rounded-lg transition-colors"
                  >
                    Detail
                  </button>
                </td>
              </tr>
            ))}
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
                  <p className="font-semibold">{selectedDevice.isActive ? 'Aktif' : 'Tidak Aktif'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Sesi Terakhir</p>
                  <p className="font-semibold">{formatDateTime(selectedDevice.lastSessionAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Posyandu</p>
                  <p className="font-semibold">{selectedDevice.posyanduName || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Desa</p>
                  <p className="font-semibold">{selectedDevice.villageName || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Kecamatan</p>
                  <p className="font-semibold">{selectedDevice.districtName || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Sesi</p>
                  <p className="font-semibold">{selectedDevice.sessionsCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
