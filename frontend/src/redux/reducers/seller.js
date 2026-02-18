import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  isLoading: true,
  isSeller: false,
  seller: null,
  sellers: [],
  isSuspended: false,
  suspensionReason: null,
  suspensionMessage: null,
  error: null,
};

export const sellerReducer = createReducer(initialState, {
  LoadSellerRequest: (state) => {
    state.isLoading = true;
    state.isSuspended = false;
    state.suspensionMessage = null;
  },
  LoadSellerSuccess: (state, action) => {
    state.isSeller = true;
    state.isLoading = false;
    state.seller = action.payload;
    state.isSuspended = action.payload?.isSuspended || false;
    state.suspensionReason = action.payload?.suspensionReason || null;
    state.error = null;
  },
  LoadSellerFail: (state, action) => {
    state.isLoading = false;
    state.error = action.payload;
    state.isSeller = false;
    state.isSuspended = false;
  },

  // Seller Suspended
  SellerSuspended: (state, action) => {
    state.isSeller = false;
    state.isLoading = false;
    state.seller = null;
    state.isSuspended = true;
    state.suspensionMessage = action.payload?.message || 'Your seller account has been suspended';
    state.suspensionReason = action.payload?.reason || null;
    state.error = null;
  },

  // Seller Login
  SellerLoginRequest: (state) => {
    state.isLoading = true;
    state.isSuspended = false;
    state.suspensionMessage = null;
  },
  SellerLoginSuccess: (state, action) => {
    state.isSeller = true;
    state.isLoading = false;
    state.seller = action.payload;
    state.isSuspended = action.payload?.isSuspended || false;
    state.suspensionReason = action.payload?.suspensionReason || null;
    state.error = null;
  },
  SellerLoginFail: (state, action) => {
    state.isLoading = false;
    state.error = action.payload;
    state.isSeller = false;
    state.isSuspended = false;
  },

  // Get all sellers ---admin
  getAllSellersRequest: (state) => {
    state.isLoading = true;
  },
  getAllSellersSuccess: (state, action) => {
    state.isLoading = false;
    state.sellers = action.payload;
  },
  getAllSellerFailed: (state, action) => {
    state.isLoading = false;
    state.error = action.payload;
  },

  // Admin suspend seller
  SuspendSellerRequest: (state) => {
    state.isLoading = true;
  },
  SuspendSellerSuccess: (state, action) => {
    state.isLoading = false;
    // Update the seller in the sellers list
    if (state.sellers && Array.isArray(state.sellers)) {
      state.sellers = state.sellers.map(seller => 
        seller._id === action.payload.sellerId 
          ? { ...seller, isSuspended: true, suspensionReason: action.payload.reason }
          : seller
      );
    }
    // If this is the current seller, update their status
    if (state.seller && state.seller._id === action.payload.sellerId) {
      state.seller.isSuspended = true;
      state.seller.suspensionReason = action.payload.reason;
      state.isSuspended = true;
      state.suspensionReason = action.payload.reason;
    }
    state.successMessage = action.payload.message;
  },
  SuspendSellerFail: (state, action) => {
    state.isLoading = false;
    state.error = action.payload;
  },

  // Admin unsuspend seller
  UnsuspendSellerRequest: (state) => {
    state.isLoading = true;
  },
  UnsuspendSellerSuccess: (state, action) => {
    state.isLoading = false;
    // Update the seller in the sellers list
    if (state.sellers && Array.isArray(state.sellers)) {
      state.sellers = state.sellers.map(seller => 
        seller._id === action.payload.sellerId 
          ? { ...seller, isSuspended: false, suspensionReason: null }
          : seller
      );
    }
    // If this is the current seller, update their status
    if (state.seller && state.seller._id === action.payload.sellerId) {
      state.seller.isSuspended = false;
      state.seller.suspensionReason = null;
      state.isSuspended = false;
      state.suspensionReason = null;
    }
    state.successMessage = action.payload.message;
  },
  UnsuspendSellerFail: (state, action) => {
    state.isLoading = false;
    state.error = action.payload;
  },

  // Logout
  LogoutSuccess: (state) => {
    state.isSeller = false;
    state.seller = null;
    state.isSuspended = false;
    state.suspensionReason = null;
    state.suspensionMessage = null;
    state.error = null;
  },

  clearErrors: (state) => {
    state.error = null;
  },
});