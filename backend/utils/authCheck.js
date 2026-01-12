// src/utils/authUtils.js
export const saveAuthToStorage = (userData, role = "user") => {
  try {
    const authState = {
      user: userData,
      role: role,
      timestamp: new Date().getTime()
    };
    
    const key = role === "seller" ? "seller-auth" : "user-auth";
    localStorage.setItem(key, JSON.stringify(authState));
    console.log("💾 Saved auth to localStorage:", role);
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
          role: parsed.role || "user"
        };
      }
    }

    console.log("📂 No valid auth in localStorage");
    return {
      isAuthenticated: false,
      user: null,
      role: null
    };
  } catch (error) {
    console.error("❌ Failed to load auth:", error);
    return {
      isAuthenticated: false,
      user: null,
      role: null
    };
  }
};

export const clearAuthStorage = () => {
  localStorage.removeItem("user-auth");
  localStorage.removeItem("seller-auth");
  localStorage.removeItem("user-token");
  localStorage.removeItem("seller-token");
  console.log("🧹 Cleared auth from localStorage");
};