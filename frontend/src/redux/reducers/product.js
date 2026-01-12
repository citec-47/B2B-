// redux/reducers/product.js - UPDATED WITH BUILDER SYNTAX
import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  isLoading: true,
  bulkImportLoading: false,
  bulkImportSuccess: false,
  products: [],
  allProducts: [],
  error: null,
  success: false,
  message: null,
  statistics: {
    total: 0,
    imported: 0,
    manual: 0,
    inStock: 0
  }
};

export const productReducer = createReducer(initialState, (builder) => {
  builder
    // ===== GET ALL PRODUCTS OF SHOP =====
    .addCase("getAllProductsShopRequest", (state) => {
      console.log("[REDUX REDUCER] getAllProductsShopRequest");
      state.isLoading = true;
      state.error = null;
    })
    .addCase("getAllProductsShopSuccess", (state, action) => {
      console.log(`[REDUX REDUCER] getAllProductsShopSuccess: Received ${action.payload?.length || 0} products`);
      state.isLoading = false;
      state.products = action.payload || [];
      state.error = null;
      
      // Calculate statistics
      if (state.products && state.products.length > 0) {
        state.statistics.total = state.products.length;
        state.statistics.imported = state.products.filter(p => p.isImported === true).length;
        state.statistics.manual = state.products.filter(p => !p.isImported || p.isImported === false).length;
        state.statistics.inStock = state.products.filter(p => p.stock > 0).length;
        
        console.log(`[REDUX REDUCER] Statistics: Total=${state.statistics.total}, Imported=${state.statistics.imported}, Manual=${state.statistics.manual}`);
        
        // Debug image URLs
        if (state.products[0]?.images) {
          console.log(`[REDUX REDUCER] First product images:`, state.products[0].images);
        }
      } else {
        console.log(`[REDUX REDUCER] No products received`);
        state.statistics.total = 0;
        state.statistics.imported = 0;
        state.statistics.manual = 0;
        state.statistics.inStock = 0;
      }
    })
    .addCase("getAllProductsShopFailed", (state, action) => {
      console.log(`[REDUX REDUCER] getAllProductsShopFailed: ${action.payload}`);
      state.isLoading = false;
      state.error = action.payload;
      state.products = [];
    })

    // ===== CREATE PRODUCT =====
    .addCase("productCreateRequest", (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = false;
    })
    .addCase("productCreateSuccess", (state, action) => {
      state.isLoading = false;
      state.product = action.payload;
      state.success = true;
      state.error = null;
      if (state.products) {
        state.products = [action.payload, ...state.products];
      } else {
        state.products = [action.payload];
      }
      if (state.statistics) {
        state.statistics.total = state.products.length;
        state.statistics.manual = state.products.filter(p => !p.isImported).length;
        state.statistics.imported = state.products.filter(p => p.isImported).length;
      }
    })
    .addCase("productCreateFail", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.success = false;
    })

    // ===== DELETE PRODUCT =====
    .addCase("deleteProductRequest", (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase("deleteProductSuccess", (state, action) => {
      state.isLoading = false;
      state.message = action.payload;
      state.error = null;
    })
    .addCase("deleteProductFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    })

    // ===== GET ALL PRODUCTS (PUBLIC) =====
    .addCase("getAllProductsRequest", (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase("getAllProductsSuccess", (state, action) => {
      state.isLoading = false;
      state.allProducts = action.payload || [];
      state.error = null;
    })
    .addCase("getAllProductsFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.allProducts = [];
    })

    // ===== BULK IMPORT =====
    .addCase("bulkImportProductsRequest", (state) => {
      state.isLoading = true;
      state.bulkImportLoading = true;
      state.bulkImportSuccess = false;
      state.error = null;
      state.success = false;
    })
    .addCase("bulkImportProductsSuccess", (state, action) => {
      state.isLoading = false;
      state.bulkImportLoading = false;
      state.bulkImportSuccess = true;
      state.success = true;
      state.error = null;
      state.message = `Successfully imported ${action.payload?.length || 0} products`;
    })
    .addCase("bulkImportProductsFail", (state, action) => {
      state.isLoading = false;
      state.bulkImportLoading = false;
      state.bulkImportSuccess = false;
      state.error = action.payload;
      state.success = false;
    })

    // ===== CLEAR ERRORS =====
    .addCase("clearErrors", (state) => {
      state.error = null;
      state.message = null;
      state.success = false;
      state.bulkImportSuccess = false;
    });
});