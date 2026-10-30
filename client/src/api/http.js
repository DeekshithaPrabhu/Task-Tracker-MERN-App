// Single place that talks to the backend: base URL, cookies, error handling.
export const request = async (path, { body, ...opts } = {}) => {
  let res;
  try {
    res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api${path}`, {
      credentials: "include", // needed so the login cookie is sent to the other domain
      headers: { "Content-Type": "application/json" },
      ...opts,
      body: body && JSON.stringify(body),
    });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }
  // 401 on anything except login or the startup check means the session ended
  if (res.status === 401 && !["/auth/login", "/auth/me"].includes(path)) window.dispatchEvent(new Event("auth:expired"));
  if (!res.ok)
    throw new Error(
      (await res.json().catch(() => ({}))).message ||
        (res.status >= 500 ? "The server is not responding properly. Is the API running?" : "Request failed"),
    );
  return res.status === 204 ? null : res.json();
};

const send = (method) => (path, body) => request(path, { method, body });
export const post = send("POST");
export const patch = send("PATCH");
export const del = (path) => request(path, { method: "DELETE" });
