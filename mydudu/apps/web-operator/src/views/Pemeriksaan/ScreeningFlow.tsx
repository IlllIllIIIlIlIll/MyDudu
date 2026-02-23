import { useState, useEffect, useRef, type ReactNode } from 'react';
import {
  Activity,
  ChevronRight,
  Thermometer,
  Weight,
  Ruler,
  Scale,
  Wind,
  Info,
  AlertCircle,
  TrendingUp,
  Heart,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** 
 * --- UTILITY ---
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * --- COMPONENTS ---
 */
const BiometricCard = ({ label, value, unit, icon, isCritical, loading }: any) => {
  return (
    <div
      className={cn(
        "bg-white p-6 rounded-xl border border-slate-300 shadow-md",
        isCritical ? "border-red-500 bg-red-50" : ""
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div className={cn(
          "p-2.5 rounded-xl",
          isCritical ? "bg-red-100 text-red-700" : "bg-slate-50 text-slate-500"
        )}>
          {icon}
        </div>
        {isCritical && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 uppercase tracking-wider bg-red-100 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" /> Kritikal
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <div className="flex items-baseline gap-1 mt-1">
          {loading ? (
            <div className="h-8 w-16 bg-slate-100 animate-pulse rounded" />
          ) : (
            <h3 className={cn("text-4xl font-bold tabular-nums", isCritical ? "text-red-700" : "text-slate-900")}>
              {value}
            </h3>
          )}
          <span className="text-sm font-semibold text-slate-600">{unit}</span>
        </div>
      </div>
    </div>
  );
};

const GrowthZScoreSlider = ({ label, zScore, value, unit, ideal }: any) => {
  const [currentZ, setCurrentZ] = useState(zScore);
  const trackRef = useRef<HTMLDivElement>(null);

  const getPercentage = (z: number) => {
    const clamped = Math.max(-3.5, Math.min(3.5, z));
    return ((clamped + 3) / 6) * 100;
  };

  const initialPercentage = getPercentage(zScore);

  const getStatusInfo = (z: number) => {
    if (z <= -3) return { label: 'Sangat Kurus/Pendek', color: 'text-red-700', bg: 'bg-red-600', border: 'border-red-500' };
    if (z <= -2) return { label: 'Kurus/Pendek', color: 'text-orange-700', bg: 'bg-orange-500', border: 'border-orange-500' };
    if (z >= 3) return { label: 'Obesitas/Sangat Tinggi', color: 'text-red-700', bg: 'bg-red-600', border: 'border-red-500' };
    if (z >= 2) return { label: 'Gemuk/Tinggi', color: 'text-orange-700', bg: 'bg-orange-500', border: 'border-orange-500' };
    return { label: 'Normal', color: 'text-green-700', bg: 'bg-green-600', border: 'border-green-500' };
  };

  const currentStatus = getStatusInfo(currentZ);

  return (
    <div className="bg-slate-50 p-6 rounded-xl border border-slate-300 shadow-inner overflow-hidden group">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h4 className="text-sm font-bold text-slate-700 mb-1">{label}</h4>
          <div className="flex items-center gap-2">
            <motion.span
              layout
              className={cn("text-xs font-bold px-2 py-0.5 rounded-lg border transition-colors",
                currentStatus.border,
                currentStatus.color.replace('text', 'bg').replace('600', '50'),
                currentStatus.color
              )}
            >
              {currentStatus.label}
            </motion.span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Z-Score: {currentZ.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Initial Data</p>
            <p className="text-lg font-black text-slate-400">{value} <span className="text-xs font-bold text-slate-300">{unit}</span></p>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-emerald-500">Ideal (Median)</p>
            <p className="text-lg font-black text-emerald-600">{ideal?.toFixed(1) || '?'} <span className="text-xs font-bold text-emerald-400">{unit}</span></p>
          </div>
        </div>
      </div>

      <div className="relative pt-6 pb-2">
        <input
          type="range"
          min={-3}
          max={3}
          step={0.01}
          value={currentZ}
          onChange={(e) => setCurrentZ(parseFloat(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #b91c1c 0%, #d97706 18%, #15803d 36%, #15803d 64%, #d97706 82%, #b91c1c 100%)`
          }}
        />

        <div className="flex justify-between text-xs font-bold text-slate-400 mt-2 px-1">
          <span>-3</span>
          <span>0</span>
          <span>+3</span>
        </div>

        <style jsx>{`
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 24px;
            height: 24px;
            background: #111827;
            border: 4px solid white;
            border-radius: 9999px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            cursor: pointer;
            margin-top: -11px;
          }

          input[type="range"]::-webkit-slider-runnable-track {
            height: 8px;
            border-radius: 9999px;
          }

          input[type="range"]::-moz-range-thumb {
            width: 24px;
            height: 24px;
            background: #111827;
            border: 4px solid white;
            border-radius: 9999px;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          }
        `}</style>
      </div>

      <div className="mt-8 flex items-start gap-3 p-3 bg-slate-100 rounded-xl border border-slate-300">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-800 leading-relaxed">
          Gunakan slider untuk melihat interpretasi pada level Z-score yang berbeda.
          {currentZ < -2 || currentZ > 2 ? ' Status saat ini menunjukkan deviasi dari standar normal.' : ' Status saat ini berada dalam rentang pertumbuhan sehat.'}
        </p>
      </div>
    </div>
  );
};
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { fetchWithAuth } from '../../lib/api';
import { clinicalApi, type ClinicalNode } from '../../lib/clinicalApi';
import styles from './ScreeningFlow.module.css';
import { Patient, QueueSession, QuizStepHistory } from './types';
import { SidebarPanel } from './components/SidebarPanel';
import { ScreeningResultView } from './components/ScreeningResultView';
import { VitalDisplay } from './components/VitalDisplay';
import { ProgressLine } from './components/ProgressLine';
import { QuizCard } from './components/QuizCard';
import { GrowthScale } from '../../components/GrowthScale';
import { GrowthSummaryCard } from '../../components/GrowthSummaryCard';
import { RawMeasurementCard } from './components/RawMeasurementCard';
import { ClinicalQuizPage } from './components/ClinicalQuizPage';

const GrowthCard = ({ titleKey, analysis }: { titleKey: string; analysis: any }) => {
  const z = analysis.zScore as number;

  const getStatusMeta = (z: number) => {
    if (z <= -3) return { label: "Sangat Kurus / Sangat Pendek", color: "#b91c1c", bg: "#fee2e2", border: "#fca5a5" };
    if (z <= -2) return { label: "Kurus / Pendek", color: "#d97706", bg: "#fef3c7", border: "#fcd34d" };
    if (z >= 3) return { label: "Obesitas Berat / Sangat Tinggi", color: "#b91c1c", bg: "#fee2e2", border: "#fca5a5" };
    if (z >= 2) return { label: "Gemuk / Tinggi", color: "#d97706", bg: "#fef3c7", border: "#fcd34d" };
    return { label: "Normal", color: "#15803d", bg: "#dcfce7", border: "#86efac" };
  };

  const status = getStatusMeta(z);
  // Friendly measurement names from the titleKey
  const title = titleKey
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div
      className="border rounded-xl p-5 flex flex-col justify-between gap-3 transition-all"
      style={{ backgroundColor: status.bg, borderColor: status.border }}
    >
      {/* Title & label */}
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-bold text-slate-700 leading-tight">{title}</div>
        <span
          className="shrink-0 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ color: status.color, backgroundColor: 'rgba(255,255,255,0.6)' }}
        >
          {status.label}
        </span>
      </div>

      {/* Static spectrum bar (read-only) */}
      <div className="relative h-2 rounded-full overflow-hidden"
        style={{ background: 'linear-gradient(to right, #b91c1c 0%, #d97706 18%, #15803d 36%, #15803d 64%, #d97706 82%, #b91c1c 100%)' }}
      >
        {/* Indicator pin */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-slate-700 shadow"
          style={{ left: `${Math.min(100, Math.max(0, ((Math.max(-3, Math.min(3, z)) + 3) / 6) * 100))}%`, transform: 'translate(-50%, -50%)' }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-bold text-slate-400 px-0.5">
        <span>-3</span><span>0</span><span>+3</span>
      </div>

      {/* Raw values */}
      {analysis.measurements && (
        <div className="flex gap-3 flex-wrap">
          {Object.entries(analysis.measurements as Record<string, { value: number; unit: string }>).map(([k, v]) => (
            <div key={k} className="text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wide">{k}: </span>
              <span className="font-semibold text-slate-800">{v.value} {v.unit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface ScreeningFlowProps {
  onExit: () => void;
}

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

  // Clinical API state
  const [clinicalSessionId, setClinicalSessionId] = useState<string | null>(null);
  const [clinicalNodes, setClinicalNodes] = useState<Record<string, ClinicalNode>>({});
  const [clinicalOutcome, setClinicalOutcome] = useState<string | null>(null);
  const [clinicalLoading, setClinicalLoading] = useState(false);

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
            setCurrentNodeId('');
            setQuizHistory([]);
            setVitalsStatus('IDLE');
            setClinicalSessionId(null);
            setClinicalNodes({});
            setClinicalOutcome(null);
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
    }
  }, [phase, vitalsStatus]);

  useEffect(() => {
    if (vitalsStatus === 'FETCHING') {
      const timer = setTimeout(() => {
        setVitalsStatus('CONNECTED');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [vitalsStatus]);

  // Keep a ref to phase so the lock-renewal interval can read it without being a dep
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    if (!selectedSession?.lockToken || !user?.id) return;
    const timer = setInterval(async () => {
      // Don't renew lock if session is already in RESULT phase (CLINICALLY_DONE)
      if (phaseRef.current === 'RESULT') return;
      try {
        await fetchWithAuth(`/operator/pemeriksaan/${selectedSession.sessionId}/renew-lock?userId=${user.id}`, {
          method: 'POST',
          body: JSON.stringify({ lockToken: selectedSession.lockToken }),
        });
      } catch {
        // Silently ignore — session may have been completed or lock expired
      }
    }, 120000);
    return () => clearInterval(timer);
  }, [selectedSession?.sessionId, selectedSession?.lockToken, user?.id]);

  // Start clinical session when entering QUIZ phase
  useEffect(() => {
    if (phase === 'QUIZ' && !clinicalSessionId && selectedSession) {
      const startClinicalSession = async () => {
        setClinicalLoading(true);
        // Reset any leftover outcome states before fetching
        setClinicalOutcome(null);
        setApiError(null);

        try {
          const response = await clinicalApi.startSession(
            selectedSession.sessionUuid
            // deviceUuid is optional and will use first available device as fallback
          );

          setClinicalSessionId(response.sessionId);

          // If session is already complete, skip to RESULT phase
          if (response.alreadyComplete && response.examOutcome) {
            setClinicalOutcome(response.examOutcome);
            setPhase('RESULT');
            return;
          }

          // Convert initial nodes to Record format
          const nodesMap = response.initialNodes.reduce((acc, node) => {
            acc[node.id] = node;
            return acc;
          }, {} as Record<string, ClinicalNode>);

          setClinicalNodes(nodesMap);

          // Set first node as current
          if (response.initialNodes.length > 0) {
            setCurrentNodeId(response.initialNodes[0].id);
          }
        } catch (error: any) {
          setApiError(error?.message || 'Gagal memulai sesi klinis');
        } finally {
          setClinicalLoading(false);
        }
      };

      startClinicalSession();
    }
  }, [phase, clinicalSessionId, selectedSession]);

  const handleDecision = async (choice: 'yes' | 'no') => {
    if (!clinicalSessionId || !clinicalNodes[currentNodeId]) return;

    const node = clinicalNodes[currentNodeId];
    const answer = choice === 'yes';
    const nextId = choice === 'yes' ? node.yesNodeId : node.noNodeId;

    setQuizHistory(prev => [
      ...prev,
      {
        stepOrder: prev.length + 1,
        nodeId: node.id,
        question: node.question,
        answer: choice === 'yes' ? 'Ya' : 'Tidak',
        answerYes: answer,
        nextNodeId: nextId || undefined,
      }
    ]);

    setClinicalLoading(true);
    try {
      const response = await clinicalApi.submitAnswer(clinicalSessionId, node.id, answer);

      if (response.outcome) {
        // Final outcome reached
        setClinicalOutcome(response.outcome);
        setPhase('RESULT');
      } else if (response.nextNode) {
        // More questions — backend drives navigation (multi-disease sequential)
        const n = response.nextNode;
        const nextNodeEntry: ClinicalNode = {
          id: n.nodeId,
          question: n.question,
          layman: n.layman ?? '',
          yesNodeId: null, // Backend drives flow; frontend doesn't need these
          noNodeId: null,
          diseaseId: n.diseaseId
        };

        setClinicalNodes(prev => ({ ...prev, [n.nodeId]: nextNodeEntry }));
        setCurrentNodeId(n.nodeId);
      }
    } catch (error: any) {
      setApiError(error?.message || 'Gagal mengirim jawaban');
    } finally {
      setClinicalLoading(false);
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
      setCurrentNodeId('');
      setQuizHistory([]);
      setVitalsStatus('IDLE');
      setClinicalSessionId(null);
      setClinicalNodes({});
      setClinicalOutcome(null);
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
    // #11: Removed window.confirm — renamed to 'Selesaikan Sesi' which is clear enough intent
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
      setApiError(error?.message || 'Gagal menyelesaikan sesi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiagnoseAndNext = async () => {
    if (!selectedSession?.lockToken || !user?.id || !clinicalOutcome) return;

    setSubmitting(true);
    try {
      await fetchWithAuth(`/operator/pemeriksaan/${selectedSession.sessionId}/diagnose?userId=${user.id}`, {
        method: 'POST',
        body: JSON.stringify({
          diagnosisCode: clinicalOutcome,
          version: selectedSession.version,
          lockToken: selectedSession.lockToken,
          quizSteps: quizHistory.map((step) => ({
            stepOrder: step.stepOrder,
            nodeId: step.nodeId,
            question: step.question,
            answerYes: step.answerYes,
            nextNodeId: step.nextNodeId,
            treeVersion: clinicalSessionId || 'clinical-api-v1',
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

  const currentNode = clinicalNodes[currentNodeId];

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
    <div className={`${styles.pedsScope} fixed inset-0 z-50 bg-slate-200 flex font-sans`}>

      {/* 2. Patient Sidebar */}
      {selectedPatient && (
        <SidebarPanel
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
      <div className="flex-1 min-w-0 flex flex-col transition-all duration-300">

        <main className="flex-1 flex flex-col min-h-0 bg-white">
          {phase === 'RESULT' && selectedPatient && clinicalOutcome ? (
            <div className="flex-1 min-h-0 flex flex-col px-4 py-3">
              <ScreeningResultView
                diagnosis={{
                  title: clinicalOutcome === 'DIAGNOSED' ? 'Terdiagnosis' : clinicalOutcome === 'REFER_IMMEDIATELY' ? 'Rujuk Segera' : clinicalOutcome === 'EMERGENCY' ? 'Gawat Darurat' : 'Hasil Pemeriksaan',
                  description: `Hasil pemeriksaan klinis: ${clinicalOutcome}`,
                  severity: clinicalOutcome === 'EMERGENCY' || clinicalOutcome === 'REFER_IMMEDIATELY' ? 'Merah' : clinicalOutcome === 'DIAGNOSED' ? 'Kuning' : 'Hijau',
                  instructions: clinicalOutcome === 'EMERGENCY' ? ['Rujuk ke UGD segera', 'Berikan pertolongan pertama'] : clinicalOutcome === 'REFER_IMMEDIATELY' ? ['Rujuk ke fasilitas kesehatan', 'Pantau kondisi anak'] : ['Lanjutkan pemantauan', 'Berikan perawatan sesuai anjuran']
                }}
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
              <div className="h-full w-full flex-1 flex flex-col px-4 md:px-8 lg:px-12 py-4 md:py-8 overflow-y-auto overflow-x-hidden">

                <div className="h-full grid grid-rows-[auto_auto_1fr_auto] gap-8">

                  {/* ================= HEADER ================= */}
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                      Data Biometrik Pasien
                    </h1>
                    <p className="text-slate-600 mt-1">
                      Hasil pengukuran perangkat terintegrasi
                    </p>
                  </div>

                  {/* ================= ROW 1 — MEASUREMENTS ================= */}
                  <div className="flex flex-wrap gap-6 [&>*]:flex-1 [&>*]:min-w-[180px]">

                    {[
                      { label: "Berat Badan", value: vitalsData.weight.value, unit: vitalsData.weight.unit, emphasize: true },
                      { label: "Tinggi Badan", value: vitalsData.height.value, unit: vitalsData.height.unit, emphasize: true },
                      { label: "Suhu", value: vitalsData.temp.value, unit: vitalsData.temp.unit },
                      { label: "Detak Jantung", value: vitalsData.heartRate.value, unit: vitalsData.heartRate.unit },
                      { label: "Saturasi O2", value: vitalsData.spo2.value, unit: vitalsData.spo2.unit },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="bg-white border border-slate-300 rounded-xl px-6 py-5 flex flex-col justify-center"
                      >
                        <div className="text-sm font-semibold text-slate-600">
                          {item.label}
                        </div>

                        <div className="mt-3 flex items-baseline gap-2">
                          <span className={`tabular-nums font-bold ${item.emphasize ? "text-4xl" : "text-3xl"}`}>
                            {item.value}
                          </span>
                          <span className="text-lg text-slate-500">
                            {item.unit}
                          </span>
                        </div>
                      </div>
                    ))}

                  </div>

                  {/* ================= ROW 2 — SUMMARY ================= */}
                  <div className="bg-slate-900 text-white rounded-xl px-8 py-4 flex items-center justify-between">

                    <div className="text-lg font-semibold">
                      Ringkasan Status
                    </div>

                    <div className="flex items-center gap-10 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-600 rounded-sm" />
                        Kritikal
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-sm" />
                        Waspada
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-600 rounded-sm" />
                        Normal
                      </div>
                    </div>

                  </div>

                  {/* ================= ROW 3 — INTERPRETATION ================= */}
                  <div className="grid grid-cols-3 gap-8">

                    {selectedSession.growthAnalysis &&
                      Object.entries(selectedSession.growthAnalysis).slice(0, 3).map(([key, analysis], i) => {

                        return <GrowthCard key={i} titleKey={key} analysis={analysis} />;
                      })
                    }

                  </div>

                  {/* ================= CTA ================= */}
                  <div>
                    <button
                      onClick={() => {
                        setClinicalSessionId(null);
                        setClinicalNodes({});
                        setClinicalOutcome(null);
                        setPhase('QUIZ');
                      }}
                      className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-lg font-semibold transition-all"
                    >
                      Analisis Gejala Lanjutan
                    </button>
                  </div>

                </div>

              </div>
            )}

            {/* --- PHASE 3: CLINICAL QUIZ --- */}
            {phase === 'QUIZ' && selectedSession && (
              <>
                {clinicalLoading && Object.keys(clinicalNodes).length === 0 ? (
                  <div className="flex-1 flex items-center justify-center bg-slate-50">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin" />
                      <p className="text-sm font-semibold text-slate-500">Mempersiapkan Analisis Klinis...</p>
                    </div>
                  </div>
                ) : currentNode ? (
                  <ClinicalQuizPage
                    currentQuestion={{
                      id: currentNodeId,
                      question: currentNode.question,
                      layman: currentNode.layman,
                      yesNodeId: currentNode.yesNodeId ?? null,
                      noNodeId: currentNode.noNodeId ?? null,
                    }}
                    currentQuestionIndex={quizHistory.length + 1}
                    totalQuestions={Object.keys(clinicalNodes).length}
                    onAnswer={handleDecision}
                    isSubmitting={submitting || clinicalLoading}
                  />
                ) : apiError ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
                    <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 max-w-md text-center">
                      <AlertCircle className="w-8 h-8 mx-auto mb-3 text-red-500" />
                      <h3 className="text-lg font-bold mb-1">Gagal Memuat Analisis</h3>
                      <p className="text-sm">{apiError}</p>
                      <button
                        onClick={() => setPhase('VITALS')}
                        className="mt-4 px-4 py-2 bg-white rounded-lg text-sm font-semibold border border-red-200 shadow-sm hover:bg-red-50"
                      >
                        Kembali ke Vitals
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
