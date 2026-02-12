import { motion } from 'motion/react';
import styles from '../ScreeningFlow.module.css';

interface ProgressLineProps {
    label: string;
    value: number;
    color: 'blue' | 'orange' | 'green';
    labelValue: string;
}

export function ProgressLine({ label, value, color, labelValue }: ProgressLineProps) {
    const barColors: Record<string, string> = { blue: styles.kmsFill, orange: styles.kmsFill, green: styles.kmsFill };
    return (
        <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-40">{label}</span>
            <div className={styles.kmsTrack}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    className={`h-full rounded-full ${barColors[color]}`}
                />
            </div>
            <span className={`text-xs font-bold w-10 text-right ${color === 'orange' ? 'text-amber-600' : 'text-slate-900'}`}>{labelValue}</span>
        </div>
    );
}
