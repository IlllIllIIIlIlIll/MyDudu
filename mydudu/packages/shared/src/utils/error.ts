export function getFriendlyErrorMessage(error: any): string {
  if (!error) return 'Terjadi kesalahan sistem. Silakan coba lagi.';
  
  const errorMessage = error?.message || error?.code || (typeof error === 'string' ? error : '');
  const messageLower = String(errorMessage).toLowerCase();

  // Firebase Auth Error Codes
  if (messageLower.includes('auth/popup-blocked')) {
    return 'Pop-up login diblokir oleh browser. Harap izinkan pop-up untuk login.';
  }
  if (messageLower.includes('auth/popup-closed-by-user')) {
    return 'Proses login dibatalkan. Silakan coba lagi.';
  }
  if (messageLower.includes('auth/user-not-found') || messageLower.includes('auth/invalid-credential') || messageLower.includes('auth/wrong-password')) {
    return 'Email atau kata sandi tidak valid.';
  }
  if (messageLower.includes('auth/network-request-failed')) {
    return 'Koneksi internet terputus. Silakan periksa jaringan Anda.';
  }
  if (messageLower.includes('auth/too-many-requests')) {
    return 'Terlalu banyak percobaan login. Silakan coba lagi nanti.';
  }
  
  // Generic Network Errors
  if (messageLower.includes('network error') || messageLower.includes('failed to fetch')) {
    return 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
  }

  // Fallback to original message or generic error
  return errorMessage || 'Terjadi kesalahan tidak terduga. Silakan coba lagi.';
}
