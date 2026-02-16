'use client';

import { motion } from 'motion/react';
import { CLINICAL_QUIZ_COLORS } from '../clinical-quiz-tokens';

interface QuestionHeaderProps {
  question: string;
  layman?: string;
}

export function QuestionHeader({ question, layman }: QuestionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-center px-4 lg:px-8 max-w-4xl"
    >
      <h2
        className="font-extrabold tracking-tight leading-tight mb-4 lg:mb-5"
        style={{
          fontSize: 'clamp(1.75rem, 6vw, 3rem)',
          color: CLINICAL_QUIZ_COLORS.QUESTION_TEXT,
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
        }}
      >
        {question}
      </h2>
      {layman && (
        <p
          className="font-medium leading-relaxed"
          style={{
            fontSize: 'clamp(0.95rem, 2vw, 1.125rem)',
            color: '#64748B',
            maxWidth: '100%',
          }}
        >
          {layman}
        </p>
      )}
    </motion.div>
  );
}
