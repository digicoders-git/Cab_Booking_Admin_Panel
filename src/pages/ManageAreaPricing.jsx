import { useState, useEffect, useMemo, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useFont } from "../context/FontContext";
import {
  getAllAreaPricings, createAreaPricing, updateAreaPricing, deleteAreaPricing
} from "../apis/areaPricing";
import {
  FaPlus, FaEdit, FaTrash, FaSyncAlt, FaSearch, FaMapMarkedAlt,
  FaCheckCircle, FaTimes, FaToggleOn, FaToggleOff, FaArrowRight,
  FaMapMarkerAlt, FaTable, FaThLarge, FaEye
} from "react-icons/fa";
import { TrendingUp, Activity, Clock, Filter, MapPin, Search as SearchIcon, LayoutGrid, List } from 'lucide-react';
import { Toaster, toast } from "sonner";
import Swal from "sweetalert2";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl bg-${color}-50 group-hover:scale-110 transition-transform`}>
        <Icon className={`text-${color}-600`} size={24} />
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
    <p className="text-sm text-gray-500">{label}</p>
  </div>
);

export default function ManageAreaPricing() {
  const { themeColors, theme } = useTheme();
  const { admin } = useAuth();
  const { currentFont } = useFont();

  const can = (permission) => {
    if (admin?.role === 'SuperAdmin') return true;
    return admin?.permissions?.includes(permission);
  };

  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(true);
  const [areas, setAreas] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [viewingArea, setViewingArea] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12); // Default 12 per page

  const [formData, setFormData] = useState({
    areaName: "",
    matchingKeywords: [],
    baseFareMultiplier: "",
    privateRateMultiplier: "",
    sharedRateMultiplier: "",
    priority: "",
    currKeyword: "" // For input handling
  });

  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchData();
    loadGoogleMapsScript();
  }, []);

  const loadGoogleMapsScript = () => {
    if (window.google && window.google.maps && window.google.maps.places) {
      return;
    }

    // Check if script already exists to avoid duplicates
    if (document.getElementById("google-maps-script")) return;

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  };

  useEffect(() => {
    if (isModalOpen && !autocompleteRef.current) {
        // Wait a small bit for the modal to render the input
        setTimeout(initAutocomplete, 500);
    } else if (!isModalOpen) {
        autocompleteRef.current = null;
    }
  }, [isModalOpen]);

  const initAutocomplete = () => {
    if (!window.google || !window.google.maps || !window.google.maps.places || !inputRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["(regions)"] // Focus on cities, districts, regions
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.address_components) return;

      const components = place.address_components;
      let pincode = components.find(c => c.types.includes("postal_code"))?.long_name;
      
      const sublocality = components.find(c => c.types.includes("sublocality_level_1"))?.long_name;
      const locality = components.find(c => c.types.includes("locality"))?.long_name;
      const district = components.find(c => c.types.includes("administrative_area_level_2"))?.long_name;

      const cityName = sublocality || locality || district || place.name;

      if (!pincode && window.google && window.google.maps && window.google.maps.places) {
          // 🚀 SMART GPO HUNTER: Fetching main ZIP for broad regions
          const service = new window.google.maps.places.PlacesService(document.createElement('div'));
          service.textSearch({ query: `${cityName} Head Post Office` }, (results, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && results[0]) {
                  const address = results[0].formatted_address || "";
                  const matchedPin = address.match(/\b\d{6}\b/);
                  if (matchedPin) {
                      setFormData(prev => ({ ...prev, currKeyword: matchedPin[0] }));
                      toast.success(`GPO Hunter: Found ${matchedPin[0]} for ${cityName}`);
                  }
              } else {
                  setFormData(prev => ({ ...prev, currKeyword: cityName }));
              }
          });
      } else {
          const finalVal = pincode || cityName;
          if (finalVal) {
            setFormData(prev => ({ ...prev, currKeyword: finalVal }));
            if (pincode) toast.success(`Smart Capture: Detected PIN ${pincode}`);
          }
      }
    });

    autocompleteRef.current = autocomplete;
  };

  const fetchData = async () => {
    try {
      setFetching(true);
      const res = await getAllAreaPricings();
      if (res.success) setAreas(res.areas || []);
    } catch (err) {
      toast.error("Failed to fetch areas");
    } finally {
      setFetching(false);
      setLoading(false);
    }
  };

  const filteredAreas = useMemo(() => {
    setCurrentPage(1); // Reset page on search
    return areas.filter(a =>
      a.areaName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.matchingKeywords?.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [areas, searchQuery]);

  // Paginated View
  const paginatedAreas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAreas.slice(start, start + itemsPerPage);
  }, [filteredAreas, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAreas.length / itemsPerPage);

  const renderPagination = () => {
    if (filteredAreas.length < 12) return null;
    return (
        <div className="mt-auto flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-5 border-t border-gray-200">
            {/* Left: Entries Info & Per Page Selector */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="text-sm text-gray-500 whitespace-nowrap">
                    {filteredAreas.length === 0 ? (
                        "No entries to show"
                    ) : (
                        <>
                            Showing <span className="font-bold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredAreas.length)}</span> of <span className="font-bold text-gray-900">{filteredAreas.length}</span> {filteredAreas.length === 1 ? 'entry' : 'entries'}
                        </>
                    )}
                </div>
                
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Show</span>
                    <select 
                        value={itemsPerPage} 
                        onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                        className="p-1.5 border border-blue-100 rounded-lg text-sm font-bold text-blue-600 bg-blue-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                    >
                        {[12, 24, 36, 48, 60, 72, 84, 96, 120].map(val => (
                            <option key={val} value={val}>{val} items</option>
                        ))}
                    </select>
                </div>
            </div>
            
            {/* Right: Pagination Buttons */}
            <div className="flex items-center gap-2 ml-auto">
                <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className={`px-3 py-2 rounded-xl border border-gray-200 transition-all flex items-center gap-2 text-sm font-bold ${currentPage === 1 ? 'bg-gray-50 text-gray-300 cursor-not-allowed border-gray-100' : 'bg-white text-gray-700 hover:border-blue-500 hover:text-blue-600 shadow-sm'}`}
                >
                    <FaArrowRight className="rotate-180" size={12} />
                    <span>Prev</span>
                </button>

                <div className="hidden sm:flex items-center gap-1.5 mx-2">
                    {Array.from({ length: totalPages }).map((_, i) => (
                        (i + 1 === 1 || i + 1 === totalPages || (i + 1 >= currentPage - 1 && i + 1 <= currentPage + 1)) ? (
                            <button
                                key={i + 1}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-9 h-9 rounded-xl font-bold text-xs transition-all border ${currentPage === i + 1 ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/30 shadow-lg' : 'bg-white text-gray-500 border-gray-100 hover:border-blue-200 hover:text-blue-600'}`}
                            >
                                {i + 1}
                            </button>
                        ) : (
                            (i + 1 === 2 || i + 1 === totalPages - 1) && <span key={i + 1} className="text-gray-300 text-xs">...</span>
                        )
                    ))}
                </div>

                <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className={`px-3 py-2 rounded-xl border border-gray-200 transition-all flex items-center gap-2 text-sm font-bold ${currentPage === totalPages ? 'bg-gray-50 text-gray-300 cursor-not-allowed border-gray-100' : 'bg-white text-gray-700 hover:border-blue-500 hover:text-blue-600 shadow-sm'}`}
                >
                    <span>Next</span>
                    <FaArrowRight size={12} />
                </button>
            </div>
        </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation: Keywords are required
    const finalKeywords = [...formData.matchingKeywords];
    if (formData.currKeyword.trim() && !finalKeywords.includes(formData.currKeyword.trim())) {
      finalKeywords.push(formData.currKeyword.trim());
    }

    if (finalKeywords.length === 0) {
      toast.error("Please add at least one location keyword");
      return;
    }

    const payload = { 
      ...formData,
      matchingKeywords: finalKeywords,
      priority: parseInt(formData.priority) || 0,
      baseFareMultiplier: parseFloat(formData.baseFareMultiplier) || 1,
      privateRateMultiplier: parseFloat(formData.privateRateMultiplier) || 1,
      sharedRateMultiplier: parseFloat(formData.sharedRateMultiplier) || 1
    };
    delete payload.currKeyword;

    try {
      setLoading(true);
      const res = editingArea
        ? await updateAreaPricing(editingArea._id, payload)
        : await createAreaPricing(payload);

      if (res.success) {
        toast.success(editingArea ? "Area Updated" : "Area Created");
        setIsModalOpen(false);
        setEditingArea(null);
        setFormData({ 
          areaName: "", 
          matchingKeywords: [], 
          baseFareMultiplier: "", 
          privateRateMultiplier: "", 
          sharedRateMultiplier: "", 
          priority: "", 
          currKeyword: "" 
        });
        fetchData();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Operation Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const res = await Swal.fire({
      title: "Delete Area Pricing?",
      text: "This area will no longer receive special rates.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      confirmButtonText: "Delete",
      background: themeColors.surface,
      color: themeColors.text
    });

    if (res.isConfirmed) {
      const resp = await deleteAreaPricing(id);
      if (resp.success) {
        toast.success("Area Deleted");
        fetchData();
      }
    }
  };

  const startEdit = (a) => {
    setEditingArea(a);
    setFormData({
      areaName: a.areaName,
      matchingKeywords: a.matchingKeywords || [],
      baseFareMultiplier: a.baseFareMultiplier?.toString() || "",
      privateRateMultiplier: a.privateRateMultiplier?.toString() || "",
      sharedRateMultiplier: a.sharedRateMultiplier?.toString() || "",
      priority: a.priority?.toString() || "",
      currKeyword: ""
    });
    setIsModalOpen(true);
  };

  const handleToggle = async (a) => {
    const res = await updateAreaPricing(a._id, { isActive: !a.isActive });
    if (res.success) {
      toast.success(`${a.areaName} ${!a.isActive ? 'Activated' : 'Suspended'}`);
      fetchData();
    }
  };

  const startView = (a) => {
    setViewingArea(a);
    setIsViewModalOpen(true);
  };

  const addKeyword = () => {
    if (!formData.currKeyword.trim()) return;
    if (formData.matchingKeywords.includes(formData.currKeyword.trim())) return;
    setFormData(prev => ({
      ...prev,
      matchingKeywords: [...prev.matchingKeywords, prev.currKeyword.trim()],
      currKeyword: ""
    }));
  };

  const removeKeyword = (idx) => {
    setFormData(prev => ({
      ...prev,
      matchingKeywords: prev.matchingKeywords.filter((_, i) => i !== idx)
    }));
  };

  if (loading && areas.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-gray-500">Loading Area Pricing...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" style={{ fontFamily: currentFont }}>
      <Toaster richColors position="top-right" />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Dynamic Pricing</span>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Area Wise Pricing</h1>
            <p className="text-[11px] sm:text-sm text-gray-500 mt-1">Manage special rates for specific Districts or Zones</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* View Toggle */}
            <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                    title="Grid View"
                >
                    <LayoutGrid size={18} />
                </button>
                <button
                    onClick={() => setViewMode("table")}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                    title="Table View"
                >
                    <List size={18} />
                </button>
            </div>

            {can('CAT_MANAGE') && (
              <button
                onClick={() => { setEditingArea(null); setIsModalOpen(true); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
              >
                <FaPlus size={14} />
                <span>New Area Rule</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FaMapMarkedAlt} label="Total Defined Areas" value={areas.length} color="blue" />
        <StatCard icon={TrendingUp} label="Surge Areas" value={areas.filter(a => a.privateRateMultiplier > 1 || a.sharedRateMultiplier > 1 || a.baseFareMultiplier > 1).length} color="orange" />
        <StatCard icon={FaCheckCircle} label="Active Rules" value={areas.filter(a => a.isActive).length} color="green" />
        <StatCard icon={FaTimes} label="Inactive Pricing" value={areas.filter(a => !a.isActive).length} color="red" />
      </div>
      {/* Search */}
      <div className="mb-6 mt-8">
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by area name or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      </div>

      {/* Areas Content (Grid or Table) */}
      {viewMode === "grid" ? (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedAreas.map((a) => (
                <div
                    key={a._id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all group p-6"
                >
                    <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <FaMapMarkerAlt size={20} />
                        </div>
                        <div>
                        <h3 className="text-lg font-bold text-gray-900">{a.areaName}</h3>
                        <div className="flex gap-2 items-center">
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${a.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                {a.isActive ? 'Active' : 'Offline'}
                            </span>
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                                P: {a.priority || 0}
                            </span>
                        </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => startView(a)} className="p-2 hover:bg-gray-50 rounded text-gray-600" title="View Details"><FaEye size={14} /></button>
                        <button onClick={() => startEdit(a)} className="p-2 hover:bg-blue-50 rounded text-blue-600"><FaEdit size={14} /></button>
                        <button onClick={() => handleDelete(a._id)} className="p-2 hover:bg-red-50 rounded text-red-600"><FaTrash size={14} /></button>
                    </div>
                    </div>

                    <div className="mb-4">
                    <p className="text-xs text-gray-400 uppercase font-bold mb-2">Matching Keywords</p>
                    <div className="flex flex-wrap gap-1">
                        {a.matchingKeywords?.map((kw, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 border border-gray-200">
                            {kw}
                        </span>
                        ))}
                    </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-gray-50 p-2 rounded border border-gray-100">
                        <span className="text-[10px] text-gray-500 block uppercase">Base Mult.</span>
                        <span className="font-bold text-gray-900 text-sm">
                        {a.baseFareMultiplier}x
                        </span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded border border-gray-100">
                        <span className="text-[10px] text-gray-500 block uppercase">Private Mult.</span>
                        <span className="font-bold text-gray-900 text-sm">
                        {a.privateRateMultiplier}x
                        </span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded border border-gray-100">
                        <span className="text-[10px] text-gray-500 block uppercase">Shared Mult.</span>
                        <span className="font-bold text-gray-900 text-sm">
                        {a.sharedRateMultiplier}x
                        </span>
                    </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <button
                        onClick={() => handleToggle(a)}
                        className={`flex items-center gap-2 text-sm ${a.isActive ? 'text-green-600' : 'text-gray-400'}`}
                        >
                        {a.isActive ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                        <span>{a.isActive ? 'Enabled' : 'Disabled'}</span>
                        </button>
                    </div>
                </div>
                ))}
            </div>
            {/* Grid Pagination - Modern Look */}
            {filteredAreas.length > 0 && renderPagination()}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Area Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Keywords</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Base</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Private</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Shared</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Priority</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {paginatedAreas.map((a) => (
                            <tr key={a._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-blue-50 rounded text-blue-600">
                                            <FaMapMarkerAlt size={14} />
                                        </div>
                                        <span className="font-bold text-gray-900">{a.areaName}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                        {a.matchingKeywords?.slice(0, 3).map((kw, i) => (
                                            <span key={i} className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-600 border border-gray-200">
                                                {kw}
                                            </span>
                                        ))}
                                        {a.matchingKeywords?.length > 3 && (
                                            <span className="text-[10px] text-gray-400">+{a.matchingKeywords.length - 3} more</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center font-semibold text-gray-700">{a.baseFareMultiplier}x</td>
                                <td className="px-6 py-4 text-center font-semibold text-gray-700 text-blue-600">{a.privateRateMultiplier}x</td>
                                <td className="px-6 py-4 text-center font-semibold text-gray-700 text-orange-600">{a.sharedRateMultiplier}x</td>
                                <td className="px-6 py-4 text-center font-bold text-gray-500">{a.priority || 0}</td>
                                <td className="px-6 py-4 text-center">
                                    <button onClick={() => handleToggle(a)} className={a.isActive ? "text-green-600" : "text-gray-300"}>
                                        {a.isActive ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => startView(a)} className="p-2 hover:bg-gray-50 rounded text-gray-600" title="View Details"><FaEye size={14} /></button>
                                        <button onClick={() => startEdit(a)} className="p-2 hover:bg-blue-50 rounded text-blue-600"><FaEdit size={14} /></button>
                                        <button onClick={() => handleDelete(a._id)} className="p-2 hover:bg-red-50 rounded text-red-600"><FaTrash size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredAreas.length === 0 && (
                    <div className="p-10 text-center text-gray-500">No areas found.</div>
                )}
            </div>
            {/* Integrated Pagination Inside Border */}
            {filteredAreas.length > 0 && renderPagination()}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {editingArea ? 'Edit Area Rule' : 'New Area Rule'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <FaTimes size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Display Name *</label>
                    <input
                    type="text"
                    value={formData.areaName}
                    onChange={(e) => setFormData({ ...formData, areaName: e.target.value })}
                    required
                    placeholder="e.g. Ghazipur City"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Priority (Hierarchy) *</label>
                    <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                    />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Search Location (Google Maps) *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search District or City (e.g. Ghazipur)"
                        className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none bg-blue-50/30"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={addKeyword} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold"
                  >
                    Add
                  </button>
                </div>
                {formData.currKeyword && (
                    <p className="text-[10px] text-green-600 font-medium">✨ Selected: {formData.currKeyword}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {formData.matchingKeywords.map((kw, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
                      {kw}
                      <FaTimes className="cursor-pointer" onClick={() => removeKeyword(i)} />
                    </span>
                  ))}
                </div>
              </div>

              <hr />

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                   <label className="block text-[10px] font-bold text-gray-500 uppercase">Base Fare Multiplier</label>
                   <input
                    type="number"
                    step="0.1"
                    value={formData.baseFareMultiplier}
                    onChange={(e) => setFormData({ ...formData, baseFareMultiplier: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                   />
                </div>
                <div className="space-y-2">
                   <label className="block text-[10px] font-bold text-gray-500 uppercase">Private Rate Multiplier</label>
                   <input
                    type="number"
                    step="0.1"
                    value={formData.privateRateMultiplier}
                    onChange={(e) => setFormData({ ...formData, privateRateMultiplier: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                   />
                </div>
                <div className="space-y-2">
                   <label className="block text-[10px] font-bold text-gray-500 uppercase">Shared Rate Multiplier</label>
                   <input
                    type="number"
                    step="0.1"
                    value={formData.sharedRateMultiplier}
                    onChange={(e) => setFormData({ ...formData, sharedRateMultiplier: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                   />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700">
                  {editingArea ? 'Update Rule' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* View Detail Modal */}
      {isViewModalOpen && viewingArea && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
                <div className="p-6 bg-blue-600 text-white flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold">{viewingArea.areaName}</h2>
                        <p className="text-xs text-blue-100 opacity-80 uppercase tracking-widest font-bold">Pricing Policy Details</p>
                    </div>
                    <button onClick={() => setIsViewModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
                        <FaTimes size={18} />
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Target Locations (Keywords)</p>
                        <div className="flex flex-wrap gap-2">
                            {viewingArea.matchingKeywords?.map((kw, i) => (
                                <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200">
                                    {kw}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Base Multiplier</p>
                            <p className="text-xl font-bold text-gray-900">{viewingArea.baseFareMultiplier}x</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Priority Level</p>
                            <p className="text-xl font-bold text-gray-900">{viewingArea.priority || 0}</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Private Multiplier</p>
                            <p className="text-xl font-bold text-blue-600">{viewingArea.privateRateMultiplier}x</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                            <p className="text-[10px] text-orange-400 font-bold uppercase mb-1">Shared Multiplier</p>
                            <p className="text-xl font-bold text-orange-600">{viewingArea.sharedRateMultiplier}x</p>
                        </div>
                    </div>

                    <div className={`p-4 rounded-xl flex items-center justify-between ${viewingArea.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <span className="text-sm font-bold uppercase">Status</span>
                        <span className="text-sm font-bold">{viewingArea.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                    </div>

                    <button 
                        onClick={() => setIsViewModalOpen(false)}
                        className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:bg-black transition-all"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
