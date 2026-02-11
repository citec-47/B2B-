import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getAllUsers } from "../../redux/actions/user";
import { DataGrid } from "@material-ui/data-grid";
import { AiOutlineDelete, AiOutlineEye, AiOutlineShop, AiOutlineUser, AiOutlineReload } from "react-icons/ai";
import { Button, IconButton, CircularProgress } from "@material-ui/core";
import styles from "../../styles/styles";
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
  const [userId, setUserId] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStores, setUserStores] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [sellersLoading, setSellersLoading] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showError, setShowError] = useState(false);

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
      // First test if endpoint is accessible
      try {
        const testResponse = await axios.get(`${server}/api/v2/test-admin-auth`, {
          withCredentials: true,
        });
        console.log("✅ Admin auth test:", testResponse.data);
      } catch (testError) {
        console.error("❌ Admin auth test failed:", testError.message);
      }

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
        isActive: user.isActive
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

  const handleSuspendUser = async (userId, status) => {
    try {
      setLocalLoading(true);
      const { data } = await axios.put(
        `${server}/user/update-user-status/${userId}`,
        { isActive: status },
        { withCredentials: true }
      );
      
      if (data.success) {
        toast.success(`User ${status ? 'activated' : 'suspended'} successfully!`);
        loadData(); // Refresh all data
      } else {
        toast.error(data.message || "Failed to update user status");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update user status");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    loadData();
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
    },
    {
      field: "email",
      headerName: "Email",
      minWidth: 180,
      flex: 0.8,
    },
    {
      field: "role",
      headerName: "Role",
      minWidth: 120,
      flex: 0.5,
      renderCell: (params) => {
        const role = params.value || 'user';
        const getRoleColor = () => {
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
      minWidth: 120,
      flex: 0.5,
      renderCell: (params) => {
        const isActive = params.row.isActive !== false;
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            isActive 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {isActive ? 'Active' : 'Suspended'}
          </span>
        );
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
      minWidth: 280,
      flex: 1,
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
            
            <Button
              variant="outlined"
              size="small"
              color={isActive ? "secondary" : "primary"}
              onClick={() => handleSuspendUser(user.id, !isActive)}
              disabled={localLoading}
              className="text-xs"
            >
              {isActive ? 'Suspend' : 'Activate'}
            </Button>
            
            <IconButton
              size="small"
              onClick={() => {
                setUserId(params.row.id);
                setOpen(true);
              }}
              title="Delete User"
              disabled={localLoading}
              className="hover:bg-red-50"
            >
              <AiOutlineDelete className="text-red-600" />
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
        isActive: item.isActive,
        createdAt: item.createdAt, // Keep original for formatting
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
              <p className="text-sm text-gray-600">Sellers</p>
              <p className="text-xl font-bold text-green-600">
                {users?.filter(u => u.role === 'seller').length || 0}
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
              getRowClassName={(params) => 
                `hover:bg-gray-50 ${params.row.role === 'admin' ? 'bg-red-50' : ''}`
              }
              sx={{
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f9fafb',
                  borderBottom: '2px solid #e5e7eb',
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #f3f4f6',
                },
              }}
            />
          </div>
        )}

        {/* Rest of the modals remain the same */}
        {/* ... */}
      </div>
    </div>
  );
};

export default AllUsers;