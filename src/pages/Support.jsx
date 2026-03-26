import React, { useState, useEffect, useMemo } from 'react';
import { supportService } from '../apis/supportApi';
import {
  FaTicketAlt, FaPlus, FaEye, FaReply, FaCheckCircle,
  FaClock, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import {
  MessageSquare, CheckCircle, Clock, AlertCircle,
  Search, X, User, Calendar, Activity, Send
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import Swal from 'sweetalert2';

// Stat Card Component
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

// Admin Reply Modal
const AdminReplyModal = ({ ticket, isOpen, onClose, onSubmit, loading }) => {
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState(ticket?.status || 'Open');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reply) {
      Swal.fire({ icon: 'warning', title: 'Required', text: 'Please enter a reply' });
      return;
    }
    await onSubmit(ticket._id, reply, status);
    setReply('');
    setStatus('Open');
  };

  if (!isOpen || !ticket) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-2xl rounded-2xl shadow-2xl bg-white border border-gray-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FaReply className="text-white" size={14} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Admin Reply</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Ticket Details</h3>
            <p className="text-sm text-gray-600"><span className="font-medium">Subject:</span> {ticket.subject}</p>
            <p className="text-sm text-gray-600 mt-1"><span className="font-medium">From:</span> {ticket.sender?.name} ({ticket.senderModel})</p>
            <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Message:</span> {ticket.message}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Open">Open</option>
              <option value="In-Progress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reply Message</label>
            <textarea
              rows="5"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              placeholder="Enter your reply here..."
              required
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2">
              <Send size={14} /> {loading ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Ticket Detail Modal
const TicketDetailModal = ({ ticket, isOpen, onClose, onReplyClick }) => {
  if (!isOpen || !ticket) return null;

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'closed': return { label: 'Closed', color: '#10B981', bg: '#10B98115' };
      case 'in-progress': return { label: 'In Progress', color: '#3B82F6', bg: '#3B82F615' };
      case 'open': return { label: 'Open', color: '#F59E0B', bg: '#F59E0B15' };
      default: return { label: status || 'Open', color: '#F59E0B', bg: '#F59E0B15' };
    }
  };

  const status = getStatusBadge(ticket.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl bg-white border border-gray-200" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FaTicketAlt className="text-white" size={14} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{ticket.subject}</h2>
              <p className="text-xs text-gray-500 mt-0.5">ID: {ticket._id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-all">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: status.bg, color: status.color }}>
              {status.label}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              <Calendar size={12} /> {new Date(ticket.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="bg-gray-50 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <User size={16} className="text-blue-600" />
              <h3 className="font-semibold text-gray-900">Sender Info</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-medium">Name:</span> {ticket.sender?.name}</p>
              <p><span className="font-medium">Email:</span> {ticket.sender?.email}</p>
              <p><span className="font-medium">Phone:</span> {ticket.sender?.phone}</p>
              <p><span className="font-medium">Type:</span> {ticket.senderModel}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={16} className="text-blue-600" />
              <h3 className="font-semibold text-gray-900">Message</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">{ticket.message}</p>
          </div>

          {ticket.reply && (
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <FaReply size={14} className="text-blue-600" />
                <h3 className="font-semibold text-gray-900">Admin Reply</h3>
                <span className="text-xs text-gray-500 ml-auto">
                  {new Date(ticket.repliedAt || ticket.updatedAt).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed">{ticket.reply}</p>
            </div>
          )}

          {ticket.status?.toLowerCase() !== 'closed' && (
            <button
              onClick={() => onReplyClick(ticket)}
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <FaReply size={14} /> Send Reply
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Support Component
export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewTicket, setViewTicket] = useState(null);
  const [replyTicket, setReplyTicket] = useState(null);
  const [replying, setReplying] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await supportService.getAllTickets();
      const ticketsData = res?.requests || res?.tickets || res?.allRequests || [];
      setTickets(ticketsData);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err?.response?.data?.message || 'Failed to load tickets' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleAdminReply = async (ticketId, reply, status) => {
    setReplying(true);
    try {
      const res = await supportService.replyTicket(ticketId, reply, status);
      if (res.success) {
        Swal.fire({ icon: 'success', title: 'Success', text: 'Reply sent successfully!' });
        setReplyTicket(null);
        setViewTicket(null);
        fetchTickets();
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err?.response?.data?.message || 'Failed to send reply' });
    } finally {
      setReplying(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status?.toLowerCase() === 'open').length;
    const inProgress = tickets.filter(t => t.status?.toLowerCase() === 'in-progress').length;
    const closed = tickets.filter(t => t.status?.toLowerCase() === 'closed').length;

    return { total, open, inProgress, closed };
  }, [tickets]);

  // Chart Data - Tickets by Type
  const typeChartData = useMemo(() => {
    const types = {};
    tickets.forEach(t => {
      types[t.senderModel] = (types[t.senderModel] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [tickets]);

  // Chart Data - Daily Tickets (Last 7 days)
  const dailyChartData = useMemo(() => {
    const days = {};
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days[dateStr] = 0;
    }

    tickets.forEach(t => {
      const dateStr = new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (days[dateStr] !== undefined) {
        days[dateStr]++;
      }
    });

    return Object.entries(days).map(([date, count]) => ({ date, count }));
  }, [tickets]);

  // Filter tickets
  const filteredTickets = useMemo(() => {
    let filtered = [...tickets];
    if (filter !== 'all') {
      filtered = filtered.filter(t => t.status?.toLowerCase() === filter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(t =>
        t.subject?.toLowerCase().includes(q) ||
        t.message?.toLowerCase().includes(q) ||
        t._id?.toLowerCase().includes(q) ||
        t.sender?.name?.toLowerCase().includes(q)
      );
    }
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [tickets, filter, search]);

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const displayedTickets = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'closed': return { label: 'Closed', color: '#10B981', bg: '#10B98115' };
      case 'in-progress': return { label: 'In Progress', color: '#3B82F6', bg: '#3B82F615' };
      case 'open': return { label: 'Open', color: '#F59E0B', bg: '#F59E0B15' };
      default: return { label: status || 'Open', color: '#F59E0B', bg: '#F59E0B15' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-8">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
            <FaTicketAlt className="text-blue-600" />
            Support Tickets
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage and respond to support tickets</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Tickets" value={stats.total} icon={FaTicketAlt} color="#3B82F6" />
          <StatCard label="Open" value={stats.open} icon={Clock} color="#F59E0B" />
          <StatCard label="In Progress" value={stats.inProgress} icon={Activity} color="#3B82F6" />
          <StatCard label="Closed" value={stats.closed} icon={CheckCircle} color="#10B981" />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Tickets by Type Bar Chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Tickets by Type</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={typeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Tickets Line Chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Last 7 Days</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
              {['all', 'open', 'in-progress', 'closed'].map((status) => (
                <button
                  key={status}
                  onClick={() => { setFilter(status); setCurrentPage(1); }}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === status ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search by subject, name, or ID..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">From</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Reply</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                      </div>
                      <p className="mt-3 text-gray-500">Loading tickets...</p>
                    </td>
                  </tr>
                ) : displayedTickets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No tickets found
                    </td>
                  </tr>
                ) : (
                  displayedTickets.map(ticket => {
                    const status = getStatusBadge(ticket.status);
                    return (
                      <tr key={ticket._id} className="hover:bg-gray-50 transition-all">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">{ticket.subject}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{ticket.sender?.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{ticket.senderModel}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: status.bg, color: status.color }}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm">
                          {ticket.reply ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              ✓ Replied
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setViewTicket(ticket)}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                              title="View Details"
                            >
                              <FaEye size={14} />
                            </button>
                            {ticket.status?.toLowerCase() !== 'closed' && (
                              <button
                                onClick={() => setReplyTicket(ticket)}
                                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all"
                                title="Send Reply"
                              >
                                <FaReply size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredTickets.length > 0 && (
            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
              <span className="text-sm text-gray-500">Showing {Math.min(filteredTickets.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredTickets.length, currentPage * itemsPerPage)} of {filteredTickets.length}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border hover:bg-white disabled:opacity-30">
                  <FaChevronLeft size={14} />
                </button>
                <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border hover:bg-white disabled:opacity-30">
                  <FaChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <TicketDetailModal ticket={viewTicket} isOpen={!!viewTicket} onClose={() => setViewTicket(null)} onReplyClick={setReplyTicket} />
      <AdminReplyModal ticket={replyTicket} isOpen={!!replyTicket} onClose={() => setReplyTicket(null)} onSubmit={handleAdminReply} loading={replying} />
    </div>
  );
}
