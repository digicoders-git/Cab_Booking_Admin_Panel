import http from "./http";

export const getAllBookings = async () => {
    try {
        const res = await http.get("/api/bookings/all");
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Network Error" };
    }
};

export const updateBookingStatus = async (id, status) => {
    try {
        const res = await http.put(`/api/bookings/${id}/status`, { status });
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Network Error" };
    }
};

export const deleteBooking = async (id) => {
    try {
        const res = await http.delete(`/api/bookings/delete/${id}`);
        return res.data;
    } catch (err) {
        return err.response?.data || { success: false, message: "Network Error" };
    }
};
