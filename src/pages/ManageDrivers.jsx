import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import http from "../apis/http";
import { useAuth } from "../context/AuthContext";
import { useFont } from "../context/FontContext";
import {
  getAllDrivers, approveDriver, rejectDriver, updateDriver, toggleDriverStatus, deleteDriver, registerDriver,
  searchDriversByRadius, searchDriversByHomeRadius, changeDriverOwnership, getDriverFullHistory
} from "../apis/driver";
import { getAllVendors } from "../apis/vendor";
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
  FaBan, FaMapMarkerAlt, FaLandmark, FaPalette, FaHistory, FaGlobe, FaClock, FaFileInvoice, FaHome,
  FaChartPie, FaChartBar, FaChartLine, FaChartArea, FaDownload, FaFilter, FaPrint, FaFilePdf, FaFileExcel,
  FaGasPump, FaCogs, FaChair, FaPallet, FaWrench, FaShieldAlt, FaCreditCard, FaExchangeAlt, FaTruck
} from "react-icons/fa";
import {
  Download, Filter, TrendingUp, DollarSign, Activity,
  PieChart as PieChartIcon, BarChart3, LineChart as LineChartIcon,
  Target, Gauge, Zap, Shield, MoreVertical, DownloadCloud, Printer,
  User, Users, Wallet, Briefcase, MapPin, Clock, Mail, Phone, Calendar,
  Map, Home, CreditCard, Award, Star as StarIcon, ArrowRightLeft, Building2, Store, Copy,
  ChevronDown, ChevronUp, Car, FileText, CheckCircle2, XCircle, AlertCircle, ArrowUpRight, ArrowDownLeft,
  RefreshCw, Layers, FileCheck, X, ExternalLink, Eye, ArrowRight, History, Search
} from 'lucide-react';
import Swal from "sweetalert2";
import ReviewsModal from "../components/ReviewsModal";

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
    vehicleType: "Car", carNumber: "", carModel: "", carBrand: "", carType: "",
    carColor: "", manufacturingYear: "", seatCapacity: 4,
    insuranceExpiry: "", permitExpiry: "", pucExpiry: "",
  lastServiceDate: "", nextServiceDate: "", debtLimit: -500,
  accountNumber: "", ifscCode: "", accountHolderName: "", bankName: "",
  rejectionReason: "",
  addressLatitude: null, addressLongitude: null,
  leadId: ""
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

// Document Image component with proper React error state handling
const DocImage = ({ fileUrl, docLabel, onPreview }) => {
  const [imgError, setImgError] = React.useState(false);
  if (imgError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50 text-center p-2 gap-1">
        <FileText size={22} className="text-blue-400" />
        <span className="text-[9px] font-bold text-blue-700 uppercase">File Saved</span>
        <span className="text-[8px] text-blue-500 font-mono break-all leading-tight px-1">{fileUrl?.split('/').pop()}</span>
      </div>
    );
  }
  return (
    <>
      <img
        src={fileUrl}
        alt={docLabel}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        onError={() => setImgError(true)}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 flex items-end justify-center transition-opacity pb-2">
        <span className="text-white text-[10px] font-bold flex items-center gap-1">
          <Eye size={11} /> View Full
        </span>
      </div>
    </>
  );
};

export default function ManageDrivers() {
  const { themeColors } = useTheme();
  const { admin } = useAuth();
  const { currentFont } = useFont();
  const location = useLocation();
  const navigate = useNavigate();

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
    radius: 10,
    results: []
  });
  const [homeRadiusSearch, setHomeRadiusSearch] = useState({
    active: false,
    address: "",
    lat: null,
    lng: null,
    radius: 10,
    results: []
  });
  const addressRef = useRef(null);
  const liveSearchRef = useRef(null);
  const homeSearchRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [showMap, setShowMap] = useState(true);
  const [isAddressSelected, setIsAddressSelected] = useState(false);
  const [reviewModal, setReviewModal] = useState({ isOpen: false, targetId: null });
  const [vendors, setVendors] = useState([]);
  const [ownershipModal, setOwnershipModal] = useState({
    isOpen: false,
    driver: null,
    targetType: "Direct", // "Direct" or "Vendor"
    vendorId: "",
    submitting: false
  });

  // Driver Details / Inspection Modal States (Task 14)
  const [driverDetailTab, setDriverDetailTab] = useState('profile'); // 'profile' | 'wallet' | 'rides'
  const [driverHistoryData, setDriverHistoryData] = useState(null);
  const [driverHistoryLoading, setDriverHistoryLoading] = useState(false);
  const [actionDropdownDriverId, setActionDropdownDriverId] = useState(null);
  const [walletFilterType, setWalletFilterType] = useState('all'); // 'all' | 'Credit' | 'Debit'
  const [walletSearchQuery, setWalletSearchQuery] = useState('');
  const [rideDetailTab, setRideDetailTab] = useState('all'); // 'all' | 'city' | 'package'
  const [rideDetailStatus, setRideDetailStatus] = useState('all');
  const [rideDetailSearch, setRideDetailSearch] = useState('');
  const [selectedDocPreview, setSelectedDocPreview] = useState(null);

  const openDriverDetails = async (driver, initialTab = 'profile') => {
    setViewing(driver);
    setDriverDetailTab(initialTab);
    setActionDropdownDriverId(null);
    setDriverHistoryLoading(true);
    setDriverHistoryData(null);
    try {
      const data = await getDriverFullHistory(driver._id);
      if (data && data.success) {
        setDriverHistoryData(data);
        if (data.driver) {
          setViewing(data.driver);
        }
      }
    } catch (err) {
      console.error("Error loading driver full history:", err);
    } finally {
      setDriverHistoryLoading(false);
    }
  };

  useEffect(() => {
    const handleCloseDropdown = () => setActionDropdownDriverId(null);
    window.addEventListener("click", handleCloseDropdown);
    return () => window.removeEventListener("click", handleCloseDropdown);
  }, []);

  const textColorSecondary = useMemo(() => {
    return themeColors.textSecondary || "rgba(107, 114, 128, 1)";
  }, [themeColors]);

  const borderColor = useMemo(() => {
    return themeColors.border || "rgba(0,0,0,0.05)";
  }, [themeColors]);

  useEffect(() => {
    fetchInitialData();
    if (location.state?.createFromLead) {
      const lead = location.state.createFromLead;
      setIsEditing("new");
      setEditForm(prev => ({
        ...prev,
        name: lead.name || "",
        phone: lead.mobile || "",
        email: lead.email || "",
        leadId: lead._id || ""
      }));
      // Clear location state to prevent re-triggering
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  useEffect(() => {
    if (isEditing && addressRef.current && window.google) {
      const autocomplete = new window.google.maps.places.Autocomplete(addressRef.current, {
        componentRestrictions: { country: 'in' }
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        let city = '', state = '', pincode = '';
        place.address_components.forEach(comp => {
          if (comp.types.includes('locality')) city = comp.long_name;
          if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
          if (comp.types.includes('postal_code')) pincode = comp.long_name;
        });

        setEditForm(prev => ({
          ...prev,
          address: place.formatted_address,
          city: city || prev.city,
          state: state || prev.state,
          pincode: pincode || prev.pincode,
          addressLatitude: lat,
          addressLongitude: lng
        }));
        setIsAddressSelected(true);
      });
    }
    if (isEditing && isEditing !== "new") {
      setIsAddressSelected(true);
    } else {
      setIsAddressSelected(false);
    }
  }, [isEditing]);

  const fetchInitialData = async () => {
    try {
      setFetching(true);
      await Promise.all([fetchCategories(), fetchDrivers(), fetchVendors()]);
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

  const fetchVendors = async () => {
    try {
      const res = await getAllVendors();
      const list = res.vendors || res.data || [];
      setVendors(list);
    } catch (err) {
      console.error("Vendors fetch failed", err);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await getAllDrivers();
      let list = res.drivers || [];
      setDrivers([...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch { setDrivers([]); }
  };

  // Open Ownership Transfer Modal
  const handleOpenOwnershipModal = (e, driver) => {
    e.stopPropagation();
    const isCurrentlyVendor = driver.createdByModel === "Vendor";
    setOwnershipModal({
      isOpen: true,
      driver,
      targetType: isCurrentlyVendor ? "Direct" : "Vendor",
      vendorId: isCurrentlyVendor ? (driver.createdBy?._id || "") : (vendors[0]?._id || ""),
      submitting: false
    });
  };

  // Submit Ownership Transfer
  const handleOwnershipSubmit = async (e) => {
    e.preventDefault();
    if (!ownershipModal.driver) return;

    if (ownershipModal.targetType === "Vendor" && !ownershipModal.vendorId) {
      Swal.fire({
        icon: "warning",
        title: "Vendor Select Karein",
        text: "Kripya list me se ek Vendor select karein."
      });
      return;
    }

    const targetVendorObj = vendors.find(v => v._id === ownershipModal.vendorId);
    const confirmText = ownershipModal.targetType === "Vendor"
      ? `Kya aap is car/driver ko Vendor '${targetVendorObj?.companyName || targetVendorObj?.name}' ke under assign karna chahte hain?`
      : "Kya aap is car/driver ko DIRECT (Admin/Company Platform) category me shift karna chahte hain?";

    const confirmRes = await Swal.fire({
      title: "Confirm Ownership Transfer?",
      text: confirmText,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: themeColors.primary || "#3B82F6",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Haan, Transfer Karein",
      cancelButtonText: "Cancel"
    });

    if (!confirmRes.isConfirmed) return;

    try {
      setOwnershipModal(prev => ({ ...prev, submitting: true }));
      const payload = {
        targetType: ownershipModal.targetType,
        vendorId: ownershipModal.targetType === "Vendor" ? ownershipModal.vendorId : undefined
      };

      const res = await changeDriverOwnership(ownershipModal.driver._id, payload);
      if (res.success) {
        Swal.fire({
          icon: "success",
          title: "Ownership Updated!",
          text: res.message || "Car/Driver ownership updated successfully.",
          timer: 2500,
          showConfirmButton: false
        });
        setOwnershipModal({ isOpen: false, driver: null, targetType: "Direct", vendorId: "", submitting: false });
        fetchDrivers();
      } else {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: res.message || "Failed to update ownership"
        });
        setOwnershipModal(prev => ({ ...prev, submitting: false }));
      }
    } catch (err) {
      console.error("Change ownership error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || err.message || "Server error while changing ownership"
      });
      setOwnershipModal(prev => ({ ...prev, submitting: false }));
    }
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

  // Dynamic Statistics for Tabs (Based on Search Radius AND Text Search)
  const baseList = useMemo(() => {
    if (radiusSearch.active) return radiusSearch.results;
    if (homeRadiusSearch.active) return homeRadiusSearch.results;
    return drivers;
  }, [drivers, radiusSearch.active, radiusSearch.results, homeRadiusSearch.active, homeRadiusSearch.results]);

  // Apply Text Search to baseList for dynamic stats
  const textFilteredList = useMemo(() => {
    return baseList.filter(d =>
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
  }, [baseList, searchQuery]);

  const dynamicStats = useMemo(() => ({
    total: textFilteredList.length,
    pending: textFilteredList.filter(d => !d.isApproved && !d.isRejected).length,
    approved: textFilteredList.filter(d => d.isApproved).length,
    rejected: textFilteredList.filter(d => d.isRejected).length,
    online: textFilteredList.filter(d => d.isOnline).length,
    active: textFilteredList.filter(d => d.isActive).length,
    inactive: textFilteredList.filter(d => d.isApproved && !d.isActive).length,
    fleet: textFilteredList.filter(d => d.createdByModel === "Fleet").length,
  }), [textFilteredList]);


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
    let list = textFilteredList;

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
    } else if (activeTab === "fleet") {
      list = list.filter(d => d.createdByModel === "Fleet");
    }

    return list;
  }, [textFilteredList, activeTab]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredDrivers.slice(start, start + rowsPerPage);
  }, [filteredDrivers, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredDrivers.length / rowsPerPage);

  // Map Logic: Initialize and update markers
  useEffect(() => {
    if (!window.google || !filteredDrivers) return;

    const mapElement = document.getElementById("drivers-master-map");
    if (!mapElement) return;

    // Initialize Map if not exists
    if (!mapInstanceRef.current) {
      const map = new window.google.maps.Map(mapElement, {
        center: { lat: 20.5937, lng: 78.9629 }, // India Center
        zoom: 5,
        mapTypeControl: false,
        streetViewControl: false,
        styles: [
          {
            "featureType": "poi",
            "stylers": [{ "visibility": "off" }]
          }
        ]
      });
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidPoints = false;

    filteredDrivers.forEach(driver => {
      if (driver.addressLatitude && driver.addressLongitude) {
        const pos = { lat: parseFloat(driver.addressLatitude), lng: parseFloat(driver.addressLongitude) };
        
        const marker = new window.google.maps.Marker({
          position: pos,
          map: map,
          title: driver.name,
          icon: {
            url: driver.isApproved ? 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' : 
                 driver.isRejected ? 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' : 
                 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
            scaledSize: new window.google.maps.Size(32, 32)
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 150px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <img src="${driver.image ? IMAGE_BASE_URL + driver.image : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}" 
                     style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover; border: 1px solid #eee;" />
                <strong style="font-size: 14px; color: #1e293b;">${driver.name}</strong>
              </div>
              <p style="font-size: 11px; color: #64748b; margin: 0;">${driver.phone}</p>
              <p style="font-size: 10px; color: #94a3b8; margin: 4px 0 0 0; line-clamp: 2;">${driver.address || ''}</p>
              <div style="margin-top: 6px; display: flex; gap: 4px;">
                 <span style="font-size: 9px; padding: 2px 6px; border-radius: 99px; background: ${driver.isApproved ? '#dcfce7' : '#fef9c3'}; color: ${driver.isApproved ? '#166534' : '#854d0e'};">
                   ${driver.isApproved ? 'Approved' : 'Pending'}
                 </span>
              </div>
            </div>
          `
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });

        markersRef.current.push(marker);
        bounds.extend(pos);
        hasValidPoints = true;
      }
    });

    if (hasValidPoints) {
      if (homeRadiusSearch.active && homeRadiusSearch.lat && homeRadiusSearch.lng) {
        map.setCenter({ lat: parseFloat(homeRadiusSearch.lat), lng: parseFloat(homeRadiusSearch.lng) });
        map.setZoom(12);
      } else if (filteredDrivers.length > 0) {
        map.fitBounds(bounds);
        // Don't zoom in too much if only one marker
        if (map.getZoom() > 15) map.setZoom(15);
      }
    }
  }, [filteredDrivers, showMap, homeRadiusSearch.active]);

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

  const autoPerformRadiusSearch = async (lat, lng, radius, addr) => {
    try {
      setLoading(true);
      // Clear home radius search first
      clearHomeRadiusSearch();
      
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
      Swal.fire("Radius search fail ho gaya bhai.");
    } finally {
      setLoading(false);
    }
  };

  const autoPerformHomeRadiusSearch = async (lat, lng, radius, addr) => {
    try {
      setLoading(true);
      // Clear live radius search first
      clearRadiusSearch();
      
      const res = await searchDriversByHomeRadius(lat, lng, radius);
      if (res.success) {
        setHomeRadiusSearch(prev => ({ 
          ...prev, 
          active: true, 
          results: res.drivers,
          lat, lng, address: addr 
        }));
        setCurrentPage(1);
        Swal.fire({
          icon: 'success',
          title: 'Home Search Results!',
          text: `${res.count} drivers ke ghar aapke ${radius}KM range mein hain.`,
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Home radius search fail ho gaya bhai.");
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

  const clearHomeRadiusSearch = () => {
    setHomeRadiusSearch({
      active: false,
      address: "",
      lat: null,
      lng: null,
      radius: 10,
      results: []
    });
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
      vehicleType: d.carDetails?.vehicleType || d.vehicleType || "Car",
      carNumber: d.carDetails?.carNumber || d.carNumber || "",
      carModel: d.carDetails?.carModel || d.carModel || "",
      carBrand: d.carDetails?.carBrand || d.carBrand || "",
      carType: d.carDetails?.carType?._id || d.carDetails?.carType || d.carType || "",
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
      debtLimit: d.debtLimit || -500,
      addressLatitude: d.addressLatitude || null,
      addressLongitude: d.addressLongitude || null
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
      if (name === "address") setIsAddressSelected(false);
      
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
    if (!isAddressSelected) {
      Swal.fire({
        icon: 'error',
        title: 'Address Selection Required',
        text: 'Please select address from Google suggestions',
        background: themeColors.surface,
        color: themeColors.text
      });
      return;
    }
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
      if (editForm.addressLatitude) formData.append("addressLatitude", editForm.addressLatitude);
      if (editForm.addressLongitude) formData.append("addressLongitude", editForm.addressLongitude);

      // Bank details
      if (editForm.accountNumber) formData.append("accountNumber", editForm.accountNumber);
      if (editForm.ifscCode) formData.append("ifscCode", editForm.ifscCode);
      if (editForm.accountHolderName) formData.append("accountHolderName", editForm.accountHolderName);
      if (editForm.bankName) formData.append("bankName", editForm.bankName);

      // Car details
      if (editForm.carNumber || editForm.vehicleType) {
        if (editForm.carNumber) formData.append("carNumber", editForm.carNumber);
        if (editForm.vehicleType) formData.append("vehicleType", editForm.vehicleType);
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

        if (isEditing === "new" && editForm.leadId) {
          try {
            await http.delete(`/api/driver-leads/${editForm.leadId}`);
          } catch (e) {
            console.error("Failed to delete converted lead", e);
          }
        }

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
        {fetching ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-200" />
                  <div className="w-10 h-5 rounded-full bg-gray-200" />
                </div>
                <div className="h-7 bg-gray-300 rounded w-16 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-24 mb-1" />
                <div className="h-2 bg-gray-100 rounded w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
            <StatCard icon={FaUsers} label="Total Drivers" value={stats.total} color="blue" subtitle="All registered drivers" />
            <StatCard icon={FaCheckCircle} label="Approved" value={stats.approved} color="green" subtitle={`${((stats.approved / stats.total) * 100 || 0).toFixed(1)}% approval`} />
            <StatCard icon={FaSyncAlt} label="Pending" value={stats.pending} color="orange" subtitle="Awaiting approval" />
            <StatCard icon={FaBan} label="Rejected" value={stats.rejected} color="red" subtitle="Denied access" />
            <StatCard icon={FaCircle} label="Online" value={stats.online} color="green" subtitle="Currently active" />
            <StatCard icon={FaCircle} label="Offline" value={stats.total - stats.online} color="gray" subtitle="Currently inactive" />
          </div>
        )}


        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          {/* Row 1: Search Tools & Map Toggle */}
          <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-gray-50/30">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search Bar */}
              <div className="relative">
                <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                <input
                  type="text"
                  placeholder="Search name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-7 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none w-56 bg-gray-50 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes size={10} />
                  </button>
                )}
              </div>

              {/* Home Address Radius Search */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative">
                  <FaHome className="absolute left-2.5 top-1/2 -translate-y-1/2 text-purple-500" size={10} />
                  <input
                    id="home-radius-address-input"
                    type="text"
                    placeholder="Home Search (Radius)..."
                    value={homeRadiusSearch.address}
                    onChange={(e) => {
                      const val = e.target.value;
                      setHomeRadiusSearch(prev => ({ ...prev, address: val }));
                      if (val === "") {
                        clearHomeRadiusSearch();
                      }
                    }}
                    onFocus={() => {
                      if (!window.google || homeSearchRef.current) return;
                      const autocomplete = new window.google.maps.places.Autocomplete(
                        document.getElementById("home-radius-address-input"),
                        { 
                          types: [], 
                          componentRestrictions: { country: 'in' } 
                        }
                      );
                      homeSearchRef.current = autocomplete;
                      autocomplete.addListener("place_changed", () => {
                        const place = autocomplete.getPlace();
                        if (place.geometry) {
                          const newLat = place.geometry.location.lat();
                          const newLng = place.geometry.location.lng();
                          const newAddr = place.formatted_address;
                          
                          setHomeRadiusSearch(prev => ({
                            ...prev,
                            address: newAddr,
                            lat: newLat,
                            lng: newLng
                          }));

                          // Auto Search Trigger
                          autoPerformHomeRadiusSearch(newLat, newLng, homeRadiusSearch.radius, newAddr);
                        }
                      });
                    }}
                    className="pl-7 pr-2 py-1.5 border border-purple-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none w-80 bg-purple-50/30 font-medium"
                  />
                </div>
                
                <select
                  value={homeRadiusSearch.radius}
                  onChange={(e) => {
                    const newRadius = e.target.value;
                    setHomeRadiusSearch(prev => ({ ...prev, radius: newRadius }));
                    
                    if (homeRadiusSearch.lat && homeRadiusSearch.lng) {
                      autoPerformHomeRadiusSearch(homeRadiusSearch.lat, homeRadiusSearch.lng, newRadius, homeRadiusSearch.address);
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
                  <option value="100">100 KM</option>
                </select>

                {homeRadiusSearch.active && (
                  <button
                    onClick={clearHomeRadiusSearch}
                    className="p-1.5 bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg"
                    title="Clear"
                  >
                    <FaTimes size={12} />
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowMap(!showMap)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                showMap ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <FaMapMarkerAlt size={12} />
              {showMap ? 'Hide Map' : 'Show Map View'}
            </button>
          </div>

          {/* Master Map Section */}
          <div className={`px-6 py-4 bg-gray-50/50 border-b border-gray-100 ${showMap ? '' : 'hidden'}`}>
            <div 
              id="drivers-master-map" 
              className="w-full h-[420px] rounded-xl border border-gray-200 shadow-inner bg-gray-100 overflow-hidden"
            />
            <div className="mt-2 flex items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Approved
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Pending
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> Rejected
              </div>
              <div className="ml-auto flex items-center gap-1 text-blue-600">
                <FaSyncAlt size={10} className={fetching ? 'animate-spin' : ''} />
                Updating with Filters
              </div>
            </div>
          </div>

          {/* Row 2: Navigation Tabs */}
          <div className="px-6 py-2 border-b border-gray-200 flex items-center gap-2 sm:gap-4 overflow-x-auto">
            {[
              { id: "all", label: "All", icon: FaUsers },
              { id: "pending", label: "Pending", icon: FaSyncAlt },
              { id: "approved", label: "Approved", icon: FaCheckCircle },
              { id: "rejected", label: "Rejected", icon: FaBan },
              { id: "inactive", label: "Inactive", icon: FaTimesCircle },
              { id: "online", label: "Online", icon: FaCircle },
              { id: "fleet", label: "Fleet Data", icon: FaTruck }
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
                  {tab.id === "all" ? dynamicStats.total :
                    tab.id === "pending" ? dynamicStats.pending :
                      tab.id === "approved" ? dynamicStats.approved :
                        tab.id === "rejected" ? dynamicStats.rejected :
                          tab.id === "inactive" ? dynamicStats.inactive :
                            tab.id === "fleet" ? dynamicStats.fleet :
                              dynamicStats.online}
                </span>
              </button>
            ))}
          </div>

          {/* Driver Table */}
          <div className="overflow-x-auto">
            {fetching ? (
              <table className="w-full min-w-[1600px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Driver','Contact','Vehicle','Location','Joined On','Updated','Referral Code','By','Online','Rating','Wallet','Earnings','Password','Status','Actions'].map((h) => (
                      <th key={h} className="py-3 px-4 text-left">
                        <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...Array(7)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200" />
                          <div className="space-y-1.5"><div className="h-3 bg-gray-200 rounded w-24" /><div className="h-2 bg-gray-100 rounded w-32" /></div>
                        </div>
                      </td>
                      <td className="py-3 px-4"><div className="space-y-1.5"><div className="h-3 bg-gray-200 rounded w-20" /><div className="h-2 bg-gray-100 rounded w-28" /></div></td>
                      <td className="py-3 px-4"><div className="space-y-1.5"><div className="h-3 bg-gray-200 rounded w-20" /><div className="h-2 bg-gray-100 rounded w-16" /></div></td>
                      <td className="py-3 px-4"><div className="space-y-1.5"><div className="h-3 bg-gray-200 rounded w-16" /><div className="h-2 bg-gray-100 rounded w-12" /></div></td>
                      <td className="py-3 px-4"><div className="h-3 bg-gray-200 rounded w-14" /></td>
                      <td className="py-3 px-4"><div className="h-3 bg-gray-200 rounded w-16" /></td>
                      <td className="py-3 px-4 text-center"><div className="h-6 bg-gray-100 rounded-full w-14 mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><div className="h-3 bg-gray-200 rounded w-8 mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><div className="h-3 bg-gray-200 rounded w-8 mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><div className="h-3 bg-gray-200 rounded w-8 mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><div className="h-3 bg-gray-200 rounded w-8 mx-auto" /></td>
                      <td className="py-3 px-4 text-right"><div className="h-3 bg-gray-200 rounded w-16 ml-auto" /></td>
                      <td className="py-3 px-4"><div className="h-6 bg-gray-100 rounded w-20" /></td>
                      <td className="py-3 px-4 text-center"><div className="h-6 bg-gray-100 rounded-full w-16 mx-auto" /></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-6 h-6 bg-gray-100 rounded" />
                          <div className="w-6 h-6 bg-gray-100 rounded" />
                          <div className="w-6 h-6 bg-gray-100 rounded" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full min-w-[1600px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Driver</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase min-w-[200px]">Vehicle</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase min-w-[400px]">Location</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase min-w-[150px]">Joined On</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase min-w-[150px]">Last Updated</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase min-w-[120px]">Referral Code</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase min-w-[120px]">Created By</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase min-w-[100px]">Online</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase min-w-[100px]">Rating</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase min-w-[100px]">Wallet</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase min-w-[120px]">Earnings</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase min-w-[200px]">Password</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <p className="text-lg font-medium">Koi Driver nahi mila bhai!</p>
                        <p className="text-sm">Range badha kar ya dusra address try karein.</p>
                        {(radiusSearch.active || homeRadiusSearch.active) && (
                          <button onClick={radiusSearch.active ? clearRadiusSearch : clearHomeRadiusSearch} className="mt-4 text-blue-600 font-bold hover:underline">
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
                      <td className="py-3 px-4 min-w-[200px]">
                        <p className="text-sm text-gray-900">{d.carDetails?.carModel || d.carModel || '—'}</p>
                        <p className="text-xs text-gray-500">{d.carDetails?.carNumber || d.carNumber || '—'}</p>
                      </td>
                      <td className="py-3 px-4 min-w-[400px]">
                        <div className="flex items-start gap-2 group">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 font-medium line-clamp-2" title={d.address}>
                              {d.address || d.city || '—'}
                            </p>
                            {(d.city || d.state) && (
                              <p className="text-[10px] text-gray-500 truncate">
                                {d.city}{d.city && d.state ? ', ' : ''}{d.state}
                              </p>
                            )}
                          </div>
                          {d.addressLatitude && d.addressLongitude && (
                            <a
                              href={`https://www.google.com/maps?q=${d.addressLatitude},${d.addressLongitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-blue-50 text-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-100"
                              title="Google Map par dekhein"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FaMapMarkerAlt size={12} />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 min-w-[150px]">
                        <p className="text-sm font-medium text-gray-900">
                          {d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {d.createdAt ? new Date(d.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </td>
                      <td className="py-3 px-4 min-w-[150px]">
                        <p className="text-sm font-medium text-gray-900">
                          {d.updatedAt ? new Date(d.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {d.updatedAt ? new Date(d.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </td>
                      <td className="py-3 px-4 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-blue-600 tracking-wider font-mono">{d.referralCode || '—'}</p>
                          {d.referralCode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(d.referralCode);
                                Swal.fire({ title: 'Copied!', text: 'Referral code copied to clipboard', icon: 'success', timer: 1500, showConfirmButton: false });
                              }}
                              className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-blue-50"
                              title="Copy Code"
                            >
                              <Copy size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 min-w-[140px]">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter ${
                            d.createdByModel === 'Admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                            d.createdByModel === 'Fleet' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                            d.createdByModel === 'Vendor' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                            'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            {d.createdByModel === 'Vendor' ? `Vendor: ${d.createdBy?.companyName || d.createdBy?.name || 'Vendor'}` :
                             d.createdByModel === 'Admin' ? 'Direct (Admin)' :
                             d.createdByModel === 'Fleet' ? `Fleet: ${d.createdBy?.name || 'Fleet'}` :
                             'Direct (Self/App)'}
                          </span>
                          {can('DRIVER_EDIT') && (
                            <button
                              onClick={(e) => handleOpenOwnershipModal(e, d)}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold underline flex items-center gap-1 transition-colors"
                              title="Move to Vendor or Make Direct"
                            >
                              <ArrowRightLeft size={10} />
                              <span>Change Owner</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center min-w-[100px]">
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
                      <td className="py-3 px-4 text-center min-w-[100px]">
                        <div className="flex items-center justify-center gap-1 text-yellow-500 text-sm font-bold">
                          <FaStar size={12} className="fill-current" />
                          <span className="text-sm font-medium text-gray-900">{d.rating ? Number(d.rating).toFixed(1) : 'New'}</span>
                        </div>
                        <p className="text-[9px] text-gray-400 mt-0.5">{d.totalRatings || 0} reviews</p>
                      </td>
                      <td className="py-3 px-4 text-center min-w-[100px]">
                        <span className="text-sm font-bold text-green-600">₹{(d.walletBalance || 0).toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4 text-right min-w-[120px]">
                        <span className="text-sm font-medium text-gray-900">₹{(d.totalEarnings || 0).toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4 min-w-[200px]">
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
                            <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionDropdownDriverId(actionDropdownDriverId === d._id ? null : d._id);
                                }}
                                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border transition-all shadow-xs ${
                                  actionDropdownDriverId === d._id
                                    ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-500/20'
                                    : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                                title="Check Driver Details & Lifetime History"
                              >
                                <Eye size={12} />
                                <span>Details</span>
                                <ChevronDown size={12} className={`transition-transform duration-200 ${actionDropdownDriverId === d._id ? 'rotate-180' : ''}`} />
                              </button>

                              {/* Dropdown Menu */}
                              {actionDropdownDriverId === d._id && (
                                <div 
                                  className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.18)] border border-gray-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    Check Driver Details
                                  </div>
                                  <button
                                    onClick={() => openDriverDetails(d, 'profile')}
                                    className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition-colors"
                                  >
                                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600 shrink-0">
                                      <User size={13} />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900 leading-tight">Profile Details</p>
                                      <p className="text-[10px] text-gray-500 leading-tight">Personal, Car & Docs</p>
                                    </div>
                                  </button>

                                  <button
                                    onClick={() => openDriverDetails(d, 'wallet')}
                                    className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition-colors"
                                  >
                                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 shrink-0">
                                      <Wallet size={13} />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900 leading-tight">Wallet Details</p>
                                      <p className="text-[10px] text-gray-500 leading-tight">Balance & Day-1 Txns</p>
                                    </div>
                                  </button>

                                  <button
                                    onClick={() => openDriverDetails(d, 'rides')}
                                    className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2.5 transition-colors"
                                  >
                                    <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600 shrink-0">
                                      <Car size={13} />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900 leading-tight">Ride Details</p>
                                      <p className="text-[10px] text-gray-500 leading-tight">Day-1 All Rides History</p>
                                    </div>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          {can('DRIVER_EDIT') && (
                            <button
                              onClick={(e) => handleOpenOwnershipModal(e, d)}
                              className="p-1 hover:bg-purple-100 rounded text-purple-600"
                              title="Transfer Ownership (Direct ↔ Vendor)"
                            >
                              <ArrowRightLeft size={14} />
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
                        <td colSpan="14" className="p-4">
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
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Rating:</span>
                                  <span className="font-medium text-yellow-600 flex items-center gap-1">
                                    <FaStar size={10} className="fill-current" /> {d.rating || 'N/A'} ({d.totalRatings || 0})
                                  </span>
                                </div>
                                {d.totalRatings > 0 && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setReviewModal({ isOpen: true, targetId: d._id }); }}
                                    className="mt-3 w-full py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors"
                                  >
                                    View All Reviews
                                  </button>
                                )}
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
            )}
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

      {/* 3-Tab Driver Inspection Modal (Profile, Wallet, Rides from Day 1) */}
      {viewing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-5xl shadow-[0_25px_70px_rgba(0,0,0,0.5)] overflow-hidden my-auto max-h-[92vh] flex flex-col border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header Banner with Profile & Driver Platform Tenure */}
            <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shrink-0 shadow-sm">
              <button
                onClick={() => { setViewing(null); setDriverHistoryData(null); }}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
                title="Close"
              >
                <X size={18} />
              </button>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 pr-10">
                {/* Driver Info */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-white/20 shadow-md overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
                    {viewing.image ? (
                      <img
                        src={`${IMAGE_BASE_URL}${viewing.image}`}
                        alt={viewing.name}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={(e) => { e.stopPropagation(); setSelectedDocPreview(`${IMAGE_BASE_URL}${viewing.image}`); }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling?.style && (e.currentTarget.nextSibling.style.display = 'flex'); }}
                      />
                    ) : null}
                    <User size={36} className="text-white/80" style={{ display: viewing.image ? 'none' : 'block' }} />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{viewing.name || 'Driver'}</h2>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        viewing.isOnline ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${viewing.isOnline ? 'bg-emerald-400' : 'bg-gray-400'}`} />
                        {viewing.isOnline ? 'Online' : 'Offline'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        viewing.isApproved ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                        viewing.isRejected ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                        'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      }`}>
                        {viewing.isApproved ? 'Approved' : viewing.isRejected ? 'Rejected' : 'Pending Approval'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-indigo-200/80 font-mono">
                      <span>Driver ID: #{viewing._id?.slice(-8)}</span>
                      <span>•</span>
                      <span>Vehicle: {viewing.carDetails?.carModel || viewing.carModel || 'Standard'} ({viewing.carDetails?.carNumber || viewing.carNumber || 'N/A'})</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-white/80">
                      <a href={`tel:${viewing.phone}`} className="flex items-center gap-1.5 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg">
                        <Phone size={12} className="text-indigo-300" />
                        <span>{viewing.phone || 'No phone'}</span>
                      </a>
                      {viewing.email && (
                        <a href={`mailto:${viewing.email}`} className="flex items-center gap-1.5 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg">
                          <Mail size={12} className="text-indigo-300" />
                          <span>{viewing.email}</span>
                        </a>
                      )}
                      {viewing.referralCode && (
                        <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg text-amber-300 font-mono">
                          Ref: {viewing.referralCode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Driver Platform Tenure Card */}
                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3.5 flex flex-col min-w-[220px] shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-amber-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Driver Tenure</span>
                  </div>
                  <p className="text-base sm:text-lg font-black text-white">
                    {driverHistoryData?.tenure?.tenureText || `${Math.max(0, Math.ceil((new Date() - new Date(viewing.createdAt)) / (1000 * 60 * 60 * 24)))} Days`}
                  </p>
                  <p className="text-[11px] text-indigo-200/70 flex items-center gap-1 mt-0.5">
                    <Calendar size={11} />
                    Joined: {new Date(viewing.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Quick Metrics KPI Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-5 pt-4 border-t border-white/10">
                <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                  <span className="text-[10px] text-white/60 uppercase font-bold tracking-wider">Total Trips</span>
                  <p className="text-base font-black text-white mt-0.5">
                    {driverHistoryLoading ? '...' : (driverHistoryData?.rides?.totalRides ?? viewing.totalTrips ?? 0)}
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                  <span className="text-[10px] text-white/60 uppercase font-bold tracking-wider">Completed Rides</span>
                  <p className="text-base font-black text-emerald-400 mt-0.5">
                    {driverHistoryLoading ? '...' : (driverHistoryData?.rides?.completedRides ?? 0)}
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                  <span className="text-[10px] text-white/60 uppercase font-bold tracking-wider">Total Earnings</span>
                  <p className="text-base font-black text-white mt-0.5">
                    ₹{((driverHistoryData?.wallet?.totalEarnings ?? viewing.totalEarnings) || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                  <span className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">Wallet Balance</span>
                  <p className={`text-base font-black mt-0.5 ${((driverHistoryData?.wallet?.walletBalance ?? viewing.walletBalance) || 0) < 0 ? 'text-rose-400' : 'text-emerald-300'}`}>
                    ₹{((driverHistoryData?.wallet?.walletBalance ?? viewing.walletBalance) || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                  <span className="text-[10px] text-amber-300 uppercase font-bold tracking-wider">Rating</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <StarIcon size={14} className="fill-amber-400 text-amber-400" />
                    <span className="text-base font-black text-white">{viewing.rating ? Number(viewing.rating).toFixed(1) : 'New'}</span>
                    <span className="text-[10px] text-white/60">({viewing.totalRatings || 0})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs (Profile, Wallet, Rides) */}
            <div className="bg-white px-6 py-2.5 border-b border-gray-200 flex items-center justify-between gap-4 shrink-0 shadow-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDriverDetailTab('profile')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    driverDetailTab === 'profile'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <User size={14} />
                  <span>Profile Details</span>
                </button>

                <button
                  onClick={() => setDriverDetailTab('wallet')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    driverDetailTab === 'wallet'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Wallet size={14} />
                  <span>Wallet & Transactions</span>
                  {driverHistoryData?.wallet?.transactions && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      driverDetailTab === 'wallet' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {driverHistoryData.wallet.transactions.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setDriverDetailTab('rides')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    driverDetailTab === 'rides'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Car size={14} />
                  <span>Ride History (Day 1)</span>
                  {driverHistoryData?.rides?.allRides && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      driverDetailTab === 'rides' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {driverHistoryData.rides.allRides.length}
                    </span>
                  )}
                </button>
              </div>

              {can('DRIVER_EDIT') && (
                <button
                  onClick={() => {
                    const d = viewing;
                    setViewing(null);
                    handleOpenEdit(d);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors"
                >
                  <FaEdit size={12} />
                  <span>Edit Driver</span>
                </button>
              )}
            </div>

            {/* Modal Body Content (Scrollable) */}
            <div className="p-5 sm:p-6 flex-1 overflow-y-auto bg-gray-50/50">
              {driverHistoryLoading ? (
                <div className="py-16 text-center">
                  <RefreshCw size={28} className="animate-spin text-blue-600 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-600">Loading driver history & transactions from Day 1...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: PROFILE DETAILS */}
                  {driverDetailTab === 'profile' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Personal Details */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
                          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider pb-2 border-b border-gray-100 flex items-center gap-2">
                            <User size={14} className="text-blue-600" />
                            Personal Information
                          </h4>
                          <div className="space-y-2.5 text-xs">
                            <div className="flex justify-between items-center py-1 border-b border-gray-50">
                              <span className="text-gray-500">Full Name</span>
                              <span className="font-semibold text-gray-900">{viewing.name}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-gray-50">
                              <span className="text-gray-500">Phone</span>
                              <span className="font-semibold text-gray-900">{viewing.phone}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-gray-50">
                              <span className="text-gray-500">Email</span>
                              <span className="font-semibold text-gray-900">{viewing.email || '—'}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-gray-50">
                              <span className="text-gray-500">License Number</span>
                              <span className="font-semibold text-gray-900 font-mono">{viewing.licenseNumber || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-gray-50">
                              <span className="text-gray-500">License Expiry</span>
                              <span className={`font-semibold ${viewing.licenseExpiry && new Date(viewing.licenseExpiry) < new Date() ? 'text-red-500' : 'text-gray-900'}`}>
                                {viewing.licenseExpiry ? new Date(viewing.licenseExpiry).toLocaleDateString('en-IN') : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-gray-50">
                              <span className="text-gray-500">Aadhar Number</span>
                              <span className="font-semibold text-gray-900 font-mono">{viewing.aadharNumber || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-gray-50">
                              <span className="text-gray-500">PAN Number</span>
                              <span className="font-semibold text-gray-900 font-mono">{viewing.panNumber || 'N/A'}</span>
                            </div>
                            <div className="pt-1">
                              <span className="text-gray-500 block mb-1">Registered Address</span>
                              <p className="font-medium text-gray-900 leading-relaxed">
                                {viewing.address || '—'}{viewing.city ? `, ${viewing.city}` : ''}{viewing.state ? `, ${viewing.state}` : ''}{viewing.pincode ? ` - ${viewing.pincode}` : ''}
                              </p>
                              {viewing.addressLatitude && viewing.addressLongitude && (
                                <a
                                  href={`https://www.google.com/maps?q=${viewing.addressLatitude},${viewing.addressLongitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 mt-2 text-blue-600 hover:text-blue-800 font-semibold"
                                >
                                  <MapPin size={12} />
                                  <span>View on Google Maps</span>
                                  <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Vehicle & Car Details */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
                          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider pb-2 border-b border-gray-100 flex items-center gap-2">
                            <Car size={14} className="text-indigo-600" />
                            Vehicle Details
                          </h4>
                          <div className="space-y-2.5 text-xs">
                            <div className="flex justify-between items-center py-1 border-b border-gray-50">
                              <span className="text-gray-500">Brand & Model</span>
                              <span className="font-semibold text-gray-900">{viewing.carDetails?.carBrand || viewing.carBrand || ''} {viewing.carDetails?.carModel || viewing.carModel || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-gray-50">
                              <span className="text-gray-500">Registration Number</span>
                              <span className="font-semibold text-gray-900 font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                {viewing.carDetails?.carNumber || viewing.carNumber || 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-gray-50">
                              <span className="text-gray-500">Vehicle Type</span>
                              <span className="font-semibold text-gray-900">{viewing.carDetails?.vehicleType || viewing.vehicleType || 'Car'}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-gray-50">
                              <span className="text-gray-500">Color</span>
                              <span className="font-semibold text-gray-900">{viewing.carDetails?.carColor || viewing.carColor || '—'}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-gray-50">
                              <span className="text-gray-500">Manufacturing Year</span>
                              <span className="font-semibold text-gray-900">{viewing.carDetails?.manufacturingYear || viewing.manufacturingYear || '—'}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-gray-50">
                              <span className="text-gray-500">Seating Capacity</span>
                              <span className="font-semibold text-gray-900">{viewing.carDetails?.seatCapacity || viewing.availableSeats || 4} Persons</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-gray-50">
                              <span className="text-gray-500">Insurance Expiry</span>
                              <span className={`font-semibold ${viewing.carDetails?.insuranceExpiry && new Date(viewing.carDetails.insuranceExpiry) < new Date() ? 'text-red-500' : 'text-gray-900'}`}>
                                {viewing.carDetails?.insuranceExpiry ? new Date(viewing.carDetails.insuranceExpiry).toLocaleDateString('en-IN') : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-gray-50">
                              <span className="text-gray-500">Permit Expiry</span>
                              <span className="font-semibold text-gray-900">{viewing.carDetails?.permitExpiry ? new Date(viewing.carDetails.permitExpiry).toLocaleDateString('en-IN') : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-gray-50">
                              <span className="text-gray-500">PUC Expiry</span>
                              <span className="font-semibold text-gray-900">{viewing.carDetails?.pucExpiry ? new Date(viewing.carDetails.pucExpiry).toLocaleDateString('en-IN') : 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Bank Details & Ownership */}
                        <div className="space-y-5">
                          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider pb-2 border-b border-gray-100 flex items-center gap-2">
                              <CreditCard size={14} className="text-emerald-600" />
                              Bank Account
                            </h4>
                            <div className="space-y-2.5 text-xs">
                              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                                <span className="text-gray-500">Bank Name</span>
                                <span className="font-semibold text-gray-900">{viewing.bankDetails?.bankName || 'Not Added'}</span>
                              </div>
                              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                                <span className="text-gray-500">Account Number</span>
                                <span className="font-semibold text-gray-900 font-mono">{viewing.bankDetails?.accountNumber || 'Not Added'}</span>
                              </div>
                              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                                <span className="text-gray-500">IFSC Code</span>
                                <span className="font-semibold text-gray-900 font-mono">{viewing.bankDetails?.ifscCode || 'Not Added'}</span>
                              </div>
                              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                                <span className="text-gray-500">Account Holder</span>
                                <span className="font-semibold text-gray-900">{viewing.bankDetails?.accountHolderName || 'Not Added'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider pb-2 border-b border-gray-100 flex items-center gap-2">
                              <Building2 size={14} className="text-purple-600" />
                              Ownership & Account Info
                            </h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between items-center py-1">
                                <span className="text-gray-500">Owner Model</span>
                                <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                  {viewing.createdByModel || 'Direct'}
                                </span>
                              </div>
                              {viewing.createdBy && (
                                <div className="flex justify-between items-center py-1">
                                  <span className="text-gray-500">Assigned Vendor/Fleet</span>
                                  <span className="font-semibold text-gray-900">{viewing.createdBy?.companyName || viewing.createdBy?.name || '—'}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-center py-1">
                                <span className="text-gray-500">Debt Limit</span>
                                <span className="font-semibold text-rose-600">₹{viewing.debtLimit || -500}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Official Documents Gallery - All 8 Documents */}
                      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                            <FileCheck size={14} className="text-blue-600" />
                            Driver & Vehicle Documents (Click to inspect)
                          </h4>
                          <span className="text-[11px] text-gray-400">4 Document Slots</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                          {(() => {
                            const docs = [
                              { 
                                label: 'RC Book', 
                                file: viewing.carDetails?.carDocuments?.rc || viewing.rcImage || viewing.carDocuments?.rc || null,
                                desc: viewing.carDetails?.carNumber || viewing.carNumber || null
                              },
                              { 
                                label: 'Insurance Policy', 
                                file: viewing.carDetails?.carDocuments?.insurance || viewing.insuranceImage || viewing.carDocuments?.insurance || null,
                                desc: viewing.carDetails?.insuranceExpiry ? `Exp: ${new Date(viewing.carDetails.insuranceExpiry).toLocaleDateString('en-IN')}` : null
                              },
                              { 
                                label: 'Road Permit', 
                                file: viewing.carDetails?.carDocuments?.permit || viewing.permitImage || viewing.carDocuments?.permit || null,
                                desc: viewing.carDetails?.permitExpiry ? `Exp: ${new Date(viewing.carDetails.permitExpiry).toLocaleDateString('en-IN')}` : null
                              },
                              { 
                                label: 'PUC Certificate', 
                                file: viewing.carDetails?.carDocuments?.puc || viewing.pucImage || viewing.carDocuments?.puc || null,
                                desc: viewing.carDetails?.pucExpiry ? `Exp: ${new Date(viewing.carDetails.pucExpiry).toLocaleDateString('en-IN')}` : null
                              }
                            ];
                            return docs.map((doc, idx) => {
                              const fileUrl = doc.file ? `${IMAGE_BASE_URL}${doc.file}` : null;
                              const uploadedCount = docs.filter(d => d.file).length;
                              return (
                                <div key={idx} className="space-y-1.5">
                                  <div className="text-center">
                                    <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">{doc.label}</p>
                                    {doc.desc && <p className="text-[10px] text-gray-400 font-mono truncate px-1" title={doc.desc}>{doc.desc}</p>}
                                  </div>
                                  <div
                                    className={`aspect-[4/3] rounded-xl border-2 overflow-hidden relative group transition-all ${
                                      doc.file 
                                        ? 'border-blue-200 cursor-pointer hover:border-blue-500 hover:shadow-lg bg-white' 
                                        : 'border-dashed border-gray-200 bg-gray-50 flex items-center justify-center'
                                    }`}
                                    onClick={() => doc.file && setSelectedDocPreview(fileUrl)}
                                    title={doc.file ? `Click to view ${doc.label}` : `${doc.label} not uploaded`}
                                  >
                                    {doc.file ? (
                                      <DocImage fileUrl={fileUrl} docLabel={doc.label} onPreview={() => setSelectedDocPreview(fileUrl)} />
                                    ) : (
                                      <div className="flex flex-col items-center justify-center text-gray-300 p-2 text-center h-full">
                                        <FaBan size={20} className="text-gray-200" />
                                        <span className="text-[10px] mt-1.5 font-semibold text-gray-400">Not Uploaded</span>
                                      </div>
                                    )}
                                  </div>
                                  {doc.file && (
                                    <a
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 font-semibold py-0.5 hover:underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <ExternalLink size={10} />
                                      Open in New Tab
                                    </a>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                        {/* Summary Bar */}
                        {(() => {
                          const docs = [
                            viewing.carDetails?.carDocuments?.rc, viewing.carDetails?.carDocuments?.insurance,
                            viewing.carDetails?.carDocuments?.permit, viewing.carDetails?.carDocuments?.puc
                          ];
                          const uploaded = docs.filter(Boolean).length;
                          return (
                            <div className={`mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs`}>
                              <span className="text-gray-500">
                                <span className={`font-bold ${uploaded === 4 ? 'text-emerald-600' : uploaded >= 2 ? 'text-amber-600' : 'text-red-500'}`}>{uploaded}/4</span> documents uploaded
                              </span>
                              <div className="flex gap-1">
                                {docs.map((f, i) => (
                                  <div key={i} className={`w-4 h-1.5 rounded-full ${f ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Rejection Alert */}
                      {viewing.isRejected && viewing.rejectionReason && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                          <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-red-800 uppercase tracking-wider">Rejection Reason</p>
                            <p className="text-xs text-red-700 mt-0.5">{viewing.rejectionReason}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: WALLET & DAY-1 TRANSACTIONS */}
                  {driverDetailTab === 'wallet' && (
                    <div className="space-y-5">
                      {/* Wallet Highlights Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Current Balance</span>
                          <p className={`text-xl font-black mt-1 ${((driverHistoryData?.wallet?.walletBalance ?? viewing.walletBalance) || 0) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            ₹{((driverHistoryData?.wallet?.walletBalance ?? viewing.walletBalance) || 0).toLocaleString('en-IN')}
                          </p>
                          <span className="text-[10px] text-gray-400 mt-1 block">Live wallet balance</span>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Credits (+)</span>
                          <p className="text-xl font-black text-emerald-600 mt-1">
                            ₹{(driverHistoryData?.wallet?.totalCredits || 0).toLocaleString('en-IN')}
                          </p>
                          <span className="text-[10px] text-gray-400 mt-1 block">Earnings & recharges</span>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Debits (-)</span>
                          <p className="text-xl font-black text-rose-600 mt-1">
                            ₹{(driverHistoryData?.wallet?.totalDebits || 0).toLocaleString('en-IN')}
                          </p>
                          <span className="text-[10px] text-gray-400 mt-1 block">Commissions & payouts</span>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Debt Limit</span>
                          <p className="text-xl font-black text-indigo-600 mt-1">
                            ₹{(driverHistoryData?.wallet?.debtLimit || -500).toLocaleString('en-IN')}
                          </p>
                          <span className="text-[10px] text-gray-400 mt-1 block">Max negative allowed</span>
                        </div>
                      </div>

                      {/* Transactions Filters & Search */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setWalletFilterType('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              walletFilterType === 'all' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            All Txns ({driverHistoryData?.wallet?.transactions?.length || 0})
                          </button>
                          <button
                            onClick={() => setWalletFilterType('Credit')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              walletFilterType === 'Credit' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            Credits Only (+)
                          </button>
                          <button
                            onClick={() => setWalletFilterType('Debit')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              walletFilterType === 'Debit' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            }`}
                          >
                            Debits Only (-)
                          </button>
                        </div>

                        <div className="relative w-full sm:w-64">
                          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search category, note, ID..."
                            value={walletSearchQuery}
                            onChange={(e) => setWalletSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Transactions Table from Day 1 */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                            <History size={14} className="text-blue-600" />
                            Lifetime Transactions History (Day 1 to Present)
                          </h4>
                        </div>

                        {(() => {
                          const allTxns = driverHistoryData?.wallet?.transactions || [];
                          let filtered = allTxns;

                          if (walletFilterType !== 'all') {
                            filtered = filtered.filter(t => t.type === walletFilterType);
                          }

                          if (walletSearchQuery.trim()) {
                            const q = walletSearchQuery.toLowerCase();
                            filtered = filtered.filter(t =>
                              (t.category && t.category.toLowerCase().includes(q)) ||
                              (t.description && t.description.toLowerCase().includes(q)) ||
                              (t._id && t._id.toLowerCase().includes(q)) ||
                              (t.relatedBooking?._id && t.relatedBooking._id.toLowerCase().includes(q))
                            );
                          }

                          if (filtered.length === 0) {
                            return (
                              <div className="py-12 text-center text-gray-400">
                                <Wallet size={32} className="mx-auto mb-2 text-gray-300" />
                                <p className="text-sm font-semibold text-gray-600">No transactions recorded yet</p>
                                <p className="text-xs text-gray-400 mt-0.5">Transactions from Day 1 will appear here.</p>
                              </div>
                            );
                          }

                          return (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                                  <tr>
                                    <th className="py-3 px-4">Date & Time</th>
                                    <th className="py-3 px-4">Type & Category</th>
                                    <th className="py-3 px-4">Description / Booking</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-4 text-right">Amount</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {filtered.map((t) => {
                                    const isCredit = t.type === 'Credit';
                                    return (
                                      <tr key={t._id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                                          <p className="font-semibold text-gray-900">
                                            {new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                          </p>
                                          <p className="text-[10px] text-gray-400">
                                            {new Date(t.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                          </p>
                                        </td>
                                        <td className="py-3 px-4">
                                          <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                              {isCredit ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                                            </div>
                                            <div>
                                              <p className="font-bold text-gray-900">{t.category || (isCredit ? 'Credit' : 'Debit')}</p>
                                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${isCredit ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                                                {t.type}
                                              </span>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="py-3 px-4 max-w-xs">
                                          <p className="text-gray-800 font-medium truncate" title={t.description}>
                                            {t.description || '—'}
                                          </p>
                                          {t.relatedBooking && (
                                            <p className="text-[10px] text-blue-600 font-mono mt-0.5">
                                              Ref Booking: #{t.relatedBooking._id?.toString().slice(-8).toUpperCase()}
                                            </p>
                                          )}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            t.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                            t.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                            'bg-rose-100 text-rose-700'
                                          }`}>
                                            {t.status || 'Completed'}
                                          </span>
                                        </td>
                                        <td className="py-3 px-4 text-right whitespace-nowrap">
                                          <span className={`text-sm font-black ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {isCredit ? '+' : '-'}₹{Number(t.amount || 0).toLocaleString('en-IN')}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: RIDE DETAILS (DAY 1 ALL RIDES) */}
                  {driverDetailTab === 'rides' && (
                    <div className="space-y-5">
                      {/* Rides Stats Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Rides Assigned</span>
                          <p className="text-xl font-black text-gray-900 mt-1">
                            {driverHistoryData?.rides?.totalRides || 0}
                          </p>
                          <span className="text-[10px] text-gray-400 mt-1 block">Lifetime trips</span>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Completed Trips</span>
                          <p className="text-xl font-black text-emerald-600 mt-1">
                            {driverHistoryData?.rides?.completedRides || 0}
                          </p>
                          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
                            {driverHistoryData?.rides?.totalRides ? Math.round((driverHistoryData.rides.completedRides / driverHistoryData.rides.totalRides) * 100) : 0}% success rate
                          </span>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Cancelled Trips</span>
                          <p className="text-xl font-black text-rose-600 mt-1">
                            {driverHistoryData?.rides?.cancelledRides || 0}
                          </p>
                          <span className="text-[10px] text-rose-500 mt-1 block">Cancelled by user/driver</span>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Gross Fare</span>
                          <p className="text-xl font-black text-indigo-600 mt-1">
                            ₹{(driverHistoryData?.rides?.totalFareGenerated || 0).toLocaleString('en-IN')}
                          </p>
                          <span className="text-[10px] text-gray-400 mt-1 block">Completed trip value</span>
                        </div>
                      </div>

                      {/* Rides Filters & Search */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
                        {/* Sub Tabs */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setRideDetailTab('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              rideDetailTab === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            All Rides ({driverHistoryData?.rides?.allRides?.length || 0})
                          </button>
                          <button
                            onClick={() => setRideDetailTab('city')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              rideDetailTab === 'city' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            City Rides ({driverHistoryData?.rides?.regularRides?.length || 0})
                          </button>
                          <button
                            onClick={() => setRideDetailTab('package')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              rideDetailTab === 'package' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            Package Rides ({driverHistoryData?.rides?.fixedRides?.length || 0})
                          </button>
                        </div>

                        {/* Search & Status Filter */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <div className="relative flex-1 sm:w-56">
                            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search pickup, drop, passenger, ID..."
                              value={rideDetailSearch}
                              onChange={(e) => setRideDetailSearch(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <select
                            value={rideDetailStatus}
                            onChange={(e) => setRideDetailStatus(e.target.value)}
                            className="px-2.5 py-1.5 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-gray-700"
                          >
                            <option value="all">All Status</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="Ongoing">Ongoing / Started</option>
                            <option value="Accepted">Accepted</option>
                          </select>
                        </div>
                      </div>

                      {/* Rides List Cards */}
                      {(() => {
                        let ridesToShow = driverHistoryData?.rides?.allRides || [];
                        if (rideDetailTab === 'city') ridesToShow = driverHistoryData?.rides?.regularRides || [];
                        if (rideDetailTab === 'package') ridesToShow = driverHistoryData?.rides?.fixedRides || [];

                        if (rideDetailStatus !== 'all') {
                          if (rideDetailStatus === 'Ongoing') {
                            ridesToShow = ridesToShow.filter(r => ['Ongoing', 'Started', 'Accepted'].includes(r.status));
                          } else {
                            ridesToShow = ridesToShow.filter(r => r.status === rideDetailStatus);
                          }
                        }

                        if (rideDetailSearch.trim()) {
                          const q = rideDetailSearch.toLowerCase();
                          ridesToShow = ridesToShow.filter(r =>
                            (r.pickup && r.pickup.toLowerCase().includes(q)) ||
                            (r.drop && r.drop.toLowerCase().includes(q)) ||
                            (r.bookingId && r.bookingId.toLowerCase().includes(q)) ||
                            (r._id && r._id.toLowerCase().includes(q)) ||
                            (r.customer?.name && r.customer.name.toLowerCase().includes(q)) ||
                            (r.customer?.phone && r.customer.phone.includes(q))
                          );
                        }

                        if (ridesToShow.length === 0) {
                          return (
                            <div className="py-14 text-center bg-white rounded-xl border border-gray-200 shadow-xs">
                              <Car size={36} className="mx-auto mb-2 text-gray-300" />
                              <p className="text-sm font-semibold text-gray-700">No rides found</p>
                              <p className="text-xs text-gray-400 mt-0.5">Try changing filter or search criteria.</p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-3">
                            {ridesToShow.map((ride) => {
                              const isCompleted = ride.status === 'Completed';
                              const isCancelled = ride.status === 'Cancelled';
                              return (
                                <div
                                  key={ride._id}
                                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs hover:shadow-md transition-all space-y-3"
                                >
                                  {/* Top Row: IDs, Service Type & Status */}
                                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                        #{ride.bookingId || ride._id?.slice(-8).toUpperCase()}
                                      </span>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                        ride.type === 'Package Ride' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                                      }`}>
                                        {ride.type} • {ride.rideType}
                                      </span>
                                      <span className="text-[10px] text-gray-400">
                                        Vehicle: {ride.carCategory}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500 font-medium">
                                        {new Date(ride.date || ride.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        {ride.pickupTime ? ` at ${ride.pickupTime}` : ''}
                                      </span>
                                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                        isCompleted ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                        isCancelled ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                                        'bg-amber-100 text-amber-700 border border-amber-200'
                                      }`}>
                                        {ride.status}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Middle Row: Route & Customer Info */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                                    {/* Route */}
                                    <div className="md:col-span-2 space-y-1.5">
                                      <div className="flex items-start gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                                        <p className="text-xs font-medium text-gray-800 leading-snug line-clamp-1" title={ride.pickup}>
                                          <span className="text-gray-400 font-normal">Pickup: </span>{ride.pickup}
                                        </p>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                                        <p className="text-xs font-medium text-gray-800 leading-snug line-clamp-1" title={ride.drop}>
                                          <span className="text-gray-400 font-normal">Drop: </span>{ride.drop}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Passenger & Financials */}
                                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex items-center justify-between gap-3 text-xs">
                                      <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Passenger</p>
                                        <p className="font-semibold text-gray-900">{ride.customer?.name || 'Passenger'}</p>
                                        <a href={`tel:${ride.customer?.phone}`} className="text-[11px] text-blue-600 hover:underline font-mono">
                                          {ride.customer?.phone || 'No phone'}
                                        </a>
                                      </div>

                                      <div className="text-right">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Fare / Earning</p>
                                        <p className="text-sm font-black text-gray-900">₹{Number(ride.fare || 0).toLocaleString('en-IN')}</p>
                                        <p className="text-[10px] text-emerald-600 font-bold">
                                          Net: ₹{Number(ride.driverEarning || ride.fare || 0).toLocaleString('en-IN')}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Bottom Sub-info */}
                                  <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-50">
                                    <div className="flex items-center gap-3">
                                      <span>Payment: <strong className="text-gray-700">{ride.paymentMethod}</strong></span>
                                      <span>•</span>
                                      <span>Pay Status: <strong className={ride.paymentStatus === 'Completed' ? 'text-emerald-600' : 'text-amber-600'}>{ride.paymentStatus}</strong></span>
                                    </div>
                                    {ride.distanceKm > 0 && (
                                      <span>Est. Distance: <strong className="text-gray-700">{ride.distanceKm} km</strong></span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 px-6 border-t border-gray-200 flex items-center justify-between bg-white shrink-0">
              <p className="text-xs text-gray-400">
                Driver Profile & Lifetime Activity Tracker
              </p>
              <button
                onClick={() => { setViewing(null); setDriverHistoryData(null); }}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Full Document / Image Viewer Popup */}
      {selectedDocPreview && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[70] p-4"
          onClick={() => setSelectedDocPreview(null)}
        >
          <div className="relative max-w-4xl max-h-[92vh] bg-white rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.7)] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Lightbox Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Eye size={14} className="text-blue-400" />
                <span className="text-xs font-semibold">Document Preview</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedDocPreview}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-[11px] font-semibold transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={11} />
                  Open Full
                </a>
                <button
                  onClick={() => setSelectedDocPreview(null)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            {/* Image Content */}
            <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-950 p-4 min-h-[300px]">
              <img
                src={selectedDocPreview}
                alt="Document Preview"
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'flex flex-col items-center justify-center text-white p-8 text-center gap-3';
                  fallback.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg><p class="text-sm font-semibold text-gray-300">Cannot preview this file type</p><a href="${selectedDocPreview}" target="_blank" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-bold transition-colors">Download / Open File</a>`;
                  e.currentTarget.parentElement.appendChild(fallback);
                }}
              />
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <div className="space-y-1 w-full">
                        <label className="text-xs font-medium flex items-center gap-1.5 text-gray-600">
                          <Home size={14} className="text-gray-400" />
                          Full Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          ref={addressRef}
                          type="text"
                          name="address"
                          value={editForm.address}
                          onChange={handleEditChange}
                          required
                          placeholder="Type address and select from suggestions..."
                          className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
                          style={{
                            backgroundColor: themeColors.background || themeColors.surface || "#ffffff",
                            borderColor: themeColors.border,
                            color: themeColors.text
                          }}
                        />
                      </div>
                    </div>
                    <Field label="City" name="city" value={editForm.city} onChange={handleEditChange} icon={MapPin} />
                    <Field label="State" name="state" value={editForm.state} onChange={handleEditChange} icon={Map} />
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
                    {editForm.vehicleType !== 'E-Rickshaw' && <Field label="License Number" name="licenseNumber" value={editForm.licenseNumber} onChange={handleEditChange} icon={FaIdCard} />}
                    {editForm.vehicleType !== 'E-Rickshaw' && <Field label="License Expiry" name="licenseExpiry" value={editForm.licenseExpiry} onChange={handleEditChange} type="date" icon={FaCalendarAlt} />}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <SelectField
                      label="Vehicle Type"
                      name="vehicleType"
                      value={editForm.vehicleType}
                      onChange={handleEditChange}
                      options={[
                        { value: 'Car', label: 'Car' },
                        { value: 'Auto', label: 'Auto' },
                        { value: 'Bike', label: 'Bike' },
                        { value: 'E-Rickshaw', label: 'E-Rickshaw' }
                      ]}
                      icon={FaCar}
                    />
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
                    {editForm.vehicleType !== 'Bike' && editForm.vehicleType !== 'E-Rickshaw' && <Field label="Permit Expiry" name="permitExpiry" value={editForm.permitExpiry} onChange={handleEditChange} type="date" icon={FaFileInvoice} />}
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
                        { label: 'Permit Doc', setter: setPermitFile, hide: editForm.vehicleType === 'Bike' || editForm.vehicleType === 'E-Rickshaw' },
                        { label: 'PUC Doc', setter: setPucFile },
                      ].filter(d => !d.hide).map(({ label, setter }) => (
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

      {/* Reviews Modal */}
      <ReviewsModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ isOpen: false, targetId: null })}
        targetId={reviewModal.targetId}
        type="driver"
      />

      {/* Ownership Transfer Modal (Direct ↔ Vendor) */}
      {ownershipModal.isOpen && ownershipModal.driver && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <ArrowRightLeft size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Transfer Car / Driver Ownership</h3>
                  <p className="text-xs text-blue-100">Direct aur Vendor category ke beech shift karein</p>
                </div>
              </div>
              <button
                onClick={() => setOwnershipModal({ isOpen: false, driver: null, targetType: "Direct", vendorId: "", submitting: false })}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleOwnershipSubmit} className="p-6 space-y-5">
              {/* Selected Driver Summary Card */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {ownershipModal.driver.name?.charAt(0) || "D"}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{ownershipModal.driver.name}</h4>
                      <p className="text-xs text-gray-500">{ownershipModal.driver.phone}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-gray-200 text-gray-800 shadow-sm">
                    {ownershipModal.driver.carDetails?.carNumber || ownershipModal.driver.carNumber || "No Car Number"}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Current Status:</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full ${
                    ownershipModal.driver.createdByModel === 'Vendor'
                      ? 'bg-orange-100 text-orange-800 border border-orange-200'
                      : 'bg-purple-100 text-purple-800 border border-purple-200'
                  }`}>
                    {ownershipModal.driver.createdByModel === 'Vendor'
                      ? `Vendor: ${ownershipModal.driver.createdBy?.companyName || ownershipModal.driver.createdBy?.name || 'Vendor'}`
                      : 'Direct (Platform / Self)'}
                  </span>
                </div>
              </div>

              {/* Ownership Options */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Nayi Ownership Chunein:
                </label>

                {/* Option 1: Make Direct */}
                <div
                  onClick={() => setOwnershipModal(prev => ({ ...prev, targetType: "Direct" }))}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                    ownershipModal.targetType === "Direct"
                      ? "border-purple-600 bg-purple-50/50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="targetType"
                    checked={ownershipModal.targetType === "Direct"}
                    onChange={() => setOwnershipModal(prev => ({ ...prev, targetType: "Direct" }))}
                    className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-purple-600" />
                      <h4 className="text-sm font-bold text-gray-900">Direct (Admin / Company Platform)</h4>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Vendor se hata kar direct platform car bana dein. Trips ka full commission Admin ke paas rahega, kisi vendor ko share nahi hoga.
                    </p>
                  </div>
                </div>

                {/* Option 2: Move to Vendor */}
                <div
                  onClick={() => setOwnershipModal(prev => ({ ...prev, targetType: "Vendor" }))}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                    ownershipModal.targetType === "Vendor"
                      ? "border-orange-500 bg-orange-50/50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="targetType"
                    checked={ownershipModal.targetType === "Vendor"}
                    onChange={() => setOwnershipModal(prev => ({ ...prev, targetType: "Vendor" }))}
                    className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Store size={16} className="text-orange-600" />
                      <h4 className="text-sm font-bold text-gray-900">Assign / Move to Vendor</h4>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Kisi specific vendor ko yeh car/driver assign karein. Us vendor ko trip par set commission milega aur vendor panel me car dikhegi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Vendor Selector Dropdown (Shown when targetType === 'Vendor') */}
              {ownershipModal.targetType === "Vendor" && (
                <div className="space-y-1.5 p-3.5 bg-orange-50/80 rounded-xl border border-orange-200 animate-in fade-in duration-200">
                  <label className="text-xs font-bold text-orange-900 flex items-center gap-1.5">
                    <Store size={14} className="text-orange-600" />
                    Target Vendor Select Karein: <span className="text-red-500">*</span>
                  </label>
                  {vendors.length === 0 ? (
                    <p className="text-xs text-orange-700 italic">Koi vendor available nahi mila. Kripya pehle vendor banayein.</p>
                  ) : (
                    <select
                      value={ownershipModal.vendorId}
                      onChange={(e) => setOwnershipModal(prev => ({ ...prev, vendorId: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg border border-orange-300 bg-white text-gray-900 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-500 outline-none shadow-sm font-medium"
                      required
                    >
                      <option value="">-- Vendor Select Karein --</option>
                      {vendors.map(v => (
                        <option key={v._id} value={v._id}>
                          {v.companyName || v.name} ({v.assignedArea || 'All Areas'}) — Comm: {v.commissionPercentage || 25}%
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOwnershipModal({ isOpen: false, driver: null, targetType: "Direct", vendorId: "", submitting: false })}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ownershipModal.submitting}
                  className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {ownershipModal.submitting && <FaSyncAlt className="animate-spin" size={12} />}
                  <span>{ownershipModal.submitting ? "Updating..." : "Confirm & Transfer"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}