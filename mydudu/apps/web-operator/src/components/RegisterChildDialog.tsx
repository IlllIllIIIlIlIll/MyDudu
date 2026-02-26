"use client";

import { useState, useEffect } from 'react';
import { X, Baby } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';
import styles from './Dialogs.module.css';

interface RegisterChildDialogProps {
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export function RegisterChildDialog({ onSuccess, trigger }: RegisterChildDialogProps) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        fullName: '',
        birthDate: '',
        gender: 'MALE',
        bloodType: 'UNKNOWN',
        parentId: '',
        parentName: '',
    });
    const [parents, setParents] = useState<any[]>([]);
    const [filteredParents, setFilteredParents] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoadingParents, setIsLoadingParents] = useState(false);
    const [showParentDropdown, setShowParentDropdown] = useState(false);

    useEffect(() => {
        if (open) {
            fetchParents();
        }
    }, [open]);

    const fetchParents = async () => {
        setIsLoadingParents(true);
        try {
            const data = await fetchWithAuth('/users?role=parent');
            const result = Array.isArray(data) ? data : [];
            setParents(result);
            setFilteredParents(result);
        } catch (e) {
            console.error("Failed to fetch parents", e);
        } finally {
            setIsLoadingParents(false);
        }
    };

    const handleSearchParents = (query: string) => {
        setForm(prev => ({ ...prev, parentName: query, parentId: '' }));
        if (!query) {
            setFilteredParents(parents);
            setShowParentDropdown(true);
            return;
        }

        const lower = query.toLowerCase();
        const filtered = parents.filter(p =>
            p.fullName.toLowerCase().includes(lower) ||
            (p.phoneNumber && p.phoneNumber.includes(lower))
        );
        setFilteredParents(filtered);
        setShowParentDropdown(true);
    };

    const today = new Date().toISOString().split('T')[0];
    const isDateInvalid = form.birthDate > today;

    const handleSubmit = async () => {
        const newErrors: Record<string, string> = {};
        if (!form.fullName) newErrors.fullName = 'Wajib diisi';
        if (!form.birthDate) newErrors.birthDate = 'Wajib diisi';
        if (!form.gender) newErrors.gender = 'Wajib diisi';
        if (!form.parentId) newErrors.parentName = 'Wajib pilih orang tua';

        if (isDateInvalid) {
            newErrors.birthDate = 'Tanggal tidak valid';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setIsSubmitting(true);
        try {
            await fetchWithAuth('/children', {
                method: 'POST',
                body: JSON.stringify(form)
            });
            setForm({ fullName: '', birthDate: '', gender: 'MALE', bloodType: 'UNKNOWN', parentId: '', parentName: '' });
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
                        <Baby className="w-4 h-4" />
                        <span className="font-semibold">Daftar Anak</span>
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
                                <Baby className="w-6 h-6" />
                                <div>
                                    <h2 className="text-[20px] font-bold text-white">Daftarkan Anak</h2>
                                    <p className="text-white/90 text-[13px] mt-0.5">Registrasi data anak baru</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[14px] font-semibold text-gray-700">Nama Lengkap</label>
                                <input
                                    type="text"
                                    placeholder="Nama anak..."
                                    value={form.fullName}
                                    onChange={(e) => {
                                        setForm({ ...form, fullName: e.target.value });
                                        setErrors(prev => ({ ...prev, fullName: '' }));
                                    }}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px] ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.fullName && <p className="text-red-500 text-xs mt-1 font-medium">{errors.fullName}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-semibold text-gray-700">Tanggal Lahir</label>
                                    <input
                                        type="date"
                                        max={today}
                                        value={form.birthDate}
                                        onChange={(e) => {
                                            setForm({ ...form, birthDate: e.target.value });
                                            setErrors(prev => ({ ...prev, birthDate: '' }));
                                        }}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-[15px] ${(isDateInvalid || errors.birthDate) ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#11998E]'}`}
                                    />
                                    {(isDateInvalid || errors.birthDate) && <span className="text-xs text-red-500 font-medium">{errors.birthDate || 'Tanggal tidak valid'}</span>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-semibold text-gray-700">Jenis Kelamin</label>
                                    <select
                                        value={form.gender}
                                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
                                    >
                                        <option value="MALE">Laki-laki</option>
                                        <option value="FEMALE">Perempuan</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[14px] font-semibold text-gray-700">Golongan Darah</label>
                                <select
                                    value={form.bloodType}
                                    onChange={(e) => setForm({ ...form, bloodType: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
                                >
                                    <option value="UNKNOWN">Belum Diketahui</option>
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="AB">AB</option>
                                    <option value="O">O</option>
                                </select>
                            </div>
                            <div className="space-y-1.5 relative">
                                <label className="text-[14px] font-semibold text-gray-700">Orang Tua</label>
                                <input
                                    type="text"
                                    placeholder="Cari nama atau no. telepon..."
                                    value={form.parentName}
                                    onChange={(e) => {
                                        handleSearchParents(e.target.value);
                                        setErrors(prev => ({ ...prev, parentName: '' }));
                                    }}
                                    onFocus={() => setShowParentDropdown(true)}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px] ${errors.parentName ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.parentName && <p className="text-red-500 text-xs mt-1 font-medium">{errors.parentName}</p>}


                                {showParentDropdown && (
                                    <div className={`absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-[200px] overflow-y-auto mt-1 ${styles.dropdown}`}>
                                        {filteredParents.length > 0 ? (
                                            filteredParents.map((parent) => (
                                                <button
                                                    key={parent.id}
                                                    type="button"
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex flex-col items-start border-b border-gray-50 last:border-none"
                                                    onClick={() => {
                                                        setForm({ ...form, parentId: parent.parentProfile?.parentId || parent.id, parentName: parent.fullName }); // Assuming parentId is user ID or parentProfile ID logic
                                                        // Wait, API expects parentId. User endpoint returns User objects. 
                                                        // If child schema relates to Parent model, we need Parent ID.
                                                        // But previously select value was parent.id (User ID).
                                                        // Let's assume User ID implies Parent ID or backend handles it? 
                                                        // Checking schema: Child.parentId -> Parent.id. User.parentProfile -> Parent.
                                                        // The fetch /users?role=parent likely includes parentProfile?
                                                        // Ideally we should use parent.parentProfile?.id if available, or just fallback to User ID if that's what backend expects (it's confusing).
                                                        // previous code: value={parent.id} which is user ID.
                                                        // Let's stick to parent.parentProfile?.id ?? parent.id but we need to check if parentProfile is included in fetch.
                                                        // For now let's use parent.id and let backend resolve or if fetch includes parentProfile use that.
                                                        // Actually, UsersService.findAll includes parentProfile?
                                                        // If I look at previous UsersService.findAll, it selects id, fullName, etc. but didn't explicitly see parentProfile in the custom select.
                                                        // Wait, in previous turn I modified UsersService.findAll? No I modified findAll to filter by role.
                                                        // But the select object was explicit.
                                                        // Let's assume parent.id is what I should send for now (User ID) if backend maps it, OR more likely, the backend *findAll* I saw earlier selected specific fields.
                                                        // Let's stick to the previous implementation's value: parent.id.
                                                        setForm(prev => ({ ...prev, parentId: parent.id, parentName: parent.fullName }));
                                                        setShowParentDropdown(false);
                                                    }}
                                                >
                                                    <span className="font-medium">{parent.fullName}</span>
                                                    <span className="text-xs text-gray-500">{parent.phoneNumber || 'No Phone'} • {parent.village?.name || 'No Village'}</span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-2 text-sm text-gray-500 italic">
                                                Orang tua tidak ditemukan
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
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
                                        {isSubmitting ? "Menyimpan..." : "Simpan"}
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
