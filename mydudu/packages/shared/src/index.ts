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
        MILD_FEVER_MAX: 38.0,
        MODERATE_FEVER_MAX: 39.0,
        HYPOTHERMIA: 35.5
    },
    HEART_RATE: {
        NEWBORN: { MIN: 70, MAX: 190 }, // < 1 month
        BABY: { MIN: 80, MAX: 160 },    // < 12 months
        CHILD: { MIN: 70, MAX: 130 }    // >= 12 months
    },
    SPO2: {
        NORMAL_MIN: 95,
        WARNING_MIN: 90
        // < 90 is Danger
    },
    NOISE: {
        SAFE_MAX: 54,
        WARNING_MAX: 85
    },
    BMI_FALLBACK: {
        DANGER_MIN: 12,
        WARNING_MIN: 13.5,
        WARNING_MAX: 18,
        DANGER_MAX: 20
    }
} as const;
