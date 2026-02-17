import axios from "axios";
import { server } from "../../server";

// get all sellers --- admin
export const getAllSellers = () => async (dispatch) => {
  try {
    dispatch({
      type: "getAllSellersRequest",
    });

    const { data } = await axios.get(`${server}/shop/admin-all-sellers`, {
      withCredentials: true,
    });

    dispatch({
      type: "getAllSellersSuccess",
      payload: data.sellers,
    });
  } catch (error) {
    dispatch({
      type: "getAllSellerFailed",
      payload: error.response?.data?.message || error.message,
    });
  }
};

// Admin: Suspend seller
export const suspendSeller = (sellerId, reason) => async (dispatch) => {
  try {
    dispatch({
      type: "SuspendSellerRequest",
    });

    const token = localStorage.getItem('admin_token');
    
    const { data } = await axios.put(
      `${server}/admin/suspend-seller/${sellerId}`,
      { reason },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true,
      }
    );

    dispatch({
      type: "SuspendSellerSuccess",
      payload: { sellerId, reason, message: data.message },
    });

    return { success: true };
  } catch (error) {
    dispatch({
      type: "SuspendSellerFail",
      payload: error.response?.data?.message || error.message,
    });
    return { success: false, error: error.response?.data?.message };
  }
};

// Admin: Unsuspend seller
export const unsuspendSeller = (sellerId) => async (dispatch) => {
  try {
    dispatch({
      type: "UnsuspendSellerRequest",
    });

    const token = localStorage.getItem('admin_token');
    
    const { data } = await axios.put(
      `${server}/admin/unsuspend-seller/${sellerId}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true,
      }
    );

    dispatch({
      type: "UnsuspendSellerSuccess",
      payload: { sellerId, message: data.message },
    });

    return { success: true };
  } catch (error) {
    dispatch({
      type: "UnsuspendSellerFail",
      payload: error.response?.data?.message || error.message,
    });
    return { success: false, error: error.response?.data?.message };
  }
};