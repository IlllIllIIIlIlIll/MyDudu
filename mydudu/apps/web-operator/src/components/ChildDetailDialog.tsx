
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { OperatorChildRecord } from "../types/operator";
import { GrowthScale } from "./GrowthScale";
import { Calendar, User, Activity } from "lucide-react";

interface ChildDetailDialogProps {
    child: OperatorChildRecord | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ChildDetailDialog({ child, open, onOpenChange }: ChildDetailDialogProps) {
    if (!child) return null;

    const analysis = child.lastSession?.growthAnalysis;
    const session = child.lastSession;

    const getAge = (birthDate: string) => {
        const birth = new Date(birthDate);
        const now = new Date();
        if (isNaN(birth.getTime())) return '-';

        let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
        if (now.getDate() < birth.getDate()) months--;

        const years = Math.floor(months / 12);
        const remMonths = months % 12;

        return `${years} tahun ${remMonths} bulan`;
    };

    // #4: Relative time for last session
    const getRelativeTime = (dateStr: string | null | undefined): string => {
        if (!dateStr) return '-';
        const past = new Date(dateStr);
        if (isNaN(past.getTime())) return '-';
        const diffMs = Date.now() - past.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours < 1) return 'Baru saja';
        if (diffHours < 24) return `${diffHours} jam lalu`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return '1 hari lalu';
        return `${diffDays} hari lalu`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* #3: Force white background so dialog isn't transparent */}
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <User className="w-5 h-5 text-[#11998E]" />
                        Detail Pertumbuhan {child.fullName}
                    </DialogTitle>
                    {/* #1: Fix aria-describedby warning */}
                    <DialogDescription className="sr-only">
                        Informasi pertumbuhan dan riwayat pemeriksaan anak {child.fullName}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Header Info */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Nama Lengkap</p>
                            <p className="font-bold text-slate-900 text-lg">{child.fullName}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Usia & Jenis Kelamin</p>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900">{getAge(child.birthDate)}</span>
                                <span className="text-slate-400">•</span>
                                <span className="font-medium text-slate-600">
                                    {child.gender === 'M' ? 'Laki-laki' : 'Perempuan'}
                                </span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Orang Tua</p>
                            <p className="font-semibold text-slate-900">{child.parentName || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Pemeriksaan Terakhir</p>
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                {/* #4: show relative time (X jam lalu / X hari lalu) */}
                                <span>{getRelativeTime(session?.recordedAt)}</span>
                                {session?.recordedAt && (
                                    <span className="text-xs text-slate-400 font-normal">
                                        ({new Date(session.recordedAt).toLocaleDateString('id-ID', { dateStyle: 'short' })})
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Growth Analysis */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-orange-500" />
                            Analisis Pertumbuhan (KMS)
                        </h3>

                        {analysis ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {analysis['WEIGHT_FOR_AGE'] && (
                                    <GrowthScale
                                        label="Berat dibanding Umur"
                                        value={session?.weight || 0}
                                        unit="kg"
                                        zScore={analysis['WEIGHT_FOR_AGE'].zScore}
                                        deviation={analysis['WEIGHT_FOR_AGE'].deviation}
                                        ideal={analysis['WEIGHT_FOR_AGE'].ideal}
                                        color={analysis['WEIGHT_FOR_AGE'].color}
                                    />
                                )}
                                {analysis['LENGTH_HEIGHT_FOR_AGE'] && (
                                    <GrowthScale
                                        label="Tinggi dibanding Umur"
                                        value={session?.height || 0}
                                        unit="cm"
                                        zScore={analysis['LENGTH_HEIGHT_FOR_AGE'].zScore}
                                        deviation={analysis['LENGTH_HEIGHT_FOR_AGE'].deviation}
                                        ideal={analysis['LENGTH_HEIGHT_FOR_AGE'].ideal}
                                        color={analysis['LENGTH_HEIGHT_FOR_AGE'].color}
                                    />
                                )}
                                {(analysis['WEIGHT_FOR_LENGTH'] || analysis['WEIGHT_FOR_HEIGHT']) && (
                                    (() => {
                                        const indicator = analysis['WEIGHT_FOR_LENGTH'] ? 'WEIGHT_FOR_LENGTH' : 'WEIGHT_FOR_HEIGHT';
                                        const data = analysis[indicator]!;
                                        return (
                                            <GrowthScale
                                                label="Berat dibanding Tinggi Badan"
                                                value={session?.weight || 0}
                                                unit="kg"
                                                zScore={data.zScore}
                                                deviation={data.deviation}
                                                ideal={data.ideal}
                                                color={data.color}
                                            />
                                        );
                                    })()
                                )}
                                {analysis['BMI_FOR_AGE'] && (
                                    <GrowthScale
                                        label="Indeks Massa Tubuh dibanding Umur"
                                        value={Number((session?.weight! / Math.pow(session?.height! / 100, 2)).toFixed(1))}
                                        unit="kg/m²"
                                        zScore={analysis['BMI_FOR_AGE'].zScore}
                                        deviation={analysis['BMI_FOR_AGE'].deviation}
                                        ideal={analysis['BMI_FOR_AGE'].ideal}
                                        color={analysis['BMI_FOR_AGE'].color}
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center">
                                <p className="text-slate-500">Data pertumbuhan belum tersedia untuk analisis lengkap.</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
