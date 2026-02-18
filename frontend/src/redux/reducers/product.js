// redux/reducers/product.js
import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  // Loading states
  isLoading: false,
  success: false,
  error: null,
  message: null,
  
  // Product states
  product: null,
  products: [],
  allProducts: [],
  
  // DummyJSON states
  dummyJSONProducts: [],
  dummyJSONTotal: 0,
  dummyJSONPage: 1,
  dummyJSONLimit: 12,
  dummyJSONTotalPages: 0,
  importResults: null,
  dummyJSONProductDetails: null,
  dummyJSONCategories: [],
};

export const productReducer = createReducer(initialState, (builder) => {
  builder
    // ==================== PRODUCT CREATE ====================
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
    })
    .addCase("productCreateFail", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.success = false;
      state.product = null;
    })

    // ==================== GET SHOP PRODUCTS ====================
    .addCase("getAllProductsShopRequest", (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase("getAllProductsShopSuccess", (state, action) => {
      state.isLoading = false;
      state.products = action.payload || [];
      state.error = null;
    })
    .addCase("getAllProductsShopFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.products = [];
    })

    // ==================== DELETE PRODUCT ====================
    .addCase("deleteProductRequest", (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase("deleteProductSuccess", (state, action) => {
      state.isLoading = false;
      state.message = action.payload;
      state.success = true;
      state.error = null;
    })
    .addCase("deleteProductFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.success = false;
    })

    // ==================== GET ALL PRODUCTS ====================
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

    // ==================== DUMMYJSON - FETCH PRODUCTS ====================
    .addCase("fetchDummyJSONProductsRequest", (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = false;
    })
    .addCase("fetchDummyJSONProductsSuccess", (state, action) => {
      state.isLoading = false;
      state.dummyJSONProducts = action.payload.products || [];
      state.dummyJSONTotal = action.payload.total || 0;
      state.dummyJSONPage = action.payload.page || 1;
      state.dummyJSONLimit = action.payload.limit || 12;
      state.dummyJSONTotalPages = action.payload.totalPages || 0;
      state.success = true;
      state.error = null;
      
      console.log("✅ Reducer updated with DummyJSON products:", {
        count: state.dummyJSONProducts.length,
        total: state.dummyJSONTotal,
        page: state.dummyJSONPage,
        totalPages: state.dummyJSONTotalPages
      });
    })
    .addCase("fetchDummyJSONProductsFail", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.success = false;
      state.dummyJSONProducts = [];
      state.dummyJSONTotal = 0;
      state.dummyJSONTotalPages = 0;
    })

    // ==================== DUMMYJSON - IMPORT PRODUCTS ====================
    .addCase("importDummyJSONProductsRequest", (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = false;
      state.importResults = null;
    })
    .addCase("importDummyJSONProductsSuccess", (state, action) => {
      state.isLoading = false;
      state.importResults = action.payload;
      state.success = true;
      state.error = null;
      
      console.log("✅ Import results saved:", action.payload);
    })
    .addCase("importDummyJSONProductsFail", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.success = false;
      state.importResults = null;
    })

    // ==================== DUMMYJSON - GET PRODUCT DETAILS ====================
    .addCase("getDummyJSONProductDetailsRequest", (state) => {
      state.isLoading = true;
      state.error = null;
      state.dummyJSONProductDetails = null;
    })
    .addCase("getDummyJSONProductDetailsSuccess", (state, action) => {
      state.isLoading = false;
      state.dummyJSONProductDetails = action.payload;
      state.success = true;
      state.error = null;
    })
    .addCase("getDummyJSONProductDetailsFail", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.success = false;
      state.dummyJSONProductDetails = null;
    })

    // ==================== DUMMYJSON - CATEGORIES ====================
    .addCase("fetchDummyJSONCategoriesSuccess", (state, action) => {
      state.dummyJSONCategories = action.payload;
    })

    // ==================== CLEAR DUMMYJSON PRODUCTS ====================
    .addCase("clearDummyJSONProducts", (state) => {
      state.dummyJSONProducts = [];
      state.dummyJSONTotal = 0;
      state.dummyJSONPage = 1;
      state.dummyJSONLimit = 12;
      state.dummyJSONTotalPages = 0;
      state.dummyJSONProductDetails = null;
      state.importResults = null;
      state.error = null;
    })

    // ==================== CLEAR ERRORS ====================
    .addCase("clearErrors", (state) => {
      state.error = null;
      state.success = false;
      state.message = null;
    });
});