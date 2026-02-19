'use client';

import { motion } from 'motion/react';
import { CLINICAL_QUIZ_COLORS } from '../clinical-quiz-tokens';

interface QuestionHeaderProps {
  question: string;
  layman?: string;
}

import styles from './ClinicalQuiz.module.css';

export function QuestionHeader({ question, layman }: QuestionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-center px-4 lg:px-8 max-w-4xl"
    >
      <h2
        className={`font-extrabold tracking-tight leading-tight mb-4 lg:mb-5 ${styles.questionText}`}
        style={{ '--question-text-color': CLINICAL_QUIZ_COLORS.QUESTION_TEXT } as React.CSSProperties}
      >
        {question}
      </h2>
      {layman && (
        <p className={`font-medium leading-relaxed ${styles.laymanText}`}>
          {layman}
        </p>
      )}
    </motion.div>
  );
}
