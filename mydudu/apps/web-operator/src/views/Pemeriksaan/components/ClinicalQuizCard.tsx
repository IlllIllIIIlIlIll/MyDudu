'use client';

import { motion } from 'motion/react';
import { CLINICAL_QUIZ_COLORS, CLINICAL_QUIZ_SPACING, CLINICAL_QUIZ_ANIMATIONS, CLINICAL_QUIZ_SHADOWS } from '../clinical-quiz-tokens';

import styles from './ClinicalQuiz.module.css';

interface ClinicalQuizCardProps {
  label: 'YA' | 'TIDAK';
  onClick: () => void;
  disabled?: boolean;
  isSelected?: boolean;
  backgroundImage?: string;
}

export function ClinicalQuizCard({
  label,
  onClick,
  disabled = false,
  isSelected = false,
  backgroundImage,
}: ClinicalQuizCardProps) {
  const isYes = label === 'YA';
  const borderColor = isYes ? CLINICAL_QUIZ_COLORS.YES_BORDER : CLINICAL_QUIZ_COLORS.NO_BORDER;
  const glowShadow = isYes ? CLINICAL_QUIZ_SHADOWS.GLOW_SHADOW_YES : CLINICAL_QUIZ_SHADOWS.GLOW_SHADOW_NO;

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: CLINICAL_QUIZ_ANIMATIONS.HOVER_SCALE } : {}}
      whileTap={!disabled ? { scale: CLINICAL_QUIZ_ANIMATIONS.ACTIVE_SCALE } : {}}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      className={`relative flex-1 w-full h-full rounded-[20px] overflow-hidden focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${styles.quizCard}`}
      style={{
        '--card-border-width': CLINICAL_QUIZ_SPACING.CARD_BORDER_WIDTH,
        '--card-border-color': borderColor,
        '--card-shadow': isSelected ? glowShadow : CLINICAL_QUIZ_SHADOWS.CARD_SHADOW,
      } as React.CSSProperties}
    >
      {/* Background Image or Placeholder */}
      <div className="absolute inset-0 w-full h-full">
        {backgroundImage ? (
          <img
            src={backgroundImage}
            alt={label}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className={`w-full h-full ${styles.cardBackground}`}
            style={{
              '--card-bg-gradient': isYes
                ? 'linear-gradient(135deg, #FEE2E2 0%, #FCA5A5 100%)'
                : 'linear-gradient(135deg, #DBEAFE 0%, #93C5FD 100%)',
            } as React.CSSProperties}
          />
        )}
      </div>

      {/* Dark Gradient Overlay */}
      <div
        className={`absolute inset-0 w-full h-full pointer-events-none ${styles.overlayGradient}`}
        style={{
          '--overlay-gradient': CLINICAL_QUIZ_COLORS.OVERLAY_GRADIENT,
        } as React.CSSProperties}
      />

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <h3
            className={`font-bold tracking-tight ${styles.cardText}`}
            style={{
              '--card-text-primary': CLINICAL_QUIZ_COLORS.TEXT_PRIMARY,
            } as React.CSSProperties}
          >
            {label}
          </h3>
        </motion.div>
      </div>

      {/* Fade effect for unselected cards */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          className={`absolute inset-0 w-full h-full pointer-events-none ${styles.fadeOverlay}`}
        />
      )}
    </motion.button>
  );
}
