// frontend/src/components/Layout/logout.js
import axios from "axios";
import { server } from "../../server";  // CHANGED from "../server" to "../../server"
import { toast } from "react-toastify";

// Utility to clear all browser storage
export const clearAllBrowserStorage = () => {
  try {
    // Clear localStorage
    const localStorageKeys = Object.keys(localStorage);
    localStorageKeys.forEach(key => {
      // Remove auth-related items
      if (key.includes('user') || key.includes('seller') || key.includes('token') || 
          key.includes('cart') || key.includes('wishlist') || key.startsWith('persist:')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear all cookies
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
    }
    
    return true;
  } catch (error) {
    console.error("Error clearing browser storage:", error);
    return false;
  }
};

// Clear Redux state
export const clearReduxState = (dispatch) => {
  try {
    // Clear user state
    dispatch({ type: "LogoutSuccess" });
    
    // Clear seller state
    dispatch({ type: "SellerLogoutSuccess" });
    
    // Clear cart
    dispatch({ type: "clearCart" });
    
    // Clear wishlist
    dispatch({ type: "clearWishlist" });
    
    return true;
  } catch (error) {
    console.error("Error clearing Redux state:", error);
    return false;
  }
};

// Server logout functions
export const logoutUserFromServer = async () => {
  try {
    const response = await axios.get(`${server}/user/logout`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.log("User server logout optional - continuing...");
    return { success: true, message: "Proceeding with client-side logout" };
  }
};

export const logoutSellerFromServer = async () => {
  try {
    const response = await axios.get(`${server}/shop/logout`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.log("Seller server logout optional - continuing...");
    return { success: true, message: "Proceeding with client-side logout" };
  }
};

// Main logout handler
export const handleLogout = async (dispatch, type = 'all') => {
  try {
    let serverResult = { success: true };
    
    // Call server logout based on type
    switch(type) {
      case 'user':
        serverResult = await logoutUserFromServer();
        break;
      case 'seller':
        serverResult = await logoutSellerFromServer();
        break;
      case 'all':
      default:
        // Try both endpoints for complete logout
        await logoutUserFromServer().catch(() => {});
        await logoutSellerFromServer().catch(() => {});
        serverResult = { success: true, message: "Logged out from all accounts" };
    }
    
    // Clear browser storage
    clearAllBrowserStorage();
    
    // Clear Redux state
    clearReduxState(dispatch);
    
    // Clear all remaining cookies (second pass)
    document.cookie.split(";").forEach(c => {
      const cookie = c.trim();
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      if (name) {
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }
    });
    
    return {
      success: true,
      serverResult,
      message: `Logged out ${type === 'all' ? 'from all accounts' : `${type} account`} successfully`
    };
    
  } catch (error) {
    console.error("Logout error:", error);
    return {
      success: false,
      error: error.message,
      message: "Logout completed with some errors"
    };
  }
};

// Redirect after logout
export const redirectAfterLogout = (type = 'all') => {
  const timestamp = Date.now();
  let redirectUrl = '/login';
  
  switch(type) {
    case 'user':
      redirectUrl = `/login?logout=user&t=${timestamp}`;
      break;
    case 'seller':
      redirectUrl = `/shop-login?logout=seller&t=${timestamp}`;
      break;
    case 'all':
    default:
      redirectUrl = `/login?logout=all&t=${timestamp}`;
      break;
  }
  
  // Force hard redirect to clear any cached state
  setTimeout(() => {
    window.location.href = redirectUrl;
  }, 500);
};

// Simple logout function
export const simpleLogout = (dispatch) => {
  try {
    // Clear storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
    });
    
    // Clear Redux
    if (dispatch) {
      dispatch({ type: "LogoutSuccess" });
      dispatch({ type: "SellerLogoutSuccess" });
      dispatch({ type: "clearCart" });
      dispatch({ type: "clearWishlist" });
    }
    
    return true;
  } catch (error) {
    console.error("Simple logout error:", error);
    return false;
  }
};