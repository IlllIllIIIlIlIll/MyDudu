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
      className="w-full flex flex-col flex-1 min-h-0"
    >
      {/* Progress */}
      <div className="shrink-0">
        <ProgressLine 
          label="Pertanyaan" 
          value={(currentQuestionIndex / totalQuestions) * 100} 
          color="blue"
          labelValue={`${currentQuestionIndex}/${totalQuestions}`}
        />
      </div>

      {/* Question */}
      <div className="text-center mb-4 shrink-0 px-6">
        <div className={`mb-2 ${styles.quizTitleText}`}>
          {currentQuestion.question}
        </div>
        {currentQuestion.layman && (
          <p className={`max-w-2xl mx-auto ${styles.quizSubtitleText}`}>
            {currentQuestion.layman}
          </p>
        )}
      </div>

      {/* Answers */}
      <div className="flex-1 min-h-0 flex items-center justify-center px-6 pb-6">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 place-items-center">
          {/* Size rule:
              - primary sizing uses vmin (responsive, square-friendly)
              - capped by remaining viewport height so it never gets cut
              - clamped so it never becomes too tiny or too huge
           */}
          <div
            className="
              w-[clamp(180px,30vmin,420px)]
              aspect-square
              max-w-full
              max-h-[calc(100dvh-260px)]
            "
          >
            <QuizCard
              label="YA"
              type="yes"
              image="placeholder-yes.jpg"
              onClick={() => !isSubmitting && onAnswer('yes')}
            />
          </div>

          <div
            className="
              w-[clamp(180px,30vmin,420px)]
              aspect-square
              max-w-full
              max-h-[calc(100dvh-260px)]
            "
          >
            <QuizCard
              label="TIDAK"
              type="no"
              image="placeholder-no.jpg"
              onClick={() => !isSubmitting && onAnswer('no')}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
