import React, { useState, useEffect, useMemo } from "react";
import { 
    getContactMessagesAPI, 
    createContactMessageAPI, 
    deleteContactMessageAPI 
} from "../apis/admin";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { 
    Mail, 
    User, 
    MessageSquare, 
    Trash2, 
    Plus, 
    Search, 
    RotateCcw, 
    Clock, 
    Send, 
    X, 
    Inbox 
} from "lucide-react";

const ManageContactMessages = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal state for creating a new message
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        message: ""
    });

    // Modal state for viewing a full message
    const [viewMessage, setViewMessage] = useState(null);

    // 1. Fetch all messages (GET API)
    const fetchMessages = async () => {
        setLoading(true);
        try {
            const res = await getContactMessagesAPI();
            if (res.success) {
                setMessages(res.data || []);
            } else {
                toast.error(res.message || "Failed to fetch contact messages");
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
            toast.error("Failed to connect to server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    // 2. Submit new message (POST API)
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
            return toast.error("Please fill in all fields (Name, Email, Message)");
        }

        setSubmitting(true);
        try {
            const res = await createContactMessageAPI(formData);
            if (res.success) {
                toast.success(res.message || "Message created successfully!");
                setFormData({ name: "", email: "", message: "" });
                setIsModalOpen(false);
                fetchMessages(); // Refresh list
            } else {
                toast.error(res.message || "Failed to create message");
            }
        } catch (error) {
            console.error("Error creating message:", error);
            toast.error("Error submitting message");
        } finally {
            setSubmitting(false);
        }
    };

    // 3. Delete message (DELETE API)
    const handleDelete = async (id, name) => {
        const result = await Swal.fire({
            title: "Delete Message?",
            text: `Are you sure you want to delete message from "${name}"?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, Delete",
            cancelButtonText: "Cancel"
        });

        if (result.isConfirmed) {
            try {
                const res = await deleteContactMessageAPI(id);
                if (res.success) {
                    toast.success("Message deleted successfully");
                    setMessages(prev => prev.filter(m => m._id !== id));
                } else {
                    toast.error(res.message || "Failed to delete message");
                }
            } catch (error) {
                console.error("Error deleting message:", error);
                toast.error("Failed to delete message");
            }
        }
    };

    // Filter messages by search query
    const filteredMessages = useMemo(() => {
        if (!searchQuery.trim()) return messages;
        const q = searchQuery.toLowerCase().trim();
        return messages.filter(m => 
            (m.name && m.name.toLowerCase().includes(q)) ||
            (m.email && m.email.toLowerCase().includes(q)) ||
            (m.message && m.message.toLowerCase().includes(q))
        );
    }, [messages, searchQuery]);

    // Format date helper
    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="text-blue-600" /> Contact Messages & Inquiries
                    </h1>
                    <p className="text-gray-500 mt-1">
                        View, add, and manage customer inquiries and messages submitted via the contact form.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchMessages}
                        disabled={loading}
                        className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                        title="Refresh List"
                    >
                        <RotateCcw size={16} className={loading ? "animate-spin" : ""} /> Refresh
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Plus size={18} /> Add New Message
                    </button>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-blue-500">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Inbox size={18} />
                        </div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Messages</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-emerald-500">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <Clock size={18} />
                        </div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filtered Results</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{filteredMessages.length}</p>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-purple-500">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                            <Mail size={18} />
                        </div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">API Status</h3>
                    </div>
                    <p className="text-sm font-semibold text-purple-700 mt-1">Public (No Auth Required)</p>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Search Bar Toolbar */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-gray-900">
                        All Inquiries ({filteredMessages.length})
                    </h3>
                    <div className="relative min-w-[260px]">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, email, message..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-100/75 text-gray-700 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-3.5">Date & Time</th>
                                <th className="px-6 py-3.5">Sender Name</th>
                                <th className="px-6 py-3.5">Email</th>
                                <th className="px-6 py-3.5">Message</th>
                                <th className="px-6 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <RotateCcw className="animate-spin text-blue-600" size={24} />
                                            <span>Loading contact messages...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredMessages.length > 0 ? (
                                filteredMessages.map((msg) => (
                                    <tr key={msg._id} className="hover:bg-blue-50/40 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{formatDate(msg.createdAt)}</div>
                                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                <Clock size={11} /> {formatTime(msg.createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                                                    {msg.name ? msg.name.charAt(0) : "U"}
                                                </div>
                                                <span>{msg.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                                            <a 
                                                href={`mailto:${msg.email}`} 
                                                className="text-blue-600 hover:underline flex items-center gap-1.5"
                                            >
                                                <Mail size={14} className="text-gray-400" />
                                                {msg.email}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 max-w-md">
                                            <p 
                                                onClick={() => setViewMessage(msg)}
                                                className="truncate text-gray-700 cursor-pointer hover:text-blue-600 transition-colors"
                                                title="Click to view full message"
                                            >
                                                {msg.message}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <button
                                                onClick={() => handleDelete(msg._id, msg.name)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Message"
                                            >
                                                <Trash2 size={17} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Inbox size={32} className="text-gray-300" />
                                            <p className="font-medium text-gray-700">No contact messages found.</p>
                                            <p className="text-xs text-gray-400">Click "Add New Message" to create one.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL: Add New Contact Message (POST API) --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Plus className="text-blue-600" size={20} /> Add New Message
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. John Doe"
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="e.g. john@example.com"
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Message <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows="4"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="Write the inquiry or contact message here..."
                                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>
                                            <RotateCcw className="animate-spin" size={16} /> Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={16} /> Send Message
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL: View Full Message Details --- */}
            {viewMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <MessageSquare className="text-blue-600" size={18} /> Message Details
                            </h3>
                            <button
                                onClick={() => setViewMessage(null)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Sender</span>
                                <p className="text-base font-bold text-gray-900 mt-0.5">{viewMessage.name}</p>
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Email</span>
                                <p className="text-sm text-blue-600 mt-0.5">{viewMessage.email}</p>
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Date & Time</span>
                                <p className="text-sm text-gray-600 mt-0.5">
                                    {formatDate(viewMessage.createdAt)} at {formatTime(viewMessage.createdAt)}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Full Message</span>
                                <div className="mt-1.5 p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                    {viewMessage.message}
                                </div>
                            </div>
                            <div className="flex justify-end pt-3">
                                <button
                                    onClick={() => setViewMessage(null)}
                                    className="px-5 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageContactMessages;
