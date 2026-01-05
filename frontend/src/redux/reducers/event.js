import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  isLoading: true,
  events: [],
  allEvents: [],
  event: null,
  error: null,
  success: false,
  message: null,
};

export const eventReducer = createReducer(initialState, (builder) => {
  builder
    // Event Create
    .addCase("eventCreateRequest", (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = false;
    })
    .addCase("eventCreateSuccess", (state, action) => {
      state.isLoading = false;
      state.event = action.payload;
      state.success = true;
      state.error = null;
    })
    .addCase("eventCreateFail", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.success = false;
    })

    // Get all events of shop
    .addCase("getAlleventsShopRequest", (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase("getAlleventsShopSuccess", (state, action) => {
      state.isLoading = false;
      state.events = action.payload || [];
      state.error = null;
    })
    .addCase("getAlleventsShopFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.events = [];
    })

    // Delete event of a shop
    .addCase("deleteeventRequest", (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase("deleteeventSuccess", (state, action) => {
      state.isLoading = false;
      state.message = action.payload;
      state.error = null;
    })
    .addCase("deleteeventFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    })

    // Get all events (public)
    .addCase("getAlleventsRequest", (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase("getAlleventsSuccess", (state, action) => {
      state.isLoading = false;
      state.allEvents = action.payload || [];
      state.error = null;
    })
    .addCase("getAlleventsFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.allEvents = [];
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