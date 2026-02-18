// redux/actions/user.js
import axios from "axios";
import { server } from "../../server";

// Load user (includes admin, seller, regular user)
export const loadUser = () => async (dispatch) => {
  try {
    dispatch({
      type: "LoadUserRequest",
    });
    const { data } = await axios.get(`${server}/user/getuser`, {
      withCredentials: true,
    });
    
    // Check if user is suspended
    if (data.user?.isSuspended) {
      dispatch({
        type: "UserSuspended",
        payload: { 
          message: "Your account has been suspended",
          reason: data.user.suspensionReason 
        },
      });
      return;
    }
    
    dispatch({
      type: "LoadUserSuccess",
      payload: data.user,
    });
  } catch (error) {
    // Handle suspension error from backend
    if (error.response?.status === 403 && error.response?.data?.isSuspended) {
      dispatch({
        type: "UserSuspended",
        payload: error.response.data,
      });
    } else {
      dispatch({
        type: "LoadUserFail",
        payload: error.response?.data?.message || error.message,
      });
    }
  }
};

// Load seller (only for sellers)
export const loadSeller = () => async (dispatch) => {
  try {
    dispatch({
      type: "LoadSellerRequest",
    });
    const { data } = await axios.get(`${server}/shop/getSeller`, {
      withCredentials: true,
    });
    
    // Check if seller is suspended
    if (data.seller?.isSuspended) {
      dispatch({
        type: "SellerSuspended",
        payload: { 
          message: "Your seller account has been suspended",
          reason: data.seller.suspensionReason 
        },
      });
      return;
    }
    
    dispatch({
      type: "LoadSellerSuccess",
      payload: data.seller,
    });
  } catch (error) {
    if (error.response?.status === 403 && error.response?.data?.isSuspended) {
      dispatch({
        type: "SellerSuspended",
        payload: error.response.data,
      });
    } else {
      dispatch({
        type: "LoadSellerFail",
        payload: error.response?.data?.message || error.message,
      });
    }
  }
};

// Load admin (only for admins)
export const loadAdmin = () => async (dispatch) => {
  try {
    dispatch({
      type: "LoadAdminRequest",
    });
    const { data } = await axios.get(`${server}/user/getuser`, {
      withCredentials: true,
    });
    
    // Check if admin is suspended
    if (data.user?.isSuspended) {
      dispatch({
        type: "AdminSuspended",
        payload: { 
          message: "Your admin account has been suspended",
          reason: data.user.suspensionReason 
        },
      });
      return;
    }
    
    dispatch({
      type: "LoadAdminSuccess",
      payload: data.user,
    });
  } catch (error) {
    if (error.response?.status === 403 && error.response?.data?.isSuspended) {
      dispatch({
        type: "AdminSuspended",
        payload: error.response.data,
      });
    } else {
      dispatch({
        type: "LoadAdminFail",
        payload: error.response?.data?.message || error.message,
      });
    }
  }
};

// Login user (includes admin, seller, regular user)
export const loginUser = (email, password) => async (dispatch) => {
  try {
    dispatch({
      type: "UserLoginRequest",
    });
    const { data } = await axios.post(
      `${server}/user/login-user`,
      { email, password },
      { withCredentials: true }
    );
    
    // Check if user is suspended
    if (data.user?.isSuspended) {
      dispatch({
        type: "UserSuspended",
        payload: { 
          message: "Your account has been suspended. Please contact support.",
          reason: data.user.suspensionReason 
        },
      });
      return { success: false, error: "Account suspended", isSuspended: true };
    }
    
    dispatch({
      type: "UserLoginSuccess",
      payload: data.user,
    });
    return { success: true, data: data.user };
  } catch (error) {
    // Check if error is due to suspension
    if (error.response?.status === 403 && error.response?.data?.isSuspended) {
      dispatch({
        type: "UserSuspended",
        payload: {
          message: error.response.data.message,
          reason: error.response.data.suspensionReason
        },
      });
      return { success: false, error: "Account suspended", isSuspended: true };
    }
    
    dispatch({
      type: "UserLoginFail",
      payload: error.response?.data?.message || error.message,
    });
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

// Login seller
export const loginSeller = (email, password) => async (dispatch) => {
  try {
    dispatch({
      type: "SellerLoginRequest",
    });
    const { data } = await axios.post(
      `${server}/shop/login-shop`,
      { email, password },
      { withCredentials: true }
    );
    
    // Check if seller is suspended
    if (data.seller?.isSuspended) {
      dispatch({
        type: "SellerSuspended",
        payload: { 
          message: "Your seller account has been suspended. Please contact support.",
          reason: data.seller.suspensionReason 
        },
      });
      return { success: false, error: "Account suspended", isSuspended: true };
    }
    
    dispatch({
      type: "SellerLoginSuccess",
      payload: data.seller,
    });
    return { success: true, data: data.seller };
  } catch (error) {
    // Check if error is due to suspension
    if (error.response?.status === 403 && error.response?.data?.isSuspended) {
      dispatch({
        type: "SellerSuspended",
        payload: {
          message: error.response.data.message,
          reason: error.response.data.suspensionReason
        },
      });
      return { success: false, error: "Account suspended", isSuspended: true };
    }
    
    dispatch({
      type: "SellerLoginFail",
      payload: error.response?.data?.message || error.message,
    });
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

// User update information
export const updateUserInformation =
  (name, email, phoneNumber, password) => async (dispatch) => {
    try {
      dispatch({
        type: "updateUserInfoRequest",
      });

      const { data } = await axios.put(
        `${server}/user/update-user-info`,
        {
          name,
          email,
          phoneNumber,
          password,
        },
        {
          withCredentials: true,
        }
      );
      
      // Check if user is suspended after update
      if (data.user?.isSuspended) {
        dispatch({
          type: "UserSuspended",
          payload: { 
            message: "Your account has been suspended",
            reason: data.user.suspensionReason 
          },
        });
        return;
      }
      
      dispatch({
        type: "updateUserInfoSuccess",
        payload: data.user,
      });
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.isSuspended) {
        dispatch({
          type: "UserSuspended",
          payload: error.response.data,
        });
      } else {
        dispatch({
          type: "updateUserInfoFailed",
          payload: error.response?.data?.message || error.message,
        });
      }
    }
  };

// Update user address
export const updatUserAddress =
  (country, city, address1, address2, zipCode, addressType) =>
  async (dispatch) => {
    try {
      dispatch({
        type: "updateUserAddressRequest",
      });

      const { data } = await axios.put(
        `${server}/user/update-user-addresses`,
        {
          country,
          city,
          address1,
          address2,
          zipCode,
          addressType,
        },
        { withCredentials: true }
      );

      // Check if user is suspended after update
      if (data.user?.isSuspended) {
        dispatch({
          type: "UserSuspended",
          payload: { 
            message: "Your account has been suspended",
            reason: data.user.suspensionReason 
          },
        });
        return;
      }

      dispatch({
        type: "updateUserAddressSuccess",
        payload: {
          successMessage: "User address updated successfully!",
          user: data.user,
        },
      });
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.isSuspended) {
        dispatch({
          type: "UserSuspended",
          payload: error.response.data,
        });
      } else {
        dispatch({
          type: "updateUserAddressFailed",
          payload: error.response?.data?.message || error.message,
        });
      }
    }
  };

// Delete user address
export const deleteUserAddress = (id) => async (dispatch) => {
  try {
    dispatch({
      type: "deleteUserAddressRequest",
    });

    const { data } = await axios.delete(
      `${server}/user/delete-user-address/${id}`,
      { withCredentials: true }
    );

    // Check if user is suspended after delete
    if (data.user?.isSuspended) {
      dispatch({
        type: "UserSuspended",
        payload: { 
          message: "Your account has been suspended",
          reason: data.user.suspensionReason 
        },
      });
      return;
    }

    dispatch({
      type: "deleteUserAddressSuccess",
      payload: {
        successMessage: "Address deleted successfully!",
        user: data.user,
      },
    });
  } catch (error) {
    if (error.response?.status === 403 && error.response?.data?.isSuspended) {
      dispatch({
        type: "UserSuspended",
        payload: error.response.data,
      });
    } else {
      dispatch({
        type: "deleteUserAddressFailed",
        payload: error.response?.data?.message || error.message,
      });
    }
  }
};

// Get all users --- admin
export const getAllUsers = () => async (dispatch) => {
  try {
    dispatch({
      type: "getAllUsersRequest",
    });

    const { data } = await axios.get(`${server}/user/admin-all-users`, {
      withCredentials: true,
    });

    dispatch({
      type: "getAllUsersSuccess",
      payload: data.users,
    });
  } catch (error) {
    dispatch({
      type: "getAllUsersFailed",
      payload: error.response?.data?.message || error.message,
    });
  }
};

// Admin: Suspend user
export const suspendUser = (userId, reason) => async (dispatch) => {
  try {
    dispatch({
      type: "SuspendUserRequest",
    });

    const { data } = await axios.put(
      `${server}/admin/suspend-user/${userId}`,
      { reason },
      {
        withCredentials: true,
      }
    );

    dispatch({
      type: "SuspendUserSuccess",
      payload: { userId, reason, message: data.message },
    });

    return { success: true };
  } catch (error) {
    dispatch({
      type: "SuspendUserFail",
      payload: error.response?.data?.message || error.message,
    });
    return { success: false, error: error.response?.data?.message };
  }
};

// Admin: Unsuspend user
export const unsuspendUser = (userId) => async (dispatch) => {
  try {
    dispatch({
      type: "UnsuspendUserRequest",
    });

    const { data } = await axios.put(
      `${server}/admin/unsuspend-user/${userId}`,
      {},
      {
        withCredentials: true,
      }
    );

    dispatch({
      type: "UnsuspendUserSuccess",
      payload: { userId, message: data.message },
    });

    return { success: true };
  } catch (error) {
    dispatch({
      type: "UnsuspendUserFail",
      payload: error.response?.data?.message || error.message,
    });
    return { success: false, error: error.response?.data?.message };
  }
};

// Logout all roles
export const logoutUser = () => async (dispatch) => {
  try {
    await axios.get(`${server}/user/logout`, {
      withCredentials: true,
    });
    
    // Clear all tokens
    localStorage.removeItem('user_token');
    localStorage.removeItem('seller_token');
    localStorage.removeItem('admin_token');
    
    dispatch({
      type: "LogoutSuccess",
    });
  } catch (error) {
    // Even if API fails, clear local state
    localStorage.removeItem('user_token');
    localStorage.removeItem('seller_token');
    localStorage.removeItem('admin_token');
    
    dispatch({
      type: "LogoutSuccess",
    });
  }
};