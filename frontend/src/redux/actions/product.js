// product.js actions - COMPLETE FIXED VERSION (WITHOUT DUPLICATE EXPORTS)
import axios from "axios";
import { server, apiUrl, getImageUrl } from "../../server";

// create product - FIXED
export const createProduct = (newForm) => async (dispatch) => {
  try {
    dispatch({
      type: "productCreateRequest",
    });

    const config = { 
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true 
    };

    console.log('🔄 Creating product...');
    console.log('📦 Form data:', newForm);
    
    const { data } = await axios.post(
      apiUrl("/product/create-product"),
      newForm,
      config
    );
    
    console.log('✅ Product created:', data);
    
    // Process images to ensure full URLs
    if (data.product) {
      data.product.images = data.product.images?.map(img => getImageUrl(img));
    }
    
    dispatch({
      type: "productCreateSuccess",
      payload: data.product,
    });
    
    return { success: true, data: data.product };
  } catch (error) {
    console.error("[PRODUCT] Create error:", error);
    
    let errorMessage = "Failed to create product";
    if (error.response && error.response.data) {
      errorMessage = error.response.data.message || errorMessage;
    } else if (error.request) {
      errorMessage = "No response from server";
    } else {
      errorMessage = error.message;
    }
    
    dispatch({
      type: "productCreateFail",
      payload: errorMessage,
    });
    
    return { success: false, error: errorMessage };
  }
};

// get All Products of a shop - COMPLETE FIXED VERSION
export const getAllProductsShop = (id) => async (dispatch) => {
  try {
    dispatch({
      type: "getAllProductsShopRequest",
    });

    console.log(`[PRODUCT ACTION] 🛍️ Fetching products for shop: ${id}`);
    console.log(`[PRODUCT ACTION] 🔗 API URL: ${apiUrl(`/product/get-all-products-shop/${id}`)}`);
    
    const { data } = await axios.get(
      apiUrl(`/product/get-all-products-shop/${id}`),
      { 
        withCredentials: true,
        timeout: 15000 
      }
    );
    
    console.log(`[PRODUCT ACTION] ✅ Success: ${data.products?.length || 0} products`);
    console.log(`[PRODUCT ACTION] 📊 Statistics:`, data.statistics);
    console.log(`[PRODUCT ACTION] 🌐 Backend URL: ${data.backendUrl}`);
    
    // Process all product images to ensure full URLs
    const processedProducts = data.products?.map(product => {
      const processed = { ...product };
      
      // Ensure images have full URLs
      if (processed.images && Array.isArray(processed.images)) {
        processed.images = processed.images.map(img => getImageUrl(img));
        console.log(`🖼️ Processed images for "${processed.name}":`, processed.images);
      }
      
      // Ensure shop avatar has full URL
      if (processed.shop && processed.shop.avatar) {
        processed.shop.avatar = getImageUrl(processed.shop.avatar);
      }
      
      return processed;
    }) || [];
    
    // Log sample processed product
    if (processedProducts.length > 0) {
      console.log(`[PRODUCT ACTION] 🎯 Sample processed product:`, {
        name: processedProducts[0].name,
        imageCount: processedProducts[0].images?.length,
        firstImage: processedProducts[0].images?.[0]
      });
    }
    
    dispatch({
      type: "getAllProductsShopSuccess",
      payload: processedProducts,
    });
    
    return { 
      success: true, 
      products: processedProducts,
      statistics: data.statistics
    };
    
  } catch (error) {
    console.error("[PRODUCT ACTION] ❌ Error fetching shop products:", error);
    
    let errorMessage = "Network error";
    if (error.response && error.response.data) {
      errorMessage = error.response.data.message || error.response.statusText || "Server error";
      console.error("[PRODUCT ACTION] Server response:", error.response.data);
    } else if (error.request) {
      console.error("[PRODUCT ACTION] No response from server");
      errorMessage = "No response from server. Check if backend is running at: " + server;
    } else {
      errorMessage = error.message || "Request setup error";
    }
    
    dispatch({
      type: "getAllProductsShopFailed",
      payload: errorMessage,
    });
    
    return { 
      success: false, 
      error: errorMessage, 
      products: [],
      debug: {
        server,
        apiUrl: apiUrl(`/product/get-all-products-shop/${id}`),
        error
      }
    };
  }
};

// delete product of a shop - FIXED
export const deleteProduct = (id) => async (dispatch) => {
  try {
    dispatch({
      type: "deleteProductRequest",
    });

    console.log(`[PRODUCT] Deleting product: ${id}`);
    
    const { data } = await axios.delete(
      apiUrl(`/product/delete-shop-product/${id}`),
      {
        withCredentials: true,
      }
    );

    console.log("[PRODUCT] Delete success:", data.message);
    
    dispatch({
      type: "deleteProductSuccess",
      payload: data.message,
    });
    
    return { success: true, message: data.message };
  } catch (error) {
    console.error("[PRODUCT] Delete error:", error);
    
    let errorMessage = "Failed to delete product";
    if (error.response && error.response.data) {
      errorMessage = error.response.data.message || errorMessage;
    } else if (error.request) {
      errorMessage = "No response from server";
    } else {
      errorMessage = error.message;
    }
    
    dispatch({
      type: "deleteProductFailed",
      payload: errorMessage,
    });
    
    return { success: false, error: errorMessage };
  }
};

// get all products (Public - for homepage) - FIXED
export const getAllProducts = () => async (dispatch) => {
  try {
    dispatch({
      type: "getAllProductsRequest",
    });

    console.log("[PRODUCT] Getting all public products...");
    
    const { data } = await axios.get(
      apiUrl("/product/get-all-products"),
      { timeout: 10000 }
    );
    
    console.log(`[PRODUCT] Received ${data.products?.length || 0} public products`);
    
    // Process images
    const processedProducts = data.products?.map(product => {
      const processed = { ...product };
      if (processed.images && Array.isArray(processed.images)) {
        processed.images = processed.images.map(img => getImageUrl(img));
      }
      return processed;
    }) || [];
    
    dispatch({
      type: "getAllProductsSuccess",
      payload: processedProducts,
    });
    
    return { success: true, products: processedProducts };
  } catch (error) {
    console.error("[PRODUCT] Get all products error:", error);
    
    let errorMessage = "Failed to load products";
    if (error.response && error.response.data) {
      errorMessage = error.response.data.message || errorMessage;
    } else if (error.request) {
      errorMessage = "No response from server";
    } else {
      errorMessage = error.message;
    }
    
    console.log("[PRODUCT] Using empty products array");
    dispatch({
      type: "getAllProductsSuccess",
      payload: [],
    });
    
    return { success: false, error: errorMessage, products: [] };
  }
};

// bulk import products - FIXED
export const bulkImportProducts = (productsData, shopId, markupPercentage = 30) => async (dispatch) => {
  try {
    dispatch({
      type: "bulkImportProductsRequest",
    });

    const config = { 
      headers: { 
        "Content-Type": "application/json" 
      },
      withCredentials: true 
    };

    console.log(`[PRODUCT] Bulk importing ${productsData.length} products for shop: ${shopId}`);
    
    const { data } = await axios.post(
      apiUrl("/product/bulk-import-external"),
      {
        products: productsData,
        shopId,
        markupPercentage
      },
      config
    );
    
    console.log("[PRODUCT] Bulk import successful:", data.message);
    
    dispatch({
      type: "bulkImportProductsSuccess",
      payload: data.results?.importedProducts || [],
    });

    // After successful import, refresh the products list
    if (shopId) {
      dispatch(getAllProductsShop(shopId));
    }

    return { success: true, data };
  } catch (error) {
    console.error("[PRODUCT] Bulk import error:", error);
    
    let errorMessage = "Failed to import products";
    if (error.response && error.response.data) {
      errorMessage = error.response.data.message || errorMessage;
    } else if (error.request) {
      errorMessage = "No response from server";
    } else {
      errorMessage = error.message;
    }
    
    dispatch({
      type: "bulkImportProductsFail",
      payload: errorMessage,
    });
    
    return { success: false, error: errorMessage };
  }
};

// fetch external products for import - FIXED
export const fetchExternalProducts = (params = {}) => async () => {
  try {
    const { category = "", search = "", page = 1, limit = 12 } = params;
    
    const queryParams = new URLSearchParams({
      category: category === "All" ? "" : category,
      search,
      page,
      limit,
    });

    console.log(`[PRODUCT] Fetching external products with params:`, params);
    
    const { data } = await axios.get(
      apiUrl(`/product/fetch-external?${queryParams}`),
      { withCredentials: true, timeout: 10000 }
    );

    return { success: true, data };
  } catch (error) {
    console.error("[PRODUCT] Fetch external products error:", error);
    
    let errorMessage = "Failed to fetch external products";
    if (error.response && error.response.data) {
      errorMessage = error.response.data.message || errorMessage;
    } else if (error.request) {
      errorMessage = "No response from server";
    } else {
      errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
};

// get import categories - FIXED
export const getImportCategories = () => async () => {
  try {
    const { data } = await axios.get(
      apiUrl("/product/import-categories"),
      { withCredentials: true, timeout: 5000 }
    );
    
    return { success: true, data };
  } catch (error) {
    console.error("[PRODUCT] Get import categories error:", error);
    
    // Return default categories if API fails
    const defaultCategories = ["All", "Electronics", "Fashion", "Home & Kitchen", "Beauty & Health"];
    return { 
      success: false, 
      error: error.message,
      data: { categories: defaultCategories }
    };
  }
};

// clear errors
export const clearErrors = () => async (dispatch) => {
  dispatch({
    type: "clearErrors",
  });
  
  return { success: true };
};