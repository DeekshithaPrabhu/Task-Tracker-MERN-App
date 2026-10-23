const call = async (url, opts = {}) => {
  const res = await fetch(`/api/tasks${url}`, {
    headers: { 'Content-Type': 'application/json' }, ...opts,
    body: opts.body && JSON.stringify(opts.body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Request failed');
  return res.status === 204 ? null : res.json();
};

export const api = {
  stats: () => call('/stats'),
  list: (f = {}) => call('?' + new URLSearchParams(Object.entries(f).filter(([, v]) => v))),
  create: (body) => call('', { method: 'POST', body }),
  update: (id, body) => call(`/${id}`, { method: 'PATCH', body }),
  extend: (id, days) => call(`/${id}/extend`, { method: 'PATCH', body: { days } }),
  remove: (id) => call(`/${id}`, { method: 'DELETE' }),
};
