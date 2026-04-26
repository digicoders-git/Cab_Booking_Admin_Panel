import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useFont } from "../context/FontContext";
import {
  getAllDrivers, approveDriver, rejectDriver, updateDriver, toggleDriverStatus, deleteDriver, registerDriver,
  searchDriversByRadius
} from "../apis/driver";
import { toggleDriverOnline } from "../apis/admin";
import { getAllCarCategories } from "../apis/carCategory";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
  AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Scatter, ScatterChart,
  RadialBarChart, RadialBar
} from 'recharts';
import {
  FaTimes, FaEye, FaSyncAlt, FaEdit, FaPlus,
  FaToggleOn, FaToggleOff, FaSearch, FaCar, FaCheckCircle,
  FaTimesCircle, FaUserCircle, FaIdCard, FaBuilding, FaPhoneAlt, FaEnvelope,
  FaMoneyBillWave, FaRoute, FaUsers, FaCouch, FaCircle, FaCalendarAlt, FaChevronLeft, FaChevronRight, FaStar, FaTrash,
  FaBan, FaMapMarkerAlt, FaLandmark, FaPalette, FaHistory, FaGlobe, FaClock, FaFileInvoice,
  FaChartPie, FaChartBar, FaChartLine, FaChartArea, FaDownload, FaFilter, FaPrint, FaFilePdf, FaFileExcel,
  FaGasPump, FaCogs, FaChair, FaPallet, FaWrench, FaShieldAlt, FaCreditCard
} from "react-icons/fa";
import {
  Download, Filter, TrendingUp, DollarSign, Activity,
  PieChart as PieChartIcon, BarChart3, LineChart as LineChartIcon,
  Target, Gauge, Zap, Shield, MoreVertical, DownloadCloud, Printer,
  User, Users, Wallet, Briefcase, MapPin, Clock, Mail, Phone, Calendar,
  Map, Home, CreditCard, Award, Star as StarIcon
} from 'lucide-react';
import Swal from "sweetalert2";

// Chart Colors
const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
  cyan: '#06B6D4',
  orange: '#F97316',
  teal: '#14B8A6',
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#F59E0B',
  red: '#EF4444',
  violet: '#8B5CF6',
  gray: '#6B7280',
  lightGray: '#E5E7EB'
};

// --- Registry Configuration Hub ---
const initialForm = {
  name: "", email: "", phone: "", password: "",
  address: "", city: "", state: "", pincode: "",
  licenseNumber: "", licenseExpiry: "",
  aadharNumber: "", panNumber: "",
  carNumber: "", carModel: "", carBrand: "", carType: "",
  carColor: "", manufacturingYear: "", seatCapacity: 4,
  insuranceExpiry: "", permitExpiry: "", pucExpiry: "",
  lastServiceDate: "", nextServiceDate: "", debtLimit: -500,
  accountNumber: "", ifscCode: "", accountHolderName: "", bankName: "",
  rejectionReason: ""
};

// --- Strategic Visual Components ---

const StatCard = ({ icon: Icon, label, value, color, trend, subtitle }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl bg-${color}-50 group-hover:scale-110 transition-transform`}>
        <Icon className={`text-${color}-600`} size={24} />
      </div>
      {trend && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
    <p className="text-sm text-gray-500">{label}</p>
    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
  </div>
);

const ChartCard = ({ title, subtitle, icon: Icon, children, action }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        {action && (
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <MoreVertical size={16} className="text-gray-400" />
          </button>
        )}
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="text-blue-600" size={20} />
        </div>
      </div>
    </div>
    {children}
  </div>
);

const StatBox = ({ icon: Icon, label, value, colorHex, themeColors, borderColor, textColorSecondary }) => (
  <div className="px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border shadow-sm flex items-center gap-3 transition-colors flex-1 min-w-[140px]"
    style={{ backgroundColor: themeColors.surface, borderColor: borderColor }}>
    <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: colorHex + "15" }}>
      <Icon size={14} style={{ color: colorHex }} />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] sm:text-[10px] font-bold leading-none mb-1 uppercase tracking-wider truncate" style={{ color: textColorSecondary }}>{label}</p>
      <p className="text-xs sm:text-sm font-black truncate" style={{ color: themeColors.text }}>{value}</p>
    </div>
  </div>
);

const Field = ({ label, name, value, onChange, type = "text", required = false, icon: Icon, readOnly = false }) => {
  const { themeColors = {}, theme } = useTheme();
  const borderColor = themeColors.border || (theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)");
  return (
    <div className="space-y-1 w-full">
      <label className="text-xs font-medium flex items-center gap-1.5 text-gray-600">
        {Icon && <Icon size={14} className="text-gray-400" />}
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type} name={name} value={value || ""} onChange={onChange} required={required} readOnly={readOnly}
        className={`w-full h-10 px-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm ${readOnly ? 'bg-gray-100 cursor-not-allowed opacity-75' : ''}`}
        style={{
          backgroundColor: readOnly ? undefined : (themeColors.background || themeColors.surface || "#ffffff"),
          borderColor: borderColor,
          color: themeColors.text || "#000000"
        }}
      />
    </div>
  );
};

const SelectField = ({ label, name, value, onChange, options, required = false, icon: Icon }) => {
  const { themeColors = {}, theme } = useTheme();
  const borderColor = themeColors.border || (theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)");
  return (
    <div className="space-y-1 w-full">
      <label className="text-xs font-medium flex items-center gap-1.5 text-gray-600">
        {Icon && <Icon size={14} className="text-gray-400" />}
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name} value={value || ""} onChange={onChange} required={required}
        className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
        style={{
          backgroundColor: themeColors.background || themeColors.surface || "#ffffff",
          borderColor: borderColor,
          color: themeColors.text || "#000000"
        }}
      >
        <option value="">Select {label}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};

export default function ManageDrivers() {
  const { themeColors } = useTheme();
  const { admin } = useAuth();
  const { currentFont } = useFont();

  // Helper for Granular Permissions
  const can = (permission) => {
    if (admin?.role === 'SuperAdmin') return true;
    return admin?.permissions?.includes(permission);
  };

  const BASE = import.meta.env.VITE_API_BASE_URL || '';
  const IMAGE_BASE_URL = BASE.replace(/\/api\/?$/, '').replace(/\/$/, '') + '/uploads/';

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const [isEditing, setIsEditing] = useState(null);
  const [editForm, setEditForm] = useState(initialForm);
  const [activeTab, setActiveTab] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState('month');
  const [selectedChart, setSelectedChart] = useState('all');
  const [expandedRows, setExpandedRows] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [rcFile, setRcFile] = useState(null);
  const [insuranceFile, setInsuranceFile] = useState(null);
  const [permitFile, setPermitFile] = useState(null);
  const [pucFile, setPucFile] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [radiusSearch, setRadiusSearch] = useState({
    active: false,
    address: "",
    lat: null,
    lng: null,
    radius: 10, // Default 10km
    results: []
  });

  const textColorSecondary = useMemo(() => {
    return themeColors.textSecondary || "rgba(107, 114, 128, 1)";
  }, [themeColors]);

  const borderColor = useMemo(() => {
    return themeColors.border || "rgba(0,0,0,0.05)";
  }, [themeColors]);

  useEffect(() => {
    fetchInitialData();
    
    // Load Google Maps script for Autocomplete
    if (!window.google && !document.getElementById("google-maps-script")) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  const fetchInitialData = async () => {
    try {
      setFetching(true);
      await Promise.all([fetchCategories(), fetchDrivers()]);
    } finally {
      setFetching(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await getAllCarCategories();
      const list = res.categories || res.data || [];
      setCategories(list);
    } catch (err) { console.error("Category sync failed"); }
  };

  const fetchDrivers = async () => {
    try {
      const res = await getAllDrivers();
      let list = res.drivers || [];
      setDrivers([...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch { setDrivers([]); }
  };

  // Advanced Statistics
  const stats = useMemo(() => ({
    total: drivers.length,
    pending: drivers.filter(d => !d.isApproved && !d.isRejected).length,
    approved: drivers.filter(d => d.isApproved).length,
    active: drivers.filter(d => d.isActive).length,
    rejected: drivers.filter(d => d.isRejected).length,
    online: drivers.filter(d => d.isOnline).length,
    totalEarnings: drivers.reduce((sum, d) => sum + (d.totalEarnings || 0), 0),
    totalTrips: drivers.reduce((sum, d) => sum + (d.totalTrips || 0), 0),
    avgRating: (drivers.reduce((sum, d) => sum + (d.rating || 0), 0) / (drivers.length || 1)).toFixed(1)
  }), [drivers]);

  // Chart 1: Driver Status Distribution - Pie Chart
  const statusData = [
    { name: 'Approved', value: stats.approved, color: CHART_COLORS.green },
    { name: 'Pending', value: stats.pending, color: CHART_COLORS.warning },
    { name: 'Rejected', value: stats.rejected, color: CHART_COLORS.red }
  ].filter(item => item.value > 0);

  // Chart 2: Online vs Offline - Pie Chart
  const onlineData = [
    { name: 'Online', value: stats.online, color: CHART_COLORS.green },
    { name: 'Offline', value: stats.approved - stats.online, color: CHART_COLORS.gray }
  ].filter(item => item.value > 0);

  // Chart 3: Performance Metrics - Bar Chart
  const performanceData = [
    { name: 'Total', value: stats.total, color: CHART_COLORS.blue },
    { name: 'Approved', value: stats.approved, color: CHART_COLORS.green },
    { name: 'Active', value: stats.active, color: CHART_COLORS.purple },
    { name: 'Online', value: stats.online, color: CHART_COLORS.cyan }
  ];

  // Chart 4: Top Earners - Bar Chart
  const earningsData = drivers.slice(0, 8).map((d, i) => ({
    name: d.name?.substring(0, 8) || `Driver ${i + 1}`,
    earnings: d.totalEarnings || 0,
    trips: d.totalTrips || 0
  }));

  const filteredDrivers = useMemo(() => {
    let list = radiusSearch.active ? radiusSearch.results : drivers;

    if (activeTab === "pending") {
      list = list.filter(d => !d.isApproved && !d.isRejected);
    } else if (activeTab === "approved") {
      list = list.filter(d => d.isApproved);
    } else if (activeTab === "rejected") {
      list = list.filter(d => d.isRejected);
    } else if (activeTab === "inactive") {
      list = list.filter(d => !d.isActive);
    } else if (activeTab === "online") {
      list = list.filter(d => d.isOnline);
    }

    return list.filter(d =>
      d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.carDetails?.carNumber || d.carNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone?.includes(searchQuery) ||
      d.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.pincode?.includes(searchQuery) ||
      d.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.documents?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.documents?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.documents?.state?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [drivers, searchQuery, activeTab, radiusSearch]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredDrivers.slice(start, start + rowsPerPage);
  }, [filteredDrivers, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredDrivers.length / rowsPerPage);

  const handleApprove = async (id) => {
    const res = await Swal.fire({
      title: "Approve Driver?",
      text: "Authorize this driver for system access.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: themeColors.primary,
      confirmButtonText: "YES, APPROVE"
    });
    if (res.isConfirmed) {
      try {
        const response = await approveDriver(id);
        if (response.success) {
          Swal.fire({
            icon: "success",
            title: "Driver Approved Successfully!",
            html: `
              <div style="text-align: left; margin: 20px 0;">
                <p><strong>Name:</strong> ${response.driver.name}</p>
                <p><strong>Email:</strong> ${response.driver.email}</p>
                <p><strong>Status:</strong> <span style="color: green; font-weight: bold;">✓ Approved</span></p>
                <p><strong>Approved At:</strong> ${new Date(response.driver.approvedAt).toLocaleString()}</p>
              </div>
            `,
            confirmButtonText: "OK",
            background: themeColors.surface,
            color: themeColors.text
          });
          fetchDrivers();
        }
      } catch (err) {
        console.error("Error approving driver:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.message || "Failed to approve driver",
          background: themeColors.surface,
          color: themeColors.text
        });
      }
    }
  };

  const handleReject = async (id) => {
    const { value: reason } = await Swal.fire({
      title: "Reject Driver?",
      input: "textarea",
      inputLabel: "Reason for Rejection",
      inputPlaceholder: "Enter rejection reason...",
      showCancelButton: true,
      confirmButtonColor: themeColors.danger,
      confirmButtonText: "REJECT",
      background: themeColors.surface,
      color: themeColors.text
    });
    if (reason) {
      try {
        const response = await rejectDriver(id, reason);
        if (response.success) {
          Swal.fire({
            icon: "success",
            title: "Driver Rejected Successfully!",
            html: `
              <div style="text-align: left; margin: 20px 0;">
                <p><strong>Name:</strong> ${response.driver.name}</p>
                <p><strong>Email:</strong> ${response.driver.email}</p>
                <p><strong>Status:</strong> <span style="color: red; font-weight: bold;">✗ Rejected</span></p>
                <p><strong>Reason:</strong> ${response.driver.rejectionReason}</p>
              </div>
            `,
            confirmButtonText: "OK",
            background: themeColors.surface,
            color: themeColors.text
          });
          fetchDrivers();
        }
      } catch (err) {
        console.error("Error rejecting driver:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.message || "Failed to reject driver",
          background: themeColors.surface,
          color: themeColors.text
        });
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await toggleDriverStatus(id);
      fetchDrivers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleForceToggleOnline = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    const res = await Swal.fire({
      title: `${newStatus ? 'Online' : 'Offline'} karna chahte hain?`,
      text: `Driver ko notification jayega ki Admin ne use ${newStatus ? 'Online' : 'Offline'} kiya hai.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: newStatus ? "#10B981" : "#EF4444",
      confirmButtonText: `Haan, ${newStatus ? 'Online' : 'Offline'} karo!`,
      background: themeColors.surface,
      color: themeColors.text
    });

    if (res.isConfirmed) {
      try {
        setLoading(true);
        const response = await toggleDriverOnline(id, newStatus);
        if (response.success) {
          // Update local state immediately for instant UI change
          setDrivers(prev => prev.map(d => d._id === id ? { ...d, isOnline: newStatus } : d));
          
          Swal.fire({
            icon: 'success',
            title: 'Updated!',
            text: `Driver ab ${newStatus ? 'Online' : 'Offline'} hai.`,
            timer: 1500,
            showConfirmButton: false,
            background: themeColors.surface,
            color: themeColors.text
          });
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.response?.data?.message || "Failed to update status",
          background: themeColors.surface,
          color: themeColors.text
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOpenEdit = (d) => {
    setIsEditing(d._id);
    setEditForm({
      name: d.name || "",
      email: d.email || "",
      phone: d.phone || "",
      password: "",
      address: d.address || d.documents?.address || "",
      city: d.city || d.documents?.city || "",
      state: d.state || d.documents?.state || "",
      pincode: d.pincode || d.documents?.pincode || "",
      licenseNumber: d.licenseNumber || d.documents?.license || "",
      licenseExpiry: d.licenseExpiry ? d.licenseExpiry.substring(0, 10) : "",
      aadharNumber: d.aadharNumber || "",
      panNumber: d.panNumber || "",
      carNumber: d.carDetails?.carNumber || d.carNumber || "",
      carModel: d.carDetails?.carModel || d.carModel || "",
      carBrand: d.carDetails?.carBrand || d.carBrand || "",
      carType: d.carDetails?.carType || d.carType || "",
      carColor: d.carDetails?.carColor || d.carColor || "",
      manufacturingYear: d.carDetails?.manufacturingYear || d.manufacturingYear || "",
      seatCapacity: d.carDetails?.seatCapacity || d.availableSeats || 4,
      insuranceExpiry: d.carDetails?.insuranceExpiry ? d.carDetails.insuranceExpiry.substring(0, 10) : "",
      permitExpiry: d.carDetails?.permitExpiry ? d.carDetails.permitExpiry.substring(0, 10) : "",
      pucExpiry: d.carDetails?.pucExpiry ? d.carDetails.pucExpiry.substring(0, 10) : "",
      accountNumber: d.bankDetails?.accountNumber || "",
      ifscCode: d.bankDetails?.ifscCode || "",
      accountHolderName: d.bankDetails?.accountHolderName || "",
      bankName: d.bankDetails?.bankName || "",
      rejectionReason: d.rejectionReason || d.documents?.rejectionReason || "",
      lastServiceDate: d.carDetails?.lastServiceDate ? d.carDetails.lastServiceDate.substring(0, 10) : "",
      nextServiceDate: d.carDetails?.nextServiceDate ? d.carDetails.nextServiceDate.substring(0, 10) : "",
      debtLimit: d.debtLimit || -500
    });
    setImageFile(null);
    setRcFile(null);
    setInsuranceFile(null);
    setPermitFile(null);
    setPucFile(null);
  };

  const handleNewDriver = () => {
    setIsEditing("new");
    setEditForm(initialForm);
    setImageFile(null);
    setRcFile(null);
    setInsuranceFile(null);
    setPermitFile(null);
    setPucFile(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-fill seat capacity if carType is changed
      if (name === "carType" && value) {
        const selectedCat = categories.find(c => c._id === value);
        // Using seatCapacity from the category model
        if (selectedCat && selectedCat.seatCapacity) {
          updated.seatCapacity = selectedCat.seatCapacity;
        } else if (selectedCat && selectedCat.capacity) {
          // Fallback if field name varies
          updated.seatCapacity = selectedCat.capacity;
        }
      }
      
      return updated;
    });
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const saveDriver = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Create FormData for file upload
      const formData = new FormData();

      // Required fields
      formData.append("name", editForm.name);
      formData.append("email", editForm.email);
      formData.append("phone", editForm.phone);
      if (isEditing === "new") {
        formData.append("password", editForm.password || "default@123");
      } else {
        if (editForm.password) {
          formData.append("password", editForm.password);
        }
      }

      // Profile fields
      if (editForm.licenseNumber) formData.append("licenseNumber", editForm.licenseNumber);
      if (editForm.licenseExpiry) formData.append("licenseExpiry", editForm.licenseExpiry);
      if (editForm.aadharNumber) formData.append("aadharNumber", editForm.aadharNumber);
      if (editForm.panNumber) formData.append("panNumber", editForm.panNumber);
      if (editForm.address) formData.append("address", editForm.address);
      if (editForm.city) formData.append("city", editForm.city);
      if (editForm.state) formData.append("state", editForm.state);
      if (editForm.pincode) formData.append("pincode", editForm.pincode);

      // Bank details
      if (editForm.accountNumber) formData.append("accountNumber", editForm.accountNumber);
      if (editForm.ifscCode) formData.append("ifscCode", editForm.ifscCode);
      if (editForm.accountHolderName) formData.append("accountHolderName", editForm.accountHolderName);
      if (editForm.bankName) formData.append("bankName", editForm.bankName);

      // Car details (only if carNumber is provided)
      if (editForm.carNumber) {
        formData.append("carNumber", editForm.carNumber);
        if (editForm.carModel) formData.append("carModel", editForm.carModel);
        if (editForm.carBrand) formData.append("carBrand", editForm.carBrand);
        if (editForm.carType) formData.append("carType", editForm.carType);
        if (editForm.carColor) formData.append("carColor", editForm.carColor);
        if (editForm.manufacturingYear) formData.append("manufacturingYear", editForm.manufacturingYear);
        if (editForm.seatCapacity) formData.append("seatCapacity", editForm.seatCapacity);
        if (editForm.insuranceExpiry) formData.append("insuranceExpiry", editForm.insuranceExpiry);
        if (editForm.permitExpiry) formData.append("permitExpiry", editForm.permitExpiry);
        if (editForm.pucExpiry) formData.append("pucExpiry", editForm.pucExpiry);
      }

      // Profile image
      if (imageFile) formData.append("image", imageFile);
      if (rcFile) formData.append("rcImage", rcFile);
      if (insuranceFile) formData.append("insuranceImage", insuranceFile);
      if (permitFile) formData.append("permitImage", permitFile);
      if (pucFile) formData.append("pucImage", pucFile);

      // Tech details
      if (editForm.lastServiceDate) formData.append("lastServiceDate", editForm.lastServiceDate);
      if (editForm.nextServiceDate) formData.append("nextServiceDate", editForm.nextServiceDate);
      if (editForm.debtLimit !== undefined) formData.append("debtLimit", editForm.debtLimit);

      let response;
      if (isEditing === "new") {
        // Register new driver
        response = await registerDriver(formData);
      } else {
        // Update existing driver
        response = await updateDriver(isEditing, formData);
      }

      if (response.success) {
        Swal.fire({
          icon: "success",
          title: isEditing === "new" ? "Driver Registered Successfully" : "Driver Updated Successfully",
          timer: 1500,
          showConfirmButton: false,
          background: themeColors.surface,
          color: themeColors.text
        });
        setIsEditing(null);
        fetchDrivers();
      } else {
        throw new Error(response.message || "Operation failed");
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || err.message || "Operation failed",
        background: themeColors.surface,
        color: themeColors.text
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const res = await Swal.fire({
      title: "Delete Driver?",
      text: "This will permanently remove the driver.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "YES, DELETE"
    });
    if (res.isConfirmed) {
      try {
        await deleteDriver(id);
        fetchDrivers();
      } catch (err) { console.error(err); }
    }
  };

  const autoPerformRadiusSearch = async (lat, lng, radius, addr) => {
    try {
      setLoading(true);
      const res = await searchDriversByRadius(lat, lng, radius);
      if (res.success) {
        setRadiusSearch(prev => ({ 
          ...prev, 
          active: true, 
          results: res.drivers,
          lat, lng, address: addr 
        }));
        setCurrentPage(1);
        Swal.fire({
          icon: 'success',
          title: 'Location Selected!',
          text: `${res.count} drivers aapke ${radius}KM range mein hain.`,
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRadiusSearch = async () => {
    if (!radiusSearch.lat || !radiusSearch.lng) {
      Swal.fire("Pehle address select karo bhai!");
      return;
    }
    
    try {
      setLoading(true);
      const res = await searchDriversByRadius(radiusSearch.lat, radiusSearch.lng, radiusSearch.radius);
      if (res.success) {
        setRadiusSearch(prev => ({ ...prev, active: true, results: res.drivers }));
        setCurrentPage(1); // Result aane par page 1 par le jao
        Swal.fire({
          icon: 'success',
          title: 'Drivers Mil Gaye!',
          text: `${res.count} drivers aapke ${radius}KM range mein hain.`,
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Radius search mein error hai bhai.");
    } finally {
      setLoading(false);
    }
  };

  const clearRadiusSearch = () => {
    setRadiusSearch({
      active: false,
      address: "",
      lat: null,
      lng: null,
      radius: 10,
      results: []
    });
  };

  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => { setCurrentPage(1); }, [searchQuery, activeTab, rowsPerPage]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="z-50 mt-7">
        <div className="px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Driver Management</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage all drivers and their details</p>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Refresh */}
              <button
                onClick={fetchDrivers}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FaSyncAlt size={16} className={fetching ? 'animate-spin' : ''} />
              </button>

              {/* Add New */}
              {can('DRIVER_CREATE') && (
                <button
                  onClick={handleNewDriver}
                  className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center space-x-1 sm:space-x-2 shadow-lg"
                >
                  <FaPlus size={14} />
                  <span className="hidden sm:inline text-sm">New Driver</span>
                  <span className="sm:hidden">Add</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Search drivers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg col-span-2"
              />
              <select className="px-3 py-2 border border-gray-300 rounded-lg">
                <option>All Status</option>
                <option>Approved Only</option>
                <option>Pending Only</option>
                <option>Rejected Only</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded-lg">
                <option>Sort By</option>
                <option>Highest Earnings</option>
                <option>Most Trips</option>
                <option>Highest Rating</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
          <StatCard icon={FaUsers} label="Total Drivers" value={stats.total} color="blue" subtitle="All registered drivers" />
          <StatCard icon={FaCheckCircle} label="Approved" value={stats.approved} color="green" subtitle={`${((stats.approved / stats.total) * 100 || 0).toFixed(1)}% approval`} />
          <StatCard icon={FaSyncAlt} label="Pending" value={stats.pending} color="orange" subtitle="Awaiting approval" />
          <StatCard icon={FaBan} label="Rejected" value={stats.rejected} color="red" subtitle="Denied access" />
          <StatCard icon={FaCircle} label="Online" value={stats.online} color="green" subtitle="Currently active" />
          <StatCard icon={FaCircle} label="Offline" value={stats.total - stats.online} color="gray" subtitle="Currently inactive" />

        </div>


        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-2 border-b border-gray-200 flex items-center gap-2 sm:gap-4 overflow-x-auto">
            {[
              { id: "all", label: "All", icon: FaUsers },
              { id: "pending", label: "Pending", icon: FaSyncAlt },
              { id: "approved", label: "Approved", icon: FaCheckCircle },
              { id: "rejected", label: "Rejected", icon: FaBan },
              { id: "inactive", label: "Inactive", icon: FaTimesCircle },
              { id: "online", label: "Online", icon: FaCircle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 sm:gap-2 py-3 text-xs font-medium transition-all border-b-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <tab.icon size={12} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                  {tab.id === "all" ? stats.total :
                    tab.id === "pending" ? stats.pending :
                      tab.id === "approved" ? stats.approved :
                        tab.id === "rejected" ? stats.rejected :
                          tab.id === "inactive" ? (stats.approved - stats.active) :
                            stats.online}
                </span>
              </button>
            ))}

            {/* Condensed Radius Search in Table Header */}
            <div className="ml-auto flex items-center gap-2 shrink-0">
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-500" size={10} />
                <input
                  id="radius-address-input"
                  type="text"
                  placeholder="Area Search (Radius)..."
                  value={radiusSearch.address}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRadiusSearch(prev => ({ ...prev, address: val }));
                    if (val === "") {
                      clearRadiusSearch();
                    }
                  }}
                  onFocus={() => {
                    if (!window.google) return;
                    const autocomplete = new window.google.maps.places.Autocomplete(
                      document.getElementById("radius-address-input"),
                      { types: ["geocode"] }
                    );
                    autocomplete.addListener("place_changed", () => {
                      const place = autocomplete.getPlace();
                      if (place.geometry) {
                        const newLat = place.geometry.location.lat();
                        const newLng = place.geometry.location.lng();
                        const newAddr = place.formatted_address;
                        
                        setRadiusSearch(prev => ({
                          ...prev,
                          address: newAddr,
                          lat: newLat,
                          lng: newLng
                        }));

                        // Auto Search Trigger
                        autoPerformRadiusSearch(newLat, newLng, radiusSearch.radius, newAddr);
                      }
                    });
                  }}
                  className="pl-7 pr-2 py-1.5 border border-blue-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-80 bg-blue-50/30 font-medium"
                />
              </div>
              
              <select
                value={radiusSearch.radius}
                onChange={(e) => {
                  const newRadius = e.target.value;
                  setRadiusSearch(prev => ({ ...prev, radius: newRadius }));
                  
                  // Agar address pehle se select hai, toh radius badalte hi auto-search karo
                  if (radiusSearch.lat && radiusSearch.lng) {
                    autoPerformRadiusSearch(radiusSearch.lat, radiusSearch.lng, newRadius, radiusSearch.address);
                  }
                }}
                className="py-1.5 px-2 border border-gray-200 rounded-lg text-[10px] font-bold focus:outline-none bg-white"
              >
                <option value="5">5 KM</option>
                <option value="10">10 KM</option>
                <option value="20">20 KM</option>
                <option value="30">30 KM</option>
                <option value="40">40 KM</option>
                <option value="50">50 KM</option>
                <option value="60">60 KM</option>
                <option value="70">70 KM</option>
                <option value="80">80 KM</option>
                <option value="90">90 KM</option>
                <option value="100">100 KM</option>
              </select>

              {radiusSearch.active && (
                <button
                  onClick={clearRadiusSearch}
                  className="p-1.5 bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg"
                  title="Clear"
                >
                  <FaTimes size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Driver Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1600px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Driver</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase min-w-[250px]">Location</th>
                  {radiusSearch.active && (
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase min-w-[120px]">Distance</th>
                  )}
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Pincode</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Online</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Rating</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Earnings</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Password</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={radiusSearch.active ? 12 : 11} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <p className="text-lg font-medium">Koi Driver nahi mila bhai!</p>
                        <p className="text-sm">Range badha kar ya dusra address try karein.</p>
                        {radiusSearch.active && (
                          <button onClick={clearRadiusSearch} className="mt-4 text-blue-600 font-bold hover:underline">
                            Search Clear Karein
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.map((d) => (
                  <React.Fragment key={d._id}>
                    <tr
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggleRowExpansion(d._id)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden border border-gray-100">
                            {d.image ? (
                              <img src={`${IMAGE_BASE_URL}${d.image}`} alt={d.name} className="w-full h-full object-cover" />
                            ) : (
                              <FaUserCircle size={16} className="text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{d.name}</p>
                            <p className="text-xs text-gray-500">{d.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-900">{d.phone}</p>
                        <p className="text-xs text-gray-500">{d.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-900">{d.carDetails?.carModel || d.carModel || '—'}</p>
                        <p className="text-xs text-gray-500">{d.carDetails?.carNumber || d.carNumber || '—'}</p>
                      </td>
                      <td className="py-3 px-4 min-w-[250px]">
                        <p className="text-sm text-gray-900 line-clamp-1" title={d.city + ", " + d.state}>{d.city || '—'}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{d.state || '—'}</p>
                      </td>
                      {radiusSearch.active && (
                        <td className="py-3 px-4 min-w-[120px]">
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold">
                            {d.distanceFromCenter} KM Dur
                          </span>
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <span className="text-sm font-mono text-gray-900">{d.pincode || '—'}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            d.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {d.isOnline ? 'Online' : 'Offline'}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleForceToggleOnline(d._id, d.isOnline); }}
                            className={`p-1 rounded-lg transition-colors ${d.isOnline ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                            title={d.isOnline ? "Force Offline" : "Force Online"}
                          >
                            {d.isOnline ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <FaStar size={10} className="text-yellow-400" />
                          <span className="text-sm font-medium text-gray-900">{d.rating || '0.0'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-medium text-gray-900">₹{(d.totalEarnings || 0).toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                          {d.password && d.password.length > 20 ? '••••••••••••••••••••' : d.password || 'N/A'}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${d.isApproved ? 'bg-green-100 text-green-700' : d.isRejected ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {d.isApproved ? 'Approved' : d.isRejected ? 'Rejected' : 'Pending'}
                          </span>
                          {can('DRIVER_STATUS') && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleStatus(d._id); }}
                              className={`ml-1 ${d.isActive ? 'text-green-600' : 'text-gray-300'}`}
                            >
                              {d.isActive ? <FaToggleOn size={16} /> : <FaToggleOff size={16} />}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {!d.isApproved && !d.isRejected && (
                            <>
                              {can('DRIVER_APPROVE') && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleApprove(d._id); }}
                                  className="p-1.5 hover:bg-green-100 rounded text-green-600 font-bold"
                                  title="Approve"
                                >
                                  <FaCheckCircle size={16} />
                                </button>
                              )}
                              {can('DRIVER_REJECT') && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleReject(d._id); }}
                                  className="p-1.5 hover:bg-red-100 rounded text-red-600 font-bold"
                                  title="Reject"
                                >
                                  <FaTimesCircle size={16} />
                                </button>
                              )}
                            </>
                          )}
                          {can('DRIVER_READ') && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setViewing(d); }}
                              className="p-1 hover:bg-gray-100 rounded text-blue-600"
                              title="View"
                            >
                              <FaEye size={14} />
                            </button>
                          )}
                          {can('DRIVER_EDIT') && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenEdit(d); }}
                              className="p-1 hover:bg-gray-100 rounded text-orange-600"
                              title="Edit"
                            >
                              <FaEdit size={14} />
                            </button>
                          )}
                          {can('DRIVER_DELETE') && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(d._id); }}
                              className="p-1 hover:bg-gray-100 rounded text-red-600"
                              title="Delete"
                            >
                              <FaTrash size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedRows[d._id] && (
                      <tr className="bg-gray-50">
                        <td colSpan="8" className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Personal Details */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <h4 className="text-xs font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">Personal Details</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">License:</span>
                                  <span className="font-medium text-gray-900">{d.licenseNumber || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Expiry:</span>
                                  <span className="font-medium text-gray-900">{d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Aadhar:</span>
                                  <span className="font-medium text-gray-900">{d.documents?.aadhar || d.aadhar || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">PAN:</span>
                                  <span className="font-medium text-gray-900">{d.documents?.pan || d.pan || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Address:</span>
                                  <span className="font-medium text-gray-900 text-right">{d.address || 'N/A'}</span>
                                </div>
                                {d.isRejected && d.rejectionReason && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Rejection Reason:</span>
                                    <span className="font-medium text-red-600 text-right">{d.rejectionReason}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Vehicle Details */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <h4 className="text-xs font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">Vehicle Details</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Model:</span>
                                  <span className="font-medium text-gray-900">{d.carDetails?.carModel || d.carModel || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Number:</span>
                                  <span className="font-medium text-gray-900">{d.carDetails?.carNumber || d.carNumber || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Color:</span>
                                  <span className="font-medium text-gray-900">{d.carDetails?.carColor || d.carColor || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Seats:</span>
                                  <span className="font-medium text-gray-900">{d.carDetails?.seatCapacity || d.availableSeats || 4}</span>
                                </div>
                                <div className="flex justify-between mt-1">
                                  <span className="text-gray-500">Layout:</span>
                                  <span className="font-medium text-gray-900">
                                    {(() => {
                                      const carTypeId = d.carDetails?.carType || d.carType;
                                      let layoutData = d.carDetails?.seatLayout;
                                      if (!layoutData && carTypeId && typeof carTypeId === 'object') {
                                        layoutData = carTypeId.seatLayout;
                                      } else if (!layoutData) {
                                        const category = categories.find(c => c._id === carTypeId);
                                        layoutData = category?.seatLayout;
                                      }
                                      let layout = [];
                                      if (layoutData) {
                                        try {
                                          layout = typeof layoutData === 'string' ? JSON.parse(layoutData) : layoutData;
                                        } catch (e) { }
                                      }
                                      return layout && layout.length > 0 ? (
                                        <div className="flex flex-wrap gap-1 justify-end">
                                          {layout.map((seat, i) => (
                                            <span key={i} className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 shadow-sm rounded text-[9px]">{seat}</span>
                                          ))}
                                        </div>
                                      ) : 'Standard';
                                    })()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Pricing:</span>
                                  <span className="font-medium text-gray-900">
                                    Base: ₹{d.carDetails?.baseFare || 0} | Private: ₹{d.carDetails?.privateRatePerKm || 0}/km | Shared: ₹{d.carDetails?.sharedRatePerSeatPerKm || 0}/seat
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Bank Details & Stats */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <h4 className="text-xs font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">Bank Details & Stats</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Bank:</span>
                                  <span className="font-medium text-gray-900">{d.bankDetails?.bankName || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Account:</span>
                                  <span className="font-medium text-gray-900">****{d.bankDetails?.accountNumber?.slice(-4) || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">IFSC:</span>
                                  <span className="font-medium text-gray-900">{d.bankDetails?.ifscCode || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Holder:</span>
                                  <span className="font-medium text-gray-900">{d.bankDetails?.accountHolderName || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Wallet:</span>
                                  <span className={`font-medium ${d.walletBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    ₹{(d.walletBalance || 0).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Trips:</span>
                                  <span className="font-medium text-blue-600">{d.totalTrips || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Joined:</span>
                                  <span className="font-medium text-gray-900">{new Date(d.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
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
              <span className="text-sm text-gray-500">
                Showing {filteredDrivers.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filteredDrivers.length)} of {filteredDrivers.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaChevronLeft size={14} /> Previous
              </button>
              <span className="text-sm text-gray-500">Page {currentPage} of {totalPages || 1}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <FaChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
        {/* Chart Selector */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['all', 'status', 'performance', 'earnings'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedChart(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedChart === type
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Charts Grid - Only 4 Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Chart 1: Driver Status Distribution */}
          {(selectedChart === 'all' || selectedChart === 'status') && (
            <ChartCard title="Driver Status" subtitle="Approved vs Pending vs Rejected" icon={PieChartIcon}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 2: Online Status */}
          {(selectedChart === 'all' || selectedChart === 'status') && (
            <ChartCard title="Online Status" subtitle="Currently active drivers" icon={Activity}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={onlineData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {onlineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 3: Performance Metrics */}
          {(selectedChart === 'all' || selectedChart === 'performance') && (
            <ChartCard title="Performance Metrics" subtitle="Key driver indicators" icon={BarChart3}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 4: Top Earners */}
          {(selectedChart === 'all' || selectedChart === 'earnings') && (
            <ChartCard title="Top Earners" subtitle="Highest earning drivers" icon={DollarSign}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={earningsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="earnings" fill={CHART_COLORS.green} radius={[4, 4, 0, 0]} name="Earnings" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>


      </div>

      {/* View Modal */}
      {viewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-xl bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden">
                  {viewing.image ? (
                    <img src={`${IMAGE_BASE_URL}${viewing.image}`} alt={viewing.name} className="w-full h-full object-cover" />
                  ) : (
                    <FaUserCircle size={32} className="text-blue-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{viewing.name}</h2>
                  <p className="text-sm text-gray-500">Driver ID: {viewing._id?.slice(-8)}</p>
                </div>
              </div>
              <button onClick={() => setViewing(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FaTimes size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Rating</p>
                  <div className="flex items-center gap-1">
                    <FaStar className="text-yellow-400" size={14} />
                    <p className="text-base font-bold text-gray-900">{viewing.rating || '0.0'}</p>
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Earnings</p>
                  <p className="text-base font-bold text-green-600">₹{viewing.totalEarnings || 0}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Trips</p>
                  <p className="text-base font-bold text-purple-600">{viewing.totalTrips || 0}</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Wallet</p>
                  <p className="text-base font-bold text-orange-600">₹{viewing.walletBalance || 0}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Debt Limit</p>
                  <div className="flex items-center gap-1">
                    <FaMoneyBillWave className="text-red-500" size={14} />
                    <p className="text-base font-bold text-red-600">₹{viewing.debtLimit || -500}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Details */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Personal Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Email:</span>
                      <span className="text-sm font-medium text-gray-900">{viewing.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Phone:</span>
                      <span className="text-sm font-medium text-gray-900">{viewing.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">License:</span>
                      <span className="text-sm font-medium text-gray-900">{viewing.licenseNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Expiry:</span>
                      <span className="text-sm font-medium text-gray-900">{viewing.licenseExpiry ? new Date(viewing.licenseExpiry).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Aadhar:</span>
                      <span className="text-sm font-medium text-gray-900">{viewing.aadharNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">PAN:</span>
                      <span className="text-sm font-medium text-gray-900">{viewing.panNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Address:</span>
                      <span className="text-sm font-medium text-gray-900 text-right">{viewing.address}, {viewing.city} - {viewing.pincode}</span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Vehicle Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Model:</span>
                      <span className="text-sm font-medium text-gray-900">{viewing.carDetails?.carModel || viewing.carModel || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Brand:</span>
                      <span className="text-sm font-medium text-gray-900">{viewing.carDetails?.carBrand || viewing.carBrand || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Number:</span>
                      <span className="text-sm font-medium text-gray-900">{viewing.carDetails?.carNumber || viewing.carNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Color:</span>
                      <span className="text-sm font-medium text-gray-900">{viewing.carDetails?.carColor || viewing.carColor || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Year:</span>
                      <span className="text-sm font-medium text-gray-900">{viewing.carDetails?.manufacturingYear || viewing.manufacturingYear || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Seats:</span>
                      <span className="text-sm font-medium text-gray-900">{viewing.carDetails?.seatCapacity || viewing.availableSeats || 4}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-sm text-gray-500">Layout:</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {(() => {
                          const carTypeId = viewing.carDetails?.carType || viewing.carType;
                          let layoutData = viewing.carDetails?.seatLayout;
                          if (!layoutData && carTypeId && typeof carTypeId === 'object') {
                            layoutData = carTypeId.seatLayout;
                          } else if (!layoutData) {
                            const category = categories.find(c => c._id === carTypeId);
                            layoutData = category?.seatLayout;
                          }
                          let layout = [];
                          if (layoutData) {
                            try {
                              layout = typeof layoutData === 'string' ? JSON.parse(layoutData) : layoutData;
                            } catch (e) { }
                          }
                          return layout && layout.length > 0 ? layout.map((seat, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 shadow-sm rounded text-[10px] text-gray-700">{seat}</span>
                          )) : <span className="text-sm font-medium text-gray-900">Standard</span>;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Bank Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Bank:</span>
                      <span className="text-sm font-medium text-gray-900">{viewing.bankDetails?.bankName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Account:</span>
                      <span className="text-sm font-medium text-gray-900">{viewing.bankDetails?.accountNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">IFSC:</span>
                      <span className="text-sm font-medium text-gray-900">{viewing.bankDetails?.ifscCode || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Holder:</span>
                      <span className="text-sm font-medium text-gray-900">{viewing.bankDetails?.accountHolderName || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Expiry Dates */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Expiry & Status</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Insurance:</span>
                      <span className={`text-sm font-medium ${new Date(viewing.carDetails?.insuranceExpiry) < new Date() ? 'text-red-500' : 'text-gray-900'}`}>{viewing.carDetails?.insuranceExpiry ? new Date(viewing.carDetails.insuranceExpiry).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Permit:</span>
                      <span className="text-sm font-medium text-gray-900">{viewing.carDetails?.permitExpiry ? new Date(viewing.carDetails.permitExpiry).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">PUC:</span>
                      <span className="text-sm font-medium text-gray-900">{viewing.carDetails?.pucExpiry ? new Date(viewing.carDetails.pucExpiry).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Images Section */}
              <div className="mt-8 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                  <FaFileInvoice className="text-blue-500" /> Vehicle Documents (Images)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'RC Front', key: 'rc' },
                    { label: 'Insurance', key: 'insurance' },
                    { label: 'Permit', key: 'permit' },
                    { label: 'PUC', key: 'puc' }
                  ].map((doc) => (
                    <div key={doc.key} className="space-y-2">
                      <p className="text-[10px] font-medium text-gray-500 text-center uppercase tracking-wider">{doc.label}</p>
                      <div className="aspect-[4/3] rounded-lg border border-gray-200 bg-gray-50 overflow-hidden relative group cursor-pointer"
                        onClick={() => window.open(`${IMAGE_BASE_URL}${viewing.carDetails?.carDocuments?.[doc.key]}`, '_blank')}>
                        {viewing.carDetails?.carDocuments?.[doc.key] ? (
                          <img
                            src={`${IMAGE_BASE_URL}${viewing.carDetails.carDocuments[doc.key]}`}
                            alt={doc.label}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                            <FaBan size={20} />
                            <span className="text-[9px] mt-1 uppercase">No File</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rejection Reason if any */}
              {viewing.isRejected && viewing.rejectionReason && (
                <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl">
                  <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Rejection Reason</h4>
                  <p className="text-sm text-red-600">{viewing.rejectionReason}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setViewing(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setViewing(null);
                  handleOpenEdit(viewing);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Edit Driver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  {isEditing === "new" ? <FaPlus size={16} className="text-white" /> : <FaEdit size={16} className="text-white" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {isEditing === "new" ? "Register New Driver" : "Edit Driver"}
                  </h2>
                  <p className="text-blue-100 text-xs">{isEditing === "new" ? "Fill in the details to register a new driver" : "Update driver information"}</p>
                </div>
              </div>
              <button onClick={() => setIsEditing(null)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                <FaTimes size={18} className="text-white" />
              </button>
            </div>

            <form onSubmit={saveDriver} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

                {/* Section 1: Basic Info + Profile Image */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                      <User size={14} className="text-blue-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800">Basic Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Field label="Full Name" name="name" value={editForm.name} onChange={handleEditChange} required icon={User} />
                    <Field label="Email" name="email" value={editForm.email} onChange={handleEditChange} required type="email" icon={Mail} />
                    <Field label="Phone" name="phone" value={editForm.phone} onChange={handleEditChange} required icon={Phone} />
                    <Field label="Password" name="password" value={editForm.password} onChange={handleEditChange} required={isEditing === "new"} type="password" icon={FaShieldAlt} />
                    <div className="space-y-1">
                      <label className="text-xs font-medium flex items-center gap-1.5 text-gray-600">
                        <FaUserCircle size={14} className="text-gray-400" /> Profile Photo
                      </label>
                      <input type="file" accept="image/*" onChange={handleImageChange}
                        className="w-full h-10 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer" />
                    </div>
                  </div>
                </div>

                {/* Section 2: Address */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                      <MapPin size={14} className="text-green-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800">Address Details</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-3">
                      <Field label="Full Address" name="address" value={editForm.address} onChange={handleEditChange} icon={Home} />
                    </div>
                    <Field label="City" name="city" value={editForm.city} onChange={handleEditChange} icon={MapPin} />
                    <Field label="State" name="state" value={editForm.state} onChange={handleEditChange} icon={Map} />
                    <Field label="Pincode" name="pincode" value={editForm.pincode} onChange={handleEditChange} icon={Map} />
                  </div>
                </div>

                {/* Section 3: Documents */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                      <FaIdCard size={14} className="text-orange-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800">Identity Documents</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Field label="License Number" name="licenseNumber" value={editForm.licenseNumber} onChange={handleEditChange} icon={FaIdCard} />
                    <Field label="License Expiry" name="licenseExpiry" value={editForm.licenseExpiry} onChange={handleEditChange} type="date" icon={FaCalendarAlt} />
                    <Field label="Aadhar Number" name="aadharNumber" value={editForm.aadharNumber} onChange={handleEditChange} icon={FaIdCard} />
                    <Field label="PAN Number" name="panNumber" value={editForm.panNumber} onChange={handleEditChange} icon={FaIdCard} />
                  </div>
                </div>

                {/* Section 4: Vehicle Details */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FaCar size={14} className="text-purple-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800">Vehicle Details</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Field label="Car Number" name="carNumber" value={editForm.carNumber} onChange={handleEditChange} icon={FaCar} />
                    <Field label="Car Brand" name="carBrand" value={editForm.carBrand} onChange={handleEditChange} icon={FaCar} />
                    <Field label="Car Model" name="carModel" value={editForm.carModel} onChange={handleEditChange} icon={FaCar} />
                    <SelectField
                      label="Car Type / Category"
                      name="carType"
                      value={editForm.carType}
                      onChange={handleEditChange}
                      options={categories.map(c => ({ value: c._id, label: c.name }))}
                      icon={FaCar}
                    />
                    <Field label="Car Color" name="carColor" value={editForm.carColor} onChange={handleEditChange} icon={FaPalette} />
                    <Field label="Manufacturing Year" name="manufacturingYear" value={editForm.manufacturingYear} onChange={handleEditChange} type="number" icon={FaCalendarAlt} />
                    <Field label="Seat Capacity" name="seatCapacity" value={editForm.seatCapacity} onChange={handleEditChange} type="number" icon={FaUsers} readOnly />
                    {editForm.carType && (() => {
                      const cat = categories.find(c => c._id === editForm.carType);
                      let layout = [];
                      if (cat?.seatLayout) {
                        try { layout = typeof cat.seatLayout === 'string' ? JSON.parse(cat.seatLayout) : cat.seatLayout; } catch (e) { }
                      }
                      return layout.length > 0 ? (
                        <div className="lg:col-span-2 space-y-1">
                          <label className="text-xs font-medium flex items-center gap-1.5 text-gray-600">
                            <FaChair size={14} className="text-gray-400" /> Seat Layout
                          </label>
                          <div className="flex flex-wrap gap-1.5 p-3 bg-white border border-gray-200 rounded-lg min-h-[42px]">
                            {layout.map((seat, i) => (
                              <span key={i} className="px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-700">{seat}</span>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {/* Expiry Dates */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4 pt-4 border-t border-gray-200">
                    <Field label="Insurance Expiry" name="insuranceExpiry" value={editForm.insuranceExpiry} onChange={handleEditChange} type="date" icon={FaShieldAlt} />
                    <Field label="Permit Expiry" name="permitExpiry" value={editForm.permitExpiry} onChange={handleEditChange} type="date" icon={FaFileInvoice} />
                    <Field label="PUC Expiry" name="pucExpiry" value={editForm.pucExpiry} onChange={handleEditChange} type="date" icon={FaGasPump} />
                    <Field label="Last Service" name="lastServiceDate" value={editForm.lastServiceDate} onChange={handleEditChange} type="date" icon={FaWrench} />
                    <Field label="Next Service" name="nextServiceDate" value={editForm.nextServiceDate} onChange={handleEditChange} type="date" icon={FaCalendarAlt} />
                  </div>

                  {/* Vehicle Documents Upload */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-1.5"><FaFileInvoice size={12} className="text-gray-400" /> Vehicle Document Images</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'RC Document', setter: setRcFile },
                        { label: 'Insurance Doc', setter: setInsuranceFile },
                        { label: 'Permit Doc', setter: setPermitFile },
                        { label: 'PUC Doc', setter: setPucFile },
                      ].map(({ label, setter }) => (
                        <div key={label} className="space-y-1">
                          <label className="text-xs font-medium text-gray-600">{label}</label>
                          <input type="file" accept="image/*" onChange={(e) => setter(e.target.files[0])}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 file:mr-1.5 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-xs file:bg-purple-50 file:text-purple-600 hover:file:bg-purple-100 cursor-pointer" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 5: Bank Details */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 bg-teal-100 rounded-lg flex items-center justify-center">
                      <FaLandmark size={14} className="text-teal-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800">Bank Details</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Field label="Bank Name" name="bankName" value={editForm.bankName} onChange={handleEditChange} icon={FaLandmark} />
                    <Field label="Account Holder" name="accountHolderName" value={editForm.accountHolderName} onChange={handleEditChange} icon={User} />
                    <Field label="Account Number" name="accountNumber" value={editForm.accountNumber} onChange={handleEditChange} icon={FaCreditCard} />
                    <Field label="IFSC Code" name="ifscCode" value={editForm.ifscCode} onChange={handleEditChange} icon={FaCreditCard} />
                  </div>
                </div>

              </div>

              {/* Sticky Footer Actions */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                <p className="text-xs text-gray-400">Fields marked <span className="text-red-500">*</span> are required</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsEditing(null)}
                    className="px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2 shadow-lg transition-all">
                    {loading && <FaSyncAlt className="animate-spin" size={14} />}
                    {loading ? 'Saving...' : isEditing === "new" ? '✓ Register Driver' : '✓ Update Driver'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}