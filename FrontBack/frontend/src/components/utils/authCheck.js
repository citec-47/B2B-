// utils/authCheck.js
export const saveAuthToStorage = (userData, token, role = "user") => {
  try {
    const authState = {
      user: userData,
      token: token,  // Store the token
      role: role,
      timestamp: new Date().getTime()
    };
    
    const key = role === "seller" ? "seller-auth" : "user-auth";
    localStorage.setItem(key, JSON.stringify(authState));
    console.log("💾 Saved auth to localStorage:", role, token ? "with token" : "no token");
  } catch (error) {
    console.error("❌ Failed to save auth:", error);
  }
};

export const loadAuthFromStorage = () => {
  try {
    // Check for seller auth first
    const sellerAuth = localStorage.getItem("seller-auth");
    if (sellerAuth) {
      const parsed = JSON.parse(sellerAuth);
      // Check if not expired (24 hours)
      if (new Date().getTime() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        console.log("📂 Loaded seller auth from localStorage");
        return {
          isAuthenticated: true,
          user: parsed.user,
          token: parsed.token,
          role: "seller"
        };
      }
    }

    // Check for user auth
    const userAuth = localStorage.getItem("user-auth");
    if (userAuth) {
      const parsed = JSON.parse(userAuth);
      // Check if not expired (24 hours)
      if (new Date().getTime() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        console.log("📂 Loaded user auth from localStorage");
        return {
          isAuthenticated: true,
          user: parsed.user,
          token: parsed.token,
          role: parsed.role || "user"
        };
      }
    }

    console.log("📂 No valid auth in localStorage");
    return {
      isAuthenticated: false,
      user: null,
      token: null,
      role: null
    };
  } catch (error) {
    console.error("❌ Failed to load auth:", error);
    return {
      isAuthenticated: false,
      user: null,
      token: null,
      role: null
    };
  }
};

export const clearAuthStorage = () => {
  localStorage.removeItem("user-auth");
  localStorage.removeItem("seller-auth");
  localStorage.removeItem("user-token");
  localStorage.removeItem("seller-token");
  document.cookie = "user_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "seller_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  console.log("🧹 Cleared all auth data");
};

export const getAuthToken = () => {
  try {
    // First check cookies (for httpOnly tokens from backend)
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'user_token' || name === 'seller_token' || name === 'admin_token') {
        console.log('✅ Found token in cookies:', name);
        return value;
      }
    }
    
    // Then check localStorage (backup)
    const authData = loadAuthFromStorage();
    if (authData.token) {
      console.log('✅ Found token in localStorage');
      return authData.token;
    }
    
    console.log('❌ No token found');
    return null;
  } catch (error) {
    console.error('❌ Error getting auth token:', error);
    return null;
  }
};