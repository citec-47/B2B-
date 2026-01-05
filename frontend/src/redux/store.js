import { configureStore } from "@reduxjs/toolkit";
import { userReducer } from "./reducers/user";
import { sellerReducer } from "./reducers/seller";
import { productReducer } from "./reducers/product";
import { eventReducer } from "./reducers/event";
import { cartReducer } from "./reducers/cart";
import { wishlistReducer } from "./reducers/wishlist";
import { orderReducer } from "./reducers/order";
import thunk from "redux-thunk";  // Changed from { thunk }

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
        // Ignore these action types
        ignoredActions: ['persist/PERSIST'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.createdAt', 'payload.updatedAt'],
        // Ignore these paths in the state
        ignoredPaths: ['cart', 'wishlist'],
      },
    }).concat(thunk),  // thunk is now imported correctly
  devTools: process.env.NODE_ENV === "development",
});

// Optional development logging
if (process.env.NODE_ENV === "development") {
  Store.subscribe(() => {
    console.group("Redux Store Update");
    console.log("State:", Store.getState());
    console.groupEnd();
  });
}

export default Store;