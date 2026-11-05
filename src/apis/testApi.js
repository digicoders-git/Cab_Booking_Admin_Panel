import http from "./http";

// POST /api/test - Save test name & password
export const createTestAPI = async (data) => {
    const res = await http.post("/api/test", data);
    return res.data;
};

// GET /api/test - Get all saved test records
export const getTestsAPI = async () => {
    const res = await http.get("/api/test");
    return res.data;
};

// DELETE /api/test/:id - Delete test record
export const deleteTestAPI = async (id) => {
    const res = await http.delete(`/api/test/${id}`);
    return res.data;
};

