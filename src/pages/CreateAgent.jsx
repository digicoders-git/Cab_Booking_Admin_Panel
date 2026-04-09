import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useFont } from "../context/FontContext";
import {
  createAgent, getAgents, updateAgent, deleteAgent, toggleAgentStatus
} from "../apis/agent";
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
  Search, User, Users, Wallet, Briefcase, MapPin, FileText,
  ChevronLeft, ChevronRight, Download, Filter, TrendingUp,
  DollarSign, CreditCard, Building, Phone, Mail, Map,
  Star, Award, Activity, PieChart as PieChartIcon, BarChart3,
  LineChart as LineChartIcon, TrendingDown, Percent, Target,
  Gauge, Zap, Shield, Clock, Calendar, Globe,
  MoreVertical, DownloadCloud, Printer, UserCheck, UserPlus, Camera
} from 'lucide-react';;
import Swal from "sweetalert2";

const emptyForm = {
  name: "", email: "", phone: "", password: "",
  address: "", city: "", state: "", pincode: "",
  commissionPercentage: "", aadhar: "", pan: "",
  accountNumber: "", ifscCode: "", accountHolderName: "", bankName: ""
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

export default function CreateAgent() {
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
  const [aadhar, setAadhar] = useState(null);
  const [pan, setPan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agents, setAgents] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [viewing, setViewing] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingAgent, setEditingAgent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState('month');
  const [selectedChart, setSelectedChart] = useState('all');
  const [expandedRows, setExpandedRows] = useState({});
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const textColorSecondary = useMemo(() => {
    if (theme === "dark") return "rgba(255, 255, 255, 0.6)";
    return themeColors.textSecondary || "rgba(107, 114, 128, 1)";
  }, [theme, themeColors]);

  const borderColor = useMemo(() => {
    return themeColors.border || (theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)");
  }, [theme, themeColors]);

  useEffect(() => { fetchAgents(); }, []);

  const fetchAgents = async () => {
    try {
      setFetching(true);
      const res = await getAgents();
      const fetchedAgents = res.agents || [];
      const sorted = [...fetchedAgents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAgents(sorted);
    } catch { setAgents([]); }
    finally { setFetching(false); }
  };

  const filteredAgents = useMemo(() => {
    return agents.filter(a =>
      a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.phone?.includes(searchQuery) ||
      a.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [agents, searchQuery]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, rowsPerPage]);

  const paginatedAgents = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredAgents.slice(start, start + rowsPerPage);
  }, [filteredAgents, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredAgents.length / rowsPerPage);

  // Advanced Statistics
  const stats = useMemo(() => {
    const total = agents.length;
    const active = agents.filter(a => a.isActive).length;
    const totalEarnings = agents.reduce((sum, a) => sum + (a.totalEarnings || 0), 0);
    const totalWallet = agents.reduce((sum, a) => sum + (a.totalWallet || 0), 0);
    const totalBookings = agents.reduce((sum, a) => sum + (a.totalBookings || 0), 0);
    const avgCommission = agents.reduce((sum, a) => sum + (a.commissionPercentage || 0), 0) / (total || 1);
    const activeRate = total > 0 ? (active / total * 100) : 0;
    const growth = total > 0 ? ((active - (agents.filter(a => !a.isActive).length)) / total * 100).toFixed(1) : "0.0";

    return {
      total, active, totalEarnings, totalWallet, totalBookings, avgCommission, growth, activeRate
    };
  }, [agents]);

  // Chart 1: Agent Status Distribution - Pie Chart
  const statusData = [
    { name: 'Active Agents', value: stats.active, color: CHART_COLORS.green },
    { name: 'Inactive Agents', value: stats.total - stats.active, color: CHART_COLORS.red }
  ];

  // Chart 2: Performance Metrics - Bar Chart
  const performanceData = [
    { name: 'Total Agents', value: stats.total, color: CHART_COLORS.blue },
    { name: 'Active Agents', value: stats.active, color: CHART_COLORS.green },
    { name: 'Total Bookings', value: stats.totalBookings, color: CHART_COLORS.purple }
  ];

  // Chart 3: Earnings Trend - Line Chart
  const earningsTrendData = agents.slice(0, 7).map((a, i) => ({
    name: a.name?.substring(0, 8) || `Agent ${i + 1}`,
    earnings: a.totalEarnings || 0,
    bookings: a.totalBookings || 0
  }));

  // Chart 4: Commission Distribution - Area Chart
  const commissionData = agents.slice(0, 8).map((a, i) => ({
    name: a.name?.substring(0, 8) || `Agent ${i + 1}`,
    commission: a.commissionPercentage || 0,
    earnings: (a.totalEarnings || 0) / 100
  }));

  // Chart 5: Wallet Balance - Radar Chart
  const walletData = [
    { metric: 'Total Wallet', value: stats.totalWallet / 100, fullMark: 1000 },
    { metric: 'Avg Commission', value: stats.avgCommission, fullMark: 50 },
    { metric: 'Active Rate', value: stats.activeRate, fullMark: 100 },
    { metric: 'Total Earnings', value: stats.totalEarnings / 1000, fullMark: 100 },
    { metric: 'Total Bookings', value: stats.totalBookings, fullMark: 50 }
  ];

  // Chart 6: Growth Metrics - real monthly data from createdAt
  const growthMetricsData = useMemo(() => {
    const monthMap = {};
    agents.forEach(a => {
      const d = new Date(a.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!monthMap[key]) monthMap[key] = { month: label, agents: 0, earnings: 0 };
      monthMap[key].agents += 1;
      monthMap[key].earnings += a.totalEarnings || 0;
    });
    return Object.keys(monthMap).sort().map(k => monthMap[k]);
  }, [agents]);

  // Chart 7: Top Performers - Funnel Chart
  const topPerformers = agents
    .sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0))
    .slice(0, 5)
    .map((a, i) => ({
      value: a.totalEarnings || 0,
      name: a.name || `Agent ${i + 1}`,
      fill: CHART_COLORS[Object.keys(CHART_COLORS)[i % Object.keys(CHART_COLORS).length]]
    }));

  // Chart 8: City Distribution - Treemap
  const cityDistribution = agents.reduce((acc, a) => {
    const city = a.city || 'Unknown';
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
    { name: 'Earnings Goal', value: stats.totalEarnings > 0 ? (stats.totalEarnings / 100000) * 100 : 0, fill: CHART_COLORS.blue },
    { name: 'Growth', value: parseFloat(stats.growth) || 0, fill: CHART_COLORS.purple }
  ];

  // Chart 10: Earnings vs Bookings Scatter
  const scatterData = agents.map((a, i) => ({
    x: a.totalBookings || 0,
    y: a.totalEarnings || 0,
    z: a.commissionPercentage || 0,
    name: a.name
  }));

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const cleanForm = { ...form };

      if (cleanForm.commissionPercentage !== "") {
        cleanForm.commissionPercentage = Number(cleanForm.commissionPercentage);
      } else {
        delete cleanForm.commissionPercentage;
      }
      if (!cleanForm.password) delete cleanForm.password;

      // Use FormData for all cases now to support multi-files
      const payload = new FormData();
      Object.entries(cleanForm).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          // If v is a nested object, handled is differently or just flatten for simple forms
          payload.append(k, v);
        }
      });

      if (image) payload.append("image", image);
      if (aadhar) payload.append("aadhar", aadhar);
      if (pan) payload.append("pan", pan);

      if (editingId) {
        await updateAgent(editingId, payload);
        Swal.fire({ icon: "success", title: "Updated", background: themeColors.surface, color: themeColors.text, timer: 1500, showConfirmButton: false });
      } else {
        await createAgent(payload);
        Swal.fire({ icon: "success", title: "Created", background: themeColors.surface, color: themeColors.text, timer: 1500, showConfirmButton: false });
      }

      closeModal();
      fetchAgents();
    } catch (err) {
      const respData = err?.response?.data;
      const displayMsg = respData?.message === "Server error" && respData?.error
        ? `Server error: ${respData.error}`
        : (respData?.message || "Operation failed");

      Swal.fire({
        icon: "error",
        title: "Error",
        text: displayMsg,
        background: themeColors.surface,
        color: themeColors.text
      });
    } finally { setLoading(false); }
  };

  const handleEdit = (a) => {
    setEditingId(a._id);
    setEditingAgent(a);
    setForm({
      name: a.name || "", email: a.email || "", phone: a.phone || "", password: "",
      address: a.address || "", city: a.city || "", state: a.state || "", pincode: a.pincode || "",
      commissionPercentage: a.commissionPercentage || "",
      aadhar: a.documents?.aadhar || a.aadhar || "",
      pan: a.documents?.pan || a.pan || "",
      accountNumber: a.bankDetails?.accountNumber || a.accountNumber || "",
      ifscCode: a.bankDetails?.ifscCode || a.ifscCode || "",
      accountHolderName: a.bankDetails?.accountHolderName || a.accountHolderName || "",
      bankName: a.bankDetails?.bankName || a.bankName || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (a) => {
    const res = await Swal.fire({
      title: "Confirm Delete", text: `Remove ${a.name}?`, icon: "warning",
      showCancelButton: true, confirmButtonColor: themeColors.danger,
      confirmButtonText: "Yes, Delete", background: themeColors.surface, color: themeColors.text
    });
    if (res.isConfirmed) {
      try {
        await deleteAgent(a._id);
        fetchAgents();
      } catch (err) {
        Swal.fire({ icon: "error", title: "Error", text: "Failed to delete", background: themeColors.surface, color: themeColors.text });
      }
    }
  };

  const handleToggleStatus = async (a) => {
    try {
      const res = await toggleAgentStatus(a._id);
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
      fetchAgents();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to toggle status", background: themeColors.surface, color: themeColors.text });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setEditingAgent(null);
    setForm(emptyForm);
    setImage(null);
    setAadhar(null);
    setPan(null);
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
      <div className="z-50">
        <div className="px-4 sm:px-8  pt-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-base sm:text-2xl font-bold text-gray-900">Agent Command Center</h1>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Refresh */}
              <button
                onClick={fetchAgents}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw size={18} className={fetching ? 'animate-spin' : ''} />
              </button>

              {/* Add New */}
              {can('AGENT_CREATE') && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center space-x-1 sm:space-x-2 shadow-lg"
                >
                  <UserPlus size={18} />
                  <span className="hidden sm:inline">New Agent</span>
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
                placeholder="Search agents..."
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
                <option>Most Bookings</option>
                <option>Highest Commission</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          <StatCard icon={UserCheck} label="Total Agents" value={stats.total} color="blue" trend={12} subtitle="All registered agents" />
          <StatCard icon={Users} label="Active Agents" value={stats.active} color="green" trend={8} subtitle={`${((stats.active / stats.total) * 100).toFixed(1)}% active rate`} />
          <StatCard icon={DollarSign} label="Total Earnings" value={`₹${(stats.totalEarnings / 1000).toFixed(1)}K`} color="orange" trend={25} subtitle="Lifetime revenue" />
          <StatCard icon={Wallet} label="Wallet Balance" value={`₹${(stats.totalWallet / 1000).toFixed(1)}K`} color="purple" trend={-5} subtitle="Available balance" />
          <StatCard icon={Briefcase} label="Total Bookings" value={stats.totalBookings} color="pink" trend={15} subtitle="All time bookings" />
        </div>
        <div className="bg-white mb-15 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Agent Directory</h3>
              <p className="text-sm text-gray-500">Manage your agent network</p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
              {filteredAgents.length} Records
            </span>
          </div>

          {fetching ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-sm text-gray-500">Loading agent data...</p>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="py-20 text-center">
              <UserCheck size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No agents found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Agent</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Password</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase">Bookings</th>
                      <th className="text-right py-4 px-6 text-xs font-medium text-gray-500 uppercase">Earnings</th>
                      <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase">Commission</th>
                      <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedAgents.map((a) => (
                      <React.Fragment key={a._id}>
                        <tr
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => toggleRowExpansion(a._id)}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden border border-gray-200">
                                {a.image ? (
                                  <img src={`${IMAGE_BASE_URL}${a.image}`} alt={a.name} className="w-full h-full object-cover" />
                                ) : (
                                  <User size={18} className="text-blue-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{a.name}</p>
                                <p className="text-xs text-gray-500">{a.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-sm text-gray-900">{a.phone}</p>
                            <p className="text-xs text-gray-500">{a.email}</p>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded">{a.password || '—'}</span>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-sm text-gray-900">{a.city}</p>
                            <p className="text-xs text-gray-500">{a.state}</p>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              {a.totalBookings || 0}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className="font-medium text-gray-900">₹{(a.totalEarnings || 0).toLocaleString()}</span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                              {a.commissionPercentage}%
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {can('AGENT_STATUS') ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleStatus(a); }}
                                className={`px-3 py-1 rounded-full text-xs font-medium ${a.isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-500'
                                  }`}
                              >
                                {a.isActive ? 'Active' : 'Inactive'}
                              </button>
                            ) : (
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${a.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                                {a.isActive ? 'Active' : 'Inactive'}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {can('AGENT_READ') && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setViewing(a); }}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="View Details"
                                >
                                  <Eye size={16} className="text-blue-600" />
                                </button>
                              )}
                              {can('AGENT_EDIT') && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEdit(a); }}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit size={16} className="text-orange-600" />
                                </button>
                              )}
                              {can('AGENT_DELETE') && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(a); }}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={16} className="text-red-600" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedRows[a._id] && (
                          <tr className="bg-gray-50">
                            <td colSpan="8" className="p-6">
                              <div className="grid grid-cols-3 gap-6">
                                <div>
                                  <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase">Personal Documents</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    {['aadhar', 'pan'].map(docKey => (
                                      <div key={docKey} className="group relative w-full aspect-video rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
                                        {a.documents?.[docKey] ? (
                                          <>
                                            <img
                                              src={`${IMAGE_BASE_URL}${a.documents[docKey]}`}
                                              className="w-full h-full object-cover group-hover:scale-110 transition-transform cursor-pointer"
                                              onClick={() => window.open(`${IMAGE_BASE_URL}${a.documents[docKey]}`, '_blank')}
                                              alt={docKey}
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                              <Eye size={16} className="text-white" />
                                            </div>
                                            <div className="absolute top-1 left-1 bg-white/80 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">{docKey}</div>
                                          </>
                                        ) : (
                                          <div className="flex flex-col items-center justify-center h-full bg-gray-50">
                                            <FileText size={16} className="text-gray-300 mb-1" />
                                            <span className="text-[10px] text-gray-400">No {docKey.toUpperCase()}</span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase">Bank Details</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-xs text-gray-500">Bank:</span>
                                      <span className="text-xs font-medium text-gray-900">{a.bankDetails?.bankName || a.bankName || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs text-gray-500">Account:</span>
                                      <span className="text-xs font-medium text-gray-900">****{a.bankDetails?.accountNumber?.slice(-4) || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs text-gray-500">IFSC:</span>
                                      <span className="text-xs font-medium text-gray-900">{a.bankDetails?.ifscCode || a.ifscCode || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase">Financial Stats</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-xs text-gray-500">Wallet:</span>
                                      <span className={`text-xs font-medium ${a.walletBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        ₹{a.walletBalance?.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs text-gray-500">Joined:</span>
                                      <span className="text-xs font-medium text-gray-900">{new Date(a.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs text-gray-500">Created By:</span>
                                      <span className="text-xs font-medium text-gray-900">{a.createdBy?.name || 'System'}</span>
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
                    Showing {filteredAgents.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filteredAgents.length)} of {filteredAgents.length}
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
          {/* Chart 1: Agent Status Distribution */}
          {(selectedChart === 'all' || selectedChart === 'distribution') && (
            <ChartCard title="Agent Status Distribution" subtitle="Active vs Inactive agents" icon={PieChartIcon}>
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
            <ChartCard title="Performance Metrics" subtitle="Key agent indicators" icon={BarChart3}>
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
            <ChartCard title="Earnings Trend" subtitle="Top agents by revenue" icon={TrendingUp}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={earningsTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="earnings" stroke={CHART_COLORS.blue} strokeWidth={2} name="Earnings" />
                  <Line type="monotone" dataKey="bookings" stroke={CHART_COLORS.green} strokeWidth={2} name="Bookings" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 4: Commission Distribution */}
          {(selectedChart === 'all' || selectedChart === 'commission') && (
            <ChartCard title="Commission Analysis" subtitle="Commission percentage by agent" icon={Percent}>
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

          {/* Chart 5: Agent Health Radar */}
          {(selectedChart === 'all' || selectedChart === 'growth') && (
            <ChartCard title="Agent Health Radar" subtitle="Multi-metric analysis" icon={Gauge}>
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
                  <Bar yAxisId="left" dataKey="agents" fill={CHART_COLORS.blue} name="Agents" />
                  <Line yAxisId="right" type="monotone" dataKey="earnings" stroke={CHART_COLORS.orange} name="Earnings" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 7: Top Performers Funnel */}
          {(selectedChart === 'all' || selectedChart === 'performance') && (
            <ChartCard title="Top Performers" subtitle="Highest earning agents" icon={Zap}>
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
            <ChartCard title="City Distribution" subtitle="Agents by location" icon={Globe}>
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

          {/* Chart 10: Earnings vs Bookings Scatter */}
          {(selectedChart === 'all' || selectedChart === 'earnings') && (
            <ChartCard title="Earnings vs Bookings" subtitle="Correlation analysis" icon={Target}>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" dataKey="x" name="Bookings" />
                  <YAxis type="number" dataKey="y" name="Earnings" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Agents" data={scatterData} fill={CHART_COLORS.blue} shape="circle" />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>

        {/* Agent Table - Only Important Columns */}

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
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-200 bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0 cursor-pointer"
                  onClick={() => viewing.image && setLightboxImg(`${IMAGE_BASE_URL}${viewing.image}`)}
                >
                  {viewing.image ? (
                    <img
                      src={`${IMAGE_BASE_URL}${viewing.image}`}
                      alt={viewing.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  <div className={`w-full h-full items-center justify-center ${viewing.image ? 'hidden' : 'flex'}`}>
                    <User size={24} className="text-blue-600" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{viewing.name}</h2>
                  <p className="text-sm text-gray-500">Agent ID: {viewing._id?.slice(-6)}</p>
                </div>
              </div>
              <button onClick={() => setViewing(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Total Bookings</p>
                  <p className="text-2xl font-bold text-blue-600">{viewing.totalBookings || 0}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-600">₹{viewing.totalEarnings || 0}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Wallet Balance</p>
                  <p className="text-2xl font-bold text-purple-600">₹{viewing.walletBalance || 0}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Commission</p>
                  <p className="text-2xl font-bold text-orange-600">{viewing.commissionPercentage}%</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Personal Details */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <User size={16} className="text-blue-600" /> Personal Details
                  </h3>
                  <div className="space-y-2">
                    {[['Email', viewing.email], ['Phone', viewing.phone], ['Address', viewing.address], ['City/State', `${viewing.city || ''}, ${viewing.state || ''}`]].map(([label, val]) => (
                      <div key={label} className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">{label}</span>
                        <span className="text-sm font-medium text-gray-900">{val || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Document Details */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <FileText size={16} className="text-purple-600" /> Document Details
                  </h3>
                  <div className="space-y-2">
                    {[['Aadhar Number', viewing.aadhar || 'N/A'], ['PAN Number', viewing.pan || 'N/A'], ['Commission', `${viewing.commissionPercentage}%`], ['Status', viewing.isActive ? 'Active' : 'Inactive']].map(([label, val]) => (
                      <div key={label} className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">{label}</span>
                        <span className={`text-sm font-medium ${label === 'Status' ? (viewing.isActive ? 'text-green-600' : 'text-gray-500') : label === 'Commission' ? 'text-orange-600' : 'text-gray-900'}`}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bank Details */}
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <CreditCard size={16} className="text-green-600" /> Bank Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[['Account Holder', viewing.bankDetails?.accountHolderName || viewing.accountHolderName], ['Bank Name', viewing.bankDetails?.bankName || viewing.bankName], ['Account Number', viewing.bankDetails?.accountNumber || viewing.accountNumber], ['IFSC Code', viewing.bankDetails?.ifscCode || viewing.ifscCode]].map(([label, val]) => (
                      <div key={label} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">{label}</p>
                        <p className="text-sm font-medium text-gray-900">{val || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Identity Document Images */}
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Camera size={16} className="text-rose-500" /> Identity Documents
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Profile Photo', url: viewing.image ? `${IMAGE_BASE_URL}${viewing.image}` : null },
                      { label: 'Aadhar Card', url: viewing.documents?.aadhar ? `${IMAGE_BASE_URL}${viewing.documents.aadhar}` : null },
                      { label: 'PAN Card', url: viewing.documents?.pan ? `${IMAGE_BASE_URL}${viewing.documents.pan}` : null },
                    ].map(({ label, url }) => (
                      <div key={label}>
                        <p className="text-xs font-medium text-gray-500 mb-2">{label}</p>
                        <div className="group relative w-full aspect-video rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                          {url ? (
                            <>
                              <img
                                src={url}
                                alt={label}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-zoom-in"
                                onClick={() => setLightboxImg(url)}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <Eye size={18} className="text-white" />
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                              <FileText size={20} className="text-gray-300 mb-1" />
                              <span className="text-xs text-gray-400">Not uploaded</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setViewing(null)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Close</button>
              <button onClick={() => { setViewing(null); handleEdit(viewing); }} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Edit Agent</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <UserPlus size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{editingId ? 'Edit Agent' : 'Register New Agent'}</h2>
                  <p className="text-xs text-indigo-100">{editingId ? 'Update agent information' : 'Fill in the details to onboard a new agent'}</p>
                </div>
              </div>
              <button onClick={closeModal} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors">
                <X size={16} className="text-white" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form id="agent-modal-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-8 py-6 space-y-7">

              {/* Basic Info */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center"><User size={13} className="text-blue-600" /></div>
                  <span className="text-sm font-semibold text-gray-700">Basic Information</span>
                  <div className="flex-1 h-px bg-gray-100 ml-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Full Name *', name: 'name', type: 'text' },
                    { label: 'Email *', name: 'email', type: 'email' },
                    { label: 'Phone *', name: 'phone', type: 'text' },
                    { label: `Password${!editingId ? ' *' : ''}`, name: 'password', type: 'password' },
                  ].map(({ label, name, type }) => (
                    <div key={name} className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500">{label}</label>
                      <input type={type} name={name} value={form[name]} onChange={handleChange}
                        required={name !== 'password' || !editingId}
                        placeholder={`Enter ${label.replace(' *', '').toLowerCase()}`}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm transition-all" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Address */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center"><MapPin size={13} className="text-purple-600" /></div>
                  <span className="text-sm font-semibold text-gray-700">Address</span>
                  <div className="flex-1 h-px bg-gray-100 ml-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Address *</label>
                    <input type="text" name="address" value={form.address} onChange={handleChange} required placeholder="Enter full address"
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 text-sm transition-all" />
                  </div>
                  {[{ label: 'City *', name: 'city' }, { label: 'State *', name: 'state' }, { label: 'Pincode *', name: 'pincode' }].map(({ label, name }) => (
                    <div key={name} className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500">{label}</label>
                      <input type="text" name={name} value={form[name]} onChange={handleChange} required placeholder={`Enter ${name}`}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 text-sm transition-all" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents & Commission */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center"><FileText size={13} className="text-orange-600" /></div>
                  <span className="text-sm font-semibold text-gray-700">Documents & Commission</span>
                  <div className="flex-1 h-px bg-gray-100 ml-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Aadhar Number *', name: 'aadhar', type: 'text' },
                    { label: 'PAN Number *', name: 'pan', type: 'text' },
                    { label: 'Commission % *', name: 'commissionPercentage', type: 'number' },
                  ].map(({ label, name, type }) => (
                    <div key={name} className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500">{label}</label>
                      <input type={type} name={name} value={form[name]} onChange={handleChange} required placeholder={`Enter ${label.replace(' *', '').toLowerCase()}`}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 text-sm transition-all" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center"><CreditCard size={13} className="text-green-600" /></div>
                  <span className="text-sm font-semibold text-gray-700">Bank Details</span>
                  <div className="flex-1 h-px bg-gray-100 ml-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Account Holder Name *', name: 'accountHolderName' },
                    { label: 'Account Number *', name: 'accountNumber' },
                    { label: 'Bank Name *', name: 'bankName' },
                    { label: 'IFSC Code *', name: 'ifscCode' },
                  ].map(({ label, name }) => (
                    <div key={name} className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500">{label}</label>
                      <input type="text" name={name} value={form[name]} onChange={handleChange} required placeholder={`Enter ${label.replace(' *', '').toLowerCase()}`}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 text-sm transition-all" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Profile & Identity Documents with Preview */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-rose-100 rounded-lg flex items-center justify-center"><Camera size={13} className="text-rose-600" /></div>
                  <span className="text-sm font-semibold text-gray-700">Profile & Identity Documents</span>
                  <div className="flex-1 h-px bg-gray-100 ml-2" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Profile Image', file: image, setter: setImage, accent: 'blue', existingUrl: editingAgent?.image ? `${IMAGE_BASE_URL}${editingAgent.image}` : null },
                    { label: 'Aadhar Card', file: aadhar, setter: setAadhar, accent: 'indigo', existingUrl: editingAgent?.documents?.aadhar ? `${IMAGE_BASE_URL}${editingAgent.documents.aadhar}` : null },
                    { label: 'PAN Card', file: pan, setter: setPan, accent: 'green', existingUrl: editingAgent?.documents?.pan ? `${IMAGE_BASE_URL}${editingAgent.documents.pan}` : null },
                  ].map(({ label, file, setter, accent, existingUrl }) => {
                    const previewSrc = file ? URL.createObjectURL(file) : existingUrl;
                    return (
                      <div key={label} className="space-y-2">
                        <label className="text-xs font-medium text-gray-500">{label}</label>
                        <label className="relative flex flex-col items-center justify-center w-full aspect-square rounded-2xl border-2 border-dashed cursor-pointer overflow-hidden transition-all group
                          border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100">
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
                          <p className="text-[10px] text-green-500 text-center">✓ Existing image</p>
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
                <button type="submit" form="agent-modal-form" disabled={loading}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 transition-all">
                  {loading ? (
                    <span className="flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /> Processing...</span>
                  ) : editingId ? 'Update Agent' : 'Create Agent'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}