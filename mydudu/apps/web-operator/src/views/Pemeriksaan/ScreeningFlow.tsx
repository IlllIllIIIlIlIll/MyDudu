import { useState, useEffect, type ReactNode } from 'react';
import {
  Activity,
  ChevronRight,
  Thermometer,
  Weight,
  Ruler,
  Printer,
  RefreshCw,
  User,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { useAuth } from '../../context/AuthContext';
import { fetchWithAuth } from '../../lib/api';
import styles from './ScreeningFlow.module.css';

interface ScreeningFlowProps {
  onExit: () => void;
}

const getPublicAsset = (path: string) => {
  if (typeof window === 'undefined') {
    return path;
  }
  const nextData = (window as any).__NEXT_DATA__ || {};
  const prefix = nextData.assetPrefix || nextData.basePath || '';
  if (prefix) {
    return `${prefix}${path}`;
  }
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts.length > 0) {
    return `/${parts[0]}${path}`;
  }
  return path;
};

// --- Types & Decision Engine Schema ---

type Severity = 'Merah' | 'Kuning' | 'Hijau';

interface DiagnosisResult {
  title: string;
  description: string;
  severity: Severity;
  instructions: string[];
}

interface DecisionNode {
  id: string;
  question: string;
  layman: string;
  imageYes: string;
  imageNo: string;
  yesNodeId?: string;
  noNodeId?: string;
  finalDiagnosis?: DiagnosisResult;
}

interface Patient {
  id: string;
  name: string;
  age: string;
  ageMonths: number;
  gender: 'M' | 'F';
  parentName: string;
  avatar: string;
  lastVisit?: { weight: number; height: number; date: string };
}

interface QueueSession {
  sessionId: number;
  version: number;
  recordedAt: string;
  weight: number | null;
  height: number | null;
  temperature: number | null;
  heartRate: number | null;
  child: {
    id: number;
    fullName: string;
    birthDate: string;
    gender: 'M' | 'F' | null;
    parentName: string | null;
  };
  lock?: {
    lockedByOperatorId?: number | null;
    ttlSecondsRemaining: number;
    lockExpired?: boolean;
  };
  claimable?: boolean;
  isStale?: boolean;
  lockToken?: string;
}

interface QuizStepHistory {
  stepOrder: number;
  nodeId: string;
  question: string;
  answer: 'Ya' | 'Tidak';
  answerYes: boolean;
  nextNodeId?: string;
}

// --- Akinator-like Logic Tree (Consistent Paths) ---

const DECISION_TREE: Record<string, DecisionNode> = {
  start: {
    id: 'start',
    question: 'Apakah anak mengalami demam tinggi?',
    layman: 'Suhu tubuh terasa panas saat disentuh atau > 37.5°C',
    imageYes: 'https://images.unsplash.com/photo-1748200100427-52921dec8597?w=400&h=300&fit=crop',
    imageNo: 'https://images.unsplash.com/photo-1758691462119-792279713969?w=400&h=300&fit=crop',
    yesNodeId: 'fever_path',
    noNodeId: 'no_fever_path'
  },
  fever_path: {
    id: 'fever_path',
    question: 'Apakah anak juga mengalami batuk?',
    layman: 'Batuk berdahak atau kering selama lebih dari 2 hari',
    imageYes: 'https://images.unsplash.com/photo-1693066048671-f7bdcb48f735?w=400&h=300&fit=crop',
    imageNo: 'https://images.unsplash.com/photo-1746911053268-8629a8941e96?w=400&h=300&fit=crop',
    yesNodeId: 'pneumonia_check',
    noNodeId: 'dengue_check'
  },
  pneumonia_check: {
    id: 'pneumonia_check',
    question: 'Apakah nafas anak terasa sangat cepat?',
    layman: 'Hitung tarikan nafas anak dalam 1 menit saat sedang tenang',
    imageYes: 'https://images.unsplash.com/photo-1715529407988-3054ef00335c?w=400&h=300&fit=crop',
    imageNo: 'https://images.unsplash.com/photo-1758691462119-792279713969?w=400&h=300&fit=crop',
    yesNodeId: 'diag_pneumonia',
    noNodeId: 'diag_common_cold'
  },
  dengue_check: {
    id: 'dengue_check',
    question: 'Apakah muncul bintik merah di kulit?',
    layman: 'Bercak merah yang tidak hilang saat ditekan',
    imageYes: 'https://images.unsplash.com/photo-1746911053268-8629a8941e96?w=400&h=300&fit=crop',
    imageNo: 'https://images.unsplash.com/photo-1758691462119-792279713969?w=400&h=300&fit=crop',
    yesNodeId: 'diag_dengue',
    noNodeId: 'diag_fever'
  },
  no_fever_path: {
    id: 'no_fever_path',
    question: 'Apakah anak mengalami diare (BAB cair)?',
    layman: 'Buang air besar lebih cair dari biasanya, lebih dari 3x sehari',
    imageYes: 'https://images.unsplash.com/photo-1716929806153-4e3f66242de0?w=400&h=300&fit=crop',
    imageNo: 'https://images.unsplash.com/photo-1758691462119-792279713969?w=400&h=300&fit=crop',
    yesNodeId: 'dehydration_check',
    noNodeId: 'diag_healthy'
  },
  dehydration_check: {
    id: 'dehydration_check',
    question: 'Apakah anak tampak lemas atau sangat haus?',
    layman: 'Anak sulit dibangunkan atau minum dengan lahap karena sangat haus',
    imageYes: 'https://images.unsplash.com/photo-1751574979481-5cd79f421333?w=400&h=300&fit=crop',
    imageNo: 'https://images.unsplash.com/photo-1716929806153-4e3f66242de0?w=400&h=300&fit=crop',
    yesNodeId: 'diag_diarrhea_severe',
    noNodeId: 'diag_diarrhea_mild'
  },
  diag_pneumonia: {
    id: 'diag_pneumonia',
    question: '', layman: '', imageYes: '', imageNo: '',
    finalDiagnosis: {
      title: 'Kecurigaan Pneumonia (Infeksi Paru)',
      description: 'Ditemukan kombinasi demam, batuk, dan pernapasan cepat (tachypnea).',
      severity: 'Merah',
      instructions: ['Segera lakukan rujukan ke Puskesmas/RS', 'Berikan oksigen tambahan jika tersedia', 'Jangan berikan obat batuk sembarangan']
    }
  },
  diag_dengue: {
    id: 'diag_dengue',
    question: '', layman: '', imageYes: '', imageNo: '',
    finalDiagnosis: {
      title: 'Potensi DBD (Demam Berdarah)',
      description: 'Adanya demam tinggi disertai ruam kulit (petechiae) memerlukan tes darah.',
      severity: 'Merah',
      instructions: ['Segera periksa ke Dokter', 'Berikan minum yang banyak', 'Pantau tanda-tanda pendarahan gusi/hidung']
    }
  },
  diag_diarrhea_severe: {
    id: 'diag_diarrhea_severe',
    question: '', layman: '', imageYes: '', imageNo: '',
    finalDiagnosis: {
      title: 'Diare Akut dengan Dehidrasi Berat',
      description: 'Kombinasi diare dan penurunan kesadaran/lemas merupakan gawat darurat.',
      severity: 'Merah',
      instructions: ['Rujuk Segera ke UGD', 'Berikan oralit sedikit demi sedikit selama perjalanan', 'Pasang infus jika di fasilitas kesehatan']
    }
  },
  diag_healthy: {
    id: 'diag_healthy',
    question: '', layman: '', imageYes: '', imageNo: '',
    finalDiagnosis: {
      title: 'Kondisi Anak Baik (Sehat)',
      description: 'Tidak ditemukan tanda-tanda infeksi akut atau dehidrasi pada saat ini.',
      severity: 'Hijau',
      instructions: ['Lanjutkan pemberian makanan bergizi', 'Pastikan jadwal imunisasi lengkap', 'Pantau kebersihan lingkungan']
    }
  }
};

// --- Sub-Components ---

const Sidebar = ({
  patient,
  queue,
  activeSessionId,
  isMinimized,
  setIsMinimized,
  isSwitching,
  onSwitchPatient,
  onCancel,
  onExit
}: {
  patient: Patient;
  queue: QueueSession[];
  activeSessionId: number | null;
  isMinimized: boolean;
  setIsMinimized: (m: boolean) => void;
  isSwitching: boolean;
  onSwitchPatient: (sessionId: number) => void;
  onCancel: () => void;
  onExit: () => void;
}) => (
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
                    className={`w-full text-left px-2 py-2 rounded-lg border text-xs transition-colors ${
                      isActive
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
        {!isMinimized && <span className="text-xs">Batal Sesi</span>}
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

// --- Result view (Hasil Klasifikasi) ---

interface ScreeningResultViewProps {
  diagnosis: DiagnosisResult;
  quizHistory: QuizStepHistory[];
  vitalsLeft: { label: string; value: number; unit: string; icon: ReactNode }[];
  vitalsRight: { label: string; value: number; unit: string; icon: ReactNode }[];
  onPrint: () => void;
  onNewPatient: () => void;
}

function ScreeningResultView({
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

// --- Main Application ---

export function ScreeningFlow({ onExit }: ScreeningFlowProps) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<'VITALS' | 'QUIZ' | 'RESULT'>('VITALS');
  const [queue, setQueue] = useState<QueueSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<QueueSession | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState<string>('start');
  const [quizHistory, setQuizHistory] = useState<QuizStepHistory[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueInitialized, setQueueInitialized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSwitchingPatient, setIsSwitchingPatient] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const selectedPatient: Patient | null = selectedSession
    ? {
      id: String(selectedSession.child.id),
      name: selectedSession.child.fullName,
      ageMonths: (() => {
        const birth = new Date(selectedSession.child.birthDate);
        const now = new Date();
        return Math.max(0, (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth()));
      })(),
      age: (() => {
        const birth = new Date(selectedSession.child.birthDate);
        const now = new Date();
        const total = Math.max(0, (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth()));
        return `${Math.floor(total / 12)} tahun ${total % 12} bulan`;
      })(),
      gender: selectedSession.child.gender === 'F' ? 'F' : 'M',
      parentName: selectedSession.child.parentName || '-',
      avatar: 'https://images.unsplash.com/photo-1623854767648-e7bb8009f0db?w=200&h=200&fit=crop',
      lastVisit: selectedSession.weight !== null && selectedSession.height !== null
        ? { weight: selectedSession.weight, height: selectedSession.height, date: selectedSession.recordedAt }
        : undefined,
    }
    : null;

  const [vitalsData, setVitalsData] = useState<Record<string, { value: number; unit: string; icon: ReactNode; status?: 'normal' | 'danger' }>>({
    weight: { value: 0, unit: 'kg', icon: <Weight className="w-4 h-4" /> },
    height: { value: 0, unit: 'cm', icon: <Ruler className="w-4 h-4" /> },
    temp: { value: 0, unit: '°C', icon: <Thermometer className="w-4 h-4" />, status: 'normal' },
    spo2: { value: 98, unit: '%', icon: <Activity className="w-4 h-4" /> },
    heartRate: { value: 0, unit: 'bpm', icon: <Activity className="w-4 h-4" /> },
  });

  const [vitalsStatus, setVitalsStatus] = useState<'IDLE' | 'FETCHING' | 'CONNECTED'>('FETCHING');

  const diagnosisCodeMap: Record<string, 'PNEUMONIA' | 'DENGUE' | 'DIARRHEA_SEVERE' | 'HEALTHY'> = {
    diag_pneumonia: 'PNEUMONIA',
    diag_dengue: 'DENGUE',
    diag_diarrhea_severe: 'DIARRHEA_SEVERE',
    diag_healthy: 'HEALTHY',
  };

  const claimSession = async (sessionId: number) => {
    if (!user?.id) return null;
    return fetchWithAuth(`/operator/pemeriksaan/${sessionId}/claim?userId=${user.id}`, { method: 'POST' }) as Promise<QueueSession>;
  };

  const loadQueue = async (autoClaim = false) => {
    if (!user?.id) return;
    setQueueLoading(true);
    setApiError(null);
    try {
      const queue = await fetchWithAuth(`/operator/pemeriksaan/queue?userId=${user.id}`) as QueueSession[];
      setQueue(queue);
      if (!queue.length) {
        setSelectedSession(null);
        return;
      }

      const shouldAutoClaim = autoClaim || !selectedSession;
      if (shouldAutoClaim) {
        for (const candidate of queue) {
          try {
            const claimed = await claimSession(candidate.sessionId);
            setSelectedSession(claimed);
            setPhase('VITALS');
            setCurrentNodeId('start');
            setQuizHistory([]);
            setVitalsStatus('IDLE');
            return;
          } catch {
            continue;
          }
        }

        setSelectedSession(null);
        setApiError('Tidak ada sesi yang bisa di-claim saat ini.');
        return;
      }

      if (!queue.find((q) => q.sessionId === selectedSession?.sessionId)) {
        setSelectedSession(null);
      }
    } catch (error: any) {
      setSelectedSession(null);
      setApiError(error?.message || 'Gagal memuat antrean pemeriksaan');
    } finally {
      setQueueLoading(false);
      setQueueInitialized(true);
    }
  };

  useEffect(() => {
    loadQueue(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (queueInitialized && !queueLoading && !selectedSession) {
      onExit();
    }
  }, [queueInitialized, queueLoading, selectedSession, onExit]);

  useEffect(() => {
    if (!selectedSession) return;
    const tempValue = Number(selectedSession.temperature ?? 0);
    setVitalsData({
      weight: { value: Number(selectedSession.weight ?? 0), unit: 'kg', icon: <Weight className="w-4 h-4" /> },
      height: { value: Number(selectedSession.height ?? 0), unit: 'cm', icon: <Ruler className="w-4 h-4" /> },
      temp: { value: tempValue, unit: '°C', icon: <Thermometer className="w-4 h-4" />, status: tempValue > 37.5 ? 'danger' : 'normal' },
      spo2: { value: 98, unit: '%', icon: <Activity className="w-4 h-4" /> },
      heartRate: { value: Number(selectedSession.heartRate ?? 0), unit: 'bpm', icon: <Activity className="w-4 h-4" /> },
    });
  }, [selectedSession]);

  useEffect(() => {
    if (phase === 'VITALS' && vitalsStatus === 'IDLE') {
      setVitalsStatus('FETCHING');
      const timer = setTimeout(() => {
        setVitalsStatus('CONNECTED');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, vitalsStatus]);

  useEffect(() => {
    if (!selectedSession?.lockToken || !user?.id) return;
    const timer = setInterval(async () => {
      try {
        await fetchWithAuth(`/operator/pemeriksaan/${selectedSession.sessionId}/renew-lock?userId=${user.id}`, {
          method: 'POST',
          body: JSON.stringify({ lockToken: selectedSession.lockToken }),
        });
      } catch {
      }
    }, 120000);
    return () => clearInterval(timer);
  }, [selectedSession?.sessionId, selectedSession?.lockToken, user?.id]);

  const handleDecision = (choice: 'yes' | 'no') => {
    const node = DECISION_TREE[currentNodeId];
    const nextId = choice === 'yes' ? node.yesNodeId : node.noNodeId;
    setQuizHistory(prev => [
      ...prev,
      {
        stepOrder: prev.length + 1,
        nodeId: node.id,
        question: node.question,
        answer: choice === 'yes' ? 'Ya' : 'Tidak',
        answerYes: choice === 'yes',
        nextNodeId: nextId,
      }
    ]);

    if (nextId) {
      const nextNode = DECISION_TREE[nextId];
      if (nextNode.finalDiagnosis) {
        setPhase('RESULT');
        setCurrentNodeId(nextId);
      } else {
        setCurrentNodeId(nextId);
      }
    }
  };

  const handlePrint = () => window.print();

  const releaseCurrentLock = async () => {
    if (!selectedSession?.lockToken || !user?.id) return;
    try {
      await fetchWithAuth(`/operator/pemeriksaan/${selectedSession.sessionId}/release-lock?userId=${user.id}`, {
        method: 'POST',
        body: JSON.stringify({ lockToken: selectedSession.lockToken }),
      });
    } catch {
    }
  };

  const handleSwitchPatient = async (sessionId: number) => {
    if (!user?.id) return;
    if (selectedSession?.sessionId === sessionId) return;
    setIsSwitchingPatient(true);
    setApiError(null);
    try {
      if (selectedSession) {
        await releaseCurrentLock();
      }
      const claimed = await claimSession(sessionId);
      if (!claimed) {
        throw new Error('Sesi tidak dapat di-claim');
      }
      setSelectedSession(claimed);
      setPhase('VITALS');
      setCurrentNodeId('start');
      setQuizHistory([]);
      setVitalsStatus('IDLE');
      await loadQueue(false);
    } catch (error: any) {
      setApiError(error?.message || 'Gagal mengganti pasien');
      await loadQueue(false);
    } finally {
      setIsSwitchingPatient(false);
    }
  };

  const handleCancelSession = async () => {
    if (!selectedSession?.lockToken || !user?.id) return;
    if (!window.confirm('Batalkan sesi ini?')) return;

    setSubmitting(true);
    try {
      await fetchWithAuth(`/operator/pemeriksaan/${selectedSession.sessionId}/cancel?userId=${user.id}`, {
        method: 'POST',
        body: JSON.stringify({
          version: selectedSession.version,
          lockToken: selectedSession.lockToken,
        }),
      });
      await loadQueue(false);
    } catch (error: any) {
      setApiError(error?.message || 'Gagal membatalkan sesi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiagnoseAndNext = async () => {
    if (!selectedSession?.lockToken || !user?.id) return;
    const diagnosisCode = diagnosisCodeMap[currentNodeId];
    if (!diagnosisCode) {
      setApiError('Kode diagnosis tidak ditemukan.');
      return;
    }

    setSubmitting(true);
    try {
      await fetchWithAuth(`/operator/pemeriksaan/${selectedSession.sessionId}/diagnose?userId=${user.id}`, {
        method: 'POST',
        body: JSON.stringify({
          diagnosisCode,
          version: selectedSession.version,
          lockToken: selectedSession.lockToken,
          quizSteps: quizHistory.map((step) => ({
            stepOrder: step.stepOrder,
            nodeId: step.nodeId,
            question: step.question,
            answerYes: step.answerYes,
            nextNodeId: step.nextNodeId,
            treeVersion: 'decision-tree-v1',
          })),
        }),
      });
      await loadQueue(false);
    } catch (error: any) {
      setApiError(error?.message || 'Gagal menyimpan diagnosis');
    } finally {
      setSubmitting(false);
    }
  };

  const currentNode = DECISION_TREE[currentNodeId];

  // Vitals display order: left col = weight, temp, heartRate; right col = height, spo2
  const vitalsLeft = [
    { label: 'WEIGHT', value: vitalsData.weight.value, unit: vitalsData.weight.unit, icon: <Weight className="w-3.5 h-3.5" /> },
    { label: 'TEMP', value: vitalsData.temp.value, unit: vitalsData.temp.unit, icon: <Thermometer className="w-3.5 h-3.5" /> },
    { label: 'HEARTRATE', value: vitalsData.heartRate.value, unit: vitalsData.heartRate.unit, icon: <Activity className="w-3.5 h-3.5" /> },
  ];
  const vitalsRight = [
    { label: 'HEIGHT', value: vitalsData.height.value, unit: vitalsData.height.unit, icon: <Ruler className="w-3.5 h-3.5" /> },
    { label: 'SPO2', value: vitalsData.spo2.value, unit: vitalsData.spo2.unit, icon: <Activity className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className={`${styles.pedsScope} fixed inset-0 z-50 h-screen w-screen flex overflow-hidden font-sans`}>

      {/* 2. Patient Sidebar */}
      {selectedPatient && (
        <Sidebar
          patient={selectedPatient}
          queue={queue}
          activeSessionId={selectedSession?.sessionId || null}
          isMinimized={isMinimized}
          setIsMinimized={setIsMinimized}
          isSwitching={isSwitchingPatient}
          onSwitchPatient={handleSwitchPatient}
          onCancel={handleCancelSession}
          onExit={onExit}
        />
      )}

      {/* 3. Main Stage */}
      <main className="flex-1 flex flex-col overflow-hidden">

        <div className={`flex-1 flex flex-col min-h-0 bg-transparent ${phase === 'RESULT' ? 'overflow-hidden' : `overflow-y-auto ${styles.mainContent}`}`}>
          {phase === 'RESULT' && selectedPatient && currentNode.finalDiagnosis ? (
            <div className="flex-1 min-h-0 flex flex-col px-4 py-3">
              <ScreeningResultView
                diagnosis={currentNode.finalDiagnosis}
                quizHistory={quizHistory}
                vitalsLeft={vitalsLeft}
                vitalsRight={vitalsRight}
                onPrint={handlePrint}
                onNewPatient={handleDiagnoseAndNext}
              />
            </div>
          ) : null}
          <AnimatePresence mode="wait">

            {/* --- PHASE 2: VITALS (AUTO) --- */}
            {phase === 'VITALS' && selectedPatient && selectedSession && (
              <motion.div
                key="vitals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className={`${styles.vitalsWrap} w-full h-full`}
              >
                <div className="text-center">
                  <h2 className={`mb-2 ${styles.vitalsTitle}`}>Data Biometrik Pasien</h2>
                  <p className={`max-w-md mx-auto ${styles.vitalsSubtitle}`}>Menarik data dari perangkat Dudu. dari perangkat Dudu</p>
                </div>

                <div className={styles.vitalsGrid}>
                  {Object.entries(vitalsData).map(([key, data]) => (
                    <VitalDisplay
                      key={key}
                      label={key === 'weight' ? 'Berat Badan' : key === 'height' ? 'Tinggi Badan' : key === 'temp' ? 'Suhu Tubuh' : key === 'spo2' ? 'Saturasi O2' : 'Detak Jantung'}
                      value={data.value}
                      unit={data.unit}
                      icon={data.icon}
                      loading={vitalsStatus === 'FETCHING'}
                      status={data.status || (key === 'temp' && data.value > 37.5 ? 'danger' : key === 'spo2' && data.value < 95 ? 'danger' : 'normal')}
                    />
                  ))}
                </div>

                <div className={`${styles.kmsCard} mb-8`}>
                  <h3 className={`mb-6 ${styles.kmsTitle}`}>Analisis Pertumbuhan (KMS)</h3>
                  <div className="space-y-6">
                    <ProgressLine label="BB/U (Berat/Umur)" value={85} color="blue" labelValue="+0.4" />
                    <ProgressLine label="TB/U (Tinggi/Umur)" value={62} color="orange" labelValue="-1.2" />
                    <ProgressLine label="Proporsional BB/TB" value={78} color="green" labelValue="+0.2" />
                  </div>
                </div>

                <button
                  onClick={() => setPhase('QUIZ')}
                  disabled={submitting}
                  className={`w-full transition-all flex items-center justify-center gap-3 ${styles.ctaPrimary}`}
                >
                  Analisis Gejala Lanjutan <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {/* --- PHASE 3: AKINATOR QUIZ --- */}
            {phase === 'QUIZ' && selectedSession && (
              <motion.div
                key="quiz" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }}
                className="max-w-6xl mx-auto h-full flex flex-col items-center justify-center"
              >
                <div className="w-full flex flex-col items-center mb-14">
                  <h2 className={`text-slate-900 text-center mb-2 max-w-5xl ${styles.quizTitleText}`}>
                    {currentNode.question}
                  </h2>
                  <p className={`text-center max-w-3xl ${styles.quizSubtitleText}`}>{currentNode.layman}</p>
                </div>

                <div className={`grid grid-cols-2 ${styles.quizGrid}`}>
                  <QuizCard
                    label="Ada"
                    type="yes"
                    image="/placeholder1.png"
                    onClick={() => !submitting && handleDecision('yes')}
                  />
                  <QuizCard
                    label="Tidak Ada"
                    type="no"
                    image="/placeholder2.png"
                    onClick={() => !submitting && handleDecision('no')}
                  />
                </div>

                <div className="mt-10 h-1.5 w-40 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${styles.pedsAccent}`}
                    initial={{ width: '0%' }}
                    animate={{ width: currentNodeId === 'start' ? '10%' : '60%' }}
                  />
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// --- Internal Utilities ---

function VitalDisplay({ label, value, unit, icon, loading, status }: { label: string; value: number; unit: string; icon: ReactNode; loading?: boolean; status?: 'normal' | 'danger' }) {
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

function ProgressLine({ label, value, color, labelValue }: { label: string; value: number; color: string; labelValue: string }) {
  const barColors: any = { blue: styles.kmsFill, orange: styles.kmsFill, green: styles.kmsFill };
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

function QuizCard({ label, type, image, onClick }: { label: string; type: 'yes' | 'no'; image: string; onClick: () => void }) {
  const isPlaceholder = image.includes('placeholder');
  const resolvedImage = isPlaceholder ? getPublicAsset(image) : image;
  return (
    <button
      onClick={onClick}
      className={`group relative flex-1 h-full transition-all active:scale-95 ${styles.quizCard} ${type === 'yes' ? styles.quizYes : styles.quizNo
        }`}
    >
      <div className={`absolute inset-0 transition-transform duration-700 group-hover:scale-105 ${styles.quizFrame} ${isPlaceholder ? styles.quizPlaceholder : ''}`}>
        <ImageWithFallback
          src={resolvedImage}
          alt={label}
          className={`w-full h-full object-cover ${isPlaceholder ? '' : 'brightness-[0.6]'}`}
        />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-white text-center z-10">
        <h3 className={styles.quizTitle}>{label}</h3>
        <p className={`${styles.quizHint} text-white/70 mt-1`}>
          TAP UNTUK MEMILIH
        </p>
      </div>
    </button>
  );
}
