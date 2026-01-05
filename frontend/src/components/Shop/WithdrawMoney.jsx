import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllOrdersOfShop } from "../../redux/actions/order";
import styles from "../../styles/styles";
import { RxCross1 } from "react-icons/rx";
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";
import { loadSeller } from "../../redux/actions/user";
import { AiOutlineDelete } from "react-icons/ai";
import { 
  FiCheckCircle, 
  FiBell, 
  FiRefreshCw, 
  FiDollarSign, 
  FiCreditCard, 
  FiShoppingBag
} from "react-icons/fi";
import { TbBuildingBank } from "react-icons/tb";
import { FaWallet } from "react-icons/fa";

const WithdrawMoney = () => {
  const [open, setOpen] = useState(false);
  const [openAddMethod, setOpenAddMethod] = useState(false);
  const dispatch = useDispatch();
  const { seller } = useSelector((state) => state.seller);
  const [withdrawAmount, setWithdrawAmount] = useState(50);
  const [binanceInfo, setBinanceInfo] = useState({
    binanceWalletAddress: "",
  });
  const [bankInfo, setBankInfo] = useState({
    bankName: "",
    bankCountry: "",
    bankSwiftCode: "",
    bankAccountNumber: "",
    bankHolderName: "",
    bankAddress: "",
  });
  const [withdrawMethodType, setWithdrawMethodType] = useState("bank");
  const [loading, setLoading] = useState(false);
  const [requestHistory, setRequestHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const lastUpdateRef = useRef(null);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Handle window resize for responsive detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    dispatch(getAllOrdersOfShop(seller?._id));
    fetchWithdrawHistory();
    
    // Set up polling for updates every 30 seconds
    const interval = setInterval(() => {
      checkForUpdates();
    }, 30000);
    
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [dispatch, seller?._id]);

  // Check for updates (real-time simulation)
  const checkForUpdates = async () => {
    try {
      const endpoint = "/withdraw/get-seller-withdraws";
      const res = await axios.get(
        `${server}${endpoint}`,
        { 
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (res.data.success) {
        const newHistory = res.data.withdraws || [];
        
        // Check if status of any pending request has changed
        const oldPending = requestHistory.filter(r => r.status === "pending");
        const newPending = newHistory.filter(r => r.status === "pending");
        
        // If a pending request disappeared (was processed), show notification
        if (oldPending.length > newPending.length) {
          setHasNewUpdate(true);
          toast.info("📢 Your withdrawal status has been updated!");
        }
        
        // Check for any status changes
        requestHistory.forEach(oldReq => {
          const newReq = newHistory.find(r => r._id === oldReq._id);
          if (newReq && oldReq.status !== newReq.status) {
            setHasNewUpdate(true);
            const statusMsg = newReq.status === "completed" ? "approved" : "rejected";
            toast.success(`✅ Your withdrawal has been ${statusMsg}!`);
          }
        });
        
        setRequestHistory(newHistory);
      }
    } catch (error) {
      console.error("❌ Update check error:", error);
    }
  };

  // Fetch withdraw history
  const fetchWithdrawHistory = async () => {
    try {
      const endpoint = "/withdraw/get-seller-withdraws";
      
      const res = await axios.get(
        `${server}${endpoint}`,
        { 
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (res.data.success) {
        const newHistory = res.data.withdraws || [];
        
        // Check for updates
        if (lastUpdateRef.current && newHistory.length > 0) {
          const lastReq = newHistory[0];
          if (lastReq._id !== lastUpdateRef.current) {
            setHasNewUpdate(true);
          }
        }
        
        if (newHistory.length > 0) {
          lastUpdateRef.current = newHistory[0]._id;
        }
        
        setRequestHistory(newHistory);
      }
    } catch (error) {
      console.error("❌ Fetch withdraw history error:", error);
    }
  };

  const availableBalance = seller?.availableBalance?.toFixed(2) || "0.00";
  const hasWithdrawMethod = seller?.withdrawMethod && Object.keys(seller.withdrawMethod).length > 0;
  const pendingRequests = requestHistory.filter(req => req.status === "pending");
  const hasPendingRequests = pendingRequests.length > 0;

  // Add withdraw method
  const handleAddWithdrawMethod = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    let withdrawMethod = {};
    
    if (withdrawMethodType === "bank") {
      withdrawMethod = {
        type: "bank",
        bankName: bankInfo.bankName,
        bankCountry: bankInfo.bankCountry,
        bankSwiftCode: bankInfo.bankSwiftCode,
        bankAccountNumber: bankInfo.bankAccountNumber,
        bankHolderName: bankInfo.bankHolderName,
        bankAddress: bankInfo.bankAddress,
      };
    } else {
      withdrawMethod = {
        type: "binance",
        binanceWalletAddress: binanceInfo.binanceWalletAddress,
      };
    }

    try {
      const endpoint = "/shop/update-payment-methods";
      const response = await axios.put(
        `${server}${endpoint}`,
        { withdrawMethod },
        { 
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (response.data.success) {
        toast.success("✅ Withdraw method added successfully!");
        dispatch(loadSeller());
        setOpenAddMethod(false);
        resetForms();
        setTimeout(() => setOpen(true), 500);
      } else {
        toast.error(response.data.message || "Failed to add withdraw method!");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to add withdraw method!";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Delete withdraw method
  const deleteHandler = async () => {
    if (!window.confirm("Are you sure you want to delete your withdrawal method?")) {
      return;
    }

    setLoading(true);
    try {
      const endpoint = "/shop/delete-withdraw-method";
      const response = await axios.delete(
        `${server}${endpoint}`,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (response.data.success) {
        toast.success("✅ Withdraw method deleted successfully!");
        dispatch(loadSeller());
      } else {
        toast.error(response.data.message || "Failed to delete withdraw method!");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to delete withdraw method!";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Submit withdraw request
  const withdrawHandler = async () => {
    if (!hasWithdrawMethod) {
      toast.error("Please add a withdrawal method first!");
      setOpenAddMethod(true);
      return;
    }

    if (hasPendingRequests) {
      toast.error("You have pending withdrawal requests. Please wait for them to be processed.");
      return;
    }

    const amount = parseFloat(withdrawAmount);
    const balance = parseFloat(availableBalance);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount!");
      return;
    }

    if (amount < 50) {
      toast.error("Minimum withdrawal amount is $50!");
      return;
    }

    if (amount > balance) {
      toast.error("Insufficient balance!");
      return;
    }

    setLoading(true);

    try {
      const endpoint = seller.withdrawMethod.type === "bank" 
        ? "/withdraw/create-withdraw-request" 
        : "/withdraw/create-withdraw-request-binance";
      
      const response = await axios.post(
        `${server}${endpoint}`,
        { amount },
        { 
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );
      
      if (response.data.success) {
        toast.success("✅ Withdrawal request submitted successfully!");
        setOpen(false);
        dispatch(loadSeller());
        fetchWithdrawHistory();
        setWithdrawAmount(50);
      } else {
        toast.error(response.data.message || "Withdrawal request failed!");
      }
    } catch (error) {
      let errorMessage = "Withdrawal request failed! ";
      
      if (error.response) {
        if (error.response.data?.message) {
          errorMessage += error.response.data.message;
        } else if (error.response.status === 401) {
          errorMessage += "Please login again.";
        } else if (error.response.status === 404) {
          errorMessage += "Endpoint not found.";
        }
      } else if (error.request) {
        errorMessage += "No response from server.";
      } else {
        errorMessage += error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
    setBankInfo({
      bankName: "",
      bankCountry: "",
      bankSwiftCode: "",
      bankAccountNumber: "",
      bankHolderName: "",
      bankAddress: "",
    });
    setBinanceInfo({
      binanceWalletAddress: "",
    });
  };

  const getMethodDisplay = () => {
    if (!hasWithdrawMethod) return "Not set";
    
    const method = seller.withdrawMethod;
    if (method.type === "bank") {
      const last4 = method.bankAccountNumber ? method.bankAccountNumber.slice(-4) : "****";
      return `Bank Transfer (****${last4})`;
    } else if (method.type === "binance") {
      const address = method.binanceWalletAddress || "";
      const shortAddr = address.length > 10 
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : address;
      return `Binance (${shortAddr})`;
    }
    return "Unknown";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      
      if (isMobile) {
        // Mobile format: "Jan 15, 10:30 AM"
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }) + ", " + date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
      }
      
      // Desktop/Tablet format: "Jan 15, 2024 10:30 AM"
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Manual refresh
  const handleManualRefresh = () => {
    fetchWithdrawHistory();
    setHasNewUpdate(false);
    toast.info("🔄 Refreshing withdrawal history...");
  };

  if (!seller) {
    return (
      <div className="w-full h-[90vh] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading seller information...</p>
        </div>
      </div>
    );
  }

  // Responsive helper functions
  const getContainerPadding = () => {
    if (isMobile) return 'px-3 sm:px-4';
    if (isTablet) return 'px-4 md:px-6';
    return 'px-4 md:px-8 lg:px-12';
  };

  const getCardPadding = () => {
    if (isMobile) return 'p-4';
    if (isTablet) return 'p-5';
    return 'p-6';
  };

  const getModalWidth = () => {
    if (isMobile) return 'w-full max-w-md';
    if (isTablet) return 'w-full max-w-lg';
    return 'w-full max-w-2xl';
  };

  const getModalPadding = () => {
    if (isMobile) return 'p-4';
    if (isTablet) return 'p-6';
    return 'p-8';
  };

  return (
    <div className={`w-full min-h-[90vh] ${getContainerPadding()} py-4 md:py-6`}>
      <div className="w-full bg-white h-full rounded-xl md:rounded-2xl flex flex-col shadow-sm overflow-hidden">
        {/* Header with notification badge */}
        <div className={`${getCardPadding()} border-b border-gray-200`}>
          <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-3 md:gap-4">
            <div className="flex-1">
              <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} ${isTablet ? 'md:text-3xl' : 'lg:text-3xl'} font-bold text-gray-800 mb-1`}>
                Withdraw Funds
              </h1>
              <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-600`}>
                Manage your earnings and withdrawal requests
              </p>
            </div>
            
            {/* Notification and refresh buttons */}
            <div className="flex items-center gap-2 self-start">
              {hasNewUpdate && (
                <button
                  onClick={() => {
                    setHasNewUpdate(false);
                    setShowHistory(true);
                  }}
                  className="relative p-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
                  title="New updates available"
                >
                  <FiBell size={isMobile ? 18 : 20} />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
              )}
              
              <button
                onClick={handleManualRefresh}
                className="p-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                title="Refresh"
              >
                <FiRefreshCw size={isMobile ? 18 : 20} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 overflow-y-auto">
          {/* Balance Card - Responsive */}
          <div className={`${getCardPadding()} bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100`}>
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 md:gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <FiDollarSign className="text-blue-600" size={isMobile ? 20 : 24} />
                  </div>
                  <div>
                    <p className={`${isMobile ? 'text-sm' : 'text-base'} ${isTablet ? 'md:text-lg' : 'lg:text-lg'} text-gray-600 mb-1`}>Available Balance</p>
                    <h2 className={`${isMobile ? 'text-3xl' : 'text-4xl'} ${isTablet ? 'md:text-5xl' : 'lg:text-5xl'} font-bold text-gray-800`}>
                      ${availableBalance}
                    </h2>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs md:text-sm">
                    <FiCreditCard size={12} /> Min: $50
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs md:text-sm">
                    <TbBuildingBank size={12} /> Processed within 24-48h
                  </span>
                </div>
              </div>
              
              <div className="w-full lg:w-auto mt-4 lg:mt-0">
                <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-3`}>
                  <button
                    className={`${styles.button} !bg-blue-600 hover:!bg-blue-700 text-white ${
                      isMobile ? '!h-12 !w-full' : '!h-[48px] !min-w-[140px]'
                    } !rounded-xl flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => setOpenAddMethod(true)}
                    disabled={loading}
                  >
                    {hasWithdrawMethod ? (
                      <>
                        <FiRefreshCw size={16} />
                        <span className="whitespace-nowrap">Change Method</span>
                      </>
                    ) : (
                      <>
                        <FaWallet size={16} />
                        <span className="whitespace-nowrap">Add Method</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    className={`${styles.button} !bg-green-600 hover:!bg-green-700 text-white ${
                      isMobile ? '!h-12 !w-full' : '!h-[48px] !min-w-[140px]'
                    } !rounded-xl flex items-center justify-center gap-2 ${
                      !hasWithdrawMethod || hasPendingRequests || loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => setOpen(true)}
                    disabled={!hasWithdrawMethod || hasPendingRequests || loading}
                  >
                    <FiDollarSign size={16} />
                    <span className="whitespace-nowrap">{loading ? "Processing..." : "Withdraw Now"}</span>
                  </button>
                </div>
                
                {hasPendingRequests && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className={`text-yellow-700 ${isMobile ? 'text-xs' : 'text-sm'} text-center`}>
                      ⚠️ You have {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cards Grid - Responsive Layout */}
          <div className={`grid grid-cols-1 ${isTablet ? 'lg:grid-cols-2' : 'lg:grid-cols-2'} gap-4 md:gap-6 ${getCardPadding()}`}>
            {/* Withdrawal Method Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className={`${getCardPadding()} border-b border-gray-100`}>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-800 flex items-center gap-2`}>
                    <FiCreditCard className="text-blue-600" />
                    Withdrawal Method
                  </h3>
                  {hasWithdrawMethod && (
                    <button
                      onClick={deleteHandler}
                      className={`text-red-600 hover:text-red-800 flex items-center gap-2 ${
                        isMobile ? 'text-xs' : 'text-sm'
                      } whitespace-nowrap`}
                      disabled={loading}
                    >
                      <AiOutlineDelete size={isMobile ? 14 : 16} /> Remove
                    </button>
                  )}
                </div>
              </div>
              
              <div className={`${getCardPadding()}`}>
                {hasWithdrawMethod ? (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 md:p-5">
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <FiCheckCircle className="text-green-600" size={24} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-green-800 mb-1`}>
                          Method Configured ✓
                        </p>
                        <p className={`${isMobile ? 'text-sm' : 'text-base'} text-green-700 mb-2`}>
                          {getMethodDisplay()}
                        </p>
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-green-600`}>
                          You can now request withdrawals. Your funds will be sent to this method after admin approval.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 md:p-5">
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                          <span className="text-yellow-600 text-xl">⚠️</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-yellow-800 mb-1`}>
                          No Withdrawal Method Set
                        </p>
                        <p className={`${isMobile ? 'text-sm' : 'text-base'} text-yellow-700 mb-2`}>
                          You need to add a withdrawal method before you can withdraw funds.
                        </p>
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-yellow-600`}>
                          Click "Add Method" to get started.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Withdrawals Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className={`${getCardPadding()} border-b border-gray-100`}>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="flex-1">
                    <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-800 flex items-center gap-2`}>
                      <FiBell className="text-purple-600" />
                      Recent Withdrawals
                    </h3>
                    {requestHistory.length > 0 && (
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mt-1`}>
                        Showing {showHistory ? 'all' : 'recent'} requests
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleManualRefresh}
                      className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                      disabled={loading}
                      title="Refresh"
                    >
                      <FiRefreshCw size={16} />
                    </button>
                    {requestHistory.length > 3 && (
                      <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors ${
                          isMobile ? 'text-xs' : 'text-sm'
                        }`}
                      >
                        {showHistory ? "Show Less" : "View All"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className={`${getCardPadding()} max-h-[400px] overflow-y-auto`}>
                {requestHistory.length === 0 ? (
                  <div className="text-center py-8 md:py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-2xl mb-4">
                      <span className="text-3xl md:text-4xl">💰</span>
                    </div>
                    <p className={`${isMobile ? 'text-base' : 'text-lg'} text-gray-700 mb-2`}>
                      No withdrawal requests yet
                    </p>
                    <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-500 max-w-md mx-auto`}>
                      Submit your first withdrawal request to see it here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {requestHistory.slice(0, showHistory ? requestHistory.length : 3).map((request) => (
                      <div 
                        key={request._id} 
                        className={`border rounded-xl p-4 transition-all hover:shadow-md ${
                          request.status === "pending" ? "border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50" :
                          request.status === "completed" ? "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50" :
                          "border-red-200 bg-gradient-to-r from-red-50 to-rose-50"
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center flex-wrap gap-2 mb-2">
                              <span className={`inline-block w-2 h-2 rounded-full ${
                                request.status === "pending" ? "bg-yellow-500" :
                                request.status === "completed" ? "bg-green-500" :
                                "bg-red-500"
                              }`}></span>
                              <span className={`font-semibold capitalize ${isMobile ? 'text-sm' : 'text-base'} ${
                                request.status === "pending" ? "text-yellow-700" :
                                request.status === "completed" ? "text-green-700" :
                                "text-red-700"
                              }`}>
                                {request.status}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                {formatDate(request.createdAt)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <FiDollarSign className="text-green-600" size={18} />
                              </div>
                              <div>
                                <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-800`}>
                                  ${request.amount?.toFixed(2)}
                                </p>
                                <p className={`text-gray-600 capitalize ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                  {request.withdrawMethod?.type} withdrawal
                                </p>
                              </div>
                            </div>
                            
                            {request.adminNote && (
                              <div className="mt-3 p-3 bg-white/70 rounded-lg border border-gray-200">
                                <p className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'} text-gray-700 mb-1`}>
                                  Admin Note:
                                </p>
                                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                                  {request.adminNote}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-end">
                            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full ${
                              request.status === "completed" ? "bg-green-100 text-green-800" :
                              request.status === "rejected" ? "bg-red-100 text-red-800" :
                              "bg-yellow-100 text-yellow-800"
                            } ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
                              {request.status === "completed" && "✅ Approved"}
                              {request.status === "rejected" && "❌ Rejected"}
                              {request.status === "pending" && "⏳ Processing"}
                            </span>
                            
                            {request.processedAt && (
                              <p className={`text-gray-500 mt-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                Processed: {formatDate(request.processedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Change Withdrawal Method Modal - Responsive & Centered */}
      {openAddMethod && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-3 md:p-4 overflow-y-auto">
          <div className={`bg-white rounded-xl md:rounded-2xl shadow-2xl ${getModalWidth()} ${getModalPadding()} relative my-auto mx-auto`}>
            <button 
              className="absolute top-3 right-3 md:top-4 md:right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors z-10" 
              onClick={() => {
                setOpenAddMethod(false);
                resetForms();
              }}
              disabled={loading}
            >
              <RxCross1 size={isMobile ? 20 : 24} className="text-gray-500" />
            </button>
            
            <div className="mb-4 md:mb-6">
              <h6 className={`${isMobile ? 'text-xl' : 'text-2xl'} ${isTablet ? 'md:text-3xl' : 'lg:text-3xl'} font-bold text-gray-800 mb-2`}>
                Setup Withdrawal Method
              </h6>
              <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-600`}>
                Add your payment details to withdraw earnings
              </p>
            </div>
            
            <div className="mb-5 md:mb-7">
              <label className={`block ${isMobile ? 'text-base' : 'text-lg'} font-medium mb-3 text-gray-700`}>
                Payment Method
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setWithdrawMethodType("bank")}
                  className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    withdrawMethodType === "bank" 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-gray-200 hover:border-blue-300 bg-white"
                  }`}
                  disabled={loading}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    withdrawMethodType === "bank" ? "bg-blue-100" : "bg-gray-100"
                  }`}>
                    <TbBuildingBank size={20} className={withdrawMethodType === "bank" ? "text-blue-600" : "text-gray-600"} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">🏦 Bank Transfer</p>
                    <p className="text-xs text-gray-500">Direct bank deposit</p>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setWithdrawMethodType("binance")}
                  className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    withdrawMethodType === "binance" 
                      ? "border-yellow-500 bg-yellow-50" 
                      : "border-gray-200 hover:border-yellow-300 bg-white"
                  }`}
                  disabled={loading}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    withdrawMethodType === "binance" ? "bg-yellow-100" : "bg-gray-100"
                  }`}>
                    <FiCreditCard size={20} className={withdrawMethodType === "binance" ? "text-yellow-600" : "text-gray-600"} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">💳 Binance</p>
                    <p className="text-xs text-gray-500">Crypto wallet transfer</p>
                  </div>
                </button>
              </div>
            </div>

            <form onSubmit={handleAddWithdrawMethod}>
              {withdrawMethodType === "bank" ? (
                <div className="space-y-4 md:space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block ${isMobile ? 'text-sm' : 'text-base'} font-medium mb-2 text-gray-700`}>
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Chase Bank, Bank of America"
                        value={bankInfo.bankName}
                        onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl p-3 md:p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        required
                        disabled={loading}
                      />
                    </div>
                    
                    <div>
                      <label className={`block ${isMobile ? 'text-sm' : 'text-base'} font-medium mb-2 text-gray-700`}>
                        Account Holder Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Name as it appears on bank account"
                        value={bankInfo.bankHolderName}
                        onChange={(e) => setBankInfo({ ...bankInfo, bankHolderName: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl p-3 md:p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block ${isMobile ? 'text-sm' : 'text-base'} font-medium mb-2 text-gray-700`}>
                      Account Number *
                    </label>
                    <input
                      type="text"
                      placeholder="Your bank account number"
                      value={bankInfo.bankAccountNumber}
                      onChange={(e) => setBankInfo({ ...bankInfo, bankAccountNumber: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-3 md:p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block ${isMobile ? 'text-sm' : 'text-base'} font-medium mb-2 text-gray-700`}>
                        Bank Country *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., United States, United Kingdom"
                        value={bankInfo.bankCountry}
                        onChange={(e) => setBankInfo({ ...bankInfo, bankCountry: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl p-3 md:p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        required
                        disabled={loading}
                      />
                    </div>
                    
                    <div>
                      <label className={`block ${isMobile ? 'text-sm' : 'text-base'} font-medium mb-2 text-gray-700`}>
                        Swift Code (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Bank's SWIFT/BIC code"
                        value={bankInfo.bankSwiftCode}
                        onChange={(e) => setBankInfo({ ...bankInfo, bankSwiftCode: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl p-3 md:p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block ${isMobile ? 'text-sm' : 'text-base'} font-medium mb-2 text-gray-700`}>
                      Bank Address (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Bank's physical address"
                      value={bankInfo.bankAddress}
                      onChange={(e) => setBankInfo({ ...bankInfo, bankAddress: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-3 md:p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      disabled={loading}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-5">
                    <label className={`block ${isMobile ? 'text-sm' : 'text-base'} font-medium mb-2 text-gray-700`}>
                      Binance Wallet Address *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your Binance wallet address"
                      value={binanceInfo.binanceWalletAddress}
                      onChange={(e) => setBinanceInfo({ binanceWalletAddress: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-3 md:p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-yellow-600 text-sm">⚠️</span>
                      </div>
                      <div>
                        <p className={`font-semibold text-yellow-800 mb-1 ${isMobile ? 'text-sm' : 'text-base'}`}>
                          Important Security Notice
                        </p>
                        <p className={`text-yellow-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          Enter your Binance wallet address carefully. Double-check the address before submitting. 
                          Withdrawals to incorrect addresses cannot be reversed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className={`flex flex-col sm:flex-row justify-end gap-3 ${isMobile ? 'mt-6' : 'mt-8'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenAddMethod(false);
                    resetForms();
                  }}
                  className={`px-5 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium ${
                    isMobile ? 'text-sm' : 'text-base'
                  }`}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-3 rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all font-medium ${
                    isMobile ? 'text-sm' : 'text-base'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <FiRefreshCw className="animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Save & Continue"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Funds Modal - Responsive & Centered */}
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-3 md:p-4 overflow-y-auto">
          <div className={`bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-md ${getModalPadding()} relative my-auto mx-auto`}>
            <button 
              className="absolute top-3 right-3 md:top-4 md:right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors z-10" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              <RxCross1 size={isMobile ? 20 : 24} className="text-gray-500" />
            </button>
            
            <div className="mb-4 md:mb-6">
              <h6 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-800 mb-2`}>
                Withdraw Funds
              </h6>
              <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-600`}>
                Request withdrawal from your available balance
              </p>
            </div>
            
            {hasPendingRequests ? (
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 md:p-5 mb-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-600 text-lg">⚠️</span>
                  </div>
                  <div>
                    <p className={`font-semibold text-yellow-800 mb-1 ${isMobile ? 'text-base' : 'text-lg'}`}>
                      Pending Request Exists
                    </p>
                    <p className={`text-yellow-700 ${isMobile ? 'text-sm' : 'text-base'}`}>
                      You have {pendingRequests.length} pending withdrawal request{pendingRequests.length !== 1 ? 's' : ''}. 
                      Please wait for admin approval before submitting a new request.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-5 md:mb-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1`}>Payment Method</p>
                    <p className={`font-semibold text-gray-800 ${isMobile ? 'text-sm' : 'text-base'}`}>
                      {getMethodDisplay()}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`block ${isMobile ? 'text-base' : 'text-lg'} font-medium mb-3 text-gray-700`}>
                      Amount to Withdraw
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                        <FiDollarSign className="text-gray-500" size={20} />
                      </div>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl p-4 pl-12 text-lg font-semibold focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                        min="50"
                        max={availableBalance}
                        step="0.01"
                        disabled={loading}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <div>
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                          Minimum: <span className="font-semibold">$50</span>
                        </p>
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                          Available: <span className="font-semibold">${availableBalance}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWithdrawAmount(availableBalance)}
                        className={`text-blue-600 hover:text-blue-800 font-medium ${
                          isMobile ? 'text-xs' : 'text-sm'
                        }`}
                        disabled={loading}
                      >
                        Withdraw All
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 md:p-5 mb-5">
                  <h4 className={`font-semibold text-blue-800 mb-3 ${isMobile ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
                    <span className="text-lg">💡</span> How it works
                  </h4>
                  <div className="space-y-2">
                    {[
                      "Submit withdrawal request",
                      "Admin reviews within 24-48 hours",
                      "You'll receive email notification",
                      "Funds sent to your payment method"
                    ].map((step, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-xs font-bold">{index + 1}</span>
                        </div>
                        <p className={`text-blue-700 ${isMobile ? 'text-sm' : 'text-base'}`}>
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    onClick={() => setOpen(false)}
                    className={`px-5 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium ${
                      isMobile ? 'text-sm' : 'text-base'
                    }`}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={withdrawHandler}
                    className={`px-5 py-3 rounded-xl text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all font-medium ${
                      isMobile ? 'text-sm' : 'text-base'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <FiRefreshCw className="animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <FiDollarSign />
                        Submit Request
                      </span>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawMoney;

