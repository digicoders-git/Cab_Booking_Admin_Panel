import React, { useState, useEffect } from 'react';
import http from '../apis/http';
import { toast } from 'sonner';
import { FaCar, FaClock, FaCheckCircle, FaTimesCircle, FaMapMarkerAlt, FaMoneyBillWave } from 'react-icons/fa';

const FixedBookingsList = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = bookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(bookings.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="p-6 md:p-8 bg-gray-100 min-h-screen">
      <div className="mb-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fixed Package Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">View all user bookings and their current status</p>
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
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-800">{indexOfFirstItem + 1}</span> to <span className="font-semibold text-gray-800">{Math.min(indexOfLastItem, bookings.length)}</span> of <span className="font-semibold text-gray-800">{bookings.length}</span> entries
            </span>
            
            <div className="flex space-x-1">
              <button 
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
              >
                Prev
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => paginate(i + 1)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
                >
                  {i + 1}
                </button>
              ))}
              
              <button 
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FixedBookingsList;
