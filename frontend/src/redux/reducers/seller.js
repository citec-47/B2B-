// src/redux/reducers/seller.js - COMPLETE UPDATED VERSION
import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  isLoading: true,
  isAuthenticated: false,
  isSeller: false,
  seller: null,
  sellers: [],
  error: null,
  success: false,
};

export const sellerReducer = createReducer(initialState, (builder) => {
  builder
    // Load seller
    .addCase("LoadSellerRequest", (state) => {
      state.isLoading = true;
    })
    .addCase("LoadSellerSuccess", (state, action) => {
      state.isLoading = false;
      state.seller = action.payload;
      state.isAuthenticated = true;
      state.isSeller = true;
      state.error = null;
      state.success = true;
    })
    .addCase("LoadSellerFail", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      state.isSeller = false;
      state.success = false;
    })

    // Seller login
    .addCase("SellerLoginRequest", (state) => {
      state.isLoading = true;
    })
    .addCase("SellerLoginSuccess", (state, action) => {
      state.isLoading = false;
      state.seller = action.payload;
      state.isAuthenticated = true;
      state.isSeller = true;
      state.error = null;
      state.success = true;
    })
    .addCase("SellerLoginFail", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      state.isSeller = false;
      state.success = false;
    })

    // Seller logout
    .addCase("SellerLogoutSuccess", (state) => {
      state.isLoading = false;
      state.seller = null;
      state.isAuthenticated = false;
      state.isSeller = false;
      state.success = true;
    })

    // Get all sellers ---admin
    .addCase("getAllSellersRequest", (state) => {
      state.isLoading = true;
    })
    .addCase("getAllSellersSuccess", (state, action) => {
      state.isLoading = false;
      state.sellers = action.payload;
      state.success = true;
    })
    .addCase("getAllSellersFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.success = false;
    })

    // Clear errors
    .addCase("clearErrors", (state) => {
      state.error = null;
    });
});