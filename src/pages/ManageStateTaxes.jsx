import { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Trash2, X, Search, Map, Shield, Target, Circle, CheckCircle, XCircle } from "lucide-react";
import { FaEdit, FaTrashAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Toaster, toast } from "sonner";
import Swal from "sweetalert2";
import axios from "axios";
import { useAuth } from "../context/AuthContext"; // Assuming there is an AuthContext with token

const ManageStateTaxes = () => {
  const [data, setData] = useState([]);
  const [carCategories, setCarCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [formData, setFormData] = useState({
    stateName: "",
    taxType: "State Tax",
    carCategory: "",
    amount: 0,
    isActive: true,
    latitude: null,
    longitude: null
  });

  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);

  // Authentication Token (Update headers for admin calls)
  const getAuthHeaders = () => {
    const token = localStorage.getItem("admin-token"); // Must match AuthContext TOKEN_KEY
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // --- 1. DATA FETCHING ---
  const fetchTaxes = async () => {
    try {
      // Backend is at VITE_API_BASE_URL (Assuming backend runs on port 5000 based on standard setup)
      const resp = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/taxes/state-taxes/all`, getAuthHeaders());
      if (resp.data.success) {
        setData(resp.data.data || []);
      }
    } catch (err) {
      console.error("Fetch Taxes Error:", err);
    }
  };

  const fetchCarCategories = async () => {
    try {
      const resp = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/car-categories/active`, getAuthHeaders());
      if (resp.data.success) {
        setCarCategories(resp.data.categories || []);
      }
    } catch (err) {
      console.error("Fetch Car Categories Error:", err);
    }
  };

  useEffect(() => {
    loadGoogleMapsScript();
    fetchTaxes();
    fetchCarCategories();
  }, []);

  // --- GOOGLE MAPS LOGIC ---
  useEffect(() => {
    if (showModal) {
      const timer = setTimeout(() => {
        initAutocomplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showModal]);

  const loadGoogleMapsScript = () => {
    if (window.google || document.getElementById("google-maps-main-script")) return;
    const script = document.createElement("script");
    script.id = "google-maps-main-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    document.head.appendChild(script);
  };

  const initAutocomplete = () => {
    if (!window.google || !searchRef.current) return;

    if (!document.getElementById("google-autocomplete-style")) {
      const style = document.createElement('style');
      style.id = "google-autocomplete-style";
      style.innerHTML = `.pac-container { z-index: 99999 !important; border-radius: 12px; margin-top: 5px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #eee; }`;
      document.head.appendChild(style);
    }

    const autocomplete = new window.google.maps.places.Autocomplete(searchRef.current, {
      types: ["(regions)"],
      componentRestrictions: { country: "in" }
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      setFormData(prev => ({
        ...prev,
        stateName: place.name || place.formatted_address,
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng()
      }));
      
      toast.success(`Location Captured!`);
    });
  };

  // --- 2. FORM OPERATIONS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.stateName || !formData.carCategory || formData.amount < 0) {
      return toast.error("Please fill all required fields correctly");
    }

    setLoading(true);
    try {
      if (editId) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/taxes/state-taxes/${editId}`, formData, getAuthHeaders());
        toast.success("State Tax Updated");
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/taxes/state-taxes`, formData, getAuthHeaders());
        toast.success("State Tax Created");
      }
      setShowModal(false);
      resetForm();
      fetchTaxes();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      stateName: "",
      taxType: "State Tax",
      carCategory: "",
      amount: 0,
      isActive: true,
      latitude: null,
      longitude: null
    });
    setEditId(null);
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setFormData({
      stateName: item.stateName,
      taxType: "State Tax",
      carCategory: item.carCategory?._id || item.carCategory,
      amount: item.amount || 0,
      isActive: item.isActive,
      latitude: item.latitude || null,
      longitude: item.longitude || null
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete State Tax?',
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;
    
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/taxes/state-taxes/${id}`, getAuthHeaders());
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Tax rule has been deleted successfully',
        timer: 2000,
        showConfirmButton: false
      });
      await fetchTaxes();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: err.response?.data?.message || 'Failed to delete tax',
        confirmButtonColor: '#EF4444'
      });
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const result = await Swal.fire({
      title: currentStatus ? 'Deactivate Tax?' : 'Activate Tax?',
      text: currentStatus ? 'This tax will stop applying to new bookings' : 'This tax will start applying to new bookings',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: currentStatus ? '#F59E0B' : '#10B981',
      cancelButtonColor: '#6B7280',
      confirmButtonText: currentStatus ? 'Yes, Deactivate' : 'Yes, Activate',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;
    
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/taxes/state-taxes/${id}`, { 
        isActive: !currentStatus 
      }, getAuthHeaders());
      
      Swal.fire({
        icon: 'success',
        title: currentStatus ? 'Deactivated!' : 'Activated!',
        text: currentStatus ? 'Tax is now inactive' : 'Tax is now active',
        timer: 2000,
        showConfirmButton: false
      });
      
      await fetchTaxes();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: err.response?.data?.message || 'Failed to update status',
        confirmButtonColor: '#EF4444'
      });
    }
  };

  // Filtering Logic
  const filteredData = useMemo(() => {
    if (activeTab === "active") return data.filter(i => i.isActive);
    if (activeTab === "inactive") return data.filter(i => !i.isActive);
    return data;
  }, [data, activeTab]);

  // Pagination Logic
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  useEffect(() => { setCurrentPage(1); }, [activeTab, rowsPerPage]);

  return (
    <div className="p-6 bg-[#F9FAFB] min-h-screen text-gray-800">
      <Toaster 
        richColors 
        position="top-right" 
        expand={true}
        closeButton
        toastOptions={{
          duration: 3000,
          style: {
            background: 'white',
            color: '#333',
            border: '1px solid #e5e7eb',
            fontSize: '14px',
            fontWeight: '500'
          }
        }}
      />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">State Taxes & Tolls</h1>
          <p className="text-sm text-gray-500 mt-1">Manage inter-state entry taxes, MCD, and outstation tolls</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-semibold shadow-lg shadow-blue-600/20 flex items-center gap-2 active:scale-95 text-sm"
        >
          <Plus size={16} /> New Tax Rule
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-50 group-hover:scale-110 transition-transform">
              <Target className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{data.filter(i => i.isActive).length}</p>
          <p className="text-sm text-gray-500">Active Taxes</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-indigo-50 group-hover:scale-110 transition-transform">
              <Map className="text-indigo-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{data.length}</p>
          <p className="text-sm text-gray-500">Total Rules</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-50 group-hover:scale-110 transition-transform">
              <Shield className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">LIVE</p>
          <p className="text-sm text-gray-500">System Status</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tab Filters */}
        <div className="px-6 py-2 border-b border-gray-200 flex items-center gap-4 overflow-x-auto">
          {[
            { id: "all", label: "All Taxes", icon: Map },
            { id: "active", label: "Active", icon: CheckCircle, count: data.filter(i => i.isActive).length },
            { id: "inactive", label: "Inactive", icon: XCircle, count: data.filter(i => !i.isActive).length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 text-xs font-medium transition-all border-b-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">State / City Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Tax Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Car Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Amount (₹)</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <Map size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-400 font-medium">No tax rules found</p>
                    <p className="text-gray-300 text-sm mt-1">Create a new tax rule to get started</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 text-sm capitalize">{item.stateName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Keyword Match</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold border border-purple-100">
                        {item.taxType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-blue-600">{item.carCategory?.name || 'Unknown'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-green-600">₹{item.amount}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleStatus(item._id, item.isActive)}
                        className="inline-flex items-center gap-1.5 transition-all"
                        title={item.isActive ? 'Click to Deactivate' : 'Click to Activate'}
                      >
                        {item.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            <CheckCircle size={12} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-500 rounded-full text-xs font-semibold">
                            <XCircle size={12} /> Inactive
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FaEdit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {[10, 20, 30, 50, 100].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="text-sm text-gray-500">
              Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaChevronLeft size={14} /> Previous
            </button>
            <span className="text-sm text-gray-500">Page {currentPage} of {totalPages || 1}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <FaChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg overflow-y-auto rounded-2xl shadow-2xl">

            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Map size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{editId ? 'Edit State Tax' : 'Add State Tax'}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Set location keyword and tax amount</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">

              {/* Search Location with Google Maps */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search State *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    ref={searchRef}
                    placeholder="Search State (e.g. Uttar Pradesh)"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Selected Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    readOnly
                    value={formData.stateName}
                    onChange={(e) => setFormData({ ...formData, stateName: e.target.value })}
                    placeholder="Auto-filled from search"
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg outline-none text-sm text-gray-600"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">This exact keyword must match the destination address.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tax Type *</label>
                  <input
                    type="text"
                    readOnly
                    value="State Tax"
                    className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Car Category *</label>
                  <select
                    required
                    value={formData.carCategory}
                    onChange={(e) => setFormData({ ...formData, carCategory: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                  >
                    <option value="" disabled>Select Category</option>
                    {carCategories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tax Amount (₹) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.amount === 0 ? '' : formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all font-semibold"
                  placeholder="e.g. 200"
                />
              </div>

              <div className="flex items-center gap-3 mt-4 mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Activate Tax Immediately
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : (editId ? 'Update Tax' : 'Create Tax')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStateTaxes;
