export type GrowthStatusSeverity = 'success' | 'warning' | 'danger' | 'neutral';

export interface GrowthStatus {
    label: string;
    color: string;
    severity: GrowthStatusSeverity;
    explanation: string;
    recommendation: string;
}

export const GROWTH_STATUS_MAP: Record<string, GrowthStatus> = {
    SANGAT_KURANG: {
        label: 'Sangat Kurang',
        color: '#ef4444',
        severity: 'danger',
        explanation: 'Sangat jauh di bawah standar usianya.',
        recommendation: 'Segera rujuk ke dokter spesialis anak.'
    },
    KURANG: {
        label: 'Kurang',
        color: '#eab308',
        severity: 'warning',
        explanation: 'Di bawah standar usianya.',
        recommendation: 'Evaluasi asupan makan dan pantau rutin.'
    },
    NORMAL: {
        label: 'Normal',
        color: '#22c55e',
        severity: 'success',
        explanation: 'Sesuai dengan usianya.',
        recommendation: 'Pertahankan gizi seimbang.'
    },
    LEBIH: {
        label: 'Lebih',
        color: '#eab308',
        severity: 'warning',
        explanation: 'Di atas standar usianya.',
        recommendation: 'Evaluasi pola makan, kurangi gula/lemak.'
    },
    SANGAT_LEBIH: {
        label: 'Sangat Lebih',
        color: '#ef4444',
        severity: 'danger',
        explanation: 'Sangat jauh di atas standar usianya.',
        recommendation: 'Konsultasi dokter untuk cegah obesitas.'
    },
    TIDAK_VALID: {
        label: 'Data Tidak Valid',
        color: '#cbd5e1',
        severity: 'neutral',
        explanation: 'Data pengukuran tidak valid.',
        recommendation: 'Silakan ukur ulang.'
    }
};

export function getGrowthStatus(zScore: number | null | undefined): GrowthStatus {
    if (zScore === null || zScore === undefined || isNaN(zScore)) {
        return GROWTH_STATUS_MAP.TIDAK_VALID;
    }

    // Sanity check removed as per request: all input considered valid
    // if (zScore > 5 || zScore < -5) {
    //     return GROWTH_STATUS_MAP.TIDAK_VALID;
    // }

    if (zScore < -3) return GROWTH_STATUS_MAP.SANGAT_KURANG;
    if (zScore >= -3 && zScore < -2) return GROWTH_STATUS_MAP.KURANG;
    if (zScore >= -2 && zScore <= 2) return GROWTH_STATUS_MAP.NORMAL;
    if (zScore > 2 && zScore <= 3) return GROWTH_STATUS_MAP.LEBIH;
    if (zScore > 3) return GROWTH_STATUS_MAP.SANGAT_LEBIH;

    return GROWTH_STATUS_MAP.TIDAK_VALID;
}

export function getStatusLabelFromZ(zScore: number) {
    return getGrowthStatus(zScore).label;
}

/**
 * Calculates the measurement value (X) from a given Z-score (Z)
 * using the LMS parameters (L, M, S).
 * 
 * Formula:
 * If L != 0: X = M * (1 + L * S * Z)^(1/L)
 * If L == 0: X = M * exp(S * Z)
 */
export function calculateValueFromZ(z: number, l: number, m: number, s: number): number {
    if (l === 0) {
        return m * Math.exp(s * z);
    }
    const base = 1 + l * s * z;
    if (base <= 0) return 0; // Out of valid range
    return m * Math.pow(base, 1 / l);
}
