import { Eye, Edit, Trash2, Search } from 'lucide-react';
import { useState } from 'react';
import { Child } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

interface ChildTableProps {
  children: Child[];
}

export function ChildTable({ children }: ChildTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVillage, setFilterVillage] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const villages = ['all', ...Array.from(new Set(children.map(c => c.village)))];
  const statuses = ['all', 'Normal', 'Stunting', 'Gizi Kurang', 'Obesitas'];

  const filteredChildren = children.filter(child => {
    const matchesSearch = child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         child.parentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVillage = filterVillage === 'all' || child.village === filterVillage;
    const matchesStatus = filterStatus === 'all' || child.nutritionStatus === filterStatus;
    return matchesSearch && matchesVillage && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Normal': return 'bg-green-100 text-green-700';
      case 'Stunting': return 'bg-red-100 text-red-700';
      case 'Gizi Kurang': return 'bg-orange-100 text-orange-700';
      case 'Obesitas': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const user = useAuth();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
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

          {/* Village Filter */}
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

          {/* Status Filter */}
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">ID</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Nama Anak</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Umur</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Jenis Kelamin</th>
              {user?.role === 'puskesmas' && (
                <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Posyandu</th>
              )}
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Desa</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Status Gizi</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Pemeriksaan Terakhir</th>
              <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredChildren.map((child) => (
              <tr key={child.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-mono text-[14px] text-gray-600">{child.id}</td>
                <td className="px-6 py-4 font-semibold text-[15px]">{child.name}</td>
                <td className="px-6 py-4 text-[15px] text-gray-600">{child.age} bulan</td>
                <td className="px-6 py-4 text-[15px] text-gray-600">{child.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                {user?.role === 'puskesmas' && (
                  <td className="px-6 py-4 text-[14px] text-gray-600">{child.posyandu}</td>
                )}
                <td className="px-6 py-4 text-[15px] text-gray-600">{child.village}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[13px] font-semibold ${getStatusColor(child.nutritionStatus)}`}>
                    {child.nutritionStatus}
                  </span>
                </td>
                <td className="px-6 py-4 text-[15px] text-gray-600">{child.lastCheckup}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Edit Data"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus Data"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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