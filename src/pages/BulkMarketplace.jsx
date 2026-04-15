import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useFont } from "../context/FontContext";
import { getBulkMarketplace, acceptBulkBooking } from "../apis/bulkBooking";
import {
  FaRoute, FaCar, FaCalendarAlt, FaClock,
  FaGavel, FaRoad, FaUser, FaPhone, FaMapMarkerAlt
} from "react-icons/fa";
import { Toaster, toast } from "sonner";
import Swal from "sweetalert2";

export default function BulkMarketplace() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => { fetchMarketplace(); }, []);

  const fetchMarketplace = async () => {
    try {
      setFetching(true);
      const res = await getBulkMarketplace();
      if (res.success) setDeals(res.bookings || []);
    } catch {
      toast.error("Failed to fetch marketplace deals");
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  const handleAccept = async (id, price) => {
    const result = await Swal.fire({
      title: "Accept this Bulk Deal?",
      html: `<p style="font-size:14px">Locking deal for <strong style="color:#16a34a">₹${price.toLocaleString()}</strong>. You must fulfill all vehicle requirements.</p>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Accept & Lock",
      confirmButtonColor: "#2563eb",
      background: themeColors.surface,
      color: themeColors.text,
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
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-semibold text-sm">Loading Marketplace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6" style={{ fontFamily: currentFont }}>
      <Toaster richColors position="top-right" />

      {/* Header */}
      <div className="mb-8 flex items-center justify-between ps-2">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <FaGavel className="text-white text-base" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">Bulk Marketplace</h1>
          </div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ps-1">
            Live Deals · Approved Fleets Only
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-black text-gray-700">{deals.length} Live Deal{deals.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Empty State */}
      {deals.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-24 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <FaRoute className="text-gray-300 text-3xl" />
          </div>
          <h3 className="text-lg font-bold text-gray-400">No Live Deals Right Now</h3>
          <p className="text-sm text-gray-400 mt-1">Check back later for new bulk booking requests.</p>
          <button onClick={fetchMarketplace} className="mt-6 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all">
            Refresh
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {deals.map((deal) => (
            <DealCard key={deal._id} deal={deal} onAccept={handleAccept} />
          ))}
        </div>
      )}
    </div>
  );
}

function DealCard({ deal, onAccept }) {
  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">

      {/* Top Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-white text-xs font-black">#{deal._id.slice(-4).toUpperCase()}</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-black text-white/90 uppercase tracking-widest">Live</span>
            </div>
            <p className="text-xs text-white/60 font-semibold mt-0.5">{timeAgo(deal.createdAt)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-0.5">Offered Price</p>
          <p className="text-3xl font-black text-white">₹{deal.offeredPrice.toLocaleString()}</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-4 flex-1">

        {/* Requester Info */}
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-base font-black">{deal.createdBy?.name?.charAt(0)?.toUpperCase() || "?"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <FaUser size={11} className="text-blue-500" />
              <p className="text-sm font-bold text-gray-800 truncate">{deal.createdBy?.name || "Unknown"}</p>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <FaPhone size={10} className="text-blue-400" />
              <p className="text-xs text-gray-500 font-semibold">{deal.createdBy?.phone || "—"}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-white border border-blue-200 px-2.5 py-1 rounded-full uppercase">Requester</span>
        </div>

        {/* Route */}
        <div className="flex gap-3">
          <div className="flex flex-col items-center pt-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-green-100 flex-shrink-0" />
            <div className="w-px flex-1 my-1" style={{ background: "repeating-linear-gradient(to bottom,#d1d5db 0,#d1d5db 4px,transparent 4px,transparent 8px)" }} />
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-100 flex-shrink-0" />
          </div>
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
              <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-0.5">Pickup</p>
              <p className="text-sm font-bold text-gray-800 truncate">{deal.pickup.address}</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <p className="text-xs font-black text-red-500 uppercase tracking-widest mb-0.5">Drop Off</p>
              <p className="text-sm font-bold text-gray-800 truncate">{deal.drop.address}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
            <FaCalendarAlt className="text-blue-500 mx-auto mb-1.5" size={13} />
            <p className="text-xs font-bold text-gray-400 uppercase">Date</p>
            <p className="text-sm font-black text-gray-800 mt-0.5">
              {new Date(deal.pickupDateTime).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
            </p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
            <FaClock className="text-purple-500 mx-auto mb-1.5" size={13} />
            <p className="text-xs font-bold text-gray-400 uppercase">Days</p>
            <p className="text-sm font-black text-gray-800 mt-0.5">{deal.numberOfDays}D</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
            <FaRoad className="text-orange-500 mx-auto mb-1.5" size={13} />
            <p className="text-xs font-bold text-gray-400 uppercase">Distance</p>
            <p className="text-sm font-black text-gray-800 mt-0.5">{deal.totalDistance} km</p>
          </div>
        </div>

        {/* Vehicles */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Vehicles Required</p>
          <div className="flex flex-wrap gap-2">
            {deal.carsRequired.map((car, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <FaCar className="text-blue-500" size={13} />
                <span className="text-sm font-black text-blue-600">{car.quantity}×</span>
                <span className="text-sm font-semibold text-gray-700">{car.category?.name || "Standard Cab"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {deal.notes && (
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2.5">
            <p className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-1">Note</p>
            <p className="text-sm text-gray-600 font-medium">{deal.notes}</p>
          </div>
        )}

      </div>
    </div>
  );
}
