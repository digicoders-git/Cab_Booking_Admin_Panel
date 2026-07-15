import { useState, useEffect, useRef, useMemo } from "react";
import { Plus, Edit2, Trash2, X, Search, MapPin, Globe, Target, Shield, Zap, Circle, CheckCircle, XCircle } from "lucide-react";
import { FaEdit, FaTrashAlt, FaToggleOn, FaToggleOff, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Toaster, toast } from "sonner";
import Swal from "sweetalert2";
import axios from "axios";

const ManageAreaPricing = () => {
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [formData, setFormData] = useState({
    areaName: "",
    priority: 0,
    centerLat: null,
    centerLng: null,
    radiusKm: 5,
    baseFareMultiplier: 1,
    privateRateMultiplier: 1,
    sharedRateMultiplier: 1,
    validFrom: "",
    validUntil: "",
    daysOfWeek: [],
    startTime: "",
    endTime: ""
  });

  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);

  // --- 1. DATA FETCHING ---
  const fetchData = async () => {
    try {
      const resp = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/area-pricing`);
      if (resp.data.success) {
        setData(resp.data.areas || []);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  useEffect(() => {
    loadGoogleMapsScript();
    fetchData();
  }, []);

  // --- 2. GOOGLE MAPS LOGIC ---
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
      types: ["geocode", "establishment"],
      componentRestrictions: { country: "in" }
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      setFormData(prev => ({
        ...prev,
        areaName: place.name || place.formatted_address,
        centerLat: place.geometry.location.lat(),
        centerLng: place.geometry.location.lng()
      }));
      
      toast.success(`Position Captured!`);
    });
  };

  // --- 3. FORM OPERATIONS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.centerLat || !formData.centerLng) {
      return toast.error("Please select a location from the search suggestions");
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        latitude: formData.centerLat,
        longitude: formData.centerLng,
        location: {
          type: "Point",
          coordinates: [formData.centerLng, formData.centerLat] 
        },
        validFrom: formData.validFrom || null,
        validUntil: formData.validUntil || null,
        daysOfWeek: formData.daysOfWeek || [],
        startTime: formData.startTime || null,
        endTime: formData.endTime || null
      };

      if (editId) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/area-pricing/${editId}`, payload);
        toast.success("Area Pricing Updated");
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/area-pricing`, payload);
        toast.success("Geo-Pricing Zone Created");
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      areaName: "",
      priority: 0,
      centerLat: null,
      centerLng: null,
      radiusKm: 5,
      baseFareMultiplier: 1,
      privateRateMultiplier: 1,
      sharedRateMultiplier: 1,
      validFrom: "",
      validUntil: "",
      daysOfWeek: [],
      startTime: "",
      endTime: ""
    });
    setEditId(null);
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setFormData({
      areaName: item.areaName,
      priority: item.priority || 0,
      centerLat: item.centerLat || item.latitude,
      centerLng: item.centerLng || item.longitude,
      radiusKm: item.radiusKm || 5,
      baseFareMultiplier: item.baseFareMultiplier || 1,
      privateRateMultiplier: item.privateRateMultiplier || 1,
      sharedRateMultiplier: item.sharedRateMultiplier || 1,
      validFrom: item.validFrom ? new Date(new Date(item.validFrom).getTime() - new Date(item.validFrom).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
      validUntil: item.validUntil ? new Date(new Date(item.validUntil).getTime() - new Date(item.validUntil).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
      daysOfWeek: item.daysOfWeek || [],
      startTime: item.startTime || "",
      endTime: item.endTime || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Pricing Zone?',
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
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/area-pricing/${id}`);
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Pricing zone has been deleted successfully',
        timer: 2000,
        showConfirmButton: false
      });
      await fetchData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: err.response?.data?.message || 'Failed to delete zone',
        confirmButtonColor: '#EF4444'
      });
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const result = await Swal.fire({
      title: currentStatus ? 'Deactivate Zone?' : 'Activate Zone?',
      text: currentStatus ? 'This zone will stop applying fare multipliers' : 'This zone will start applying fare multipliers',
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
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/area-pricing/${id}`, { 
        isActive: !currentStatus 
      });
      
      Swal.fire({
        icon: 'success',
        title: currentStatus ? 'Deactivated!' : 'Activated!',
        text: currentStatus ? 'Zone is now inactive' : 'Zone is now active',
        timer: 2000,
        showConfirmButton: false
      });
      
      await fetchData();
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
    let result = data;
    if (activeTab === "active") result = result.filter(i => i.isActive);
    if (activeTab === "inactive") result = result.filter(i => !i.isActive);
    
    if (searchTerm) {
      result = result.filter(i => 
        i.areaName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return result;
  }, [data, activeTab, searchTerm]);

  // Pagination Logic
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  useEffect(() => { setCurrentPage(1); }, [activeTab, rowsPerPage, searchTerm]);

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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Area-Wise Pricing</h1>
          <p className="text-sm text-gray-500 mt-1">Set dynamic fare multipliers for specific locations</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-semibold shadow-lg shadow-blue-600/20 flex items-center gap-2 active:scale-95 text-sm"
        >
          <Plus size={16} /> New Pricing Zone
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
          <p className="text-sm text-gray-500">Active Zones</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-indigo-50 group-hover:scale-110 transition-transform">
              <MapPin className="text-indigo-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{data.length}</p>
          <p className="text-sm text-gray-500">Total Rules</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-orange-50 group-hover:scale-110 transition-transform">
              <Zap className="text-orange-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{data.filter(i => i.baseFareMultiplier > 1).length}</p>
          <p className="text-sm text-gray-500">High Surplus</p>
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
        {/* Tab Filters & Search */}
        <div className="px-6 py-3 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 overflow-x-auto w-full sm:w-auto">
            {[
              { id: "all", label: "All Zones", icon: MapPin },
              { id: "active", label: "Active", icon: CheckCircle, count: data.filter(i => i.isActive).length },
              { id: "inactive", label: "Inactive", icon: XCircle, count: data.filter(i => !i.isActive).length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 text-xs font-medium transition-all border-b-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
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
          {/* Search Bar */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by area name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Zone</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Radius</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Base</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Private</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Shared</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Validity</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Priority</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center">
                    <MapPin size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-400 font-medium">No pricing zones found</p>
                    <p className="text-gray-300 text-sm mt-1">Create a new zone to get started</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 text-sm">{item.areaName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Pricing Zone</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
                        {item.radiusKm || 5} km
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-blue-600">{item.baseFareMultiplier}x</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-indigo-600">{item.privateRateMultiplier}x</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-green-600">{item.sharedRateMultiplier}x</span>
                    </td>
                    <td className="px-6 py-4 text-center text-xs text-gray-600">
                      <div className="flex flex-col gap-1.5 items-center">
                        {/* Recurring Schedule Badge */}
                        {(item.daysOfWeek?.length > 0 || item.startTime) && (
                          <div className="bg-blue-50 border border-blue-100 text-blue-700 px-2 py-1 rounded-md text-[10px] font-bold flex flex-col items-center leading-tight">
                            <span>{item.daysOfWeek?.length > 0 ? item.daysOfWeek.map(d => d.slice(0,3)).join(', ') : 'Daily'}</span>
                            {item.startTime && <span className="text-blue-500">{item.startTime} - {item.endTime}</span>}
                          </div>
                        )}
                        
                        {/* Date Expiry */}
                        {item.validUntil ? (
                           <div className="flex flex-col gap-0.5">
                             <span className="text-[10px] text-gray-400">Expires:</span>
                             <span className="font-semibold">{new Date(item.validUntil).toLocaleString('en-IN', {day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit'})}</span>
                           </div>
                        ) : (
                           !(item.daysOfWeek?.length > 0 || item.startTime) && <span className="text-gray-400">Lifetime</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">L{item.priority}</span>
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
          <div className="bg-white w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl">

            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <MapPin size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{editId ? 'Edit Pricing Zone' : 'Add Pricing Zone'}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Set location and fare multipliers</p>
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

              {/* Search Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search Location</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    ref={searchRef}
                    placeholder="Search area, landmark or pincode"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                  />
                </div>
              </div>

              {/* Display Name + Radius */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Area Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.areaName}
                    onChange={(e) => setFormData({ ...formData, areaName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                    placeholder="e.g. Airport Zone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Radius (KM) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={formData.radiusKm === 0 ? '' : formData.radiusKm}
                    onChange={(e) => setFormData({ ...formData, radiusKm: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm text-center font-semibold transition-all"
                    placeholder="5"
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Priority (0–100)</label>
                <input
                  type="number"
                  required
                  value={formData.priority === 0 ? '' : formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value === '' ? '' : parseInt(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                  placeholder="Higher number = higher priority"
                />
              </div>

              {/* Multipliers */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Fare Multipliers</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Base', key: 'baseFareMultiplier' },
                    { label: 'Private', key: 'privateRateMultiplier' },
                    { label: 'Shared', key: 'sharedRateMultiplier' },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-600 mb-1.5 text-center">{label}</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData[key]}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setFormData({ ...formData, [key]: val === '' ? '' : val });
                          }
                        }}
                        onBlur={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === '.') {
                            setFormData({ ...formData, [key]: 1 });
                          } else {
                            setFormData({ ...formData, [key]: parseFloat(val) || 1 });
                          }
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg text-center py-2.5 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="1.00"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">Default 1.00 = No change</p>
              </div>

              {/* Recurring Peak Time Setup */}
              <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-100">
                <label className="block text-sm font-bold text-gray-800 mb-3">Recurring Peak Hours (Optional)</label>
                
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Select Days</label>
                  <div className="flex flex-wrap gap-2">
                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => (
                      <label key={day} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg cursor-pointer transition-colors ${formData.daysOfWeek.includes(day) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                        <input 
                          type="checkbox" 
                          checked={formData.daysOfWeek.includes(day)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, daysOfWeek: [...formData.daysOfWeek, day] });
                            } else {
                              setFormData({ ...formData, daysOfWeek: formData.daysOfWeek.filter(d => d !== day) });
                            }
                          }}
                          className="hidden"
                        />
                        <span className="text-xs font-semibold">{day.slice(0,3)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Start Time</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">End Time</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Time-Bound Validity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Valid From (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Valid Until (Auto-Expire)</label>
                  <input
                    type="datetime-local"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                  />
                </div>
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
                  {loading ? 'Saving...' : (editId ? 'Update Zone' : 'Create Zone')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAreaPricing;
