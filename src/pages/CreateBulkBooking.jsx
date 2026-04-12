import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { getAllCarCategories } from "../apis/carCategory";
import { createBulkBooking, getMyCreatedRequests, cancelBulkBooking } from "../apis/bulkBooking";
import { 
  FaCar, FaCalendarAlt, FaClock, FaMapMarkerAlt, 
  FaPlus, FaMinus, FaChevronRight, FaCheckCircle,
  FaPercentage, FaWallet, FaInfoCircle, FaTrash, FaSyncAlt
} from "react-icons/fa";
import { Toaster, toast } from "sonner";
import Swal from "sweetalert2";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function CreateBulkBooking() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCars, setSelectedCars] = useState([]);
  const [formData, setFormData] = useState({
    pickup: "",
    drop: "",
    pickupCoords: { lat: 0, lng: 0 },
    dropCoords: { lat: 0, lng: 0 },
    date: "",
    time: "",
    days: 1,
    distance: 0,
    notes: "",
    offeredPrice: 0,
    priceModifier: 0 // Percentage
  });

  const [myRequests, setMyRequests] = useState([]);
  const [fetchingRequests, setFetchingRequests] = useState(false);

  const pickupRef = useRef();
  const dropRef = useRef();

  useEffect(() => {
    fetchCategories();
    initAutocomplete();
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      setFetchingRequests(true);
      const res = await getMyCreatedRequests();
      if (res.success) setMyRequests(res.bookings || []);
    } catch (err) {
      console.error("Fetch requests failed");
    } finally {
      setFetchingRequests(false);
    }
  };

  const handleCancelRequest = async (id) => {
    const result = await Swal.fire({
      title: 'Cancel Request?',
      text: "This deal will be removed from Marketplace.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
    });

    if (result.isConfirmed) {
      const res = await cancelBulkBooking(id);
      if (res.success) {
        toast.success("Request Cancelled");
        fetchMyRequests();
      } else {
        toast.error(res.message);
      }
    }
  };

  const initAutocomplete = () => {
    if (!window.google) return;
    const options = { componentRestrictions: { country: "in" }, fields: ["formatted_address", "geometry"] };

    const pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupRef.current, options);
    const dropAutocomplete = new window.google.maps.places.Autocomplete(dropRef.current, options);

    pickupAutocomplete.addListener("place_changed", () => {
      const place = pickupAutocomplete.getPlace();
      if (place.geometry) {
        setFormData(prev => ({ 
          ...prev, 
          pickup: place.formatted_address,
          pickupCoords: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
        }));
      }
      calculateDistance();
    });

    dropAutocomplete.addListener("place_changed", () => {
      const place = dropAutocomplete.getPlace();
      if (place.geometry) {
        setFormData(prev => ({ 
          ...prev, 
          drop: place.formatted_address,
          dropCoords: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
        }));
      }
      calculateDistance();
    });
  };

  const calculateDistance = () => {
    if (!window.google || !pickupRef.current.value || !dropRef.current.value) return;
    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      { origins: [pickupRef.current.value], destinations: [dropRef.current.value], travelMode: "DRIVING" },
      (response, status) => {
        if (status === "OK" && response.rows[0].elements[0].status === "OK") {
          const distKm = response.rows[0].elements[0].distance.value / 1000;
          setFormData(prev => ({ ...prev, distance: Math.round(distKm) }));
        }
      }
    );
  };

  const fetchCategories = async () => {
    try {
      const res = await getAllCarCategories();
      if (res.success) {
        setCategories(res.categories || []);
      }
    } catch (err) {
      toast.error("Failed to load car categories");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCar = (cat) => {
    setSelectedCars((prev) => {
      const existing = prev.find((item) => item.id === cat._id);
      if (existing) {
        return prev.map((item) =>
          item.id === cat._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: cat._id,
          name: cat.name,
          image: cat.image,
          price: cat.bulkBookingBasePrice || 1000,
          quantity: 1,
        },
      ];
    });
  };

  const handleRemoveCar = (catId) => {
    setSelectedCars((prev) => {
      const existing = prev.find((item) => item.id === catId);
      if (existing.quantity > 1) {
        return prev.map((item) =>
          item.id === catId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter((item) => item.id !== catId);
    });
  };

  const calculateTotal = () => {
    // Formula: Rate (KM) * Quantity * Days * Distance
    const baseTotal = selectedCars.reduce(
      (acc, car) => acc + car.price * car.quantity * formData.days * (formData.distance || 0),
      0
    );
    const modified = baseTotal + baseTotal * (formData.priceModifier / 100);
    return Math.round(modified);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedCars.length === 0) return toast.error("Please select at least one car");
    if (!formData.pickup || !formData.drop || !formData.date) return toast.error("Please fill all details");

    try {
      const total = calculateTotal();
      const payload = {
        pickup: { 
          address: formData.pickup, 
          latitude: formData.pickupCoords.lat, 
          longitude: formData.pickupCoords.lng 
        },
        drop: { 
          address: formData.drop, 
          latitude: formData.dropCoords.lat, 
          longitude: formData.dropCoords.lng 
        },
        pickupDateTime: `${formData.date}T${formData.time || "10:00"}`,
        numberOfDays: formData.days,
        totalDistance: formData.distance,
        carsRequired: selectedCars.map((c) => ({ category: c.id, quantity: c.quantity })),
        offeredPrice: total,
        notes: formData.notes,
      };

      const result = await Swal.fire({
        title: 'Launch Request?',
        text: `Creating bulk request for ₹${total.toLocaleString()}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        background: themeColors.surface,
        color: themeColors.text
      });

      if (result.isConfirmed) {
        const res = await createBulkBooking(payload);
        if (res.success) {
          toast.success("Bulk Booking live on Marketplace!");
          fetchMyRequests();
          // Reset
          setSelectedCars([]);
          setFormData({
            pickup: "", drop: "", date: "", time: "",
            days: 1, distance: 0, notes: "", offeredPrice: 0, priceModifier: 0
          });
        }
      }
    } catch (err) {
      toast.error("Process failed");
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50" style={{ fontFamily: currentFont }}>
      <Toaster richColors position="top-right" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Create Bulk Request</h1>
        <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">Admin Direct Marketplace Injection</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Selection & Details */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Car Fleet Selection */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200">
            <h3 className="text-lg font-black mb-6 flex items-center gap-3">
              <FaCar className="text-blue-600" /> Select Vehicle Types
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div key={cat._id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-4">
                    <img src={`${BASE_URL}/uploads/${cat.image}`} alt={cat.name} className="w-16 h-12 object-contain bg-white rounded-xl p-1 shadow-sm" />
                    <div>
                      <p className="text-sm font-black text-gray-800">{cat.name}</p>
                      <p className="text-[10px] text-blue-600 font-bold">₹{cat.bulkBookingBasePrice || 0}/km</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleRemoveCar(cat._id)} className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-all">
                      <FaMinus size={10} />
                    </button>
                    <span className="text-sm font-black w-4 text-center">
                      {selectedCars.find(s => s.id === cat._id)?.quantity || 0}
                    </span>
                    <button onClick={() => handleAddCar(cat)} className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                      <FaPlus size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Location & Time */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200">
            <h3 className="text-lg font-black mb-6 flex items-center gap-3">
              <FaMapMarkerAlt className="text-green-600" /> Journey Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase">Pickup Location</label>
                <input 
                  ref={pickupRef}
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 ring-blue-500"
                  placeholder="Enter pickup address"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase">Drop Location</label>
                <input 
                  ref={dropRef}
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 ring-blue-500"
                  placeholder="Enter destination address"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase">Pickup Date</label>
                <input 
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase">Trip Duration (Days)</label>
                <div className="flex items-center gap-4 bg-gray-50 rounded-2xl px-6 py-2 border border-gray-100">
                  <button onClick={() => setFormData({...formData, days: Math.max(1, formData.days - 1)})} className="text-gray-400 hover:text-gray-900"><FaMinus /></button>
                  <span className="flex-1 text-center font-black">{formData.days} Days</span>
                  <button onClick={() => setFormData({...formData, days: formData.days + 1})} className="text-gray-400 hover:text-gray-900"><FaPlus /></button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase">Total Distance (KM)</label>
                <div className="relative">
                  <FaCar className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500" />
                  <input 
                    type="number"
                    readOnly
                    value={formData.distance}
                    className="w-full bg-blue-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-black text-blue-600 cursor-not-allowed"
                    placeholder="Auto-calculating..."
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase">Additional Instructions (Optional)</label>
                <textarea 
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 ring-blue-500 h-24"
                  placeholder="Any specific note for the Fleet owners..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="xl:col-span-4">
          <div className="sticky top-6 bg-white rounded-3xl p-8 border border-gray-200 shadow-xl shadow-gray-100">
            <h3 className="text-lg font-black mb-8 flex items-center gap-3">
              <FaWallet className="text-purple-600" /> Offer Summary
            </h3>
            
            <div className="space-y-4 mb-8">
              {selectedCars.map(car => (
                <div key={car.id} className="flex justify-between items-center text-xs font-bold text-gray-500">
                  <span>{car.quantity}x {car.name}</span>
                  <span className="text-gray-900">₹{(car.price * car.quantity * formData.days * (formData.distance || 0)).toLocaleString()}</span>
                </div>
              ))}
              <div className="pt-4 border-t border-dashed border-gray-100">
                 <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 uppercase">Market Incentive</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${formData.priceModifier >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {formData.priceModifier > 0 ? '+' : ''}{formData.priceModifier}%
                    </span>
                 </div>
                 <input 
                  type="range" min="-20" max="100" step="5"
                  value={formData.priceModifier}
                  onChange={e => setFormData({...formData, priceModifier: parseInt(e.target.value)})}
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-4" 
                 />
                 <div className="flex justify-between mt-2 text-[8px] font-black text-gray-300 uppercase tracking-widest">
                    <span>Discount</span>
                    <span>System</span>
                    <span>Urgent</span>
                 </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-6 mb-8">
              <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Total Offered Price</p>
              <h2 className="text-4xl font-black text-blue-700">₹{calculateTotal().toLocaleString()}</h2>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={selectedCars.length === 0}
              className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              Post to Marketplace
              <FaChevronRight className="text-xs" />
            </button>

            <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex gap-4">
              <FaInfoCircle className="text-gray-300 mt-1 flex-shrink-0" />
              <p className="text-[10px] text-gray-400 leading-relaxed font-bold">
                Your request will be broadcasted to all verified fleets having the selected car types.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Requests Section */}
      <div className="mt-12 bg-white rounded-3xl p-8 border border-gray-200">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-gray-900">My Recent Requests</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Manage your marketplace deals</p>
          </div>
          <button onClick={fetchMyRequests} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 flex items-center gap-2">
            <FaSyncAlt className={fetchingRequests ? 'animate-spin' : ''} /> Refresh List
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase">Route / Journey</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase">Fleet Reqs</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase">Price</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase">Status</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {myRequests.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center text-gray-300 font-black italic">No requests found</td>
                </tr>
              ) : (
                myRequests.map((req) => (
                  <tr key={req._id} className="group hover:bg-gray-50/50 transition-all">
                    <td className="py-6">
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-black text-gray-800 line-clamp-1">{req.pickup.address} → {req.drop.address}</p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-2">
                          <FaCalendarAlt size={10} /> {new Date(req.pickupDateTime).toLocaleDateString()} at {new Date(req.pickupDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {req.numberOfDays} Days
                        </p>
                      </div>
                    </td>
                    <td className="py-6">
                      <div className="flex flex-wrap gap-2">
                        {req.carsRequired.map((car, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 text-[8px] font-black rounded text-gray-600 uppercase">
                            {car.quantity}x {car.category?.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-blue-600">₹{req.offeredPrice.toLocaleString()}</span>
                        <span className="text-[9px] text-gray-400 uppercase">{req.totalDistance} KM</span>
                      </div>
                    </td>
                    <td className="py-6 font-bold">
                      <span className={`text-[9px] px-2 py-1 rounded-full uppercase ${
                        req.status === 'Marketplace' ? 'bg-orange-100 text-orange-600' :
                        req.status === 'Accepted' ? 'bg-green-100 text-green-600' :
                        req.status === 'Cancelled' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-6 text-right">
                      {req.status === 'Marketplace' && (
                        <button onClick={() => handleCancelRequest(req._id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 transition-all flex items-center justify-center ml-auto">
                          <FaTrash size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
