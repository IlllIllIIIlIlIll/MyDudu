import { HealthStatus } from '../components/StatusCard';

// Mock data for development - Replace with actual API calls

export const mockChildren = [
  {
    id: "child-001",
    name: "Aisyah Putri",
    age: "2 tahun 3 bulan",
    gender: "Perempuan"
  },
  {
    id: "child-002",
    name: "Budi Santoso",
    age: "3 tahun 8 bulan",
    gender: "Laki-laki"
  }
];

export const mockChildData = {
  "child-001": {
    id: "child-001",
    name: "Aisyah Putri",
    age: "2 tahun 3 bulan",
    gender: "Perempuan",
    lastScreening: "2026-01-18T10:30:00Z",
    overallStatus: "mild" as HealthStatus,
    statusCauses: [
      "Tinggi badan sedikit di bawah standar usia",
      "Kecepatan pertumbuhan melambat dalam 2 bulan terakhir"
    ],
    statusSymptoms: [
      "Anak terlihat lebih pendek dibanding teman seusia",
      "Nafsu makan berkurang",
      "Kurang aktif dalam bermain"
    ],
    latestMetrics: {
      weight: { value: 11.5, unit: "kg", status: "normal" as const, trend: "up" as const },
      height: { value: 82, unit: "cm", status: "warning" as const, trend: "down" as const },
      temperature: { value: 36.8, unit: "°C", status: "normal" as const, trend: "stable" as const },
      // oxygen: { value: 98, unit: "%", status: "normal" as const, trend: "stable" as const },
      // armCircumference: { value: 14.8, unit: "cm", status: "warning" as const, trend: "stable" as const },
      // headCircumference: { value: 47.5, unit: "cm", status: "normal" as const, trend: "up" as const }
    },
    nextPosyanduDate: "2026-01-25"
  },
  "child-002": {
    id: "child-002",
    name: "Budi Santoso",
    age: "3 tahun 8 bulan",
    gender: "Laki-laki",
    lastScreening: "2026-01-17T09:15:00Z",
    overallStatus: "no_pain" as HealthStatus,
    statusCauses: [],
    statusSymptoms: [],
    latestMetrics: {
      weight: { value: 15.2, unit: "kg", status: "normal" as const, trend: "up" as const },
      height: { value: 98, unit: "cm", status: "normal" as const, trend: "up" as const },
      temperature: { value: 36.5, unit: "°C", status: "normal" as const, trend: "stable" as const },
      // oxygen: { value: 99, unit: "%", status: "normal" as const, trend: "stable" as const },
      // armCircumference: { value: 16.2, unit: "cm", status: "normal" as const, trend: "up" as const },
      // headCircumference: { value: 50.1, unit: "cm", status: "normal" as const, trend: "up" as const }
    },
    nextPosyanduDate: "2026-01-26"
  }
};

export const mockWeightHistory = {
  "child-001": [
    { date: "Sep '25", value: 10.2 },
    { date: "Oct '25", value: 10.5 },
    { date: "Nov '25", value: 10.9 },
    { date: "Dec '25", value: 11.2 },
    { date: "Jan '26", value: 11.5 }
  ],
  "child-002": [
    { date: "Sep '25", value: 14.1 },
    { date: "Oct '25", value: 14.4 },
    { date: "Nov '25", value: 14.7 },
    { date: "Dec '25", value: 15.0 },
    { date: "Jan '26", value: 15.2 }
  ]
};

export const mockHeightHistory = {
  "child-001": [
    { date: "Sep '25", value: 79 },
    { date: "Oct '25", value: 80 },
    { date: "Nov '25", value: 81 },
    { date: "Dec '25", value: 82 },
    { date: "Jan '26", value: 82 }
  ],
  "child-002": [
    { date: "Sep '25", value: 93 },
    { date: "Oct '25", value: 94 },
    { date: "Nov '25", value: 96 },
    { date: "Dec '25", value: 97 },
    { date: "Jan '26", value: 98 }
  ]
};

export const mockTemperatureHistory = {
  "child-001": [
    { date: "Sep '25", value: 36.7 },
    { date: "Oct '25", value: 36.6 },
    { date: "Nov '25", value: 36.8 },
    { date: "Dec '25", value: 36.7 },
    { date: "Jan '26", value: 36.8 }
  ],
  "child-002": [
    { date: "Sep '25", value: 36.5 },
    { date: "Oct '25", value: 36.6 },
    { date: "Nov '25", value: 36.5 },
    { date: "Dec '25", value: 36.4 },
    { date: "Jan '26", value: 36.5 }
  ]
};

export const mockOxygenHistory = {
  "child-001": [
    { date: "Sep '25", value: 98 },
    { date: "Oct '25", value: 98 },
    { date: "Nov '25", value: 97 },
    { date: "Dec '25", value: 98 },
    { date: "Jan '26", value: 98 }
  ],
  "child-002": [
    { date: "Sep '25", value: 99 },
    { date: "Oct '25", value: 98 },
    { date: "Nov '25", value: 99 },
    { date: "Dec '25", value: 99 },
    { date: "Jan '26", value: 99 }
  ]
};

export const mockArmCircumferenceHistory = {
  "child-001": [
    { date: "Sep '25", value: 14.2 },
    { date: "Oct '25", value: 14.4 },
    { date: "Nov '25", value: 14.6 },
    { date: "Dec '25", value: 14.7 },
    { date: "Jan '26", value: 14.8 }
  ],
  "child-002": [
    { date: "Sep '25", value: 15.5 },
    { date: "Oct '25", value: 15.7 },
    { date: "Nov '25", value: 15.9 },
    { date: "Dec '25", value: 16.0 },
    { date: "Jan '26", value: 16.2 }
  ]
};

// export const mockHeadCircumferenceHistory = {
//   "child-001": [
//     { date: "Sep '25", value: 46.5 },
//     { date: "Oct '25", value: 46.8 },
//     { date: "Nov '25", value: 47.0 },
//     { date: "Dec '25", value: 47.2 },
//     { date: "Jan '26", value: 47.5 }
//   ],
//   "child-002": [
//     { date: "Sep '25", value: 49.2 },
//     { date: "Oct '25", value: 49.5 },
//     { date: "Nov '25", value: 49.7 },
//     { date: "Dec '25", value: 49.9 },
//     { date: "Jan '26", value: 50.1 }
//   ]
// };

export const mockConsultationHistory = {
  "child-001": [
    {
      id: "cons-001",
      place: "Posyandu Desa Sukamaju",
      date: "18 Jan 2026",
      time: "10:30",
      notes: "Anak dalam kondisi sehat. Tinggi badan sedikit di bawah rata-rata untuk usianya. Disarankan untuk meningkatkan asupan protein dan kalsium. Berikan telur, ikan, susu, dan sayuran hijau setiap hari. Pastikan anak cukup tidur 10-12 jam per hari.",
      status: "mild" as HealthStatus
    },
    {
      id: "cons-002",
      place: "Puskesmas Kecamatan",
      date: "15 Des 2025",
      time: "09:15",
      notes: "Pemeriksaan rutin bulanan. Semua parameter dalam batas normal. Pertumbuhan baik. Lanjutkan pola makan bergizi dan rutin ke Posyandu setiap bulan.",
      status: "no_pain" as HealthStatus
    },
    {
      id: "cons-003",
      place: "Posyandu Desa Sukamaju",
      date: "20 Nov 2025",
      time: "11:00",
      notes: "Anak sudah menerima imunisasi campak. Tidak ada reaksi alergi. Berat badan naik sesuai target. Terus berikan ASI dan makanan pendamping yang bervariasi.",
      status: "no_pain" as HealthStatus
    }
  ],
  "child-002": [
    {
      id: "cons-004",
      place: "Posyandu Desa Sukamaju",
      date: "17 Jan 2026",
      time: "09:15",
      notes: "Pemeriksaan kesehatan lengkap. Semua hasil normal. Anak aktif dan sehat. Pertumbuhan sangat baik sesuai kurva standar WHO. Pertahankan pola hidup sehat dan konsumsi makanan bergizi.",
      status: "no_pain" as HealthStatus
    },
    {
      id: "cons-005",
      place: "Posyandu Desa Sukamaju",
      date: "18 Des 2025",
      time: "10:00",
      notes: "Kontrol rutin. Berat dan tinggi badan ideal. Nafsu makan baik. Anak sangat aktif. Lanjutkan pemberian makanan 4 sehat 5 sempurna.",
      status: "no_pain" as HealthStatus
    }
  ]
};

export const mockEducationArticles = [
  {
    id: "edu-001",
    title: "Cara Cegah Stunting pada Anak",
    description: "Pelajari tanda-tanda stunting dan cara mencegahnya sejak dini dengan nutrisi yang tepat.",
    category: "Stunting",
    image: "https://images.unsplash.com/photo-1588710929895-6ee7a0a4d155?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwYmFieSUyMG51dHJpdGlvbnxlbnwxfHx8fDE3Njg3ODc1NzJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    link: ""
  },
  {
    id: "edu-002",
    title: "Makanan Bergizi untuk Balita",
    description: "Daftar makanan sehat dan bergizi yang baik untuk tumbuh kembang anak usia 1-5 tahun.",
    category: "Nutrisi",
    image: "https://images.unsplash.com/photo-1651718243509-742f5bd5836c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwdmVnZXRhYmxlcyUyMGZvb2R8ZW58MXx8fHwxNzY4Nzg3NTczfDA&ixlib=rb-4.1.0&q=80&w=1080",
    link: ""
  },
  {
    id: "edu-003",
    title: "Pentingnya Cuci Tangan untuk Anak",
    description: "Cara mengajarkan anak cuci tangan yang benar untuk mencegah penyakit.",
    category: "Sanitasi",
    image: "https://images.unsplash.com/photo-1580377968103-84cadc052dc7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlsZCUyMHdhc2hpbmclMjBoYW5kc3xlbnwxfHx8fDE3Njg3ODc1NzN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    link: ""
  },
  {
    id: "edu-004",
    title: "Jadwal Imunisasi Anak",
    description: "Panduan lengkap jadwal imunisasi wajib untuk bayi dan balita.",
    category: "Kesehatan",
    image: "https://images.unsplash.com/photo-1758691462164-100b5e356169?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3RoZXIlMjBjaGlsZCUyMGhlYWx0aGNhcmV8ZW58MXx8fHwxNzY4Nzg3NTczfDA&ixlib=rb-4.1.0&q=80&w=1080",
    link: ""
  }
];

export const mockNotifications: any[] = [];

// Simulated API calls - Replace with actual fetch to backend
// export async function fetchChildData(childId: string) {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       resolve(mockChildData[childId]);
//     }, 800);
//   });
// }

// export async function fetchGrowthHistory(childId: string) {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       resolve({
//         weight: mockWeightHistory[childId],
//         height: mockHeightHistory[childId],
//         temperature: mockTemperatureHistory[childId],
//         // oxygen: mockOxygenHistory[childId],
//         // armCircumference: mockArmCircumferenceHistory[childId],
//         // headCircumference: mockHeadCircumferenceHistory[childId]
//       });
//     }, 1000);
//   });
// }

// export async function fetchConsultationHistory(childId: string) {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       resolve(mockConsultationHistory[childId] || []);
//     }, 800);
//   });
// }

export async function fetchEducationArticles() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockEducationArticles);
    }, 600);
  });
}

export async function fetchNotifications(userId: string) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockNotifications);
    }, 500);
  });
}
