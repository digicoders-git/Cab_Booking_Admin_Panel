import http from "./http";

export const getAllFleetCars = async () => {
    try {
        const res = await http.get("/api/fleet/cars/admin/all");
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Error fetching fleet cars" };
    }
};

export const updateFleetCar = async (id, data) => {
    try {
        const res = await http.put(`/api/fleet/cars/update/${id}`, data);
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Error updating car" };
    }
};

export const deleteFleetCar = async (id) => {
    try {
        const res = await http.delete(`/api/fleet/cars/delete/${id}`);
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Error deleting car" };
    }
};
