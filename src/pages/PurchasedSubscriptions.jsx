import React, { useState, useEffect } from 'react';
import { getPurchasedSubscriptionsAPI, assignSubscriptionDriverAPI } from '../apis/admin';
import { getAllDrivers } from '../apis/driver';
import { Users, Search, Calendar, MapPin, Navigation, Car, Clock } from 'lucide-react';
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

            {/* History Modal */}
            {historyModalData && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                            <div>
                                <h3 className="font-bold text-gray-900">Attendance History</h3>
                                <p className="text-xs text-gray-500">{historyModalData.user?.name}</p>
                            </div>
                            <button onClick={() => setHistoryModalData(null)} className="text-gray-400 hover:text-gray-700">&times;</button>
                        </div>
                        <div className="p-4 overflow-y-auto">
                            {(!historyModalData.dailyLogs || historyModalData.dailyLogs.length === 0) ? (
                                <p className="text-center text-gray-500 py-8">No attendance history found.</p>
                            ) : (
                                <div className="space-y-3">
                                    {[...historyModalData.dailyLogs].reverse().map((log, idx) => (
                                        <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                            <p className="font-bold text-gray-800 mb-2">{log.date}</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Morning Trip</p>
                                                    {log.goTrip.status === 'Completed' ? (
                                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Completed</span>
                                                    ) : log.goTrip.status === 'Missed' ? (
                                                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">Missed</span>
                                                    ) : (
                                                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">Pending</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Evening Trip</p>
                                                    {log.returnTrip.status === 'Completed' ? (
                                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Completed</span>
                                                    ) : log.returnTrip.status === 'Missed' ? (
                                                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">Missed</span>
                                                    ) : (
                                                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">Pending</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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
