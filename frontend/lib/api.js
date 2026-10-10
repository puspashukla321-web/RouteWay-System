export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Request failed.');
  }
  return data;
}

export const api = {
  searchRoutes: (from, to) =>
    request(`/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  getStops: () => request('/search/stops'),
  sendFeedback: (payload) => request('/feedback', { method: 'POST', body: payload }),

  adminLogin: (username, password) =>
    request('/admin/login', { method: 'POST', body: { username, password } }),
  getAdminRoutes: (token) => request('/admin/routes', { token }),
  getAdminRoute: (token, id) => request(`/admin/routes/${id}`, { token }),
  createRoute: (token, payload) => request('/admin/routes', { method: 'POST', body: payload, token }),
  updateRoute: (token, id, payload) => request(`/admin/routes/${id}`, { method: 'PUT', body: payload, token }),
  deleteRoute: (token, id) => request(`/admin/routes/${id}`, { method: 'DELETE', token }),
  getAdminStops: (token) => request('/admin/stops', { token }),
  createStop: (token, payload) => request('/admin/stops', { method: 'POST', body: payload, token }),
  deleteStop: (token, id) => request(`/admin/stops/${id}`, { method: 'DELETE', token }),
  getAdminFeedback: (token) => request('/admin/feedback', { token }),
  updateFeedbackStatus: (token, id, status) =>
    request(`/admin/feedback/${id}`, { method: 'PATCH', body: { status }, token }),
};

