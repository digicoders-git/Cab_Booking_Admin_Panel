import http from "./http";

export const createBulkBooking = async (data) => {
    try {
        const res = await http.post("/api/bulk-bookings/create", data);
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Network Error" };
    }
};

export const getBulkMarketplace = async () => {
    try {
        const res = await http.get("/api/bulk-bookings/marketplace");
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Network Error" };
    }
};

export const acceptBulkBooking = async (id) => {
    try {
        const res = await http.post(`/api/bulk-bookings/accept/${id}`);
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Network Error" };
    }
};

export const getMyBulkRides = async () => {
    try {
        const res = await http.get("/api/bulk-bookings/my-bulk-rides");
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Network Error" };
    }
};

export const getMyCreatedRequests = async () => {
    try {
        const res = await http.get("/api/bulk-bookings/my-requests");
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Network Error" };
    }
};

export const cancelBulkBooking = async (id) => {
    try {
        const res = await http.delete(`/api/bulk-bookings/cancel/${id}`);
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Network Error" };
    }
};

export const deleteBulkBooking = async (id) => {
    try {
        const res = await http.delete(`/api/bulk-bookings/delete/${id}`);
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Network Error" };
    }
};
