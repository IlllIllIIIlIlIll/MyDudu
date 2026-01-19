import { UserPlus } from 'lucide-react';
import { ChildTable } from '../components/ChildTable';
import { mockChildren } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { filterChildrenByUserRole } from '../utils/dataFilter';

export function ChildRecords() {
  const { user } = useAuth();
  const filteredChildren = filterChildrenByUserRole(mockChildren, user);
  
  const handleAddChild = () => {
    alert('Form tambah data anak akan dibuka');
  };

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Data Anak</h1>
          <p className="text-gray-600 text-[15px] mt-1">
            Daftar lengkap anak yang terdaftar dalam sistem pemantauan
          </p>
          {user?.assignedLocation && user.role === 'posyandu' && (
            <p className="text-[13px] text-[#11998E] font-semibold mt-1">
              📍 Data untuk {user.assignedLocation.posyanduName}, {user.assignedLocation.village}
            </p>
          )}
          {user?.assignedLocation && user.role === 'puskesmas' && (
            <p className="text-[13px] text-blue-600 font-semibold mt-1">
              📍 Menampilkan data dari seluruh posyandu di {user.assignedLocation.kecamatan}
            </p>
          )}
        </div>
        <button
          onClick={handleAddChild}
          className="gradient-primary text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <UserPlus className="w-5 h-5" />
          <span className="font-semibold">Tambah Data Anak</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Total Anak Terdaftar</p>
          <p className="text-[28px] font-bold text-[#11998E]">{filteredChildren.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Status Normal</p>
          <p className="text-[28px] font-bold text-green-600">
            {filteredChildren.filter(c => c.nutritionStatus === 'Normal').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Stunting</p>
          <p className="text-[28px] font-bold text-red-600">
            {filteredChildren.filter(c => c.nutritionStatus === 'Stunting').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Perlu Perhatian</p>
          <p className="text-[28px] font-bold text-orange-600">
            {filteredChildren.filter(c => c.nutritionStatus === 'Gizi Kurang').length}
          </p>
        </div>
      </div>

      {/* Child Table */}
      <ChildTable children={filteredChildren} />

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-[14px] text-blue-800">
          <span className="font-semibold">ℹ️ Petunjuk:</span> Gunakan kolom pencarian untuk mencari nama anak atau orang tua. 
          Anda juga dapat memfilter berdasarkan desa atau status gizi untuk mempermudah pencarian.
        </p>
      </div>
    </div>
  );
}
