import axios from "axios";

const http = axios.create({
  baseURL: "http://localhost:5000",
  headers: {},
});

// Attach token to every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default http;
