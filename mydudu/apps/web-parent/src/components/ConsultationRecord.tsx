import { MapPin, Calendar, Clock, FileText } from 'lucide-react';
import { HealthStatus } from './StatusCard';

interface ConsultationRecordProps {
  id: string;
  place: string;
  date: string;
  time: string;
  notes: string;
  status: HealthStatus;
}

const statusLabels = {
  no_pain: 'Normal',
  mild: 'Perlu Perhatian',
  moderate: 'Perlu Pemeriksaan',
  severe: 'Segera Periksa',
  very_severe: 'Sangat Mendesak',
  worst_pain: 'Darurat'
};

const statusColors = {
  no_pain: 'bg-green-500',
  mild: 'bg-yellow-500',
  moderate: 'bg-orange-500',
  severe: 'bg-red-500',
  very_severe: 'bg-red-600',
  worst_pain: 'bg-red-700'
};

export function ConsultationRecord({ 
  place, 
  date, 
  time, 
  notes, 
  status 
}: ConsultationRecordProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header with Status Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">{place}</h3>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{time}</span>
            </div>
          </div>
        </div>
        <div className={`${statusColors[status]} text-white px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap`}>
          {statusLabels[status]}
        </div>
      </div>

      {/* Notes */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Catatan Pemeriksaan:</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{notes}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
