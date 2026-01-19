import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit: string;
  status?: 'normal' | 'warning' | 'danger';
  trend?: 'up' | 'down' | 'stable';
}

export function DashboardCard({ 
  icon: Icon, 
  label, 
  value, 
  unit, 
  status = 'normal',
  trend 
}: DashboardCardProps) {
  const statusColors = {
    normal: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200'
  };

  const statusTextColors = {
    normal: 'text-green-700',
    warning: 'text-yellow-700',
    danger: 'text-red-700'
  };

  return (
    <div className={`
      p-4 rounded-2xl border-2 shadow-sm
      ${statusColors[status]}
      transition-all duration-200
    `}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl ${statusTextColors[status]} bg-white/50`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className="text-xs px-2 py-1 rounded-full bg-white/70">
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm text-gray-600">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          <span className="text-base text-gray-500">{unit}</span>
        </div>
      </div>
    </div>
  );
}
