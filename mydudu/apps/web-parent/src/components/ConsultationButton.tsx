import { MessageCircle } from 'lucide-react';

interface ConsultationButtonProps {
  onClick?: () => void;
}

export function ConsultationButton({ onClick }: ConsultationButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full gradient-primary text-white font-semibold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
    >
      <MessageCircle className="w-6 h-6" />
      <span>Konsultasi dengan Tenaga Kesehatan</span>
    </button>
  );
}
