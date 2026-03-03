import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Printer, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import {
    HEALTH_COLORS,
    VITALS_THRESHOLDS,
    CLINICAL_OUTCOME_CONFIG,
} from '@mydudu/shared';
import { QuizStepHistory } from '../types';

interface ScreeningResultViewProps {
    clinicalOutcome: string;
    quizHistory: QuizStepHistory[];
    vitalsLeft: { label: string; value: number; unit: string; icon: ReactNode; status?: string }[];
    vitalsRight: { label: string; value: number; unit: string; icon: ReactNode; status?: string }[];
    onPrint: () => void;
    onNewPatient: () => void;
}

const SEVERITY_ICON = {
    DANGER: AlertOctagon,
    WARNING: AlertTriangle,
    NORMAL: CheckCircle2,
} as const;

export function ScreeningResultView({
    clinicalOutcome,
    quizHistory,
    vitalsLeft,
    vitalsRight,
    onPrint,
    onNewPatient,
}: ScreeningResultViewProps) {
    const cfg = CLINICAL_OUTCOME_CONFIG[clinicalOutcome] ?? CLINICAL_OUTCOME_CONFIG['NORMAL'];
    const col = HEALTH_COLORS[cfg.severity];
    const SevIcon = SEVERITY_ICON[cfg.severity];
    const allVitals = [...vitalsLeft, ...vitalsRight];

    // Color-code icon background by vital label & value
    const getVitalIconStyle = (label: string, value: number, status?: string): React.CSSProperties => {
        // If a pre-computed status is passed (e.g. from growthAnalysis for WEIGHT/HEIGHT), use it first
        if (status && status !== 'IDLE' && status in HEALTH_COLORS) {
            const c = HEALTH_COLORS[status as keyof typeof HEALTH_COLORS];
            return { backgroundColor: c.bg, color: c.text };
        }
        const l = label.toUpperCase();
        if (l === 'TEMP' || l === 'SUHU') {
            if (value >= VITALS_THRESHOLDS.TEMPERATURE.MODERATE_FEVER_MIN) return { backgroundColor: HEALTH_COLORS.DANGER.bg, color: HEALTH_COLORS.DANGER.text };
            if (value >= VITALS_THRESHOLDS.TEMPERATURE.MAX_SAFE || (value > 0 && value < VITALS_THRESHOLDS.TEMPERATURE.MIN_SAFE)) return { backgroundColor: HEALTH_COLORS.WARNING.bg, color: HEALTH_COLORS.WARNING.text };
            if (value > 0) return { backgroundColor: HEALTH_COLORS.NORMAL.bg, color: HEALTH_COLORS.NORMAL.text };
        }
        if (l === 'SPO2' || l.includes('O2') || l.includes('SATURASI')) {
            if (value > 0 && value < VITALS_THRESHOLDS.SPO2.WARNING_MIN) return { backgroundColor: HEALTH_COLORS.DANGER.bg, color: HEALTH_COLORS.DANGER.text };
            if (value >= VITALS_THRESHOLDS.SPO2.WARNING_MIN && value < VITALS_THRESHOLDS.SPO2.NORMAL_MIN) return { backgroundColor: HEALTH_COLORS.WARNING.bg, color: HEALTH_COLORS.WARNING.text };
            if (value >= VITALS_THRESHOLDS.SPO2.NORMAL_MIN) return { backgroundColor: HEALTH_COLORS.NORMAL.bg, color: HEALTH_COLORS.NORMAL.text };
        }
        if (l === 'HEARTRATE' || l.includes('JANTUNG') || l.includes('HEART')) {
            const range = VITALS_THRESHOLDS.HEART_RATE.CHILD;
            if (value > 0 && (value < range.MIN || value > range.MAX)) return { backgroundColor: HEALTH_COLORS.DANGER.bg, color: HEALTH_COLORS.DANGER.text };
            if (value > 0 && (value < range.MIN + 10 || value > range.MAX - 10)) return { backgroundColor: HEALTH_COLORS.WARNING.bg, color: HEALTH_COLORS.WARNING.text };
            if (value > 0) return { backgroundColor: HEALTH_COLORS.NORMAL.bg, color: HEALTH_COLORS.NORMAL.text };
        }
        return { backgroundColor: HEALTH_COLORS.IDLE.bg, color: HEALTH_COLORS.IDLE.text };
    };

    return (
        <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 min-h-0 flex flex-col p-4 gap-4 overflow-hidden"
        >
            {/* ── Header Card: status icon + label + vitals chips + disabled Cetak ── */}
            <div
                className="rounded-2xl px-5 py-4 flex items-center gap-4 shrink-0 print:rounded-none"
                style={{ backgroundColor: col.border, border: `2px solid ${col.text}22` }}
            >
                {/* Left: severity icon + label only */}
                <SevIcon className="w-9 h-9 shrink-0" style={{ color: col.text }} />
                <p className="text-base font-black leading-tight shrink-0" style={{ color: col.text }}>
                    {cfg.label}
                </p>

                {/* Right-aligned: vitals compact pills */}
                <div className="ml-auto flex flex-wrap gap-2 items-center justify-end">
                    {allVitals.map((v) => {
                        const cs = getVitalIconStyle(v.label, v.value, v.status);
                        return (
                            <div
                                key={v.label}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg shrink-0"
                                style={{ backgroundColor: cs.backgroundColor, color: cs.color }}
                            >
                                <span className="shrink-0">{v.icon}</span>
                                <span className="text-xs font-bold tabular-nums">{v.value}</span>
                                <span className="text-[10px] font-medium opacity-80">{v.unit}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Right: Cetak button — disabled / muted */}
                <button
                    disabled
                    className="ml-auto shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white/40 border border-white/40 text-slate-400 cursor-not-allowed no-print"
                >
                    <Printer className="w-4 h-4" /> Cetak
                </button>
            </div>

            {/* ── Body: Riwayat Gejala (left) + Tindak Lanjut (right) ── */}
            <div className="flex-1 min-h-0 grid grid-cols-2 gap-4 overflow-hidden">
                {/* Left: Riwayat Gejala */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col overflow-hidden">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 shrink-0">Riwayat Gejala</h3>
                    <div className="space-y-1.5 overflow-y-auto min-h-0">
                        {quizHistory.map((step, i) => (
                            <div key={i} className="flex items-center justify-between gap-2 py-1 border-b border-slate-100 last:border-0">
                                <p className="text-xs text-slate-700 truncate flex-1 min-w-0">{step.question}</p>
                                <span
                                    className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                    style={step.answerYes
                                        ? { backgroundColor: HEALTH_COLORS.DANGER.bg, color: HEALTH_COLORS.DANGER.text }
                                        : { backgroundColor: HEALTH_COLORS.NORMAL.bg, color: HEALTH_COLORS.NORMAL.text }
                                    }
                                >
                                    {step.answer}
                                </span>
                            </div>
                        ))}
                        {quizHistory.length === 0 && (
                            <p className="text-xs text-slate-400 italic">Tidak ada data gejala.</p>
                        )}
                    </div>
                </div>

                {/* Right: Tindak Lanjut */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col overflow-hidden">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 shrink-0">Tindak Lanjut</h3>
                    <ul className="space-y-2 overflow-y-auto min-h-0">
                        {cfg.instructions.map((ins, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: col.text }}>
                                <span
                                    className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                                    style={{ backgroundColor: col.text }}
                                >{i + 1}</span>
                                {ins}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </motion.div>
    );
}
