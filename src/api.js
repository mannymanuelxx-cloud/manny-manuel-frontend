const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const SESSION_KEY = 'stockroom.session';

export function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

async function parseResponse(response) {
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error || data?.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.details = data?.errors;
    throw error;
  }
  return data;
}

async function refreshSession(session) {
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  const data = await parseResponse(response);
  const tokens = data?.tokens || data;
  const updated = { ...session, ...tokens };
  saveSession(updated);
  return updated;
}

export async function request(path, options = {}, canRefresh = true) {
  const session = readSession();
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error(`Cannot reach the API at ${API_BASE}. Make sure LavaLust is running and the API URL is correct.`);
  }
  if (response.status === 401 && canRefresh && session?.refresh_token && !path.startsWith('/auth/')) {
    try {
      await refreshSession(session);
      return request(path, options, false);
    } catch {
      clearSession();
    }
  }
  return parseResponse(response);
}

export async function login(credentials) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }, false);
  const session = { ...data.tokens, user: data.user };
  saveSession(session);
  return session;
}

export async function register(details) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(details),
  }, false);
  const session = { ...data.tokens, user: data.user };
  saveSession(session);
  return session;
}

export async function logout() {
  const session = readSession();
  try {
    if (session?.refresh_token) {
      await request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      }, false);
    }
  } finally {
    clearSession();
  }
}

export const productsApi = {
  list: () => request('/products'),
  create: (product) => request('/products', { method: 'POST', body: JSON.stringify(product) }),
  update: (id, product) => request(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(product) }),
  remove: (id) => request(`/products/${id}`, { method: 'DELETE' }),
};