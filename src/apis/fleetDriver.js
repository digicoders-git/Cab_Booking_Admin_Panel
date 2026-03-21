import http from "./http";

export const getAllFleetDrivers = async () => {
    try {
        const res = await http.get("/api/fleet/drivers/admin/all");
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Error fetching fleet drivers" };
    }
};

export const updateFleetDriver = async (id, data) => {
    try {
        const res = await http.put(`/api/fleet/drivers/update/${id}`, data);
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Error updating driver" };
    }
};

export const deleteFleetDriver = async (id) => {
    try {
        const res = await http.delete(`/api/fleet/drivers/delete/${id}`);
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Error deleting driver" };
    }
};

export const toggleDriverApproval = async (id, isApproved) => {
    try {
        const res = await http.put(`/api/fleet/drivers/approve/${id}`, { isApproved });
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Error toggling approval" };
    }
};
