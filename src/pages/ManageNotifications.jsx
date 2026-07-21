import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useFont } from "../context/FontContext";
import {
  getAllNotifications, createNotification, toggleNotificationStatus, deleteNotification
} from "../apis/notification";
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
  FaPlus, FaTimes, FaTrash, FaSyncAlt, FaBell, FaPaperPlane,
  FaToggleOn, FaToggleOff, FaSearch, FaUsers, FaUser, FaBullhorn,
  FaChevronLeft, FaChevronRight, FaRegClock, FaInfoCircle, FaInbox, FaStream,
  FaUserTie, FaBuilding, FaChartPie, FaChartBar, FaChartLine, FaChartArea, FaStore
} from "react-icons/fa";
import {
  Download, Filter, TrendingUp, Activity,
  PieChart as PieChartIcon, BarChart3, LineChart as LineChartIcon,
  Target, Gauge, Zap, Shield, MoreVertical, DownloadCloud, Printer,
  Mail, MessageCircle, Globe, Clock, Calendar, Eye, Users
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
  gray: '#9CA3AF'
};

// --- Helper Components ---

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

const Field = ({ label, name, value, onChange, themeColors, borderColor, textColorSecondary, type = "text", required = false }) => (
  <div className="space-y-1 w-full">
    <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide px-1" style={{ color: textColorSecondary }}>
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type} name={name} value={value || ""} onChange={onChange} required={required}
      className="w-full h-10 px-3 rounded-lg border text-sm outline-none transition-all placeholder:opacity-30"
      style={{
        backgroundColor: themeColors.background,
        borderColor: borderColor,
        color: themeColors.text
      }}
    />
  </div>
);

const TextAreaField = ({ label, name, value, onChange, themeColors, borderColor, textColorSecondary, required = false }) => (
  <div className="space-y-1 w-full">
    <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide px-1" style={{ color: textColorSecondary }}>
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      name={name} value={value || ""} onChange={onChange} required={required} rows={4}
      className="w-full p-3 rounded-lg border text-sm outline-none transition-all placeholder:opacity-30 resize-none"
      style={{
        backgroundColor: themeColors.background,
        borderColor: borderColor,
        color: themeColors.text
      }}
    />
  </div>
);

const StatBox = ({ icon: Icon, label, value, colorHex, themeColors, borderColor, textColorSecondary }) => (
  <div className="px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border shadow-sm flex items-center gap-3 transition-colors flex-1 min-w-[140px]"
    style={{ backgroundColor: themeColors.surface, borderColor: borderColor }}>
    <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: colorHex + "20" }}>
      <Icon size={14} style={{ color: colorHex }} />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] sm:text-[10px] font-bold leading-none mb-1 uppercase tracking-wider truncate" style={{ color: textColorSecondary }}>{label}</p>
      <p className="text-xs sm:text-sm font-black truncate" style={{ color: themeColors.text }}>{value}</p>
    </div>
  </div>
);

export default function ManageNotifications() {
  const { themeColors, theme } = useTheme();
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
  const [notifications, setNotifications] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState('month');
  const [selectedChart, setSelectedChart] = useState('all');
  const [expandedRows, setExpandedRows] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  // Form State
  const [form, setForm] = useState({
    title: "",
    message: "",
    targetType: "all", // all, role, specific
    targetRoles: ["all"],
    recipient: "",
    recipientModel: "User",
    media: null,
  });

  const [rowsPerPage, setRowsPerPage] = useState(10);

  const textColorSecondary = useMemo(() => {
    if (theme === "dark") return "rgba(255, 255, 255, 0.6)";
    return themeColors.textSecondary || "rgba(107, 114, 128, 1)";
  }, [theme, themeColors]);

  const borderColor = useMemo(() => {
    return themeColors.border || (theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)");
  }, [theme, themeColors]);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      setFetching(true);
      const res = await getAllNotifications();
      let fetched = res.notifications || [];
      
      // Filter: Show only if Created By model is admin or Admin (or SuperAdmin)
      fetched = fetched.filter(n => {
        const model = (n.createdByModel || '').toLowerCase();
        return model === 'admin' || model === 'superadmin';
      });

      const sorted = [...fetched].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(sorted);
    } catch { setNotifications([]); }
    finally { setFetching(false); }
  };

  const [activeTab, setActiveTab] = useState("all");

  const tabs = [
    { id: "all", label: "All Hub", icon: FaStream },
    { id: "everyone", label: "Everyone", icon: FaBullhorn },
    { id: "fleet", label: "Fleet Hub", icon: FaBuilding },
    { id: "driver", label: "Driver Network", icon: FaUserTie },
    { id: "user", label: "User Base", icon: FaUser },
    { id: "vendor", label: "Vendor Hub", icon: FaStore },
    { id: "subadmin", label: "SubAdmin Hub", icon: FaUsers },
  ];

  // Advanced Statistics
  const stats = useMemo(() => {
    const total = notifications.length;
    const active = notifications.filter(n => n.isActive).length;
    const inactive = total - active;
    const today = notifications.filter(n => new Date(n.createdAt).toDateString() === new Date().toDateString()).length;
    const thisWeek = notifications.filter(n => {
      const d = new Date(n.createdAt);
      const now = new Date();
      const diff = (now - d) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    }).length;

    // Target distribution
    const everyone = notifications.filter(n => n.targetRoles?.includes("all")).length;
    const fleet = notifications.filter(n => n.targetRoles?.includes("agent") || n.recipientModel === "Agent").length;
    const driver = notifications.filter(n => n.targetRoles?.includes("driver") || n.recipientModel === "Driver").length;
    const user = notifications.filter(n => n.targetRoles?.includes("user") || n.recipientModel === "User").length;
    const vendor = notifications.filter(n => n.targetRoles?.includes("vendor") || n.recipientModel === "Vendor").length;
    const subadmin = notifications.filter(n => n.targetRoles?.includes("subadmin") || n.recipientModel === "SubAdmin").length;

    return { total, active, inactive, today, thisWeek, everyone, fleet, driver, user, vendor, subadmin };
  }, [notifications]);

  // Chart 1: Notification Status - Pie Chart
  const statusData = [
    { name: 'Active', value: stats.active, color: CHART_COLORS.green },
    { name: 'Inactive', value: stats.inactive, color: CHART_COLORS.gray }
  ].filter(item => item.value > 0);

  // Chart 2: Target Distribution - Pie Chart
  const targetData = [
    { name: 'Everyone', value: stats.everyone, color: CHART_COLORS.blue },
    { name: 'Fleet', value: stats.fleet, color: CHART_COLORS.purple },
    { name: 'Driver', value: stats.driver, color: CHART_COLORS.orange },
    { name: 'User', value: stats.user, color: CHART_COLORS.green },
    { name: 'Vendor', value: stats.vendor, color: CHART_COLORS.indigo }
  ].filter(item => item.value > 0);

  // Chart 3: Weekly Trend - Line Chart
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const count = notifications.filter(n =>
      new Date(n.createdAt).toDateString() === date.toDateString()
    ).length;
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      count
    };
  }).reverse();

  // Chart 4: Monthly Trend - real monthly data from createdAt
  const monthlyData = useMemo(() => {
    const monthMap = {};
    notifications.forEach(n => {
      const d = new Date(n.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!monthMap[key]) monthMap[key] = { week: label, count: 0 };
      monthMap[key].count += 1;
    });
    return Object.keys(monthMap).sort().map(k => monthMap[k]);
  }, [notifications]);

  // Chart 5: Created By Distribution - Bar Chart
  const creatorData = notifications.reduce((acc, n) => {
    const creator = n.createdByModel || 'System';
    const existing = acc.find(item => item.name === creator);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ name: creator, count: 1 });
    }
    return acc;
  }, []);

  // Chart 6: Hourly Distribution - Area Chart
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0') + ':00';
    const count = notifications.filter(n =>
      new Date(n.createdAt).getHours() === i
    ).length;
    return { hour, count };
  });

  // Chart 7: Performance Radar
  const radarData = [
    { metric: 'Active Rate', value: stats.total > 0 ? (stats.active / stats.total) * 100 : 0, fullMark: 100 },
    { metric: 'Today', value: stats.total > 0 ? (stats.today / stats.total) * 100 : 0, fullMark: 100 },
    { metric: 'This Week', value: stats.total > 0 ? (stats.thisWeek / stats.total) * 100 : 0, fullMark: 100 },
    { metric: 'Everyone', value: stats.total > 0 ? (stats.everyone / stats.total) * 100 : 0, fullMark: 100 }
  ];

  // Chart 8: Radial Progress
  const radialData = [
    { name: 'Active', value: stats.total > 0 ? (stats.active / stats.total) * 100 : 0, fill: CHART_COLORS.green },
    { name: 'Today', value: Math.min((stats.today / 10) * 100 || 0, 100), fill: CHART_COLORS.blue },
    { name: 'Week', value: Math.min((stats.thisWeek / 20) * 100 || 0, 100), fill: CHART_COLORS.purple }
  ];

  const filteredNotifications = useMemo(() => {
    let list = notifications;

    // Tab Filtering
    if (activeTab === "everyone") {
      list = list.filter(n => n.targetRoles?.includes("all"));
    } else if (activeTab === "fleet") {
      list = list.filter(n => n.targetRoles?.includes("agent") || n.recipientModel === "Agent");
    } else if (activeTab === "driver") {
      list = list.filter(n => n.targetRoles?.includes("driver") || n.recipientModel === "Driver");
    } else if (activeTab === "user") {
      list = list.filter(n => n.targetRoles?.includes("user") || n.recipientModel === "User");
    } else if (activeTab === "vendor") {
      list = list.filter(n => n.targetRoles?.includes("vendor") || n.recipientModel === "Vendor");
    } else if (activeTab === "subadmin") {
      list = list.filter(n => n.targetRoles?.includes("subadmin") || n.recipientModel === "SubAdmin");
    }

    // Search Filtering
    return list.filter(n =>
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notifications, searchQuery, activeTab]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, activeTab, rowsPerPage]);

  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredNotifications.slice(start, start + rowsPerPage);
  }, [filteredNotifications, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredNotifications.length / rowsPerPage);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = new FormData();
      payload.append("title", form.title);
      payload.append("message", form.message);

      if (form.targetType === "all") {
        payload.append("targetRoles[]", "all");
      } else if (form.targetType === "role") {
        form.targetRoles.forEach(r => payload.append("targetRoles[]", r));
      } else {
        payload.append("recipient", form.recipient);
        payload.append("recipientModel", form.recipientModel);
      }

      if (form.media) {
        payload.append("media", form.media);
      }

      await createNotification(payload);
      Swal.fire({
        icon: "success",
        title: "Broadcast Sent",
        background: themeColors.surface,
        color: themeColors.text,
        timer: 1500,
        showConfirmButton: false
      });
      setIsModalOpen(false);
      setForm({
        title: "",
        message: "",
        targetType: "all",
        targetRoles: ["all"],
        recipient: "",
        recipientModel: "User",
        media: null,
      });
      fetchNotifications();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.response?.data?.message || "Failed to send notification",
        background: themeColors.surface,
        color: themeColors.text
      });
    } finally { setLoading(false); }
  };

  const handleToggle = async (id) => {
    try {
      await toggleNotificationStatus(id);
      fetchNotifications();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Action failed",
        background: themeColors.surface,
        color: themeColors.text
      });
    }
  };

  const handleDelete = async (id) => {
    const res = await Swal.fire({
      title: "Confirm Delete", text: "Remove this announcement?", icon: "warning",
      showCancelButton: true, confirmButtonColor: themeColors.danger,
      confirmButtonText: "Yes, Delete", background: themeColors.surface, color: themeColors.text
    });
    if (res.isConfirmed) {
      try {
        await deleteNotification(id);
        fetchNotifications();
      } catch (err) {
        Swal.fire({ icon: "error", title: "Error", text: "Delete failed", background: themeColors.surface, color: themeColors.text });
      }
    }
  };

  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setForm({
      title: "",
      message: "",
      targetType: "all",
      targetRoles: ["all"],
      recipient: "",
      recipientModel: "User",
      media: null,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className=" mt-8 z-50">
        <div className="px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-base sm:text-2xl font-bold text-gray-900">Notification Command Center</h1>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Refresh */}
              <button
                onClick={fetchNotifications}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FaSyncAlt size={18} className={fetching ? 'animate-spin' : ''} />
              </button>

              {/* Add New */}
              {can('NEWS_POST') && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center space-x-1 sm:space-x-2 shadow-lg"
                >
                  <FaPlus size={18} />
                  <span className="hidden sm:inline">New Broadcast</span>
                  <span className="sm:hidden text-xs">New</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Search notifications..."
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
                <option>Most Recent</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          <StatCard icon={FaInbox} label="Total Broadcasts" value={stats.total} color="blue" trend={12} subtitle="All notifications" />
          <StatCard icon={FaBell} label="Active Alerts" value={stats.active} color="green" trend={8} subtitle={`${((stats.active / stats.total) * 100).toFixed(1)}% active`} />
          <StatCard icon={FaStream} label="Sent Today" value={stats.today} color="orange" trend={5} subtitle="Last 24 hours" />
          <StatCard icon={FaUsers} label="This Week" value={stats.thisWeek} color="purple" trend={15} subtitle="Last 7 days" />
          <StatCard icon={Globe} label="Everyone" value={stats.everyone} color="pink" trend={3} subtitle="Public broadcasts" />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-2 border-b border-gray-200 flex items-center gap-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 text-xs font-medium transition-all border-b-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                  {tab.id === "all" ? stats.total :
                    tab.id === "everyone" ? stats.everyone :
                      tab.id === "fleet" ? stats.fleet :
                        tab.id === "driver" ? stats.driver :
                          tab.id === "user" ? stats.user :
                          tab.id === "vendor" ? stats.vendor :
                            stats.subadmin}
                </span>
              </button>
            ))}
          </div>

          {/* Notification Table - Only Important Columns */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Created By</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Target</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase">Image</th>
                  <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedNotifications.map((n) => (
                  <React.Fragment key={n._id}>
                    <tr
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggleRowExpansion(n._id)}
                    >
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{new Date(n.createdAt).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden border border-gray-100">
                            {n.createdBy?.image ? (
                              <img 
                                src={`${IMAGE_BASE_URL}${n.createdBy?.image}`} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.parentElement.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" size="14" class="text-blue-600" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"></path></svg>'; }}
                              />
                            ) : (
                              <FaUser size={14} className="text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{n.createdBy?.name || 'System'}</p>
                            <p className="text-xs text-gray-500">{n.createdByModel || 'System'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {n.targetRoles?.includes("all") ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            Everyone
                          </span>
                        ) : n.recipient ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            {n.recipientModel}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                            {n.targetRoles?.join(', ')}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">{n.message}</p>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {n.mediaUrl ? (
                          <div 
                            className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden cursor-pointer mx-auto hover:opacity-80 transition-opacity flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(`${BASE.replace(/\/api\/?$/, '').replace(/\/$/, '')}${n.mediaUrl}`);
                            }}
                          >
                            {n.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                              <span className="text-[10px] font-bold text-gray-500 uppercase">Video</span>
                            ) : (
                              <img src={`${BASE.replace(/\/api\/?$/, '').replace(/\/$/, '')}${n.mediaUrl}`} className="w-full h-full object-cover" alt="Attachment" />
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); can('NEWS_POST') && handleToggle(n._id); }}
                          disabled={!can('NEWS_POST')}
                          className={`text-sm font-medium ${n.isActive ? 'text-green-600' : 'text-gray-400'} ${!can('NEWS_POST') && 'opacity-50 cursor-not-allowed'}`}
                        >
                          {n.isActive ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {can('NEWS_DELETE') && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(n._id); }}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FaTrash size={16} className="text-red-600" />
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedRows[n._id] && (
                      <tr className="bg-gray-50">
                        <td colSpan="7" className="p-6">
                          <div className="space-y-2">
                            <h4 className="text-xs font-medium text-gray-500 mb-2">Full Message</h4>
                            <p className="text-sm text-gray-900 bg-white p-4 rounded-lg border border-gray-200">
                              {n.message}
                            </p>
                            {n.mediaUrl && (
                              <div className="mt-4">
                                <h4 className="text-xs font-medium text-gray-500 mb-2">Attached Media</h4>
                                {n.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                                  <video src={`${BASE.replace(/\/api\/?$/, '').replace(/\/$/, '')}${n.mediaUrl}`} controls className="max-w-md max-h-64 rounded-lg shadow-sm border border-gray-200" />
                                ) : (
                                  <img src={`${BASE.replace(/\/api\/?$/, '').replace(/\/$/, '')}${n.mediaUrl}`} alt="Attachment" className="max-w-md max-h-64 object-contain rounded-lg shadow-sm border border-gray-200" />
                                )}
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <div>
                                <span className="text-xs text-gray-500">Notification ID:</span>
                                <p className="text-sm font-medium text-gray-900">{n._id}</p>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500">Created:</span>
                                <p className="text-sm font-medium text-gray-900">{new Date(n.createdAt).toLocaleString()}</p>
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
                Showing {filteredNotifications.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filteredNotifications.length)} of {filteredNotifications.length}
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
          {['all', 'status', 'target', 'trends', 'distribution'].map((type) => (
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
          {/* Chart 1: Notification Status */}
          {(selectedChart === 'all' || selectedChart === 'status') && (
            <ChartCard title="Notification Status" subtitle="Active vs Inactive" icon={PieChartIcon}>
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

          {/* Chart 2: Target Distribution */}
          {(selectedChart === 'all' || selectedChart === 'target') && (
            <ChartCard title="Target Distribution" subtitle="Notifications by audience" icon={Target}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={targetData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {targetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 3: Weekly Trend */}
          {(selectedChart === 'all' || selectedChart === 'trends') && (
            <ChartCard title="Weekly Trend" subtitle="Notifications per day" icon={TrendingUp}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke={CHART_COLORS.blue} strokeWidth={3} dot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 4: Monthly Trend */}
          {(selectedChart === 'all' || selectedChart === 'trends') && (
            <ChartCard title="Monthly Trend" subtitle="Weekly notification count" icon={BarChart3}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={CHART_COLORS.purple} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 5: Creator Distribution */}
          {(selectedChart === 'all' || selectedChart === 'distribution') && (
            <ChartCard title="Creator Distribution" subtitle="Notifications by creator type" icon={Users}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={creatorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={CHART_COLORS.green} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 6: Hourly Distribution */}
          {(selectedChart === 'all' || selectedChart === 'distribution') && (
            <ChartCard title="Hourly Distribution" subtitle="Notifications by hour" icon={Clock}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="hour" interval={3} />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke={CHART_COLORS.orange} fill={CHART_COLORS.orange} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 7: Performance Radar */}
          {(selectedChart === 'all' || selectedChart === 'status') && (
            <ChartCard title="Performance Radar" subtitle="Multi-metric analysis" icon={Gauge}>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart outerRadius={90} data={radarData}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={30} />
                  <Radar name="Performance" dataKey="value" stroke={CHART_COLORS.purple} fill={CHART_COLORS.purple} fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 8: Radial Progress */}
          {(selectedChart === 'all' || selectedChart === 'status') && (
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

        {/* Tab Navigation */}

      </div>

      {/* Create Notification Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Create New Broadcast</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <FaTimes size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Target Selection */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <FaUsers size={16} className="text-blue-600" />
                  Target Audience
                </h3>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { id: 'all', label: 'Everyone', icon: FaBullhorn },
                    { id: 'role', label: 'Roles', icon: FaUsers },
                    { id: 'specific', label: 'Specific', icon: FaUser }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setForm({ ...form, targetType: opt.id })}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${form.targetType === opt.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <opt.icon size={20} className={form.targetType === opt.id ? 'text-blue-600' : 'text-gray-400'} />
                      <span className={`text-xs font-medium ${form.targetType === opt.id ? 'text-blue-600' : 'text-gray-500'}`}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>

                {form.targetType === 'role' && (
                  <div className="flex flex-wrap gap-2">
                    {['fleet', 'agent', 'driver', 'admin', 'user', 'vendor', 'subadmin'].map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          let roles = form.targetRoles.includes(role)
                            ? form.targetRoles.filter(r => r !== role)
                            : [...form.targetRoles.filter(r => r !== 'all'), role];
                          if (roles.length === 0) roles = ['all'];
                          setForm({ ...form, targetRoles: roles });
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${form.targetRoles.includes(role)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        {role === 'fleet' ? 'Fleet' : role.charAt(0).toUpperCase() + role.slice(1)}
                      </button>
                    ))}
                  </div>
                )}

                {form.targetType === 'specific' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500">Recipient Model</label>
                      <select
                        value={form.recipientModel}
                        onChange={e => setForm({ ...form, recipientModel: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="User">User</option>
                        <option value="Driver">Driver</option>
                        <option value="Fleet">Fleet</option>
                        <option value="Agent">Agent</option>
                        <option value="Vendor">Vendor</option>
                        <option value="SubAdmin">SubAdmin</option>
                      </select>

                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500">Recipient ID</label>
                      <input
                        type="text"
                        value={form.recipient}
                        onChange={e => setForm({ ...form, recipient: e.target.value })}
                        required
                        className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <MessageCircle size={16} className="text-purple-600" />
                  Message Content
                </h3>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Title *</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      required
                      className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Enter notification title"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Message *</label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      required
                      rows={4}
                      className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Enter your message here..."
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Attach Media (Image / Video)</label>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={e => setForm({ ...form, media: e.target.files[0] })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
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
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <FaSyncAlt className="animate-spin" size={16} /> : <FaPaperPlane size={16} />}
                  {loading ? 'Sending...' : 'Send Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full bg-transparent flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
            >
              <FaTimes size={24} />
            </button>
            {previewImage.match(/\.(mp4|webm|ogg)$/i) ? (
              <video src={previewImage} controls autoPlay className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" />
            ) : (
              <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}