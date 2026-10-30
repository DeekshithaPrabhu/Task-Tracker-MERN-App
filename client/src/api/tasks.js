import { request, post, patch } from "./http.js";

export const tasksApi = {
  stats: () => request("/tasks/stats"),
  create: (b) => post("/tasks", b),
  update: (id, b) => patch(`/tasks/${id}`, b),
  extend: (id, days) => patch(`/tasks/${id}/extend`, { days }),
};
