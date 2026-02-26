"use client";

import { useState } from 'react';
import { X, Clipboard } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface ManualEntryDialogProps {
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

interface DeviceOption {
    id: number;
    name: string;
    deviceUuid: string;
}

interface ParentOption {
    id: number;
    fullName: string;
    villageName?: string | null;
}

interface ChildOption {
    id: number;
    fullName: string;
}

export function ManualEntryDialog({ onSuccess, trigger }: ManualEntryDialogProps) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [manualForm, setManualForm] = useState({
        parentId: '',
        motherName: '',
        childId: '',
        childName: '',
        deviceId: '',
        weight: '',
        height: '',
        temperature: '',
        heartRate: '',
        noiseLevel: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [devices, setDevices] = useState<DeviceOption[]>([]);
    const [parents, setParents] = useState<ParentOption[]>([]);
    const [children, setChildren] = useState<ChildOption[]>([]);
    const [showParentDropdown, setShowParentDropdown] = useState(false);
    const [showChildDropdown, setShowChildDropdown] = useState(false);

    const resetForm = () => {
        setManualForm({
            parentId: '',
            motherName: '',
            childId: '',
            childName: '',
            deviceId: '',
            weight: '',
            height: '',
            temperature: '',
            heartRate: '',
            noiseLevel: '',
        });
        setDevices([]);
        setParents([]);
        setChildren([]);
        setShowParentDropdown(false);
        setShowChildDropdown(false);
        setErrors({});
    };

    const loadParents = async () => {
        if (!user?.id) return;
        try {
            const data = await fetchWithAuth(`/operator/parents?userId=${user.id}`);
            const results = Array.isArray(data) ? (data as ParentOption[]) : [];
            setParents(results);
        } catch (e) {
            console.error('Failed to load parents', e);
            setParents([]);
        }
    };

    const loadChildrenByParent = async (parentId: string) => {
        if (!user?.id || !parentId) {
            setChildren([]);
            return;
        }
        try {
            const data = await fetchWithAuth(`/operator/parents/${Number(parentId)}/children?userId=${user.id}`);
            const results = Array.isArray(data) ? (data as ChildOption[]) : [];
            setChildren(results);
        } catch (e) {
            console.error('Failed to load children', e);
            setChildren([]);
        }
    };

    const loadOperatorDevices = async () => {
        if (!user?.id) {
            setDevices([]);
            return;
        }
        try {
            // Server already scopes this list by operator role/location.
            const data = await fetchWithAuth(`/operator/devices?userId=${user.id}`);
            const results = Array.isArray(data) ? (data as DeviceOption[]) : [];
            setDevices(results);
        } catch (e) {
            console.error('Failed to load devices', e);
            setDevices([]);
        }
    };

    const handleManualSubmit = async () => {
        const newErrors: Record<string, string> = {};
        if (!manualForm.parentId) newErrors.motherName = 'Pilih Ibu terlebih dahulu';
        if (!manualForm.childId) newErrors.childName = 'Pilih Anak terlebih dahulu';
        if (!manualForm.deviceId) newErrors.deviceId = 'Pilih Alat terlebih dahulu';

        if (manualForm.weight && (parseFloat(manualForm.weight) < 1 || parseFloat(manualForm.weight) > 150)) {
            newErrors.weight = 'Berat tidak valid';
        }
        if (manualForm.height && (parseFloat(manualForm.height) < 20 || parseFloat(manualForm.height) > 200)) {
            newErrors.height = 'Tinggi tidak valid';
        }
        if (manualForm.temperature && (parseFloat(manualForm.temperature) < 30 || parseFloat(manualForm.temperature) > 45)) {
            newErrors.temperature = 'Suhu tidak valid';
        }
        if (manualForm.heartRate && (parseFloat(manualForm.heartRate) < 30 || parseFloat(manualForm.heartRate) > 250)) {
            newErrors.heartRate = 'Detak jantung tidak valid';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setIsSubmitting(true);
        try {
            await fetchWithAuth('/devices/manual-telemetry', {
                method: 'POST',
                body: JSON.stringify({
                    parentId: Number(manualForm.parentId),
                    childId: Number(manualForm.childId),
                    motherName: manualForm.motherName,
                    childName: manualForm.childName,
                    deviceId: Number(manualForm.deviceId),
                    weight: manualForm.weight ? parseFloat(manualForm.weight) : undefined,
                    height: manualForm.height ? parseFloat(manualForm.height) : undefined,
                    temperature: manualForm.temperature ? parseFloat(manualForm.temperature) : undefined,
                    heartRate: manualForm.heartRate ? parseFloat(manualForm.heartRate) : undefined,
                    noiseLevel: manualForm.noiseLevel ? parseFloat(manualForm.noiseLevel) : undefined,
                }),
            });

            setOpen(false);
            resetForm();
            onSuccess?.();
        } catch (e: any) {
            setErrors({ submit: e.message || 'Gagal mengirim data' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div onClick={() => setOpen(true)}>
                {trigger || (
                    <button className="bg-[#11998E] hover:bg-[#0e8076] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer shadow-md active:scale-95 transition-all">
                        <Clipboard className="w-5 h-5" />
                        <span className="font-semibold">Input Pemeriksaan Manual</span>
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
                                <Clipboard className="w-6 h-6" />
                                <div>
                                    <h2 className="text-[20px] font-bold text-white">Input Pemeriksaan Manual</h2>
                                    <p className="text-white/90 text-[13px] mt-0.5">Masukkan data secara manual</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 relative">
                                    <label className="text-[14px] font-semibold text-gray-700">Nama Ibu</label>
                                    <input
                                        type="text"
                                        placeholder="Cari nama ibu..."
                                        value={manualForm.motherName}
                                        onFocus={async () => {
                                            if (!parents.length) {
                                                await loadParents();
                                            }
                                            setShowParentDropdown(true);
                                        }}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setManualForm((prev) => ({
                                                ...prev,
                                                motherName: value,
                                                parentId: '',
                                                childName: '',
                                                childId: '',
                                            }));
                                            setChildren([]);
                                            setShowParentDropdown(true);
                                            setErrors((prev) => ({ ...prev, motherName: '' }));
                                        }}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px] ${errors.motherName ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.motherName && <p className="text-red-500 text-xs mt-1 font-medium">{errors.motherName}</p>}
                                    {showParentDropdown && (
                                        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-[200px] overflow-y-auto mt-1">
                                            {parents
                                                .filter((p) =>
                                                    p.fullName.toLowerCase().includes((manualForm.motherName || '').toLowerCase())
                                                )
                                                .slice(0, 20)
                                                .map((parent) => (
                                                    <button
                                                        key={parent.id}
                                                        type="button"
                                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex justify-between items-center"
                                                        onClick={async () => {
                                                            setManualForm((prev) => ({
                                                                ...prev,
                                                                motherName: parent.fullName,
                                                                parentId: String(parent.id),
                                                                childName: '',
                                                                childId: '',
                                                            }));
                                                            setShowParentDropdown(false);
                                                            await loadChildrenByParent(String(parent.id));
                                                        }}
                                                    >
                                                        <span>{parent.fullName}</span>
                                                        <span className="text-xs text-gray-400">{parent.villageName || '-'}</span>
                                                    </button>
                                                ))}
                                            {parents.filter((p) => p.fullName.toLowerCase().includes((manualForm.motherName || '').toLowerCase())).length === 0 && (
                                                <div className="px-4 py-2 text-sm text-gray-500 italic">Orang tua tidak ditemukan</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1.5 relative">
                                    <label className="text-[14px] font-semibold text-gray-700">Nama Anak</label>
                                    <input
                                        type="text"
                                        placeholder={manualForm.parentId ? 'Pilih anak dari orang tua terpilih' : 'Pilih nama ibu dulu'}
                                        value={manualForm.childName}
                                        disabled={!manualForm.parentId}
                                        onFocus={() => {
                                            if (manualForm.parentId) {
                                                setShowChildDropdown(true);
                                            }
                                        }}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setManualForm((prev) => ({ ...prev, childName: value, childId: '' }));
                                            setShowChildDropdown(true);
                                            setErrors((prev) => ({ ...prev, childName: '' }));
                                        }}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px] disabled:bg-gray-100 disabled:text-gray-400 ${errors.childName ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.childName && <p className="text-red-500 text-xs mt-1 font-medium">{errors.childName}</p>}
                                    {showChildDropdown && manualForm.parentId && (
                                        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-[200px] overflow-y-auto mt-1">
                                            {children
                                                .filter((c) =>
                                                    c.fullName.toLowerCase().includes((manualForm.childName || '').toLowerCase())
                                                )
                                                .slice(0, 20)
                                                .map((child) => (
                                                    <button
                                                        key={child.id}
                                                        type="button"
                                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                                                        onClick={() => {
                                                            setManualForm((prev) => ({
                                                                ...prev,
                                                                childName: child.fullName,
                                                                childId: String(child.id),
                                                            }));
                                                            setShowChildDropdown(false);
                                                        }}
                                                    >
                                                        {child.fullName}
                                                    </button>
                                                ))}
                                            {children.filter((c) => c.fullName.toLowerCase().includes((manualForm.childName || '').toLowerCase())).length === 0 && (
                                                <div className="px-4 py-2 text-sm text-gray-500 italic">Anak tidak ditemukan</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[14px] font-semibold text-gray-700">Alat Dudu</label>
                                <select
                                    value={manualForm.deviceId}
                                    onFocus={loadOperatorDevices}
                                    onChange={(e) => {
                                        setManualForm((prev) => ({ ...prev, deviceId: e.target.value }));
                                        setErrors((prev) => ({ ...prev, deviceId: '' }));
                                    }}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px] bg-white ${errors.deviceId ? 'border-red-500' : 'border-gray-300'}`}
                                >
                                    <option value="">Pilih alat</option>
                                    {devices.map((device) => (
                                        <option key={device.id} value={device.id}>
                                            {device.name} ({device.deviceUuid})
                                        </option>
                                    ))}
                                </select>
                                {errors.deviceId && <p className="text-red-500 text-xs mt-1 font-medium">{errors.deviceId}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-semibold text-gray-700">Berat (kg)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="0.0"
                                        value={manualForm.weight}
                                        onChange={(e) => {
                                            setManualForm({ ...manualForm, weight: e.target.value });
                                            setErrors(prev => ({ ...prev, weight: '' }));
                                        }}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px] ${errors.weight ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.weight && <p className="text-red-500 text-xs mt-1 font-medium">{errors.weight}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-semibold text-gray-700">Tinggi (cm)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="0.0"
                                        value={manualForm.height}
                                        onChange={(e) => {
                                            setManualForm({ ...manualForm, height: e.target.value });
                                            setErrors(prev => ({ ...prev, height: '' }));
                                        }}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px] ${errors.height ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.height && <p className="text-red-500 text-xs mt-1 font-medium">{errors.height}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-semibold text-gray-700">Suhu (°C)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="36.5"
                                        value={manualForm.temperature}
                                        onChange={(e) => {
                                            setManualForm({ ...manualForm, temperature: e.target.value });
                                            setErrors(prev => ({ ...prev, temperature: '' }));
                                        }}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px] ${errors.temperature ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.temperature && <p className="text-red-500 text-xs mt-1 font-medium">{errors.temperature}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-semibold text-gray-700">Detak (bpm)</label>
                                    <input
                                        type="number"
                                        step="1"
                                        placeholder="90"
                                        value={manualForm.heartRate}
                                        onChange={(e) => {
                                            setManualForm({ ...manualForm, heartRate: e.target.value });
                                            setErrors(prev => ({ ...prev, heartRate: '' }));
                                        }}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px] ${errors.heartRate ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.heartRate && <p className="text-red-500 text-xs mt-1 font-medium">{errors.heartRate}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-semibold text-gray-700">Kebisingan (dB)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="45.0"
                                        value={manualForm.noiseLevel}
                                        onChange={(e) => setManualForm({ ...manualForm, noiseLevel: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
                                    />
                                </div>
                                <div />
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
                                        onClick={handleManualSubmit}
                                        disabled={isSubmitting}
                                        className="flex-1 gradient-primary text-white px-6 py-3 rounded-lg font-semibold text-[15px] hover:opacity-90 transition-opacity disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Mengirim...' : 'Kirim Data'}
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
