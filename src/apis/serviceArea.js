import http from "./http";

export const getAllServiceAreas = async () => {
    const res = await http.get("/api/service-areas");
    return res.data;
};

export const createServiceArea = async (data) => {
    const res = await http.post("/api/service-areas", data);
    return res.data;
};

export const updateServiceArea = async (id, data) => {
    const res = await http.put(`/api/service-areas/${id}`, data);
    return res.data;
};

export const deleteServiceArea = async (id) => {
    const res = await http.delete(`/api/service-areas/${id}`);
    return res.data;
};
