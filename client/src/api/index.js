import { tasksApi } from "./tasks.js";

// One object so components call api.login(), api.list(), api.categories() ...
export const api = { ...tasksApi };
