import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
  // Role flags
  isAdmin: false,
  isSeller: false,
  isUser: false,
  // Users for admin
  users: [],
  usersLoading: false,
};

export const userReducer = createReducer(initialState, {
  // User Login
  UserLoginRequest: (state) => {
    state.loading = true;
  },
  UserLoginSuccess: (state, action) => {
    state.isAuthenticated = true;
    state.loading = false;
    state.user = action.payload;
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
    state.isAdmin = false;
    state.isSeller = false;
    state.isUser = false;
  },

  // Seller Login
  SellerLoginRequest: (state) => {
    state.loading = true;
  },
  SellerLoginSuccess: (state, action) => {
    state.isAuthenticated = true;
    state.loading = false;
    state.user = action.payload;
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
  },

  // Admin Login (can use UserLoginSuccess as well)
  AdminLoginRequest: (state) => {
    state.loading = true;
  },
  AdminLoginSuccess: (state, action) => {
    state.isAuthenticated = true;
    state.loading = false;
    state.user = action.payload;
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
  },

  // Load User
  LoadUserRequest: (state) => {
    state.isLoading = true;
  },
  LoadUserSuccess: (state, action) => {
    state.isAuthenticated = true;
    state.isLoading = false;
    state.user = action.payload;
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
    state.isAdmin = false;
    state.isSeller = false;
    state.isUser = false;
  },

  // Load Seller
  LoadSellerRequest: (state) => {
    state.isLoading = true;
  },
  LoadSellerSuccess: (state, action) => {
    state.isAuthenticated = true;
    state.isLoading = false;
    state.user = action.payload;
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
  },

  // Load Admin
  LoadAdminRequest: (state) => {
    state.isLoading = true;
  },
  LoadAdminSuccess: (state, action) => {
    state.isAuthenticated = true;
    state.isLoading = false;
    state.user = action.payload;
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
  },

  // Update user information
  updateUserInfoRequest: (state) => {
    state.loading = true;
  },
  updateUserInfoSuccess: (state, action) => {
    state.loading = false;
    state.user = action.payload;
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
    state.user = null;
    state.isAdmin = false;
    state.isSeller = false;
    state.isUser = false;
    state.error = null;
    state.users = [];
  },
  LogoutFail: (state, action) => {
    state.loading = false;
    state.error = action.payload;
  },

  clearErrors: (state) => {
    state.error = null;
    state.successMessage = null;
  },
});