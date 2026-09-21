import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const RENDER_BACKEND_URL = 'https://madhura-hrm.onrender.com';

export function getAvatarUrl(profilePhoto, empName = 'User', empId = 1) {
  if (profilePhoto && typeof profilePhoto === 'string' && profilePhoto.trim() !== '') {
    const trimmed = profilePhoto.trim();
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('blob:')
    ) {
      return trimmed;
    }
    if (/^[A-Za-z0-9+/=]+$/.test(trimmed.substring(0, 50)) && trimmed.length > 50) {
      return `data:image/png;base64,${trimmed}`;
    }
    if (trimmed.startsWith('/') || trimmed.startsWith('uploads')) {
      const cleanPath = '/' + trimmed.replace(/^\/+/, '');
      const isLocal = typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.') ||
        window.location.hostname.startsWith('10.') ||
        Boolean(window.location.port)
      );
      return isLocal ? cleanPath : `${RENDER_BACKEND_URL}${cleanPath}`;
    }
    return '/' + trimmed.replace(/^\/+/, '');
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(empName || 'User')}&background=2563EB&color=fff&bold=true`;
}