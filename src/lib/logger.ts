/**
 * Güvenli Logger Utility
 * Production'da console.log'ları devre dışı bırakır
 * Development'ta sadece gerekli bilgileri loglar
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  // Genel bilgi logları (sadece development)
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  // Hata logları (her zaman göster ama hassas bilgileri gizle)
  error: (...args: unknown[]) => {
    if (isDevelopment) {
      console.error(...args);
    } else {
      // Production'da sadece hata mesajını göster, detayları gizle
      console.error('Bir hata oluştu. Detaylar için loglara bakın.');
    }
  },

  // Uyarılar (sadece development)
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  // Başarı mesajları (sadece development)
  success: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log('✅', message, ...args);
    }
  },

  // Bilgi mesajları (sadece development)
  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log('ℹ️', message, ...args);
    }
  },

  // ASLA LOGLAMA - Hassas bilgiler için
  // Auth token, password, email gibi bilgiler için
  sensitive: () => {
    // Hiçbir zaman loglanmaz
    return;
  },
};

export default logger;

