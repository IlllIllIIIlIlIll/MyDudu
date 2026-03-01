"use client";

import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';
import styles from './Dialogs.module.css';

interface RegisterParentDialogProps {
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export function RegisterParentDialog({ onSuccess, trigger }: RegisterParentDialogProps) {
    const [open, setOpen] = useState(false);
    fullName: '',
        nik: '',
            birthDate: '',
                villageId: '',
                    villageName: '',
    });
const [isSubmitting, setIsSubmitting] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});
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
    const newErrors: Record<string, string> = {};
    if (!form.fullName) newErrors.fullName = 'Wajib diisi';
    if (!form.nik) newErrors.nik = 'Wajib diisi';
    else if (form.nik.length !== 16) newErrors.nik = 'NIK harus 16 digit';
    if (!form.birthDate) newErrors.birthDate = 'Wajib diisi';
    if (!form.villageId) newErrors.villageName = 'Wajib pilih desa';

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
        await fetchWithAuth('/users/parent', {
            method: 'POST',
            body: JSON.stringify({
                fullName: form.fullName,
                nik: form.nik,
                birthDate: form.birthDate,
                villageId: Number(form.villageId),
            })
        });
        setForm({ fullName: '', nik: '', birthDate: '', villageId: '', villageName: '' });
        setOpen(false);
        if (onSuccess) onSuccess();
    } catch (e: any) {
        setErrors({ submit: "Gagal mendaftarkan: " + e.message });
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
                    <span className="font-semibold">Daftar Wali</span>
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
                            <UserPlus className="w-6 h-6" />
                            <div>
                                <h2 className="text-[20px] font-bold text-white">Daftarkan Wali</h2>
                                <p className="text-white/90 text-[13px] mt-0.5">Registrasi akun wali baru</p>
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
                                onChange={(e) => {
                                    setForm({ ...form, fullName: e.target.value });
                                    setErrors(prev => ({ ...prev, fullName: '' }));
                                }}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px] ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.fullName && <p className="text-red-500 text-xs mt-1 font-medium">{errors.fullName}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[14px] font-semibold text-gray-700">NIK (16 Digit)</label>
                            <input
                                type="text"
                                maxLength={16}
                                placeholder="3276..."
                                value={form.nik}
                                onChange={(e) => {
                                    setForm({ ...form, nik: e.target.value.replace(/\D/g, '') });
                                    setErrors(prev => ({ ...prev, nik: '' }));
                                }}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px] ${errors.nik ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.nik && <p className="text-red-500 text-xs mt-1 font-medium">{errors.nik}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[14px] font-semibold text-gray-700">Tanggal Lahir</label>
                            <input
                                type="date"
                                value={form.birthDate}
                                max={new Date().toISOString().split('T')[0]}
                                onChange={(e) => {
                                    setForm({ ...form, birthDate: e.target.value });
                                    setErrors(prev => ({ ...prev, birthDate: '' }));
                                }}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px] ${errors.birthDate ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.birthDate && <p className="text-red-500 text-xs mt-1 font-medium">{errors.birthDate}</p>}
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
                                    setErrors(prev => ({ ...prev, villageName: '' }));
                                    searchVillages(val);
                                }}
                                onFocus={() => {
                                    if (villages.length > 0) setShowVillageDropdown(true);
                                }}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px] ${errors.villageName ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.villageName && <p className="text-red-500 text-xs mt-1 font-medium">{errors.villageName}</p>}


                            {/* Autocomplete Dropdown */}
                            {showVillageDropdown && (
                                <div className={`absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-[200px] overflow-y-auto mt-1 ${styles.dropdown}`}>
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

                        <div className="flex flex-col gap-3 pt-4 mt-2">
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
                                    {isSubmitting ? "Mendaftar..." : "Daftarkan Wali anak"}
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
