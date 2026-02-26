import { motion } from 'motion/react';
import { QuizCard } from './QuizCard';
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
          <div className="w-[min(100%,_40vh)] md:w-[min(45%,_65vh)] aspect-square relative">
            <QuizCard
              label="YA"
              type="yes"
              image="placeholder1.png"
              onClick={() => !isSubmitting && onAnswer('yes')}
            />
          </div>

          <div className="w-[min(100%,_40vh)] md:w-[min(45%,_65vh)] aspect-square relative">
            <QuizCard
              label="TIDAK"
              type="no"
              image="placeholder2.png"
              onClick={() => !isSubmitting && onAnswer('no')}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
