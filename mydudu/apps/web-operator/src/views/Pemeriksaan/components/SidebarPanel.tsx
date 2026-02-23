import { motion } from 'motion/react';
import { User, XCircle, LogOut } from 'lucide-react';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';
import { Patient, QueueSession } from '../types';
import styles from '../ScreeningFlow.module.css';

interface SidebarPanelProps {
    patient: Patient;
    queue: QueueSession[];
    activeSessionId: number | null;
    isMinimized: boolean;
    setIsMinimized: (m: boolean) => void;
    isSwitching: boolean;
    onSwitchPatient: (sessionId: number) => void;
    onCancel: () => void;
    onExit: () => void;
}

export const SidebarPanel = ({
    patient,
    queue,
    activeSessionId,
    isMinimized,
    setIsMinimized,
    isSwitching,
    onSwitchPatient,
    onCancel,
    onExit
}: SidebarPanelProps) => (
    <motion.aside
        animate={{ width: isMinimized ? '80px' : '280px' }}
        className={`h-full flex flex-col relative z-20 transition-all duration-300 shadow-sm ${styles.sidebarPanel}`}
        onClick={() => setIsMinimized(!isMinimized)}
    >
        <div
            className={`p-5 flex flex-col gap-6 ${isMinimized ? 'items-center' : ''}`}
            onClick={(event) => event.stopPropagation()}
        >
            <div className={`flex ${isMinimized ? 'flex-col' : 'items-center'} gap-3`}>
                <div className={`overflow-hidden shadow-sm shrink-0 ${styles.sidebarAvatar}`}>
                    <ImageWithFallback src={patient.avatar} alt={patient.name} className="w-full h-full object-cover" />
                </div>
                {!isMinimized && (
                    <div className="min-w-0">
                        <h2 className="font-bold text-slate-900 truncate text-sm">{patient.name}</h2>
                        <p className={`mt-0.5 ${styles.sidebarTag}`}>Pasien Aktif</p>
                    </div>
                )}
            </div>

            {!isMinimized && (
                <div className="space-y-4">
                    <div className={styles.sidebarCard}>
                        <p className={`mb-3 ${styles.sidebarCardTitle}`}>Identitas</p>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between"><span className={styles.sidebarRowLabel}>Umur:</span><span className={styles.sidebarRowValue}>{patient.age}</span></div>
                            <div className="flex justify-between"><span className={styles.sidebarRowLabel}>Gender:</span><span className={styles.sidebarRowValue}>{patient.gender === 'M' ? 'Laki-laki' : 'Perempuan'}</span></div>
                        </div>
                    </div>

                    <div className={`${styles.sidebarCard} ${styles.sidebarGuardian}`}>
                        <p className={`mb-3 ${styles.sidebarCardTitle} ${styles.sidebarGuardianTitle}`}>Wali Pasien</p>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm border border-indigo-100"><User className="w-4 h-4 text-indigo-500" /></div>
                            <span className={`text-sm font-bold ${styles.sidebarGuardianName}`}>{patient.parentName}</span>
                        </div>
                    </div>

                    <div className={styles.sidebarCard}>
                        <p className={`mb-3 ${styles.sidebarCardTitle}`}>Antrian Pemeriksaan</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {queue.length === 0 && (
                                <p className="text-xs text-slate-500">Tidak ada pasien menunggu.</p>
                            )}
                            {queue.map((item) => {
                                const isActive = item.sessionId === activeSessionId;
                                return (
                                    <button
                                        key={item.sessionId}
                                        type="button"
                                        disabled={isSwitching || isActive || item.claimable === false}
                                        onClick={() => onSwitchPatient(item.sessionId)}
                                        className={`w-full text-left px-2 py-2 rounded-lg border text-xs transition-colors ${isActive
                                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60'
                                            }`}
                                    >
                                        <p className="font-semibold truncate">{item.child.fullName}</p>
                                        <p className="text-[10px] text-slate-500">Sesi #{item.sessionId}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div
            className="mt-auto p-5 flex flex-col gap-2"
            onClick={(event) => event.stopPropagation()}
        >
            <button
                onClick={onCancel}
                className={`${isMinimized ? styles.miniAction : 'w-full'} flex items-center justify-center gap-2 font-bold py-3 transition-all ${isMinimized ? styles.miniDanger : styles.sidebarButtonDanger}`}
            >
                <XCircle className="w-4 h-4" />
                {!isMinimized && <span className="text-xs">Selesaikan Sesi</span>}
            </button>
            <button
                onClick={onExit}
                className={`${isMinimized ? styles.miniAction : 'w-full'} flex items-center justify-center gap-2 font-bold py-3 transition-all ${isMinimized ? '' : styles.sidebarButton}`}
            >
                {isMinimized ? <LogOut className="w-4 h-4" /> : <span className="text-xs">Keluar</span>}
            </button>
        </div>
    </motion.aside>
);
