import React, { useState, useEffect } from 'react';
import http from '../apis/http';
import Swal from 'sweetalert2';
import { Target, Gift, Calendar, Plus, Trash2, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ManageIncentives = () => {
  const { admin } = useAuth();
  const hasPermission = (permission) => {
    if (admin?.role === "SuperAdmin") return true;
    return admin?.permissions?.includes(permission);
  };
  const [incentives, setIncentives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetType: 'All',
    targetCount: '',
    rewardAmount: '',
    startDate: '',
    endDate: ''
  });

  const fetchIncentives = async () => {
    try {
      setLoading(true);
      const res = await http.get('/api/incentives/admin');
      if (res.data.success) {
        setIncentives(res.data.incentives);
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to fetch incentives", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncentives();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await http.post('/api/incentives/admin', formData);
      if (res.data.success) {
        Swal.fire("Success", "Incentive created successfully!", "success");
        setShowForm(false);
        setFormData({ title: '', description: '', targetType: 'All', targetCount: '', rewardAmount: '', startDate: '', endDate: '' });
        fetchIncentives();
      }
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to create", "error");
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Incentive?",
      text: "Are you sure you want to delete this target?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33"
    });
    
    if (confirm.isConfirmed) {
      try {
        await http.delete(`/api/incentives/admin/${id}`);
        Swal.fire("Deleted!", "Incentive removed.", "success");
        fetchIncentives();
      } catch (err) {
        Swal.fire("Error", "Failed to delete", "error");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header and Sidebar removed as DashboardLayout handles them */}
      <div className="p-4 md:p-8 w-full">
        <div className="w-full space-y-6">
            
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Target className="text-indigo-600" /> Driver Targets & Incentives
                </h1>
                <p className="text-gray-500 text-sm mt-1">Create missions for drivers to earn extra rewards.</p>
              </div>
              {hasPermission('DRIVER_INCENTIVE_CREATE') && (
                <button 
                  onClick={() => setShowForm(!showForm)}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  {showForm ? 'Cancel' : <><Plus size={18} /> Create New Target</>}
                </button>
              )}
            </div>

            {/* Create Form Modal */}
            {showForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center border-b pb-3 mb-5">
                    <h2 className="text-lg font-bold text-gray-800">New Target Details</h2>
                    <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100">
                      ✕
                    </button>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Target Title</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Weekend Bonanza" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Description (Optional)</label>
                        <input type="text" name="description" value={formData.description} onChange={handleChange} placeholder="e.g. Complete 10 rides to get 500 Rs" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Booking Type</label>
                        <select name="targetType" value={formData.targetType} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                          <option value="All">All Types</option>
                          <option value="Normal">Normal Booking</option>
                          <option value="Fixed">Fixed Route</option>
                          <option value="Rental">Rental Booking</option>
                          <option value="Bulk">Bulk Booking</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Target (No. of Rides)</label>
                          <input type="number" name="targetCount" value={formData.targetCount} onChange={handleChange} required placeholder="e.g. 10" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Reward (₹)</label>
                          <input type="number" name="rewardAmount" value={formData.rewardAmount} onChange={handleChange} required placeholder="e.g. 500" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Start Date & Time</label>
                        <input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">End Date & Time</label>
                        <input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleChange} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-2 gap-3">
                      <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-all">
                        Cancel
                      </button>
                      <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-200 transition-all active:scale-95">
                        Save & Launch Target
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full py-12 text-center text-gray-400">Loading...</div>
              ) : incentives.length === 0 ? (
                <div className="col-span-full py-16 bg-white rounded-2xl border border-gray-100 border-dashed flex flex-col items-center justify-center">
                  <Target size={48} className="text-gray-300 mb-4" />
                  <h3 className="text-lg font-bold text-gray-700">No Active Targets</h3>
                  <p className="text-gray-500 mt-1">Create one to motivate your drivers!</p>
                </div>
              ) : (
                incentives.map(inc => {
                  const isExpired = new Date(inc.endDate) < new Date();
                  return (
                    <div key={inc._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                      <div className={`p-4 border-b ${isExpired ? 'bg-gray-50 border-gray-100' : 'bg-indigo-50 border-indigo-100'} flex justify-between items-start`}>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {isExpired ? <Clock size={16} className="text-gray-400" /> : <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>}
                            <h3 className={`font-bold text-lg ${isExpired ? 'text-gray-500' : 'text-indigo-900'}`}>{inc.title}</h3>
                          </div>
                          <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${isExpired ? 'bg-gray-200 text-gray-500' : 'bg-indigo-200 text-indigo-700'}`}>
                            {inc.targetType} Rides Only
                          </span>
                        </div>
                        {hasPermission('DRIVER_INCENTIVE_DELETE') && (
                          <button onClick={() => handleDelete(inc._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      
                      <div className="p-5 space-y-4">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Target</p>
                            <p className="text-2xl font-black text-gray-800">{inc.targetCount} <span className="text-sm font-bold text-gray-400">Rides</span></p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Reward</p>
                            <p className="text-2xl font-black text-emerald-600 flex items-center justify-end gap-1">
                              ₹{inc.rewardAmount}
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Calendar size={14} className="text-gray-400" />
                            <span className="font-medium">Starts:</span>
                            <span>{new Date(inc.startDate).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <CheckCircle size={14} className="text-gray-400" />
                            <span className="font-medium">Ends:</span>
                            <span className={isExpired ? 'text-red-500 font-bold' : ''}>{new Date(inc.endDate).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

        </div>
      </div>
    </div>
  );
};

export default ManageIncentives;
