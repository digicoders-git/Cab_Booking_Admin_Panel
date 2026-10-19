import React, { useState, useMemo } from 'react';
import { getCityWiseReportAPI } from '../apis/admin';
import { toast } from 'sonner';
import { 
    Search, 
    MapPin, 
    DollarSign, 
    Calendar, 
    Clock, 
    CheckCircle, 
    XCircle, 
    Download, 
    Filter, 
    RotateCcw 
} from 'lucide-react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { generateCityReportPDF } from '../utils/reportPdfGenerator';

const libraries = ['places'];

const CityWiseReport = () => {
    const [city, setCity] = useState('');
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [autocomplete, setAutocomplete] = useState(null);

    // Date & Time Filter States
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('');
    const [activePreset, setActivePreset] = useState('all');

    // In-table Quick Search and Status Filter
    const [tableSearch, setTableSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries
    });

    const onLoad = (auto) => setAutocomplete(auto);
    
    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();
            let cityName = place.name;
            if (place.address_components) {
                const localityInfo = place.address_components.find(c => c.types.includes('locality'));
                if (localityInfo) cityName = localityInfo.long_name;
            }
            setCity(cityName || place.formatted_address || '');
        }
    };

    const applyPreset = (preset) => {
        setActivePreset(preset);
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

        if (preset === 'today') {
            const todayStr = toYMD(now);
            setStartDate(todayStr);
            setEndDate(todayStr);
            setStartTime('00:00');
            setEndTime('23:59');
        } else if (preset === 'yesterday') {
            const y = new Date(now);
            y.setDate(y.getDate() - 1);
            const yStr = toYMD(y);
            setStartDate(yStr);
            setEndDate(yStr);
            setStartTime('00:00');
            setEndTime('23:59');
        } else if (preset === 'week') {
            const past7 = new Date(now);
            past7.setDate(past7.getDate() - 7);
            setStartDate(toYMD(past7));
            setEndDate(toYMD(now));
            setStartTime('00:00');
            setEndTime('23:59');
        } else if (preset === 'month') {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            setStartDate(toYMD(monthStart));
            setEndDate(toYMD(now));
            setStartTime('00:00');
            setEndTime('23:59');
        } else if (preset === 'all') {
            setStartDate('');
            setEndDate('');
            setStartTime('');
            setEndTime('');
        }
    };

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!city.trim()) return toast.error("Please enter a city name");

        setLoading(true);
        try {
            const filters = {
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                startTime: startTime || undefined,
                endTime: endTime || undefined
            };

            const res = await getCityWiseReportAPI(city, filters);
            if (res.success) {
                setReport(res);
                toast.success(`Found ${res.bookings.length} bookings for ${city}`);
            } else {
                toast.error(res.message || "Failed to fetch report");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error fetching report");
        } finally {
            setLoading(false);
        }
    };

    const handleResetFilters = () => {
        setStartDate('');
        setEndDate('');
        setStartTime('');
        setEndTime('');
        setActivePreset('all');
        setTableSearch('');
        setStatusFilter('ALL');
        if (city.trim()) {
            // Re-fetch without date filters
            setLoading(true);
            getCityWiseReportAPI(city, {})
                .then(res => {
                    if (res.success) {
                        setReport(res);
                        toast.info("Date & Time filters reset to All Time");
                    }
                })
                .catch(() => toast.error("Error resetting filters"))
                .finally(() => setLoading(false));
        }
    };

    const handleDownloadPDF = () => {
        if (!report) return;
        generateCityReportPDF(report, { startDate, endDate, startTime, endTime });
        toast.success("PDF Download started!");
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return "N/A";
        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    };

    const formatTime = (dateString) => {
        if (!dateString) return "";
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return "";
        return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    };

    // Filter bookings locally by table search or status dropdown if user types in search
    const filteredBookings = useMemo(() => {
        if (!report?.bookings) return [];
        return report.bookings.filter(b => {
            const matchesStatus = statusFilter === 'ALL' || 
                (statusFilter === 'Completed' && b.status === 'Completed') ||
                (statusFilter === 'Cancelled' && ['Cancelled', 'Expired'].includes(b.status)) ||
                (statusFilter === 'Pending' && !['Completed', 'Cancelled', 'Expired'].includes(b.status));

            const q = tableSearch.toLowerCase().trim();
            const matchesSearch = !q || 
                (b.customerName && b.customerName.toLowerCase().includes(q)) ||
                (b.pickupAddress && b.pickupAddress.toLowerCase().includes(q)) ||
                (b.rideType && b.rideType.toLowerCase().includes(q)) ||
                (b.id && String(b.id).toLowerCase().includes(q));

            return matchesStatus && matchesSearch;
        });
    }, [report, statusFilter, tableSearch]);

    // Dynamic metrics based on filtered bookings
    const summaryMetrics = useMemo(() => {
        if (!report) return null;
        let totalRevenue = 0;
        let completedRides = 0;
        let cancelledRides = 0;

        filteredBookings.forEach(b => {
            if (b.status === 'Completed') {
                completedRides++;
                totalRevenue += (b.fare || 0);
            } else if (['Cancelled', 'Expired'].includes(b.status)) {
                cancelledRides++;
            }
        });

        return {
            totalBookings: filteredBookings.length,
            completedRides,
            cancelledRides,
            totalRevenue
        };
    }, [report, filteredBookings]);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <MapPin className="text-blue-600" /> City-Wise Booking Report
                    </h1>
                    <p className="text-gray-500 mt-1">Search bookings, revenue, and analyze rides with flexible Date & Time filters.</p>
                </div>
                {report && (
                    <button
                        onClick={handleDownloadPDF}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Download size={18} /> Download PDF
                    </button>
                )}
            </div>

            {/* Filter Section Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                <form onSubmit={handleSearch}>
                    {/* Top Row: City Search */}
                    <div className="mb-4">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                            City / Location Name <span className="text-red-500">*</span>
                        </label>
                        {isLoaded ? (
                            <Autocomplete
                                onLoad={onLoad}
                                onPlaceChanged={onPlaceChanged}
                                options={{ componentRestrictions: { country: "in" } }}
                            >
                                <div className="relative">
                                    <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="text" 
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                        placeholder="Type city name (e.g. Lucknow, Kanpur, Delhi, Mumbai)..."
                                    />
                                </div>
                            </Autocomplete>
                        ) : (
                            <div className="relative">
                                <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    placeholder="Type city name (e.g. Lucknow, Kanpur, Delhi)..."
                                />
                            </div>
                        )}
                    </div>

                    {/* Quick Preset Date Buttons */}
                    <div className="mb-4">
                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                            <Clock size={14} className="text-blue-500" /> Quick Date Range Presets:
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { key: 'all', label: 'All Time' },
                                { key: 'today', label: 'Today' },
                                { key: 'yesterday', label: 'Yesterday' },
                                { key: 'week', label: 'Last 7 Days' },
                                { key: 'month', label: 'This Month' }
                            ].map(p => (
                                <button
                                    key={p.key}
                                    type="button"
                                    onClick={() => applyPreset(p.key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        activePreset === p.key
                                            ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date & Time Picker Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200/80 mb-5">
                        {/* Start Date */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                                <Calendar size={14} className="text-blue-600" /> From Date
                            </label>
                            <input 
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setActivePreset('custom');
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Start Time */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                                <Clock size={14} className="text-blue-600" /> From Time
                            </label>
                            <input 
                                type="time"
                                value={startTime}
                                onChange={(e) => {
                                    setStartTime(e.target.value);
                                    setActivePreset('custom');
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                                <Calendar size={14} className="text-blue-600" /> To Date
                            </label>
                            <input 
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setActivePreset('custom');
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* End Time */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                                <Clock size={14} className="text-blue-600" /> To Time
                            </label>
                            <input 
                                type="time"
                                value={endTime}
                                onChange={(e) => {
                                    setEndTime(e.target.value);
                                    setActivePreset('custom');
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                            {(startDate || endDate || startTime || endTime) ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium">
                                    <Filter size={13} /> Active Filter: {startDate || 'Start'} {startTime || ''} → {endDate || 'End'} {endTime || ''}
                                </span>
                            ) : (
                                <span>Showing all dates & times</span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {(startDate || endDate || startTime || endTime || city) && (
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
                                >
                                    <RotateCcw size={15} /> Reset
                                </button>
                            )}
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-70 shadow-sm"
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Search size={16} />
                                )}
                                {loading ? 'Fetching Report...' : 'Search / Apply Filter'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Results Section */}
            {report && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* KPI Cards */}
                    {summaryMetrics && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-blue-500">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-50 rounded-lg"><Calendar className="text-blue-600" size={18} /></div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Bookings</h3>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{summaryMetrics.totalBookings}</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-emerald-500">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-emerald-50 rounded-lg"><CheckCircle className="text-emerald-600" size={18} /></div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed Rides</h3>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{summaryMetrics.completedRides}</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-red-500">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-red-50 rounded-lg"><XCircle className="text-red-600" size={18} /></div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cancelled Rides</h3>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{summaryMetrics.cancelledRides}</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-purple-500">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-purple-50 rounded-lg"><DollarSign className="text-purple-600" size={18} /></div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue Generated</h3>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">₹{summaryMetrics.totalRevenue.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    )}

                    {/* Bookings Table Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Table Header Toolbar */}
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                    Ride Details for <span className="text-blue-600">"{report.city}"</span>
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Showing {filteredBookings.length} of {report.bookings.length} bookings
                                </p>
                            </div>

                            {/* Table Quick Filters */}
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Search in Table */}
                                <div className="relative min-w-[200px]">
                                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="text"
                                        value={tableSearch}
                                        onChange={(e) => setTableSearch(e.target.value)}
                                        placeholder="Search customer, address..."
                                        className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Status Filter */}
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-700 font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="ALL">All Statuses</option>
                                    <option value="Completed">Completed Only</option>
                                    <option value="Cancelled">Cancelled / Expired</option>
                                    <option value="Pending">Other / Ongoing</option>
                                </select>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto max-h-[600px]">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 shadow-sm">
                                    <tr>
                                        <th className="px-6 py-3.5">Date & Time</th>
                                        <th className="px-6 py-3.5">Customer</th>
                                        <th className="px-6 py-3.5">Booking Type</th>
                                        <th className="px-6 py-3.5">Pickup Address</th>
                                        <th className="px-6 py-3.5">Status</th>
                                        <th className="px-6 py-3.5 text-right">Fare</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredBookings.length > 0 ? (
                                        filteredBookings.map((booking, idx) => (
                                            <tr key={booking.id || idx} className="bg-white hover:bg-blue-50/40 transition-colors">
                                                <td className="px-6 py-3.5 whitespace-nowrap">
                                                    <div className="font-medium text-gray-900">{formatDate(booking.createdAt)}</div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <Clock size={11} className="text-gray-400" />
                                                        {formatTime(booking.createdAt)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5 font-medium text-gray-900">
                                                    {booking.customerName}
                                                </td>
                                                <td className="px-6 py-3.5 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                                                        booking.rideType?.includes('Normal') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        booking.rideType?.includes('Bulk') ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                        booking.rideType?.includes('Fixed') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                        'bg-teal-50 text-teal-700 border-teal-200'
                                                    }`}>
                                                        {booking.rideType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5 max-w-xs truncate text-gray-600" title={booking.pickupAddress}>
                                                    {booking.pickupAddress || 'N/A'}
                                                </td>
                                                <td className="px-6 py-3.5 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                        booking.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                        ['Cancelled', 'Expired'].includes(booking.status) ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5 text-right font-bold text-gray-900 whitespace-nowrap">
                                                    ₹{booking.fare}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Calendar size={32} className="text-gray-300 mb-2" />
                                                    <p className="font-medium text-gray-700">No bookings match the selected date/time or filters.</p>
                                                    <p className="text-xs text-gray-400 mt-1">Try expanding the date range or clearing the filter.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CityWiseReport;
