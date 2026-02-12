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
            className={`group relative flex-1 h-full transition-all active:scale-95 ${styles.quizCard} ${type === 'yes' ? styles.quizYes : styles.quizNo
                }`}
        >
            <div className={`absolute inset-0 transition-transform duration-700 group-hover:scale-105 ${styles.quizFrame} ${isPlaceholder ? styles.quizPlaceholder : ''}`}>
                <ImageWithFallback
                    src={resolvedImage}
                    alt={label}
                    className={`w-full h-full object-cover ${isPlaceholder ? '' : 'brightness-[0.6]'}`}
                />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-white text-center z-10">
                <h3 className={styles.quizTitle}>{label}</h3>
                <p className={`${styles.quizHint} text-white/70 mt-1`}>
                    TAP UNTUK MEMILIH
                </p>
            </div>
        </button>
    );
}
