import { useState } from 'react';
import { Phone, Lock } from 'lucide-react';

interface LoginPageProps {
  onLogin: (phoneNumber: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10) return;
    
    setIsLoading(true);
    // TODO: Call API to send OTP via SMS
    // await fetch('/api/auth/send-otp', { method: 'POST', body: JSON.stringify({ phoneNumber }) });
    
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
    }, 1000);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) return;

    setIsLoading(true);
    // TODO: Verify OTP and get JWT token
    // const response = await fetch('/api/auth/verify-otp', { 
    //   method: 'POST', 
    //   body: JSON.stringify({ phoneNumber, otp: otpCode }) 
    // });
    // const { token } = await response.json();
    // localStorage.setItem('auth_token', token);
    
    setTimeout(() => {
      setIsLoading(false);
      onLogin(phoneNumber);
    }, 1000);
  };

  return (
    <div className="min-h-screen gradient-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-white mb-2">MyDudu</h1>
          <p className="text-white/90">Pantau Kesehatan Anak Anda</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          {step === 'phone' ? (
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
                <p className="text-sm text-gray-500 mt-2">
                  Anda akan menerima kode OTP melalui SMS
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || phoneNumber.length < 10}
                className="w-full gradient-primary text-white font-semibold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Mengirim...' : 'Kirim Kode'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit}>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-5 h-5 text-gray-600" />
                  <label className="text-gray-700 font-semibold">
                    Masukkan Kode OTP
                  </label>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Kode telah dikirim ke {phoneNumber}
                </p>
                
                <div className="flex gap-2 justify-center mb-4">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="tel"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Ganti nomor handphone
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.join('').length !== 6}
                className="w-full gradient-primary text-white font-semibold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Memverifikasi...' : 'Masuk'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
