import http from "./http";

export const getDashboardStats = async () => {
    const response = await http.get(`/api/admin/dashboard-stats`);
    return response.data;
};

export const getAdminProfile = async () => {
    const response = await http.get(`/api/admin/profile`);
    return response.data;
};

export const updateAdminProfile = async (data) => {
    const isFormData = data instanceof FormData;
    const response = await http.put(`/api/admin/profile-update`, data, {
        headers: isFormData ? { "Content-Type": "multipart/form-data" } : {}
    });
    return response.data;
};

export const getAdminNotifications = async () => {
    const response = await http.get(`/api/admin/notifications`);
    return response.data;
};

export const getFullReport = async () => {
    const response = await http.get(`/api/admin/full-report`);
    return response.data;
};

export const updateAdminNotifications = async (id, data) => {
    const response = await http.put(`/api/admin/notifications/${id}`, data);
    return response.data;
};

export const registerSubAdmin = async (data) => {
    const response = await http.post(`/api/admin/subadmin/register`, data);
    return response.data;
};

export const getAllAdmins = async () => {
    const response = await http.get(`/api/admin/subadmin/all`);
    return response.data;
};

export const updateAdminPermissions = async (id, data) => {
    const response = await http.put(`/api/admin/subadmin/permissions/${id}`, data);
    return response.data;
};

export const deleteAdmin = async (id) => {
    const response = await http.delete(`/api/admin/subadmin/${id}`);
    return response.data;
};
