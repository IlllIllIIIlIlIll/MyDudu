import { AlertCircle } from 'lucide-react';

export type HealthStatus = 
  | 'no_pain' 
  | 'mild' 
  | 'moderate' 
  | 'severe' 
  | 'very_severe' 
  | 'worst_pain';

interface StatusCardProps {
  status: HealthStatus;
  causes?: string[];
  symptoms?: string[];
}

const statusConfig = {
  no_pain: {
    label: 'Normal',
    color: 'bg-green-50 border-green-300',
    textColor: 'text-green-700',
    badgeColor: 'bg-green-500',
    icon: '✓'
  },
  mild: {
    label: 'Perlu Perhatian',
    color: 'bg-yellow-50 border-yellow-300',
    textColor: 'text-yellow-800',
    badgeColor: 'bg-yellow-500',
    icon: '⚠'
  },
  moderate: {
    label: 'Perlu Pemeriksaan',
    color: 'bg-orange-50 border-orange-300',
    textColor: 'text-orange-800',
    badgeColor: 'bg-orange-500',
    icon: '⚠'
  },
  severe: {
    label: 'Segera Periksa',
    color: 'bg-red-50 border-red-300',
    textColor: 'text-red-800',
    badgeColor: 'bg-red-500',
    icon: '⚠'
  },
  very_severe: {
    label: 'Sangat Mendesak',
    color: 'bg-red-100 border-red-400',
    textColor: 'text-red-900',
    badgeColor: 'bg-red-600',
    icon: '⚠'
  },
  worst_pain: {
    label: 'Darurat',
    color: 'bg-red-200 border-red-500',
    textColor: 'text-red-950',
    badgeColor: 'bg-red-700',
    icon: '⚠⚠'
  }
};

export function StatusCard({ status, causes = [], symptoms = [] }: StatusCardProps) {
  const config = statusConfig[status];
  const hasDetails = causes.length > 0 || symptoms.length > 0;

  return (
    <div className={`rounded-2xl border-2 p-5 ${config.color}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 ${config.badgeColor} rounded-full flex items-center justify-center text-white text-xl font-bold`}>
          {config.icon}
        </div>
        <div>
          <h3 className={`${config.textColor} text-xl`}>
            {config.label}
          </h3>
          <p className="text-sm text-gray-600">Status Kesehatan Anak</p>
        </div>
      </div>

      {hasDetails && (
        <div className="mt-4 pt-4 border-t border-gray-300/50 space-y-4">
          {causes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-gray-600" />
                <h4 className="font-semibold text-gray-800">Kemungkinan Penyebab:</h4>
              </div>
              <ul className="space-y-2 ml-6">
                {causes.map((cause, index) => (
                  <li key={index} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-gray-500">•</span>
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {symptoms.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-gray-600" />
                <h4 className="font-semibold text-gray-800">Gejala yang Mungkin Muncul:</h4>
              </div>
              <ul className="space-y-2 ml-6">
                {symptoms.map((symptom, index) => (
                  <li key={index} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-gray-500">•</span>
                    <span>{symptom}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {status !== 'no_pain' && (
            <div className="mt-4 p-3 bg-white/50 rounded-xl">
              <p className="text-sm font-medium text-gray-800">
                💡 Saran: Segera konsultasi dengan tenaga kesehatan untuk pemeriksaan lebih lanjut.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
