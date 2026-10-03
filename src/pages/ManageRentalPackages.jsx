import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Shield, Circle, Activity, X } from "lucide-react";
import { Toaster, toast } from "sonner";
import Swal from "sweetalert2";
import {
  createRentalPackage,
  updateRentalPackage,
  getRentalPackagesAdmin,
  toggleRentalPackageStatus,
  deleteRentalPackage
} from "../apis/rentalPackage";
import { getAllCarCategories } from "../apis/carCategory";
import axios from "axios";

const ManageRentalPackages = () => {
  const [data, setData] = useState([]);
  const [carCategories, setCarCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "", hours: "", baseDistance: "", basePrice: "", extraKmPrice: "", extraMinutePrice: "", carCategory: ""
  });

  const [rentalSettings, setRentalSettings] = useState({
    rentalRequestTimeoutMinutes: 5,
    driverRentalPopupTimerSeconds: 15,
    rentalCommissionPercentage: 10
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchData = async () => {
    try {
      const res = await getRentalPackagesAdmin();
      if (res.success) setData(res.packages || []);
      const catRes = await getAllCarCategories();
      if (catRes.success) setCarCategories(catRes.categories || []);
    } catch (err) {
      toast.error("Failed to fetch data");
    }
  };

  const fetchSettings = async () => {
    try {
      const resp = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/settings`);
      if (resp.data.success && resp.data.settings) {
        setRentalSettings({
          rentalRequestTimeoutMinutes: resp.data.settings.rentalRequestTimeoutMinutes ?? 5,
          driverRentalPopupTimerSeconds: resp.data.settings.driverRentalPopupTimerSeconds ?? 15,
          rentalCommissionPercentage: resp.data.settings.rentalCommissionPercentage ?? 10
        });
      }
    } catch (err) {
      console.error("Fetch Settings Error:", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const token = localStorage.getItem("admin-token");
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/settings/toggle-share-ride`, rentalSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Rental settings updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await toggleRentalPackageStatus(id);
      if (res.success) {
        toast.success("Status updated");
        fetchData();
      }
    } catch (err) {
      toast.error("Error updating status");
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?", text: "This package will be deleted forever!", icon: "warning",
      showCancelButton: true, confirmButtonText: "Yes, Delete", cancelButtonText: "Cancel"
    });
    if (result.isConfirmed) {
      try {
        const res = await deleteRentalPackage(id);
        if (res.success) {
          toast.success("Package deleted");
          fetchData();
        }
      } catch (err) {
        toast.error("Failed to delete package");
      }
    }
  };

  const handleEdit = (pkg) => {
    setEditingId(pkg._id);
    setFormData({
      name: pkg.name,
      hours: pkg.hours,
      baseDistance: pkg.baseDistance,
      basePrice: pkg.basePrice,
      extraKmPrice: pkg.extraKmPrice,
      extraMinutePrice: pkg.extraMinutePrice,
      carCategory: pkg.carCategory?._id || pkg.carCategory
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (editingId) {
        res = await updateRentalPackage(editingId, formData);
      } else {
        res = await createRentalPackage(formData);
      }
      
      if (res.success) {
        toast.success(editingId ? "Package updated!" : "Rental package created!");
        setShowModal(false);
        setEditingId(null);
        setFormData({ name: "", hours: "", baseDistance: "", basePrice: "", extraKmPrice: "", extraMinutePrice: "", carCategory: "" });
        fetchData();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Error saving package");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rental Packages</h1>
          <p className="text-gray-500">Manage time and distance based rental plans</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={20} /> Create Package
        </button>
      </div>

      {/* Configuration Card */}
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-300/40 rounded-2xl p-6 mb-8 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-blue-200/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 text-xl">
              ⚙️
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Rental App Configuration</h3>
              <p className="text-xs text-gray-600 mt-0.5">Control rental booking request timeout and driver popup duration</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-5 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              Request Auto-Cancel (Minutes)
            </label>
            <input
              type="number"
              min="1"
              value={rentalSettings.rentalRequestTimeoutMinutes}
              onChange={(e) => setRentalSettings(prev => ({ ...prev, rentalRequestTimeoutMinutes: Number(e.target.value) }))}
              className="w-full bg-white border border-gray-300 text-gray-800 p-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 5"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              Driver Popup Timer (Seconds)
            </label>
            <input
              type="number"
              min="5"
              value={rentalSettings.driverRentalPopupTimerSeconds}
              onChange={(e) => setRentalSettings(prev => ({ ...prev, driverRentalPopupTimerSeconds: Number(e.target.value) }))}
              className="w-full bg-white border border-gray-300 text-gray-800 p-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 15"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              Admin Commission (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={rentalSettings.rentalCommissionPercentage}
              onChange={(e) => setRentalSettings(prev => ({ ...prev, rentalCommissionPercentage: Number(e.target.value) }))}
              className="w-full bg-white border border-gray-300 text-gray-800 p-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 10"
            />
          </div>

          <div className="md:col-span-3 sm:col-span-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="w-full sm:w-auto px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-xl text-sm shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {savingSettings ? 'Saving...' : 'Save Configurations'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm border-b">
              <th className="p-4">Package Name</th>
              <th className="p-4">Duration & Dist.</th>
              <th className="p-4">Car Category</th>
              <th className="p-4">Pricing</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((pkg) => (
              <tr key={pkg._id} className="border-b hover:bg-gray-50 text-sm">
                <td className="p-4 font-semibold text-gray-800">{pkg.name}</td>
                <td className="p-4 text-gray-600">{pkg.hours} Hrs | {pkg.baseDistance} KMs</td>
                <td className="p-4 text-gray-600">{pkg.carCategory?.name}</td>
                <td className="p-4 text-gray-600">Base: ₹{pkg.basePrice}<br/>Extra: ₹{pkg.extraKmPrice}/KM, ₹{pkg.extraMinutePrice}/Min</td>
                <td className="p-4">
                  <button onClick={() => handleToggle(pkg._id)} className={`px-3 py-1 rounded-full text-xs font-medium ${pkg.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {pkg.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="p-4 text-center space-x-2">
                  <button onClick={() => handleEdit(pkg)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(pkg._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan="6" className="text-center p-8 text-gray-500">No rental packages found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden transform transition-all">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">{editingId ? "Edit Rental Package" : "Create Rental Package"}</h2>
              <button onClick={() => { setShowModal(false); setEditingId(null); setFormData({ name: "", hours: "", baseDistance: "", basePrice: "", extraKmPrice: "", extraMinutePrice: "", carCategory: "" }); }} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Package Name</label>
                  <input type="text" required placeholder="e.g. 2 Hrs - 20 KMs" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Hours</label>
                  <input type="number" required placeholder="e.g. 2" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" value={formData.hours} onChange={(e) => setFormData({...formData, hours: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Base Distance (KMs)</label>
                  <input type="number" required placeholder="e.g. 20" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" value={formData.baseDistance} onChange={(e) => setFormData({...formData, baseDistance: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Base Price (₹)</label>
                  <input type="number" required placeholder="e.g. 500" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" value={formData.basePrice} onChange={(e) => setFormData({...formData, basePrice: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Car Category</label>
                  <select required className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm bg-white" value={formData.carCategory} onChange={(e) => setFormData({...formData, carCategory: e.target.value})}>
                    <option value="">Select Category</option>
                    {carCategories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Extra Per KM (₹)</label>
                  <input type="number" required placeholder="e.g. 15" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" value={formData.extraKmPrice} onChange={(e) => setFormData({...formData, extraKmPrice: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Extra Per Min (₹)</label>
                  <input type="number" required placeholder="e.g. 2" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" value={formData.extraMinutePrice} onChange={(e) => setFormData({...formData, extraMinutePrice: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); setFormData({ name: "", hours: "", baseDistance: "", basePrice: "", extraKmPrice: "", extraMinutePrice: "", carCategory: "" }); }} className="px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors text-sm">Cancel</button>
                <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors shadow-sm shadow-blue-200 text-sm">{loading ? "Saving..." : (editingId ? "Update Package" : "Create Package")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRentalPackages;
