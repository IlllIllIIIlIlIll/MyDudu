import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { ValidationPanel } from '../components/ValidationPanel';
import { useAuth } from '../context/AuthContext';
import useSWR from 'swr';
import { fetchWithAuth } from '../lib/api';
import { OperatorValidationRecord } from '../types/operator';

export function DoctorValidation() {
  const { user } = useAuth();
  const { data, mutate, isLoading } = useSWR<OperatorValidationRecord[]>(
    user?.id ? `/operator/validations?userId=${user.id}` : null,
    fetchWithAuth,
  );

  const validations = data || [];

  const handleApprove = async (sessionId: number) => {
    if (!user?.id) return;
    try {
      await fetchWithAuth(`/validation/${sessionId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ validatorId: user.id }),
      });
      await mutate();
    } catch (error) {
      console.error('Failed to approve validation', error);
      alert('Gagal menyetujui pemeriksaan. Coba lagi.');
    }
  };

  const handleReject = async (sessionId: number) => {
    if (!user?.id) return;
    const remarks = window.prompt('Catatan penolakan (opsional):') || undefined;
    try {
      await fetchWithAuth(`/validation/${sessionId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ validatorId: user.id, remarks }),
      });
      await mutate();
    } catch (error) {
      console.error('Failed to reject validation', error);
      alert('Gagal menolak pemeriksaan. Coba lagi.');
    }
  };

  const pendingCount = validations.filter(v => v.status === 'pending').length;
  const approvedCount = validations.filter(v => v.status === 'approved').length;
  const rejectedCount = validations.filter(v => v.status === 'rejected').length;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1>Validasi Medis</h1>
        <p className="text-gray-600 text-[15px] mt-1">
          Tinjau dan setujui hasil pemeriksaan yang memerlukan validasi medis untuk Kecamatan {user?.assignedLocation?.kecamatan || ' '}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-[14px] text-gray-600">Menunggu Validasi</p>
              <p className="text-[28px] font-bold text-orange-600">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-green-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-[14px] text-gray-600">Disetujui</p>
              <p className="text-[28px] font-bold text-green-600">{approvedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-red-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-[14px] text-gray-600">Ditolak</p>
              <p className="text-[28px] font-bold text-red-600">{rejectedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-100 p-6 text-gray-500">
          Memuat daftar validasi...
        </div>
      ) : (
        <ValidationPanel
          validations={validations}
          onApprove={handleApprove}
          onReject={handleReject}
          canApprove={user?.role === 'puskesmas'}
        />
      )}
    </div>
  );
}
