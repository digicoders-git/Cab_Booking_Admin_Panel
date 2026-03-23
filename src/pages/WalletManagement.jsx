import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import {
  getAdminWallet,
  getAllTransactions,
  getPendingPayouts,
  approvePayout,
  rejectPayout,
  updateFleetWallet
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
  Clock, Calendar, Eye, ArrowUpCircle, ArrowDownCircle, Users
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
  const { currentFont } = useFont();

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
  const rowsPerPage = 10;

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
      if (res.success) setAdminWallet(res.wallet || { balance: 0 });
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
    const totalCredits = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalDebits = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + (t.amount || 0), 0);
    const pendingAmount = pendingPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);
    const completedCount = transactions.filter(t => t.status?.toLowerCase() === 'completed').length;
    const pendingCount = transactions.filter(t => t.status?.toLowerCase() === 'pending').length;

    return {
      balance: adminWallet.balance || 0,
      totalCredits,
      totalDebits,
      netFlow: totalCredits - totalDebits,
      pendingAmount,
      pendingCount,
      completedCount,
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
    const credits = dayTransactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + (t.amount || 0), 0);
    const debits = dayTransactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + (t.amount || 0), 0);
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
           <input id="sw-id" placeholder="Entity (Fleet/Driver/Agent) ID" class="swal2-input !mx-0 !w-full !rounded-xl text-sm">
           <input id="sw-amt" type="number" placeholder="Adjustment Amount (₹)" class="swal2-input !mx-0 !w-full !rounded-xl text-sm">
           <select id="sw-type" class="swal2-input !mx-0 !w-full !rounded-xl text-sm">
             <option value="credit">Credit (Increase Balance)</option>
             <option value="debit">Debit (Deduct Balance)</option>
           </select>
         </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Commit Link",
      background: themeColors.surface,
      color: themeColors.text,
      preConfirm: () => [
        document.getElementById('sw-id').value,
        document.getElementById('sw-amt').value,
        document.getElementById('sw-type').value
      ]
    });

    if (formValues) {
      const [id, amt, type] = formValues;
      if (!id || !amt) return Swal.fire({ icon: "warning", title: "Incomplete", text: "All fields required", background: themeColors.surface, color: themeColors.text });
      try {
        const res = await updateFleetWallet(id, amt, type);
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

  const filteredData = useMemo(() => {
    let list = [];
    if (activeTab === "payouts") {
      list = pendingPayouts;
    } else if (activeTab === "completed") {
      list = transactions.filter(t => t.status?.toLowerCase() === "completed");
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
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery]);

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
              <button
                onClick={handleManualUpdate}
                className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center space-x-1 sm:space-x-2 shadow-lg"
              >
                <FaPlus size={18} />
                <span className="hidden sm:inline">Manual Entry</span>
                <span className="sm:hidden text-xs">Entry</span>
              </button>
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
          <StatCard icon={FaWallet} label="Vault Liquidity" value={`₹${stats.balance.toLocaleString('en-IN')}`} color="blue" trend={8} subtitle="Current balance" />
          <StatCard icon={ArrowUpCircle} label="Total Credits" value={`₹${stats.totalCredits.toLocaleString('en-IN')}`} color="green" trend={12} subtitle="Inflow" />
          <StatCard icon={ArrowDownCircle} label="Total Debits" value={`₹${stats.totalDebits.toLocaleString('en-IN')}`} color="red" trend={-5} subtitle="Outflow" />
          <StatCard icon={Clock} label="Pending Payouts" value={stats.pendingCount} color="orange" trend={3} subtitle={`₹${stats.pendingAmount.toLocaleString('en-IN')}`} />
          <StatCard icon={Activity} label="Net Flow" value={`₹${stats.netFlow.toLocaleString('en-IN')}`} color="purple" trend={stats.netFlow > 0 ? 10 : -10} subtitle={stats.netFlow > 0 ? 'Positive' : 'Negative'} />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-2 border-b border-gray-200 flex items-center gap-6">
            {[
              { id: "all", label: "Audit History", icon: FaHistory },
              { id: "payouts", label: "Payout Queue", icon: Clock, count: stats.totalPayouts },
              { id: "completed", label: "Settled Logs", icon: FaCheckCircle, count: stats.completedCount }
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
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Principal Entity</th>
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
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${t.type === 'credit'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                          }`}>
                          {t.type === 'credit' ? <FaArrowDown size={10} /> : <FaArrowUp size={10} />}
                          {t.type || t.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                            <FaBuilding size={14} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{t.user?.name || t.recipient?.name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500">{t.userModel || t.recipientModel || 'System'}</p>
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
                        <span className={`text-sm font-bold ${t.type === 'credit' ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {t.type === 'credit' ? '+' : '-'}₹{t.amount?.toLocaleString('en-IN')}
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
                            <button
                              onClick={(e) => { e.stopPropagation(); handleApprove(t._id); }}
                              className="p-1.5 hover:bg-green-100 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <FaCheckCircle size={16} className="text-green-600" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleReject(t._id); }}
                              className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <FaTimesCircle size={16} className="text-red-600" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                    {expandedRows[t._id] && (
                      <tr className="bg-gray-50">
                        <td colSpan={activeTab === "payouts" ? 7 : 6} className="p-6">
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
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaChevronLeft size={16} />
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
                <FaChevronRight size={16} />
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

        {/* Tab Controls */}

      </div>
    </div>
  );
}