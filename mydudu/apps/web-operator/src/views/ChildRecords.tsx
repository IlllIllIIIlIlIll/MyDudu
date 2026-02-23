"use client";

import { RefreshCcw } from 'lucide-react';
import { ChildTable } from '../components/ChildTable';
import { useAuth } from '../context/AuthContext';
import useSWR from 'swr';
import { fetchWithAuth } from '@/lib/api';
import { NutritionCategory, OperatorChildRecord, OperatorParentRecord } from '../types/operator';
import { ParentTable } from '../components/ParentTable';
import { Button } from '../components/ui/button';
import { ChildDetailDialog } from '../components/ChildDetailDialog';
import { useState, useCallback } from 'react';

export function ChildRecords({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { user } = useAuth();
  const { data, mutate, isLoading } = useSWR<OperatorChildRecord[]>(
    user?.id ? `/operator/children?userId=${user.id}` : null,
    fetchWithAuth,
  );

  const { data: parentsData, isLoading: isLoadingParents } = useSWR<OperatorParentRecord[]>(
    user?.id ? `/operator/parents?userId=${user.id}` : null,
    fetchWithAuth,
  );

  const parents = parentsData || [];

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

  const [selectedChild, setSelectedChild] = useState<OperatorChildRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [connectStatus, setConnectStatus] = useState<{ childId: number; msg: string; ok: boolean } | null>(null);

  const handleConnect = useCallback(async (child: OperatorChildRecord) => {
    const deviceUuid = child.lastSession?.deviceUuid;
    if (!deviceUuid) {
      setConnectStatus({ childId: child.id, msg: 'Tidak ada perangkat terhubung pada sesi terakhir anak ini. Pastikan perangkat sudah aktif.', ok: false });
      setTimeout(() => setConnectStatus(null), 4000);
      return;
    }
    setConnectStatus({ childId: child.id, msg: 'Menghubungkan...', ok: true });
    try {
      await fetchWithAuth(`/operator/device/${deviceUuid}/start`, {
        method: 'POST',
        body: JSON.stringify({
          childId: child.id,
          parentId: child.parentId,
          name: child.fullName,
        }),
      });
      setConnectStatus({ childId: child.id, msg: `✓ START dikirim ke ${deviceUuid}`, ok: true });
    } catch (e: any) {
      setConnectStatus({ childId: child.id, msg: e?.message || 'Gagal mengirim perintah ke perangkat', ok: false });
    }
    setTimeout(() => setConnectStatus(null), 4000);
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Data Anak</h1>
          <p className="text-gray-600 text-[15px] mt-1">
            Daftar anak berdasarkan pengukuran terbaru dari perangkat di{' '}
            {user?.role === 'posyandu'
              ? `Desa ${user?.assignedLocation?.village}`
              : `Kecamatan ${user?.assignedLocation?.kecamatan}`}
          </p>
        </div>

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
        <>
          <ChildTable
            children={children}
            onSelect={(child) => {
              setSelectedChild(child);
              setDetailOpen(true);
            }}
            onConnect={handleConnect}
          />
          {connectStatus && (
            <div className={`mt-3 px-4 py-3 rounded-xl text-sm font-medium border ${connectStatus.ok ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-red-50 text-red-800 border-red-200'
              }`}>
              {connectStatus.msg}
            </div>
          )}
        </>
      )}

      {isLoadingParents ? (
        <div className="bg-white rounded-lg border border-gray-100 p-6 text-gray-500">
          Memuat data orang tua...
        </div>
      ) : (
        <ParentTable parents={parents} />
      )}

      <ChildDetailDialog
        child={selectedChild}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
