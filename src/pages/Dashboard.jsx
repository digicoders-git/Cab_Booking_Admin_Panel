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
   Star, Truck, Navigation, Fuel, Wrench, Bell, ArrowDownCircle, Zap
} from 'lucide-react';
import { getDashboardStats as fetchStatsAPI } from '../apis/admin';

const BASE = import.meta.env.VITE_API_BASE_URL || '';
const IMAGE_BASE_URL = BASE.replace(/\/api\/?$/, '').replace(/\/$/, '') + '/uploads/';

const AdminDashboard = () => {
   const { admin } = useAuth();
   const navigate = useNavigate();
   const [dashboardData, setDashboardData] = useState(null);
   const [loading, setLoading] = useState(true);

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

   const SkeletonCard = () => (
      <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-gray-200 min-h-[140px] flex flex-col justify-center animate-pulse">
         <div className="flex items-center justify-between">
            <div className="space-y-2">
               <div className="h-3 bg-gray-200 rounded w-24"></div>
               <div className="h-7 bg-gray-300 rounded w-16"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
         </div>
         <div className="mt-3 h-2 bg-gray-200 rounded w-32"></div>
      </div>
   );

   const SkeletonChartCard = ({ height = 300 }) => (
      <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
         <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
               <div className="h-4 bg-gray-200 rounded w-32"></div>
               <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="w-5 h-5 bg-gray-200 rounded"></div>
         </div>
         <div className="bg-gray-100 rounded-lg" style={{ height }}></div>
      </div>
   );

   if (loading) {
      return (
         <div className="min-h-screen bg-gray-100 p-6">
            {[...Array(9)].map((_, rowIdx) => (
               <div key={rowIdx} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                  {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
               </div>
            ))}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
               <SkeletonChartCard height={250} />
               <SkeletonChartCard height={250} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
               <SkeletonChartCard height={300} />
               <SkeletonChartCard height={300} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
               <SkeletonChartCard height={200} />
               <SkeletonChartCard height={200} />
               <SkeletonChartCard height={200} />
            </div>
            {/* Recent Bookings Table Skeleton */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 animate-pulse">
               <div className="h-4 bg-gray-200 rounded w-40 mb-4"></div>
               <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                     <div key={i} className="flex gap-4">
                        {[...Array(10)].map((_, j) => (
                           <div key={j} className="h-3 bg-gray-200 rounded flex-1"></div>
                        ))}
                     </div>
                  ))}
               </div>
            </div>
         </div>
      );
   }

   const stats = dashboardData?.counts;
   const earnings = dashboardData?.earnings;
   const recentBookings = dashboardData?.recentBookings || [];

   // Calculate derived metrics
   const totalUsers = stats?.users?.total || 0;
   const totalSubAdmins = stats?.admins || 0;
   const totalDrivers = stats?.drivers?.total || 0;
   const approvedDrivers = stats?.drivers?.approved || 0;
   const pendingDrivers = stats?.drivers?.pending || 0;
   const totalAgents = stats?.agents || 0;
   const totalFleets = stats?.fleets || 0;
   const totalVendors = stats?.vendors || 0;
   const totalBookings = stats?.bookings?.total || 0;
   const completedBookings = stats?.bookings?.completed || 0;
   const pendingBookings = stats?.bookings?.pending || 0;
   const cancelledBookings = stats?.bookings?.cancelled || 0;
   const ongoingBookings = stats?.bookings?.ongoing || 0;
   const totalServiceAreas = stats?.serviceAreas || 0;
   const totalCategories = stats?.carCategories || 0;
   const totalTickets = stats?.supportTickets?.total || 0;
   const pendingTickets = stats?.supportTickets?.pending || 0;
   const adminWallet = earnings?.adminWallet || 0;
   const totalEarnings = earnings?.totalEarnings || 0;
   const partnerLiabilities = earnings?.partnerLiabilities || 0;
   const totalSystemCash = adminWallet + partnerLiabilities;
   
   const onlinePayments = stats?.bookings?.onlinePayments || 0;
   const cashPayments = stats?.bookings?.cashPayments || 0;
   const driverStats = dashboardData?.driverStats;
   const onlineDrivers = driverStats?.online || 0;
   const busyDrivers = driverStats?.busy || 0;
   const idleDrivers = driverStats?.idle || 0;

   const todayUsers = dashboardData?.counts?.users?.today || 0;
   const todayBookings = stats?.bookings?.todayBookings || 0;
   const sharedRides = stats?.bookings?.sharedRides || 0;
   const privateRides = stats?.bookings?.privateRides || 0;
   const averageFare = totalBookings > 0 ? Math.round(totalEarnings / totalBookings) : 0;

   const todayRevenue = dashboardData?.todayFinancials?.revenue || 0;
   const todayProfit = dashboardData?.todayFinancials?.profit || 0;
   const pendingVerifications = (dashboardData?.verifications?.pendingDrivers || 0) + 
                                (dashboardData?.verifications?.pendingVendors || 0);

   const todayDrivers = driverStats?.today || 0;
   const todayAgents = dashboardData?.partnerStats?.todayAgents || 0;
   const todayFleets = dashboardData?.partnerStats?.todayFleets || 0;
   const todayVendors = dashboardData?.partnerStats?.todayVendors || 0;
   const totalTodayPartners = todayDrivers + todayAgents + todayFleets + todayVendors;

   const totalPayouts = dashboardData?.payoutStats?.totalPayouts || 0;
   const pendingPayoutsCount = dashboardData?.payoutStats?.pendingPayoutsCount || 0;
   const rejectedDrivers = driverStats?.rejected || 0;
   const activeAreas = dashboardData?.infrastructure?.activeAreas || 0;
   const inactiveAreas = dashboardData?.infrastructure?.inactiveAreas || 0;

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

   if (!admin) return null;

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
               {/* Admin Net Wallet */}
               <div 
                  onClick={() => navigate('/wallet/manage')}
                  className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-cyan-500 cursor-pointer hover:shadow-md transition-shadow"
               >
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">Admin Net Wallet</p>
                        <p className="text-2xl font-bold text-gray-800">₹{adminWallet}</p>
                     </div>
                     <div className="bg-cyan-100 p-3 rounded-lg">
                        <DollarSign className="text-cyan-600" size={24} />
                     </div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Total profit in your wallet</div>
               </div>

               {/* Total Earnings */}
               <div 
                  onClick={() => navigate('/wallet/manage')}
                  className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-purple-500 cursor-pointer hover:shadow-md transition-shadow"
               >
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">Total Earnings</p>
                        <p className="text-2xl font-bold text-gray-800">₹{totalEarnings}</p>
                     </div>
                     <div className="bg-purple-100 p-3 rounded-lg">
                        <CreditCard className="text-purple-600" size={24} />
                     </div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Lifetime platform earnings</div>
               </div>

               {/* Today's Revenue */}
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-emerald-500">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">Today's Revenue</p>
                        <p className="text-2xl font-bold text-gray-800">₹{todayRevenue}</p>
                     </div>
                     <div className="bg-emerald-100 p-3 rounded-lg">
                        <TrendingUp className="text-emerald-600" size={24} />
                     </div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Total cash flow today</div>
               </div>

               {/* Partner Liabilities */}
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-red-500">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">Partner Liabilities</p>
                        <p className="text-2xl font-bold text-gray-800">₹{partnerLiabilities}</p>
                     </div>
                     <div className="bg-red-100 p-3 rounded-lg">
                        <ArrowDownCircle className="text-red-600" size={24} />
                     </div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Total payable to Partners (Udhaar)</div>
               </div>

               {/* Platform Liquidity */}
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-blue-600">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">Platform Liquidity</p>
                        <p className="text-2xl font-bold text-gray-800">₹{totalSystemCash}</p>
                     </div>
                     <div className="bg-blue-100 p-3 rounded-lg">
                        <Shield className="text-blue-600" size={24} />
                     </div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Total cash held by platform</div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
               <div 
                  onClick={() => navigate('/agent/create')}
                  className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-yellow-500 cursor-pointer hover:shadow-md transition-shadow"
               >
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Total Agents</p><p className="text-2xl font-bold text-gray-800">{totalAgents}</p></div>
                     <div className="bg-yellow-100 p-3 rounded-lg"><Users className="text-yellow-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Manage booking agents</div>
               </div>

               <div 
                  onClick={() => navigate('/fleet/create')}
                  className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-purple-500 cursor-pointer hover:shadow-md transition-shadow"
               >
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Total Fleets</p><p className="text-2xl font-bold text-gray-800">{totalFleets}</p></div>
                     <div className="bg-purple-100 p-3 rounded-lg"><Truck className="text-purple-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Vehicle owners and fleet partners</div>
               </div>

               <div 
                  onClick={() => navigate('/vendors/manage')}
                  className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-pink-500 cursor-pointer hover:shadow-md transition-shadow"
               >
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Total Vendors</p><p className="text-2xl font-bold text-gray-800">{totalVendors}</p></div>
                     <div className="bg-pink-100 p-3 rounded-lg"><Shield className="text-pink-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Third-party service providers</div>
               </div>

               <div 
                  onClick={() => navigate('/drivers/manage')}
                  className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-green-500 cursor-pointer hover:shadow-md transition-shadow"
               >
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Total Drivers</p><p className="text-2xl font-bold text-gray-800">{totalDrivers}</p></div>
                     <div className="bg-green-100 p-3 rounded-lg"><Car className="text-green-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-green-600">{approvedDrivers} Approved & Active</div>
               </div>

               <div 
                  onClick={() => navigate('/subadmins/manage')}
                  className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-blue-600 cursor-pointer hover:shadow-md transition-shadow"
               >
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Sub-Admins</p><p className="text-2xl font-bold text-gray-800">{totalSubAdmins}</p></div>
                     <div className="bg-blue-100 p-3 rounded-lg"><Shield className="text-blue-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Team members with panel access</div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
               <div 
                  onClick={() => navigate('/users/manage')}
                  className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-blue-500 cursor-pointer hover:shadow-md transition-shadow"
               >
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Total Users</p><p className="text-2xl font-bold text-gray-800">{totalUsers}</p></div>
                     <div className="bg-blue-100 p-3 rounded-lg"><Users className="text-blue-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Total registered passengers</div>
               </div>

               <div 
                  onClick={() => navigate('/bookings/manage')}
                  className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-orange-500 cursor-pointer hover:shadow-md transition-shadow"
               >
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Total Bookings</p><p className="text-2xl font-bold text-gray-800">{totalBookings}</p></div>
                     <div className="bg-orange-100 p-3 rounded-lg"><Calendar className="text-orange-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">{completedBookings} Completed rides</div>
               </div>

               <div 
                  onClick={() => navigate('/service-areas/manage')}
                  className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-indigo-500 cursor-pointer hover:shadow-md transition-shadow"
               >
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Active Cities</p><p className="text-2xl font-bold text-gray-800">{totalServiceAreas}</p></div>
                     <div className="bg-indigo-100 p-3 rounded-lg"><MapPin className="text-indigo-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Live operational zones</div>
               </div>

               <div 
                  onClick={() => navigate('/car-categories/manage')}
                  className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-teal-500 cursor-pointer hover:shadow-md transition-shadow"
               >
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Categories</p><p className="text-2xl font-bold text-gray-800">{totalCategories}</p></div>
                     <div className="bg-teal-100 p-3 rounded-lg"><Activity className="text-teal-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Vehicle types (Sedan, SUV, etc.)</div>
               </div>

               <div 
                  onClick={() => navigate('/support')}
                  className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-pink-500 cursor-pointer hover:shadow-md transition-shadow"
               >
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Support Tickets</p><p className="text-2xl font-bold text-gray-800">{totalTickets}</p></div>
                     <div className="bg-pink-100 p-3 rounded-lg"><Mail className="text-pink-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">{pendingTickets} open tickets</div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-green-500">
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Success Rate</p><p className="text-2xl font-bold text-gray-800">{totalBookings ? ((completedBookings / totalBookings) * 100).toFixed(1) : 0}%</p></div>
                     <div className="bg-green-100 p-3 rounded-lg"><CheckCircle className="text-green-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Percentage of successful rides</div>
               </div>

               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-indigo-500">
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Completion</p><p className="text-2xl font-bold text-gray-800">{totalBookings ? ((completedBookings / totalBookings) * 100).toFixed(1) : 0}%</p></div>
                     <div className="bg-indigo-100 p-3 rounded-lg"><Target className="text-indigo-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Overall fulfillment performance</div>
               </div>

               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-emerald-500">
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Avg. Fare</p><p className="text-2xl font-bold text-gray-800">₹{averageFare}</p></div>
                     <div className="bg-emerald-100 p-3 rounded-lg"><DollarSign className="text-emerald-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Average revenue per ride</div>
               </div>

               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-red-500">
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Doc Pending</p><p className="text-2xl font-bold text-red-600">{pendingVerifications}</p></div>
                     <div className="bg-red-50 p-3 rounded-lg"><Shield className="text-red-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Partners waiting for verification</div>
               </div>

               <div 
                  onClick={() => navigate('/subadmins/manage')}
                  className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-blue-600 cursor-pointer hover:shadow-md transition-shadow"
               >
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Team Active</p><p className="text-2xl font-bold text-gray-800">{totalSubAdmins}</p></div>
                     <div className="bg-blue-100 p-3 rounded-lg"><Shield className="text-blue-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Total active management staff</div>
               </div>
            </div>


            {/* Row 5: Today's Activity & Ride Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
               {/* Today's New Users */}
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-indigo-400">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">New Users Today</p>
                        <p className="text-2xl font-bold text-gray-800">{todayUsers}</p>
                     </div>
                     <div className="bg-indigo-50 p-3 rounded-lg">
                        <UserPlus className="text-indigo-500" size={24} />
                     </div>
                  </div>
                  <div className="mt-2">
                     <span className="text-xs text-gray-500">Registered since midnight</span>
                  </div>
               </div>

               {/* Today's New Bookings */}
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-orange-400">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">Bookings Today</p>
                        <p className="text-2xl font-bold text-gray-800">{todayBookings}</p>
                     </div>
                     <div className="bg-orange-50 p-3 rounded-lg">
                        <Zap className="text-orange-500" size={24} />
                     </div>
                  </div>
                  <div className="mt-2">
                     <span className="text-xs text-gray-500">New requests today</span>
                  </div>
               </div>

               {/* Shared Rides */}
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-pink-400">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">Shared Rides</p>
                        <p className="text-2xl font-bold text-gray-800">{sharedRides}</p>
                     </div>
                     <div className="bg-pink-50 p-3 rounded-lg">
                        <Users className="text-pink-500" size={24} />
                     </div>
                  </div>
                  <div className="mt-2">
                     <span className="text-xs text-gray-500">Pool/Shared category</span>
                  </div>
               </div>

               {/* Private Rides */}
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-blue-400">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">Private Rides</p>
                        <p className="text-2xl font-bold text-gray-800">{privateRides}</p>
                     </div>
                     <div className="bg-blue-50 p-3 rounded-lg">
                        <Shield className="text-blue-500" size={24} />
                     </div>
                  </div>
                  <div className="mt-2">
                     <span className="text-xs text-gray-500">Dedicated/Private rides</span>
                  </div>
               </div>

               {/* Average Order Value */}
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-emerald-500">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">Avg. Ride Fare</p>
                        <p className="text-2xl font-bold text-gray-800">₹{averageFare}</p>
                     </div>
                     <div className="bg-emerald-100 p-3 rounded-lg">
                        <DollarSign className="text-emerald-600" size={24} />
                     </div>
                  </div>
                  <div className="mt-2">
                     <span className="text-xs text-gray-500">Avg. earnings per booking</span>
                  </div>
               </div>
            </div>

            {/* Row 6: Today's Financial Pulse */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
               <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-emerald-500">
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Today's Revenue</p><p className="text-2xl font-bold text-gray-800">₹{todayRevenue}</p></div>
                     <div className="bg-emerald-100 p-3 rounded-lg"><TrendingUp className="text-emerald-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Total cash flow today</div>
               </div>
               <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 min-h-[140px] flex flex-col justify-center border-blue-500">
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Today's Profit</p><p className="text-2xl font-bold text-gray-800">₹{todayProfit}</p></div>
                     <div className="bg-blue-100 p-3 rounded-lg"><DollarSign className="text-blue-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Admin commission today</div>
               </div>
               <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 min-h-[140px] flex flex-col justify-center border-purple-500">
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Avg. Fare</p><p className="text-2xl font-bold text-gray-800">₹{averageFare}</p></div>
                     <div className="bg-purple-100 p-3 rounded-lg"><Activity className="text-purple-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Avg value per booking</div>
               </div>
               <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 min-h-[140px] flex flex-col justify-center border-red-500">
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Doc Pending</p><p className="text-2xl font-bold text-red-600">{pendingVerifications}</p></div>
                     <div className="bg-red-50 p-3 rounded-lg"><Shield className="text-red-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-red-400">Needing approval</div>
               </div>
               <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 min-h-[140px] flex flex-col justify-center border-green-500">
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Success Rate</p><p className="text-2xl font-bold text-gray-800">{totalBookings ? ((completedBookings / totalBookings) * 100).toFixed(1) : 0}%</p></div>
                     <div className="bg-green-100 p-3 rounded-lg"><CheckCircle className="text-green-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Total completed trips</div>
               </div>
            </div>

            {/* Row 7: Partner Growth (Today) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-blue-400">
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">New Drivers</p><p className="text-2xl font-bold text-gray-800">{todayDrivers}</p></div>
                     <div className="bg-blue-50 p-3 rounded-lg"><UserPlus className="text-blue-500" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Joined since midnight</div>
               </div>
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-yellow-400">
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">New Agents</p><p className="text-2xl font-bold text-gray-800">{todayAgents}</p></div>
                     <div className="bg-yellow-50 p-3 rounded-lg"><Users className="text-yellow-500" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Joined since midnight</div>
               </div>
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-purple-400">
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">New Fleets</p><p className="text-2xl font-bold text-gray-800">{todayFleets}</p></div>
                     <div className="bg-purple-50 p-3 rounded-lg"><Truck className="text-purple-500" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Joined since midnight</div>
               </div>
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center min-h-[140px] border-pink-400">
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">New Vendors</p><p className="text-2xl font-bold text-gray-800">{todayVendors}</p></div>
                     <div className="bg-pink-50 p-3 rounded-lg"><Shield className="text-pink-500" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Joined since midnight</div>
               </div>
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-indigo-500">
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Total Partners</p><p className="text-2xl font-bold text-gray-800">{totalTodayPartners}</p></div>
                     <div className="bg-indigo-50 p-3 rounded-lg"><Award className="text-indigo-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Total growth today</div>
               </div>
            </div>

            {/* Row 8: Payouts & Cities */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-green-600">
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Total Payouts</p><p className="text-xl font-bold text-gray-800">₹{totalPayouts}</p></div>
                     <div className="bg-green-50 p-3 rounded-lg"><CreditCard className="text-green-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Total amount paid</div>
               </div>
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-orange-500">
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Pending Payouts</p><p className="text-2xl font-bold text-orange-600">{pendingPayoutsCount}</p></div>
                     <div className="bg-orange-50 p-3 rounded-lg"><Clock className="text-orange-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Requests to process</div>
               </div>
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-red-600">
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Rejected Drivers</p><p className="text-2xl font-bold text-red-600">{rejectedDrivers}</p></div>
                     <div className="bg-red-50 p-3 rounded-lg"><XCircle className="text-red-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Not allowed on platform</div>
               </div>
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-teal-500">
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Active Cities</p><p className="text-2xl font-bold text-gray-800">{activeAreas}</p></div>
                     <div className="bg-teal-50 p-3 rounded-lg"><MapPin className="text-teal-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Operational zones</div>
               </div>
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-gray-500">
                  <div className="flex items-center justify-between">
                     <div><p className="text-sm text-gray-500">Inactive Cities</p><p className="text-2xl font-bold text-gray-800">{inactiveAreas}</p></div>
                     <div className="bg-gray-50 p-3 rounded-lg"><Filter className="text-gray-600" size={24} /></div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Currently disabled</div>
               </div>
            </div>

            {/* Row 8: Payouts & Infrastructure */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-green-600">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">Total Payouts Done</p>
                        <p className="text-xl font-bold text-gray-800">₹{totalPayouts}</p>
                     </div>
                     <div className="bg-green-50 p-3 rounded-lg"><CreditCard className="text-green-600" size={24} /></div>
                  </div>
                  <div className="mt-2"><span className="text-[10px] text-gray-400">Total withdrawal amount paid</span></div>
               </div>
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-orange-500">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">Pending Payouts</p>
                        <p className="text-2xl font-bold text-orange-600">{pendingPayoutsCount}</p>
                     </div>
                     <div className="bg-orange-50 p-3 rounded-lg"><Clock className="text-orange-600" size={24} /></div>
                  </div>
                  <div className="mt-2"><span className="text-[10px] text-gray-400">Withdrawals to be processed</span></div>
               </div>
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-red-600">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">Rejected Drivers</p>
                        <p className="text-2xl font-bold text-red-600">{rejectedDrivers}</p>
                     </div>
                     <div className="bg-red-50 p-3 rounded-lg"><XCircle className="text-red-600" size={24} /></div>
                  </div>
                  <div className="mt-2"><span className="text-[10px] text-gray-400">Drivers not allowed on platform</span></div>
               </div>
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-teal-500">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">Active Cities</p>
                        <p className="text-2xl font-bold text-gray-800">{activeAreas}</p>
                     </div>
                     <div className="bg-teal-50 p-3 rounded-lg"><MapPin className="text-teal-600" size={24} /></div>
                  </div>
                  <div className="mt-2"><span className="text-[10px] text-gray-400">Operational service areas</span></div>
               </div>
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-gray-500">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">Inactive Cities</p>
                        <p className="text-2xl font-bold text-gray-800">{inactiveAreas}</p>
                     </div>
                     <div className="bg-gray-50 p-3 rounded-lg"><Filter className="text-gray-600" size={24} /></div>
                  </div>
                  <div className="mt-2"><span className="text-[10px] text-gray-400">Service areas currently disabled</span></div>
               </div>
            </div>

            {/* Row 9: User Distribution and Booking Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
               {/* Online Payments */}
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-green-400">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">Online Rides</p>
                        <p className="text-2xl font-bold text-gray-800">{onlinePayments}</p>
                     </div>
                     <div className="bg-green-50 p-3 rounded-lg">
                        <CreditCard className="text-green-500" size={24} />
                     </div>
                  </div>
                  <div className="mt-2">
                     <span className="text-xs text-gray-500">Paid via Razorpay/Wallet</span>
                  </div>
               </div>

               {/* Cash Payments */}
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-yellow-400">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">Cash Rides</p>
                        <p className="text-2xl font-bold text-gray-800">{cashPayments}</p>
                     </div>
                     <div className="bg-yellow-50 p-3 rounded-lg">
                        <DollarSign className="text-yellow-500" size={24} />
                     </div>
                  </div>
                  <div className="mt-2">
                     <span className="text-xs text-gray-500">Paid in cash to driver</span>
                  </div>
               </div>

               {/* Busy Drivers */}
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-red-400">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">Busy Drivers</p>
                        <p className="text-2xl font-bold text-gray-800">{busyDrivers}</p>
                     </div>
                     <div className="bg-red-50 p-3 rounded-lg">
                        <Activity className="text-red-500" size={24} />
                     </div>
                  </div>
                  <div className="mt-2">
                     <span className="text-xs text-gray-500">Currently on a trip</span>
                  </div>
               </div>

               {/* Idle Drivers */}
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-blue-400">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">Available (Idle)</p>
                        <p className="text-2xl font-bold text-gray-800">{idleDrivers}</p>
                     </div>
                     <div className="bg-blue-50 p-3 rounded-lg">
                        <UserCheck className="text-blue-500" size={24} />
                     </div>
                  </div>
                  <div className="mt-2">
                     <span className="text-xs text-gray-500">Online & waiting for rides</span>
                  </div>
               </div>

               {/* Cancelled Bookings */}
               <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 min-h-[140px] flex flex-col justify-center border-gray-400">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500">Cancelled Rides</p>
                        <p className="text-2xl font-bold text-gray-800">{cancelledBookings}</p>
                     </div>
                     <div className="bg-gray-100 p-3 rounded-lg">
                        <XCircle className="text-gray-500" size={24} />
                     </div>
                  </div>
                  <div className="mt-2">
                     <span className="text-xs text-red-500">
                        {totalBookings ? ((cancelledBookings / totalBookings) * 100).toFixed(1) : 0}% rate
                     </span>
                  </div>
               </div>
            </div>
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
                  <button 
                     onClick={() => navigate('/bookings/manage')}
                     className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
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