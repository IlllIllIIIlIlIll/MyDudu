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
                    className={`w-full h-full object-cover ${isPlaceholder ? '' : 'brightness-[0.6]'}`}
                />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
                <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                        width: '55%',
                        aspectRatio: '1',
                        backgroundColor: type === 'yes' ? 'rgba(239,68,68,0.25)' : 'rgba(59,130,246,0.25)',
                    }}
                >
                    <h3
                        className="font-black tracking-tight select-none"
                        style={{
                            fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
                            color: '#fff',
                            lineHeight: 1,
                            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                        }}
                    >
                        {label}
                    </h3>
                </div>
            </div>
        </button>
    );
}
