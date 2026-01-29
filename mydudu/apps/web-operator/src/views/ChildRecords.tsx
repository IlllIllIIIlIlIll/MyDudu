import { RefreshCcw } from 'lucide-react';
import { ChildTable } from '../components/ChildTable';
import { useAuth } from '../context/AuthContext';
import useSWR from 'swr';
import { fetchWithAuth } from '../lib/api';
import { NutritionCategory, OperatorChildRecord } from '../types/operator';

export function ChildRecords() {
  const { user } = useAuth();
  const { data, mutate, isLoading } = useSWR<OperatorChildRecord[]>(
    user?.id ? `/operator/children?userId=${user.id}` : null,
    fetchWithAuth,
  );

  const children = data || [];

  const counts = children.reduce(
    (acc, child) => {
      const category = child.lastSession?.nutritionCategory;
      if (!category) return acc;
      acc[category] += 1;
      return acc;
    },
    { NORMAL: 0, STUNTED: 0, WASTED: 0, OBESE: 0 } as Record<NutritionCategory, number>,
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Data Anak</h1>
          <p className="text-gray-600 text-[15px] mt-1">
            Daftar anak berdasarkan pengukuran terbaru dari perangkat
          </p>
          {user?.assignedLocation && user.role === 'posyandu' && (
            <p className="text-[13px] text-[#11998E] font-semibold mt-1">
              ðŸ“ Data untuk {user.assignedLocation.posyanduName}, {user.assignedLocation.village}
            </p>
          )}
          {user?.assignedLocation && user.role === 'puskesmas' && (
            <p className="text-[13px] text-blue-600 font-semibold mt-1">
              ðŸ“ Menampilkan data dari seluruh posyandu di {user.assignedLocation.kecamatan}
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
          <p className="text-[14px] text-gray-600 mb-1">Total Anak Terdata</p>
          <p className="text-[28px] font-bold text-[#11998E]">{children.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Status Normal</p>
          <p className="text-[28px] font-bold text-green-600">{counts.NORMAL}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Stunting</p>
          <p className="text-[28px] font-bold text-red-600">{counts.STUNTED}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Perlu Perhatian</p>
          <p className="text-[28px] font-bold text-orange-600">{counts.WASTED}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-100 p-6 text-gray-500">
          Memuat data anak...
        </div>
      ) : (
        <ChildTable children={children} />
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-[14px] text-blue-800">
          <span className="font-semibold">â„¹ï¸ Petunjuk:</span> Data ini mengikuti pengukuran terakhir yang
          tercatat. Gunakan pencarian dan filter untuk menemukan anak dengan cepat.
        </p>
      </div>
    </div>
  );
}
