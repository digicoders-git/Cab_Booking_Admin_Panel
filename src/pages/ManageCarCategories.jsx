import { useState, useEffect, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import {
  getAllCarCategories, createCarCategory, updateCarCategory, deleteCarCategory
} from "../apis/carCategory";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line
} from 'recharts';
import {
  FaPlus, FaEdit, FaTrash, FaSyncAlt, FaSearch, FaCar,
  FaCheckCircle, FaUsers, FaTachometerAlt,
  FaImage, FaTimes, FaToggleOn, FaToggleOff, FaArrowRight,
  FaChartPie, FaChartBar, FaChartLine
} from "react-icons/fa";
import {
  TrendingUp, DollarSign, Activity, PieChart as PieChartIcon,
  BarChart3, LineChart as LineChartIcon, Clock, Filter, Download, Users
} from 'lucide-react';
import { Toaster, toast } from "sonner";
import Swal from "sweetalert2";

// Chart Colors
const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#F59E0B',
  red: '#EF4444',
  gray: '#9CA3AF',
  cyan: '#06B6D4',
  orange: '#F97316'
};

// Chart Card Component
const ChartCard = ({ title, subtitle, icon: Icon, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="p-2 bg-blue-50 rounded-lg">
        <Icon className="text-blue-600" size={20} />
      </div>
    </div>
    {children}
  </div>
);

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color, trend }) => (
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
  </div>
);

// Price Badge Component
const PriceBadge = ({ label, value, icon: Icon }) => (
  <div className="flex flex-col bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-blue-200 transition-all">
    <div className="flex items-center gap-1.5 mb-1">
      {Icon && <Icon size={12} className="text-blue-600" />}
      <span className="text-xs font-medium text-gray-500">{label}</span>
    </div>
    <span className="text-lg font-bold text-gray-900">₹{value}</span>
  </div>
);

export default function ManageCarCategories() {
  const { themeColors, theme } = useTheme();
  const { currentFont } = useFont();

  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(true);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedChart, setSelectedChart] = useState('all');

  const [formData, setFormData] = useState({
    name: "",
    seatCapacity: "4",
    baseFare: "0",
    privateRatePerKm: "0",
    sharedRatePerSeatPerKm: "0",
    avgSpeedKmH: "30",
    seatLayout: ["Front", "Back-Left", "Back-Middle", "Back-Right"],
    image: null
  });

  const borderColor = useMemo(() => {
    return themeColors.border || (theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)");
  }, [theme, themeColors]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setFetching(true);
      const res = await getAllCarCategories();
      if (res.success) setCategories(res.categories || []);
    } catch (err) {
      toast.error("Failed to fetch catalog");
    } finally {
      setFetching(false);
      setLoading(false);
    }
  };

  // Statistics for charts
  const stats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter(c => c.isActive).length;
    const inactive = total - active;

    const avgBaseFare = categories.reduce((sum, c) => sum + (parseFloat(c.baseFare) || 0), 0) / (total || 1);
    const avgPrivateRate = categories.reduce((sum, c) => sum + (parseFloat(c.privateRatePerKm) || 0), 0) / (total || 1);
    const avgSharedRate = categories.reduce((sum, c) => sum + (parseFloat(c.sharedRatePerSeatPerKm) || 0), 0) / (total || 1);
    const avgSpeed = categories.reduce((sum, c) => sum + (parseFloat(c.avgSpeedKmH) || 0), 0) / (total || 1);

    const totalSeats = categories.reduce((sum, c) => sum + (parseInt(c.seatCapacity) || 0), 0);

    return {
      total, active, inactive,
      avgBaseFare, avgPrivateRate, avgSharedRate, avgSpeed,
      totalSeats
    };
  }, [categories]);

  // Chart 1: Category Status Distribution - Pie Chart
  const statusData = [
    { name: 'Active', value: stats.active, color: CHART_COLORS.green },
    { name: 'Inactive', value: stats.inactive, color: CHART_COLORS.gray }
  ].filter(item => item.value > 0);

  // Chart 2: Fare Comparison - Bar Chart
  const fareData = categories.slice(0, 6).map(c => ({
    name: c.name?.substring(0, 10) || 'Unknown',
    baseFare: parseFloat(c.baseFare) || 0,
    privateRate: parseFloat(c.privateRatePerKm) || 0,
    sharedRate: parseFloat(c.sharedRatePerSeatPerKm) || 0
  }));

  // Chart 3: Seat Capacity Distribution - Bar Chart
  const seatData = categories.slice(0, 6).map(c => ({
    name: c.name?.substring(0, 10) || 'Unknown',
    seats: parseInt(c.seatCapacity) || 0,
    speed: parseInt(c.avgSpeedKmH) || 0
  }));

  // Chart 4: Price Trends - Line Chart
  const priceTrendData = categories.map((c, index) => ({
    index: index + 1,
    baseFare: parseFloat(c.baseFare) || 0,
    privateRate: parseFloat(c.privateRatePerKm) || 0,
    sharedRate: parseFloat(c.sharedRatePerSeatPerKm) || 0
  }));

  const filteredCategories = useMemo(() => {
    return categories.filter(c =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'image' && !formData[key]) return;
      if (key === 'seatLayout') {
        data.append(key, JSON.stringify(formData[key]));
      } else {
        data.append(key, formData[key]);
      }
    });

    try {
      setLoading(true);
      const res = editingCategory
        ? await updateCarCategory(editingCategory._id, data)
        : await createCarCategory(data);

      if (res.success) {
        toast.success(editingCategory ? "Category Updated" : "Category Created");
        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: "", seatCapacity: "4", baseFare: "0", privateRatePerKm: "0", sharedRatePerSeatPerKm: "0", avgSpeedKmH: "30", seatLayout: ["Front", "Back-Left", "Back-Middle", "Back-Right"], image: null });
        fetchData();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Operation Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const res = await Swal.fire({
      title: "Delete Category?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      confirmButtonText: "Delete",
      background: themeColors.surface,
      color: themeColors.text
    });

    if (res.isConfirmed) {
      const resp = await deleteCarCategory(id);
      if (resp.success) {
        toast.success("Category Deleted");
        fetchData();
      }
    }
  };

  const startEdit = (c) => {
    let layout = c.seatLayout;
    if (typeof layout === 'string') {
      try { layout = JSON.parse(layout); } catch (e) { layout = []; }
    }
    setEditingCategory(c);
    setFormData({
      name: c.name,
      seatCapacity: c.seatCapacity,
      baseFare: c.baseFare,
      privateRatePerKm: c.privateRatePerKm,
      sharedRatePerSeatPerKm: c.sharedRatePerSeatPerKm,
      avgSpeedKmH: c.avgSpeedKmH,
      seatLayout: layout || ["Front", "Back-Left", "Back-Middle", "Back-Right"],
      image: null
    });
    setIsModalOpen(true);
  };

  const handleToggle = async (c) => {
    const data = new FormData();
    data.append("isActive", !c.isActive);
    const res = await updateCarCategory(c._id, data);
    if (res.success) {
      toast.success(`${c.name} ${!c.isActive ? 'Activated' : 'Suspended'}`);
      fetchData();
    }
  };

  const addSeat = () => {
    const newLayout = [...formData.seatLayout, "New Seat"];
    setFormData(prev => ({ ...prev, seatLayout: newLayout, seatCapacity: newLayout.length }));
  };

  const removeSeat = (index) => {
    const newLayout = formData.seatLayout.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, seatLayout: newLayout, seatCapacity: newLayout.length }));
  };

  const updateSeat = (index, value) => {
    const newLayout = [...formData.seatLayout];
    newLayout[index] = value;
    setFormData(prev => ({ ...prev, seatLayout: newLayout }));
  };

  if (loading && categories.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-gray-500">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" style={{ fontFamily: currentFont }}>
      <Toaster richColors position="top-right" />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Fleet Management</span>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Car Categories</h1>
            <p className="text-sm text-gray-500 mt-1">Manage vehicle classifications and pricing</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
            >
              <FaPlus size={14} />
              <span>New Category</span>
            </button>
            <button
              onClick={fetchData}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaSyncAlt size={16} className={fetching ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FaCar} label="Total Categories" value={stats.total} color="blue" trend={12} />
        <StatCard icon={FaCheckCircle} label="Active Categories" value={stats.active} color="green" trend={8} />
        <StatCard icon={FaTachometerAlt} label="Avg Speed" value={`${stats.avgSpeed.toFixed(1)} km/h`} color="purple" />
        <StatCard icon={DollarSign} label="Avg Base Fare" value={`₹${stats.avgBaseFare.toFixed(0)}`} color="orange" trend={5} />
      </div>

      {/* Chart Selector */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {['all', 'status', 'fares', 'seats', 'trends'].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedChart(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedChart === type
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
        {/* Chart 1: Status Distribution */}
        {(selectedChart === 'all' || selectedChart === 'status') && (
          <ChartCard title="Category Status" subtitle="Active vs Inactive" icon={PieChartIcon}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
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
            <div className="flex justify-center gap-6 mt-4">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        )}

        {/* Chart 2: Fare Comparison */}
        {(selectedChart === 'all' || selectedChart === 'fares') && (
          <ChartCard title="Fare Comparison" subtitle="Base Fare vs Rates per KM" icon={BarChart3}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={fareData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="baseFare" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} name="Base Fare" />
                <Bar dataKey="privateRate" fill={CHART_COLORS.green} radius={[4, 4, 0, 0]} name="Private/km" />
                <Bar dataKey="sharedRate" fill={CHART_COLORS.orange} radius={[4, 4, 0, 0]} name="Shared/km" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Chart 3: Seat Capacity */}
        {(selectedChart === 'all' || selectedChart === 'seats') && (
          <ChartCard title="Seat Capacity" subtitle="Seats vs Speed" icon={Users}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={seatData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="seats" fill={CHART_COLORS.purple} radius={[4, 4, 0, 0]} name="Seats" />
                <Bar yAxisId="right" dataKey="speed" fill={CHART_COLORS.cyan} radius={[4, 4, 0, 0]} name="Speed" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Chart 4: Price Trends */}
        {(selectedChart === 'all' || selectedChart === 'trends') && (
          <ChartCard title="Price Trends" subtitle="Rate progression" icon={TrendingUp}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={priceTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="index" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="baseFare" stroke={CHART_COLORS.blue} strokeWidth={2} name="Base Fare" />
                <Line type="monotone" dataKey="privateRate" stroke={CHART_COLORS.green} strokeWidth={2} name="Private" />
                <Line type="monotone" dataKey="sharedRate" stroke={CHART_COLORS.orange} strokeWidth={2} name="Shared" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((c) => (
          <div
            key={c._id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all group"
          >
            {/* Image */}
            <div className="h-48 bg-gray-100 relative overflow-hidden">
              {c.image ? (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '')}/uploads/${c.image}`}
                    alt={c.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FaCar size={48} className="text-gray-300" />
                </div>
              )}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => startEdit(c)}
                  className="p-2 bg-white rounded-lg shadow-lg hover:bg-blue-50 transition-colors"
                >
                  <FaEdit size={14} className="text-blue-600" />
                </button>
                <button
                  onClick={() => handleDelete(c._id)}
                  className="p-2 bg-white rounded-lg shadow-lg hover:bg-red-50 transition-colors"
                >
                  <FaTrash size={14} className="text-red-600" />
                </button>
              </div>
              <div className="absolute bottom-4 left-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{c.name}</h3>

              {/* Specs */}
              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <FaUsers size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">{c.seatCapacity} seats</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaTachometerAlt size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">{c.avgSpeedKmH} km/h</span>
                </div>
              </div>

              {/* Seat Layout */}
              <div className="flex flex-wrap gap-1 mb-4">
                {(typeof c.seatLayout === 'string' ? JSON.parse(c.seatLayout) : (c.seatLayout || [])).map((s, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                    {s}
                  </span>
                ))}
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <span className="text-xs text-blue-600 block">Base</span>
                  <span className="text-sm font-bold text-blue-700">₹{c.baseFare}</span>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <span className="text-xs text-green-600 block">Private</span>
                  <span className="text-sm font-bold text-green-700">₹{c.privateRatePerKm}</span>
                </div>
                <div className="text-center p-2 bg-orange-50 rounded-lg">
                  <span className="text-xs text-orange-600 block">Shared</span>
                  <span className="text-sm font-bold text-orange-700">₹{c.sharedRatePerSeatPerKm}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleToggle(c)}
                  className={`flex items-center gap-2 text-sm ${c.isActive ? 'text-green-600' : 'text-gray-400'
                    }`}
                >
                  {c.isActive ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                  <span>{c.isActive ? 'Active' : 'Inactive'}</span>
                </button>
                <button
                  onClick={() => startEdit(c)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Edit Details
                  <FaArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Basic Information</h3>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Category Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="e.g., Economy Sedan"
                  />
                </div>
              </div>

              {/* Specs */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Seat Capacity</label>
                    <input
                      type="number"
                      value={formData.seatLayout.length}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Avg Speed (km/h)</label>
                    <input
                      type="number"
                      value={formData.avgSpeedKmH}
                      onChange={(e) => setFormData({ ...formData, avgSpeedKmH: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Pricing (₹)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Base Fare</label>
                    <input
                      type="number"
                      value={formData.baseFare}
                      onFocus={(e) => { if (e.target.value === '0') setFormData(p => ({ ...p, baseFare: '' })) }}
                      onBlur={(e) => { if (e.target.value === '') setFormData(p => ({ ...p, baseFare: '0' })) }}
                      onChange={(e) => setFormData({ ...formData, baseFare: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Private/km</label>
                    <input
                      type="number"
                      value={formData.privateRatePerKm}
                      onFocus={(e) => { if (e.target.value === '0') setFormData(p => ({ ...p, privateRatePerKm: '' })) }}
                      onBlur={(e) => { if (e.target.value === '') setFormData(p => ({ ...p, privateRatePerKm: '0' })) }}
                      onChange={(e) => setFormData({ ...formData, privateRatePerKm: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Shared/km</label>
                    <input
                      type="number"
                      value={formData.sharedRatePerSeatPerKm}
                      onFocus={(e) => { if (e.target.value === '0') setFormData(p => ({ ...p, sharedRatePerSeatPerKm: '' })) }}
                      onBlur={(e) => { if (e.target.value === '') setFormData(p => ({ ...p, sharedRatePerSeatPerKm: '0' })) }}
                      onChange={(e) => setFormData({ ...formData, sharedRatePerSeatPerKm: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Seat Layout */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Seat Layout</h3>
                  <button
                    type="button"
                    onClick={addSeat}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Add Seat
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.seatLayout.map((seat, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={seat}
                        onChange={(e) => updateSeat(index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeSeat(index)}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      >
                        <FaTimes size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image */}
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Category Image {!editingCategory && <span className="text-red-500">*</span>}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                  required={!editingCategory}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}