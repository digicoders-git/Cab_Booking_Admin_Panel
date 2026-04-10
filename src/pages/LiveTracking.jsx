import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { trackingService } from '../apis/trackingApi';
import { getAddressFromCoordinates } from '../apis/geocodingApi';
import { useAuth } from '../context/AuthContext';
import {
  FaMap, FaCar, FaPhone, FaClock, FaSyncAlt,
  FaCheckCircle, FaCircle, FaUser, FaMapPin
} from 'react-icons/fa';
import { MapPin, Phone, Clock, AlertCircle, Search, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { AutoIcon, CarIcon, VanIcon } from '../components/VehicleIcons';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Get vehicle icon component based on ride type
const getVehicleIcon = (rideType) => {
  switch (rideType?.toLowerCase()) {
    case 'auto':
      return AutoIcon;
    case 'van':
    case 'shared':
      return VanIcon;
    case 'private':
    case 'car':
    default:
      return CarIcon;
  }
};

// Get vehicle color based on ride type
const getVehicleColor = (rideType) => {
  switch (rideType?.toLowerCase()) {
    case 'auto':
      return '#F59E0B';
    case 'van':
    case 'shared':
      return '#8B5CF6';
    case 'private':
    case 'car':
    default:
      return '#3B82F6';
  }
};

// Stat Card
const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-lg transition-all">
    <div className="flex items-start justify-between mb-3">
      <div className="p-3 rounded-xl" style={{ backgroundColor: color + '15' }}>
        <Icon className="text-xl" style={{ color }} />
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
    <p className="text-xs font-medium text-gray-500">{label}</p>
  </div>
);

// Driver Card
const DriverCard = ({ driver, onSelect, address }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'idle':
        return { bg: '#10B98115', color: '#10B981', label: 'Idle' };
      case 'on private ride':
        return { bg: '#3B82F615', color: '#3B82F6', label: 'On Ride' };
      case 'on shared ride':
        return { bg: '#F59E0B15', color: '#F59E0B', label: 'On Shared' };
      case 'offline':
        return { bg: '#EF444415', color: '#EF4444', label: 'Offline' };
      default:
        return { bg: '#94A3B815', color: '#94A3B8', label: status };
    }
  };

  const statusInfo = getStatusColor(driver.status);
  const lastUpdated = driver.location?.lastUpdated
    ? new Date(driver.location.lastUpdated).toLocaleTimeString()
    : 'N/A';

  const hasLocation = driver.location?.latitude && driver.location?.longitude;
  const VehicleIcon = getVehicleIcon(driver.rideType);
  const vehicleColor = getVehicleColor(driver.rideType);

  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all cursor-pointer p-5 hover:border-blue-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          {driver.carInfo?.carCategoryImage && driver.carInfo.carCategoryImage !== 'null' ? (
            <img
              src={driver.carInfo.carCategoryImage}
              alt="Car"
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : driver.image ? (
            <img
              src={`${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '')}/uploads/${driver.image}`}
              alt={driver.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: vehicleColor, display: (driver.carInfo?.carCategoryImage && driver.carInfo.carCategoryImage !== 'null') || driver.image ? 'none' : 'flex' }}>
            <VehicleIcon size={20} color="white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{driver.name}</h3>
            <p className="text-xs text-gray-500">{driver.phone}</p>
            <p className="text-xs text-gray-400 mt-1">{driver.carInfo?.carNumber || 'N/A'}</p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
        >
          <FaCircle size={6} />
          {statusInfo.label}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        {hasLocation ? (
          <div className="flex items-start gap-2 text-gray-600">
            <MapPin size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <span className="text-xs line-clamp-2">{address || 'Loading address...'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin size={14} />
            <span>Location not available</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-gray-600">
          <Clock size={14} className="text-gray-400" />
          <span className="text-xs">Updated: {lastUpdated}</span>
        </div>
        {driver.carInfo?.carCategoryImage && driver.carInfo.carCategoryImage !== 'null' && (
          <div className="mt-2">
            <img
              src={driver.carInfo.carCategoryImage}
              alt="Car"
              className="w-full h-20 object-cover rounded-lg border border-gray-200"
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Google Map Component
const GoogleMap = ({ drivers, selectedDriver, onDriverSelect }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({}); 
  const isInitialLoadRef = useRef(true);
  const driversRef = useRef(drivers);

  // Keep driversRef always updated with latest prop
  useEffect(() => {
    driversRef.current = drivers;
  }, [drivers]);

  useEffect(() => {
    const loadScript = () => {
      // 1. Check if window.google is already there
      if (window.google && window.google.maps && window.google.maps.Map) {
        initMap();
        return;
      }

      // 2. Check if the script tag is already in progress
      let script = document.getElementById('google-maps-script');
      if (script) {
        script.addEventListener('load', () => {
          // Add a small delay for library initialization
          setTimeout(initMap, 100);
        });
        return;
      }

      // 3. Create and append the script tag
      script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    };

    loadScript();

    return () => {
      Object.values(markersRef.current).forEach(marker => marker.setMap(null));
      markersRef.current = {};
    };
  }, []);

  const initMap = () => {
    if (!mapRef.current) return;
    
    // Safety check again for window.google
    if (!window.google || !window.google.maps) {
        setTimeout(initMap, 200);
        return;
    }

    // Double check if already initialized
    if (mapInstanceRef.current) return;

    const defaultCenter = { lat: 26.9124, lng: 80.9435 };

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      zoom: 13,
      center: defaultCenter,
      mapTypeControl: true,
      fullscreenControl: true,
      streetViewControl: false,
    });

    updateMarkers();
  };

  const updateMarkers = () => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    const currentDriverIds = new Set();
    const activeDrivers = driversRef.current; // Use the latest from ref

    activeDrivers.forEach(driver => {
      if (!driver.location?.latitude || !driver.location?.longitude) return;
      currentDriverIds.add(driver.driverId);

      const latLng = {
        lat: Number(driver.location.latitude),
        lng: Number(driver.location.longitude),
      };

      // Get appropriate icon with rotation
      let markerIcon = '/car.png';
      if (driver.carInfo?.carCategoryImage && driver.carInfo.carCategoryImage !== 'null') {
        markerIcon = `${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '')}/uploads/${driver.carInfo.carCategoryImage}`;
      }

      if (markersRef.current[driver.driverId]) {
        // MOVE EXISTING MARKER (Animated)
        const marker = markersRef.current[driver.driverId];
        
        // Advanced: Smoothly interpolate position
        const animateMarker = (marker, newPos) => {
          const frames = 20;
          let frame = 0;
          const startLat = marker.getPosition().lat();
          const startLng = marker.getPosition().lng();
          const deltaLat = (newPos.lat - startLat) / frames;
          const deltaLng = (newPos.lng - startLng) / frames;

          const move = () => {
            frame++;
            const lat = startLat + deltaLat * frame;
            const lng = startLng + deltaLng * frame;
            marker.setPosition(new window.google.maps.LatLng(lat, lng));
            if (frame < frames) {
              requestAnimationFrame(move);
            }
          };
          move();
        };

        animateMarker(marker, latLng);
        
        // Update rotation if heading exists
        const icon = marker.getIcon();
        if (icon && typeof driver.heading === 'number') {
          icon.rotation = driver.heading;
          marker.setIcon(icon);
        }

        // If this driver is selected, follow them
        if (selectedDriver?.driverId === driver.driverId) {
          mapInstanceRef.current.panTo(latLng);
        }
      } else {
        // CREATE NEW MARKER
        const marker = new window.google.maps.Marker({
          position: latLng,
          map: mapInstanceRef.current,
          title: driver.name,
          optimized: true,
          icon: {
            url: markerIcon,
            scaledSize: new window.google.maps.Size(45, 45),
            origin: new window.google.maps.Point(0, 0),
            anchor: new window.google.maps.Point(22.5, 22.5),
            rotation: driver.heading || 0
          },
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; font-family: Arial; max-width: 250px;">
              <h3 style="margin: 0 0 5px 0; font-weight: bold; color: #1e3a8a;">${driver.name}</h3>
              <p style="margin: 0 0 3px 0; font-size: 11px;"><b>Status:</b> ${driver.status}</p>
              <p style="margin: 0 0 3px 0; font-size: 11px;"><b>Phone:</b> ${driver.phone}</p>
              <p style="margin: 0; font-size: 11px;"><b>Car:</b> ${driver.carInfo?.carNumber || 'N/A'}</p>
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker);
          onDriverSelect(driver);
        });

        markersRef.current[driver.driverId] = marker;
      }
    });

    // Cleanup markers for drivers no longer in the list
    Object.keys(markersRef.current).forEach(id => {
      if (!currentDriverIds.has(id)) {
        markersRef.current[id].setMap(null);
        delete markersRef.current[id];
      }
    });

    // Fit bounds ONLY ONCE at the start
    if (isInitialLoadRef.current && Object.keys(markersRef.current).length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      Object.values(markersRef.current).forEach(m => bounds.extend(m.getPosition()));
      mapInstanceRef.current.fitBounds(bounds);
      isInitialLoadRef.current = false;
    }
  };

  useEffect(() => {
    updateMarkers();
  }, [drivers]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-xl border border-gray-200 shadow-sm"
      style={{ minHeight: '500px' }}
    />
  );
};

// Trip Map Component
const TripMap = ({ driver }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    const loadScript = () => {
      if (window.google && window.google.maps && window.google.maps.Map) {
        initMap();
        return;
      }

      let script = document.getElementById('google-maps-script');
      if (script) {
        script.addEventListener('load', () => {
          setTimeout(initMap, 100);
        });
        return;
      }

      script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    };

    loadScript();

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);

  const initMap = () => {
    if (!mapRef.current) return;
    if (!window.google || !window.google.maps || !window.google.maps.Map) {
        setTimeout(initMap, 100);
        return;
    }

    const defaultCenter = { lat: 26.9124, lng: 80.9435 };
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      zoom: 14,
      center: defaultCenter,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
    });

    updateMarkers();
  };

  const updateMarkers = () => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();

    // Pickup marker (Green)
    if (driver.currentTrip?.pickup?.latitude && driver.currentTrip?.pickup?.longitude) {
      const pickupMarker = new window.google.maps.Marker({
        position: {
          lat: driver.currentTrip.pickup.latitude,
          lng: driver.currentTrip.pickup.longitude,
        },
        map: mapInstanceRef.current,
        title: 'Pickup Location',
        icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
      });
      pickupMarker.addListener('click', () => {
        new window.google.maps.InfoWindow({
          content: `<div style="padding: 8px; font-size: 12px;"><strong>📍 Pickup</strong><br/>${driver.currentTrip.pickup.address || 'Pickup Location'}</div>`,
        }).open(mapInstanceRef.current, pickupMarker);
      });
      markersRef.current.push(pickupMarker);
      bounds.extend(pickupMarker.getPosition());
    }

    // Live location marker (Blue)
    if (driver.location?.latitude && driver.location?.longitude) {
      let carImage = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
      if (driver.carInfo?.carCategoryImage && driver.carInfo.carCategoryImage !== 'null') {
        carImage = `${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '')}/uploads/${driver.carInfo.carCategoryImage}`;
      }

      const liveMarker = new window.google.maps.Marker({
        position: {
          lat: driver.location.latitude,
          lng: driver.location.longitude,
        },
        map: mapInstanceRef.current,
        title: 'Live Location',
        icon: {
          url: carImage,
          scaledSize: new window.google.maps.Size(50, 50),
          origin: new window.google.maps.Point(0, 0),
          anchor: new window.google.maps.Point(25, 25),
        },
      });
      liveMarker.addListener('click', () => {
        new window.google.maps.InfoWindow({
          content: `<div style="padding: 8px; font-size: 12px;"><strong>🔴 Live Location</strong><br/>${driver.name}</div>`,
        }).open(mapInstanceRef.current, liveMarker);
      });
      markersRef.current.push(liveMarker);
      bounds.extend(liveMarker.getPosition());
    }

    // Drop marker (Red)
    if (driver.currentTrip?.drop?.latitude && driver.currentTrip?.drop?.longitude) {
      const dropMarker = new window.google.maps.Marker({
        position: {
          lat: driver.currentTrip.drop.latitude,
          lng: driver.currentTrip.drop.longitude,
        },
        map: mapInstanceRef.current,
        title: 'Drop Location',
        icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
      });
      dropMarker.addListener('click', () => {
        new window.google.maps.InfoWindow({
          content: `<div style="padding: 8px; font-size: 12px;"><strong>📍 Drop</strong><br/>${driver.currentTrip.drop.address || 'Drop Location'}</div>`,
        }).open(mapInstanceRef.current, dropMarker);
      });
      markersRef.current.push(dropMarker);
      bounds.extend(dropMarker.getPosition());
    }

    // Draw polyline from pickup to drop
    if (driver.currentTrip?.pickup && driver.currentTrip?.drop) {
      const polyline = new window.google.maps.Polyline({
        path: [
          { lat: driver.currentTrip.pickup.latitude, lng: driver.currentTrip.pickup.longitude },
          { lat: driver.location?.latitude || driver.currentTrip.pickup.latitude, lng: driver.location?.longitude || driver.currentTrip.pickup.longitude },
          { lat: driver.currentTrip.drop.latitude, lng: driver.currentTrip.drop.longitude },
        ],
        geodesic: true,
        strokeColor: '#4F46E5',
        strokeOpacity: 0.7,
        strokeWeight: 3,
        map: mapInstanceRef.current,
      });
    }

    if (markersRef.current.length > 0) {
      mapInstanceRef.current.fitBounds(bounds);
    }
  };

  useEffect(() => {
    updateMarkers();
  }, [driver]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-xl border border-gray-200 shadow-sm"
      style={{ minHeight: '300px' }}
    />
  );
};

// Driver Detail Modal
const DriverDetailModal = ({ driver, isOpen, onClose, address, pickupAddress, dropAddress }) => {
  if (!isOpen || !driver) return null;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'idle':
        return { bg: '#10B98115', color: '#10B981', label: 'Idle' };
      case 'on private ride':
        return { bg: '#3B82F615', color: '#3B82F6', label: 'On Private Ride' };
      case 'on shared ride':
        return { bg: '#F59E0B15', color: '#F59E0B', label: 'On Shared Ride' };
      case 'offline':
        return { bg: '#EF444415', color: '#EF4444', label: 'Offline' };
      default:
        return { bg: '#94A3B815', color: '#94A3B8', label: status };
    }
  };

  const statusInfo = getStatusColor(driver.status);
  const lastUpdated = driver.location?.lastUpdated
    ? new Date(driver.location.lastUpdated).toLocaleString()
    : 'N/A';
  const hasLocation = driver.location?.latitude && driver.location?.longitude;
  const VehicleIcon = getVehicleIcon(driver.rideType);
  const vehicleColor = getVehicleColor(driver.rideType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-2xl rounded-2xl shadow-2xl bg-white border border-gray-200 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FaMap className="text-white" size={16} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Driver Details</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Driver Info */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5 border border-blue-100">
            <div className="flex items-start gap-4">
              {driver.image ? (
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '')}/uploads/${driver.image}`}
                  alt={driver.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: vehicleColor, display: driver.image ? 'none' : 'flex' }}>
                <VehicleIcon size={28} color="white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{driver.name}</h3>
                <p className="text-sm text-gray-600 mt-1">Driver ID: {driver.driverId}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
                  >
                    <FaCircle size={6} />
                    {statusInfo.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-50 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Phone size={16} className="text-blue-600" />
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{driver.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Car Info */}
          <div className="bg-gray-50 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaCar size={16} className="text-blue-600" />
              Car Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Car Category</span>
                <span className="text-sm font-medium text-gray-900">{driver.carInfo?.carCategoryName || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Car Model</span>
                <span className="text-sm font-medium text-gray-900">{driver.carInfo?.carModel || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Car Number</span>
                <span className="text-sm font-medium text-gray-900">{driver.carInfo?.carNumber || 'N/A'}</span>
              </div>
              {driver.carInfo?.carCategoryImage && driver.carInfo.carCategoryImage !== 'null' ? (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">Car Image</p>
                  <img
                    src={driver.carInfo.carCategoryImage}
                    alt="Car"
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                </div>
              ) : null}
            </div>
          </div>

          {/* Trip Map */}
          {driver.currentTrip && (driver.currentTrip.pickup || driver.currentTrip.drop) && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaMap size={16} className="text-blue-600" />
                Trip Route Map
              </h3>
              <TripMap driver={driver} />
            </div>
          )}

          {/* Trip Info - Pickup, Drop, Live Location */}
          {driver.currentTrip && (driver.currentTrip.pickup || driver.currentTrip.drop) && (
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-blue-600" />
                Trip Information
              </h3>
              <div className="space-y-4">
                {driver.currentTrip?.pickup && (
                  <div className="border-l-4 border-green-500 pl-4 py-2">
                    <p className="text-xs font-semibold text-green-600 mb-1">📍 PICKUP LOCATION</p>
                    <p className="text-sm font-medium text-gray-900">{driver.currentTrip.pickup.address || pickupAddress || 'Loading...'}</p>
                    <p className="text-xs text-gray-500 mt-1">Lat: {driver.currentTrip.pickup.latitude?.toFixed(4)}, Lng: {driver.currentTrip.pickup.longitude?.toFixed(4)}</p>
                  </div>
                )}

                {hasLocation && (
                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="text-xs font-semibold text-blue-600 mb-1">🔴 LIVE LOCATION</p>
                    <p className="text-sm font-medium text-gray-900">{address || 'Loading...'}</p>
                    <p className="text-xs text-gray-500 mt-1">Lat: {driver.location?.latitude?.toFixed(4)}, Lng: {driver.location?.longitude?.toFixed(4)}</p>
                  </div>
                )}

                {driver.currentTrip?.drop && (
                  <div className="border-l-4 border-red-500 pl-4 py-2">
                    <p className="text-xs font-semibold text-red-600 mb-1">📍 DROP LOCATION</p>
                    <p className="text-sm font-medium text-gray-900">{driver.currentTrip.drop.address || dropAddress || 'Loading...'}</p>
                    <p className="text-xs text-gray-500 mt-1">Lat: {driver.currentTrip.drop.latitude?.toFixed(4)}, Lng: {driver.currentTrip.drop.longitude?.toFixed(4)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Current Location Info */}
          <div className="bg-gray-50 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-blue-600" />
              Current Location
            </h3>
            <div className="space-y-3">
              {hasLocation ? (
                <>
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-sm font-medium text-gray-900">{address || 'Loading address...'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Last Updated</p>
                      <p className="text-sm font-medium text-gray-900">{lastUpdated}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500">Location data not available</div>
              )}
            </div>
          </div>

          {/* Ride Info */}
          <div className="bg-gray-50 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaCar size={16} className="text-blue-600" />
              Ride Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Ride Type</span>
                <span className="text-sm font-medium text-gray-900">{driver.rideType || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Available Seats</span>
                <span className="text-sm font-medium text-gray-900">{driver.availableSeats}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Live Tracking Component
export default function LiveTracking() {
  const { admin } = useAuth();

  useEffect(() => {
    if (admin && admin.role !== 'SuperAdmin' && !admin.permissions?.includes('TRACKING_READ')) {
        Swal.fire({
          icon: 'error',
          title: 'Access Denied',
          text: 'You do not have permission to access Live Tracking.',
          confirmButtonColor: '#3B82F6'
        });
    }
  }, [admin]);

  if (admin && admin.role !== 'SuperAdmin' && !admin.permissions?.includes('TRACKING_READ')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 shadow-sm max-w-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to view live driver tracking.</p>
        </div>
      </div>
    );
  }
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [rideTypeFilter, setRideTypeFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [addresses, setAddresses] = useState({});
  const [pickupAddresses, setPickupAddresses] = useState({});
  const [dropAddresses, setDropAddresses] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [socketConnected, setSocketConnected] = useState(false);
  const [liveUpdateCount, setLiveUpdateCount] = useState(0); // Testing Counter
  const socketRef = useRef(null);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await trackingService.getLiveTracking();
      setDrivers(res?.drivers || []);

      const newAddresses = {};
      const newPickupAddresses = {};
      const newDropAddresses = {};

      for (const driver of (res?.drivers || [])) {
        if (driver.location?.latitude && driver.location?.longitude) {
          const address = await getAddressFromCoordinates(
            driver.location.latitude,
            driver.location.longitude
          );
          newAddresses[driver.driverId] = address;
        }

        if (driver.currentTrip?.pickup?.latitude && driver.currentTrip?.pickup?.longitude) {
          const pickupAddr = await getAddressFromCoordinates(
            driver.currentTrip.pickup.latitude,
            driver.currentTrip.pickup.longitude
          );
          newPickupAddresses[driver.driverId] = pickupAddr;
        }

        if (driver.currentTrip?.drop?.latitude && driver.currentTrip?.drop?.longitude) {
          const dropAddr = await getAddressFromCoordinates(
            driver.currentTrip.drop.latitude,
            driver.currentTrip.drop.longitude
          );
          newDropAddresses[driver.driverId] = dropAddr;
        }
      }

      setAddresses(newAddresses);
      setPickupAddresses(newPickupAddresses);
      setDropAddresses(newDropAddresses);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load drivers' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchDrivers();

    // Socket.io connection
    const socket = io(import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000', {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      // Join as admin
      socket.emit('join_room', { userId: 'admin_panel', role: 'admin' });
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

      // Real-time driver location update
    socket.on('driver_location_update', (data) => {
      const { driverId, latitude, longitude, heading, status } = data;
      
      // Increment Test Counter
      setLiveUpdateCount(prev => prev + 1);

      setDrivers(prev => {
        const driverExists = prev.some(d => d.driverId === driverId);
        
        if (driverExists) {
          return prev.map(d => {
            if (d.driverId === driverId) {
              return {
                ...d,
                location: { 
                    ...d.location, 
                    latitude, 
                    longitude, 
                    lastUpdated: new Date().toISOString() 
                },
                ...(status && { status }),
                heading: heading || d.heading || 0
              };
            }
            return d;
          });
        } else {
          // NEW DRIVER SPOTTED! Add them to the list
          return [...prev, {
            driverId,
            name: `Driver ${driverId.substring(0, 5)}...`, // Placeholder until full data fetch
            status: status || 'Online',
            location: { latitude, longitude, lastUpdated: new Date().toISOString() },
            heading: heading || 0,
            carInfo: { carNumber: 'Loading...', carModel: 'Loading...' }
          }];
        }
      });

      // NOTE: Removed immediate address geocoding on every second
      // for all drivers to keep it smooth and save API costs.
    });

    // Full drivers list update from server
    socket.on('live_tracking_update', async (data) => {
      if (data?.drivers) {
        setDrivers(data.drivers);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDrivers();
    setRefreshing(false);
  };

  const stats = useMemo(() => {
    const total = drivers.length;
    const idle = drivers.filter(d => d.status?.toLowerCase() === 'idle').length;
    const onRide = drivers.filter(d => d.status?.toLowerCase().includes('ride')).length;
    const offline = drivers.filter(d => d.status?.toLowerCase() === 'offline').length;

    return { total, idle, onRide, offline };
  }, [drivers]);

  const rideTypes = useMemo(() => {
    const typesMap = new Map();
    drivers.forEach(d => {
      let rideType = d.rideType;
      if (!rideType && d.currentTrip?.type) {
        rideType = d.currentTrip.type;
      }
      if (rideType && rideType !== 'N/A') {
        if (!typesMap.has(rideType)) {
          typesMap.set(rideType, 0);
        }
        typesMap.set(rideType, typesMap.get(rideType) + 1);
      }
    });
    return Array.from(typesMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [drivers]);

  const categories = useMemo(() => {
    const catsMap = new Map();
    drivers.forEach(d => {
      const catName = d.carInfo?.carCategoryName;
      if (catName && catName !== 'N/A') {
        if (!catsMap.has(catName)) {
          catsMap.set(catName, 0);
        }
        catsMap.set(catName, catsMap.get(catName) + 1);
      }
    });
    return Array.from(catsMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [drivers]);

  const filteredDrivers = useMemo(() => {
    let filtered = [...drivers];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => {
        if (statusFilter === 'idle') return d.status?.toLowerCase() === 'idle';
        if (statusFilter === 'online') return d.status?.toLowerCase() !== 'offline';
        if (statusFilter === 'ongoing') return d.status?.toLowerCase().includes('ride');
        if (statusFilter === 'offline') return d.status?.toLowerCase() === 'offline';
        return true;
      });
    }

    if (rideTypeFilter !== 'all') {
      filtered = filtered.filter(d => {
        let rideType = d.rideType;
        if (!rideType && d.currentTrip?.type) {
          rideType = d.currentTrip.type;
        }
        return rideType === rideTypeFilter;
      });
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(d => {
        const catName = d.carInfo?.carCategoryName;
        return catName === categoryFilter;
      });
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(d =>
        d.name?.toLowerCase().includes(q) ||
        d.phone?.toLowerCase().includes(q) ||
        d.driverId?.toLowerCase().includes(q) ||
        d.carInfo?.carNumber?.toLowerCase().includes(q) ||
        d.carInfo?.carModel?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [drivers, statusFilter, categoryFilter, rideTypeFilter, search]);

  const paginatedDrivers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredDrivers.slice(startIndex, endIndex);
  }, [filteredDrivers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaMap className="text-blue-600" /> Driver Live Tracking
            <div className="flex items-center gap-2 ml-4 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Updates: {liveUpdateCount}
            </div>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Real-time driver movements across the region</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
            <div className={`w-2.5 h-2.5 rounded-full ${socketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-xs font-semibold text-gray-600">
              {socketConnected ? 'Real-time Connected' : 'Connecting Engine...'}
            </span>
          </div>
          <button
            onClick={handleRefresh}
            className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium text-sm shadow-sm ${refreshing ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <FaSyncAlt className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Syncing...' : 'Full Refresh'}
          </button>
        </div>
      </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Drivers" value={stats.total} icon={FaCar} color="#3B82F6" />
          <StatCard label="Idle" value={stats.idle} icon={FaCheckCircle} color="#10B981" />
          <StatCard label="On Ride" value={stats.onRide} icon={FaMapPin} color="#F59E0B" />
          <StatCard label="Offline" value={stats.offline} icon={FaCircle} color="#EF4444" />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Map View</h2>
          {loading ? (
            <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
                <p className="mt-3 text-gray-500">Loading map...</p>
              </div>
            </div>
          ) : (
            <GoogleMap drivers={filteredDrivers} selectedDriver={selectedDriver} onDriverSelect={setSelectedDriver} />
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Status Filter</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="idle">Idle</option>
                  <option value="online">Online</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Car Category Filter</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                >
                  <option value="all">All Categories</option>
                  {categories.map(([cat, count]) => (
                    <option key={cat} value={cat}>
                      {cat} ({count})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Ride Type Filter</label>
                <select
                  value={rideTypeFilter}
                  onChange={(e) => setRideTypeFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                >
                  <option value="all">All Ride Types</option>
                  {rideTypes.map(([type, count]) => (
                    <option key={type} value={type}>
                      {type} ({count})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Search by name, phone, car number, or model..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Drivers List ({filteredDrivers.length})</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Items per page:</span>
              <div className="flex gap-2">
                {[20, 40, 60, 80, 100].map(num => (
                  <button
                    key={num}
                    onClick={() => handleItemsPerPageChange(num)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${itemsPerPage === num
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {loading ? (
            <div className="py-12 text-center">
              <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
              <p className="mt-3 text-gray-500">Loading drivers...</p>
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-xl border border-gray-200">
              <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">No drivers found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {paginatedDrivers.map(driver => (
                  <DriverCard
                    key={driver.driverId}
                    driver={driver}
                    onSelect={() => setSelectedDriver(driver)}
                    address={addresses[driver.driverId]}
                  />
                ))}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredDrivers.length)} of {filteredDrivers.length} drivers
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all ${currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      <DriverDetailModal
        driver={selectedDriver}
        isOpen={!!selectedDriver}
        onClose={() => setSelectedDriver(null)}
        address={selectedDriver ? addresses[selectedDriver.driverId] : null}
        pickupAddress={selectedDriver ? pickupAddresses[selectedDriver.driverId] : null}
        dropAddress={selectedDriver ? dropAddresses[selectedDriver.driverId] : null}
      />
    </div>
  );
}
