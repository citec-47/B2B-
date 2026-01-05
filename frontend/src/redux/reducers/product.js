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

export const productReducer = createReducer(initialState, {
  // ===== GET ALL PRODUCTS OF SHOP =====
  getAllProductsShopRequest: (state) => {
    console.log("[REDUX REDUCER] getAllProductsShopRequest");
    state.isLoading = true;
    state.error = null;
  },
  getAllProductsShopSuccess: (state, action) => {
    console.log(`[REDUX REDUCER] getAllProductsShopSuccess: Received ${action.payload.length} products`);
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
    } else {
      console.log(`[REDUX REDUCER] No products received`);
      state.statistics.total = 0;
      state.statistics.imported = 0;
      state.statistics.manual = 0;
      state.statistics.inStock = 0;
    }
  },
  getAllProductsShopFailed: (state, action) => {
    console.log(`[REDUX REDUCER] getAllProductsShopFailed: ${action.payload}`);
    state.isLoading = false;
    state.error = action.payload;
    state.products = [];
  },

  // ===== OTHER REDUCERS REMAIN THE SAME =====
  productCreateRequest: (state) => {
    state.isLoading = true;
    state.error = null;
    state.success = false;
  },
  productCreateSuccess: (state, action) => {
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
  },
  productCreateFail: (state, action) => {
    state.isLoading = false;
    state.error = action.payload;
    state.success = false;
  },
  deleteProductRequest: (state) => {
    state.isLoading = true;
    state.error = null;
  },
  deleteProductSuccess: (state, action) => {
    state.isLoading = false;
    state.message = action.payload;
    state.error = null;
  },
  deleteProductFailed: (state, action) => {
    state.isLoading = false;
    state.error = action.payload;
  },
  getAllProductsRequest: (state) => {
    state.isLoading = true;
    state.error = null;
  },
  getAllProductsSuccess: (state, action) => {
    state.isLoading = false;
    state.allProducts = action.payload || [];
    state.error = null;
  },
  getAllProductsFailed: (state, action) => {
    state.isLoading = false;
    state.error = action.payload;
    state.allProducts = [];
  },
  bulkImportProductsRequest: (state) => {
    state.isLoading = true;
    state.bulkImportLoading = true;
    state.bulkImportSuccess = false;
    state.error = null;
    state.success = false;
  },
  bulkImportProductsSuccess: (state, action) => {
    state.isLoading = false;
    state.bulkImportLoading = false;
    state.bulkImportSuccess = true;
    state.success = true;
    state.error = null;
    state.message = `Successfully imported ${action.payload.length} products`;
  },
  bulkImportProductsFail: (state, action) => {
    state.isLoading = false;
    state.bulkImportLoading = false;
    state.bulkImportSuccess = false;
    state.error = action.payload;
    state.success = false;
  },
  clearErrors: (state) => {
    state.error = null;
    state.message = null;
    state.success = false;
    state.bulkImportSuccess = false;
  },
});