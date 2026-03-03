import { motion } from 'motion/react';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';
import { getPublicAsset } from '../utils';
import { ProgressLine } from './ProgressLine';
import styles from '../ScreeningFlow.module.css';

interface ClinicalQuizPageProps {
  currentQuestion: {
    id: string;
    question: string;
    layman?: string;
    yesNodeId: string | null;
    noNodeId: string | null;
  };
  currentQuestionIndex: number;
  totalQuestions: number;
  onAnswer: (choice: 'yes' | 'no') => void;
  isSubmitting: boolean;
}

export function ClinicalQuizPage({
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  onAnswer,
  isSubmitting,
}: ClinicalQuizPageProps) {
  return (
    <motion.div
      key={`quiz-${currentQuestion.id}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full flex flex-col flex-1 min-h-0 pt-8"
    >
      {/* Question */}
      <div className="text-center mb-4 shrink-0 px-6">
        <div className="mb-2 font-bold text-slate-900 leading-tight text-[clamp(1.5rem,4vw,2.5rem)] max-w-4xl mx-auto">
          {currentQuestion.question}
        </div>
        {/* {currentQuestion.layman && (
          <p className={`max-w-2xl mx-auto ${styles.quizSubtitleText}`}>
            {currentQuestion.layman}
          </p>
        )} */}
      </div>

      {/* Answers */}
      <div className="flex-1 min-h-0 flex items-center justify-center px-6 pb-8">
        <div className="w-full max-w-6xl flex flex-col md:flex-row gap-6 md:gap-12 items-center justify-center h-full">
          {/* Left: Visualization (WAS YES) */}
          <div className="w-[min(100%,_40vh)] md:w-[min(45%,_65vh)] aspect-square relative border-8 border-black bg-white overflow-hidden">
            <ImageWithFallback
              src={getPublicAsset('logo_mydudu.png')}
              alt="Illustration"
              className="w-full h-full object-contain p-8"
            />
          </div>

          {/* Right: Divided Interaction (WAS NO) */}
          <div className="w-[min(100%,_40vh)] md:w-[min(45%,_65vh)] aspect-square relative flex flex-col gap-4">
            <button
              onClick={() => !isSubmitting && onAnswer('yes')}
              className={`flex-1 w-full rounded-[32px] transition-all active:scale-95 border-2 border-[#ff3b5f] flex items-center justify-center shadow-[0_18px_30px_-22px_rgba(255,59,95,0.45)] hover:bg-[#ff3b5f]/5`}
            >
              <h3 className="font-black text-[clamp(2rem,6vw,4rem)] text-[#ff3b5f] tracking-tight">YES</h3>
            </button>

            <button
              onClick={() => !isSubmitting && onAnswer('no')}
              className={`flex-1 w-full rounded-[32px] transition-all active:scale-95 border-2 border-[#3ad29f] flex items-center justify-center shadow-[0_18px_30px_-22px_rgba(58,210,159,0.45)] hover:bg-[#3ad29f]/5`}
            >
              <h3 className="font-black text-[clamp(2rem,6vw,4rem)] text-[#3ad29f] tracking-tight">No</h3>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
