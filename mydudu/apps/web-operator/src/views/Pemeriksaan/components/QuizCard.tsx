import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';
import { getPublicAsset } from '../utils';
import styles from '../ScreeningFlow.module.css';

interface QuizCardProps {
    label: string;
    type: 'yes' | 'no';
    image: string;
    onClick: () => void;
}

export function QuizCard({ label, type, image, onClick }: QuizCardProps) {
    const isPlaceholder = image.includes('placeholder');
    const resolvedImage = isPlaceholder ? getPublicAsset(image) : image;
    return (
        <button
            onClick={onClick}
            className={`group relative w-full h-full transition-all active:scale-95 ${styles.quizCard} ${type === 'yes' ? styles.quizYes : styles.quizNo
                }`}
        >
            <div className={`absolute inset-0 transition-transform duration-700 group-hover:scale-105 ${styles.quizFrame} ${isPlaceholder ? styles.quizPlaceholder : ''}`}>
                <ImageWithFallback
                    src={resolvedImage}
                    alt={label}
                    className={`w-full h-full object-cover ${isPlaceholder ? '' : 'brightness-110'}`}
                />
            </div>

            {/* Blurry transparent overlay over the image for better text contrast */}
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm z-[5]"></div>
            {/* Content — large bordered 3D text */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4 text-center">
                <h3
                    className="font-black tracking-tight select-none"
                    style={{
                        fontSize: 'clamp(3rem, 10vw, 6rem)',
                        color: '#ffffff',
                        lineHeight: 1,
                        // Heavy outline + drop shadow for 3D effect, visible on any background
                        WebkitTextStroke: '3px rgba(0,0,0,0.85)',
                        textShadow: '0 2px 0 rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.6), 2px 2px 0 rgba(0,0,0,0.7), -2px -2px 0 rgba(0,0,0,0.7)',
                        paintOrder: 'stroke fill',
                    }}
                >
                    {label}
                </h3>
            </div>
        </button>
    );
}
