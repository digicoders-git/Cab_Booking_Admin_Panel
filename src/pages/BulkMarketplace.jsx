import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useFont } from "../context/FontContext";
import { getBulkMarketplace, acceptBulkBooking } from "../apis/bulkBooking";
import { 
  FaRoute, FaCar, FaMapMarkerAlt, FaCalendarAlt, 
  FaClock, FaUsers, FaArrowRight, FaSyncAlt, 
  FaInfoCircle, FaCheckCircle, FaWallet, FaTag, FaGavel
} from "react-icons/fa";
import { Toaster, toast } from "sonner";
import Swal from "sweetalert2";

export default function BulkMarketplace() {
  const { themeColors, theme } = useTheme();
  const { currentFont } = useFont();
  const { admin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetchMarketplace();
  }, []);

  const fetchMarketplace = async () => {
    try {
      setFetching(true);
      const res = await getBulkMarketplace();
      if (res.success) {
        setDeals(res.bookings || []);
      }
    } catch (err) {
      toast.error("Failed to fetch marketplace deals");
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  const handleAccept = async (id, price) => {
    const result = await Swal.fire({
      title: 'Accept this Bulk Deal?',
      html: `<p class="text-sm">You are accepting this deal for <strong class="text-green-600">₹${price}</strong>. Once accepted, you must fulfill all car requirements.</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Accept & Lock',
      confirmButtonColor: '#3B82F6',
      background: themeColors.surface,
      color: themeColors.text
    });

    if (result.isConfirmed) {
      try {
        const res = await acceptBulkBooking(id);
        if (res.success) {
          toast.success("Deal Locked! Check 'My Bulk Rides' for details.");
          fetchMarketplace();
        } else {
          toast.error(res.message);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Acceptance failed");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">Loading Marketplace...</p>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50" style={{ fontFamily: currentFont }}>
      <Toaster richColors position="top-right" />
      
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <FaGavel className="text-blue-600" /> Bulk Marketplace
          </h1>
          <p className="text-sm text-gray-500 mt-1 uppercase tracking-widest font-bold">Exclusive Deals for Approved Fleets</p>
        </div>
        <button 
          onClick={fetchMarketplace}
          className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
        >
          <FaSyncAlt className={fetching ? "animate-spin" : ""} />
        </button>
      </div>

      {deals.length === 0 ? (
        <div className="bg-white rounded-3xl p-20 border border-dashed border-gray-300 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaRoute className="text-gray-300 text-3xl" />
          </div>
          <h3 className="text-xl font-bold text-gray-400">No Live Deals Found</h3>
          <p className="text-sm text-gray-500 mt-2">Check back later for new bulk booking requests.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {deals.map((deal) => (
            <div key={deal._id} className="bg-white rounded-3xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all group">
              <div className="p-6 sm:p-8">
                {/* Header Info */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black">
                      #{deal._id.slice(-4).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">New Request</span>
                      <p className="text-xs text-gray-400 mt-1 font-bold">{new Date(deal.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Offered Price</p>
                    <p className="text-3xl font-black text-green-600">₹{deal.offeredPrice.toLocaleString()}</p>
                  </div>
                </div>

                {/* Route */}
                <div className="relative pl-6 space-y-6 mb-8 border-l-2 border-dashed border-gray-200">
                  <div>
                    <FaMapMarkerAlt className="absolute -left-[9px] top-0 text-green-500 bg-white" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pickup</p>
                    <p className="text-sm font-bold text-gray-800">{deal.pickup.address}</p>
                  </div>
                  <div>
                    <FaMapMarkerAlt className="absolute -left-[9px] bottom-0 text-red-500 bg-white" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Drop Off</p>
                    <p className="text-sm font-bold text-gray-800">{deal.drop.address}</p>
                  </div>
                </div>

                {/* Requirements & Schedule */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                  <div className="bg-gray-50 p-3 rounded-2xl">
                    <FaCalendarAlt className="text-blue-600 mb-1" size={12} />
                    <p className="text-[9px] font-black text-gray-400 uppercase">Date</p>
                    <p className="text-xs font-bold text-gray-900">{new Date(deal.pickupDateTime).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-2xl">
                    <FaClock className="text-blue-600 mb-1" size={12} />
                    <p className="text-[9px] font-black text-gray-400 uppercase">Time</p>
                    <p className="text-xs font-bold text-gray-900">{new Date(deal.pickupDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-2xl">
                    <FaUsers className="text-blue-600 mb-1" size={12} />
                    <p className="text-[9px] font-black text-gray-400 uppercase">Duration</p>
                    <p className="text-xs font-bold text-gray-900">{deal.numberOfDays} Day(s)</p>
                  </div>
                </div>

                {/* Specific Cars Requested */}
                <div className="mb-8">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Vehicle Requirements</p>
                  <div className="flex flex-wrap gap-2">
                    {deal.carsRequired.map((car, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-2">
                        <FaCar className="text-blue-600" size={14} />
                        <span className="text-sm font-black text-blue-700">{car.quantity}x</span>
                        <span className="text-xs font-bold text-gray-700">{car.category?.name || "Standard Cab"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <button 
                  onClick={() => handleAccept(deal._id, deal.offeredPrice)}
                  className="w-full py-4 bg-blue-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-blue-700 hover:shadow-xl transition-all flex items-center justify-center gap-3 group"
                >
                  Accept Deal Now
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
