import axios from "axios";
import { server } from "../../server";

// create product
export const createProduct = (newForm) => async (dispatch) => {
  try {
    dispatch({
      type: "productCreateRequest",
    });

    // Get the authentication token from localStorage
    const token = localStorage.getItem('seller_token') || 
                  localStorage.getItem('user_token') || 
                  localStorage.getItem('admin_token');

    const config = { 
      headers: { 
        "Content-Type": "multipart/form-data",
        // Add Authorization header
        "Authorization": `Bearer ${token}`
      },
      // Also add withCredentials for cookies
      withCredentials: true 
    };

    const { data } = await axios.post(
      `${server}/product/create-product`,
      newForm,
      config  // Pass the config with headers
    );
    
    dispatch({
      type: "productCreateSuccess",
      payload: data.product,
    });
  } catch (error) {
    dispatch({
      type: "productCreateFail",
      payload: error.response.data.message,
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
      payload: error.response.data.message,
    });
  }
};

// delete product of a shop
export const deleteProduct = (id) => async (dispatch) => {
  try {
    dispatch({
      type: "deleteProductRequest",
    });

    // Get token for delete request too
    const token = localStorage.getItem('seller_token') || 
                  localStorage.getItem('user_token') || 
                  localStorage.getItem('admin_token');

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
      payload: error.response.data.message,
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
      payload: error.response.data.message,
    });
  }
};