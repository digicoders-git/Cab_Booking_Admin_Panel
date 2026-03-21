import http from "./http";

export const getAllFleetAssignments = async () => {
    try {
        const res = await http.get("/api/fleet/assignment/admin/all");
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Error fetching fleet assignments" };
    }
};

export const createFleetAssignment = async (data) => {
    try {
        const res = await http.post("/api/fleet/assignment/create", data);
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Error creating assignment" };
    }
};

export const deleteFleetAssignment = async (id) => {
    try {
        const res = await http.delete(`/api/fleet/assignment/delete/${id}`);
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Error deleting assignment" };
    }
};
