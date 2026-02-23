export type GrowthStatusSeverity = 'success' | 'warning' | 'danger' | 'neutral';

export type GrowthIndicator =
    | 'LENGTH_HEIGHT_FOR_AGE'
    | 'WEIGHT_FOR_AGE'
    | 'WEIGHT_FOR_LENGTH'
    | 'WEIGHT_FOR_HEIGHT'
    | 'BMI_FOR_AGE';

export interface GrowthStatus {
    label: string;
    color: string;
    severity: GrowthStatusSeverity;
    explanation: string;
    recommendation: string;
}

export const GROWTH_STATUS_MAP: Record<string, GrowthStatus> = {
    // --- Stunting (Height/Age) ---
    SANGAT_PENDEK: {
        label: 'Sangat Pendek (Severe Stunted)',
        color: '#ef4444',
        severity: 'danger',
        explanation: 'Tinggi badan sangat jauh di bawah standar.',
        recommendation: 'Rujuk segera ke Sp.A untuk investigasi stunting.'
    },
    PENDEK: {
        label: 'Pendek (Stunted)',
        color: '#eab308',
        severity: 'warning',
        explanation: 'Tinggi badan di bawah standar.',
        recommendation: 'Evaluasi asupan kronis dan stimulasi.'
    },

    // --- Wasting (Weight/Height) & BMI ---
    SANGAT_KURUS: {
        label: 'Sangat Kurus (Severe Wasted)',
        color: '#ef4444',
        severity: 'danger',
        explanation: 'Berat sangat kurang dibanding tinggi.',
        recommendation: 'Rujuk segera. Risiko malnutrisi akut berat.'
    },
    KURUS: { // Wasted
        label: 'Kurus (Wasted)',
        color: '#eab308',
        severity: 'warning',
        explanation: 'Berat kurang dibanding tinggi.',
        recommendation: 'Perbaiki asupan kalori segera.'
    },
    GEMUK: { // Overweight
        label: 'Gemuk (Overweight)',
        color: '#eab308',
        severity: 'warning',
        explanation: 'Berat lebih dibanding tinggi.',
        recommendation: 'Evaluasi pola makan, kurangi gula.'
    },
    OBESITAS: { // Obese
        label: 'Obesitas (Obese)',
        color: '#ef4444',
        severity: 'danger',
        explanation: 'Berat sangat berlebih dibanding tinggi.',
        recommendation: 'Rujuk Sp.A untuk manajemen obesitas.'
    },

    // --- Underweight (Weight/Age) ---
    SANGAT_KURANG: { // Severe Underweight
        label: 'Berat Sangat Kurang',
        color: '#ef4444',
        severity: 'danger',
        explanation: 'Berat badan sangat rendah untuk usianya.',
        recommendation: 'Perlu penanganan medis segera.'
    },
    KURANG: { // Underweight
        label: 'Berat Kurang',
        color: '#eab308',
        severity: 'warning',
        explanation: 'Berat badan rendah untuk usianya.',
        recommendation: 'Evaluasi MPASI dan pola asuh.'
    },

    // --- Common ---
    NORMAL: {
        label: 'Normal',
        color: '#22c55e',
        severity: 'success',
        explanation: 'Pertumbuhan sesuai standar.',
        recommendation: 'Pertahankan gizi seimbang.'
    },
    LEBIH: { // Generic more (used in WFA sometimes, though typically not flagged high)
        label: 'Lebih',
        color: '#eab308',
        severity: 'warning',
        explanation: 'Di atas rata-rata.',
        recommendation: 'Pantau terus.'
    },
    TIDAK_VALID: {
        label: 'Data Tidak Valid',
        color: '#cbd5e1',
        severity: 'neutral',
        explanation: 'Data pengukuran di luar batas wajar.',
        recommendation: 'Ukur ulang.'
    }
};

/**
 * Determines growth status based on Z-score and specific Indicator type.
 * STRICT WHO CLASSIFICATION LOGIC.
 */
export function getGrowthStatus(zScore: number | null | undefined, indicator?: GrowthIndicator): GrowthStatus {
    if (zScore === null || zScore === undefined || isNaN(zScore)) {
        return GROWTH_STATUS_MAP.TIDAK_VALID;
    }

    // Safety Guard
    if (zScore < -5 || zScore > 5) {
        return GROWTH_STATUS_MAP.TIDAK_VALID;
    }

    // Identify indicator group
    const isHeightAge = indicator === 'LENGTH_HEIGHT_FOR_AGE';
    const isWeightHeight = indicator === 'WEIGHT_FOR_LENGTH' || indicator === 'WEIGHT_FOR_HEIGHT' || indicator === 'BMI_FOR_AGE';
    const isWeightAge = indicator === 'WEIGHT_FOR_AGE';

    if (isHeightAge) {
        // Stunting Logic
        if (zScore < -3) return GROWTH_STATUS_MAP.SANGAT_PENDEK;
        if (zScore < -2) return GROWTH_STATUS_MAP.PENDEK;
        return GROWTH_STATUS_MAP.NORMAL; // > -2 is Normal (Tall is not usually distinct pathology for stunting screens, but >3 could be endocrine)
    }

    if (isWeightHeight) {
        // Wasting / Obesity Logic
        if (zScore < -3) return GROWTH_STATUS_MAP.SANGAT_KURUS;
        if (zScore < -2) return GROWTH_STATUS_MAP.KURUS;
        if (zScore > 3) return GROWTH_STATUS_MAP.OBESITAS;
        if (zScore > 2) return GROWTH_STATUS_MAP.GEMUK;
        return GROWTH_STATUS_MAP.NORMAL;
    }

    if (isWeightAge) {
        // Underweight Logic
        // Note: WFA > +1 is a problem?, WHO says > +1 is likely overweight but WFH is better.
        // We stick to Underweight detection here primarily.
        if (zScore < -3) return GROWTH_STATUS_MAP.SANGAT_KURANG;
        if (zScore < -2) return GROWTH_STATUS_MAP.KURANG;
        return GROWTH_STATUS_MAP.NORMAL;
    }

    // Fallback / Generic Logic if indicator unseen
    if (zScore < -3) return GROWTH_STATUS_MAP.SANGAT_KURANG;
    if (zScore < -2) return GROWTH_STATUS_MAP.KURANG;
    if (zScore > 3) return GROWTH_STATUS_MAP.OBESITAS; // SANGAT_LEBIH doesn't exist — use OBESITAS
    if (zScore > 2) return GROWTH_STATUS_MAP.LEBIH;
    return GROWTH_STATUS_MAP.NORMAL;
}

export function getStatusLabelFromZ(zScore: number, indicator?: GrowthIndicator) {
    return getGrowthStatus(zScore, indicator).label;
}

/**
 * Calculates the measurement value (X) from a given Z-score (Z)
 * using the LMS parameters (L, M, S).
 */
export function calculateValueFromZ(z: number, l: number, m: number, s: number): number {
    if (l === 0) {
        return m * Math.exp(s * z);
    }
    const base = 1 + l * s * z;
    if (base <= 0) return 0; // Out of valid range
    return m * Math.pow(base, 1 / l);
}

/**
 * Calculates boundary values for the Reference Explorer.
 * Returns measurements at key Z-scores provided in zPoints or defaults [-3, -2, 0, 2, 3].
 */
export function calculateExplorerBoundaries(
    l: number,
    m: number,
    s: number,
    zPoints: number[] = [-3, -2, 0, 2, 3]
): Record<number, number> {
    const boundaries: Record<number, number> = {};
    zPoints.forEach(z => {
        boundaries[z] = calculateValueFromZ(z, l, m, s);
    });
    return boundaries;
}
