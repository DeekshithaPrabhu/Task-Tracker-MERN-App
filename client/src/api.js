const request = async (path, { body, ...opts } = {}) => {
  let res;
  try {
    res = await fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts, body: body && JSON.stringify(body) });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }
  // 401 on anything except login or the startup check means the session ended
  if (res.status === 401 && !['/auth/login', '/auth/me'].includes(path)) window.dispatchEvent(new Event('auth:expired'));
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || (res.status >= 500 ? 'The server is not responding properly. Is the API running?' : 'Request failed'));
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

  task: (id) => request(`/tasks/${id}`),
  addSubtask: (id, title) => post(`/tasks/${id}/subtasks`, { title }),
  updateSubtask: (id, sid, b) => patch(`/tasks/${id}/subtasks/${sid}`, b),
  deleteSubtask: (id, sid) => request(`/tasks/${id}/subtasks/${sid}`, { method: 'DELETE' }),
  activity: (id) => request(`/tasks/${id}/activity`),
  addComment: (id, text) => post(`/tasks/${id}/comments`, { text }),
  deleteComment: (id, cid) => request(`/tasks/${id}/comments/${cid}`, { method: 'DELETE' }),
  bulk: (ids, update) => patch('/tasks/bulk', { ids, update }),
  bulkDelete: (ids) => post('/tasks/bulk/delete', { ids }),
  notifications: () => request('/notifications'),

  categories: () => request('/categories'),
  addCategory: (name) => post('/categories', { name }),
  renameCategory: (id, name) => patch(`/categories/${id}`, { name }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
};
