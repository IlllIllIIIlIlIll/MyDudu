import { AlertTriangle, CheckCircle, HelpCircle, XCircle } from 'lucide-react';
import styles from './DashboardCards.module.css';

interface ObservabilityCardProps {
    provider: string; // e.g. 'Vercel', 'Render'
    type: string;     // e.g. 'Bandwidth', 'Storage'
    value: number;
    limit?: number | null;
    unit: string;
    status: 'VALID' | 'ESTIMATED' | 'FAILED_FETCH' | 'PARTIAL';
    anomalyScore?: number | null;
    daysRemaining?: number | null;
}

export function ObservabilityCard({
    provider,
    type,
    value,
    limit,
    unit,
    status,
    anomalyScore,
    daysRemaining,
}: ObservabilityCardProps) {

    // Status Icon Logic
    let StatusIcon = CheckCircle;
    let statusColor = "text-green-500";

    if (status === 'FAILED_FETCH') {
        StatusIcon = XCircle;
        statusColor = "text-red-500";
    } else if (status === 'ESTIMATED' || status === 'PARTIAL') {
        StatusIcon = HelpCircle;
        statusColor = "text-yellow-500";
    }

    // Anomaly Logic (0-1)
    const isAnomaly = (anomalyScore || 0) > 0.8;

    // Progress Logic
    const percentage = limit ? Math.min(100, (value / limit) * 100) : 0;
    const progressColor = percentage > 90 ? "bg-red-500" : percentage > 75 ? "bg-yellow-500" : "bg-blue-500";

    return (
        <div className={`p-4 bg-white rounded-lg border flex flex-col justify-between hover:shadow-md transition-shadow ${isAnomaly ? 'border-red-400 ring-1 ring-red-100' : 'border-gray-100'}`}>

            {/* Header */}
            <div className="flex justify-between items-start mb-2">
                <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{provider}</span>
                    <h4 className="font-semibold text-gray-800 text-sm">{type}</h4>
                </div>
                <div title={`Status: ${status}`}>
                    <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                </div>
            </div>

            {/* Value & Limit */}
            <div className="mb-3">
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">{value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    <span className="text-xs text-gray-500 font-medium">{unit}</span>
                </div>
                {limit && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                        of {limit.toLocaleString()} {unit} limit
                    </p>
                )}
            </div>



            {/* Progress Bar (if limit exists) */}
            {limit && (
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div
                        className={`h-full rounded-full ${progressColor} ${styles.progressBar}`}
                        style={{ '--progress-width': `${percentage}%` } as React.CSSProperties}
                    ></div>
                </div>
            )}

            {/* Meta / Anomaly */}
            <div className="flex justify-between items-end mt-auto pt-2 border-t border-gray-50">
                <div className="flex flex-col">
                    {daysRemaining !== undefined && daysRemaining !== null && daysRemaining < 999 && (
                        <span className={`text-[10px] font-bold ${daysRemaining < 7 ? 'text-red-600' : 'text-gray-500'}`}>
                            {daysRemaining < 0 ? 'Over limit' : `${daysRemaining.toFixed(1)} days left`}
                        </span>
                    )}
                    {status === 'ESTIMATED' && <span className="text-[10px] text-yellow-600 italic">Estimated</span>}
                </div>

                {isAnomaly && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-50 rounded text-red-600">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-[10px] font-bold">Spike</span>
                    </div>
                )}
            </div>
        </div>
    );
}
