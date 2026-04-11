import { useState, useEffect, useMemo, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useFont } from "../context/FontContext";
import {
  getAllServiceAreas, createServiceArea, updateServiceArea, deleteServiceArea
} from "../apis/serviceArea";
import {
  FaPlus, FaEdit, FaTrash, FaSyncAlt, FaSearch, FaMapMarkedAlt,
  FaCheckCircle, FaTimes, FaToggleOn, FaToggleOff, FaArrowRight,
  FaMapMarkerAlt, FaGlobe
} from "react-icons/fa";
import { TrendingUp, Activity, MapPin, Search as SearchIcon, ShieldCheck } from 'lucide-react';
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

export default function ManageServiceAreas() {
  const { themeColors } = useTheme();
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

  const [formData, setFormData] = useState({
    cityName: "",
    pincodes: [],
    searchInput: ""
  });

  const searchInputRef = useRef(null);
  const autocomplete = useRef(null);

  useEffect(() => {
    fetchData();
    loadGoogleMapsScript();
  }, []);

  const loadGoogleMapsScript = () => {
    if (window.google && window.google.maps && window.google.maps.places) return;
    if (document.getElementById("google-maps-script")) return;
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  };

  useEffect(() => {
    if (isModalOpen) {
        const timer = setTimeout(() => {
          if (!window.google || !window.google.maps || !window.google.maps.places || !searchInputRef.current) return;
          
          autocomplete.current = new window.google.maps.places.Autocomplete(searchInputRef.current, {
             types: ["geocode"] 
          });

          autocomplete.current.addListener("place_changed", () => {
             const place = autocomplete.current.getPlace();
             if (!place.address_components) return;

             const components = place.address_components;
             
             const district = components.find(c => c.types.includes("administrative_area_level_2"))?.long_name;
             const locality = components.find(c => c.types.includes("locality"))?.long_name;
             const cleanName = (n) => n ? n.replace(/ Division/gi, "").replace(/ Mandal/gi, "").trim() : "";
             let pincode = components.find(c => c.types.includes("postal_code"))?.long_name;
             const finalCity = cleanName(locality || district || place.name);

             if (!pincode && window.google && window.google.maps && window.google.maps.places) {
                // 🚀 SMART GPO HUNTER: Secondary search for District Head Post Office
                const service = new window.google.maps.places.PlacesService(document.createElement('div'));
                service.textSearch({ query: `${finalCity} Head Post Office` }, (results, status) => {
                    if (status === window.google.maps.places.PlacesServiceStatus.OK && results[0]) {
                        const address = results[0].formatted_address || "";
                        const matchedPin = address.match(/\b\d{6}\b/);
                        if (matchedPin) {
                            setFormData(prev => ({ ...prev, cityName: finalCity, pincodes: [matchedPin[0]] }));
                            toast.success(`GPO Hunter: Found ${matchedPin[0]} for ${finalCity}`);
                        }
                    } else {
                        setFormData({ cityName: finalCity, pincodes: [], searchInput: "" });
                        toast.warning(`Detected ${finalCity}, but Pincode is elusive. Please try a specific area.`);
                    }
                });
             } else {
                setFormData({
                    cityName: finalCity,
                    pincodes: pincode ? [pincode] : [],
                    searchInput: "" 
                });
                if (pincode) toast.success(`Detected ${finalCity} (${pincode})`);
             }
          });
        }, 500);
        return () => clearTimeout(timer);
    } else {
        autocomplete.current = null;
        setFormData({ cityName: "", pincodes: [], searchInput: "" });
    }
  }, [isModalOpen]);

  const fetchData = async () => {
    try {
      setFetching(true);
      const res = await getAllServiceAreas();
      if (res.success) setAreas(res.areas || []);
    } catch (err) {
      toast.error("Failed to fetch service areas");
    } finally {
      setFetching(false);
      setLoading(false);
    }
  };

  const filteredAreas = useMemo(() => {
    return areas.filter(a =>
      a.cityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.pincodes?.some(p => p.includes(searchQuery))
    );
  }, [areas, searchQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cityName) return toast.error("Please search for a location first");

    // 1. --- CITY NAME DUPLICATE CHECK ---
    const lowerCity = formData.cityName.trim().toLowerCase();
    const cityExists = areas.find(a => 
      a.cityName.toLowerCase() === lowerCity && (!editingArea || a._id !== editingArea._id)
    );

    if (cityExists) {
      return Swal.fire({
        title: 'City Already Registered!',
        text: `${formData.cityName} is already in your service list.`,
        icon: 'warning',
        confirmButtonColor: '#3B82F6'
      });
    }

    // 2. --- PINCODE CONFLICT DETECTION ---
    const conflictingPin = formData.pincodes.find(pin => 
        areas.some(area => area.pincodes.includes(pin) && (!editingArea || area._id !== editingArea._id))
    );

    if (conflictingPin) {
        const ownerArea = areas.find(a => a.pincodes.includes(conflictingPin));
        return Swal.fire({
            title: 'Pincode Already Exists!',
            text: `Pincode ${conflictingPin} is already active under "${ownerArea.cityName}".`,
            icon: 'error',
            confirmButtonColor: '#EF4444'
        });
    }

    const payload = { cityName: formData.cityName, pincodes: formData.pincodes };

    try {
      setLoading(true);
      const res = editingArea ? await updateServiceArea(editingArea._id, payload) : await createServiceArea(payload);
      if (res.success) {
        toast.success(editingArea ? "Updated" : "Created");
        setIsModalOpen(false);
        setEditingArea(null);
        setFormData({ cityName: "", pincodes: [], searchInput: "" });
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
    const res = await Swal.fire({ title: "Remove Service Area?", text: "Bookings from this city will be blocked.", icon: "warning", showCancelButton: true, confirmButtonColor: "#EF4444", confirmButtonText: "Remove" });
    if (res.isConfirmed) {
      const resp = await deleteServiceArea(id);
      if (resp.success) {
        toast.success("Service Area Removed");
        fetchData();
      }
    }
  };

  const startEdit = (a) => {
    setEditingArea(a);
    setFormData({ cityName: a.cityName, pincodes: a.pincodes || [], manualInput: "" });
    setIsModalOpen(true);
  };

  const handleToggle = async (a) => {
    const res = await updateServiceArea(a._id, { isActive: !a.isActive });
    if (res.success) {
      toast.success(`${a.cityName} ${!a.isActive ? 'Activated' : 'Suspended'}`);
      fetchData();
    }
  };

  if (loading && areas.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-gray-500">Loading Regions...</p>
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
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Service Management</span>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Serviceable Regions</h1>
            <p className="text-sm text-gray-500 mt-1">Manage cities and pincodes where your cabs operate</p>
          </div>
          <div className="flex gap-3">
            {can('CAT_MANAGE') && (
              <button
                onClick={() => { setEditingArea(null); setIsModalOpen(true); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
              >
                <FaPlus size={14} />
                <span>Add Active City</span>
              </button>
            )}
            <button onClick={fetchData} className="p-3 border border-gray-300 rounded-lg bg-white shadow-sm hover:bg-gray-50">
              <FaSyncAlt className={fetching ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard icon={FaGlobe} label="Total Cities" value={areas.length} color="blue" />
        <StatCard icon={ShieldCheck} label="Operational Areas" value={areas.filter(a => a.isActive).length} color="green" />
        <StatCard icon={MapPin} label="Total Pincodes" value={areas.reduce((acc, a) => acc + a.pincodes.length, 0)} color="orange" />
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search for an operational city or pincode..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm"
        />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAreas.map(a => (
          <div key={a._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl font-bold">
                  {a.cityName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{a.cityName}</h3>
                  <span className={`text-[10px] font-bold uppercase ${a.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {a.isActive ? 'Online' : 'Service Suspended'}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(a)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 shadow-sm"><FaEdit /></button>
                <button onClick={() => handleDelete(a._id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400 shadow-sm"><FaTrash /></button>
              </div>
            </div>

            <div className="mb-4">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Pincodes Supported</p>
               <div className="flex flex-wrap gap-1.5">
                  {a.pincodes.length > 0 ? a.pincodes.map((pin, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-50 border border-gray-100 rounded text-xs font-mono text-gray-600">
                      {pin}
                    </span>
                  )) : <span className="text-xs text-gray-400 italic">No specific pincodes added.</span>}
               </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2">
                   <button onClick={() => handleToggle(a)}>
                      {a.isActive ? <FaToggleOn className="text-green-500 text-2xl" /> : <FaToggleOff className="text-gray-300 text-2xl" />}
                   </button>
                   <span className="text-xs font-bold text-gray-500">{a.isActive ? 'Live' : 'Paused'}</span>
                </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[999]">
           <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              
              {/* Clean Header */}
              <div className="p-8 pb-4 text-center">
                 <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                    <MapPin size={28} />
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900">Add Service Region</h2>
                 <p className="text-sm text-gray-500 mt-1">Search or type location to detect area details</p>
                 <button onClick={() => setIsModalOpen(false)} className="absolute right-6 top-6 p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <FaTimes size={18} />
                 </button>
              </div>

              {/* Simple Form */}
              <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
                 <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Search Location</label>
                    <div className="relative">
                       <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                       <input 
                        ref={searchInputRef}
                        type="text"
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all font-medium text-gray-700"
                        placeholder="Search City, Village or Pincode..."
                       />
                    </div>
                 </div>

                 {/* Clean Result Card */}
                 {formData.cityName ? (
                     <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center animate-in slide-in-from-top-2">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Detected City</p>
                            <h4 className="text-xl font-bold text-gray-900">{formData.cityName}</h4>
                        </div>
                        {formData.pincodes.length > 0 && (
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Pincode</p>
                                <div className="text-xl font-mono font-bold text-blue-600">
                                    {formData.pincodes[0]}
                                </div>
                            </div>
                        )}
                     </div>
                 ) : (
                    <div className="py-8 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                        <Activity className="mx-auto text-gray-200 mb-2" size={32} />
                        <p className="text-[11px] font-bold text-gray-400 uppercase italic">Waiting for search...</p>
                    </div>
                 )}

                 <div className="pt-4 flex items-center gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors border border-transparent hover:bg-gray-50 rounded-xl">Discard</button>
                    <button 
                        type="submit" 
                        disabled={loading || !formData.cityName} 
                        className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
                    >
                       {loading ? 'Saving...' : (editingArea ? 'Update Service' : 'Confirm Service')}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
