import { Eye, Search, Wifi } from 'lucide-react';
import { useMemo, useState } from 'react';
import { OperatorChildRecord, NutritionCategory } from '../types/operator';
import { useAuth } from '../context/AuthContext';

interface ChildTableProps {
  children: OperatorChildRecord[];
  onSelect: (child: OperatorChildRecord) => void;
}

const nutritionLabels: Record<NutritionCategory, string> = {
  NORMAL: 'Normal',
  STUNTED: 'Stunting',
  WASTED: 'Gizi Kurang',
  OBESE: 'Obesitas',
};

export function ChildTable({ children, onSelect }: ChildTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVillage, setFilterVillage] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);


  const { user } = useAuth();

  const villages = useMemo(() => {
    const names = children
      .map(child => child.lastSession?.villageName)
      .filter(Boolean) as string[];
    return ['all', ...Array.from(new Set(names))];
  }, [children]);

  const statuses = ['all', ...Object.values(nutritionLabels)];

  const filteredChildren = useMemo(() => {
    return children.filter(child => {
      const parentName = child.parentName || '';
      const matchesSearch =
        child.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parentName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesVillage =
        filterVillage === 'all' || child.lastSession?.villageName === filterVillage;
      const statusLabel = child.lastSession?.nutritionCategory
        ? nutritionLabels[child.lastSession.nutritionCategory]
        : null;
      const matchesStatus = filterStatus === 'all' || statusLabel === filterStatus;
      return matchesSearch && matchesVillage && matchesStatus;
    });
  }, [children, searchTerm, filterVillage, filterStatus]);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'Normal':
        return 'bg-green-100 text-green-700';
      case 'Stunting':
        return 'bg-red-100 text-red-700';
      case 'Gizi Kurang':
        return 'bg-orange-100 text-orange-700';
      case 'Obesitas':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
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

  const getAgeInMonths = (birthDate: string) => {
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return '-';
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    return Math.max(months, 0);
  };

  const getDaysAgo = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '-';
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} Hari`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama anak atau orang tua..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
              />
            </div>
          </div>

          <div>
            <select
              value={filterVillage}
              onChange={(e) => setFilterVillage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
            >
              <option value="all">Semua Desa</option>
              {villages.filter(v => v !== 'all').map(village => (
                <option key={village} value={village}>{village}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
            >
              <option value="all">Semua Status</option>
              {statuses.filter(s => s !== 'all').map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Status Pengukuran</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Nama Anak</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Nama Wali</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Umur</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Jenis Kelamin</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Golongan Darah</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Status Gizi</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Pemeriksaan Terakhir</th>
              <th className="px-6 py-4 text-center text-[15px] font-bold text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredChildren.map((child) => {
              const nutritionLabel = child.lastSession?.nutritionCategory
                ? nutritionLabels[child.lastSession.nutritionCategory]
                : null;
              return (
                <tr key={child.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    {/* #10: measurement status — always shows Connect since live status requires queue data */}
                    <button
                      onClick={() => onSelect(child)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-[13px] font-semibold hover:bg-teal-100 border border-teal-200 transition-colors"
                      title="Mulai Pengukuran"
                    >
                      <Wifi className="w-4 h-4" />
                      Connect
                    </button>
                  </td>
                  <td className="px-6 py-4 font-semibold text-[15px]">{child.fullName}</td>
                  <td className="px-6 py-4 text-[15px] text-gray-600">{child.parentName || '-'}</td>
                  <td className="px-6 py-4 text-[15px] text-gray-600">
                    {child.birthDate ? `${getAgeInMonths(child.birthDate)} bulan` : '-'}
                  </td>
                  <td className="px-6 py-4 text-[15px] text-gray-600">
                    {child.gender === 'M' ? 'Laki-laki' : child.gender === 'F' ? 'Perempuan' : '-'}
                  </td>
                  <td className="px-6 py-4 text-[15px] text-gray-600 font-medium">
                    {child.bloodType || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[13px] font-semibold ${getStatusColor(nutritionLabel)}`}>
                      {nutritionLabel || 'Belum Dinilai'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[15px] text-gray-600">
                    {getDaysAgo(child.lastSession?.recordedAt || null)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => onSelect(child)}
                      className="p-2 text-gray-400 hover:text-[#11998E] hover:bg-teal-50 rounded-lg transition-colors"
                      title="Lihat Detail Pertumbuhan"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-6 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[15px] text-gray-600">Tampilkan:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-[15px] text-gray-600">data</span>
        </div>
        <p className="text-[15px] text-gray-600">
          Menampilkan {Math.min(itemsPerPage, filteredChildren.length)} dari {filteredChildren.length} data
        </p>
      </div>


    </div>
  );
}
