import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  wishlist: localStorage.getItem("wishlistItems")
    ? JSON.parse(localStorage.getItem("wishlistItems"))
    : [],
  isLoading: false,
  error: null,
};

export const wishlistReducer = createReducer(initialState, (builder) => {
  builder
    // Add to wishlist
    .addCase("addToWishlist", (state, action) => {
      const item = action.payload;
      const isItemExist = state.wishlist.find((i) => i._id === item._id);
      
      if (isItemExist) {
        state.wishlist = state.wishlist.map((i) =>
          i._id === isItemExist._id ? item : i
        );
      } else {
        state.wishlist = [...state.wishlist, item];
      }
      
      // Update localStorage
      localStorage.setItem("wishlistItems", JSON.stringify(state.wishlist));
    })

    // Remove from wishlist
    .addCase("removeFromWishlist", (state, action) => {
      state.wishlist = state.wishlist.filter((i) => i._id !== action.payload);
      // Update localStorage
      localStorage.setItem("wishlistItems", JSON.stringify(state.wishlist));
    })

    // Clear wishlist
    .addCase("clearWishlist", (state) => {
      state.wishlist = [];
      localStorage.removeItem("wishlistItems");
    })

    // Wishlist loading states
    .addCase("wishlistRequest", (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase("wishlistSuccess", (state, action) => {
      state.isLoading = false;
      state.wishlist = action.payload || [];
      state.error = null;
    })
    .addCase("wishlistFailed", (state, action) => {
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