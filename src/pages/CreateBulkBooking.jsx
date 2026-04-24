import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { getAllCarCategories } from "../apis/carCategory";
import { createBulkBooking, getMyCreatedRequests, cancelBulkBooking, deleteBulkBooking, verifyBulkPayment } from "../apis/bulkBooking";
import {
  FaCar, FaCalendarAlt, FaClock, FaMapMarkerAlt,
  FaPlus, FaMinus, FaChevronRight, FaCheckCircle,
  FaPercentage, FaWallet, FaInfoCircle, FaTrash, FaSyncAlt, FaTimes,
  FaMapPin, FaRoad, FaTag, FaCircle, FaCheckDouble, FaHourglassEnd,
  FaEdit, FaTrashAlt, FaTruck, FaEye, FaBan, FaArrowUp
} from "react-icons/fa";
import { Toaster, toast } from "sonner";
import Swal from "sweetalert2";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- Helper: Load Razorpay Script ---
const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CreateBulkBooking() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCars, setSelectedCars] = useState([]);
  const [formData, setFormData] = useState({
    pickup: "",
    drop: "",
    pickupCoords: { lat: 0, lng: 0 },
    dropCoords: { lat: 0, lng: 0 },
    date: "",
    time: "",
    tripType: "OneWay",
    returnDate: "",
    days: 1,
    distance: 0,
    notes: "",
    offeredPrice: 0,
    priceModifier: 0 // Percentage
  });

  const [myRequests, setMyRequests] = useState([]);
  const [fetchingRequests, setFetchingRequests] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const pickupRef = useRef();
  const dropRef = useRef();

  useEffect(() => {
    fetchCategories();
    loadGoogleMapsScript();
    fetchMyRequests();
  }, []);

  // Re-initialize autocomplete when modal opens
  useEffect(() => {
    if (showBookingModal && window.google && window.google.maps) {
      // Small delay to ensure refs are ready
      setTimeout(() => {
        initAutocomplete();
      }, 100);
    }
  }, [showBookingModal]);
    
  // 🕒 Auto-calculate days for RoundTrip
  useEffect(() => {
    if (formData.tripType === 'RoundTrip' && formData.date && formData.returnDate) {
        const start = new Date(formData.date);
        const end = new Date(formData.returnDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both days
        setFormData(prev => ({ ...prev, days: diffDays }));
    }
  }, [formData.date, formData.returnDate, formData.tripType]);

  const loadGoogleMapsScript = () => {
    // Check if script already loaded
    if (window.google && window.google.maps) {
      initAutocomplete();
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for it to load
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogle);
          initAutocomplete();
        }
      }, 100);
      return;
    }

    // Load the script
    const script = document.createElement('script');
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initAutocomplete();
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
      toast.error('Failed to load Google Maps. Please refresh the page.');
    };
    document.head.appendChild(script);
  };

  const fetchMyRequests = async () => {
    try {
      setFetchingRequests(true);
      const res = await getMyCreatedRequests();
      if (res.success) setMyRequests(res.bookings || []);
    } catch (err) {
      console.error("Fetch requests failed");
    } finally {
      setFetchingRequests(false);
    }
  };

  const handleCancelRequest = async (id) => {
    const result = await Swal.fire({
      title: 'Cancel Request?',
      text: "This deal will be removed from Marketplace.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Cancel It',
      cancelButtonText: 'No, Keep It'
    });

    if (result.isConfirmed) {
      try {
        const res = await cancelBulkBooking(id);

        if (res.success) {
          toast.success(res.message || "Booking cancelled successfully");
          fetchMyRequests();
        } else {
          if (res.message.includes('Not authorized')) {
            toast.error("You are not authorized to cancel this booking");
          } else if (res.message.includes('Ongoing') || res.message.includes('Completed')) {
            toast.error("Cannot cancel an ongoing or completed ride");
          } else if (res.message.includes('not found')) {
            toast.error("Booking not found");
          } else {
            toast.error(res.message || "Failed to cancel booking");
          }
        }
      } catch (err) {
        toast.error("Something went wrong. Please try again.");
      }
    }
  };

  const handleDeleteRequest = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Permanently?',
      text: "This booking will be permanently deleted from database. This action cannot be undone!",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete It',
      cancelButtonText: 'No, Keep It'
    });

    if (result.isConfirmed) {
      try {
        const res = await deleteBulkBooking(id);

        if (res.success) {
          toast.success(res.message || "Bulk booking record deleted successfully from database.");
          fetchMyRequests();
        } else {
          if (res.message.includes('Only Admins')) {
            toast.error("Only Admins are allowed to delete bookings permanently.");
          } else if (res.message.includes('Ongoing')) {
            toast.error("Cannot delete a Ongoing ride. Please cancel it first or wait for completion.");
          } else if (res.message.includes('not found')) {
            toast.error("Booking not found");
          } else {
            toast.error(res.message || "Failed to delete booking");
          }
        }
      } catch (err) {
        toast.error("Something went wrong. Please try again.");
      }
    }
  };

  const initAutocomplete = () => {
    if (!window.google || !window.google.maps) {
      console.warn('Google Maps not loaded yet');
      return;
    }

    if (!pickupRef.current || !dropRef.current) {
      console.warn('Refs not ready yet');
      return;
    }

    const options = { componentRestrictions: { country: "in" }, fields: ["formatted_address", "geometry"] };

    const pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupRef.current, options);
    const dropAutocomplete = new window.google.maps.places.Autocomplete(dropRef.current, options);

    pickupAutocomplete.addListener("place_changed", () => {
      const place = pickupAutocomplete.getPlace();
      if (place.geometry) {
        setFormData(prev => ({
          ...prev,
          pickup: place.formatted_address,
          pickupCoords: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
        }));
        calculateDistance(place.formatted_address, null);
      }
    });

    dropAutocomplete.addListener("place_changed", () => {
      const place = dropAutocomplete.getPlace();
      if (place.geometry) {
        setFormData(prev => ({
          ...prev,
          drop: place.formatted_address,
          dropCoords: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
        }));
        calculateDistance(null, place.formatted_address);
      }
    });
  };

  const calculateDistance = (pAddress = null, dAddress = null) => {
    const p = pAddress || (pickupRef.current ? pickupRef.current.value : null);
    const d = dAddress || (dropRef.current ? dropRef.current.value : null);

    if (!window.google || !p || !d) return;

    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      { origins: [p], destinations: [d], travelMode: "DRIVING" },
      (response, status) => {
        if (status === "OK" && response.rows[0].elements[0].status === "OK") {
          const distKm = response.rows[0].elements[0].distance.value / 1000;
          setFormData(prev => ({ ...prev, distance: Math.round(distKm) }));
        } else {
          console.error("Distance Matrix failed:", status);
        }
      }
    );
  };

  const fetchCategories = async () => {
    try {
      const res = await getAllCarCategories();
      if (res.success) {
        setCategories(res.categories || []);
      }
    } catch (err) {
      toast.error("Failed to load car categories");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCar = (cat) => {
    setSelectedCars((prev) => {
      const existing = prev.find((item) => item.id === cat._id);
      if (existing) {
        return prev.map((item) =>
          item.id === cat._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: cat._id,
          name: cat.name,
          image: cat.image,
          price: cat.bulkBookingBasePrice || cat.privateRatePerKm || 0,
          quantity: 1,
        },
      ];
    });
  };

  const handleRemoveCar = (catId) => {
    setSelectedCars((prev) => {
      const existing = prev.find((item) => item.id === catId);
      if (existing.quantity > 1) {
        return prev.map((item) =>
          item.id === catId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter((item) => item.id !== catId);
    });
  };

  const calculateTotal = () => {
    // Formula: Rate (KM) * Quantity * Days * Distance
    const distanceMultiplier = formData.tripType === 'RoundTrip' ? 2 : 1;
    const baseTotal = selectedCars.reduce(
      (acc, car) => acc + car.price * car.quantity * formData.days * ((formData.distance || 0) * distanceMultiplier),
      0
    );
    const modified = baseTotal + baseTotal * (formData.priceModifier / 100);
    return Math.round(modified);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedCars.length === 0) return toast.error("Please select at least one car");
    if (!formData.pickup || !formData.drop || !formData.date) return toast.error("Please fill all details");

    try {
      const total = calculateTotal();
      const payload = {
        pickup: {
          address: formData.pickup,
          latitude: formData.pickupCoords.lat,
          longitude: formData.pickupCoords.lng
        },
        drop: {
          address: formData.drop,
          latitude: formData.dropCoords.lat,
          longitude: formData.dropCoords.lng
        },
        pickupDateTime: `${formData.date}T${formData.time || "10:00"}`,
        tripType: formData.tripType,
        returnDateTime: formData.tripType === 'RoundTrip' ? `${formData.returnDate}T${formData.time || "10:00"}` : null,
        numberOfDays: formData.days,
        totalDistance: formData.distance,
        carsRequired: selectedCars.map((c) => ({ category: c.id, quantity: c.quantity })),
        offeredPrice: total,
        notes: formData.notes,
      };

      const result = await Swal.fire({
        title: 'Launch Request?',
        text: `Creating bulk request for ₹${total.toLocaleString()}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        background: themeColors.surface,
        color: themeColors.text
      });

      if (result.isConfirmed) {
        const res = await createBulkBooking(payload);
        if (res.success && res.advanceAmount) {
          // 💳 TRIGGER RAZORPAY FOR 25% ADVANCE
          const sdkLoaded = await loadRazorpay();
          if (!sdkLoaded) {
            toast.error("Razorpay SDK failed to load");
            return;
          }

          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_your_key",
            amount: res.advanceAmount * 100, // paise
            currency: "INR",
            name: "Bulk Booking Advance",
            description: `25% Advance for Booking ${res.bookingId}`,
            handler: async (response) => {
              try {
                const verifyRes = await verifyBulkPayment({
                  bookingId: res.bookingId,
                  paymentId: response.razorpay_payment_id,
                  type: 'advance'
                });
                if (verifyRes.success) {
                  toast.success("Advance Paid! Booking live on Marketplace.");
                  fetchMyRequests();
                  // Reset
                  setSelectedCars([]);
                  setFormData({
                    pickup: "", drop: "", date: "", time: "",
                    tripType: "OneWay", returnDate: "",
                    days: 1, distance: 0, notes: "", offeredPrice: 0, priceModifier: 0
                  });
                  setShowBookingModal(false);
                }
              } catch (err) {
                toast.error("Payment verification failed");
              }
            },
            prefill: {
              name: "Admin / Agent",
            },
            theme: { color: "#3b82f6" },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();

        } else if (res.success) {
          toast.success("Bulk Booking live on Marketplace!");
          fetchMyRequests();
          // Reset
          setSelectedCars([]);
          setFormData({
            pickup: "", drop: "", date: "", time: "",
            tripType: "OneWay", returnDate: "",
            days: 1, distance: 0, notes: "", offeredPrice: 0, priceModifier: 0
          });
          setShowBookingModal(false);
        }
      }
    } catch (err) {
      toast.error("Process failed");
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(myRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Filter requests based on active tab
  const filteredRequests = myRequests.filter(req => {
    if (activeTab === 'marketplace') return req.status === 'Marketplace';
    if (activeTab === 'accepted') return req.status === 'Accepted';
    if (activeTab === 'ongoing') return req.status === 'Ongoing';
    if (activeTab === 'completed') return req.status === 'Completed';
    if (activeTab === 'cancelled') return req.status === 'Cancelled';
    return true; // 'all' tab
  });

  const totalFilteredPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const filteredStartIndex = (currentPage - 1) * itemsPerPage;
  const filteredEndIndex = filteredStartIndex + itemsPerPage;
  const currentRequests = filteredRequests.slice(filteredStartIndex, filteredEndIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  return (
    <div className="p-6 mt-5 min-h-screen bg-gray-50" style={{ fontFamily: currentFont }}>
      <Toaster richColors position="top-right" />

      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ps-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900">Bulk Booking Management</h1>
          <p className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest font-bold">Admin Direct Marketplace Injection</p>
        </div>
        <button
          onClick={() => setShowBookingModal(true)}
          className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base"
        >
          <FaPlus className="text-sm sm:text-base" />
          Create Bulk Booking
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <div className="group relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all bg-white border border-gray-200">
          <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, transparent 100%)' }} />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#3b82f615' }}>
                <FaInfoCircle className="text-xl text-blue-600" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-100/80 text-green-700 flex items-center gap-1">
                <FaArrowUp size={10} /> +{myRequests.length > 0 ? Math.floor(Math.random() * 20) + 5 : 0}%
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-1 text-gray-900">{myRequests.length}</h3>
            <p className="text-sm font-medium text-gray-500">Total Requests</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all bg-white border border-gray-200">
          <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, transparent 100%)' }} />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#f59e0b15' }}>
                <FaCircle className="text-xl text-orange-500" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-100/80 text-green-700 flex items-center gap-1">
                <FaArrowUp size={10} /> +{myRequests.filter(r => r.status === 'Marketplace').length > 0 ? Math.floor(Math.random() * 15) + 3 : 0}%
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-1 text-gray-900">{myRequests.filter(r => r.status === 'Marketplace').length}</h3>
            <p className="text-sm font-medium text-gray-500">Marketplace</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all bg-white border border-gray-200">
          <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, #10b981 0%, transparent 100%)' }} />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#10b98115' }}>
                <FaCheckDouble className="text-xl text-green-600" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-100/80 text-green-700 flex items-center gap-1">
                <FaArrowUp size={10} /> +{myRequests.filter(r => r.status === 'Accepted').length > 0 ? Math.floor(Math.random() * 12) + 2 : 0}%
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-1 text-gray-900">{myRequests.filter(r => r.status === 'Accepted').length}</h3>
            <p className="text-sm font-medium text-gray-500">Accepted</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all bg-white border border-gray-200">
          <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, transparent 100%)' }} />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#8b5cf615' }}>
                <FaCheckCircle className="text-xl text-purple-600" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-100/80 text-green-700 flex items-center gap-1">
                <FaArrowUp size={10} /> +{myRequests.filter(r => r.status === 'Completed').length > 0 ? Math.floor(Math.random() * 10) + 1 : 0}%
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-1 text-gray-900">{myRequests.filter(r => r.status === 'Completed').length}</h3>
            <p className="text-sm font-medium text-gray-500">Completed</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all bg-white border border-gray-200">
          <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, transparent 100%)' }} />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#06b6d415' }}>
                <FaClock className="text-xl text-cyan-600" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-100/80 text-green-700 flex items-center gap-1">
                <FaArrowUp size={10} /> +{myRequests.filter(r => r.status === 'Ongoing').length > 0 ? Math.floor(Math.random() * 8) + 1 : 0}%
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-1 text-gray-900">{myRequests.filter(r => r.status === 'Ongoing').length}</h3>
            <p className="text-sm font-medium text-gray-500">Ongoing</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all bg-white border border-gray-200">
          <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, #ef4444 0%, transparent 100%)' }} />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#ef444415' }}>
                <FaTimes className="text-xl text-red-600" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-100/80 text-green-700 flex items-center gap-1">
                <FaArrowUp size={10} /> +{myRequests.filter(r => r.status === 'Cancelled').length > 0 ? Math.floor(Math.random() * 5) : 0}%
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-1 text-gray-900">{myRequests.filter(r => r.status === 'Cancelled').length}</h3>
            <p className="text-sm font-medium text-gray-500">Cancelled</p>
          </div>
        </div>
      </div>

      {/* Booking Creation Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="bg-gray-50 rounded-3xl w-full max-w-7xl max-h-[95vh] overflow-y-auto shadow-2xl scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-8 py-6 flex items-center justify-between rounded-t-3xl z-10">
              <div>
                <h2 className="text-xl font-black text-gray-900">Create Bulk Booking Request</h2>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Fill details to post on marketplace</p>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="w-12 h-12 rounded-full bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 flex items-center justify-center transition-all"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Selection & Details */}
                <div className="xl:col-span-8 space-y-6">

                  {/* Car Fleet Selection */}
                  <div className="bg-white rounded-3xl p-8 border border-gray-200">
                    <h3 className="text-lg font-black mb-6 flex items-center gap-3">
                      <FaCar className="text-blue-600" /> Select Vehicle Types
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {categories.map((cat) => (
                        <div key={cat._id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-blue-200 transition-all">
                          <div className="flex items-center gap-4">
                            <img src={`${BASE_URL}/uploads/${cat.image}`} alt={cat.name} className="w-16 h-12 object-contain bg-white rounded-xl p-1 shadow-sm" />
                            <div>
                              <p className="text-sm font-black text-gray-800">{cat.name}</p>
                              <p className="text-[10px] text-blue-600 font-bold">₹{cat.bulkBookingBasePrice || cat.privateRatePerKm || 0}/km</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => handleRemoveCar(cat._id)} className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-all">
                              <FaMinus size={10} />
                            </button>
                            <span className="text-sm font-black w-4 text-center">
                              {selectedCars.find(s => s.id === cat._id)?.quantity || 0}
                            </span>
                            <button onClick={() => handleAddCar(cat)} className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                              <FaPlus size={10} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Location & Time */}
                  <div className="bg-white rounded-3xl p-8 border border-gray-200">
                    <h3 className="text-lg font-black mb-6 flex items-center gap-3">
                      <FaMapMarkerAlt className="text-green-600" /> Journey Specifications
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Pickup Location</label>
                        <input
                          ref={pickupRef}
                          className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 ring-blue-500"
                          placeholder="Enter pickup address"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Drop Location</label>
                        <input
                          ref={dropRef}
                          className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 ring-blue-500"
                          placeholder="Enter destination address"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Trip Type</label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, tripType: "OneWay", days: 1 })}
                            className={`py-4 rounded-2xl font-black text-sm transition-all border-2 ${formData.tripType === 'OneWay' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-100 hover:border-blue-200'}`}
                          >
                            One Way
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, tripType: "RoundTrip" })}
                            className={`py-4 rounded-2xl font-black text-sm transition-all border-2 ${formData.tripType === 'RoundTrip' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-100 hover:border-blue-200'}`}
                          >
                            Round Trip
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Pickup Date</label>
                        <input
                          type="date"
                          value={formData.date}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={e => {
                            const selected = e.target.value;
                            setFormData({ 
                                ...formData, 
                                date: selected,
                                returnDate: formData.returnDate < selected ? selected : formData.returnDate
                            });
                          }}
                          className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        {formData.tripType === 'RoundTrip' ? (
                          <>
                            <label className="text-[10px] font-black text-gray-400 uppercase">Return Date</label>
                            <input
                              type="date"
                              value={formData.returnDate}
                              min={formData.date || new Date().toISOString().split('T')[0]}
                              onChange={e => setFormData({ ...formData, returnDate: e.target.value })}
                              className="w-full bg-blue-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 ring-blue-500"
                            />
                          </>
                        ) : (
                          <>
                            <label className="text-[10px] font-black text-gray-400 uppercase">Trip Duration (Days)</label>
                            <div className="flex items-center gap-4 bg-gray-50 rounded-2xl px-6 py-2 border border-gray-100">
                              <button onClick={() => setFormData({ ...formData, days: Math.max(1, formData.days - 1) })} className="text-gray-400 hover:text-gray-900"><FaMinus /></button>
                              <span className="flex-1 text-center font-black">{formData.days} Days</span>
                              <button onClick={() => setFormData({ ...formData, days: formData.days + 1 })} className="text-gray-400 hover:text-gray-900"><FaPlus /></button>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Total Distance (KM)</label>
                        <div className="relative">
                          <FaCar className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500" />
                          <input
                            type="number"
                            readOnly
                            value={formData.distance}
                            className="w-full bg-blue-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-black text-blue-600 cursor-not-allowed"
                            placeholder="Auto-calculating..."
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Additional Instructions (Optional)</label>
                        <textarea
                          value={formData.notes}
                          onChange={e => setFormData({ ...formData, notes: e.target.value })}
                          className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 ring-blue-500 h-24"
                          placeholder="Any specific note for the Fleet owners..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="xl:col-span-4">
                  <div className="sticky top-6 bg-white rounded-3xl p-8 border border-gray-200 shadow-xl shadow-gray-100">
                    <h3 className="text-lg font-black mb-8 flex items-center gap-3">
                      <FaWallet className="text-purple-600" /> Offer Summary
                    </h3>

                    <div className="space-y-4 mb-8">
                      {selectedCars.map(car => (
                        <div key={car.id} className="flex justify-between items-center text-xs font-bold text-gray-500">
                          <span>{car.quantity}x {car.name}</span>
                          <span className="text-gray-900">₹{(car.price * car.quantity * formData.days * (formData.distance || 0)).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="pt-4 border-t border-dashed border-gray-100">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400 uppercase">Market Incentive</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${formData.priceModifier >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {formData.priceModifier > 0 ? '+' : ''}{formData.priceModifier}%
                          </span>
                        </div>
                        <input
                          type="range" min="-20" max="100" step="5"
                          value={formData.priceModifier}
                          onChange={e => setFormData({ ...formData, priceModifier: parseInt(e.target.value) })}
                          className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-4"
                        />
                        <div className="flex justify-between mt-2 text-[8px] font-black text-gray-300 uppercase tracking-widest">
                          <span>Discount</span>
                          <span>System</span>
                          <span>Urgent</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-2xl p-6 mb-8">
                      <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Total Offered Price</p>
                      <h2 className="text-4xl font-black text-blue-700">₹{calculateTotal().toLocaleString()}</h2>
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={selectedCars.length === 0}
                      className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      Post to Marketplace
                      <FaChevronRight className="text-xs" />
                    </button>

                    <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex gap-4">
                      <FaInfoCircle className="text-gray-300 mt-1 flex-shrink-0" />
                      <p className="text-[10px] text-gray-400 leading-relaxed font-bold">
                        Your request will be broadcasted to all verified fleets having the selected car types.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Requests Section */}
      <div className="mt-12 bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">My Recent Requests</h3>
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Manage your marketplace deals</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-100 w-full">
          {/* Filtering Tabs */}
          <div className="flex items-center gap-8 px-6 border-b border-gray-100 overflow-x-auto no-scrollbar bg-white">
            {[
              { id: 'all', label: 'All Requests', icon: FaInfoCircle, count: myRequests.length },
              { id: 'marketplace', label: 'Marketplace', icon: FaCircle, count: myRequests.filter(r => r.status === 'Marketplace').length },
              { id: 'accepted', label: 'Accepted', icon: FaCheckDouble, count: myRequests.filter(r => r.status === 'Accepted').length },
              { id: 'ongoing', label: 'Ongoing', icon: FaClock, count: myRequests.filter(r => r.status === 'Ongoing').length },
              { id: 'completed', label: 'Completed', icon: FaCheckCircle, count: myRequests.filter(r => r.status === 'Completed').length },
              { id: 'cancelled', label: 'Cancelled', icon: FaTimes, count: myRequests.filter(r => r.status === 'Cancelled').length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
                className="relative flex items-center gap-2 py-4 px-1 font-bold transition-all duration-200 whitespace-nowrap"
                style={{
                  color: activeTab === tab.id ? '#3b82f6' : '#9ca3af',
                }}
              >
                <tab.icon size={16} className={activeTab === tab.id ? "" : "opacity-80"} />
                <span className="text-sm">{tab.label}</span>
                <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-extrabold ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {tab.count}
                </span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-blue-600" />
                )}
              </button>
            ))}
          </div>

          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-black text-gray-800 uppercase tracking-wider">Route</th>
                <th className="px-4 py-3 text-left text-xs font-black text-gray-800 uppercase tracking-wider">Vehicles</th>
                <th className="px-4 py-3 text-left text-xs font-black text-gray-800 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-left text-xs font-black text-gray-800 uppercase tracking-wider">OTP</th>
                <th className="px-4 py-3 text-left text-xs font-black text-gray-800 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-center text-xs font-black text-gray-800 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {currentRequests.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                        <FaInfoCircle className="text-gray-400 text-2xl" />
                      </div>
                      <p className="text-sm font-medium text-gray-400">No requests found</p>
                      <p className="text-xs text-gray-400">Create your first bulk booking request</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 max-w-[220px]">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start gap-2">
                          <FaMapPin className="text-green-500 flex-shrink-0 mt-0.5" size={12} />
                          <p className="text-xs font-bold text-gray-900 leading-snug">{req.pickup.address}</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <FaMapPin className="text-red-500 flex-shrink-0 mt-0.5" size={12} />
                          <p className="text-xs font-bold text-gray-900 leading-snug">{req.drop.address}</p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-semibold mt-1">
                          <FaCalendarAlt size={9} className="text-blue-500" />
                          <span>{new Date(req.pickupDateTime).toLocaleDateString('en-GB')}</span>
                          <span className="text-gray-300">•</span>
                          {req.tripType === 'RoundTrip' && (
                          <>
                            <FaCalendarAlt size={9} className="text-green-500" />
                            <span>{new Date(req.returnDateTime).toLocaleDateString('en-GB')}</span>
                            <span className="text-gray-300">•</span>
                          </>
                          )}
                          <FaClock size={9} className="text-purple-500" />
                          <span>{req.numberOfDays}D</span>
                          <span className="text-gray-300">•</span>
                          <FaRoad size={9} className="text-orange-500" />
                          <span>{req.totalDistance}km</span>
                          {req.tripType === 'RoundTrip' && <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-[8px] font-black uppercase rounded">Round Trip</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {req.carsRequired.map((car, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100"
                          >
                            <FaCar size={10} />
                            {car.quantity}× {car.category?.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-extrabold text-gray-900">₹{req.offeredPrice.toLocaleString()}</span>
                        <span className="text-[10px] text-gray-500 font-semibold">Total Price</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {req.startOtp ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-50 border border-violet-200 rounded-lg text-sm font-black text-violet-700 tracking-widest">
                          🔑 {req.startOtp}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-300 font-semibold">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${req.status === 'Marketplace' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                        req.status === 'Accepted' ? 'bg-green-50 text-green-700 border border-green-200' :
                          req.status === 'Cancelled' ? 'bg-red-50 text-red-700 border border-red-200' :
                            'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setSelectedRequest(req); setShowViewModal(true); }}
                          className="p-2.5 text-blue-600 hover:text-blue-700 rounded-lg transition-all hover:scale-110"
                          title="View Details"
                        >
                          <FaEye size={16} />
                        </button>
                        {(req.status === 'Marketplace' || req.status === 'Accepted') && (
                          <button
                            onClick={() => handleCancelRequest(req._id)}
                            className="p-2.5 text-orange-600 hover:text-orange-700 rounded-lg transition-all hover:scale-110"
                            title="Cancel Request"
                          >
                            <FaBan size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteRequest(req._id)}
                          className="p-2.5 text-red-600 hover:text-red-700 rounded-lg transition-all hover:scale-110"
                          title="Delete Permanently"
                        >
                          <FaTrashAlt size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredRequests.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
            {/* Items per page */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-600">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
                <option value={50}>50</option>
                <option value={60}>60</option>
                <option value={70}>70</option>
                <option value={80}>80</option>
                <option value={90}>90</option>
                <option value={100}>100</option>
              </select>
              <span className="text-xs text-gray-500 font-medium">
                Showing {filteredRequests.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length}
              </span>
            </div>

            {/* Page numbers */}
            <div className="flex items-center gap-2">
              {/* Previous button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {[...Array(totalFilteredPages)].map((_, index) => {
                  const page = index + 1;
                  if (
                    page === 1 ||
                    page === totalFilteredPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === page
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className="text-gray-400 px-1">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Next button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalFilteredPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Booking Details Modal */}
      {showViewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Booking Details</h2>
                <p className="text-xs text-gray-500 mt-0.5">Booking ID: {selectedRequest._id}</p>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Status Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Current Status</p>
                    <p className="text-lg font-black text-gray-900 mt-1">{selectedRequest.status}</p>
                  </div>
                  <div className="text-3xl">
                    {selectedRequest.status === 'Marketplace' && '🟠'}
                    {selectedRequest.status === 'Accepted' && '✅'}
                    {selectedRequest.status === 'Ongoing' && '🚗'}
                    {selectedRequest.status === 'Completed' && '✔️'}
                    {selectedRequest.status === 'Cancelled' && '❌'}
                  </div>
                </div>
              </div>

              {/* Route Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-red-500" /> Route Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Pickup Location</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{selectedRequest.pickup.address}</p>
                    <p className="text-xs text-gray-400 mt-1">Lat: {selectedRequest.pickup.latitude?.toFixed(4)}, Lng: {selectedRequest.pickup.longitude?.toFixed(4)}</p>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-xs text-gray-500 font-bold uppercase">Drop Location</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{selectedRequest.drop.address}</p>
                    <p className="text-xs text-gray-400 mt-1">Lat: {selectedRequest.drop.latitude?.toFixed(4)}, Lng: {selectedRequest.drop.longitude?.toFixed(4)}</p>
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <FaCalendarAlt className="text-blue-500" /> Trip Details
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <p className="text-xs text-gray-500 font-bold uppercase">Pickup Date & Time</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{new Date(selectedRequest.pickupDateTime).toLocaleString('en-GB')}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                    <p className="text-xs text-gray-500 font-bold uppercase">Duration</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{selectedRequest.numberOfDays} Days</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                    <p className="text-xs text-gray-500 font-bold uppercase">Total Distance</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{selectedRequest.totalDistance} km</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                    <p className="text-xs text-gray-500 font-bold uppercase">Offered Price</p>
                    <p className="text-sm font-bold text-green-600 mt-1">₹{selectedRequest.offeredPrice.toLocaleString()}</p>
                  </div>
                  {selectedRequest.startOtp && (
                    <div className="col-span-2 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg p-4 border border-violet-200 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-violet-500 font-black uppercase tracking-widest">🔐 Start OTP</p>
                        <p className="text-3xl font-black text-violet-700 tracking-[0.4em] mt-1">{selectedRequest.startOtp}</p>
                        <p className="text-[10px] text-violet-400 font-semibold mt-1">Share with driver to start the ride</p>
                      </div>
                      <div className="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🔑</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicles Required */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <FaCar className="text-blue-600" /> Vehicles Required
                </h3>
                <div className="space-y-2">
                  {selectedRequest.carsRequired?.map((car, idx) => (
                    <div key={idx} className="bg-blue-50 rounded-lg p-3 border border-blue-100 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{car.category?.name || 'Unknown'}</p>
                      </div>
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">{car.quantity}x</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assigned Fleet (if Accepted) */}
              {selectedRequest.status === 'Accepted' && selectedRequest.assignedFleet && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <FaTruck className="text-green-600" /> Assigned Fleet
                  </h3>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <p className="text-sm font-bold text-gray-900">{selectedRequest.assignedFleet.companyName}</p>
                    <p className="text-xs text-gray-500 mt-1">Phone: {selectedRequest.assignedFleet.phone}</p>
                    {selectedRequest.acceptedAt && (
                      <p className="text-xs text-gray-400 mt-2">Accepted on: {new Date(selectedRequest.acceptedAt).toLocaleString('en-GB')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedRequest.notes && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <FaInfoCircle className="text-yellow-600" /> Additional Notes
                  </h3>
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                    <p className="text-sm text-gray-700">{selectedRequest.notes}</p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <FaClock className="text-gray-600" /> Timeline
                </h3>
                <div className="space-y-2 text-xs">
                  {selectedRequest.createdAt && (
                    <div className="flex justify-between bg-gray-50 p-2 rounded">
                      <span className="text-gray-600 font-bold">Created:</span>
                      <span className="text-gray-900 font-bold">{new Date(selectedRequest.createdAt).toLocaleString('en-GB')}</span>
                    </div>
                  )}
                  {selectedRequest.startedAt && (
                    <div className="flex justify-between bg-blue-50 p-2 rounded">
                      <span className="text-blue-600 font-bold">Started:</span>
                      <span className="text-blue-900 font-bold">{new Date(selectedRequest.startedAt).toLocaleString('en-GB')}</span>
                    </div>
                  )}
                  {selectedRequest.endedAt && (
                    <div className="flex justify-between bg-green-50 p-2 rounded">
                      <span className="text-green-600 font-bold">Completed:</span>
                      <span className="text-green-900 font-bold">{new Date(selectedRequest.endedAt).toLocaleString('en-GB')}</span>
                    </div>
                  )}
                  {selectedRequest.cancelledAt && (
                    <div className="flex justify-between bg-red-50 p-2 rounded">
                      <span className="text-red-600 font-bold">Cancelled:</span>
                      <span className="text-red-900 font-bold">{new Date(selectedRequest.cancelledAt).toLocaleString('en-GB')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
