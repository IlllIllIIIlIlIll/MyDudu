import { ReactNode } from 'react';

interface RawMeasurementCardProps {
    label: string;
    value: number | string;
    unit: string;
    icon: ReactNode;
    loading?: boolean;
    // Optional status for critical vitals (e.g. fever), but NOT for growth status
    isCritical?: boolean;
}

export function RawMeasurementCard({ label, value, unit, icon, loading, isCritical }: RawMeasurementCardProps) {
    return (
        <div className={`
            bg-white rounded-lg p-4 border transition-all shadow-sm
            ${isCritical ? 'border-red-300 bg-red-50' : 'border-slate-200'}
        `}>
            <div className="flex items-center gap-3 mb-2">
                <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center
                    ${isCritical ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}
                `}>
                    {icon}
                </div>
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</span>
            </div>

            <div className="flex items-baseline gap-1.5 ml-1">
                {loading ? (
                    <div className="h-8 w-16 bg-slate-200 animate-pulse rounded" />
                ) : (
                    <span className={`text-2xl font-bold ${isCritical ? 'text-red-700' : 'text-slate-900'}`}>
                        {value}
                    </span>
                )}
                <span className="text-xs font-medium text-slate-500">{unit}</span>
            </div>
        </div>
    );
}
