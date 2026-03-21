import React, { useState, useEffect, useMemo } from "react";
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
  const { currentFont } = useFont();
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fleets, setFleets] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [viewing, setViewing] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState('month');
  const [selectedChart, setSelectedChart] = useState('all');
  const [expandedRows, setExpandedRows] = useState({});
  const rowsPerPage = 10;

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

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const paginatedFleets = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredFleets.slice(start, start + rowsPerPage);
  }, [filteredFleets, currentPage]);

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

  // Chart 6: Growth Metrics - Composed Chart
  const growthMetricsData = [
    { month: 'Jan', fleets: Math.round(stats.total * 0.6), earnings: stats.totalEarnings * 0.1 },
    { month: 'Feb', fleets: Math.round(stats.total * 0.7), earnings: stats.totalEarnings * 0.15 },
    { month: 'Mar', fleets: Math.round(stats.total * 0.8), earnings: stats.totalEarnings * 0.2 },
    { month: 'Apr', fleets: Math.round(stats.total * 0.9), earnings: stats.totalEarnings * 0.25 },
    { month: 'May', fleets: stats.total, earnings: stats.totalEarnings * 0.3 }
  ];

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

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ── Validation ──────────────────────────────────────────────
    const showError = (title, text) => Swal.fire({
      icon: "warning", title, text,
      background: themeColors.surface, color: themeColors.text,
      confirmButtonColor: "#3B82F6"
    });

    const trim = (v) => (v || "").toString().trim();

    if (!trim(form.name))
      return showError("Name Required", "Please enter the fleet owner's full name.");

    if (!trim(form.email))
      return showError("Email Required", "Please enter a valid email address.");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trim(form.email)))
      return showError("Invalid Email", "Please enter a properly formatted email (e.g. abc@gmail.com).");

    if (!trim(form.phone))
      return showError("Phone Required", "Please enter the fleet owner's phone number.");
    if (!/^\d{10}$/.test(trim(form.phone)))
      return showError("Invalid Phone", "Phone number must be exactly 10 digits with no spaces or special characters.");

    if (!editingId && !trim(form.password))
      return showError("Password Required", "Please enter a password for this fleet account.");
    if (!editingId && trim(form.password).length < 6)
      return showError("Weak Password", "Password must be at least 6 characters long.");

    if (!trim(form.companyName))
      return showError("Company Name Required", "Please enter the company / fleet name.");

    if (!trim(form.commissionPercentage))
      return showError("Commission Required", "Please enter the commission percentage.");
    const comm = Number(form.commissionPercentage);
    if (isNaN(comm) || comm < 0 || comm > 100)
      return showError("Invalid Commission", "Commission must be a number between 0 and 100.");

    if (!trim(form.address))
      return showError("Address Required", "Please enter the fleet's address.");

    if (!trim(form.city))
      return showError("City Required", "Please enter the city name.");

    if (!trim(form.state))
      return showError("State Required", "Please enter the state name.");

    if (!trim(form.pincode))
      return showError("Pincode Required", "Please enter the area pincode.");
    if (!/^\d{6}$/.test(trim(form.pincode)))
      return showError("Invalid Pincode", "Pincode must be exactly 6 digits.");

    if (!trim(form.accountHolderName))
      return showError("Account Holder Required", "Please enter the bank account holder name.");

    if (!trim(form.accountNumber))
      return showError("Account Number Required", "Please enter the bank account number.");
    if (!/^\d{9,18}$/.test(trim(form.accountNumber)))
      return showError("Invalid Account Number", "Account number must be 9 to 18 digits only.");

    if (!trim(form.bankName))
      return showError("Bank Name Required", "Please enter the bank name.");

    if (!trim(form.ifscCode))
      return showError("IFSC Code Required", "Please enter the bank's IFSC code.");
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(trim(form.ifscCode).toUpperCase()))
      return showError("Invalid IFSC Code", "IFSC code format should be like SBIN0001234 (4 letters, 0, then 6 alphanumeric).");
    // ── End Validation ──────────────────────────────────────────

    try {
      setLoading(true);

      const cleanForm = { ...form };
      cleanForm.commissionPercentage = comm;
      cleanForm.ifscCode = trim(form.ifscCode).toUpperCase();

      if (!cleanForm.password) delete cleanForm.password;

      let payload;
      if (image) {
        payload = new FormData();
        Object.entries(cleanForm).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") payload.append(k, v);
        });
        payload.append("image", image);
      } else {
        payload = cleanForm;
      }

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
    setForm(emptyForm);
    setImage(null);
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
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center space-x-1 sm:space-x-2 shadow-lg"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">New Fleet</span>
                <span className="sm:hidden text-xs">New</span>
              </button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
          <StatCard icon={Truck} label="Total Fleets" value={stats.total} color="blue" trend={12} subtitle="All registered fleets" />
          <StatCard icon={Users} label="Active Fleets" value={stats.active} color="green" trend={8} subtitle={`${((stats.active / stats.total) * 100).toFixed(1)}% active rate`} />
          <StatCard icon={Award} label="Total Cars" value={stats.totalCars} color="purple" trend={15} subtitle={`Avg ${(stats.totalCars / stats.total).toFixed(1)} per fleet`} />
          <StatCard icon={Users} label="Total Drivers" value={stats.totalDrivers} color="indigo" trend={10} subtitle={`${stats.totalDrivers} active drivers`} />
          <StatCard icon={DollarSign} label="Total Earnings" value={`₹${(stats.totalEarnings / 1000).toFixed(1)}K`} color="orange" trend={25} subtitle="Lifetime revenue" />
          <StatCard icon={Wallet} label="Wallet Balance" value={`₹${(stats.totalWallet / 1000).toFixed(1)}K`} color="pink" trend={-5} subtitle="Available balance" />
        </div>

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
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-sm text-gray-500">Loading fleet data...</p>
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
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                                {f.image ? (
                                  <img src={`http://localhost:5000/uploads/${f.image}`} alt={f.name} className="w-full h-full object-cover rounded-lg" />
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
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleStatus(f); }}
                              className={`px-3 py-1 rounded-full text-xs font-medium ${f.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                                }`}
                            >
                              {f.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); setViewing(f); }}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye size={16} className="text-blue-600" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEdit(f); }}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit size={16} className="text-orange-600" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(f); }}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={16} className="text-red-600" />
                              </button>
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
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredFleets.length)} of {filteredFleets.length} entries
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Chart Selector */}
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

        {/* Charts Grid */}
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

        {/* Fleet Table - Only Important Columns */}

      </div>

      {/* View Modal */}
      {viewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                  {viewing.image ? (
                    <img src={`http://localhost:5000/uploads/${viewing.image}`} alt={viewing.name} className="w-full h-full object-cover rounded-xl" />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Fleet' : 'Create New Fleet'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <User size={16} className="text-blue-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Phone *</label>
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Password {!editingId && '*'}</label>
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required={!editingId}
                      className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Company Details */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase size={16} className="text-purple-600" />
                  Company Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Company Name *</label>
                    <input
                      type="text"
                      name="companyName"
                      value={form.companyName}
                      onChange={handleChange}
                      required
                      className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Commission % *</label>
                    <input
                      type="number"
                      name="commissionPercentage"
                      value={form.commissionPercentage}
                      onChange={handleChange}
                      required
                      className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">GST Number</label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={form.gstNumber}
                      onChange={handleChange}
                      className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">PAN Number</label>
                    <input
                      type="text"
                      name="panNumber"
                      value={form.panNumber}
                      onChange={handleChange}
                      className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin size={16} className="text-green-600" />
                  Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Address *</label>
                    <input
                      type="text"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      required
                      className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      required
                      className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">State *</label>
                    <input
                      type="text"
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      required
                      className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Pincode *</label>
                    <input
                      type="text"
                      name="pincode"
                      value={form.pincode}
                      onChange={handleChange}
                      required
                      className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard size={16} className="text-orange-600" />
                  Bank Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Account Holder Name *</label>
                    <input
                      type="text"
                      name="accountHolderName"
                      value={form.accountHolderName}
                      onChange={handleChange}
                      required
                      className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Account Number *</label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={form.accountNumber}
                      onChange={handleChange}
                      required
                      className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Bank Name *</label>
                    <input
                      type="text"
                      name="bankName"
                      value={form.bankName}
                      onChange={handleChange}
                      required
                      className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">IFSC Code *</label>
                    <input
                      type="text"
                      name="ifscCode"
                      value={form.ifscCode}
                      onChange={handleChange}
                      required
                      className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Profile Image */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Camera size={16} className="text-pink-600" />
                  Profile Image
                </h3>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files[0])}
                    className="flex-1 p-2 border border-gray-300 rounded-lg"
                  />
                  {(image || (editingId && fleets.find(f => f._id === editingId)?.image)) && (
                    <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden">
                      <img
                        src={image ? URL.createObjectURL(image) : `http://localhost:5000/uploads/${fleets.find(f => f._id === editingId)?.image}`}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : editingId ? 'Update Fleet' : 'Create Fleet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}