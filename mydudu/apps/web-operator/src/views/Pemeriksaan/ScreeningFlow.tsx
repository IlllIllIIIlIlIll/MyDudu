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

  // Start clinical session when entering QUIZ phase
  useEffect(() => {
    if (phase === 'QUIZ' && !clinicalSessionId && selectedSession) {
      const startClinicalSession = async () => {
        setClinicalLoading(true);
        try {
          const response = await clinicalApi.startSession(
            selectedSession.child.childUuid
            // deviceUuid is optional and will use first available device as fallback
          );

          setClinicalSessionId(response.sessionId);

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
      } else if (response.nextNodes && response.nextNodes.length > 0) {
        // More questions to ask
        const newNodes = response.nextNodes.reduce((acc, n) => {
          acc[n.id] = n;
          return acc;
        }, {} as Record<string, ClinicalNode>);

        setClinicalNodes(prev => ({ ...prev, ...newNodes }));

        // Move to first next node
        if (nextId && newNodes[nextId]) {
          setCurrentNodeId(nextId);
        }
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

        <div className="flex-1 flex flex-col min-h-0 bg-transparent overflow-hidden">
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
              <motion.div
                key="vitals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className={`${styles.vitalsWrap} w-full h-full`}
              >
                {/* SECTION 1: RAW DATA (Measurements only, no interpretation) */}
                <div>
                  <div className="text-center mb-6">
                    <h2 className={`mb-2 ${styles.vitalsTitle}`}>Data Biometrik Pasien</h2>
                    <p className={`max-w-md mx-auto ${styles.vitalsSubtitle}`}>Hasil pengukuran dari perangkat Dudu</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <RawMeasurementCard
                      label="Berat Badan"
                      value={vitalsData.weight.value}
                      unit={vitalsData.weight.unit}
                      icon={vitalsData.weight.icon}
                      loading={vitalsStatus === 'FETCHING'}
                    />
                    <RawMeasurementCard
                      label="Tinggi Badan"
                      value={vitalsData.height.value}
                      unit={vitalsData.height.unit}
                      icon={vitalsData.height.icon}
                      loading={vitalsStatus === 'FETCHING'}
                    />
                    <RawMeasurementCard
                      label="Suhu Tubuh"
                      value={vitalsData.temp.value}
                      unit={vitalsData.temp.unit}
                      icon={vitalsData.temp.icon}
                      loading={vitalsStatus === 'FETCHING'}
                      isCritical={vitalsData.temp.value > 37.5}
                    />
                    <RawMeasurementCard
                      label="Detak Jantung"
                      value={vitalsData.heartRate.value}
                      unit={vitalsData.heartRate.unit}
                      icon={vitalsData.heartRate.icon}
                      loading={vitalsStatus === 'FETCHING'}
                    />
                    <RawMeasurementCard
                      label="Saturasi O2"
                      value={vitalsData.spo2.value}
                      unit={vitalsData.spo2.unit}
                      icon={vitalsData.spo2.icon}
                      loading={vitalsStatus === 'FETCHING'}
                      isCritical={vitalsData.spo2.value < 95}
                    />
                  </div>
                </div>

                {/* SECTION 2: GROWTH INTERPRETATION (Status & Explanation only) */}
                <div className="pt-2 border-t border-slate-100">
                  <h3 className={`mb-4 ${styles.kmsTitle}`}>Interpretasi Pertumbuhan</h3>

                  {selectedSession.growthAnalysis ? (
                    <div className="space-y-4">
                      {/* 1. Overall Summary Card */}
                      <GrowthSummaryCard
                        weightForAgeZ={selectedSession.growthAnalysis['WEIGHT_FOR_AGE']?.zScore}
                        heightForAgeZ={selectedSession.growthAnalysis['LENGTH_HEIGHT_FOR_AGE']?.zScore}
                        weightForHeightZ={
                          selectedSession.growthAnalysis['WEIGHT_FOR_HEIGHT']?.zScore ??
                          selectedSession.growthAnalysis['WEIGHT_FOR_LENGTH']?.zScore
                        }
                        bmiForAgeZ={selectedSession.growthAnalysis['BMI_FOR_AGE']?.zScore}
                      />

                      <div className="grid grid-cols-1 gap-4">
                        {/* 2. Weight-for-Age */}
                        {selectedSession.growthAnalysis['WEIGHT_FOR_AGE'] && (
                          <GrowthScale
                            label="Berat dibanding Umur"
                            value={selectedSession.weight || 0}
                            unit="kg"
                            zScore={selectedSession.growthAnalysis['WEIGHT_FOR_AGE'].zScore}
                            deviation={selectedSession.growthAnalysis['WEIGHT_FOR_AGE'].deviation}
                            ideal={selectedSession.growthAnalysis['WEIGHT_FOR_AGE'].ideal}
                            lms={selectedSession.growthAnalysis['WEIGHT_FOR_AGE'].lms}
                            indicator="WEIGHT_FOR_AGE"
                          />
                        )}

                        {/* 3. Length/Height-for-Age */}
                        {selectedSession.growthAnalysis['LENGTH_HEIGHT_FOR_AGE'] && (
                          <GrowthScale
                            label="Tinggi dibanding Umur"
                            value={selectedSession.height || 0}
                            unit="cm"
                            zScore={selectedSession.growthAnalysis['LENGTH_HEIGHT_FOR_AGE'].zScore}
                            deviation={selectedSession.growthAnalysis['LENGTH_HEIGHT_FOR_AGE'].deviation}
                            ideal={selectedSession.growthAnalysis['LENGTH_HEIGHT_FOR_AGE'].ideal}
                            lms={selectedSession.growthAnalysis['LENGTH_HEIGHT_FOR_AGE'].lms}
                            indicator="LENGTH_HEIGHT_FOR_AGE"
                          />
                        )}

                        {/* 4. Combined Weight-for-Length/Height */}
                        {/* Logic: Show ONE card for WFH/WFL based on backend availability. Label is always consistent. */}
                        {(selectedSession.growthAnalysis['WEIGHT_FOR_LENGTH'] || selectedSession.growthAnalysis['WEIGHT_FOR_HEIGHT']) && (
                          (() => {
                            // Prioritize what exists. Usually backend handles the choice based on age/mode.
                            const indicator = selectedSession.growthAnalysis['WEIGHT_FOR_LENGTH'] ? 'WEIGHT_FOR_LENGTH' : 'WEIGHT_FOR_HEIGHT';
                            const analysis = selectedSession.growthAnalysis[indicator]!;
                            return (
                              <GrowthScale
                                label="Berat dibanding Tinggi Badan"
                                value={selectedSession.weight || 0}
                                unit="kg"
                                zScore={analysis.zScore}
                                deviation={analysis.deviation}
                                ideal={analysis.ideal}
                                lms={analysis.lms}
                                indicator={indicator as any}
                              />
                            );
                          })()
                        )}

                        {/* 5. BMI-for-Age */}
                        {selectedSession.growthAnalysis['BMI_FOR_AGE'] && (
                          <GrowthScale
                            label="Indeks Massa Tubuh dibanding Umur"
                            value={Number((selectedSession.weight! / Math.pow(selectedSession.height! / 100, 2)).toFixed(1))}
                            unit="kg/m²"
                            zScore={selectedSession.growthAnalysis['BMI_FOR_AGE'].zScore}
                            deviation={selectedSession.growthAnalysis['BMI_FOR_AGE'].deviation}
                            ideal={selectedSession.growthAnalysis['BMI_FOR_AGE'].ideal}
                            lms={selectedSession.growthAnalysis['BMI_FOR_AGE'].lms}
                            indicator="BMI_FOR_AGE"
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-100">
                      <p className="text-slate-500 text-sm">
                        Data pertumbuhan belum tersedia untuk dianalisis.
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Pastikan data berat, tinggi, dan tanggal lahir pasien lengkap.
                      </p>
                    </div>
                  )}
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

            {/* --- PHASE 3: CLINICAL QUIZ --- */}
            {phase === 'QUIZ' && selectedSession && currentNode && (
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
            )}

          </AnimatePresence>
        </div>
      </main >
    </div >
  );
}
