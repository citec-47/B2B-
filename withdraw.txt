import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { server } from "../../server";
import { DataGrid } from "@material-ui/data-grid";
import { BsPencil } from "react-icons/bs";
import { RxCross1 } from "react-icons/rx";
import { 
  FiEye, 
  FiRefreshCw, 
  FiCheckCircle, 
  FiXCircle, 
  FiDollarSign, 
  FiAlertCircle,
  FiFilter,
  FiDownload,
  FiSmartphone,
  FiMonitor
} from "react-icons/fi";
import { AiOutlineDelete, AiOutlineMenu } from "react-icons/ai";
import { MdOutlineNotificationsActive } from "react-icons/md";
import { toast } from "react-toastify";
import Loader from "../Layout/Loader";
import io from "socket.io-client";

// Initialize socket connection
let socket;

const AllWithdraw = () => {
  const [data, setData] = useState([]);   
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [withdrawData, setWithdrawData] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [status, setStatus] = useState("completed");
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);
  const [debugInfo, setDebugInfo] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [apiError, setApiError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);

  // Socket.IO connection for real-time updates
  useEffect(() => {
    // Initialize socket connection
    socket = io(server.replace("/api/v2", ""), {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("✅ Socket.IO connected");
      
      // Join admin room for real-time notifications
      socket.emit("join_admin_room");
    });

    socket.on("new_withdrawal", (data) => {
      console.log("🔔 New withdrawal notification:", data);
      
      // Add notification
      const newNotification = {
        id: Date.now(),
        type: "new_withdrawal",
        message: `New withdrawal request from ${data.sellerName} for $${data.amount}`,
        timestamp: new Date(),
        data: data
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      
      // Show toast notification
      toast.info(`📝 New withdrawal: ${data.sellerName} - $${data.amount}`);
      
      // Refresh data
      fetchWithdraws(true);
    });

    socket.on("withdrawal_updated", (data) => {
      console.log("🔄 Withdrawal updated notification:", data);
      
      // Add notification
      const newNotification = {
        id: Date.now(),
        type: "withdrawal_updated",
        message: `Withdrawal ${data.status}: ${data.sellerName} - $${data.amount}`,
        timestamp: new Date(),
        data: data
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      
      // Refresh data
      fetchWithdraws(true);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Notify seller about withdrawal status change via socket
  const notifySeller = async (withdrawId, action, sellerId) => {
    try {
      // Emit socket event to notify seller
      if (socket && socket.connected) {
        socket.emit("withdrawal_status_changed", {
          withdrawId,
          action,
          sellerId,
          timestamp: new Date()
        });
        console.log("📤 Sent real-time notification to seller");
      }

      // Also send via API for fallback
      await axios.post(
        `${server}/withdraw/notify-seller`,
        { withdrawId, action, sellerId },
        { withCredentials: true }
      );
    } catch (error) {
      console.error("❌ Failed to notify seller:", error);
    }
  };

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Click outside notifications handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchWithdraws = async (forceRefresh = false) => {
    try {
      setFetchLoading(true);
      setApiError(null);
      
      // Add timestamp to prevent caching
      const timestamp = forceRefresh ? Date.now() : new Date().getTime();
      const endpoint = `/withdraw/get-all-withdraw-request?_t=${timestamp}`;
      
      console.log("🔍 ADMIN: Fetching withdrawals...");
      
      const res = await axios.get(
        `${server}${endpoint}`,
        { 
          withCredentials: true,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Accept': 'application/json'
          },
          timeout: 15000
        }
      );
      
      if (res.data && res.data.success !== false) {
        const withdraws = res.data.withdraws || [];
        console.log(`✅ Loaded ${withdraws.length} withdrawal requests`);
        
        setData(withdraws);
        setLastUpdated(new Date());
        setRetryCount(0);
        
        if (withdraws.length === 0) {
          toast.info("📭 No withdrawal requests found");
        } else {
          toast.success(`✅ Loaded ${withdraws.length} withdrawal request${withdraws.length !== 1 ? 's' : ''}`);
        }
        
      } else {
        const message = res.data?.message || "API returned unexpected response";
        toast.error(`❌ ${message}`);
        setData([]);
        setApiError(message);
      }
    } catch (error) {
      console.error("❌ Fetch withdrawals error:", error);
      
      let errorMessage = "Network error occurred";
      if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = "No response from server. Check if backend is running.";
      }
      
      toast.error(`❌ ${errorMessage}`);
      setData([]);
      setApiError(errorMessage);
      
      // Auto-retry for network errors
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          toast.info(`🔄 Retrying... (${retryCount + 1}/3)`);
          fetchWithdraws(true);
        }, 3000);
      }
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdraws();
    
    // Set up auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      if (!fetchLoading && !open && !viewOpen && !methodModalOpen) {
        fetchWithdraws();
      }
    }, 30000);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  // Filter data based on status
  const filteredData = data.filter(item => {
    if (statusFilter === "all") return true;
    return item.status === statusFilter;
  });

  // Data mapping function
  const mapWithdrawToRow = (item, index) => {
    try {
      if (!item || typeof item !== 'object') return null;
      
      const dateInfo = formatDate(item.createdAt);
      const processedDateInfo = formatDate(item.processedAt || item.updatedAt);
      
      // Extract method details
      const method = item.withdrawMethod || {};
      let methodType = "Unknown";
      let methodDetails = "";
      
      if (method.type) {
        methodType = method.type;
        if (method.type === "bank") {
          methodType = "Bank Transfer";
          methodDetails = method.bankAccountNumber ? `****${method.bankAccountNumber.slice(-4)}` : "";
        } else if (method.type === "binance") {
          methodType = "Binance";
          const addr = method.binanceWalletAddress || "";
          methodDetails = addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
        }
      } else if (method.bankAccountNumber) {
        methodType = "Bank Transfer";
        methodDetails = method.bankAccountNumber ? `****${method.bankAccountNumber.slice(-4)}` : "";
      } else if (method.binanceWalletAddress) {
        methodType = "Binance";
        const addr = method.binanceWalletAddress || "";
        methodDetails = addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
      }
      
      // Extract seller info
      let shopName = "Unknown Seller";
      let sellerEmail = "No email";
      let sellerId = null;
      
      if (item.seller) {
        if (typeof item.seller === 'object') {
          shopName = item.seller.name || item.seller.shopName || "Unknown Shop";
          sellerEmail = item.seller.email || "No email";
          sellerId = item.seller._id;
        } else if (typeof item.seller === 'string') {
          shopName = `Seller (${item.seller.substring(0, 8)}...)`;
          sellerId = item.seller;
        }
      }
      
      // Format amount
      let amountFormatted = "$0.00";
      let amountValue = 0;
      if (item.amount) {
        amountValue = parseFloat(item.amount);
        if (!isNaN(amountValue)) {
          amountFormatted = `$${amountValue.toFixed(2)}`;
        }
      }
      
      // Determine status
      let statusValue = (item.status || "pending").toLowerCase();
      
      return {
        id: item._id || `withdraw-${index}-${Date.now()}`,
        shopName: shopName,
        sellerEmail: sellerEmail,
        sellerId: sellerId,
        amount: amountFormatted,
        amountValue: amountValue,
        method: {
          type: methodType,
          details: methodDetails,
          bankAccountNumber: method.bankAccountNumber,
          binanceWalletAddress: method.binanceWalletAddress,
          bankHolderName: method.bankHolderName,
          bankName: method.bankName,
          bankSwiftCode: method.bankSwiftCode,
          bankCountry: method.bankCountry,
          bankAddress: method.bankAddress,
        },
        status: statusValue,
        createdAt: dateInfo,
        processedAt: processedDateInfo,
        adminNote: item.adminNote || "",
        raw: item,
      };
      
    } catch (error) {
      console.error(`❌ Error mapping item:`, error);
      return null;
    }
  };

  // Method Details Modal
  const MethodDetailsModal = () => {
    if (!selectedMethod) return null;
    
    const method = selectedMethod;
    const isBank = method.type === "Bank Transfer" || method.bankAccountNumber;
    const isBinance = method.type === "Binance" || method.binanceWalletAddress;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className={`bg-white rounded-2xl w-full max-w-lg shadow-2xl ${
          isMobile ? "max-h-[90vh] overflow-y-auto" : ""
        }`}>
          <div className="sticky top-0 bg-white flex items-center justify-between p-4 md:p-6 border-b z-10">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">
              {isBank ? "🏦 Bank Transfer Details" : "💳 Binance Details"}
            </h2>
            <button
              onClick={() => {
                setMethodModalOpen(false);
                setSelectedMethod(null);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <RxCross1 size={isMobile ? 20 : 24} />
            </button>
          </div>
          
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Method Type Badge */}
            <div className={`p-3 rounded-lg ${isBank ? "bg-blue-50 border border-blue-200" : "bg-yellow-50 border border-yellow-200"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isBank ? "bg-blue-100" : "bg-yellow-100"}`}>
                  {isBank ? "🏦" : "💳"}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    {isBank ? "Bank Transfer" : "Binance Wallet"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Withdrawal payment method
                  </p>
                </div>
              </div>
            </div>
            
            {/* Details Section */}
            <div className="space-y-4 md:space-y-6">
              {isBank ? (
                <>
                  {method.bankHolderName && (
                    <div className="border-b border-gray-100 pb-3">
                      <p className="text-sm text-gray-500 mb-1">Account Holder</p>
                      <p className="font-semibold text-gray-800 text-base md:text-lg">
                        {method.bankHolderName}
                      </p>
                    </div>
                  )}
                  
                  {method.bankName && (
                    <div className="border-b border-gray-100 pb-3">
                      <p className="text-sm text-gray-500 mb-1">Bank Name</p>
                      <p className="font-semibold text-gray-800 text-base md:text-lg">
                        {method.bankName}
                      </p>
                    </div>
                  )}
                  
                  {method.bankAccountNumber && (
                    <div className="border-b border-gray-100 pb-3">
                      <p className="text-sm text-gray-500 mb-1">Account Number</p>
                      <p className="font-mono font-semibold text-gray-800 text-base md:text-lg">
                        {method.bankAccountNumber}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Complete account number for reference
                      </p>
                    </div>
                  )}
                  
                  {method.bankSwiftCode && (
                    <div className="border-b border-gray-100 pb-3">
                      <p className="text-sm text-gray-500 mb-1">SWIFT/BIC Code</p>
                      <p className="font-semibold text-gray-800 text-base md:text-lg">
                        {method.bankSwiftCode}
                      </p>
                    </div>
                  )}
                  
                  {method.bankCountry && (
                    <div className="border-b border-gray-100 pb-3">
                      <p className="text-sm text-gray-500 mb-1">Bank Country</p>
                      <p className="font-semibold text-gray-800 text-base md:text-lg">
                        {method.bankCountry}
                      </p>
                    </div>
                  )}
                  
                  {method.bankAddress && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Bank Address</p>
                      <p className="font-semibold text-gray-800 text-sm md:text-base">
                        {method.bankAddress}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {method.binanceWalletAddress && (
                    <div className="border-b border-gray-100 pb-3">
                      <p className="text-sm text-gray-500 mb-1">Wallet Address</p>
                      <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                        <p className="font-mono font-semibold text-gray-800 text-sm md:text-base break-all">
                          {method.binanceWalletAddress}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Full Binance wallet address for crypto transfer
                      </p>
                    </div>
                  )}
                  
                  {/* Additional Binance info if available */}
                  {method.binanceHolderName && (
                    <div className="border-b border-gray-100 pb-3">
                      <p className="text-sm text-gray-500 mb-1">Account Holder</p>
                      <p className="font-semibold text-gray-800 text-base md:text-lg">
                        {method.binanceHolderName}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Security Note */}
            <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-2">
                <FiAlertCircle className="text-gray-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">Note:</span> This information is displayed for admin review purposes only. 
                  Please verify all details before processing the withdrawal.
                </p>
              </div>
            </div>
          </div>
          
          <div className="sticky bottom-0 bg-white flex justify-end p-4 md:p-6 border-t">
            <button
              onClick={() => {
                setMethodModalOpen(false);
                setSelectedMethod(null);
              }}
              className="px-4 py-2 md:px-6 md:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Mobile optimized columns
  const mobileColumns = [
    { 
      field: "shopName", 
      headerName: "Seller", 
      minWidth: 120,
      flex: 1,
      renderCell: (params) => (
        <div className="flex flex-col">
          <p className="font-semibold text-gray-800 text-sm truncate">
            {params.value || "Unknown"}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {params.row.amount}
          </p>
        </div>
      )
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 80,
      flex: 0.7,
      renderCell: (params) => {
        const statusValue = params.value || "pending";
        let statusConfig = {
          text: "U",
          class: "bg-gray-100 text-gray-800"
        };
        
        switch(statusValue) {
          case "pending":
            statusConfig = { text: "P", class: "bg-yellow-100 text-yellow-800" };
            break;
          case "completed":
            statusConfig = { text: "C", class: "bg-green-100 text-green-800" };
            break;
          case "rejected":
            statusConfig = { text: "R", class: "bg-red-100 text-red-800" };
            break;
        }
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusConfig.class}`}>
            {statusConfig.text}
          </span>
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 80,
      flex: 0.5,
      renderCell: (params) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewDetails(params.row)}
            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
            title="View Details"
          >
            <FiEye size={14} />
          </button>
        </div>
      ),
    },
  ];

  // Desktop columns
  const desktopColumns = [
    { 
      field: "id", 
      headerName: "ID", 
      minWidth: 80, 
      flex: 0.6,
      renderCell: (params) => (
        <div className="font-mono">
          <span className="text-xs font-medium">
            {params.value?.substring(0, 6) || "N/A"}
          </span>
        </div>
      )
    },
    { 
      field: "shopName", 
      headerName: "Seller", 
      minWidth: 180, 
      flex: 1.5,
      renderCell: (params) => (
        <div className="flex flex-col">
          <p className="font-semibold text-gray-800 truncate">{params.value || "Unknown"}</p>
          <p className="text-xs text-gray-500 truncate">{params.row.sellerEmail || "No email"}</p>
        </div>
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
          <span className="font-bold text-green-600">{params.value || "$0.00"}</span>
        </div>
      )
    },
    {
      field: "method",
      headerName: "Method",
      minWidth: 140,
      flex: 1,
      renderCell: (params) => {
        const method = params.value || {};
        const methodType = method.type || "Unknown";
        
        const handleClick = () => {
          setSelectedMethod(method);
          setMethodModalOpen(true);
        };
        
        return (
          <div 
            onClick={handleClick}
            className="flex flex-col cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors w-full"
            title="Click to view full details"
          >
            <div className="flex items-center gap-2">
              <span className={`font-medium capitalize text-gray-800 text-sm ${methodType === "Bank Transfer" ? "text-blue-600" : "text-yellow-600"}`}>
                {methodType === "Bank Transfer" ? "🏦 " : "💳 "}
                {methodType.replace(/_/g, ' ')}
              </span>
              <span className="text-blue-500 text-xs">(view)</span>
            </div>
            {method.details && (
              <p className="text-xs text-gray-600 truncate mt-1">
                {method.details}
              </p>
            )}
            {!method.details && (
              <p className="text-xs text-gray-500 italic mt-1">
                Click to view payment details
              </p>
            )}
          </div>
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 100,
      flex: 0.7,
      renderCell: (params) => {
        const statusValue = params.value || "pending";
        let statusConfig = {
          text: "Unknown",
          class: "bg-gray-100 text-gray-800 border-gray-200"
        };
        
        switch(statusValue) {
          case "pending":
            statusConfig = { 
              text: "Pending", 
              class: "bg-yellow-100 text-yellow-800 border-yellow-200" 
            };
            break;
          case "completed":
            statusConfig = { 
              text: "Completed", 
              class: "bg-green-100 text-green-800 border-green-200" 
            };
            break;
          case "rejected":
            statusConfig = { 
              text: "Rejected", 
              class: "bg-red-100 text-red-800 border-red-200" 
            };
            break;
        }
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusConfig.class}`}>
            {isMobile ? statusConfig.text.substring(0, 1) : statusConfig.text}
          </span>
        );
      },
    },
    {
      field: "createdAt",
      headerName: "Requested",
      minWidth: 120,
      flex: 1,
      renderCell: (params) => {
        const dateInfo = params.value || { date: "N/A", time: "" };
        return (
          <div className="flex flex-col">
            <p className="text-sm font-medium text-gray-800">{dateInfo.date}</p>
            {!isMobile && (
              <p className="text-xs text-gray-500">{dateInfo.time}</p>
            )}
          </div>
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 140,
      flex: 1,
      renderCell: (params) => {
        const row = params.row;
        const isPending = row.status === "pending";
        
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleViewDetails(row)}
              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
              title="View Details"
            >
              <FiEye size={16} />
            </button>
            
            {isPending && (
              <>
                <button
                  onClick={() => handleEditWithdraw(row)}
                  className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all"
                  title="Update Status"
                >
                  <BsPencil size={16} />
                </button>
                
                <button
                  onClick={() => handleDeleteWithdraw(row)}
                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                  title="Delete Request"
                >
                  <AiOutlineDelete size={16} />
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const handleEditWithdraw = (row) => {
    if (row.raw) {
      setWithdrawData(row.raw);
      setStatus(row.status === "pending" ? "completed" : row.status);
      setAdminNote(row.adminNote || "");
      setOpen(true);
    } else {
      toast.error("Invalid withdraw data");
    }
  };

  const handleViewDetails = (row) => {
    setSelectedRow(row);
    setViewOpen(true);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleDeleteWithdraw = async (row) => {
    if (!window.confirm(`Delete ${row.shopName}'s $${row.amountValue} withdrawal?`)) {
      return;
    }

    setLoading(true);
    try {
      const endpoint = `/withdraw/delete-withdraw-request/${row.id}`;
      const response = await axios.delete(
        `${server}${endpoint}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success("✅ Withdrawal deleted!");
        
        // Notify seller
        if (row.sellerId) {
          await notifySeller(row.id, "deleted", row.sellerId);
        }
        
        fetchWithdraws();
      } else {
        toast.error(response.data.message || "Failed to delete");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to delete";
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!status) {
      toast.error("Please select a status");
      return;
    }

    if (!withdrawData || !withdrawData._id) {
      toast.error("Invalid withdraw data");
      return;
    }

    setLoading(true);
    try {
      const endpoint = `/withdraw/update-withdraw-request/${withdrawData._id}`;
      const response = await axios.put(
        `${server}${endpoint}`,
        { status, adminNote: adminNote.trim() },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success(`✅ Withdrawal ${status} successfully!`);
        
        // Notify seller in real-time
        if (withdrawData.seller && withdrawData.seller._id) {
          await notifySeller(withdrawData._id, status, withdrawData.seller._id);
        }
        
        setOpen(false);
        fetchWithdraws();
        setWithdrawData(null);
        setAdminNote("");
      } else {
        toast.error(response.data.message || "Failed to update");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update";
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return { date: "N/A", time: "" };
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return { date: "Invalid", time: "" };
      }
      
      if (isMobile) {
        return {
          date: date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          time: date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          })
        };
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
        })
      };
    } catch (error) {
      return { date: "Invalid", time: "" };
    }
  };

  const rows = filteredData.map(mapWithdrawToRow).filter(row => row !== null);
  const totalAmount = rows.reduce((sum, row) => sum + row.amountValue, 0);
  const pendingCount = data.filter(item => item.status === "pending").length;
  const completedCount = data.filter(item => item.status === "completed").length;

  // Mobile stats view
  const MobileStats = () => (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600">Total</p>
            <p className="text-xl font-bold text-gray-800">{rows.length}</p>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <span className="text-lg">📋</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600">Pending</p>
            <p className="text-xl font-bold text-yellow-600">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
            <span className="text-lg">⏳</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600">Amount</p>
            <p className="text-xl font-bold text-green-600">${totalAmount.toFixed(2)}</p>
          </div>
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
            <FiDollarSign className="text-lg text-green-600" />
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600">Device</p>
            <p className="text-xs font-bold text-gray-800 flex items-center gap-1">
              {isMobile ? <FiSmartphone /> : <FiMonitor />}
              {isMobile ? "Mobile" : "Desktop"}
            </p>
          </div>
          <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600"
            >
              <AiOutlineMenu size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (fetchLoading) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center p-4">
        <Loader />
        <p className="mt-6 text-lg text-gray-700 font-medium">Loading...</p>
        <p className="text-sm text-gray-500">Retry: {retryCount + 1}/3</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {isMobile && (
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg bg-gray-100"
            >
              <AiOutlineMenu size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Withdrawals</h1>
              <p className="text-xs text-gray-500">
                {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-gray-100"
            >
              <MdOutlineNotificationsActive size={20} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => fetchWithdraws(true)}
              className="p-2 rounded-lg bg-blue-600 text-white"
            >
              <FiRefreshCw size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Withdrawal Requests</h1>
              <p className="text-gray-600 mt-1">Manage seller withdrawal requests</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                Last: {lastUpdated.toLocaleTimeString()}
              </div>
              
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <MdOutlineNotificationsActive size={20} />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
                
                {showNotifications && notifications.length > 0 && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-bold text-gray-800">Notifications ({notifications.length})</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {notifications.map(notification => (
                        <div key={notification.id} className="p-4 hover:bg-gray-50">
                          <p className="text-sm text-gray-800">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))}
                    </div>
                    {notifications.length > 5 && (
                      <div className="p-3 border-t border-gray-200">
                        <button
                          onClick={() => setNotifications([])}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Clear All
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => fetchWithdraws(true)}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 font-medium"
              >
                <FiRefreshCw className={fetchLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-800">Filters</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <RxCross1 size={18} />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Status Filter</label>
                <div className="space-y-2">
                  {["all", "pending", "completed", "rejected"].map(filter => (
                    <button
                      key={filter}
                      onClick={() => {
                        setStatusFilter(filter);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm capitalize ${
                        statusFilter === filter 
                          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {filter} {filter !== "all" && `(${data.filter(d => d.status === filter).length})`}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => {
                    toast.info("Export feature coming soon!");
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <FiDownload /> Export CSV
                </button>
                
                {apiError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                      <FiAlertCircle />
                      <span className="text-sm">Error: {apiError}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 md:p-6">
        {/* Mobile Stats */}
        {isMobile && <MobileStats />}
        
        {/* Desktop Stats */}
        {!isMobile && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{rows.length}</p>
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
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⏳</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{completedCount}</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">${totalAmount.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <FiDollarSign className="text-2xl text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters - Desktop */}
        {!isMobile && (
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                <FiFilter className="text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent outline-none text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <span className="text-sm text-gray-600">
                Showing {rows.length} of {data.length} requests
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => toast.info("Export feature coming soon!")}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
              >
                <FiDownload /> Export
              </button>
            </div>
          </div>
        )}

        {/* Data Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {rows.length === 0 ? (
            <div className="p-8 md:p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl mb-4 md:mb-6">
                <span className="text-4xl md:text-5xl">💸</span>
              </div>
              
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4">
                No Withdrawal Requests Found
              </h3>
              
              <p className="text-gray-600 mb-6 max-w-md mx-auto px-4">
                {apiError 
                  ? `Error: ${apiError}`
                  : "When sellers submit withdrawal requests, they will appear here."}
              </p>
              
              <div className="max-w-md mx-auto">
                <div className={`p-4 md:p-6 rounded-xl ${apiError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} border`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                      apiError ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      {apiError ? (
                        <span className="text-red-600">✗</span>
                      ) : (
                        <span className="text-green-600">✓</span>
                      )}
                    </div>
                    <div className="text-left">
                      <h4 className={`font-bold ${apiError ? 'text-red-800' : 'text-green-800'}`}>
                        {apiError ? 'System Error' : 'System Normal'}
                      </h4>
                      <p className={`text-sm ${apiError ? 'text-red-600' : 'text-green-600'}`}>
                        {apiError ? apiError : 'API is working correctly'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={isMobile ? "h-[calc(100vh-250px)]" : "h-[calc(100vh-380px)] min-h-[500px]"}>
              <DataGrid
                rows={rows}
                columns={isMobile ? mobileColumns : desktopColumns}
                pageSize={isMobile ? 8 : 10}
                rowsPerPageOptions={isMobile ? [8, 15, 30] : [10, 25, 50]}
                pagination
                loading={fetchLoading}
                disableSelectionOnClick
                density={isMobile ? "compact" : "standard"}
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
                    padding: isMobile ? "8px 12px" : "12px 16px",
                    fontSize: isMobile ? "13px" : "14px",
                  },
                  "& .MuiDataGrid-cell:focus": {
                    outline: "none",
                  },
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: "#f8fafc",
                    borderBottom: "2px solid #e2e8f0",
                    fontSize: isMobile ? "12px" : "14px",
                    fontWeight: "600",
                    color: "#374151",
                  },
                  "& .MuiDataGrid-footerContainer": {
                    borderTop: "1px solid #e5e7eb",
                    backgroundColor: "#f8fafc",
                    fontSize: isMobile ? "12px" : "14px",
                  },
                  "& .MuiDataGrid-row:hover": {
                    backgroundColor: "#f9fafb",
                  },
                }}
              />
            </div>
          )}
        </div>
        
        {/* Mobile Bottom Bar */}
        {isMobile && rows.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex items-center justify-between z-30">
            <div className="text-sm text-gray-600">
              {rows.length} request{rows.length !== 1 ? 's' : ''}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1.5 text-xs rounded-lg ${
                  statusFilter === "pending" 
                    ? "bg-yellow-100 text-yellow-800 border border-yellow-200" 
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Pending
              </button>
              
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 text-xs rounded-lg ${
                  statusFilter === "all" 
                    ? "bg-blue-100 text-blue-800 border border-blue-200" 
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Method Details Modal */}
      {methodModalOpen && <MethodDetailsModal />}

      {/* Update Withdraw Modal - Mobile Optimized */}
      {open && withdrawData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`bg-white rounded-2xl w-full max-w-lg shadow-2xl ${
            isMobile ? "max-h-[90vh] overflow-y-auto" : ""
          }`}>
            <div className="sticky top-0 bg-white flex items-center justify-between p-4 md:p-6 border-b z-10">
              <h2 className="text-lg md:text-xl font-bold text-gray-900">Process Withdrawal</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                disabled={loading}
              >
                <RxCross1 size={isMobile ? 20 : 24} />
              </button>
            </div>
            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 md:p-5 rounded-xl border border-blue-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Seller</p>
                    <p className="font-bold text-gray-900 text-base md:text-lg">
                      {withdrawData.seller?.name || withdrawData.seller?.shopName || "Unknown"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 font-medium">Amount</p>
                    <p className="text-2xl md:text-3xl font-bold text-green-600">
                      ${withdrawData.amount?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Select Action *</label>
                <div className={`grid ${isMobile ? "grid-cols-1 gap-3" : "grid-cols-2 gap-4"}`}>
                  <div 
                    className={`p-4 md:p-5 rounded-xl border-2 cursor-pointer transition-all ${status === "completed" 
                      ? "border-green-500 bg-green-50" 
                      : "border-gray-200 hover:border-green-300 bg-white"}`}
                    onClick={() => setStatus("completed")}
                  >
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center ${status === "completed" 
                        ? "border-green-500 bg-green-500" 
                        : "border-gray-300"}`}
                      >
                        {status === "completed" && <FiCheckCircle className="text-white" size={isMobile ? 12 : 14} />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-green-700 text-sm md:text-base">Approve</p>
                        <p className="text-xs text-gray-600 mt-1">Process payment to seller</p>
                      </div>
                    </div>
                  </div>
                  <div 
                    className={`p-4 md:p-5 rounded-xl border-2 cursor-pointer transition-all ${status === "rejected" 
                      ? "border-red-500 bg-red-50" 
                      : "border-gray-200 hover:border-red-300 bg-white"}`}
                    onClick={() => setStatus("rejected")}
                  >
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center ${status === "rejected" 
                        ? "border-red-500 bg-red-500" 
                        : "border-gray-300"}`}
                      >
                        {status === "rejected" && <FiXCircle className="text-white" size={isMobile ? 12 : 14} />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-red-700 text-sm md:text-base">Reject</p>
                        <p className="text-xs text-gray-600 mt-1">Refund to seller balance</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Admin Note {status === "rejected" && <span className="text-red-600 ml-2">(Required)</span>}
                </label>
                <textarea
                  placeholder={status === "rejected" 
                    ? "Explain why this withdrawal is being rejected..." 
                    : "Add optional notes for the seller..."}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 md:p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[100px] md:min-h-[120px] resize-none text-sm md:text-base"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white flex justify-end gap-3 md:gap-4 p-4 md:p-6 border-t bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 md:px-6 md:py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm md:text-base"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={loading || (status === "rejected" && !adminNote.trim())}
                className={`px-5 py-2 md:px-8 md:py-3 rounded-xl text-white font-medium transition-all text-sm md:text-base ${
                  status === "completed" 
                    ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800" 
                    : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                } ${loading || (status === "rejected" && !adminNote.trim()) ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <FiRefreshCw className="animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {status === "completed" ? <FiCheckCircle /> : <FiXCircle />}
                    {isMobile ? (status === "completed" ? "Approve" : "Reject") : (status === "completed" ? "Approve Payment" : "Reject Request")}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal - Mobile Optimized */}
      {viewOpen && selectedRow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`bg-white rounded-2xl w-full max-w-2xl ${
            isMobile ? "max-h-[90vh] overflow-y-auto" : "max-h-[90vh] overflow-y-auto"
          }`}>
            <div className="sticky top-0 bg-white flex items-center justify-between p-4 md:p-6 border-b z-10">
              <h2 className="text-lg md:text-xl font-bold text-gray-900">Withdrawal Details</h2>
              <button
                onClick={() => setViewOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <RxCross1 size={isMobile ? 20 : 24} />
              </button>
            </div>
            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              <div className={`p-4 md:p-5 rounded-xl ${selectedRow.status === "pending" 
                ? "bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200" 
                : selectedRow.status === "completed" 
                ? "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200" 
                : "bg-gradient-to-r from-red-50 to-rose-50 border border-red-200"}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg md:text-xl">
                      {selectedRow.status === "pending" && "⏳ Pending Review"}
                      {selectedRow.status === "completed" && "✅ Payment Completed"}
                      {selectedRow.status === "rejected" && "❌ Request Rejected"}
                    </h3>
                    <p className="text-gray-600 mt-1 text-sm">ID: {selectedRow.id?.substring(0, 12)}...</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl md:text-3xl font-bold text-green-600">{selectedRow.amount}</p>
                    <p className="text-gray-600 text-sm">{selectedRow.createdAt.date}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-gray-50 p-4 md:p-5 rounded-xl">
                  <h4 className="font-bold text-gray-700 mb-3 md:mb-4">Seller Information</h4>
                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Shop Name</p>
                      <p className="font-semibold text-gray-800 text-base md:text-lg">{selectedRow.shopName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="font-semibold text-gray-800 text-sm md:text-base">{selectedRow.sellerEmail}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 md:p-5 rounded-xl">
                  <h4 className="font-bold text-gray-700 mb-3 md:mb-4">Payment Method</h4>
                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-semibold text-gray-800 capitalize text-base md:text-lg">
                        {selectedRow.method.type}
                        <button
                          onClick={() => {
                            setViewOpen(false);
                            setTimeout(() => {
                              setSelectedMethod(selectedRow.method);
                              setMethodModalOpen(true);
                            }, 300);
                          }}
                          className="ml-2 text-blue-600 text-sm hover:text-blue-800"
                        >
                          (view full details)
                        </button>
                      </p>
                    </div>
                    
                    {/* Show basic info in view modal */}
                    {selectedRow.method.bankAccountNumber && (
                      <div>
                        <p className="text-sm text-gray-500">Account Number</p>
                        <p className="font-semibold text-gray-800 text-sm md:text-base">
                          {selectedRow.method.bankAccountNumber}
                        </p>
                      </div>
                    )}
                    
                    {selectedRow.method.bankHolderName && (
                      <div>
                        <p className="text-sm text-gray-500">Account Holder</p>
                        <p className="font-semibold text-gray-800 text-sm md:text-base">
                          {selectedRow.method.bankHolderName}
                        </p>
                      </div>
                    )}
                    
                    {selectedRow.method.bankName && (
                      <div>
                        <p className="text-sm text-gray-500">Bank Name</p>
                        <p className="font-semibold text-gray-800 text-sm md:text-base">
                          {selectedRow.method.bankName}
                        </p>
                      </div>
                    )}
                    
                    {selectedRow.method.binanceWalletAddress && (
                      <div>
                        <p className="text-sm text-gray-500">Wallet Address</p>
                        <div className="bg-gray-100 p-2 rounded">
                          <p className="font-mono text-gray-800 text-xs break-all">
                            {selectedRow.method.binanceWalletAddress}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedRow.adminNote && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-bold text-blue-800 mb-2">Admin Note</h4>
                  <p className="text-blue-700 text-sm md:text-base">{selectedRow.adminNote}</p>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white flex justify-between items-center p-4 md:p-6 border-t">
              <div className="flex gap-2 md:gap-3">
                {selectedRow.status === "pending" && (
                  <button
                    onClick={() => {
                      setViewOpen(false);
                      setTimeout(() => handleEditWithdraw(selectedRow), 300);
                    }}
                    className="px-4 py-2 md:px-6 md:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium text-sm md:text-base"
                  >
                    {isMobile ? "Process" : "Process Request"}
                  </button>
                )}
                <button
                  onClick={() => setViewOpen(false)}
                  className="px-4 py-2 md:px-6 md:py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm md:text-base"
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