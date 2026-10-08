import React, { useState } from 'react';
import { getCityWiseReportAPI } from '../apis/admin';
import { toast } from 'sonner';
import { Search, MapPin, DollarSign, Calendar, CheckCircle, XCircle, Download } from 'lucide-react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { generateCityReportPDF } from '../utils/reportPdfGenerator';

const libraries = ['places'];

const CityWiseReport = () => {
    const [city, setCity] = useState('');
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [autocomplete, setAutocomplete] = useState(null);

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
                // Try to find the exact city/locality name from components if possible
                const localityInfo = place.address_components.find(c => c.types.includes('locality'));
                if (localityInfo) cityName = localityInfo.long_name;
            }
            setCity(cityName || place.formatted_address || '');
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!city.trim()) return toast.error("Please enter a city name");

        setLoading(true);
        try {
            const res = await getCityWiseReportAPI(city);
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

    const handleDownloadPDF = () => {
        if (!report) return;
        generateCityReportPDF(report);
        toast.success("PDF Download started!");
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <MapPin className="text-blue-600" /> City-Wise Booking Report
                    </h1>
                    <p className="text-gray-500 mt-1">Search bookings and revenue for a specific city or area.</p>
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

            {/* Search Bar */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                <form onSubmit={handleSearch} className="flex items-end gap-4 max-w-2xl">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Enter City Name (e.g. Lucknow, Kanpur)</label>
                        {isLoaded ? (
                            <Autocomplete
                                onLoad={onLoad}
                                onPlaceChanged={onPlaceChanged}
                                options={{ 
                                    componentRestrictions: { country: "in" }
                                }}
                            >
                                <input 
                                    type="text" 
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Type city name..."
                                />
                            </Autocomplete>
                        ) : (
                            <input 
                                type="text" 
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Type city name..."
                            />
                        )}
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-70"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search size={20} />}
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>
            </div>

            {/* Results */}
            {report && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-blue-500">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-50 rounded-lg"><Calendar className="text-blue-600" size={20} /></div>
                                <h3 className="text-sm font-medium text-gray-500">Total Bookings</h3>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{report.summary.totalBookings}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-emerald-500">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-50 rounded-lg"><CheckCircle className="text-emerald-600" size={20} /></div>
                                <h3 className="text-sm font-medium text-gray-500">Completed Rides</h3>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{report.summary.completedRides}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-red-500">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-red-50 rounded-lg"><XCircle className="text-red-600" size={20} /></div>
                                <h3 className="text-sm font-medium text-gray-500">Cancelled Rides</h3>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{report.summary.cancelledRides}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-purple-500">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-purple-50 rounded-lg"><DollarSign className="text-purple-600" size={20} /></div>
                                <h3 className="text-sm font-medium text-gray-500">Revenue Generated</h3>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">₹{report.summary.totalRevenue}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900">Ride Details for "{report.city}"</h3>
                        </div>
                        <div className="overflow-x-auto max-h-[500px]">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Customer</th>
                                        <th className="px-6 py-3">Booking Type</th>
                                        <th className="px-6 py-3">Pickup Address</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Fare</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.bookings.length > 0 ? (
                                        report.bookings.map((booking, idx) => (
                                            <tr key={idx} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4">{new Date(booking.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 font-medium text-gray-900">{booking.customerName}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium border ${
                                                        booking.rideType.includes('Normal') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        booking.rideType.includes('Bulk') ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                        booking.rideType.includes('Fixed') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                        'bg-teal-50 text-teal-700 border-teal-200'
                                                    }`}>
                                                        {booking.rideType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 truncate max-w-xs" title={booking.pickupAddress}>{booking.pickupAddress}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                                        booking.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                        ['Cancelled', 'Expired'].includes(booking.status) ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold">₹{booking.fare}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No bookings found for this city.</td>
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
