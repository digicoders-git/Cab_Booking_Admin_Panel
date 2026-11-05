import React, { useState, useEffect, useMemo } from "react";
import { createTestAPI, getTestsAPI, deleteTestAPI } from "../apis/testApi";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { 
    FlaskConical, 
    CheckCircle2, 
    Trash2, 
    Plus, 
    Search, 
    RotateCcw, 
    Clock, 
    Send, 
    KeyRound, 
    User, 
    Eye, 
    EyeOff,
    Server,
    Database,
    ShieldCheck
} from "lucide-react";

const ManageTest = () => {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showPasswords, setShowPasswords] = useState({});

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        password: ""
    });
    const [showFormPassword, setShowFormPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [serverStatus, setServerStatus] = useState("Checking...");

    // 1. Fetch all tests (GET API)
    const fetchTests = async () => {
        setLoading(true);
        try {
            const res = await getTestsAPI();
            if (res.success) {
                setTests(res.data || []);
                setServerStatus("Online & Connected");
            } else {
                setServerStatus("Offline / Error");
                toast.error(res.message || "Failed to fetch test records");
            }
        } catch (error) {
            console.error("Error fetching tests:", error);
            setServerStatus("Server Error");
            toast.error("Failed to connect to backend server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTests();
    }, []);

    // 2. Submit new test record (POST API)
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.password.trim()) {
            return toast.error("Please enter both Name and Password");
        }

        setSubmitting(true);
        try {
            const res = await createTestAPI({
                name: formData.name.trim(),
                password: formData.password
            });

            if (res.success) {
                toast.success(res.message || "Test record saved successfully!");
                setFormData({ name: "", password: "" });
                // Prepend or refresh
                if (res.data) {
                    setTests(prev => [res.data, ...prev]);
                } else {
                    fetchTests();
                }
            } else {
                toast.error(res.message || "Failed to save test record");
            }
        } catch (error) {
            console.error("Error creating test:", error);
            toast.error(error.response?.data?.message || "Server error while saving test record");
        } finally {
            setSubmitting(false);
        }
    };

    // 3. Delete test record (DELETE API)
    const handleDelete = async (id, name) => {
        const result = await Swal.fire({
            title: "Delete Test Record?",
            text: `Are you sure you want to delete "${name}"?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, delete it!"
        });

        if (result.isConfirmed) {
            try {
                const res = await deleteTestAPI(id);
                if (res.success) {
                    setTests(prev => prev.filter(item => item._id !== id));
                    toast.success("Test record deleted successfully");
                } else {
                    toast.error(res.message || "Failed to delete record");
                }
            } catch (error) {
                console.error("Delete error:", error);
                toast.error("Server error while deleting");
            }
        }
    };

    // Filter by search query
    const filteredTests = useMemo(() => {
        if (!searchQuery.trim()) return tests;
        const q = searchQuery.toLowerCase();
        return tests.filter(item => 
            (item.name && item.name.toLowerCase().includes(q)) ||
            (item.password && item.password.toLowerCase().includes(q))
        );
    }, [tests, searchQuery]);

    const togglePasswordVisibility = (id) => {
        setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="p-6 min-h-screen bg-gray-50 flex flex-col gap-6">
            {/* Top Bar Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <FlaskConical className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            Live Server & DB Test
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Model: Test
                            </span>
                        </h1>
                        <p className="text-sm text-gray-500">
                            Test live server connectivity and MongoDB read/write operations (Name & Password APIs).
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                        <span className={`w-2.5 h-2.5 rounded-full ${serverStatus.includes("Online") ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
                        <span>Status: {serverStatus}</span>
                    </div>

                    <button
                        onClick={fetchTests}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition"
                    >
                        <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        <span>Refresh (GET API)</span>
                    </button>
                </div>
            </div>

            {/* Main Grid: Form on Left/Top + Table on Right/Bottom */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Card: Input Form (POST API) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-gray-100">
                            <Send className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-bold text-gray-800">Add Test Record (POST)</h2>
                        </div>
                        <p className="text-xs text-gray-500 mb-5">
                            Enter a test name and password. This will send a POST request to <code className="bg-gray-100 px-1 py-0.5 rounded text-blue-600">/api/test</code> and save it in MongoDB.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Enter test name..."
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type={showFormPassword ? "text" : "password"}
                                        placeholder="Enter test password..."
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-9 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowFormPassword(prev => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm shadow-sm transition disabled:opacity-50"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Saving to MongoDB...</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                        <span>Submit & Test POST API</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Quick Info Box */}
                    <div className="mt-6 p-4 bg-blue-50/60 rounded-xl border border-blue-100/80">
                        <div className="flex items-center gap-2 text-blue-800 text-xs font-semibold mb-1">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Isolation Note</span>
                        </div>
                        <p className="text-xs text-blue-700/90 leading-relaxed">
                            This model and API are completely isolated. No drivers, users, or live trip calculations are affected.
                        </p>
                    </div>
                </div>

                {/* Right Card: Table / List (GET API) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 mb-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <Database className="w-5 h-5 text-emerald-600" />
                            <h2 className="text-lg font-bold text-gray-800">
                                Saved Test Records ({filteredTests.length})
                            </h2>
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search records..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                            />
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="flex-1 overflow-x-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-xs">Fetching test records from database...</p>
                            </div>
                        ) : filteredTests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                                <FlaskConical className="w-12 h-12 text-gray-300 stroke-1" />
                                <p className="text-sm font-medium text-gray-600">No test records found</p>
                                <p className="text-xs text-gray-400">Use the form on the left to add your first test record.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-gray-400 font-medium">
                                        <th className="py-3 px-3">#</th>
                                        <th className="py-3 px-3">Name</th>
                                        <th className="py-3 px-3">Password</th>
                                        <th className="py-3 px-3">Created At</th>
                                        <th className="py-3 px-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-gray-700">
                                    {filteredTests.map((item, index) => (
                                        <tr key={item._id || index} className="hover:bg-gray-50/80 transition">
                                            <td className="py-3 px-3 font-semibold text-gray-400">{index + 1}</td>
                                            <td className="py-3 px-3 font-medium text-gray-900">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                                                        {item.name ? item.name.charAt(0).toUpperCase() : "T"}
                                                    </div>
                                                    <span>{item.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 font-mono">
                                                <div className="flex items-center gap-1.5">
                                                    <span>
                                                        {showPasswords[item._id] ? item.password : "••••••••"}
                                                    </span>
                                                    <button
                                                        onClick={() => togglePasswordVisibility(item._id)}
                                                        className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
                                                        title={showPasswords[item._id] ? "Hide Password" : "Show Password"}
                                                    >
                                                        {showPasswords[item._id] ? (
                                                            <EyeOff className="w-3.5 h-3.5" />
                                                        ) : (
                                                            <Eye className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 text-gray-500 whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-gray-400" />
                                                    <span>
                                                        {item.createdAt 
                                                            ? new Date(item.createdAt).toLocaleString("en-IN", {
                                                                dateStyle: "medium",
                                                                timeStyle: "short"
                                                            }) 
                                                            : "N/A"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 text-right">
                                                <button
                                                    onClick={() => handleDelete(item._id, item.name)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                    title="Delete Record"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageTest;

