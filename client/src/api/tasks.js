import { request, post, patch, del } from "./http.js";

export const tasksApi = {
  stats: () => request("/tasks/stats"),
  tags: () => request("/tasks/tags"),
  list: (f = {}) => request("/tasks?" + new URLSearchParams(Object.entries(f).filter(([, v]) => v))),
  create: (b) => post("/tasks", b),
  task: (id) => request(`/tasks/${id}`),
  update: (id, b) => patch(`/tasks/${id}`, b),
  extend: (id, days) => patch(`/tasks/${id}/extend`, { days }),
  remove: (id) => del(`/tasks/${id}`),

  addSubtask: (id, title) => post(`/tasks/${id}/subtasks`, { title }),
  updateSubtask: (id, sid, b) => patch(`/tasks/${id}/subtasks/${sid}`, b),
  deleteSubtask: (id, sid) => del(`/tasks/${id}/subtasks/${sid}`),

  activity: (id) => request(`/tasks/${id}/activity`),
  addComment: (id, text) => post(`/tasks/${id}/comments`, { text }),
  deleteComment: (id, cid) => del(`/tasks/${id}/comments/${cid}`),

  bulk: (ids, update) => patch("/tasks/bulk", { ids, update }),
  bulkDelete: (ids) => post("/tasks/bulk/delete", { ids }),
};
