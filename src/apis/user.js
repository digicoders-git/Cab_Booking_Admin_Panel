import http from "./http";

export const getAllUsers = async () => {
    const res = await http.get("/api/users/all");
    return res.data;
};

export const updateUser = async (id, data) => {
    const res = await http.put(`/api/users/update/${id}`, data);
    return res.data;
};

export const toggleUserStatus = async (id) => {
    const res = await http.put(`/api/users/toggle-status/${id}`);
    return res.data;
};

export const deleteUser = async (id) => {
    const res = await http.delete(`/api/users/delete/${id}`);
    return res.data;
};
