import { CheckCircle, Clock, XCircle, ThermometerSun, Weight, Ruler, AlertTriangle } from 'lucide-react';
import { Validation } from '../data/mockData';
import { useState } from 'react';

interface ValidationPanelProps {
  validations: Validation[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function ValidationPanel({ validations, onApprove, onReject }: ValidationPanelProps) {
  const [filter, setFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');

  const filteredValidations = validations.filter(v => 
    filter === 'all' ? true : v.status === filter
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock className="w-5 h-5 text-orange-600" />;
      case 'Approved': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Rejected': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-orange-100 text-orange-700';
      case 'Approved': return 'bg-green-100 text-green-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[20px] font-bold">Validasi Pemeriksaan</h3>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {['all', 'Pending', 'Approved', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-lg text-[15px] font-semibold transition-colors ${
                filter === status
                  ? 'gradient-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'Semua' : status}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {filteredValidations.map((validation) => (
          <div key={validation.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between gap-6">
              {/* Left Section */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  {getStatusIcon(validation.status)}
                  <h4 className="font-bold text-[17px]">{validation.childName}</h4>
                  <span className={`px-3 py-1 rounded-full text-[13px] font-semibold ${getStatusColor(validation.status)}`}>
                    {validation.status}
                  </span>
                </div>

                {/* Flag Reason */}
                {validation.flagReason && (
                  <div className="mb-3 flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[14px] text-orange-800">
                      <span className="font-semibold">Alasan Validasi: </span>
                      {validation.flagReason}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-[13px] text-gray-500">ID Pemeriksaan</p>
                    <p className="text-[15px] font-semibold">{validation.sessionId}</p>
                  </div>
                  <div>
                    <p className="text-[13px] text-gray-500">Tanggal</p>
                    <p className="text-[15px] font-semibold">{validation.date}</p>
                  </div>
                  <div>
                    <p className="text-[13px] text-gray-500">Dokter</p>
                    <p className="text-[15px] font-semibold">{validation.doctorAssigned}</p>
                  </div>
                </div>

                {/* Measurements */}
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Weight className="w-4 h-4 text-gray-500" />
                    <span className="text-[14px] text-gray-600">
                      Berat: <span className="font-semibold">{validation.measurements.weight} kg</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-gray-500" />
                    <span className="text-[14px] text-gray-600">
                      Tinggi: <span className="font-semibold">{validation.measurements.height} cm</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ThermometerSun className="w-4 h-4 text-gray-500" />
                    <span className="text-[14px] text-gray-600">
                      Suhu: <span className="font-semibold">{validation.measurements.temperature}°C</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {validation.status === 'Pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onApprove(validation.id)}
                    className="gradient-primary text-white px-5 py-3 rounded-lg font-semibold text-[15px] hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Setujui
                  </button>
                  <button
                    onClick={() => onReject(validation.id)}
                    className="bg-red-100 text-red-700 px-5 py-3 rounded-lg font-semibold text-[15px] hover:bg-red-200 transition-colors flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Tolak
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredValidations.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          <p className="text-[15px]">Tidak ada data validasi yang sesuai dengan filter.</p>
        </div>
      )}
    </div>
  );
}
