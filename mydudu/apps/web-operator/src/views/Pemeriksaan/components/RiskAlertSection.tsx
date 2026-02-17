import { motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';

interface RiskAlert {
    label: string;
    severity: 'critical' | 'warning';
}

interface RiskAlertSectionProps {
    alerts: RiskAlert[];
}

export function RiskAlertSection({ alerts }: RiskAlertSectionProps) {
    if (alerts.length === 0) return null;

    const hasCritical = alerts.some(a => a.severity === 'critical');

    return (
        <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`
                mb-8 p-5 rounded-2xl border-l-[6px] border-b transition-all shadow-lg
                ${hasCritical 
                    ? 'bg-gradient-to-br from-red-50 to-red-100/50 border-l-red-600 border-b-red-200' 
                    : 'bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-l-yellow-500 border-b-yellow-200'
                }
            `}
        >
            <div className="flex items-start gap-3.5 mb-4">
                <div className="shrink-0 mt-0.5">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <AlertCircle 
                            className={`w-6 h-6 ${hasCritical ? 'text-red-600' : 'text-yellow-600'}`}
                        />
                    </motion.div>
                </div>
                <div className="flex-1">
                    <h3 
                        className={`
                            font-bold text-base mb-1.5
                            ${hasCritical ? 'text-red-900' : 'text-yellow-900'}
                        `}
                    >
                        Perhatian Khusus Diperlukan
                    </h3>
                    <p 
                        className={`
                            text-sm leading-relaxed mb-4
                            ${hasCritical ? 'text-red-800' : 'text-yellow-800'}
                        `}
                    >
                        Terdapat indikator kesehatan yang memerlukan perhatian segera.
                    </p>
                </div>
            </div>

            {/* Alert Badges */}
            <div className="flex flex-wrap gap-2.5">
                {alerts.map((alert, idx) => (
                    <motion.span
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15 + idx * 0.1 }}
                        className={`
                            px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide
                            ${alert.severity === 'critical'
                                ? 'bg-gradient-to-r from-red-300 to-red-400 text-red-950 shadow-md'
                                : 'bg-gradient-to-r from-yellow-300 to-yellow-400 text-yellow-950 shadow-md'
                            }
                        `}
                    >
                        {alert.label}
                    </motion.span>
                ))}
            </div>
        </motion.div>
    );
}
