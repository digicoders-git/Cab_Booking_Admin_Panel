import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useFont } from "../context/FontContext";
import {
    registerSubAdmin, getAllAdmins, deleteAdmin, updateAdminPermissions, getDashboardStats
} from "../apis/admin";
import {
    UserPlus, Shield, Mail, Trash2, Key, CheckCircle, AlertCircle,
    ChevronLeft, ChevronRight, RefreshCw, X, ShieldCheck, Lock, UserX, Eye, EyeOff, Edit, Camera, User, Power,
    Building2, CheckCircle2, Users, Wallet, Search, Activity, Settings
} from 'lucide-react';
import Swal from "sweetalert2";

// Available Permissions List
// Available Permissions List (Categorized for UI)
// Available Permissions List (Categorized for UI)
const PERMISSIONS_GROUPS = [
    {
        title: "Drivers Management",
        permissions: [
            { id: "DRIVER_READ", label: "View List" },
            { id: "DRIVER_CREATE", label: "Register New" },
            { id: "DRIVER_APPROVE", label: "Approve Driver" },
            { id: "DRIVER_REJECT", label: "Reject Driver" },
            { id: "DRIVER_EDIT", label: "Edit Profile" },
            { id: "DRIVER_STATUS", label: "Status Toggle" },
            { id: "DRIVER_DELETE", label: "Delete Permanent" },
        ]
    },
    {
        title: "Vendor Management",
        permissions: [
            { id: "VENDOR_READ", label: "View Vendors" },
            { id: "VENDOR_CREATE", label: "Register New" },
            { id: "VENDOR_EDIT", label: "Edit Details" },
            { id: "VENDOR_COMMISSION", label: "Set Commission" },
            { id: "VENDOR_STATUS", label: "Status Toggle" },
            { id: "VENDOR_DELETE", label: "Delete Vendor" },
        ]
    },
    {
        title: "Agent Management",
        permissions: [
            { id: "AGENT_READ", label: "View Agents" },
            { id: "AGENT_CREATE", label: "Register New" },
            { id: "AGENT_EDIT", label: "Edit Details" },
            { id: "AGENT_COMMISSION", label: "Set Commission" },
            { id: "AGENT_STATUS", label: "Status Toggle" },
            { id: "AGENT_DELETE", label: "Delete Agent" },
        ]
    },
    {
        title: "Fleet Owner (Firm)",
        permissions: [
            { id: "FLEET_READ", label: "View Fleets" },
            { id: "FLEET_CREATE", label: "Register New" },
            { id: "FLEET_EDIT", label: "Edit Profile" },
            { id: "FLEET_WALLET", label: "Manage Wallet" },
            { id: "FLEET_STATUS", label: "Status Toggle" },
            { id: "FLEET_DELETE", label: "Remove Fleet" },
        ]
    },
    {
        title: "User (Customer)",
        permissions: [
            { id: "USER_READ", label: "View Users" },
            { id: "USER_EDIT", label: "Update Details" },
            { id: "USER_STATUS", label: "Status Toggle" },
            { id: "USER_DELETE", label: "Delete User" },
        ]
    },
    {
        title: "Bookings & Wallet",
        permissions: [
            { id: "BOOKING_READ", label: "View History" },
            { id: "BOOKING_CANCEL", label: "Force Cancel" },
            { id: "BOOKING_DELETE", label: "Delete Booking" },
            { id: "PAYOUT_READ", label: "View Payouts" },
            { id: "PAYOUT_APPROVE", label: "Approve Pay" },
            { id: "PAYOUT_REJECT", label: "Reject Pay" },
            { id: "TRANSACTION_READ", label: "Financial Ledger" },
        ]
    },
    {
        title: "Communication / Support",
        permissions: [
            { id: "SUPPORT_READ", label: "View Tickets" },
            { id: "SUPPORT_REPLY", label: "Post Reply" },
            { id: "SUPPORT_DELETE", label: "Delete Ticket" },
            { id: "NEWS_VIEW", label: "View News" },
            { id: "NEWS_POST", label: "Add/Toggle News" },
            { id: "NEWS_DELETE", label: "Delete News" },
        ]
    },
    {
        title: "System & Monitoring",
        permissions: [
            { id: "DASHBOARD_READ", label: "Dashboard" },
            { id: "REPORT_READ", label: "Admin Reports" },
            { id: "TRACKING_READ", label: "Live Tracking" },
            { id: "CAT_VIEW", label: "View Car Types" },
            { id: "CAT_MANAGE", label: "Add/Edit Type" },
            { id: "STAFF_VIEW", label: "View Staff" },
            { id: "STAFF_MANAGE", label: "Full Staff Control" },
        ]
    }
];

// Flat list for logical checks
const PERMISSIONS_LIST = PERMISSIONS_GROUPS.flatMap(g => g.permissions);

const StatCard = ({ icon: Icon, title, value, trend, bgColor, iconColor }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative group overflow-hidden transition-all hover:shadow-md">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${bgColor} shadow-sm border border-black/5`}>
                <Icon className={iconColor} size={22} />
            </div>
            <div className="px-2 py-1 bg-green-50 rounded-full flex items-center gap-1 border border-green-100">
                <span className="text-[10px] font-black text-green-600">{trend}</span>
            </div>
        </div>
        <div className="space-y-1">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{value}</h3>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
        </div>
        <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500 ${iconColor.replace('text', 'bg')}`} />
    </div>
);

export default function ManageSubAdmins() {
    const { themeColors, theme } = useTheme();
    const { admin: loggedInAdmin } = useAuth();
    const { currentFont } = useFont();

    // Helper for Granular Permissions
    const can = (permission) => {
        if (loggedInAdmin?.role === 'SuperAdmin') return true;
        return loggedInAdmin?.permissions?.includes(permission);
    };
  
  const BASE = import.meta.env.VITE_API_BASE_URL || '';
  const IMAGE_BASE_URL = BASE.replace(/\/api\/?$/, '').replace(/\/$/, '') + '/uploads/';
    const [fetching, setFetching] = useState(true);
    const [loading, setLoading] = useState(false);
    const [admins, setAdmins] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(null);
    const [viewAdmin, setViewAdmin] = useState(null);
    const [stats, setStats] = useState({
        totalVendors: 0,
        activeVendors: 0,
        totalDrivers: 0,
        totalCommission: 0
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const [createForm, setCreateForm] = useState({
        name: "",
        email: "",
        password: "",
        image: null,
        permissions: []
    });

    useEffect(() => {
        fetchAdmins();
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await getDashboardStats();
            // We use the local 'admins' list for more relevant page stats
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    const filteredAdmins = useMemo(() => {
        let list = admins;
        if (activeTab === "active") list = list.filter(a => a.isActive !== false);
        if (activeTab === "inactive") list = list.filter(a => a.isActive === false);
        
        if (searchQuery.trim()) {
            const lowQuery = searchQuery.toLowerCase();
            list = list.filter(a => 
                a.name?.toLowerCase().includes(lowQuery) || 
                a.email?.toLowerCase().includes(lowQuery)
            );
        }
        return list;
    }, [admins, activeTab, searchQuery]);

    const paginatedAdmins = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredAdmins.slice(start, start + rowsPerPage);
    }, [filteredAdmins, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(filteredAdmins.length / rowsPerPage);
    useEffect(() => { setCurrentPage(1); }, [filteredAdmins.length, rowsPerPage]);

    // Derived stats from the admins list
    const staffStats = useMemo(() => {
        const total = admins.length;
        const active = admins.filter(a => a.isActive !== false).length;
        const subAdmins = admins.filter(a => a.role === 'SubAdmin').length;
        const suspended = admins.filter(a => a.isActive === false).length;
        return { total, active, subAdmins, suspended };
    }, [admins]);

    const fetchAdmins = async () => {
        try {
            setFetching(true);
            const res = await getAllAdmins();
            const allAdmins = res.admins || [];
            // Additional frontend filter to be safe
            setAdmins(allAdmins.filter(a => a.role !== 'SuperAdmin'));
        } catch (err) {
            console.error(err);
        } finally {
            setFetching(false);
        }
    };

    const handleCreateSubAdmin = async (e) => {
        e.preventDefault();
        if (createForm.permissions.length === 0) {
            return Swal.fire("Error", "Please select at least one permission", "warning");
        }
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("name", createForm.name);
            formData.append("email", createForm.email);
            formData.append("password", createForm.password);
            formData.append("permissions", JSON.stringify(createForm.permissions));
            if (createForm.image) formData.append("image", createForm.image);

            await registerSubAdmin(formData);
            Swal.fire({
                icon: 'success',
                title: 'Sub-Admin Created',
                text: 'Account has been setup successfully.',
                timer: 2000,
                showConfirmButton: false
            });
            setShowCreateModal(false);
            setCreateForm({ name: "", email: "", password: "", image: null, permissions: [] });
            fetchAdmins();
        } catch (err) {
            Swal.fire("Error", err.response?.data?.message || "Failed to create", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        const res = await Swal.fire({
            title: 'Are you sure?',
            text: `You want to remove ${name} from admin staff?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, remove them'
        });

        if (res.isConfirmed) {
            try {
                await deleteAdmin(id);
                fetchAdmins();
                Swal.fire('Removed!', 'Admin has been deleted.', 'success');
            } catch (err) {
                Swal.fire("Error", err.response?.data?.message || "Failed to delete", "error");
            }
        }
    };

    const togglePermissionInCreate = (id) => {
        setCreateForm(prev => {
            const has = prev.permissions.includes(id);
            if (has) {
                return { ...prev, permissions: prev.permissions.filter(p => p !== id) };
            } else {
                return { ...prev, permissions: [...prev.permissions, id] };
            }
        });
    };

    const handleUpdatePermissions = async (id, data) => {
        try {
            setLoading(true);
            await updateAdminPermissions(id, data);
            Swal.fire({
                icon: 'success',
                title: 'Permissions Updated',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000
            });
            setShowPermissionModal(null);
            fetchAdmins();
        } catch (err) {
            Swal.fire("Error", err.response?.data?.message || "Failed to update", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-4 sm:p-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-4 py-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ShieldCheck className="text-blue-600" size={28} />
                        Back-Office Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Create and manage Sub-Admins with specific access levels.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchAdmins}
                        className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <RefreshCw size={20} className={`text-gray-600 ${fetching ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-medium"
                    >
                        <UserPlus size={18} />
                        Add New Staff
                    </button>
                </div>
            </div>

            {/* Statistics Row */}
            {fetching ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gray-200" />
                                <div className="w-12 h-5 rounded-full bg-gray-200" />
                            </div>
                            <div className="h-7 bg-gray-300 rounded w-16 mb-2" />
                            <div className="h-2 bg-gray-200 rounded w-24" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard icon={Shield} title="Total Staff" value={staffStats.total} trend="Total" bgColor="bg-blue-50" iconColor="text-blue-600" />
                    <StatCard icon={CheckCircle2} title="Active Sessions" value={staffStats.active} trend="Alive" bgColor="bg-emerald-50" iconColor="text-emerald-600" />
                    <StatCard icon={Users} title="Sub-Admins" value={staffStats.subAdmins} trend="Managed" bgColor="bg-indigo-50" iconColor="text-indigo-600" />
                    <StatCard icon={UserX} title="Suspended" value={staffStats.suspended} trend="Paused" bgColor="bg-rose-50" iconColor="text-rose-600" />
                </div>
            )}

            {/* List Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Tabs & Search Row */}
                <div className="px-6 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 py-2">
                    <div className="flex items-center gap-6 overflow-x-auto w-full md:w-auto">
                        {[
                            { id: "all", label: "All Staff", count: staffStats.total, icon: Shield },
                            { id: "active", label: "Active", count: staffStats.active, icon: CheckCircle2, color: 'text-green-600' },
                            { id: "inactive", label: "Inactive", count: staffStats.suspended, icon: UserX, color: 'text-red-600' }
                        ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 py-5 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 relative whitespace-nowrap ${
                                activeTab === tab.id ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <tab.icon size={14} className={activeTab === tab.id ? 'text-blue-600' : tab.color || ''} />
                            <span>{tab.label}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                                activeTab === tab.id ? 'bg-blue-600 text-white border-blue-700' : 'bg-gray-100 text-gray-900 border-gray-200'
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                        ))}
                    </div>

                    {/* Integrated Search Bar */}
                    <div className="relative w-full md:w-64 py-2 md:py-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text"
                            placeholder="Filter by name/email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 focus:bg-white transition-all text-xs font-bold shadow-inner"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase whitespace-nowrap tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <Users size={14} className="text-blue-500" />
                                        Staff Member
                                    </div>
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase whitespace-nowrap tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <Shield size={14} className="text-indigo-500" />
                                        Access Role
                                    </div>
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase whitespace-nowrap tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <Activity size={14} className="text-emerald-500" />
                                        Status
                                    </div>
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase whitespace-nowrap tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <Key size={14} className="text-amber-500" />
                                        Password
                                    </div>
                                </th>
                                <th className="text-center py-4 px-6 text-xs font-bold text-gray-600 uppercase whitespace-nowrap tracking-wider">
                                    <div className="flex items-center justify-center gap-2">
                                        <Settings size={14} className="text-rose-500" />
                                        Actions
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {fetching ? (
                                [...Array(6)].map((_, i) => (
                                    <tr key={i} className="animate-pulse border-b border-gray-100">
                                        {/* Staff Member */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-200" />
                                                <div className="space-y-1.5">
                                                    <div className="h-3 bg-gray-200 rounded w-28" />
                                                    <div className="h-2 bg-gray-100 rounded w-36" />
                                                </div>
                                            </div>
                                        </td>
                                        {/* Role */}
                                        <td className="py-4 px-6">
                                            <div className="h-6 bg-gray-100 rounded-lg w-20" />
                                        </td>
                                        {/* Status */}
                                        <td className="py-4 px-6">
                                            <div className="h-6 bg-gray-100 rounded-full w-16" />
                                        </td>
                                        {/* Password */}
                                        <td className="py-4 px-6">
                                            <div className="h-6 bg-gray-100 rounded w-24" />
                                        </td>
                                        {/* Actions */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-center gap-1">
                                                <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                                                <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                                                <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                                                <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : admins.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center text-gray-500">
                                        No sub-admins found. Create your first staff member.
                                    </td>
                                </tr>
                            ) : paginatedAdmins.map((admin) => (
                                <tr key={admin._id} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center overflow-hidden border border-blue-50 shadow-sm group-hover:scale-105 transition-transform">
                                                {admin.image ? (
                                                    <img
                                                        src={`${IMAGE_BASE_URL}${admin.image}`}
                                                        alt={admin.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Shield size={18} className="text-blue-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900 leading-none mb-1">{admin.name}</p>
                                                <p className="text-xs text-gray-600 font-bold">{admin.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                                            admin.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {admin.role}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        {admin.isActive !== false ? (
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 flex items-center gap-1.5 w-fit">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                ACTIVE
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 flex items-center gap-1.5 w-fit">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                                INACTIVE
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100/50">
                                                {admin.password}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center justify-center gap-1">
                                            {can('STAFF_VIEW') && (
                                                <button
                                                    onClick={() => setViewAdmin(admin)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Quick View"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            )}
                                            {can('STAFF_MANAGE') && (
                                                <button
                                                    onClick={() => admin.role !== 'SuperAdmin' && handleUpdatePermissions(admin._id, { isActive: !admin.isActive })}
                                                    className={`p-2 rounded-lg transition-colors ${admin.role === 'SuperAdmin' ? 'text-gray-300 cursor-not-allowed' : admin.isActive !== false ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
                                                    title={admin.isActive !== false ? "Suspend Staff" : "Activate Staff"}
                                                    disabled={admin.role === 'SuperAdmin'}
                                                >
                                                    <Power size={18} />
                                                </button>
                                            )}
                                            {can('STAFF_MANAGE') && (
                                                <button
                                                    onClick={() => admin.role !== 'SuperAdmin' && setShowPermissionModal(admin)}
                                                    className={`p-2 rounded-lg transition-colors ${admin.role === 'SuperAdmin' ? 'text-gray-300 cursor-not-allowed' : 'text-orange-600 hover:bg-orange-50'}`}
                                                    title="Edit Permissions"
                                                    disabled={admin.role === 'SuperAdmin'}
                                                >
                                                    <Edit size={18} />
                                                </button>
                                            )}
                                            {can('STAFF_MANAGE') && (
                                                <button
                                                    onClick={() => admin.role !== 'SuperAdmin' && handleDelete(admin._id, admin.name)}
                                                    className={`p-2 rounded-lg transition-colors ${admin.role === 'SuperAdmin' ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                                                    title="Delete Staff"
                                                    disabled={admin.role === 'SuperAdmin'}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rows:</span>
                            <select
                                value={rowsPerPage}
                                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                                className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(n => (
                                    <option key={n} value={n}>{n} rows</option>
                                ))}
                            </select>
                        </div>
                        <p className="text-xs font-bold text-gray-500">
                            Showing <span className="text-blue-600">{filteredAdmins.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}</span> to <span className="text-blue-600">{Math.min(filteredAdmins.length, currentPage * rowsPerPage)}</span> of {filteredAdmins.length} staff
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-black text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                        >
                            <ChevronLeft size={16} />
                            PREVIOUS
                        </button>

                        <div className="px-4 py-2 bg-blue-50 rounded-xl border border-blue-100">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                PAGE {currentPage} OF {totalPages || 1}
                            </span>
                        </div>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-black text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                        >
                            NEXT
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Add New Back-Office Staff</h2>
                                <p className="text-xs text-gray-500">Configure profile and access control.</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <form id="createForm" onSubmit={handleCreateSubAdmin} className="space-y-8">
                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    {/* Image Upload Area */}
                                    <div className="w-full md:w-32 flex flex-col items-center gap-3">
                                        <label className="relative group cursor-pointer">
                                            <div className="w-32 h-32 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 overflow-hidden transition-all group-hover:border-blue-300 group-hover:bg-blue-50">
                                                {createForm.image ? (
                                                    <img src={URL.createObjectURL(createForm.image)} className="w-full h-full object-cover" />
                                                ) : (
                                                    <>
                                                        <Camera className="text-gray-400 group-hover:text-blue-500" size={32} />
                                                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-blue-500">UPLOAD</span>
                                                    </>
                                                )}
                                            </div>
                                            <input
                                                type="file" hidden accept="image/*"
                                                onChange={(e) => setCreateForm({ ...createForm, image: e.target.files[0] })}
                                            />
                                            {createForm.image && (
                                                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 border-2 border-white" onClick={(e) => { e.preventDefault(); setCreateForm({ ...createForm, image: null }); }}>
                                                    <X size={14} />
                                                </div>
                                            )}
                                        </label>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Profile Photo</p>
                                    </div>

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                                <Shield size={14} /> Full Name
                                            </label>
                                            <input
                                                type="text" required
                                                className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-corporate"
                                                placeholder="Enter full name"
                                                value={createForm.name}
                                                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                                <Mail size={14} /> Email Address
                                            </label>
                                            <input
                                                type="email" required
                                                className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-corporate"
                                                placeholder="e.g. staff@admin.com"
                                                value={createForm.email}
                                                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                                <Key size={14} /> Secret Password
                                            </label>
                                            <input
                                                type="password" required
                                                className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-corporate"
                                                placeholder="Enter strong password"
                                                value={createForm.password}
                                                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-gray-900 border-l-4 border-blue-600 pl-3">Assign Access Modules</h3>
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                            {createForm.permissions.length} Selected
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {PERMISSIONS_GROUPS.map((group, gIdx) => (
                                            <div key={gIdx} className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                    {group.title}
                                                </h4>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {group.permissions.map(p => (
                                                        <div
                                                            key={p.id}
                                                            onClick={() => togglePermissionInCreate(p.id)}
                                                            className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2 ${createForm.permissions.includes(p.id)
                                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                                                    : 'bg-white border-gray-200 hover:border-blue-200'
                                                                }`}
                                                        >
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${createForm.permissions.includes(p.id) ? 'bg-white border-white text-blue-600' : 'bg-white border-gray-300'
                                                                }`}>
                                                                {createForm.permissions.includes(p.id) && <CheckCircle size={10} />}
                                                            </div>
                                                            <span className={`text-xs font-bold ${createForm.permissions.includes(p.id) ? 'text-white' : 'text-gray-600'}`}>
                                                                {p.label}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit" form="createForm"
                                disabled={loading}
                                className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Permission Modal */}
            {showPermissionModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in duration-300">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Modifying Access: {showPermissionModal.name}</h2>
                                <p className="text-xs text-gray-500">Enable or restrict system modules for this user.</p>
                            </div>
                            <button onClick={() => setShowPermissionModal(null)} className="p-2 hover:bg-gray-100 rounded-xl">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        <div className="p-6 bg-blue-50/30 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${showPermissionModal.isActive !== false ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {showPermissionModal.isActive !== false ? <ShieldCheck size={24} /> : <UserX size={24} />}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">Account Strategy</h3>
                                    <p className="text-[11px] text-gray-500">Toggle account availability in system.</p>
                                </div>
                            </div>
                            <div
                                onClick={() => setShowPermissionModal({ ...showPermissionModal, isActive: !showPermissionModal.isActive })}
                                className={`w-14 h-7 rounded-full p-1 cursor-pointer transition-all duration-300 ${showPermissionModal.isActive !== false ? 'bg-green-600' : 'bg-gray-300'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 transform ${showPermissionModal.isActive !== false ? 'translate-x-7' : 'translate-x-0'}`} />
                            </div>
                        </div>

                        <div className="p-6 bg-white border-b border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                    <Shield size={10} /> Staff Name
                                </label>
                                <input
                                    className="w-full h-10 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white transition-all text-sm font-medium"
                                    value={showPermissionModal.name}
                                    onChange={(e) => setShowPermissionModal({ ...showPermissionModal, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                    <Mail size={10} /> Email Access
                                </label>
                                <input
                                    className="w-full h-10 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white transition-all text-sm font-medium"
                                    value={showPermissionModal.email}
                                    onChange={(e) => setShowPermissionModal({ ...showPermissionModal, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                    <Key size={10} /> Password
                                </label>
                                <input
                                    type="text"
                                    className="w-full h-10 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white transition-all text-sm font-mono"
                                    value={showPermissionModal.password}
                                    onChange={(e) => setShowPermissionModal({ ...showPermissionModal, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/30">
                            {PERMISSIONS_GROUPS.map((group, gIdx) => (
                                <div key={gIdx} className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Shield size={10} className="text-blue-400" />
                                        {group.title}
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {group.permissions.map(p => {
                                            const isAssigned = showPermissionModal.permissions.includes(p.id);
                                            return (
                                                <div
                                                    key={p.id}
                                                    onClick={() => {
                                                        const updated = isAssigned
                                                            ? showPermissionModal.permissions.filter(perm => perm !== p.id)
                                                            : [...showPermissionModal.permissions, p.id];
                                                        setShowPermissionModal({ ...showPermissionModal, permissions: updated });
                                                    }}
                                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${isAssigned ? 'bg-white border-blue-600 shadow-sm' : 'bg-white/50 border-gray-100 opacity-60'
                                                        }`}
                                                >
                                                    <span className={`text-xs font-bold ${isAssigned ? 'text-blue-700' : 'text-gray-500'}`}>
                                                        {p.label}
                                                    </span>
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isAssigned ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-300'
                                                        }`}>
                                                        {isAssigned ? <CheckCircle size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
                            <button onClick={() => setShowPermissionModal(null)} className="px-6 py-2 text-sm font-bold text-gray-500">Close</button>
                            <button
                                onClick={() => handleUpdatePermissions(showPermissionModal._id, {
                                    name: showPermissionModal.name,
                                    email: showPermissionModal.email,
                                    password: showPermissionModal.password,
                                    permissions: showPermissionModal.permissions,
                                    isActive: showPermissionModal.isActive
                                })}
                                disabled={loading}
                                className="px-8 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {loading ? 'Saving Changes...' : 'Save Updates'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal (Premium Summary) */}
            {viewAdmin && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in duration-300">
                        {/* Header Gradient */}
                        <div className="h-32 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 relative">
                            <button
                                onClick={() => setViewAdmin(null)}
                                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all"
                            >
                                <X size={20} />
                            </button>
                            {/* Status Badge */}
                            <div className="absolute top-6 left-6">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border ${viewAdmin.isActive !== false
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                    }`}>
                                    {viewAdmin.isActive !== false ? "Active Session" : "Account Suspended"}
                                </span>
                            </div>
                        </div>

                        {/* Profile Image Overlap */}
                        <div className="px-8 -mt-16 relative">
                            <div className="w-32 h-32 rounded-[2rem] bg-white p-1 shadow-2xl border-4 border-white overflow-hidden group">
                                {viewAdmin.image ? (
                                    <img
                                        src={`${IMAGE_BASE_URL}${viewAdmin.image}`}
                                        className="w-full h-full object-cover rounded-[1.8rem]"
                                        alt={viewAdmin.name}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <User size={48} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="px-8 pt-6 pb-4">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{viewAdmin.name}</h3>
                            <p className="text-sm font-bold text-indigo-600">{viewAdmin.email}</p>

                            <div className="mt-6 flex items-center gap-4 py-3 px-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                                    <Key size={16} className="text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Secret Password</p>
                                    <p className="font-mono text-sm text-gray-700 font-bold">{viewAdmin.password}</p>
                                </div>
                            </div>
                        </div>

                        {/* Permissions Section */}
                        <div className="px-8 pb-10">
                            <div className="flex items-center justify-between mb-4 mt-6">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Digital Keys & Access</h4>
                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                                    {viewAdmin.permissions.length} Modules
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                {viewAdmin.permissions.length > 0 ? (
                                    viewAdmin.permissions.map(pId => {
                                        const pObj = PERMISSIONS_LIST.find(p => p.id === pId);
                                        return (
                                            <div key={pId} className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-gray-50 rounded-2xl hover:border-indigo-100 transition-all shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                <span className="text-[11px] font-bold text-gray-600 italic">
                                                    {pObj ? pObj.label : pId}
                                                </span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="w-full p-8 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                        <Shield size={24} className="mx-auto text-gray-300 mb-2" />
                                        <p className="text-xs text-gray-400 font-bold">NO ACCESS ASSIGNED</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
