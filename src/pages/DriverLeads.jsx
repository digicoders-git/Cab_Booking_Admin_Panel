import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FaPhone, FaEnvelope, FaUser, FaClock, FaSearch } from "react-icons/fa";

export default function DriverLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Assuming API Base URL from .env or default
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/driver-leads`);
      if (res.data.success) {
        setLeads(res.data.leads);
      }
    } catch (error) {
      console.error("Failed to fetch driver leads:", error);
      toast.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter((lead) =>
    (lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (lead.mobile?.includes(searchQuery) || false) ||
    (lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  );

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Driver Leads</h1>
          <p className="text-sm text-gray-500">
            Drivers who started registration but didn't finish.
          </p>
        </div>
        <div className="flex gap-4 items-center w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
            />
          </div>
          <button
            onClick={fetchLeads}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg shadow-sm hover:bg-blue-700 transition whitespace-nowrap"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <FaSearch className="text-4xl mb-3 text-gray-200" />
            <p>No leads found matching your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Mobile</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead._id}
                    className="border-b border-gray-50 hover:bg-blue-50/20 transition group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-700">
                          {lead.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaPhone className="text-gray-400 text-xs" />
                        {lead.mobile}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaEnvelope className="text-gray-400 text-xs" />
                        {lead.email || "N/A"}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        {lead.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <FaClock className="text-gray-400 text-xs" />
                        {new Date(lead.createdAt).toLocaleDateString()}{" "}
                        {new Date(lead.createdAt).toLocaleTimeString()}
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
  );
}
