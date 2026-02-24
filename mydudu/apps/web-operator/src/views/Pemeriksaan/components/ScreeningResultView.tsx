import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Printer, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { DiagnosisResult, QuizStepHistory } from '../types';

interface ScreeningResultViewProps {
    diagnosis: DiagnosisResult;
    quizHistory: QuizStepHistory[];
    vitalsLeft: { label: string; value: number; unit: string; icon: ReactNode }[];
    vitalsRight: { label: string; value: number; unit: string; icon: ReactNode }[];
    onPrint: () => void;
    onNewPatient: () => void;
}

const SEVERITY_CONFIG: Record<string, { bg: string; border: string; text: string; icon: any; label: string }> = {
    Merah: { bg: '#fee2e2', border: '#f87171', text: '#991b1b', icon: AlertOctagon, label: 'Gawat Darurat' },
    Kuning: { bg: '#fef9c3', border: '#fbbf24', text: '#854d0e', icon: AlertTriangle, label: 'Perlu Perhatian' },
    Hijau: { bg: '#dcfce7', border: '#4ade80', text: '#14532d', icon: CheckCircle2, label: 'Normal' },
};

export function ScreeningResultView({
    diagnosis,
    quizHistory,
    vitalsLeft,
    vitalsRight,
    onPrint,
    onNewPatient,
}: ScreeningResultViewProps) {
    const sev = SEVERITY_CONFIG[diagnosis.severity] ?? SEVERITY_CONFIG['Hijau'];
    const SevIcon = sev.icon;
    const allVitals = [...vitalsLeft, ...vitalsRight];

    // Color-code icon background by vital label & value (same thresholds as ScreeningFlow)
    const getVitalIconStyle = (label: string, value: number): string => {
        if (label === 'Suhu' || label === 'Temp') {
            if (value >= 38.5) return 'bg-red-100 text-red-600';
            if (value >= 37.5 || (value > 0 && value < 36)) return 'bg-amber-100 text-amber-600';
        }
        if (label.toLowerCase().includes('o2') || label.toLowerCase().includes('saturasi') || label.toLowerCase().includes('spo2')) {
            if (value > 0 && value < 90) return 'bg-red-100 text-red-600';
            if (value >= 90 && value < 95) return 'bg-amber-100 text-amber-600';
            if (value >= 95) return 'bg-green-100 text-green-700';
        }
        if (label.toLowerCase().includes('jantung') || label.toLowerCase().includes('bpm') || label.toLowerCase().includes('heart')) {
            // Use child 1-10yr range as fallback (70-130)  
            if (value > 0 && (value < 70 || value > 130)) return 'bg-red-100 text-red-600';
            if (value > 0 && (value < 80 || value > 120)) return 'bg-amber-100 text-amber-600';
            if (value > 0) return 'bg-green-100 text-green-700';
        }
        return 'bg-slate-100 text-slate-500';
    };

    return (
        <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 min-h-0 flex flex-col p-4 gap-4 overflow-hidden"
        >
            {/* ── Header Card ── */}
            <div
                className="rounded-2xl p-5 flex items-center gap-4 shrink-0 print:rounded-none"
                style={{ backgroundColor: sev.bg, border: `2px solid ${sev.border}` }}
            >
                <SevIcon className="w-10 h-10 shrink-0" style={{ color: sev.text }} />
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: sev.text }}>{sev.label}</p>
                    <h1 className="text-xl font-black leading-tight truncate" style={{ color: sev.text }}>{diagnosis.title}</h1>
                    <p className="text-sm mt-0.5" style={{ color: sev.text, opacity: 0.8 }}>{diagnosis.description}</p>
                </div>
                <button
                    onClick={onPrint}
                    className="ml-auto shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white shadow-sm border no-print hover:opacity-90 active:scale-95 transition-all"
                    style={{ borderColor: sev.border, color: sev.text }}
                >
                    <Printer className="w-4 h-4" /> Cetak
                </button>
            </div>

            {/* ── Body: Vitals + Symptoms ── */}
            <div className="flex-1 min-h-0 grid grid-cols-2 gap-4 overflow-hidden">
                {/* Vitals */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col overflow-hidden">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 shrink-0">Metrik Vitals</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 overflow-y-auto">
                        {allVitals.map((v) => (
                            <div key={v.label} className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg shrink-0 ${getVitalIconStyle(v.label, v.value)}`}>{v.icon}</div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{v.label}</p>
                                    <p className="text-sm font-bold text-slate-800">{v.value}<span className="text-xs font-medium text-slate-500 ml-0.5">{v.unit}</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Symptoms */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col overflow-hidden">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 shrink-0">Riwayat Gejala</h3>
                    <div className="space-y-1.5 overflow-y-auto min-h-0">
                        {quizHistory.map((step, i) => (
                            <div key={i} className="flex items-center justify-between gap-2 py-1 border-b border-slate-100 last:border-0">
                                <p className="text-xs text-slate-700 truncate flex-1 min-w-0">{step.question}</p>
                                <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${step.answer === 'Ya' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {step.answer}
                                </span>
                            </div>
                        ))}
                        {quizHistory.length === 0 && (
                            <p className="text-xs text-slate-400 italic">Tidak ada data gejala.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Instructions ── */}
            {diagnosis.instructions && diagnosis.instructions.length > 0 && (
                <div className="shrink-0 bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Tindak Lanjut</h3>
                    <ul className="space-y-1">
                        {diagnosis.instructions.map((ins, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                                <span className="w-4 h-4 rounded-full bg-slate-300 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                                {ins}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </motion.div>
    );
}
