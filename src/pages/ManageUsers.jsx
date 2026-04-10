import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useFont } from "../context/FontContext";
import {
  getAllUsers, updateUser, deleteUser, toggleUserStatus
} from "../apis/user";
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
  Eye, Trash2, RefreshCw, Edit, ToggleLeft, ToggleRight,
  Search, User, Users, Mail, Phone, Calendar, UserX,
  ChevronLeft, ChevronRight, Download, Filter, TrendingUp,
  DollarSign, Activity, PieChart as PieChartIcon, BarChart3,
  LineChart as LineChartIcon, Target, Gauge, Zap, Shield,
  MoreVertical, DownloadCloud, Printer, UserCheck, UserPlus,
  X, CheckCircle, AlertCircle, Clock
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
  violet: '#8B5CF6'
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

const Field = ({ label, name, value, onChange, themeColors, borderColor, textColorSecondary, type = "text", required = false, icon: Icon }) => (
  <div className="space-y-1.5 w-full">
    <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: textColorSecondary }}>
      {Icon && <Icon size={14} />}
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type} name={name} value={value || ""} onChange={onChange} required={required}
      className="w-full h-11 px-4 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/20 placeholder:opacity-40"
      style={{
        backgroundColor: themeColors.background,
        borderColor: borderColor,
        color: themeColors.text
      }}
    />
  </div>
);

export default function ManageUsers() {
  const { themeColors, theme } = useTheme();
  const { admin } = useAuth();
  const { currentFont } = useFont();

  // Helper for Granular Permissions
  const can = (permission) => {
    if (admin?.role === 'SuperAdmin') return true;
    return admin?.permissions?.includes(permission);
  };

  const IMAGE_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') + '/uploads/';
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const [isEditing, setIsEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
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

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setFetching(true);
      const res = await getAllUsers();
      const fetchedUsers = res.users || [];
      const sorted = [...fetchedUsers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setUsers(sorted);
    } catch { setUsers([]); }
    finally { setFetching(false); }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone?.includes(searchQuery)
    );
  }, [users, searchQuery]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, rowsPerPage]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  // Advanced Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.isActive).length;
    const inactive = users.filter(u => !u.isActive).length;
    const recent = users.filter(u => {
      const dDate = new Date(u.createdAt);
      const now = new Date();
      return (now - dDate) / (1000 * 60 * 60 * 24) <= 7;
    }).length;
    const withPhone = users.filter(u => u.phone).length;
    const verified = users.filter(u => u.isVerified).length;
    const growth = total > 0 ? ((active - inactive) / total * 100).toFixed(1) : "0.0";
    const activeRate = total > 0 ? (active / total) * 100 : 0;
    const phoneRate = total > 0 ? (withPhone / total) * 100 : 0;
    const verifiedRate = total > 0 ? (verified / total) * 100 : 0;

    return {
      total, active, inactive, recent, withPhone, verified, growth, activeRate, phoneRate, verifiedRate
    };
  }, [users]);

  // Chart 1: User Status Distribution - Pie Chart
  const statusData = [
    { name: 'Active Users', value: stats.active, color: CHART_COLORS.green },
    { name: 'Inactive Users', value: stats.inactive, color: CHART_COLORS.red }
  ];

  // Chart 2: User Metrics - Bar Chart
  const metricsData = [
    { name: 'Total Users', value: stats.total, color: CHART_COLORS.blue },
    { name: 'Active Users', value: stats.active, color: CHART_COLORS.green },
    { name: 'With Phone', value: stats.withPhone, color: CHART_COLORS.purple },
    { name: 'Verified', value: stats.verified, color: CHART_COLORS.orange }
  ];

  // Chart 3: User Growth Trend - real monthly data from createdAt
  const growthData = useMemo(() => {
    const monthMap = {};
    users.forEach(u => {
      const d = new Date(u.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!monthMap[key]) monthMap[key] = { month: label, users: 0 };
      monthMap[key].users += 1;
    });
    return Object.keys(monthMap).sort().map(k => monthMap[k]);
  }, [users]);

  // Chart 4: Registration Timeline - Area Chart
  const registrationData = users.slice(0, 8).map((u, i) => ({
    name: u.name?.substring(0, 8) || `User ${i + 1}`,
    days: Math.ceil((new Date() - new Date(u.createdAt)) / (1000 * 60 * 60 * 24))
  }));

  // Chart 5: User Health Radar
  const healthData = [
    { metric: 'Active Rate', value: (stats.active / stats.total) * 100, fullMark: 100 },
    { metric: 'Phone Rate', value: (stats.withPhone / stats.total) * 100, fullMark: 100 },
    { metric: 'Verified Rate', value: (stats.verified / stats.total) * 100, fullMark: 100 },
    { metric: 'Recent Rate', value: (stats.recent / stats.total) * 100, fullMark: 100 }
  ];

  // Chart 6: Weekly Activity - real data from createdAt
  const activityData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = Array(7).fill(0).map((_, i) => ({ day: days[i], active: 0, new: 0 }));
    const now = new Date();
    users.forEach(u => {
      const d = new Date(u.createdAt);
      const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
      if (diffDays <= 6) {
        const dayIndex = d.getDay();
        counts[dayIndex].new += 1;
        if (u.isActive) counts[dayIndex].active += 1;
      }
    });
    return counts;
  }, [users]);

  // Chart 7: Top Users by Activity - Funnel
  const topUsers = [...users]
    .sort((a, b) => (b.totalBookings || 0) - (a.totalBookings || 0))
    .slice(0, 5)
    .map((u, i) => ({
      value: u.totalBookings || 0,
      name: u.name || `User ${i + 1}`,
      fill: CHART_COLORS[Object.keys(CHART_COLORS)[i % Object.keys(CHART_COLORS).length]]
    }));

  // Chart 8: Radial Progress
  const radialData = [
    { name: 'Active Rate', value: stats.activeRate, fill: CHART_COLORS.green },
    { name: 'Phone Coverage', value: stats.phoneRate, fill: CHART_COLORS.blue },
    { name: 'Verification', value: stats.verifiedRate, fill: CHART_COLORS.purple }
  ];

  const handleToggleStatus = async (id) => {
    try {
      await toggleUserStatus(id);
      fetchUsers();
      Swal.fire({
        icon: "success",
        title: "Status Updated",
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        background: themeColors.surface,
        color: themeColors.text
      });
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.message || "Operation failed", "error");
    }
  };

  const handleDelete = async (id) => {
    const u = users.find(user => user._id === id);
    const res = await Swal.fire({
      title: "Delete User Account",
      text: `Are you sure you want to remove ${u?.name || "this user"} permanently?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: themeColors.danger,
      confirmButtonText: "Yes, Delete",
      background: themeColors.surface,
      color: themeColors.text
    });
    if (res.isConfirmed) {
      try {
        await deleteUser(id);
        fetchUsers();
      } catch (err) {
        Swal.fire("Error", err?.response?.data?.message || "Operation failed", "error");
      }
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateUser(isEditing, editForm);
      Swal.fire({
        icon: "success",
        title: "User Updated",
        background: themeColors.surface,
        color: themeColors.text,
        timer: 1500,
        showConfirmButton: false
      });
      setIsEditing(null);
      fetchUsers();
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.message || "Operation failed", "error");
    } finally { setLoading(false); }
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
        <div className="px-4 sm:px-8 mt-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-base sm:text-2xl font-bold text-gray-900">User Command Center</h1>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Refresh */}
              <button
                onClick={fetchUsers}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw size={18} className={fetching ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Search users..."
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
                <option>Sort By</option>
                <option>Newest First</option>
                <option>Oldest First</option>
                <option>Name A-Z</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          <StatCard icon={Users} label="Total Users" value={stats.total} color="blue" trend={12} subtitle="All registered users" />
          <StatCard icon={UserCheck} label="Active Users" value={stats.active} color="green" trend={8} subtitle={`${((stats.active / stats.total) * 100).toFixed(1)}% active rate`} />
          <StatCard icon={UserX} label="Inactive Users" value={stats.inactive} color="red" trend={-3} subtitle="Suspended accounts" />
          <StatCard icon={CheckCircle} label="Verified Users" value={stats.verified} color="purple" trend={15} subtitle="Email verified" />
          <StatCard icon={Calendar} label="New This Week" value={stats.recent} color="orange" trend={5} subtitle="Last 7 days" />
        </div>


        <div className="bg-white   mb-12 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">User Directory</h3>
              <p className="text-sm text-gray-500">Manage your user base</p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
              {filteredUsers.length} Records
            </span>
          </div>

          {fetching ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-sm text-gray-500">Loading user data...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-20 text-center">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Joined</th>
                      <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedUsers.map((u) => (
                      <React.Fragment key={u._id}>
                        <tr
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => toggleRowExpansion(u._id)}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden border border-gray-100">
                                {u.image ? (
                                  <img
                                    src={`${IMAGE_BASE_URL}${u.image}`}
                                    alt={u.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.parentElement.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" size="18" class="text-blue-600" height="18" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'; }}
                                  />
                                ) : (
                                  <User size={18} className="text-blue-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{u.name}</p>
                                <p className="text-xs text-gray-500">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-sm text-gray-900">{u.phone || '—'}</p>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-sm text-gray-900">{new Date(u.createdAt).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-500">{Math.ceil((new Date() - new Date(u.createdAt)) / (1000 * 60 * 60 * 24))} days ago</p>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {can('USER_STATUS') ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleStatus(u._id); }}
                                className={`px-3 py-1 rounded-full text-xs font-medium ${u.isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-500'
                                  }`}
                              >
                                {u.isActive ? 'Active' : 'Inactive'}
                              </button>
                            ) : (
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${u.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                                {u.isActive ? 'Active' : 'Inactive'}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {can('USER_READ') && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setViewing(u); }}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="View Details"
                                >
                                  <Eye size={16} className="text-blue-600" />
                                </button>
                              )}

                              {can('USER_DELETE') && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(u._id); }}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={16} className="text-red-600" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedRows[u._id] && (
                          <tr className="bg-gray-50">
                            <td colSpan="5" className="p-6">
                              <div className="grid grid-cols-2 gap-6">
                                <div>
                                  <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase">Account Details</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-xs text-gray-500">User ID:</span>
                                      <span className="text-xs font-medium text-gray-900">{u._id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs text-gray-500">Member Since:</span>
                                      <span className="text-xs font-medium text-gray-900">{new Date(u.createdAt).toLocaleDateString()}</span>
                                    </div>

                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase">Activity Stats</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-xs text-gray-500">Total Bookings:</span>
                                      <span className="text-xs font-medium text-blue-600">{u.totalBookings || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs text-gray-500">Total Spent:</span>
                                      <span className="text-xs font-medium text-green-600">₹{u.totalSpent || 0}</span>
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
                    Showing {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filteredUsers.length)} of {filteredUsers.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        {/* Chart Selector */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['all', 'distribution', 'metrics', 'growth', 'activity'].map((type) => (
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
          {/* Chart 1: User Status Distribution */}
          {(selectedChart === 'all' || selectedChart === 'distribution') && (
            <ChartCard title="User Status Distribution" subtitle="Active vs Inactive users" icon={PieChartIcon}>
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

          {/* Chart 2: User Metrics */}
          {(selectedChart === 'all' || selectedChart === 'metrics') && (
            <ChartCard title="User Metrics" subtitle="Key user indicators" icon={BarChart3}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metricsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {metricsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 3: User Growth Trend */}
          {(selectedChart === 'all' || selectedChart === 'growth') && (
            <ChartCard title="User Growth Trend" subtitle="Monthly user acquisition" icon={TrendingUp}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke={CHART_COLORS.blue} strokeWidth={3} dot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 4: Registration Timeline */}
          {(selectedChart === 'all' || selectedChart === 'activity') && (
            <ChartCard title="Registration Timeline" subtitle="Days since registration" icon={Clock}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={registrationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="days" stroke={CHART_COLORS.purple} fill={CHART_COLORS.purple} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 5: User Health Radar */}
          {(selectedChart === 'all' || selectedChart === 'metrics') && (
            <ChartCard title="User Health Radar" subtitle="Multi-metric analysis" icon={Gauge}>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart outerRadius={90} data={healthData}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={30} />
                  <Radar name="Health" dataKey="value" stroke={CHART_COLORS.purple} fill={CHART_COLORS.purple} fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 6: Activity Timeline */}
          {(selectedChart === 'all' || selectedChart === 'activity') && (
            <ChartCard title="Weekly Activity" subtitle="Active vs New users" icon={Activity}>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="active" fill={CHART_COLORS.blue} name="Active Users" />
                  <Line type="monotone" dataKey="new" stroke={CHART_COLORS.orange} name="New Users" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 7: Top Users Funnel */}
          {(selectedChart === 'all' || selectedChart === 'metrics') && (
            <ChartCard title="Top Users by Activity" subtitle="Most active users" icon={Target}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topUsers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {topUsers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 8: Radial Progress */}
          {(selectedChart === 'all' || selectedChart === 'metrics') && (
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
        </div>

        {/* User Table - Only Important Columns */}

      </div>

      {/* View Modal */}
      {viewing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">

            {/* Gradient Banner */}
            <div className="relative h-28 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600">
              <button
                onClick={() => setViewing(null)}
                className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <X size={16} className="text-white" />
              </button>
            </div>

            {/* Avatar — overlaps banner */}
            <div className="flex flex-col items-center -mt-14 px-6 relative z-10">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center relative z-10">
                {viewing.image ? (
                  <img
                    src={`${IMAGE_BASE_URL}${viewing.image}`}
                    alt={viewing.name}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setViewingImage(`${IMAGE_BASE_URL}${viewing.image}`); }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement.innerHTML += '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
                    }}
                  />
                ) : (
                  <User size={40} className="text-indigo-400" />
                )}
              </div>

              {/* Name & ID */}
              <h2 className="mt-3 text-xl font-bold text-gray-900">{viewing.name}</h2>
              <p className="text-xs text-gray-400 mb-4">ID: #{viewing._id?.slice(-8)}</p>

              {/* Status + Verified badges */}
              <div className="flex items-center gap-2 mb-6">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${viewing.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${viewing.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                  {viewing.isActive ? 'Active' : 'Inactive'}
                </span>
                {viewing.isVerified && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    <CheckCircle size={11} />
                    Verified
                  </span>
                )}
              </div>
            </div>

            {/* Info Rows */}
            <div className="px-6 pb-4 space-y-2">
              {[
                { label: 'Email', value: viewing.email, icon: Mail },
                { label: 'Phone', value: viewing.phone || 'Not provided', icon: Phone },
                { label: 'Joined', value: new Date(viewing.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), icon: Calendar },
                { label: 'Total Bookings', value: viewing.totalBookings || 0, icon: Calendar, highlight: 'blue' },
                { label: 'Total Spent', value: `₹${viewing.totalSpent || 0}`, icon: DollarSign, highlight: 'green' },
              ].map(({ label, value, icon: Icon, highlight }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center">
                      <Icon size={14} className="text-indigo-400" />
                    </div>
                    <span className="text-sm text-gray-500">{label}</span>
                  </div>
                  <span className={`text-sm font-semibold ${highlight === 'blue' ? 'text-blue-600' : highlight === 'green' ? 'text-green-600' : 'text-gray-800'
                    }`}>{value}</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-2">
              <button
                onClick={() => setViewing(null)}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Fullscreen Preview */}
      {viewingImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setViewingImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg z-10"
            >
              <X size={16} className="text-gray-700" />
            </button>
            <img src={viewingImage} alt="Profile" className="w-full rounded-2xl shadow-2xl object-contain max-h-[80vh]" />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
              <button onClick={() => setIsEditing(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={saveEdit} className="p-6 space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">Full Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">Email Address *</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                  className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(null)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}