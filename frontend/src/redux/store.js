// frontend/src/redux/store.js - COMPLETE UPDATED VERSION
import { configureStore } from "@reduxjs/toolkit";
import { userReducer } from "./reducers/user";
import { sellerReducer } from "./reducers/seller";
import { productReducer } from "./reducers/product";
import { eventReducer } from "./reducers/event";
import { cartReducer } from "./reducers/cart";
import { wishlistReducer } from "./reducers/wishlist";
import { orderReducer } from "./reducers/order";

const Store = configureStore({
  reducer: {
    user: userReducer,
    seller: sellerReducer,
    products: productReducer,
    events: eventReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    order: orderReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
        ignoredActionPaths: ['payload.createdAt', 'payload.updatedAt', 'meta.arg'],
        ignoredPaths: ['cart', 'wishlist'],
      },
    }),
  devTools: process.env.NODE_ENV === "development",
});

// Optional: Add store logging for debugging
if (process.env.NODE_ENV === "development") {
  Store.subscribe(() => {
    const state = Store.getState();
    console.group("Redux Store Update");
    console.log("State:", {
      user: state.user?.user?.email,
      seller: state.seller?.seller?.name,
      productsCount: state.products?.products?.length,
      cartItems: state.cart?.cart?.length,
      wishlistItems: state.wishlist?.wishlist?.length
    });
    console.groupEnd();
  });
}

export default Store;