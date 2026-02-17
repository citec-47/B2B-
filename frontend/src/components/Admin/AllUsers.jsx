// Admin/AllUsers.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllUsers } from "../../redux/actions/user";
import { DataGrid } from "@material-ui/data-grid";
import { 
  AiOutlineDelete, 
  AiOutlineEye, 
  AiOutlineShop, 
  AiOutlineUser, 
  AiOutlineReload,
  AiOutlineCheckCircle,
  AiOutlineStop,
  AiOutlineExclamationCircle
} from "react-icons/ai";
import { Button, IconButton, CircularProgress } from "@material-ui/core";
import { RxCross1 } from "react-icons/rx";
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";

const AllUsers = () => {
  const dispatch = useDispatch();
  const { users, usersLoading, error } = useSelector((state) => state.user);
  const [open, setOpen] = useState(false);
  const [openStoreModal, setOpenStoreModal] = useState(false);
  const [openUserDetailsModal, setOpenUserDetailsModal] = useState(false);
  const [openSuspendModal, setOpenSuspendModal] = useState(false);
  const [userId, setUserId] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStores, setUserStores] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [sellersLoading, setSellersLoading] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showError, setShowError] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendAction, setSuspendAction] = useState(""); // "suspend" or "activate"

  useEffect(() => {
    loadData();
  }, [dispatch]);

  const loadData = () => {
    dispatch(getAllUsers());
    fetchAllSellers();
  };

  useEffect(() => {
    if (error) {
      setShowError(true);
      toast.error(error);
    }
  }, [error]);

  const fetchAllSellers = async () => {
    try {
      setSellersLoading(true);
      
      const { data } = await axios.get(`${server}/shop/admin-all-sellers`, {
        withCredentials: true,
      });
      
      if (data.success) {
        setSellers(data.sellers || []);
        console.log(`✅ Loaded ${data.sellers?.length || 0} sellers`);
      } else {
        console.warn("⚠️ Failed to fetch sellers:", data.message);
      }
    } catch (error) {
      console.error("❌ Error fetching sellers:", error.response?.data || error.message);
    } finally {
      setSellersLoading(false);
    }
  };

  // Helper function to format date safely
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return 'N/A';
    }
  };

  const handleDelete = async (id) => {
    try {
      setLocalLoading(true);
      const { data } = await axios.delete(`${server}/user/delete-user/${id}`, {
        withCredentials: true,
      });
      
      if (data.success) {
        toast.success("User deleted successfully!");
        loadData(); // Refresh all data
        setOpen(false);
      } else {
        toast.error(data.message || "Failed to delete user");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleViewUserDetails = async (user) => {
    setSelectedUser(user);
    setLocalLoading(true);
    
    try {
      const { data } = await axios.get(`${server}/user/user-info/${user._id}`, {
        withCredentials: true,
      });
      
      if (data.success) {
        setUserDetails(data.user);
        setOpenUserDetailsModal(true);
      } else {
        toast.error(data.message || "Failed to fetch user details");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      // Fallback to basic user data
      setUserDetails({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive !== false
      });
      setOpenUserDetailsModal(true);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleViewStores = async (user) => {
    setSelectedUser(user);
    setLocalLoading(true);
    
    try {
      // If user is a seller, get their shop
      if (user.role === 'seller') {
        const { data } = await axios.get(`${server}/shop/get-shop/${user.id}`, {
          withCredentials: true,
        });
        
        if (data.success && data.shop) {
          setUserStores([data.shop]);
        } else {
          setUserStores([]);
        }
      } else {
        // Check if user has any shops in sellers list
        const userStores = sellers.filter(seller => 
          seller.email === user.email || seller._id === user.id
        );
        setUserStores(userStores);
      }
      
      setOpenStoreModal(true);
    } catch (error) {
      console.error("Error fetching user stores:", error);
      setUserStores([]);
      setOpenStoreModal(true);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleDeleteStore = async (storeId) => {
    if (window.confirm("Are you sure you want to delete this store?")) {
      try {
        setLocalLoading(true);
        const { data } = await axios.delete(`${server}/shop/delete-shop/${storeId}`, {
          withCredentials: true,
        });
        
        if (data.success) {
          toast.success("Store deleted successfully!");
          // Remove from local state
          setUserStores(userStores.filter(store => store._id !== storeId));
          // Refresh sellers list
          fetchAllSellers();
        } else {
          toast.error(data.message || "Failed to delete store");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete store");
      } finally {
        setLocalLoading(false);
      }
    }
  };

  // Handle suspend/activate user
  const handleSuspendUser = (user, action) => {
    setSelectedUser(user);
    setSuspendAction(action);
    setSuspendReason("");
    setOpenSuspendModal(true);
  };

  // Confirm suspend/activate with correct endpoints
  const confirmSuspendUser = async () => {
    if (!selectedUser) return;
    
    const actionText = suspendAction === "suspend" ? "suspended" : "activated";
    
    // If suspending and no reason provided, show warning but allow
    if (suspendAction === "suspend" && !suspendReason.trim()) {
      if (!window.confirm("Are you sure you want to suspend this user without providing a reason?")) {
        return;
      }
    }

    setLocalLoading(true);
    try {
      console.log("🔄 Updating user status:", {
        userId: selectedUser.id,
        userName: selectedUser.name,
        action: suspendAction,
        suspendReason
      });

      let url;
      let payload = {};
      
      // Determine the correct endpoint based on role and action
      if (selectedUser.role === 'seller') {
        // Seller endpoints
        if (suspendAction === "suspend") {
          url = `${server}/admin/suspend-seller/${selectedUser.id}`;
          payload = { reason: suspendReason || "No reason provided" };
        } else {
          url = `${server}/admin/unsuspend-seller/${selectedUser.id}`;
        }
      } else {
        // User endpoints
        if (suspendAction === "suspend") {
          url = `${server}/admin/suspend-user/${selectedUser.id}`;
          payload = { reason: suspendReason || "No reason provided" };
        } else {
          url = `${server}/admin/unsuspend-user/${selectedUser.id}`;
        }
      }

      console.log("📡 Calling URL:", url);
      
      const { data } = await axios.put(
        url,
        payload,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (data.success) {
        toast.success(`User ${actionText} successfully!`);
        
        // Send email notification to user (optional)
        if (suspendAction === "suspend" && selectedUser.email) {
          try {
            await axios.post(`${server}/user/send-suspension-email`, {
              email: selectedUser.email,
              name: selectedUser.name,
              reason: suspendReason || "No reason provided"
            }, { withCredentials: true });
          } catch (emailError) {
            console.error("Failed to send suspension email:", emailError);
          }
        }
        
        loadData(); // Refresh all data
        setOpenSuspendModal(false);
        setSuspendReason("");
        setSelectedUser(null);
      } else {
        toast.error(data.message || `Failed to ${suspendAction} user`);
      }
    } catch (error) {
      console.error(`Error ${suspendAction}ing user:`, error);
      toast.error(error.response?.data?.message || `Failed to ${suspendAction} user`);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    loadData();
  };

  // Custom status badge component with colors
  const StatusBadge = ({ isActive, reason }) => {
    if (isActive) {
      return (
        <div className="flex flex-col">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
            <AiOutlineCheckCircle className="text-green-600" size={14} />
            Active
          </span>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
            <AiOutlineStop className="text-red-600" size={14} />
            Suspended
          </span>
          {reason && (
            <span className="text-xs text-gray-500 mt-1 truncate max-w-[150px]" title={reason}>
              <AiOutlineExclamationCircle className="inline mr-1 text-red-400" size={12} />
              {reason.length > 30 ? reason.substring(0, 30) + '...' : reason}
            </span>
          )}
        </div>
      );
    }
  };

  const columns = [
    { 
      field: "id", 
      headerName: "User ID", 
      minWidth: 180, 
      flex: 0.8,
      renderCell: (params) => (
        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
          {params.value?.substring(0, 8) || 'N/A'}...
        </span>
      )
    },
    {
      field: "name",
      headerName: "Name",
      minWidth: 150,
      flex: 0.7,
      renderCell: (params) => {
        const isActive = params.row.isActive !== false;
        return (
          <span className={!isActive ? 'text-red-600 font-medium' : ''}>
            {params.value}
          </span>
        );
      }
    },
    {
      field: "email",
      headerName: "Email",
      minWidth: 180,
      flex: 0.8,
      renderCell: (params) => {
        const isActive = params.row.isActive !== false;
        return (
          <span className={!isActive ? 'text-red-500' : ''}>
            {params.value}
          </span>
        );
      }
    },
    {
      field: "role",
      headerName: "Role",
      minWidth: 120,
      flex: 0.5,
      renderCell: (params) => {
        const role = params.value || 'user';
        const isActive = params.row.isActive !== false;
        
        const getRoleColor = () => {
          if (!isActive) return 'bg-gray-200 text-gray-600 border border-gray-300';
          switch(role) {
            case 'admin': return 'bg-red-100 text-red-800 border border-red-200';
            case 'seller': return 'bg-blue-100 text-blue-800 border border-blue-200';
            default: return 'bg-green-100 text-green-800 border border-green-200';
          }
        };
        
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor()}`}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 180,
      flex: 0.8,
      renderCell: (params) => {
        const isActive = params.row.isActive !== false;
        return <StatusBadge isActive={isActive} reason={params.row.suspensionReason} />;
      },
    },
    {
      field: "joinedAt",
      headerName: "Joined At",
      minWidth: 130,
      flex: 0.7,
      valueGetter: (params) => {
        return formatDate(params.row.createdAt);
      }
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 320,
      flex: 1.2,
      sortable: false,
      renderCell: (params) => {
        const user = params.row;
        const isActive = user.isActive !== false;
        
        return (
          <div className="flex items-center gap-2">
            <IconButton
              size="small"
              onClick={() => handleViewUserDetails(user)}
              title="View Details"
              disabled={localLoading}
              className="hover:bg-blue-50"
            >
              <AiOutlineUser className="text-blue-600" />
            </IconButton>
            
            {user.role === 'seller' && (
              <IconButton
                size="small"
                onClick={() => handleViewStores(user)}
                title="View Stores"
                disabled={localLoading}
                className="hover:bg-purple-50"
              >
                <AiOutlineShop className="text-purple-600" />
              </IconButton>
            )}
            
            {isActive ? (
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleSuspendUser(user, "suspend")}
                disabled={localLoading}
                className="text-xs border-red-300 text-red-700 hover:bg-red-50"
                startIcon={<AiOutlineStop className="text-red-600" />}
                style={{ borderColor: '#fecaca', color: '#b91c1c' }}
              >
                Suspend
              </Button>
            ) : (
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleSuspendUser(user, "activate")}
                disabled={localLoading}
                className="text-xs border-green-300 text-green-700 hover:bg-green-50"
                startIcon={<AiOutlineCheckCircle className="text-green-600" />}
                style={{ borderColor: '#bbf7d0', color: '#166534' }}
              >
                Activate
              </Button>
            )}
            
            <IconButton
              size="small"
              onClick={() => {
                setUserId(params.row.id);
                setOpen(true);
              }}
              title="Delete User"
              disabled={localLoading || user.role === 'admin'}
              className={`hover:bg-red-50 ${user.role === 'admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <AiOutlineDelete className={`${user.role === 'admin' ? 'text-gray-400' : 'text-red-600'}`} />
            </IconButton>
          </div>
        );
      },
    },
  ];

  const row = [];
  users &&
    users.forEach((item) => {
      row.push({
        id: item._id || item.id,
        name: item.name || 'No Name',
        email: item.email || 'No Email',
        role: item.role || 'user',
        isActive: item.isActive !== false,
        suspensionReason: item.suspensionReason || '',
        createdAt: item.createdAt,
        joinedAt: formatDate(item.createdAt)
      });
    });

  return (
    <div className="w-full flex justify-center pt-5">
      <div className="w-[97%]">
        <div className="flex justify-between items-center pb-6">
          <div>
            <h3 className="text-[24px] font-Poppins font-bold text-gray-800">All Users</h3>
            <p className="text-gray-500 text-sm">Manage users, sellers, and their stores</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-xl font-bold text-blue-600">{users?.length || 0}</p>
            </div>
            <div className="px-4 py-2 bg-green-50 rounded-lg border border-green-100">
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <AiOutlineCheckCircle className="text-green-600" /> Active
              </p>
              <p className="text-xl font-bold text-green-600">
                {users?.filter(u => u.isActive !== false).length || 0}
              </p>
            </div>
            <div className="px-4 py-2 bg-red-50 rounded-lg border border-red-100">
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <AiOutlineStop className="text-red-600" /> Suspended
              </p>
              <p className="text-xl font-bold text-red-600">
                {users?.filter(u => u.isActive === false).length || 0}
              </p>
            </div>
            <Button
              variant="outlined"
              startIcon={<AiOutlineReload />}
              onClick={handleRetry}
              disabled={usersLoading || localLoading}
              size="small"
            >
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Custom Error Alert Component */}
        {showError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">Error Loading Users</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  <p className="mt-1 text-xs">Check server console for detailed error logs</p>
                </div>
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <button
                      type="button"
                      className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
                      onClick={() => setShowError(false)}
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      className="ml-3 bg-red-100 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
                      onClick={handleRetry}
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {usersLoading ? (
          <div className="w-full min-h-[60vh] bg-white rounded-lg shadow border flex flex-col items-center justify-center">
            <CircularProgress />
            <span className="ml-3 mt-3">Loading users...</span>
          </div>
        ) : error && retryCount > 2 ? (
          <div className="w-full min-h-[60vh] bg-white rounded-lg shadow border flex flex-col items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AiOutlineReload className="text-red-500 text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Failed to Load Users</h3>
              <p className="text-gray-600 mb-6">
                Still having issues after {retryCount} retries. Please check:
              </p>
              <div className="text-sm text-left text-gray-500 mb-6 bg-gray-50 p-4 rounded">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Check if backend server is running on port 5000</li>
                  <li>Verify admin authentication cookies are set</li>
                  <li>Check server console for error logs</li>
                  <li>Make sure Firestore is properly connected</li>
                </ul>
              </div>
              <button 
                onClick={handleRetry}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center mx-auto"
              >
                <AiOutlineReload className="mr-2" />
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full min-h-[60vh] bg-white rounded-lg shadow border">
            <DataGrid
              rows={row}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[5, 10, 20]}
              disableSelectionOnClick
              autoHeight
              loading={usersLoading}
              getRowClassName={(params) => {
                if (params.row.role === 'admin') return 'bg-red-50 hover:bg-red-100';
                if (params.row.isActive === false) return 'bg-red-50/30 hover:bg-red-100/50 border-l-4 border-l-red-400';
                if (params.row.isActive !== false) return 'bg-green-50/30 hover:bg-green-100/50 border-l-4 border-l-green-400';
                return 'hover:bg-gray-50';
              }}
              sx={{
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f9fafb',
                  borderBottom: '2px solid #e5e7eb',
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #f3f4f6',
                },
                '& .MuiDataGrid-row': {
                  transition: 'all 0.2s',
                },
              }}
            />
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Confirm Delete</h2>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <RxCross1 size={20} />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(userId)}
                  disabled={localLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {localLoading ? <CircularProgress size={16} color="inherit" /> : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Suspend/Activate Modal */}
        {openSuspendModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {suspendAction === "suspend" ? "Suspend User" : "Activate User"}
                </h2>
                <button onClick={() => setOpenSuspendModal(false)} className="text-gray-400 hover:text-gray-600">
                  <RxCross1 size={20} />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600">
                  {suspendAction === "suspend" 
                    ? `Are you sure you want to suspend ${selectedUser.name}?` 
                    : `Are you sure you want to activate ${selectedUser.name}?`}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Email: {selectedUser.email}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Current Status: {selectedUser.isActive !== false ? 
                    <span className="text-green-600 font-medium">Active</span> : 
                    <span className="text-red-600 font-medium">Suspended</span>}
                </p>
              </div>

              {suspendAction === "suspend" && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Suspension (Optional)
                  </label>
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Enter reason for suspension..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                    rows="3"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setOpenSuspendModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSuspendUser}
                  disabled={localLoading}
                  className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 ${
                    suspendAction === "suspend" 
                      ? "bg-red-600 hover:bg-red-700" 
                      : "bg-green-600 hover:bg-green-700"
                  } disabled:opacity-50`}
                >
                  {localLoading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : suspendAction === "suspend" ? (
                    "Suspend User"
                  ) : (
                    "Activate User"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {openUserDetailsModal && userDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                <button onClick={() => setOpenUserDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                  <RxCross1 size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">User ID</p>
                    <p className="font-mono text-sm">{userDetails._id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    {userDetails.isActive !== false ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 inline-flex items-center gap-1">
                        <AiOutlineCheckCircle className="text-green-600" size={14} />
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 inline-flex items-center gap-1">
                        <AiOutlineStop className="text-red-600" size={14} />
                        Suspended
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className={`font-medium ${userDetails.isActive === false ? 'text-red-600' : ''}`}>
                    {userDetails.name}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className={userDetails.isActive === false ? 'text-red-500' : ''}>
                    {userDetails.email}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    userDetails.role === 'admin' ? 'bg-red-100 text-red-800' :
                    userDetails.role === 'seller' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {userDetails.role?.charAt(0).toUpperCase() + userDetails.role?.slice(1) || 'User'}
                  </span>
                </div>

                {userDetails.phoneNumber && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p>{userDetails.phoneNumber}</p>
                  </div>
                )}

                {userDetails.addresses && userDetails.addresses.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Addresses</p>
                    {userDetails.addresses.map((addr, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded mb-2 text-sm">
                        <p>{addr.address1}</p>
                        {addr.address2 && <p>{addr.address2}</p>}
                        <p>{addr.city}, {addr.state} {addr.zipCode}</p>
                        <p>{addr.country}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Store Details Modal */}
        {openStoreModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedUser.name}'s Stores
                </h2>
                <button onClick={() => setOpenStoreModal(false)} className="text-gray-400 hover:text-gray-600">
                  <RxCross1 size={20} />
                </button>
              </div>
              
              {userStores.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No stores found for this user.</p>
              ) : (
                <div className="space-y-4">
                  {userStores.map((store) => (
                    <div key={store._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">{store.name}</h3>
                          <p className="text-sm text-gray-600">{store.email}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteStore(store._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete Store"
                        >
                          <AiOutlineDelete size={18} />
                        </button>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Address</p>
                          <p>{store.address || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Phone</p>
                          <p>{store.phoneNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Balance</p>
                          <p className="font-medium">${store.availableBalance?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Products</p>
                          <p>{store.totalProducts || 0}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllUsers;