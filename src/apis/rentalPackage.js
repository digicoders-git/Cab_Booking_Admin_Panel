import http from "./http";

export const createRentalPackage = async (data) => {
    const res = await http.post("/api/rentals/package", data);
    return res.data;
};

export const updateRentalPackage = async (id, data) => {
    const res = await http.put(`/api/rentals/package/${id}`, data);
    return res.data;
};

export const getRentalPackagesAdmin = async () => {
    const res = await http.get("/api/rentals/packages/all");
    return res.data;
};

export const getAllRentalBookingsAdmin = async () => {
    const res = await http.get("/api/rentals/bookings/all");
    return res.data;
};

export const deleteRentalBookingAdmin = async (id) => {
    const res = await http.delete(`/api/rentals/bookings/${id}`);
    return res.data;
};

export const toggleRentalPackageStatus = async (id) => {
    const res = await http.put(`/api/rentals/package/${id}/toggle`);
    return res.data;
};

export const deleteRentalPackage = async (id) => {
    const res = await http.delete(`/api/rentals/package/${id}`);
    return res.data;
};
