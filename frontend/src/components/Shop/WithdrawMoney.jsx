import axios from "axios";
import React, { useEffect, useState } from "react";
import { server } from "../../server";
import { RxCross1 } from "react-icons/rx";
import { 
  FiEye, 
  FiRefreshCw, 
  FiCheckCircle, 
  FiXCircle, 
  FiDollarSign, 
  FiAlertCircle,
  FiPlus,
  FiTrash2,
  FiBriefcase,
  FiGlobe,
  FiCopy,
  FiClock,
  FiSend,
  FiTrendingUp,
  FiInfo,
  FiDatabase,
  FiDownload,
  FiFilter,
  FiCalendar,
  FiUser,
  FiMail,
  FiCreditCard
} from "react-icons/fi";
import { toast } from "react-toastify";
import Loader from "../Layout/Loader";
import { useSelector } from "react-redux";

const WithdrawMoney = () => {
  const { seller } = useSelector((state) => state.seller);
  const [data, setData] = useState([]);   
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [apiError, setApiError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [actionLoading, setActionLoading] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMethod, setFilterMethod] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  
  // New withdrawal form state
  const [newWithdraw, setNewWithdraw] = useState({
    amount: "",
    withdrawMethod: "bank",
    bankDetails: {
      bankHolderName: "",
      bankName: "",
      bankAccountNumber: "",
      bankSwiftCode: "",
      bankCountry: "United States",
      bankAddress: ""
    },
    binanceDetails: {
      binanceWalletAddress: "",
      binanceHolderName: ""
    }
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Real-time polling for updates
  useEffect(() => {
    if (!seller?._id) return;
    
    const pollInterval = setInterval(() => {
      fetchWithdraws();
    }, 30000); // Poll every 30 seconds
    
    return () => clearInterval(pollInterval);
  }, [seller]);

  // Fetch withdrawals - FIXED VERSION
  const fetchWithdraws = async (forceRefresh = false) => {
    if (!seller?._id) {
      toast.error("Please login as a seller");
      setFetchLoading(false);
      return;
    }

    try {
      setFetchLoading(true);
      setApiError(null);
      
      console.log(`🔄 Fetching withdrawals for seller ID: ${seller._id}`);
      
      const res = await axios.get(
        `${server}/withdraw/get-seller-withdraw-request/${seller._id}`,
        { 
          withCredentials: true,
          headers: {
            'Cache-Control': 'no-cache',
            'Accept': 'application/json'
          },
          timeout: 15000
        }
      );
      
      console.log('📊 API Response:', res.data);
      
      if (res.data && res.data.success !== false) {
        const withdraws = res.data.withdraws || [];
        console.log(`✅ Loaded ${withdraws.length} withdrawal requests`);
        
        // Log each withdrawal for debugging
        withdraws.forEach((w, i) => {
          console.log(`   ${i+1}. ID: ${w._id}, Amount: $${w.amount}, Status: ${w.status}`);
        });
        
        setData(withdraws);
        setLastUpdated(new Date());
        
        if (withdraws.length === 0) {
          console.log("📭 No withdrawal requests found");
        }
        
      } else {
        const message = res.data?.message || "Unexpected response";
        console.error("❌ API Error Response:", res.data);
        setData([]);
        setApiError(message);
        toast.error(message);
      }
    } catch (error) {
      console.error("❌ Fetch withdrawals error:", error);
      
      let errorMessage = "Network error occurred";
      if (error.response) {
        console.error('❌ Error Response Data:', error.response.data);
        console.error('❌ Error Response Status:', error.response.status);
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        console.error('❌ No response received');
        errorMessage = "No response from server. Check if backend is running.";
      } else {
        console.error('❌ Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      setData([]);
      setApiError(errorMessage);
      
      toast.error("Failed to load withdrawals: " + errorMessage);
    } finally {
      setFetchLoading(false);
    }
  };

  // Auto fetch on component mount and seller change
  useEffect(() => {
    if (seller?._id) {
      console.log('🛍️ Seller detected, fetching withdrawals...');
      fetchWithdraws();
    } else {
      console.log('⚠️ No seller found, waiting...');
      setFetchLoading(false);
    }
  }, [seller]);

  // Handle creating new withdrawal - FIXED VERSION
  const handleCreateWithdraw = async () => {
    if (!newWithdraw.amount || parseFloat(newWithdraw.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const amount = parseFloat(newWithdraw.amount);
    if (amount < 10) {
      toast.error("Minimum withdrawal amount is $10");
      return;
    }

    const availableBalance = seller?.availableBalance || 0;
    if (amount > availableBalance) {
      toast.error(`Amount exceeds available balance of $${availableBalance.toFixed(2)}`);
      return;
    }

    // Validate based on method
    if (newWithdraw.withdrawMethod === "bank") {
      const { bankHolderName, bankAccountNumber, bankName } = newWithdraw.bankDetails;
      if (!bankHolderName || !bankAccountNumber || !bankName) {
        toast.error("Please fill all required bank details");
        return;
      }
    } else if (newWithdraw.withdrawMethod === "binance") {
      const { binanceWalletAddress } = newWithdraw.binanceDetails;
      if (!binanceWalletAddress) {
        toast.error("Please enter Binance wallet address");
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = `/withdraw/create-withdraw-request`;
      
      let payload = {
        amount: newWithdraw.amount,
        sellerId: seller._id
      };

      // Add method details
      if (newWithdraw.withdrawMethod === "bank") {
        payload.withdrawMethod = "bank";
        payload.bankHolderName = newWithdraw.bankDetails.bankHolderName;
        payload.bankName = newWithdraw.bankDetails.bankName;
        payload.bankAccountNumber = newWithdraw.bankDetails.bankAccountNumber;
        payload.bankSwiftCode = newWithdraw.bankDetails.bankSwiftCode || "";
        payload.bankCountry = newWithdraw.bankDetails.bankCountry || "";
        payload.bankAddress = newWithdraw.bankDetails.bankAddress || "";
      } else if (newWithdraw.withdrawMethod === "binance") {
        payload.withdrawMethod = "binance";
        payload.binanceWalletAddress = newWithdraw.binanceDetails.binanceWalletAddress;
        payload.binanceHolderName = newWithdraw.binanceDetails.binanceHolderName || "";
      }

      console.log("📤 Sending withdrawal payload:", payload);
      
      const response = await axios.post(
        `${server}${endpoint}`,
        payload,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("✅ Create withdrawal response:", response.data);

      if (response.data.success) {
        toast.success("✅ Withdrawal request created successfully!");
        setCreateOpen(false);
        
        // Reset form
        setNewWithdraw({
          amount: "",
          withdrawMethod: "bank",
          bankDetails: {
            bankHolderName: "",
            bankName: "",
            bankAccountNumber: "",
            bankSwiftCode: "",
            bankCountry: "United States",
            bankAddress: ""
          },
          binanceDetails: {
            binanceWalletAddress: "",
            binanceHolderName: ""
          }
        });
        
        // Refresh the list
        await fetchWithdraws(true);
        
        // Update seller balance from response
        if (response.data.withdraw?.availableBalance !== undefined) {
          toast.info(`New balance: $${response.data.withdraw.availableBalance.toFixed(2)}`);
        }
      } else {
        toast.error(response.data.message || "Failed to create withdrawal");
      }
    } catch (error) {
      console.error("❌ Create withdrawal error:", error);
      
      let errorMessage = "Failed to create withdrawal";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        console.error("❌ Server error details:", error.response.data);
      } else if (error.message.includes("Network Error")) {
        errorMessage = "Network error. Please check your connection.";
      }
      
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text)
      .then(() => toast.success("Copied to clipboard!"))
      .catch(() => toast.error("Failed to copy"));
  };

  // Handle delete withdrawal (SELLER VERSION) - FIXED
  const handleDeleteWithdraw = async (row) => {
    if (row.status !== "pending") {
      toast.error("Only pending withdrawals can be deleted");
      return;
    }

    if (!window.confirm(`Are you sure you want to cancel this withdrawal request for ${row.amount}?`)) {
      return;
    }

    setActionLoading(row.id);
    try {
      // Try seller-specific endpoint first
      const endpoint = `/withdraw/seller-delete-withdraw-request/${row.id}`;
      
      console.log(`🗑️ Deleting withdrawal ${row.id}...`);
      
      const response = await axios.delete(
        `${server}${endpoint}`,
        { withCredentials: true }
      );

      console.log("✅ Delete response:", response.data);

      if (response.data.success) {
        toast.success("✅ Withdrawal cancelled successfully!");
        
        // Update local balance if returned
        if (response.data.newBalance !== undefined) {
          toast.info(`Amount refunded. New balance: $${response.data.newBalance.toFixed(2)}`);
        }
        
        // Refresh the list
        await fetchWithdraws();
      } else {
        toast.error(response.data.message || "Failed to cancel withdrawal");
      }
    } catch (error) {
      console.error("❌ Delete withdrawal error:", error);
      
      let errorMessage = "Failed to cancel withdrawal";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        console.error("❌ Delete error details:", error.response.data);
      } else if (error.message.includes("404")) {
        // Fallback to admin endpoint if seller endpoint doesn't exist
        errorMessage = "Cancellation endpoint not available. Please contact admin.";
        toast.warning("Please contact admin to cancel this withdrawal.");
      }
      
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Format date - IMPROVED VERSION
  const formatDate = (dateString) => {
    if (!dateString) return { date: "N/A", time: "", full: new Date().toISOString() };
    
    try {
      let date;
      
      // Handle Firestore timestamp
      if (dateString.toDate) {
        date = dateString.toDate();
      } else if (dateString.seconds) {
        // Firebase timestamp with seconds
        date = new Date(dateString.seconds * 1000);
      } else {
        // Regular date string
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        return { date: "Invalid", time: "", full: new Date().toISOString() };
      }
      
      return {
        date: date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        time: date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        full: date.toISOString(),
        datetime: date
      };
    } catch (error) {
      console.error("❌ Date formatting error:", error, dateString);
      return { date: "Invalid", time: "", full: new Date().toISOString() };
    }
  };

  // Map data to rows - FIXED VERSION
  const rows = data.map((item, index) => {
    try {
      if (!item) return null;
      
      console.log(`📝 Processing withdrawal item ${index}:`, item);
      
      const dateInfo = formatDate(item.createdAt);
      const method = item.withdrawMethod || {};
      const amount = parseFloat(item.amount) || 0;
      const status = (item.status || "pending").toLowerCase();
      
      return {
        id: item._id || `withdraw-${index}`,
        amount: `$${amount.toFixed(2)}`,
        amountValue: amount,
        method: {
          type: method.type === "bank" ? "Bank Transfer" : 
                 method.type === "binance" ? "Binance" : "Unknown",
          bankAccountNumber: method.bankAccountNumber || "",
          binanceWalletAddress: method.binanceWalletAddress || "",
          bankHolderName: method.bankHolderName || "",
          bankName: method.bankName || "",
          bankSwiftCode: method.bankSwiftCode || "",
          bankCountry: method.bankCountry || "",
          bankAddress: method.bankAddress || "",
        },
        status: status,
        createdAt: dateInfo,
        processedAt: item.processedAt ? formatDate(item.processedAt) : null,
        adminNote: item.adminNote || "",
        raw: item,
      };
    } catch (error) {
      console.error("❌ Error mapping item:", error, item);
      return null;
    }
  }).filter(row => row !== null);

  console.log(`📊 Total rows mapped: ${rows.length}`);

  // Apply filters
  const filteredRows = rows.filter(row => {
    // Status filter
    if (filterStatus !== "all" && row.status !== filterStatus) {
      return false;
    }
    
    // Method filter
    if (filterMethod !== "all") {
      const methodType = row.method.type.toLowerCase();
      if (filterMethod === "bank" && !methodType.includes("bank")) return false;
      if (filterMethod === "binance" && !methodType.includes("binance")) return false;
    }
    
    // Date range filter
    if (dateRange.start && dateRange.end) {
      const rowDate = row.createdAt.datetime || new Date(row.createdAt.full);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      
      if (rowDate < startDate || rowDate > endDate) {
        return false;
      }
    }
    
    return true;
  });

  console.log(`🔍 Filtered rows: ${filteredRows.length}`);

  // Statistics - FIXED
  const totalAmount = rows.reduce((sum, row) => sum + row.amountValue, 0);
  const pendingCount = rows.filter(row => row.status === "pending").length;
  const completedCount = rows.filter(row => row.status === "completed").length;
  const rejectedCount = rows.filter(row => row.status === "rejected").length;
  const availableBalance = seller?.availableBalance || 0;

  // Calculate filtered statistics
  const filteredTotal = filteredRows.reduce((sum, row) => sum + row.amountValue, 0);
  const filteredCount = filteredRows.length;

  // Handle view details
  const handleViewDetails = (row) => {
    console.log("👁️ Viewing details for row:", row);
    setSelectedRow(row);
    setViewOpen(true);
  };

  // Clear filters
  const clearFilters = () => {
    setFilterStatus("all");
    setFilterMethod("all");
    setDateRange({ start: "", end: "" });
    toast.info("Filters cleared");
  };

  // Export to CSV
  const exportToCSV = () => {
    if (filteredRows.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["ID", "Amount", "Method", "Status", "Date", "Time", "Admin Note"];
    const csvData = filteredRows.map(row => [
      row.id.substring(0, 8) + "...",
      row.amount,
      row.method.type,
      row.status.charAt(0).toUpperCase() + row.status.slice(1),
      row.createdAt.date,
      row.createdAt.time,
      row.adminNote || "N/A"
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `withdrawals_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("CSV exported successfully!");
  };

  // Debug function to test API
  const testApiEndpoint = async () => {
    toast.info("Testing API endpoint...");
    try {
      const res = await axios.get(`${server}/health`);
      console.log("✅ Health check:", res.data);
      toast.success(`API is running: ${res.data.status}`);
    } catch (error) {
      console.error("❌ API health check failed:", error);
      toast.error("API server is not responding");
    }
  };

  // Loading state - IMPROVED
  if (fetchLoading && data.length === 0) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="flex flex-col items-center max-w-md text-center">
          <div className="relative">
            <Loader />
            <div className="absolute inset-0 flex items-center justify-center">
              <FiDollarSign className="text-blue-500 text-3xl animate-pulse" />
            </div>
          </div>
          <p className="mt-6 text-lg text-gray-700 font-medium">Loading withdrawal history...</p>
          <p className="text-sm text-gray-500 mt-2">Fetching your withdrawal requests</p>
          <button
            onClick={testApiEndpoint}
            className="mt-4 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
          >
            Test API Connection
          </button>
        </div>
      </div>
    );
  }

  // Status badge component
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: <FiClock className="inline mr-1" size={14} />,
        label: "Pending"
      },
      completed: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: <FiCheckCircle className="inline mr-1" size={14} />,
        label: "Completed"
      },
      rejected: {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: <FiXCircle className="inline mr-1" size={14} />,
        label: "Rejected"
      }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center ${config.bg} ${config.text}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  // Seller info card
  const SellerInfoCard = () => (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-4 mb-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-full">
            <FiUser size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">{seller?.name || "Seller"}</h3>
            <p className="text-sm opacity-90 flex items-center gap-1">
              <FiMail size={12} /> {seller?.email || "No email"}
            </p>
            <p className="text-xs opacity-75 mt-1">ID: {seller?._id?.substring(0, 10)}...</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-90">Total Sales</p>
          <p className="text-2xl font-bold">${seller?.totalSales?.toFixed(2) || "0.00"}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-6">
      {/* Seller Info Card */}
      <SellerInfoCard />
      
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Withdrawals</h1>
            <p className="text-gray-600 mt-1">Request and track your withdrawals</p>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</p>
              <span className={`w-2 h-2 rounded-full ${fetchLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Balance */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl shadow-md min-w-[180px]">
              <p className="text-xs font-medium flex items-center gap-1">
                <FiDollarSign /> Available Balance
              </p>
              <p className="text-xl md:text-2xl font-bold mt-1">${availableBalance.toFixed(2)}</p>
            </div>
            
            <button
              onClick={() => setCreateOpen(true)}
              className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2 font-medium shadow-md"
              disabled={availableBalance < 10}
              title={availableBalance < 10 ? "Minimum $10 required" : "Create new withdrawal"}
            >
              <FiPlus /> New Withdrawal
            </button>
            
            <button
              onClick={() => fetchWithdraws(true)}
              disabled={fetchLoading}
              className="p-2 md:p-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
              title="Refresh"
            >
              <FiRefreshCw className={fetchLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{rows.length}</p>
              <p className="text-xs text-gray-500 mt-1">${totalAmount.toFixed(2)} total</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
              <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <FiClock className="text-2xl text-yellow-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{completedCount}</p>
              <p className="text-xs text-gray-500 mt-1">Paid out</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <FiCheckCircle className="text-2xl text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{rejectedCount}</p>
              <p className="text-xs text-gray-500 mt-1">Refunded</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <FiXCircle className="text-2xl text-red-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Withdrawn</p>
              <p className="text-2xl font-bold text-green-600 mt-1">${totalAmount.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">Total withdrawn</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="text-2xl text-green-500" />
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
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {filteredCount} of {rows.length} shown
            </span>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
            
            {/* Method Filter */}
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">All Methods</option>
              <option value="bank">Bank Transfer</option>
              <option value="binance">Binance</option>
            </select>
            
            {/* Date Range */}
            <div className="flex items-center gap-2">
              <FiCalendar className="text-gray-500" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm flex items-center gap-2"
              >
                Clear Filters
              </button>
              <button
                onClick={exportToCSV}
                disabled={filteredRows.length === 0}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm ${
                  filteredRows.length === 0 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                title={filteredRows.length === 0 ? "No data to export" : "Export to CSV"}
              >
                <FiDownload size={14} /> Export
              </button>
            </div>
          </div>
        </div>
        
        {/* Filter Results */}
        {(filterStatus !== "all" || filterMethod !== "all" || dateRange.start || dateRange.end) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {filteredCount} of {rows.length} withdrawals 
              {filteredTotal > 0 && ` • Total: $${filteredTotal.toFixed(2)}`}
            </p>
          </div>
        )}
      </div>

      {/* Withdrawals List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredRows.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl mb-6">
              {apiError ? (
                <FiAlertCircle className="text-5xl text-red-500" />
              ) : rows.length === 0 ? (
                <FiDollarSign className="text-5xl text-blue-500" />
              ) : (
                <FiFilter className="text-5xl text-gray-400" />
              )}
            </div>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              {apiError ? "Error Loading Withdrawals" :
               rows.length === 0 ? "No Withdrawal History" :
               "No Matching Results"}
            </h3>
            
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {apiError ? (
                <span className="text-red-500">{apiError}</span>
              ) : rows.length === 0 ? (
                "You haven't made any withdrawal requests yet. Start by creating your first withdrawal."
              ) : (
                "No withdrawals match your filters. Try adjusting your filter criteria."
              )}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {rows.length === 0 && (
                <button
                  onClick={() => setCreateOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2 font-medium shadow-md"
                >
                  <FiPlus /> Make Your First Withdrawal
                </button>
              )}
              <button
                onClick={clearFilters}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 font-medium"
              >
                Clear Filters
              </button>
              <button
                onClick={fetchWithdraws}
                className="px-6 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all flex items-center gap-2 font-medium"
              >
                <FiRefreshCw /> Refresh
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Method</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Request Date</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <FiDollarSign className="text-green-500 flex-shrink-0" />
                        <span className="font-bold text-green-600">{row.amount}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {row.method.type === "Bank Transfer" ? (
                          <FiBriefcase className="text-blue-500 flex-shrink-0" />
                        ) : (
                          <FiGlobe className="text-yellow-500 flex-shrink-0" />
                        )}
                        <span className="text-sm">{row.method.type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(row.status)}
                        {row.adminNote && (
                          <div className="mt-1 text-xs text-gray-500 truncate max-w-[150px]" title={row.adminNote}>
                            <FiInfo className="inline mr-1" size={10} />
                            {row.adminNote.length > 30 ? row.adminNote.substring(0, 30) + '...' : row.adminNote}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <p className="text-sm text-gray-800">{row.createdAt.date}</p>
                        <p className="text-xs text-gray-500">{row.createdAt.time}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(row)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all flex-shrink-0"
                          title="View Details"
                        >
                          <FiEye />
                        </button>
                        {row.status === "pending" && (
                          <button
                            onClick={() => handleDeleteWithdraw(row)}
                            disabled={actionLoading === row.id}
                            className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                              actionLoading === row.id 
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                : "bg-red-50 text-red-600 hover:bg-red-100"
                            }`}
                            title="Cancel Withdrawal"
                          >
                            {actionLoading === row.id ? (
                              <FiRefreshCw className="animate-spin" />
                            ) : (
                              <FiTrash2 />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Withdrawal Modal */}
      {createOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b z-10 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">New Withdrawal Request</h2>
              <button
                onClick={() => setCreateOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                disabled={loading}
              >
                <RxCross1 size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Balance */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Available Balance</p>
                    <p className="text-3xl font-bold text-blue-800">${availableBalance.toFixed(2)}</p>
                  </div>
                  <div className="bg-blue-100 p-4 rounded-lg">
                    <FiDollarSign className="text-3xl text-blue-600" />
                  </div>
                </div>
                {availableBalance < 10 && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700 flex items-center gap-2">
                      <FiAlertCircle /> Minimum $10 required for withdrawal
                    </p>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Amount to Withdraw *
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <FiDollarSign className="text-gray-400" size={20} />
                  </div>
                  <input
                    type="number"
                    min="10"
                    step="0.01"
                    max={availableBalance}
                    placeholder="Enter amount"
                    value={newWithdraw.amount}
                    onChange={(e) => setNewWithdraw({
                      ...newWithdraw,
                      amount: e.target.value
                    })}
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg font-medium"
                    disabled={loading}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <p className="text-sm text-gray-500">Minimum: $10.00</p>
                  <p className="text-sm font-medium text-blue-600">
                    Max: ${availableBalance.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Method Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Payment Method *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${newWithdraw.withdrawMethod === "bank" 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-gray-200 hover:border-blue-300 bg-white"}`}
                    onClick={() => setNewWithdraw({
                      ...newWithdraw,
                      withdrawMethod: "bank"
                    })}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${newWithdraw.withdrawMethod === "bank" 
                        ? "bg-blue-100 text-blue-600" 
                        : "bg-gray-100 text-gray-600"}`}
                      >
                        <FiBriefcase size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-gray-800 text-lg">Bank Transfer</p>
                          {newWithdraw.withdrawMethod === "bank" && (
                            <FiCheckCircle className="text-blue-500" size={20} />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Direct bank deposit</p>
                        <p className="text-xs text-blue-500 mt-1">Processing: 1-3 business days</p>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${newWithdraw.withdrawMethod === "binance" 
                      ? "border-yellow-500 bg-yellow-50" 
                      : "border-gray-200 hover:border-yellow-300 bg-white"}`}
                    onClick={() => setNewWithdraw({
                      ...newWithdraw,
                      withdrawMethod: "binance"
                    })}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${newWithdraw.withdrawMethod === "binance" 
                        ? "bg-yellow-100 text-yellow-600" 
                        : "bg-gray-100 text-gray-600"}`}
                      >
                        <FiGlobe size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-gray-800 text-lg">Binance</p>
                          {newWithdraw.withdrawMethod === "binance" && (
                            <FiCheckCircle className="text-yellow-500" size={20} />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Crypto transfer</p>
                        <p className="text-xs text-yellow-500 mt-1">Processing: 24-48 hours</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Payment Details *
                </label>
                
                {newWithdraw.withdrawMethod === "bank" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Account Holder Name *
                        </label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={newWithdraw.bankDetails.bankHolderName}
                          onChange={(e) => setNewWithdraw({
                            ...newWithdraw,
                            bankDetails: {
                              ...newWithdraw.bankDetails,
                              bankHolderName: e.target.value
                            }
                          })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bank Name *
                        </label>
                        <input
                          type="text"
                          placeholder="Chase Bank"
                          value={newWithdraw.bankDetails.bankName}
                          onChange={(e) => setNewWithdraw({
                            ...newWithdraw,
                            bankDetails: {
                              ...newWithdraw.bankDetails,
                              bankName: e.target.value
                            }
                          })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Number *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="1234567890"
                          value={newWithdraw.bankDetails.bankAccountNumber}
                          onChange={(e) => setNewWithdraw({
                            ...newWithdraw,
                            bankDetails: {
                              ...newWithdraw.bankDetails,
                              bankAccountNumber: e.target.value
                            }
                          })}
                          className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono"
                          disabled={loading}
                        />
                        {newWithdraw.bankDetails.bankAccountNumber && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(newWithdraw.bankDetails.bankAccountNumber)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <FiCopy size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SWIFT/BIC Code
                        </label>
                        <input
                          type="text"
                          placeholder="CHASUS33"
                          value={newWithdraw.bankDetails.bankSwiftCode}
                          onChange={(e) => setNewWithdraw({
                            ...newWithdraw,
                            bankDetails: {
                              ...newWithdraw.bankDetails,
                              bankSwiftCode: e.target.value
                            }
                          })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          placeholder="United States"
                          value={newWithdraw.bankDetails.bankCountry}
                          onChange={(e) => setNewWithdraw({
                            ...newWithdraw,
                            bankDetails: {
                              ...newWithdraw.bankDetails,
                              bankCountry: e.target.value
                            }
                          })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Address
                      </label>
                      <textarea
                        placeholder="123 Main St, New York, NY 10001"
                        value={newWithdraw.bankDetails.bankAddress}
                        onChange={(e) => setNewWithdraw({
                          ...newWithdraw,
                          bankDetails: {
                            ...newWithdraw.bankDetails,
                            bankAddress: e.target.value
                          }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                        rows="2"
                        disabled={loading}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Binance Wallet Address *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="0x742d35Cc6634C0532925a3b844Bc9e..."
                          value={newWithdraw.binanceDetails.binanceWalletAddress}
                          onChange={(e) => setNewWithdraw({
                            ...newWithdraw,
                            binanceDetails: {
                              ...newWithdraw.binanceDetails,
                              binanceWalletAddress: e.target.value
                            }
                          })}
                          className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                          disabled={loading}
                        />
                        {newWithdraw.binanceDetails.binanceWalletAddress && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(newWithdraw.binanceDetails.binanceWalletAddress)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <FiCopy size={16} />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Make sure this address is correct. Crypto transactions cannot be reversed.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Holder Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Your name for reference"
                        value={newWithdraw.binanceDetails.binanceHolderName}
                        onChange={(e) => setNewWithdraw({
                          ...newWithdraw,
                          binanceDetails: {
                            ...newWithdraw.binanceDetails,
                            binanceHolderName: e.target.value
                          }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Terms */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <FiAlertCircle className="text-gray-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <p className="font-semibold mb-2">Important Information:</p>
                    <ul className="space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>Withdrawals are processed within 1-3 business days</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>Ensure all details are correct before submitting</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>A $10 minimum withdrawal applies</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>You will receive email notifications when processed</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>Pending withdrawals can be cancelled</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white flex justify-end gap-4 p-6 border-t shadow-lg">
              <button
                onClick={() => setCreateOpen(false)}
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWithdraw}
                disabled={loading || !newWithdraw.amount || parseFloat(newWithdraw.amount) < 10 || parseFloat(newWithdraw.amount) > availableBalance}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <FiRefreshCw className="animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <FiSend />
                    Submit Request
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
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Withdrawal Details</h2>
              <button
                onClick={() => setViewOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <RxCross1 size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Status with admin feedback */}
              <div className={`p-5 rounded-xl ${
                selectedRow.status === "pending" ? "bg-yellow-50 border border-yellow-200" :
                selectedRow.status === "completed" ? "bg-green-50 border border-green-200" :
                "bg-red-50 border border-red-200"
              }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">
                      {selectedRow.status === "pending" && "⏳ Pending Review"}
                      {selectedRow.status === "completed" && "✅ Payment Completed"}
                      {selectedRow.status === "rejected" && "❌ Request Rejected"}
                    </h3>
                    <p className="text-gray-600 text-sm">ID: {selectedRow.id?.substring(0, 8)}...</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{selectedRow.amount}</p>
                </div>
                
                {/* Admin Feedback */}
                {selectedRow.adminNote && (
                  <div className={`mt-4 p-3 rounded-lg ${
                    selectedRow.status === "completed" ? "bg-green-100 text-green-800" :
                    selectedRow.status === "rejected" ? "bg-red-100 text-red-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>
                    <div className="flex items-start gap-2">
                      <FiInfo className="mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Admin Feedback:</p>
                        <p className="text-sm mt-1">{selectedRow.adminNote}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {/* Payment Method */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                  <div className="flex items-center gap-2">
                    {selectedRow.method.type === "Bank Transfer" ? (
                      <FiBriefcase className="text-blue-500" />
                    ) : (
                      <FiGlobe className="text-yellow-500" />
                    )}
                    <p className="font-semibold text-gray-800">{selectedRow.method.type}</p>
                  </div>
                </div>
                
                {/* Payment Details */}
                {selectedRow.method.bankAccountNumber && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Account Number</p>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 font-mono">
                          {selectedRow.method.bankAccountNumber}
                        </p>
                        <button
                          onClick={() => copyToClipboard(selectedRow.method.bankAccountNumber)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <FiCopy size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {selectedRow.method.bankHolderName && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Account Holder</p>
                        <p className="font-semibold text-gray-800">{selectedRow.method.bankHolderName}</p>
                      </div>
                    )}
                    
                    {selectedRow.method.bankName && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Bank Name</p>
                        <p className="font-semibold text-gray-800">{selectedRow.method.bankName}</p>
                      </div>
                    )}
                    
                    {selectedRow.method.bankSwiftCode && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">SWIFT Code</p>
                        <p className="font-semibold text-gray-800">{selectedRow.method.bankSwiftCode}</p>
                      </div>
                    )}
                  </>
                )}
                
                {selectedRow.method.binanceWalletAddress && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Wallet Address</p>
                    <div className="bg-gray-100 p-3 rounded">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-gray-800 text-xs break-all">
                          {selectedRow.method.binanceWalletAddress}
                        </p>
                        <button
                          onClick={() => copyToClipboard(selectedRow.method.binanceWalletAddress)}
                          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                        >
                          <FiCopy size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Timeline */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">Timeline</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Requested</span>
                      <span className="font-medium">{selectedRow.createdAt.date} {selectedRow.createdAt.time}</span>
                    </div>
                    {selectedRow.processedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">
                          {selectedRow.status === "completed" ? "Completed" : "Rejected"}
                        </span>
                        <span className="font-medium">
                          {selectedRow.processedAt.date} {selectedRow.processedAt.time}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Note for pending withdrawals */}
              {selectedRow.status === "pending" && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <FiClock className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-semibold">Processing Time</p>
                      <p className="mt-1">Your withdrawal is being reviewed by the admin. You will receive an email notification once it's processed.</p>
                      <p className="mt-2 font-medium">You can cancel this request anytime before it's processed.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Note for completed withdrawals */}
              {selectedRow.status === "completed" && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <FiCheckCircle className="text-green-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-700">
                      <p className="font-semibold">Payment Sent</p>
                      <p className="mt-1">The funds have been sent to your account. Please allow 1-3 business days for the transaction to complete.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Note for rejected withdrawals */}
              {selectedRow.status === "rejected" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <FiXCircle className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-700">
                      <p className="font-semibold">Request Rejected</p>
                      <p className="mt-1">The amount has been refunded to your available balance. You can submit a new withdrawal request with corrected information.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t">
              <button
                onClick={() => setViewOpen(false)}
                className="w-full px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawMoney;