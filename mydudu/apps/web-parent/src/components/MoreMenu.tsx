'use client';

import React, { useState } from 'react';
import {
    Calculator, FileText, LogOut, ArrowLeft, User, Save, Camera
} from 'lucide-react';
import { VITALS_THRESHOLDS, AGE_THRESHOLDS } from '@mydudu/shared';
// @ts-ignore
import legalContent from '../data/legalContent.json';

type Screen = 'menu' | 'calculator' | 'privacy' | 'profile';

interface CalculatorResult {
    status: 'Normal' | 'Waspada' | 'Bahaya';
    interpretation: string;
    zscore: string;
}

interface MoreMenuProps {
    onLogout: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    childData?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userData?: any;
    selectedChildId?: string;
    birthDate?: string;
}

const NumberInputWithControls = ({ label, value, unit, onChange, min = 0 }: any) => {
    const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

    const increment = () => {
        const currentParamsStr = value || '0';
        const num = Number(currentParamsStr);
        let nextValue = num + 1;
        if (nextValue > 999) nextValue = 999;
        const decCount = currentParamsStr.includes('.') ? currentParamsStr.split('.')[1].length : 0;
        onChange(nextValue.toFixed(decCount));
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
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            padding: '10px 8px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            width: '100%'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '4px',
                marginBottom: '10px'
            }}>
                <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151'
                }}>{label}</span>
                <span style={{
                    fontSize: '10px',
                    fontWeight: '500',
                    color: '#9ca3af'
                }}>({unit})</span>
            </div>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                width: '100%'
            }}>
                <button
                    type="button"
                    onPointerDown={() => handlePointerDown('dec')}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    style={{
                        width: '24px',
                        height: '34px',
                        flexShrink: 0,
                        backgroundColor: 'transparent',
                        borderRadius: '6px',
                        color: '#4b5563',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s',
                        userSelect: 'none',
                        border: 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onMouseDown={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                >−</button>
                <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                    <input
                        type="number"
                        min={min}
                        max={999}
                        step="any"
                        style={{
                            width: '100%',
                            height: '34px',
                            backgroundColor: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            textAlign: 'center',
                            fontWeight: '600',
                            color: '#111827',
                            fontSize: '15px',
                            outline: 'none',
                            padding: '0 4px',
                            transition: 'all 0.2s',
                            appearance: 'none',
                            letterSpacing: '-0.02em'
                        }}
                        value={value}
                        onChange={e => {
                            const val = e.target.value;
                            if (Number(val) > 999) {
                                onChange('999');
                            } else {
                                onChange(val);
                            }
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#6366f1';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />
                </div>
                <button
                    type="button"
                    onPointerDown={() => handlePointerDown('inc')}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    style={{
                        width: '24px',
                        height: '34px',
                        flexShrink: 0,
                        backgroundColor: 'transparent',
                        color: '#4b5563',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s',
                        userSelect: 'none',
                        border: 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onMouseDown={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                >+</button>
            </div>
        </div>
    );
};

export function MoreMenu({ onLogout, childData, userData, selectedChildId, birthDate }: MoreMenuProps) {
    const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [privacyTab, setPrivacyTab] = useState<'vitals' | 'privacy' | 'terms'>('vitals');

    // Calculator Data
    const defaultAgeMonths = birthDate
        ? Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
        : 0;

    const [ageMonths, setAgeMonths] = useState(defaultAgeMonths.toString());
    const [height, setHeight] = useState(childData?.latestMetrics?.height?.value && childData.latestMetrics.height.value !== '-' ? childData.latestMetrics.height.value.toString() : '');
    const [weight, setWeight] = useState(childData?.latestMetrics?.weight?.value && childData.latestMetrics.weight.value !== '-' ? childData.latestMetrics.weight.value.toString() : '');
    const [temp, setTemp] = useState(childData?.latestMetrics?.temperature?.value && childData.latestMetrics.temperature.value !== '-' ? childData.latestMetrics.temperature.value.toString() : '');
    const [hr, setHr] = useState(childData?.latestMetrics?.heartRate?.value && childData.latestMetrics.heartRate.value !== '-' ? childData.latestMetrics.heartRate.value.toString() : '');
    const [spo2, setSpo2] = useState(childData?.latestMetrics?.spo2?.value && childData.latestMetrics.spo2.value !== '-' ? childData.latestMetrics.spo2.value.toString() : '');

    // Profile Customization Data
    const [profileTab, setProfileTab] = useState<'parent' | 'child'>('parent');

    const [parentFullName, setParentFullName] = useState(userData?.fullName || '');
    const [parentEmail, setParentEmail] = useState(userData?.email || '');
    const [parentNik, setParentNik] = useState(userData?.nik || '');
    const [parentPicPreview, setParentPicPreview] = useState<string | null>(userData?.profilePicture || null);

    const selectedChildDb = userData?.parentProfile?.children?.find((c: any) => c.id.toString() === selectedChildId);
    const [childFullName, setChildFullName] = useState(selectedChildDb?.fullName || '');
    const [childGender, setChildGender] = useState(selectedChildDb?.gender || 'M');
    const [childBloodType, setChildBloodType] = useState(selectedChildDb?.bloodType || 'UNKNOWN');
    const [childBirthDate, setChildBirthDate] = useState(
        selectedChildDb?.birthDate ? new Date(selectedChildDb.birthDate).toISOString().split('T')[0] : ''
    );

    const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert('Ukuran gambar tidak boleh melebihi 2MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (ev.target?.result) setParentPicPreview(ev.target.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveProfile = () => {
        // This will be connected to the backend API later.
        console.log({
            parent: {
                fullName: parentFullName,
                email: parentEmail,
                nik: parentNik,
                profilePicture: parentPicPreview ? '...base64_data...' : null
            },
            child: {
                fullName: childFullName,
                birthDate: childBirthDate,
                gender: childGender,
                bloodType: childBloodType
            }
        });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const MenuRow = ({ icon: Icon, title, subtitle, onClick, isDanger = false }: any) => (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: `1px solid ${isDanger ? '#fee2e2' : '#f3f4f6'}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.06)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
        >
            <div style={{
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: isDanger ? '#fef2f2' : '#eef2ff',
                color: isDanger ? '#ef4444' : '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Icon style={{ width: '20px', height: '20px' }} />
            </div>
            <div style={{ flex: 1 }}>
                <h3 style={{
                    fontWeight: '600',
                    fontSize: '14px',
                    color: isDanger ? '#ef4444' : '#111827',
                    margin: '0 0 2px 0'
                }}>{title}</h3>
                {subtitle && <p style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    margin: '0',
                }}>{subtitle}</p>}
            </div>
        </div>
    );

    const renderMenuScreen = () => (
        <div style={{ width: '100%' }}>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '120px' }}>
                <MenuRow icon={User} title="Profil & Pengaturan" subtitle="Kelola profil Anda dan anak" onClick={() => setCurrentScreen('profile')} />
                <MenuRow icon={Calculator} title="Kalkulator & Evaluasi" subtitle="Hitung dan evaluasi manual" onClick={() => setCurrentScreen('calculator')} />
                <MenuRow icon={FileText} title="Informasi Hukum & Medis" subtitle="Standar WHO, Kebijakan Privasi" onClick={() => setCurrentScreen('privacy')} />

                <div style={{ marginTop: '24px', paddingTop: '12px' }}>
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#ef4444',
                            color: '#ffffff',
                            fontWeight: '600',
                            fontSize: '14px',
                            borderRadius: '10px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                    >
                        <LogOut style={{ width: '18px', height: '18px' }} />
                        Keluar
                    </button>
                </div>
            </div>
        </div>
    );

    const renderCalculatorScreen = () => {
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

        // BMI logic
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

        // HR
        if (hrNum === 0) {
            unmeasured.push("Detak Jantung");
        } else {
            let hrMin: number = VITALS_THRESHOLDS.HEART_RATE.CHILD.MIN;
            let hrMax: number = VITALS_THRESHOLDS.HEART_RATE.CHILD.MAX;
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
        let statusColor = "#16a34a";
        if (isDanger) { overallStatus = "Bahaya"; statusColor = "#dc2626"; }
        else if (isWarning || warnings.length > 0) { overallStatus = "Waspada"; statusColor = "#ea8c55"; }

        return (
            <div style={{
                width: '100%',
                minHeight: '100vh',
                backgroundColor: '#f9fafb'
            }}>
                <div style={{
                    backgroundColor: '#ffffff',
                    padding: '14px 16px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    zIndex: 20,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}>
                    <button
                        onClick={() => setCurrentScreen('menu')}
                        style={{
                            padding: '8px',
                            margin: '-8px 0 -8px -8px',
                            color: '#6b7280',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <ArrowLeft style={{ width: '20px', height: '20px' }} />
                    </button>
                    <h1 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#111827',
                        margin: '0 0 0 8px'
                    }}>Kalkulator & Evaluasi</h1>
                </div>

                <div style={{ padding: '16px', paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px'
                    }}>
                        <NumberInputWithControls label="Usia" value={ageMonths} unit="bln" onChange={setAgeMonths} min={0} />
                        <NumberInputWithControls label="Tinggi" value={height} unit="cm" onChange={setHeight} min={0} />
                        <NumberInputWithControls label="Berat" value={weight} unit="kg" onChange={setWeight} min={0} />
                        <NumberInputWithControls label="Suhu" value={temp} unit="°C" onChange={setTemp} min={30} />
                        <NumberInputWithControls label="Detak" value={hr} unit="bpm" onChange={setHr} min={0} />
                        <NumberInputWithControls label="Saturasi" value={spo2} unit="%" onChange={setSpo2} min={0} />
                    </div>

                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        padding: '14px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                    }}>
                        <h2 style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#111827',
                            marginBottom: '10px',
                            paddingBottom: '10px',
                            borderBottom: '1px solid #e5e7eb',
                            margin: '0 0 10px 0'
                        }}>
                            Status Saat Ini: <span style={{ color: statusColor }}>{overallStatus}</span>
                        </h2>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                        }}>
                            {warnings.map((w, idx) => (
                                <p key={`warn-${idx}`} style={{
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    color: w.danger ? '#dc2626' : '#ea8c55',
                                    lineHeight: '1.4',
                                    margin: '0'
                                }}>
                                    • {w.msg}
                                </p>
                            ))}
                            {safe.length > 0 && (
                                <p style={{
                                    fontSize: '13px',
                                    color: '#16a34a',
                                    fontWeight: '500',
                                    lineHeight: '1.4',
                                    margin: '0'
                                }}>
                                    • Normal: <span style={{ color: '#6b7280', fontWeight: '400' }}>{safe.join(', ')}</span>
                                </p>
                            )}
                            {unmeasured.length > 0 && (
                                <p style={{
                                    fontSize: '13px',
                                    color: '#6b7280',
                                    fontWeight: '500',
                                    lineHeight: '1.4',
                                    margin: '0'
                                }}>
                                    • Belum diukur: <span style={{ fontWeight: '400', color: '#9ca3af' }}>{unmeasured.join(', ')}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderPrivacyScreen = () => (
        <div style={{
            width: '100%',
            minHeight: '100vh',
            backgroundColor: '#ffffff'
        }}>
            <div style={{
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                zIndex: 20,
                borderBottom: '1px solid #e5e7eb'
            }}>
                <button
                    onClick={() => setCurrentScreen('menu')}
                    style={{
                        padding: '8px',
                        margin: '-8px 0 -8px -8px',
                        color: '#6b7280',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <ArrowLeft style={{ width: '20px', height: '20px' }} />
                </button>
                <h1 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 0 8px'
                }}>Informasi Hukum & Medis</h1>
            </div>

            <div style={{ padding: '16px', paddingBottom: '120px' }}>
                <div style={{
                    display: 'inline-flex',
                    height: '36px',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    backgroundColor: '#f3f4f6',
                    padding: '4px',
                    marginBottom: '16px',
                    gap: '4px'
                }}>
                    {['vitals', 'privacy', 'terms'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setPrivacyTab(tab as any)}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: '500',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                backgroundColor: privacyTab === tab ? '#ffffff' : 'transparent',
                                color: privacyTab === tab ? '#111827' : '#6b7280',
                                boxShadow: privacyTab === tab ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            {tab === 'vitals' ? 'Standar Medis' : tab === 'privacy' ? 'Privasi' : 'Ketentuan'}
                        </button>
                    ))}
                </div>

                <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '14px',
                    border: '1px solid #e5e7eb',
                    fontSize: '13px',
                    color: '#6b7280',
                    lineHeight: '1.6'
                }}>
                    {privacyTab === 'vitals' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <h2 style={{ fontWeight: '700', color: '#111827', fontSize: '14px', marginBottom: '4px', margin: '0 0 4px 0' }}>Standar Normal WHO & Kemenkes</h2>

                            <div>
                                <h3 style={{ fontWeight: '600', color: '#111827', fontSize: '13px', marginBottom: '4px', margin: '0 0 4px 0' }}>1. Indeks Massa Tubuh (BMI)</h3>
                                <p style={{ margin: '0', color: '#6b7280', lineHeight: '1.5' }}>Dihitung menggunakan rumus: <strong>Berat (kg) / [Tinggi (m)]²</strong>. Batas normal sangat bergantung pada grafik standar WHO per usia bulan, namun secara umum skor persentil atau Z-score normal berada dalam angka -2 hingga +1.</p>
                            </div>

                            <div>
                                <h3 style={{ fontWeight: '600', color: '#111827', fontSize: '13px', marginBottom: '4px', margin: '0 0 4px 0' }}>2. Suhu Tubuh (°C)</h3>
                                <p style={{ margin: '0', color: '#6b7280', lineHeight: '1.5' }}>Suhu tubuh normal berada di kisaran <strong>36.5 - 37.5 °C</strong>. Angka lebih dari 37.5 °C mengindikasikan demam, dan di bawah 36.5 °C mengindikasikan hipotermia.</p>
                            </div>

                            <div>
                                <h3 style={{ fontWeight: '600', color: '#111827', fontSize: '13px', marginBottom: '4px', margin: '0 0 4px 0' }}>3. Detak Jantung (bpm)</h3>
                                <ul style={{ margin: '0', paddingLeft: '20px', color: '#6b7280', lineHeight: '1.5' }}>
                                    <li><strong>Bayi Baru Lahir (0-1 bln):</strong> 100 - 160 bpm</li>
                                    <li><strong>Bayi (1-11 bln):</strong> 90 - 150 bpm</li>
                                    <li><strong>Anak (1-3 thn):</strong> 80 - 140 bpm</li>
                                </ul>
                            </div>

                            <div>
                                <h3 style={{ fontWeight: '600', color: '#111827', fontSize: '13px', marginBottom: '4px', margin: '0 0 4px 0' }}>4. Saturasi Oksigen (SpO2)</h3>
                                <p style={{ margin: '0', color: '#6b7280', lineHeight: '1.5' }}>Kadar oksigen dalam darah harus ≥ 95%. Nilai di bawah 90% mengindikasikan krisis.</p>
                            </div>
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
                    return <h2 key={index} style={{ fontWeight: '700', color: '#111827', fontSize: '14px', margin: item.noMarginTop ? '0 0 12px 0' : '24px 0 12px 0' }}>{item.content}</h2>;
                case 'paragraph':
                    return <p key={index} style={{ margin: '0 0 16px 0', color: '#6b7280', lineHeight: '1.5' }}>{item.content}</p>;
                case 'list':
                    return (
                        <ul key={index} style={{ margin: '0 0 16px 0', paddingLeft: '20px', color: '#6b7280', lineHeight: '1.5' }}>
                            {item.items.map((listItem: string, idx: number) => <li key={idx} style={{ marginBottom: '8px' }}>{listItem}</li>)}
                        </ul>
                    );
                case 'link_list':
                    return (
                        <ul key={index} style={{ margin: '0 0 16px 0', paddingLeft: '20px', color: '#6b7280', lineHeight: '1.5' }}>
                            {item.items.map((link: any, idx: number) => <li key={idx} style={{ marginBottom: '8px' }}><a href={link.url} target="_blank" rel="noreferrer" style={{ color: '#4f46e5', textDecoration: 'none' }}>{link.text}</a></li>)}
                        </ul>
                    );
                case 'paragraph_with_email':
                    return (
                        <p key={index} style={{ margin: '0 0 16px 0', color: '#6b7280', lineHeight: '1.5' }}>
                            {item.content1}<a href={`mailto:${item.email}`} style={{ color: '#4f46e5', textDecoration: 'none' }}>{item.email}</a>{item.content2}
                        </p>
                    );
                case 'paragraph_with_link':
                    return (
                        <p key={index} style={{ margin: '0 0 16px 0', color: '#6b7280', lineHeight: '1.5' }}>
                            {item.content1}<a href={item.linkUrl} target="_blank" rel="noreferrer" style={{ color: '#4f46e5', textDecoration: 'none' }}>{item.linkText}</a>{item.content2}
                        </p>
                    );
                case 'footer_contact':
                    return (
                        <div key={index} style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f3f4f6', color: '#9ca3af', fontSize: '12px' }}>
                            <p style={{ margin: 0 }}>{item.content} <a href={`mailto:${item.email}`} style={{ color: '#4f46e5', textDecoration: 'none' }}>{item.email}</a></p>
                        </div>
                    );
                default:
                    return null;
            }
        });
    };

    const renderLogoutModal = () => (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            animation: 'fadeIn 0.2s',
            padding: '24px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '320px',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                animation: 'scaleIn 0.2s',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '24px', backgroundColor: '#fee2e2',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto'
                    }}>
                        <LogOut style={{ width: '24px', height: '24px', color: '#ef4444' }} />
                    </div>
                    <h2 style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#111827',
                        marginBottom: '8px',
                        margin: '0 0 8px 0'
                    }}>Keluar dari Akun?</h2>
                    <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        margin: '0',
                        lineHeight: '1.5'
                    }}>Anda perlu masuk kembali untuk mengakses data anak Anda.</p>
                </div>

                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    <button
                        onClick={() => setShowLogoutModal(false)}
                        style={{
                            flex: 1,
                            padding: '12px',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            fontWeight: '600',
                            fontSize: '14px',
                            borderRadius: '10px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    >Batal</button>
                    <button
                        onClick={onLogout}
                        style={{
                            flex: 1,
                            padding: '12px',
                            backgroundColor: '#ef4444',
                            color: '#ffffff',
                            fontWeight: '600',
                            fontSize: '14px',
                            borderRadius: '10px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                    >Keluar</button>
                </div>
            </div>
        </div>
    );

    const renderProfileScreen = () => (
        <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            <div style={{
                padding: '14px 16px', display: 'flex', alignItems: 'center', position: 'sticky', top: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)', zIndex: 20, borderBottom: '1px solid #e5e7eb'
            }}>
                <button onClick={() => setCurrentScreen('menu')} style={{
                    padding: '8px', margin: '-8px 0 -8px -8px', color: '#6b7280', backgroundColor: 'transparent',
                    border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <ArrowLeft style={{ width: '20px', height: '20px' }} />
                </button>
                <h1 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 0 8px' }}>Profil & Pengaturan</h1>
            </div>

            <div style={{ padding: '16px', paddingBottom: '120px' }}>
                <div style={{ display: 'inline-flex', height: '36px', width: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', backgroundColor: '#e5e7eb', padding: '4px', marginBottom: '16px', gap: '4px' }}>
                    {['parent', 'child'].map((tab) => (
                        <button key={tab} onClick={() => setProfileTab(tab as any)} style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', padding: '6px 12px',
                            fontSize: '13px', fontWeight: '500', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                            backgroundColor: profileTab === tab ? '#ffffff' : 'transparent', color: profileTab === tab ? '#111827' : '#6b7280',
                            boxShadow: profileTab === tab ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
                        }}>
                            {tab === 'parent' ? 'Orang Tua' : 'Anak'}
                        </button>
                    ))}
                </div>

                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                    {profileTab === 'parent' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '40px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                                    {parentPicPreview ? (
                                        <img src={parentPicPreview} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                                            <User style={{ width: '40px', height: '40px' }} />
                                        </div>
                                    )}
                                </div>
                                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#4f46e5', fontSize: '13px', fontWeight: '500' }}>
                                    <Camera style={{ width: '16px', height: '16px' }} /> Ubah Foto
                                    <input type="file" accept="image/jpeg,image/png,image/jpg" style={{ display: 'none' }} onChange={handleProfilePicChange} />
                                </label>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>Nama Lengkap</label>
                                <input type="text" maxLength={100} value={parentFullName} onChange={(e) => setParentFullName(e.target.value)} placeholder="Contoh: Budi Santoso" style={{ width: '100%', boxSizing: 'border-box', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', fontSize: '14px', outline: 'none' }} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>NIK (16 Digit)</label>
                                <input type="text" readOnly value={parentNik} placeholder="Tidak ada NIK" style={{ width: '100%', boxSizing: 'border-box', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', fontSize: '14px', outline: 'none', color: '#6b7280' }} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>Email (Opsional)</label>
                                <input type="email" maxLength={100} value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder="email@contoh.com" style={{ width: '100%', boxSizing: 'border-box', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', fontSize: '14px', outline: 'none' }} />
                            </div>
                        </div>
                    )}

                    {profileTab === 'child' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>Nama Lengkap Anak</label>
                                <input type="text" maxLength={100} value={childFullName} onChange={(e) => setChildFullName(e.target.value)} placeholder="Contoh: Putri Santoso" style={{ width: '100%', boxSizing: 'border-box', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', fontSize: '14px', outline: 'none' }} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>Tanggal Lahir</label>
                                <input type="date" value={childBirthDate} onChange={(e) => setChildBirthDate(e.target.value)} max={new Date().toISOString().split('T')[0]} style={{ width: '100%', boxSizing: 'border-box', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', color: '#111827', fontSize: '14px', outline: 'none' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>Jenis Kelamin</label>
                                    <select value={childGender} onChange={(e) => setChildGender(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', fontSize: '14px', outline: 'none' }}>
                                        <option value="M">Laki-Laki</option>
                                        <option value="F">Perempuan</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>Gologan Darah</label>
                                    <select value={childBloodType} onChange={(e) => setChildBloodType(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', fontSize: '14px', outline: 'none' }}>
                                        <option value="UNKNOWN">Tidak Tahu</option>
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="AB">AB</option>
                                        <option value="O">O</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                        <button onClick={handleSaveProfile} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', backgroundColor: '#4f46e5', color: '#ffffff', fontWeight: '600', fontSize: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                            <Save style={{ width: '18px', height: '18px' }} /> Simpan Perubahan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ width: '100%', backgroundColor: '#ffffff' }}>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                input[type="number"]::-webkit-outer-spin-button,
                input[type="number"]::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type="number"] {
                    -moz-appearance: textfield;
                }
            `}</style>
            {currentScreen === 'menu' && renderMenuScreen()}
            {currentScreen === 'calculator' && renderCalculatorScreen()}
            {currentScreen === 'privacy' && renderPrivacyScreen()}
            {currentScreen === 'profile' && renderProfileScreen()}
            {showLogoutModal && renderLogoutModal()}
        </div>
    );
}
