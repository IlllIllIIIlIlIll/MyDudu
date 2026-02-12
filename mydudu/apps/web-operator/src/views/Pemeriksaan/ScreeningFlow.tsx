import { useState, useEffect, type ReactNode } from 'react';
import {
  Activity,
  ChevronRight,
  Thermometer,
  Weight,
  Ruler,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { fetchWithAuth } from '../../lib/api';
import styles from './ScreeningFlow.module.css';
import { Patient, QueueSession, QuizStepHistory } from './types';
import { DECISION_TREE, DIAGNOSIS_CODE_MAP } from './constants';
import { SidebarPanel } from './components/SidebarPanel';
import { ScreeningResultView } from './components/ScreeningResultView';
import { VitalDisplay } from './components/VitalDisplay';
import { ProgressLine } from './components/ProgressLine';
import { QuizCard } from './components/QuizCard';

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
    const diagnosisCode = DIAGNOSIS_CODE_MAP[currentNodeId];
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
