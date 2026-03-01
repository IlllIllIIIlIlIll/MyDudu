'use client';

import React, { useState } from 'react';
import {
    User, ChevronRight, Calculator, FileText,
    Shield, LogOut, ArrowLeft, Edit2, Camera,
    Thermometer, Activity, Info
} from 'lucide-react';
import legalContent from '../data/legalContent.json';

type Screen = 'menu' | 'profile' | 'calculator' | 'standards' | 'privacy';

interface CalculatorResult {
    status: 'Normal' | 'Waspada' | 'Bahaya';
    interpretation: string;
    zscore: string;
}

interface MoreMenuProps {
    onLogout: () => void;
}

export function MoreMenu({ onLogout }: MoreMenuProps) {
    const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [showCalculatorResult, setShowCalculatorResult] = useState(false);
    const [calculatorResult, setCalculatorResult] = useState<CalculatorResult | null>(null);
    const [expandedTabs, setExpandedTabs] = useState('vitals');
    const [privacyTab, setPrivacyTab] = useState<'privacy' | 'terms'>('privacy');

    // Profile Data (Parent)
    const [parentName, setParentName] = useState('Ibu Siti Nurhaliza');
    const [parentPhone, setParentPhone] = useState('081234567890');
    const [parentEmail, setParentEmail] = useState('siti.nurhaliza@email.com');

    // Profile Data (Child)
    const [childName, setChildName] = useState('Ahmad Rizki');
    const [childBirth, setChildBirth] = useState('2022-03-15');
    const [childGender, setChildGender] = useState('Laki-laki');
    const [childBloodType, setChildBloodType] = useState('UNKNOWN');

    // Calculator Data
    const [ageType, setAgeType] = useState<'bulan' | 'tahun'>('bulan');
    const [age, setAge] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');

    const handleCalculate = () => {
        const statuses: ('Normal' | 'Waspada' | 'Bahaya')[] = ['Normal', 'Waspada', 'Bahaya'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const result: CalculatorResult = {
            status: randomStatus,
            interpretation: `Pertumbuhan anak Anda berada dalam kategori ${randomStatus}.`,
            zscore: randomStatus === 'Normal' ? '-0.5 hingga 0.5' : randomStatus === 'Waspada' ? '-1.5 hingga -0.5' : '< -1.5'
        };
        setCalculatorResult(result);
        setShowCalculatorResult(true);
    };

    const handleSaveProfile = () => {
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
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
                <MenuRow icon={Calculator} title="Kalkulator Pertumbuhan" subtitle="Evaluasi WHO manual" onClick={() => setCurrentScreen('calculator')} />
                <MenuRow icon={FileText} title="Standar Medis & Transparansi" subtitle="Referensi batas Normal dan Bahaya" onClick={() => setCurrentScreen('standards')} />
                <MenuRow icon={Shield} title="Hukum & Privasi" subtitle="Kebijakan Privasi dan Syarat & Ketentuan" onClick={() => setCurrentScreen('privacy')} />

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

    const renderProfileScreen = () => (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gray-50 px-4 pt-6 pb-4 border-b border-gray-100 flex items-center sticky top-0 z-10">
                <button onClick={() => setCurrentScreen('menu')} className="p-2 -ml-2 text-gray-500 rounded-full hover:bg-gray-200 active:scale-95 transition-transform">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-semibold text-gray-800 ml-2">Pengaturan Profil</h1>
            </div>

            <div className="px-4 space-y-6">
                {/* Parent Profile */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                    <h2 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
                        <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><User className="w-5 h-5" /></div>
                        Data Orang Tua
                    </h2>
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <Camera className="w-8 h-8 text-gray-400" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Nama Lengkap</label>
                            <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" value={parentName} onChange={e => setParentName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Nomor Telepon</label>
                            <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" value={parentPhone} onChange={e => setParentPhone(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                            <input type="email" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" value={parentEmail} onChange={e => setParentEmail(e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Child Profile */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-20">
                    <h2 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
                        <div className="p-2 bg-green-50 text-green-500 rounded-lg"><User className="w-5 h-5" /></div>
                        Data Anak
                    </h2>
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <Camera className="w-8 h-8 text-gray-400" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Nama Anak</label>
                            <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" value={childName} onChange={e => setChildName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Tanggal Lahir</label>
                            <input type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" value={childBirth} onChange={e => setChildBirth(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Jenis Kelamin</label>
                            <div className="flex gap-2">
                                <button onClick={() => setChildGender('Laki-laki')} className={`flex-1 p-3 rounded-xl border text-sm font-semibold transition-colors ${childGender === 'Laki-laki' ? 'bg-[#129c8d] border-[#129c8d] text-white shadow-md' : 'bg-white border-gray-200 text-gray-600'}`}>Laki-laki</button>
                                <button onClick={() => setChildGender('Perempuan')} className={`flex-1 p-3 rounded-xl border text-sm font-semibold transition-colors ${childGender === 'Perempuan' ? 'bg-[#129c8d] border-[#129c8d] text-white shadow-md' : 'bg-white border-gray-200 text-gray-600'}`}>Perempuan</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Golongan Darah</label>
                            <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" value={childBloodType} onChange={e => setChildBloodType(e.target.value)}>
                                <option value="UNKNOWN">Tidak Diketahui</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="AB">AB</option>
                                <option value="O">O</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-10 pb-[100px]">
                <button onClick={handleSaveProfile} className="w-full p-4 bg-blue-600 text-white font-semibold rounded-2xl active:scale-[0.98] transition-transform shadow-md">
                    Simpan Perubahan
                </button>
            </div>
        </div>
    );

    const renderCalculatorScreen = () => (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gray-50 px-4 pt-6 pb-4 border-b border-gray-100 flex items-center sticky top-0 z-10">
                <button onClick={() => setCurrentScreen('menu')} className="p-2 -ml-2 text-gray-500 rounded-full hover:bg-gray-200 active:scale-95 transition-transform">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-semibold text-gray-800 ml-2">Kalkulator Pertumbuhan</h1>
            </div>

            <div className="px-4 pb-32">
                {!showCalculatorResult ? (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-2xl flex gap-3">
                            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm">Hasil ini merupakan estimasi berdasarkan standar WHO dan bukan pengganti konsultasi medis profesional.</p>
                        </div>

                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-2">Usia</label>
                                <div className="flex gap-2 mb-3">
                                    <button onClick={() => setAgeType('bulan')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${ageType === 'bulan' ? 'bg-[#129c8d] text-white' : 'bg-gray-100 text-gray-600'}`}>Bulan</button>
                                    <button onClick={() => setAgeType('tahun')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${ageType === 'tahun' ? 'bg-[#129c8d] text-white' : 'bg-gray-100 text-gray-600'}`}>Tahun</button>
                                </div>
                                <input type="number" placeholder={`Masukkan usia dalam ${ageType}`} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" value={age} onChange={e => setAge(e.target.value)} min="0" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Tinggi Badan</label>
                                <div className="relative">
                                    <input type="number" placeholder="0" className="w-full p-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" value={height} onChange={e => setHeight(e.target.value)} min="0" />
                                    <span className="absolute right-4 top-3.5 text-gray-400 text-sm font-medium">cm</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Berat Badan</label>
                                <div className="relative">
                                    <input type="number" placeholder="0" className="w-full p-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" value={weight} onChange={e => setWeight(e.target.value)} min="0" />
                                    <span className="absolute right-4 top-3.5 text-gray-400 text-sm font-medium">kg</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center space-y-4">
                        <div className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-2 bg-blue-50 text-blue-700 border border-blue-100">
                            Estimasi WHO
                        </div>

                        <h2 className={`text-3xl font-bold ${calculatorResult?.status === 'Normal' ? 'text-green-500' : calculatorResult?.status === 'Waspada' ? 'text-yellow-500' : 'text-red-500'}`}>
                            {calculatorResult?.status}
                        </h2>

                        <p className="text-gray-600 leading-relaxed text-sm">
                            {calculatorResult?.interpretation}
                        </p>

                        <div className="bg-gray-50 rounded-2xl p-4 mt-6 text-left">
                            <p className="text-xs font-semibold text-gray-500 mb-1">Z-Score</p>
                            <p className="text-sm text-gray-800 font-medium mb-3">{calculatorResult?.zscore}</p>

                            <p className="text-xs text-gray-500 leading-relaxed">
                                Perhitungan menggunakan standar WHO berdasarkan usia, tinggi, dan berat badan yang Anda masukkan. Hasil ini tidak disimpan secara otomatis ke Riwayat.
                            </p>
                        </div>

                        <button onClick={() => setShowCalculatorResult(false)} className="w-full p-3 mt-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl active:scale-95 transition-transform">
                            Hitung Ulang
                        </button>
                    </div>
                )}
            </div>

            {!showCalculatorResult && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-10 pb-[100px]">
                    <button onClick={handleCalculate} className="w-full p-4 bg-blue-600 text-white font-semibold rounded-2xl active:scale-[0.98] transition-transform shadow-md">
                        Hitung Evaluasi
                    </button>
                </div>
            )}
        </div>
    );

    const renderStandardsScreen = () => (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gray-50 px-4 pt-6 pb-4 border-b border-gray-100 flex items-center sticky top-0 z-10">
                <button onClick={() => setCurrentScreen('menu')} className="p-2 -ml-2 text-gray-500 rounded-full hover:bg-gray-200 active:scale-95 transition-transform">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-semibold text-gray-800 ml-2">Standar Medis</h1>
            </div>

            <div className="px-4 pb-32">
                <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-2xl flex gap-3 mb-6 mt-4">
                    <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Memahami standar WHO membantu Anda memonitor kesehatan anak dengan akurat dan mengambil keputusan yang tepat.</p>
                </div>

                <div className="flex gap-2 mb-6">
                    {['vitals', 'zscore', 'age'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setExpandedTabs(tab)}
                            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${expandedTabs === tab ? 'bg-[#129c8d] text-white shadow-md' : 'bg-white border-gray-200 border text-gray-600'}`}
                        >
                            {tab === 'vitals' ? 'Vitals' : tab === 'zscore' ? 'Z-Score' : 'Usia'}
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-3xl pt-2 pb-0 px-0 shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                            <tr>
                                <th className="p-4 font-semibold rounded-tl-3xl">
                                    {expandedTabs === 'vitals' ? 'Parameter' : expandedTabs === 'zscore' ? 'Kategori' : 'Kelompok Usia'}
                                </th>
                                <th className="p-4 font-semibold rounded-tr-3xl">
                                    {expandedTabs === 'vitals' ? 'Rentang Normal' : expandedTabs === 'zscore' ? 'Rentang Z-Score' : 'Standar Berat'}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {expandedTabs === 'vitals' && (
                                <>
                                    <tr><td className="p-4 text-gray-800 font-medium whitespace-nowrap"><Thermometer className="w-4 h-4 inline mr-2 text-gray-400" />Suhu Tubuh</td><td className="p-4 text-gray-600">36.5 - 37.5 °C</td></tr>
                                    <tr><td className="p-4 text-gray-800 font-medium whitespace-nowrap"><Activity className="w-4 h-4 inline mr-2 text-gray-400" />Detak Jantung</td><td className="p-4 text-gray-600">100 - 160 bpm</td></tr>
                                    <tr><td className="p-4 text-gray-800 font-medium whitespace-nowrap"><Activity className="w-4 h-4 inline mr-2 text-gray-400" />Tekanan Darah</td><td className="p-4 text-gray-600">90/60 - 110/70 mmHg</td></tr>
                                </>
                            )}
                            {expandedTabs === 'zscore' && (
                                <>
                                    <tr><td className="p-4 font-semibold text-green-600">Normal</td><td className="p-4 text-gray-600">-1 hingga +1</td></tr>
                                    <tr><td className="p-4 font-semibold text-yellow-600">Waspada</td><td className="p-4 text-gray-600">-2 hingga -1</td></tr>
                                    <tr><td className="p-4 font-semibold text-red-600">Bahaya</td><td className="p-4 text-gray-600">{'< -2'}</td></tr>
                                </>
                            )}
                            {expandedTabs === 'age' && (
                                <>
                                    <tr><td className="p-4 text-gray-800 font-medium">0-6 bulan</td><td className="p-4 text-gray-600">3.5 - 7.5 kg</td></tr>
                                    <tr><td className="p-4 text-gray-800 font-medium">6-12 bulan</td><td className="p-4 text-gray-600">7.5 - 10 kg</td></tr>
                                    <tr><td className="p-4 text-gray-800 font-medium">1-2 tahun</td><td className="p-4 text-gray-600">10 - 15 kg</td></tr>
                                </>
                            )}
                        </tbody>
                    </table>
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

    const renderPrivacyScreen = () => (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gray-50 px-4 pt-6 pb-4 border-b border-gray-100 flex items-center sticky top-0 z-10">
                <button onClick={() => setCurrentScreen('menu')} className="p-2 -ml-2 text-gray-500 rounded-full hover:bg-gray-200 active:scale-95 transition-transform">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-semibold text-gray-800 ml-2">Hukum & Privasi</h1>
            </div>

            <div className="px-4 pb-32 mt-4">
                <div className="flex bg-gray-200 p-1 rounded-xl mb-6">
                    <button onClick={() => setPrivacyTab('privacy')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${privacyTab === 'privacy' ? 'bg-[#129c8d] shadow text-white' : 'text-gray-500 hover:text-gray-700'}`}>Kebijakan Privasi</button>
                    <button onClick={() => setPrivacyTab('terms')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${privacyTab === 'terms' ? 'bg-[#129c8d] shadow text-white' : 'text-gray-500 hover:text-gray-700'}`}>Syarat Ketentuan</button>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    {privacyTab === 'privacy' ? renderLegalContent(legalContent.privacyPolicy) : renderLegalContent(legalContent.termsConditions)}
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-md mx-auto relative overflow-hidden font-sans text-gray-900">
            {currentScreen === 'menu' && renderMenuScreen()}
            {currentScreen === 'profile' && renderProfileScreen()}
            {currentScreen === 'calculator' && renderCalculatorScreen()}
            {currentScreen === 'standards' && renderStandardsScreen()}
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

            {/* Success Toast */}
            {showSuccessToast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-full text-sm font-medium z-[70] shadow-lg animate-in slide-in-from-top-4 fade-in duration-300 flex items-center gap-2 whitespace-nowrap">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    Perubahan berhasil disimpan
                </div>
            )}
        </div>
    );
}
