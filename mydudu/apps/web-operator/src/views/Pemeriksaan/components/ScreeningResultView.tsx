import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Printer, RefreshCw, ExternalLink } from 'lucide-react';
import { DiagnosisResult, QuizStepHistory } from '../types';
import styles from '../ScreeningFlow.module.css';

interface ScreeningResultViewProps {
    diagnosis: DiagnosisResult;
    quizHistory: QuizStepHistory[];
    vitalsLeft: { label: string; value: number; unit: string; icon: ReactNode }[];
    vitalsRight: { label: string; value: number; unit: string; icon: ReactNode }[];
    onPrint: () => void;
    onNewPatient: () => void;
}

export function ScreeningResultView({
    diagnosis,
    quizHistory,
    vitalsLeft,
    vitalsRight,
    onPrint,
    onNewPatient,
}: ScreeningResultViewProps) {
    return (
        <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${styles.resultViewRoot} print:block`}
        >
            <header className={`${styles.resultHeaderFullWidth} no-print`} aria-hidden="false">
                <div className={styles.resultHeaderBadge}>Hasil Klasifikasi</div>
                <h1 className={styles.resultHeaderTitle}>{diagnosis.title}</h1>
                <p className={styles.resultHeaderDesc}>{diagnosis.description}</p>
            </header>

            <div className={`${styles.resultGridWrap} no-print`}>
                <div className={`${styles.resultGridFive} ${styles.resultGridFiveWithPanel}`}>
                    <div className={`${styles.resultCell} ${styles.resultCellStatic} ${styles.resultCellAreaVitals}`}>
                        <h3 className={styles.resultCardTitle}>Metrik Vitals</h3>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-1 text-[11px]">
                            {vitalsLeft.map((v) => (
                                <div key={v.label} className="flex items-center gap-2">
                                    <div className={`flex items-center justify-center ${styles.vitalIcon}`}>{v.icon}</div>
                                    <div>
                                        <span className={styles.resultCardLabel}>{v.label}</span>
                                        <span className={`${styles.resultCardValue} block`}>{v.value}{v.unit}</span>
                                    </div>
                                </div>
                            ))}
                            {vitalsRight.map((v) => (
                                <div key={v.label} className="flex items-center gap-2">
                                    <div className={`flex items-center justify-center ${styles.vitalIcon}`}>{v.icon}</div>
                                    <div>
                                        <span className={styles.resultCardLabel}>{v.label}</span>
                                        <span className={`${styles.resultCardValue} block`}>{v.value}{v.unit}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={`${styles.resultCell} ${styles.resultCellScroll} ${styles.resultCellAreaSymptoms}`}>
                        <h3 className={`${styles.resultCardTitle} shrink-0`}>Riwayat Gejala (Review)</h3>
                        <div className="space-y-1.5 mt-1 min-h-0">
                            {quizHistory.map((step, i) => (
                                <div key={i} className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100 last:border-0 text-xs">
                                    <p className={`${styles.resultCardValue} font-medium text-slate-700 truncate flex-1 min-w-0`}>{step.question}</p>
                                    <span className={`${styles.resultPill} shrink-0 ${step.answer === 'Ya' ? styles.resultPillYes : styles.resultPillNo}`}>{step.answer}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={`${styles.resultCell} ${styles.resultCellScroll} ${styles.resultCellAreaSop}`}>
                        <h3 className={`${styles.resultCardTitle} shrink-0 flex items-center gap-1.5`}>
                            <span className="w-1 h-3 rounded-full bg-emerald-500" />
                            <span>Instruksi SOP Penanganan</span>
                        </h3>
                        <div className="space-y-1.5 mt-1 min-h-0">
                            {diagnosis.instructions.map((inst, idx) => (
                                <div key={idx} className="bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-slate-700 text-xs">
                                    <p className="leading-relaxed">{inst}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={`${styles.actionPanelScreenOnly} ${styles.resultCell} ${styles.resultCellStatic} ${styles.resultCellAreaActions} no-print`}>
                        <h3 className={styles.resultActionTitle}>Panel Tindakan</h3>
                        <div className="flex flex-col gap-2 flex-1 justify-center min-h-0">
                            <button type="button" onClick={onPrint} className="w-full gradient-primary text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.99] shadow-md" title="Cetak Hasil">
                                <Printer className="w-4 h-4 shrink-0" /> <span>Cetak Hasil</span>
                            </button>
                            <button type="button" onClick={onNewPatient} className="w-full gradient-primary text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.99] shadow-md" title="Pasien Baru">
                                <RefreshCw className="w-4 h-4 shrink-0" /> <span>Pasien Baru</span>
                            </button>
                            <button type="button" className="w-full bg-white border border-slate-200 text-slate-600 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 active:scale-[0.99]" title="Hubungi RS">
                                <ExternalLink className="w-4 h-4 shrink-0" /> <span>Hubungi RS</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
