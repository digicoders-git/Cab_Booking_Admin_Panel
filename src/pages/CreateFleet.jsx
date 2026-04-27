import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { createFleet, getFleets, updateFleet, deleteFleet, toggleFleetStatus } from "../apis/fleet";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
  AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Scatter, ScatterChart,
  Treemap,
  RadialBarChart, RadialBar,
  FunnelChart, Funnel
} from 'recharts';
import {
  Plus, X, Eye, Trash2, RefreshCw, Edit, ToggleLeft, ToggleRight,
  Search, Truck, Users, Wallet, Briefcase, MapPin, FileText,
  ChevronLeft, ChevronRight, Download, Filter, TrendingUp,
  DollarSign, CreditCard, Building, Phone, Mail, Map,
  Star, Award, Activity, PieChart as PieChartIcon, BarChart3,
  LineChart as LineChartIcon, TrendingDown, Percent, Target,
  Gauge, Zap, Shield, Clock, Calendar, Globe, User,
  Settings, MoreVertical, DownloadCloud, Printer, Camera
} from 'lucide-react';;
import Swal from "sweetalert2";

const emptyForm = {
  name: "", email: "", phone: "", password: "", companyName: "",
  address: "", city: "", state: "", pincode: "", gstNumber: "", panNumber: "",
  commissionPercentage: "", accountNumber: "", ifscCode: "",
  accountHolderName: "", bankName: "",
};

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
  rose: '#F43F5E'
};

// Helper Components
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

export default function CreateFleet() {
  const { themeColors, theme } = useTheme();
  const { admin } = useAuth();
  const { currentFont } = useFont();

  // Helper for Granular Permissions
  const can = (permission) => {
    if (admin?.role === 'SuperAdmin') return true;
    return admin?.permissions?.includes(permission);
  };

  const IMAGE_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') + '/uploads/';

  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [gstCertificate, setGstCertificate] = useState(null);
  const [panCard, setPanCard] = useState(null);
  const [businessLicense, setBusinessLicense] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fleets, setFleets] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [viewing, setViewing] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingFleet, setEditingFleet] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState('month');
  const [selectedChart, setSelectedChart] = useState('all');
  const [expandedRows, setExpandedRows] = useState({});
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { fetchFleets(); }, []);

  const fetchFleets = async () => {
    try {
      setFetching(true);
      const res = await getFleets();
      const fetchedFleets = res.fleets || [];
      const sorted = [...fetchedFleets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setFleets(sorted);
    } catch { setFleets([]); }
    finally { setFetching(false); }
  };

  const filteredFleets = useMemo(() => {
    return fleets.filter(f =>
      f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [fleets, searchQuery]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, rowsPerPage]);

  const paginatedFleets = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredFleets.slice(start, start + rowsPerPage);
  }, [filteredFleets, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredFleets.length / rowsPerPage);

  // Advanced Statistics
  const stats = useMemo(() => {
    const total = fleets.length;
    const active = fleets.filter(f => f.isActive).length;
    const totalCars = fleets.reduce((sum, f) => sum + (f.totalCars || 0), 0);
    const totalEarnings = fleets.reduce((sum, f) => sum + (f.totalEarnings || 0), 0);
    const totalDrivers = fleets.reduce((sum, f) => sum + (f.totalDrivers || 0), 0);
    const avgCommission = fleets.reduce((sum, f) => sum + (f.commissionPercentage || 0), 0) / (total || 1);
    const totalWallet = fleets.reduce((sum, f) => sum + (f.walletBalance || 0), 0);
    const activeRate = total > 0 ? (active / total * 100) : 0;
    const growth = total > 0 ? ((active - (fleets.filter(f => !f.isActive).length)) / total * 100).toFixed(1) : "0.0";

    return {
      total, active, totalCars, totalEarnings, totalDrivers, avgCommission, totalWallet, growth, activeRate
    };
  }, [fleets]);

  // Chart 1: Fleet Status Distribution - Pie Chart
  const statusData = [
    { name: 'Active Fleets', value: stats.active, color: CHART_COLORS.green },
    { name: 'Inactive Fleets', value: stats.total - stats.active, color: CHART_COLORS.red }
  ];

  // Chart 2: Performance Metrics - Bar Chart
  const performanceData = [
    { name: 'Total Cars', value: stats.totalCars, color: CHART_COLORS.blue },
    { name: 'Total Drivers', value: stats.totalDrivers, color: CHART_COLORS.purple },
    { name: 'Active Fleets', value: stats.active, color: CHART_COLORS.green },
    { name: 'Total Fleets', value: stats.total, color: CHART_COLORS.orange }
  ];

  // Chart 3: Earnings Trend - Line Chart
  const earningsTrendData = fleets.slice(0, 7).map((f, i) => ({
    name: f.companyName?.substring(0, 8) || `Fleet ${i + 1}`,
    earnings: f.totalEarnings || 0,
    cars: f.totalCars || 0,
    drivers: f.totalDrivers || 0
  }));

  // Chart 4: Commission Distribution - Area Chart
  const commissionData = fleets.slice(0, 8).map((f, i) => ({
    name: f.companyName?.substring(0, 8) || `Fleet ${i + 1}`,
    commission: f.commissionPercentage || 0,
    earnings: (f.totalEarnings || 0) / 100
  }));

  // Chart 5: Wallet Balance - Radar Chart
  const walletData = [
    { metric: 'Total Wallet', value: stats.totalWallet / 100, fullMark: 1000 },
    { metric: 'Avg Commission', value: stats.avgCommission, fullMark: 50 },
    { metric: 'Active Rate', value: (stats.active / stats.total) * 100, fullMark: 100 },
    { metric: 'Cars per Fleet', value: stats.totalCars / stats.total, fullMark: 20 },
    { metric: 'Drivers per Fleet', value: stats.totalDrivers / stats.total, fullMark: 20 }
  ];

  // Chart 6: Growth Metrics - real monthly data from createdAt
  const growthMetricsData = useMemo(() => {
    const monthMap = {};
    fleets.forEach(f => {
      const d = new Date(f.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!monthMap[key]) monthMap[key] = { month: label, fleets: 0, earnings: 0 };
      monthMap[key].fleets += 1;
      monthMap[key].earnings += f.totalEarnings || 0;
    });
    return Object.keys(monthMap).sort().map(k => monthMap[k]);
  }, [fleets]);

  // Chart 7: Top Performers - Funnel Chart
  const topPerformers = fleets
    .sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0))
    .slice(0, 5)
    .map((f, i) => ({
      value: f.totalEarnings || 0,
      name: f.companyName || f.name,
      fill: CHART_COLORS[Object.keys(CHART_COLORS)[i % Object.keys(CHART_COLORS).length]]
    }));

  // Chart 8: Category Distribution - Treemap
  const cityDistribution = fleets.reduce((acc, f) => {
    const city = f.city || 'Unknown';
    const existing = acc.find(item => item.name === city);
    if (existing) {
      existing.size += 1;
    } else {
      acc.push({ name: city, size: 1 });
    }
    return acc;
  }, []);

  // Chart 9: Radial Progress
  const radialData = [
    { name: 'Active Rate', value: stats.activeRate, fill: CHART_COLORS.green },
    { name: 'Completion', value: stats.total > 0 ? (stats.totalCars / (stats.total * 10)) * 100 : 0, fill: CHART_COLORS.blue },
    { name: 'Growth', value: parseFloat(stats.growth) || 0, fill: CHART_COLORS.purple }
  ];

  // Chart 10: Scatter Plot - Earnings vs Cars
  const scatterData = fleets.map((f, i) => ({
    x: f.totalCars || 0,
    y: f.totalEarnings || 0,
    z: f.totalDrivers || 0,
    name: f.companyName || f.name
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    // Clear error on change
    if (formErrors[name]) setFormErrors(p => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const errors = {};
    const trim = (v) => (v || "").toString().trim();

    if (!trim(form.name)) errors.name = "Full name is required";

    if (!trim(form.email)) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trim(form.email))) errors.email = "Enter valid email (e.g. abc@gmail.com)";

    if (!trim(form.phone)) errors.phone = "Phone is required";
    else if (!/^\d{10}$/.test(trim(form.phone))) errors.phone = "Phone must be exactly 10 digits";

    if (!editingId) {
      if (!trim(form.password)) errors.password = "Password is required";
      else if (trim(form.password).length < 6) errors.password = "Password must be at least 6 characters";
    }

    if (!trim(form.companyName)) errors.companyName = "Company name is required";

    if (!trim(form.commissionPercentage)) errors.commissionPercentage = "Commission % is required";
    else {
      const c = Number(form.commissionPercentage);
      if (isNaN(c) || c < 0 || c > 100) errors.commissionPercentage = "Commission must be between 0 and 100";
    }

    if (trim(form.gstNumber) && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(trim(form.gstNumber).toUpperCase()))
      errors.gstNumber = "Invalid GST format (e.g. 22AAAAA0000A1Z5)";

    if (trim(form.panNumber) && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(trim(form.panNumber).toUpperCase()))
      errors.panNumber = "Invalid PAN format (e.g. ABCDE1234F)";

    if (!trim(form.address)) errors.address = "Address is required";
    if (!trim(form.city)) errors.city = "City is required";
    if (!trim(form.state)) errors.state = "State is required";

    if (!trim(form.pincode)) errors.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(trim(form.pincode))) errors.pincode = "Pincode must be exactly 6 digits";

    if (!trim(form.accountHolderName)) errors.accountHolderName = "Account holder name is required";

    if (!trim(form.accountNumber)) errors.accountNumber = "Account number is required";
    else if (!/^\d{9,18}$/.test(trim(form.accountNumber))) errors.accountNumber = "Account number must be 9-18 digits";

    if (!trim(form.bankName)) errors.bankName = "Bank name is required";

    if (!trim(form.ifscCode)) errors.ifscCode = "IFSC code is required";
    else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(trim(form.ifscCode).toUpperCase())) errors.ifscCode = "Invalid IFSC (e.g. SBIN0001234)";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const trim = (v) => (v || "").toString().trim();
    const comm = Number(form.commissionPercentage);

    try {
      setLoading(true);

      const cleanForm = { ...form };
      cleanForm.commissionPercentage = comm;
      cleanForm.ifscCode = trim(form.ifscCode).toUpperCase();

      if (!cleanForm.password) delete cleanForm.password;

      // Always use FormData because we have potential multi-files now
      const payload = new FormData();
      Object.entries(cleanForm).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") payload.append(k, v);
      });

      if (image) payload.append("image", image);
      if (gstCertificate) payload.append("gstCertificate", gstCertificate);
      if (panCard) payload.append("panCard", panCard);
      if (businessLicense) payload.append("businessLicense", businessLicense);

      if (editingId) {
        await updateFleet(editingId, payload);
        Swal.fire({ icon: "success", title: "✅ Fleet Updated!", text: "Fleet details have been updated successfully.", background: themeColors.surface, color: themeColors.text, timer: 2000, showConfirmButton: false });
      } else {
        await createFleet(payload);
        Swal.fire({ icon: "success", title: "🎉 Fleet Created!", text: "New fleet has been registered successfully.", background: themeColors.surface, color: themeColors.text, timer: 2000, showConfirmButton: false });
      }

      closeModal();
      fetchFleets();
    } catch (err) {
      const respData = err?.response?.data;
      const displayMsg = respData?.message === "Server error" && respData?.error
        ? `Server error: ${respData.error}`
        : (respData?.message || "Operation failed. Please try again.");

      Swal.fire({
        icon: "error",
        title: "❌ Error",
        text: displayMsg,
        background: themeColors.surface,
        color: themeColors.text,
        confirmButtonColor: "#EF4444"
      });
    } finally { setLoading(false); }
  };

  const handleEdit = (f) => {
    setEditingId(f._id);
    setEditingFleet(f);
    setForm({
      name: f.name || "", email: f.email || "", phone: f.phone || "", password: "",
      companyName: f.companyName || "", address: f.address || "", city: f.city || "",
      state: f.state || "", pincode: f.pincode || "", gstNumber: f.gstNumber || "",
      panNumber: f.panNumber || "", commissionPercentage: f.commissionPercentage || "",
      accountNumber: f.bankDetails?.accountNumber || "", ifscCode: f.bankDetails?.ifscCode || "",
      accountHolderName: f.bankDetails?.accountHolderName || "", bankName: f.bankDetails?.bankName || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (f) => {
    const res = await Swal.fire({
      title: "Confirm Delete", text: `Remove ${f.name}?`, icon: "warning",
      showCancelButton: true, confirmButtonColor: themeColors.danger,
      confirmButtonText: "Yes, Delete", background: themeColors.surface, color: themeColors.text
    });
    if (res.isConfirmed) {
      try {
        await deleteFleet(f._id);
        fetchFleets();
      } catch (err) {
        Swal.fire({ icon: "error", title: "Error", text: "Failed to delete", background: themeColors.surface, color: themeColors.text });
      }
    }
  };

  const handleToggleStatus = async (f) => {
    try {
      const res = await toggleFleetStatus(f._id);
      Swal.fire({
        icon: "success",
        title: res.message || "Status Updated",
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        background: themeColors.surface,
        color: themeColors.text
      });
      fetchFleets();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to toggle status", background: themeColors.surface, color: themeColors.text });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setEditingFleet(null);
    setForm(emptyForm);
    setFormErrors({});
    setImage(null);
    setGstCertificate(null);
    setPanCard(null);
    setBusinessLicense(null);
  };

  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className=" z-50">
        <div className="px-4 sm:px-8 pt-4 pb-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-lg p-4 sm:text-3xl font-bold text-gray-900">Fleet Command Center</h1>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Refresh */}
              <button
                onClick={fetchFleets}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw size={18} className={fetching ? 'animate-spin' : ''} />
              </button>

              {/* Add New */}
              {can('FLEET_CREATE') && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center space-x-1 sm:space-x-2 shadow-lg"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">New Fleet</span>
                  <span className="sm:hidden text-xs">New</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-5 gap-4">
              <input
                type="text"
                placeholder="Search fleets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg col-span-2"
              />
              <select className="px-3 py-2 border border-gray-300 rounded-lg">
                <option>All Status</option>
                <option>Active Only</option>
                <option>Inactive Only</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded-lg">
                <option>All Cities</option>
                <option>Mumbai</option>
                <option>Delhi</option>
                <option>Bangalore</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded-lg">
                <option>Sort By</option>
                <option>Highest Earnings</option>
                <option>Most Cars</option>
                <option>Highest Commission</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-8 py-6">
        {/* Stats Cards */}
        {fetching ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                  <div className="w-10 h-5 bg-gray-200 rounded-full" />
                </div>
                <div className="h-7 bg-gray-300 rounded w-16 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-24 mb-1" />
                <div className="h-2 bg-gray-100 rounded w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
            <StatCard icon={Truck} label="Total Fleets" value={stats.total} color="blue" trend={12} subtitle="All registered fleets" />
            <StatCard icon={Users} label="Active Fleets" value={stats.active} color="green" trend={8} subtitle={`${((stats.active / stats.total) * 100).toFixed(1)}% active rate`} />
            <StatCard icon={Award} label="Total Cars" value={stats.totalCars} color="purple" trend={15} subtitle={`Avg ${(stats.totalCars / stats.total).toFixed(1)} per fleet`} />
            <StatCard icon={Users} label="Total Drivers" value={stats.totalDrivers} color="indigo" trend={10} subtitle={`${stats.totalDrivers} active drivers`} />
            <StatCard icon={DollarSign} label="Total Earnings" value={`₹${(stats.totalEarnings / 1000).toFixed(1)}K`} color="orange" trend={25} subtitle="Lifetime revenue" />
            <StatCard icon={Wallet} label="Wallet Balance" value={`₹${(stats.totalWallet / 1000).toFixed(1)}K`} color="pink" trend={-5} subtitle="Available balance" />
          </div>
        )}

        <div className="bg-white rounded-xl mb-15 shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Fleet Directory</h3>
              <p className="text-sm text-gray-500">Manage your fleet partners</p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
              {filteredFleets.length} Records
            </span>
          </div>

          {fetching ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Fleet', 'Contact', 'Password', 'Location', 'Cars', 'Drivers', 'Earnings', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="py-4 px-6 text-left">
                        <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {/* Fleet */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                          <div className="space-y-1.5">
                            <div className="h-3 bg-gray-200 rounded w-24" />
                            <div className="h-2 bg-gray-100 rounded w-16" />
                          </div>
                        </div>
                      </td>
                      {/* Contact */}
                      <td className="py-4 px-6">
                        <div className="space-y-1.5">
                          <div className="h-3 bg-gray-200 rounded w-20" />
                          <div className="h-2 bg-gray-100 rounded w-28" />
                        </div>
                      </td>
                      {/* Password */}
                      <td className="py-4 px-6">
                        <div className="h-6 bg-gray-100 rounded w-16" />
                      </td>
                      {/* Location */}
                      <td className="py-4 px-6">
                        <div className="space-y-1.5">
                          <div className="h-3 bg-gray-200 rounded w-16" />
                          <div className="h-2 bg-gray-100 rounded w-12" />
                        </div>
                      </td>
                      {/* Cars */}
                      <td className="py-4 px-6 text-center">
                        <div className="h-6 bg-gray-100 rounded-full w-10 mx-auto" />
                      </td>
                      {/* Drivers */}
                      <td className="py-4 px-6 text-center">
                        <div className="h-6 bg-gray-100 rounded-full w-10 mx-auto" />
                      </td>
                      {/* Earnings */}
                      <td className="py-4 px-6 text-right">
                        <div className="h-3 bg-gray-200 rounded w-16 ml-auto" />
                      </td>
                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        <div className="h-6 bg-gray-100 rounded-full w-14 mx-auto" />
                      </td>
                      {/* Actions */}
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-7 h-7 bg-gray-100 rounded-lg" />
                          <div className="w-7 h-7 bg-gray-100 rounded-lg" />
                          <div className="w-7 h-7 bg-gray-100 rounded-lg" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : filteredFleets.length === 0 ? (
            <div className="py-20 text-center">
              <Truck size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No fleets found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Fleet</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Password</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase">Cars</th>
                      <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase">Drivers</th>
                      <th className="text-right py-4 px-6 text-xs font-medium text-gray-500 uppercase">Earnings</th>
                      <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedFleets.map((f) => (
                      <React.Fragment key={f._id}>
                        <tr
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => toggleRowExpansion(f._id)}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden border border-gray-200">
                                {f.image ? (
                                  <img src={`${IMAGE_BASE_URL}${f.image}`} alt={f.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Truck size={18} className="text-blue-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{f.name}</p>
                                <p className="text-xs text-gray-500">{f.companyName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-sm text-gray-900">{f.phone}</p>
                            <p className="text-xs text-gray-500">{f.email}</p>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded">{f.password || '—'}</span>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-sm text-gray-900">{f.city}</p>
                            <p className="text-xs text-gray-500">{f.state}</p>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              {f.totalCars || 0}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              {f.totalDrivers || 0}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className="font-medium text-gray-900">₹{(f.totalEarnings || 0).toLocaleString()}</span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {can('FLEET_STATUS') ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleStatus(f); }}
                                className={`px-3 py-1 rounded-full text-xs font-medium ${f.isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-500'
                                  }`}
                              >
                                {f.isActive ? 'Active' : 'Inactive'}
                              </button>
                            ) : (
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${f.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                                {f.isActive ? 'Active' : 'Inactive'}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {can('FLEET_READ') && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setViewing(f); }}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="View Details"
                                >
                                  <Eye size={16} className="text-blue-600" />
                                </button>
                              )}
                              {can('FLEET_EDIT') && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEdit(f); }}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit size={16} className="text-orange-600" />
                                </button>
                              )}
                              {can('FLEET_DELETE') && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(f); }}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={16} className="text-red-600" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedRows[f._id] && (
                          <tr className="bg-gray-50">
                            <td colSpan="8" className="p-6">
                              <div className="grid grid-cols-3 gap-6">
                                <div>
                                  <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase">Business Details</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-xs text-gray-500">GST:</span>
                                      <span className="text-xs font-medium text-gray-900">{f.gstNumber || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs text-gray-500">PAN:</span>
                                      <span className="text-xs font-medium text-gray-900">{f.panNumber || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs text-gray-500">Commission:</span>
                                      <span className="text-xs font-medium text-orange-600">{f.commissionPercentage}%</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase">Bank Details</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-xs text-gray-500">Bank:</span>
                                      <span className="text-xs font-medium text-gray-900">{f.bankDetails?.bankName || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs text-gray-500">Account:</span>
                                      <span className="text-xs font-medium text-gray-900">****{f.bankDetails?.accountNumber?.slice(-4) || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs text-gray-500">IFSC:</span>
                                      <span className="text-xs font-medium text-gray-900">{f.bankDetails?.ifscCode || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase">Financial Stats</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-xs text-gray-500">Wallet:</span>
                                      <span className={`text-xs font-medium ${f.walletBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        ₹{f.walletBalance?.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs text-gray-500">Joined:</span>
                                      <span className="text-xs font-medium text-gray-900">{new Date(f.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs text-gray-500">Created By:</span>
                                      <span className="text-xs font-medium text-gray-900">{f.createdBy?.name || 'System'}</span>
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
                    Showing {filteredFleets.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filteredFleets.length)} of {filteredFleets.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <span className="text-sm text-gray-500">Page {currentPage} of {totalPages || 1}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Chart Selector */}
        {!fetching && (
        <div className="mb-6 flex flex-wrap gap-2">
          {['all', 'distribution', 'performance', 'earnings', 'commission', 'growth'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedChart(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedChart === type
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)} Charts
            </button>
          ))}
        </div>
        )}

        {/* Charts Grid */}
        {fetching ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="flex items-center justify-between mb-6">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-36" />
                    <div className="h-3 bg-gray-100 rounded w-24" />
                  </div>
                  <div className="w-9 h-9 bg-gray-200 rounded-lg" />
                </div>
                <div className="h-[300px] bg-gray-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Chart 1: Fleet Status Distribution */}
          {(selectedChart === 'all' || selectedChart === 'distribution') && (
            <ChartCard title="Fleet Status Distribution" subtitle="Active vs Inactive fleets" icon={PieChartIcon}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
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
              <div className="flex justify-center gap-6 mt-4">
                {statusData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}

          {/* Chart 2: Performance Metrics */}
          {(selectedChart === 'all' || selectedChart === 'performance') && (
            <ChartCard title="Performance Metrics" subtitle="Key fleet indicators" icon={BarChart3}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 3: Earnings Trend */}
          {(selectedChart === 'all' || selectedChart === 'earnings') && (
            <ChartCard title="Earnings Trend" subtitle="Top fleets by revenue" icon={TrendingUp}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={earningsTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="earnings" stroke={CHART_COLORS.blue} strokeWidth={2} name="Earnings" />
                  <Line type="monotone" dataKey="cars" stroke={CHART_COLORS.green} strokeWidth={2} name="Cars" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 4: Commission Distribution */}
          {(selectedChart === 'all' || selectedChart === 'commission') && (
            <ChartCard title="Commission Analysis" subtitle="Commission percentage by fleet" icon={Percent}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={commissionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="commission" stroke={CHART_COLORS.purple} fill={CHART_COLORS.purple} fillOpacity={0.2} name="Commission %" />
                  <Area type="monotone" dataKey="earnings" stroke={CHART_COLORS.orange} fill={CHART_COLORS.orange} fillOpacity={0.2} name="Earnings (00s)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 5: Wallet Radar */}
          {(selectedChart === 'all' || selectedChart === 'growth') && (
            <ChartCard title="Fleet Health Radar" subtitle="Multi-metric analysis" icon={Gauge}>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart outerRadius={90} data={walletData}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={30} />
                  <Radar name="Health" dataKey="value" stroke={CHART_COLORS.purple} fill={CHART_COLORS.purple} fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 6: Growth Metrics */}
          {(selectedChart === 'all' || selectedChart === 'growth') && (
            <ChartCard title="Growth Metrics" subtitle="Monthly progression" icon={Target}>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={growthMetricsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="fleets" fill={CHART_COLORS.blue} name="Fleets" />
                  <Line yAxisId="right" type="monotone" dataKey="earnings" stroke={CHART_COLORS.orange} name="Earnings" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 7: Top Performers Funnel */}
          {(selectedChart === 'all' || selectedChart === 'performance') && (
            <ChartCard title="Top Performers" subtitle="Highest earning fleets" icon={Zap}>
              <ResponsiveContainer width="100%" height={300}>
                <FunnelChart>
                  <Tooltip />
                  <Funnel dataKey="value" data={topPerformers} isAnimationActive>
                    {topPerformers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 8: City Distribution Treemap */}
          {(selectedChart === 'all' || selectedChart === 'distribution') && (
            <ChartCard title="City Distribution" subtitle="Fleets by location" icon={Globe}>
              <ResponsiveContainer width="100%" height={300}>
                <Treemap
                  data={cityDistribution}
                  dataKey="size"
                  ratio={4 / 3}
                  stroke="#fff"
                  fill={CHART_COLORS.blue}
                >
                  {cityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[Object.keys(CHART_COLORS)[index % Object.keys(CHART_COLORS).length]]} />
                  ))}
                </Treemap>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 9: Radial Progress */}
          {(selectedChart === 'all' || selectedChart === 'performance') && (
            <ChartCard title="Progress Indicators" subtitle="Key metrics progress" icon={Activity}>
              <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" barSize={20} data={radialData}>
                  <RadialBar
                    minAngle={15}
                    label={{ position: 'insideStart', fill: '#fff', fontSize: 12 }}
                    background
                    dataKey="value"
                  />
                  <Legend />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 10: Earnings vs Cars Scatter */}
          {(selectedChart === 'all' || selectedChart === 'earnings') && (
            <ChartCard title="Earnings vs Cars" subtitle="Correlation analysis" icon={Target}>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" dataKey="x" name="Cars" />
                  <YAxis type="number" dataKey="y" name="Earnings" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Fleets" data={scatterData} fill={CHART_COLORS.blue} shape="circle" />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
        )}

        {/* Fleet Table - Only Important Columns */}

      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
          onClick={() => setLightboxImg(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            onClick={() => setLightboxImg(null)}
          >
            <X size={20} className="text-white" />
          </button>
          <img
            src={lightboxImg}
            alt="preview"
            className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* View Modal */}
      {viewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden border border-gray-200 cursor-pointer"
                  onClick={() => viewing.image && setLightboxImg(`${IMAGE_BASE_URL}${viewing.image}`)}
                >
                  {viewing.image ? (
                    <img src={`${IMAGE_BASE_URL}${viewing.image}`} alt={viewing.name} className="w-full h-full object-cover" />
                  ) : (
                    <Truck size={24} className="text-blue-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{viewing.name}</h2>
                  <p className="text-sm text-gray-500">{viewing.companyName}</p>
                </div>
              </div>
              <button onClick={() => setViewing(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Total Cars</p>
                  <p className="text-2xl font-bold text-blue-600">{viewing.totalCars || 0}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Total Drivers</p>
                  <p className="text-2xl font-bold text-purple-600">{viewing.totalDrivers || 0}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Wallet Balance</p>
                  <p className="text-2xl font-bold text-green-600">₹{viewing.walletBalance || 0}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Total Earnings</p>
                  <p className="text-2xl font-bold text-orange-600">₹{viewing.totalEarnings || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                {/* Personal Details */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <User size={16} className="text-blue-600" />
                    Personal Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Email</span>
                      <span className="text-sm font-medium text-gray-900">{viewing.email}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Phone</span>
                      <span className="text-sm font-medium text-gray-900">{viewing.phone}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Address</span>
                      <span className="text-sm font-medium text-gray-900">{viewing.address}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">City/State</span>
                      <span className="text-sm font-medium text-gray-900">{viewing.city}, {viewing.state}</span>
                    </div>
                  </div>
                </div>

                {/* Business Details */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase size={16} className="text-purple-600" />
                    Business Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">GST Number</span>
                      <span className="text-sm font-medium text-gray-900">{viewing.gstNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">PAN Number</span>
                      <span className="text-sm font-medium text-gray-900">{viewing.panNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Commission</span>
                      <span className="text-sm font-medium text-orange-600">{viewing.commissionPercentage}%</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Status</span>
                      <span className={`text-sm font-medium ${viewing.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                        {viewing.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard size={16} className="text-green-600" />
                    Bank Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Account Holder</p>
                      <p className="text-sm font-medium text-gray-900">{viewing.bankDetails?.accountHolderName || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Bank Name</p>
                      <p className="text-sm font-medium text-gray-900">{viewing.bankDetails?.bankName || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Account Number</p>
                      <p className="text-sm font-medium text-gray-900">{viewing.bankDetails?.accountNumber || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">IFSC Code</p>
                      <p className="text-sm font-medium text-gray-900">{viewing.bankDetails?.ifscCode || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Business Documents (View) */}
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <FileText size={16} className="text-red-500" />
                    Business Documents
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {['gstCertificate', 'panCard', 'businessLicense'].map(docKey => (
                      <div key={docKey} className="p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">
                          {docKey.replace(/([A-Z])/g, ' $1')}
                        </p>
                        {viewing.documents?.[docKey] ? (
                          <div className="group relative rounded-lg overflow-hidden border border-gray-200 bg-white aspect-video">
                            <img
                              src={`${IMAGE_BASE_URL}${viewing.documents[docKey]}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform cursor-zoom-in"
                              onClick={() => setLightboxImg(`${IMAGE_BASE_URL}${viewing.documents[docKey]}`)}
                              alt={docKey}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                              <Eye size={20} className="text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg bg-white">
                            <X size={16} className="text-gray-300 mb-1" />
                            <span className="text-[10px] text-gray-400">No Document</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setViewing(null)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setViewing(null);
                  handleEdit(viewing);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit Fleet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <Truck size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{editingId ? 'Edit Fleet' : 'Register New Fleet'}</h2>
                  <p className="text-xs text-blue-100">{editingId ? 'Update fleet information' : 'Fill in the details to onboard a new fleet'}</p>
                </div>
              </div>
              <button onClick={closeModal} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors">
                <X size={16} className="text-white" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="fleet-modal-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-8 py-6 space-y-7">

              {/* Section: Basic Info */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User size={13} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Basic Information</span>
                  <div className="flex-1 h-px bg-gray-100 ml-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[{label:'Full Name',name:'name',type:'text'},{label:'Email',name:'email',type:'email'},{label:'Phone',name:'phone',type:'text'},{label:`Password${!editingId?' *':''}`,name:'password',type:'password'}].map(({label,name,type}) => (
                    <div key={name} className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500">{label}</label>
                      <input
                        type={type}
                        name={name}
                        value={form[name]}
                        onChange={handleChange}
                        required={name !== 'password' || !editingId}
                        placeholder={`Enter ${label.replace(' *','').toLowerCase()}`}
                        className={`w-full h-11 px-4 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm transition-all ${formErrors[name] ? 'border-red-400 focus:ring-red-400/30' : 'border-gray-200 focus:border-blue-400'}`}
                      />
                      {formErrors[name] && <p className="text-xs text-red-500 mt-1">{formErrors[name]}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Company */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Briefcase size={13} className="text-purple-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Company Details</span>
                  <div className="flex-1 h-px bg-gray-100 ml-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[{label:'Company Name *',name:'companyName',type:'text'},{label:'Commission % *',name:'commissionPercentage',type:'number'},{label:'GST Number',name:'gstNumber',type:'text'},{label:'PAN Number',name:'panNumber',type:'text'}].map(({label,name,type}) => (
                    <div key={name} className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500">{label}</label>
                      <input
                        type={type}
                        name={name}
                        value={form[name]}
                        onChange={handleChange}
                        required={label.includes('*')}
                        placeholder={`Enter ${label.replace(' *','').toLowerCase()}`}
                        className={`w-full h-11 px-4 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm transition-all ${formErrors[name] ? 'border-red-400 focus:ring-red-400/30' : 'border-gray-200 focus:border-purple-400'}`}
                      />
                      {formErrors[name] && <p className="text-xs text-red-500 mt-1">{formErrors[name]}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Address */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                    <MapPin size={13} className="text-green-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Address</span>
                  <div className="flex-1 h-px bg-gray-100 ml-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Address *</label>
                    <input type="text" name="address" value={form.address} onChange={handleChange} required placeholder="Enter full address" className={`w-full h-11 px-4 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 text-sm transition-all ${formErrors.address ? 'border-red-400 focus:ring-red-400/30' : 'border-gray-200 focus:border-green-400 focus:ring-green-500/30'}`} />
                    {formErrors.address && <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>}
                  </div>
                  {[{label:'City *',name:'city'},{label:'State *',name:'state'},{label:'Pincode *',name:'pincode'}].map(({label,name}) => (
                    <div key={name} className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500">{label}</label>
                      <input type="text" name={name} value={form[name]} onChange={handleChange} required placeholder={`Enter ${name}`} className={`w-full h-11 px-4 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 text-sm transition-all ${formErrors[name] ? 'border-red-400 focus:ring-red-400/30' : 'border-gray-200 focus:border-green-400 focus:ring-green-500/30'}`} />
                      {formErrors[name] && <p className="text-xs text-red-500 mt-1">{formErrors[name]}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Bank */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                    <CreditCard size={13} className="text-orange-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Bank Details</span>
                  <div className="flex-1 h-px bg-gray-100 ml-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[{label:'Account Holder Name *',name:'accountHolderName'},{label:'Account Number *',name:'accountNumber'},{label:'Bank Name *',name:'bankName'},{label:'IFSC Code *',name:'ifscCode'}].map(({label,name}) => (
                    <div key={name} className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500">{label}</label>
                      <input type="text" name={name} value={form[name]} onChange={handleChange} required placeholder={`Enter ${label.replace(' *','').toLowerCase()}`} className={`w-full h-11 px-4 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 text-sm transition-all ${formErrors[name] ? 'border-red-400 focus:ring-red-400/30' : 'border-gray-200 focus:border-orange-400 focus:ring-orange-500/30'}`} />
                      {formErrors[name] && <p className="text-xs text-red-500 mt-1">{formErrors[name]}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Documents with Preview */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-rose-100 rounded-lg flex items-center justify-center">
                    <FileText size={13} className="text-rose-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Fleet Documents</span>
                  <div className="flex-1 h-px bg-gray-100 ml-2" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Profile Image', file: image, setter: setImage, accent: 'blue', existingUrl: editingFleet?.image ? `${IMAGE_BASE_URL}${editingFleet.image}` : null },
                    { label: 'GST Certificate', file: gstCertificate, setter: setGstCertificate, accent: 'purple', existingUrl: editingFleet?.documents?.gstCertificate ? `${IMAGE_BASE_URL}${editingFleet.documents.gstCertificate}` : null },
                    { label: 'PAN Card', file: panCard, setter: setPanCard, accent: 'green', existingUrl: editingFleet?.documents?.panCard ? `${IMAGE_BASE_URL}${editingFleet.documents.panCard}` : null },
                    { label: 'Business License', file: businessLicense, setter: setBusinessLicense, accent: 'orange', existingUrl: editingFleet?.documents?.businessLicense ? `${IMAGE_BASE_URL}${editingFleet.documents.businessLicense}` : null },
                  ].map(({ label, file, setter, accent, existingUrl }) => {
                    const previewSrc = file ? URL.createObjectURL(file) : existingUrl;
                    return (
                      <div key={label} className="space-y-2">
                        <label className="text-xs font-medium text-gray-500">{label}</label>
                        <label className={`relative flex flex-col items-center justify-center w-full aspect-square rounded-2xl border-2 border-dashed cursor-pointer overflow-hidden transition-all group
                          ${previewSrc ? 'border-gray-300' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'}`}>
                          {previewSrc ? (
                            <>
                              <img src={previewSrc} alt={label} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                                <Camera size={18} className="text-white" />
                                <span className="text-white text-[10px] font-medium">Change</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-2 p-3 text-center">
                              <div className={`w-10 h-10 rounded-xl bg-${accent}-100 flex items-center justify-center`}>
                                <Camera size={18} className={`text-${accent}-500`} />
                              </div>
                              <span className="text-[10px] text-gray-400 leading-tight">Click to upload</span>
                            </div>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => setter(e.target.files[0])} />
                        </label>
                        {file ? (
                          <p className="text-[10px] text-gray-400 truncate text-center">📎 {file.name}</p>
                        ) : existingUrl ? (
                          <p className="text-[10px] text-green-500 truncate text-center">✓ Existing image</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

            </form>

            {/* Modal Footer */}
            <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-b-3xl">
              <p className="text-xs text-gray-400">Fields marked with <span className="text-red-400">*</span> are required</p>
              <div className="flex gap-3">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  form="fleet-modal-form"
                  disabled={loading}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 transition-all"
                >
                  {loading ? (
                    <span className="flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /> Processing...</span>
                  ) : editingId ? 'Update Fleet' : 'Create Fleet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}