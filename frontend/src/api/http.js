const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function toQueryString(query = {}) {
  const entries = Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!entries.length) return '';

  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    params.set(key, String(value));
  }

  return `?${params.toString()}`;
}

function parseErrorMessage(payload, fallbackMessage) {
  if (!payload) return fallbackMessage;
  if (typeof payload === 'string') return payload;
  return payload.message || payload.error?.message || fallbackMessage;
}

let refreshPromise = null;

async function refreshToken() {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Unable to refresh session');
  }
}

async function request(path, options = {}, canRetry = true) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const headers = {
    ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    payload = await response.json();
  }

  if (response.status === 401 && canRetry && path !== '/auth/refresh') {
    if (!refreshPromise) {
      refreshPromise = refreshToken().finally(() => {
        refreshPromise = null;
      });
    }

    try {
      await refreshPromise;
      return request(path, options, false);
    } catch {
      // Let regular error flow handle this.
    }
  }

  if (!response.ok) {
    throw new Error(parseErrorMessage(payload, `Request failed with status ${response.status}`));
  }

  return payload;
}

export async function get(path, query = {}) {
  return request(`${path}${toQueryString(query)}`);
}

export async function post(path, body, options = {}) {
  const isFormData = body instanceof FormData;
  return request(path, {
    method: 'POST',
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    ...options,
  });
}

export async function patch(path, body, options = {}) {
  const isFormData = body instanceof FormData;
  return request(path, {
    method: 'PATCH',
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    ...options,
  });
}

export async function put(path, body, options = {}) {
  const isFormData = body instanceof FormData;
  return request(path, {
    method: 'PUT',
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    ...options,
  });
}

export async function del(path) {
  return request(path, { method: 'DELETE' });
}

export { API_BASE_URL };
