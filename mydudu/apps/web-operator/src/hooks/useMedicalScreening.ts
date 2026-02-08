import { useState, useCallback, useRef } from 'react';
import { InferenceEngine } from '../lib/medical/InferenceEngine';
import { RED_FLAGS } from '../lib/medical/knowledgeBase';
import { ScreeningResult, Answer, Symptom } from '../lib/medical/types';

export type ScreeningFlowState = 'MEASUREMENTS' | 'RED_FLAGS' | 'QUIZ' | 'RESULT';

export function useMedicalScreening() {
    // Engine Instance (ref to persist across renders)
    const engineRef = useRef<InferenceEngine>(new InferenceEngine());

    // UI States
    const [step, setStep] = useState<ScreeningFlowState>('MEASUREMENTS');
    const [currentQuestion, setCurrentQuestion] = useState<Symptom | null>(null);
    const [currentResult, setCurrentResult] = useState<ScreeningResult | null>(null);
    const [progress, setProgress] = useState(0);

    // Red Flag State
    const [redFlagIndex, setRedFlagIndex] = useState(0);

    const startScreening = useCallback(() => {
        setStep('RED_FLAGS');
        setRedFlagIndex(0);
    }, []);

    const submitRedFlagAnswer = useCallback((answer: boolean) => {
        if (answer === true) {
            // EMERGENCY ABORT
            const flag = RED_FLAGS[redFlagIndex];
            setStep('RESULT');
            setCurrentResult({
                timestamp: new Date().toISOString(),
                status: 'emergency',
                emergencyReason: flag.question + ' (YA). ' + flag.reason,
                explanation: ['Terdeteksi Tanda Bahaya (Red Flag).'],
                answers: {}
            });
            return;
        }

        // Next Red Flag
        if (redFlagIndex < RED_FLAGS.length - 1) {
            setRedFlagIndex(prev => prev + 1);
        } else {
            // All Red Flags Cleared -> Start Bayes
            engineRef.current = new InferenceEngine(); // Reset engine
            const firstQ = engineRef.current.getNextQuestion();
            setCurrentQuestion(firstQ);
            setStep('QUIZ');
            setProgress(0);
        }
    }, [redFlagIndex]);

    const submitQuizAnswer = useCallback((value: Answer) => {
        if (!currentQuestion) return;

        const engine = engineRef.current;
        const state = engine.assess({ symptomId: currentQuestion.id, value });

        if (state.status !== 'active') {
            // Done
            const topId = engine.getTopDisease(state.probabilities);
            const explanation = engine.getExplanation(topId, state.answers);

            setStep('RESULT');
            setCurrentResult({
                timestamp: new Date().toISOString(),
                status: state.status as ScreeningResult['status'],
                topDisease: {
                    id: topId,
                    name: 'Unknown', // Need to fetch name from KB
                    probability: state.probabilities[topId]
                },
                explanation,
                answers: state.answers
            });
        } else {
            // Next Question
            const nextQ = engine.getNextQuestion();
            setCurrentQuestion(nextQ);
            setProgress(prev => prev + 1); // Simplistic progress
        }
    }, [currentQuestion]);

    const resetScreening = useCallback(() => {
        setStep('MEASUREMENTS');
        setCurrentResult(null);
        setCurrentQuestion(null);
        setRedFlagIndex(0);
    }, []);

    return {
        step,
        // Red Flag Props
        currentRedFlag: step === 'RED_FLAGS' ? RED_FLAGS[redFlagIndex] : null,
        submitRedFlagAnswer,
        totalRedFlags: RED_FLAGS.length,
        currentRedFlagIndex: redFlagIndex,

        // Quiz Props
        currentQuestion,
        submitQuizAnswer,
        progress,

        // Result
        currentResult,

        // Actions
        startScreening,
        resetScreening
    };
}
