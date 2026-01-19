import { Wifi, WifiOff, Wrench, Battery, Search, Filter } from 'lucide-react';
import { useState } from 'react';
import { Device } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

interface DeviceStatusListProps {
  devices: Device[];
}

export function DeviceStatusList({ devices }: DeviceStatusListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Online': return <Wifi className="w-5 h-5 text-green-600" />;
      case 'Offline': return <WifiOff className="w-5 h-5 text-gray-400" />;
      case 'Error': return <Wrench className="w-5 h-5 text-red-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Online': return 'bg-green-100 text-green-700';
      case 'Offline': return 'bg-gray-100 text-gray-700';
      case 'Error': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 50) return '#38EF7D';
    if (battery > 20) return '#FF9800';
    return '#EF4444';
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const user = useAuth();

  const filteredDevices = devices
    .filter(device => device.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(device => filterStatus ? device.status === filterStatus : true);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-[20px] font-bold">Status Alat Dudu</h3>
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
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
              <option value="Error">Error</option>
            </select>
            <Filter className="absolute right-3 top-3 w-4 h-4 text-gray-500" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">ID Alat</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Nama Alat</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Status</th>
              {user?.role === 'puskesmas' && (
                <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Posyandu</th>
              )}
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Lokasi</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Baterai</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Sinkronisasi Terakhir</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.map((device) => (
              <tr key={device.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-mono text-[14px] text-gray-600">{device.id}</td>
                <td className="px-6 py-4 font-semibold text-[15px]">{device.name}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(device.status)}
                    <span className={`px-3 py-1 rounded-full text-[13px] font-semibold ${getStatusColor(device.status)}`}>
                      {device.status}
                    </span>
                  </div>
                </td>
                {user?.role === 'puskesmas' && (
                  <td className="px-6 py-4 text-[14px] text-gray-600">{device.posyandu}</td>
                )}
                <td className="px-6 py-4 text-[15px] text-gray-600">{device.location}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Battery className={`w-5 h-5 ${getBatteryColor(device.battery)}`} />
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-full rounded-full transition-all ${
                            device.battery > 50 ? 'bg-green-500' :
                            device.battery > 20 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${device.battery}%` }}
                        />
                      </div>
                      <span className={`text-[13px] font-semibold ${getBatteryColor(device.battery)}`}>
                        {device.battery}%
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-[15px] text-gray-600">{device.lastSync}</td>
                <td className="px-6 py-4">
                  <button
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
    </div>
  );
}