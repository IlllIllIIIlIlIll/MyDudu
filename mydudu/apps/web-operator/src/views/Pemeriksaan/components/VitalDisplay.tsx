import { ReactNode } from 'react';
import styles from '../ScreeningFlow.module.css';

interface VitalDisplayProps {
    label: string;
    value: number;
    unit: string;
    icon: ReactNode;
    loading?: boolean;
    status?: 'normal' | 'danger';
}

export function VitalDisplay({ label, value, unit, icon, loading, status }: VitalDisplayProps) {
    return (
        <div className={styles.vitalCard}>
            <div className="flex items-center gap-3 mb-5">
                <div className={`flex items-center justify-center ${styles.vitalIcon}`}>{icon}</div>
                <span className={styles.vitalLabel}>{label}</span>
            </div>
            <div className="flex items-baseline gap-3">
                {loading ? (
                    <div className={styles.vitalValuePlaceholder} />
                ) : (
                    <span className={`text-3xl font-semibold ${status === 'danger' ? 'text-rose-600' : 'text-slate-900'}`}>{value}</span>
                )}
                <span className={`text-sm ${styles.vitalUnit}`}>{unit}</span>
            </div>
        </div>
    );
}
