import { Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ConnectionIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
      isOnline ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
    }`}>
      {isOnline ? (
        <Wifi className="w-4 h-4" />
      ) : (
        <WifiOff className="w-4 h-4" />
      )}
      <span className="text-sm font-medium">
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}
