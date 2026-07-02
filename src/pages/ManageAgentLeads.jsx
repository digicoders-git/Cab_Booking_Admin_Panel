import React, { useState, useEffect } from "react";
import { getAllAgentLeadsAdmin, cancelAgentLead, adminAcceptAgentLead, adminCompleteAgentLead } from "../apis/agentLead";
import Swal from "sweetalert2";
import { FaSyncAlt, FaBriefcase, FaTimesCircle, FaCheckCircle, FaUserTie, FaCar, FaHandshake } from "react-icons/fa";
import { useAuth } from '../context/AuthContext';

export default function ManageAgentLeads() {
  const { admin } = useAuth();
  const [activeTab, setActiveTab] = useState('Marketplace');
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

  const handleAcceptLead = async (leadId) => {
    const result = await Swal.fire({
      title: 'Accept Agent Lead?',
      text: "You will accept this lead directly (Admin Bypass) without paying upfront commission.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Accept it!'
    });

    if (result.isConfirmed) {
      try {
        const res = await adminAcceptAgentLead(leadId);
        if (res.success) {
          Swal.fire('Accepted!', 'Lead accepted successfully via Admin Bypass.', 'success');
          fetchLeads();
        } else {
          Swal.fire('Error!', res.message || 'Failed to accept lead', 'error');
        }
      } catch (err) {
        Swal.fire('Error!', 'Server error', 'error');
      }
    }
  };

  const handleCompleteLead = async (leadId) => {
    const result = await Swal.fire({
      title: 'Complete Agent Lead?',
      text: "Mark this lead as completed. The agent's commission will be deducted from your wallet and paid to the agent.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Complete it!'
    });

    if (result.isConfirmed) {
      try {
        const res = await adminCompleteAgentLead(leadId);
        if (res.success) {
          Swal.fire('Completed!', 'Lead completed and commission settled.', 'success');
          fetchLeads();
        } else {
          Swal.fire('Error!', res.message || 'Failed to complete lead', 'error');
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

  const filteredLeads = leads.filter(lead => {
    if (activeTab === 'Marketplace') return lead.status === 'Marketplace';
    if (activeTab === 'Accepted') return lead.status === 'Accepted';
    if (activeTab === 'My Accepted') return lead.status === 'Accepted' && lead.assignedAdmin;
    if (activeTab === 'History') return lead.status === 'Completed' || lead.status === 'Cancelled';
    return true;
  });

  const tabs = ['Marketplace', 'Accepted', 'My Accepted', 'History'];

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

        {/* TABS */}
        <div className="px-4 sm:px-8 mt-4">
          <div className="flex space-x-1 border-b border-gray-200">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === tab 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
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
                  {filteredLeads.map((lead) => (
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
                        ) : lead.assignedAdmin ? (
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Admin</span>
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
                        <div className="flex items-center justify-center gap-2">
                          {lead.status === 'Marketplace' && (
                            <button
                              onClick={() => handleAcceptLead(lead._id)}
                              className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                              title="Accept Lead (Bypass)"
                            >
                              <FaHandshake size={18} />
                            </button>
                          )}
                          {lead.status === 'Accepted' && lead.assignedAdmin && (
                            <button
                              onClick={() => handleCompleteLead(lead._id)}
                              className="text-green-500 hover:bg-green-50 p-2 rounded-lg transition-colors"
                              title="Complete Lead"
                            >
                              <FaCheckCircle size={18} />
                            </button>
                          )}
                          {['Marketplace', 'Accepted'].includes(lead.status) && (
                            <button
                              onClick={() => handleCancelLead(lead._id)}
                              className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                              title="Cancel Lead"
                            >
                              <FaTimesCircle size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredLeads.length === 0 && !loading && (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-500">
                        No leads found in this tab.
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
