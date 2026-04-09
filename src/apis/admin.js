import axios from "axios";

const API_BAR_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const getHeaders = () => {
    const token = localStorage.getItem("admin-token");
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

export const getDashboardStats = async () => {
    const response = await axios.get(`${API_BAR_URL}/admin/dashboard-stats`, getHeaders());
    return response.data;
};

export const getAdminProfile = async () => {
    const response = await axios.get(`${API_BAR_URL}/admin/profile`, getHeaders());
    return response.data;
};

export const updateAdminProfile = async (data) => {
    const response = await axios.put(`${API_BAR_URL}/admin/profile-update`, data, getHeaders());
    return response.data;
};

export const getAdminNotifications = async () => {
    const response = await axios.get(`${API_BAR_URL}/admin/notifications`, getHeaders());
    return response.data;
};

export const getFullReport = async () => {
    const response = await axios.get(`${API_BAR_URL}/admin/full-report`, getHeaders());
    return response.data;
};

export const updateAdminNotifications = async (id, data) => {
    const response = await axios.put(`${API_BAR_URL}/admin/notifications/${id}`, data, getHeaders());
    return response.data;
};

export const registerSubAdmin = async (data) => {
    const response = await axios.post(`${API_BAR_URL}/admin/subadmin/register`, data, getHeaders());
    return response.data;
};

export const getAllAdmins = async () => {
    const response = await axios.get(`${API_BAR_URL}/admin/subadmin/all`, getHeaders());
    return response.data;
};

export const updateAdminPermissions = async (id, data) => {
    const response = await axios.put(`${API_BAR_URL}/admin/subadmin/permissions/${id}`, data, getHeaders());
    return response.data;
};

export const deleteAdmin = async (id) => {
    const response = await axios.delete(`${API_BAR_URL}/admin/subadmin/${id}`, getHeaders());
    return response.data;
};
