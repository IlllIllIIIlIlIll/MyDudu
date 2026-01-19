import { useState } from 'react';
import { Mail, Lock, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setError('');
    
    // Simulate Google OAuth flow
    setTimeout(() => {
      if (email && email.includes('@mydudu.id')) {
        onLogin(email);
      } else {
        setError('Email harus menggunakan domain @mydudu.id');
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleQuickLogin = (testEmail: string) => {
    setEmail(testEmail);
    setTimeout(() => onLogin(testEmail), 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#11998E] to-[#38EF7D] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo Placeholder */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-[32px] font-extrabold">MD</div>
              <div className="text-[10px] font-semibold">LOGO</div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-extrabold gradient-text mb-2">MyDudu Dashboard</h1>
          <p className="text-gray-600 text-[15px]">Sistem Pemantauan Kesehatan Anak</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-[14px]">{error}</p>
          </div>
        )}

        {/* Email Input */}
        <div className="mb-6">
          <label className="block text-[15px] font-semibold text-gray-700 mb-2">
            Email MyDudu
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="username@mydudu.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGoogleLogin()}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
            />
          </div>
        </div>

        {/* Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading || !email}
          className="w-full gradient-primary text-white py-4 rounded-lg font-semibold text-[16px] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-3 mb-6"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Masuk dengan Google
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-[13px]">
            <span className="px-2 bg-white text-gray-500">Demo Login</span>
          </div>
        </div>

        {/* Quick Login Options */}
        <div className="space-y-3">
          <button
            onClick={() => handleQuickLogin('admin@mydudu.id')}
            className="w-full bg-purple-50 text-purple-700 py-3 rounded-lg font-semibold text-[15px] hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Login sebagai IT Admin
          </button>
          <button
            onClick={() => handleQuickLogin('ahmad.fauzi@mydudu.id')}
            className="w-full bg-blue-50 text-blue-700 py-3 rounded-lg font-semibold text-[15px] hover:bg-blue-100 transition-colors"
          >
            Login sebagai Operator Puskesmas
          </button>
          <button
            onClick={() => handleQuickLogin('sari.wijaya@mydudu.id')}
            className="w-full bg-green-50 text-green-700 py-3 rounded-lg font-semibold text-[15px] hover:bg-green-100 transition-colors"
          >
            Login sebagai Posyandu Melati
          </button>
          <button
            onClick={() => handleQuickLogin('rina.kusuma@mydudu.id')}
            className="w-full bg-green-50 text-green-700 py-3 rounded-lg font-semibold text-[15px] hover:bg-green-100 transition-colors"
          >
            Login sebagai Posyandu Mawar
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-[13px] text-gray-500">
            Butuh bantuan? Hubungi IT Admin
          </p>
          <p className="text-[12px] text-gray-400 mt-2">
            © 2026 MyDudu Dashboard - Sistem Kesehatan Anak
          </p>
        </div>
      </div>
    </div>
  );
}