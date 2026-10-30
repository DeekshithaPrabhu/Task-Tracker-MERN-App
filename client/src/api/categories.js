import { request } from "./http.js";

// Distinct categories already used on tasks (a managed category list arrives with user accounts)
export const categoriesApi = {
  categories: () => request("/tasks/categories"),
};
