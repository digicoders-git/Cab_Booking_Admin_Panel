import http from "./http";

/**
 * ==================== ADMIN VENDOR APIS ====================
 */

/** 
 * Create a new vendor (Admin only)
 * @param {Object} vendorData - Vendor details including bank details
 */
export const createVendor = async (vendorData) => {
  const isFormData = vendorData instanceof FormData;
  const response = await http.post('/api/vendors/create', vendorData, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
  });
  return response.data;
};

/** 
 * Get all vendors (Admin only)
 * Fetch list of all vendors with stats and wallet balance.
 */
export const getAllVendors = async () => {
  const response = await http.get('/api/vendors/all');
  return response.data;
};

/** 
 * Get Single Vendor Detail (Admin only)
 * @param {string} id - Vendor ID
 */
export const getVendorById = async (id) => {
  const response = await http.get(`/api/vendors/${id}`);
  return response.data;
};

/** 
 * Update Vendor Information (Admin only)
 * @param {string} id - Vendor ID
 * @param {Object} data - Updated information
 */
export const updateVendor = async (id, data) => {
  const response = await http.put(`/api/vendors/update/${id}`, data);
  return response.data;
};

/** 
 * Update vendor commission percentage (Admin only)
 * @param {string} id - Vendor ID
 * @param {number} commissionPercentage - New commission percentage
 */
export const updateVendorCommission = async (id, commissionPercentage) => {
  const response = await http.patch(`/api/vendors/commission/${id}`, { commissionPercentage });
  return response.data;
};

/** 
 * Toggle vendor active status (Admin only)
 * @param {string} id - Vendor ID
 */
export const toggleVendorStatus = async (id) => {
  const response = await http.patch(`/api/vendors/toggle/${id}`);
  return response.data;
};

/** 
 * Delete Vendor permanently (Admin only)
 * @param {string} id - Vendor ID
 */
export const deleteVendor = async (id) => {
  const response = await http.delete(`/api/vendors/delete/${id}`);
  return response.data;
};

/** 
 * View Vendor Commission History (Admin only)
 * Filter transactions by category 'Vendor Commission'
 */
export const getCommissionHistory = async () => {
  const response = await http.get('/api/wallet/transactions', {
    params: { category: 'Vendor Commission' }
  });
  return response.data;
};

/**
 * ==================== VENDOR DASHBOARD APIS ====================
 */

/** Get vendor dashboard statistics */
export const getVendorDashboardStats = async () => {
  const response = await http.get('/api/vendors/dashboard/stats');
  return response.data;
};

/** Create a new driver under vendor */
export const createDriverByVendor = async (driverData) => {
  const response = await http.post('/api/vendors/create-driver', driverData);
  return response.data;
};

/** Get all drivers under vendor */
export const getVendorDrivers = async () => {
  const response = await http.get('/api/vendors/my/drivers');
  return response.data;
};

/** 
 * ==================== UTILITY ====================
 */

/** Get current vendor info from localStorage */
export const getCurrentVendor = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};
