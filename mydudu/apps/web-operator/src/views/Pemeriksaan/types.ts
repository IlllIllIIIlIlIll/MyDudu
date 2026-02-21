export type Severity = 'Merah' | 'Kuning' | 'Hijau';

export interface DiagnosisResult {
    title: string;
    description: string;
    severity: Severity;
    instructions: string[];
}

export interface DecisionNode {
    id: string;
    question: string;
    layman: string;
    imageYes: string;
    imageNo: string;
    yesNodeId?: string;
    noNodeId?: string;
    finalDiagnosis?: DiagnosisResult;
}

export interface Patient {
    id: string;
    name: string;
    age: string;
    ageMonths: number;
    gender: 'M' | 'F';
    parentName: string;
    avatar: string;
    lastVisit?: { weight: number; height: number; date: string };
}

export interface QueueSession {
    sessionId: number;
    sessionUuid: string;
    version: number;
    recordedAt: string;
    weight: number | null;
    height: number | null;
    temperature: number | null;
    heartRate: number | null;
    noiseLevel?: number | null;
    child: {
        id: number;
        childUuid: string;
        fullName: string;
        birthDate: string;
        gender: 'M' | 'F' | null;
        parentName: string | null;
    };
    lock?: {
        lockedByOperatorId?: number | null;
        ttlSecondsRemaining: number;
        lockExpired?: boolean;
    };
    claimable?: boolean;
    isStale?: boolean;
    lockToken?: string;
    growthAnalysis?: Record<string, {
        zScore: number;
        percentile: number;
        lms: { l: number; m: number; s: number };
        indicator: string;
        status: string;
        deviation: number;
        ideal: number;
        color: string;
    }> | null;
}

export interface QuizStepHistory {
    stepOrder: number;
    nodeId: string;
    question: string;
    answer: 'Ya' | 'Tidak';
    answerYes: boolean;
    nextNodeId?: string;
}
