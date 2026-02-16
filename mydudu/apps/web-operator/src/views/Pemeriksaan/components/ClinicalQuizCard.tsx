'use client';

import { motion } from 'motion/react';
import { CLINICAL_QUIZ_COLORS, CLINICAL_QUIZ_SPACING, CLINICAL_QUIZ_ANIMATIONS, CLINICAL_QUIZ_SHADOWS } from '../clinical-quiz-tokens';

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
  const glowColor = isYes ? CLINICAL_QUIZ_COLORS.YES_GLOW : CLINICAL_QUIZ_COLORS.NO_GLOW;
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
      className="relative flex-1 w-full h-full rounded-[20px] overflow-hidden focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        borderWidth: CLINICAL_QUIZ_SPACING.CARD_BORDER_WIDTH,
        borderColor: borderColor,
        borderStyle: 'solid',
        boxShadow: isSelected ? glowShadow : CLINICAL_QUIZ_SHADOWS.CARD_SHADOW,
      }}
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
            className="w-full h-full"
            style={{
              background: isYes
                ? 'linear-gradient(135deg, #FEE2E2 0%, #FCA5A5 100%)'
                : 'linear-gradient(135deg, #DBEAFE 0%, #93C5FD 100%)',
            }}
          />
        )}
      </div>

      {/* Dark Gradient Overlay */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          background: CLINICAL_QUIZ_COLORS.OVERLAY_GRADIENT,
        }}
      />

      {/* Fade effect for unselected cards */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            backgroundColor: '#000000',
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <h3
            className="font-bold tracking-tight"
            style={{
              color: CLINICAL_QUIZ_COLORS.TEXT_PRIMARY,
              fontSize: 'clamp(1.5rem, 8vw, 2.5rem)',
              fontWeight: 800,
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            }}
          >
            {label}
          </h3>
        </motion.div>
      </div>
    </motion.button>
  );
}
