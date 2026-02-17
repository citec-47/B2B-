<<<<<<< HEAD
// redux/actions/product.js
import axios from "axios";
import { server } from "../../server";

// ==================== PRODUCT CRUD ACTIONS ====================

=======
import axios from "axios";
import { server } from "../../server";

>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
// create product
export const createProduct = (newForm) => async (dispatch) => {
  try {
    dispatch({
      type: "productCreateRequest",
    });

<<<<<<< HEAD
    const token = localStorage.getItem('seller_token');
=======
    // Get the authentication token from localStorage
    const token = localStorage.getItem('seller_token') || 
                  localStorage.getItem('user_token') || 
                  localStorage.getItem('admin_token');
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31

    const config = { 
      headers: { 
        "Content-Type": "multipart/form-data",
<<<<<<< HEAD
        "Authorization": `Bearer ${token}`
      },
=======
        // Add Authorization header
        "Authorization": `Bearer ${token}`
      },
      // Also add withCredentials for cookies
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
      withCredentials: true 
    };

    const { data } = await axios.post(
      `${server}/product/create-product`,
      newForm,
<<<<<<< HEAD
      config
=======
      config  // Pass the config with headers
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
    );
    
    dispatch({
      type: "productCreateSuccess",
      payload: data.product,
    });
  } catch (error) {
    dispatch({
      type: "productCreateFail",
<<<<<<< HEAD
      payload: error.response?.data?.message || error.message,
=======
      payload: error.response.data.message,
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
    });
  }
};

// get All Products of a shop
export const getAllProductsShop = (id) => async (dispatch) => {
  try {
    dispatch({
      type: "getAllProductsShopRequest",
    });

    const { data } = await axios.get(
      `${server}/product/get-all-products-shop/${id}`
    );
    dispatch({
      type: "getAllProductsShopSuccess",
      payload: data.products,
    });
  } catch (error) {
    dispatch({
      type: "getAllProductsShopFailed",
<<<<<<< HEAD
      payload: error.response?.data?.message || error.message,
=======
      payload: error.response.data.message,
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
    });
  }
};

// delete product of a shop
export const deleteProduct = (id) => async (dispatch) => {
  try {
    dispatch({
      type: "deleteProductRequest",
    });

<<<<<<< HEAD
    const token = localStorage.getItem('seller_token');
=======
    // Get token for delete request too
    const token = localStorage.getItem('seller_token') || 
                  localStorage.getItem('user_token') || 
                  localStorage.getItem('admin_token');
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31

    const { data } = await axios.delete(
      `${server}/product/delete-shop-product/${id}`,
      {
        headers: {
          "Authorization": `Bearer ${token}`
        },
        withCredentials: true,
      }
    );

    dispatch({
      type: "deleteProductSuccess",
      payload: data.message,
    });
  } catch (error) {
    dispatch({
      type: "deleteProductFailed",
<<<<<<< HEAD
      payload: error.response?.data?.message || error.message,
=======
      payload: error.response.data.message,
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
    });
  }
};

// get all products
export const getAllProducts = () => async (dispatch) => {
  try {
    dispatch({
      type: "getAllProductsRequest",
    });

    const { data } = await axios.get(`${server}/product/get-all-products`);
    dispatch({
      type: "getAllProductsSuccess",
      payload: data.products,
    });
  } catch (error) {
    dispatch({
      type: "getAllProductsFailed",
<<<<<<< HEAD
      payload: error.response?.data?.message || error.message,
    });
  }
};

// ==================== DUMMYJSON API ACTIONS ====================

// Fetch products from DummyJSON API - PUBLIC ENDPOINT
export const fetchDummyJSONProducts = (params) => async (dispatch) => {
  try {
    dispatch({
      type: "fetchDummyJSONProductsRequest",
    });

    const queryParams = new URLSearchParams();
    if (params.query) queryParams.append("query", params.query);
    if (params.category) queryParams.append("category", params.category);
    if (params.minPrice) queryParams.append("minPrice", params.minPrice);
    if (params.maxPrice) queryParams.append("maxPrice", params.maxPrice);
    if (params.sort) queryParams.append("sort", params.sort);
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);

    const url = `${server}/dummyjson/search?${queryParams.toString()}`;
    console.log("🔍 Fetching DummyJSON products from:", url);

    const { data } = await axios.get(url);
    
    console.log("✅ DummyJSON search response:", data);

    if (data.success) {
      dispatch({
        type: "fetchDummyJSONProductsSuccess",
        payload: {
          products: data.products || [],
          total: data.total || 0,
          page: data.page || parseInt(params.page) || 1,
          limit: data.limit || parseInt(params.limit) || 12,
          totalPages: data.totalPages || 0,
          message: data.message || ""
        },
      });
    } else {
      dispatch({
        type: "fetchDummyJSONProductsFail",
        payload: data.message || "Failed to fetch products",
      });
    }
  } catch (error) {
    console.error("❌ Fetch DummyJSON error:", error);
    dispatch({
      type: "fetchDummyJSONProductsFail",
      payload: error.response?.data?.message || error.message || "Failed to fetch products",
    });
  }
};

// Import products from DummyJSON - SELLER ONLY
export const importDummyJSONProducts = (productsData) => async (dispatch) => {
  try {
    dispatch({
      type: "importDummyJSONProductsRequest",
    });

    const token = localStorage.getItem('seller_token');
    
    if (!token) {
      dispatch({
        type: "importDummyJSONProductsFail",
        payload: "Seller authentication required. Please login again.",
      });
      return;
    }

    const config = {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      withCredentials: true
    };

    const url = `${server}/dummyjson/bulk-import`;
    console.log("📥 Importing products to:", url, "Products:", productsData.products?.length);

    const { data } = await axios.post(
      url,
      productsData,
      config
    );
    
    console.log("✅ Import response:", data);

    if (data.success) {
      dispatch({
        type: "importDummyJSONProductsSuccess",
        payload: {
          success: true,
          message: data.message,
          importedCount: data.importedCount || 0,
          failedCount: data.failedCount || 0,
          results: data.results || [],
          errors: data.errors || []
        },
      });
    } else {
      dispatch({
        type: "importDummyJSONProductsFail",
        payload: data.message || "Failed to import products",
      });
    }
  } catch (error) {
    console.error("❌ Import DummyJSON error:", error);
    dispatch({
      type: "importDummyJSONProductsFail",
      payload: error.response?.data?.message || error.message || "Failed to import products",
    });
  }
};

// Get DummyJSON product details
export const getDummyJSONProductDetails = (productId) => async (dispatch) => {
  try {
    dispatch({
      type: "getDummyJSONProductDetailsRequest",
    });

    const url = `${server}/dummyjson/product/${productId}`;
    console.log("📦 Fetching product details from:", url);

    const { data } = await axios.get(url);
    
    console.log("✅ Product details response:", data);

    if (data.success) {
      dispatch({
        type: "getDummyJSONProductDetailsSuccess",
        payload: data.product,
      });
    } else {
      dispatch({
        type: "getDummyJSONProductDetailsFail",
        payload: data.message || "Failed to fetch product details",
      });
    }
  } catch (error) {
    console.error("❌ Get product details error:", error);
    dispatch({
      type: "getDummyJSONProductDetailsFail",
      payload: error.response?.data?.message || error.message || "Failed to fetch product details",
    });
  }
};

// Get DummyJSON categories
export const fetchDummyJSONCategories = () => async (dispatch) => {
  try {
    const { data } = await axios.get(`${server}/dummyjson/categories`);
    
    dispatch({
      type: "fetchDummyJSONCategoriesSuccess",
      payload: data.categories || []
    });
  } catch (error) {
    console.error("❌ Fetch categories error:", error);
    // Return default categories if API fails
    dispatch({
      type: "fetchDummyJSONCategoriesSuccess",
      payload: [
        'smartphones',
        'laptops',
        'fragrances',
        'skincare',
        'groceries',
        'home-decoration',
        'furniture',
        'tops',
        'womens-dresses',
        'womens-shoes',
        'mens-shirts',
        'mens-shoes',
        'mens-watches',
        'womens-watches',
        'womens-bags',
        'womens-jewellery',
        'sunglasses',
        'automotive',
        'motorcycle',
        'lighting'
      ]
    });
  }
};

// Clear DummyJSON products
export const clearDummyJSONProducts = () => (dispatch) => {
  dispatch({
    type: "clearDummyJSONProducts",
  });
};

// Clear errors
export const clearErrors = () => (dispatch) => {
  dispatch({
    type: "clearErrors",
  });
=======
      payload: error.response.data.message,
    });
  }
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
};