import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { ValidationPanel } from '../components/ValidationPanel';
import { mockValidations } from '../data/mockData';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { filterValidationsByUserRole } from '../utils/dataFilter';

export function DoctorValidation() {
  const { user } = useAuth();
  const allValidations = filterValidationsByUserRole(mockValidations, user);
  // Only show flagged validations that require doctor review
  const flaggedValidations = allValidations.filter(v => v.flagged);
  const [validations, setValidations] = useState(flaggedValidations);

  const handleApprove = (id: string) => {
    setValidations(prev =>
      prev.map(v => v.id === id ? { ...v, status: 'Approved' as const } : v)
    );
    alert('Pemeriksaan telah disetujui');
  };

  const handleReject = (id: string) => {
    setValidations(prev =>
      prev.map(v => v.id === id ? { ...v, status: 'Rejected' as const } : v)
    );
    alert('Pemeriksaan ditolak. Operator akan diminta untuk melakukan pengukuran ulang');
  };

  const pendingCount = validations.filter(v => v.status === 'Pending').length;
  const approvedCount = validations.filter(v => v.status === 'Approved').length;
  const rejectedCount = validations.filter(v => v.status === 'Rejected').length;

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1>Validasi Dokter</h1>
        <p className="text-gray-600 text-[15px] mt-1">
          Tinjau dan setujui hasil pemeriksaan yang memerlukan validasi medis
        </p>
        {user?.assignedLocation && user.role === 'puskesmas' && (
          <p className="text-[13px] text-[#11998E] font-semibold mt-1">
            📍 Validasi untuk {user.assignedLocation.kecamatan}
          </p>
        )}
      </div>

      {/* Statistics Cards */}
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

      {/* Validation Panel */}
      <ValidationPanel
        validations={validations}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Help Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-[14px] text-blue-800">
          <span className="font-semibold">ℹ️ Petunjuk untuk Dokter:</span> Periksa setiap hasil pengukuran dengan teliti. 
          Pastikan nilai berat, tinggi, dan suhu tubuh sesuai dengan kondisi anak. 
          Jika data terlihat tidak akurat, gunakan tombol "Tolak" untuk meminta pengukuran ulang.
        </p>
      </div>
    </div>
  );
}