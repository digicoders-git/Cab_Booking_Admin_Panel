import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import routes from '../route/SidebarRaoute';
import {
   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
   PieChart, Pie, Cell,
   LineChart, Line,
   AreaChart, Area,
   RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
   ComposedChart, Scatter
} from 'recharts';
import {
   Users, Car, UserCheck, Calendar, DollarSign, Clock,
   CheckCircle, XCircle, AlertCircle, TrendingUp, UserPlus,
   CreditCard, MapPin, Phone, Mail, Shield, Settings,
   Activity, Target, Award, BarChart3, PieChart as PieChartIcon,
   Download, RefreshCw, Filter, MoreVertical, Eye,
   Star, Truck, Navigation, Fuel, Wrench, Bell
} from 'lucide-react';
import { getDashboardStats as fetchStatsAPI } from '../apis/admin';

const BASE = import.meta.env.VITE_API_BASE_URL || '';
const IMAGE_BASE_URL = BASE.replace(/\/api\/?$/, '').replace(/\/$/, '') + '/uploads/';

const AdminDashboard = () => {
   const { admin } = useAuth();
   const navigate = useNavigate();
   const [dashboardData, setDashboardData] = useState(null);
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      // PERMISSION CHECK: If not SuperAdmin and no DASHBOARD_READ permission
      if (admin && admin.role !== 'SuperAdmin' && !admin.permissions?.includes('DASHBOARD_READ')) {
         // Find the first route they HAVE permission for
         const firstAllowedRoute = routes.find(r => 
            !r.permission || admin.permissions.includes(r.permission)
         );

         if (firstAllowedRoute) {
            navigate(firstAllowedRoute.path, { replace: true });
         } else {
            // If they have NO permissions at all (should not happen normally)
            navigate('/admin/profile', { replace: true });
         }
      }
   }, [admin, navigate]);
   const [selectedTimeRange, setSelectedTimeRange] = useState('week');
   const [showFilters, setShowFilters] = useState(false);

   // Colors array for charts
   const COLORS = {
      primary: '#3B82F6',
      secondary: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      purple: '#8B5CF6',
      pink: '#EC4899',
      indigo: '#6366F1',
      cyan: '#06B6D4',
      orange: '#F97316',
      teal: '#14B8A6'
   };

   const CHART_COLORS = [
      COLORS.primary, COLORS.secondary, COLORS.warning, COLORS.danger,
      COLORS.purple, COLORS.pink, COLORS.indigo, COLORS.cyan,
      COLORS.orange, COLORS.teal
   ];

   // Function to fetch dashboard stats
   const getDashboardStats = async () => {
      try {
         const res = await fetchStatsAPI();
         if (res.success) {
            setDashboardData(res.stats);
         }
      } catch (error) {
         console.error('Error fetching dashboard data:', error);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      getDashboardStats();

      // Auto refresh every 30 seconds
      const interval = setInterval(() => {
         getDashboardStats();
      }, 30000);

      return () => clearInterval(interval);
   }, []);

   if (loading) {
      return (
         <div className="flex items-center justify-center h-64">
            <div className="text-center">
               <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
               <p className="mt-4 text-gray-500 text-sm">Loading Dashboard...</p>
            </div>
         </div>
      );
   }

   const stats = dashboardData?.counts;
   const earnings = dashboardData?.earnings;
   const recentBookings = dashboardData?.recentBookings || [];

   // Calculate derived metrics
   const totalUsers = stats?.users || 0;
   const totalDrivers = stats?.drivers?.total || 0;
   const approvedDrivers = stats?.drivers?.approved || 0;
   const pendingDrivers = stats?.drivers?.pending || 0;
   const totalAgents = stats?.agents || 0;
   const totalFleets = stats?.fleets || 0;
   const totalBookings = stats?.bookings?.total || 0;
   const completedBookings = stats?.bookings?.completed || 0;
   const pendingBookings = stats?.bookings?.pending || 0;
   const cancelledBookings = stats?.bookings?.cancelled || 0;
   const ongoingBookings = stats?.bookings?.ongoing || 0;
   const adminWallet = earnings?.adminWallet || 0;
   const totalEarnings = earnings?.totalEarnings || 0;

   // Data for various charts
   const userDistributionData = [
      { name: 'Users', value: totalUsers, color: COLORS.primary },
      { name: 'Drivers', value: totalDrivers, color: COLORS.secondary },
      { name: 'Agents', value: totalAgents, color: COLORS.warning },
      { name: 'Fleets', value: totalFleets, color: COLORS.purple }
   ];

   const bookingStatusData = [
      { name: 'Completed', value: completedBookings, color: COLORS.secondary },
      { name: 'Pending', value: pendingBookings, color: COLORS.warning },
      { name: 'Ongoing', value: ongoingBookings, color: COLORS.primary },
      { name: 'Cancelled', value: cancelledBookings, color: COLORS.danger }
   ];

   const driverStatusData = [
      { name: 'Approved Drivers', value: approvedDrivers, color: COLORS.secondary },
      { name: 'Pending Drivers', value: pendingDrivers, color: COLORS.warning }
   ];

   // Generate booking trend data from recent bookings
   const bookingTrendData = recentBookings.reduce((acc, booking) => {
      const date = new Date(booking.createdAt).toLocaleDateString();
      const existing = acc.find(item => item.date === date);
      if (existing) {
         existing.count++;
         existing.earnings += booking.fareEstimate || 0;
      } else {
         acc.push({
            date,
            count: 1,
            earnings: booking.fareEstimate || 0
         });
      }
      return acc;
   }, []).sort((a, b) => new Date(a.date) - new Date(b.date));

   // Revenue breakdown
   const revenueData = [
      { name: 'Admin Wallet', amount: adminWallet },
      { name: 'Total Earnings', amount: totalEarnings }
   ];

   // Performance metrics
   const performanceData = [
      { metric: 'Booking Completion Rate', value: totalBookings ? (completedBookings / totalBookings) * 100 : 0 },
      { metric: 'Driver Approval Rate', value: totalDrivers ? (approvedDrivers / totalDrivers) * 100 : 0 },
      { metric: 'Cancellation Rate', value: totalBookings ? (cancelledBookings / totalBookings) * 100 : 0 },
      { metric: 'Ongoing Rate', value: totalBookings ? (ongoingBookings / totalBookings) * 100 : 0 }
   ];

   // Payment method distribution
   const paymentMethodData = recentBookings.reduce((acc, booking) => {
      const method = booking.paymentMethod || 'Unknown';
      const existing = acc.find(item => item.name === method);
      if (existing) {
         existing.value++;
      } else {
         acc.push({ name: method, value: 1 });
      }
      return acc;
   }, []);

   // Ride type distribution
   const rideTypeData = recentBookings.reduce((acc, booking) => {
      const type = booking.rideType || 'Unknown';
      const existing = acc.find(item => item.name === type);
      if (existing) {
         existing.value++;
      } else {
         acc.push({ name: type, value: 1 });
      }
      return acc;
   }, []);

   // Hourly booking distribution
   const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const hour = i.toString().padStart(2, '0') + ':00';
      const count = recentBookings.filter(booking => {
         const bookingHour = new Date(booking.createdAt).getHours();
         return bookingHour === i;
      }).length;
      return { hour, count };
   });

   if (!admin || loading) {
      return (
         <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="text-center">
               <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
               <p className="mt-4 text-gray-500 text-sm">Validating Access...</p>
            </div>
         </div>
      );
   }

   // If not SuperAdmin and no permission, show loader while redirecting (to prevent flicker)
   if (admin.role !== 'SuperAdmin' && !admin.permissions?.includes('DASHBOARD_READ')) {
      return (
         <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-gray-100">
         {/* Header */}


         <div className="p-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
               {/* Total Users */}
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">Total Users</p>
                        <p className="text-2xl font-bold text-gray-800">{totalUsers}</p>
                     </div>
                     <div className="bg-blue-100 p-3 rounded-lg">
                        <Users className="text-blue-600" size={24} />
                     </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                     <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">+12%</span>
                     <span className="text-xs text-gray-500">vs last week</span>
                  </div>
               </div>

               {/* Total Drivers */}
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">Total Drivers</p>
                        <p className="text-2xl font-bold text-gray-800">{totalDrivers}</p>
                     </div>
                     <div className="bg-green-100 p-3 rounded-lg">
                        <Car className="text-green-600" size={24} />
                     </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                     <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">{pendingDrivers} pending</span>
                  </div>
               </div>

               {/* Total Bookings */}
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-orange-500">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">Total Bookings</p>
                        <p className="text-2xl font-bold text-gray-800">{totalBookings}</p>
                     </div>
                     <div className="bg-orange-100 p-3 rounded-lg">
                        <Calendar className="text-orange-600" size={24} />
                     </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                     <span className="text-xs text-green-600">{completedBookings} completed</span>
                     <span className="text-xs text-gray-400">|</span>
                     <span className="text-xs text-yellow-600">{pendingBookings} pending</span>
                  </div>
               </div>

               {/* Total Earnings */}
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">Total Earnings</p>
                        <p className="text-2xl font-bold text-gray-800">₹{totalEarnings}</p>
                     </div>
                     <div className="bg-purple-100 p-3 rounded-lg">
                        <DollarSign className="text-purple-600" size={24} />
                     </div>
                  </div>
                  <div className="mt-2">
                     <span className="text-xs text-gray-500">Admin Wallet: ₹{adminWallet}</span>
                  </div>
               </div>

               {/* Completion Rate */}
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-indigo-500">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">Completion Rate</p>
                        <p className="text-2xl font-bold text-gray-800">
                           {totalBookings ? ((completedBookings / totalBookings) * 100).toFixed(1) : 0}%
                        </p>
                     </div>
                     <div className="bg-indigo-100 p-3 rounded-lg">
                        <Target className="text-indigo-600" size={24} />
                     </div>
                  </div>
                  <div className="mt-2">
                     <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                           className="bg-indigo-600 h-1.5 rounded-full"
                           style={{ width: `${totalBookings ? (completedBookings / totalBookings) * 100 : 0}%` }}
                        ></div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Row 1: User Distribution and Booking Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
               {/* User Distribution Chart */}
               <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                     <div>
                        <h3 className="text-lg font-semibold text-gray-800">User Distribution</h3>
                        <p className="text-sm text-gray-500">Overview of all platform users</p>
                     </div>
                     <PieChartIcon className="text-gray-400" size={20} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <ResponsiveContainer width="100%" height={200}>
                           <PieChart>
                              <Pie
                                 data={userDistributionData}
                                 cx="50%"
                                 cy="50%"
                                 innerRadius={60}
                                 outerRadius={80}
                                 paddingAngle={2}
                                 dataKey="value"
                              >
                                 {userDistributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                 ))}
                              </Pie>
                              <Tooltip />
                           </PieChart>
                        </ResponsiveContainer>
                     </div>

                     <div className="space-y-3">
                        {userDistributionData.map((item, index) => (
                           <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                 <span className="text-sm text-gray-600">{item.name}</span>
                              </div>
                              <span className="font-semibold">{item.value}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Booking Status Chart */}
               <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                     <div>
                        <h3 className="text-lg font-semibold text-gray-800">Booking Status</h3>
                        <p className="text-sm text-gray-500">Current booking distribution</p>
                     </div>
                     <BarChart3 className="text-gray-400" size={20} />
                  </div>

                  <ResponsiveContainer width="100%" height={250}>
                     <BarChart data={bookingStatusData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                           {bookingStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Bar>
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Row 2: Booking Trends and Revenue */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
               {/* Booking Trends Line Chart */}
               <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                     <div>
                        <h3 className="text-lg font-semibold text-gray-800">Booking Trends</h3>
                        <p className="text-sm text-gray-500">Daily booking volume</p>
                     </div>
                     <TrendingUp className="text-gray-400" size={20} />
                  </div>

                  <ResponsiveContainer width="100%" height={300}>
                     <LineChart data={bookingTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                           type="monotone"
                           dataKey="count"
                           stroke={COLORS.primary}
                           strokeWidth={2}
                           dot={{ r: 4 }}
                           activeDot={{ r: 6 }}
                        />
                        <Line
                           type="monotone"
                           dataKey="earnings"
                           stroke={COLORS.secondary}
                           strokeWidth={2}
                           dot={{ r: 4 }}
                        />
                     </LineChart>
                  </ResponsiveContainer>
               </div>

               {/* Revenue Area Chart */}
               <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                     <div>
                        <h3 className="text-lg font-semibold text-gray-800">Revenue Overview</h3>
                        <p className="text-sm text-gray-500">Earnings and wallet balance</p>
                     </div>
                     <DollarSign className="text-gray-400" size={20} />
                  </div>

                  <ResponsiveContainer width="100%" height={300}>
                     <AreaChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Area
                           type="monotone"
                           dataKey="amount"
                           stroke={COLORS.primary}
                           fill={`${COLORS.primary}20`}
                           strokeWidth={2}
                        />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Row 3: Driver Status and Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
               {/* Driver Status Pie Chart */}
               <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                     <div>
                        <h3 className="text-lg font-semibold text-gray-800">Driver Status</h3>
                        <p className="text-sm text-gray-500">Approval breakdown</p>
                     </div>
                     <UserCheck className="text-gray-400" size={20} />
                  </div>

                  <ResponsiveContainer width="100%" height={200}>
                     <PieChart>
                        <Pie
                           data={driverStatusData}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={5}
                           dataKey="value"
                        >
                           {driverStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                        <Tooltip />
                     </PieChart>
                  </ResponsiveContainer>

                  <div className="mt-4 flex justify-around">
                     <div className="text-center">
                        <p className="text-sm text-gray-500">Approved</p>
                        <p className="text-xl font-bold text-green-600">{approvedDrivers}</p>
                     </div>
                     <div className="text-center">
                        <p className="text-sm text-gray-500">Pending</p>
                        <p className="text-xl font-bold text-yellow-600">{pendingDrivers}</p>
                     </div>
                  </div>
               </div>

               {/* Performance Radar Chart */}
               <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                     <div>
                        <h3 className="text-lg font-semibold text-gray-800">Performance Metrics</h3>
                        <p className="text-sm text-gray-500">Platform health</p>
                     </div>
                     <Activity className="text-gray-400" size={20} />
                  </div>

                  <ResponsiveContainer width="100%" height={200}>
                     <RadarChart outerRadius={80} data={performanceData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
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

               {/* Payment Methods */}
               <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                     <div>
                        <h3 className="text-lg font-semibold text-gray-800">Payment Methods</h3>
                        <p className="text-sm text-gray-500">Transaction distribution</p>
                     </div>
                     <CreditCard className="text-gray-400" size={20} />
                  </div>

                  <ResponsiveContainer width="100%" height={200}>
                     <PieChart>
                        <Pie
                           data={paymentMethodData.length ? paymentMethodData : [{ name: 'No Data', value: 1 }]}
                           cx="50%"
                           cy="50%"
                           outerRadius={80}
                           dataKey="value"
                           label
                        >
                           {paymentMethodData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                           ))}
                        </Pie>
                        <Tooltip />
                     </PieChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Row 4: Hourly Distribution and Ride Types */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
               {/* Hourly Booking Distribution */}
               <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                     <div>
                        <h3 className="text-lg font-semibold text-gray-800">Hourly Booking Distribution</h3>
                        <p className="text-sm text-gray-500">Peak hours analysis</p>
                     </div>
                     <Clock className="text-gray-400" size={20} />
                  </div>

                  <ResponsiveContainer width="100%" height={300}>
                     <BarChart data={hourlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" interval={3} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                     </BarChart>
                  </ResponsiveContainer>
               </div>

               {/* Ride Type Distribution */}
               <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                     <div>
                        <h3 className="text-lg font-semibold text-gray-800">Ride Type Distribution</h3>
                        <p className="text-sm text-gray-500">Shared vs Private rides</p>
                     </div>
                     <Car className="text-gray-400" size={20} />
                  </div>

                  <ResponsiveContainer width="100%" height={300}>
                     <PieChart>
                        <Pie
                           data={rideTypeData.length ? rideTypeData : [{ name: 'No Data', value: 1 }]}
                           cx="50%"
                           cy="50%"
                           outerRadius={100}
                           dataKey="value"
                           label
                        >
                           {rideTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                           ))}
                        </Pie>
                        <Tooltip />
                     </PieChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Recent Bookings Table */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
               <div className="flex items-center justify-between mb-4">
                  <div>
                     <h3 className="text-lg font-semibold text-gray-800">Recent Bookings</h3>
                     <p className="text-sm text-gray-500">Latest ride requests</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                     View All →
                  </button>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full">
                     <thead>
                        <tr className="border-b border-gray-200">
                           <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                           <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Passenger</th>
                           <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Phone</th>
                           <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Pickup</th>
                           <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Drop</th>
                           <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Type</th>
                           <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                           <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Payment</th>
                           <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Fare</th>
                           <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">OTP</th>
                        </tr>
                     </thead>
                     <tbody>
                        {recentBookings.slice(0, 5).map((booking) => (
                           <tr key={booking._id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">
                                 <span className="text-sm font-mono">{booking._id.slice(-6)}</span>
                              </td>
                               <td className="py-3 px-4">
                                 <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden border border-gray-100 italic">
                                       {booking.user?.image ? (
                                          <img 
                                             src={`${IMAGE_BASE_URL}${booking.user?.image}`} 
                                             alt="User" 
                                             className="w-full h-full object-cover"
                                             onError={(e) => { e.target.parentElement.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" size="14" class="text-gray-600" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>'; }}
                                          />
                                       ) : (
                                          <Users size={14} className="text-gray-600" />
                                       )}
                                    </div>
                                    <span className="text-sm font-medium">{booking.passengerDetails.name}</span>
                                 </div>
                              </td>
                              <td className="py-3 px-4">
                                 <span className="text-sm">{booking.passengerDetails.phone}</span>
                              </td>
                              <td className="py-3 px-4">
                                 <span className="text-sm text-gray-600">{booking.pickup.address.substring(0, 15)}...</span>
                              </td>
                              <td className="py-3 px-4">
                                 <span className="text-sm text-gray-600">{booking.drop.address.substring(0, 15)}...</span>
                              </td>
                              <td className="py-3 px-4">
                                 <span className={`text-xs px-2 py-1 rounded-full ${booking.rideType === 'Private'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {booking.rideType}
                                 </span>
                              </td>
                              <td className="py-3 px-4">
                                 <span className={`text-xs px-2 py-1 rounded-full ${booking.bookingStatus === 'Completed'
                                    ? 'bg-green-100 text-green-700'
                                    : booking.bookingStatus === 'Pending'
                                       ? 'bg-yellow-100 text-yellow-700'
                                       : booking.bookingStatus === 'Ongoing'
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-red-100 text-red-700'
                                    }`}>
                                    {booking.bookingStatus}
                                 </span>
                              </td>
                              <td className="py-3 px-4">
                                 <span className={`text-xs px-2 py-1 rounded-full ${booking.paymentStatus === 'Paid'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {booking.paymentStatus}
                                 </span>
                              </td>
                              <td className="py-3 px-4 font-medium">
                                 ₹{booking.fareEstimate}
                              </td>
                              <td className="py-3 px-4">
                                 <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                    {booking.tripData.startOtp}
                                 </span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl shadow-sm p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                     <Users size={20} />
                     <span className="text-xs opacity-80">Active Users</span>
                  </div>
                  <p className="text-2xl font-bold">{totalUsers}</p>
                  <p className="text-xs opacity-80 mt-1">↑ 12% from last week</p>
               </div>

               <div className="bg-gradient-to-br from-green-600 to-green-400 rounded-xl shadow-sm p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                     <Car size={20} />
                     <span className="text-xs opacity-80">Active Drivers</span>
                  </div>
                  <p className="text-2xl font-bold">{approvedDrivers}</p>
                  <p className="text-xs opacity-80 mt-1">{pendingDrivers} pending approval</p>
               </div>

               <div className="bg-gradient-to-br from-orange-600 to-orange-400 rounded-xl shadow-sm p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                     <Calendar size={20} />
                     <span className="text-xs opacity-80">Today's Bookings</span>
                  </div>
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-xs opacity-80 mt-1">↑ 3 from yesterday</p>
               </div>

               <div className="bg-gradient-to-br from-purple-600 to-purple-400 rounded-xl shadow-sm p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                     <DollarSign size={20} />
                     <span className="text-xs opacity-80">Today's Revenue</span>
                  </div>
                  <p className="text-2xl font-bold">₹450</p>
                  <p className="text-xs opacity-80 mt-1">Avg. ₹56 per ride</p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default AdminDashboard;