import { fetchWithAuth } from './api';

export interface ClinicalNode {
    id: string;
    question: string;
    layman: string;
    yesNodeId: string | null;
    noNodeId: string | null;
    diseaseId?: string;
}

export interface ClinicalSessionResponse {
    sessionId: string;
    treeVersion?: string;
    initialNodes: ClinicalNode[];
    alreadyComplete?: boolean;
    examOutcome?: string | null;
}

export interface ClinicalAnswerResponse {
    // Next question to ask (multi-disease: may switch disease mid-quiz)
    nextNode?: {
        nodeId: string;
        question: string;
        layman?: string;
        diseaseId: string;
    };
    // Final outcome when session is complete
    outcome?: 'DIAGNOSED' | 'PENDING' | 'REFER_IMMEDIATELY' | 'EMERGENCY' | 'CANCELED' | 'EXCLUDED';
    diseaseId?: string;
    message?: string;
}

export interface ClinicalStatusResponse {
    sessionId: string;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'CLINICALLY_SUFFICIENT';
    examOutcome?: 'DIAGNOSED' | 'PENDING' | 'REFER_IMMEDIATELY' | 'EMERGENCY' | 'CANCELED' | 'EXCLUDED';
    diseaseId?: string;
    answers: Record<string, boolean>;
}

export const clinicalApi = {
    /**
     * Start a new clinical session
     */
    async startSession(sessionUuid: string, deviceUuid?: string): Promise<ClinicalSessionResponse> {
        return fetchWithAuth('/clinical/start', {
            method: 'POST',
            body: JSON.stringify({ sessionUuid, deviceUuid })
        });
    },

    /**
     * Submit an answer to a clinical question
     */
    async submitAnswer(sessionId: string, nodeId: string, answer: boolean): Promise<ClinicalAnswerResponse> {
        return fetchWithAuth('/clinical/answer', {
            method: 'POST',
            body: JSON.stringify({ sessionId, nodeId, answer })
        });
    },

    /**
     * Get session status
     */
    async getStatus(sessionId: string): Promise<ClinicalStatusResponse> {
        return fetchWithAuth(`/clinical/status/${sessionId}`, {
            method: 'GET'
        });
    }
};
