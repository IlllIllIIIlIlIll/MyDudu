import { ReactNode } from 'react';
import { motion } from 'motion/react';

interface BiometricCardProps {
    label: string;
    value: number | string;
    unit: string;
    icon: ReactNode;
    loading?: boolean;
    isCritical?: boolean;
    index?: number;
}

export function BiometricCard({ 
    label, 
    value, 
    unit, 
    icon, 
    loading, 
    isCritical, 
    index = 0 
}: BiometricCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
            whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0, 0, 0, 0.12)" }}
            className={`
                rounded-3xl p-6 border transition-all duration-300 backdrop-blur-sm
                ${isCritical 
                    ? 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200 shadow-lg' 
                    : 'bg-white border-gray-100 shadow-lg'
                }
            `}
        >
            <div className="flex items-center gap-3 mb-4">
                <div
                    className={`
                        w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 
                        ${isCritical 
                            ? 'bg-gradient-to-br from-red-200 to-red-300 text-red-700 shadow-md' 
                            : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-gray-600 shadow-md'
                        }
                    `}
                >
                    {icon}
                </div>
                <span 
                    className={`
                        text-[11px] font-bold uppercase tracking-widest
                        ${isCritical ? 'text-red-700' : 'text-gray-600'}
                    `}
                >
                    {label}
                </span>
            </div>

            <div className="flex items-baseline gap-2 ml-0 pt-2">
                {loading ? (
                    <div className="h-10 w-24 bg-gray-300 animate-pulse rounded-lg" />
                ) : (
                    <>
                        <span
                            className={`
                                text-4xl font-extrabold tracking-tight
                                ${isCritical ? 'text-red-700' : 'text-gray-900'}
                            `}
                        >
                            {value}
                        </span>
                        <span className={`text-sm font-semibold ${isCritical ? 'text-red-600' : 'text-gray-500'}`}>
                            {unit}
                        </span>
                    </>
                )}
            </div>
        </motion.div>
    );
}
