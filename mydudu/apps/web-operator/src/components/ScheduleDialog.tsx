"use client";

import { useState } from 'react';
import { X, CalendarPlus } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';
import { useAuth } from '../context/AuthContext';

interface ScheduleDialogProps {
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export function ScheduleDialog({ onSuccess, trigger }: ScheduleDialogProps) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        posyanduName: '',
        eventDate: '',
        startTime: '',
        endTime: '',
        villageId: user?.villageId || '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const today = new Date().toISOString().split('T')[0];
    const isDateInvalid = form.eventDate !== '' && form.eventDate < today;

    // Time validation logic
    const isTimeInvalid = () => {
        if (!form.eventDate || !form.startTime) return false;

        // 1. If date is today, time cannot be in the past
        if (form.eventDate === today) {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            if (form.startTime < currentTime) return true;
        }

        // 2. If end time is provided, it must be strictly after start time
        if (form.endTime && form.startTime >= form.endTime) return true;

        return false;
    };

    const timeInvalid = isTimeInvalid();

    const handleSubmit = async () => {
        const newErrors: Record<string, string> = {};
        if (!form.title) newErrors.title = 'Wajib diisi';
        if (!form.eventDate) newErrors.eventDate = 'Wajib diisi';
        if (!form.posyanduName) newErrors.posyanduName = 'Wajib diisi';

        if (isDateInvalid) {
            newErrors.eventDate = 'Tanggal tidak boleh di masa lalu';
        }

        if (timeInvalid) {
            newErrors.time = 'Waktu tidak valid';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setIsSubmitting(true);
        try {
            await fetchWithAuth('/schedules', {
                method: 'POST',
                body: JSON.stringify({
                    ...form,
                    villageId: user?.villageId ? Number(user.villageId) : undefined,
                })
            });
            setForm({
                title: '',
                description: '',
                posyanduName: '',
                eventDate: '',
                startTime: '',
                endTime: '',
                villageId: user?.villageId || '',
            });
            setOpen(false);
            if (onSuccess) onSuccess();
        } catch (e: any) {
            setErrors({ submit: "Gagal menambahkan agenda: " + e.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div onClick={() => setOpen(true)}>
                {trigger || (
                    <button className="bg-[#11998E] hover:bg-[#0e8076] text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer">
                        <CalendarPlus className="w-4 h-4" />
                        <span className="font-semibold">Tambah Agenda</span>
                    </button>
                )}
            </div>

            {open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="gradient-primary p-6 text-white relative rounded-t-xl">
                            <button
                                onClick={() => setOpen(false)}
                                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3">
                                <CalendarPlus className="w-6 h-6" />
                                <div>
                                    <h2 className="text-[20px] font-bold text-white">Tambah Agenda Posyandu</h2>
                                    <p className="text-white/90 text-[13px] mt-0.5">Jadwalkan kegiatan posyandu mendatang</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[14px] font-semibold text-gray-700">Nama Kegiatan</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Posyandu Rutin (Imunisasi)"
                                    value={form.title}
                                    onChange={(e) => {
                                        setForm({ ...form, title: e.target.value });
                                        setErrors(prev => ({ ...prev, title: '' }));
                                    }}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px] ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.title && <p className="text-red-500 text-xs mt-1 font-medium">{errors.title}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[14px] font-semibold text-gray-700">Deskripsi Singkat</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Pemeriksaan rutin dan imunisasi dasar"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[14px] font-semibold text-gray-700">Nama Posyandu / Lokasi</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Posyandu Melati 1"
                                    value={form.posyanduName}
                                    onChange={(e) => {
                                        setForm({ ...form, posyanduName: e.target.value });
                                        setErrors(prev => ({ ...prev, posyanduName: '' }));
                                    }}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px] ${errors.posyanduName ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.posyanduName && <p className="text-red-500 text-xs mt-1 font-medium">{errors.posyanduName}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5 md:col-span-1 border-r border-gray-200 pr-4">
                                    <label className="text-[14px] font-semibold text-gray-700">Tanggal</label>
                                    <input
                                        type="date"
                                        min={today}
                                        value={form.eventDate}
                                        onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-[15px] ${isDateInvalid ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#11998E]'}`}
                                    />
                                    {isDateInvalid && <span className="text-xs text-red-500 font-semibold mt-1 inline-block">Tanggal tidak valid</span>}
                                </div>
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-[14px] font-semibold text-gray-700">Mulai</label>
                                    <input
                                        type="time"
                                        value={form.startTime}
                                        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-[15px] ${timeInvalid && (!form.endTime || form.startTime >= form.endTime || (form.eventDate === today && form.startTime < new Date().toTimeString().slice(0, 5))) ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#11998E]'}`}
                                    />
                                </div>
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-[14px] font-semibold text-gray-700">Selesai</label>
                                    <input
                                        type="time"
                                        value={form.endTime}
                                        onChange={(e) => {
                                            setForm({ ...form, endTime: e.target.value });
                                            setErrors(prev => ({ ...prev, time: '' }));
                                        }}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-[15px] ${timeInvalid && form.endTime && form.startTime >= form.endTime ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#11998E]'}`}
                                    />
                                </div>
                            </div>
                            {(timeInvalid || errors.time) && <div className="text-xs text-red-500 font-semibold">{errors.time || 'Waktu tidak valid. Periksa kembali jam mulai dan selesai.'}</div>}

                            <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                                {errors.submit && (
                                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-lg">
                                        {errors.submit}
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setOpen(false)}
                                        className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-[15px] hover:bg-gray-50 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="flex-1 gradient-primary text-white px-6 py-3 rounded-lg font-semibold text-[15px] hover:opacity-90 transition-opacity disabled:opacity-50"
                                    >
                                        {isSubmitting ? "Menyimpan..." : "Simpan Agenda"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
