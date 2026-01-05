import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  cart: localStorage.getItem("cartItems")
    ? JSON.parse(localStorage.getItem("cartItems"))
    : [],
  isLoading: false,
  error: null,
};

export const cartReducer = createReducer(initialState, (builder) => {
  builder
    // Add to cart
    .addCase("addToCart", (state, action) => {
      const item = action.payload;
      const isItemExist = state.cart.find((i) => i._id === item._id);
      
      if (isItemExist) {
        state.cart = state.cart.map((i) => 
          i._id === isItemExist._id ? item : i
        );
      } else {
        state.cart = [...state.cart, item];
      }
      
      // Update localStorage
      localStorage.setItem("cartItems", JSON.stringify(state.cart));
    })

    // Remove from cart
    .addCase("removeFromCart", (state, action) => {
      state.cart = state.cart.filter((i) => i._id !== action.payload);
      // Update localStorage
      localStorage.setItem("cartItems", JSON.stringify(state.cart));
    })

    // Clear cart
    .addCase("clearCart", (state) => {
      state.cart = [];
      localStorage.removeItem("cartItems");
    })

    // Cart loading states
    .addCase("cartRequest", (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase("cartSuccess", (state, action) => {
      state.isLoading = false;
      state.cart = action.payload || [];
      state.error = null;
    })
    .addCase("cartFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    })

    // Clear errors
    .addCase("clearErrors", (state) => {
      state.error = null;
    })
    
    // Default case
    .addDefaultCase((state) => state);
});