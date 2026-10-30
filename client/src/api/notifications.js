import { request } from "./http.js";

export const notificationsApi = {
  notifications: () => request("/notifications"),
};
