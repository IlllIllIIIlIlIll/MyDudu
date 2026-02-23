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

    const today = new Date().toISOString().split('T')[0];
    const isDateInvalid = form.eventDate !== '' && form.eventDate < today;

    const handleSubmit = async () => {
        if (!form.title || !form.eventDate || !form.posyanduName) {
            alert("Nama Kegiatan, Tanggal, dan Lokasi Posyandu wajib diisi");
            return;
        }

        if (isDateInvalid) {
            alert("Tanggal tidak boleh di masa lalu");
            return;
        }

        setIsSubmitting(true);
        try {
            await fetchWithAuth('/schedules', {
                method: 'POST',
                body: JSON.stringify({
                    ...form,
                    villageId: user?.villageId ? Number(user.villageId) : undefined,
                })
            });
            alert("Agenda berhasil ditambahkan!");
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
            alert("Gagal menambahkan agenda: " + e.message);
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
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="gradient-primary p-6 text-white relative">
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
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
                                />
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
                                    onChange={(e) => setForm({ ...form, posyanduName: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
                                />
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
                                    {isDateInvalid && <span className="text-xs text-red-500">Tanggal tidak valid</span>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-semibold text-gray-700">Waktu Mulai</label>
                                    <input
                                        type="time"
                                        value={form.startTime}
                                        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-semibold text-gray-700">Waktu Selesai</label>
                                    <input
                                        type="time"
                                        value={form.endTime}
                                        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
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
            )}
        </>
    );
}
