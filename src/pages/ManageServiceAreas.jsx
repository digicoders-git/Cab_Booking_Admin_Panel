import { useState, useEffect, useMemo, useRef } from "react";
import { 
  Plus, Edit2, Trash2, X, Search, MapPin, Globe, Target, 
  Shield, Zap, Circle, Navigation, Activity, CheckCircle, XCircle 
} from "lucide-react";
import { FaEdit, FaTrashAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Toaster, toast } from "sonner";
import Swal from "sweetalert2";
import { 
  getAllServiceAreas, createServiceArea, updateServiceArea, deleteServiceArea 
} from "../apis/serviceArea";

const ManageServiceAreas = () => {
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [formData, setFormData] = useState({
    cityName: "",
    centerLat: null,
    centerLng: null,
    radiusKm: 50,
    isActive: true
  });

  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);

  // --- 1. DATA FETCHING ---
  const fetchData = async () => {
    try {
      const res = await getAllServiceAreas();
      if (res.success) {
        setData(res.areas || []);
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
      types: ["(cities)"],
      componentRestrictions: { country: "in" }
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      setFormData(prev => ({
        ...prev,
        cityName: place.name || place.formatted_address,
        centerLat: place.geometry.location.lat(),
        centerLng: place.geometry.location.lng()
      }));
      
      toast.success(`City Center Locked!`);
    });
  };

  // --- 3. FORM OPERATIONS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.centerLat || !formData.centerLng) {
      return toast.error("Please select a city from the search suggestions");
    }

    setLoading(true);
    try {
      const payload = { ...formData };

      const res = editId 
        ? await updateServiceArea(editId, payload) 
        : await createServiceArea(payload);

      if (res.success) {
        toast.success(editId ? "Service Area Updated" : "New Operational City Added");
        setShowModal(false);
        resetForm();
        fetchData();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      cityName: "",
      centerLat: null,
      centerLng: null,
      radiusKm: 50,
      isActive: true
    });
    setEditId(null);
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setFormData({
      cityName: item.cityName,
      centerLat: item.centerLat,
      centerLng: item.centerLng,
      radiusKm: item.radiusKm || 50,
      isActive: item.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Service Area?',
      text: "All rides in this city will be instantly blocked!",
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
      const res = await deleteServiceArea(id);
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Service area has been removed',
          timer: 2000,
          showConfirmButton: false
        });
        fetchData();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to delete service area',
        confirmButtonColor: '#EF4444'
      });
    }
  };

  const toggleStatus = async (item) => {
    const result = await Swal.fire({
      title: item.isActive ? 'Deactivate Service?' : 'Activate Service?',
      text: item.isActive ? 'Rides will be blocked in this city' : 'Rides will be enabled in this city',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: item.isActive ? '#F59E0B' : '#10B981',
      cancelButtonColor: '#6B7280',
      confirmButtonText: item.isActive ? 'Yes, Deactivate' : 'Yes, Activate',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;
    
    try {
      const res = await updateServiceArea(item._id, { isActive: !item.isActive });
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: item.isActive ? 'Deactivated!' : 'Activated!',
          text: item.isActive ? 'Service is now inactive' : 'Service is now active',
          timer: 2000,
          showConfirmButton: false
        });
        fetchData();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to update status',
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Service Areas</h1>
          <p className="text-sm text-gray-500 mt-1">Define operational cities and service coverage radius</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-semibold shadow-lg shadow-blue-600/20 flex items-center gap-2 active:scale-95 text-sm"
        >
          <Plus size={16} /> New Service City
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-50 group-hover:scale-110 transition-transform">
              <Globe className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{data.length}</p>
          <p className="text-sm text-gray-500">Total Cities</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-50 group-hover:scale-110 transition-transform">
              <Shield className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{data.filter(i => i.isActive).length}</p>
          <p className="text-sm text-gray-500">Active Cities</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-orange-50 group-hover:scale-110 transition-transform">
              <Zap className="text-orange-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{data.filter(i => !i.isActive).length}</p>
          <p className="text-sm text-gray-500">Inactive Cities</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-indigo-50 group-hover:scale-110 transition-transform">
              <Navigation className="text-indigo-600" size={24} />
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
            { id: "all", label: "All Cities", icon: Globe },
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
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">City Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Service Radius</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">GPS Center</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <Globe size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-400 font-medium">No service areas found</p>
                    <p className="text-gray-300 text-sm mt-1">Add a new city to get started</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 text-sm">{item.cityName}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <Circle size={6} className="text-blue-400 fill-blue-400" />
                        Operational Hub
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
                        {item.radiusKm || 50} km
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs text-gray-500 font-mono">
                        {item.centerLat?.toFixed(4)}, {item.centerLng?.toFixed(4)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleStatus(item)}
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

      {/* Modal Interface */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">

            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Globe size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{editId ? 'Edit Service Area' : 'Add Service City'}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Define operational city and coverage radius</p>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search City</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    ref={searchRef}
                    placeholder="Type city name (e.g. Mumbai, Delhi, Pune)"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                  />
                </div>
              </div>

              {/* City Name + Radius */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.cityName}
                    onChange={(e) => setFormData({ ...formData, cityName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                    placeholder="Enter city name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Radius (KM) *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={formData.radiusKm === 0 ? '' : formData.radiusKm}
                    onChange={(e) => setFormData({ ...formData, radiusKm: e.target.value === '' ? '' : parseInt(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm text-center font-semibold transition-all"
                    placeholder="50"
                  />
                </div>
              </div>

              {/* GPS Info */}
              {formData.centerLat && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200 flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Target className="text-green-600" size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-green-700">Location Captured</p>
                    <p className="text-xs text-green-600 font-mono mt-0.5">
                      {formData.centerLat.toFixed(4)}, {formData.centerLng.toFixed(4)}
                    </p>
                  </div>
                </div>
              )}

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
                  {loading ? 'Saving...' : (editId ? 'Update City' : 'Add City')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageServiceAreas;
