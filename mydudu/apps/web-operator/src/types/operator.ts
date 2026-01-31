export type NutritionCategory = 'NORMAL' | 'STUNTED' | 'WASTED' | 'OBESE';

export interface OperatorSessionSummary {
  id: number;
  recordedAt: string | null;
  status: string;
  weight: number | null;
  height: number | null;
  temperature: number | null;
  nutritionCategory: NutritionCategory | null;
  child: {
    id: number;
    fullName: string;
    birthDate: string;
    gender: string | null;
    parentName: string | null;
  } | null;
  device: {
    id: number;
    name: string;
    deviceUuid: string;
    posyanduName: string | null;
    villageName: string | null;
    districtName: string | null;
  } | null;
}

export interface OperatorDashboardOverview {
  counts: {
    uniqueChildren: number;
    sessionsToday: number;
    devicesTotal: number;
    devicesActive: number;
    pendingValidations: number;
    reportsThisMonth: number;
  };
  recentSessions: OperatorSessionSummary[];
  upcomingSchedules: {
    id: number;
    title: string;
    description: string | null;
    eventDate: string;
    startTime: string | null;
    endTime: string | null;
    posyanduName: string | null;
    villageName: string | null;
    districtName: string | null;
  }[];
  posyanduSummary: {
    posyanduId: number;
    posyanduName: string;
    villageName: string | null;
    districtName: string | null;
    childrenCount: number;
    devicesCount: number;
    activeDevicesCount: number;
    nutrition: {
      NORMAL: number;
      STUNTED: number;
      WASTED: number;
      OBESE: number;
    };
  }[];
}

export interface OperatorChildRecord {
  id: number;
  fullName: string;
  birthDate: string;
  gender: string | null;
  bloodType: string | null;
  parentName: string | null;
  lastSession: {
    id: number;
    recordedAt: string | null;
    status: string;
    weight: number | null;
    height: number | null;
    temperature: number | null;
    nutritionCategory: NutritionCategory | null;
    deviceName: string | null;
    deviceUuid: string | null;
    posyanduName: string | null;
    villageName: string | null;
    districtName: string | null;
  } | null;
}

export interface OperatorDeviceRecord {
  id: number;
  deviceUuid: string;
  name: string;
  status: 'AVAILABLE' | 'WAITING' | 'INACTIVE';
  fullName: string;
  phoneNumber: string | null;
  villageName: string | null;
  districtName: string | null;
  childrenCount: number;
}

export interface OperatorValidationRecord {
  sessionId: number;
  status: 'pending' | 'approved' | 'rejected';
  recordedAt: string | null;
  childId: number | null;
  childName: string | null;
  birthDate: string | null;
  gender: string | null;
  weight: number | null;
  height: number | null;
  temperature: number | null;
  nutritionCategory: NutritionCategory | null;
  posyanduName: string | null;
  villageName: string | null;
  districtName: string | null;
  validatorName: string | null;
  remarks: string | null;
}

export interface OperatorReportSummary {
  totalReports: number;
  reportsThisMonth: number;
  uniqueChildren: number;
  latestReportAt: string | null;
}

export interface OperatorReportRecord {
  id: number;
  sessionId: number;
  fileUrl: string;
  generatedAt: string | null;
  childName: string | null;
  posyanduName: string | null;
  villageName: string | null;
  districtName: string | null;
}


export interface OperatorParentRecord {
  id: number;
  fullName: string;
  phoneNumber: string | null;
  villageName: string | null;
  childrenCount: number;
}

export interface OperatorReportsResponse {
  summary: OperatorReportSummary;
  reports: OperatorReportRecord[];
}
