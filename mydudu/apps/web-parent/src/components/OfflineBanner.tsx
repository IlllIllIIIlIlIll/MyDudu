import { WifiOff, RefreshCw } from 'lucide-react';

interface OfflineBannerProps {
  onRetry?: () => void;
}

export function OfflineBanner({ onRetry }: OfflineBannerProps) {
  return (
    <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg shadow-sm">
      <div className="flex items-start gap-3">
        <WifiOff className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-base font-semibold text-orange-900 mb-1">
            Tidak Ada Koneksi
          </h3>
          <p className="text-sm text-orange-700 mb-3">
            Data akan diunggah secara otomatis ketika koneksi tersedia kembali.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Coba Lagi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
