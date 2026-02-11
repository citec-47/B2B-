import axios from "axios";
import React, { useEffect, useState } from "react";
import { server } from "../../server";
import { DataGrid } from "@material-ui/data-grid";
import { BsPencil } from "react-icons/bs";
import { RxCross1 } from "react-icons/rx";
import { 
  FiEye, 
  FiCheckCircle, 
  FiXCircle, 
  FiDollarSign,
  FiClock,
  FiAlertCircle,
  FiTrash2,
  FiCopy,
  FiSend,
  FiRefreshCw,
  FiBriefcase,
  FiGlobe,
  FiInfo,
  FiFilter,
  FiDownload,
  FiTrendingUp,
  FiUsers,
  FiCalendar,
  FiSearch,
  FiExternalLink
} from "react-icons/fi";
import { toast } from "react-toastify";
import Loader from "../Layout/Loader";

const AllWithdraw = () => {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [withdrawData, setWithdrawData] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [withdrawStatus, setWithdrawStatus] = useState("completed");
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    rejected: 0,
    totalAmount: 0,
    pendingAmount: 0
  });
  
  // Filters
  const [filters, setFilters] = useState({
    status: "all",
    sellerId: "all",
    search: "",
    startDate: "",
    endDate: ""
  });
  const [sellers, setSellers] = useState([]);

  useEffect(() => {
    fetchWithdraws();
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      const res = await axios.get(
        `${server}/shop/admin-all-sellers`,
        { withCredentials: true }
      );
      if (res.data.success) {
        setSellers(res.data.sellers || []);
      }
    } catch (error) {
      console.error("Error fetching sellers:", error);
    }
  };

  const fetchWithdraws = async () => {
    try {
      setFetchLoading(true);
      const res = await axios.get(
        `${server}/withdraw/get-all-withdraw-request`,
        {
          withCredentials: true,
          headers: {
            'Cache-Control': 'no-cache'
          }
        }
      );
      
      const withdraws = res.data.withdraws || [];
      setData(withdraws);
      
      // Calculate statistics
      const stats = {
        total: withdraws.length,
        pending: withdraws.filter(w => w.status === 'pending').length,
        completed: withdraws.filter(w => w.status === 'completed').length,
        rejected: withdraws.filter(w => w.status === 'rejected').length,
        totalAmount: withdraws.reduce((sum, w) => sum + (w.amount || 0), 0),
        pendingAmount: withdraws
          .filter(w => w.status === 'pending')
          .reduce((sum, w) => sum + (w.amount || 0), 0)
      };
      setStats(stats);
      
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      toast.error("Failed to load withdrawal requests");
      setData([]);
    } finally {
      setFetchLoading(false);
    }
  };

  const columns = [
    { 
      field: "id", 
      headerName: "ID", 
      minWidth: 100, 
      flex: 0.8,
      renderCell: (params) => (
        <span className="font-mono text-sm">
          {params.value?.substring(0, 8)}...
        </span>
      )
    },
    {
      field: "name",
      headerName: "Shop Name",
      minWidth: 180,
      flex: 1.4,
      renderCell: (params) => (
        <div className="font-medium text-gray-800">
          {params.value || "Unknown"}
        </div>
      )
    },
    {
      field: "shopId",
      headerName: "Shop ID",
      minWidth: 120,
      flex: 1,
      renderCell: (params) => (
        <span className="font-mono text-xs text-gray-600">
          {params.value?.substring(0, 10)}...
        </span>
      )
    },
    {
      field: "amount",
      headerName: "Amount",
      minWidth: 100,
      flex: 0.8,
      renderCell: (params) => (
        <div className="flex items-center gap-1">
          <FiDollarSign className="text-green-500" size={14} />
          <span className="font-bold text-green-600">${parseFloat(params.value).toFixed(2)}</span>
        </div>
      )
    },
    {
      field: "method",
      headerName: "Method",
      minWidth: 100,
      flex: 0.8,
      renderCell: (params) => {
        const method = params.value?.type || "unknown";
        return (
          <div className="flex items-center gap-1">
            {method === "bank" ? (
              <FiBriefcase className="text-blue-500" size={14} />
            ) : (
              <FiGlobe className="text-yellow-500" size={14} />
            )}
            <span className="text-sm">
              {method === "bank" ? "Bank" : "Binance"}
            </span>
          </div>
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 100,
      flex: 0.8,
      renderCell: (params) => {
        const status = params.value?.toLowerCase() || "pending";
        let bgColor = "bg-gray-100 text-gray-800";
        if (status === "completed") bgColor = "bg-green-100 text-green-800";
        if (status === "pending") bgColor = "bg-yellow-100 text-yellow-800";
        if (status === "rejected") bgColor = "bg-red-100 text-red-800";
        
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bgColor}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
    {
      field: "createdAt",
      headerName: "Request Date",
      minWidth: 120,
      flex: 1,
      renderCell: (params) => (
        <div className="text-sm text-gray-600">
          {new Date(params.value).toLocaleDateString()}
        </div>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 150,
      flex: 1.2,
      renderCell: (params) => {
        const row = params.row;
        const isPending = row.status === "pending";
        
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleViewDetails(row)}
              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
              title="View Details"
            >
              <FiEye size={16} />
            </button>
            
            {isPending && (
              <button
                onClick={() => handleProcessWithdraw(row)}
                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all"
                title="Process Request"
              >
                <BsPencil size={16} />
              </button>
            )}
            
            <button
              onClick={() => handleDeleteWithdraw(row)}
              disabled={actionLoading === row.id}
              className={`p-2 rounded-lg transition-all ${
                actionLoading === row.id 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                  : "bg-red-50 text-red-600 hover:bg-red-100"
              }`}
              title="Delete Request"
            >
              {actionLoading === row.id ? (
                <FiRefreshCw className="animate-spin" size={16} />
              ) : (
                <FiTrash2 size={16} />
              )}
            </button>
          </div>
        );
      },
    },
  ];

  // Apply filters
  const filteredData = data.filter(item => {
    // Status filter
    if (filters.status !== "all" && item.status !== filters.status) {
      return false;
    }
    
    // Seller filter
    if (filters.sellerId !== "all" && item.shopId !== filters.sellerId) {
      return false;
    }
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const shopName = item.seller?.name?.toLowerCase() || "";
      const email = item.seller?.email?.toLowerCase() || "";
      const id = item._id?.toLowerCase() || "";
      
      if (!shopName.includes(searchLower) && 
          !email.includes(searchLower) && 
          !id.includes(searchLower)) {
        return false;
      }
    }
    
    // Date range filter
    if (filters.startDate || filters.endDate) {
      const itemDate = new Date(item.createdAt);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;
      
      if (startDate && itemDate < startDate) return false;
      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
        if (itemDate > endDate) return false;
      }
    }
    
    return true;
  });

  const handleProcessWithdraw = (row) => {
    setWithdrawData(row.raw);
    setWithdrawStatus("completed"); // Default to approve
    setAdminNote("");
    setOpen(true);
  };

  const handleViewDetails = (row) => {
    setSelectedRow(row);
    setViewOpen(true);
  };

  const handleDeleteWithdraw = async (row) => {
    if (!window.confirm(`Are you sure you want to delete this withdrawal request from ${row.name} for $${row.amount}?`)) {
      return;
    }

    setActionLoading(row.id);
    try {
      const res = await axios.delete(
        `${server}/withdraw/delete-withdraw-request/${row.id}`,
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success("Withdrawal deleted successfully!");
        fetchWithdraws();
      } else {
        toast.error(res.data.message || "Failed to delete");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to delete";
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmit = async () => {
    if (!withdrawData || !withdrawData.id) {
      toast.error("Invalid withdraw data");
      return;
    }

    if (withdrawStatus === "rejected" && !adminNote.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.put(
        `${server}/withdraw/update-withdraw-request/${withdrawData.id}`,
        {
          status: withdrawStatus,
          adminNote: adminNote.trim(),
          sellerId: withdrawData.shopId
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        const action = withdrawStatus === "completed" ? "approved" : "rejected";
        toast.success(`Withdrawal ${action} successfully! The seller has been notified.`);
        setOpen(false);
        fetchWithdraws();
        setWithdrawData(null);
        setAdminNote("");
      } else {
        toast.error(res.data.message || "Failed to update");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Format data for DataGrid
  const rows = filteredData.map((item) => ({
    id: item._id,
    shopId: item.shopId || "N/A",
    name: item.seller?.name || item.seller?.shopName || "Unknown Shop",
    amount: parseFloat(item.amount || 0).toFixed(2),
    status: item.status || "pending",
    method: item.withdrawMethod || {},
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
    raw: item
  }));

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success("Copied to clipboard!"))
      .catch(() => toast.error("Failed to copy"));
  };

  // Export to CSV
  const exportToCSV = () => {
    if (filteredData.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["ID", "Shop Name", "Amount", "Method", "Status", "Request Date", "Processed Date", "Admin Note"];
    const csvData = filteredData.map(item => [
      item._id?.substring(0, 8) + "...",
      item.seller?.name || "Unknown",
      `$${parseFloat(item.amount || 0).toFixed(2)}`,
      item.withdrawMethod?.type === "bank" ? "Bank Transfer" : "Binance",
      item.status?.charAt(0).toUpperCase() + item.status?.slice(1),
      new Date(item.createdAt).toLocaleDateString(),
      item.processedAt ? new Date(item.processedAt).toLocaleDateString() : "N/A",
      item.adminNote || "N/A"
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `withdrawals_admin_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("CSV exported successfully!");
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      status: "all",
      sellerId: "all",
      search: "",
      startDate: "",
      endDate: ""
    });
  };

  // Get filtered stats
  const filteredStats = {
    total: filteredData.length,
    pending: filteredData.filter(w => w.status === 'pending').length,
    completed: filteredData.filter(w => w.status === 'completed').length,
    rejected: filteredData.filter(w => w.status === 'rejected').length,
    totalAmount: filteredData.reduce((sum, w) => sum + (w.amount || 0), 0),
    pendingAmount: filteredData
      .filter(w => w.status === 'pending')
      .reduce((sum, w) => sum + (w.amount || 0), 0)
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">All Withdrawal Requests</h1>
              <p className="text-gray-600 mt-1">Manage seller withdrawal requests</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                disabled={filteredData.length === 0}
              >
                <FiDownload /> Export CSV
              </button>
              <button
                onClick={fetchWithdraws}
                disabled={fetchLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
              >
                <FiRefreshCw className={fetchLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {filteredStats.total} <span className="text-sm text-gray-500">/{stats.total}</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {filteredStats.pending}
                </p>
                <p className="text-sm text-gray-500">${filteredStats.pendingAmount.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <FiClock className="text-2xl text-yellow-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {filteredStats.completed}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <FiCheckCircle className="text-2xl text-green-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {filteredStats.rejected}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <FiXCircle className="text-2xl text-red-500" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  ${filteredStats.totalAmount.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FiTrendingUp className="text-2xl text-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <FiFilter className="text-gray-500" />
              <h3 className="font-semibold text-gray-700">Filters</h3>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
              >
                Clear Filters
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            {/* Seller Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seller</label>
              <select
                value={filters.sellerId}
                onChange={(e) => setFilters({...filters, sellerId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">All Sellers</option>
                {sellers.map(seller => (
                  <option key={seller._id} value={seller._id}>
                    {seller.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          
          {/* Search */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by shop name, email, or ID..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          
          {/* Filter Results */}
          {(filters.status !== "all" || filters.sellerId !== "all" || filters.search || filters.startDate || filters.endDate) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {filteredStats.total} of {stats.total} withdrawals
                {filteredStats.totalAmount > 0 && ` • Total: $${filteredStats.totalAmount.toFixed(2)}`}
              </p>
            </div>
          )}
        </div>

        {/* Data Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {rows.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl mb-6">
                <span className="text-5xl">💸</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {data.length === 0 ? "No Withdrawal Requests" : "No Matching Results"}
              </h3>
              <p className="text-gray-600 mb-6">
                {data.length === 0 
                  ? "When sellers submit withdrawal requests, they will appear here." 
                  : "Try adjusting your filters to see more results."}
              </p>
            </div>
          ) : (
            <div className="h-[calc(100vh-400px)] min-h-[500px]">
              <DataGrid
                rows={rows}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                pagination
                loading={fetchLoading}
                disableSelectionOnClick
                getRowClassName={(params) => {
                  const status = params.row.status;
                  if (status === "pending") return "bg-yellow-50 hover:bg-yellow-100";
                  if (status === "completed") return "bg-green-50 hover:bg-green-100";
                  if (status === "rejected") return "bg-red-50 hover:bg-red-100";
                  return "hover:bg-gray-50";
                }}
                sx={{
                  border: 0,
                  "& .MuiDataGrid-cell": {
                    borderBottom: "1px solid #e5e7eb",
                    padding: "12px 16px",
                    fontSize: "14px",
                  },
                  "& .MuiDataGrid-cell:focus": {
                    outline: "none",
                  },
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: "#f8fafc",
                    borderBottom: "2px solid #e2e8f0",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                  },
                  "& .MuiDataGrid-footerContainer": {
                    borderTop: "1px solid #e5e7eb",
                    backgroundColor: "#f8fafc",
                    fontSize: "14px",
                  },
                  "& .MuiDataGrid-row:hover": {
                    backgroundColor: "#f9fafb",
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Process Withdrawal Modal */}
      {open && withdrawData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b z-10">
              <h2 className="text-xl font-bold text-gray-900">Process Withdrawal</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                disabled={loading}
              >
                <RxCross1 size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Seller & Amount Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Seller</p>
                    <p className="font-bold text-gray-900 text-lg">
                      {withdrawData.seller?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ID: {withdrawData.seller?._id?.substring(0, 10)}...
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 font-medium">Amount</p>
                    <p className="text-3xl font-bold text-green-600">
                      ${parseFloat(withdrawData.amount || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Method Info */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-700 mb-3">Payment Method</h4>
                <div className="space-y-3">
                  {withdrawData.withdrawMethod?.type === "bank" ? (
                    <>
                      <div className="flex items-center gap-2">
                        <FiBriefcase className="text-blue-500" />
                        <span className="font-medium text-gray-800">Bank Transfer</span>
                      </div>
                      {withdrawData.withdrawMethod.bankHolderName && (
                        <div>
                          <p className="text-sm text-gray-500">Account Holder</p>
                          <p className="font-semibold text-gray-800">
                            {withdrawData.withdrawMethod.bankHolderName}
                          </p>
                        </div>
                      )}
                      {withdrawData.withdrawMethod.bankAccountNumber && (
                        <div>
                          <p className="text-sm text-gray-500">Account Number</p>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800 font-mono">
                              {withdrawData.withdrawMethod.bankAccountNumber}
                            </p>
                            <button
                              onClick={() => copyToClipboard(withdrawData.withdrawMethod.bankAccountNumber)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <FiCopy size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                      {withdrawData.withdrawMethod.bankName && (
                        <div>
                          <p className="text-sm text-gray-500">Bank Name</p>
                          <p className="font-semibold text-gray-800">
                            {withdrawData.withdrawMethod.bankName}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <FiGlobe className="text-yellow-500" />
                        <span className="font-medium text-gray-800">Binance</span>
                      </div>
                      {withdrawData.withdrawMethod?.binanceWalletAddress && (
                        <div>
                          <p className="text-sm text-gray-500">Wallet Address</p>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800 font-mono text-sm break-all">
                              {withdrawData.withdrawMethod.binanceWalletAddress}
                            </p>
                            <button
                              onClick={() => copyToClipboard(withdrawData.withdrawMethod.binanceWalletAddress)}
                              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                            >
                              <FiCopy size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Action Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Select Action *</label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${withdrawStatus === "completed" 
                      ? "border-green-500 bg-green-50" 
                      : "border-gray-200 hover:border-green-300 bg-white"}`}
                    onClick={() => setWithdrawStatus("completed")}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${withdrawStatus === "completed" 
                        ? "border-green-500 bg-green-500" 
                        : "border-gray-300"}`}
                      >
                        {withdrawStatus === "completed" && <FiCheckCircle className="text-white" size={14} />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-green-700 text-base">Approve</p>
                        <p className="text-xs text-gray-600 mt-1">Process payment to seller</p>
                      </div>
                    </div>
                  </div>
                  <div 
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${withdrawStatus === "rejected" 
                      ? "border-red-500 bg-red-50" 
                      : "border-gray-200 hover:border-red-300 bg-white"}`}
                    onClick={() => setWithdrawStatus("rejected")}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${withdrawStatus === "rejected" 
                        ? "border-red-500 bg-red-500" 
                        : "border-gray-300"}`}
                      >
                        {withdrawStatus === "rejected" && <FiXCircle className="text-white" size={14} />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-red-700 text-base">Reject</p>
                        <p className="text-xs text-gray-600 mt-1">Refund to seller balance</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Note */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Admin Note {withdrawStatus === "rejected" && <span className="text-red-600">(Required for rejection)</span>}
                </label>
                <textarea
                  placeholder={withdrawStatus === "rejected" 
                    ? "Explain why this withdrawal is being rejected..." 
                    : "Add optional notes for the seller..."}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[120px] resize-none text-base"
                  disabled={loading}
                />
                <p className="text-sm text-gray-500 mt-2">
                  This note will be visible to the seller and included in their notification email.
                </p>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white flex justify-end gap-4 p-6 border-t">
              <button
                onClick={() => setOpen(false)}
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || (withdrawStatus === "rejected" && !adminNote.trim())}
                className={`px-8 py-3 rounded-xl text-white font-medium transition-all ${
                  withdrawStatus === "completed" 
                    ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800" 
                    : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <FiRefreshCw className="animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {withdrawStatus === "completed" ? <FiCheckCircle /> : <FiXCircle />}
                    {withdrawStatus === "completed" ? "Approve Payment" : "Reject Request"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewOpen && selectedRow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b z-10">
              <h2 className="text-xl font-bold text-gray-900">Withdrawal Details</h2>
              <button
                onClick={() => setViewOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <RxCross1 size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Status Header */}
              <div className={`p-5 rounded-xl ${selectedRow.status === "pending" 
                ? "bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200" 
                : selectedRow.status === "completed" 
                ? "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200" 
                : "bg-gradient-to-r from-red-50 to-rose-50 border border-red-200"}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-xl">
                      {selectedRow.status === "pending" && "⏳ Pending Review"}
                      {selectedRow.status === "completed" && "✅ Payment Completed"}
                      {selectedRow.status === "rejected" && "❌ Request Rejected"}
                    </h3>
                    <p className="text-gray-600 mt-1 text-sm">ID: {selectedRow.id?.substring(0, 12)}...</p>
                    
                    {/* Admin Feedback */}
                    {selectedRow.raw?.adminNote && (
                      <div className={`mt-3 p-3 rounded-lg ${
                        selectedRow.status === "completed" ? "bg-green-100 text-green-800" :
                        selectedRow.status === "rejected" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        <div className="flex items-start gap-2">
                          <FiInfo className="mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold">Admin Feedback:</p>
                            <p className="text-sm mt-1">{selectedRow.raw.adminNote}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-600">${selectedRow.amount}</p>
                    <p className="text-gray-600 text-sm">{new Date(selectedRow.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Seller Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-5 rounded-xl">
                  <h4 className="font-bold text-gray-700 mb-4">Seller Information</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Shop Name</p>
                      <p className="font-semibold text-gray-800 text-lg">{selectedRow.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Seller ID</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-gray-800">{selectedRow.shopId?.substring(0, 16)}...</p>
                        <button
                          onClick={() => copyToClipboard(selectedRow.shopId)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <FiCopy size={14} />
                        </button>
                      </div>
                    </div>
                    {selectedRow.raw?.seller?.email && (
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-semibold text-gray-800">{selectedRow.raw.seller.email}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-gray-50 p-5 rounded-xl">
                  <h4 className="font-bold text-gray-700 mb-4">Payment Method</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-semibold text-gray-800 text-lg">
                        {selectedRow.raw?.withdrawMethod?.type === "bank" ? "Bank Transfer" : "Binance"}
                      </p>
                    </div>
                    
                    {selectedRow.raw?.withdrawMethod?.bankAccountNumber && (
                      <div>
                        <p className="text-sm text-gray-500">Account Number</p>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-800 font-mono">
                            {selectedRow.raw.withdrawMethod.bankAccountNumber}
                          </p>
                          <button
                            onClick={() => copyToClipboard(selectedRow.raw.withdrawMethod.bankAccountNumber)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <FiCopy size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {selectedRow.raw?.withdrawMethod?.bankHolderName && (
                      <div>
                        <p className="text-sm text-gray-500">Account Holder</p>
                        <p className="font-semibold text-gray-800">
                          {selectedRow.raw.withdrawMethod.bankHolderName}
                        </p>
                      </div>
                    )}
                    
                    {selectedRow.raw?.withdrawMethod?.bankName && (
                      <div>
                        <p className="text-sm text-gray-500">Bank Name</p>
                        <p className="font-semibold text-gray-800">
                          {selectedRow.raw.withdrawMethod.bankName}
                        </p>
                      </div>
                    )}
                    
                    {selectedRow.raw?.withdrawMethod?.binanceWalletAddress && (
                      <div>
                        <p className="text-sm text-gray-500">Wallet Address</p>
                        <div className="bg-gray-100 p-3 rounded">
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-gray-800 text-xs break-all">
                              {selectedRow.raw.withdrawMethod.binanceWalletAddress}
                            </p>
                            <button
                              onClick={() => copyToClipboard(selectedRow.raw.withdrawMethod.binanceWalletAddress)}
                              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                            >
                              <FiCopy size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-gray-50 p-5 rounded-xl">
                <h4 className="font-bold text-gray-700 mb-4">Timeline</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Requested</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(selectedRow.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      Submitted
                    </div>
                  </div>
                  
                  {selectedRow.raw?.processedAt && (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">
                          {selectedRow.status === "completed" ? "Completed" : "Rejected"}
                        </p>
                        <p className="font-semibold text-gray-800">
                          {new Date(selectedRow.raw.processedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm ${
                        selectedRow.status === "completed" ? "bg-green-100 text-green-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {selectedRow.status === "completed" ? "Approved" : "Rejected"}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white flex justify-between items-center p-6 border-t">
              <div className="flex gap-3">
                {selectedRow.status === "pending" && (
                  <button
                    onClick={() => {
                      setViewOpen(false);
                      setTimeout(() => handleProcessWithdraw(selectedRow), 300);
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium"
                  >
                    Process Request
                  </button>
                )}
                <button
                  onClick={() => setViewOpen(false)}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
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

export default AllWithdraw;