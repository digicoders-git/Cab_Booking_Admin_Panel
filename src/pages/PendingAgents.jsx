import React, { useState, useEffect } from "react";
import { getPendingAgents, approveAgent, rejectAgent } from "../apis/agent";
import Swal from "sweetalert2";
import { CheckCircle, XCircle, RefreshCw, FileText, UserPlus, MapPin, Building, CreditCard, ChevronRight } from "lucide-react";

export default function PendingAgents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const IMAGE_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') + '/uploads/';

  useEffect(() => {
    fetchPendingAgents();
  }, []);

  const fetchPendingAgents = async () => {
    setLoading(true);
    try {
      const res = await getPendingAgents();
      setAgents(res.agents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (agent) => {
    const { value: formValues } = await Swal.fire({
      title: '<h2 class="text-2xl font-bold text-gray-800">Approve Agent</h2>',
      html: `
        <div class="text-left space-y-5 mt-4">
          <div class="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                ${agent.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p class="font-bold text-gray-900 leading-tight">${agent.name}</p>
                <p class="text-sm text-blue-600 font-medium">${agent.email}</p>
              </div>
            </div>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Commission Percentage (%)</label>
              <div class="relative">
                <input id="swal-input1" type="number" class="w-full pl-4 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-800 font-medium" value="${agent.commissionPercentage || 10}">
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Bulk Commission Percentage (%)</label>
              <div class="relative">
                <input id="swal-input2" type="number" class="w-full pl-4 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-800 font-medium" value="${agent.bulkCommissionPercentage || 5}">
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
              </div>
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Confirm & Approve',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors border-none shadow-sm',
        cancelButton: 'bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-medium transition-colors border-none',
        popup: 'rounded-2xl shadow-xl border border-gray-100'
      },
      buttonsStyling: false,
      preConfirm: () => {
        return {
          commissionPercentage: document.getElementById('swal-input1').value,
          bulkCommissionPercentage: document.getElementById('swal-input2').value
        }
      }
    });

    if (formValues) {
      try {
        await approveAgent(agent._id, {
          commissionPercentage: Number(formValues.commissionPercentage),
          bulkCommissionPercentage: Number(formValues.bulkCommissionPercentage)
        });
        Swal.fire({
          title: 'Approved!',
          text: 'The agent has been successfully approved.',
          icon: 'success',
          customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2 rounded-xl' },
          buttonsStyling: false
        });
        fetchPendingAgents();
      } catch (err) {
        Swal.fire('Error', 'Failed to approve agent.', 'error');
      }
    }
  };

  const handleReject = async (agent) => {
    const res = await Swal.fire({
      title: "Reject Agent?",
      text: "Are you sure you want to completely remove this agent's application?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Reject",
      cancelButtonText: "Cancel",
      customClass: {
        confirmButton: 'bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors ml-2 shadow-sm',
        cancelButton: 'bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-medium transition-colors',
        popup: 'rounded-2xl shadow-xl'
      },
      buttonsStyling: false
    });

    if (res.isConfirmed) {
      try {
        await rejectAgent(agent._id);
        Swal.fire({
          title: "Rejected!",
          text: "Agent application has been removed.",
          icon: "success",
          customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2 rounded-xl' },
          buttonsStyling: false
        });
        fetchPendingAgents();
      } catch (err) {
        Swal.fire("Error", "Failed to reject agent.", "error");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 pt-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600">
                <UserPlus size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pending Agents</h1>
                <p className="text-sm text-gray-500 mt-0.5">Review and manage new agent applications</p>
              </div>
            </div>
          </div>
          <button onClick={fetchPendingAgents} className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 flex items-center gap-2 font-medium transition-all shadow-sm">
            <RefreshCw size={18} className={loading ? 'animate-spin text-blue-600' : 'text-blue-600'} />
            Refresh List
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-400">
              <RefreshCw size={40} className="animate-spin text-blue-500 mb-4 opacity-50" />
              <p className="font-medium text-gray-500">Loading agent applications...</p>
            </div>
          ) : agents.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={48} className="text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">All Caught Up!</h3>
              <p className="text-gray-500 max-w-sm mx-auto">There are no pending agent applications to review at this time.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="py-5 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wider">Agent Details</th>
                    <th className="py-5 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wider">Bank Info</th>
                    <th className="py-5 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wider">Documents</th>
                    <th className="py-5 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wider text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {agents.map(a => (
                    <tr key={a._id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="py-5 px-6 align-top">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 flex items-center justify-center font-bold text-lg shadow-sm border border-white">
                            {a.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm mb-0.5 group-hover:text-blue-700 transition-colors">{a.name}</p>
                            <p className="text-sm text-gray-500 mb-1">{a.email}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md"><MapPin size={12} className="text-gray-400" /> {a.city}, {a.state}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6 align-top">
                        <div className="space-y-1.5">
                          <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                            <Building size={14} className="text-gray-400" /> {a.bankDetails?.bankName || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1.5">
                            <CreditCard size={14} className="text-gray-400" /> {a.bankDetails?.accountNumber || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="py-5 px-6 align-top">
                        <div className="flex flex-col gap-2">
                          {a.documents?.aadhar && (
                            <a href={`${IMAGE_BASE_URL}${a.documents.aadhar}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors w-max">
                              <FileText size={14}/> View Aadhar
                            </a>
                          )}
                          {a.documents?.pan && (
                            <a href={`${IMAGE_BASE_URL}${a.documents.pan}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-semibold transition-colors w-max">
                              <FileText size={14}/> View PAN
                            </a>
                          )}
                          {!a.documents?.aadhar && !a.documents?.pan && (
                            <span className="text-xs text-gray-400 italic">No docs uploaded</span>
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-6 align-top">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <button onClick={() => handleApprove(a)} className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-500 hover:text-white border border-green-200 hover:border-green-500 rounded-xl text-sm font-semibold transition-all shadow-sm">
                            <CheckCircle size={16} /> Approve
                          </button>
                          <button onClick={() => handleReject(a)} className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl text-sm font-semibold transition-all shadow-sm">
                            <XCircle size={16} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
