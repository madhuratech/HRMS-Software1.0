import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { API_URL } from './api';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

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
      if (API_URL) {
        return `${API_URL}${cleanPath}`;
      }
      return cleanPath;
    }
    return '/' + trimmed.replace(/^\/+/, '');
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(empName || 'User')}&background=2563EB&color=fff&bold=true`;
}