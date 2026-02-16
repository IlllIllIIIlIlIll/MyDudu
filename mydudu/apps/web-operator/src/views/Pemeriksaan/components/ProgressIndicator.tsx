'use client';

import { motion } from 'motion/react';
import { CLINICAL_QUIZ_TYPOGRAPHY, CLINICAL_QUIZ_COLORS } from '../clinical-quiz-tokens';

interface ProgressIndicatorProps {
  current: number;
  total: number;
}

export function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="absolute top-4 right-4 lg:top-6 lg:right-6 z-20 bg-white rounded-full px-4 py-2 shadow-md border border-slate-200"
    >
      <p
        style={{
          fontSize: CLINICAL_QUIZ_TYPOGRAPHY.PROGRESS_SIZE,
          fontWeight: CLINICAL_QUIZ_TYPOGRAPHY.PROGRESS_WEIGHT,
          color: CLINICAL_QUIZ_COLORS.PROGRESS_TEXT,
          whiteSpace: 'nowrap',
        }}
      >
        {current} / {total}
      </p>
    </motion.div>
  );
}
