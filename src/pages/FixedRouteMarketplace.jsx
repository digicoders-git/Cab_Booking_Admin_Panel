import React, { useState, useEffect } from 'react';
import http from '../apis/http';
import { toast } from 'sonner';
import { FaMapMarkerAlt, FaCar, FaClock, FaMoneyBillWave, FaUserTie, FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client';

const FixedRouteMarketplace = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [filterPeriod, setFilterPeriod] = useState('all');

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

  const fetchMarketplaceBookings = async () => {
    try {
      const res = await http.get('/api/fixed-routes/bookings/marketplace/admin');
      setBookings(res.data.bookings || []);
    } catch (error) {
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

  const handleAssignDriver = async (bookingId, driverId) => {
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

  const filteredBookings = bookings.filter(booking => {
    if (filterPeriod === 'all') return true;
    try {
      const bookingDate = new Date(booking.pickupDate);
      const now = new Date();
      
      const isSameDay = bookingDate.getDate() === now.getDate() && 
                        bookingDate.getMonth() === now.getMonth() && 
                        bookingDate.getFullYear() === now.getFullYear();

      if (filterPeriod === 'day') return isSameDay;
      if (filterPeriod === 'week') {
         const diffTime = Math.abs(now - bookingDate);
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
         return diffDays <= 7;
      }
      if (filterPeriod === 'month') {
         return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
      }
      if (filterPeriod === 'year') {
         return bookingDate.getFullYear() === now.getFullYear();
      }
      if (filterPeriod === '10years') {
         return Math.abs(bookingDate.getFullYear() - now.getFullYear()) <= 10;
      }
      return true;
    } catch (e) {
      return true;
    }
  });

  if (loading) {
    return <div className="text-gray-800 p-6 min-h-screen bg-gray-100 flex items-center justify-center">Loading marketplace...</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Fixed Route Marketplace (Open Bids)</h1>
        
        <div className="flex items-center space-x-3 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
          <label className="text-sm font-medium text-gray-600 pl-2">Filter:</label>
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-1.5 border"
          >
            <option value="all">All</option>
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="10years">10 Years</option>
          </select>
        </div>
      </div>
      
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
                      <p className="text-[11px] text-gray-500 font-medium mb-0.5">Total Fare</p>
                      <p className="text-green-600 font-bold text-xl flex items-center">
                        ₹{booking.price}
                      </p>
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

            {/* Card Footer - Action */}
            {/* 
            <div className="p-5 bg-gray-50 border-t border-gray-100 mt-auto">
              <label className="flex items-center text-gray-600 text-xs font-semibold mb-2">
                <FaUserTie className="mr-1.5 text-indigo-400" /> Assign Driver manually
              </label>
              <div className="relative">
                <select 
                  className="w-full bg-white border border-gray-300 text-gray-800 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm font-medium appearance-none cursor-pointer"
                  onChange={(e) => handleAssignDriver(booking._id, e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>Select a driver...</option>
                  {drivers.map(d => (
                    <option key={d._id} value={d._id}>{d.name} • {d.carDetails?.carNumber || 'No Car Info'}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                   <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
            */}
          </div>
        ))}

        {filteredBookings.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
            <p className="text-lg">No fixed route bookings currently open in the marketplace for this date.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FixedRouteMarketplace;
