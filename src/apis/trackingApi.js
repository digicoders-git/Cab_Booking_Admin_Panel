import http from "./http";

const BASE_URL = "/api/admin";

export const getLiveTracking = async () => {
  const res = await http.get(`${BASE_URL}/live-tracking`);
  return res.data;
};

export const getDriversByRadius = async (lat, lng, radius) => {
  const res = await http.get(`${BASE_URL}/radius-search?lat=${lat}&lng=${lng}&radius=${radius}`);
  return res.data;
};

export const trackingService = {
  getLiveTracking,
  getDriversByRadius
};
