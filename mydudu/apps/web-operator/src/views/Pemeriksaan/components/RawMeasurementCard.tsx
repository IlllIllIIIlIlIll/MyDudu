import { ReactNode } from 'react';
import { HEALTH_COLORS } from '@mydudu/shared';

interface RawMeasurementCardProps {
    label: string;
    value: number | string;
    unit: string;
    icon: ReactNode;
    loading?: boolean;
    status?: keyof typeof HEALTH_COLORS;
}

export function RawMeasurementCard({ label, value, unit, icon, loading, status = 'IDLE' }: RawMeasurementCardProps) {
    const col = HEALTH_COLORS[status];

    return (
        <div
            className="rounded-lg p-4 border transition-all shadow-sm"
            style={{ backgroundColor: status === 'IDLE' ? '#ffffff' : col.bg, borderColor: col.border }}
        >
            <div className="flex items-center gap-3 mb-2">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mix-blend-multiply"
                    style={{ backgroundColor: col.bg, color: col.text }}
                >
                    {icon}
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide opacity-80" style={{ color: col.text }}>{label}</span>
            </div>

            <div className="flex items-baseline gap-1.5 ml-1">
                {loading ? (
                    <div className="h-8 w-16 bg-slate-200 animate-pulse rounded" />
                ) : (
                    <span className="text-2xl font-bold" style={{ color: col.text }}>
                        {value}
                    </span>
                )}
                <span className="text-xs font-medium opacity-80" style={{ color: col.text }}>{unit}</span>
            </div>
        </div>
    );
}
