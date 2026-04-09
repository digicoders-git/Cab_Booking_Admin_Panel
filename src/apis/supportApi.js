import http from "./http";

const BASE_URL = "/api/support";

// 1. Create Support Ticket (All Panels)
export const createSupportTicket = async (data) => {
  const res = await http.post(`${BASE_URL}/create`, data);
  return res.data;
};

// 2. Get My Tickets History (All Panels)
export const getMyTickets = async () => {
  const res = await http.get(`${BASE_URL}/my-tickets`);
  return res.data;
};

// 3. Admin View: All Tickets (Admin Only)
export const getAllTickets = async () => {
  const res = await http.get(`${BASE_URL}/admin/all`);
  return res.data;
};

// 4. Admin View: Reply & Update Ticket (Admin Only)
export const replyTicket = async (id, reply, status) => {
  const res = await http.put(`${BASE_URL}/admin/reply/${id}`, {
    reply,
    status
  });
  return res.data;
};

// 5. Admin View: Delete Ticket (Admin Only)
export const deleteTicket = async (id) => {
  const res = await http.delete(`${BASE_URL}/admin/delete/${id}`);
  return res.data;
};

export const supportService = {
  createTicket: createSupportTicket,
  getMyTickets,
  getAllTickets,
  replyTicket,
  deleteTicket
};
