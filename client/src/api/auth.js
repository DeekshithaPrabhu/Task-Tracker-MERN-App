import { request, post, patch } from "./http.js";

export const authApi = {
  register: (b) => post("/auth/register", b),
  login: (b) => post("/auth/login", b),
  logout: () => post("/auth/logout"),
  me: () => request("/auth/me"),
  forgot: (email) => post("/auth/forgot-password", { email }),
  reset: (token, password) => post("/auth/reset-password", { token, password }),
  profile: (b) => patch("/auth/profile", b),
  changePassword: (b) => patch("/auth/password", b),
};
