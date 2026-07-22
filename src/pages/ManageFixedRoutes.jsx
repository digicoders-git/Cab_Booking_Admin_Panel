import React, { useState, useEffect, useRef } from 'react';
import http from '../apis/http';
import { toast } from 'sonner';
import { FaTrash, FaRoute, FaCar, FaMoneyBillWave, FaMapMarkerAlt } from 'react-icons/fa';

const ManageFixedRoutes = () => {
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
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const pickupRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => {
    fetchRoutes();
    fetchCategories();
    
    // Slight delay to ensure refs are mounted
    setTimeout(() => {
      initAutocomplete();
    }, 1000);
  }, []);

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
      setRoutes(res.data.routes);
    } catch (error) {
      toast.error('Failed to load fixed routes');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await http.get('/api/car-categories/all');
      setCarCategories(res.data.categories || []);
    } catch (error) {
      toast.error('Failed to load categories');
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
      carCategory: '', price: '', adminCommission: '', isActive: true 
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

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Fixed Packages</h1>
      
      {/* Create Route Form */}
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

      {/* Routes List - Card Layout */}
      {routes.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-gray-200">
          <p className="text-gray-500 text-lg">No packages found. Create one above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {routes.map(route => (
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
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase ${route.isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                  {route.isActive ? 'Active' : 'Inactive'}
                </span>
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
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-[11px] text-gray-500 font-medium mb-0.5">Total Price</p>
                    <p className="text-gray-800 font-bold text-lg flex items-center">
                      ₹{route.price}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-gray-500 font-medium mb-0.5">Admin Comm.</p>
                    <p className="text-indigo-600 font-bold text-lg">
                      ₹{route.adminCommission}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  <button 
                    onClick={() => handleToggleStatus(route._id)} 
                    className={`flex items-center justify-center space-x-1 bg-white border py-2 rounded-lg font-medium text-xs transition-all duration-200 shadow-sm hover:shadow ${route.isActive ? 'text-yellow-600 border-yellow-200 hover:bg-yellow-50' : 'text-green-600 border-green-200 hover:bg-green-50'}`}
                    title={route.isActive ? 'Deactivate' : 'Activate'}
                  >
                    <span>{route.isActive ? 'Off' : 'On'}</span>
                  </button>
                  <button 
                    onClick={() => handleEdit(route)} 
                    className="flex items-center justify-center space-x-1 bg-white hover:bg-indigo-50 text-indigo-500 border border-gray-200 hover:border-indigo-200 py-2 rounded-lg font-medium text-xs transition-all duration-200 shadow-sm hover:shadow"
                  >
                    <span>Edit</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(route._id)} 
                    className="flex items-center justify-center space-x-1 bg-white hover:bg-red-50 text-red-500 border border-gray-200 hover:border-red-200 py-2 rounded-lg font-medium text-xs transition-all duration-200 shadow-sm hover:shadow"
                  >
                    <FaTrash className="text-xs" />
                  </button>
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
