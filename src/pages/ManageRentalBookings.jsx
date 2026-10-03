import React, { useState, useEffect } from "react";
import { FaRoute, FaCheckCircle, FaCar, FaTrash, FaSearch, FaFilter } from "react-icons/fa";
import { Toaster, toast } from "sonner";
import Swal from 'sweetalert2';
import { getAllRentalBookingsAdmin, deleteRentalBookingAdmin } from "../apis/rentalPackage";

const ManageRentalBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const fetchData = async () => {
    try {
      const res = await getAllRentalBookingsAdmin();
      if (res.success) setBookings(res.bookings || []);
    } catch (err) {
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
      } catch (err) {
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
                    booking.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {booking.status}
                  </span>
                </td>
                <td className="p-4 text-xs text-gray-600">
                  {new Date(booking.createdAt).toLocaleString()}
                </td>
                <td className="p-4">
                  <button 
                    onClick={() => handleDelete(booking._id)}
                    className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                    title="Delete Booking"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && filteredBookings.length === 0 && (
              <tr><td colSpan="7" className="text-center p-8 text-gray-500">No rental bookings found matching your criteria.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageRentalBookings;
