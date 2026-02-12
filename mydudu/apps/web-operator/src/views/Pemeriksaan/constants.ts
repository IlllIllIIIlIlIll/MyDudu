import { DecisionNode } from './types';

export const DECISION_TREE: Record<string, DecisionNode> = {
    start: {
        id: 'start',
        question: 'Apakah anak mengalami demam tinggi?',
        layman: 'Suhu tubuh terasa panas saat disentuh atau > 37.5°C',
        imageYes: 'https://images.unsplash.com/photo-1748200100427-52921dec8597?w=400&h=300&fit=crop',
        imageNo: 'https://images.unsplash.com/photo-1758691462119-792279713969?w=400&h=300&fit=crop',
        yesNodeId: 'fever_path',
        noNodeId: 'no_fever_path'
    },
    fever_path: {
        id: 'fever_path',
        question: 'Apakah anak juga mengalami batuk?',
        layman: 'Batuk berdahak atau kering selama lebih dari 2 hari',
        imageYes: 'https://images.unsplash.com/photo-1693066048671-f7bdcb48f735?w=400&h=300&fit=crop',
        imageNo: 'https://images.unsplash.com/photo-1746911053268-8629a8941e96?w=400&h=300&fit=crop',
        yesNodeId: 'pneumonia_check',
        noNodeId: 'dengue_check'
    },
    pneumonia_check: {
        id: 'pneumonia_check',
        question: 'Apakah nafas anak terasa sangat cepat?',
        layman: 'Hitung tarikan nafas anak dalam 1 menit saat sedang tenang',
        imageYes: 'https://images.unsplash.com/photo-1715529407988-3054ef00335c?w=400&h=300&fit=crop',
        imageNo: 'https://images.unsplash.com/photo-1758691462119-792279713969?w=400&h=300&fit=crop',
        yesNodeId: 'diag_pneumonia',
        noNodeId: 'diag_common_cold'
    },
    dengue_check: {
        id: 'dengue_check',
        question: 'Apakah muncul bintik merah di kulit?',
        layman: 'Bercak merah yang tidak hilang saat ditekan',
        imageYes: 'https://images.unsplash.com/photo-1746911053268-8629a8941e96?w=400&h=300&fit=crop',
        imageNo: 'https://images.unsplash.com/photo-1758691462119-792279713969?w=400&h=300&fit=crop',
        yesNodeId: 'diag_dengue',
        noNodeId: 'diag_fever'
    },
    no_fever_path: {
        id: 'no_fever_path',
        question: 'Apakah anak mengalami diare (BAB cair)?',
        layman: 'Buang air besar lebih cair dari biasanya, lebih dari 3x sehari',
        imageYes: 'https://images.unsplash.com/photo-1716929806153-4e3f66242de0?w=400&h=300&fit=crop',
        imageNo: 'https://images.unsplash.com/photo-1758691462119-792279713969?w=400&h=300&fit=crop',
        yesNodeId: 'dehydration_check',
        noNodeId: 'diag_healthy'
    },
    dehydration_check: {
        id: 'dehydration_check',
        question: 'Apakah anak tampak lemas atau sangat haus?',
        layman: 'Anak sulit dibangunkan atau minum dengan lahap karena sangat haus',
        imageYes: 'https://images.unsplash.com/photo-1751574979481-5cd79f421333?w=400&h=300&fit=crop',
        imageNo: 'https://images.unsplash.com/photo-1716929806153-4e3f66242de0?w=400&h=300&fit=crop',
        yesNodeId: 'diag_diarrhea_severe',
        noNodeId: 'diag_diarrhea_mild'
    },
    diag_pneumonia: {
        id: 'diag_pneumonia',
        question: '', layman: '', imageYes: '', imageNo: '',
        finalDiagnosis: {
            title: 'Kecurigaan Pneumonia (Infeksi Paru)',
            description: 'Ditemukan kombinasi demam, batuk, dan pernapasan cepat (tachypnea).',
            severity: 'Merah',
            instructions: ['Segera lakukan rujukan ke Puskesmas/RS', 'Berikan oksigen tambahan jika tersedia', 'Jangan berikan obat batuk sembarangan']
        }
    },
    diag_dengue: {
        id: 'diag_dengue',
        question: '', layman: '', imageYes: '', imageNo: '',
        finalDiagnosis: {
            title: 'Potensi DBD (Demam Berdarah)',
            description: 'Adanya demam tinggi disertai ruam kulit (petechiae) memerlukan tes darah.',
            severity: 'Merah',
            instructions: ['Segera periksa ke Dokter', 'Berikan minum yang banyak', 'Pantau tanda-tanda pendarahan gusi/hidung']
        }
    },
    diag_diarrhea_severe: {
        id: 'diag_diarrhea_severe',
        question: '', layman: '', imageYes: '', imageNo: '',
        finalDiagnosis: {
            title: 'Diare Akut dengan Dehidrasi Berat',
            description: 'Kombinasi diare dan penurunan kesadaran/lemas merupakan gawat darurat.',
            severity: 'Merah',
            instructions: ['Rujuk Segera ke UGD', 'Berikan oralit sedikit demi sedikit selama perjalanan', 'Pasang infus jika di fasilitas kesehatan']
        }
    },
    diag_healthy: {
        id: 'diag_healthy',
        question: '', layman: '', imageYes: '', imageNo: '',
        finalDiagnosis: {
            title: 'Kondisi Anak Baik (Sehat)',
            description: 'Tidak ditemukan tanda-tanda infeksi akut atau dehidrasi pada saat ini.',
            severity: 'Hijau',
            instructions: ['Lanjutkan pemberian makanan bergizi', 'Pastikan jadwal imunisasi lengkap', 'Pantau kebersihan lingkungan']
        }
    }
};

export const DIAGNOSIS_CODE_MAP: Record<string, 'PNEUMONIA' | 'DENGUE' | 'DIARRHEA_SEVERE' | 'HEALTHY'> = {
    diag_pneumonia: 'PNEUMONIA',
    diag_dengue: 'DENGUE',
    diag_diarrhea_severe: 'DIARRHEA_SEVERE',
    diag_healthy: 'HEALTHY',
};
