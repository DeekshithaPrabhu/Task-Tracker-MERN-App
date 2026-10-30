import { request, post, patch, del } from "./http.js";

export const tasksApi = {
  stats: () => request("/tasks/stats"),
  list: (f = {}) => request("/tasks?" + new URLSearchParams(Object.entries(f).filter(([, v]) => v))),
  create: (b) => post("/tasks", b),
  update: (id, b) => patch(`/tasks/${id}`, b),
  extend: (id, days) => patch(`/tasks/${id}/extend`, { days }),
  remove: (id) => del(`/tasks/${id}`),
};
