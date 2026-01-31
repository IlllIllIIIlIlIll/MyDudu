"use client";

import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';

interface RegisterParentDialogProps {
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export function RegisterParentDialog({ onSuccess, trigger }: RegisterParentDialogProps) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        fullName: '',
        phoneNumber: '',
        villageId: '',
        villageName: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [villages, setVillages] = useState<any[]>([]);
    const [showVillageDropdown, setShowVillageDropdown] = useState(false);

    const searchVillages = async (query: string) => {
        if (!query) return;
        try {
            const data = await fetchWithAuth(`/users/villages?q=${query}`);
            const results = Array.isArray(data) ? data : [];
            setVillages(results);
            setShowVillageDropdown(results.length > 0);
        } catch (e) {
            console.error("Failed to search villages", e);
            setVillages([]);
            setShowVillageDropdown(false);
        }
    };

    const handleSubmit = async () => {
        if (!form.fullName || !form.phoneNumber || !form.villageId) {
            alert("Nama, No. Telepon, dan Desa wajib diisi");
            return;
        }

        setIsSubmitting(true);
        try {
            await fetchWithAuth('/users/parent', {
                method: 'POST',
                body: JSON.stringify({
                    fullName: form.fullName,
                    phoneNumber: form.phoneNumber,
                    villageId: Number(form.villageId),
                })
            });
            alert("Orang tua berhasil didaftarkan!");
            alert("Orang tua berhasil didaftarkan!");
            setForm({ fullName: '', phoneNumber: '', villageId: '', villageName: '' });
            setOpen(false);
            if (onSuccess) onSuccess();
        } catch (e: any) {
            alert("Gagal mendaftarkan: " + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div onClick={() => setOpen(true)}>
                {trigger || (
                    <button className="bg-[#11998E] hover:bg-[#0e8076] text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer">
                        <UserPlus className="w-4 h-4" />
                        <span className="font-semibold">Daftar Ortu</span>
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
                                <UserPlus className="w-6 h-6" />
                                <div>
                                    <h2 className="text-[20px] font-bold text-white">Daftarkan Orang Tua</h2>
                                    <p className="text-white/90 text-[13px] mt-0.5">Registrasi akun orang tua baru</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[14px] font-semibold text-gray-700">Nama Lengkap</label>
                                <input
                                    type="text"
                                    placeholder="Nama lengkap..."
                                    value={form.fullName}
                                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[14px] font-semibold text-gray-700">No. Telepon (Wajib)</label>
                                <input
                                    type="tel"
                                    placeholder="08..."
                                    value={form.phoneNumber}
                                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
                                />
                            </div>
                            <div className="space-y-1.5 relative">
                                <label className="text-[14px] font-semibold text-gray-700">Desa/Kelurahan</label>
                                <input
                                    type="text"
                                    placeholder="Ketik untuk mencari desa..."
                                    value={form.villageName || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setForm(prev => ({ ...prev, villageName: val, villageId: '' }));
                                        searchVillages(val);
                                    }}
                                    onFocus={() => {
                                        if (villages.length > 0) setShowVillageDropdown(true);
                                    }}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
                                />
                                {/* Autocomplete Dropdown */}
                                {showVillageDropdown && (
                                    <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-[200px] overflow-y-auto mt-1" style={{ backgroundColor: 'white' }}>
                                        {villages.length > 0 ? (
                                            villages.map((village) => (
                                                <button
                                                    key={village.id}
                                                    type="button"
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex justify-between items-center"
                                                    onClick={() => {
                                                        setForm(prev => ({ ...prev, villageName: village.name, villageId: village.id }));
                                                        setShowVillageDropdown(false);
                                                    }}
                                                >
                                                    <span>{village.name}</span>
                                                    <span className="text-xs text-gray-400">{village.district?.name}</span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-2 text-sm text-gray-500 italic">
                                                Desa tidak ditemukan
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
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
                                    {isSubmitting ? "Menyimpan..." : "Simpan"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
