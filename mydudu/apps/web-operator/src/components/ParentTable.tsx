import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { OperatorParentRecord } from '../types/operator';
import { useAuth } from '../context/AuthContext';

interface ParentTableProps {
    parents: OperatorParentRecord[];
}

export function ParentTable({ parents }: ParentTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterVillage, setFilterVillage] = useState('all');
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const { user } = useAuth();

    const villages = useMemo(() => {
        const names = parents
            .map(parent => parent.villageName)
            .filter(Boolean) as string[];
        return ['all', ...Array.from(new Set(names))];
    }, [parents]);

    const filteredParents = useMemo(() => {
        return parents.filter(parent => {
            const matchesSearch =
                parent.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (parent.nik && parent.nik.includes(searchTerm));

            const matchesVillage =
                filterVillage === 'all' || parent.villageName === filterVillage;

            return matchesSearch && matchesVillage;
        });
    }, [parents, searchTerm, filterVillage]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Data Orang Tua</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari nama wali anak atau NIK..."
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
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">ID</th>
                            <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Nama Orang Tua</th>
                            <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">NIK Wali</th>
                            <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Jumlah Anak</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredParents.slice(0, itemsPerPage).map((parent) => (
                            <tr key={parent.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-[14px] text-gray-600">{parent.id}</td>
                                <td className="px-6 py-4 font-semibold text-[15px]">{parent.fullName}</td>
                                <td className="px-6 py-4 text-[15px] text-gray-600">{parent.nik || '-'}</td>
                                <td className="px-6 py-4 text-[15px] text-gray-600 font-medium">
                                    {parent.childrenCount} Anak
                                </td>
                            </tr>
                        ))}
                        {filteredParents.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    Tidak ada data wali anak yang ditemukan
                                </td>
                            </tr>
                        )}
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
                    Menampilkan {Math.min(itemsPerPage, filteredParents.length)} dari {filteredParents.length} data
                </p>
            </div>
        </div>
    );
}
