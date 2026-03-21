import http from "./http";

export const getAllNotifications = async () => {
    const res = await http.get("/api/notifications/all");
    return res.data;
};

export const createNotification = async (data) => {
    const res = await http.post("/api/notifications/create", data);
    return res.data;
};

export const toggleNotificationStatus = async (id) => {
    const res = await http.put(`/api/notifications/toggle/${id}`);
    return res.data;
};

export const deleteNotification = async (id) => {
    const res = await http.delete(`/api/notifications/delete/${id}`);
    return res.data;
};
