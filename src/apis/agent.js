import http from "./http";

export const createAgent = async (payload) => {
  // Axios automatically sets multipart/form-data if payload is instance of FormData
  const { data } = await http.post("/api/agents/create", payload);
  return data;
};

export const getAgents = async () => {
  const { data } = await http.get("/api/agents/all");
  return data;
};

export const getAgentDetails = async (id) => {
  const { data } = await http.get(`/api/agents/${id}`);
  return data;
};

export const updateAgent = async (id, payload) => {
  const { data } = await http.put(`/api/agents/update/${id}`, payload);
  return data;
};

export const toggleAgentStatus = async (id) => {
  const { data } = await http.put(`/api/agents/toggle-status/${id}`);
  return data;
};

export const deleteAgent = async (id) => {
  const { data } = await http.delete(`/api/agents/delete/${id}`);
  return data;
};

export const getPendingAgents = async () => {
  const { data } = await http.get("/api/agents/pending");
  return data;
};

export const approveAgent = async (id, payload) => {
  const { data } = await http.put(`/api/agents/approve/${id}`, payload);
  return data;
};

export const rejectAgent = async (id) => {
  const { data } = await http.put(`/api/agents/reject/${id}`);
  return data;
};
