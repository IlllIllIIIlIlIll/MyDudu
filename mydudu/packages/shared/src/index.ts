/**
 * Medical Constants for MyDudu
 * Strictly defines health thresholds and standardized magic numbers.
 */

export const Z_SCORE_THRESHOLDS = {
    SEVERE_UNDER: -3,
    UNDER: -2,
    OVER: 2,
    SEVERE_OVER: 3
} as const;

export const AGE_THRESHOLDS = {
    // WHO standards use length for under 2 years (730 days) and height above it.
    USE_LENGTH_MAX_DAYS: 729,
    NEWBORN_MAX_MONTHS: 1,
    BABY_MAX_MONTHS: 12
} as const;

export const VITALS_THRESHOLDS = {
    TEMPERATURE: {
        MIN_SAFE: 36.5,
        MAX_SAFE: 37.5,
        MILD_FEVER_MIN: 37.6,
        MILD_FEVER_MAX: 38.0,
        MODERATE_FEVER_MIN: 38.1,
        MODERATE_FEVER_MAX: 39.0,
        HYPOTHERMIA: 35.5
    },
    HEART_RATE: {
        NEWBORN: { MIN: 70, MAX: 190 }, // < 1 month
        BABY: { MIN: 80, MAX: 160 },    // < 12 months
        CHILD: { MIN: 70, MAX: 130 },   // >= 12 months
        EDGE_WARNING_BPM: 10
    },
    SPO2: {
        NORMAL_MIN: 95,
        WARNING_MIN: 90
        // < 90 is Danger
    },
    NOISE: {
        SAFE_MAX: 54,
        MODERATE_MAX: 70,
        WARNING_MAX: 85
    },
    BMI_FALLBACK: {
        DANGER_MIN: 12,
        WARNING_MIN: 13.5,
        WARNING_MAX: 18,
        DANGER_MAX: 20
    },
    // Approximate Growth thresholds for manual frontend estimation
    GROWTH_FALLBACKS: {
        NEWBORN: {
            WEIGHT_MIN: 2.5, WEIGHT_MAX: 4.5,
            HEIGHT_MIN: 45, HEIGHT_MAX: 54
        },
        BABY_6M: { // 1-6 months
            WEIGHT_MIN: 5.5, WEIGHT_MAX: 8.5,
            HEIGHT_MIN: 60, HEIGHT_MAX: 70
        },
        TODDLER_1Y: { // 7-12 months
            WEIGHT_MIN: 8.0, WEIGHT_MAX: 11.5,
            HEIGHT_MIN: 70, HEIGHT_MAX: 80
        },
        TODDLER_2Y: { // 13-24 months
            WEIGHT_MIN: 10.0, WEIGHT_MAX: 14.5,
            HEIGHT_MIN: 80, HEIGHT_MAX: 93
        },
        CHILD_5Y: { // 25-60 months
            WEIGHT_MIN: 14.0, WEIGHT_MAX: 21.0,
            HEIGHT_MIN: 98, HEIGHT_MAX: 115
        }
    },
    DEFAULT_FALLBACKS: {
        NO_DATA: 0
    }
} as const;


export const WHO_STATUS_TRANSLATE: Record<string, string> = {
    'SEVERE_STUNTED': 'SANGAT PENDEK (STUNTING PARAH)',
    'STUNTED': 'PENDEK (STUNTING)',
    'VERY_TALL': 'SANGAT TINGGI',
    'TALL': 'TINGGI',
    'SEVERE_UNDERWEIGHT': 'GIZI BURUK',
    'UNDERWEIGHT': 'GIZI KURANG',
    'SEVERE_OVERWEIGHT': 'SANGAT LEBIH BERAT BADAN',
    'OVERWEIGHT': 'LEBIH BERAT BADAN / RISIKO GEMUK',
    'SEVERE_WASTED': 'SANGAT KURUS (WASTING PARAH)',
    'WASTED': 'KURUS (WASTING)',
    'OBESE': 'OBESITAS',
    'NORMAL': 'NORMAL'
};

export const WHO_INDICATOR_TRANSLATE: Record<string, string> = {
    'BMI_FOR_AGE': 'IMT/Usia',
    'WEIGHT_FOR_LENGTH': 'Berat/Panjang Badan',
    'WEIGHT_FOR_HEIGHT': 'Berat/Tinggi Badan',
    'LENGTH_HEIGHT_FOR_AGE': 'Tinggi/Usia',
    'WEIGHT_FOR_AGE': 'Berat/Usia'
};

export const HEALTH_COLORS = {
    DANGER: {
        bg: '#fee2e2',
        border: '#fca5a5',
        text: '#b91c1c'
    },
    WARNING: {
        bg: '#fef3c7',
        border: '#fcd34d',
        text: '#d97706'
    },
    NORMAL: {
        bg: '#f0fdf4',
        border: '#86efac',
        text: '#15803d'
    },
    IDLE: {
        bg: '#f8fafc',
        border: '#e2e8f0',
        text: '#64748b'
    }
} as const;

/**
 * Maps clinical outcome codes from the backend to display labels,
 * severity keys, and follow-up instructions.
 */
export const CLINICAL_OUTCOME_CONFIG: Record<string, {
    label: string;
    severity: 'DANGER' | 'WARNING' | 'NORMAL';
    instructions: string[];
}> = {
    EMERGENCY: {
        label: 'Gawat Darurat',
        severity: 'DANGER',
        instructions: ['Rujuk ke UGD segera', 'Berikan pertolongan pertama'],
    },
    REFER_IMMEDIATELY: {
        label: 'Rujuk Segera',
        severity: 'DANGER',
        instructions: ['Rujuk ke fasilitas kesehatan', 'Pantau kondisi anak'],
    },
    DIAGNOSED: {
        label: 'Terdiagnosis',
        severity: 'WARNING',
        instructions: ['Konsultasikan hasil dengan dokter', 'Berikan perawatan sesuai anjuran'],
    },
    NORMAL: {
        label: 'Hasil Pemeriksaan',
        severity: 'NORMAL',
        instructions: ['Lanjutkan pemantauan', 'Berikan perawatan sesuai anjuran'],
    },
};
