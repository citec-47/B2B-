import axios from "axios";
import { server } from "../../server";

// create product
export const createProduct = (newForm) => async (dispatch) => {
  try {
    dispatch({
      type: "productCreateRequest",
    });

    const config = { headers: { "Content-Type": "multipart/form-data" } };

    const { data } = await axios.post(
      `${server}/product/create-product`,
      newForm,
      config
    );
    
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

// get All Products of a shop - FIXED WITH ERROR HANDLING
export const getAllProductsShop = (id) => async (dispatch) => {
  try {
    dispatch({
      type: "getAllProductsShopRequest",
    });

    console.log(`[PRODUCT] Fetching products for shop: ${id}`);
    
    const { data } = await axios.get(
      `${server}/product/get-all-products-shop/${id}`,
      { 
        withCredentials: true,
        timeout: 10000 
      }
    );
    
    console.log(`[PRODUCT] Success: ${data.products?.length || 0} products`);
    
    dispatch({
      type: "getAllProductsShopSuccess",
      payload: data.products || [],
    });
    
    return { success: true, products: data.products || [] };
  } catch (error) {
    console.error("[PRODUCT] Fetch shop products error:", error);
    
    // SAFE ERROR HANDLING
    let errorMessage = "Network error";
    if (error.response && error.response.data) {
      errorMessage = error.response.data.message || error.response.statusText || "Server error";
    } else if (error.request) {
      errorMessage = "No response from server. Check if backend is running.";
    } else {
      errorMessage = error.message || "Request setup error";
    }
    
    dispatch({
      type: "getAllProductsShopFailed",
      payload: errorMessage,
    });
    
    return { success: false, error: errorMessage, products: [] };
  }
};

// delete product of a shop
export const deleteProduct = (id) => async (dispatch) => {
  try {
    dispatch({
      type: "deleteProductRequest",
    });

    console.log(`[PRODUCT] Deleting product: ${id}`);
    
    const { data } = await axios.delete(
      `${server}/product/delete-shop-product/${id}`,
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

// get all products (Public - for homepage)
export const getAllProducts = () => async (dispatch) => {
  try {
    dispatch({
      type: "getAllProductsRequest",
    });

    console.log("[PRODUCT] Getting all public products...");
    
    const { data } = await axios.get(
      `${server}/product/get-all-products-public`,
      { timeout: 10000 }
    );
    
    console.log(`[PRODUCT] Received ${data.products?.length || 0} public products`);
    
    dispatch({
      type: "getAllProductsSuccess",
      payload: data.products || [],
    });
    
    return { success: true, products: data.products || [] };
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

// bulk import products
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
      `${server}/product/bulk-import-external`,
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

// fetch external products for import
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
      `${server}/product/fetch-external?${queryParams}`,
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

// get import categories
export const getImportCategories = () => async () => {
  try {
    const { data } = await axios.get(
      `${server}/product/import-categories`,
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

// import single product
export const importSingleProduct = (productData, shopId, markupPercentage = 30) => async (dispatch) => {
  try {
    const config = { 
      headers: { "Content-Type": "application/json" },
      withCredentials: true 
    };

    console.log("[PRODUCT] Importing single product:", productData.name);
    
    const { data } = await axios.post(
      `${server}/product/import-external`,
      {
        ...productData,
        shopId,
        markupPercentage
      },
      config
    );

    // Refresh products after import
    if (shopId) {
      dispatch(getAllProductsShop(shopId));
    }

    return { success: true, data };
  } catch (error) {
    console.error("[PRODUCT] Single import error:", error);
    
    let errorMessage = "Failed to import product";
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

// fix imported products (debug tool)
export const fixImportedProducts = (shopId) => async (dispatch) => {
  try {
    console.log("[PRODUCT] Fixing imported products for shop:", shopId);
    
    const { data } = await axios.post(
      `${server}/product/fix-imported-products/${shopId}`,
      {},
      { withCredentials: true }
    );

    // Refresh products after fix
    dispatch(getAllProductsShop(shopId));
    
    return { success: true, data };
  } catch (error) {
    console.error("[PRODUCT] Fix imported products error:", error);
    
    let errorMessage = "Failed to fix products";
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

// debug check products
export const debugCheckProducts = (shopId) => async () => {
  try {
    const { data } = await axios.get(
      `${server}/product/debug/check-products/${shopId}`,
      { withCredentials: true }
    );
    
    return { success: true, data };
  } catch (error) {
    console.error("[PRODUCT] Debug check error:", error);
    
    let errorMessage = "Debug check failed";
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

// clear errors
export const clearErrors = () => async (dispatch) => {
  dispatch({
    type: "clearErrors",
  });
  
  return { success: true };
};