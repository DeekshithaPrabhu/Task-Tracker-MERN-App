import { authApi } from "./auth.js";
import { tasksApi } from "./tasks.js";
import { categoriesApi } from "./categories.js";
import { notificationsApi } from "./notifications.js";

// One object so components call api.login(), api.list(), api.categories() ...
export const api = { ...authApi, ...tasksApi, ...categoriesApi, ...notificationsApi };
