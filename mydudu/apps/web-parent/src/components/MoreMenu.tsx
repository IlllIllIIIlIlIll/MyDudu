'use client';

import React, { useState } from 'react';
import {
    User, ChevronRight, Calculator, FileText,
    Shield, LogOut, ArrowLeft, Edit2, Camera,
    Thermometer, Activity, Info
} from 'lucide-react';
import { VITALS_THRESHOLDS, AGE_THRESHOLDS } from '@mydudu/shared';
// @ts-ignore
import legalContent from '../data/legalContent.json';

type Screen = 'menu' | 'profile' | 'calculator' | 'standards' | 'privacy';

interface CalculatorResult {
    status: 'Normal' | 'Waspada' | 'Bahaya';
    interpretation: string;
    zscore: string;
}

interface MoreMenuProps {
    onLogout: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    childData?: any;
    birthDate?: string;
}

const NumberInputWithControls = ({ label, value, unit, onChange, min = 0 }: any) => {
    const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

    const increment = () => {
        const currentParamsStr = value || '0';
        const num = Number(currentParamsStr);
        const decCount = currentParamsStr.includes('.') ? currentParamsStr.split('.')[1].length : 0;
        onChange((num + 1).toFixed(decCount));
    };

    const decrement = () => {
        const currentParamsStr = value || '0';
        const num = Number(currentParamsStr) - 1;
        const final = Math.max(num, min);
        const decCount = currentParamsStr.includes('.') ? currentParamsStr.split('.')[1].length : 0;
        onChange(final.toFixed(decCount));
    };

    const handlePointerDown = (action: 'inc' | 'dec') => {
        action === 'inc' ? increment() : decrement();
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            action === 'inc' ? increment() : decrement();
        }, 150);
    };

    const handlePointerUp = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    return (
        <div className="flex flex-col bg-white p-2.5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 items-center justify-center">
            <div className="flex items-baseline gap-1 mb-2.5">
                <span className="text-[11px] sm:text-xs font-semibold text-gray-700">{label}</span>
                <span className="text-[10px] sm:text-[11px] font-medium text-gray-400">({unit})</span>
            </div>
            <div className="flex items-center gap-1.5 w-full">
                <button
                    type="button"
                    onPointerDown={() => handlePointerDown('dec')}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    className="w-10 h-10 flex-shrink-0 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-bold active:bg-gray-100 select-none touch-manipulation flex items-center justify-center text-sm shadow-sm transition-colors"
                >-</button>
                <div className="relative flex-1">
                    <input type="number" min={min} step="any" className="w-full h-10 bg-white border border-gray-200 rounded-lg text-center font-semibold text-gray-900 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hide-arrows shadow-sm transition-all pr-7 pl-2" value={value} onChange={e => onChange(e.target.value)} />
                    <span className="absolute right-2 top-2.5 text-gray-400 text-xs font-medium pointer-events-none">{unit}</span>
                </div>
                <button
                    type="button"
                    onPointerDown={() => handlePointerDown('inc')}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    className="w-10 h-10 flex-shrink-0 bg-gray-900 border border-gray-900 text-white rounded-lg hover:bg-gray-800 font-bold active:scale-95 select-none touch-manipulation flex items-center justify-center text-sm shadow-sm transition-all"
                >+</button>
            </div>
        </div>
    );
};

export function MoreMenu({ onLogout, childData, birthDate }: MoreMenuProps) {
    const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showCalculatorResult, setShowCalculatorResult] = useState(false);
    const [calculatorResult, setCalculatorResult] = useState<CalculatorResult | null>(null);
    const [expandedTabs, setExpandedTabs] = useState('vitals');
    const [privacyTab, setPrivacyTab] = useState<'vitals' | 'privacy' | 'terms'>('vitals');

    // Calculator Data
    // Attempt to calculate age in months from birthDate if present
    const defaultAgeMonths = birthDate
        ? Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
        : 0;

    const [ageMonths, setAgeMonths] = useState(defaultAgeMonths.toString());
    const [height, setHeight] = useState(childData?.latestMetrics?.height?.value && childData.latestMetrics.height.value !== '-' ? childData.latestMetrics.height.value.toString() : '');
    const [weight, setWeight] = useState(childData?.latestMetrics?.weight?.value && childData.latestMetrics.weight.value !== '-' ? childData.latestMetrics.weight.value.toString() : '');
    const [temp, setTemp] = useState(childData?.latestMetrics?.temperature?.value && childData.latestMetrics.temperature.value !== '-' ? childData.latestMetrics.temperature.value.toString() : '');
    const [hr, setHr] = useState(childData?.latestMetrics?.heartRate?.value && childData.latestMetrics.heartRate.value !== '-' ? childData.latestMetrics.heartRate.value.toString() : '');
    const [spo2, setSpo2] = useState(childData?.latestMetrics?.spo2?.value && childData.latestMetrics.spo2.value !== '-' ? childData.latestMetrics.spo2.value.toString() : '');

    const handleCalculate = () => {
        // Simple logic for WHO and status calculation based on variables
        // This will be expanded in the result display
        const statuses: ('Normal' | 'Waspada' | 'Bahaya')[] = ['Normal', 'Waspada', 'Bahaya'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const result: CalculatorResult = {
            status: randomStatus,
            interpretation: '',
            zscore: ''
        };
        setCalculatorResult(result);
        setShowCalculatorResult(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const MenuRow = ({ icon: Icon, title, subtitle, onClick, isDanger = false }: any) => (
        <div
            onClick={onClick}
            className={`flex items-center gap-4 p-4 mb-3 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border ${isDanger ? 'border-red-100' : 'border-gray-50'} cursor-pointer active:scale-[0.98] transition-all`}
        >
            <div className={`p-3 rounded-xl ${isDanger ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
                <h3 className={`font-semibold ${isDanger ? 'text-red-500' : 'text-gray-800'}`}>{title}</h3>
                {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            {!isDanger && <ChevronRight className="w-5 h-5 text-gray-400" />}
        </div>
    );

    const renderMenuScreen = () => (
        <div className="w-full">
            <div className="px-4 space-y-2 pt-6">
                <MenuRow icon={Calculator} title="Kalkulator & Evaluasi" subtitle="Hitung dan evaluasi manual" onClick={() => setCurrentScreen('calculator')} />
                <MenuRow icon={FileText} title="Informasi Hukum & Medis" subtitle="Standar WHO, Kebijakan Privasi" onClick={() => setCurrentScreen('privacy')} />

                <div className="mt-8 pt-4 pb-8">
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full p-4 bg-red-500 text-white font-semibold rounded-2xl shadow-sm active:bg-red-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-5 h-5" />
                        Keluar
                    </button>
                </div>
            </div>
        </div>
    );

    const renderCalculatorScreen = () => {
        // Quick compute missing variables from normal bounds based on Age input
        const ageNum = Number(ageMonths) || 0;
        const hNum = Number(height) || 0;
        const wNum = Number(weight) || 0;
        const tNum = Number(temp) || 0;
        const hrNum = Number(hr) || 0;
        const spo2Num = Number(spo2) || 0;

        const safe: string[] = [];
        const warnings: { msg: string; danger: boolean }[] = [];
        const unmeasured: string[] = [];

        let isDanger = false;
        let isWarning = false;

        // BMI logic rough estimation
        if (hNum === 0 || wNum === 0) {
            unmeasured.push("Tinggi/Berat Badan");
        } else {
            const hM = hNum / 100;
            const bmi = wNum / (hM * hM);
            const bmiMinWarning = VITALS_THRESHOLDS.BMI_FALLBACK.WARNING_MIN;
            const bmiMaxWarning = VITALS_THRESHOLDS.BMI_FALLBACK.WARNING_MAX;
            const bmiMinDanger = VITALS_THRESHOLDS.BMI_FALLBACK.DANGER_MIN;
            const bmiMaxDanger = VITALS_THRESHOLDS.BMI_FALLBACK.DANGER_MAX;

            if (bmi < bmiMinDanger) {
                isDanger = true;
                warnings.push({ msg: `BMI masuk kategori Bahaya Kritis (< ${bmiMinDanger})`, danger: true });
            } else if (bmi < bmiMinWarning) {
                isWarning = true;
                warnings.push({ msg: `BMI kurang dari batas minimal normal (${bmiMinWarning})`, danger: false });
            } else if (bmi > bmiMaxDanger) {
                isDanger = true;
                warnings.push({ msg: `BMI masuk kategori Bahaya Obesitas (> ${bmiMaxDanger})`, danger: true });
            } else if (bmi > bmiMaxWarning) {
                isWarning = true;
                warnings.push({ msg: `BMI melebihi batas maksimal normal (${bmiMaxWarning})`, danger: false });
            } else {
                safe.push("BMI");
            }
        }

        // Temp
        if (tNum === 0) {
            unmeasured.push("Suhu Tubuh");
        } else {
            const tempMin = VITALS_THRESHOLDS.TEMPERATURE.MIN_SAFE;
            const tempMax = VITALS_THRESHOLDS.TEMPERATURE.MAX_SAFE;
            if (tNum < tempMin) {
                isWarning = true;
                warnings.push({ msg: `Suhu Tubuh kurang dari normal (${tempMin} °C)`, danger: false });
            } else if (tNum > tempMax) {
                isDanger = true;
                warnings.push({ msg: `Suhu Tubuh lebih dari batas aman (${tempMax} °C)`, danger: true });
            } else {
                safe.push("Suhu Tubuh");
            }
        }

        // HR (rough: newborn 100-160, baby 90-150, child 80-140)
        if (hrNum === 0) {
            unmeasured.push("Detak Jantung");
        } else {
            let hrMin = VITALS_THRESHOLDS.HEART_RATE.CHILD.MIN; 
            let hrMax = VITALS_THRESHOLDS.HEART_RATE.CHILD.MAX;
            if (ageNum <= AGE_THRESHOLDS.NEWBORN_MAX_MONTHS) { 
                hrMin = VITALS_THRESHOLDS.HEART_RATE.NEWBORN.MIN; 
                hrMax = VITALS_THRESHOLDS.HEART_RATE.NEWBORN.MAX; 
            }
            else if (ageNum <= AGE_THRESHOLDS.BABY_MAX_MONTHS) { 
                hrMin = VITALS_THRESHOLDS.HEART_RATE.BABY.MIN; 
                hrMax = VITALS_THRESHOLDS.HEART_RATE.BABY.MAX; 
            }
            
            if (hrNum < hrMin) {
                isDanger = true;
                warnings.push({ msg: `Detak Jantung lambat (< ${hrMin} bpm)`, danger: true });
            } else if (hrNum > hrMax) {
                isDanger = true;
                warnings.push({ msg: `Detak Jantung cepat (> ${hrMax} bpm)`, danger: true });
            } else {
                safe.push("Detak Jantung");
            }
        }

        // SpO2
        if (spo2Num === 0) {
            unmeasured.push("Saturasi Oksigen");
        } else {
            const spoMin = VITALS_THRESHOLDS.SPO2.NORMAL_MIN;
            const spoDanger = VITALS_THRESHOLDS.SPO2.WARNING_MIN;
            if (spo2Num < spoDanger) {
                isDanger = true;
                warnings.push({ msg: `Saturasi Oksigen sangat rendah krisis (< ${spoDanger}%)`, danger: true });
            } else if (spo2Num < spoMin) {
                isWarning = true;
                warnings.push({ msg: `Saturasi Oksigen kurang dari normal (< ${spoMin}%)`, danger: false });
            } else {
                safe.push("Saturasi Oksigen");
            }
        }

        let overallStatus = "Sehat";
        let statusColor = "text-green-700";
        if (isDanger) { overallStatus = "Bahaya"; statusColor = "text-red-700"; }
        else if (isWarning || warnings.length > 0) { overallStatus = "Waspada"; statusColor = "text-yellow-700"; }

        return (
            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300 min-h-screen bg-gray-50">
                <div className="bg-white px-4 pt-6 pb-4 border-b border-gray-100 flex items-center sticky top-0 z-20">
                    <button onClick={() => setCurrentScreen('menu')} className="p-2 -ml-2 text-gray-500 rounded-full hover:bg-gray-100 active:scale-95 transition-transform">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-semibold text-gray-800 ml-2">Kalkulator & Evaluasi</h1>
                </div>

                <div className="px-4 pb-12 mt-6 space-y-6">
                    <div className="grid grid-cols-3 gap-2">
                        <NumberInputWithControls label="Usia" value={ageMonths} unit="bln" onChange={setAgeMonths} min={0} />
                        <NumberInputWithControls label="Tinggi" value={height} unit="cm" onChange={setHeight} min={0} />
                        <NumberInputWithControls label="Berat" value={weight} unit="kg" onChange={setWeight} min={0} />
                        <NumberInputWithControls label="Suhu" value={temp} unit="°C" onChange={setTemp} min={30} />
                        <NumberInputWithControls label="Detak" value={hr} unit="bpm" onChange={setHr} min={0} />
                        <NumberInputWithControls label="Saturasi" value={spo2} unit="%" onChange={setSpo2} min={0} />
                    </div>

                    <div className="bg-white rounded-3xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 mt-6">
                        <h2 className="text-sm font-semibold text-gray-800 mb-3 border-b border-gray-100 pb-3">
                            Status Saat Ini: <span className={statusColor}>{overallStatus}</span>
                        </h2>
                        <div className="space-y-3">
                            {warnings.map((w, idx) => (
                                <p key={`warn-${idx}`} className={`text-sm font-medium ${w.danger ? 'text-red-700' : 'text-yellow-700'} leading-relaxed`}>
                                    • {w.msg}
                                </p>
                            ))}
                            {safe.length > 0 && (
                                <p className="text-sm text-green-700 font-medium leading-relaxed">
                                    • Normal: <span className="text-gray-700 font-normal">{safe.join(', ')}</span>
                                </p>
                            )}
                            {unmeasured.length > 0 && (
                                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                                    • Belum diukur: <span className="font-normal text-gray-500">{unmeasured.join(', ')}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderPrivacyScreen = () => (
            <div className="w-full max-w-none animate-in fade-in slide-in-from-bottom-4 duration-300 min-h-screen bg-white">
                <div className="px-4 pt-6 pb-4 flex items-center sticky top-0 bg-white/80 backdrop-blur-md z-20 border-b border-gray-100">
                    <button onClick={() => setCurrentScreen('menu')} className="p-2 -ml-2 text-gray-500 rounded-full hover:bg-gray-100 active:scale-95 transition-transform">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-semibold text-gray-900 ml-2">Informasi Hukum & Medis</h1>
                </div>

                <div className="px-4 pb-32 mt-6">
                    <div className="inline-flex h-10 w-full items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 mb-6 font-medium">
                        <button onClick={() => setPrivacyTab('vitals')} className={`inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 ${privacyTab === 'vitals' ? 'bg-white text-gray-950 shadow-sm' : 'hover:text-gray-900'}`}>Standar Medis</button>
                        <button onClick={() => setPrivacyTab('privacy')} className={`inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 ${privacyTab === 'privacy' ? 'bg-white text-gray-950 shadow-sm' : 'hover:text-gray-900'}`}>Privasi</button>
                        <button onClick={() => setPrivacyTab('terms')} className={`inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 ${privacyTab === 'terms' ? 'bg-white text-gray-950 shadow-sm' : 'hover:text-gray-900'}`}>Ketentuan</button>
                    </div>

                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 text-sm text-gray-600 leading-relaxed">
                    {privacyTab === 'vitals' && (
                        <div className="space-y-4">
                            <h2 className="font-bold text-gray-800 text-base mb-2">Standar Normal WHO & Kemenkes</h2>

                            <h3 className="font-semibold text-gray-800">1. Indeks Massa Tubuh (BMI)</h3>
                            <p>Dihitung menggunakan rumus: <strong>Berat (kg) / [Tinggi (m)]²</strong>. Batas normal sangat bergantung pada grafik standar WHO per usia bulan, namun secara umum skor persentil atau Z-score normal berada dalam angka -2 hingga +1.</p>

                            <h3 className="font-semibold text-gray-800 mt-4">2. Suhu Tubuh (°C)</h3>
                            <p>Suhu tubuh normal berada di kisaran <strong>36.5 - 37.5 °C</strong>. Angka lebih dari 37.5 °C mengindikasikan demam, dan di bawah 36.5 °C mengindikasikan hipotermia.</p>

                            <h3 className="font-semibold text-gray-800 mt-4">3. Detak Jantung (bpm)</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong>Bayi Baru Lahir (0-1 bln):</strong> 100 - 160 bpm</li>
                                <li><strong>Bayi (1-11 bln):</strong> 90 - 150 bpm</li>
                                <li><strong>Anak (1-3 thn):</strong> 80 - 140 bpm</li>
                            </ul>

                            <h3 className="font-semibold text-gray-800 mt-4">4. Saturasi Oksigen (SpO2)</h3>
                            <p>Kadar oksigen normal berada di persentase <strong>95% - 100%</strong>. Nilai di bawah 95% membutuhkan observasi klinis tambahan.</p>
                        </div>
                    )}
                    {privacyTab === 'privacy' && renderLegalContent(legalContent.privacyPolicy)}
                    {privacyTab === 'terms' && renderLegalContent(legalContent.termsConditions)}
                </div>
            </div>
        </div>
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderLegalContent = (content: any[]) => {
        return content.map((item, index) => {
            switch (item.type) {
                case 'heading':
                    return <h2 key={index} className={`font-bold text-gray-800 text-lg mb-3 ${item.noMarginTop ? 'mt-0' : 'mt-8'}`}>{item.content}</h2>;
                case 'paragraph':
                    return <p key={index} className="text-gray-600 text-sm leading-relaxed mb-4">{item.content}</p>;
                case 'list':
                    return (
                        <ul key={index} className="list-disc pl-5 text-gray-600 text-sm space-y-2 mb-4">
                            {item.items.map((listItem: string, idx: number) => <li key={idx}>{listItem}</li>)}
                        </ul>
                    );
                case 'link_list':
                    return (
                        <ul key={index} className="list-disc pl-5 text-gray-600 text-sm space-y-2 mb-4">
                            {item.items.map((link: any, idx: number) => <li key={idx}><a href={link.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{link.text}</a></li>)}
                        </ul>
                    );
                case 'paragraph_with_email':
                    return (
                        <p key={index} className="text-gray-600 text-sm leading-relaxed mb-4">
                            {item.content1}<a href={`mailto:${item.email}`} className="text-blue-600 hover:underline">{item.email}</a>{item.content2}
                        </p>
                    );
                case 'paragraph_with_link':
                    return (
                        <p key={index} className="text-gray-600 text-sm leading-relaxed mb-4">
                            {item.content1}<a href={item.linkUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{item.linkText}</a>{item.content2}
                        </p>
                    );
                case 'footer_contact':
                    return (
                        <div key={index} className="mt-8 pt-6 border-t border-gray-100 text-sm text-gray-500">
                            <p>{item.content} <a href={`mailto:${item.email}`} className="text-blue-600 hover:underline">{item.email}</a></p>
                        </div>
                    );
                default:
                    return null;
            }
        });
    };

    return (
        <div className="w-full max-w-md mx-auto relative overflow-hidden font-sans text-gray-900">
            {currentScreen === 'menu' && renderMenuScreen()}
            {currentScreen === 'calculator' && renderCalculatorScreen()}
            {currentScreen === 'privacy' && renderPrivacyScreen()}

            {/* Logout Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60] flex items-end animate-in fade-in duration-200" onClick={() => setShowLogoutModal(false)}>
                    <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl p-6 pb-12 animate-in slide-in-from-bottom-full duration-300 shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">Konfirmasi Keluar</h3>
                        <p className="text-gray-500 text-center mb-8 px-4">Apakah Anda yakin ingin keluar? Anda dapat masuk kembali kapan saja.</p>

                        <div className="flex gap-3">
                            <button onClick={() => setShowLogoutModal(false)} className="flex-1 p-4 bg-gray-100 text-gray-700 font-semibold rounded-2xl active:bg-gray-200 transition-colors">
                                Batal
                            </button>
                            <button onClick={() => { setShowLogoutModal(false); onLogout(); }} className="flex-1 p-4 bg-red-500 text-white font-semibold rounded-2xl active:bg-red-600 transition-colors shadow-md shadow-red-500/20">
                                Ya, Keluar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
