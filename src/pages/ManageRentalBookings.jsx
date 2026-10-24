import React, { useState, useEffect } from "react";
import { 
  FaRoute, 
  FaCheckCircle, 
  FaCar, 
  FaTrash, 
  FaSearch, 
  FaFilter, 
  FaEye, 
  FaTimes, 
  FaMapMarkerAlt, 
  FaUser, 
  FaPhone, 
  FaClock, 
  FaMoneyBillWave, 
  FaExternalLinkAlt 
} from "react-icons/fa";
import { Toaster, toast } from "sonner";
import Swal from 'sweetalert2';
import { getAllRentalBookingsAdmin, deleteRentalBookingAdmin } from "../apis/rentalPackage";
import { useAuth } from "../context/AuthContext";

const ManageRentalBookings = () => {
  const { admin } = useAuth();
  const hasPermission = (permission) => {
    if (admin?.role === "SuperAdmin") return true;
    return admin?.permissions?.includes(permission);
  };

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const res = await getAllRentalBookingsAdmin();
      if (res.success) setBookings(res.bookings || []);
    } catch {
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this! The booking will be permanently deleted.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const res = await deleteRentalBookingAdmin(id);
        if (res.success) {
          Swal.fire(
            'Deleted!',
            'The rental booking has been deleted.',
            'success'
          );
          fetchData(); // refresh list
        } else {
          Swal.fire('Error!', res.message || "Failed to delete booking", 'error');
        }
      } catch {
        Swal.fire('Error!', "An error occurred while deleting", 'error');
      }
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    // Search by ID, User Name, User Phone
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = 
      booking.bookingId?.toLowerCase().includes(searchLower) ||
      booking.user?.name?.toLowerCase().includes(searchLower) ||
      booking.user?.phone?.toLowerCase().includes(searchLower);
      
    // Filter by Status
    const matchStatus = filterStatus === "All" || booking.status === filterStatus;
    
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rental Bookings</h1>
          <p className="text-gray-500">View all customer rental bookings</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by ID, Name, Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaFilter className="text-gray-400" />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto appearance-none bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Started">Started</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm border-b">
              <th className="p-4">Booking ID</th>
              <th className="p-4">Customer Details</th>
              <th className="p-4">Package</th>
              <th className="p-4">Fare Details</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center p-8">Loading...</td></tr>
            ) : filteredBookings.map((booking) => (
              <tr key={booking._id} className="border-b hover:bg-gray-50 text-sm">
                <td className="p-4 font-semibold text-gray-800">{booking.bookingId}</td>
                <td className="p-4">
                  <div className="font-semibold text-gray-800">{booking.user?.name || 'Unknown'}</div>
                  <div className="text-xs text-gray-500">{booking.user?.phone || 'No phone'}</div>
                </td>
                <td className="p-4">
                  <div className="font-semibold">{booking.rentalPackage?.name || 'Unknown Package'}</div>
                  <div className="text-xs text-gray-500">{booking.rentalPackage?.hours} Hrs | {booking.rentalPackage?.baseDistance} KMs</div>
                </td>
                <td className="p-4">
                  <div className="font-semibold text-green-600">₹{booking.fareDetails?.totalFare || 0}</div>
                  <div className="text-xs text-gray-500">{booking.paymentMethod}</div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    booking.status === 'Completed' ? 'bg-green-100 text-green-700' :
                    booking.status === 'Started' ? 'bg-blue-100 text-blue-700' :
                    booking.status === 'Accepted' ? 'bg-indigo-100 text-indigo-700' :
                    booking.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                    booking.status === 'Expired' ? 'bg-purple-100 text-purple-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {booking.status}
                  </span>
                </td>
                <td className="p-4 text-xs text-gray-600">
                  {new Date(booking.createdAt).toLocaleString()}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setIsModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-xs"
                      title="View Full Ride Details"
                    >
                      <FaEye className="text-sm" /> View
                    </button>
                    {hasPermission("RENTAL_BOOKING_DELETE") && (
                      <button 
                        onClick={() => handleDelete(booking._id)}
                        className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                        title="Delete Booking"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filteredBookings.length === 0 && (
              <tr><td colSpan="7" className="text-center p-8 text-gray-500">No rental bookings found matching your criteria.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Rental Booking Details Modal */}
      {isModalOpen && selectedBooking && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-gray-100 my-8 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md">
                  <FaCar className="text-xl text-yellow-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold tracking-tight">Rental Trip Details</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      selectedBooking.status === 'Completed' ? 'bg-green-500 text-white' :
                      selectedBooking.status === 'Started' ? 'bg-amber-400 text-gray-900' :
                      selectedBooking.status === 'Accepted' ? 'bg-blue-400 text-white' :
                      selectedBooking.status === 'Cancelled' ? 'bg-red-500 text-white' :
                      selectedBooking.status === 'Expired' ? 'bg-purple-600 text-white' :
                      'bg-yellow-400 text-gray-900'
                    }`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                  <p className="text-xs text-blue-200 mt-0.5 font-mono">
                    ID: {selectedBooking.bookingId} • Booked On: {new Date(selectedBooking.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors cursor-pointer"
                title="Close"
              >
                <FaTimes />
              </button>
            </div>

            {/* Quick Summary Pill Bar */}
            <div className="bg-blue-50/70 border-b border-blue-100 px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-blue-100/60 shadow-xs">
                <div className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider">Security OTP</div>
                <div className="font-mono font-black text-blue-700 text-sm">{selectedBooking.otp || 'N/A'}</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-blue-100/60 shadow-xs">
                <div className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider">Payment Status</div>
                <div className="font-bold text-gray-800">
                  <span className={selectedBooking.paymentStatus === 'Completed' ? 'text-green-600' : 'text-amber-600'}>
                    {selectedBooking.paymentStatus}
                  </span>
                  <span className="text-gray-400 font-normal"> ({selectedBooking.paymentMethod})</span>
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-blue-100/60 shadow-xs">
                <div className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider">Total Fare</div>
                <div className="font-bold text-green-700 text-sm">
                  ₹{selectedBooking.fareDetails?.totalFare || selectedBooking.rentalPackage?.basePrice || 0}
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-blue-100/60 shadow-xs">
                <div className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider">Admin Commission</div>
                <div className="font-bold text-indigo-700 text-sm">
                  ₹{selectedBooking.fareDetails?.adminCommission || 0}
                </div>
              </div>
            </div>

            {/* Modal Body Scrollable */}
            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Customer Details */}
                <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3 text-gray-700 font-bold text-sm">
                    <FaUser className="text-blue-600" />
                    <span>Customer Information</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-500">Name:</span>
                      <span className="font-semibold text-gray-800">{selectedBooking.user?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-500">Phone:</span>
                      <a href={`tel:${selectedBooking.user?.phone}`} className="font-semibold text-blue-600 hover:underline">
                        {selectedBooking.user?.phone || 'N/A'}
                      </a>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500">Email:</span>
                      <span className="font-medium text-gray-700 truncate max-w-[180px]">{selectedBooking.user?.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Driver & Vehicle Details */}
                <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3 text-gray-700 font-bold text-sm">
                    <FaCar className="text-amber-600" />
                    <span>Assigned Driver & Vehicle</span>
                  </div>
                  {selectedBooking.driver ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-gray-200/60">
                        <span className="text-gray-500">Driver Name:</span>
                        <span className="font-semibold text-gray-800">{selectedBooking.driver.name}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-200/60">
                        <span className="text-gray-500">Driver Phone:</span>
                        <a href={`tel:${selectedBooking.driver.phone}`} className="font-semibold text-blue-600 hover:underline">
                          {selectedBooking.driver.phone || 'N/A'}
                        </a>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-200/60">
                        <span className="text-gray-500">Car Number:</span>
                        <span className="font-mono font-bold text-gray-900 uppercase">
                          {selectedBooking.driver.carDetails?.carNumber || selectedBooking.driver.vehicleNumber || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-500">Category & Model:</span>
                        <span className="font-medium text-gray-700">
                          {selectedBooking.carCategory?.name || 'Car'} • {selectedBooking.driver.carDetails?.carModel || selectedBooking.driver.carDetails?.carBrand || 'Standard'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Searching for nearby drivers...
                      </span>
                      <p className="text-[11px] text-gray-500 mt-1.5">No driver has accepted this ride yet.</p>
                    </div>
                  )}
                </div>

                {/* 3. Package & Rate Card */}
                <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3 text-gray-700 font-bold text-sm">
                    <FaRoute className="text-purple-600" />
                    <span>Rental Package & Rate Card</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-500">Package Name:</span>
                      <span className="font-semibold text-gray-800">{selectedBooking.rentalPackage?.name || 'Hourly Rental'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-500">Base Hours & KM:</span>
                      <span className="font-semibold text-gray-800">
                        {selectedBooking.rentalPackage?.hours || 2} Hours • {selectedBooking.rentalPackage?.baseDistance || 20} KMs
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-500">Base Package Fare:</span>
                      <span className="font-semibold text-green-700">₹{selectedBooking.rentalPackage?.basePrice || 0}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500">Extra Rates:</span>
                      <span className="font-semibold text-gray-700">
                        ₹{selectedBooking.rentalPackage?.extraKmPrice || 12}/km • ₹{selectedBooking.rentalPackage?.extraMinutePrice || 2}/min
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Trip Timeline & Odometer */}
                <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3 text-gray-700 font-bold text-sm">
                    <FaClock className="text-emerald-600" />
                    <span>Trip Meter & Timeline</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-500">Trip Start Time:</span>
                      <span className="font-medium text-gray-800">
                        {selectedBooking.startTime ? new Date(selectedBooking.startTime).toLocaleString() : 'Not started'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-500">Trip End Time:</span>
                      <span className="font-medium text-gray-800">
                        {selectedBooking.endTime ? new Date(selectedBooking.endTime).toLocaleString() : (selectedBooking.status === 'Started' ? 'In Progress 🚕' : '-')}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-500">Distance Travelled:</span>
                      <span className="font-bold text-blue-700">{selectedBooking.totalDistanceTravelled || 0} KM</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500">Duration:</span>
                      <span className="font-semibold text-gray-800">
                        {selectedBooking.startTime && selectedBooking.endTime ? (
                          `${Math.round((new Date(selectedBooking.endTime) - new Date(selectedBooking.startTime)) / 60000)} mins`
                        ) : (selectedBooking.status === 'Started' ? 'Live ongoing' : '0 mins')}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* 5. Pickup Location Full Row */}
              <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-gray-700 font-bold text-sm">
                    <FaMapMarkerAlt className="text-red-500" />
                    <span>Pickup Location</span>
                  </div>
                  {selectedBooking.pickupLocation?.lat && selectedBooking.pickupLocation?.lng && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedBooking.pickupLocation.lat},${selectedBooking.pickupLocation.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <span>Open in Maps</span>
                      <FaExternalLinkAlt className="text-[10px]" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-gray-800 font-medium">{selectedBooking.pickupLocation?.address || 'Pickup location details not provided'}</p>
                {selectedBooking.pickupLocation?.lat && (
                  <p className="text-[11px] text-gray-400 mt-1 font-mono">
                    Coordinates: {selectedBooking.pickupLocation.lat}, {selectedBooking.pickupLocation.lng}
                  </p>
                )}
              </div>

              {/* 6. Fare Calculation & Invoice Breakdown */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3 font-bold text-sm text-yellow-400">
                  <FaMoneyBillWave />
                  <span>Fare & Settlement Invoice</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
                    <span className="text-gray-400 block text-[11px]">Base Package Fare</span>
                    <span className="text-white font-semibold text-sm">
                      ₹{selectedBooking.fareDetails?.baseFare || selectedBooking.rentalPackage?.basePrice || 0}
                    </span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
                    <span className="text-gray-400 block text-[11px]">Extra KM Fare</span>
                    <span className="text-white font-semibold text-sm">
                      ₹{selectedBooking.fareDetails?.extraKmFare || 0}
                    </span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
                    <span className="text-gray-400 block text-[11px]">Extra Time Fare</span>
                    <span className="text-white font-semibold text-sm">
                      ₹{selectedBooking.fareDetails?.extraTimeFare || 0}
                    </span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
                    <span className="text-gray-400 block text-[11px]">Admin Commission</span>
                    <span className="text-yellow-400 font-bold text-sm">
                      ₹{selectedBooking.fareDetails?.adminCommission || 0}
                    </span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
                    <span className="text-gray-400 block text-[11px]">Payment Mode</span>
                    <span className="text-white font-semibold text-sm">
                      {selectedBooking.paymentMethod}
                    </span>
                  </div>
                  <div className="bg-green-500/20 p-2.5 rounded-lg border border-green-500/40">
                    <span className="text-green-300 block text-[11px] font-bold uppercase tracking-wider">Total Fare</span>
                    <span className="text-green-400 font-black text-base">
                      ₹{selectedBooking.fareDetails?.totalFare || selectedBooking.rentalPackage?.basePrice || 0}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-gray-100/80 px-5 py-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRentalBookings;
