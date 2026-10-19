import React, { useState, useEffect, useRef, useMemo } from 'react';
import http from '../apis/http';
import { toast } from 'sonner';
import { 
  FaTrash, 
  FaRoute, 
  FaCar, 
  FaMoneyBillWave, 
  FaMapMarkerAlt,
  FaSearch,
  FaTimes,
  FaRedo,
  FaCrosshairs,
  FaFilter,
  FaExchangeAlt,
  FaSuitcase
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const ManageFixedRoutes = () => {
  const { admin } = useAuth();
  const hasPermission = (permission) => {
    if (admin?.role === "SuperAdmin") return true;
    return admin?.permissions?.includes(permission);
  };
  const [routes, setRoutes] = useState([]);
  const [carCategories, setCarCategories] = useState([]);
  const [formData, setFormData] = useState({
    pickupLocation: '',
    pickupLat: '',
    pickupLng: '',
    dropLocation: '',
    dropLat: '',
    dropLng: '',
    carCategory: '',
    price: '',
    adminCommission: '',
    tripType: 'One-Way',
    maxTimeHours: '',
    extraTimeChargePerHour: '',
    maxDistanceKm: '',
    extraDistanceChargePerKm: '',
    distanceKm: '',
    orderIndex: 0,
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form refs for Create/Edit
  const pickupRef = useRef(null);
  const dropRef = useRef(null);

  // Search & Filter States (Google Maps & text-based)
  const [searchPickup, setSearchPickup] = useState('');
  const [searchDrop, setSearchDrop] = useState('');
  const [searchPickupCoords, setSearchPickupCoords] = useState(null);
  const [searchDropCoords, setSearchDropCoords] = useState(null);
  const [searchRadius, setSearchRadius] = useState(30);
  const [searchCarCategory, setSearchCarCategory] = useState('');
  const [searchStatus, setSearchStatus] = useState('all');
  const [searchTripType, setSearchTripType] = useState('');

  // Search input refs for Google Autocomplete
  const searchPickupRef = useRef(null);
  const searchDropRef = useRef(null);

  useEffect(() => {
    fetchRoutes();
    fetchCategories();
    
    // Slight delay to ensure refs are mounted
    setTimeout(() => {
      initAutocomplete();
    }, 1000);
  }, []);

  // Initialize Search Autocomplete with Google Maps Places
  useEffect(() => {
    const timer = setInterval(() => {
      if (window.google && window.google.maps && window.google.maps.places) {
        if (searchPickupRef.current && !searchPickupRef.current._hasAutocomplete) {
          initSearchPickupAutocomplete();
        }
        if (searchDropRef.current && !searchDropRef.current._hasAutocomplete) {
          initSearchDropAutocomplete();
        }
        if (searchPickupRef.current?._hasAutocomplete && searchDropRef.current?._hasAutocomplete) {
          clearInterval(timer);
        }
      }
    }, 300);

    return () => clearInterval(timer);
  }, [searchPickupRef.current, searchDropRef.current]);

  const initSearchPickupAutocomplete = () => {
    try {
      const el = searchPickupRef.current;
      if (!el || el._hasAutocomplete) return;
      const options = { componentRestrictions: { country: "in" }, fields: ["formatted_address", "geometry", "name"] };
      const auto = new window.google.maps.places.Autocomplete(el, options);
      auto.addListener("place_changed", () => {
        const place = auto.getPlace();
        if (place.geometry && place.geometry.location) {
          const lat = typeof place.geometry.location.lat === 'function' ? place.geometry.location.lat() : place.geometry.location.lat;
          const lng = typeof place.geometry.location.lng === 'function' ? place.geometry.location.lng() : place.geometry.location.lng;
          setSearchPickupCoords({ lat, lng });
          const addr = place.formatted_address || place.name || el.value || '';
          setSearchPickup(addr);
          if (searchPickupRef.current) searchPickupRef.current.value = addr;
        } else if (place.name) {
          setSearchPickup(place.name);
        }
      });
      el._hasAutocomplete = true;
    } catch (e) {
      console.error("Error initializing search pickup autocomplete:", e);
    }
  };

  const initSearchDropAutocomplete = () => {
    try {
      const el = searchDropRef.current;
      if (!el || el._hasAutocomplete) return;
      const options = { componentRestrictions: { country: "in" }, fields: ["formatted_address", "geometry", "name"] };
      const auto = new window.google.maps.places.Autocomplete(el, options);
      auto.addListener("place_changed", () => {
        const place = auto.getPlace();
        if (place.geometry && place.geometry.location) {
          const lat = typeof place.geometry.location.lat === 'function' ? place.geometry.location.lat() : place.geometry.location.lat;
          const lng = typeof place.geometry.location.lng === 'function' ? place.geometry.location.lng() : place.geometry.location.lng;
          setSearchDropCoords({ lat, lng });
          const addr = place.formatted_address || place.name || el.value || '';
          setSearchDrop(addr);
          if (searchDropRef.current) searchDropRef.current.value = addr;
        } else if (place.name) {
          setSearchDrop(place.name);
        }
      });
      el._hasAutocomplete = true;
    } catch (e) {
      console.error("Error initializing search drop autocomplete:", e);
    }
  };

  useEffect(() => {
    if (formData.pickupLat && formData.dropLat && !editingId) {
      calculateDistance(formData.pickupLat, formData.pickupLng, formData.dropLat, formData.dropLng);
    }
  }, [formData.pickupLat, formData.dropLat]);

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    if (!window.google || !window.google.maps) return;
    const origin = new window.google.maps.LatLng(lat1, lng1);
    const destination = new window.google.maps.LatLng(lat2, lng2);
    
    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
      origins: [origin],
      destinations: [destination],
      travelMode: 'DRIVING'
    }, (response, status) => {
      if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
        const dist = response.rows[0].elements[0].distance.value / 1000;
        setFormData(prev => ({ ...prev, distanceKm: dist.toFixed(1) }));
      }
    });
  };

  const initAutocomplete = () => {
    if (!window.google || !window.google.maps) return;
    if (!pickupRef.current || !dropRef.current) return;

    const options = { componentRestrictions: { country: "in" }, fields: ["formatted_address", "geometry"] };

    const pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupRef.current, options);
    const dropAutocomplete = new window.google.maps.places.Autocomplete(dropRef.current, options);

    pickupAutocomplete.addListener("place_changed", () => {
      const place = pickupAutocomplete.getPlace();
      if (place.geometry) {
        setFormData(prev => ({
          ...prev,
          pickupLocation: place.formatted_address,
          pickupLat: place.geometry.location.lat(),
          pickupLng: place.geometry.location.lng()
        }));
      }
    });

    dropAutocomplete.addListener("place_changed", () => {
      const place = dropAutocomplete.getPlace();
      if (place.geometry) {
        setFormData(prev => ({
          ...prev,
          dropLocation: place.formatted_address,
          dropLat: place.geometry.location.lat(),
          dropLng: place.geometry.location.lng()
        }));
      }
    });
  };

  const fetchRoutes = async () => {
    try {
      const res = await http.get('/api/fixed-routes/routes');
      setRoutes(res.data.routes || []);
    } catch (error) {
      toast.error('Failed to load fixed routes');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await http.get('/api/car-categories/all');
      setCarCategories(res.data.categories || []);
    } catch (error) {
      console.warn('Failed to load categories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await http.put(`/api/fixed-routes/routes/${editingId}`, formData);
        toast.success('Route updated successfully');
      } else {
        await http.post('/api/fixed-routes/routes', formData);
        toast.success('Route created successfully');
      }
      fetchRoutes();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save route');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ 
      pickupLocation: '', pickupLat: '', pickupLng: '', 
      dropLocation: '', dropLat: '', dropLng: '', 
      carCategory: '', price: '', adminCommission: '',
      tripType: 'One-Way', maxTimeHours: '', extraTimeChargePerHour: '',
      maxDistanceKm: '', extraDistanceChargePerKm: '',
      distanceKm: '',
      orderIndex: 0,
      isActive: true 
    });
    setEditingId(null);
    if (pickupRef.current) pickupRef.current.value = '';
    if (dropRef.current) dropRef.current.value = '';
  };

  const handleEdit = (route) => {
    setEditingId(route._id);
    setFormData({
      pickupLocation: route.pickupLocation,
      pickupLat: route.pickupLat,
      pickupLng: route.pickupLng,
      dropLocation: route.dropLocation,
      dropLat: route.dropLat,
      dropLng: route.dropLng,
      carCategory: route.carCategory?._id || '',
      price: route.price,
      adminCommission: route.adminCommission,
      tripType: route.tripType || 'One-Way',
      maxTimeHours: route.maxTimeHours || '',
      extraTimeChargePerHour: route.extraTimeChargePerHour || '',
      maxDistanceKm: route.maxDistanceKm || '',
      extraDistanceChargePerKm: route.extraDistanceChargePerKm || '',
      distanceKm: route.distanceKm || '',
      orderIndex: route.orderIndex !== undefined ? route.orderIndex : 0,
      isActive: route.isActive
    });
    if (pickupRef.current) pickupRef.current.value = route.pickupLocation;
    if (dropRef.current) dropRef.current.value = route.dropLocation;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleStatus = async (id) => {
    try {
      await http.put(`/api/fixed-routes/routes/${id}/toggle`);
      toast.success('Route status toggled');
      fetchRoutes();
    } catch (error) {
      toast.error('Failed to toggle status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      try {
        await http.delete(`/api/fixed-routes/routes/${id}`);
        toast.success('Route deleted');
        fetchRoutes();
      } catch (error) {
        toast.error('Failed to delete route');
      }
    }
  };

  const handleClearSearch = () => {
    setSearchPickup('');
    setSearchDrop('');
    setSearchPickupCoords(null);
    setSearchDropCoords(null);
    setSearchRadius(30);
    setSearchCarCategory('');
    setSearchStatus('all');
    setSearchTripType('');
    if (searchPickupRef.current) searchPickupRef.current.value = '';
    if (searchDropRef.current) searchDropRef.current.value = '';
  };

  const handleSwapSearchLocations = () => {
    const tempText = searchPickup;
    const tempCoords = searchPickupCoords;
    setSearchPickup(searchDrop);
    setSearchPickupCoords(searchDropCoords);
    setSearchDrop(tempText);
    setSearchDropCoords(tempCoords);

    if (searchPickupRef.current) searchPickupRef.current.value = searchDrop;
    if (searchDropRef.current) searchDropRef.current.value = tempText;
  };

  const hasActiveSearch = Boolean(
    searchPickup.trim() ||
    searchDrop.trim() ||
    searchPickupCoords ||
    searchDropCoords ||
    searchCarCategory ||
    searchStatus !== 'all' ||
    searchTripType ||
    searchRadius !== 30
  );

  // Filter routes based on Pickup & Drop (using Google Places coordinates / radius and text search)
  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      const qPickup = searchPickup.trim().toLowerCase();
      const qDrop = searchDrop.trim().toLowerCase();
      const routePickup = (route.pickupLocation || '').toLowerCase();
      const routeDrop = (route.dropLocation || '').toLowerCase();

      // 1. Pickup filter
      let matchesPickup = true;
      if (searchPickupCoords && route.pickupLat != null && route.pickupLng != null && searchRadius > 0) {
        const dist = calculateDistanceKm(searchPickupCoords.lat, searchPickupCoords.lng, route.pickupLat, route.pickupLng);
        matchesPickup = (dist !== null && dist <= searchRadius) || (qPickup && routePickup.includes(qPickup));
      } else if (qPickup) {
        matchesPickup = routePickup.includes(qPickup);
      }

      // 2. Drop filter
      let matchesDrop = true;
      if (searchDropCoords && route.dropLat != null && route.dropLng != null && searchRadius > 0) {
        const dist = calculateDistanceKm(searchDropCoords.lat, searchDropCoords.lng, route.dropLat, route.dropLng);
        matchesDrop = (dist !== null && dist <= searchRadius) || (qDrop && routeDrop.includes(qDrop));
      } else if (qDrop) {
        matchesDrop = routeDrop.includes(qDrop);
      }

      // 3. Category filter
      let matchesCat = true;
      if (searchCarCategory) {
        matchesCat = (route.carCategory?._id || route.carCategory) === searchCarCategory;
      }

      // 4. Status filter
      let matchesStatus = true;
      if (searchStatus === 'active') matchesStatus = route.isActive === true;
      if (searchStatus === 'inactive') matchesStatus = route.isActive === false;

      // 5. Trip Type filter
      let matchesTrip = true;
      if (searchTripType) matchesTrip = route.tripType === searchTripType;

      return matchesPickup && matchesDrop && matchesCat && matchesStatus && matchesTrip;
    });
  }, [routes, searchPickup, searchDrop, searchPickupCoords, searchDropCoords, searchRadius, searchCarCategory, searchStatus, searchTripType]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaRoute className="text-indigo-600" /> Manage Fixed Packages
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Create, manage and search fixed route packages with Google Maps location matching.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs shadow-sm">
            Total Packages: {routes.length}
          </span>
        </div>
      </div>
      
      {/* Create Route Form */}
      {(hasPermission('FIXED_ROUTE_CREATE') || (editingId && hasPermission('FIXED_ROUTE_EDIT'))) && (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <h2 className="text-xl text-indigo-600 font-semibold mb-4 border-b border-gray-100 pb-2">
          {editingId ? 'Edit Package' : 'Create New Package'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Pickup Location</label>
            <input type="text" ref={pickupRef} onChange={(e) => setFormData(prev => ({ ...prev, pickupLocation: e.target.value }))} required className="w-full bg-gray-50 border border-gray-300 text-gray-800 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="e.g. Noida" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Drop Location</label>
            <input type="text" ref={dropRef} onChange={(e) => setFormData(prev => ({ ...prev, dropLocation: e.target.value }))} required className="w-full bg-gray-50 border border-gray-300 text-gray-800 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="e.g. Delhi" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Car Category</label>
            <select name="carCategory" value={formData.carCategory} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-300 text-gray-800 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all">
              <option value="">Select Category</option>
              {carCategories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Total Price (₹)</label>
            <input type="number" name="price" value={formData.price} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-300 text-gray-800 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="e.g. 2000" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Admin Commission (₹)</label>
            <input type="number" name="adminCommission" value={formData.adminCommission} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-300 text-gray-800 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="e.g. 100" />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Distance (Km)</label>
            <input type="number" step="0.1" name="distanceKm" value={formData.distanceKm} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 text-gray-800 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="e.g. 15.5" />
          </div>

          {/* NEW: Trip Type */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Trip Type</label>
            <select name="tripType" value={formData.tripType} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 text-gray-800 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all">
              <option value="One-Way">One-Way</option>
              <option value="Round-Trip">Round-Trip</option>
            </select>
          </div>

          {/* NEW: Max Time Limit */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Max Time Limit (Hours) <span className="font-normal text-gray-400">(0 = No Limit)</span></label>
            <input type="number" step="any" name="maxTimeHours" value={formData.maxTimeHours} onChange={handleChange} min="0" className="w-full bg-gray-50 border border-gray-300 text-gray-800 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="e.g. 8" />
          </div>

          {/* NEW: Extra Time Charge */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Extra Time Charge (₹/Hour) <span className="font-normal text-gray-400">(if limit exceeded)</span></label>
            <input type="number" name="extraTimeChargePerHour" value={formData.extraTimeChargePerHour} onChange={handleChange} min="0" className="w-full bg-gray-50 border border-gray-300 text-gray-800 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="e.g. 200" />
          </div>

          {/* NEW: Max Distance Limit */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Max Distance Limit (KM) <span className="font-normal text-gray-400">(0 = No Limit)</span></label>
            <input type="number" step="any" name="maxDistanceKm" value={formData.maxDistanceKm} onChange={handleChange} min="0" className="w-full bg-gray-50 border border-gray-300 text-gray-800 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="e.g. 800" />
          </div>

          {/* NEW: Extra Distance Charge */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Extra Distance Charge (₹/KM)</label>
            <input type="number" name="extraDistanceChargePerKm" value={formData.extraDistanceChargePerKm} onChange={handleChange} min="0" className="w-full bg-gray-50 border border-gray-300 text-gray-800 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="e.g. 15" />
          </div>

          {/* Display Order / Index Number */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Display Order / Index <span className="font-normal text-gray-400">(1 = Top, 2, 3...)</span></label>
            <input type="number" name="orderIndex" value={formData.orderIndex} onChange={handleChange} min="0" className="w-full bg-gray-50 border border-gray-300 text-gray-800 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="e.g. 1" />
          </div>

          <div className="flex items-end space-x-2">
            <button type="submit" disabled={loading} className={`flex-1 ${editingId ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-200`}>
              {loading ? 'Saving...' : (editingId ? 'Update Package' : 'Create Package')}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-200">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      )}

      {/* SEARCH & FILTER SECTION (Google Maps API + City/Location Filter) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <FaSearch className="text-indigo-600 text-sm" /> Search Fixed Packages by Pickup & Drop Location
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Powered by Google Places Autocomplete. Type any location (e.g. Lucknow, Kanpur, Airport) to check available packages.
            </p>
          </div>
          {hasActiveSearch && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <FaRedo className="text-[11px]" /> Reset Filters
            </button>
          )}
        </div>

        {/* Pickup & Drop Search Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center mb-4">
          {/* Pickup Input */}
          <div className="md:col-span-5 relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full ring-4 ring-green-100"></div>
            </div>
            <input
              type="text"
              ref={searchPickupRef}
              value={searchPickup}
              onChange={(e) => {
                setSearchPickup(e.target.value);
                if (!e.target.value.trim()) setSearchPickupCoords(null);
              }}
              placeholder="Search Pickup Location (e.g. Lucknow, Charbagh)..."
              className="w-full pl-9 pr-8 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {searchPickup && (
              <button
                type="button"
                onClick={() => {
                  setSearchPickup('');
                  setSearchPickupCoords(null);
                  if (searchPickupRef.current) searchPickupRef.current.value = '';
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                title="Clear pickup"
              >
                <FaTimes className="text-xs" />
              </button>
            )}
          </div>

          {/* Swap Button */}
          <div className="md:col-span-2 flex justify-center">
            <button
              type="button"
              onClick={handleSwapSearchLocations}
              className="p-2.5 rounded-full bg-gray-100 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 border border-gray-200 transition-all shadow-sm"
              title="Swap Pickup & Drop"
            >
              <FaExchangeAlt className="text-xs" />
            </button>
          </div>

          {/* Drop Input */}
          <div className="md:col-span-5 relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full ring-4 ring-red-100"></div>
            </div>
            <input
              type="text"
              ref={searchDropRef}
              value={searchDrop}
              onChange={(e) => {
                setSearchDrop(e.target.value);
                if (!e.target.value.trim()) setSearchDropCoords(null);
              }}
              placeholder="Search Drop Location (e.g. Kanpur, Delhi, Airport)..."
              className="w-full pl-9 pr-8 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {searchDrop && (
              <button
                type="button"
                onClick={() => {
                  setSearchDrop('');
                  setSearchDropCoords(null);
                  if (searchDropRef.current) searchDropRef.current.value = '';
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                title="Clear drop"
              >
                <FaTimes className="text-xs" />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filters Bar (Radius, Category, Status, Trip Type) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-gray-100 text-xs">
          {/* Radius Selector */}
          <div className="flex items-center flex-wrap gap-2">
            <span className="font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <FaCrosshairs className="text-indigo-500" /> Radius:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[5, 15, 30, 50, 100, -1].map((r) => {
                const isSelected = searchRadius === r;
                const label = r < 0 ? 'All / Exact' : `${r} KM`;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSearchRadius(r)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Car Category */}
            <select
              value={searchCarCategory}
              onChange={(e) => setSearchCarCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {carCategories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>

            {/* Trip Type */}
            <select
              value={searchTripType}
              onChange={(e) => setSearchTripType(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Trip Types</option>
              <option value="One-Way">One-Way</option>
              <option value="Round-Trip">Round-Trip</option>
            </select>

            {/* Status */}
            <select
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Filter summary status */}
          <div className="text-gray-500 font-medium">
            Showing <span className="font-bold text-indigo-600">{filteredRoutes.length}</span> of {routes.length} packages
          </div>
        </div>
      </div>

      {/* Routes List - Card Layout */}
      {routes.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-gray-200">
          <p className="text-gray-500 text-lg">No packages found. Create one above!</p>
        </div>
      ) : filteredRoutes.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm text-center border border-dashed border-gray-300">
          <FaSuitcase className="text-5xl text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 mb-1">No Matching Packages Found</h3>
          <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
            Koi bhi package is pickup/drop location se match nahi hua. Search radius badha ke dekhein ya clear karein.
          </p>
          <button
            type="button"
            onClick={handleClearSearch}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            Clear Search & Show All
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRoutes.map(route => (
            <div 
              key={route._id} 
              className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col"
            >
              {/* Card Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center space-x-2 text-gray-700 font-semibold">
                  <FaCar className="text-indigo-500 text-lg" />
                  <span className="truncate">{route.carCategory?.name || 'Unknown Category'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm" title="Index Number">
                    Index: {route.orderIndex ?? 0}
                  </span>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase ${route.isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                    {route.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Card Body - Route Details */}
              <div className="p-5 flex-grow bg-white">
                <div className="relative pl-6 space-y-5">
                  {/* Vertical Line indicator */}
                  <div className="absolute left-[0.4rem] top-2 bottom-2 w-0.5 bg-gray-200 rounded-full"></div>
                  
                  {/* Pickup */}
                  <div className="relative">
                    <div className="absolute -left-[1.65rem] top-1.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white z-10 shadow-sm"></div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Pickup</p>
                    <p className="text-gray-800 text-sm font-medium line-clamp-2" title={route.pickupLocation}>
                      {route.pickupLocation}
                    </p>
                  </div>

                  {/* Drop */}
                  <div className="relative">
                    <div className="absolute -left-[1.65rem] top-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white z-10 shadow-sm"></div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Drop</p>
                    <p className="text-gray-800 text-sm font-medium line-clamp-2" title={route.dropLocation}>
                      {route.dropLocation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Footer - Pricing & Actions */}
              <div className="p-5 bg-gray-50 border-t border-gray-100 mt-auto">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-[11px] text-gray-500 font-medium mb-0.5">Total Price</p>
                    <p className="text-gray-800 font-bold text-lg">₹{route.price}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-gray-500 font-medium mb-0.5">Admin Comm.</p>
                    <p className="text-indigo-600 font-bold text-lg">₹{route.adminCommission}</p>
                  </div>
                </div>
                {/* Trip Type + Time Info */}
                <div className="flex items-center justify-between text-xs mt-2 mb-1">
                  <div className="flex items-center space-x-1.5">
                    <span className={`px-2 py-0.5 rounded-full font-bold ${route.tripType === 'Round-Trip' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {route.tripType || 'One-Way'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px]">
                      Index No: {route.orderIndex ?? 0}
                    </span>
                  </div>
                  {route.maxTimeHours > 0 ? (
                    <span className="text-orange-600 font-semibold">
                      ⏱ {route.maxTimeHours}h | +₹{route.extraTimeChargePerHour}/hr
                    </span>
                  ) : (
                    <span className="text-gray-400">No Time Limit</span>
                  )}
                </div>
                
                {/* Distance Info */}
                <div className="flex items-center justify-end text-xs mb-1">
                  {route.maxDistanceKm > 0 ? (
                    <span className="text-teal-600 font-semibold">
                      🛣️ {route.maxDistanceKm}km | +₹{route.extraDistanceChargePerKm}/km
                    </span>
                  ) : (
                    <span className="text-gray-400">No Distance Limit</span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  {hasPermission('FIXED_ROUTE_EDIT') && (
                    <button 
                      onClick={() => handleToggleStatus(route._id)} 
                      className={`flex items-center justify-center space-x-1 bg-white border py-2 rounded-lg font-medium text-xs transition-all duration-200 shadow-sm hover:shadow ${route.isActive ? 'text-yellow-600 border-yellow-200 hover:bg-yellow-50' : 'text-green-600 border-green-200 hover:bg-green-50'}`}
                      title={route.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <span>{route.isActive ? 'Off' : 'On'}</span>
                    </button>
                  )}
                  {hasPermission('FIXED_ROUTE_EDIT') && (
                    <button 
                      onClick={() => handleEdit(route)} 
                      className="flex items-center justify-center space-x-1 bg-white hover:bg-indigo-50 text-indigo-500 border border-gray-200 hover:border-indigo-200 py-2 rounded-lg font-medium text-xs transition-all duration-200 shadow-sm hover:shadow"
                    >
                      <span>Edit</span>
                    </button>
                  )}
                  {hasPermission('FIXED_ROUTE_DELETE') && (
                    <button 
                      onClick={() => handleDelete(route._id)} 
                      className="flex items-center justify-center space-x-1 bg-white hover:bg-red-50 text-red-500 border border-gray-200 hover:border-red-200 py-2 rounded-lg font-medium text-xs transition-all duration-200 shadow-sm hover:shadow"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  )}
                  {!hasPermission('FIXED_ROUTE_EDIT') && !hasPermission('FIXED_ROUTE_DELETE') && (
                    <div className="col-span-3 text-center py-2 text-xs text-gray-400 bg-gray-50 rounded-lg">
                      View Only
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageFixedRoutes;
