// Single place that talks to the backend: base URL, cookies, error handling.
export const request = async (path, { body, ...opts } = {}) => {
  const res = await fetch(`/api${path}`, { headers: { "Content-Type": "application/json" }, ...opts, body: body && JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Request failed");
  return res.status === 204 ? null : res.json();
};

const send = (method) => (path, body) => request(path, { method, body });
export const post = send("POST");
export const patch = send("PATCH");
export const del = (path) => request(path, { method: "DELETE" });
