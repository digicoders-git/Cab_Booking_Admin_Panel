import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Car, User, Phone, CheckCircle2, AlertCircle, Loader2, Sparkles, 
  Clock, MapPin, Shield, Check, RefreshCw, AlertTriangle
} from 'lucide-react';
import Swal from 'sweetalert2';
import { assignDriverToBulk } from '../apis/bulkBooking';
import { getAllDrivers } from '../apis/driver';

export default function AssignBulkDriversModal({ isOpen, onClose, booking, onAssignmentSuccess }) {
  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterByCategory, setFilterByCategory] = useState(true);

  // Helper to determine if a driver matches a slot's car category
  const doesDriverMatchSlotCategory = (driver, slot) => {
    if (!slot) return true;
    const targetCatId = slot.categoryId ? String(slot.categoryId).trim() : '';
    const targetCatName = slot.categoryName ? slot.categoryName.trim().toLowerCase() : '';

    const carTypeObj = driver.carDetails?.carType || driver.carType;
    let driverCatId = '';
    let driverCatName = '';

    if (carTypeObj) {
      if (typeof carTypeObj === 'object') {
        driverCatId = carTypeObj._id ? String(carTypeObj._id).trim() : '';
        driverCatName = carTypeObj.name ? carTypeObj.name.trim().toLowerCase() : '';
      } else {
        driverCatId = String(carTypeObj).trim();
      }
    }

    // 1. Direct Category ID match
    if (targetCatId && driverCatId && targetCatId === driverCatId) {
      return true;
    }

    // 2. Direct Category Name match (e.g. "Auto" === "Auto", "Scorpeo" === "Scorpeo")
    if (targetCatName && driverCatName && targetCatName === driverCatName) {
      return true;
    }

    // 3. Match by vehicleType (e.g. driver.carDetails.vehicleType === 'Auto')
    const vehicleType = driver.carDetails?.vehicleType ? driver.carDetails.vehicleType.trim().toLowerCase() : '';
    if (targetCatName && vehicleType && targetCatName === vehicleType) {
      return true;
    }

    // 4. Match by carModel or carBrand
    const carModel = driver.carDetails?.carModel ? driver.carDetails.carModel.trim().toLowerCase() : '';
    const carBrand = driver.carDetails?.carBrand ? driver.carDetails.carBrand.trim().toLowerCase() : '';
    if (targetCatName && (carModel.includes(targetCatName) || carBrand.includes(targetCatName))) {
      return true;
    }

    return false;
  };

  const getDriverCategoryLabel = (driver) => {
    const carTypeObj = driver.carDetails?.carType || driver.carType;
    if (carTypeObj && typeof carTypeObj === 'object' && carTypeObj.name) {
      return carTypeObj.name;
    }
    return driver.carDetails?.vehicleType || '';
  };

  // Each slot: { slotIndex, categoryId, categoryName, driverId, carId, status, driverName, driverPhone, carNumber }
  const [slotAssignments, setSlotAssignments] = useState([]);

  // 1. Expand carsRequired into individual slots (e.g. 2 Sedans + 3 SUVs = 5 slots)
  const expandedSlots = useMemo(() => {
    if (!booking?.carsRequired) return [];
    const list = [];
    let idx = 0;
    booking.carsRequired.forEach(req => {
      const qty = req.quantity || 1;
      const catName = req.category?.name || 'Standard Cab';
      const catId = req.category?._id || req.category;
      for (let i = 0; i < qty; i++) {
        list.push({
          slotIndex: idx,
          slotNumber: idx + 1,
          categoryId: catId,
          categoryName: catName
        });
        idx++;
      }
    });
    return list;
  }, [booking]);

  // 2. Fetch all approved drivers on open
  useEffect(() => {
    if (isOpen) {
      loadDrivers();
    }
  }, [isOpen]);

  const loadDrivers = async () => {
    setLoadingDrivers(true);
    try {
      const res = await getAllDrivers();
      const raw = res.drivers || res.data || [];
      // Filter approved and active drivers
      const approved = raw.filter(d => d.isApproved !== false && d.status !== 'Rejected');
      setDrivers(approved);
    } catch (err) {
      console.error('Error fetching drivers:', err);
    } finally {
      setLoadingDrivers(false);
    }
  };

  // 3. Initialize slot assignments from booking.assignedDrivers
  useEffect(() => {
    if (isOpen && booking && expandedSlots.length > 0) {
      const existing = booking.assignedDrivers || [];
      const initial = expandedSlots.map((slot, index) => {
        const assigned = existing[index];
        if (assigned && (assigned.driver?._id || assigned.driver)) {
          const dId = assigned.driver?._id || assigned.driver;
          const dDoc = typeof assigned.driver === 'object' ? assigned.driver : null;
          return {
            slotIndex: index,
            categoryId: slot.categoryId,
            categoryName: slot.categoryName,
            driverId: dId?.toString(),
            carId: assigned.car?._id || assigned.car || null,
            status: assigned.status || 'Pending',
            driverName: dDoc?.name || 'Assigned Driver',
            driverPhone: dDoc?.phone || '',
            carNumber: dDoc?.carDetails?.carNumber || assigned.car?.carNumber || ''
          };
        }
        return {
          slotIndex: index,
          categoryId: slot.categoryId,
          categoryName: slot.categoryName,
          driverId: '',
          carId: null,
          status: 'Unassigned',
          driverName: '',
          driverPhone: '',
          carNumber: ''
        };
      });
      setSlotAssignments(initial);
    }
  }, [isOpen, booking, expandedSlots]);

  // Handle assigning a driver to a specific slot
  const handleSelectDriver = (slotIndex, driverId) => {
    setSlotAssignments(prev => {
      const updated = [...prev];
      if (!driverId) {
        // Clear slot
        updated[slotIndex] = {
          ...updated[slotIndex],
          driverId: '',
          driverName: '',
          driverPhone: '',
          carNumber: '',
          status: 'Unassigned'
        };
        return updated;
      }

      const selectedDriver = drivers.find(d => d._id?.toString() === driverId.toString());
      if (selectedDriver) {
        updated[slotIndex] = {
          ...updated[slotIndex],
          driverId: selectedDriver._id,
          driverName: selectedDriver.name,
          driverPhone: selectedDriver.phone,
          carNumber: selectedDriver.carDetails?.carNumber || 'Assigned Car',
          status: 'Pending'
        };
      }
      return updated;
    });
  };

  // Summary counts
  const totalSlots = expandedSlots.length;
  const assignedSlotsCount = slotAssignments.filter(s => s.driverId).length;

  // Save handler
  const handleSaveAssignments = async () => {
    // Collect active assignments
    const payloadAssignments = slotAssignments
      .filter(s => s.driverId)
      .map(s => ({
        driverId: s.driverId,
        carId: s.carId || null,
        categoryId: s.categoryId || null
      }));

    if (payloadAssignments.length === 0) {
      return Swal.fire('No Driver Assigned', 'Please assign at least one driver to proceed.', 'warning');
    }

    setSubmitting(true);
    try {
      const res = await assignDriverToBulk(booking._id, { assignments: payloadAssignments });
      if (res.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Drivers Assigned Successfully! 🚕',
          html: `
            <div style="font-size: 13px; text-align: center;">
              <p><strong>${payloadAssignments.length} of ${totalSlots}</strong> vehicles assigned.</p>
              <p style="color: #10B981; font-weight: bold; margin-top: 6px;">
                Drivers have been notified and this booking is now visible in their Scheduled Jobs panel!
              </p>
            </div>
          `,
          confirmButtonColor: '#2563EB'
        });

        if (onAssignmentSuccess) onAssignmentSuccess(res.assignedDrivers);
        onClose();
      } else {
        throw new Error(res.message || 'Failed to update assignments');
      }
    } catch (err) {
      console.error('Assignment Error:', err);
      Swal.fire('Assignment Failed', err.message || 'Could not assign drivers.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-8 border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Car size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Assign Drivers to Bulk Booking</h2>
                <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                  #{booking._id?.slice(-8)}
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Assign 1 driver per vehicle requirement ({totalSlots} total cars)
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

        {/* Booking Summary Banner */}
        <div className="bg-slate-50 border-b border-gray-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-gray-700">
              <MapPin size={13} className="text-green-600 shrink-0" />
              <span className="truncate max-w-xs font-semibold">{booking.pickup?.address}</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-gray-700">
              <MapPin size={13} className="text-red-600 shrink-0" />
              <span className="truncate max-w-xs font-semibold">{booking.drop?.address}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-gray-400 block text-[10px] uppercase font-semibold">Pickup Time</span>
              <span className="font-bold text-gray-900">
                {new Date(booking.pickupDateTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>

            <div className="bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 text-blue-900 shadow-2xs">
              <span className="text-blue-500 block text-[10px] uppercase font-semibold">Assigned Progress</span>
              <span className="font-black text-sm text-blue-700">
                {assignedSlotsCount} / {totalSlots} Cars
              </span>
            </div>
          </div>
        </div>

        {/* Slots Content Area */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-gray-100">
            <div>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={14} className="text-blue-600" />
                Vehicle Slots & Driver Allocation
              </h3>
              <p className="text-[11px] text-gray-500">
                Drivers filtered by car category for each slot
              </p>
            </div>
            
            {/* Global Category Filter Toggle */}
            <label className="inline-flex items-center gap-2 cursor-pointer bg-blue-50/70 hover:bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors select-none">
              <input 
                type="checkbox"
                checked={filterByCategory}
                onChange={(e) => setFilterByCategory(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-[11px] font-bold text-blue-900">
                Category Filter (Active)
              </span>
            </label>
          </div>

          {loadingDrivers ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-500 gap-2">
              <Loader2 className="animate-spin text-blue-600" size={24} />
              <span className="text-xs">Loading approved drivers...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {expandedSlots.map((slot, index) => {
                const currentAssignment = slotAssignments[index] || {};
                const isAssigned = !!currentAssignment.driverId;
                const isOngoingOrDone = currentAssignment.status === 'Ongoing' || currentAssignment.status === 'Completed';

                // Category matching
                const matchingDrivers = drivers.filter(d => doesDriverMatchSlotCategory(d, slot));
                const shouldFilter = filterByCategory;
                
                // Available list for this slot
                let availableDriversForSlot = (shouldFilter && matchingDrivers.length > 0)
                  ? matchingDrivers
                  : drivers;

                // Make sure currently assigned driver is always in the list even if not matching
                if (currentAssignment.driverId && !availableDriversForSlot.some(d => d._id?.toString() === currentAssignment.driverId.toString())) {
                  const assignedDoc = drivers.find(d => d._id?.toString() === currentAssignment.driverId.toString());
                  if (assignedDoc) {
                    availableDriversForSlot = [assignedDoc, ...availableDriversForSlot];
                  }
                }

                return (
                  <div 
                    key={slot.slotNumber}
                    className={`p-4 rounded-xl border transition-all ${
                      isAssigned 
                        ? 'border-blue-200 bg-blue-50/40 shadow-xs' 
                        : 'border-dashed border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      
                      {/* Slot Label & Required Category */}
                      <div className="flex items-center gap-3 min-w-[180px]">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isAssigned ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          #{slot.slotNumber}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">
                            Car Slot #{slot.slotNumber}
                          </p>
                          <span className="inline-block mt-0.5 text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {slot.categoryName}
                          </span>
                        </div>
                      </div>

                      {/* Driver Selection Controls */}
                      <div className="flex-1 flex items-center gap-3">
                        {isOngoingOrDone ? (
                          // Locked if already in progress
                          <div className="flex-1 bg-gray-100 px-3 py-2 rounded-xl text-xs flex items-center justify-between">
                            <div>
                              <p className="font-bold text-gray-800">{currentAssignment.driverName}</p>
                              <p className="text-[10px] text-gray-500">{currentAssignment.driverPhone} • {currentAssignment.carNumber}</p>
                            </div>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700">
                              {currentAssignment.status}
                            </span>
                          </div>
                        ) : (
                          // Dropdown selector
                          <div className="flex-1 relative">
                            <select
                              value={currentAssignment.driverId || ''}
                              onChange={(e) => handleSelectDriver(index, e.target.value)}
                              className={`w-full bg-white border rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${
                                shouldFilter && matchingDrivers.length > 0 ? 'border-blue-300' : 'border-gray-300'
                              }`}
                            >
                              <option value="">
                                {shouldFilter && matchingDrivers.length > 0 
                                  ? `-- Select ${slot.categoryName} Driver (${matchingDrivers.length} Available) --`
                                  : matchingDrivers.length === 0 && shouldFilter
                                    ? `-- 0 Drivers in ${slot.categoryName} (Showing All) --`
                                    : `-- Select Approved Driver (${availableDriversForSlot.length}) --`}
                              </option>
                              {availableDriversForSlot.map(d => {
                                const dId = d._id?.toString();
                                // Check if assigned in another slot
                                const alreadyInOtherSlot = slotAssignments.some(
                                  (s, sIdx) => sIdx !== index && s.driverId?.toString() === dId
                                );
                                const driverCat = getDriverCategoryLabel(d);

                                return (
                                  <option 
                                    key={dId} 
                                    value={dId}
                                    disabled={alreadyInOtherSlot}
                                  >
                                    {d.name} ({d.phone}) {d.carDetails?.carNumber ? `• [${d.carDetails.carNumber}]` : ''} {driverCat ? `• [${driverCat}]` : ''} {alreadyInOtherSlot ? '• (In Another Slot)' : ''}
                                  </option>
                                );
                              })}
                            </select>

                            {/* Subtext info for category matching */}
                            <div className="flex items-center justify-between mt-1 px-1">
                              {shouldFilter && matchingDrivers.length > 0 ? (
                                <span className="text-[10px] text-blue-700 font-medium">
                                  Showing {matchingDrivers.length} verified {slot.categoryName} driver(s)
                                </span>
                              ) : matchingDrivers.length === 0 && shouldFilter ? (
                                <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                                  <AlertCircle size={10} />
                                  No driver registered for "{slot.categoryName}". Showing all available.
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-500">
                                  Showing all {availableDriversForSlot.length} drivers
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Clear Button if Assigned and not Ongoing */}
                        {isAssigned && !isOngoingOrDone && (
                          <button
                            type="button"
                            onClick={() => handleSelectDriver(index, '')}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Remove Driver"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>

                    </div>

                    {/* Assigned Driver Details Tag */}
                    {isAssigned && !isOngoingOrDone && (
                      <div className="mt-2.5 pt-2 border-t border-blue-100 flex items-center justify-between text-[11px] text-blue-900">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          Ready for dispatch: <strong>{currentAssignment.driverName}</strong> ({currentAssignment.driverPhone})
                        </span>
                        <span className="text-gray-500 font-mono">
                          Vehicle: {currentAssignment.carNumber || 'Driver Vehicle'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Info Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Tip:</strong> Aap chahein toh abhi available drivers ko assign kar sakte hain aur baki gaadiyon ko baad me assign kar sakte hain. Save karne par assigned drivers ke Driver Panel me trip turant dikhne lagegi!
            </span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 p-4 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveAssignments}
            disabled={submitting || assignedSlotsCount === 0}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Dispatching Assignments...
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Save & Dispatch Assignments ({assignedSlotsCount}/{totalSlots})
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
