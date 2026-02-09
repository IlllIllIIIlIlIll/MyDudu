import { useState, useEffect, type ReactNode } from 'react';
import {
  Users,
  Activity,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Thermometer,
  Weight,
  Ruler,
  Stethoscope,
  Printer,
  ChevronLeft,
  RefreshCw,
  User,
  ExternalLink,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
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

// --- Mock Data: Patient Queue ---

const MOCK_QUEUE: Patient[] = [
  {
    id: 'p1',
    name: 'Budi Santoso',
    age: '2 tahun 3 bulan',
    ageMonths: 27,
    gender: 'M',
    parentName: 'Siti Aminah',
    avatar: 'https://images.unsplash.com/photo-1623854767648-e7bb8009f0db?w=200&h=200&fit=crop',
    lastVisit: { weight: 12.5, height: 88, date: '2025-12-10' }
  },
  {
    id: 'p2',
    name: 'Aisyah Putri',
    age: '1 tahun 1 bulan',
    ageMonths: 13,
    gender: 'F',
    parentName: 'Rina Wati',
    avatar: 'https://images.unsplash.com/photo-1590038767624-dac5740a997b?w=200&h=200&fit=crop',
  }
];

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
  isMinimized,
  setIsMinimized,
  onExit
}: {
  patient: Patient;
  isMinimized: boolean;
  setIsMinimized: (m: boolean) => void;
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
        </div>
      )}
    </div>

    <div
      className="mt-auto p-5 flex flex-col gap-2"
      onClick={(event) => event.stopPropagation()}
    >
      <button className={`${isMinimized ? styles.miniAction : 'w-full'} flex items-center justify-center gap-2 font-bold py-3 transition-all ${isMinimized ? styles.miniDanger : styles.sidebarButtonDanger}`}>
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

// --- Main Application ---

export function ScreeningFlow({ onExit }: ScreeningFlowProps) {
  const [phase, setPhase] = useState<'VITALS' | 'QUIZ' | 'RESULT'>('VITALS');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(MOCK_QUEUE[0]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState<string>('start');
  const [quizHistory, setQuizHistory] = useState<{ question: string, answer: string }[]>([]);

  const [vitalsData] = useState<Record<string, { value: number; unit: string; icon: ReactNode; status?: 'normal' | 'danger' }>>({
    weight: { value: 12.8, unit: 'kg', icon: <Weight className="w-4 h-4" /> },
    height: { value: 89.2, unit: 'cm', icon: <Ruler className="w-4 h-4" /> },
    temp: { value: 38.6, unit: '°C', icon: <Thermometer className="w-4 h-4" />, status: 'danger' },
    spo2: { value: 98, unit: '%', icon: <Activity className="w-4 h-4" /> },
    heartRate: { value: 110, unit: 'bpm', icon: <Activity className="w-4 h-4" /> },
  });

  const [vitalsStatus, setVitalsStatus] = useState<'IDLE' | 'FETCHING' | 'CONNECTED'>('FETCHING');

  useEffect(() => {
    if (phase === 'VITALS' && vitalsStatus === 'IDLE') {
      setVitalsStatus('FETCHING');
      const timer = setTimeout(() => {
        setVitalsStatus('CONNECTED');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, vitalsStatus]);

  const handleDecision = (choice: 'yes' | 'no') => {
    const node = DECISION_TREE[currentNodeId];
    setQuizHistory(prev => [...prev, { question: node.question, answer: choice === 'yes' ? 'Ya' : 'Tidak' }]);
    const nextId = choice === 'yes' ? node.yesNodeId : node.noNodeId;

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

  const handlePrint = () => {
    window.print();
  };

  const currentNode = DECISION_TREE[currentNodeId];

  return (
    <div className={`${styles.pedsScope} fixed inset-0 z-50 h-screen w-screen flex overflow-hidden font-sans`}>

      {/* 2. Patient Sidebar */}
      {selectedPatient && (
        <Sidebar
          patient={selectedPatient}
          isMinimized={isMinimized}
          setIsMinimized={setIsMinimized}
          onExit={onExit}
        />
      )}

      {/* 3. Main Stage */}
      <main className="flex-1 flex flex-col overflow-hidden">

        <div className={`flex-1 overflow-y-auto bg-transparent ${styles.mainContent}`}>
          <AnimatePresence mode="wait">

            {/* --- PHASE 2: VITALS (AUTO) --- */}
            {phase === 'VITALS' && selectedPatient && (
              <motion.div
                key="vitals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className={styles.vitalsWrap}
              >
                <div className="mb-8 text-center">
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
                  className={`w-full transition-all flex items-center justify-center gap-3 ${styles.ctaPrimary}`}
                >
                  Analisis Gejala Lanjutan <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {/* --- PHASE 3: AKINATOR QUIZ --- */}
            {phase === 'QUIZ' && (
              <motion.div
                key="quiz" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }}
                className="max-w-6xl mx-auto h-full flex flex-col items-center justify-center py-6"
              >
                <div className="w-full flex flex-col items-center mb-14">
                  <h2 className={`text-slate-900 text-center mb-2 max-w-5xl ${styles.quizTitleText}`}>
                    {currentNode.question}
                  </h2>
                  <p className={`text-center max-w-3xl ${styles.quizSubtitleText}`}>{currentNode.layman}</p>
                </div>

                <div className={`grid grid-cols-2 ${styles.quizGrid}`}>
                  <QuizCard
                    label="YA, DITEMUKAN"
                    type="yes"
                    image="/placeholder1.png"
                    onClick={() => handleDecision('yes')}
                  />
                  <QuizCard
                    label="TIDAK ADA"
                    type="no"
                    image="/placeholder2.png"
                    onClick={() => handleDecision('no')}
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

            {/* --- PHASE 4: RESULT --- */}
            {phase === 'RESULT' && selectedPatient && currentNode.finalDiagnosis && (
              <motion.div 
                key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto grid grid-cols-12 gap-8 print:block print:max-w-none print:m-0"
              >
                <style dangerouslySetInnerHTML={{ __html: `
                  @media print {
                    body * { visibility: hidden; }
                    .print-section, .print-section * { visibility: visible; }
                    .print-section { 
                      position: absolute; 
                      left: 0; top: 0; 
                      width: 210mm; 
                      height: 297mm; 
                      background: white !important; 
                      padding: 20mm !important;
                      margin: 0 !important;
                    }
                    .no-print { display: none !important; }
                    @page { size: A4; margin: 0; }
                  }
                `}} />

                <div className="col-span-8 space-y-6 print-section print:p-0 print:border-none">
                  <div className="hidden print:flex items-center justify-between border-b-4 border-slate-900 pb-4 mb-8">
                    <div>
                      <h1 className="text-2xl font-extrabold text-slate-900">LAPORAN PEMERIKSAAN POSYANDU</h1>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Desa Sukamaju • Digital Health Engine</p>
                    </div>
                    <Activity className="w-10 h-10 text-indigo-600" />
                  </div>

                  <div className={`p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden print:bg-white print:text-slate-900 print:shadow-none print:border-2 print:rounded-2xl ${
                    currentNode.finalDiagnosis.severity === 'Merah' ? 'bg-rose-600 print:border-rose-600' : 
                    currentNode.finalDiagnosis.severity === 'Kuning' ? 'bg-amber-500 print:border-amber-500' : 'bg-emerald-600 print:border-emerald-600'
                  }`}>
                    <div className="relative z-10">
                      <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-md mb-4 border border-white/10 print:bg-slate-100 print:text-slate-600 print:border-slate-200">
                        <span className="text-[9px] font-bold uppercase tracking-widest">Hasil Klasifikasi</span>
                      </div>
                      <h2 className="text-4xl font-extrabold mb-2 leading-tight print:text-2xl">{currentNode.finalDiagnosis.title}</h2>
                      <p className="text-lg font-medium text-white/80 max-w-xl print:text-slate-600 print:text-sm">{currentNode.finalDiagnosis.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 print:grid-cols-2">
                    <div className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-sm print:rounded-xl print:p-5">
                      <h3 className="font-bold text-slate-400 text-[9px] uppercase tracking-widest mb-4">Biodata Pasien</h3>
                      <div className="space-y-2.5">
                        <div className="flex justify-between border-b border-slate-50 pb-1.5"><span className="text-xs text-slate-500">Nama</span><span className="text-xs font-bold text-slate-700">{selectedPatient.name}</span></div>
                        <div className="flex justify-between border-b border-slate-50 pb-1.5"><span className="text-xs text-slate-500">Umur</span><span className="text-xs font-bold text-slate-700">{selectedPatient.age}</span></div>
                        <div className="flex justify-between"><span className="text-xs text-slate-500">Wali</span><span className="text-xs font-bold text-slate-700">{selectedPatient.parentName}</span></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-sm print:rounded-xl print:p-5">
                      <h3 className="font-bold text-slate-400 text-[9px] uppercase tracking-widest mb-4">Metrik Vitals</h3>
                      <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                        {Object.entries(vitalsData).map(([key, v]) => (
                          <div key={key} className="flex flex-col">
                            <span className="text-[9px] text-slate-400 font-bold uppercase">{key}</span>
                            <span className="text-xs font-bold text-slate-800">{v.value}{v.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-sm print:rounded-xl print:p-5">
                    <h3 className="font-bold text-slate-400 text-[9px] uppercase tracking-widest mb-5">Riwayat Gejala (Review)</h3>
                    <div className="space-y-3">
                      {quizHistory.map((step, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl print:bg-transparent print:border-b print:rounded-none">
                          <p className="text-xs font-bold text-slate-700">{step.question}</p>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${step.answer === 'Ya' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {step.answer}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white rounded-[24px] p-8 print:bg-white print:text-slate-900 print:border-2 print:border-slate-900 print:rounded-xl">
                    <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-indigo-500 rounded-full" /> 
                      Instruksi SOP Penanganan
                    </h3>
                    <div className="space-y-3">
                      {currentNode.finalDiagnosis.instructions.map((inst, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10 print:bg-slate-50 print:border-slate-100">
                          <p className="text-white/80 text-sm font-medium leading-relaxed print:text-slate-700">{inst}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="hidden print:flex justify-between mt-16 pt-8 border-t border-slate-100">
                    <div className="text-center w-40">
                      <p className="text-[9px] text-slate-400 mb-12 uppercase font-bold">Tenaga Kesehatan</p>
                      <div className="border-b border-slate-900 w-full" />
                    </div>
                    <div className="text-center w-40">
                      <p className="text-[9px] text-slate-400 mb-12 uppercase font-bold">Wali Pasien</p>
                      <div className="border-b border-slate-900 w-full" />
                    </div>
                  </div>
                </div>

                <div className="col-span-4 space-y-6 no-print">
                  <div className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-sm sticky top-6">
                    <h3 className="font-bold text-[10px] mb-5 uppercase tracking-widest text-slate-400">Panel Tindakan</h3>
                    <div className="space-y-3">
                      <button 
                        onClick={handlePrint}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg"
                      >
                        <Printer className="w-4 h-4" /> Cetak Hasil
                      </button>
                      <button 
                        onClick={() => { 
                          setPhase('QUEUE'); 
                          setSelectedPatient(null); 
                          setCurrentNodeId('start'); 
                          setVitalsStatus('IDLE');
                          setQuizHistory([]);
                        }} 
                        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-sm shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                      >
                        Pasien Baru
                      </button>
                      <hr className="border-slate-100 my-2" />
                      <button className="w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-xl font-bold text-sm hover:bg-slate-50 flex items-center justify-center gap-2">
                        <ExternalLink className="w-4 h-4" /> Hubungi RS
                      </button>
                    </div>
                  </div>
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
        <div className={`${styles.quizBadge} ${type === 'yes' ? styles.quizBadgeYes : styles.quizBadgeNo} mb-4`}>
          {type === 'yes' ? <CheckCircle2 className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
        </div>
        <h3 className={styles.quizTitle}>{label}</h3>
        <p className={`${styles.quizHint} text-white/70 mt-1`}>
          TAP UNTUK MEMILIH
        </p>
      </div>
    </button>
  );
}
