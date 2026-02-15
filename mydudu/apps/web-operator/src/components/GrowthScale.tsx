
import { motion, AnimatePresence } from 'motion/react';
import { useMemo, useState, useRef, useEffect } from 'react';
import { getGrowthStatus, GrowthStatus, calculateValueFromZ, calculateExplorerBoundaries, GrowthIndicator } from '../utils/growthLogic';
import { AlertCircle, ChevronRight, Info, X, Compass } from 'lucide-react';

interface GrowthScaleProps {
    label: string;      // e.g., "Berat dibanding Tinggi Badan"
    value: number;      // Current Value (e.g., 12.5 kg)
    zScore: number | null;     // Current Z-Score
    deviation: number;  // Deviation from ideal (e.g., +1.5)
    ideal: number;      // Ideal value (Median)
    unit: string;       // e.g., "kg" or "cm"
    color?: string;      // Hex color from backend
    lms?: { l: number; m: number; s: number }; // LMS parameters for Explorer
    indicator?: GrowthIndicator; // Optional indicator for strict classification
}

export function GrowthScale({ label, value, zScore, deviation, ideal, unit, color, lms, indicator }: GrowthScaleProps) {

    const [isExplorerOpen, setExplorerOpen] = useState(false);
    const [ghostZ, setGhostZ] = useState<number>(zScore ?? 0);
    const containerRef = useRef<HTMLDivElement>(null);

    const status: GrowthStatus = useMemo(() => getGrowthStatus(zScore, indicator), [zScore, indicator]);
    const ghostStatus: GrowthStatus = useMemo(() => getGrowthStatus(ghostZ, indicator), [ghostZ, indicator]);

    // Calculate position percentage (clamped -3.5 to +3.5 mapped to 0-100%)
    const getPosition = (z: number | null) => {
        if (z === null || isNaN(z)) return 50;
        const clampedZ = Math.max(-3.5, Math.min(3.5, z));
        return ((clampedZ + 3.5) / 7) * 100;
    };

    const position = useMemo(() => getPosition(zScore), [zScore]);
    const ghostPosition = useMemo(() => getPosition(ghostZ), [ghostZ]);

    const ghostValue = useMemo(() => {
        if (!lms) return 0;
        return calculateValueFromZ(ghostZ, lms.l, lms.m, lms.s);
    }, [ghostZ, lms]);

    // Reference Anchors using centralized logic
    const anchors = useMemo(() => {
        if (!lms) return null;
        const bounds = calculateExplorerBoundaries(lms.l, lms.m, lms.s, [-2, 0, 2]);
        return {
            lower: bounds[-2],  // -2 SD
            median: bounds[0],  // Median
            upper: bounds[2],   // +2 SD
        };
    }, [lms]);

    useEffect(() => {
        if (isExplorerOpen && zScore !== null) {
            setGhostZ(zScore);
        }
    }, [isExplorerOpen, zScore]);

    // Handle drag/click on scale to update ghostZ (only when explorer open)
    const handleScaleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isExplorerOpen || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const x = clientX - rect.left;
        const width = rect.width;

        // Map 0-width to -3.5 to +3.5
        const percentage = Math.max(0, Math.min(1, x / width));
        const newZ = (percentage * 7) - 3.5;
        setGhostZ(newZ);
    };

    if (status.severity === 'neutral' || zScore === null) {
        return (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 border-dashed flex items-center justify-center min-h-[120px]">
                <div className="text-center">
                    <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-500 text-sm">Data Tidak Valid</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
                        Hasil pengukuran di luar batas wajar. Silakan lakukan pengukuran ulang.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm relative overflow-hidden transition-all duration-300">

            {/* Status Badge */}
            <div className="absolute top-0 right-0 px-3 py-1.5 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider text-white z-10"
                style={{ backgroundColor: isExplorerOpen ? ghostStatus.color : status.color }}>
                {isExplorerOpen ? 'Simulasi: ' + ghostStatus.label : status.label}
            </div>

            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-800 text-sm">{label}</h4>
                        {lms && (
                            <button
                                onClick={() => setExplorerOpen(!isExplorerOpen)}
                                className={`p-1 rounded-full transition-colors ${isExplorerOpen ? 'bg-slate-100 text-slate-600' : 'text-slate-300 hover:text-slate-500'}`}
                            >
                                <Compass className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-baseline gap-1.5">
                        <span className={`text-2xl font-bold transition-colors duration-300 ${isExplorerOpen ? 'text-slate-400' : 'text-slate-900'}`}>{value}</span>
                        <span className="text-xs text-slate-500 font-medium">{unit}</span>

                        {isExplorerOpen && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-baseline gap-1.5 ml-2"
                            >
                                <span className="text-sm text-slate-400">→</span>
                                <span className="text-2xl font-bold text-slate-800">{ghostValue.toFixed(1)}</span>
                                <span className="text-xs text-slate-500 font-medium">{unit}</span>
                            </motion.div>
                        )}
                    </div>

                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-[85%]">
                        {isExplorerOpen ?
                            "Geser penanda di bawah untuk melihat estimasi berat/tinggi pada status gizi yang berbeda." :
                            status.explanation}
                    </p>
                </div>
            </div>

            {/* Scale Track */}
            <div
                ref={containerRef}
                className={`relative h-3 w-full bg-slate-100 rounded-full overflow-hidden mt-2 mb-6 shadow-inner ${isExplorerOpen ? 'cursor-ew-resize touch-none' : ''}`}
                onMouseDown={isExplorerOpen ? handleScaleInteraction : undefined}
                onTouchMove={isExplorerOpen ? handleScaleInteraction : undefined}
                onTouchStart={isExplorerOpen ? handleScaleInteraction : undefined}
            >
                {/* Gradient Background */}
                <div
                    className="absolute inset-0 w-full h-full opacity-80"
                    style={{
                        background: `linear-gradient(to right, #ef4444 0%, #ef4444 15%, #eab308 30%, #22c55e 45%, #22c55e 55%, #eab308 70%, #ef4444 85%, #ef4444 100%)`
                    }}
                />

                {/* Trail (Ghost to Actual) */}
                {isExplorerOpen && (
                    <motion.div
                        className="absolute top-0 bottom-0 bg-white/50 z-0"
                        style={{
                            left: `${Math.min(position, ghostPosition)}%`,
                            width: `${Math.abs(ghostPosition - position)}%`
                        }}
                    />
                )}

                {/* Actual Marker (Fixed) */}
                <div
                    className={`absolute top-0 bottom-0 w-1.5 bg-white border-2 border-slate-600 shadow-md rounded-full z-10 transition-opacity ${isExplorerOpen ? 'opacity-40' : 'opacity-100'}`}
                    style={{ left: `calc(${position}% - 3px)` }}
                />

                {/* Ghost Marker (Draggable) */}
                {isExplorerOpen && (
                    <motion.div
                        className="absolute top-[1px] bottom-[1px] w-4 h-4 -mt-0.5 bg-white border-2 border-slate-800 shadow-lg rounded-full z-20"
                        style={{ left: `calc(${ghostPosition}% - 8px)` }}
                        layoutId="ghostMarker"
                    />
                )}
            </div>

            <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider px-0.5">
                <span className="text-red-400">Sangat Kurang</span>
                <span className="text-yellow-500">Kurang</span>
                <span className="text-green-600">Normal</span>
                <span className="text-yellow-500">Lebih</span>
                <span className="text-red-400">Sangat Lebih</span>
            </div>

            {/* Reference Explorer Sidebar/Panel */}
            <AnimatePresence>
                {isExplorerOpen && anchors && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-slate-100 overflow-hidden"
                    >
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-slate-50 p-2 rounded-lg">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Batas Normal Bawah</p>
                                <p className="text-sm font-bold text-slate-700">{anchors.lower.toFixed(1)} <span className="text-[10px] font-normal">{unit}</span></p>
                            </div>
                            <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider mb-1">Rata-rata Seusia</p>
                                <p className="text-sm font-bold text-emerald-800">{anchors.median.toFixed(1)} <span className="text-[10px] font-normal">{unit}</span></p>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Batas Normal Atas</p>
                                <p className="text-sm font-bold text-slate-700">{anchors.upper.toFixed(1)} <span className="text-[10px] font-normal">{unit}</span></p>
                            </div>
                        </div>

                        <div className="mt-3 flex items-start gap-2 bg-blue-50 p-3 rounded-lg">
                            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-700 leading-relaxed">
                                <strong>Kisaran Referensi Sehat:</strong> Anak seusianya dikatakan tumbuh normal jika berada di antara {anchors.lower.toFixed(1)} {unit} hingga {anchors.upper.toFixed(1)} {unit}. Angka ini adalah kisaran, bukan satu titik pasti.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Recommendation (Only when explorer closed) */}
            {!isExplorerOpen && status.recommendation && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex gap-2 items-start">
                        <div className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                        <p className="text-[11px] text-slate-500 italic">
                            Rekomendasi: {status.recommendation}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
