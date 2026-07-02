import http from "./http";

export const getAllAgentLeadsAdmin = async () => {
    const response = await http.get("/api/agent-leads/admin/all");
    return response.data;
};

export const cancelAgentLead = async (leadId) => {
    const response = await http.post(`/api/agent-leads/${leadId}/cancel`);
    return response.data;
};

export const adminAcceptAgentLead = async (leadId) => {
    const response = await http.post(`/api/agent-leads/admin/${leadId}/accept`);
    return response.data;
};

export const adminCompleteAgentLead = async (leadId) => {
    const response = await http.post(`/api/agent-leads/admin/${leadId}/complete`);
    return response.data;
};
