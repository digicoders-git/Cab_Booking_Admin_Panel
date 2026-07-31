import React, { useState, useEffect } from 'react';
import http from '../apis/http';
import { toast } from 'sonner';
import { FaCar, FaClock, FaCheckCircle, FaTimesCircle, FaMapMarkerAlt, FaMoneyBillWave, FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';

const FixedBookingsList = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await http.get('/api/fixed-routes/bookings/admin/all');
      setBookings(res.data.bookings || []);
    } catch (error) {
      toast.error('Failed to load package bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You are about to delete this package booking. This cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, Delete it!'
    });

    if (result.isConfirmed) {
      try {
        await http.delete(`/api/fixed-routes/bookings/${id}/admin`);
        toast.success("Booking deleted successfully");
        setBookings(bookings.filter(b => b._id !== id));
      } catch (error) {
        toast.error("Failed to delete booking");
      }
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Marketplace': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">Marketplace</span>;
      case 'Accepted': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-600 border border-yellow-200">Accepted</span>;
      case 'Completed': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-200">Completed</span>;
      case 'Cancelled': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">Cancelled</span>;
      default: return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-600 border border-gray-200">{status}</span>;
    }
  };

  const getPaymentStatusBadge = (status, method) => {
    if (method === 'Cash') return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">N/A (Cash)</span>;
    if (status === 'Completed') return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1 w-fit"><FaCheckCircle/> Paid</span>;
    return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 flex items-center gap-1 w-fit"><FaClock/> Pending</span>;
  };

  if (loading) {
    return <div className="text-gray-800 p-6 min-h-screen bg-gray-100 flex items-center justify-center">Loading bookings...</div>;
  }

  // Pagination Logic
  const filteredBookings = bookings.filter((booking) => {
    // 1. Date Filter
    if (dateFilter !== 'all') {
      const bookingDate = new Date(booking.createdAt || booking.pickupDate);
      const now = new Date();
      const daysDiff = Math.abs(now.getTime() - bookingDate.getTime()) / (1000 * 3600 * 24);
      
      let passDate = false;
      switch (dateFilter) {
        case 'day': passDate = daysDiff <= 1; break;
        case 'week': passDate = daysDiff <= 7; break;
        case 'month': passDate = daysDiff <= 30; break;
        case '3month': passDate = daysDiff <= 90; break;
        case '6month': passDate = daysDiff <= 180; break;
        case 'year': passDate = daysDiff <= 365; break;
        case '5year': passDate = daysDiff <= 1825; break;
      }
      if (!passDate) return false;
    }

    // 2. Status Filter
    if (statusFilter !== 'all') {
      if (booking.status !== statusFilter) return false;
    }

    // 3. Payment Filter (Online vs Cash)
    if (paymentFilter !== 'all') {
      if (paymentFilter === 'Cash' && booking.paymentMethod !== 'Cash') return false;
      if (paymentFilter === 'Online' && booking.paymentMethod === 'Cash') return false;
    }

    return true;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="p-6 md:p-8 bg-gray-100 min-h-screen">
      <div className="mb-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fixed Package Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">View all user bookings and their current status</p>
        </div>

        {/* Filters Container */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <select 
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="Marketplace">Marketplace</option>
            <option value="Accepted">Accepted</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Payment Method Filter */}
          <select 
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
          >
            <option value="all">All Payment</option>
            <option value="Online">Online</option>
            <option value="Cash">Offline (Cash)</option>
          </select>

          {/* Date Filter Dropdown */}
          <select 
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="day">Today (1 Day)</option>
            <option value="week">1 Week</option>
            <option value="month">1 Month</option>
            <option value="3month">3 Months</option>
            <option value="6month">6 Months</option>
            <option value="year">1 Year</option>
            <option value="5year">5 Years</option>
          </select>

          {/* Items Per Page Filter */}
          <select 
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
          >
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="30">30 / page</option>
            <option value="40">40 / page</option>
            <option value="50">50 / page</option>
            <option value="60">60 / page</option>
            <option value="70">70 / page</option>
            <option value="80">80 / page</option>
            <option value="90">90 / page</option>
            <option value="100">100 / page</option>
            <option value="1000">1000 / page</option>
            <option value="10000">10000 / page</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-bold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">ID & Date</th>
                <th className="px-6 py-4 whitespace-nowrap">User Details</th>
                <th className="px-6 py-4 whitespace-nowrap">Route (Pickup - Drop)</th>
                <th className="px-6 py-4 whitespace-nowrap">Driver</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 whitespace-nowrap">Payment</th>
                <th className="px-6 py-4 whitespace-nowrap">Price / Comm.</th>
                <th className="px-6 py-4 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentBookings.length > 0 ? currentBookings.map(booking => (
                <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-bold text-gray-800 text-xs mb-1">#{booking._id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-500">{new Date(booking.pickupDate).toLocaleDateString()} {booking.pickupTime}</p>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-semibold text-gray-800">{booking.user?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{booking.user?.phone || 'N/A'}</p>
                  </td>

                  <td className="px-6 py-4 min-w-[250px]">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500 shrink-0"></div>
                      <p className="text-xs text-gray-800 line-clamp-1" title={booking.pickupLocation}>{booking.pickupLocation}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 shrink-0"></div>
                      <p className="text-xs text-gray-800 line-clamp-1" title={booking.dropLocation}>{booking.dropLocation}</p>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {booking.assignedDriver ? (
                      <div>
                        <p className="font-semibold text-gray-800">{booking.assignedDriver.name}</p>
                        <p className="text-xs text-gray-500">{booking.assignedDriver.phone}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Unassigned</span>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(booking.status)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-bold text-[10px] uppercase text-gray-500 mb-1">{booking.paymentMethod}</p>
                    {getPaymentStatusBadge(booking.paymentStatus, booking.paymentMethod)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-gray-800 font-bold">₹{booking.price}</p>
                    <p className="text-indigo-600 text-xs font-semibold mt-0.5">Comm: ₹{booking.adminCommission}</p>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleDelete(booking._id)}
                      className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors shadow-sm border border-red-200"
                      title="Delete Booking"
                    >
                      <FaTrash size={14} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No package bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-800">{filteredBookings.length > 0 ? indexOfFirstItem + 1 : 0}</span> to <span className="font-semibold text-gray-800">{Math.min(indexOfLastItem, filteredBookings.length)}</span> of <span className="font-semibold text-gray-800">{filteredBookings.length}</span> entries
          </span>
          
          {totalPages > 1 && (
            <div className="flex items-center space-x-1 overflow-x-auto max-w-full pb-1">
              <button 
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0 ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
              >
                Prev
              </button>
              
              {/* Only show up to a few page buttons around current page to avoid clutter when having 1000s of items */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .map((p, index, array) => (
                  <React.Fragment key={p}>
                    {index > 0 && array[index - 1] !== p - 1 && (
                      <span className="px-2 text-gray-400 shrink-0">...</span>
                    )}
                    <button
                      onClick={() => paginate(p)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0 ${currentPage === p ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
              ))}
              
              <button 
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0 ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FixedBookingsList;
