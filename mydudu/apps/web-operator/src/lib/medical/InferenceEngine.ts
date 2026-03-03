import { Answer, InferenceState, Symptom } from './types';
import { DISEASES, SYMPTOMS } from './knowledgeBase';

const PROBABILITY_THRESHOLD = 0.80; // 80% confidence
const MAX_QUESTIONS = 12;

export class InferenceEngine {
    private state: InferenceState;

    constructor() {
        this.state = this.getInitialState();
    }

    public getInitialState(): InferenceState {
        // Initialize priors
        const probabilities: Record<string, number> = {};
        let totalPrior = 0;

        Object.values(DISEASES).forEach(d => {
            probabilities[d.id] = d.prior;
            totalPrior += d.prior;
        });

        // Normalize priors relative to specific disease set (closed world assumption for the screening context)
        // Or keep absolute priors. For screening, relative is safer to highlight dominant signal.
        // Let's keep a "Noise" factor implicitly or just normalize.
        const normalizationFactor = 1 / totalPrior;
        Object.keys(probabilities).forEach(id => {
            probabilities[id] = probabilities[id] * normalizationFactor;
        });

        return {
            answers: {},
            probabilities,
            entropy: this.calculateEntropy(probabilities),
            eligibleDiseases: Object.keys(DISEASES),
            history: [],
            status: 'active'
        };
    }

    public assess(currentAnswer: { symptomId: string; value: Answer }): InferenceState {
        // Copy state
        const newState: InferenceState = {
            ...this.state,
            answers: { ...this.state.answers, [currentAnswer.symptomId]: currentAnswer.value },
            history: [...this.state.history, currentAnswer.symptomId]
        };

        // Update Probabilities (Bayes Rule)
        // P(D|S) = P(S|D) * P(D) / P(S)
        let totalPosterior = 0;
        const newProbabilities: Record<string, number> = {};

        Object.keys(newState.probabilities).forEach(diseaseId => {
            const disease = DISEASES[diseaseId];
            const prior = newState.probabilities[diseaseId];
            const symptom = SYMPTOMS.find(s => s.id === currentAnswer.symptomId);

            if (!symptom) return; // Should not happen in logic

            let likelihood = 0.5; // Default if no data (don't know)

            if (currentAnswer.value === 'yes') {
                likelihood = symptom.likelihoods[diseaseId]?.yes ?? 0.5;
            } else if (currentAnswer.value === 'no') {
                likelihood = symptom.likelihoods[diseaseId]?.no ?? 0.5;
            } else {
                // Dont know: no information gain, probability stays same (effectively likelihood 1.0 or ignored)
                // Actually if dont know, we assume it doesn't change relative probs
                likelihood = 1.0;
            }

            const unnormalizedPosterior = likelihood * prior;
            newProbabilities[diseaseId] = unnormalizedPosterior;
            totalPosterior += unnormalizedPosterior;
        });

        // Normalize
        if (totalPosterior > 0) {
            Object.keys(newProbabilities).forEach(id => {
                newProbabilities[id] = newProbabilities[id] / totalPosterior;
            });
        }

        newState.probabilities = newProbabilities;
        newState.entropy = this.calculateEntropy(newProbabilities);

        // Check Termination
        const topDiseaseId = this.getTopDisease(newState.probabilities);
        const topProb = newState.probabilities[topDiseaseId] || 0;

        if (topProb >= PROBABILITY_THRESHOLD) {
            newState.status = 'success';
        } else if (newState.history.length >= MAX_QUESTIONS) {
            newState.status = 'inconclusive';
        } else if (newState.entropy < 0.3) { // High certainty but split?
            // If entropy is low, it means we are certain about something.
            // If we are here and not success, maybe we have 2 diseases with 0.49/0.49?
            // Let's rely on Max Questions for now to avoid premature loop exit.
        }

        // Update internal state
        this.state = newState;
        return newState;
    }

    public getNextQuestion(): Symptom | null {
        if (this.state.status !== 'active') return null;

        const answeredIds = Object.keys(this.state.answers);
        const candidateSymptoms = SYMPTOMS.filter(s => !answeredIds.includes(s.id));

        if (candidateSymptoms.length === 0) return null;

        // Select best question based on Information Gain (simplistic: highest variance in likelihoods weighted by current probs)
        // We want a symptom that discriminates the remaining high-prob diseases.

        let bestSymptom = candidateSymptoms[0];
        let maxScore = -1;

        candidateSymptoms.forEach(symptom => {
            // Score = Variance of P(S=Yes|D) across diseases, weighted by P(D)
            // Just sum of abs diffs? 
            // Better: Expected Entropy Reduction.
            // Lets use a simpler heuristic: Maximize difference between top 2 diseases?
            // Or just sum(|L(yes|D) - 0.5| * P(D)) -> Find symptoms that are strong signals for current probable diseases.

            let score = 0;
            Object.keys(this.state.probabilities).forEach(dId => {
                const pD = this.state.probabilities[dId];
                const pS_D = symptom.likelihoods[dId]?.yes ?? 0.5;
                // We want questions where L is close to 0 or 1 for high pD. 
                // |0.5 - pS_D| gives "strongness" of signal.
                score += Math.abs(0.5 - pS_D) * pD;
            });

            if (score > maxScore) {
                maxScore = score;
                bestSymptom = symptom;
            }
        });

        return bestSymptom;
    }

    public getTopDisease(probabilities: Record<string, number>): string {
        return Object.keys(probabilities).reduce((a, b) => probabilities[a] > probabilities[b] ? a : b);
    }

    public getExplanation(diseaseId: string, answers: Record<string, Answer>): string[] {
        const disease = DISEASES[diseaseId];
        const explanations: string[] = [];

        explanations.push(`Gejala yang mendukung indikasi ${disease.name}:`);

        Object.entries(answers).forEach(([sId, val]) => {
            if (val === 'yes') {
                const symptom = SYMPTOMS.find(s => s.id === sId);
                const likelihood = symptom?.likelihoods[diseaseId]?.yes ?? 0.5;
                if (likelihood > 0.6) {
                    explanations.push(`- ${symptom?.question.replace('Apakah anak ', '')} (Positif)`);
                }
            } else if (val === 'no') {
                const symptom = SYMPTOMS.find(s => s.id === sId);
                const likelihood = symptom?.likelihoods[diseaseId]?.no ?? 0.5;
                if (likelihood > 0.6) {
                    explanations.push(`- Tidak ${symptom?.question.replace('Apakah anak ', '').toLowerCase()} (Sesuai pola)`);
                }
            }
        });

        return explanations;
    }

    private calculateEntropy(probs: Record<string, number>): number {
        let entropy = 0;
        Object.values(probs).forEach(p => {
            if (p > 0) {
                entropy -= p * Math.log2(p);
            }
        });
        return entropy;
    }
}
