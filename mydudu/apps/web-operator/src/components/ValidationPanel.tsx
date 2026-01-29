import { CheckCircle, Clock, XCircle, ThermometerSun, Weight, Ruler, AlertTriangle } from 'lucide-react';
import { OperatorValidationRecord, NutritionCategory } from '../types/operator';
import { useState } from 'react';

interface ValidationPanelProps {
  validations: OperatorValidationRecord[];
  onApprove: (sessionId: number) => void;
  onReject: (sessionId: number) => void;
  canApprove?: boolean;
}

const nutritionLabels: Record<NutritionCategory, string> = {
  NORMAL: 'Normal',
  STUNTED: 'Stunting',
  WASTED: 'Gizi Kurang',
  OBESE: 'Obesitas',
};

const flagReasonFromCategory = (category: NutritionCategory | null) => {
  if (!category || category === 'NORMAL') return null;
  return `Perlu validasi karena status ${nutritionLabels[category]}`;
};

export function ValidationPanel({ validations, onApprove, onReject, canApprove = false }: ValidationPanelProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filteredValidations = validations.filter(v =>
    filter === 'all' ? true : v.status === filter
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-orange-600" />;
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[20px] font-bold">Validasi Pemeriksaan</h3>
        </div>

        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-lg text-[15px] font-semibold transition-colors ${filter === status
                ? 'gradient-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {status === 'all' ? 'Semua' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {filteredValidations.map((validation) => {
          const flagReason = flagReasonFromCategory(validation.nutritionCategory);
          return (
            <div key={validation.sessionId} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getStatusIcon(validation.status)}
                    <h4 className="font-bold text-[17px]">{validation.childName || '-'}</h4>
                    <span className={`px-3 py-1 rounded-full text-[13px] font-semibold ${getStatusColor(validation.status)}`}>
                      {validation.status}
                    </span>
                  </div>

                  {flagReason && (
                    <div className="mb-3 flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      <p className="text-[14px] text-orange-800">
                        <span className="font-semibold">Alasan Validasi: </span>
                        {flagReason}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-[13px] text-gray-500">ID Pemeriksaan</p>
                      <p className="text-[15px] font-semibold">#{validation.sessionId}</p>
                    </div>
                    <div>
                      <p className="text-[13px] text-gray-500">Tanggal</p>
                      <p className="text-[15px] font-semibold">{formatDate(validation.recordedAt)}</p>
                    </div>
                    <div>
                      <p className="text-[13px] text-gray-500">Validator</p>
                      <p className="text-[15px] font-semibold">{validation.validatorName || '-'}</p>
                    </div>
                  </div>

                  <div className="flex gap-6 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Weight className="w-4 h-4 text-gray-500" />
                      <span className="text-[14px] text-gray-600">
                        Berat: <span className="font-semibold">{validation.weight ?? '-'} kg</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-gray-500" />
                      <span className="text-[14px] text-gray-600">
                        Tinggi: <span className="font-semibold">{validation.height ?? '-'} cm</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThermometerSun className="w-4 h-4 text-gray-500" />
                      <span className="text-[14px] text-gray-600">
                        Suhu: <span className="font-semibold">{validation.temperature ?? '-'} C</span>
                      </span>
                    </div>
                  </div>

                  {validation.remarks && (
                    <div className="mt-3 text-[13px] text-gray-600">
                      <span className="font-semibold">Catatan:</span> {validation.remarks}
                    </div>
                  )}
                </div>

                {validation.status === 'pending' && canApprove && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onApprove(validation.sessionId)}
                      className="gradient-primary text-white px-5 py-3 rounded-lg font-semibold text-[15px] hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Setujui
                    </button>
                    <button
                      onClick={() => onReject(validation.sessionId)}
                      className="bg-red-100 text-red-700 px-5 py-3 rounded-lg font-semibold text-[15px] hover:bg-red-200 transition-colors flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Tolak
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredValidations.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          <p className="text-[15px]">Tidak ada data validasi yang sesuai dengan filter.</p>
        </div>
      )}
    </div>
  );
}
