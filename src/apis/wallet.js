import http from "./http";

export const getAllTransactions = async () => {
  const res = await http.get("/api/wallet/admin/transactions/all");
  return res.data;
};

export const getPendingPayouts = async () => {
  const res = await http.get("/api/wallet/admin/payouts/pending");
  return res.data;
};

export const approvePayout = async (transactionId) => {
  const res = await http.put(`/api/wallet/admin/payouts/${transactionId}/approve`);
  return res.data;
};

export const rejectPayout = async (transactionId, reason) => {
  const res = await http.put(`/api/wallet/admin/payouts/${transactionId}/reject`, { reason });
  return res.data;
};

export const updateFleetWallet = async (fleetId, amount, type) => {
  const res = await http.put(`/api/fleet/update-wallet/${fleetId}`, { amount, type });
  return res.data;
};

export const getAdminWallet = async () => {
  const res = await http.get("/api/wallet/my-wallet");
  return res.data;
};

export const addManualBalance = async (targetUserId, targetUserModel, amount, description) => {
  const res = await http.post("/api/wallet/admin/wallet/add-balance", {
    targetUserId,
    targetUserModel,
    amount,
    description
  });
  return res.data;
};
