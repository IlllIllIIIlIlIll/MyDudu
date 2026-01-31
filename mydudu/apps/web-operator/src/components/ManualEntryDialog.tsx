"use client";

import { useState } from 'react';
import { X, Clipboard } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';

interface ManualEntryDialogProps {
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export function ManualEntryDialog({ onSuccess, trigger }: ManualEntryDialogProps) {
    const [open, setOpen] = useState(false);
    const [manualForm, setManualForm] = useState({
        motherName: '',
        childName: '',
        weight: '',
        height: '',
        temperature: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleManualSubmit = async () => {
        if (!manualForm.motherName || !manualForm.childName) {
            alert("Nama Ibu dan Anak wajib diisi");
            return;
        }

        setIsSubmitting(true);
        try {
            await fetchWithAuth('/devices/manual-telemetry', {
                method: 'POST',
                body: JSON.stringify({
                    motherName: manualForm.motherName,
                    childName: manualForm.childName,
                    weight: manualForm.weight ? parseFloat(manualForm.weight) : undefined,
                    height: manualForm.height ? parseFloat(manualForm.height) : undefined,
                    temperature: manualForm.temperature ? parseFloat(manualForm.temperature) : undefined,
                })
            });
            alert("Data berhasil dikirim!");
            setManualForm({ motherName: '', childName: '', weight: '', height: '', temperature: '' });
            setOpen(false);
            if (onSuccess) onSuccess();
        } catch (e: any) {
            alert("Gagal mengirim data: " + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Trigger */}
            <div onClick={() => setOpen(true)}>
                {trigger || (
                    <button className="bg-[#11998E] hover:bg-[#0e8076] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer shadow-md active:scale-95 transition-all">
                        <Clipboard className="w-5 h-5" />
                        <span className="font-semibold">Input Pemeriksaan Manual</span>
                    </button>
                )}
            </div>

            {/* Modal Overlay */}
            {open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="gradient-primary p-6 text-white relative">
                            <button
                                onClick={() => setOpen(false)}
                                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3">
                                <Clipboard className="w-6 h-6" />
                                <div>
                                    <h2 className="text-[20px] font-bold text-white">Input Pemeriksaan Manual</h2>
                                    <p className="text-white/90 text-[13px] mt-0.5">Masukkan data secara manual</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-semibold text-gray-700">Nama Ibu</label>
                                    <input
                                        type="text"
                                        placeholder="Nama ibu..."
                                        value={manualForm.motherName}
                                        onChange={(e) => setManualForm({ ...manualForm, motherName: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-semibold text-gray-700">Nama Anak</label>
                                    <input
                                        type="text"
                                        placeholder="Nama anak..."
                                        value={manualForm.childName}
                                        onChange={(e) => setManualForm({ ...manualForm, childName: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-semibold text-gray-700">Berat (kg)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="0.0"
                                        value={manualForm.weight}
                                        onChange={(e) => setManualForm({ ...manualForm, weight: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-semibold text-gray-700">Tinggi (cm)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="0.0"
                                        value={manualForm.height}
                                        onChange={(e) => setManualForm({ ...manualForm, height: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-semibold text-gray-700">Suhu (°C)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="36.5"
                                        value={manualForm.temperature}
                                        onChange={(e) => setManualForm({ ...manualForm, temperature: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setOpen(false)}
                                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-[15px] hover:bg-gray-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleManualSubmit}
                                    disabled={isSubmitting}
                                    className="flex-1 gradient-primary text-white px-6 py-3 rounded-lg font-semibold text-[15px] hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {isSubmitting ? "Mengirim..." : "Kirim Data"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
