// routes/ProtectedRoute.jsx - COMPLETE UPDATED VERSION
import React from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const location = useLocation();
  
  // Get Redux state
  const userState = useSelector((state) => state.user);
  const sellerState = useSelector((state) => state.seller);
  
  console.log("🔐 ProtectedRoute check:", {
    userAuth: userState?.isAuthenticated,
    sellerAuth: sellerState?.isAuthenticated,
    userRole: userState?.user?.role,
    requiredRole,
    path: location.pathname
  });
  
  // Check loading state
  const isLoading = userState?.isLoading || sellerState?.isLoading;
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-200 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-blue-500 rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">Checking authentication...</p>
      </div>
    );
  }
  
  // Determine authentication status
  let isAuthenticated = false;
  let role = null;
  
  // Check seller first
  if (sellerState?.isAuthenticated && sellerState?.seller) {
    isAuthenticated = true;
    role = "seller";
  } 
  // Then check user
  else if (userState?.isAuthenticated && userState?.user) {
    isAuthenticated = true;
    role = userState.user?.role || "user";
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log("🚫 Not authenticated, redirecting to login");
    
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    let loginPath = "/login";
    
    if (requiredRole === "seller") {
      loginPath = "/shop-login";
    }
    
    return (
      <Navigate 
        to={`${loginPath}?redirect=${redirectPath}`} 
        replace 
        state={{ from: location, message: "Please login to access this page" }} 
      />
    );
  }
  
  // Check role permissions if required
  if (requiredRole && role !== requiredRole) {
    console.log(`⛔ Role mismatch. Required: ${requiredRole}, Has: ${role}`);
    
    // Redirect based on current role
    if (role === "seller") {
      return <Navigate to="/dashboard" replace />;
    } else if (role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }
  
  // Special checks for path mismatches
  if (role === "seller" && location.pathname.startsWith("/user/")) {
    console.log("🛒 Seller trying to access user route, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }
  
  if (role === "user" && location.pathname.startsWith("/dashboard")) {
    console.log("👤 User trying to access seller route, redirecting to home");
    return <Navigate to="/" replace />;
  }
  
  if (role === "admin" && location.pathname.startsWith("/dashboard")) {
    console.log("👑 Admin trying to access seller route, redirecting to admin dashboard");
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  console.log(`✅ Access granted to ${location.pathname} as ${role}`);
  
  return children;
};

export default ProtectedRoute;