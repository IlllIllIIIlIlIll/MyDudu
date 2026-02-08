import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  Search, 
  ChevronRight, 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Thermometer,
  Weight,
  Ruler,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Stethoscope,
  Info,
  Printer,
  ChevronLeft,
  RefreshCw,
  PhoneCall,
  LayoutDashboard,
  ClipboardCheck,
  History,
  Settings,
  Bell,
  User,
  ExternalLink,
  Cpu,
  Bluetooth,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';

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
    age: '2y 3m',
    ageMonths: 27,
    gender: 'M',
    parentName: 'Siti Aminah',
    avatar: 'https://images.unsplash.com/photo-1623854767648-e7bb8009f0db?w=200&h=200&fit=crop',
    lastVisit: { weight: 12.5, height: 88, date: '2025-12-10' }
  },
  {
    id: 'p2',
    name: 'Aisyah Putri',
    age: '1y 1m',
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

const NavItem = ({ icon, active }: { icon: React.ReactNode; active?: boolean }) => (
  <button className={`p-3 rounded-xl transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}>
    {icon}
  </button>
);

const Sidebar = ({ patient, isMinimized, setIsMinimized }: { patient: Patient; isMinimized: boolean; setIsMinimized: (m: boolean) => void }) => (
  <motion.aside 
    animate={{ width: isMinimized ? '80px' : '280px' }}
    className="h-full bg-white border-r border-slate-200 flex flex-col relative z-20 transition-all duration-300 shadow-sm"
  >
    <button 
      onClick={() => setIsMinimized(!isMinimized)}
      className="absolute -right-3 top-10 bg-white border border-slate-100 p-1.5 rounded-full shadow-md hover:bg-indigo-50 z-30"
    >
      {isMinimized ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
    </button>

    <div className={`p-5 flex flex-col gap-6 ${isMinimized ? 'items-center' : ''}`}>
      <div className={`flex ${isMinimized ? 'flex-col' : 'items-center'} gap-3`}>
        <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-indigo-100 shadow-sm shrink-0">
          <ImageWithFallback src={patient.avatar} alt={patient.name} className="w-full h-full object-cover" />
        </div>
        {!isMinimized && (
          <div className="min-w-0">
            <h2 className="font-bold text-slate-900 truncate text-sm">{patient.name}</h2>
            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-0.5">Pasien Aktif</p>
          </div>
        )}
      </div>

      {!isMinimized && (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Identitas</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Umur:</span><span className="font-bold text-slate-700">{patient.age}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Gender:</span><span className="font-bold text-slate-700">{patient.gender === 'M' ? 'Laki-laki' : 'Perempuan'}</span></div>
            </div>
          </div>

          <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Wali Pasien</p>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm border border-indigo-100"><User className="w-4 h-4 text-indigo-500" /></div>
              <span className="text-sm font-bold text-indigo-900">{patient.parentName}</span>
            </div>
          </div>
        </div>
      )}
    </div>

    <div className="mt-auto p-5 flex flex-col gap-2">
       <button className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-all border border-slate-100 hover:bg-slate-50 text-slate-600 ${isMinimized ? 'p-2' : ''}`}>
        <History className="w-4 h-4" />
        {!isMinimized && <span className="text-xs">Riwayat</span>}
      </button>
      <button className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-all bg-rose-50 text-rose-600 hover:bg-rose-100 ${isMinimized ? 'p-2' : ''}`}>
        <XCircle className="w-4 h-4" />
        {!isMinimized && <span className="text-xs">Batal Sesi</span>}
      </button>
    </div>
  </motion.aside>
);

// --- Main Application ---

export default function App() {
  const [phase, setPhase] = useState<'QUEUE' | 'VITALS' | 'QUIZ' | 'RESULT'>('QUEUE');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState<string>('start');
  const [quizHistory, setQuizHistory] = useState<{question: string, answer: string}[]>([]);
  
  const [vitalsData] = useState<Record<string, { value: number; unit: string; icon: React.ReactNode; status?: 'normal' | 'danger' }>>({
    weight: { value: 12.8, unit: 'kg', icon: <Weight className="w-4 h-4" /> },
    height: { value: 89.2, unit: 'cm', icon: <Ruler className="w-4 h-4" /> },
    temp: { value: 38.6, unit: '°C', icon: <Thermometer className="w-4 h-4" />, status: 'danger' },
    spo2: { value: 98, unit: '%', icon: <Activity className="w-4 h-4" /> },
    heartRate: { value: 110, unit: 'bpm', icon: <Activity className="w-4 h-4" /> },
  });

  const [vitalsStatus, setVitalsStatus] = useState<'IDLE' | 'FETCHING' | 'CONNECTED'>('IDLE');

  useEffect(() => {
    if (phase === 'VITALS' && vitalsStatus === 'IDLE') {
      setVitalsStatus('FETCHING');
      const timer = setTimeout(() => {
        setVitalsStatus('CONNECTED');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, vitalsStatus]);

  const handleClaim = (p: Patient) => {
    setSelectedPatient(p);
    setPhase('VITALS');
  };

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
    <div className="h-screen w-full bg-[#f8fafc] flex overflow-hidden font-sans text-slate-900">
      
      {/* 1. App Rail */}
      <nav className="w-20 bg-slate-900 shrink-0 flex flex-col items-center py-8 gap-10 border-r border-slate-800">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
          <Activity className="w-7 h-7" />
        </div>
        <div className="flex flex-col gap-6">
          <NavItem icon={<LayoutDashboard className="w-5 h-5" />} active={phase === 'QUEUE'} />
          <NavItem icon={<Users className="w-5 h-5" />} active={selectedPatient !== null} />
          <NavItem icon={<ClipboardCheck className="w-5 h-5" />} />
          <NavItem icon={<Settings className="w-5 h-5" />} />
        </div>
        <div className="mt-auto flex flex-col gap-6">
          <NavItem icon={<Bell className="w-5 h-5" />} />
          <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600" />
        </div>
      </nav>

      {/* 2. Patient Sidebar */}
      {selectedPatient && <Sidebar patient={selectedPatient} isMinimized={isMinimized} setIsMinimized={setIsMinimized} />}

      {/* 3. Main Stage */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-3 text-slate-900">
              {phase === 'QUEUE' ? 'Dashboard Utama' : 'Pemeriksaan Klinis'}
              {phase !== 'QUEUE' && <span className="bg-indigo-600 text-white text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-tighter">Live Session</span>}
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sistem Pendukung Keputusan • Posyandu Digital</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Backend Connected</span>
            </div>
            <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><RefreshCw className="w-4 h-4" /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
          <AnimatePresence mode="wait">
            
            {/* --- PHASE 1: QUEUE --- */}
            {phase === 'QUEUE' && (
              <motion.div 
                key="queue" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="max-w-6xl mx-auto space-y-8 w-full"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
                  <StatCard icon={<Users className="w-5 h-5" />} label="Antrean" value="08" color="blue" />
                  <StatCard icon={<ShieldCheck className="w-5 h-5" />} label="Terverifikasi" value="12" color="green" />
                  <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Kritis" value="01" color="red" />
                  <StatCard icon={<Clock className="w-5 h-5" />} label="Rata-rata" value="12m" color="gray" />
                </div>

                <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                    <h2 className="font-bold text-lg text-slate-900">Daftar Tunggu Pasien</h2>
                    <div className="flex gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Cari..." className="bg-slate-50 border-none rounded-xl py-2 pl-10 pr-4 text-sm w-72 focus:ring-2 focus:ring-indigo-500 text-slate-900" />
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100 bg-white">
                    {MOCK_QUEUE.map(p => (
                      <div key={p.id} className="p-6 flex items-center justify-between hover:bg-indigo-50/30 transition-all group">
                        <div className="flex items-center gap-5">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                            <ImageWithFallback src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-lg leading-tight mb-0.5">{p.name}</p>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span className="font-medium">{p.age}</span>
                              <div className="w-1 h-1 bg-slate-300 rounded-full" />
                              <span className="uppercase tracking-wide font-bold text-[10px]">Wali: {p.parentName}</span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleClaim(p)}
                          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 active:scale-95 shrink-0"
                        >
                          Mulai <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* --- PHASE 2: VITALS (AUTO) --- */}
            {phase === 'VITALS' && selectedPatient && (
              <motion.div 
                key="vitals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="max-w-4xl mx-auto"
              >
                <div className="mb-8 text-center">
                  <div className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-1.5 rounded-full font-bold text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 mb-4">
                    <Bluetooth className="w-3 h-3 animate-pulse" /> Sinkronisasi Sensor Aktif
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Data Biometrik Pasien</h2>
                  <p className="text-slate-500 text-sm font-medium max-w-md mx-auto leading-relaxed">Menarik data dari perangkat Dudu. dari perangkat Dudu</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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

                <div className="bg-white rounded-[28px] border border-slate-200 p-8 mb-8 relative overflow-hidden shadow-sm">
                   <h3 className="font-bold text-slate-400 text-[10px] uppercase tracking-widest mb-6">Analisis Pertumbuhan (KMS)</h3>
                   <div className="space-y-6">
                      <ProgressLine label="BB/U (Berat/Umur)" value={vitalsStatus === 'CONNECTED' ? 85 : 0} color="blue" labelValue="+0.4" />
                      <ProgressLine label="TB/U (Tinggi/Umur)" value={vitalsStatus === 'CONNECTED' ? 62 : 0} color="orange" labelValue="-1.2" />
                      <ProgressLine label="Proporsional BB/TB" value={vitalsStatus === 'CONNECTED' ? 78 : 0} color="green" labelValue="+0.2" />
                   </div>
                </div>

                <button 
                  onClick={() => setPhase('QUIZ')}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3"
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
                <div className="w-full flex flex-col items-center mb-10">
                   <div className="w-16 h-16 bg-indigo-600 text-white rounded-[24px] flex items-center justify-center mb-5 shadow-xl shadow-indigo-500/20 border border-white/20">
                     <Stethoscope className="w-8 h-8" />
                   </div>
                   <h2 className="text-4xl font-extrabold text-slate-900 text-center leading-tight mb-3 max-w-3xl">
                     {currentNode.question}
                   </h2>
                   <p className="text-lg text-slate-400 font-medium text-center">{currentNode.layman}</p>
                </div>

                <div className="grid grid-cols-2 gap-8 w-full max-w-4xl px-4 h-[400px]">
                  <QuizCard 
                    label="YA, DITEMUKAN"
                    type="yes"
                    image={currentNode.imageYes}
                    onClick={() => handleDecision('yes')}
                  />
                  <QuizCard 
                    label="TIDAK ADA"
                    type="no"
                    image={currentNode.imageNo}
                    onClick={() => handleDecision('no')}
                  />
                </div>

                <div className="mt-12 flex items-center gap-6">
                  <button onClick={() => setCurrentNodeId('start')} className="text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center gap-2">
                    <RefreshCw className="w-3 h-3" /> Reset Analisis
                  </button>
                  <div className="h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-indigo-600"
                      initial={{ width: '0%' }}
                      animate={{ width: currentNodeId === 'start' ? '10%' : '60%' }}
                    />
                  </div>
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

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colors: any = {
    blue: 'text-indigo-600 bg-indigo-50/50 border-indigo-100',
    green: 'text-emerald-600 bg-emerald-50/50 border-emerald-100',
    red: 'text-rose-600 bg-rose-50/50 border-rose-100',
    gray: 'text-slate-600 bg-slate-50 border-slate-100'
  };
  return (
    <div className={`bg-white p-6 rounded-[24px] border shadow-sm flex items-center gap-5 min-w-0 w-full transition-all hover:shadow-md ${colors[color]}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${colors[color]}`}>{icon}</div>
      <div className="min-w-0 overflow-hidden">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  );
}

function VitalDisplay({ label, value, unit, icon, loading, status }: { label: string; value: number; unit: string; icon: React.ReactNode; loading?: boolean; status?: 'normal' | 'danger' }) {
  return (
    <div className={`bg-white p-6 rounded-[28px] border-2 transition-all duration-500 ${
      loading ? 'border-dashed border-slate-200 bg-slate-50/50' : 
      status === 'danger' ? 'border-rose-500 ring-4 ring-rose-50 bg-rose-50/10' : 'border-slate-100 hover:border-indigo-200 shadow-sm'
    }`}>
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-slate-50 rounded-xl text-slate-500 border border-slate-100">{icon}</div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        {loading ? (
          <div className="h-10 w-24 bg-slate-100 rounded-lg animate-pulse" />
        ) : (
          <span className={`text-4xl font-extrabold ${status === 'danger' ? 'text-rose-600' : 'text-slate-900'}`}>{value}</span>
        )}
        <span className="text-base font-bold text-slate-300">{unit}</span>
      </div>
    </div>
  );
}

function ProgressLine({ label, value, color, labelValue }: { label: string; value: number; color: string; labelValue: string }) {
  const barColors: any = { blue: 'bg-indigo-600', orange: 'bg-amber-500', green: 'bg-emerald-600' };
  return (
    <div className="flex items-center gap-4">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-32">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
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
  return (
    <button 
      onClick={onClick}
      className={`group relative flex-1 h-full rounded-[40px] overflow-hidden border-4 transition-all hover:scale-[1.02] active:scale-95 ${
        type === 'yes' ? 'border-transparent hover:border-rose-500 shadow-rose-200/50' : 'border-transparent hover:border-emerald-500 shadow-emerald-200/50'
      } shadow-xl hover:shadow-2xl`}
    >
      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
        <ImageWithFallback src={image} alt={label} className="w-full h-full object-cover brightness-[0.7] group-hover:brightness-[0.4]" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-white text-center z-10">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-6 ${
          type === 'yes' ? 'bg-rose-600' : 'bg-emerald-600'
        }`}>
          {type === 'yes' ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
        </div>
        <h3 className="text-2xl font-extrabold uppercase tracking-tight mb-2">{label}</h3>
        <p className="text-[10px] font-bold text-white/60 opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">
          TAP UNTUK MEMILIH
        </p>
      </div>
    </button>
  );
}
