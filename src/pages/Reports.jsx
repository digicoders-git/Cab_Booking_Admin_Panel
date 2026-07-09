import React, { useState, useEffect } from 'react';
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
import { getFullReport as fetchReportAPI, exportTransactionsCSV } from '../apis/admin';
import {
  Download, RefreshCw, Filter, Calendar, DollarSign, TrendingUp,
  TrendingDown, Users, Car, CreditCard, Banknote, Wallet,
  PieChart as PieChartIcon, BarChart3, LineChart as LineChartIcon,
  FileText, Printer, Mail, Share2, Clock, CheckCircle,
  XCircle, AlertCircle, ArrowUp, ArrowDown, Percent,
  Award, Target, Activity, Gauge, Zap, Shield, Eye,
  DownloadCloud, FileSpreadsheet, Truck, HelpCircle,
  Briefcase, Home, Settings, User, Star, Heart,
  Globe, Map, Phone, Mail as MailIcon, MessageCircle,
  ChevronDown, ChevronUp, MoreVertical, Edit, Trash2
} from 'lucide-react';

const AdminReportPage = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last30days');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedRows, setExpandedRows] = useState({});

  // Colors for charts - Modern and clean palette
  const COLORS = {
    primary: '#2563EB',
    secondary: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
    purple: '#7C3AED',
    pink: '#DB2777',
    indigo: '#4F46E5',
    cyan: '#0891B2',
    orange: '#EA580C',
    teal: '#0D9488',
    blue: '#2563EB',
    green: '#16A34A',
    yellow: '#D97706',
    red: '#DC2626',
    violet: '#7C3AED',
    rose: '#E11D48',
    amber: '#D97706',
    emerald: '#059669',
    sky: '#0284C7',
    fuchsia: '#C026D3',
    gray: '#4B5563',
    lightGray: '#9CA3AF'
  };

  const CHART_COLORS = [
    COLORS.primary, COLORS.secondary, COLORS.warning, COLORS.danger,
    COLORS.purple, COLORS.pink, COLORS.indigo, COLORS.cyan,
    COLORS.orange, COLORS.teal, COLORS.blue, COLORS.green,
    COLORS.yellow, COLORS.red, COLORS.violet, COLORS.rose
  ];

  // Function to fetch report data
  const fetchFullReport = async () => {
    try {
      setLoading(true);
      const res = await fetchReportAPI();
      if (res.success) {
        setReportData(res.report);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFullReport();
  }, []);

  const [exportTimeframe, setExportTimeframe] = useState('monthly');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await exportTransactionsCSV(exportTimeframe);
      
      // Create a URL for the blob and trigger download
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions-${exportTimeframe}.csv`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting transactions:', error);
      alert('Failed to export transactions');
    } finally {
      setIsExporting(false);
    }
  };
  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-blue-600 border-t-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FileText className="text-blue-600" size={40} />
            </div>
          </div>
          <p className="text-gray-800 text-xl font-bold mt-8">Generating Report...</p>
          <p className="text-gray-500 text-center mt-2">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  const overview = reportData?.overview || {};
  const financials = reportData?.financials || {};
  const growth = reportData?.growth || {};
  const transactions = reportData?.recentTransactions || [];

  // Calculate derived metrics
  const totalRevenue = overview.totalRevenue || 0;
  const totalBookings = overview.totalBookings || 0;
  const completedRides = overview.completedRides || 0;
  const cancelledRides = overview.cancelledRides || 0;
  const cancellationRate = overview.cancellationRate || '0%';
  const totalAgentCommissions = financials.totalAgentCommissions || 0;
  const adminEarnings = financials.adminEarnings || 0;
  const newUsersLast30Days = growth.newUsersLast30Days || 0;
  const newDriversLast30Days = growth.newDriversLast30Days || 0;

  // Chart 1: Revenue Distribution - Donut Chart
  const revenueData = [
    { name: 'Admin Earnings', value: adminEarnings, color: COLORS.primary, icon: '💰' },
    { name: 'Agent Commissions', value: totalAgentCommissions, color: COLORS.secondary, icon: '🤝' }
  ].filter(item => item.value > 0);

  // Chart 2: Booking Performance - Bar Chart
  const bookingPerformanceData = [
    { name: 'Total Bookings', value: totalBookings, color: COLORS.primary },
    { name: 'Completed', value: completedRides, color: COLORS.secondary },
    { name: 'Cancelled', value: cancelledRides, color: COLORS.danger },
    { name: 'Pending', value: totalBookings - completedRides - cancelledRides, color: COLORS.warning }
  ];

  // Chart 3: Growth Trend - Line Chart (real data from API)
  const growthData = (() => {
    const weekMap = {};
    const now = new Date();

    // Last 4 weeks
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekLabel = `Week ${4 - i} (${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
      weekMap[weekLabel] = { users: 0, drivers: 0 };
    }

    // Distribute data across weeks based on transaction dates
    transactions.forEach(t => {
      const tDate = new Date(t.createdAt);
      const daysDiff = Math.floor((now - tDate) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(daysDiff / 7);

      if (weekIndex <= 3) {
        const weekNum = 4 - weekIndex;
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (weekIndex * 7));
        const weekLabel = `Week ${weekNum} (${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;

        if (weekMap.hasOwnProperty(weekLabel)) {
          if (t.userModel === 'Driver') weekMap[weekLabel].drivers += 1;
          else if (t.userModel === 'User') weekMap[weekLabel].users += 1;
        }
      }
    });

    return Object.entries(weekMap).map(([week, data]) => ({
      name: week,
      users: data.users,
      drivers: data.drivers
    })).reverse();
  })();

  // Chart 4: Transaction Timeline - Area Chart
  const transactionTimelineData = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.amount += transaction.amount || 0;
      existing.count += 1;
      if (transaction.type === 'Credit') existing.credits += transaction.amount || 0;
      if (transaction.type === 'Debit') existing.debits += transaction.amount || 0;
    } else {
      acc.push({
        date,
        amount: transaction.amount || 0,
        count: 1,
        credits: transaction.type === 'Credit' ? (transaction.amount || 0) : 0,
        debits: transaction.type === 'Debit' ? (transaction.amount || 0) : 0
      });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Chart 5: Transaction Type Distribution - Pie Chart
  const transactionTypeData = transactions.reduce((acc, transaction) => {
    const type = transaction.type || 'Unknown';
    const existing = acc.find(item => item.name === type);
    if (existing) {
      existing.value += 1;
      existing.amount += transaction.amount || 0;
    } else {
      acc.push({
        name: type,
        value: 1,
        amount: transaction.amount || 0,
        color: type === 'Credit' ? COLORS.secondary : COLORS.danger
      });
    }
    return acc;
  }, []);

  // Chart 6: Category Analysis - Bar Chart
  const categoryData = transactions.reduce((acc, transaction) => {
    let category = transaction.category || 'Other';
    // Normalize category names
    const categoryLower = category.toLowerCase().trim();
    if (categoryLower.includes('withdraw') || categoryLower === 'widrall') {
      category = 'Withdrawal';
    } else if (categoryLower.includes('commission') || categoryLower === 'commaistion') {
      category = 'Commission';
    } else if (categoryLower.includes('refund')) {
      category = 'Refund';
    } else if (categoryLower.includes('credit')) {
      category = 'Credit';
    } else if (categoryLower.includes('debit')) {
      category = 'Debit';
    }

    const existing = acc.find(item => item.name === category);
    if (existing) {
      existing.count += 1;
      existing.amount += transaction.amount || 0;
    } else {
      acc.push({
        name: category,
        count: 1,
        amount: transaction.amount || 0,
        color: CHART_COLORS[acc.length % CHART_COLORS.length]
      });
    }
    return acc;
  }, []).sort((a, b) => b.amount - a.amount);

  // Chart 7: Performance Radar - Radar Chart
  const performanceRadarData = [
    { metric: 'Revenue', value: (totalRevenue / 500) * 100, fullMark: 100 },
    { metric: 'Bookings', value: (totalBookings / 20) * 100, fullMark: 100 },
    { metric: 'Completion', value: (completedRides / totalBookings) * 100 || 0, fullMark: 100 },
    { metric: 'Users', value: (newUsersLast30Days / 100) * 100, fullMark: 100 },
    { metric: 'Drivers', value: (newDriversLast30Days / 20) * 100, fullMark: 100 }
  ];

  // Chart 8: Status Funnel - Funnel Chart
  const funnelData = [
    { value: totalBookings, name: 'Total Bookings', fill: COLORS.primary },
    { value: completedRides, name: 'Completed', fill: COLORS.secondary },
    { value: totalBookings - completedRides, name: 'Incomplete', fill: COLORS.warning },
    { value: cancelledRides, name: 'Cancelled', fill: COLORS.danger }
  ].filter(item => item.value > 0);

  // Chart 9: Financial Progress - Radial Bar
  const financialProgressData = [
    { name: 'Revenue', value: (totalRevenue / 1000) * 100, fill: COLORS.primary },
    { name: 'Admin Share', value: (adminEarnings / 500) * 100, fill: COLORS.secondary }
  ];

  // Chart 10: Transaction Scatter - Scatter Plot
  const scatterPlotData = transactions.map((t, index) => ({
    x: index + 1,
    y: t.amount || 0,
    name: t.category,
    type: t.type
  }));

  // Summary Statistics
  const summaryStats = [
    {
      title: 'Total Revenue',
      value: `₹${totalRevenue}`,
      change: '+15.3%',
      icon: DollarSign,
      color: 'blue',
      bg: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Total Bookings',
      value: totalBookings,
      change: '+8.2%',
      icon: Calendar,
      color: 'green',
      bg: 'from-green-500 to-green-600'
    },
    {
      title: 'Completed Rides',
      value: completedRides,
      change: `${((completedRides / totalBookings) * 100).toFixed(1)}%`,
      icon: CheckCircle,
      color: 'emerald',
      bg: 'from-emerald-500 to-emerald-600'
    },
    {
      title: 'Admin Earnings',
      value: `₹${adminEarnings}`,
      change: '+12.5%',
      icon: Wallet,
      color: 'purple',
      bg: 'from-purple-500 to-purple-600'
    },
    {
      title: 'New Users',
      value: newUsersLast30Days,
      change: '+24',
      icon: Users,
      color: 'orange',
      bg: 'from-orange-500 to-orange-600'
    },
    {
      title: 'New Drivers',
      value: newDriversLast30Days,
      change: '+5',
      icon: Car,
      color: 'pink',
      bg: 'from-pink-500 to-pink-600'
    }
  ];

  // Render Overview Tab Content
  const renderOverviewTab = () => (
    <>
      {/* Row 1: Revenue & Booking Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Revenue Distribution</h3>
              <p className="text-sm text-gray-500">Admin earnings vs agent commissions</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <PieChartIcon className="text-blue-600" size={20} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={revenueData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {revenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {revenueData.map((item, index) => (
                <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{item.value}</p>
                    <p className="text-xs text-gray-500">{((item.value / totalRevenue) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Booking Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Booking Performance</h3>
              <p className="text-sm text-gray-500">Booking status breakdown</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <BarChart3 className="text-green-600" size={20} />
            </div>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={bookingPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {bookingPerformanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-4 gap-2 mt-4 text-center">
            <div>
              <p className="text-xs text-gray-500">Success Rate</p>
              <p className="text-lg font-semibold text-gray-900">{((completedRides / totalBookings) * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Cancellation</p>
              <p className="text-lg font-semibold text-gray-900">{cancellationRate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-lg font-semibold text-gray-900">{totalBookings - completedRides - cancelledRides}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-lg font-semibold text-gray-900">{totalBookings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Growth Trend & Transaction Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Growth Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Growth Trend</h3>
              <p className="text-sm text-gray-500">User and driver growth (30 days)</p>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp className="text-purple-600" size={20} />
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="users"
                stroke={COLORS.primary}
                strokeWidth={2}
                dot={{ r: 4, fill: COLORS.primary }}
                name="New Users"
              />
              <Line
                type="monotone"
                dataKey="drivers"
                stroke={COLORS.secondary}
                strokeWidth={2}
                dot={{ r: 4, fill: COLORS.secondary }}
                name="New Drivers"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Transaction Timeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Transaction Timeline</h3>
              <p className="text-sm text-gray-500">Daily transaction volume</p>
            </div>
            <div className="p-2 bg-orange-50 rounded-lg">
              <Activity className="text-orange-600" size={20} />
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={transactionTimelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="credits"
                stackId="1"
                stroke={COLORS.secondary}
                fill={`${COLORS.secondary}20`}
                name="Credits"
              />
              <Area
                type="monotone"
                dataKey="debits"
                stackId="1"
                stroke={COLORS.danger}
                fill={`${COLORS.danger}20`}
                name="Debits"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Radar & Booking Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Performance Radar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Performance Radar</h3>
              <p className="text-sm text-gray-500">Multi-metric analysis</p>
            </div>
            <div className="p-2 bg-cyan-50 rounded-lg">
              <Gauge className="text-cyan-600" size={20} />
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <RadarChart outerRadius={90} data={performanceRadarData}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={30} />
              <Radar
                name="Performance"
                dataKey="value"
                stroke={COLORS.purple}
                fill={COLORS.purple}
                fillOpacity={0.3}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Funnel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Booking Funnel</h3>
              <p className="text-sm text-gray-500">Conversion journey</p>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg">
              <Zap className="text-amber-600" size={20} />
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <FunnelChart>
              <Tooltip />
              <Funnel dataKey="value" data={funnelData} isAnimationActive>
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );

  // Render Analytics Tab Content
  const renderAnalyticsTab = () => (
    <>
      {/* Transaction Types & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Transaction Types */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Transaction Types</h3>
              <p className="text-sm text-gray-500">Credit vs Debit distribution</p>
            </div>
            <div className="p-2 bg-pink-50 rounded-lg">
              <CreditCard className="text-pink-600" size={20} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={transactionTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={true}
                  >
                    {transactionTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} transactions`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {transactionTypeData.map((type, index) => (
                <div key={index} className="p-4 bg-gradient-to-r rounded-lg border-2 flex flex-col items-center justify-center text-center" style={{
                  backgroundColor: type.color + '15',
                  borderColor: type.color
                }}>
                  <p className="text-2xl font-black text-gray-900">{type.value}</p>
                  <p className="text-sm font-bold text-gray-700 mt-1">{type.name}</p>
                  <p className="text-xs font-semibold mt-2" style={{ color: type.color }}>₹{type.amount.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Analysis */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Category Analysis</h3>
              <p className="text-sm text-gray-500">Transaction breakdown by category</p>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Target className="text-indigo-600" size={20} />
            </div>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Category Stats */}
          <div className="grid grid-cols-1 gap-3 mt-6">
            {categoryData.map((item, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">₹{item.amount.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-500">{item.count} transactions</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Progress & Transaction Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Financial Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Financial Progress</h3>
              <p className="text-sm text-gray-500">Revenue targets</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Award className="text-emerald-600" size={20} />
            </div>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="20%"
              outerRadius="80%"
              barSize={20}
              data={financialProgressData}
            >
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
        </div>

        {/* Transaction Scatter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Transaction Scatter</h3>
              <p className="text-sm text-gray-500">Amount distribution</p>
            </div>
            <div className="p-2 bg-rose-50 rounded-lg">
              <Eye className="text-rose-600" size={20} />
            </div>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" dataKey="x" name="Transaction" />
              <YAxis type="number" dataKey="y" name="Amount" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Transactions" data={scatterPlotData}>
                {scatterPlotData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.type === 'Credit' ? COLORS.secondary : COLORS.danger} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );

  // Render Transactions Tab Content
  const renderTransactionsTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">All Transactions</h3>
          <p className="text-sm text-gray-500">Complete transaction history</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={exportTimeframe} 
            onChange={(e) => setExportTimeframe(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className={`px-4 py-2 text-sm flex items-center gap-2 text-white rounded-lg transition-colors ${isExporting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            <DownloadCloud size={16} />
            {isExporting ? 'Exporting...' : 'Export Transactions'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <React.Fragment key={transaction._id}>
                <tr className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => toggleRowExpansion(transaction._id)}>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        {transaction.userModel === 'Driver' ? <Car size={14} className="text-gray-600" /> :
                          transaction.userModel === 'Fleet' ? <Truck size={14} className="text-gray-600" /> :
                            <Users size={14} className="text-gray-600" />}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {transaction.user?.name || transaction.userModel || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${transaction.type === 'Credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-700">
                      {transaction.category}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-medium ${transaction.type === 'Credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {transaction.type === 'Credit' ? '+' : '-'} ₹{transaction.amount}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${transaction.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      transaction.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
                {expandedRows[transaction._id] && (
                  <tr className="bg-gray-50">
                    <td colSpan="7" className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
                          <p className="text-sm text-gray-900">{transaction.description}</p>
                        </div>
                        {transaction.bankDetails && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Bank Details</p>
                            <p className="text-sm text-gray-900">{transaction.bankDetails.bankName}</p>
                            <p className="text-xs text-gray-600">****{transaction.bankDetails.accountNumber?.slice(-4)}</p>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Reports Tab Content
  const renderReportsTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Summary Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Summary</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Total Revenue</span>
            <span className="font-semibold text-gray-900">₹{totalRevenue}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Total Bookings</span>
            <span className="font-semibold text-gray-900">{totalBookings}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Completed Rides</span>
            <span className="font-semibold text-green-600">{completedRides}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Cancelled Rides</span>
            <span className="font-semibold text-red-600">{cancelledRides}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Admin Earnings</span>
            <span className="font-semibold text-blue-600">₹{adminEarnings}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">New Users (30d)</span>
            <span className="font-semibold text-purple-600">{newUsersLast30Days}</span>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Export Reports</h3>
          <select 
            value={exportTimeframe} 
            onChange={(e) => setExportTimeframe(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div className="space-y-3">

          <button 
            onClick={handleExport} 
            disabled={isExporting}
            className={`w-full p-3 border border-gray-200 rounded-lg flex items-center justify-between ${isExporting ? 'bg-gray-100 opacity-70' : 'hover:bg-gray-50'}`}
          >
            <div className="flex items-center gap-3">
              <DownloadCloud size={18} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                {isExporting ? 'Exporting CSV...' : 'CSV File (Transactions)'}
              </span>
            </div>
            <Download size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-700 mb-2">Schedule Reports</h4>
          <p className="text-xs text-blue-600 mb-3">Get regular reports delivered to your email</p>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className={`w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm ${isExporting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}
          >
            {isExporting ? 'Downloading...' : 'Set Up Schedule'}
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-6 md:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {transactions.slice(0, 5).map((transaction, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${transaction.type === 'Credit' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                {transaction.type === 'Credit' ? <ArrowUp size={14} className="text-green-600" /> : <ArrowDown size={14} className="text-red-600" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                <p className="text-xs text-gray-500">{new Date(transaction.createdAt).toLocaleString()}</p>
              </div>
              <span className={`text-sm font-medium ${transaction.type === 'Credit' ? 'text-green-600' : 'text-red-600'
                }`}>
                {transaction.type === 'Credit' ? '+' : '-'} ₹{transaction.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-3 sm:px-8 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="bg-blue-600 p-2 sm:p-3 rounded-xl shrink-0">
                <FileText className="text-white" size={20} />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-2xl font-bold text-gray-900 leading-tight truncate">Full System Report</h1>
                <p className="text-[10px] sm:text-sm text-gray-500 leading-tight truncate">Complete analytics and transaction history</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Refresh */}
              <button
                onClick={fetchFullReport}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-6 mt-4">
            {[
              { id: 'overview', label: 'Overview', icon: PieChartIcon },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'transactions', label: 'Transactions', icon: CreditCard },
              { id: 'reports', label: 'Reports', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2 flex items-center space-x-2 text-sm font-medium transition-colors relative ${activeTab === tab.id
                  ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4">
              <select className="px-3 py-2 border border-gray-300 rounded-lg">
                <option>All Transaction Types</option>
                <option>Credit Only</option>
                <option>Debit Only</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded-lg">
                <option>All Categories</option>
                <option>Commission</option>
                <option>Withdrawal</option>
                <option>Refund</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded-lg">
                <option>All Status</option>
                <option>Completed</option>
                <option>Pending</option>
                <option>Failed</option>
              </select>
              <input
                type="text"
                placeholder="Search..."
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-2 sm:px-8 py-4 sm:py-6 overflow-hidden">
        {/* Summary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {summaryStats.map((stat, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${stat.bg} rounded-xl shadow-lg p-4 text-white transform hover:scale-105 transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon size={20} className="opacity-90" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{stat.change}</span>
              </div>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs opacity-90 mt-1">{stat.title}</p>
            </div>
          ))}
        </div>

        {/* Dynamic Tab Content */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
        {activeTab === 'transactions' && renderTransactionsTab()}
        {activeTab === 'reports' && renderReportsTab()}

        {/* Bottom Summary - Always Visible */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Average Transaction</p>
                <p className="text-lg font-semibold text-gray-900">
                  ₹{transactions.length ? (transactions.reduce((sum, t) => sum + (t.amount || 0), 0) / transactions.length).toFixed(0) : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Percent className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Success Rate</p>
                <p className="text-lg font-semibold text-gray-900">{((completedRides / totalBookings) * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Report Generated</p>
                <p className="text-lg font-semibold text-gray-900">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportPage;