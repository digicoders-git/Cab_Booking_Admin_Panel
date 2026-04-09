import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { getAllBookings, updateBookingStatus, deleteBooking } from "../apis/booking";
import { useAuth } from "../context/AuthContext";
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
  FaRoute, FaCar, FaUserAlt, FaMapMarkerAlt, FaCalendarAlt,
  FaClock, FaUsers, FaArrowRight, FaSearch, FaSyncAlt,
  FaInfoCircle, FaCheckCircle, FaTimesCircle, FaPlayCircle, FaHistory, FaCircle, FaChevronLeft, FaChevronRight, FaEye, FaCreditCard,
  FaChartPie, FaChartBar, FaChartLine, FaChartArea
} from "react-icons/fa";
import {
  Download, Filter, TrendingUp, Activity, DollarSign,
  PieChart as PieChartIcon, BarChart3, LineChart as LineChartIcon,
  Target, Gauge, Zap, Shield, MoreVertical, DownloadCloud, Printer,
  Clock, Calendar, Users, MapPin, Phone, Mail, Trash2
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

export default function ManageBookings() {
  const { themeColors, theme } = useTheme();
  const { currentFont } = useFont();
  const { admin } = useAuth();

  // RBAC Helper
  const can = (permission) => {
    if (admin?.role === 'SuperAdmin') return true;
    return admin?.permissions?.includes(permission);
  };
  
  const IMAGE_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') + '/uploads/';

  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setFetching(true);
      const res = await getAllBookings();
      if (res.success) {
        const sorted = [...(res.bookings || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setBookings(sorted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  const handleDeleteBooking = async (id) => {
      const result = await Swal.fire({
          title: 'Are you sure?',
          text: "You won't be able to revert this!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
          try {
              const res = await deleteBooking(id);
              if (res.success) {
                  Swal.fire('Deleted!', res.message, 'success');
                  fetchData(); // Refresh list
              } else {
                  Swal.fire('Error!', res.message, 'error');
              }
          } catch (error) {
              Swal.fire('Error!', 'Failed to delete booking', 'error');
          }
      }
  };

  // Advanced Statistics
  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter(b => b.bookingStatus?.toLowerCase() === "pending").length;
    const ongoing = bookings.filter(b => ["ongoing", "accepted"].includes(b.bookingStatus?.toLowerCase())).length;
    const completed = bookings.filter(b => b.bookingStatus?.toLowerCase() === "completed").length;
    const cancelled = bookings.filter(b => b.bookingStatus?.toLowerCase() === "cancelled").length;
    const expired = bookings.filter(b => b.bookingStatus?.toLowerCase() === "expired").length;

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.fareEstimate || 0), 0);
    const avgFare = total > 0 ? totalRevenue / total : 0;
    const cashPayments = bookings.filter(b => b.paymentMethod === "Cash").length;
    const cardPayments = bookings.filter(b => b.paymentMethod === "Card").length;
    const onlinePayments = bookings.filter(b => b.paymentMethod === "Online").length;

    return {
      total, pending, ongoing, completed, cancelled, expired,
      totalRevenue, avgFare, cashPayments, cardPayments, onlinePayments
    };
  }, [bookings]);

  // Chart 1: Booking Status Distribution - Pie Chart
  const statusData = [
    { name: 'Pending', value: stats.pending, color: CHART_COLORS.yellow },
    { name: 'Ongoing', value: stats.ongoing, color: CHART_COLORS.blue },
    { name: 'Completed', value: stats.completed, color: CHART_COLORS.green },
    { name: 'Cancelled', value: stats.cancelled, color: CHART_COLORS.red },
    { name: 'Expired', value: stats.expired, color: CHART_COLORS.gray }
  ].filter(item => item.value > 0);

  // Chart 2: Payment Methods - Pie Chart
  const paymentData = [
    { name: 'Cash', value: stats.cashPayments, color: CHART_COLORS.green },
    { name: 'Card', value: stats.cardPayments, color: CHART_COLORS.blue },
    { name: 'Online', value: stats.onlinePayments, color: CHART_COLORS.purple }
  ].filter(item => item.value > 0);

  // Chart 3: Weekly Trend - Line Chart
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayBookings = bookings.filter(b =>
      new Date(b.createdAt).toDateString() === date.toDateString()
    );
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      count: dayBookings.length,
      revenue: dayBookings.reduce((sum, b) => sum + (b.fareEstimate || 0), 0)
    };
  }).reverse();

  // Chart 4: Monthly Trend - Bar Chart
  const monthlyData = useMemo(() => {
    const monthMap = {};
    const now = new Date();
    
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthMap[monthKey] = { bookings: 0, revenue: 0 };
    }
    
    // Group bookings by month
    bookings.forEach(b => {
      const bDate = new Date(b.createdAt);
      const monthKey = bDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (monthMap.hasOwnProperty(monthKey)) {
        monthMap[monthKey].bookings += 1;
        monthMap[monthKey].revenue += b.fareEstimate || 0;
      }
    });
    
    return Object.entries(monthMap).map(([month, data]) => ({
      month,
      bookings: data.bookings,
      revenue: data.revenue
    }));
  }, [bookings]);

  // Chart 5: Ride Type Distribution - Bar Chart
  const rideTypeData = bookings.reduce((acc, b) => {
    const type = b.rideType || 'Unknown';
    const existing = acc.find(item => item.name === type);
    if (existing) {
      existing.count++;
      existing.revenue += b.fareEstimate || 0;
    } else {
      acc.push({ name: type, count: 1, revenue: b.fareEstimate || 0 });
    }
    return acc;
  }, []);

  // Chart 6: Hourly Distribution - Area Chart
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0') + ':00';
    const hourBookings = bookings.filter(b =>
      new Date(b.createdAt).getHours() === i
    );
    return {
      hour,
      count: hourBookings.length,
      revenue: hourBookings.reduce((sum, b) => sum + (b.fareEstimate || 0), 0)
    };
  });

  // Chart 7: Performance Radar
  const radarData = [
    { metric: 'Completion', value: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0, fullMark: 100 },
    { metric: 'Ongoing', value: stats.total > 0 ? (stats.ongoing / stats.total) * 100 : 0, fullMark: 100 },
    { metric: 'Revenue', value: Math.min((stats.totalRevenue / 100000) * 100 || 0, 100), fullMark: 100 },
    { metric: 'Cash', value: stats.total > 0 ? (stats.cashPayments / stats.total) * 100 : 0, fullMark: 100 }
  ];

  // Chart 8: Radial Progress
  const radialData = [
    { name: 'Completion', value: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0, fill: CHART_COLORS.green },
    { name: 'Ongoing', value: stats.total > 0 ? (stats.ongoing / stats.total) * 100 : 0, fill: CHART_COLORS.blue },
    { name: 'Revenue', value: Math.min((stats.totalRevenue / 100000) * 100 || 0, 100), fill: CHART_COLORS.purple }
  ];

  // Chart 9: Fare Distribution - Scatter Plot
  const fareData = bookings.map((b, i) => ({
    x: i,
    y: b.fareEstimate || 0,
    status: b.bookingStatus,
    type: b.rideType
  }));

  // Chart 10: Seats Distribution - Bar Chart
  const seatsData = bookings.reduce((acc, b) => {
    const seats = b.seatsBooked || 1;
    const existing = acc.find(item => item.seats === seats);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ seats: `${seats} Seat${seats > 1 ? 's' : ''}`, count: 1 });
    }
    return acc;
  }, []).sort((a, b) => a.seats - b.seats);

  const filteredBookings = useMemo(() => {
    let list = bookings;
    if (activeTab === "pending") list = list.filter(b => b.bookingStatus?.toLowerCase() === "pending");
    else if (activeTab === "ongoing") list = list.filter(b => ["ongoing", "accepted"].includes(b.bookingStatus?.toLowerCase()));
    else if (activeTab === "completed") list = list.filter(b => b.bookingStatus?.toLowerCase() === "completed");
    else if (activeTab === "cancelled") list = list.filter(b => b.bookingStatus?.toLowerCase() === "cancelled");
    else if (activeTab === "expired") list = list.filter(b => b.bookingStatus?.toLowerCase() === "expired");

    return list.filter(b =>
      b._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.passengerDetails?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.passengerDetails?.phone?.includes(searchQuery)
    );
  }, [bookings, activeTab, searchQuery]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredBookings.slice(start, start + rowsPerPage);
  }, [filteredBookings, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredBookings.length / rowsPerPage);

  useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery, rowsPerPage]);

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === "pending") return { color: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)" };
    if (s === "accepted" || s === "ongoing") return { color: "#3B82F6", bg: "rgba(59, 130, 246, 0.1)" };
    if (s === "completed") return { color: "#10B981", bg: "rgba(16, 185, 129, 0.1)" };
    if (s === "expired") return { color: "#6B7280", bg: "rgba(107, 114, 128, 0.1)" };
    return { color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)" };
  };

  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleViewDetail = (booking) => {
    Swal.fire({
      title: `<span class="text-sm font-black uppercase tracking-widest">Order #${booking._id?.slice(-8).toUpperCase()}</span>`,
      html: `
        <div class="text-left space-y-4 py-2" style="font-family: inherit;">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-[9px] font-black uppercase opacity-40">Passenger</p>
              <p class="text-xs font-bold">${booking.passengerDetails?.name || 'N/A'}</p>
            </div>
            <div>
              <p class="text-[9px] font-black uppercase opacity-40">Contact</p>
              <p class="text-xs font-bold">${booking.passengerDetails?.phone || 'N/A'}</p>
            </div>
          </div>
          <div>
            <p class="text-[9px] font-black uppercase opacity-40">Route</p>
            <p class="text-[10px] font-bold mt-1"><span class="text-green-500">FROM:</span> ${booking.pickup?.address}</p>
            <p class="text-[10px] font-bold mt-0.5"><span class="text-red-500">TO:</span> ${booking.drop?.address}</p>
          </div>
          <div class="border-t pt-3 flex justify-between items-center">
            <div>
              <p class="text-[9px] font-black uppercase opacity-40">Vehicle</p>
              <p class="text-xs font-black uppercase text-primary">${booking.carCategory?.name} (${booking.rideType})</p>
            </div>
            <div class="text-right">
              <p class="text-[9px] font-black uppercase opacity-40">Fare</p>
              <p class="text-sm font-black">₹${booking.fareEstimate?.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      `,
      background: themeColors.surface,
      color: themeColors.text,
      confirmButtonColor: themeColors.primary,
      confirmButtonText: "CLOSE",
      showCloseButton: true,
      customClass: {
        popup: 'rounded-2xl border'
      }
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
                <h1 className="text-base sm:text-2xl font-bold text-gray-900">Booking Command Center</h1>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Refresh */}
              <button
                onClick={fetchData}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FaSyncAlt size={18} className={fetching ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg col-span-2"
              />
              <select className="px-3 py-2 border border-gray-300 rounded-lg">
                <option>All Ride Types</option>
                <option>Private Only</option>
                <option>Shared Only</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded-lg">
                <option>Sort By</option>
                <option>Newest First</option>
                <option>Highest Fare</option>
                <option>Oldest First</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          <StatCard icon={FaRoute} label="Total Bookings" value={stats.total} color="blue" trend={12} subtitle="All time bookings" />
          <StatCard icon={FaClock} label="Pending" value={stats.pending} color="yellow" trend={-5} subtitle="Awaiting confirmation" />
          <StatCard icon={FaPlayCircle} label="Ongoing" value={stats.ongoing} color="purple" trend={8} subtitle="Active rides" />
          <StatCard icon={FaCheckCircle} label="Completed" value={stats.completed} color="green" trend={15} subtitle="Successfully finished" />
          <StatCard icon={DollarSign} label="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`} color="orange" trend={10} subtitle={`Avg ₹${Math.round(stats.avgFare)} per ride`} />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-2 border-b border-gray-200 flex items-center gap-4 overflow-x-auto">
            {[
              { id: "all", label: "All Bookings", icon: FaRoute },
              { id: "pending", label: "Pending", icon: FaClock, count: stats.pending },
              { id: "ongoing", label: "Ongoing", icon: FaPlayCircle, count: stats.ongoing },
              { id: "completed", label: "Completed", icon: FaCheckCircle, count: stats.completed },
              { id: "cancelled", label: "Cancelled", icon: FaTimesCircle, count: stats.cancelled },
              { id: "expired", label: "Expired", icon: FaHistory, count: stats.expired }
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

          {/* Bookings Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Ref ID</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Passenger</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Booked By</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Route</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Vehicle</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Driver</th>
                  <th className="text-right py-4 px-6 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Fare</th>
                  <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Status</th>
                  <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedData.map((b) => (
                  <React.Fragment key={b._id}>
                    <tr
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggleRowExpansion(b._id)}
                    >
                      <td className="py-4 px-6">
                        <span className="text-xs font-mono text-blue-600">#{b._id?.slice(-8).toUpperCase()}</span>
                        <div className="text-xs text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{b.passengerDetails?.name || 'Anonymous'}</span>
                          <span className="text-xs text-gray-500">{b.passengerDetails?.phone || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden border border-gray-100">
                            {(b.user?.image || b.agent?.image) ? (
                              <img 
                                src={`${IMAGE_BASE_URL}${b.user?.image || b.agent?.image}`} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.parentElement.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" size="14" class="text-blue-600" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"></path></svg>'; }}
                              />
                            ) : (
                              <FaUserAlt size={14} className="text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{b.user?.name || b.agent?.name || 'Self'}</p>
                            <p className="text-xs text-gray-500">{b.agent ? 'Agent' : 'Direct'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 min-w-[400px]">
                        <div className="space-y-1">
                          <div className="flex items-start gap-2">
                            <div className="mt-1">
                              <FaCircle size={6} className="text-green-500" />
                            </div>
                            <span className="text-xs text-gray-700">{b.pickup?.address}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <FaMapMarkerAlt size={8} className="text-red-500 mt-1" />
                            <span className="text-xs text-gray-700">{b.drop?.address}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                          {b.rideType} • {b.carCategory?.name}
                        </span>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <FaUsers size={10} /> {b.seatsBooked} seats
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {b.assignedDriver ? (
                          <div>
                            <p className="text-sm font-medium text-gray-900">{b.assignedDriver.name}</p>
                            <p className="text-xs text-gray-500">{b.assignedDriver.carDetails?.carNumber}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-sm font-bold text-gray-900">₹{b.fareEstimate?.toLocaleString('en-IN')}</span>
                        <div className="text-xs text-gray-500 mt-1">{b.paymentStatus || 'PENDING'}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            color: getStatusStyle(b.bookingStatus).color,
                            backgroundColor: getStatusStyle(b.bookingStatus).bg
                          }}
                        >
                          {b.bookingStatus}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleViewDetail(b); }}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                title="View Details"
                            >
                                <FaEye size={16} className="text-blue-600" />
                            </button>

                            {can("BOOKING_DELETE") && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteBooking(b._id); }}
                                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Booking"
                                >
                                    <Trash2 size={16} className="text-red-600" />
                                </button>
                            )}
                        </div>
                      </td>
                    </tr>
                    {expandedRows[b._id] && (
                      <tr className="bg-gray-50">
                        <td colSpan="9" className="p-6">
                          <div className="grid grid-cols-3 gap-6">
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase">Trip Details</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-xs text-gray-500">Pickup Time:</span>
                                  <span className="text-xs font-medium text-gray-900">{b.pickupTime || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-gray-500">Pickup Date:</span>
                                  <span className="text-xs font-medium text-gray-900">{new Date(b.pickupDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-gray-500">Distance:</span>
                                  <span className="text-xs font-medium text-gray-900">{b.estimatedDistanceKm} km</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase">Payment Info</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-xs text-gray-500">Method:</span>
                                  <span className="text-xs font-medium text-gray-900">{b.paymentMethod}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-gray-500">Status:</span>
                                  <span className="text-xs font-medium text-gray-900">{b.paymentStatus}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-gray-500">Fare:</span>
                                  <span className="text-xs font-medium text-green-600">₹{b.fareEstimate}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase">OTP Info</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-xs text-gray-500">Start OTP:</span>
                                  <span className="text-xs font-mono font-bold text-blue-600">{b.tripData?.startOtp || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-gray-500">Started At:</span>
                                  <span className="text-xs font-medium text-gray-900">{b.tripData?.startedAt ? new Date(b.tripData.startedAt).toLocaleString() : 'Not started'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-gray-500">Ended At:</span>
                                  <span className="text-xs font-medium text-gray-900">{b.tripData?.endedAt ? new Date(b.tripData.endedAt).toLocaleString() : 'Not ended'}</span>
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
                Showing {filteredBookings.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filteredBookings.length)} of {filteredBookings.length}
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
          {['all', 'status', 'payment', 'trends', 'distribution'].map((type) => (
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
          {/* Chart 1: Booking Status Distribution */}
          {(selectedChart === 'all' || selectedChart === 'status') && (
            <ChartCard title="Booking Status" subtitle="Distribution by status" icon={PieChartIcon}>
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
              <div className="flex justify-center gap-6 mt-4 flex-wrap">
                {statusData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}

          {/* Chart 2: Payment Methods */}
          {(selectedChart === 'all' || selectedChart === 'payment') && (
            <ChartCard title="Payment Methods" subtitle="Distribution by payment type" icon={Target}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {paymentData.map((entry, index) => (
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
            <ChartCard title="Weekly Trend" subtitle="Daily bookings and revenue" icon={TrendingUp}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="count" stroke={CHART_COLORS.blue} strokeWidth={2} name="Bookings" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke={CHART_COLORS.green} strokeWidth={2} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 4: Monthly Trend */}
          {(selectedChart === 'all' || selectedChart === 'trends') && (
            <ChartCard title="Monthly Trend" subtitle="Weekly bookings and revenue" icon={BarChart3}>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="week" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value) => typeof value === 'number' ? (value > 100 ? `₹${value.toLocaleString('en-IN')}` : value) : value} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="bookings" fill={CHART_COLORS.blue} radius={[8, 8, 0, 0]} name="Bookings" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke={CHART_COLORS.orange} name="Revenue" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 5: Ride Type Distribution */}
          {(selectedChart === 'all' || selectedChart === 'distribution') && (
            <ChartCard title="Ride Type Distribution" subtitle="Private vs Shared" icon={Users}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rideTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill={CHART_COLORS.purple} radius={[8, 8, 0, 0]} name="Bookings" />
                  <Bar dataKey="revenue" fill={CHART_COLORS.green} radius={[8, 8, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 6: Hourly Distribution */}
          {(selectedChart === 'all' || selectedChart === 'distribution') && (
            <ChartCard title="Hourly Distribution" subtitle="Peak hours analysis" icon={Clock}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="hour" interval={3} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Area yAxisId="left" type="monotone" dataKey="count" stroke={CHART_COLORS.blue} fill={CHART_COLORS.blue} fillOpacity={0.2} name="Bookings" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke={CHART_COLORS.orange} name="Revenue" strokeWidth={2} />
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

          {/* Chart 9: Fare Distribution */}
          {(selectedChart === 'all' || selectedChart === 'trends') && (
            <ChartCard title="Fare Distribution" subtitle="Booking amounts" icon={Target}>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" dataKey="x" name="Index" />
                  <YAxis type="number" dataKey="y" name="Fare" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Bookings" data={fareData}>
                    {fareData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        entry.status === 'completed' ? CHART_COLORS.green :
                          entry.status === 'pending' ? CHART_COLORS.yellow :
                            entry.status === 'ongoing' ? CHART_COLORS.blue :
                              CHART_COLORS.red
                      } />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 10: Seats Distribution */}
          {(selectedChart === 'all' || selectedChart === 'distribution') && (
            <ChartCard title="Seats Distribution" subtitle="Bookings by seat count" icon={Users}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={seatsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="seats" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={CHART_COLORS.teal} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>

        {/* Tab Controls */}

      </div>
    </div>
  );
}