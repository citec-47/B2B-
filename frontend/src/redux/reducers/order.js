import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  isLoading: true,
  adminOrderLoading: false,
  orders: [],
  adminOrders: [],
  order: null,
  error: null,
  success: false,
  message: null,
};

export const orderReducer = createReducer(initialState, (builder) => {
  builder
    // Get all orders of user
    .addCase("getAllOrdersUserRequest", (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase("getAllOrdersUserSuccess", (state, action) => {
      state.isLoading = false;
      state.orders = action.payload || [];
      state.error = null;
    })
    .addCase("getAllOrdersUserFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.orders = [];
    })

    // Get all orders of shop
    .addCase("getAllOrdersShopRequest", (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase("getAllOrdersShopSuccess", (state, action) => {
      state.isLoading = false;
      state.orders = action.payload || [];
      state.error = null;
    })
    .addCase("getAllOrdersShopFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.orders = [];
    })

    // Get all orders for admin
    .addCase("adminAllOrdersRequest", (state) => {
      state.adminOrderLoading = true;
      state.error = null;
    })
    .addCase("adminAllOrdersSuccess", (state, action) => {
      state.adminOrderLoading = false;
      state.adminOrders = action.payload || [];
      state.error = null;
    })
    .addCase("adminAllOrdersFailed", (state, action) => {
      state.adminOrderLoading = false;
      state.error = action.payload;
      state.adminOrders = [];
    })

    // Create order
    .addCase("createOrderRequest", (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = false;
    })
    .addCase("createOrderSuccess", (state, action) => {
      state.isLoading = false;
      state.order = action.payload;
      state.success = true;
      state.error = null;
    })
    .addCase("createOrderFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.success = false;
    })

    // Clear errors
    .addCase("clearErrors", (state) => {
      state.error = null;
      state.message = null;
      state.success = false;
    })
    
    // Default case
    .addDefaultCase((state) => state);
});