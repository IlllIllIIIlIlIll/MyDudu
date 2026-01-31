import { useState } from 'react';
import { Phone, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onLogin: (userData: any) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/verify-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!response.ok) {
        const data = await response.json();
        // Check if the error is "Nomor telepon belum terdaftar"
        if (data.message) {
          throw new Error(data.message);
        }
        throw new Error('Gagal memverifikasi nomor telepon');
      }

      const userData = await response.json();
      onLogin(userData);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-white mb-2">MyDudu</h1>
          <p className="text-white/90">Pantau Kesehatan Anak Anda</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          <form onSubmit={handlePhoneSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-3">
                Nomor Handphone
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl text-lg focus:border-green-500 focus:outline-none"
                  required
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 mt-3 text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Masukkan nomor handphone yang terdaftar di sistem.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || phoneNumber.length < 10}
              className="w-full gradient-primary text-white font-semibold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Memverifikasi...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
