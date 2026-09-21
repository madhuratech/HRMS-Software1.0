// Centralized API Base URL configured via environment variable
export const API_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_HRMS_API_URL ||
  ''
).replace(/\/+$/, '');

export const getApiUrl = (path = '') => {
  if (!path) return API_URL;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return API_URL ? `${API_URL}${cleanPath}` : cleanPath;
};

export const getAuthToken = () => {
  const auth = localStorage.getItem('hrms_auth');
  if (auth) {
    try {
      const parsed = JSON.parse(auth);
      return parsed.token || 'mock_jwt_token';
    } catch (e) {
      return 'mock_jwt_token';
    }
  }
  return 'mock_jwt_token';
};

export const getAuthHeaders = (extraHeaders = {}) => {
  let empHeaderId = '';
  let userRole = localStorage.getItem('userRole') || '';
  const auth = localStorage.getItem('hrms_auth');
  if (auth) {
    try {
      const parsed = JSON.parse(auth);
      const userObj = parsed.user || parsed;
      empHeaderId = userObj.id || userObj.emp_id || userObj.employee_id || '';
      if (!userRole) userRole = parsed.role || userObj.role || '';
    } catch (e) {}
  }
  return {
    'Authorization': `Bearer ${getAuthToken()}`,
    ...(empHeaderId ? { 'x-employee-id': String(empHeaderId) } : {}),
    ...(userRole ? { 'x-user-role': String(userRole) } : {}),
    ...extraHeaders
  };
};

export const apiFetch = async (path, options = {}) => {
  let targetPath = path || '';
  let url;

  if (targetPath.startsWith('http://') || targetPath.startsWith('https://')) {
    url = targetPath;
  } else {
    if (!targetPath.startsWith('/')) {
      targetPath = '/' + targetPath;
    }
    let fullPath = targetPath;
    // Prefix /app if not already prefixed with /app/, /api/, or /uploads/
    if (!fullPath.startsWith('/app/') && !fullPath.startsWith('/api/') && !fullPath.startsWith('/uploads/')) {
      fullPath = `/app${targetPath}`;
    }
    url = API_URL ? `${API_URL}${fullPath}` : fullPath;
  }

  const isFormData = options.body instanceof FormData;
  const headers = getAuthHeaders({
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {})
  });

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, offline: true, message: 'Internet connection unavailable' };
  }

  try {
    const res = await fetch(url, { ...options, headers });
    const text = await res.text();
    if (!text || !text.trim()) {
      return { success: res.ok, status: res.status };
    }
    const json = JSON.parse(text);
    if (!res.ok && json && json.message && !json.error) {
      json.error = json.message;
    }
    return json;
  } catch (e) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { success: false, offline: true, message: 'Internet connection unavailable' };
    }
    console.warn(`apiFetch notice for ${path}:`, e.message || e);
    return { success: false, message: e.message || 'Network request failed' };
  }
};

export const formatDate = (value) => {
  if (!value) return 'TBD';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const getInitials = (name) => {
  if (!name) return '';
  return name.split(' ').map(x => x[0]).join('').substring(0, 2).toUpperCase();
};