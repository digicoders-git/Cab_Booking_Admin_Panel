import React, { useState, useEffect } from 'react';
import { getPurchasedSubscriptionsAPI, assignSubscriptionDriverAPI } from '../apis/admin';
import { getAllDrivers } from '../apis/driver';
import { Users, Search, Calendar, MapPin, Navigation, Car, Clock, CheckCircle2, XCircle, AlertCircle, Check, X, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const PurchasedSubscriptions = () => {
    const { admin } = useAuth();
    const hasPermission = (permission) => {
        if (admin?.role === "SuperAdmin") return true;
        return admin?.permissions?.includes(permission);
    };

    const [subscriptions, setSubscriptions] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [driverSearchTerm, setDriverSearchTerm] = useState('');
    const [assignModalData, setAssignModalData] = useState(null); // { subscriptionId: '' }
    const [historyModalData, setHistoryModalData] = useState(null); // { subscription: object }
    const [historyFilter, setHistoryFilter] = useState('all'); // 'all', 'present', 'absent', 'upcoming'
    const [selectedDriverId, setSelectedDriverId] = useState('');

    useEffect(() => {
        fetchSubscriptions();
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        const res = await getAllDrivers();
        if (res.success) {
            setDrivers(res.drivers.filter(d => d.isApproved));
        }
    };

    const fetchSubscriptions = async () => {
        setLoading(true);
        const res = await getPurchasedSubscriptionsAPI();
        if (res.success) {
            setSubscriptions(res.subscriptions);
        } else {
            toast.error(res.message || "Failed to fetch subscriptions");
        }
        setLoading(false);
    };

    const handleAssignDriver = async () => {
        if (!selectedDriverId) return toast.error("Select a driver first");
        const loadingToast = toast.loading("Assigning driver...");
        const res = await assignSubscriptionDriverAPI({
            subscriptionId: assignModalData.subscriptionId,
            driverId: selectedDriverId
        });
        if (res.success) {
            toast.success(res.message, { id: loadingToast });
            setAssignModalData(null);
            fetchSubscriptions();
        } else {
            toast.error(res.message || "Failed to assign driver", { id: loadingToast });
        }
    };

    // Generate full calendar register from startDate to endDate
    const getRegisterDays = (sub) => {
        if (!sub || !sub.startDate || !sub.endDate) return [];
        const days = [];
        
        const cleanStart = typeof sub.startDate === 'string' ? sub.startDate.split('T')[0] : new Date(sub.startDate).toISOString().split('T')[0];
        const cleanEnd = typeof sub.endDate === 'string' ? sub.endDate.split('T')[0] : new Date(sub.endDate).toISOString().split('T')[0];
        
        const [sy, sm, sd] = cleanStart.split('-').map(Number);
        const [ey, em, ed] = cleanEnd.split('-').map(Number);
        
        let cur = new Date(sy, sm - 1, sd);
        const end = new Date(ey, em - 1, ed);
        
        const todayStr = new Date().toISOString().split('T')[0];
        let dayCounter = 1;

        while (cur <= end) {
            const year = cur.getFullYear();
            const month = String(cur.getMonth() + 1).padStart(2, '0');
            const day = String(cur.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            
            const log = sub.dailyLogs?.find(l => l.date === dateStr);

            const formatTrip = (trip, scheduledTime) => {
                if (trip?.status === 'Completed') {
                    return {
                        status: 'Completed',
                        label: 'Present',
                        time: trip.completedAt ? new Date(trip.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : scheduledTime
                    };
                }
                if (trip?.status === 'Started') {
                    return {
                        status: 'Started',
                        label: 'In Progress',
                        time: trip.startedAt ? new Date(trip.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : scheduledTime
                    };
                }
                if (trip?.status === 'Missed') {
                    return {
                        status: 'Missed',
                        label: 'Absent (Missed)',
                        time: scheduledTime
                    };
                }
                if (dateStr < todayStr) {
                    return {
                        status: 'Absent',
                        label: 'Absent (No Show)',
                        time: scheduledTime
                    };
                }
                if (dateStr === todayStr) {
                    return {
                        status: 'Pending',
                        label: 'Scheduled Today',
                        time: scheduledTime
                    };
                }
                return {
                    status: 'Upcoming',
                    label: 'Upcoming',
                    time: scheduledTime
                };
            };

            const goTripInfo = formatTrip(log?.goTrip, sub.pickupTime);
            const returnTripInfo = sub.returnTime ? formatTrip(log?.returnTrip, sub.returnTime) : null;

            // Day Status Calculation
            let dayStatus = 'Upcoming';
            let filterType = 'upcoming';

            if (dateStr > todayStr) {
                dayStatus = 'Upcoming';
                filterType = 'upcoming';
            } else if (dateStr === todayStr) {
                const isGoComplete = goTripInfo.status === 'Completed';
                const isReturnComplete = returnTripInfo ? returnTripInfo.status === 'Completed' : true;
                if (isGoComplete && isReturnComplete) {
                    dayStatus = 'Present';
                    filterType = 'present';
                } else if (goTripInfo.status === 'Started' || returnTripInfo?.status === 'Started') {
                    dayStatus = 'In Progress';
                    filterType = 'present';
                } else {
                    dayStatus = 'Today Scheduled';
                    filterType = 'upcoming';
                }
            } else {
                // Past day
                const isGoPresent = goTripInfo.status === 'Completed';
                const isReturnPresent = returnTripInfo ? returnTripInfo.status === 'Completed' : true;
                if (isGoPresent && isReturnPresent) {
                    dayStatus = 'Present';
                    filterType = 'present';
                } else if (isGoPresent || (returnTripInfo && isReturnPresent)) {
                    dayStatus = 'Half Day';
                    filterType = 'present';
                } else {
                    dayStatus = 'Absent';
                    filterType = 'absent';
                }
            }

            const formattedDate = cur.toLocaleDateString('en-US', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

            days.push({
                dayNumber: dayCounter++,
                date: dateStr,
                formattedDate,
                isToday: dateStr === todayStr,
                isPast: dateStr < todayStr,
                isFuture: dateStr > todayStr,
                goTrip: goTripInfo,
                returnTrip: returnTripInfo,
                dayStatus,
                filterType
            });

            cur.setDate(cur.getDate() + 1);
        }

        return days;
    };

    const registerDays = historyModalData ? getRegisterDays(historyModalData) : [];
    const totalDays = registerDays.length;
    const presentDays = registerDays.filter(d => d.dayStatus === 'Present' || d.dayStatus === 'Half Day').length;
    const absentDays = registerDays.filter(d => d.dayStatus === 'Absent').length;
    const upcomingDays = registerDays.filter(d => d.filterType === 'upcoming').length;
    const pastDaysCount = presentDays + absentDays;
    const attendanceRate = pastDaysCount > 0 ? Math.round((presentDays / pastDaysCount) * 100) : 100;

    const filteredRegister = registerDays.filter(d => {
        if (historyFilter === 'present') return d.filterType === 'present';
        if (historyFilter === 'absent') return d.filterType === 'absent';
        if (historyFilter === 'upcoming') return d.filterType === 'upcoming';
        return true;
    });

    const filtered = subscriptions.filter(sub => 
        sub.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.user?.phone?.includes(searchTerm) ||
        sub.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="text-blue-600" /> Users' Subscriptions
                    </h1>
                    <p className="text-gray-500 mt-1">View all monthly commute passes purchased by users.</p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by user or plan..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                                    <th className="p-4 font-semibold">User Details</th>
                                    <th className="p-4 font-semibold">Plan Name</th>
                                    <th className="p-4 font-semibold">Duration</th>
                                    <th className="p-4 font-semibold">Timings</th>
                                    <th className="p-4 font-semibold">Route</th>
                                    <th className="p-4 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((sub) => (
                                    <tr key={sub._id} className="hover:bg-blue-50/30 transition-all duration-200 group">
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                                    {sub.user?.name ? sub.user.name.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{sub.user?.name || 'Unknown'}</p>
                                                    <p className="text-xs text-gray-500 font-medium">{sub.user?.phone}</p>
                                                    <button 
                                                        onClick={() => setHistoryModalData(sub)}
                                                        className="text-[11px] font-bold text-blue-600 hover:underline mt-1 inline-block"
                                                    >
                                                        View Attendance
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <p className="font-bold text-gray-800 text-sm">{sub.plan?.name}</p>
                                            <p className="text-xs text-blue-600 font-bold flex items-center gap-1 mt-1 bg-blue-50 w-max px-2 py-0.5 rounded">
                                                <Car size={12} /> {sub.plan?.carCategory?.name || 'Any Car'}
                                            </p>
                                            <p className="text-xs font-semibold text-gray-600 mt-1">₹{sub.plan?.price} / month</p>
                                        </td>
                                        <td className="p-5 text-sm">
                                            <div className="space-y-1.5">
                                                <p className="flex items-center gap-2 text-gray-700 font-medium"><Calendar size={14} className="text-emerald-500"/> {new Date(sub.startDate).toLocaleDateString()}</p>
                                                <p className="flex items-center gap-2 text-gray-400 font-medium"><Calendar size={14}/> {new Date(sub.endDate).toLocaleDateString()}</p>
                                            </div>
                                        </td>
                                        <td className="p-5 text-sm">
                                            <div className="space-y-1.5">
                                                <p className="flex items-center gap-2 text-gray-700 font-medium"><Clock size={14} className="text-blue-500"/> {sub.pickupTime}</p>
                                                <p className="flex items-center gap-2 text-gray-400 font-medium"><Clock size={14}/> {sub.returnTime || '-'}</p>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="w-48 xl:w-64">
                                                <div className="flex items-start gap-2 mb-2">
                                                    <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0"></div>
                                                    <p className="text-xs text-gray-600 line-clamp-1" title={sub.pickup?.address}>{sub.pickup?.address}</p>
                                                </div>
                                                <div className="flex items-start gap-2 mb-2">
                                                    <MapPin size={10} className="mt-1 text-red-500 shrink-0" />
                                                    <p className="text-xs text-gray-600 line-clamp-1" title={sub.drop?.address}>{sub.drop?.address}</p>
                                                </div>
                                                <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 w-max px-2 py-0.5 rounded">
                                                    <Navigation size={10} /> {sub.routeDistanceKm} KM Route
                                                </p>
                                            </div>
                                        </td>
                                        <td className="p-5 align-top">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                                        sub.status === 'Active' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                                                        sub.status === 'Expired' ? 'bg-gray-100 text-gray-700 border border-gray-200' : 'bg-red-100 text-red-700 border border-red-200'
                                                    }`}>
                                                        {sub.status}
                                                    </span>
                                                    {sub.paymentStatus && (
                                                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                            sub.paymentStatus === 'Completed' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                                                        }`}>
                                                            {sub.paymentStatus}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className="mt-2 w-full">
                                                    {sub.assignedDriver ? (
                                                        <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg">
                                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Assigned Driver</p>
                                                            <p className="text-xs font-bold text-gray-900 line-clamp-1">{sub.assignedDriver.name}</p>
                                                            <p className="text-[10px] text-gray-500">{sub.assignedDriver.phone}</p>
                                                        </div>
                                                    ) : hasPermission('SUBSCRIPTION_EDIT') ? (
                                                        <button 
                                                            onClick={() => setAssignModalData({ subscriptionId: sub._id })}
                                                            className="w-full text-xs font-bold text-white bg-blue-600 px-3 py-2.5 rounded-lg hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5"
                                                        >
                                                            <Car size={14} /> Assign Driver
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 block text-center py-2">Unassigned</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-500">
                                            No user subscriptions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Assign Driver Modal */}
            {assignModalData && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">Assign Driver to Subscription</h3>
                            <button onClick={() => {
                                setAssignModalData(null);
                                setDriverSearchTerm('');
                                setSelectedDriverId('');
                            }} className="text-gray-400 hover:text-gray-700">&times;</button>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Driver</label>
                            
                            <div className="mb-3 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input 
                                    type="text"
                                    placeholder="Search driver by name or phone..."
                                    value={driverSearchTerm}
                                    onChange={(e) => setDriverSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <select 
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={selectedDriverId}
                                onChange={e => setSelectedDriverId(e.target.value)}
                            >
                                <option value="">-- Choose a driver --</option>
                                {drivers
                                    .filter(d => 
                                        d.name.toLowerCase().includes(driverSearchTerm.toLowerCase()) || 
                                        d.phone.includes(driverSearchTerm)
                                    )
                                    .map(d => (
                                    <option key={d._id} value={d._id}>{d.name} ({d.phone})</option>
                                ))}
                            </select>

                            <button 
                                onClick={handleAssignDriver}
                                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
                            >
                                Confirm Assignment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Comprehensive Attendance Register Modal */}
            {historyModalData && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6 animate-fadeIn">
                    <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white shrink-0">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-blue-500/30 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-blue-400/30">
                                        Commute Pass Register
                                    </span>
                                    <span className="text-xs text-gray-300 font-medium">
                                        {historyModalData.plan?.name}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    {historyModalData.user?.name}
                                    <span className="text-sm font-normal text-gray-300">({historyModalData.user?.phone})</span>
                                </h3>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-300">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={13} className="text-blue-400" />
                                        {new Date(historyModalData.startDate).toLocaleDateString()} - {new Date(historyModalData.endDate).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Car size={13} className="text-emerald-400" />
                                        Captain: <strong className="text-white">{historyModalData.assignedDriver?.name || 'Unassigned'}</strong>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={13} className="text-amber-400" />
                                        Pick: {historyModalData.pickupTime} {historyModalData.returnTime ? `| Return: ${historyModalData.returnTime}` : ''}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setHistoryModalData(null); setHistoryFilter('all'); }} 
                                className="text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Top KPI Summary Stats */}
                        <div className="p-4 bg-gray-50 border-b border-gray-200 shrink-0">
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-center">
                                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Pass Days</p>
                                    <p className="text-xl font-extrabold text-gray-900 mt-0.5">{totalDays}</p>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm text-center">
                                    <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Present Days</p>
                                    <p className="text-xl font-extrabold text-emerald-600 mt-0.5">{presentDays}</p>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-red-100 shadow-sm text-center">
                                    <p className="text-[10px] uppercase font-bold text-red-600 tracking-wider">Absent / Missed</p>
                                    <p className="text-xl font-extrabold text-red-600 mt-0.5">{absentDays}</p>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm text-center">
                                    <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Upcoming</p>
                                    <p className="text-xl font-extrabold text-blue-600 mt-0.5">{upcomingDays}</p>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm text-center col-span-2 sm:col-span-1">
                                    <p className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Attendance %</p>
                                    <p className="text-xl font-extrabold text-indigo-600 mt-0.5">{attendanceRate}%</p>
                                </div>
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200">
                                <span className="text-xs font-bold text-gray-500">Filter:</span>
                                <button 
                                    onClick={() => setHistoryFilter('all')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                        historyFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                                    }`}
                                >
                                    All Days ({totalDays})
                                </button>
                                <button 
                                    onClick={() => setHistoryFilter('present')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                        historyFilter === 'present' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-emerald-700 border border-gray-200 hover:bg-emerald-50'
                                    }`}
                                >
                                    Present ({presentDays})
                                </button>
                                <button 
                                    onClick={() => setHistoryFilter('absent')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                        historyFilter === 'absent' ? 'bg-red-600 text-white shadow-sm' : 'bg-white text-red-700 border border-gray-200 hover:bg-red-50'
                                    }`}
                                >
                                    Absent ({absentDays})
                                </button>
                                <button 
                                    onClick={() => setHistoryFilter('upcoming')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                        historyFilter === 'upcoming' ? 'bg-gray-800 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                                    }`}
                                >
                                    Upcoming ({upcomingDays})
                                </button>
                            </div>
                        </div>

                        {/* Register Table Body */}
                        <div className="p-4 overflow-y-auto flex-1">
                            {filteredRegister.length === 0 ? (
                                <p className="text-center text-gray-400 py-12">No records matching selected filter.</p>
                            ) : (
                                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-100/75 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                                                <th className="p-3">Day & Date</th>
                                                <th className="p-3">Morning Pickup ({historyModalData.pickupTime})</th>
                                                <th className="p-3">Evening Return ({historyModalData.returnTime || 'N/A'})</th>
                                                <th className="p-3 text-right">Day Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-xs">
                                            {filteredRegister.map((day) => (
                                                <tr 
                                                    key={day.date} 
                                                    className={`hover:bg-gray-50/80 transition-colors ${day.isToday ? 'bg-blue-50/50 font-medium' : ''}`}
                                                >
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 font-bold flex items-center justify-center text-[10px]">
                                                                #{day.dayNumber}
                                                            </span>
                                                            <div>
                                                                <p className="font-bold text-gray-900">{day.formattedDate}</p>
                                                                {day.isToday && (
                                                                    <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider bg-blue-100 px-1.5 py-0.5 rounded">
                                                                        Today
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="p-3">
                                                        {day.goTrip.status === 'Completed' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                <CheckCircle2 size={13} /> Present ({day.goTrip.time})
                                                            </span>
                                                        ) : day.goTrip.status === 'Started' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                                                <Car size={13} /> In Progress
                                                            </span>
                                                        ) : day.goTrip.status === 'Missed' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-red-50 text-red-700 border border-red-200">
                                                                <XCircle size={13} /> Absent (Missed)
                                                            </span>
                                                        ) : day.isPast ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-red-50 text-red-600 border border-red-100">
                                                                <XCircle size={13} /> Absent (No Show)
                                                            </span>
                                                        ) : day.isToday ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                                <Clock size={13} /> Scheduled Today
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-gray-50 text-gray-400 border border-gray-200">
                                                                <Clock size={13} /> Scheduled
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="p-3">
                                                        {!day.returnTrip ? (
                                                            <span className="text-gray-400 text-[11px] italic">One-way Pass</span>
                                                        ) : day.returnTrip.status === 'Completed' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                <CheckCircle2 size={13} /> Present ({day.returnTrip.time})
                                                            </span>
                                                        ) : day.returnTrip.status === 'Started' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                                                <Car size={13} /> In Progress
                                                            </span>
                                                        ) : day.returnTrip.status === 'Missed' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-red-50 text-red-700 border border-red-200">
                                                                <XCircle size={13} /> Absent (Missed)
                                                            </span>
                                                        ) : day.isPast ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-red-50 text-red-600 border border-red-100">
                                                                <XCircle size={13} /> Absent (No Show)
                                                            </span>
                                                        ) : day.isToday ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                                <Clock size={13} /> Scheduled Today
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-gray-50 text-gray-400 border border-gray-200">
                                                                <Clock size={13} /> Scheduled
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="p-3 text-right">
                                                        {day.dayStatus === 'Present' ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs bg-emerald-100 text-emerald-800">
                                                                <Check size={12} /> Present
                                                            </span>
                                                        ) : day.dayStatus === 'Half Day' ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs bg-amber-100 text-amber-800">
                                                                <AlertCircle size={12} /> Half Day
                                                            </span>
                                                        ) : day.dayStatus === 'In Progress' ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs bg-amber-100 text-amber-800 animate-pulse">
                                                                <Car size={12} /> In Progress
                                                            </span>
                                                        ) : day.dayStatus === 'Absent' ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs bg-red-100 text-red-800">
                                                                <X size={12} /> Absent
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium text-xs bg-gray-100 text-gray-500">
                                                                Upcoming
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchasedSubscriptions;

