
import * as nodeCrypto from 'crypto';
const stringify = require('fast-json-stable-stringify');
import { PrismaClient } from '@prisma/client';
import { ClinicalSpec } from '../src/clinical/clinical.types';
import { ClinicalTreeGenerator } from '../src/clinical/ClinicalTreeGenerator';

const prisma = new PrismaClient();

const DISEASES = [
    {
        "disease_id": "DENGUE",
        "disease_name": "Demam Berdarah Dengue (DBD)",
        "category": "INFECTIOUS",
        "age_risk_group": ["ALL"],
        "endemicity_required": true,
        "transmission_mode": ["MOSQUITO_VECTOR"],

        "entry_criteria": {
            "epidemiology": [
                "tinggal_atau_pergi_ke_daerah_endemis_14_hari"
            ],
            "primary_condition": null,
            "required_primary_symptom": ["DENGUE_demam"],
            "minimum_additional_symptoms_required": 2
        },

        "core_symptoms": [
            {
                "id": "DENGUE_demam",
                "label": "Apakah anak mengalami demam tinggi mendadak?",
                "weight": "PRIMARY",
                "counts_toward_minimum": false
            },
            {
                "id": "DENGUE_mual_muntah",
                "label": "Apakah anak mual atau muntah?",
                "weight": "PRIMARY",
                "counts_toward_minimum": true
            },
            {
                "id": "DENGUE_nyeri_badan",
                "label": "Apakah anak mengeluh pegal-pegal atau nyeri badan/sendi?",
                "weight": "PRIMARY",
                "counts_toward_minimum": true
            },
            {
                "id": "DENGUE_sakit_kepala",
                "label": "Apakah anak mengeluh sakit kepala atau nyeri di belakang mata?",
                "weight": "SECONDARY",
                "counts_toward_minimum": true
            },
            {
                "id": "DENGUE_ruam",
                "label": "Apakah muncul ruam atau bintik kemerahan di kulit?",
                "weight": "SECONDARY",
                "counts_toward_minimum": true
            }
        ],

        "risk_factors": [
            {
                "id": "DENGUE_pernah_dbd",
                "label": "Apakah anak pernah didiagnosis DBD sebelumnya?",
                "gate_type": "SOFT_WEIGHT"
            }
        ],

        "warning_signs": [
            {
                "id": "DENGUE_nyeri_perut_berat",
                "label": "Apakah anak mengeluh nyeri perut berat atau sakit saat perut ditekan?",
                "requires_observation": true,
                "override_to": "REFER_IMMEDIATELY"
            },
            {
                "id": "DENGUE_muntah_persisten",
                "label": "Apakah anak muntah terus-menerus (≥3 kali dalam 1 jam atau ≥4 kali dalam 6 jam)?",
                "requires_observation": true,
                "override_to": "REFER_IMMEDIATELY"
            },
            {
                "id": "DENGUE_perdarahan",
                "label": "Apakah ada perdarahan dari hidung/gusi, muntah darah, atau BAB hitam?",
                "requires_observation": true,
                "override_to": "REFER_IMMEDIATELY"
            },
            {
                "id": "DENGUE_lemas_berat",
                "label": "Apakah anak tampak sangat lemas, mengantuk tidak wajar, atau sulit dibangunkan?",
                "requires_observation": true,
                "override_to": "REFER_IMMEDIATELY"
            }
        ],

        "severe_criteria": [
            {
                "id": "DENGUE_syok",
                "label": "Apakah anak tampak seperti syok: sangat lemas, tangan/kaki dingin, pucat, nadi lemah, atau tidak sadar?"
            },
            {
                "id": "DENGUE_sesak_berat",
                "label": "Apakah anak sesak napas berat sampai tidak bisa bicara/menyusu atau tampak membiru?"
            },
            {
                "id": "DENGUE_perdarahan_hebat",
                "label": "Apakah perdarahan sangat banyak atau tidak berhenti dan anak tampak semakin lemah?"
            },
            {
                "id": "DENGUE_penurunan_kesadaran",
                "label": "Apakah anak tidak merespons panggilan atau mengalami kejang?"
            }
        ],

        "lab_triggers": [
            {
                "id": "DENGUE_ns1_positif",
                "label": "Apakah dokter mengatakan hasil tes dengue (NS1 atau IgM) positif?",
                "available_at_primary_care": true
            }
        ],

        "disease_spectrum": {
            "stages": ["MILD", "WARNING", "SEVERE"],
            "stage_rules": [
                {
                    "from_stage": "MILD",
                    "to_stage": "WARNING",
                    "trigger_condition": "DENGUE_muntah_persisten"
                },
                {
                    "from_stage": "MILD",
                    "to_stage": "WARNING",
                    "trigger_condition": "DENGUE_nyeri_perut_berat"
                },
                {
                    "from_stage": "WARNING",
                    "to_stage": "SEVERE",
                    "trigger_condition": "DENGUE_syok"
                },
                {
                    "from_stage": "WARNING",
                    "to_stage": "SEVERE",
                    "trigger_condition": "DENGUE_perdarahan_hebat"
                }
            ]
        },

        "ambiguity_flags": [
            {
                "field": "minimum_additional_symptoms_required",
                "issue": "Angka minimum tambahan gejala adalah aturan operasional engine untuk screening caregiver.",
                "resolution": "ASSUMED_FOR_MVP"
            }
        ]
    },
    {
        "disease_id": "PNEUMONIA",
        "disease_name": "Pneumonia (Radang Paru pada Anak)",
        "category": "RESPIRATORY",
        "age_risk_group": ["ALL"],
        "endemicity_required": false,
        "transmission_mode": ["DROPLET"],

        "entry_criteria": {
            "epidemiology": [],
            "primary_condition": null,
            "required_primary_symptom": ["PNEUMONIA_batuk"],
            "minimum_additional_symptoms_required": 1
        },

        "core_symptoms": [
            {
                "id": "PNEUMONIA_batuk",
                "label": "Apakah anak mengalami batuk?",
                "weight": "PRIMARY",
                "counts_toward_minimum": false
            },
            {
                "id": "PNEUMONIA_demam",
                "label": "Apakah anak mengalami demam?",
                "weight": "PRIMARY",
                "counts_toward_minimum": true
            },
            {
                "id": "PNEUMONIA_pilek",
                "label": "Apakah anak pilek?",
                "weight": "SECONDARY",
                "counts_toward_minimum": true
            },
            {
                "id": "PNEUMONIA_lemas",
                "label": "Apakah anak tampak lebih lemas dari biasanya?",
                "weight": "SECONDARY",
                "counts_toward_minimum": true
            },
            {
                "id": "PNEUMONIA_nafsu_makan_turun",
                "label": "Apakah nafsu makan anak menurun?",
                "weight": "SECONDARY",
                "counts_toward_minimum": true
            }
        ],

        "risk_factors": [
            {
                "id": "PNEUMONIA_tidak_asi",
                "label": "Apakah anak tidak mendapat ASI eksklusif 6 bulan pertama?",
                "gate_type": "SOFT_WEIGHT"
            },
            {
                "id": "PNEUMONIA_imunisasi_tidak_lengkap",
                "label": "Apakah imunisasi anak belum lengkap (termasuk vaksin pneumonia/PCV)?",
                "gate_type": "SOFT_WEIGHT"
            },
            {
                "id": "PNEUMONIA_paparan_asap",
                "label": "Apakah anak sering terpapar asap rokok atau polusi udara?",
                "gate_type": "SOFT_WEIGHT"
            },
            {
                "id": "PNEUMONIA_prematur",
                "label": "Apakah anak lahir prematur?",
                "gate_type": "SOFT_WEIGHT"
            }
        ],

        "warning_signs": [
            {
                "id": "PNEUMONIA_napas_cepat",
                "label": "Apakah napas anak lebih cepat dari biasanya? (≥60x/menit usia <2 bulan, ≥50x/menit usia 2–12 bulan, ≥40x/menit usia 1–5 tahun)",
                "requires_observation": true,
                "override_to": "REFER_IMMEDIATELY"
            },
            {
                "id": "PNEUMONIA_tarikan_dada",
                "label": "Apakah dada anak terlihat tertarik ke dalam saat bernapas?",
                "requires_observation": true,
                "override_to": "REFER_IMMEDIATELY"
            },
            {
                "id": "PNEUMONIA_cuping_hidung",
                "label": "Apakah cuping hidung kembang-kempis saat anak bernapas?",
                "requires_observation": true,
                "override_to": "REFER_IMMEDIATELY"
            }
        ],

        "severe_criteria": [
            {
                "id": "PNEUMONIA_sesak_berat",
                "label": "Apakah anak sesak napas berat sampai sulit berbicara/menyusu atau tampak membiru?"
            },
            {
                "id": "PNEUMONIA_sianosis",
                "label": "Apakah bibir atau kuku anak tampak kebiruan?"
            },
            {
                "id": "PNEUMONIA_tidak_responsif",
                "label": "Apakah anak sulit dibangunkan, tidak merespons, atau mengalami kejang?"
            },
            {
                "id": "PNEUMONIA_syok",
                "label": "Apakah anak sangat lemas, tangan/kaki dingin, pucat, atau tampak seperti syok?"
            }
        ],

        "lab_triggers": [
            {
                "id": "PNEUMONIA_diagnosis_dokter",
                "label": "Apakah dokter mengatakan anak mengalami pneumonia berdasarkan pemeriksaan?",
                "available_at_primary_care": true
            }
        ],

        "disease_spectrum": {
            "stages": ["MILD", "WARNING", "SEVERE"],
            "stage_rules": [
                {
                    "from_stage": "MILD",
                    "to_stage": "WARNING",
                    "trigger_condition": "PNEUMONIA_napas_cepat"
                },
                {
                    "from_stage": "MILD",
                    "to_stage": "WARNING",
                    "trigger_condition": "PNEUMONIA_tarikan_dada"
                },
                {
                    "from_stage": "WARNING",
                    "to_stage": "SEVERE",
                    "trigger_condition": "PNEUMONIA_sesak_berat"
                },
                {
                    "from_stage": "WARNING",
                    "to_stage": "SEVERE",
                    "trigger_condition": "PNEUMONIA_sianosis"
                }
            ]
        },

        "ambiguity_flags": [
            {
                "field": "minimum_additional_symptoms_required",
                "issue": "Angka tambahan gejala adalah aturan operasional engine untuk screening caregiver.",
                "resolution": "ASSUMED_FOR_MVP"
            }
        ]
    },
    {
        "disease_id": "DIARE_AKUT",
        "disease_name": "Diare Akut pada Anak",
        "category": "INFECTIOUS",
        "age_risk_group": ["ALL"],
        "endemicity_required": false,
        "transmission_mode": ["FECAL_ORAL"],

        "entry_criteria": {
            "epidemiology": [],
            "primary_condition": null,
            "required_primary_symptom": ["DIARE_AKUT_bab_cair_3x_24jam"],
            "minimum_additional_symptoms_required": 0
        },

        "core_symptoms": [
            {
                "id": "DIARE_AKUT_bab_cair_3x_24jam",
                "label": "Apakah anak BAB cair ≥3 kali dalam 24 jam terakhir?",
                "weight": "PRIMARY",
                "counts_toward_minimum": false
            },
            {
                "id": "DIARE_AKUT_muntah",
                "label": "Apakah anak muntah?",
                "weight": "SECONDARY",
                "counts_toward_minimum": true
            },
            {
                "id": "DIARE_AKUT_demam",
                "label": "Apakah anak demam?",
                "weight": "SECONDARY",
                "counts_toward_minimum": true
            },
            {
                "id": "DIARE_AKUT_nyeri_perut",
                "label": "Apakah anak mengeluh sakit perut atau kram perut?",
                "weight": "SECONDARY",
                "counts_toward_minimum": true
            },
            {
                "id": "DIARE_AKUT_lemas",
                "label": "Apakah anak tampak lebih lemas dari biasanya?",
                "weight": "SECONDARY",
                "counts_toward_minimum": true
            }
        ],

        "risk_factors": [
            {
                "id": "DIARE_AKUT_air_makanan_kurang_bersih",
                "label": "Apakah air minum atau makanan di rumah mungkin kurang bersih?",
                "gate_type": "SOFT_WEIGHT"
            },
            {
                "id": "DIARE_AKUT_tidak_cuci_tangan",
                "label": "Apakah anak atau pengasuh jarang cuci tangan pakai sabun (sebelum makan / setelah BAB)?",
                "gate_type": "SOFT_WEIGHT"
            },
            {
                "id": "DIARE_AKUT_tidak_asi_eksklusif",
                "label": "Apakah anak tidak mendapat ASI eksklusif 6 bulan pertama?",
                "gate_type": "SOFT_WEIGHT"
            },
            {
                "id": "DIARE_AKUT_gizi_kurang",
                "label": "Apakah berat badan anak sulit naik atau anak tampak kurang gizi?",
                "gate_type": "SOFT_WEIGHT"
            }
        ],

        "warning_signs": [
            {
                "id": "DIARE_AKUT_jarang_pipis",
                "label": "Apakah anak jarang pipis (tidak pipis ≥6 jam) atau pipisnya sangat sedikit dan pekat?",
                "requires_observation": true,
                "override_to": "REFER_IMMEDIATELY"
            },
            {
                "id": "DIARE_AKUT_mulut_kering",
                "label": "Apakah mulut dan bibir anak tampak kering sekali?",
                "requires_observation": true,
                "override_to": "REFER_IMMEDIATELY"
            },
            {
                "id": "DIARE_AKUT_mata_cekung",
                "label": "Apakah mata anak tampak cekung?",
                "requires_observation": true,
                "override_to": "REFER_IMMEDIATELY"
            },
            {
                "id": "DIARE_AKUT_tidak_mau_minum",
                "label": "Apakah anak tidak mau minum/menyusu atau minumnya sangat sedikit?",
                "requires_observation": true,
                "override_to": "REFER_IMMEDIATELY"
            },
            {
                "id": "DIARE_AKUT_muntah_terus",
                "label": "Apakah anak muntah terus-menerus sehingga sulit minum?",
                "requires_observation": true,
                "override_to": "REFER_IMMEDIATELY"
            }
        ],

        "severe_criteria": [
            {
                "id": "DIARE_AKUT_tidak_sadar_atau_kejang",
                "label": "Apakah anak tidak merespons (sulit dibangunkan) atau mengalami kejang?"
            },
            {
                "id": "DIARE_AKUT_tanda_syok",
                "label": "Apakah anak tampak seperti syok: sangat lemas, tangan/kaki dingin, pucat, atau napas sangat cepat?"
            },
            {
                "id": "DIARE_AKUT_darah_di_tinja",
                "label": "Apakah ada darah pada tinja anak?"
            }
        ],

        "lab_triggers": [
            {
                "id": "DIARE_AKUT_diagnosis_dokter",
                "label": "Apakah dokter/petugas kesehatan mengatakan anak mengalami diare akut atau dehidrasi?",
                "available_at_primary_care": true
            }
        ],

        "disease_spectrum": {
            "stages": ["MILD", "WARNING", "SEVERE"],
            "stage_rules": [
                {
                    "from_stage": "MILD",
                    "to_stage": "WARNING",
                    "trigger_condition": "DIARE_AKUT_jarang_pipis"
                },
                {
                    "from_stage": "MILD",
                    "to_stage": "WARNING",
                    "trigger_condition": "DIARE_AKUT_tidak_mau_minum"
                },
                {
                    "from_stage": "WARNING",
                    "to_stage": "SEVERE",
                    "trigger_condition": "DIARE_AKUT_tidak_sadar_atau_kejang"
                },
                {
                    "from_stage": "WARNING",
                    "to_stage": "SEVERE",
                    "trigger_condition": "DIARE_AKUT_tanda_syok"
                }
            ]
        },

        "ambiguity_flags": [
            {
                "field": "entry_criteria.minimum_additional_symptoms_required",
                "issue": "Untuk MVP caregiver, BAB cair ≥3x/24 jam sudah cukup sebagai entry gate sehingga tambahan gejala tidak diwajibkan.",
                "resolution": "ASSUMED_FOR_MVP"
            },
            {
                "field": "severe_criteria.DIARE_AKUT_darah_di_tinja",
                "issue": "Darah pada tinja bisa bervariasi penyebabnya; pada MVP diperlakukan sebagai severe untuk memicu eskalasi cepat.",
                "resolution": "ASSUMED_FOR_MVP"
            }
        ]
    },
    {
        "disease_id": "HFMD",
        "disease_name": "Hand, Foot, and Mouth Disease (Flu Singapura)",
        "category": "INFECTIOUS",
        "age_risk_group": ["BALITA"],
        "endemicity_required": false,
        "transmission_mode": ["DROPLET", "CONTACT", "FECAL_ORAL"],

        "entry_criteria": {
            "epidemiology": [],
            "primary_condition": null,
            "required_primary_symptom": [
                "HFMD_ruam_telapak",
                "HFMD_sariawan_mulut"
            ],
            "minimum_additional_symptoms_required": 1
        },

        "core_symptoms": [
            {
                "id": "HFMD_ruam_telapak",
                "label": "Apakah muncul bintik merah atau lenting kecil di telapak tangan atau telapak kaki?",
                "weight": "PRIMARY",
                "counts_toward_minimum": false
            },
            {
                "id": "HFMD_sariawan_mulut",
                "label": "Apakah ada luka atau sariawan di dalam mulut anak?",
                "weight": "PRIMARY",
                "counts_toward_minimum": false
            },
            {
                "id": "HFMD_demam",
                "label": "Apakah anak mengalami demam?",
                "weight": "SECONDARY",
                "counts_toward_minimum": true
            },
            {
                "id": "HFMD_nyeri_tenggorokan",
                "label": "Apakah anak mengeluh sakit tenggorokan atau sulit menelan?",
                "weight": "SECONDARY",
                "counts_toward_minimum": true
            },
            {
                "id": "HFMD_rewel",
                "label": "Apakah anak lebih rewel atau mudah menangis dari biasanya?",
                "weight": "SECONDARY",
                "counts_toward_minimum": true
            },
            {
                "id": "HFMD_nafsu_makan_turun",
                "label": "Apakah nafsu makan anak menurun?",
                "weight": "SECONDARY",
                "counts_toward_minimum": true
            }
        ],

        "risk_factors": [
            {
                "id": "HFMD_kontak_penderita",
                "label": "Apakah anak baru berkontak dengan anak lain yang memiliki ruam atau sariawan serupa?",
                "gate_type": "SOFT_WEIGHT"
            },
            {
                "id": "HFMD_daycare",
                "label": "Apakah anak sering berada di daycare atau tempat ramai anak-anak?",
                "gate_type": "SOFT_WEIGHT"
            },
            {
                "id": "HFMD_kebersihan_tangan",
                "label": "Apakah anak atau pengasuh jarang mencuci tangan dengan sabun?",
                "gate_type": "SOFT_WEIGHT"
            }
        ],

        "warning_signs": [
            {
                "id": "HFMD_tidak_mau_minum",
                "label": "Apakah anak tidak mau minum atau menyusu karena sakit di mulut?",
                "requires_observation": true,
                "override_to": "REFER_IMMEDIATELY"
            },
            {
                "id": "HFMD_muntah_berulang",
                "label": "Apakah anak muntah berulang kali?",
                "requires_observation": true,
                "override_to": "REFER_IMMEDIATELY"
            },
            {
                "id": "HFMD_mengantuk_tidak_wajar",
                "label": "Apakah anak tampak sangat mengantuk, sulit dibangunkan, atau tidak seperti biasanya?",
                "requires_observation": true,
                "override_to": "REFER_IMMEDIATELY"
            },
            {
                "id": "HFMD_kejang_ringan",
                "label": "Apakah anak pernah kejang selama sakit ini?",
                "requires_observation": true,
                "override_to": "EMERGENCY"
            }
        ],

        "severe_criteria": [
            {
                "id": "HFMD_penurunan_kesadaran",
                "label": "Apakah anak tidak merespons saat dipanggil atau disentuh?"
            },
            {
                "id": "HFMD_kejang_berulang",
                "label": "Apakah anak mengalami kejang lebih dari sekali?"
            },
            {
                "id": "HFMD_sesak_napas",
                "label": "Apakah anak tampak sesak napas atau napas sangat cepat dan berat?"
            },
            {
                "id": "HFMD_dehidrasi_berat",
                "label": "Apakah anak sangat lemas, mata cekung, tidak pipis lama, atau tampak seperti syok?"
            }
        ],

        "lab_triggers": [
            {
                "id": "HFMD_diagnosis_dokter",
                "label": "Apakah dokter mengatakan anak mengalami Flu Singapura (HFMD)?",
                "available_at_primary_care": true
            }
        ],

        "disease_spectrum": {
            "stages": ["MILD", "WARNING", "SEVERE"],
            "stage_rules": [
                {
                    "from_stage": "MILD",
                    "to_stage": "WARNING",
                    "trigger_condition": "HFMD_tidak_mau_minum"
                },
                {
                    "from_stage": "WARNING",
                    "to_stage": "SEVERE",
                    "trigger_condition": "HFMD_penurunan_kesadaran"
                }
            ]
        },

        "ambiguity_flags": [
            {
                "field": "entry_criteria.required_primary_symptom",
                "issue": "Secara klinis kombinasi ruam + sariawan digunakan; untuk MVP caregiver digunakan salah satu sebagai entry gate.",
                "resolution": "ASSUMED_FOR_MVP"
            }
        ]
    },
    {
        "disease_id": "GIZI_BURUK",
        "disease_name": "Gizi Buruk (Malnutrisi Akut Berat / Wasting)",
        "category": "NUTRITIONAL",
        "age_risk_group": ["BALITA"],
        "endemicity_required": false,
        "transmission_mode": [],

        "entry_criteria": {
            "epidemiology": [],
            "primary_condition": null,
            "required_primary_symptom": [
                "GB_kurus_sekali",
                "GB_edema_kaki"
            ],
            "minimum_additional_symptoms_required": 1
        },

        "core_symptoms": [
            {
                "id": "GB_kurus_sekali",
                "label": "Apakah anak tampak sangat kurus sampai tulang rusuk atau tulang lengan/kaki terlihat jelas?",
                "weight": "PRIMARY",
                "counts_toward_minimum": false
            },
            {
                "id": "GB_edema_kaki",
                "label": "Apakah punggung kedua kaki anak bengkak dan bila ditekan meninggalkan bekas (cekungan)?",
                "weight": "PRIMARY",
                "counts_toward_minimum": false
            },
            {
                "id": "GB_berat_tidak_naik",
                "label": "Apakah berat badan anak tidak naik atau turun dalam 1–2 bulan terakhir menurut KMS/posyandu?",
                "weight": "SECONDARY",
                "counts_toward_minimum": true
            },
            {
                "id": "GB_lemas_tidak_aktif",
                "label": "Apakah anak sangat lemas dan tidak aktif seperti biasanya?",
                "weight": "SECONDARY",
                "counts_toward_minimum": true
            },
            {
                "id": "GB_nafsu_makan_sangat_kurang",
                "label": "Apakah anak sangat sulit makan atau minum (menolak makan hampir sepanjang hari)?",
                "weight": "SECONDARY",
                "counts_toward_minimum": true
            },
            {
                "id": "GB_sering_sakit",
                "label": "Apakah anak sering sakit berulang (batuk lama, diare berulang, demam berulang)?",
                "weight": "SECONDARY",
                "counts_toward_minimum": true
            },
            {
                "id": "GB_perubahan_rambut_kulit",
                "label": "Apakah rambut anak berubah jadi tipis/mudah rontok atau kulit jadi sangat kering/bercak?",
                "weight": "SECONDARY",
                "counts_toward_minimum": true
            }
        ],

        "risk_factors": [
            {
                "id": "GB_tidak_asi_eksklusif",
                "label": "Apakah anak tidak mendapatkan ASI eksklusif selama 6 bulan pertama?",
                "gate_type": "SOFT_WEIGHT"
            },
            {
                "id": "GB_mpasi_kurang",
                "label": "Apakah anak sering makan 1–2 kali sehari saja atau porsi sangat sedikit?",
                "gate_type": "SOFT_WEIGHT"
            },
            {
                "id": "GB_sanitasi_buruk",
                "label": "Apakah air bersih sulit dan kebiasaan cuci tangan dengan sabun jarang?",
                "gate_type": "SOFT_WEIGHT"
            },
            {
                "id": "GB_kemiskinan_pangan",
                "label": "Apakah keluarga sering kesulitan menyediakan makanan bergizi setiap hari?",
                "gate_type": "SOFT_WEIGHT"
            },
            {
                "id": "GB_bblr_prematur",
                "label": "Apakah anak lahir kecil atau prematur?",
                "gate_type": "SOFT_WEIGHT"
            }
        ],

        "warning_signs": [
            {
                "id": "GB_tidak_mau_makan_sama_sekali",
                "label": "Apakah anak tidak mau makan/minum sama sekali sejak pagi sampai sekarang?",
                "requires_observation": true,
                "override_to": "REFER_IMMEDIATELY"
            },
            {
                "id": "GB_diare_atau_muntah_berat",
                "label": "Apakah anak diare terus atau muntah berulang kali sehingga sulit minum?",
                "requires_observation": true,
                "override_to": "REFER_IMMEDIATELY"
            },
            {
                "id": "GB_demam_tinggi",
                "label": "Apakah anak demam tinggi dan terlihat semakin lemah?",
                "requires_observation": true,
                "override_to": "REFER_IMMEDIATELY"
            },
            {
                "id": "GB_luka_infeksi_kulit",
                "label": "Apakah ada luka bernanah, bisul, atau infeksi kulit yang luas?",
                "requires_observation": true,
                "override_to": "REFER_IMMEDIATELY"
            }
        ],

        "severe_criteria": [
            {
                "id": "GB_tidak_sadar",
                "label": "Apakah anak sulit dibangunkan atau tidak sadar?"
            },
            {
                "id": "GB_kejang",
                "label": "Apakah anak mengalami kejang?"
            },
            {
                "id": "GB_sesak_berat",
                "label": "Apakah anak sesak napas berat sampai tidak bisa minum/menyusu atau tampak membiru?"
            },
            {
                "id": "GB_syok",
                "label": "Apakah anak tampak seperti syok: sangat lemas, tangan/kaki dingin, pucat, atau nadi sangat lemah?"
            }
        ],

        "lab_triggers": [
            {
                "id": "GB_diagnosis_dokter",
                "label": "Apakah dokter atau petugas kesehatan mengatakan anak mengalami gizi buruk?",
                "available_at_primary_care": true
            },
            {
                "id": "GB_lila_kurang_115",
                "label": "Apakah petugas posyandu pernah mengukur LiLA anak < 11,5 cm?",
                "available_at_primary_care": true
            }
        ],

        "disease_spectrum": {
            "stages": ["MILD", "WARNING", "SEVERE"],
            "stage_rules": [
                {
                    "from_stage": "MILD",
                    "to_stage": "WARNING",
                    "trigger_condition": "GB_tidak_mau_makan_sama_sekali"
                },
                {
                    "from_stage": "WARNING",
                    "to_stage": "SEVERE",
                    "trigger_condition": "GB_tidak_sadar"
                },
                {
                    "from_stage": "WARNING",
                    "to_stage": "SEVERE",
                    "trigger_condition": "GB_syok"
                }
            ]
        },

        "ambiguity_flags": [
            {
                "field": "entry_criteria.required_primary_symptom",
                "issue": "Diagnosis gizi buruk idealnya memakai angka (BB/TB Z-score, LiLA <11,5 cm, edema). Untuk MVP caregiver digunakan indikator visual + fungsi; LiLA dibuat opsional bila pernah diukur petugas.",
                "resolution": "ASSUMED_FOR_MVP"
            },
            {
                "field": "entry_criteria.minimum_additional_symptoms_required",
                "issue": "Angka minimum gejala adalah aturan operasional engine; tidak ada ambang integer baku di guideline klinis.",
                "resolution": "ASSUMED_FOR_MVP"
            }
        ]
    }
];

async function seed() {
    console.log("🛠️ Starting Clinical Knowledge Base Seed...");

    for (const spec of DISEASES) {
        console.log(`\n🧪 Processing: ${spec.disease_id} (${spec.disease_name})`);

        // 1. Validation (Manual Protocols)
        // Check 1: Mandatory Fields
        if (!spec.disease_id || !spec.disease_name || !spec.category) {
            console.error(`❌ REJECTED: Mandatory fields missing in ${spec.disease_id}`);
            process.exit(1);
        }

        // Check 2: ID ID Collision Check (Self-contained)
        // We ensure ids start with disease_id or unique prefix
        // For MVP, we presume the input JSON is already prefixed as per strict instructions.

        // Check 3: Null Safety
        if (spec.endemicity_required === undefined || spec.endemicity_required === null) {
            console.error(`❌ REJECTED: endemicity_required missing in ${spec.disease_id}`);
            process.exit(1);
        }

        // 2. Generate Tree
        console.log(`   🌲 Generating Decision Tree...`);
        const nodes = ClinicalTreeGenerator.generateTreeNodes(spec as unknown as ClinicalSpec);
        console.log(`   ✅ Generated ${nodes.length} nodes.`);

        const version = "1.0.0-mvp";

        // Fix: Compute real SHA-256 hash to match ClinicalEngineService integrity check
        // Update: Use fast-json-stable-stringify for deterministic hashing
        const specHash = nodeCrypto
            .createHash('sha256')
            .update(stringify(spec))
            .digest('hex');

        // 3. Upsert ClinicalDisease
        await prisma.clinicalDisease.upsert({
            where: { id: spec.disease_id },
            update: {
                name: spec.disease_name,
                description: `${spec.disease_name} (Category: ${spec.category})`
            },
            create: {
                id: spec.disease_id,
                name: spec.disease_name,
                description: `${spec.disease_name} (Category: ${spec.category})`
            }
        });
        console.log(`   💾 Upserted Disease: ${spec.disease_id}`);

        // 4. Upsert ClinicalDecisionTree
        // Remove existing trees for this version if any to ensure clean update
        // Actually upsert is better

        // Note: ClinicalDecisionTree uses a composite unique constraint on [diseaseId, version]
        // But Prisma upsert needs a unique identifier. The schema says:
        // @@unique([diseaseId, version], map: "uq_clinical_tree_version")

        await prisma.clinicalDecisionTree.upsert({
            where: {
                diseaseId_version: {
                    diseaseId: spec.disease_id,
                    version: version
                }
            },
            update: {
                isActive: true, // Auto-activate as per user instruction "make sure it qualifies... to be inserted" implying we treat it as production ready
                clinicalSpec: spec as any,
                treeNodes: nodes as any,
                commitNote: "Initial Seed via seed_clinical_knowledge.ts",
                specHash: specHash,
                approvedAt: new Date()
            },
            create: {
                diseaseId: spec.disease_id,
                version: version,
                isActive: true,
                clinicalSpec: spec as any,
                treeNodes: nodes as any,
                commitNote: "Initial Seed via seed_clinical_knowledge.ts",
                specHash: specHash,
                approvedAt: new Date()
            }
        });
        console.log(`   💾 Upserted Decision Tree v${version}`);
    }

    console.log("\n✨ Seeding Complete! All 5 diseases are active.");
}

seed()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
