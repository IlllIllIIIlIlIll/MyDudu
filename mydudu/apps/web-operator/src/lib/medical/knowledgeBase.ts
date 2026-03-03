import { Disease, Symptom, RedFlag } from './types';

// DISEASES
export const DISEASES: Record<string, Disease> = {
    flu: {
        id: 'flu',
        name: 'Influenza / ISPA Ringan',
        description: 'Infeksi saluran pernapasan akut yang umum.',
        prior: 0.15, // Common
        urgent: false,
    },
    dengue: {
        id: 'dengue',
        name: 'Suspect Demam Berdarah (Dengue)',
        description: 'Infeksi virus dengue yang ditularkan nyamuk.',
        prior: 0.05,
        urgent: true,
    },
    measles: {
        id: 'measles',
        name: 'Suspect Campak (Measles)',
        description: 'Infeksi virus menular dengan ruam kulit.',
        prior: 0.02,
        urgent: true,
    },
    dehydration: {
        id: 'dehydration',
        name: 'Diare & Dehidrasi',
        description: 'Kekurangan cairan akibat diare/muntah.',
        prior: 0.08,
        urgent: true,
    },
    stunting_risk: { // Non-acute, but screening target
        id: 'stunting_risk',
        name: 'Risiko Masalah Nutrisi / Stunting',
        description: 'Indikasi masalah pertumbuhan berdasarkan gejala kronis.',
        prior: 0.10,
        urgent: false,
    }
};

// RED FLAGS - Override Logic
export const RED_FLAGS: RedFlag[] = [
    {
        id: 'rf_seizure',
        question: 'Apakah anak mengalami kejang?',
        reason: 'Kejang adalah tanda bahaya umum yang memerlukan penanganan segera.',
    },
    {
        id: 'rf_unconscious',
        question: 'Apakah anak tidak sadar atau sulit dibangunkan?',
        reason: 'Penurunan kesadaran indikasi kondisi kritis.',
    },
    {
        id: 'rf_vomit_all',
        question: 'Apakah anak memuntahkan SEMUA makanan/minuman?',
        reason: 'Risiko dehidrasi berat dan tanda bahaya umum.',
    },
    {
        id: 'rf_breath',
        question: 'Apakah ada tarikan dinding dada ke dalam yang sangat kuat (sesak berat)?',
        reason: 'Tanda pneumonia berat atau gagal napas.',
    }
];

// SYMPTOMS & LIKELIHOODS P(S|D)
// Simplified Matrix: Yes/No probabilities
export const SYMPTOMS: Symptom[] = [
    {
        id: 'fever',
        question: 'Apakah anak mengalami demam?',
        medicalTerm: 'Suhu tubuh > 37.5°C',
        likelihoods: {
            flu: { yes: 0.90, no: 0.10 },
            dengue: { yes: 0.95, no: 0.05 },
            measles: { yes: 0.95, no: 0.05 },
            dehydration: { yes: 0.40, no: 0.60 },
            stunting_risk: { yes: 0.10, no: 0.90 },
        }
    },
    {
        id: 'cough',
        question: 'Apakah anak batuk?',
        likelihoods: {
            flu: { yes: 0.85, no: 0.15 },
            dengue: { yes: 0.20, no: 0.80 },
            measles: { yes: 0.70, no: 0.30 },
            dehydration: { yes: 0.10, no: 0.90 },
            stunting_risk: { yes: 0.20, no: 0.80 },
        }
    },
    {
        id: 'runny_nose',
        question: 'Apakah anak pilek / hidung meler?',
        likelihoods: {
            flu: { yes: 0.80, no: 0.20 },
            dengue: { yes: 0.20, no: 0.80 },
            measles: { yes: 0.50, no: 0.50 },
            dehydration: { yes: 0.05, no: 0.95 },
            stunting_risk: { yes: 0.10, no: 0.90 },
        }
    },
    {
        id: 'rash',
        question: 'Apakah ada ruam kemerahan di kulit?',
        likelihoods: {
            flu: { yes: 0.05, no: 0.95 },
            dengue: { yes: 0.60, no: 0.40 }, // Petechiae
            measles: { yes: 0.90, no: 0.10 }, // Maculopapular
            dehydration: { yes: 0.05, no: 0.95 },
            stunting_risk: { yes: 0.05, no: 0.95 },
        }
    },
    {
        id: 'joint_pain',
        question: 'Apakah anak mengeluh nyeri sendi / linu hebat?',
        likelihoods: {
            flu: { yes: 0.30, no: 0.70 },
            dengue: { yes: 0.80, no: 0.20 },
            measles: { yes: 0.20, no: 0.80 },
            dehydration: { yes: 0.10, no: 0.90 },
            stunting_risk: { yes: 0.05, no: 0.95 },
        }
    },
    {
        id: 'red_eyes',
        question: 'Apakah mata anak merah dan berair?',
        likelihoods: {
            flu: { yes: 0.30, no: 0.70 },
            dengue: { yes: 0.10, no: 0.90 },
            measles: { yes: 0.80, no: 0.20 }, // Conjunctivitis indicates Measles
            dehydration: { yes: 0.05, no: 0.95 },
            stunting_risk: { yes: 0.05, no: 0.95 },
        }
    },
    {
        id: 'diarrhea',
        question: 'Apakah anak diare (BAB cair >3x sehari)?',
        likelihoods: {
            flu: { yes: 0.10, no: 0.90 },
            dengue: { yes: 0.10, no: 0.90 },
            measles: { yes: 0.20, no: 0.80 },
            dehydration: { yes: 0.95, no: 0.05 },
            stunting_risk: { yes: 0.40, no: 0.60 }, // Chronic diarrhea causes stunting
        }
    },
    {
        id: 'vomit',
        question: 'Apakah anak muntah?',
        likelihoods: {
            flu: { yes: 0.10, no: 0.90 },
            dengue: { yes: 0.40, no: 0.60 },
            measles: { yes: 0.10, no: 0.90 },
            dehydration: { yes: 0.80, no: 0.20 },
            stunting_risk: { yes: 0.05, no: 0.95 },
        }
    },
    {
        id: 'poor_appetite',
        question: 'Apakah nafsu makan anak sangat menurun?',
        likelihoods: {
            flu: { yes: 0.50, no: 0.50 },
            dengue: { yes: 0.70, no: 0.30 },
            measles: { yes: 0.80, no: 0.20 },
            dehydration: { yes: 0.60, no: 0.40 },
            stunting_risk: { yes: 0.90, no: 0.10 },
        }
    }
];
