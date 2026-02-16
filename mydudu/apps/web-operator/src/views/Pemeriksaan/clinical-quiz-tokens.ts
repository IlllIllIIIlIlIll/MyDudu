/**
 * Design Tokens for Clinical Quiz Page
 * Pediatric healthcare themed colors and animations
 */

export const CLINICAL_QUIZ_COLORS = {
  // Card colors
  YES_BORDER: '#EF4444', // Red for "YA"
  NO_BORDER: '#0070F3', // Blue for "TIDAK"
  
  // Overlays and backgrounds
  OVERLAY_DARK: 'rgba(0, 0, 0, 0.45)',
  OVERLAY_GRADIENT: 'linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.5) 100%)',
  
  // Text colors
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: 'rgba(255, 255, 255, 0.8)',
  QUESTION_TEXT: '#0B1020',
  PROGRESS_TEXT: '#64748B',
  
  // Background
  BACKGROUND: '#FFFFFF',
  BACKGROUND_LIGHT: '#F7F9FA',
  
  // Glow effects
  YES_GLOW: 'rgba(239, 68, 68, 0.3)',
  NO_GLOW: 'rgba(0, 112, 243, 0.3)',
};

export const CLINICAL_QUIZ_SPACING = {
  CARD_BORDER_RADIUS: '20px',
  CARD_BORDER_WIDTH: '5px',
  CONTAINER_PADDING: '16px',
  CONTAINER_PADDING_LG: '32px',
  QUESTION_GAP: '24px',
  CARDS_GAP: '16px',
  CARDS_GAP_LG: '32px',
};

export const CLINICAL_QUIZ_ANIMATIONS = {
  // Spring animations for card interactions
  SPRING_SCALE: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  },
  
  // Fade animations for opacity changes
  FADE_DURATION: 0.3,
  
  // Transition duration for switching questions
  SLIDE_DURATION: 0.4,
  
  // Glow pulse animation
  GLOW_DURATION: 0.6,
  
  // Hover scale effect
  HOVER_SCALE: 1.02,
  ACTIVE_SCALE: 0.97,
};

export const CLINICAL_QUIZ_SHADOWS = {
  CARD_SHADOW: '0 10px 30px rgba(0, 0, 0, 0.15)',
  CARD_SHADOW_HOVER: '0 15px 40px rgba(0, 0, 0, 0.2)',
  GLOW_SHADOW_YES: '0 0 20px rgba(239, 68, 68, 0.4)',
  GLOW_SHADOW_NO: '0 0 20px rgba(0, 112, 243, 0.4)',
};

export const CLINICAL_QUIZ_TYPOGRAPHY = {
  QUESTION_SIZE: 'clamp(1.75rem, 5vw, 2.5rem)',
  QUESTION_WEIGHT: 700,
  QUESTION_LINE_HEIGHT: 1.2,
  
  CARD_LABEL_SIZE: 'clamp(1.25rem, 4vw, 1.75rem)',
  CARD_LABEL_WEIGHT: 800,
  
  PROGRESS_SIZE: '14px',
  PROGRESS_WEIGHT: 600,
};

export const CLINICAL_QUIZ_BREAKPOINTS = {
  MOBILE: 480,
  TABLET: 768,
  DESKTOP: 1024,
};
