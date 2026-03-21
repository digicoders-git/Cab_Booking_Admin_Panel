import http from "./http";

export const adminLogin = async (payload) => {
  const { data } = await http.post("/api/admin/login", payload);
  return data;
};
