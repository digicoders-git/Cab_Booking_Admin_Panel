import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Car, MapPin, Navigation, User, Phone, Wallet, ShieldCheck, 
  Clock, DollarSign, CheckCircle2, AlertCircle, Loader2, Sparkles,
  ArrowRight, ArrowLeft, Users, ChevronRight, Calculator, Edit3,
  Plus, Trash2
} from 'lucide-react';
import Swal from 'sweetalert2';
import { createBooking, searchCabs } from '../apis/booking';
import { getAllCarCategories } from '../apis/carCategory';

const AdminBookRideModal = ({ isOpen, onClose, user, onBookingSuccess }) => {
  // Step State: 1 = Route & Details, 2 = Choose Cab & Fares
  const [currentStep, setCurrentStep] = useState(1);

  const [rideType, setRideType] = useState('Private');
  const [seatsBooked, setSeatsBooked] = useState(1);
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState({ lat: null, lng: null });
  const [dropAddress, setDropAddress] = useState('');
  const [dropCoords, setDropCoords] = useState({ lat: null, lng: null });

  // Intermediate Stops State
  const [stops, setStops] = useState([]); // array of { address: '', lat: null, lng: null }

  const [distanceKm, setDistanceKm] = useState(0);
  const [estimatedTimeMin, setEstimatedTimeMin] = useState(0);
  const [categories, setCategories] = useState([]);
  const [fareOptions, setFareOptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [loadingFares, setLoadingFares] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Suggestions state
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);

  const pickupInputRef = useRef(null);
  const dropInputRef = useRef(null);
  const pickupAutocompleteRef = useRef(null);
  const dropAutocompleteRef = useRef(null);

  // 1. Inject high z-index style for Google's native .pac-container
  useEffect(() => {
    if (!document.getElementById("pac-modal-zindex-style")) {
      const style = document.createElement('style');
      style.id = "pac-modal-zindex-style";
      style.innerHTML = `
        .pac-container {
          z-index: 9999999 !important;
          border-radius: 12px !important;
          margin-top: 6px !important;
          box-shadow: 0 14px 35px rgba(0,0,0,0.2) !important;
          border: 1px solid #e2e8f0 !important;
          font-family: inherit !important;
        }
        .pac-item {
          padding: 8px 12px !important;
          cursor: pointer !important;
          font-size: 13px !important;
        }
        .pac-item:hover {
          background-color: #f1f5f9 !important;
        }
        .pac-item-query {
          font-size: 13px !important;
          color: #0f172a !important;
          font-weight: 600 !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // 2. Initialize data on modal open
  useEffect(() => {
    if (isOpen && user) {
      setCurrentStep(1);
      setRideType('Private');
      setSeatsBooked(1);
      setPickupAddress('');
      setDropAddress('');
      setStops([]);
      setPickupCoords({ lat: null, lng: null });
      setDropCoords({ lat: null, lng: null });
      setDistanceKm(0);
      setEstimatedTimeMin(0);
      setFareOptions([]);
      setSelectedCategory(null);
      setPaymentMethod('Cash');
      setPickupSuggestions([]);
      setDropSuggestions([]);
      setShowPickupSuggestions(false);
      setShowDropSuggestions(false);

      // Default pickup to user's firstLocation if available
      if (user.firstLocation?.latitude && user.firstLocation?.longitude) {
        setPickupCoords({
          lat: user.firstLocation.latitude,
          lng: user.firstLocation.longitude
        });
        setPickupAddress(user.firstLocation.address || 'User Last Known Location');
      }

      // Load Car Categories
      loadCarCategories();
    }
  }, [isOpen, user]);

  // 3. Load Car Categories
  const loadCarCategories = async () => {
    try {
      const res = await getAllCarCategories();
      const rawCategories = res.categories || res.data || [];
      if (rawCategories.length > 0) {
        const activeCats = rawCategories.filter(c => c.isActive !== false);
        setCategories(activeCats);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // 4. Setup Google Places Autocomplete on inputs (Step 1)
  useEffect(() => {
    if (!isOpen) {
      pickupAutocompleteRef.current = null;
      dropAutocompleteRef.current = null;
      return;
    }

    if (currentStep !== 1) return;

    const timer = setTimeout(() => {
      if (window.google && window.google.maps && window.google.maps.places) {
        // Pickup Autocomplete
        if (pickupInputRef.current && !pickupAutocompleteRef.current) {
          pickupAutocompleteRef.current = new window.google.maps.places.Autocomplete(pickupInputRef.current, {
            componentRestrictions: { country: 'in' },
            fields: ['formatted_address', 'geometry', 'name']
          });

          pickupAutocompleteRef.current.addListener('place_changed', () => {
            const place = pickupAutocompleteRef.current.getPlace();
            if (place && place.geometry) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              const addr = place.formatted_address || place.name || pickupInputRef.current.value;
              setPickupCoords({ lat, lng });
              setPickupAddress(addr);
              setShowPickupSuggestions(false);
            }
          });
        }

        // Drop Autocomplete
        if (dropInputRef.current && !dropAutocompleteRef.current) {
          dropAutocompleteRef.current = new window.google.maps.places.Autocomplete(dropInputRef.current, {
            componentRestrictions: { country: 'in' },
            fields: ['formatted_address', 'geometry', 'name']
          });

          dropAutocompleteRef.current.addListener('place_changed', () => {
            const place = dropAutocompleteRef.current.getPlace();
            if (place && place.geometry) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              const addr = place.formatted_address || place.name || dropInputRef.current.value;
              setDropCoords({ lat, lng });
              setDropAddress(addr);
              setShowDropSuggestions(false);
            }
          });
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [isOpen, currentStep]);

  // Autocomplete for intermediate stops
  const initStopAutocomplete = (index, inputEl) => {
    if (!inputEl || inputEl._hasAutocomplete || !window.google?.maps?.places) return;
    try {
      const auto = new window.google.maps.places.Autocomplete(inputEl, {
        componentRestrictions: { country: 'in' },
        fields: ['formatted_address', 'geometry', 'name']
      });
      auto.addListener('place_changed', () => {
        const place = auto.getPlace();
        if (place && place.geometry) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const addr = place.formatted_address || place.name || inputEl.value;
          setStops(prev => {
            const updated = [...prev];
            if (updated[index]) {
              updated[index] = { ...updated[index], address: addr, lat, lng };
            }
            return updated;
          });
        }
      });
      inputEl._hasAutocomplete = true;
    } catch (e) {
      console.warn('Error setting up stop autocomplete:', e);
    }
  };

  // Intermediate Stop Handlers
  const handleAddStop = () => {
    if (rideType === 'Shared') {
      Swal.fire({
        title: 'Not Allowed for Shared Rides',
        text: 'Multiple stops are only allowed for Private Rides. Please switch to Private Ride.',
        icon: 'info',
        confirmButtonColor: '#2563EB'
      });
      return;
    }
    if (stops.length >= 4) {
      Swal.fire({
        title: 'Limit Reached',
        text: 'You can add a maximum of 4 intermediate stops.',
        icon: 'warning',
        confirmButtonColor: '#2563EB'
      });
      return;
    }
    setStops(prev => [...prev, { address: '', lat: null, lng: null }]);
  };

  const handleRemoveStop = (idx) => {
    setStops(prev => prev.filter((_, i) => i !== idx));
  };

  const handleStopChange = (idx, value) => {
    setStops(prev => {
      const updated = [...prev];
      if (updated[idx]) {
        updated[idx] = { ...updated[idx], address: value, lat: null, lng: null };
      }
      return updated;
    });
  };

  // Query Realtime Suggestions
  const fetchSuggestions = (query, isPickup) => {
    if (!query || query.length < 2) {
      if (isPickup) setPickupSuggestions([]);
      else setDropSuggestions([]);
      return;
    }

    if (window.google && window.google.maps && window.google.maps.places) {
      try {
        const service = new window.google.maps.places.AutocompleteService();
        service.getPlacePredictions(
          { input: query, componentRestrictions: { country: 'in' } },
          (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              const formatted = predictions.map(p => ({
                description: p.description,
                mainText: p.structured_formatting?.main_text || p.description,
                placeId: p.place_id
              }));
              if (isPickup) setPickupSuggestions(formatted);
              else setDropSuggestions(formatted);
            }
          }
        );
      } catch (e) {
        console.warn('Google Places service query error:', e);
      }
    }
  };

  const handleSelectSuggestion = (place, isPickup) => {
    if (isPickup) {
      setPickupAddress(place.description);
      setShowPickupSuggestions(false);
      if (pickupInputRef.current) pickupInputRef.current.value = place.description;

      geocodeAddress(place.description, (lat, lng) => {
        setPickupCoords({ lat, lng });
      });
    } else {
      setDropAddress(place.description);
      setShowDropSuggestions(false);
      if (dropInputRef.current) dropInputRef.current.value = place.description;

      geocodeAddress(place.description, (lat, lng) => {
        setDropCoords({ lat, lng });
      });
    }
  };

  const geocodeAddress = (address, callback) => {
    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address, componentRestrictions: { country: 'IN' } }, (results, status) => {
        if (status === 'OK' && results[0]?.geometry) {
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();
          callback(lat, lng);
        }
      });
    }
  };

  const calculateHaversine = (lat1, lon1, lat2, lon2) => {
    const toRad = x => (x * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.max(1, Math.round(R * c * 10) / 10);
  };

  const fallbackFareCalculation = (dist) => {
    const options = categories.map(cat => {
      const base = cat.baseFare || 50;
      const rate = rideType === 'Shared' 
        ? (cat.sharedRatePerSeatPerKm || cat.sharedRatePerKm || 8) 
        : (cat.privateRatePerKm || 12);
      const estFare = Math.round(base + (dist * rate) * (rideType === 'Shared' ? seatsBooked : 1));
      return {
        _id: cat._id,
        carCategoryId: cat._id,
        name: cat.name,
        fare: estFare,
        estimatedFare: estFare,
        seatCapacity: cat.seatCapacity || 4
      };
    });
    setFareOptions(options);
    if (options.length > 0 && !selectedCategory) {
      setSelectedCategory(options[0]);
    }
  };

  // Calculate distance and search cabs for Step 2 (Handles intermediate stops!)
  const calculateDistanceAndFares = async (pCoords, dCoords, activeStops = []) => {
    setLoadingFares(true);
    let dist = 5;
    let timeMin = 15;

    const validStops = activeStops.filter(s => s.address && s.address.trim());

    // If there are intermediate stops, use Google DirectionsService to calculate total driving distance
    if (validStops.length > 0 && window.google?.maps?.DirectionsService) {
      try {
        const directionsService = new window.google.maps.DirectionsService();
        const waypoints = validStops.map(s => ({
          location: (s.lat && s.lng) ? { lat: s.lat, lng: s.lng } : s.address,
          stopover: true
        }));

        const response = await new Promise((resolve, reject) => {
          directionsService.route(
            {
              origin: { lat: pCoords.lat, lng: pCoords.lng },
              destination: { lat: dCoords.lat, lng: dCoords.lng },
              waypoints,
              travelMode: window.google.maps.TravelMode.DRIVING
            },
            (res, status) => {
              if (status === 'OK') resolve(res);
              else reject(status);
            }
          );
        });

        if (response.routes?.[0]?.legs) {
          let totalMeters = 0;
          let totalSecs = 0;
          response.routes[0].legs.forEach(leg => {
            totalMeters += leg.distance.value;
            totalSecs += leg.duration.value;
          });
          dist = Math.round((totalMeters / 1000) * 10) / 10;
          timeMin = Math.round(totalSecs / 60);
        }
      } catch (e) {
        console.warn("DirectionsService with waypoints failed, using distance calculation:", e);
        // Fallback distance calculation through stops
        let totalDist = calculateHaversine(pCoords.lat, pCoords.lng, validStops[0].lat || pCoords.lat, validStops[0].lng || pCoords.lng);
        for (let i = 0; i < validStops.length - 1; i++) {
          totalDist += calculateHaversine(
            validStops[i].lat || pCoords.lat,
            validStops[i].lng || pCoords.lng,
            validStops[i+1].lat || dCoords.lat,
            validStops[i+1].lng || dCoords.lng
          );
        }
        totalDist += calculateHaversine(
          validStops[validStops.length - 1].lat || dCoords.lat,
          validStops[validStops.length - 1].lng || dCoords.lng,
          dCoords.lat,
          dCoords.lng
        );
        dist = Math.round(totalDist * 10) / 10;
        timeMin = Math.round(dist * 3);
      }
    } else if (window.google && window.google.maps) {
      // Direct Pickup -> Drop using DistanceMatrix
      try {
        const service = new window.google.maps.DistanceMatrixService();
        const response = await new Promise((resolve, reject) => {
          service.getDistanceMatrix(
            {
              origins: [{ lat: pCoords.lat, lng: pCoords.lng }],
              destinations: [{ lat: dCoords.lat, lng: dCoords.lng }],
              travelMode: window.google.maps.TravelMode.DRIVING
            },
            (res, status) => {
              if (status === 'OK') resolve(res);
              else reject(status);
            }
          );
        });

        const element = response.rows?.[0]?.elements?.[0];
        if (element && element.status === 'OK') {
          dist = Math.round((element.distance.value / 1000) * 10) / 10;
          timeMin = Math.round(element.duration.value / 60);
        } else {
          dist = calculateHaversine(pCoords.lat, pCoords.lng, dCoords.lat, dCoords.lng);
          timeMin = Math.round(dist * 3);
        }
      } catch (e) {
        dist = calculateHaversine(pCoords.lat, pCoords.lng, dCoords.lat, dCoords.lng);
        timeMin = Math.round(dist * 3);
      }
    } else {
      dist = calculateHaversine(pCoords.lat, pCoords.lng, dCoords.lat, dCoords.lng);
      timeMin = Math.round(dist * 3);
    }

    setDistanceKm(dist);
    setEstimatedTimeMin(timeMin);

    // Call backend Search Cabs API to get exact fare options
    try {
      const fareRes = await searchCabs({
        distanceKm: dist,
        rideType,
        seatsBooked: rideType === 'Shared' ? seatsBooked : 1,
        pickupAddress,
        dropAddress,
        pickupLat: pCoords.lat,
        pickupLng: pCoords.lng,
        dropLat: dCoords.lat,
        dropLng: dCoords.lng,
        isAdmin: true
      });

      if (fareRes.success && fareRes.options && fareRes.options.length > 0) {
        const formatted = fareRes.options.map(opt => ({
          ...opt,
          fare: opt.fare ?? opt.privateFare ?? opt.estimatedFare ?? opt.sharedFare ?? 0
        }));
        setFareOptions(formatted);
        
        if (!selectedCategory) {
          if (categories.length > 0) {
            setSelectedCategory(categories[0]);
          } else if (formatted.length > 0) {
            setSelectedCategory(formatted[0]);
          }
        }
      } else {
        fallbackFareCalculation(dist);
      }
    } catch (err) {
      fallbackFareCalculation(dist);
    } finally {
      setLoadingFares(false);
    }
  };

  // STEP 1 -> STEP 2 Transition
  const handleProceedToStep2 = async (e) => {
    e.preventDefault();

    if (!pickupAddress || !dropAddress) {
      return Swal.fire('Locations Required', 'Please enter both Pickup and Destination addresses to proceed.', 'warning');
    }

    setLoadingFares(true);

    const geocodePromise = (addr, currentCoords) => {
      return new Promise((resolve) => {
        if (currentCoords.lat && currentCoords.lng) {
          resolve(currentCoords);
          return;
        }
        if (window.google?.maps?.Geocoder) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ address: addr, componentRestrictions: { country: 'IN' } }, (results, status) => {
            if (status === 'OK' && results[0]?.geometry) {
              resolve({
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng()
              });
            } else {
              resolve({ lat: 28.6139, lng: 77.2090 });
            }
          });
        } else {
          resolve({ lat: 28.6139, lng: 77.2090 });
        }
      });
    };

    try {
      const [pCoords, dCoords] = await Promise.all([
        geocodePromise(pickupAddress, pickupCoords),
        geocodePromise(dropAddress, dropCoords)
      ]);

      setPickupCoords(pCoords);
      setDropCoords(dCoords);

      // Resolve coordinates for any intermediate stops that don't have lat/lng yet
      const validStops = stops.filter(s => s.address && s.address.trim());
      const resolvedStops = await Promise.all(
        validStops.map(async (s) => {
          if (s.lat && s.lng) return s;
          const coords = await geocodePromise(s.address, { lat: null, lng: null });
          return { ...s, lat: coords.lat, lng: coords.lng };
        })
      );
      setStops(resolvedStops);

      // Calculate distance and fares through all waypoints
      await calculateDistanceAndFares(pCoords, dCoords, resolvedStops);

      // Advance to Step 2
      setCurrentStep(2);
    } catch (err) {
      console.error("Step 2 navigation error:", err);
      Swal.fire("Error", "Could not calculate route. Please check the addresses.", "error");
    } finally {
      setLoadingFares(false);
    }
  };

  // Final Booking Submit (Step 2)
  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCategory) {
      return Swal.fire('Error', 'Please select a Cab Category.', 'error');
    }

    const finalPickupLat = pickupCoords.lat || 28.6139;
    const finalPickupLng = pickupCoords.lng || 77.2090;
    const finalDropLat = dropCoords.lat || 28.5355;
    const finalDropLng = dropCoords.lng || 77.3910;
    const finalDist = Number(distanceKm) > 0 ? Number(distanceKm) : 5;
    const catId = String(selectedCategory._id || selectedCategory.carCategoryId || '');

    const matchedOption = fareOptions.find(o => 
      String(o.carCategoryId || o._id) === catId ||
      o.name?.trim().toLowerCase() === selectedCategory.name?.trim().toLowerCase()
    );
    const baseRate = Number(selectedCategory.baseFare) || 50;
    const numSeats = Number(seatsBooked) || 1;
    const perKmRate = rideType === 'Shared' 
      ? (Number(selectedCategory.sharedRatePerSeatPerKm) || Number(selectedCategory.sharedRatePerKm) || 8) * numSeats
      : (Number(selectedCategory.privateRatePerKm) || 12);
    const fallbackFare = Math.round(baseRate + (finalDist * perKmRate));

    const rawFare = matchedOption?.fare ?? matchedOption?.privateFare ?? matchedOption?.estimatedFare ?? matchedOption?.sharedFare;
    const estimatedFare = (rawFare !== undefined && rawFare !== null && !isNaN(rawFare) && Number(rawFare) > 0)
      ? Math.round(Number(rawFare))
      : fallbackFare;

    // Filter valid stops for submission
    const formattedStops = stops
      .filter(s => s.address && s.address.trim())
      .map(s => ({
        address: s.address.trim(),
        latitude: s.lat || undefined,
        longitude: s.lng || undefined
      }));

    const confirmRes = await Swal.fire({
      title: 'Confirm Booking for User?',
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.6; padding: 4px;">
          <p><strong>Passenger:</strong> ${user.name} (${user.phone || 'N/A'})</p>
          <p><strong>Cab Category:</strong> ${selectedCategory.name}</p>
          <p><strong>Ride Type:</strong> ${rideType} ${rideType === 'Shared' ? `(${seatsBooked} seats)` : ''}</p>
          <p><strong>Pickup:</strong> ${pickupAddress.slice(0, 45)}...</p>
          ${formattedStops.length > 0 ? `
            <div style="background: #FFFBEB; padding: 6px 10px; border-radius: 8px; border: 1px solid #FDE68A; margin: 6px 0;">
              <strong>Stops (${formattedStops.length}):</strong>
              ${formattedStops.map((s, i) => `<br/>&nbsp;&nbsp;• Stop ${i + 1}: ${s.address.slice(0, 40)}`).join('')}
            </div>
          ` : ''}
          <p><strong>Drop:</strong> ${dropAddress.slice(0, 45)}...</p>
          <p><strong>Distance:</strong> <strong>${finalDist} km</strong> (~${estimatedTimeMin} mins)</p>
          <p><strong>Calculated Trip Fare:</strong> <span style="color: #2563EB; font-weight: bold; font-size: 16px;">₹${estimatedFare}</span></p>
          <hr style="margin: 10px 0; border: none; border-top: 1px solid #E5E7EB;"/>
          <p style="font-size: 11px; color: #6B7280;">This booking will be automatically linked to <strong>${user.name}'s</strong> account and available in their Rider App / Web Portal.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Book Cab Now',
      confirmButtonColor: '#2563EB',
      cancelButtonText: 'Cancel'
    });

    if (!confirmRes.isConfirmed) return;

    setSubmitting(true);
    try {
      const payload = {
        userId: user._id, // Attach to target user account
        passengerName: user.name,
        passengerPhone: user.phone || '9999999999',
        rideType,
        carCategoryId: selectedCategory._id || selectedCategory.carCategoryId,
        seatsBooked: rideType === 'Shared' ? seatsBooked : 1,
        pickupAddress,
        pickupLat: finalPickupLat,
        pickupLng: finalPickupLng,
        dropAddress,
        dropLat: finalDropLat,
        dropLng: finalDropLng,
        stops: formattedStops, // Waypoint intermediate stops!
        distanceKm: finalDist,
        estimatedTimeMin,
        paymentMethod,
        isAdmin: true
      };

      const res = await createBooking(payload);

      if (res.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Booking Created Successfully! 🚕',
          html: `
            <div style="text-align: center; font-size: 13px;">
              <p>Booking ID: <strong>#${(res.booking?._id || 'SUCCESS').slice(-6)}</strong></p>
              ${formattedStops.length > 0 ? `<p style="font-size: 11px; color: #6B7280; margin-top: 2px;">With ${formattedStops.length} intermediate stop(s)</p>` : ''}
              <p style="color: #10B981; font-weight: bold; margin-top: 6px;">
                Linked to ${user.name}'s panel & driver matching initiated!
              </p>
            </div>
          `,
          confirmButtonColor: '#2563EB'
        });

        if (onBookingSuccess) onBookingSuccess(res.booking);
        onClose();
      } else {
        throw new Error(res.message || 'Failed to create booking');
      }
    } catch (err) {
      console.error('Booking Error:', err);
      Swal.fire('Booking Failed', err.message || 'Could not complete the booking. Please check details.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-8 border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Car size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Book Ride for User</h2>
              <p className="text-xs text-blue-100">
                {currentStep === 1 ? 'Step 1 of 2: Set Route, Stops & Ride Type' : 'Step 2 of 2: Select Cab & Confirm Price'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Card Banner */}
        <div className="bg-blue-50/70 border-b border-blue-100 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{user.name}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                <span className="flex items-center gap-1"><Phone size={11} className="text-gray-400" /> {user.phone || 'No phone'}</span>
                <span className="flex items-center gap-1"><User size={11} className="text-gray-400" /> ID: {user._id?.slice(-6)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-white px-3 py-1.5 rounded-xl border border-blue-200 shadow-xs flex items-center gap-1.5">
              <Wallet size={13} className="text-green-600" />
              <span className="text-xs text-gray-500">Wallet:</span>
              <span className="text-xs font-bold text-green-700">₹{user.walletBalance || 0}</span>
            </div>
          </div>
        </div>

        {/* Wizard Step Indicator */}
        <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs">
          <div 
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2 cursor-pointer font-bold ${
              currentStep === 1 ? 'text-blue-600' : 'text-emerald-600'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {currentStep > 1 ? '✓' : '1'}
            </span>
            <span>1. Route, Stops & Locations</span>
          </div>

          <div className="flex-1 mx-4 h-0.5 bg-gray-200">
            <div className={`h-full bg-blue-600 transition-all duration-300 ${currentStep === 2 ? 'w-full' : 'w-0'}`} />
          </div>

          <div className={`flex items-center gap-2 font-bold ${
            currentStep === 2 ? 'text-blue-600' : 'text-gray-400'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </span>
            <span>2. Cab & Calculated Fares</span>
          </div>
        </div>

        {/* ================= STEP 1: ROUTE, STOPS & SCHEDULE ================= */}
        {currentStep === 1 && (
          <form onSubmit={handleProceedToStep2} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
            
            {/* Ride Type Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Ride Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRideType('Private')}
                  className={`py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border ${
                    rideType === 'Private'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Car size={16} /> Private Ride (Full Cab)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRideType('Shared');
                    if (stops.length > 0) {
                      setStops([]); // Clear stops if switching to shared ride
                    }
                  }}
                  className={`py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border ${
                    rideType === 'Shared'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Users size={16} /> Shared Ride (By Seat)
                </button>
              </div>

              {rideType === 'Shared' && (
                <div className="mt-3 flex items-center gap-3 bg-indigo-50/70 p-3 rounded-xl border border-indigo-100">
                  <span className="text-xs font-medium text-indigo-900">Number of Seats:</span>
                  {[1, 2, 3, 4].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSeatsBooked(num)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        seatsBooked === num 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Locations (Pickup, Add Stops, Drop) */}
            <div className="space-y-4 bg-gray-50/80 p-4 rounded-xl border border-gray-200">
              
              {/* Pickup Location */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <MapPin size={14} className="text-green-600" /> Pickup Location *
                  </label>
                  {user.firstLocation?.latitude && (
                    <button
                      type="button"
                      onClick={() => {
                        setPickupCoords({
                          lat: user.firstLocation.latitude,
                          lng: user.firstLocation.longitude
                        });
                        setPickupAddress(user.firstLocation.address || 'User Last Known Location');
                        if (pickupInputRef.current) {
                          pickupInputRef.current.value = user.firstLocation.address || 'User Last Known Location';
                        }
                        setShowPickupSuggestions(false);
                      }}
                      className="text-[11px] font-medium text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Navigation size={11} /> Use User's GPS Location
                    </button>
                  )}
                </div>
                <input
                  ref={pickupInputRef}
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPickupAddress(val);
                    setShowPickupSuggestions(true);
                    fetchSuggestions(val, true);
                  }}
                  onFocus={() => {
                    if (pickupSuggestions.length > 0) setShowPickupSuggestions(true);
                  }}
                  placeholder="Enter pickup location (e.g. Connaught Place, Delhi)"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-xs"
                  required
                />

                {/* Suggestions Dropdown for Pickup */}
                {showPickupSuggestions && pickupSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto divide-y divide-gray-100">
                    {pickupSuggestions.map((place, idx) => (
                      <div
                        key={idx}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectSuggestion(place, true);
                        }}
                        className="p-3 hover:bg-blue-50 cursor-pointer flex items-center gap-2.5 text-xs text-gray-800 transition-colors"
                      >
                        <MapPin size={14} className="text-green-600 shrink-0" />
                        <span className="truncate">{place.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Intermediate Stops (Waypoints) */}
              {stops.length > 0 && (
                <div className="space-y-3 pl-3 border-l-2 border-dashed border-amber-300 my-2">
                  {stops.map((stop, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black">
                            {idx + 1}
                          </span>
                          Stop {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveStop(idx)}
                          className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
                          title="Remove this stop"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                      <input
                        ref={(el) => initStopAutocomplete(idx, el)}
                        type="text"
                        value={stop.address}
                        onChange={(e) => handleStopChange(idx, e.target.value)}
                        placeholder={`Enter stop ${idx + 1} address (e.g. Market, Metro Station)...`}
                        className="w-full bg-amber-50/20 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                        required
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Add Stop Button Bar */}
              {rideType === 'Private' ? (
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-gray-500">
                    {stops.length > 0 ? `${stops.length} stop(s) added` : 'Need a stop in between?'}
                  </div>
                  {stops.length < 4 && (
                    <button
                      type="button"
                      onClick={handleAddStop}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs transition-all hover:scale-105 active:scale-95"
                    >
                      <Plus size={13} /> + Add Stop
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-gray-400 italic">
                  * Intermediate stops are only available for Private rides.
                </div>
              )}

              {/* Drop Destination */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <MapPin size={14} className="text-red-600" /> Destination / Drop Location *
                </label>
                <input
                  ref={dropInputRef}
                  type="text"
                  value={dropAddress}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDropAddress(val);
                    setShowDropSuggestions(true);
                    fetchSuggestions(val, false);
                  }}
                  onFocus={() => {
                    if (dropSuggestions.length > 0) setShowDropSuggestions(true);
                  }}
                  placeholder="Enter drop destination (e.g. Sector 62, Noida)"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-xs"
                  required
                />

                {/* Suggestions Dropdown for Drop */}
                {showDropSuggestions && dropSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto divide-y divide-gray-100">
                    {dropSuggestions.map((place, idx) => (
                      <div
                        key={idx}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectSuggestion(place, false);
                        }}
                        className="p-3 hover:bg-blue-50 cursor-pointer flex items-center gap-2.5 text-xs text-gray-800 transition-colors"
                      >
                        <MapPin size={14} className="text-red-600 shrink-0" />
                        <span className="truncate">{place.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Info Tip */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2.5">
              <Sparkles size={16} className="text-blue-600 shrink-0" />
              <span>Locations aur stops bharne ke baad Next dabayein — agle step me Google Maps se total distance count hokar har cab ka final price dikhega.</span>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loadingFares || !pickupAddress || !dropAddress}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {loadingFares ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Calculating Route & Stops...
                  </>
                ) : (
                  <>
                    Next: Choose Cab & Prices
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

          </form>
        )}

        {/* ================= STEP 2: CHOOSE CAB & PRICES ================= */}
        {currentStep === 2 && (
          <form onSubmit={handleBookingSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">

            {/* Route Summary Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1 shrink-0" />
                    <span className="text-gray-800 font-medium line-clamp-1"><strong>Pickup:</strong> {pickupAddress}</span>
                  </div>

                  {/* Render Stops in Summary */}
                  {stops.filter(s => s.address).map((stop, sIdx) => (
                    <div key={sIdx} className="flex items-start gap-2 pl-2 border-l border-dashed border-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                      <span className="text-amber-900 font-medium line-clamp-1"><strong>Stop {sIdx + 1}:</strong> {stop.address}</span>
                    </div>
                  ))}

                  <div className="flex items-start gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 shrink-0" />
                    <span className="text-gray-800 font-medium line-clamp-1"><strong>Drop:</strong> {dropAddress}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-2.5 py-1 text-xs text-blue-600 hover:text-blue-800 font-bold bg-white rounded-lg border border-blue-200 flex items-center gap-1 shadow-2xs shrink-0"
                >
                  <Edit3 size={11} /> Edit Route
                </button>
              </div>

              {/* Distance & Time Pill */}
              <div className="mt-3 pt-2.5 border-t border-blue-200/60 flex flex-wrap items-center justify-between gap-2 text-xs text-blue-900 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Navigation size={13} className="text-blue-600" /> Route Distance: <strong>{distanceKm} km</strong>
                  {stops.filter(s => s.address).length > 0 && (
                    <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md font-bold">
                      +{stops.filter(s => s.address).length} Stop(s)
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} className="text-blue-600" /> Est. Time: <strong>~{estimatedTimeMin} mins</strong>
                </span>
                <span className="text-[11px] bg-blue-600 text-white px-2 py-0.5 rounded-full">
                  {rideType} Ride {rideType === 'Shared' ? `(${seatsBooked} seats)` : ''}
                </span>
              </div>
            </div>

            {/* Cab Selection Grid */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Car size={15} className="text-blue-600" /> Choose Vehicle Category *
                </label>
                <span className="text-[11px] text-gray-500">Click to select cab</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {categories.map((cat) => {
                  const catId = String(cat._id || cat.id || '');
                  const isSelected = selectedCategory && (
                    String(selectedCategory._id || selectedCategory.carCategoryId) === catId ||
                    selectedCategory.name?.trim().toLowerCase() === cat.name?.trim().toLowerCase()
                  );

                  const matchedOpt = fareOptions.find(o => 
                    String(o.carCategoryId || o._id) === catId ||
                    o.name?.trim().toLowerCase() === cat.name?.trim().toLowerCase()
                  );

                  const baseRate = Number(cat.baseFare) || 50;
                  const numSeats = Number(seatsBooked) || 1;
                  const perKmRate = rideType === 'Shared' 
                    ? (Number(cat.sharedRatePerSeatPerKm) || Number(cat.sharedRatePerKm) || 8) * numSeats
                    : (Number(cat.privateRatePerKm) || 12);
                  const fallbackFare = Math.round(baseRate + (distanceKm * perKmRate));

                  const rawFare = matchedOpt?.fare ?? matchedOpt?.privateFare ?? matchedOpt?.estimatedFare ?? matchedOpt?.sharedFare;
                  const displayedFare = (rawFare !== undefined && rawFare !== null && !isNaN(rawFare) && Number(rawFare) > 0)
                    ? Math.round(Number(rawFare))
                    : fallbackFare;

                  return (
                    <div
                      key={catId}
                      onClick={() => setSelectedCategory(cat)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50/60 shadow-md ring-2 ring-blue-200' 
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-900">{cat.name}</span>
                        {isSelected ? (
                          <CheckCircle2 size={16} className="text-blue-600" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-gray-300" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="text-base font-black text-gray-900">
                          ₹{displayedFare}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-500">
                          <span>Seats: {cat.seatCapacity || 4}</span>
                          <span>₹{(cat.privateRatePerKm || 12)}/km</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Wallet size={14} className="text-gray-500" /> Payment Collection Method
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'Cash', label: 'Cash to Driver', desc: 'Passenger pays driver' },
                  { id: 'Wallet', label: 'User Wallet', desc: `Bal: ₹${user.walletBalance || 0}` },
                  { id: 'Online', label: 'Online / Gateway', desc: 'Prepaid' }
                ].map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      paymentMethod === pm.id
                        ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-1 ring-blue-300'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <p className={`text-xs font-bold ${paymentMethod === pm.id ? 'text-blue-900' : 'text-gray-900'}`}>
                      {pm.label}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{pm.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft size={16} /> Back to Route
              </button>

              <button
                type="submit"
                disabled={submitting || !selectedCategory}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-300 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Dispatching Cab...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Confirm & Book Ride Now
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};

export default AdminBookRideModal;
