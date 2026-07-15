import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useFont } from '../context/FontContext';
import { useAuth } from '../context/AuthContext';
import { getAllBulkBookingsHistory, deleteBulkBooking, endBulkBooking } from '../apis/bulkBooking';
import { FaHistory, FaSearch, FaSyncAlt, FaCar, FaTrash, FaEye, FaFilePdf, FaCheckCircle } from 'react-icons/fa';
import Swal from 'sweetalert2';

export default function BulkBookingHistory() {
  const { themeColors, theme } = useTheme();
  const { currentFont } = useFont();
  const { admin } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleEndTrip = async (id) => {
    const res = await Swal.fire({
      title: 'Complete Trip?',
      text: 'Are you sure you want to mark this bulk booking as Completed?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Complete it!'
    });

    if (res.isConfirmed) {
      try {
        const response = await endBulkBooking(id);
        if (response.success) {
          Swal.fire('Completed!', 'Trip has been marked as Completed successfully.', 'success');
          fetchBookings();
        } else {
          Swal.fire('Error', response.message || 'Failed to complete trip', 'error');
        }
      } catch (err) {
        Swal.fire('Error', 'An unexpected error occurred', 'error');
      }
    }
  };

  const handleDownloadReceipt = (bookingId) => {
    const token = localStorage.getItem("admin-token") || localStorage.getItem("token");
    const url = `${BASE}/api/bulk-bookings/receipt/${bookingId}?token=${token}`;
    window.open(url, '_blank');
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
      
      let matchTab = true;
      if (activeTab === 'accepted_by_me') {
        matchTab = Boolean(b.assignedAdmin && admin?.id && b.assignedAdmin.toString() === admin.id.toString());
      }
      
      return matchSearch && matchStatus && matchTab;
    });
  }, [bookings, searchQuery, statusFilter, activeTab, admin]);

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

        {/* Tabs */}
        <div className="flex gap-6 mb-6 border-b" style={{ borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-2 px-2 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'all' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            All Bookings
          </button>
          <button
            onClick={() => setActiveTab('accepted_by_me')}
            className={`pb-2 px-2 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'accepted_by_me' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            My Accepted Rides
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
                            onClick={() => { setSelectedBooking(b); setIsModalOpen(true); }}
                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                            title="View Details"
                          >
                            <FaEye size={14} />
                          </button>
                          {(b.status === 'Accepted' || b.status === 'Ongoing') && (
                            <button 
                              onClick={() => handleEndTrip(b._id)}
                              className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition"
                              title="Complete Trip"
                            >
                              <FaCheckCircle size={14} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDownloadReceipt(b._id)}
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

      {/* Booking Details Modal */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" style={{ backgroundColor: themeColors.surface, color: themeColors.text }}>
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center" style={{ borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
              <h2 className="text-xl font-bold flex items-center gap-2">
                Booking #{selectedBooking._id.slice(-6).toUpperCase()}
                <span className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded-full border ${getStatusColor(selectedBooking.status)}`}>
                  {selectedBooking.status.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-50"
                style={{ backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6' }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Creator Info */}
              <div className="rounded-xl border p-5" style={{ borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">👤</div>
                  Creator Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><span className="text-xs text-gray-500 block">Name</span><p className="font-medium">{selectedBooking.createdBy?.name || 'N/A'}</p></div>
                  <div><span className="text-xs text-gray-500 block">Email</span><p className="font-medium">{selectedBooking.createdBy?.email || 'N/A'}</p></div>
                  <div><span className="text-xs text-gray-500 block">Phone</span><p className="font-medium">{selectedBooking.createdBy?.phone || 'N/A'}</p></div>
                  <div>
                    <span className="text-xs text-gray-500 block">Role</span>
                    <span className="inline-block px-2 py-1 mt-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-md">
                      {selectedBooking.createdByModel}
                    </span>
                  </div>
                  
                  {/* Customer Info (If booked by agent/admin for a customer) */}
                  {(selectedBooking.customerName || selectedBooking.customerPhone) && (
                    <div className="col-span-1 sm:col-span-2 mt-2 pt-4 border-t" style={{ borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
                      <span className="text-sm font-semibold block mb-2" style={{ color: theme === 'dark' ? '#9ca3af' : '#4b5563' }}>Customer / Passenger Details</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><span className="text-xs text-gray-500 block">Customer Name</span><p className="font-medium">{selectedBooking.customerName || 'N/A'}</p></div>
                        <div><span className="text-xs text-gray-500 block">Customer Phone</span><p className="font-medium">{selectedBooking.customerPhone || 'N/A'}</p></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Route Info */}
              <div className="rounded-xl border p-5" style={{ borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">🗺️</div>
                  Route Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-1 sm:col-span-2"><span className="text-xs text-gray-500 block">Pickup Address</span><p className="font-medium">{selectedBooking.pickup?.address}</p></div>
                  <div className="col-span-1 sm:col-span-2"><span className="text-xs text-gray-500 block">Drop Address</span><p className="font-medium">{selectedBooking.drop?.address}</p></div>
                  <div><span className="text-xs text-gray-500 block">Pickup Time</span><p className="font-medium">{new Date(selectedBooking.pickupDateTime).toLocaleString()}</p></div>
                  <div><span className="text-xs text-gray-500 block">Trip Type</span><p className="font-medium">{selectedBooking.tripType}</p></div>
                  {selectedBooking.tripType === 'RoundTrip' && (
                    <div><span className="text-xs text-gray-500 block">Return Time</span><p className="font-medium">{new Date(selectedBooking.returnDateTime).toLocaleString()}</p></div>
                  )}
                  <div><span className="text-xs text-gray-500 block">Number of Days</span><p className="font-medium">{selectedBooking.numberOfDays}</p></div>
                  <div><span className="text-xs text-gray-500 block">Total Distance</span><p className="font-medium">{selectedBooking.totalDistance} km</p></div>
                </div>
              </div>

              {/* Cars Required */}
              <div className="rounded-xl border p-5" style={{ borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">🚘</div>
                  Cars Required
                </h3>
                <div className="flex flex-wrap gap-3">
                  {selectedBooking.carsRequired?.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-gray-50" style={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
                      <span className="font-semibold">{c.category?.name || 'Category'}</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">x{c.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financials */}
              <div className="rounded-xl border p-5" style={{ borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">💰</div>
                  Financials
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><span className="text-xs text-gray-500 block">Offered Price</span><p className="font-bold text-lg text-green-600">₹{selectedBooking.offeredPrice?.toLocaleString('en-IN')}</p></div>
                  <div><span className="text-xs text-gray-500 block">System Est. Price</span><p className="font-medium text-gray-600">₹{selectedBooking.systemEstimatedPrice?.toLocaleString('en-IN')}</p></div>
                  <div>
                    <span className="text-xs text-gray-500 block">Advance Status</span>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedBooking.advancePayment?.isPaid ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">Paid (₹{selectedBooking.advancePayment?.amount})</span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">Unpaid (₹{selectedBooking.advancePayment?.amount})</span>
                      )}
                    </div>
                  </div>
                  {selectedBooking.mcdStateTaxApplied > 0 && (
                    <div><span className="text-xs text-gray-500 block">MCD/State Tax Applied</span><p className="font-medium text-orange-500">+₹{selectedBooking.mcdStateTaxApplied}</p></div>
                  )}
                </div>
              </div>

              {/* Assigned Fleet Info */}
              {selectedBooking.assignedFleet && (
                <div className="rounded-xl border p-5" style={{ borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">🏢</div>
                    Assigned Fleet
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><span className="text-xs text-gray-500 block">Company Name</span><p className="font-medium">{selectedBooking.assignedFleet.companyName}</p></div>
                    <div><span className="text-xs text-gray-500 block">Owner Name</span><p className="font-medium">{selectedBooking.assignedFleet.ownerName}</p></div>
                    <div><span className="text-xs text-gray-500 block">Email</span><p className="font-medium">{selectedBooking.assignedFleet.email}</p></div>
                    <div><span className="text-xs text-gray-500 block">Phone</span><p className="font-medium">{selectedBooking.assignedFleet.phone}</p></div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
