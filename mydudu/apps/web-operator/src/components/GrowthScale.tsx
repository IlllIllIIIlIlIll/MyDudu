
import { motion } from 'motion/react';
import { useMemo } from 'react';

interface GrowthScaleProps {
    label: string;      // e.g., "BB/U"
    subLabel: string;   // e.g., "Berat Badan menurut Umur"
    value: number;      // Current Value (e.g., 12.5 kg)
    zScore: number;     // Current Z-Score
    deviation: number;  // Deviation from ideal (e.g., +1.5)
    ideal: number;      // Ideal value (Median)
    unit: string;       // e.g., "kg" or "cm"
    color: string;      // Hex color from backend
}

export function GrowthScale({ label, subLabel, value, zScore, deviation, ideal, unit, color }: GrowthScaleProps) {

    // Calculate position percentage (clamped -3.5 to +3.5 mapped to 0-100%)
    const position = useMemo(() => {
        const clampedZ = Math.max(-3.5, Math.min(3.5, zScore));
        // -3.5 -> 0%, 0 -> 50%, +3.5 -> 100%
        return ((clampedZ + 3.5) / 7) * 100;
    }, [zScore]);

    const formattedDeviation = deviation > 0 ? `+${deviation.toFixed(1)}` : deviation.toFixed(1);

    return (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-700 text-sm">{label}</h4>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{subLabel}</span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-lg font-bold text-slate-900">{value}</span>
                        <span className="text-xs text-slate-500 font-medium">{unit}</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-sm font-bold`} style={{ color }}>
                        {formattedDeviation} {unit}
                    </div>
                    <div className="text-[10px] text-slate-400">
                        Ideal: {ideal.toFixed(1)} {unit}
                    </div>
                </div>
            </div>

            {/* Scale Track */}
            <div className="relative h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                {/* Gradient Background: Red -> Yellow -> Green -> Yellow -> Red */}
                <div
                    className="absolute inset-0 w-full h-full"
                    style={{
                        background: `linear-gradient(to right, 
              #ef4444 0%, 
              #ef4444 15%, 
              #eab308 30%, 
              #22c55e 45%, 
              #22c55e 55%, 
              #eab308 70%, 
              #ef4444 85%, 
              #ef4444 100%)`
                    }}
                />

                {/* Marker */}
                <motion.div
                    className="absolute top-0 bottom-0 w-1.5 bg-white border border-slate-300 shadow-sm rounded-full z-10"
                    style={{ left: `calc(${position}% - 3px)` }}
                    initial={{ left: '50%' }}
                    animate={{ left: `calc(${position}% - 3px)` }}
                    transition={{ type: "spring", stiffness: 100 }}
                />
            </div>

            <div className="flex justify-between text-[9px] text-slate-400 font-medium mt-1.5 px-0.5 uppercase tracking-wider">
                <span>-3 SD</span>
                <span>-2 SD</span>
                <span>0 SD</span>
                <span>+2 SD</span>
                <span>+3 SD</span>
            </div>
        </div>
    );
}
