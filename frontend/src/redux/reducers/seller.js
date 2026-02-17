import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  isLoading: true,
<<<<<<< HEAD
  isSeller: false,
  seller: null,
  sellers: [],
  isSuspended: false,
  suspensionReason: null,
  suspensionMessage: null,
  error: null,
=======
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
};

export const sellerReducer = createReducer(initialState, {
  LoadSellerRequest: (state) => {
    state.isLoading = true;
<<<<<<< HEAD
    state.isSuspended = false;
    state.suspensionMessage = null;
=======
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
  },
  LoadSellerSuccess: (state, action) => {
    state.isSeller = true;
    state.isLoading = false;
    state.seller = action.payload;
<<<<<<< HEAD
    state.isSuspended = action.payload?.isSuspended || false;
    state.suspensionReason = action.payload?.suspensionReason || null;
    state.error = null;
=======
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
  },
  LoadSellerFail: (state, action) => {
    state.isLoading = false;
    state.error = action.payload;
    state.isSeller = false;
<<<<<<< HEAD
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
=======
  },
  // get all sellers ---admin
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
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

<<<<<<< HEAD
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
=======
  clearErrors: (state) => {
    state.error = null;
  },
});

// reducer -> logic (state change)
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
