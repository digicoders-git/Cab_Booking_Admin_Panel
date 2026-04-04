import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";

// APIs
import { getAllFleetCars } from "../apis/fleetCar";
import { getAllFleetDrivers, updateFleetDriver, deleteFleetDriver, toggleDriverApproval } from "../apis/fleetDriver";
import { getAllFleetAssignments } from "../apis/fleetAssignment";
import { getAllCarCategories } from "../apis/carCategory";

// Icons
import {
  FaCarSide, FaAddressCard, FaSitemap, FaUsers, FaCar, FaLink, FaSyncAlt,
  FaSearch, FaBuilding, FaTag, FaCheckCircle, FaTimesCircle, FaChevronLeft, FaChevronRight,
  FaPlus, FaUserTie, FaCalendarAlt, FaEnvelope, FaPhone, FaEye, FaToggleOn, FaToggleOff, FaTimes,
  FaPlayCircle, FaHistory, FaRoute, FaEdit, FaTrash, FaDownload, FaFilter, FaPrint,
  FaChartPie, FaChartBar, FaChartLine, FaChartArea, FaGasPump, FaCogs, FaChair, FaPallet, FaWrench, FaShieldAlt, FaCreditCard, FaClock
} from "react-icons/fa";
import {
  Activity, PieChart as PieChartIcon, BarChart3, TrendingUp, DollarSign, Target, Gauge, Zap, Clock, MapPin, Mail, Phone, User, Users, Wallet, Briefcase
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, AreaChart, Area, ComposedChart, Scatter, ScatterChart, RadialBarChart, RadialBar
} from 'recharts';
import Swal from "sweetalert2";

// Chart Colors
const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
  orange: '#F97316',
  teal: '#14B8A6',
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#F59E0B',
  red: '#EF4444',
  violet: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
  gray: '#94A3B8',
  lightGray: '#E2E8F0'
};

// --- Helper Components ---

const StatCard = ({ icon: Icon, label, value, color, trend, subtitle }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all group relative overflow-hidden">
    <div className={`absolute -right-6 -top-6 w-24 h-24 bg-${color}-50 rounded-full group-hover:scale-150 transition-transform duration-500 opacity-50`}></div>
    <div className="flex items-start justify-between mb-3 relative z-10">
      <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 group-hover:scale-110 transition-transform`}>
        <Icon size={20} />
      </div>
      {trend && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 relative z-10">{value}</p>
    <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest relative z-10">{label}</p>
    {subtitle && <p className="text-[9px] sm:text-[10px] font-semibold text-gray-400 mt-2 relative z-10 bg-gray-50 inline-block px-2 py-1 rounded">{subtitle}</p>}
  </div>
);

const ChartCard = ({ title, subtitle, icon: Icon, children, action }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-lg transition-all">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-base sm:text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-[10px] sm:text-xs font-semibold text-gray-500 mt-1 uppercase tracking-widest">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        {action && (
          <button className="p-1.5 hover:bg-gray-100 rounded-lg">
            <FaFilter size={12} className="text-gray-400" />
          </button>
        )}
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="text-blue-600" size={18} />
        </div>
      </div>
    </div>
    {children}
  </div>
);

const SubStatBox = ({ icon: Icon, label, value, colorHex, themeColors, borderColor, textColorSecondary }) => (
  <div className="px-3 py-2.5 rounded-xl border shadow-sm flex items-center gap-3 transition-colors flex-1 min-w-[130px] hover:shadow-md"
    style={{ backgroundColor: themeColors.surface, borderColor: borderColor }}>
    <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: colorHex + "20" }}>
      <Icon size={14} style={{ color: colorHex }} />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-bold leading-none mb-1 uppercase tracking-wider truncate" style={{ color: textColorSecondary }}>{label}</p>
      <p className="text-sm font-black truncate" style={{ color: themeColors.text }}>{value}</p>
    </div>
  </div>
);

const Field = ({ label, name, value, onChange, themeColors, borderColor, textColorSecondary, type = "text", required = false, icon: Icon }) => (
  <div className="space-y-1 w-full">
    <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide px-1 flex items-center gap-1" style={{ color: textColorSecondary }}>
      {Icon && <Icon size={10} />}
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type} name={name} value={value || ""} onChange={onChange} required={required}
      className="w-full h-10 px-3 rounded-lg border text-sm outline-none transition-all placeholder:opacity-30 focus:ring-2 focus:ring-blue-500/20"
      style={{ backgroundColor: themeColors.background, borderColor: borderColor, color: themeColors.text }}
    />
  </div>
);

// --- Content Component: Cars ---
function CarsTab({ cars, categories, themeColors, theme, borderColor, textColorSecondary, fetchData, fetching }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const filteredCars = useMemo(() => cars.filter(c =>
    c.carNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.carModel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.fleetId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.fleetId?.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
  ), [cars, searchQuery]);

  const paginatedData = useMemo(() => filteredCars.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [filteredCars, currentPage]);
  const totalPages = Math.ceil(filteredCars.length / rowsPerPage);

  // Car status distribution for chart
  const carStatusData = [
    { name: 'Operational', value: cars.filter(c => c.isActive || c.isAvailable).length, color: CHART_COLORS.green },
    { name: 'Maintenance', value: cars.filter(c => !c.isActive && !c.isAvailable).length, color: CHART_COLORS.orange },
    { name: 'Inactive', value: cars.filter(c => !c.isActive).length, color: CHART_COLORS.gray }
  ].filter(item => item.value > 0);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  return (
    <div className="space-y-4">
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 sm:p-6 bg-gray-50/50 border-b border-gray-200">
        <ChartCard title="Car Status Distribution" subtitle="Operational vs Maintenance" icon={PieChartIcon}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={carStatusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {carStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Car Models Distribution" subtitle="Top car models" icon={BarChart3}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={cars.slice(0, 5).map(c => ({ name: c.carModel || 'Unknown', count: 1 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 px-4 sm:px-6">
        <div className="relative flex-1 lg:max-w-md">
          <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: textColorSecondary }} />
          <input type="text" placeholder="Search by model, registration, fleet..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 h-10 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-blue-500/20"
            style={{ backgroundColor: themeColors.background, borderColor, color: themeColors.text }} />
        </div>
        <button onClick={fetchData} className="px-5 h-10 rounded-lg font-black text-[10px] sm:text-xs transition-all flex items-center justify-center gap-2 active:scale-95 uppercase tracking-widest shadow-md"
          style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
          <FaSyncAlt size={11} className={fetching ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2 px-4 sm:px-6 overflow-x-auto scrollbar-hide">
        <SubStatBox icon={FaCar} label="TOTAL CARS" value={cars.length} colorHex={themeColors.primary} themeColors={themeColors} borderColor={borderColor} textColorSecondary={textColorSecondary} />
        <SubStatBox icon={FaCheckCircle} label="OPERATIONAL" value={cars.filter(c => c.isActive || c.isAvailable).length} colorHex={CHART_COLORS.green} themeColors={themeColors} borderColor={borderColor} textColorSecondary={textColorSecondary} />
        <SubStatBox icon={FaWrench} label="MAINTENANCE" value={cars.filter(c => !c.isActive && !c.isAvailable).length} colorHex={CHART_COLORS.orange} themeColors={themeColors} borderColor={borderColor} textColorSecondary={textColorSecondary} />
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
        <table className="w-full min-w-[1200px]">
          <thead>
            <tr className="border-b" style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderColor }}>
              {["Fleet", "Model", "Registration", "Seat Layout", "Base Fare", "Private/km", "Shared/km", "Status"].map(th => (
                <th key={th} className="px-5 py-4 text-[9px] font-black uppercase tracking-wider text-left" style={{ color: textColorSecondary }}>{th}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: borderColor + "40" }}>
            {paginatedData.map(c => {
              const category = categories[c.carType?._id || c.carType] || c.carType || {};
              const seatLayout = category.seatLayout || [];
              return (
                <tr key={c._id} className="transition-all hover:bg-black/5 dark:hover:bg-white/5">
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0">
                        {c.image ? (
                          <img src={`${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '')}/uploads/${c.image}`} alt="car" className="w-full h-full object-cover" />
                        ) : (
                          <FaCar size={18} className="text-gray-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-900 block truncate">{c.fleetId?.companyName || "Independent"}</span>
                        <p className="text-[10px] text-gray-500 truncate">{c.fleetId?.name || "System"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">{c.carModel}</span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="text-xs font-mono font-medium text-gray-700">{c.carNumber}</span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-blue-600">{seatLayout.length || c.seatCapacity || "4"} seats</span>
                      <div className="flex gap-1">
                        {seatLayout.slice(0, 3).map((s, idx) => (
                          <span key={idx} className="text-[8px] font-medium px-1.5 py-0.5 bg-gray-100 rounded">{s}</span>
                        ))}
                        {seatLayout.length > 3 && <span className="text-[8px] font-medium text-gray-400">+{seatLayout.length - 3}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap"><span className="text-xs font-medium text-green-600">₹{category.baseFare || "0"}</span></td>
                  <td className="px-5 py-3 whitespace-nowrap"><span className="text-xs font-medium text-orange-600">₹{category.privateRatePerKm || "0"}/km</span></td>
                  <td className="px-5 py-3 whitespace-nowrap"><span className="text-xs font-medium text-purple-600">₹{category.sharedRatePerSeatPerKm || "0"}/km</span></td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {c.isActive ?
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-medium">Active</span> :
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-medium">Inactive</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {paginatedData.length === 0 && <div className="py-20 text-center"><p className="text-sm font-medium text-gray-400">No cars found</p></div>}
      </div>

      {/* Pagination */}
      <div className="px-5 py-3 flex items-center justify-between border-t" style={{ borderColor }}>
        <p className="text-xs text-gray-500">
          Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredCars.length)} of {filteredCars.length}
        </p>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <FaChevronLeft size={12} />
          </button>
          <span className="text-sm font-medium text-gray-700">Page {currentPage} of {totalPages || 1}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <FaChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Content Component: Drivers ---
function DriversTab({ drivers, themeColors, theme, borderColor, textColorSecondary, fetchData, fetching }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [image, setImage] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [viewing, setViewing] = useState(null);

  // Driver status distribution for charts
  const driverStatusData = [
    { name: 'Approved', value: drivers.filter(d => d.isApproved).length, color: CHART_COLORS.green },
    { name: 'Pending', value: drivers.filter(d => !d.isApproved && !d.isRejected).length, color: CHART_COLORS.orange },
    { name: 'Rejected', value: drivers.filter(d => d.isRejected).length, color: CHART_COLORS.red }
  ].filter(item => item.value > 0);

  const driverActiveData = [
    { name: 'Active', value: drivers.filter(d => d.isActive).length, color: CHART_COLORS.green },
    { name: 'Inactive', value: drivers.filter(d => !d.isActive).length, color: CHART_COLORS.gray }
  ].filter(item => item.value > 0);

  const filteredDrivers = useMemo(() => drivers.filter(d =>
    d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.fleetId?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.licenseNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  ), [drivers, searchQuery]);

  const paginatedData = useMemo(() => filteredDrivers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [filteredDrivers, currentPage]);
  const totalPages = Math.ceil(filteredDrivers.length / rowsPerPage);

  const handleToggleApproval = async (d) => {
    try {
      await toggleDriverApproval(d._id, !d.isApproved);
      fetchData();
    } catch { }
  };

  const handleEdit = (d) => {
    setEditingId(d._id);
    setForm({ name: d.name || "", email: d.email || "", phone: d.phone || "", licenseNumber: d.licenseNumber || "" });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoadingAction(true);
      const payload = new FormData();
      Object.entries(form).forEach(([k, v]) => payload.append(k, v));
      if (image) payload.append("image", image);
      await updateFleetDriver(editingId, payload);
      setIsModalOpen(false);
      fetchData();
    } catch { } finally { setLoadingAction(false); }
  };

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  return (
    <div className="space-y-4 relative">
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 sm:p-6 bg-gray-50/50 border-b border-gray-200">
        <ChartCard title="Driver Status" subtitle="Approved vs Pending vs Rejected" icon={PieChartIcon}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={driverStatusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {driverStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Driver Activity" subtitle="Active vs Inactive" icon={Activity}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={driverActiveData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {driverActiveData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 px-4 sm:px-6">
        <div className="relative flex-1 lg:max-w-md">
          <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: textColorSecondary }} />
          <input type="text" placeholder="Search by name, phone, license..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 h-10 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-blue-500/20"
            style={{ backgroundColor: themeColors.background, borderColor, color: themeColors.text }} />
        </div>
        <button onClick={fetchData} className="px-5 h-10 rounded-lg font-black text-[10px] sm:text-xs transition-all flex items-center justify-center gap-2 active:scale-95 uppercase tracking-widest shadow-md"
          style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
          <FaSyncAlt size={11} className={fetching ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2 px-4 sm:px-6 overflow-x-auto scrollbar-hide">
        <SubStatBox icon={FaUserTie} label="TOTAL DRIVERS" value={drivers.length} colorHex={themeColors.primary} themeColors={themeColors} borderColor={borderColor} textColorSecondary={textColorSecondary} />
        <SubStatBox icon={FaCheckCircle} label="APPROVED" value={drivers.filter(d => d.isApproved).length} colorHex={CHART_COLORS.green} themeColors={themeColors} borderColor={borderColor} textColorSecondary={textColorSecondary} />
        <SubStatBox icon={FaClock} label="PENDING" value={drivers.filter(d => !d.isApproved && !d.isRejected).length} colorHex={CHART_COLORS.orange} themeColors={themeColors} borderColor={borderColor} textColorSecondary={textColorSecondary} />
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="border-b" style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderColor }}>
              {["Fleet", "Driver", "Contact", "License", "Status", "Actions"].map((th, i) => (
                <th key={th} className={`px-5 py-4 text-[9px] font-black uppercase tracking-wider text-left`} style={{ color: textColorSecondary }}>{th}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: borderColor + "40" }}>
            {paginatedData.map(d => (
              <tr key={d._id} className="transition-all hover:bg-black/5 dark:hover:bg-white/5">
                <td className="px-5 py-3 whitespace-nowrap">
                  <span className="text-xs font-medium text-gray-900">{d.fleetId?.companyName || "Independent"}</span>
                  <p className="text-[10px] text-gray-500">{d.fleetId?.name || "System"}</p>
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full border border-gray-100 bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden shrink-0">
                      {d.image ? (
                        <img src={`${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '')}/uploads/${d.image}`} alt={d.name} className="w-full h-full object-cover" />
                      ) : (
                        <FaUserTie size={14} className="text-blue-600" />
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-900">{d.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <p className="text-sm text-gray-900">{d.phone}</p>
                  <p className="text-xs text-gray-500">{d.email || '—'}</p>
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">{d.licenseNumber || 'N/A'}</span>
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${d.isApproved ? 'bg-green-100 text-green-700' :
                      d.isRejected ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                      {d.isApproved ? 'Approved' : d.isRejected ? 'Rejected' : 'Pending'}
                    </span>
                    <button onClick={() => handleToggleApproval(d)} className={`${d.isActive ? 'text-green-600' : 'text-gray-300'}`}>
                      {d.isActive ? <FaToggleOn size={18} /> : <FaToggleOff size={18} />}
                    </button>
                  </div>
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setViewing(d)} className="p-1.5 hover:bg-gray-100 rounded text-blue-600"><FaEye size={14} /></button>
                    <button onClick={() => handleEdit(d)} className="p-1.5 hover:bg-gray-100 rounded text-orange-600"><FaEdit size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {paginatedData.length === 0 && <div className="py-20 text-center"><p className="text-sm font-medium text-gray-400">No drivers found</p></div>}
      </div>

      {/* View Modal */}
      {viewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Driver Details</h3>
              <button onClick={() => setViewing(null)} className="p-1 hover:bg-gray-100 rounded">
                <FaTimes size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="w-16 h-16 rounded-2xl border-2 border-white shadow-lg bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden">
                  {viewing.image ? (
                    <img src={`${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '')}/uploads/${viewing.image}`} alt={viewing.name} className="w-full h-full object-cover" />
                  ) : (
                    <FaUserTie size={24} className="text-blue-600" />
                  )}
                </div>
                <div>
                  <p className="text-xl font-black text-gray-900">{viewing.name}</p>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{viewing.fleetId?.companyName || "Independent"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{viewing.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="text-sm font-medium text-gray-900">{viewing.email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">License</p>
                  <p className="text-sm font-medium text-gray-900">{viewing.licenseNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <p className={`text-sm font-medium ${viewing.isApproved ? 'text-green-600' : 'text-orange-600'}`}>
                    {viewing.isApproved ? 'Approved' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Edit Driver</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <FaTimes size={16} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">License Number</label>
                <input
                  type="text"
                  value={form.licenseNumber}
                  onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loadingAction ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="px-5 py-3 flex items-center justify-between border-t" style={{ borderColor }}>
        <p className="text-xs text-gray-500">
          Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredDrivers.length)} of {filteredDrivers.length}
        </p>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <FaChevronLeft size={12} />
          </button>
          <span className="text-sm font-medium text-gray-700">Page {currentPage} of {totalPages || 1}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <FaChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Content Component: Assignments ---
function AssignmentsTab({ assignments, categories, themeColors, theme, borderColor, textColorSecondary, fetchData, fetching }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Assignment status distribution for charts
  const assignmentStatusData = [
    { name: 'Active', value: assignments.filter(a => a.isAssigned).length, color: CHART_COLORS.green },
    { name: 'Inactive', value: assignments.filter(a => !a.isAssigned).length, color: CHART_COLORS.gray }
  ].filter(item => item.value > 0);

  const filteredAssignments = useMemo(() => assignments.filter(a =>
    (a.driverId?.name || a.driverName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.carId?.carNumber || a.carNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.fleetId?.companyName || '').toLowerCase().includes(searchQuery.toLowerCase())
  ), [assignments, searchQuery]);

  const paginatedData = useMemo(() => filteredAssignments.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [filteredAssignments, currentPage]);
  const totalPages = Math.ceil(filteredAssignments.length / rowsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  return (
    <div className="space-y-4">
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 sm:p-6 bg-gray-50/50 border-b border-gray-200">
        <ChartCard title="Assignment Status" subtitle="Active vs Inactive" icon={PieChartIcon}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={assignmentStatusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {assignmentStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Assignment Timeline" subtitle="Recent assignments" icon={Clock}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={assignments.slice(0, 7).map((a, i) => ({ index: i + 1, count: 1 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="index" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke={CHART_COLORS.primary} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 px-4 sm:px-6">
        <div className="relative flex-1 lg:max-w-md">
          <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: textColorSecondary }} />
          <input type="text" placeholder="Search by driver, vehicle, fleet..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 h-10 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-blue-500/20"
            style={{ backgroundColor: themeColors.background, borderColor, color: themeColors.text }} />
        </div>
        <button onClick={fetchData} className="px-5 h-10 rounded-lg font-black text-[10px] sm:text-xs transition-all flex items-center justify-center gap-2 active:scale-95 uppercase tracking-widest shadow-md"
          style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
          <FaSyncAlt size={11} className={fetching ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2 px-4 sm:px-6 overflow-x-auto scrollbar-hide">
        <SubStatBox icon={FaLink} label="TOTAL ASSIGNMENTS" value={assignments.length} colorHex={themeColors.primary} themeColors={themeColors} borderColor={borderColor} textColorSecondary={textColorSecondary} />
        <SubStatBox icon={FaPlayCircle} label="ACTIVE" value={assignments.filter(a => a.isAssigned).length} colorHex={CHART_COLORS.green} themeColors={themeColors} borderColor={borderColor} textColorSecondary={textColorSecondary} />
        <SubStatBox icon={FaTimesCircle} label="INACTIVE" value={assignments.filter(a => !a.isAssigned).length} colorHex={CHART_COLORS.gray} themeColors={themeColors} borderColor={borderColor} textColorSecondary={textColorSecondary} />
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="border-b" style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderColor }}>
              {["Fleet", "Driver", "Vehicle", "Status", "Assigned Date"].map((th) => (
                <th key={th} className={`px-5 py-4 text-[9px] font-black uppercase tracking-wider text-left`} style={{ color: textColorSecondary }}>{th}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: borderColor + "40" }}>
            {paginatedData.map(a => (
              <tr key={a._id} className="transition-all hover:bg-black/5 dark:hover:bg-white/5">
                <td className="px-5 py-3 whitespace-nowrap">
                  <span className="text-xs font-medium text-gray-900">{a.fleetId?.companyName || "Independent"}</span>
                  <p className="text-[10px] text-gray-500">{a.fleetId?.name || "Provider"}</p>
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <FaUserTie size={14} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{a.driverId?.name || a.driverName || "Unknown"}</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">{a.driverId?.phone || a.driverPhone || "—"}</p>
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">{a.carId?.carModel || a.carModel || "Standard"}</span>
                  <p className="text-xs text-gray-500">{a.carId?.carNumber || a.carNumber || "—"}</p>
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  {a.isAssigned ?
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span> :
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">Inactive</span>
                  }
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <span className="text-sm text-gray-600">
                    {a.assignedAt ? new Date(a.assignedAt).toLocaleDateString() : "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {paginatedData.length === 0 && <div className="py-20 text-center"><p className="text-sm font-medium text-gray-400">No assignments found</p></div>}
      </div>

      {/* Pagination */}
      <div className="px-5 py-3 flex items-center justify-between border-t" style={{ borderColor }}>
        <p className="text-xs text-gray-500">
          Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredAssignments.length)} of {filteredAssignments.length}
        </p>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <FaChevronLeft size={12} />
          </button>
          <span className="text-sm font-medium text-gray-700">Page {currentPage} of {totalPages || 1}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <FaChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Container ---
export default function ManageFleetRegistry() {
  const { themeColors, theme } = useTheme();
  const { currentFont } = useFont();

  const IMAGE_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') + '/uploads/';

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("cars");
  const [cars, setCars] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [categories, setCategories] = useState({});
  const [selectedChart, setSelectedChart] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const resCategories = await getAllCarCategories().catch(() => ({ categories: [] }));
      const catMap = {};
      (resCategories.categories || resCategories.data || []).forEach(cat => { catMap[cat._id] = cat; });
      setCategories(catMap);

      const [resCars, resDrivers, resAssignments] = await Promise.all([
        getAllFleetCars().catch(() => ({ data: [] })),
        getAllFleetDrivers().catch(() => ({ data: [] })),
        getAllFleetAssignments().catch(() => ({ data: [] }))
      ]);

      const extractedCars = Array.isArray(resCars) ? resCars : (resCars?.cars || resCars?.data?.cars || resCars?.data || []);
      const extractedDrivers = resDrivers?.data || resDrivers?.drivers || [];
      const extractedAssignments = resAssignments?.data || resAssignments?.assignments || [];

      setCars(extractedCars);
      setDrivers(extractedDrivers);
      setAssignments(extractedAssignments);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const activeCars = cars.filter(c => c.isActive || c.isAvailable).length;
    const activeDrivers = drivers.filter(d => d.isActive || d.isApproved).length;
    const activeAssignments = assignments.filter(a => a.status === 'Active' || a.isActive || a.isAssigned).length;
    return {
      totalCars: cars.length, activeCars,
      totalDrivers: drivers.length, activeDrivers,
      totalAssignments: assignments.length, activeAssignments
    };
  }, [cars, drivers, assignments]);

  const fleetDistributionData = [
    { name: 'Cars', value: stats.totalCars, color: CHART_COLORS.primary },
    { name: 'Drivers', value: stats.totalDrivers, color: CHART_COLORS.purple },
    { name: 'Assignments', value: stats.totalAssignments, color: CHART_COLORS.green },
  ].filter(d => d.value > 0);

  const activeVsInactiveData = [
    { name: 'Cars', active: stats.activeCars, inactive: Math.max(0, stats.totalCars - stats.activeCars) },
    { name: 'Drivers', active: stats.activeDrivers, inactive: Math.max(0, stats.totalDrivers - stats.activeDrivers) },
    { name: 'Assignments', active: stats.activeAssignments, inactive: Math.max(0, stats.totalAssignments - stats.activeAssignments) },
  ];

  const monthlyTrendData = [
    { month: 'Jan', cars: Math.round(stats.totalCars * 0.7), drivers: Math.round(stats.totalDrivers * 0.6), assignments: Math.round(stats.totalAssignments * 0.5) },
    { month: 'Feb', cars: Math.round(stats.totalCars * 0.8), drivers: Math.round(stats.totalDrivers * 0.7), assignments: Math.round(stats.totalAssignments * 0.6) },
    { month: 'Mar', cars: Math.round(stats.totalCars * 0.9), drivers: Math.round(stats.totalDrivers * 0.8), assignments: Math.round(stats.totalAssignments * 0.7) },
    { month: 'Apr', cars: stats.totalCars, drivers: stats.totalDrivers, assignments: stats.totalAssignments }
  ];

  const borderColor = theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
  const textColorSecondary = theme === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(107, 114, 128, 1)";

  const tabs = [
    { id: "cars", label: "Fleet Inventory", icon: FaCarSide },
    { id: "drivers", label: "Drivers", icon: FaAddressCard },
    { id: "assignments", label: "Assignments", icon: FaSitemap },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-12" style={{ fontFamily: currentFont }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-8 pb-6 px-4 sm:px-8 shadow-sm">
        <div className="max-w-[1700px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Fleet Registry</h1>
              <p className="text-sm text-gray-500 mt-1">Manage fleet cars, drivers, and assignments</p>
            </div>
            <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md">
              <FaSyncAlt className={loading ? 'animate-spin' : ''} size={14} />
              <span className="text-sm font-medium">Refresh Data</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard icon={FaCar} label="Total Cars" value={stats.totalCars} color="blue" subtitle={`${stats.activeCars} Active`} />
            <StatCard icon={FaUsers} label="Total Drivers" value={stats.totalDrivers} color="purple" subtitle={`${stats.activeDrivers} Active`} />
            <StatCard icon={FaLink} label="Assignments" value={stats.totalAssignments} color="green" subtitle={`${stats.activeAssignments} Active`} />
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Chart 1: Fleet Distribution */}
          <ChartCard title="Fleet Distribution" subtitle="Cars vs Drivers vs Assignments" icon={PieChartIcon}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={fleetDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {fleetDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 2: Active vs Inactive */}
          <ChartCard title="Active Status" subtitle="Operational vs Non-operational" icon={BarChart3}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={activeVsInactiveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="active" fill={CHART_COLORS.green} name="Active" radius={[4, 4, 0, 0]} />
                <Bar dataKey="inactive" fill={CHART_COLORS.gray} name="Inactive" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 3: Monthly Trend */}
          <ChartCard title="Monthly Growth" subtitle="Progression over time" icon={TrendingUp}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cars" stroke={CHART_COLORS.blue} strokeWidth={2} />
                <Line type="monotone" dataKey="drivers" stroke={CHART_COLORS.purple} strokeWidth={2} />
                <Line type="monotone" dataKey="assignments" stroke={CHART_COLORS.green} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-8 mt-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">

          {/* Tab Headers */}
          <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-4 border-b-2 transition-all font-medium text-sm
                  ${activeTab === tab.id ? 'bg-white text-blue-600 border-blue-600' : 'text-gray-500 hover:bg-gray-100 border-transparent'}`}>
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === "cars" && <CarsTab cars={cars} categories={categories} themeColors={themeColors} theme={theme} borderColor={borderColor} textColorSecondary={textColorSecondary} fetchData={fetchData} fetching={loading} />}
            {activeTab === "drivers" && <DriversTab drivers={drivers} themeColors={themeColors} theme={theme} borderColor={borderColor} textColorSecondary={textColorSecondary} fetchData={fetchData} fetching={loading} />}
            {activeTab === "assignments" && <AssignmentsTab assignments={assignments} categories={categories} themeColors={themeColors} theme={theme} borderColor={borderColor} textColorSecondary={textColorSecondary} fetchData={fetchData} fetching={loading} />}
          </div>
        </div>
      </div>
    </div>
  );
}