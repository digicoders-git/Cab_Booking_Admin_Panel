import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useFont } from "../context/FontContext";
import {
  getAdminWallet,
  getAllTransactions,
  getPendingPayouts,
  approvePayout,
  rejectPayout,
  addManualBalance,
  getCustomerStatement
} from "../apis/wallet";
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
  FaWallet, FaHistory, FaCheckCircle, FaTimesCircle, FaExchangeAlt,
  FaArrowUp, FaArrowDown, FaBuilding, FaSearch, FaSyncAlt, FaRegClock,
  FaCircle, FaSearchDollar, FaPlus, FaChevronLeft, FaChevronRight, FaLandmark, FaFileInvoiceDollar,
  FaChartPie, FaChartBar, FaChartLine, FaChartArea
} from "react-icons/fa";
import {
  Download, Filter, TrendingUp, Activity, DollarSign, CreditCard,
  PieChart as PieChartIcon, BarChart3, LineChart as LineChartIcon,
  Target, Gauge, Zap, Shield, MoreVertical, DownloadCloud, Printer,
  Clock, Calendar, Eye, ArrowUpCircle, ArrowDownCircle, Users,
  X, ExternalLink, FileText, CheckCircle2, AlertCircle, RefreshCw, UserCheck, Phone, Mail, User as UserIcon
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

export default function WalletManagement() {
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

  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [adminWallet, setAdminWallet] = useState({ balance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState('month');
  const [selectedChart, setSelectedChart] = useState('all');
  const [expandedRows, setExpandedRows] = useState({});
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Customer Statement Modal States (Point 27)
  const [selectedUserForStatement, setSelectedUserForStatement] = useState(null);
  const [customerStatementLoading, setCustomerStatementLoading] = useState(false);
  const [customerStatementData, setCustomerStatementData] = useState(null);
  const [customerStatementFilter, setCustomerStatementFilter] = useState("all");
  const [customerStatementSearch, setCustomerStatementSearch] = useState("");

  const textColorSecondary = useMemo(() => {
    if (theme === "dark") return "rgba(255, 255, 255, 0.6)";
    return themeColors.textSecondary || "rgba(107, 114, 128, 1)";
  }, [theme, themeColors]);

  const borderColor = useMemo(() => {
    return themeColors.border || (theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)");
  }, [theme, themeColors]);

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    setLoading(true);
    await Promise.all([fetchWallet(), fetchPayouts(), fetchTransactions()]);
    setLoading(false);
  };

  const fetchWallet = async () => {
    try {
      const res = await getAdminWallet();
      if (res.success) setAdminWallet({ balance: res.walletBalance || 0 });
    } catch (err) { console.error(err); }
  };

  const fetchPayouts = async () => {
    try {
      setFetching(true);
      const res = await getPendingPayouts();
      if (res.success) setPendingPayouts(res.payouts || []);
    } catch (err) { console.error(err); }
    finally { setFetching(false); }
  };

  const fetchTransactions = async () => {
    try {
      setFetching(true);
      const res = await getAllTransactions();
      const fetched = res.transactions || [];
      const sorted = [...fetched].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setTransactions(sorted);
    } catch (err) { console.error(err); }
    finally { setFetching(false); }
  };

  // Advanced Statistics
  const stats = useMemo(() => {
    const totalCredits = transactions.filter(t => t.type?.toLowerCase() === 'credit').reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalDebits = transactions.filter(t => t.type?.toLowerCase() === 'debit').reduce((sum, t) => sum + (t.amount || 0), 0);
    const pendingAmount = pendingPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);
    const completedCount = transactions.filter(t => t.status?.toLowerCase() === 'completed').length;
    const pendingCount = transactions.filter(t => t.status?.toLowerCase() === 'pending').length;
    const manualCount = transactions.filter(t => t.description?.toLowerCase().includes("manual credit by admin") || t.category?.toLowerCase().includes("manual")).length;

    return {
      balance: adminWallet.balance || 0,
      totalCredits,
      totalDebits,
      netFlow: totalCredits - totalDebits,
      pendingAmount,
      pendingCount,
      completedCount,
      manualCount,
      totalTransactions: transactions.length,
      totalPayouts: pendingPayouts.length
    };
  }, [adminWallet, transactions, pendingPayouts]);

  // Chart 1: Balance Overview - Pie Chart
  const balanceData = [
    { name: 'Current Balance', value: stats.balance, color: CHART_COLORS.green },
    { name: 'Pending Payouts', value: stats.pendingAmount, color: CHART_COLORS.orange },
    { name: 'Total Credits', value: stats.totalCredits - stats.balance, color: CHART_COLORS.blue }
  ].filter(item => item.value > 0);

  // Chart 2: Transaction Types - Pie Chart
  const transactionTypeData = [
    { name: 'Credits', value: stats.totalCredits, color: CHART_COLORS.green },
    { name: 'Debits', value: stats.totalDebits, color: CHART_COLORS.red }
  ].filter(item => item.value > 0);

  // Chart 3: Status Distribution - Pie Chart
  const statusData = [
    { name: 'Completed', value: stats.completedCount, color: CHART_COLORS.green },
    { name: 'Pending', value: stats.pendingCount, color: CHART_COLORS.orange }
  ].filter(item => item.value > 0);

  // Chart 4: Weekly Transaction Trend - Line Chart
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayTransactions = transactions.filter(t =>
      new Date(t.createdAt).toDateString() === date.toDateString()
    );
    const credits = dayTransactions.filter(t => t.type?.toLowerCase() === 'credit').reduce((sum, t) => sum + (t.amount || 0), 0);
    const debits = dayTransactions.filter(t => t.type?.toLowerCase() === 'debit').reduce((sum, t) => sum + (t.amount || 0), 0);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      credits,
      debits,
      net: credits - debits
    };
  }).reverse();

  // Chart 5: Monthly Trend - Bar Chart
  const monthlyData = useMemo(() => {
    const monthMap = {};
    const now = new Date();
    
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthMap[monthKey] = 0;
    }
    
    // Group transactions by month
    transactions.forEach(t => {
      const tDate = new Date(t.createdAt);
      const monthKey = tDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (monthMap.hasOwnProperty(monthKey)) {
        monthMap[monthKey] += t.amount || 0;
      }
    });
    
    return Object.entries(monthMap).map(([month, amount]) => ({
      month,
      amount
    }));
  }, [transactions]);

  // Chart 6: Transaction by User Type - Bar Chart
  const userTypeData = transactions.reduce((acc, t) => {
    const type = t.userModel || t.recipientModel || 'System';
    const existing = acc.find(item => item.name === type);
    if (existing) {
      existing.count++;
      existing.amount += t.amount || 0;
    } else {
      acc.push({ name: type, count: 1, amount: t.amount || 0 });
    }
    return acc;
  }, []);

  // Chart 7: Hourly Distribution - Area Chart
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0') + ':00';
    const hourTransactions = transactions.filter(t =>
      new Date(t.createdAt).getHours() === i
    );
    const amount = hourTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    return { hour, amount, count: hourTransactions.length };
  });

  // Chart 8: Performance Radar
  const radarData = [
    { metric: 'Balance', value: Math.min((stats.balance / 100000) * 100 || 0, 100), fullMark: 100 },
    { metric: 'Credits', value: Math.min((stats.totalCredits / 100000) * 100 || 0, 100), fullMark: 100 },
    { metric: 'Debits', value: Math.min((stats.totalDebits / 100000) * 100 || 0, 100), fullMark: 100 },
    { metric: 'Transactions', value: Math.min((stats.totalTransactions / 100) * 100 || 0, 100), fullMark: 100 }
  ];

  // Chart 9: Radial Progress
  const radialData = [
    { name: 'Balance', value: Math.min((stats.balance / 100000) * 100 || 0, 100), fill: CHART_COLORS.green },
    { name: 'Credits', value: Math.min((stats.totalCredits / 100000) * 100 || 0, 100), fill: CHART_COLORS.blue },
    { name: 'Debits', value: Math.min((stats.totalDebits / 100000) * 100 || 0, 100), fill: CHART_COLORS.red }
  ];

  // Chart 10: Transaction Scatter
  const scatterData = transactions.map((t, i) => ({
    x: i,
    y: t.amount || 0,
    type: t.type,
    status: t.status
  }));

  const handleApprove = async (id) => {
    const res = await Swal.fire({
      title: "Confirm Disbursal?",
      text: "Fund transfer will be initiated to the entity's linked account.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: themeColors.primary,
      confirmButtonText: "Authorise Transfer",
      background: themeColors.surface,
      color: themeColors.text
    });

    if (res.isConfirmed) {
      try {
        const resp = await approvePayout(id);
        if (resp.success) {
          Swal.fire({ icon: "success", title: "Dispatched", timer: 1500, showConfirmButton: false, background: themeColors.surface, color: themeColors.text });
          initData();
        }
      } catch (err) {
        Swal.fire({ icon: "error", title: "Error", text: err?.response?.data?.message || "Protocol Error", background: themeColors.surface, color: themeColors.text });
      }
    }
  };

  const handleReject = async (id) => {
    const { value: reason } = await Swal.fire({
      title: "Reverse Transaction",
      input: "text",
      inputLabel: "Rejection Reason",
      inputPlaceholder: "Verification failed...",
      showCancelButton: true,
      confirmButtonColor: themeColors.danger,
      background: themeColors.surface,
      color: themeColors.text
    });

    if (reason) {
      try {
        const resp = await rejectPayout(id, reason);
        if (resp.success) {
          Swal.fire({ icon: "success", title: "Reversed", timer: 1500, showConfirmButton: false, background: themeColors.surface, color: themeColors.text });
          initData();
        }
      } catch (err) {
        Swal.fire({ icon: "error", title: "Error", text: err?.response?.data?.message || "Protocol Error", background: themeColors.surface, color: themeColors.text });
      }
    }
  };

  const handleManualUpdate = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Manual Ledger Entry",
      html:
        `<div class="flex flex-col gap-3 py-2">
           <select id="sw-model" class="swal2-input !mx-0 !w-full !rounded-xl text-sm">
             <option value="Driver">Driver</option>
             <option value="User">User</option>
             <option value="Agent">Agent</option>
             <option value="Fleet">Fleet</option>
           </select>
           <input id="sw-id" placeholder="Email, Phone, or ID" class="swal2-input !mx-0 !w-full !rounded-xl text-sm">
           <input id="sw-amt" type="number" placeholder="Adjustment Amount (₹)" class="swal2-input !mx-0 !w-full !rounded-xl text-sm">
           <select id="sw-type" class="swal2-input !mx-0 !w-full !rounded-xl text-sm">
             <option value="credit">Credit (Increase Balance)</option>
             <option value="debit">Debit (Deduct Balance)</option>
           </select>
           <input id="sw-desc" placeholder="Description (Optional)" class="swal2-input !mx-0 !w-full !rounded-xl text-sm">
         </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Commit Link",
      background: themeColors.surface,
      color: themeColors.text,
      preConfirm: () => [
        document.getElementById('sw-model').value,
        document.getElementById('sw-id').value,
        document.getElementById('sw-amt').value,
        document.getElementById('sw-type').value,
        document.getElementById('sw-desc').value
      ]
    });

    if (formValues) {
      const [model, id, amt, type, desc] = formValues;
      if (!id || !amt || !model) return Swal.fire({ icon: "warning", title: "Incomplete", text: "All fields required", background: themeColors.surface, color: themeColors.text });
      
      const adjustedAmt = type === 'credit' ? Math.abs(Number(amt)) : -Math.abs(Number(amt));

      try {
        const res = await addManualBalance(id, model, adjustedAmt, desc);
        if (res.success) {
          Swal.fire({ icon: "success", title: "Synchronised", timer: 1500, showConfirmButton: false, background: themeColors.surface, color: themeColors.text });
          initData();
        }
      } catch (err) {
        Swal.fire({ icon: "error", title: "Sync Failed", text: err?.response?.data?.message || "Internal Error", background: themeColors.surface, color: themeColors.text });
      }
    }
  };

  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleOpenCustomerStatement = async (entityUser, entityModel, fallbackName) => {
    const userId = entityUser?._id || entityUser?.id || (typeof entityUser === 'string' ? entityUser : null);
    if (!userId) {
      Swal.fire({
        icon: "info",
        title: "No User Account ID",
        text: `This transaction is associated with: ${fallbackName || 'System'}. No linked user profile ID found.`,
        background: themeColors.surface,
        color: themeColors.text
      });
      return;
    }

    setSelectedUserForStatement({
      id: userId,
      name: entityUser?.name || fallbackName || "Customer",
      phone: entityUser?.phone || "",
      email: entityUser?.email || "",
      image: entityUser?.image || null,
      userModel: entityModel || "User"
    });
    setCustomerStatementLoading(true);
    setCustomerStatementFilter("all");
    setCustomerStatementSearch("");

    try {
      const res = await getCustomerStatement(userId, entityModel);
      if (res?.success) {
        setCustomerStatementData(res);
      } else {
        throw new Error(res?.message || "Failed to fetch statement");
      }
    } catch (err) {
      console.error("Failed to load customer statement:", err);
      // Fallback: calculate from already loaded transactions
      const userTx = transactions.filter(t => (
        (t.user?._id === userId || t.user === userId || t.recipient?._id === userId || t.recipient === userId)
      ));
      let cred = 0, deb = 0, pend = 0;
      userTx.forEach(t => {
        const a = Number(t.amount) || 0;
        if (t.status?.toLowerCase() === 'pending') pend += a;
        else if (t.type?.toLowerCase() === 'credit') cred += a;
        else if (t.type?.toLowerCase() === 'debit') deb += a;
      });
      setCustomerStatementData({
        success: true,
        user: entityUser,
        stats: {
          walletBalance: entityUser?.walletBalance !== undefined ? entityUser.walletBalance : (cred - deb),
          pendingAmount: pend,
          totalCredit: cred,
          totalDebit: deb,
          totalTransactions: userTx.length
        },
        transactions: userTx
      });
    } finally {
      setCustomerStatementLoading(false);
    }
  };

  const filteredCustomerTransactions = useMemo(() => {
    if (!customerStatementData?.transactions) return [];
    let list = customerStatementData.transactions;

    if (customerStatementFilter === "credit") {
      list = list.filter(t => t.type?.toLowerCase() === "credit");
    } else if (customerStatementFilter === "debit") {
      list = list.filter(t => t.type?.toLowerCase() === "debit");
    } else if (customerStatementFilter === "pending") {
      list = list.filter(t => t.status?.toLowerCase() === "pending");
    }

    if (customerStatementSearch.trim()) {
      const q = customerStatementSearch.toLowerCase();
      list = list.filter(t =>
        t._id?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q) ||
        t.status?.toLowerCase().includes(q) ||
        String(t.amount)?.includes(q) ||
        t.relatedBooking?.bookingId?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [customerStatementData, customerStatementFilter, customerStatementSearch]);

  const filteredData = useMemo(() => {
    let list = [];
    if (activeTab === "payouts") {
      list = pendingPayouts;
    } else if (activeTab === "completed") {
      list = transactions.filter(t => t.status?.toLowerCase() === "completed");
    } else if (activeTab === "manual") {
      list = transactions.filter(t => t.description?.toLowerCase().includes("manual credit by admin") || t.category?.toLowerCase().includes("manual"));
    } else if (activeTab === "admin_only") {
      list = transactions.filter(t => t.userModel === "Admin" || t.recipientModel === "Admin");
    } else {
      list = transactions;
    }

    return list.filter(t =>
      t._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.recipient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transactions, pendingPayouts, activeTab, searchQuery]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery, rowsPerPage]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mt-8 z-50">
        <div className="px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-base sm:text-2xl font-bold text-gray-900">Wallet Command Center</h1>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Refresh */}
              <button
                onClick={initData}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FaSyncAlt size={18} className={fetching ? 'animate-spin' : ''} />
              </button>

              {/* Manual Entry */}
              {can('FLEET_WALLET') && (
                <button
                  onClick={handleManualUpdate}
                  className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center space-x-1 sm:space-x-2 shadow-lg"
                >
                  <FaPlus size={18} />
                  <span className="hidden sm:inline">Manual Entry</span>
                  <span className="sm:hidden text-xs">Entry</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg col-span-2"
              />
              <select className="px-3 py-2 border border-gray-300 rounded-lg">
                <option>All Types</option>
                <option>Credits Only</option>
                <option>Debits Only</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded-lg">
                <option>Sort By</option>
                <option>Newest First</option>
                <option>Largest Amount</option>
                <option>Smallest Amount</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          <StatCard icon={FaWallet} label="Admin Net Wallet Money" value={`₹${stats.balance.toLocaleString('en-IN')}`} color="blue" trend={8} subtitle="Total platform balance" />
          <StatCard icon={ArrowUpCircle} label="Total Credits" value={`₹${stats.totalCredits.toLocaleString('en-IN')}`} color="green" trend={12} subtitle="Inflow" />
          <StatCard icon={ArrowDownCircle} label="Total Debits" value={`₹${stats.totalDebits.toLocaleString('en-IN')}`} color="red" trend={-5} subtitle="Outflow" />
          <StatCard icon={Clock} label="Pending Payouts" value={stats.pendingCount} color="orange" trend={3} subtitle={`₹${stats.pendingAmount.toLocaleString('en-IN')}`} />
          <StatCard icon={Activity} label="Net Flow" value={`₹${stats.netFlow.toLocaleString('en-IN')}`} color="purple" trend={stats.netFlow > 0 ? 10 : -10} subtitle={stats.netFlow > 0 ? 'Positive' : 'Negative'} />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-2 border-b border-gray-200 flex items-center gap-6">
            {[
              { id: "all", label: "Audit History", icon: FaHistory },
              { id: "admin_only", label: "Admin Transactions", icon: FaBuilding },
              { id: "payouts", label: "Payout Queue", icon: Clock, count: stats.totalPayouts },
              { id: "completed", label: "Settled Logs", icon: FaCheckCircle, count: stats.completedCount },
              { id: "manual", label: "Manual Credits", icon: FaExchangeAlt, count: stats.manualCount }
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

          {/* Transaction Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Trace Ref</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Customer / Entity</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Details</th>
                  <th className="text-right py-4 px-6 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase">Status</th>
                  {activeTab === "payouts" && (
                    <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedData.map((t) => (
                  <React.Fragment key={t._id}>
                    <tr
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggleRowExpansion(t._id)}
                    >
                      <td className="py-4 px-6">
                        <span className="text-xs font-mono text-gray-500">#{t._id?.slice(-8).toUpperCase()}</span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                            <Clock size={13} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-900">
                              {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                            </p>
                            <p className="text-[11px] font-medium text-gray-500">
                              {t.createdAt ? new Date(t.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${t.type?.toLowerCase() === 'credit'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                          }`}>
                          {t.type?.toLowerCase() === 'credit' ? <FaArrowDown size={10} /> : <FaArrowUp size={10} />}
                          {t.type || t.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
                            {t.user?.image ? (
                              <img 
                                src={`${IMAGE_BASE_URL}${t.user?.image}`} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.parentElement.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" size="14" class="text-blue-600" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><path d="M432 448V72c0-13.255-10.745-24-24-24H256c-13.255 0-24 10.745-24 24v376H40c-13.255 0-24 10.745-24 24v40h416v-40c0-13.255-10.745-24-24-24zM160 448H64V96h96v352zm112-256h64v64h-64v-64zm0 128h64v64h-64v-64z"></path></svg>'; }}
                              />
                            ) : (
                              <FaBuilding size={14} className="text-blue-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCustomerStatement(
                                  t.user || t.recipient,
                                  t.userModel || t.recipientModel,
                                  t.user?.name || t.recipient?.name
                                );
                              }}
                              className="group text-left flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                              title="Click to view Customer Transaction Ledger & Wallet details"
                            >
                              <span className="truncate max-w-[140px] sm:max-w-[190px] group-hover:underline">
                                {t.user?.name || t.recipient?.name || 'Anonymous'}
                              </span>
                              <ExternalLink size={12} className="opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-blue-600 shrink-0" />
                            </button>
                            <p className="text-xs text-gray-500 truncate">
                              {t.user?.phone || t.recipient?.phone ? `${t.user?.phone || t.recipient?.phone} • ` : ''}
                              <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded bg-gray-100 text-gray-600">
                                {t.userModel || t.recipientModel || 'System'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {activeTab === "payouts" ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-900">{t.bankDetails?.bankName || 'Unknown Bank'}</span>
                            <span className="text-xs text-gray-500">A/C: {t.bankDetails?.accountNumber || 'N/A'}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-600">{t.description || 'Administrative Settlement'}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`text-sm font-bold ${t.type?.toLowerCase() === 'credit' ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {t.type?.toLowerCase() === 'credit' ? '+' : '-'}₹{t.amount?.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.status?.toLowerCase() === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : t.status?.toLowerCase() === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                          }`}>
                          {t.status}
                        </span>
                      </td>
                      {activeTab === "payouts" && (
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {can('PAYOUT_APPROVE') && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleApprove(t._id); }}
                                className="p-1.5 hover:bg-green-100 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <FaCheckCircle size={16} className="text-green-600" />
                              </button>
                            )}
                            {can('PAYOUT_REJECT') && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleReject(t._id); }}
                                className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <FaTimesCircle size={16} className="text-red-600" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                    {expandedRows[t._id] && (
                      <tr className="bg-gray-50">
                        <td colSpan={activeTab === "payouts" ? 8 : 7} className="p-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase">Transaction Details</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-xs text-gray-500">Transaction ID:</span>
                                  <span className="text-xs font-medium text-gray-900">{t._id}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-gray-500">Created:</span>
                                  <span className="text-xs font-medium text-gray-900">{new Date(t.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-gray-500">Updated:</span>
                                  <span className="text-xs font-medium text-gray-900">{new Date(t.updatedAt).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase">Description</h4>
                              <p className="text-sm text-gray-900 bg-white p-4 rounded-lg border border-gray-200">
                                {t.description || 'No description provided'}
                              </p>
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
                Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length}
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
          {['all', 'balance', 'transactions', 'trends', 'distribution'].map((type) => (
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
          {/* Chart 1: Balance Overview */}
          {(selectedChart === 'all' || selectedChart === 'balance') && (
            <ChartCard title="Balance Overview" subtitle="Current balance distribution" icon={PieChartIcon}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={balanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {balanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                {balanceData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}

          {/* Chart 2: Transaction Types */}
          {(selectedChart === 'all' || selectedChart === 'transactions') && (
            <ChartCard title="Transaction Types" subtitle="Credit vs Debit" icon={Target}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={transactionTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {transactionTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 3: Status Distribution */}
          {(selectedChart === 'all' || selectedChart === 'transactions') && (
            <ChartCard title="Status Distribution" subtitle="Completed vs Pending" icon={Activity}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
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

          {/* Chart 4: Weekly Trend */}
          {(selectedChart === 'all' || selectedChart === 'trends') && (
            <ChartCard title="Weekly Trend" subtitle="Daily transaction volume" icon={TrendingUp}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="credits" stroke={CHART_COLORS.green} strokeWidth={2} name="Credits" />
                  <Line type="monotone" dataKey="debits" stroke={CHART_COLORS.red} strokeWidth={2} name="Debits" />
                  <Line type="monotone" dataKey="net" stroke={CHART_COLORS.blue} strokeWidth={2} name="Net" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 5: Monthly Trend */}
          {(selectedChart === 'all' || selectedChart === 'trends') && (
            <ChartCard title="Monthly Trend" subtitle="Weekly transaction amount" icon={BarChart3}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                  <Bar dataKey="amount" fill={CHART_COLORS.blue} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 6: User Type Distribution */}
          {(selectedChart === 'all' || selectedChart === 'distribution') && (
            <ChartCard title="User Type Distribution" subtitle="Transactions by entity" icon={Users}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={CHART_COLORS.purple} radius={[8, 8, 0, 0]} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 7: Hourly Distribution */}
          {(selectedChart === 'all' || selectedChart === 'distribution') && (
            <ChartCard title="Hourly Distribution" subtitle="Transactions by hour" icon={Clock}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="hour" interval={3} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Area yAxisId="left" type="monotone" dataKey="amount" stroke={CHART_COLORS.blue} fill={CHART_COLORS.blue} fillOpacity={0.2} name="Amount" />
                  <Line yAxisId="right" type="monotone" dataKey="count" stroke={CHART_COLORS.orange} name="Count" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 8: Performance Radar */}
          {(selectedChart === 'all' || selectedChart === 'balance') && (
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

          {/* Chart 9: Radial Progress */}
          {(selectedChart === 'all' || selectedChart === 'balance') && (
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

          {/* Chart 10: Transaction Scatter */}
          {(selectedChart === 'all' || selectedChart === 'transactions') && (
            <ChartCard title="Transaction Scatter" subtitle="Amount distribution" icon={Target}>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" dataKey="x" name="Index" />
                  <YAxis type="number" dataKey="y" name="Amount" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Transactions" data={scatterData}>
                    {scatterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.type === 'credit' ? CHART_COLORS.green : CHART_COLORS.red} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>

        {/* Customer Transaction Ledger & Statement Modal (Point 27) */}
        {selectedUserForStatement && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div
              className="bg-white rounded-2xl w-full max-w-5xl shadow-[0_25px_70px_rgba(0,0,0,0.5)] overflow-hidden my-auto max-h-[92vh] flex flex-col border border-gray-200 animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header Banner (Admin Panel Signature Theme) */}
              <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shrink-0 shadow-sm">
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenCustomerStatement(selectedUserForStatement, selectedUserForStatement.userModel, selectedUserForStatement.name)}
                    disabled={customerStatementLoading}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white cursor-pointer"
                    title="Refresh statement"
                  >
                    <RefreshCw size={16} className={customerStatementLoading ? "animate-spin text-indigo-300" : ""} />
                  </button>
                  <button
                    onClick={() => setSelectedUserForStatement(null)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white cursor-pointer"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 pr-16">
                  {/* User Profile Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl border-2 border-white/20 shadow-md overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
                      {selectedUserForStatement.image ? (
                        <img
                          src={`${IMAGE_BASE_URL}${selectedUserForStatement.image}`}
                          alt={selectedUserForStatement.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement.innerHTML = '<span class="text-xl font-bold text-white">' + (selectedUserForStatement.name?.[0]?.toUpperCase() || 'U') + '</span>';
                          }}
                        />
                      ) : (
                        <span className="text-xl font-bold text-white">
                          {selectedUserForStatement.name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                          {selectedUserForStatement.name}
                        </h2>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          {selectedUserForStatement.userModel || "Customer"}
                        </span>
                      </div>

                      <p className="text-xs text-indigo-200/70 font-mono mt-0.5">
                        Account ID: #{selectedUserForStatement.id}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-white/80">
                        {selectedUserForStatement.phone && (
                          <a href={`tel:${selectedUserForStatement.phone}`} className="flex items-center gap-1.5 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg">
                            <Phone size={12} className="text-indigo-300" />
                            <span>{selectedUserForStatement.phone}</span>
                          </a>
                        )}
                        {selectedUserForStatement.email && (
                          <a href={`mailto:${selectedUserForStatement.email}`} className="flex items-center gap-1.5 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg">
                            <Mail size={12} className="text-indigo-300" />
                            <span>{selectedUserForStatement.email}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 bg-slate-50/70 overflow-y-auto space-y-6 flex-1">
                {customerStatementLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-semibold text-gray-600">
                      Fetching customer transaction ledger and balance...
                    </p>
                  </div>
                ) : (
                  <>
                    {/* KPI Summary Cards Grid (Balance, Pending, Total Credits, Total Debits) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* 1. Wallet Balance (+ / -) */}
                      <div
                        className={`bg-white rounded-2xl p-4 shadow-sm border-2 transition-all ${
                          (customerStatementData?.stats?.walletBalance ?? 0) >= 0
                            ? "border-emerald-500/40 hover:border-emerald-500"
                            : "border-rose-500/40 hover:border-rose-500"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                            Current Wallet
                          </span>
                          <div className={`p-2.5 rounded-xl ${
                            (customerStatementData?.stats?.walletBalance ?? 0) >= 0
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-rose-50 text-rose-600"
                          }`}>
                            <FaWallet size={16} />
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className={`text-2xl sm:text-3xl font-black ${
                            (customerStatementData?.stats?.walletBalance ?? 0) >= 0
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}>
                            {(customerStatementData?.stats?.walletBalance ?? 0) >= 0 ? "+" : "-"}₹{Math.abs(customerStatementData?.stats?.walletBalance ?? 0).toLocaleString('en-IN')}
                          </p>
                          <p className="text-[11px] font-semibold mt-0.5 text-gray-500">
                            {(customerStatementData?.stats?.walletBalance ?? 0) >= 0
                              ? "Active Wallet Balance"
                              : "Payment Due / Overdue Debt"}
                          </p>
                        </div>
                      </div>

                      {/* 2. Pending Amount */}
                      <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-200/80 hover:border-amber-400 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                            Pending Dues / Hold
                          </span>
                          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                            <Clock size={16} />
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-2xl sm:text-3xl font-black text-amber-600">
                            ₹{(customerStatementData?.stats?.pendingAmount ?? 0).toLocaleString('en-IN')}
                          </p>
                          <p className="text-[11px] font-semibold mt-0.5 text-gray-500">
                            {(customerStatementData?.stats?.pendingAmount ?? 0) > 0
                              ? "Transactions under processing"
                              : "Zero pending dues"}
                          </p>
                        </div>
                      </div>

                      {/* 3. Total Credited (+) */}
                      <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-200/80 hover:border-blue-400 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                            Total Credited (+)
                          </span>
                          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                            <ArrowDownCircle size={16} />
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-2xl sm:text-3xl font-black text-blue-600">
                            +₹{(customerStatementData?.stats?.totalCredit ?? 0).toLocaleString('en-IN')}
                          </p>
                          <p className="text-[11px] font-semibold mt-0.5 text-gray-500">
                            Lifetime added / earned
                          </p>
                        </div>
                      </div>

                      {/* 4. Total Debited (-) */}
                      <div className="bg-white rounded-2xl p-4 shadow-sm border border-purple-200/80 hover:border-purple-400 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                            Total Debited (-)
                          </span>
                          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                            <ArrowUpCircle size={16} />
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-2xl sm:text-3xl font-black text-purple-600">
                            -₹{(customerStatementData?.stats?.totalDebit ?? 0).toLocaleString('en-IN')}
                          </p>
                          <p className="text-[11px] font-semibold mt-0.5 text-gray-500">
                            Lifetime spent / deducted
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Filter Bar & Search */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-gray-200 shadow-xs">
                      {/* Type Filter Tabs */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                          { id: 'all', label: `All (${customerStatementData?.transactions?.length || 0})` },
                          { id: 'credit', label: 'Credits (+)' },
                          { id: 'debit', label: 'Debits (-)' },
                          { id: 'pending', label: 'Pending' }
                        ].map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => setCustomerStatementFilter(tab.id)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              customerStatementFilter === tab.id
                                ? "bg-slate-900 text-white shadow-sm"
                                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Search Inside Customer Statement */}
                      <div className="relative min-w-[240px]">
                        <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search Ref, Category, Booking..."
                          value={customerStatementSearch}
                          onChange={(e) => setCustomerStatementSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                        />
                      </div>
                    </div>

                    {/* Customer Transactions Table */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
                      <div className="overflow-x-auto max-h-[380px]">
                        <table className="w-full text-left">
                          <thead className="sticky top-0 z-10 bg-slate-100/90 backdrop-blur-xs border-b border-gray-200">
                            <tr>
                              <th className="py-3.5 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Date & Time</th>
                              <th className="py-3.5 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Trace Ref</th>
                              <th className="py-3.5 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Type</th>
                              <th className="py-3.5 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Category / Reason</th>
                              <th className="py-3.5 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider text-right">Amount</th>
                              <th className="py-3.5 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider text-center">Status</th>
                              <th className="py-3.5 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Booking Ref</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {filteredCustomerTransactions.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="py-12 text-center text-gray-400 text-xs font-medium">
                                  No transactions found matching your criteria.
                                </td>
                              </tr>
                            ) : (
                              filteredCustomerTransactions.map((tx) => (
                                <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors bg-white">
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1 rounded-md bg-blue-50 text-blue-600 shrink-0">
                                        <Clock size={12} />
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold text-gray-900">
                                          {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                        </p>
                                        <p className="text-[10px] font-medium text-gray-500">
                                          {tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                                      #{tx._id?.slice(-8).toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold ${
                                      tx.type?.toLowerCase() === 'credit'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}>
                                      {tx.type?.toLowerCase() === 'credit' ? <FaArrowDown size={9} /> : <FaArrowUp size={9} />}
                                      {tx.type}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <p className="text-xs font-bold text-gray-900">
                                      {tx.category || tx.description || 'Adjustment'}
                                    </p>
                                    {tx.description && tx.description !== tx.category && (
                                      <p className="text-[11px] text-gray-500 truncate max-w-[220px]">
                                        {tx.description}
                                      </p>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right whitespace-nowrap">
                                    <span className={`text-sm font-black ${
                                      tx.type?.toLowerCase() === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                                    }`}>
                                      {tx.type?.toLowerCase() === 'credit' ? '+' : '-'}₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                      tx.status?.toLowerCase() === 'completed'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : tx.status?.toLowerCase() === 'pending'
                                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}>
                                      {tx.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    {tx.relatedBooking ? (
                                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                                        #{tx.relatedBooking.bookingId || tx.relatedBooking._id?.slice(-6)}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-400">—</span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between gap-4">
                <p className="text-xs font-medium text-gray-500">
                  Showing <span className="font-bold text-gray-900">{filteredCustomerTransactions.length}</span> of <span className="font-bold text-gray-900">{customerStatementData?.transactions?.length || 0}</span> customer transactions
                </p>
                <button
                  onClick={() => setSelectedUserForStatement(null)}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}