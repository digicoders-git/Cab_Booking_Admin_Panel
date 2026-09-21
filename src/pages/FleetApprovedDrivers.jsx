import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { getAllFleetDrivers } from "../apis/fleetDriver";
import { FaUserTie, FaSearch, FaSyncAlt, FaCheckCircle, FaCar } from "react-icons/fa";
import Swal from "sweetalert2";

export default function FleetApprovedDrivers() {
  const { themeColors, theme } = useTheme();
  const { currentFont } = useFont();

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const borderColor = theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
  const textColorSecondary = theme === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(107, 114, 128, 1)";

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await getAllFleetDrivers();
      const allDrivers = res?.data || res?.drivers || [];
      
      // Filter ONLY approved drivers
      const approvedDrivers = allDrivers.filter(d => d.isApproved === true);
      setDrivers(approvedDrivers);
    } catch (e) {
      console.error(e);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to fetch drivers", background: themeColors.surface, color: themeColors.text });
    } finally {
      setLoading(false);
    }
  };

  const filteredDrivers = useMemo(() => drivers.filter(d =>
    d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.fleetId?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.licenseNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  ), [drivers, searchQuery]);

  const paginatedData = useMemo(() => filteredDrivers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [filteredDrivers, currentPage]);
  const totalPages = Math.ceil(filteredDrivers.length / rowsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 pb-12" style={{ fontFamily: currentFont }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-8 pb-6 px-4 sm:px-8 shadow-sm">
        <div className="max-w-[1700px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FaUserTie className="text-blue-600" />
                Fleet Approved Drivers
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Drivers that have been registered by a Fleet and approved by Admin.
              </p>
            </div>
            <button onClick={fetchDrivers} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md">
              <FaSyncAlt className={loading ? 'animate-spin' : ''} size={14} />
              <span className="text-sm font-medium">Refresh Data</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1700px] mx-auto px-4 sm:px-8 mt-6 space-y-4">
        
        {/* Stats Row */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <FaCheckCircle size={24} />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Approved</p>
                    <p className="text-2xl font-black text-gray-900">{drivers.length} Drivers</p>
                </div>
            </div>

            <div className="relative w-full max-w-md">
                <FaSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search by name, phone, fleet..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-blue-500/20"
                style={{ backgroundColor: themeColors.background, borderColor, color: themeColors.text }} />
            </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
                <table className="w-full min-w-[900px]">
                <thead>
                    <tr className="border-b" style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderColor }}>
                    {["Driver Name", "Contact Details", "License", "Fleet / Company", "Status"].map(th => (
                        <th key={th} className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-left text-gray-500">{th}</th>
                    ))}
                    </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: borderColor + "40" }}>
                    {paginatedData.map(d => (
                    <tr key={d._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                                    {d.image ? (
                                        <img src={`${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '')}/uploads/${d.image}`} alt={d.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <FaUserTie size={16} className="text-blue-500" />
                                    )}
                                </div>
                                <span className="text-sm font-bold text-gray-900">{d.name}</span>
                            </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                            <p className="text-sm font-medium text-gray-900">{d.phone}</p>
                            <p className="text-xs text-gray-500">{d.email || "—"}</p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium border border-gray-200">{d.licenseNumber || 'N/A'}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-purple-50 text-purple-600 rounded">
                                    <FaCar size={12} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{d.fleetId?.companyName || "Unknown Fleet"}</p>
                                    <p className="text-[10px] text-gray-500">{d.fleetId?.name || "—"}</p>
                                </div>
                            </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 uppercase tracking-tight">
                                Approved
                            </span>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
                
                {paginatedData.length === 0 && !loading && (
                    <div className="py-20 text-center">
                        <FaUserTie size={40} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-base font-bold text-gray-600">No Approved Drivers</p>
                        <p className="text-sm text-gray-400 mt-1">There are no approved fleet drivers right now.</p>
                    </div>
                )}
                {loading && (
                    <div className="py-20 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-4">Loading drivers...</p>
                    </div>
                )}
            </div>
            
            {/* Pagination */}
            {!loading && drivers.length > 0 && (
                <div className="px-5 py-4 flex items-center justify-between border-t border-gray-200 bg-gray-50">
                    <p className="text-xs font-medium text-gray-500">
                        Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredDrivers.length)} of {filteredDrivers.length}
                    </p>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                            className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium hover:bg-white disabled:opacity-50">
                            Prev
                        </button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}
                            className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium hover:bg-white disabled:opacity-50">
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
