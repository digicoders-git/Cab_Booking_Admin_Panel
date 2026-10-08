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

export const getCityWiseReportAPI = async (city) => {
    const response = await http.get(`/api/admin/city-wise-report`, { params: { city } });
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

export const deleteAdmin = async (id) => {    const response = await http.delete(`/api/admin/subadmin/${id}`);
    return response.data;
};

export const getBulkSettings = async () => {
    const response = await http.get(`/api/admin/bulk-settings`);
    return response.data;
};

export const updateBulkSettings = async (data) => {
    const response = await http.put(`/api/admin/bulk-settings`, data);
    return response.data;
};

export const updateFcmToken = async (fcmToken) => {
    const response = await http.put(`/api/admin/update-fcm-token`, { fcmToken });
    return response.data;
};

export const toggleDriverOnline = async (driverId, status) => {
    const response = await http.put(`/api/admin/driver/toggle-online`, { driverId, status });
    return response.data;
};

export const exportTransactionsCSV = async (timeframe) => {
    // responseType: 'blob' is important to handle binary/file data correctly in Axios
    const response = await http.get(`/api/wallet/admin/transactions/export`, {
        params: { timeframe, format: 'csv' },
        responseType: 'blob'
    });
    return response.data;
};

export const getAppSettings = async () => {
    const response = await http.get(`/api/settings`);
    return response.data;
};

export const updateAppSettings = async (data) => {
    const response = await http.put(`/api/settings/toggle-share-ride`, data);
    return response.data;
};

export const exportTaxReportCSV = async (timeframe) => {
    const response = await http.get(`/api/admin/export-tax-report`, {
        params: { timeframe },
        responseType: 'blob'
    });
    return response.data;
};

export const fetchTaxReportData = async (timeframe) => {
    const response = await http.get(`/api/admin/export-tax-report`, {
        params: { timeframe, format: 'json' }
    });
    return response.data;
};

export const getNewBookingsAPI = async () => {
    const response = await http.get('/api/admin/new-bookings');
    return response.data;
};

export const markAllBookingsReadAPI = async () => {
    const response = await http.put('/api/admin/mark-bookings-read');
    return response.data;
};

export const markBookingReadAPI = async (id, type) => {
    const response = await http.put(`/api/admin/mark-booking-read/${id}`, { type });
    return response.data;
};

export const deleteBookingAPI = async (id, type) => {
    const response = await http.delete(`/api/admin/booking/${id}`, { data: { type } });
    return response.data;
};
