// redux/actions/user.js - COMPATIBLE VERSION WITH EXISTING COMPONENTS
import axios from "axios";
import { apiUrl } from "../../server";

// ==================== LOAD FUNCTIONS (KEEPING OLD NAMES FOR COMPATIBILITY) ====================

// load user - OLD NAME (keep for compatibility)
export const loadUser = () => async (dispatch) => {
  try {
    console.log("👤 Loading user data...");
    dispatch({ type: "LoadUserRequest" });
    
    const { data } = await axios.get(apiUrl("/user/getuser"), {
      withCredentials: true,
      timeout: 10000,
    });
    
    console.log("✅ User loaded:", data.user?.name);
    
    // Save to localStorage for persistence
    localStorage.setItem("user-auth", JSON.stringify({
      user: data.user,
      role: data.user?.role || "user",
      timestamp: new Date().getTime()
    }));
    
    dispatch({
      type: "LoadUserSuccess",
      payload: data.user,
    });
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error("❌ Failed to load user:", error.message);
    
    // Check localStorage as fallback
    const cachedUser = localStorage.getItem("user-auth");
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        // Check if not expired (24 hours)
        if (new Date().getTime() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          console.log("📂 Using cached user data");
          dispatch({
            type: "LoadUserSuccess",
            payload: parsed.user,
          });
          return { success: true, user: parsed.user, cached: true };
        }
      } catch (cacheError) {
        console.error("❌ Error reading cached user:", cacheError);
      }
    }
    
    // Clear invalid cached data
    localStorage.removeItem("user-auth");
    localStorage.removeItem("user-token");
    
    const errorMessage = error.response?.data?.message || error.message;
    
    dispatch({
      type: "LoadUserFail",
      payload: errorMessage,
    });
    
    return { success: false, error: errorMessage };
  }
};

// load seller - OLD NAME (keep for compatibility)
export const loadSeller = () => async (dispatch) => {
  try {
    console.log("👨‍💼 Loading seller data...");
    dispatch({ type: "LoadSellerRequest" });
    
    const { data } = await axios.get(apiUrl("/shop/getSeller"), {
      withCredentials: true,
      timeout: 10000,
    });
    
    console.log("✅ Seller loaded:", data.seller?.name);
    
    // Save to localStorage for persistence
    localStorage.setItem("seller-auth", JSON.stringify({
      seller: data.seller,
      role: "seller",
      timestamp: new Date().getTime()
    }));
    
    dispatch({
      type: "LoadSellerSuccess",
      payload: data.seller,
    });
    
    return { success: true, seller: data.seller };
  } catch (error) {
    console.error("❌ Failed to load seller:", error.message);
    
    // Check localStorage as fallback
    const cachedSeller = localStorage.getItem("seller-auth");
    if (cachedSeller) {
      try {
        const parsed = JSON.parse(cachedSeller);
        // Check if not expired (24 hours)
        if (new Date().getTime() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          console.log("📂 Using cached seller data");
          dispatch({
            type: "LoadSellerSuccess",
            payload: parsed.seller,
          });
          return { success: true, seller: parsed.seller, cached: true };
        }
      } catch (cacheError) {
        console.error("❌ Error reading cached seller:", cacheError);
      }
    }
    
    // Clear invalid cached data
    localStorage.removeItem("seller-auth");
    localStorage.removeItem("seller-token");
    
    const errorMessage = error.response?.data?.message || error.message;
    
    dispatch({
      type: "LoadSellerFail",
      payload: errorMessage,
    });
    
    return { success: false, error: errorMessage };
  }
};

// ==================== LOGIN FUNCTIONS ====================

// Login user
export const loginUser = (email, password) => async (dispatch) => {
  try {
    console.log("🔐 User login attempt:", email);
    dispatch({ type: "LoginRequest" });
    
    const { data } = await axios.post(
      apiUrl("/user/login-user"),
      { email, password },
      { withCredentials: true, timeout: 10000 }
    );
    
    console.log("✅ User login successful:", data.user?.name);
    
    // Save to localStorage for persistence
    localStorage.setItem("user-auth", JSON.stringify({
      user: data.user,
      role: data.user?.role || "user",
      timestamp: new Date().getTime()
    }));
    
    // Save token separately
    if (data.token) {
      localStorage.setItem("user-token", data.token);
    }
    
    dispatch({
      type: "LoginSuccess",
      payload: data.user,
    });
    
    return { success: true, user: data.user, token: data.token };
  } catch (error) {
    console.error("❌ User login failed:", error);
    
    const errorMessage = error.response?.data?.message || error.message;
    
    dispatch({
      type: "LoginFail",
      payload: errorMessage,
    });
    
    return { success: false, error: errorMessage };
  }
};

// Login seller
export const loginSeller = (email, password) => async (dispatch) => {
  try {
    console.log("🛒 Seller login attempt:", email);
    dispatch({ type: "SellerLoginRequest" });
    
    const { data } = await axios.post(
      apiUrl("/shop/login-shop"),
      { email, password },
      { withCredentials: true, timeout: 10000 }
    );
    
    console.log("✅ Seller login successful:", data.seller?.name);
    
    // Save to localStorage for persistence
    localStorage.setItem("seller-auth", JSON.stringify({
      seller: data.seller,
      role: "seller",
      timestamp: new Date().getTime()
    }));
    
    // Save token separately
    if (data.token) {
      localStorage.setItem("seller-token", data.token);
    }
    
    dispatch({
      type: "SellerLoginSuccess",
      payload: data.seller,
    });
    
    return { success: true, seller: data.seller, token: data.token };
  } catch (error) {
    console.error("❌ Seller login failed:", error);
    
    const errorMessage = error.response?.data?.message || error.message;
    
    dispatch({
      type: "SellerLoginFail",
      payload: errorMessage,
    });
    
    return { success: false, error: errorMessage };
  }
};

// Admin login (uses user login endpoint with admin check)
export const loginAdmin = (email, password) => async (dispatch) => {
  try {
    console.log("👑 Admin login attempt:", email);
    dispatch({ type: "LoginRequest" });
    
    const { data } = await axios.post(
      apiUrl("/user/login-user"),
      { email, password },
      { withCredentials: true, timeout: 10000 }
    );
    
    // Check if user is admin
    if (data.user?.role !== 'admin') {
      throw new Error("Admin access required");
    }
    
    console.log("✅ Admin login successful:", data.user?.name);
    
    // Save to localStorage for persistence
    localStorage.setItem("user-auth", JSON.stringify({
      user: data.user,
      role: "admin",
      timestamp: new Date().getTime()
    }));
    
    if (data.token) {
      localStorage.setItem("user-token", data.token);
    }
    
    dispatch({
      type: "LoginSuccess",
      payload: data.user,
    });
    
    return { success: true, user: data.user, token: data.token };
  } catch (error) {
    console.error("❌ Admin login failed:", error);
    
    const errorMessage = error.response?.data?.message || error.message;
    
    dispatch({
      type: "LoginFail",
      payload: errorMessage,
    });
    
    return { success: false, error: errorMessage };
  }
};

// ==================== LOGOUT FUNCTIONS ====================

// User logout
export const logoutUser = () => async (dispatch) => {
  try {
    await axios.get(apiUrl("/user/logout"), {
      withCredentials: true,
    });
    
    // Clear localStorage
    localStorage.removeItem("user-auth");
    localStorage.removeItem("user-token");
    
    dispatch({
      type: "LogoutSuccess",
    });
    
    return { success: true };
  } catch (error) {
    console.error("❌ Logout failed:", error);
    
    // Still clear local storage
    localStorage.removeItem("user-auth");
    localStorage.removeItem("user-token");
    dispatch({ type: "LogoutSuccess" });
    
    return { success: true, error: error.message };
  }
};

// Seller logout
export const logoutSeller = () => async (dispatch) => {
  try {
    await axios.get(apiUrl("/shop/logout"), {
      withCredentials: true,
    });
    
    // Clear localStorage
    localStorage.removeItem("seller-auth");
    localStorage.removeItem("seller-token");
    
    dispatch({
      type: "SellerLogoutSuccess",
    });
    
    return { success: true };
  } catch (error) {
    console.error("❌ Seller logout failed:", error);
    
    // Still clear local storage
    localStorage.removeItem("seller-auth");
    localStorage.removeItem("seller-token");
    dispatch({ type: "SellerLogoutSuccess" });
    
    return { success: true, error: error.message };
  }
};

// Unified logout
export const logout = () => async (dispatch, getState) => {
  const state = getState();
  const user = state.user?.user;
  
  if (user?.role === 'seller' || state.user?.isSeller) {
    return dispatch(logoutSeller());
  } else {
    return dispatch(logoutUser());
  }
};

// ==================== USER PROFILE FUNCTIONS ====================

// User update information
export const updateUserInformation =
  (name, email, phoneNumber, password) => async (dispatch) => {
    try {
      dispatch({
        type: "updateUserInfoRequest",
      });

      const { data } = await axios.put(
        apiUrl("/user/update-user-info"),
        { name, email, phoneNumber, password },
        { withCredentials: true, timeout: 10000 }
      );
      
      // Update localStorage
      localStorage.setItem("user-auth", JSON.stringify({
        user: data.user,
        role: data.user?.role || "user",
        timestamp: new Date().getTime()
      }));
      
      dispatch({
        type: "updateUserInfoSuccess",
        payload: data.user,
      });
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error("❌ Update user info failed:", error);
      
      const errorMessage = error.response?.data?.message || error.message;
      
      dispatch({
        type: "updateUserInfoFailed",
        payload: errorMessage,
      });
      
      return { success: false, error: errorMessage };
    }
  };

// update user address
export const updatUserAddress =
  (country, city, address1, address2, zipCode, addressType) =>
  async (dispatch) => {
    try {
      dispatch({
        type: "updateUserAddressRequest",
      });

      const { data } = await axios.put(
        apiUrl("/user/update-user-addresses"),
        { country, city, address1, address2, zipCode, addressType },
        { withCredentials: true, timeout: 10000 }
      );

      // Update localStorage
      const cachedUser = localStorage.getItem("user-auth");
      if (cachedUser) {
        const parsed = JSON.parse(cachedUser);
        parsed.user = data.user;
        parsed.timestamp = new Date().getTime();
        localStorage.setItem("user-auth", JSON.stringify(parsed));
      }

      dispatch({
        type: "updateUserAddressSuccess",
        payload: {
          successMessage: "User address updated successfully!",
          user: data.user,
        },
      });
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error("❌ Update user address failed:", error);
      
      const errorMessage = error.response?.data?.message || error.message;
      
      dispatch({
        type: "updateUserAddressFailed",
        payload: errorMessage,
      });
      
      return { success: false, error: errorMessage };
    }
  };

// delete user address
export const deleteUserAddress = (id) => async (dispatch) => {
  try {
    dispatch({
      type: "deleteUserAddressRequest",
    });

    const { data } = await axios.delete(
      apiUrl(`/user/delete-user-address/${id}`),
      { withCredentials: true, timeout: 10000 }
    );

    // Update localStorage
    const cachedUser = localStorage.getItem("user-auth");
    if (cachedUser) {
      const parsed = JSON.parse(cachedUser);
      parsed.user = data.user;
      parsed.timestamp = new Date().getTime();
      localStorage.setItem("user-auth", JSON.stringify(parsed));
    }

    dispatch({
      type: "deleteUserAddressSuccess",
      payload: {
        successMessage: "Address deleted successfully!",
        user: data.user,
      },
    });
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error("❌ Delete user address failed:", error);
    
    const errorMessage = error.response?.data?.message || error.message;
    
    dispatch({
      type: "deleteUserAddressFailed",
      payload: errorMessage,
    });
    
    return { success: false, error: errorMessage };
  }
};

// ==================== ADMIN FUNCTIONS ====================

// get all users --- admin
export const getAllUsers = () => async (dispatch) => {
  try {
    dispatch({
      type: "getAllUsersRequest",
    });

    const { data } = await axios.get(apiUrl("/user/admin-all-users"), {
      withCredentials: true,
      timeout: 10000,
    });

    console.log(`✅ Loaded ${data.users?.length || 0} users`);
    
    dispatch({
      type: "getAllUsersSuccess",
      payload: data.users || [],
    });
    
    return { success: true, users: data.users || [] };
  } catch (error) {
    console.error("❌ Get all users failed:", error);
    
    const errorMessage = error.response?.data?.message || error.message;
    
    dispatch({
      type: "getAllUsersFailed",
      payload: errorMessage,
    });
    
    return { success: false, error: errorMessage, users: [] };
  }
};

// get all sellers --- admin
export const getAllSellers = () => async () => {
  try {
    const { data } = await axios.get(apiUrl("/shop/admin-all-sellers"), {
      withCredentials: true,
      timeout: 10000,
    });
    
    return { success: true, sellers: data.sellers || [] };
  } catch (error) {
    console.error("❌ Get all sellers failed:", error);
    return { success: false, error: error.message, sellers: [] };
  }
};

// ==================== UTILITY FUNCTIONS ====================

// Get current auth state
export const getCurrentAuth = () => (dispatch, getState) => {
  const state = getState();
  const user = state.user?.user;
  
  return {
    isAuthenticated: state.user?.isAuthenticated || false,
    user: user,
    role: user?.role || 'guest',
    isAdmin: user?.role === 'admin',
    isSeller: state.user?.isSeller || false,
    isLoading: state.user?.isLoading || false
  };
};

// Check if user is authenticated
export const checkAuth = () => async (dispatch) => {
  try {
    // Check both possible auth states
    const userAuth = localStorage.getItem("user-auth");
    const sellerAuth = localStorage.getItem("seller-auth");
    
    if (userAuth) {
      return dispatch(loadUser());
    } else if (sellerAuth) {
      return dispatch(loadSeller());
    }
    
    return { success: false, error: "No auth found" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Clear errors
export const clearErrors = () => async (dispatch) => {
  dispatch({
    type: "clearErrors",
  });
  
  return { success: true };
};

// Debug function to test all endpoints
export const testAllEndpoints = () => async () => {
  const endpoints = [
    "/user/getuser",
    "/shop/getSeller",
    "/user/login-user",
    "/shop/login-shop",
    "/user/logout",
    "/shop/logout",
    "/user/admin-all-users",
    "/shop/admin-all-sellers"
  ];
  
  console.log("🔍 Testing all user endpoints...");
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const method = endpoint.includes('login') ? 'POST' : 'GET';
      const response = await fetch(apiUrl(endpoint), {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: endpoint.includes('login')
          ? JSON.stringify({ email: 'test@test.com', password: 'test123' })
          : undefined,
        credentials: 'include'
      });
      
      const data = await response.json().catch(() => ({}));
      
      results.push({
        endpoint,
        status: response.status,
        ok: response.ok,
        data: data.message || data.error || "No data"
      });
      
      console.log(`${endpoint}: ${response.ok ? '✅ OK' : '❌ Failed'} (${response.status}) - ${data.message || data.error || ''}`);
    } catch (error) {
      results.push({
        endpoint,
        error: error.message
      });
      console.log(`${endpoint}: ❌ Error - ${error.message}`);
    }
  }
  
  return { success: true, results };
};