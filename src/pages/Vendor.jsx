import React, { useState, useEffect, useMemo, useContext } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
// Removed redundant StatCard and Modal imports to prevent collisions
import {
  FaBuilding, FaUserTie, FaEnvelope, FaPhone, FaMapMarkerAlt,
  FaSearch, FaPlus, FaTrash, FaEdit, FaEye, FaToggleOn, FaToggleOff,
  FaCheckCircle, FaTimesCircle, FaUsers, FaMoneyBillWave,
  FaIdCard, FaWallet, FaStar, FaChevronLeft, FaChevronRight,
  FaSyncAlt, FaTimes, FaLock, FaUserCircle, FaChartBar,
  FaPercent, FaChartPie, FaChartArea, FaChartLine,
  FaArrowUp, FaArrowDown, FaCalendarAlt, FaClock, FaTrophy,
  FaCrown, FaMedal, FaHistory, FaCreditCard, FaUniversity,
  FaFileInvoice, FaDownload, FaFilter, FaEye as FaEyeIcon,
  FaInfoCircle, FaExclamationTriangle
} from "react-icons/fa";
import {
  createVendor,
  getAllVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
  toggleVendorStatus,
  updateVendorCommission,
  getCommissionHistory
} from "../apis/vendor.js";
import { getDashboardStats } from "../apis/admin.js";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsMore from 'highcharts/highcharts-more';
import HighchartsExporting from 'highcharts/modules/exporting';
import Swal from "sweetalert2";

// Initialize Highcharts modules
if (typeof Highcharts === 'object') {
  if (typeof HighchartsMore === 'function') HighchartsMore(Highcharts);
  if (typeof HighchartsExporting === 'function') HighchartsExporting(Highcharts);
}

// Modern Stat Card Component
const StatCard = ({ icon: Icon, label, value, color, trend, trendValue, themeColors }) => {
  if (!themeColors) return null;
  return (
    <div className="group relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
      style={{
        backgroundColor: themeColors.surface,
        border: `1px solid ${themeColors.border}`
      }}>
      <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300"
        style={{ background: `linear-gradient(135deg, ${color} 0%, transparent 100%)` }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}15` }}>
            <Icon className="text-xl" style={{ color }} />
          </div>
          {trend && (
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${trend > 0
              ? 'bg-green-100/80 text-green-700 dark:bg-green-500/20 dark:text-green-400'
              : 'bg-red-100/80 text-red-700 dark:bg-red-500/20 dark:text-red-400'
              }`}>
              {trend > 0 ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
        <h3 className="text-2xl font-bold mb-1" style={{ color: themeColors.text }}>{value}</h3>
        <p className="text-sm font-medium" style={{ color: themeColors.textSecondary }}>{label}</p>
        {trendValue && (
          <p className="text-xs mt-2" style={{ color: themeColors.textSecondary }}>{trendValue}</p>
        )}
      </div>
    </div>
  );
};

// Modern Input Field
const InputField = ({ label, name, value, onChange, type = "text", required = false, icon: Icon, placeholder = "", themeColors }) => (
  <div className="space-y-2">
    <label className="text-xs font-semibold flex items-center gap-2" style={{ color: themeColors.textSecondary }}>
      {Icon && <Icon size={14} style={{ color: themeColors.textSecondary }} />}
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
      style={{
        backgroundColor: themeColors.background,
        borderColor: themeColors.border,
        color: themeColors.text
      }}
    />
  </div>
);

// Modern TextArea Field
const TextAreaField = ({ label, name, value, onChange, required = false, icon: Icon, placeholder = "", themeColors, rows = 3 }) => (
  <div className="space-y-2">
    <label className="text-xs font-semibold flex items-center gap-2" style={{ color: themeColors.textSecondary }}>
      {Icon && <Icon size={14} style={{ color: themeColors.textSecondary }} />}
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      name={name}
      value={value || ""}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-none"
      style={{
        backgroundColor: themeColors.background,
        borderColor: themeColors.border,
        color: themeColors.text
      }}
    />
  </div>
);

// Modern Select Field
const SelectField = ({ label, name, value, onChange, options, icon: Icon, themeColors, required = false }) => (
  <div className="space-y-2">
    <label className="text-xs font-semibold flex items-center gap-2" style={{ color: themeColors.textSecondary }}>
      {Icon && <Icon size={14} style={{ color: themeColors.textSecondary }} />}
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 cursor-pointer"
      style={{
        backgroundColor: themeColors.background,
        borderColor: themeColors.border,
        color: themeColors.text
      }}
    >
      {options}
    </select>
  </div>
);

// Modern Modal Component
const Modal = ({ isOpen, onClose, title, children, themeColors, size = "2xl" }) => {
  if (!isOpen || !themeColors) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-3xl",
    "2xl": "max-w-4xl",
    full: "max-w-6xl"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden animate-scaleIn`}
        style={{ backgroundColor: themeColors.surface }}>
        <div className="p-6 border-b" style={{ borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold" style={{ color: themeColors.text }}>{title}</h2>
            <button onClick={onClose} className="p-2 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5">
              <FaTimes size={20} style={{ color: themeColors.textSecondary }} />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

// Vendor Detail Modal
const VendorDetailModal = ({ vendor, isOpen, onClose, themeColors }) => {
  if (!vendor) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vendor Details" themeColors={themeColors} size="xl">
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-center gap-6 p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/10">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl">
            {vendor.image ? (
              <img 
                src={`${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '')}/uploads/${vendor.image}`} 
                alt={vendor.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-3xl font-bold">
                {vendor.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: themeColors.text }}>{vendor.name}</h2>
            <p className="text-sm font-medium" style={{ color: themeColors.primary }}>{vendor.companyName}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${vendor.isActive ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
                {vendor.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <FaMapMarkerAlt size={10} /> {vendor.assignedArea}
              </span>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: themeColors.primary }}>
              <FaUserCircle size={14} />
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: `${themeColors.primary}10` }}>
                <p className="text-xs mb-1" style={{ color: themeColors.textSecondary }}>Full Name</p>
                <p className="font-semibold" style={{ color: themeColors.text }}>{vendor.name}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: `${themeColors.primary}10` }}>
                <p className="text-xs mb-1" style={{ color: themeColors.textSecondary }}>Company Name</p>
                <p className="font-semibold" style={{ color: themeColors.text }}>{vendor.companyName}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: `${themeColors.primary}10` }}>
                <p className="text-xs mb-1" style={{ color: themeColors.textSecondary }}>Email</p>
                <p className="font-semibold" style={{ color: themeColors.text }}>{vendor.email}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: `${themeColors.primary}10` }}>
                <p className="text-xs mb-1" style={{ color: themeColors.textSecondary }}>Phone</p>
                <p className="font-semibold" style={{ color: themeColors.text }}>{vendor.phone}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: `${themeColors.primary}10` }}>
                <p className="text-xs mb-1" style={{ color: themeColors.textSecondary }}>Password</p>
                <p className="font-semibold font-mono" style={{ color: themeColors.text }}>{vendor.password}</p>
              </div>
            </div>
          </div>

          {/* Location Info */}
          <div className="col-span-2">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: themeColors.primary }}>
              <FaMapMarkerAlt size={14} />
              Location Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: `${themeColors.primary}10` }}>
                <p className="text-xs mb-1" style={{ color: themeColors.textSecondary }}>Assigned Area</p>
                <p className="font-semibold" style={{ color: themeColors.text }}>{vendor.assignedArea}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: `${themeColors.primary}10` }}>
                <p className="text-xs mb-1" style={{ color: themeColors.textSecondary }}>Address</p>
                <p className="font-semibold" style={{ color: themeColors.text }}>{vendor.address || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Financial Info */}
          <div className="col-span-2">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: themeColors.primary }}>
              <FaMoneyBillWave size={14} />
              Financial Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: `${themeColors.primary}10` }}>
                <p className="text-xs mb-1" style={{ color: themeColors.textSecondary }}>Commission Percentage</p>
                <p className="font-semibold text-xl" style={{ color: themeColors.primary }}>{vendor.commissionPercentage}%</p>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: `${themeColors.primary}10` }}>
                <p className="text-xs mb-1" style={{ color: themeColors.textSecondary }}>Wallet Balance</p>
                <p className="font-semibold text-xl" style={{ color: '#10b981' }}>₹{(vendor.walletBalance || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          {vendor.bankDetails && (
            <div className="col-span-2">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: themeColors.primary }}>
                <FaUniversity size={14} />
                Bank Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl" style={{ backgroundColor: `${themeColors.primary}10` }}>
                  <p className="text-xs mb-1" style={{ color: themeColors.textSecondary }}>Bank Name</p>
                  <p className="font-semibold" style={{ color: themeColors.text }}>{vendor.bankDetails.bankName}</p>
                </div>
                <div className="p-4 rounded-xl" style={{ backgroundColor: `${themeColors.primary}10` }}>
                  <p className="text-xs mb-1" style={{ color: themeColors.textSecondary }}>Account Holder</p>
                  <p className="font-semibold" style={{ color: themeColors.text }}>{vendor.bankDetails.accountHolderName}</p>
                </div>
                <div className="p-4 rounded-xl" style={{ backgroundColor: `${themeColors.primary}10` }}>
                  <p className="text-xs mb-1" style={{ color: themeColors.textSecondary }}>Account Number</p>
                  <p className="font-semibold font-mono" style={{ color: themeColors.text }}>{vendor.bankDetails.accountNumber}</p>
                </div>
                <div className="p-4 rounded-xl" style={{ backgroundColor: `${themeColors.primary}10` }}>
                  <p className="text-xs mb-1" style={{ color: themeColors.textSecondary }}>IFSC Code</p>
                  <p className="font-semibold font-mono" style={{ color: themeColors.text }}>{vendor.bankDetails.ifscCode}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="col-span-2">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: themeColors.primary }}>
              <FaChartLine size={14} />
              Performance Stats
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl text-center" style={{ backgroundColor: `${themeColors.primary}10` }}>
                <p className="text-xs mb-1" style={{ color: themeColors.textSecondary }}>Total Drivers</p>
                <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{vendor.totalDrivers || 0}</p>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ backgroundColor: `${themeColors.primary}10` }}>
                <p className="text-xs mb-1" style={{ color: themeColors.textSecondary }}>Total Earnings</p>
                <p className="text-2xl font-bold" style={{ color: '#10b981' }}>₹{(vendor.totalEarnings || 0).toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ backgroundColor: `${themeColors.primary}10` }}>
                <p className="text-xs mb-1" style={{ color: themeColors.textSecondary }}>Status</p>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${vendor.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {vendor.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default function VendorManagement() {
  const { themeColors, theme } = useTheme();
  const { currentFont } = useFont();

  const IMAGE_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') + '/uploads/';

  // State Management
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [createImage, setCreateImage] = useState(null);
  const [commissionValue, setCommissionValue] = useState(25);
  const [commissionHistory, setCommissionHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Form States
  const [createForm, setCreateForm] = useState({
    name: "", email: "", phone: "", password: "",
    companyName: "", assignedArea: "", commissionPercentage: 25,
    address: "", city: "", state: "", pincode: "",
    accountNumber: "", ifscCode: "", accountHolderName: "", bankName: ""
  });

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    companyName: "",
    assignedArea: "",
    commissionPercentage: 25,
    address: "",
    bankDetails: {
      accountNumber: "",
      ifscCode: "",
      accountHolderName: "",
      bankName: ""
    }
  });


  useEffect(() => {
    fetchAllVendors();
  }, []);

  const fetchAllVendors = async () => {
    try {
      setLoading(true);
      const [vendorsRes, statsRes] = await Promise.all([
        getAllVendors(),
        getDashboardStats().catch(() => null) // Fallback if admin stats fail
      ]);
      setVendors(vendorsRes.vendors || []);
      if (statsRes) setDashboardStats(statsRes);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch vendors",
        background: themeColors.surface,
        color: themeColors.text
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorDetails = async (vendorId) => {
    try {
      const response = await getVendorById(vendorId);
      return response.vendor;
    } catch (error) {
      console.error("Error fetching vendor details:", error);
      return null;
    }
  };

  const fetchCommissionHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await getCommissionHistory();
      setCommissionHistory(response.transactions || []);
    } catch (error) {
      console.error("Error fetching commission history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      let payload;
      if (createImage) {
        payload = new FormData();
        Object.entries(createForm).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") payload.append(k, v);
        });
        payload.append("image", createImage);
      } else {
        payload = { ...createForm };
      }

      await createVendor(payload);
      Swal.fire({ icon: "success", title: "Vendor Created!", timer: 1500, showConfirmButton: false, background: themeColors.surface, color: themeColors.text });
      setShowCreateModal(false);
      setCreateImage(null);
      setCreateForm({ name: "", email: "", phone: "", password: "", companyName: "", assignedArea: "", commissionPercentage: 25, address: "", city: "", state: "", pincode: "", accountNumber: "", ifscCode: "", accountHolderName: "", bankName: "" });
      fetchAllVendors();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error?.response?.data?.message || error.message || "Failed to create vendor", background: themeColors.surface, color: themeColors.text });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVendor = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateVendor(selectedVendor._id, editForm);
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Vendor updated successfully",
        timer: 1500,
        showConfirmButton: false,
        background: themeColors.surface,
        color: themeColors.text
      });
      setShowEditModal(false);
      fetchAllVendors();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to update vendor",
        background: themeColors.surface,
        color: themeColors.text
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCommission = async () => {
    try {
      setLoading(true);
      await updateVendorCommission(selectedVendor._id, commissionValue);
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Commission updated successfully",
        timer: 1500,
        showConfirmButton: false,
        background: themeColors.surface,
        color: themeColors.text
      });
      setShowCommissionModal(false);
      fetchAllVendors();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to update commission",
        background: themeColors.surface,
        color: themeColors.text
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (vendorId) => {
    try {
      await toggleVendorStatus(vendorId);
      fetchAllVendors();
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Vendor status updated",
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
        background: themeColors.surface,
        color: themeColors.text
      });
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const handleDeleteVendor = async (vendorId, vendorName) => {
    const result = await Swal.fire({
      title: "Delete Vendor?",
      text: `Are you sure you want to delete ${vendorName}? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      background: themeColors.surface,
      color: themeColors.text
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await deleteVendor(vendorId);
        Swal.fire({
          icon: "success",
          title: "Deleted",
          text: "Vendor deleted successfully",
          timer: 1500,
          showConfirmButton: false,
          background: themeColors.surface,
          color: themeColors.text
        });
        fetchAllVendors();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "Failed to delete vendor",
          background: themeColors.surface,
          color: themeColors.text
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewVendor = async (vendor) => {
    setSelectedVendor(vendor);
    setShowDetailModal(true);
  };

  const handleEditVendor = async (vendor) => {
    setSelectedVendor(vendor);
    setEditForm({
      name: vendor.name || "",
      email: vendor.email || "",
      phone: vendor.phone || "",
      companyName: vendor.companyName || "",
      assignedArea: vendor.assignedArea || "",
      commissionPercentage: vendor.commissionPercentage || 25,
      address: vendor.address || "",
      bankDetails: vendor.bankDetails || {
        accountNumber: "",
        ifscCode: "",
        accountHolderName: "",
        bankName: ""
      }
    });
    setShowEditModal(true);
  };

  const handleOpenCommissionModal = (vendor) => {
    setSelectedVendor(vendor);
    setCommissionValue(vendor.commissionPercentage);
    setShowCommissionModal(true);
  };

  const handleViewHistory = async () => {
    await fetchCommissionHistory();
    setShowHistoryModal(true);
  };

  // Filter vendors based on search and active tab
  const filteredVendors = useMemo(() => {
    let list = vendors;
    if (activeTab === "active") {
      list = list.filter(v => v.isActive);
    } else if (activeTab === "inactive") {
      list = list.filter(v => !v.isActive);
    }
    return list.filter(v =>
      v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.assignedArea?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [vendors, searchQuery, activeTab]);

  const paginatedVendors = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredVendors.slice(start, start + rowsPerPage);
  }, [filteredVendors, currentPage]);

  const totalPages = Math.ceil(filteredVendors.length / rowsPerPage);

  // Stats calculation
  const stats = useMemo(() => ({
    total: vendors.length,
    active: vendors.filter(v => v.isActive).length,
    inactive: vendors.filter(v => !v.isActive).length,
    totalDrivers: vendors.reduce((sum, v) => sum + (v.totalDrivers || 0), 0),
    totalCommission: vendors.reduce((sum, v) => sum + (v.totalEarnings || 0) * (v.commissionPercentage || 25) / 100, 0)
  }), [vendors]);

  // Highcharts Dynamic Options
  const chartOptions = useMemo(() => {
    // Area distribution count
    const areaCounts = vendors.reduce((acc, v) => {
      const area = v.assignedArea || 'Unassigned';
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {});

    // Revenue per area
    const areaRevenue = vendors.reduce((acc, v) => {
      const area = v.assignedArea || 'Unassigned';
      acc[area] = (acc[area] || 0) + (v.totalEarnings || 0);
      return acc;
    }, {});

    const commonChartStyles = {
      chart: {
        backgroundColor: 'transparent',
        style: { fontFamily: currentFont?.family || 'inherit' }
      },
      title: { style: { color: themeColors.text, fontWeight: 'bold' } },
      xAxis: {
        labels: { style: { color: themeColors.textSecondary } },
        lineColor: themeColors.border
      },
      yAxis: {
        gridLineColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        labels: { style: { color: themeColors.textSecondary } },
        title: { style: { color: themeColors.textSecondary } }
      },
      legend: { itemStyle: { color: themeColors.text } },
      credits: { enabled: false }
    };

    return {
      areaDistribution: {
        ...commonChartStyles,
        chart: { ...commonChartStyles.chart, type: 'column' },
        title: { ...commonChartStyles.title, text: 'Vendors by Area' },
        xAxis: { ...commonChartStyles.xAxis, categories: Object.keys(areaCounts) },
        series: [{
          name: 'Vendors',
          data: Object.values(areaCounts),
          color: '#3b82f6',
          borderRadius: 4
        }]
      },
      statusSplit: {
        ...commonChartStyles,
        chart: { ...commonChartStyles.chart, type: 'pie' },
        title: { ...commonChartStyles.title, text: 'Status Distribution' },
        plotOptions: {
          pie: {
            innerSize: '65%',
            borderWidth: 0,
            dataLabels: { enabled: false }
          }
        },
        series: [{
          name: 'Vendors',
          data: [
            { name: 'Active', y: stats.active, color: '#10b981' },
            { name: 'Inactive', y: stats.inactive, color: '#ef4444' }
          ]
        }]
      },
      revenueTrend: {
        ...commonChartStyles,
        chart: { ...commonChartStyles.chart, type: 'areaspline' },
        title: { ...commonChartStyles.title, text: 'Monthly Revenue Growth' },
        xAxis: { 
          ...commonChartStyles.xAxis, 
          categories: dashboardStats?.monthlyTrends?.map(t => t.month) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] 
        },
        series: [{
          name: 'Actual Revenue',
          data: dashboardStats?.monthlyTrends?.map(t => t.revenue) || [15000, 22000, 18000, 31000, 28000, 45000],
          color: '#8b5cf6',
          fillOpacity: 0.1
        }]
      },
      areaRevenue: {
        ...commonChartStyles,
        chart: { ...commonChartStyles.chart, type: 'bar' },
        title: { ...commonChartStyles.title, text: 'Earnings by Location' },
        xAxis: { ...commonChartStyles.xAxis, categories: Object.keys(areaRevenue) },
        series: [{
          name: 'Total Earnings',
          data: Object.values(areaRevenue),
          color: '#f59e0b',
          borderRadius: 4
        }]
      }
    };
  }, [vendors, stats, theme, themeColors, currentFont, dashboardStats]);

  return (
    <div className="min-h-screen transition-colors duration-300"
      style={{
        backgroundColor: themeColors.background,
        fontFamily: currentFont?.family
      }}>

      {/* Header Section */}
      <div className="p-2"
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border
        }}>
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: themeColors.text }}>
                Vendor Management
              </h1>
              <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>
                Manage all vendors, commissions, and performance
              </p>
            </div>

            <div className="flex gap-3">
              <div className="relative flex-1 min-w-[300px]">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: themeColors.textSecondary }} />
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  style={{
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }}
                />
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 rounded-xl text-white shadow-lg transition-all duration-200 flex items-center gap-2 font-medium"
                style={{ backgroundColor: themeColors.primary }}
              >
                <FaPlus size={16} />
                <span>Add Vendor</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={FaBuilding}
            label="Total Vendors"
            value={stats.total}
            color="#3b82f6"
            trend={8}
            themeColors={themeColors}
          />
          <StatCard
            icon={FaCheckCircle}
            label="Active Vendors"
            value={stats.active}
            color="#10b981"
            trend={5}
            themeColors={themeColors}
          />
          <StatCard
            icon={FaUsers}
            label="Total Drivers"
            value={stats.totalDrivers}
            color="#8b5cf6"
            trend={12}
            themeColors={themeColors}
          />
          <StatCard
            icon={FaMoneyBillWave}
            label="Total Commission"
            value={`₹${stats.totalCommission.toLocaleString()}`}
            color="#f59e0b"
            trend={15}
            themeColors={themeColors}
          />
        </div>


        {/* Analytics Charts - Highcharts Dynamic */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Chart 1: Area Distribution */}
          <div className="p-6 rounded-2xl shadow-sm border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <HighchartsReact highcharts={Highcharts} options={chartOptions.areaDistribution} />
          </div>

          {/* Chart 2: Status Distribution */}
          <div className="p-6 rounded-2xl shadow-sm border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <HighchartsReact highcharts={Highcharts} options={chartOptions.statusSplit} />
          </div>

          {/* Chart 3: Revenue Growth */}
          <div className="p-6 rounded-2xl shadow-sm border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <HighchartsReact highcharts={Highcharts} options={chartOptions.revenueTrend} />
          </div>

          {/* Chart 4: Location Revenue */}
          <div className="p-6 rounded-2xl shadow-sm border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <HighchartsReact highcharts={Highcharts} options={chartOptions.areaRevenue} />
          </div>
        </div>

        {/* Vendors Table Container */}
        <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          {/* Modern Design Tabs (Always visible) */}
          <div className="flex items-center gap-8 px-6 border-b overflow-x-auto no-scrollbar" style={{ borderColor: themeColors.border }}>
            {[
              { id: "all", label: "All Vendors", icon: FaBuilding, count: stats.total },
              { id: "active", label: "Active", icon: FaCheckCircle, count: stats.active },
              { id: "inactive", label: "Inactive", icon: FaTimesCircle, count: stats.inactive }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex items-center gap-2 py-4 px-1 font-bold transition-all duration-200 whitespace-nowrap"
                style={{
                  color: activeTab === tab.id ? themeColors.primary : themeColors.textSecondary,
                }}
              >
                <tab.icon size={16} className={activeTab === tab.id ? "" : "opacity-80"} />
                <span className="text-sm">{tab.label}</span>
                <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-extrabold ${activeTab === tab.id
                  ? 'bg-[#3b82f6] text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                  {tab.count}
                </span>
                {/* Active Underline */}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ backgroundColor: themeColors.primary }} />
                )}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            {loading && vendors.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5 text-gray-400">
                  <FaBuilding className="text-3xl opacity-40" />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: themeColors.text }}>No {activeTab} vendors found</h3>
                <p className="text-sm" style={{ color: themeColors.textSecondary }}>Try switching tabs or searching for another vendor</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-[#f8f9fa] dark:bg-white/5 border-b" style={{ borderColor: themeColors.border }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-[13px] font-bold uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>Vendor</th>
                    <th className="px-6 py-4 text-left text-[13px] font-bold uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>Contact</th>
                    <th className="px-6 py-4 text-left text-[13px] font-bold uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>Password</th>
                    <th className="px-6 py-4 text-left text-[13px] font-bold uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>Area</th>
                    <th className="px-6 py-4 text-left text-[13px] font-bold uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>Commission</th>
                    <th className="px-6 py-4 text-left text-[13px] font-bold uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>Drivers</th>
                    <th className="px-6 py-4 text-left text-[13px] font-bold uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>Earnings</th>
                    <th className="px-6 py-4 text-left text-[13px] font-bold uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>Status</th>
                    <th className="px-6 py-4 text-right text-[13px] font-bold uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: themeColors.border }}>
                  {paginatedVendors.map((vendor) => (
                    <tr key={vendor._id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center font-bold shadow-sm"
                            style={{ color: themeColors.primary, border: `1px solid ${themeColors.border}` }}>
                            {vendor.image ? (
                              <img 
                                src={`${IMAGE_BASE_URL}${vendor.image}`} 
                                alt={vendor.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=' + vendor.name; }}
                              />
                            ) : (
                              vendor.name?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-[15px]" style={{ color: themeColors.text }}>{vendor.name}</div>
                            <div className="text-xs font-medium" style={{ color: themeColors.textSecondary }}>{vendor.companyName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium" style={{ color: themeColors.text }}>{vendor.email}</div>
                        <div className="text-xs" style={{ color: themeColors.textSecondary }}>{vendor.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium font-mono" style={{ color: themeColors.text }}>{vendor.password}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#3b82f615] text-[#3b82f6]">
                          {vendor.assignedArea}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-extrabold" style={{ color: themeColors.primary }}>{vendor.commissionPercentage}%</span>
                          <button
                            onClick={() => handleOpenCommissionModal(vendor)}
                            className="p-1.5 rounded-lg transition-all hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            <FaEdit size={12} style={{ color: themeColors.textSecondary }} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold" style={{ color: themeColors.text }}>{vendor.totalDrivers || 0}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-green-600">₹{(vendor.totalEarnings || 0).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${vendor.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                            }`}>
                            {vendor.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            onClick={() => handleToggleStatus(vendor._id)}
                            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            {vendor.isActive ? <FaToggleOn size={22} className="text-green-500" /> : <FaToggleOff size={22} className="text-gray-400" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewVendor(vendor)}
                            className="p-2.5 rounded-xl transition-all hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-600"
                            title="View Details"
                          >
                            <FaEyeIcon size={18} />
                          </button>
                          <button
                            onClick={() => handleEditVendor(vendor)}
                            className="p-2.5 rounded-xl transition-all hover:bg-amber-50 dark:hover:bg-amber-500/10 text-amber-600"
                            title="Edit Vendor"
                          >
                            <FaEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteVendor(vendor._id, vendor.name)}
                            className="p-2.5 rounded-xl transition-all hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600"
                            title="Delete Vendor"
                          >
                            <FaTrash size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: themeColors.border }}>
              <div className="flex items-center gap-4">
                <p className="text-sm" style={{ color: themeColors.textSecondary }}>
                  Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredVendors.length)} of {filteredVendors.length} vendors
                </p>
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-xs font-medium" style={{ color: themeColors.textSecondary }}>Rows:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.border,
                      color: themeColors.text
                    }}
                  >
                    {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }}
                >
                  <FaChevronLeft size={14} />
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-xl font-medium transition-all duration-200 ${currentPage === pageNum
                          ? 'text-white shadow-lg'
                          : 'border'
                          }`}
                        style={{
                          backgroundColor: currentPage === pageNum ? themeColors.primary : 'transparent',
                          borderColor: themeColors.border,
                          color: currentPage === pageNum ? themeColors.onPrimary : themeColors.text
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && <span style={{ color: themeColors.textSecondary }}>...</span>}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-4 py-2 rounded-xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }}
                >
                  <FaChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Vendor" themeColors={themeColors} size="xl">
        <form onSubmit={handleCreateVendor} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Full Name" name="name" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} icon={FaUserTie} required placeholder="Enter vendor name" themeColors={themeColors} />
            <InputField label="Company Name" name="companyName" value={createForm.companyName} onChange={(e) => setCreateForm({ ...createForm, companyName: e.target.value })} icon={FaBuilding} required placeholder="Enter company name" themeColors={themeColors} />
            <InputField label="Email" name="email" type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} icon={FaEnvelope} required placeholder="Enter email address" themeColors={themeColors} />
            <InputField label="Phone" name="phone" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} icon={FaPhone} required placeholder="Enter phone number" themeColors={themeColors} />
            <InputField label="Password" name="password" type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} icon={FaLock} required placeholder="Enter password" themeColors={themeColors} />
            <InputField label="Assigned Area" name="assignedArea" value={createForm.assignedArea} onChange={(e) => setCreateForm({ ...createForm, assignedArea: e.target.value })} icon={FaMapMarkerAlt} required placeholder="e.g. Pune" themeColors={themeColors} />
            <InputField label="Commission %" name="commissionPercentage" type="number" value={createForm.commissionPercentage} onChange={(e) => setCreateForm({ ...createForm, commissionPercentage: e.target.value })} icon={FaPercent} required placeholder="e.g. 25" themeColors={themeColors} />
            <InputField label="Address" name="address" value={createForm.address} onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })} icon={FaMapMarkerAlt} placeholder="Full address" themeColors={themeColors} />
            <InputField label="City" name="city" value={createForm.city} onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })} icon={FaMapMarkerAlt} placeholder="City" themeColors={themeColors} />
            <InputField label="State" name="state" value={createForm.state} onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })} icon={FaMapMarkerAlt} placeholder="State" themeColors={themeColors} />
            <InputField label="Pincode" name="pincode" value={createForm.pincode} onChange={(e) => setCreateForm({ ...createForm, pincode: e.target.value })} icon={FaMapMarkerAlt} placeholder="Pincode" themeColors={themeColors} />
          </div>

          <div className="border-t pt-4" style={{ borderColor: themeColors.border }}>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: themeColors.primary }}>
              <FaUniversity size={14} /> Bank Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Bank Name" name="bankName" value={createForm.bankName} onChange={(e) => setCreateForm({ ...createForm, bankName: e.target.value })} icon={FaUniversity} placeholder="Enter bank name" themeColors={themeColors} />
              <InputField label="Account Holder Name" name="accountHolderName" value={createForm.accountHolderName} onChange={(e) => setCreateForm({ ...createForm, accountHolderName: e.target.value })} icon={FaUserCircle} placeholder="Account holder name" themeColors={themeColors} />
              <InputField label="Account Number" name="accountNumber" value={createForm.accountNumber} onChange={(e) => setCreateForm({ ...createForm, accountNumber: e.target.value })} icon={FaCreditCard} placeholder="Enter account number" themeColors={themeColors} />
              <InputField label="IFSC Code" name="ifscCode" value={createForm.ifscCode} onChange={(e) => setCreateForm({ ...createForm, ifscCode: e.target.value })} icon={FaFileInvoice} placeholder="e.g. SBIN0001234" themeColors={themeColors} />
            </div>
          </div>

          {/* Image Upload */}
          <div className="border-t pt-4" style={{ borderColor: themeColors.border }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: themeColors.primary }}>Profile Image</h3>
            <div className="flex items-center gap-4">
              <input type="file" accept="image/*" onChange={(e) => setCreateImage(e.target.files[0])}
                className="flex-1 p-2 border rounded-xl text-sm"
                style={{ borderColor: themeColors.border, color: themeColors.text, backgroundColor: themeColors.background }} />
              {createImage && (
                <img src={URL.createObjectURL(createImage)} alt="preview" className="w-14 h-14 rounded-xl object-cover border" style={{ borderColor: themeColors.border }} />
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => { setShowCreateModal(false); setCreateImage(null); }}
              className="flex-1 px-6 py-3 rounded-xl font-medium border"
              style={{ borderColor: themeColors.border, color: themeColors.text }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-6 py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2 text-white"
              style={{ backgroundColor: themeColors.primary }}>
              {loading && <FaSyncAlt className="animate-spin" size={16} />}
              Create Vendor
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Vendor Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Vendor" themeColors={themeColors} size="xl">
        <form onSubmit={handleUpdateVendor} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Full Name"
              name="name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              icon={FaUserTie}
              required
              placeholder="Enter vendor name"
              themeColors={themeColors}
            />
            <InputField
              label="Company Name"
              name="companyName"
              value={editForm.companyName}
              onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
              icon={FaBuilding}
              required
              placeholder="Enter company name"
              themeColors={themeColors}
            />
            <InputField
              label="Email"
              name="email"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              icon={FaEnvelope}
              required
              placeholder="Enter email address"
              themeColors={themeColors}
            />
            <InputField
              label="Phone"
              name="phone"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              icon={FaPhone}
              required
              placeholder="Enter phone number"
              themeColors={themeColors}
            />
            <InputField
              label="Assigned Area"
              name="assignedArea"
              value={editForm.assignedArea}
              onChange={(e) => setEditForm({ ...editForm, assignedArea: e.target.value })}
              icon={FaMapMarkerAlt}
              required
              placeholder="Enter assigned area"
              themeColors={themeColors}
            />
            <InputField
              label="Commission Percentage"
              name="commissionPercentage"
              type="number"
              value={editForm.commissionPercentage}
              onChange={(e) => setEditForm({ ...editForm, commissionPercentage: parseInt(e.target.value) })}
              icon={FaPercent}
              required
              placeholder="Enter commission percentage"
              themeColors={themeColors}
            />
            <TextAreaField
              label="Address"
              name="address"
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              icon={FaMapMarkerAlt}
              placeholder="Enter full address"
              themeColors={themeColors}
              rows={2}
            />
          </div>

          <div className="border-t pt-4" style={{ borderColor: themeColors.border }}>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: themeColors.primary }}>
              <FaUniversity size={14} />
              Bank Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Bank Name"
                name="bankName"
                value={editForm.bankDetails?.bankName || ""}
                onChange={(e) => setEditForm({
                  ...editForm,
                  bankDetails: { ...editForm.bankDetails, bankName: e.target.value }
                })}
                icon={FaUniversity}
                placeholder="Enter bank name"
                themeColors={themeColors}
              />
              <InputField
                label="Account Holder Name"
                name="accountHolderName"
                value={editForm.bankDetails?.accountHolderName || ""}
                onChange={(e) => setEditForm({
                  ...editForm,
                  bankDetails: { ...editForm.bankDetails, accountHolderName: e.target.value }
                })}
                icon={FaUserCircle}
                placeholder="Enter account holder name"
                themeColors={themeColors}
              />
              <InputField
                label="Account Number"
                name="accountNumber"
                value={editForm.bankDetails?.accountNumber || ""}
                onChange={(e) => setEditForm({
                  ...editForm,
                  bankDetails: { ...editForm.bankDetails, accountNumber: e.target.value }
                })}
                icon={FaCreditCard}
                placeholder="Enter account number"
                themeColors={themeColors}
              />
              <InputField
                label="IFSC Code"
                name="ifscCode"
                value={editForm.bankDetails?.ifscCode || ""}
                onChange={(e) => setEditForm({
                  ...editForm,
                  bankDetails: { ...editForm.bankDetails, ifscCode: e.target.value }
                })}
                icon={FaFileInvoice}
                placeholder="Enter IFSC code"
                themeColors={themeColors}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="flex-1 px-6 py-3 rounded-xl font-medium transition-colors border"
              style={{
                borderColor: themeColors.border,
                color: themeColors.text
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-white"
              style={{ backgroundColor: themeColors.primary }}
            >
              {loading && <FaSyncAlt className="animate-spin" size={16} />}
              Update Vendor
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Commission Modal */}
      <Modal isOpen={showCommissionModal} onClose={() => setShowCommissionModal(false)} title="Update Commission Percentage" themeColors={themeColors}>
        <div className="space-y-6">
          <div className="rounded-xl p-4" style={{ backgroundColor: `${themeColors.primary}15` }}>
            <p className="text-sm" style={{ color: themeColors.primary }}>
              Current vendor: <strong>{selectedVendor?.name}</strong>
            </p>
            <p className="text-xs mt-1" style={{ color: themeColors.textSecondary }}>
              Current commission: <strong>{selectedVendor?.commissionPercentage}%</strong>
            </p>
          </div>
          <InputField
            label="New Commission Percentage"
            name="commission"
            type="number"
            value={commissionValue}
            onChange={(e) => setCommissionValue(parseInt(e.target.value))}
            icon={FaPercent}
            required
            placeholder="Enter new commission percentage"
            themeColors={themeColors}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowCommissionModal(false)}
              className="flex-1 px-6 py-3 rounded-xl font-medium transition-colors border"
              style={{
                borderColor: themeColors.border,
                color: themeColors.text
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateCommission}
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-white"
              style={{ backgroundColor: themeColors.primary }}
            >
              {loading && <FaSyncAlt className="animate-spin" size={16} />}
              Update Commission
            </button>
          </div>
        </div>
      </Modal>

      {/* Vendor Detail Modal */}
      <VendorDetailModal
        vendor={selectedVendor}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        themeColors={themeColors}
      />

      {/* Commission History Modal */}
      <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} title="Commission History" themeColors={themeColors} size="lg">
        {historyLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : commissionHistory.length === 0 ? (
          <div className="text-center py-12">
            <FaHistory size={48} className="mx-auto mb-4 opacity-30" />
            <p style={{ color: themeColors.textSecondary }}>No commission history found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {commissionHistory.map((transaction, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border"
                style={{ borderColor: themeColors.border }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FaMoneyBillWave className="text-green-500" />
                    <span className="font-semibold" style={{ color: themeColors.text }}>
                      ₹{transaction.amount?.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: themeColors.textSecondary }}>
                    {new Date(transaction.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm" style={{ color: themeColors.textSecondary }}>
                  {transaction.description || "Commission payment"}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${transaction.status === 'completed'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                    {transaction.status || 'Completed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
