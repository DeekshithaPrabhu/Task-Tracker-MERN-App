import { request, post, patch, del } from "./http.js";

export const categoriesApi = {
  categories: () => request("/categories"),
  addCategory: (name) => post("/categories", { name }),
  renameCategory: (id, name) => patch(`/categories/${id}`, { name }),
  deleteCategory: (id) => del(`/categories/${id}`),
};
