import axios from "axios";
import { server } from "../../server";

// Get all orders of seller - FIXED FOR YOUR CONFIG
export const getAllOrdersOfShop = (shopId) => async (dispatch) => {
  try {
    dispatch({
      type: "getAllOrdersShopRequest",
    });

    console.log(`🛍️ Fetching orders for shop: ${shopId}`);
    console.log(`🌐 Server URL: ${server}`);
    
    // Your server already includes /api/v2, so DON'T add it again
    // server = "http://localhost:5000/api/v2"
    // So endpoint = "http://localhost:5000/api/v2/order/get-seller-all-orders/${shopId}"
    const endpoint = `${server}/order/get-seller-all-orders/${shopId}`;
    console.log(`📞 Calling endpoint: ${endpoint}`);
    
    const { data } = await axios.get(
      endpoint,
      { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("✅ API Response:", {
      success: data.success,
      ordersCount: data.orders?.length || 0,
      message: data.message || "No message"
    });

    if (data.success && Array.isArray(data.orders)) {
      console.log(`📦 Dispatching ${data.orders.length} orders`);
      dispatch({
        type: "getAllOrdersShopSuccess",
        payload: data.orders,
      });
    } else {
      console.log("📭 No orders or empty array received");
      dispatch({
        type: "getAllOrdersShopSuccess",
        payload: [],
      });
    }
  } catch (error) {
    console.error("❌ API Error Details:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    dispatch({
      type: "getAllOrdersShopFailed",
      payload: error.response?.data?.message || error.message,
    });
  }
};

// get all orders of user - FIXED
export const getAllOrdersOfUser = (userId) => async (dispatch) => {
  try {
    dispatch({
      type: "getAllOrdersUserRequest",
    });

    const { data } = await axios.get(
      `${server}/order/get-user-orders/${userId}`,
      { withCredentials: true }
    );

    dispatch({
      type: "getAllOrdersUserSuccess",
      payload: data.orders,
    });
  } catch (error) {
    dispatch({
      type: "getAllOrdersUserFailed",
      payload: error.response?.data?.message || error.message,
    });
  }
};

// get all orders of Admin - FIXED
export const getAllOrdersOfAdmin = () => async (dispatch) => {
  try {
    dispatch({
      type: "adminAllOrdersRequest",
    });

    const { data } = await axios.get(
      `${server}/order/admin-all-orders`, 
      {
        withCredentials: true,
      }
    );

    dispatch({
      type: "adminAllOrdersSuccess",
      payload: data.orders,
    });
  } catch (error) {
    dispatch({
      type: "adminAllOrdersFailed",
      payload: error.response?.data?.message || error.message,
    });
  }
};