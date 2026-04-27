import http from "./http";

export const getPendingDrivers = async () => {
  const res = await http.get("/api/drivers/pending");
  return res.data;
};

export const approveDriver = async (id) => {
  const res = await http.put(`/api/drivers/approve/${id}`);
  return res.data;
};

export const rejectDriver = async (id, reason) => {
  const res = await http.put(`/api/drivers/reject/${id}`, { reason });
  return res.data;
};

export const getAllDrivers = async () => {
  const res = await http.get("/api/drivers/all");
  return res.data;
};

export const updateDriver = async (id, payload) => {
  const res = await http.put(`/api/drivers/update/${id}`, payload);
  return res.data;
};

export const toggleDriverStatus = async (id) => {
  const res = await http.put(`/api/drivers/toggle-status/${id}`);
  return res.data;
};

export const getLiveLocations = async () => {
  const res = await http.get("/api/drivers/locations/all");
  return res.data;
};

export const deleteDriver = async (id) => {
  const res = await http.delete(`/api/drivers/delete/${id}`);
  return res.data;
};

export const registerDriver = async (payload) => {
  const res = await http.post("/api/drivers/register", payload);
  return res.data;
};

export const searchDriversByRadius = async (lat, lng, radius) => {
  const res = await http.get(`/api/admin/radius-search?lat=${lat}&lng=${lng}&radius=${radius}`);
  return res.data;
};

export const searchDriversByHomeRadius = async (lat, lng, radius) => {
  const res = await http.get(`/api/admin/home-radius-search?lat=${lat}&lng=${lng}&radius=${radius}`);
  return res.data;
};
