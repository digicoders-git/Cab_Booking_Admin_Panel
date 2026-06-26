import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useFont } from '../context/FontContext';
import { getAllBulkBookingsHistory, deleteBulkBooking } from '../apis/bulkBooking';
import { FaHistory, FaSearch, FaSyncAlt, FaCar, FaTrash, FaEye, FaFilePdf } from 'react-icons/fa';
import Swal from 'sweetalert2';

export default function BulkBookingHistory() {
  const { themeColors, theme } = useTheme();
  const { currentFont } = useFont();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const BASE = import.meta.env.VITE_API_BASE_URL || '';
  const IMAGE_BASE_URL = BASE.replace(/\/api\/?$/, '').replace(/\/$/, '') + '/uploads/';

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await getAllBulkBookingsHistory();
      if (res.success) {
        setBookings(res.bookings || []);
      }
    } catch (err) {
      console.error("Error fetching bulk bookings history:", err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch bulk booking history' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const res = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will permanently delete the bulk booking record.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (res.isConfirmed) {
      try {
        const response = await deleteBulkBooking(id);
        if (response.success) {
          Swal.fire('Deleted!', 'Booking has been deleted.', 'success');
          fetchBookings();
        }
      } catch (err) {
        Swal.fire('Error', err?.response?.data?.message || 'Failed to delete booking', 'error');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PendingPayment': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Marketplace': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Accepted': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Ongoing': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchSearch = b._id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.pickup.address.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.drop.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (b.createdBy?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (b.assignedFleet?.companyName || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen pt-8" style={{ backgroundColor: theme === 'dark' ? '#121212' : '#f8fafc', color: themeColors.text }}>
      <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
              <FaHistory className="text-blue-500" /> Bulk Booking History
            </h1>
            <p className="text-sm mt-1" style={{ color: theme === 'dark' ? '#9ca3af' : '#64748b' }}>
              View and manage all bulk bookings across the system.
            </p>
          </div>
          <button 
            onClick={fetchBookings} 
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl shadow-md hover:bg-blue-600 transition"
          >
            <FaSyncAlt className={loading ? 'animate-spin' : ''} /> Refresh Data
          </button>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-4" style={{ backgroundColor: themeColors.surface, borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by ID, location, creator, or fleet..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              style={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#f8fafc', borderColor: theme === 'dark' ? '#374151' : '#e2e8f0', color: themeColors.text }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border outline-none cursor-pointer min-w-[150px]"
            style={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#f8fafc', borderColor: theme === 'dark' ? '#374151' : '#e2e8f0', color: themeColors.text }}
          >
            <option value="all">All Status</option>
            <option value="PendingPayment">Pending Payment</option>
            <option value="Marketplace">Marketplace (Open)</option>
            <option value="Accepted">Accepted</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ backgroundColor: themeColors.surface, borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b" style={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#f8fafc', borderColor: theme === 'dark' ? '#374151' : '#e2e8f0' }}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID & Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Creator</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Route Info</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Fleet</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Finances</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: theme === 'dark' ? '#374151' : '#e2e8f0' }}>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <FaSyncAlt className="animate-spin text-blue-500" /> Loading History...
                      </div>
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No bulk bookings found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map(b => (
                    <tr key={b._id} className="hover:bg-gray-50/50 transition-colors" style={{ hover: { backgroundColor: theme === 'dark' ? '#1f2937' : '#f8fafc' } }}>
                      
                      {/* ID & Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold" style={{ color: themeColors.text }}>#{b._id.slice(-6).toUpperCase()}</div>
                        <div className="text-xs text-gray-500 mt-1">{new Date(b.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-blue-500 mt-1">{b.tripType}</div>
                      </td>

                      {/* Creator */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={b.createdBy?.image ? `${IMAGE_BASE_URL}${b.createdBy.image}` : `https://ui-avatars.com/api/?name=${b.createdBy?.name || 'User'}&background=random`}
                            alt="Creator"
                            className="w-8 h-8 rounded-full border shadow-sm object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium" style={{ color: themeColors.text }}>{b.createdBy?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{b.createdByModel}</p>
                          </div>
                        </div>
                      </td>

                      {/* Route Info */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 max-w-[200px]">
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                            <p className="text-xs truncate" title={b.pickup.address} style={{ color: themeColors.text }}>{b.pickup.address}</p>
                          </div>
                          <div className="border-l-2 border-dashed border-gray-300 ml-1 h-3 my-0.5" />
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                            <p className="text-xs truncate" title={b.drop.address} style={{ color: themeColors.text }}>{b.drop.address}</p>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1 font-medium bg-gray-100 rounded px-1.5 py-0.5 w-max">
                            <FaCar /> {b.carsRequired.reduce((sum, car) => sum + (car.quantity || 1), 0)} Cars Required
                          </div>
                        </div>
                      </td>

                      {/* Assigned Fleet */}
                      <td className="px-6 py-4">
                        {b.assignedFleet ? (
                          <div>
                            <p className="text-sm font-semibold text-indigo-600">{b.assignedFleet.companyName}</p>
                            <p className="text-xs text-gray-500">{b.assignedFleet.ownerName}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Finances */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-bold text-gray-800">₹{b.offeredPrice?.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-gray-500 mt-1">Est: ₹{b.systemEstimatedPrice?.toLocaleString('en-IN')}</p>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(b.status)}`}>
                          {b.status.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => window.open(`${BASE}/api/bulk-bookings/receipt/${b._id}`, '_blank')}
                            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                            title="Download Receipt"
                          >
                            <FaFilePdf size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(b._id)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                            title="Delete Booking"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
