// Mock data for MyDudu Dashboard

export interface Child {
  id: string;
  name: string;
  age: number;
  gender: 'L' | 'P';
  village: string;
  posyandu: string;
  kecamatan: string;
  lastCheckup: string;
  weight: number;
  height: number;
  nutritionStatus: 'Normal' | 'Gizi Kurang' | 'Stunting' | 'Obesitas';
}

export const mockChildren: Child[] = [
  { id: 'A001', name: 'Aisyah Putri', age: 24, gender: 'P', village: 'Desa Sukamaju', posyandu: 'Posyandu Melati', kecamatan: 'Kecamatan Cianjur', lastCheckup: '2026-01-15', weight: 12.5, height: 85, nutritionStatus: 'Normal' },
  { id: 'A002', name: 'Budi Santoso', age: 30, gender: 'L', village: 'Desa Sukamaju', posyandu: 'Posyandu Melati', kecamatan: 'Kecamatan Cianjur', lastCheckup: '2026-01-14', weight: 10.2, height: 82, nutritionStatus: 'Stunting' },
  { id: 'A003', name: 'Citra Dewi', age: 18, gender: 'P', village: 'Desa Sukamaju', posyandu: 'Posyandu Melati', kecamatan: 'Kecamatan Cianjur', lastCheckup: '2026-01-12', weight: 11.8, height: 79, nutritionStatus: 'Normal' },
  { id: 'A004', name: 'Deni Kurniawan', age: 36, gender: 'L', village: 'Desa Sukamaju', posyandu: 'Posyandu Kenanga', kecamatan: 'Kecamatan Cianjur', lastCheckup: '2026-01-10', weight: 11.5, height: 88, nutritionStatus: 'Gizi Kurang' },
  { id: 'A005', name: 'Eka Pratama', age: 28, gender: 'L', village: 'Desa Makmur', posyandu: 'Posyandu Mawar', kecamatan: 'Kecamatan Cianjur', lastCheckup: '2026-01-16', weight: 13.2, height: 90, nutritionStatus: 'Normal' },
  { id: 'A006', name: 'Fitri Handayani', age: 22, gender: 'P', village: 'Desa Makmur', posyandu: 'Posyandu Mawar', kecamatan: 'Kecamatan Cianjur', lastCheckup: '2026-01-13', weight: 10.8, height: 83, nutritionStatus: 'Normal' },
  { id: 'A007', name: 'Galuh Permata', age: 20, gender: 'P', village: 'Desa Makmur', posyandu: 'Posyandu Mawar', kecamatan: 'Kecamatan Cianjur', lastCheckup: '2026-01-11', weight: 9.5, height: 77, nutritionStatus: 'Gizi Kurang' },
  { id: 'A008', name: 'Hana Permata', age: 26, gender: 'P', village: 'Desa Sejahtera', posyandu: 'Posyandu Anggrek', kecamatan: 'Kecamatan Cianjur', lastCheckup: '2026-01-09', weight: 9.8, height: 79, nutritionStatus: 'Stunting' },
  { id: 'A009', name: 'Indra Gunawan', age: 32, gender: 'L', village: 'Desa Sejahtera', posyandu: 'Posyandu Anggrek', kecamatan: 'Kecamatan Cianjur', lastCheckup: '2026-01-17', weight: 14.2, height: 92, nutritionStatus: 'Normal' },
  { id: 'A010', name: 'Joko Susanto', age: 34, gender: 'L', village: 'Desa Sejahtera', posyandu: 'Posyandu Anggrek', kecamatan: 'Kecamatan Cianjur', lastCheckup: '2026-01-08', weight: 15.5, height: 95, nutritionStatus: 'Obesitas' }
];

export interface Device {
  id: string;
  name: string;
  status: 'Online' | 'Offline' | 'Maintenance';
  battery: number;
  lastSync: string;
  location: string;
  posyandu: string;
  kecamatan: string;
}

export const mockDevices: Device[] = [
  { id: 'D001', name: 'Alat Dudu 1', status: 'Online', battery: 85, lastSync: '2026-01-19 09:30', location: 'Desa Sukamaju', posyandu: 'Posyandu Melati', kecamatan: 'Kecamatan Cianjur' },
  { id: 'D002', name: 'Alat Dudu 2', status: 'Online', battery: 92, lastSync: '2026-01-19 09:25', location: 'Desa Sukamaju', posyandu: 'Posyandu Kenanga', kecamatan: 'Kecamatan Cianjur' },
  { id: 'D003', name: 'Alat Dudu 3', status: 'Online', battery: 78, lastSync: '2026-01-19 09:15', location: 'Desa Makmur', posyandu: 'Posyandu Mawar', kecamatan: 'Kecamatan Cianjur' },
  { id: 'D004', name: 'Alat Dudu 4', status: 'Offline', battery: 45, lastSync: '2026-01-18 16:20', location: 'Desa Sejahtera', posyandu: 'Posyandu Anggrek', kecamatan: 'Kecamatan Cianjur' },
  { id: 'D005', name: 'Alat Dudu 5', status: 'Online', battery: 15, lastSync: '2026-01-19 09:00', location: 'Desa Sukamaju', posyandu: 'Posyandu Melati', kecamatan: 'Kecamatan Cianjur' }
];

export interface Stats {
  childrenMeasuredToday: number;
  devicesOnline: number;
  pendingReviews: number;
  reportsGenerated: number;
}

export const mockStats: Stats = {
  childrenMeasuredToday: 8,
  devicesOnline: 7,
  pendingReviews: 3,
  reportsGenerated: 12
};

export interface MonthlyTrend {
  month: string;
  normal: number;
  stunting: number;
  undernourished: number;
}

export const monthlyTrends: MonthlyTrend[] = [
  { month: 'Jul', normal: 45, stunting: 8, undernourished: 5 },
  { month: 'Agu', normal: 48, stunting: 7, undernourished: 4 },
  { month: 'Sep', normal: 50, stunting: 6, undernourished: 4 },
  { month: 'Okt', normal: 52, stunting: 5, undernourished: 3 },
  { month: 'Nov', normal: 54, stunting: 4, undernourished: 3 },
  { month: 'Des', normal: 55, stunting: 3, undernourished: 2 },
  { month: 'Jan', normal: 58, stunting: 2, undernourished: 2 }
];

export interface CaseData {
  name: string;
  value: number;
  color: string;
}

export const caseDistribution: CaseData[] = [
  { name: 'Normal', value: 58, color: '#10B981' },
  { name: 'Stunting', value: 2, color: '#EF4444' },
  { name: 'Gizi Kurang', value: 2, color: '#F59E0B' },
  { name: 'Obesitas', value: 1, color: '#8B5CF6' }
];

export interface VillageData {
  village: string;
  children: number;
}

export const villageData: VillageData[] = [
  { village: 'Desa Sukamaju', children: 42 },
  { village: 'Desa Makmur', children: 38 },
  { village: 'Desa Sejahtera', children: 35 },
  { village: 'Desa Cendana', children: 28 }
];

export interface Validation {
  id: string;
  childId: string;
  childName: string;
  age: number;
  village: string;
  posyandu: string;
  kecamatan: string;
  measurementDate: string;
  weight: number;
  height: number;
  headCircumference: number;
  temperature: number;
  flagReason: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  doctorAssigned?: string;
}

export const mockValidations: Validation[] = [
  {
    id: 'V001',
    childId: 'A002',
    childName: 'Budi Santoso',
    age: 30,
    village: 'Desa Sukamaju',
    posyandu: 'Posyandu Melati',
    kecamatan: 'Kecamatan Cianjur',
    measurementDate: '2026-01-14',
    weight: 10.2,
    height: 82,
    headCircumference: 45.5,
    temperature: 36.8,
    flagReason: 'Possible stunting detected (height below -2 SD)',
    status: 'pending',
    doctorAssigned: 'Dr. Sarah Pratiwi'
  },
  {
    id: 'V002',
    childId: 'A008',
    childName: 'Hana Permata',
    age: 26,
    village: 'Desa Sejahtera',
    posyandu: 'Posyandu Anggrek',
    kecamatan: 'Kecamatan Cianjur',
    measurementDate: '2026-01-09',
    weight: 9.8,
    height: 79,
    headCircumference: 44.2,
    temperature: 36.5,
    flagReason: 'Weight below expected range',
    status: 'pending'
  },
  {
    id: 'V003',
    childId: 'A010',
    childName: 'Joko Susanto',
    age: 34,
    village: 'Desa Sejahtera',
    posyandu: 'Posyandu Anggrek',
    kecamatan: 'Kecamatan Cianjur',
    measurementDate: '2026-01-08',
    weight: 15.5,
    height: 95,
    headCircumference: 49.8,
    temperature: 37.2,
    flagReason: 'Weight above expected range (possible obesity)',
    status: 'pending'
  }
];

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  category: string;
  user: string;
  action: string;
  details: string;
}

export const mockSystemLogs: SystemLog[] = [
  {
    id: 'L001',
    timestamp: '2026-01-19 10:15:23',
    level: 'success',
    category: 'Authentication',
    user: 'ahmad.fauzi@mydudu.id',
    action: 'User Login',
    details: 'Successful login from IP 192.168.1.45'
  },
  {
    id: 'L002',
    timestamp: '2026-01-19 09:42:11',
    level: 'info',
    category: 'Data Sync',
    user: 'System',
    action: 'Device Sync',
    details: 'Device D001 synchronized 5 new measurements'
  },
  {
    id: 'L003',
    timestamp: '2026-01-19 09:30:05',
    level: 'warning',
    category: 'Device',
    user: 'System',
    action: 'Low Battery Alert',
    details: 'Device D005 battery at 15%'
  },
  {
    id: 'L004',
    timestamp: '2026-01-19 08:55:32',
    level: 'success',
    category: 'User Management',
    user: 'admin@mydudu.id',
    action: 'User Created',
    details: 'New user account created: rina.kusuma@mydudu.id'
  },
  {
    id: 'L005',
    timestamp: '2026-01-18 16:20:18',
    level: 'error',
    category: 'Device',
    user: 'System',
    action: 'Connection Lost',
    details: 'Device D004 went offline - last sync failed'
  }
];

export interface Incident {
  id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  category: string;
  reportedBy: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  location: string;
}

export const mockIncidents: Incident[] = [
  {
    id: 'INC001',
    title: 'Device D004 Offline for 18 Hours',
    description: 'Device at Posyandu Anggrek has been offline since yesterday evening. Unable to sync measurements.',
    priority: 'High',
    status: 'In Progress',
    category: 'Device Connectivity',
    reportedBy: 'sari.wijaya@mydudu.id',
    assignedTo: 'admin@mydudu.id',
    createdAt: '2026-01-18 16:30',
    updatedAt: '2026-01-19 08:00',
    location: 'Posyandu Anggrek, Desa Sejahtera'
  },
  {
    id: 'INC002',
    title: 'Low Battery Warning - Multiple Devices',
    description: 'Three devices (D005, D007, D009) showing battery levels below 20%',
    priority: 'Medium',
    status: 'Open',
    category: 'Device Maintenance',
    reportedBy: 'System',
    assignedTo: 'ahmad.fauzi@mydudu.id',
    createdAt: '2026-01-19 09:00',
    updatedAt: '2026-01-19 09:00',
    location: 'Multiple Locations'
  },
  {
    id: 'INC003',
    title: 'Delayed Doctor Validation',
    description: 'Three pending validations have been waiting for more than 48 hours',
    priority: 'Medium',
    status: 'Open',
    category: 'Process',
    reportedBy: 'System',
    assignedTo: 'ahmad.fauzi@mydudu.id',
    createdAt: '2026-01-19 07:30',
    updatedAt: '2026-01-19 07:30',
    location: 'Puskesmas Cianjur'
  }
];
