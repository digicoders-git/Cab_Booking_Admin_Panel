import React, { useState, useEffect, useRef } from 'react';
import http from '../apis/http';
import { toast } from 'sonner';
import { 
  FaMapMarkerAlt, 
  FaCar, 
  FaClock, 
  FaMoneyBillWave, 
  FaUserTie, 
  FaTrash, 
  FaSearch, 
  FaTimes, 
  FaCompass,
  FaCheckCircle 
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client';

const FixedRouteMarketplace = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [_drivers, setDrivers] = useState([]);
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoords, setSelectedCoords] = useState(null); // { lat, lng }
  const [selectedAddress, setSelectedAddress] = useState('');
  const [radiusKm, setRadiusKm] = useState('50'); // '5', '10', '25', '50', '100', '200', 'all'
  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchMarketplaceBookings();
    fetchDrivers();

    const socket = io(import.meta.env.VITE_API_BASE_URL.replace('/api', ''));
    socket.on('newFixedBookingMarketplace', (data) => {
      if (data && data.booking) {
        fetchMarketplaceBookings();
        toast.info("A new package booking was placed!");
      }
    });
    
    socket.on('removeFixedBookingMarketplace', (data) => {
      if (data && data.bookingId) {
        setBookings(prev => prev.filter(b => b._id !== data.bookingId));
      }
    });

    return () => socket.disconnect();
  }, []);

  // Initialize Google Maps Places Autocomplete
  useEffect(() => {
    // Inject styling for Google Autocomplete container
    if (!document.getElementById("google-autocomplete-style")) {
      const style = document.createElement("style");
      style.id = "google-autocomplete-style";
      style.innerHTML = `
        .pac-container {
          z-index: 99999 !important;
          border-radius: 12px;
          margin-top: 6px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
          border: 1px solid #e2e8f0;
          font-family: inherit;
          background: #ffffff;
        }
        .pac-item {
          padding: 8px 14px;
          font-size: 13px;
          cursor: pointer;
          border-top: 1px solid #f1f5f9;
        }
        .pac-item:hover {
          background-color: #f8fafc;
        }
        .pac-item-query {
          font-size: 14px;
          color: #1e293b;
          font-weight: 600;
        }
      `;
      document.head.appendChild(style);
    }

    let intervalId = null;

    const setupAutocomplete = () => {
      if (window.google && window.google.maps && window.google.maps.places && searchInputRef.current) {
        if (intervalId) clearInterval(intervalId);

        try {
          const options = {
            componentRestrictions: { country: "in" },
            fields: ["formatted_address", "geometry", "name"]
          };
          const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, options);

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place && place.geometry && place.geometry.location) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              const addr = place.formatted_address || place.name || '';
              setSearchQuery(addr);
              setSelectedCoords({ lat, lng });
              setSelectedAddress(addr);
            }
          });
        } catch (e) {
          console.error("Autocomplete init error:", e);
        }
      }
    };

    setupAutocomplete();
    intervalId = setInterval(setupAutocomplete, 500);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const fetchMarketplaceBookings = async () => {
    try {
      const res = await http.get('/api/fixed-routes/bookings/marketplace/admin');
      setBookings(res.data.bookings || []);
    } catch {
      toast.error('Failed to load marketplace bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await http.get('/api/drivers/all');
      setDrivers(res.data.drivers || []);
    } catch (error) {
      console.error('Error fetching drivers', error);
    }
  };

  // Haversine formula to compute distance in km between two lat/lng points
  const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return null;
    const numLat1 = Number(lat1);
    const numLon1 = Number(lon1);
    const numLat2 = Number(lat2);
    const numLon2 = Number(lon2);
    if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) return null;

    const R = 6371; // Earth radius in km
    const dLat = ((numLat2 - numLat1) * Math.PI) / 180;
    const dLon = ((numLon2 - numLon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((numLat1 * Math.PI) / 180) *
        Math.cos((numLat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleClearLocation = () => {
    setSearchQuery('');
    setSelectedCoords(null);
    setSelectedAddress('');
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setSelectedCoords(null);
      setSelectedAddress('');
    }
  };

  const _handleAssignDriver = async (bookingId, driverId) => {
    if (!driverId) return;
    if (window.confirm('Are you sure you want to assign this package to the selected driver?')) {
      try {
        await http.post(`/api/fixed-routes/bookings/${bookingId}/accept-admin`, { driverId });
        toast.success('Assigned successfully. Commission deducted if cash payment.');
        fetchMarketplaceBookings();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to assign booking');
      }
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    const result = await Swal.fire({
      title: 'Delete Booking?',
      text: 'Are you sure you want to delete this booking entirely?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete it!'
    });

    if (result.isConfirmed) {
      try {
        await http.delete(`/api/fixed-routes/bookings/${bookingId}/admin`);
        toast.success('Booking deleted successfully.');
        fetchMarketplaceBookings();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete booking');
      }
    }
  };

  const filteredBookings = bookings
    .map(booking => {
      let distance = null;
      const pLat = booking.pickupLat ?? booking.pickup?.lat;
      const pLng = booking.pickupLng ?? booking.pickup?.lng;
      if (selectedCoords && pLat != null && pLng != null) {
        distance = calculateDistanceKm(
          selectedCoords.lat,
          selectedCoords.lng,
          pLat,
          pLng
        );
      }
      return {
        ...booking,
        distanceKm: distance !== null ? parseFloat(distance.toFixed(1)) : null
      };
    })
    .filter(booking => {
      // 1. Period filter
      if (filterPeriod !== 'all') {
        try {
          const bookingDate = new Date(booking.pickupDate);
          const now = new Date();
          
          const isSameDay = bookingDate.getDate() === now.getDate() && 
                            bookingDate.getMonth() === now.getMonth() && 
                            bookingDate.getFullYear() === now.getFullYear();

          if (filterPeriod === 'day' && !isSameDay) return false;
          if (filterPeriod === 'week') {
             const diffTime = Math.abs(now - bookingDate);
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
             if (diffDays > 7) return false;
          }
          if (filterPeriod === 'month') {
             if (!(bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear())) return false;
          }
          if (filterPeriod === 'year') {
             if (bookingDate.getFullYear() !== now.getFullYear()) return false;
          }
          if (filterPeriod === '10years') {
             if (Math.abs(bookingDate.getFullYear() - now.getFullYear()) > 10) return false;
          }
        } catch {
          // ignore date error
        }
      }

      // 2. Google Maps Location + Radius Filter
      if (selectedCoords) {
        if (booking.distanceKm !== null) {
          if (radiusKm !== 'all' && booking.distanceKm > Number(radiusKm)) {
            return false;
          }
        } else {
          // Fallback if booking lacks coordinates
          const q = (selectedAddress || searchQuery).toLowerCase().trim();
          const pickup = (booking.pickupLocation || booking.pickup?.address || '').toLowerCase();
          if (!pickup.includes(q)) return false;
        }
        return true;
      }

      // 3. Fallback text search if user typed without picking Google place
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const pickup = (booking.pickupLocation || booking.pickup?.address || '').toLowerCase();
        const drop = (booking.dropLocation || booking.drop?.address || '').toLowerCase();
        const routeName = (booking.route?.name || booking.packageName || '').toLowerCase();
        const carCat = (booking.carCategory?.name || '').toLowerCase();
        const bookingId = (booking.bookingId || booking._id || '').toLowerCase();

        const matches = pickup.includes(q) || drop.includes(q) || routeName.includes(q) || carCat.includes(q) || bookingId.includes(q);
        if (!matches) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // If Google Maps location search is active, sort nearest distance first
      if (selectedCoords && a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }
      return 0;
    });

  if (loading) {
    return <div className="text-gray-800 p-6 min-h-screen bg-gray-100 flex items-center justify-center">Loading marketplace...</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header with Title and Search Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">Fixed Route Marketplace (Open Bids)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-200">
              {filteredBookings.length} {filteredBookings.length === 1 ? 'Booking' : 'Bookings'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Search pickup location with Google Maps suggestions & filter rides by radius (5km, 10km, 100km)
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Google Places Pickup Location Search */}
          <div className="relative flex items-center bg-white rounded-xl shadow-sm border border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all px-3 py-1.5 flex-1 sm:w-80 md:w-96 min-w-[260px]">
            <FaMapMarkerAlt className={`mr-2.5 text-sm flex-shrink-0 ${selectedCoords ? 'text-red-500' : 'text-gray-400'}`} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              placeholder="Search pickup location (Google Maps)..."
              className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none truncate"
            />
            {searchQuery && (
              <button
                onClick={handleClearLocation}
                className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0 transition-colors ml-1"
                title="Clear location search"
              >
                <FaTimes className="text-xs" />
              </button>
            )}
          </div>

          {/* Radius Selector */}
          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-200 flex-shrink-0">
            <FaCompass className="text-indigo-500 text-xs" />
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Radius:</label>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
              className="border-none bg-transparent text-sm text-gray-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
              <option value="100">Within 100 km</option>
              <option value="200">Within 200 km</option>
              <option value="all">Any Distance</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-200 flex-shrink-0">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date:</label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="border-none bg-transparent text-sm text-gray-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="10years">10 Years</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Location & Radius Filter Info Banner */}
      {selectedCoords && (
        <div className="mb-6 bg-gradient-to-r from-indigo-50 via-blue-50 to-white p-3.5 rounded-xl border border-indigo-100 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <FaMapMarkerAlt className="text-sm" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Active Location Radius Search</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-600 text-white">
                  {radiusKm === 'all' ? 'All Distance' : `≤ ${radiusKm} KM`}
                </span>
              </div>
              <p className="text-xs font-medium text-gray-700 mt-0.5 line-clamp-1">
                Showing pickups near: <strong className="text-gray-900">{selectedAddress}</strong>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-indigo-700 font-semibold hidden sm:inline">
              Sorted by closest distance
            </span>
            <button
              onClick={handleClearLocation}
              className="text-xs text-red-600 hover:text-red-700 font-semibold px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors border border-red-200"
            >
              Clear Location
            </button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBookings.map(booking => (
          <div key={booking._id} className="bg-white rounded-2xl p-0 shadow-sm border border-gray-200 hover:border-indigo-400 hover:shadow-xl transition-all duration-300 group flex flex-col overflow-hidden">
            {/* Card Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center space-x-2 text-gray-700 font-semibold">
                <FaCar className="text-indigo-500 text-lg" />
                <span className="truncate">{booking.carCategory?.name || 'Any Car'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border ${booking.paymentMethod === 'CASH' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                  {booking.paymentMethod}
                </span>
                <button 
                  onClick={() => handleDeleteBooking(booking._id)}
                  className="text-red-400 hover:text-red-600 transition-colors p-1"
                  title="Delete Booking"
                >
                  <FaTrash />
                </button>
              </div>
            </div>

            {/* Distance Badge if location search is active */}
            {booking.distanceKm !== null && (
              <div className="mx-5 mt-3 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-800">
                  <FaMapMarkerAlt className="text-emerald-600" />
                  Distance from Searched Point:
                </span>
                <span className="font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-md text-[11px] shadow-xs">
                  {booking.distanceKm} KM
                </span>
              </div>
            )}
            
            {/* Card Body - Route Details */}
            <div className="p-6 flex-grow bg-white">
              <div className="relative pl-6 space-y-5 mb-6">
                {/* Vertical Line indicator */}
                <div className="absolute left-[0.4rem] top-2 bottom-2 w-0.5 bg-gray-200 rounded-full"></div>
                
                {/* Pickup */}
                <div className="relative">
                  <div className="absolute -left-[1.65rem] top-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white z-10 shadow-sm"></div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Pickup</p>
                  <p className="text-gray-800 text-sm font-medium line-clamp-2" title={booking.pickupLocation}>
                    {booking.pickupLocation}
                  </p>
                </div>

                {/* Drop */}
                <div className="relative">
                  <div className="absolute -left-[1.65rem] top-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white z-10 shadow-sm"></div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Drop</p>
                  <p className="text-gray-800 text-sm font-medium line-clamp-2" title={booking.dropLocation}>
                    {booking.dropLocation}
                  </p>
                </div>
              </div>

              {/* Time & Price Info */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center text-gray-500 font-medium">
                    <FaClock className="mr-2 text-gray-400" /> Date & Time
                  </div>
                  <span className="text-gray-800 font-bold">{new Date(booking.pickupDate).toLocaleDateString()} at {booking.pickupTime}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3 flex justify-between items-end">
                   <div>
                      <p className="text-[11px] text-gray-500 font-medium mb-0.5">Total Fare (Incl. GST)</p>
                      <p className="text-green-600 font-bold text-xl flex items-center">
                        ₹{(booking.totalWithTax || booking.price)?.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium">Base: ₹{booking.price}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[11px] text-gray-500 font-medium mb-0.5">Admin Comm.</p>
                      <p className="text-indigo-600 font-bold text-lg">
                        ₹{booking.adminCommission}
                      </p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredBookings.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <FaSearch className="text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">No bookings found</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-5">
              {selectedCoords 
                ? `No package rides found within ${radiusKm === 'all' ? '' : radiusKm + ' km of '} "${selectedAddress}". Try increasing the radius (e.g. 50km or 100km).` 
                : searchQuery
                ? `No package rides match "${searchQuery}". Try searching a different location.`
                : "No fixed route bookings currently open in the marketplace for the selected filter."}
            </p>
            {(searchQuery || selectedCoords || filterPeriod !== 'all') && (
              <button
                onClick={() => { handleClearLocation(); setRadiusKm('50'); setFilterPeriod('all'); }}
                className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors border border-indigo-200"
              >
                Reset Search & Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FixedRouteMarketplace;
