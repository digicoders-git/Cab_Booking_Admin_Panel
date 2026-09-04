import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getNewBookingsAPI, markAllBookingsReadAPI } from '../apis/admin';
import { Inbox, CheckCircle2, MapPin, Calendar, Phone, User, Tag } from 'lucide-react';

const NewBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);

    useEffect(() => {
        fetchNewBookings();
    }, []);

    const fetchNewBookings = async () => {
        setLoading(true);
        try {
            const res = await getNewBookingsAPI();
            if (res.success) {
                setBookings(res.data);
            }
        } catch (error) {
            toast.error("Failed to fetch new bookings");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAllRead = async () => {
        if (bookings.length === 0) return;
        setMarking(true);
        try {
            const res = await markAllBookingsReadAPI();
            if (res.success) {
                toast.success(res.message);
                setBookings([]); // Clear the list
            }
        } catch (error) {
            toast.error("Failed to mark bookings as read");
        } finally {
            setMarking(false);
        }
    };

    const getBadgeColor = (type) => {
        switch (type) {
            case 'Normal Booking': return 'bg-blue-100 text-blue-800';
            case 'Bulk Booking': return 'bg-purple-100 text-purple-800';
            case 'Fixed Package': return 'bg-orange-100 text-orange-800';
            case 'Agent Lead': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Inbox className="w-6 h-6 text-blue-600" />
                            New Bookings (Inbox)
                        </h1>
                        <p className="text-gray-500 mt-1">Review all freshly requested bookings</p>
                    </div>

                    <button
                        onClick={handleMarkAllRead}
                        disabled={marking || bookings.length === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                            bookings.length === 0 || marking 
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        }`}
                    >
                        <CheckCircle2 className="w-5 h-5" />
                        {marking ? 'Marking...' : 'Mark All as Read'}
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">You're all caught up!</h3>
                        <p className="text-gray-500">There are no new unread bookings at the moment.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {bookings.map((booking) => (
                            <div key={booking._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-50 rounded-lg">
                                            <Tag className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getBadgeColor(booking.type)}`}>
                                                {booking.type}
                                            </span>
                                            <p className="text-xs text-gray-400 mt-1">ID: {booking._id}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-medium px-2 py-1 bg-yellow-50 text-yellow-700 rounded border border-yellow-100">
                                            {booking.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center gap-3 text-sm">
                                        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <span className="font-medium text-gray-900">{booking.customerName}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <span className="text-gray-600">{booking.phone}</span>
                                    </div>
                                    <div className="flex gap-3 text-sm">
                                        <MapPin className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-600 line-clamp-2">{booking.pickup}</span>
                                    </div>
                                    {booking.drop !== "N/A" && (
                                        <div className="flex gap-3 text-sm">
                                            <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-gray-600 line-clamp-2">{booking.drop}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                                    <Calendar className="w-4 h-4" />
                                    <span>Created: {new Date(booking.date).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewBookings;
