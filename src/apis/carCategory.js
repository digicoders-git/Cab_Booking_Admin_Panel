import http from "./http";

export const createCarCategory = async (formData) => {
    try {
        const res = await http.post("/api/car-categories/create", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Network Error" };
    }
};

export const getAllCarCategories = async () => {
    try {
        const res = await http.get("/api/car-categories/all");
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Network Error" };
    }
};

export const updateCarCategory = async (id, formData) => {
    try {
        const res = await http.put(`/api/car-categories/update/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Network Error" };
    }
};

export const deleteCarCategory = async (id) => {
    try {
        const res = await http.delete(`/api/car-categories/delete/${id}`);
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Network Error" };
    }
};
