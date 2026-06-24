import React, { useState, useEffect } from "react";
import { getAllAgentLeadsAdmin, cancelAgentLead } from "../apis/agentLead";
import Swal from "sweetalert2";
import { FaSyncAlt, FaBriefcase, FaTimesCircle, FaCheckCircle, FaUserTie, FaCar } from "react-icons/fa";

export default function ManageAgentLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setFetching(true);
      const res = await getAllAgentLeadsAdmin();
      if (res.success) {
        setLeads(res.leads || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  const handleCancelLead = async (leadId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will cancel the lead and refund any escrow.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, cancel it!'
    });

    if (result.isConfirmed) {
      try {
        const res = await cancelAgentLead(leadId);
        if (res.success) {
          Swal.fire('Cancelled!', 'The lead has been cancelled.', 'success');
          fetchLeads();
        } else {
          Swal.fire('Error!', res.message || 'Failed to cancel', 'error');
        }
      } catch (err) {
        Swal.fire('Error!', 'Server error', 'error');
      }
    }
  };

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === "marketplace") return { color: "#3B82F6", bg: "rgba(59, 130, 246, 0.1)" };
    if (s === "accepted") return { color: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)" };
    if (s === "completed") return { color: "#10B981", bg: "rgba(16, 185, 129, 0.1)" };
    if (s === "cancelled") return { color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)" };
    return { color: "#6B7280", bg: "rgba(107, 114, 128, 0.1)" };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mt-8 z-50">
        <div className="px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base sm:text-2xl font-bold text-gray-900">Agent Leads Marketplace</h1>
              <p className="text-sm text-gray-500">Monitor all agent leads and commissions</p>
            </div>
            <button
              onClick={fetchLeads}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FaSyncAlt size={18} className={fetching ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading leads...</div>
            ) : (
              <table className="w-full min-w-max">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">ID / Date</th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Agent</th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Route</th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Pricing</th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Driver Assigned</th>
                    <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leads.map((lead) => (
                    <tr key={lead._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <span className="text-xs font-mono text-blue-600 font-bold">#{lead._id?.slice(-8).toUpperCase()}</span>
                        <div className="text-[10px] text-gray-500 font-medium mt-1">
                          {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <FaUserTie className="text-blue-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{lead.createdByAgent?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{lead.createdByAgent?.companyName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 min-w-[200px]">
                        <p className="text-xs text-green-600 truncate mb-1">Pick: {lead.pickup?.address}</p>
                        <p className="text-xs text-red-600 truncate">Drop: {lead.drop?.address}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="mb-1">
                           <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                             {lead.carCategory?.name || 'Any Car'}
                           </span>
                        </div>
                        <p className="text-sm font-bold text-gray-900">Total: ₹{lead.totalPrice}</p>
                        <p className="text-xs font-medium text-purple-600">Comm: ₹{lead.agentCommission}</p>
                        <p className="text-[10px] text-gray-500">Driver Earns: ₹{lead.driverEarning}</p>
                      </td>
                      <td className="py-4 px-6">
                        {lead.assignedDriver ? (
                          <div className="flex items-center gap-2">
                            <FaCar className="text-green-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{lead.assignedDriver.name}</p>
                              <p className="text-xs text-gray-500">{lead.assignedDriver.phone}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No Driver Yet</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            color: getStatusStyle(lead.status).color,
                            backgroundColor: getStatusStyle(lead.status).bg
                          }}
                        >
                          {lead.status}
                        </span>
                        <p className="text-[9px] text-gray-500 mt-1 uppercase">Pay: {lead.paymentStatus}</p>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {['Marketplace', 'Accepted'].includes(lead.status) && (
                          <button
                            onClick={() => handleCancelLead(lead._id)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            title="Cancel Lead"
                          >
                            <FaTimesCircle size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && !loading && (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-500">
                        No agent leads found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
