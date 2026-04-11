import http from "./http";

export const createAreaPricing = async (data) => {
    try {
        const res = await http.post("/api/area-pricing", data);
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Network Error" };
    }
};

export const getAllAreaPricings = async () => {
    try {
        const res = await http.get("/api/area-pricing");
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Network Error" };
    }
};

export const updateAreaPricing = async (id, data) => {
    try {
        const res = await http.put(`/api/area-pricing/${id}`, data);
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Network Error" };
    }
};

export const deleteAreaPricing = async (id) => {
    try {
        const res = await http.delete(`/api/area-pricing/${id}`);
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Network Error" };
    }
};
