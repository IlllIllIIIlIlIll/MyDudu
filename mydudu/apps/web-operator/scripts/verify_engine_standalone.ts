
// STANDALONE VERIFICATION SCRIPT (No Imports)

// --- MOCK TYPES & INTEFACES ---
type Answer = 'yes' | 'no' | 'dont_know';

interface Symptom {
    id: string;
    question: string;
    medicalTerm?: string;
    likelihoods: Record<string, { yes: number; no: number }>;
}

interface Disease {
    id: string;
    name: string;
    prior: number;
    urgent: boolean;
}

interface InferenceState {
    answers: Record<string, Answer>;
    probabilities: Record<string, number>;
    entropy: number;
    eligibleDiseases: string[];
    history: string[];
    status: 'active' | 'success' | 'inconclusive' | 'emergency';
}

// --- KNOWLEDGE BASE (COPIED) ---
const DISEASES: Record<string, Disease> = {
    flu: { id: 'flu', name: 'Influenza', prior: 0.15, urgent: false },
    dengue: { id: 'dengue', name: 'Demam Berdarah', prior: 0.05, urgent: true },
};

const SYMPTOMS: Symptom[] = [
    {
        id: 'fever',
        question: 'Demam?',
        likelihoods: {
            flu: { yes: 0.90, no: 0.10 },
            dengue: { yes: 0.95, no: 0.05 },
        }
    },
    {
        id: 'cough',
        question: 'Batuk?',
        likelihoods: {
            flu: { yes: 0.85, no: 0.15 },
            dengue: { yes: 0.20, no: 0.80 },
        }
    },
    {
        id: 'rash',
        question: 'Ruam?',
        likelihoods: {
            flu: { yes: 0.05, no: 0.95 },
            dengue: { yes: 0.60, no: 0.40 },
        }
    }
];

// --- INFERENCE ENGINE (SIMPLIFIED) ---
class InferenceEngine {
    state: InferenceState;

    constructor() {
        this.state = this.getInitialState();
    }

    getInitialState(): InferenceState {
        const probabilities: Record<string, number> = {};
        let totalPrior = 0;
        Object.values(DISEASES).forEach(d => {
            probabilities[d.id] = d.prior;
            totalPrior += d.prior;
        });
        const normalizationFactor = 1 / totalPrior;
        Object.keys(probabilities).forEach(id => {
            probabilities[id] = probabilities[id] * normalizationFactor;
        });
        return {
            answers: {},
            probabilities,
            entropy: 0,
            eligibleDiseases: Object.keys(DISEASES),
            history: [],
            status: 'active'
        };
    }

    assess(currentAnswer: { symptomId: string; value: Answer }): InferenceState {
        const newState = { ...this.state };
        let totalPosterior = 0;
        const newProbabilities: Record<string, number> = {};

        Object.keys(newState.probabilities).forEach(diseaseId => {
            const prior = newState.probabilities[diseaseId];
            const symptom = SYMPTOMS.find(s => s.id === currentAnswer.symptomId);
            if (!symptom) return;

            let likelihood = 0.5;
            if (currentAnswer.value === 'yes') likelihood = symptom.likelihoods[diseaseId]?.yes ?? 0.5;
            else if (currentAnswer.value === 'no') likelihood = symptom.likelihoods[diseaseId]?.no ?? 0.5;

            newProbabilities[diseaseId] = likelihood * prior;
            totalPosterior += newProbabilities[diseaseId];
        });

        if (totalPosterior > 0) {
            Object.keys(newProbabilities).forEach(id => {
                newProbabilities[id] = newProbabilities[id] / totalPosterior;
            });
        }
        newState.probabilities = newProbabilities;
        return newState;
    }
}

// --- TEST RUN ---
console.log("=== STANDALONE ENGINE TEST ===");
const engine = new InferenceEngine();
let state = engine.state;

console.log("Initial Probs:", state.probabilities);

// Simulating FLU: Fever=Yes, Cough=Yes, Rash=No
console.log("\n-> Answer: Fever = YES");
state = engine.assess({ symptomId: 'fever', value: 'yes' });
console.log("Probs:", state.probabilities);

console.log("\n-> Answer: Cough = YES");
state = engine.assess({ symptomId: 'cough', value: 'yes' });
console.log("Probs:", state.probabilities);

console.log("\n-> Answer: Rash = NO");
state = engine.assess({ symptomId: 'rash', value: 'no' });
console.log("Probs:", state.probabilities);

if (state.probabilities['flu'] > 0.8) {
    console.log("\n✅ SUCCESS: Flu identified with high confidence.");
} else {
    console.error("\n❌ FAILURE: Probability calculation wrong.");
    process.exit(1);
}
