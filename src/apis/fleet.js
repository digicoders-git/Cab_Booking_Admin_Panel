import http from "./http";

export const createFleet = async (payload) => {
  // Axios automatically sets multipart/form-data if payload is instance of FormData
  const { data } = await http.post("/api/fleet/create", payload);
  return data;
};

export const getFleets = async () => {
  const { data } = await http.get("/api/fleet/all");
  return data;
};

export const updateFleet = async (id, payload) => {
  // payload can be refined as per user's JSON if no image is present
  const { data } = await http.put(`/api/fleet/update/${id}`, payload);
  return data;
};

export const deleteFleet = async (id) => {
  const { data } = await http.delete(`/api/fleet/delete/${id}`);
  return data;
};

export const toggleFleetStatus = async (id) => {
  const { data } = await http.put(`/api/fleet/toggle-status/${id}`);
  return data;
};
