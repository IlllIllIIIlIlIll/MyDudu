export type Answer = 'yes' | 'no' | 'dont_know';

export interface Symptom {
    id: string;
    question: string;
    medicalTerm?: string; // For tooltip/explanation
    likelihoods: Record<string, { yes: number; no: number }>; // P(S|D)
}

export interface Disease {
    id: string;
    name: string;
    description: string;
    prior: number; // Base prevalence P(D)
    urgent: boolean; // If true, requires more immediate attention in UI
}

export interface RedFlag {
    id: string;
    question: string;
    reason: string;
}

export interface InferenceState {
    answers: Record<string, Answer>; // symptomId -> Answer
    probabilities: Record<string, number>; // diseaseId -> P(D|S)
    entropy: number;
    eligibleDiseases: string[]; // List of disease IDs still possible
    history: string[]; // Sequence of questions asked
    status: 'active' | 'success' | 'inconclusive' | 'emergency';
    emergencyReason?: string;
}

export interface ScreeningResult {
    timestamp: string;
    status: 'success' | 'inconclusive' | 'emergency';
    topDisease?: {
        id: string;
        name: string;
        probability: number;
    };
    emergencyReason?: string;
    explanation: string[]; // Bullet points "Why"
    answers: Record<string, Answer>; // For record keeping
}
