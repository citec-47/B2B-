import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
<<<<<<< HEAD
  // Suspension
  isSuspended: false,
  suspensionReason: null,
  suspensionMessage: null,
=======
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
  // Role flags
  isAdmin: false,
  isSeller: false,
  isUser: false,
  // Users for admin
  users: [],
  usersLoading: false,
<<<<<<< HEAD
  successMessage: null,
  addressloading: false,
  loading: false,
=======
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
};

export const userReducer = createReducer(initialState, {
  // User Login
  UserLoginRequest: (state) => {
    state.loading = true;
<<<<<<< HEAD
    state.isSuspended = false;
    state.suspensionMessage = null;
=======
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
  },
  UserLoginSuccess: (state, action) => {
    state.isAuthenticated = true;
    state.loading = false;
    state.user = action.payload;
<<<<<<< HEAD
    state.isSuspended = action.payload?.isSuspended || false;
    state.suspensionReason = action.payload?.suspensionReason || null;
=======
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
    // Set role flags
    state.isAdmin = action.payload?.role === 'admin' || action.payload?.isAdmin === true;
    state.isSeller = action.payload?.role === 'seller' || action.payload?.isSeller === true;
    state.isUser = action.payload?.role === 'user' || (action.payload?.role !== 'admin' && action.payload?.role !== 'seller');
    state.error = null;
  },
  UserLoginFail: (state, action) => {
    state.loading = false;
    state.error = action.payload;
    state.isAuthenticated = false;
<<<<<<< HEAD
    state.isSuspended = false;
=======
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
    state.isAdmin = false;
    state.isSeller = false;
    state.isUser = false;
  },

<<<<<<< HEAD
  // User Suspended
  UserSuspended: (state, action) => {
    state.isAuthenticated = false;
    state.isLoading = false;
    state.loading = false;
    state.user = null;
    state.isSuspended = true;
    state.suspensionMessage = action.payload?.message || 'Your account has been suspended';
    state.suspensionReason = action.payload?.reason || null;
    state.isAdmin = false;
    state.isSeller = false;
    state.isUser = false;
    state.error = null;
  },

  // Seller Suspended
  SellerSuspended: (state, action) => {
    state.isAuthenticated = false;
    state.isLoading = false;
    state.loading = false;
    state.user = null;
    state.isSuspended = true;
    state.suspensionMessage = action.payload?.message || 'Your seller account has been suspended';
    state.suspensionReason = action.payload?.reason || null;
    state.isAdmin = false;
    state.isSeller = false;
    state.isUser = false;
    state.error = null;
  },

  // Admin Suspended
  AdminSuspended: (state, action) => {
    state.isAuthenticated = false;
    state.isLoading = false;
    state.loading = false;
    state.user = null;
    state.isSuspended = true;
    state.suspensionMessage = action.payload?.message || 'Your admin account has been suspended';
    state.suspensionReason = action.payload?.reason || null;
    state.isAdmin = false;
    state.isSeller = false;
    state.isUser = false;
    state.error = null;
  },

  // Seller Login
  SellerLoginRequest: (state) => {
    state.loading = true;
    state.isSuspended = false;
    state.suspensionMessage = null;
=======
  // Seller Login
  SellerLoginRequest: (state) => {
    state.loading = true;
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
  },
  SellerLoginSuccess: (state, action) => {
    state.isAuthenticated = true;
    state.loading = false;
    state.user = action.payload;
<<<<<<< HEAD
    state.isSuspended = action.payload?.isSuspended || false;
    state.suspensionReason = action.payload?.suspensionReason || null;
=======
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
    state.isAdmin = false;
    state.isSeller = true;
    state.isUser = false;
    state.error = null;
  },
  SellerLoginFail: (state, action) => {
    state.loading = false;
    state.error = action.payload;
    state.isAuthenticated = false;
    state.isSeller = false;
<<<<<<< HEAD
    state.isSuspended = false;
  },

  // Admin Login
  AdminLoginRequest: (state) => {
    state.loading = true;
    state.isSuspended = false;
    state.suspensionMessage = null;
=======
  },

  // Admin Login (can use UserLoginSuccess as well)
  AdminLoginRequest: (state) => {
    state.loading = true;
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
  },
  AdminLoginSuccess: (state, action) => {
    state.isAuthenticated = true;
    state.loading = false;
    state.user = action.payload;
<<<<<<< HEAD
    state.isSuspended = action.payload?.isSuspended || false;
    state.suspensionReason = action.payload?.suspensionReason || null;
=======
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
    state.isAdmin = true;
    state.isSeller = false;
    state.isUser = false;
    state.error = null;
  },
  AdminLoginFail: (state, action) => {
    state.loading = false;
    state.error = action.payload;
    state.isAuthenticated = false;
    state.isAdmin = false;
<<<<<<< HEAD
    state.isSuspended = false;
=======
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
  },

  // Load User
  LoadUserRequest: (state) => {
    state.isLoading = true;
<<<<<<< HEAD
    state.isSuspended = false;
    state.suspensionMessage = null;
=======
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
  },
  LoadUserSuccess: (state, action) => {
    state.isAuthenticated = true;
    state.isLoading = false;
    state.user = action.payload;
<<<<<<< HEAD
    state.isSuspended = action.payload?.isSuspended || false;
    state.suspensionReason = action.payload?.suspensionReason || null;
=======
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
    // Set role flags
    state.isAdmin = action.payload?.role === 'admin' || action.payload?.isAdmin === true;
    state.isSeller = action.payload?.role === 'seller' || action.payload?.isSeller === true;
    state.isUser = action.payload?.role === 'user' || (action.payload?.role !== 'admin' && action.payload?.role !== 'seller');
    state.error = null;
  },
  LoadUserFail: (state, action) => {
    state.isLoading = false;
    state.error = action.payload;
    state.isAuthenticated = false;
<<<<<<< HEAD
    state.isSuspended = false;
=======
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
    state.isAdmin = false;
    state.isSeller = false;
    state.isUser = false;
  },

  // Load Seller
  LoadSellerRequest: (state) => {
    state.isLoading = true;
<<<<<<< HEAD
    state.isSuspended = false;
    state.suspensionMessage = null;
=======
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
  },
  LoadSellerSuccess: (state, action) => {
    state.isAuthenticated = true;
    state.isLoading = false;
    state.user = action.payload;
<<<<<<< HEAD
    state.isSuspended = action.payload?.isSuspended || false;
    state.suspensionReason = action.payload?.suspensionReason || null;
=======
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
    state.isAdmin = false;
    state.isSeller = true;
    state.isUser = false;
    state.error = null;
  },
  LoadSellerFail: (state, action) => {
    state.isLoading = false;
    state.error = action.payload;
    state.isAuthenticated = false;
    state.isSeller = false;
<<<<<<< HEAD
    state.isSuspended = false;
=======
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
  },

  // Load Admin
  LoadAdminRequest: (state) => {
    state.isLoading = true;
<<<<<<< HEAD
    state.isSuspended = false;
    state.suspensionMessage = null;
=======
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
  },
  LoadAdminSuccess: (state, action) => {
    state.isAuthenticated = true;
    state.isLoading = false;
    state.user = action.payload;
<<<<<<< HEAD
    state.isSuspended = action.payload?.isSuspended || false;
    state.suspensionReason = action.payload?.suspensionReason || null;
=======
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
    state.isAdmin = true;
    state.isSeller = false;
    state.isUser = false;
    state.error = null;
  },
  LoadAdminFail: (state, action) => {
    state.isLoading = false;
    state.error = action.payload;
    state.isAuthenticated = false;
    state.isAdmin = false;
<<<<<<< HEAD
    state.isSuspended = false;
  },

  // Suspend User (Admin action)
  SuspendUserRequest: (state) => {
    state.usersLoading = true;
  },
  SuspendUserSuccess: (state, action) => {
    state.usersLoading = false;
    // Update the user in the users list
    if (state.users && Array.isArray(state.users)) {
      state.users = state.users.map(user => 
        user._id === action.payload.userId 
          ? { ...user, isSuspended: true, suspensionReason: action.payload.reason }
          : user
      );
    }
    state.successMessage = action.payload.message;
  },
  SuspendUserFail: (state, action) => {
    state.usersLoading = false;
    state.error = action.payload;
  },

  // Unsuspend User (Admin action)
  UnsuspendUserRequest: (state) => {
    state.usersLoading = true;
  },
  UnsuspendUserSuccess: (state, action) => {
    state.usersLoading = false;
    // Update the user in the users list
    if (state.users && Array.isArray(state.users)) {
      state.users = state.users.map(user => 
        user._id === action.payload.userId 
          ? { ...user, isSuspended: false, suspensionReason: null }
          : user
      );
    }
    state.successMessage = action.payload.message;
  },
  UnsuspendUserFail: (state, action) => {
    state.usersLoading = false;
    state.error = action.payload;
=======
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
  },

  // Update user information
  updateUserInfoRequest: (state) => {
    state.loading = true;
  },
  updateUserInfoSuccess: (state, action) => {
    state.loading = false;
    state.user = action.payload;
<<<<<<< HEAD
    state.isSuspended = action.payload?.isSuspended || false;
    state.suspensionReason = action.payload?.suspensionReason || null;
=======
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
    // Update role flags
    state.isAdmin = action.payload?.role === 'admin' || action.payload?.isAdmin === true;
    state.isSeller = action.payload?.role === 'seller' || action.payload?.isSeller === true;
    state.isUser = action.payload?.role === 'user' || (action.payload?.role !== 'admin' && action.payload?.role !== 'seller');
  },
  updateUserInfoFailed: (state, action) => {
    state.loading = false;
    state.error = action.payload;
  },

  // Update User address
  updateUserAddressRequest: (state) => {
    state.addressloading = true;
  },
  updateUserAddressSuccess: (state, action) => {
    state.addressloading = false;
    state.successMessage = action.payload.successMessage;
    state.user = action.payload.user;
<<<<<<< HEAD
    state.isSuspended = action.payload.user?.isSuspended || false;
    state.suspensionReason = action.payload.user?.suspensionReason || null;
=======
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
    // Update role flags
    state.isAdmin = action.payload.user?.role === 'admin' || action.payload.user?.isAdmin === true;
    state.isSeller = action.payload.user?.role === 'seller' || action.payload.user?.isSeller === true;
    state.isUser = action.payload.user?.role === 'user' || (action.payload.user?.role !== 'admin' && action.payload.user?.role !== 'seller');
  },
  updateUserAddressFailed: (state, action) => {
    state.addressloading = false;
    state.error = action.payload;
  },

  // Delete user address
  deleteUserAddressRequest: (state) => {
    state.addressloading = true;
  },
  deleteUserAddressSuccess: (state, action) => {
    state.addressloading = false;
    state.successMessage = action.payload.successMessage;
    state.user = action.payload.user;
<<<<<<< HEAD
    state.isSuspended = action.payload.user?.isSuspended || false;
    state.suspensionReason = action.payload.user?.suspensionReason || null;
=======
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
    // Update role flags
    state.isAdmin = action.payload.user?.role === 'admin' || action.payload.user?.isAdmin === true;
    state.isSeller = action.payload.user?.role === 'seller' || action.payload.user?.isSeller === true;
    state.isUser = action.payload.user?.role === 'user' || (action.payload.user?.role !== 'admin' && action.payload.user?.role !== 'seller');
  },
  deleteUserAddressFailed: (state, action) => {
    state.addressloading = false;
    state.error = action.payload;
  },

  // Get all users --- admin
  getAllUsersRequest: (state) => {
    state.usersLoading = true;
  },
  getAllUsersSuccess: (state, action) => {
    state.usersLoading = false;
    state.users = action.payload;
  },
  getAllUsersFailed: (state, action) => {
    state.usersLoading = false;
    state.error = action.payload;
  },

  // Logout
  LogoutRequest: (state) => {
    state.loading = true;
  },
  LogoutSuccess: (state) => {
    state.isAuthenticated = false;
    state.isLoading = false;
<<<<<<< HEAD
    state.loading = false;
    state.user = null;
    state.isSuspended = false;
    state.suspensionReason = null;
    state.suspensionMessage = null;
=======
    state.user = null;
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
    state.isAdmin = false;
    state.isSeller = false;
    state.isUser = false;
    state.error = null;
    state.users = [];
  },
  LogoutFail: (state, action) => {
    state.loading = false;
    state.error = action.payload;
<<<<<<< HEAD
    // Still clear auth state even if API fails
    state.isAuthenticated = false;
    state.user = null;
    state.isSuspended = false;
=======
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
  },

  clearErrors: (state) => {
    state.error = null;
    state.successMessage = null;
  },
});