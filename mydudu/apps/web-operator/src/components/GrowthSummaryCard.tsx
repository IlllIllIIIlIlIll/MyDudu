import { useMemo } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { getGrowthStatus, GrowthStatus, GrowthStatusSeverity } from '../utils/growthLogic';

interface GrowthSummaryCardProps {
    weightForAgeZ?: number;
    heightForAgeZ?: number;
    weightForHeightZ?: number;
    bmiForAgeZ?: number;
}

export function GrowthSummaryCard({
    weightForAgeZ,
    heightForAgeZ,
    weightForHeightZ,
    bmiForAgeZ,
}: GrowthSummaryCardProps) {

    const statuses = useMemo(() => {
        return [
            weightForAgeZ,
            heightForAgeZ,
            weightForHeightZ,
            bmiForAgeZ
        ].map(z => getGrowthStatus(z)).filter((s): s is GrowthStatus => !!s);
    }, [weightForAgeZ, heightForAgeZ, weightForHeightZ, bmiForAgeZ]);

    const overallStatus = useMemo(() => {
        // Priority: Danger > Warning > Neutral > Success
        if (statuses.some(s => s.severity === 'danger')) return 'danger';
        if (statuses.some(s => s.severity === 'warning')) return 'warning';
        if (statuses.some(s => s.severity === 'neutral')) return 'neutral';
        return 'success';
    }, [statuses]);

    // Find the "worst" active status to display as main concern
    const mainConcern = useMemo(() => {
        const danger = statuses.find(s => s.severity === 'danger');
        if (danger) return danger;
        const warning = statuses.find(s => s.severity === 'warning');
        if (warning) return warning;
        return null;
    }, [statuses]);

    const config = {
        danger: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-900',
            icon: <AlertCircle className="w-5 h-5 text-red-600" />,
            title: 'Perhatian Khusus Diperlukan',
            desc: 'Terdapat indikator pertumbuhan yang memerlukan rujukan atau penanganan segera.'
        },
        warning: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            text: 'text-yellow-900',
            icon: <Info className="w-5 h-5 text-yellow-600" />,
            title: 'Perlu Pemantauan',
            desc: 'Beberapa indikator pertumbuhan berada di luar rentang normal. Evaluasi pola makan dan asupan gizi.'
        },
        success: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-900',
            icon: <CheckCircle className="w-5 h-5 text-green-600" />,
            title: 'Pertumbuhan Optimal',
            desc: 'Semua indikator pertumbuhan berada dalam rentang normal. Lanjutkan pemantauan rutin.'
        },
        neutral: {
            bg: 'bg-slate-50',
            border: 'border-slate-200',
            text: 'text-slate-900',
            icon: <Info className="w-5 h-5 text-slate-600" />,
            title: 'Data Tidak Lengkap / Valid',
            desc: 'Mohon pastikan data pengukuran sudan lengkap dan valid.'
        }
    }[overallStatus];

    return (
        <div className={`p-4 rounded-xl border ${config.bg} ${config.border} mb-6`}>
            <div className="flex items-start gap-3">
                <div className="mt-0.5">{config.icon}</div>
                <div>
                    <h3 className={`font-bold text-sm ${config.text} mb-1`}>
                        {config.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-2">
                        {config.desc}
                    </p>

                    {mainConcern && (
                        <div className="mt-2 text-xs font-medium px-2 py-1 bg-white/50 rounded inline-block border border-black/5">
                            Perhatian Utama: <span className={
                                mainConcern.severity === 'danger' ? 'text-red-700' : 'text-yellow-700'
                            }>{mainConcern.label} ({mainConcern.explanation})</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
