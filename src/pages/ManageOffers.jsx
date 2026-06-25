import { useState, useEffect, useMemo } from "react";
import { Plus, X, Search, Tag, CheckCircle, XCircle, Gift, DollarSign, Calendar } from "lucide-react";
import { FaEdit, FaTrashAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Toaster, toast } from "sonner";
import Swal from "sweetalert2";
import axios from "axios";

const ManageOffers = () => {
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [formData, setFormData] = useState({
    code: "",
    discountAmount: 0,
    bookingType: "Normal",
    validTill: "",
    isActive: true
  });

  const [loading, setLoading] = useState(false);

  // --- 1. DATA FETCHING ---
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("admin-token");
      const resp = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/offers/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.data.success) {
        setData(resp.data.offers || []);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 2. FORM OPERATIONS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.discountAmount || !formData.validTill) {
      return toast.error("Please fill in all required fields.");
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("admin-token");
      
      const payload = {
        code: formData.code.toUpperCase(),
        discountAmount: Number(formData.discountAmount),
        bookingType: formData.bookingType,
        validTill: formData.validTill,
        isActive: formData.isActive
      };

      if (editId) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/offers/update/${editId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Offer Updated Successfully");
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/offers/create`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Offer Created Successfully");
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      discountAmount: 0,
      bookingType: "Normal",
      validTill: "",
      isActive: true
    });
    setEditId(null);
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setFormData({
      code: item.code,
      discountAmount: item.discountAmount,
      bookingType: item.bookingType,
      validTill: item.validTill ? new Date(new Date(item.validTill).getTime() - new Date(item.validTill).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
      isActive: item.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Offer?',
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;
    
    try {
      const token = localStorage.getItem("admin-token");
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/offers/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Offer has been deleted successfully',
        timer: 2000,
        showConfirmButton: false
      });
      await fetchData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: err.response?.data?.message || 'Failed to delete offer',
        confirmButtonColor: '#EF4444'
      });
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const result = await Swal.fire({
      title: currentStatus ? 'Deactivate Offer?' : 'Activate Offer?',
      text: currentStatus ? 'Users will not be able to use this promo code.' : 'This promo code will become active for users.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: currentStatus ? '#F59E0B' : '#10B981',
      cancelButtonColor: '#6B7280',
      confirmButtonText: currentStatus ? 'Yes, Deactivate' : 'Yes, Activate',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;
    
    try {
      const token = localStorage.getItem("admin-token");
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/offers/update/${id}`, { 
        isActive: !currentStatus 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      Swal.fire({
        icon: 'success',
        title: currentStatus ? 'Deactivated!' : 'Activated!',
        text: currentStatus ? 'Offer is now inactive' : 'Offer is now active',
        timer: 2000,
        showConfirmButton: false
      });
      
      await fetchData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: err.response?.data?.message || 'Failed to update status',
        confirmButtonColor: '#EF4444'
      });
    }
  };

  // Filtering Logic
  const filteredData = useMemo(() => {
    if (activeTab === "active") return data.filter(i => i.isActive);
    if (activeTab === "inactive") return data.filter(i => !i.isActive);
    return data;
  }, [data, activeTab]);

  // Pagination Logic
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  useEffect(() => { setCurrentPage(1); }, [activeTab, rowsPerPage]);

  return (
    <div className="p-6 bg-[#F9FAFB] min-h-screen text-gray-800">
      <Toaster 
        richColors 
        position="top-right" 
        expand={true}
        closeButton
      />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Manage Offers</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage promo codes for user discounts</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-semibold shadow-lg shadow-blue-600/20 flex items-center gap-2 active:scale-95 text-sm"
        >
          <Plus size={16} /> Create Promo Code
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-50 group-hover:scale-110 transition-transform">
              <Gift className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{data.length}</p>
          <p className="text-sm text-gray-500">Total Offers</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-50 group-hover:scale-110 transition-transform">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{data.filter(i => i.isActive).length}</p>
          <p className="text-sm text-gray-500">Active Promos</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tab Filters */}
        <div className="px-6 py-2 border-b border-gray-200 flex items-center gap-4 overflow-x-auto">
          {[
            { id: "all", label: "All Offers", icon: Tag },
            { id: "active", label: "Active", icon: CheckCircle, count: data.filter(i => i.isActive).length },
            { id: "inactive", label: "Inactive", icon: XCircle, count: data.filter(i => !i.isActive).length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 text-xs font-medium transition-all border-b-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Promo Code</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Discount</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Booking Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Valid Till</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <Gift size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-400 font-medium">No offers found</p>
                    <p className="text-gray-300 text-sm mt-1">Create a new promo code to get started</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-blue-600 text-sm tracking-wide bg-blue-50 px-3 py-1 rounded-md inline-block border border-blue-100">
                        {item.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-gray-900">₹{item.discountAmount} Flat Off</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${item.bookingType === 'Bulk' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                        {item.bookingType} Booking
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-xs text-gray-600">
                      <div className="flex flex-col gap-0.5 items-center">
                        <span className="font-semibold">{new Date(item.validTill).toLocaleString('en-IN', {day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'})}</span>
                        {new Date(item.validTill) < new Date() && <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full mt-1">Expired</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleStatus(item._id, item.isActive)}
                        className="inline-flex items-center gap-1.5 transition-all"
                        title={item.isActive ? 'Click to Deactivate' : 'Click to Activate'}
                      >
                        {item.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            <CheckCircle size={12} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-500 rounded-full text-xs font-semibold">
                            <XCircle size={12} /> Inactive
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FaEdit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {[10, 20, 30, 50, 100].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              <FaChevronLeft size={14} /> Previous
            </button>
            <span className="text-sm text-gray-500">Page {currentPage} of {totalPages || 1}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Next <FaChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Gift size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{editId ? 'Edit Promo Code' : 'Create Promo Code'}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Offer flat discount on bookings</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Promo Code *</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all font-bold uppercase tracking-wide"
                    placeholder="e.g. DIWALI500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Flat Discount (₹) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.discountAmount === 0 ? '' : formData.discountAmount}
                    onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                    placeholder="e.g. 500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Valid For Booking Type *</label>
                <select
                  value={formData.bookingType}
                  onChange={(e) => setFormData({ ...formData, bookingType: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                >
                  <option value="Normal">Normal Booking (App/Web)</option>
                  <option value="Bulk">Bulk Booking Marketplace</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Valid Till *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="datetime-local"
                    required
                    value={formData.validTill}
                    onChange={(e) => setFormData({ ...formData, validTill: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : (editId ? 'Update Promo' : 'Create Promo')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOffers;
