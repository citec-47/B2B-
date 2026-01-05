import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  isAuthenticated: false,
  loading: false,
  user: null,
  error: null,
  addressloading: false,
  usersLoading: false,
  users: null,
  successMessage: null,
};

// Using builder callback notation (RTK 2.0 compatible)
export const userReducer = createReducer(initialState, (builder) => {
  builder
    // Load User
    .addCase("LoadUserRequest", (state) => {
      state.loading = true;
    })
    .addCase("LoadUserSuccess", (state, action) => {
      state.isAuthenticated = true;
      state.loading = false;
      state.user = action.payload;
      state.error = null;
    })
    .addCase("LoadUserFail", (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      state.user = null;
    })
    
    // Logout User
    .addCase("LogoutRequest", (state) => {
      state.loading = true;
    })
    .addCase("LogoutSuccess", (state) => {
      state.isAuthenticated = false;
      state.loading = false;
      state.user = null;
      state.error = null;
      state.successMessage = null;
    })
    .addCase("LogoutFail", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    
    // Update User Info
    .addCase("updateUserInfoRequest", (state) => {
      state.loading = true;
    })
    .addCase("updateUserInfoSuccess", (state, action) => {
      state.loading = false;
      state.user = action.payload;
      state.error = null;
    })
    .addCase("updateUserInfoFailed", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    
    // Update User Address
    .addCase("updateUserAddressRequest", (state) => {
      state.addressloading = true;
    })
    .addCase("updateUserAddressSuccess", (state, action) => {
      state.addressloading = false;
      state.successMessage = action.payload.successMessage;
      state.user = action.payload.user;
      state.error = null;
    })
    .addCase("updateUserAddressFailed", (state, action) => {
      state.addressloading = false;
      state.error = action.payload;
    })
    
    // Delete User Address
    .addCase("deleteUserAddressRequest", (state) => {
      state.addressloading = true;
    })
    .addCase("deleteUserAddressSuccess", (state, action) => {
      state.addressloading = false;
      state.successMessage = action.payload.successMessage;
      state.user = action.payload.user;
      state.error = null;
    })
    .addCase("deleteUserAddressFailed", (state, action) => {
      state.addressloading = false;
      state.error = action.payload;
    })
    
    // Get All Users (Admin)
    .addCase("getAllUsersRequest", (state) => {
      state.usersLoading = true;
    })
    .addCase("getAllUsersSuccess", (state, action) => {
      state.usersLoading = false;
      state.users = action.payload;
      state.error = null;
    })
    .addCase("getAllUsersFailed", (state, action) => {
      state.usersLoading = false;
      state.error = action.payload;
    })
    
    // Clear Errors
    .addCase("clearErrors", (state) => {
      state.error = null;
      state.successMessage = null;
    })
    
    // Add default case
    .addDefaultCase((state) => state);
});

export default userReducer;