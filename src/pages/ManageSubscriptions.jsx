import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
    createSubscriptionPlanAPI, 
    getSubscriptionPlansAPI, 
    updateSubscriptionPlanAPI, 
    deleteSubscriptionPlanAPI 
} from '../apis/admin';
import { getAllCarCategories } from '../apis/carCategory';
import { Plus, Edit, Trash2, Calendar, MapPin, DollarSign, Car, Navigation } from 'lucide-react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { useAuth } from '../context/AuthContext';

const libraries = ['places'];

const ManageSubscriptions = () => {
    const { admin } = useAuth();
    const hasPermission = (permission) => {
        if (admin?.role === "SuperAdmin") return true;
        return admin?.permissions?.includes(permission);
    };
    const [plans, setPlans] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '', description: '', 
        pickup: { address: '', latitude: 0, longitude: 0 },
        drop: { address: '', latitude: 0, longitude: 0 },
        distanceKm: 0,
        ridesPerDay: 2, validityDays: 30, price: '', carCategory: ''
    });
    
    const [editingId, setEditingId] = useState(null);
    const [pickupAutocomplete, setPickupAutocomplete] = useState(null);
    const [dropAutocomplete, setDropAutocomplete] = useState(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [plansRes, catRes] = await Promise.all([
            getSubscriptionPlansAPI(),
            getAllCarCategories()
        ]);
        
        if (plansRes.success) setPlans(plansRes.plans);
        if (catRes.success) setCategories(catRes.categories || catRes.data || []);
        setLoading(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return parseFloat((R * c).toFixed(1));
    };

    const onPickupChanged = () => {
        if (pickupAutocomplete !== null) {
            const place = pickupAutocomplete.getPlace();
            if (place.geometry) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                const address = place.formatted_address || place.name;
                setFormData(prev => {
                    const newState = { ...prev, pickup: { address, latitude: lat, longitude: lng } };
                    newState.distanceKm = calculateDistance(lat, lng, prev.drop.latitude, prev.drop.longitude) || prev.distanceKm;
                    return newState;
                });
            }
        }
    };

    const onDropChanged = () => {
        if (dropAutocomplete !== null) {
            const place = dropAutocomplete.getPlace();
            if (place.geometry) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                const address = place.formatted_address || place.name;
                setFormData(prev => {
                    const newState = { ...prev, drop: { address, latitude: lat, longitude: lng } };
                    newState.distanceKm = calculateDistance(prev.pickup.latitude, prev.pickup.longitude, lat, lng) || prev.distanceKm;
                    return newState;
                });
            }
        }
    };

    const handleEdit = (plan) => {
        setFormData({
            name: plan.name, description: plan.description, 
            pickup: plan.pickup || { address: '', latitude: 0, longitude: 0 },
            drop: plan.drop || { address: '', latitude: 0, longitude: 0 },
            distanceKm: plan.distanceKm || 0,
            ridesPerDay: plan.ridesPerDay, validityDays: plan.validityDays, 
            price: plan.price, carCategory: plan.carCategory?._id || plan.carCategory
        });
        setEditingId(plan._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this plan?")) return;
        const res = await deleteSubscriptionPlanAPI(id);
        if (res.success) {
            toast.success(res.message);
            fetchData();
        } else {
            toast.error(res.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.pickup.address || !formData.drop.address) {
            return toast.error("Please select valid pickup and drop locations from Google suggestions");
        }
        
        try {
            const res = editingId 
                ? await updateSubscriptionPlanAPI(editingId, formData)
                : await createSubscriptionPlanAPI(formData);
                
            if (res.success) {
                toast.success(res.message);
                setShowModal(false);
                setFormData({
                    name: '', description: '', 
                    pickup: { address: '', latitude: 0, longitude: 0 },
                    drop: { address: '', latitude: 0, longitude: 0 },
                    distanceKm: 0, ridesPerDay: 2, validityDays: 30, price: '', carCategory: ''
                });
                setEditingId(null);
                fetchData();
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="text-blue-600" /> Fixed Route Commute Plans
                    </h1>
                    <p className="text-gray-500 mt-1">Manage strict fixed-route and fixed-price packages.</p>
                </div>
                {hasPermission('SUBSCRIPTION_CREATE') && (
                    <button 
                        onClick={() => {
                            setEditingId(null);
                            setFormData({
                                name: '', description: '', 
                                pickup: { address: '', latitude: 0, longitude: 0 },
                                drop: { address: '', latitude: 0, longitude: 0 },
                                distanceKm: 0, ridesPerDay: 2, validityDays: 30, price: '', carCategory: ''
                            });
                            setShowModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                    >
                        <Plus size={20} /> Add New Route
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {plans.map(plan => (
                        <div key={plan._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                                ₹{plan.price} / {plan.validityDays} Days
                            </div>
                            
                            <h3 className="text-lg font-bold text-gray-900 mb-1 pr-24">{plan.name}</h3>
                            <p className="text-gray-500 text-xs mb-4">{plan.carCategory?.name || 'Any Car'} • {plan.ridesPerDay} Rides/Day</p>
                            
                            <div className="flex flex-col gap-3 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent pl-8 md:pl-0">
                                <div className="relative flex items-start gap-3">
                                    <div className="absolute -left-8 md:left-auto md:relative w-6 h-6 rounded-full bg-blue-100 border-2 border-blue-600 flex items-center justify-center shrink-0 z-10">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                    </div>
                                    <div className="flex-1 text-sm">
                                        <p className="font-semibold text-gray-900">Pickup</p>
                                        <p className="text-gray-600 line-clamp-2">{plan.pickup?.address}</p>
                                    </div>
                                </div>
                                <div className="relative flex items-start gap-3">
                                    <div className="absolute -left-8 md:left-auto md:relative w-6 h-6 rounded-full bg-red-100 border-2 border-red-600 flex items-center justify-center shrink-0 z-10">
                                        <MapPin size={12} className="text-red-600" />
                                    </div>
                                    <div className="flex-1 text-sm">
                                        <p className="font-semibold text-gray-900">Drop</p>
                                        <p className="text-gray-600 line-clamp-2">{plan.drop?.address}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                                    <Navigation size={12} className="mr-1" /> {plan.distanceKm} KM Route
                                </span>
                                <div className="flex gap-2">
                                    {hasPermission('SUBSCRIPTION_EDIT') && (
                                        <button onClick={() => handleEdit(plan)} className="text-gray-500 hover:text-blue-600 p-2 rounded hover:bg-blue-50 transition-colors">
                                            <Edit size={16} />
                                        </button>
                                    )}
                                    {hasPermission('SUBSCRIPTION_DELETE') && (
                                        <button onClick={() => handleDelete(plan._id)} className="text-gray-500 hover:text-red-600 p-2 rounded hover:bg-red-50 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                    {!hasPermission('SUBSCRIPTION_EDIT') && !hasPermission('SUBSCRIPTION_DELETE') && (
                                        <span className="text-xs text-gray-400 py-1">View Only</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {plans.length === 0 && (
                        <div className="col-span-full bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
                            <MapPin className="mx-auto text-gray-300 mb-3" size={48} />
                            <p className="text-gray-500 font-medium">No fixed-route packages created yet.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-20">
                            <h2 className="text-xl font-bold">{editingId ? 'Edit Fixed Route' : 'Create Fixed Route'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            
                            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 space-y-4">
                                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2"><MapPin size={18}/> Route Setup</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                                        {isLoaded ? (
                                            <Autocomplete onLoad={auto => setPickupAutocomplete(auto)} onPlaceChanged={onPickupChanged} options={{ componentRestrictions: { country: "in" } }}>
                                                <input required type="text" value={formData.pickup.address} onChange={(e) => setFormData(p => ({...p, pickup: {...p.pickup, address: e.target.value}}))} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Search exact pickup address..." />
                                            </Autocomplete>
                                        ) : (
                                            <input required type="text" value={formData.pickup.address} onChange={(e) => setFormData(p => ({...p, pickup: {...p.pickup, address: e.target.value}}))} className="w-full p-2.5 border border-gray-300 rounded-lg" placeholder="Loading maps..." />
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Drop Location</label>
                                        {isLoaded ? (
                                            <Autocomplete onLoad={auto => setDropAutocomplete(auto)} onPlaceChanged={onDropChanged} options={{ componentRestrictions: { country: "in" } }}>
                                                <input required type="text" value={formData.drop.address} onChange={(e) => setFormData(p => ({...p, drop: {...p.drop, address: e.target.value}}))} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Search exact drop address..." />
                                            </Autocomplete>
                                        ) : (
                                            <input required type="text" value={formData.drop.address} onChange={(e) => setFormData(p => ({...p, drop: {...p.drop, address: e.target.value}}))} className="w-full p-2.5 border border-gray-300 rounded-lg" placeholder="Loading maps..." />
                                        )}
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-emerald-700 bg-emerald-100 px-3 py-2 rounded-md inline-flex items-center gap-2">
                                    <Navigation size={16}/> Auto-calculated Distance: {formData.distanceKm} KM
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-full">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                                    <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full p-2 border rounded-lg" placeholder="e.g. Noida Sec 62 to Gurugram DLF" />
                                </div>
                                <div className="col-span-full">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                    <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full p-2 border rounded-lg" rows="2" placeholder="Plan details..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price (₹)</label>
                                    <input required type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full p-2 border rounded-lg font-bold text-lg" min="0" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Car Category</label>
                                    <select required name="carCategory" value={formData.carCategory} onChange={handleInputChange} className="w-full p-2 border rounded-lg">
                                        <option value="">Select Category</option>
                                        {categories.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Validity (Days)</label>
                                    <input required type="number" name="validityDays" value={formData.validityDays} onChange={handleInputChange} className="w-full p-2 border rounded-lg" min="1" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Rides Per Day</label>
                                    <input required type="number" name="ridesPerDay" value={formData.ridesPerDay} onChange={handleInputChange} className="w-full p-2 border rounded-lg" min="1" max="10" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">Save Package</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageSubscriptions;
