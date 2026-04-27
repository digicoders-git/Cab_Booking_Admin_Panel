import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { getBulkMarketplace, acceptBulkBooking, deleteBulkBooking } from "../apis/bulkBooking";
import { FaRoute, FaCar, FaCalendarAlt, FaClock, FaGavel, FaRoad, FaUser, FaPhone, FaSync, FaMapMarkerAlt, FaTrash } from "react-icons/fa";
import { toast } from "sonner";
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

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete this Ride?",
      text: "This will permanently remove the booking from the system. This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete It",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      background: themeColors.surface,
      color: themeColors.text,
    });

    if (result.isConfirmed) {
      try {
        const res = await deleteBulkBooking(id);
        if (res.success) {
          toast.success("Ride Deleted Successfully");
          fetchMarketplace();
        } else {
          toast.error(res.message);
        }
      } catch (err) {
        toast.error("Failed to delete the ride");
      }
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
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-6 animate-pulse">
          <div className="space-y-2">
            <div className="h-7 bg-gray-200 rounded w-48" />
            <div className="h-3 bg-gray-100 rounded w-36" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 bg-gray-200 rounded-lg w-28" />
            <div className="w-9 h-9 bg-gray-200 rounded-lg" />
          </div>
        </div>

        {/* Deal Cards Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
              {/* Top Strip */}
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-300" />
                  <div className="space-y-1.5">
                    <div className="h-3 bg-gray-300 rounded w-16" />
                    <div className="h-2 bg-gray-300 rounded w-12" />
                  </div>
                </div>
                <div className="h-8 bg-gray-300 rounded w-20" />
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {/* Requester */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded w-32" />
                    <div className="h-2 bg-gray-100 rounded w-24" />
                  </div>
                  <div className="h-5 bg-gray-200 rounded-full w-16" />
                </div>

                {/* Route */}
                <div className="space-y-2">
                  <div className="h-12 bg-green-50 border border-green-100 rounded-lg" />
                  <div className="h-12 bg-red-50 border border-red-100 rounded-lg" />
                </div>

                {/* Stats */}
                <div className="flex gap-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="w-4 h-4 bg-gray-200 rounded mx-auto mb-2" />
                      <div className="h-2 bg-gray-200 rounded w-full mb-1" />
                      <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto" />
                    </div>
                  ))}
                </div>

                {/* Vehicles */}
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded w-28" />
                  <div className="flex gap-2">
                    <div className="h-7 bg-blue-50 border border-blue-100 rounded-lg w-28" />
                    <div className="h-7 bg-blue-50 border border-blue-100 rounded-lg w-24" />
                  </div>
                </div>

                {/* Button */}
                <div className="h-10 bg-gray-200 rounded-xl w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" style={{ fontFamily: currentFont?.family }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaGavel className="text-blue-600" size={20} />
            Bulk Marketplace
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Live deals · Approved fleets only</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {deals.length} Live Deal{deals.length !== 1 ? "s" : ""}
          </div>
          <button
            onClick={fetchMarketplace}
            className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-all"
          >
            <FaSync size={14} className={fetching ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Empty State */}
      {deals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-20 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaRoute className="text-gray-300 text-2xl" />
          </div>
          <h3 className="text-base font-semibold text-gray-400">No Live Deals Right Now</h3>
          <p className="text-sm text-gray-400 mt-1">Check back later for new bulk booking requests.</p>
          <button onClick={fetchMarketplace} className="mt-5 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all">
            Refresh
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {deals.map((deal) => (
            <DealCard 
              key={deal._id} 
              deal={deal} 
              onAccept={handleAccept} 
              onDelete={handleDelete} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DealCard({ deal, onAccept, onDelete }) {
  const { themeColors } = useTheme();
  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">

      {/* Top Strip */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100"
        style={{ backgroundColor: themeColors.primary }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <span className="text-white text-xs font-bold">#{deal._id.slice(-4).toUpperCase()}</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-semibold text-green-300">{deal.status}</span>
            </div>
            <p className="text-xs text-white/50">{timeAgo(deal.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-white/50 mb-0.5">{deal.tripType === "RoundTrip" ? "Round Trip" : "One Way"}</p>
            <p className="text-2xl font-bold text-white">₹{deal.offeredPrice.toLocaleString()}</p>
          </div>
          {/* Admin Delete Action */}
          {deal.status !== 'Ongoing' && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(deal._id); }}
              className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/40 hover:bg-red-500 hover:text-white transition-all shadow-inner"
              title="Delete Ride"
            >
              <FaTrash size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-4 flex-1">

        {/* Requester */}
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">{deal.createdBy?.name?.charAt(0)?.toUpperCase() || "?"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate flex items-center gap-1.5">
              <FaUser size={10} className="text-gray-400" /> {deal.createdBy?.name || "Unknown"}
            </p>
            <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
              <FaPhone size={9} className="text-gray-400" /> {deal.createdBy?.phone || "—"}
            </p>
          </div>
          <span className="text-xs text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full font-medium">Requester</span>
        </div>

        {/* Route */}
        <div className="flex gap-3">
          <div className="flex flex-col items-center pt-2">
            <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            <div className="w-px flex-1 my-1 border-l border-dashed border-gray-300" />
            <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          </div>
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider mb-0.5">Pickup</p>
              <p className="text-sm text-gray-700 truncate">{deal.pickup.address}</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-0.5">Drop Off</p>
              <p className="text-sm text-gray-700 truncate">{deal.drop.address}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-[80px] bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
            <FaCalendarAlt className="text-blue-400 mx-auto mb-1" size={12} />
            <p className="text-[10px] text-gray-400 uppercase font-medium">{deal.tripType === "RoundTrip" ? "Pickup" : "Date"}</p>
            <p className="text-sm font-bold text-gray-800 mt-0.5">
              {new Date(deal.pickupDateTime).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
            </p>
          </div>
          {deal.tripType === "RoundTrip" && (
            <div className="flex-1 min-w-[80px] bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <FaCalendarAlt className="text-green-400 mx-auto mb-1" size={12} />
              <p className="text-[10px] text-gray-400 uppercase font-medium">Return</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">
                {deal.returnDateTime ? new Date(deal.returnDateTime).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "N/A"}
              </p>
            </div>
          )}
          {deal.numberOfDays > 0 && (
            <div className="flex-1 min-w-[80px] bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <FaClock className="text-purple-400 mx-auto mb-1" size={12} />
              <p className="text-[10px] text-gray-400 uppercase font-medium">Days</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{deal.numberOfDays}D</p>
            </div>
          )}
          {deal.totalDistance > 0 && (
            <div className="flex-1 min-w-[80px] bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <FaRoad className="text-orange-400 mx-auto mb-1" size={12} />
              <p className="text-[10px] text-gray-400 uppercase font-medium">Distance</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{deal.totalDistance} km</p>
            </div>
          )}
        </div>

        {/* Vehicles */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Vehicles Required</p>
          <div className="flex flex-wrap gap-2">
            {deal.carsRequired.map((car, idx) => (
              <div key={idx} className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                <FaCar className="text-blue-500" size={12} />
                <span className="text-sm font-bold text-blue-600">{car.quantity}×</span>
                <span className="text-sm text-gray-600">{car.category?.name || "Standard Cab"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {deal.notes && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
            <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Note</p>
            <p className="text-sm text-gray-600">{deal.notes}</p>
          </div>
        )}

        {/* Accept Button */}
        <button
          onClick={() => onAccept(deal._id, deal.offeredPrice)}
          className="w-full mt-auto py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          <FaGavel size={13} />
          Accept & Lock Deal — ₹{deal.offeredPrice.toLocaleString()}
        </button>
      </div>
    </div>
  );
}
