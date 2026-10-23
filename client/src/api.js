const request = async (path, { body, ...opts } = {}) => {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' }, ...opts,
    body: body && JSON.stringify(body),
  });
  // A 401 outside the auth screens means the session ended
  if (res.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event('auth:expired'));
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Request failed');
  return res.status === 204 ? null : res.json();
};
const send = (method) => (path, body) => request(path, { method, body });
const post = send('POST'), patch = send('PATCH');

export const api = {
  register: (b) => post('/auth/register', b),
  login: (b) => post('/auth/login', b),
  logout: () => post('/auth/logout'),
  me: () => request('/auth/me'),
  forgot: (email) => post('/auth/forgot-password', { email }),
  reset: (token, password) => post('/auth/reset-password', { token, password }),
  profile: (b) => patch('/auth/profile', b),
  changePassword: (b) => patch('/auth/password', b),

  stats: () => request('/tasks/stats'),
  tags: () => request('/tasks/tags'),
  list: (f = {}) => request('/tasks?' + new URLSearchParams(Object.entries(f).filter(([, v]) => v))),
  create: (b) => post('/tasks', b),
  update: (id, b) => patch(`/tasks/${id}`, b),
  extend: (id, days) => patch(`/tasks/${id}/extend`, { days }),
  remove: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  categories: () => request('/categories'),
  addCategory: (name) => post('/categories', { name }),
  renameCategory: (id, name) => patch(`/categories/${id}`, { name }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
};
