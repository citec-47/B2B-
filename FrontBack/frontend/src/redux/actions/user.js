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
    dispatch({
      type: "LoadUserSuccess",
      payload: data.user,
    });
  } catch (error) {
    dispatch({
      type: "LoadUserFail",
      payload: error.response?.data?.message || error.message,
    });
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
    dispatch({
      type: "LoadSellerSuccess",
      payload: data.seller,
    });
  } catch (error) {
    dispatch({
      type: "LoadSellerFail",
      payload: error.response?.data?.message || error.message,
    });
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
    dispatch({
      type: "LoadAdminSuccess",
      payload: data.user,
    });
  } catch (error) {
    dispatch({
      type: "LoadAdminFail",
      payload: error.response?.data?.message || error.message,
    });
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
    dispatch({
      type: "UserLoginSuccess",
      payload: data.user,
    });
    return { success: true, data: data.user };
  } catch (error) {
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
    dispatch({
      type: "SellerLoginSuccess",
      payload: data.seller,
    });
    return { success: true, data: data.seller };
  } catch (error) {
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
      dispatch({
        type: "updateUserInfoSuccess",
        payload: data.user,
      });
    } catch (error) {
      dispatch({
        type: "updateUserInfoFailed",
        payload: error.response?.data?.message || error.message,
      });
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

      dispatch({
        type: "updateUserAddressSuccess",
        payload: {
          successMessage: "User address updated successfully!",
          user: data.user,
        },
      });
    } catch (error) {
      dispatch({
        type: "updateUserAddressFailed",
        payload: error.response?.data?.message || error.message,
      });
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

    dispatch({
      type: "deleteUserAddressSuccess",
      payload: {
        successMessage: "Address deleted successfully!",
        user: data.user,
      },
    });
  } catch (error) {
    dispatch({
      type: "deleteUserAddressFailed",
      payload: error.response?.data?.message || error.message,
    });
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

// Logout all roles
export const logoutUser = () => async (dispatch) => {
  try {
    await axios.get(`${server}/user/logout`, {
      withCredentials: true,
    });
    
    dispatch({
      type: "LogoutSuccess",
    });
  } catch (error) {
    dispatch({
      type: "LogoutFail",
      payload: error.response?.data?.message || error.message,
    });
  }
};