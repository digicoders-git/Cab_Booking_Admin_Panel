import http from "./http";

export const getAdminProfile = async () => {
  const res = await http.get("/api/admin/profile");
  return res.data;
};

export const updateAdminProfile = async (data) => {
  const res = await http.put("/api/admin/profile-update", data, {
    headers: {
      "Content-Type": data instanceof FormData ? "multipart/form-data" : "application/json",
    },
  });
  return res.data;
};

export const registerAdmin = async (data) => {
  const res = await http.post("/api/admin/register", data);
  return res.data;
};

export const getDashboardStats = async () => {
  const res = await http.get("/api/admin/dashboard-stats");
  return res.data;
};

export const getFullReport = async () => {
  const res = await http.get("/api/admin/full-report");
  return res.data;
};
