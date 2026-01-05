import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const userState = useSelector((state) => state.user);
  
  // Safely extract values with defaults to prevent undefined errors
  const loading = userState?.loading ?? false;
  const isAuthenticated = userState?.isAuthenticated ?? false;
  const user = userState?.user ?? null;
  
  // Debug logging (remove in production)
  console.log("🔐 ProtectedRoute Debug:", {
    loading,
    isAuthenticated,
    hasUser: !!user,
    userRole: user?.role,
    currentPath: location.pathname
  });

  // Show loading spinner while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-blue-500 rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">Verifying authentication...</p>
        <p className="mt-2 text-sm text-gray-400">Please wait</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log("🚫 Access denied. Redirecting to login from:", location.pathname);
    
    // Store the intended destination to redirect back after login
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    
    return (
      <Navigate 
        to={`/login?redirect=${redirectPath}`} 
        replace 
        state={{ 
          from: location,
          message: "Please login to access this page"
        }} 
      />
    );
  }

  // Optional: Check for specific roles if needed
  // Example: Only allow admin users to access certain routes
  const requiresAdmin = location.pathname.startsWith('/admin');
  if (requiresAdmin && user?.role !== 'Admin') {
    console.log("⛔ Admin access required. User role:", user?.role);
    
    return (
      <Navigate 
        to="/" 
        replace 
        state={{ 
          error: "Access denied. Admin privileges required."
        }} 
      />
    );
  }

  // Optional: Check for seller role
  const requiresSeller = location.pathname.startsWith('/seller');
  if (requiresSeller && user?.role !== 'Seller') {
    console.log("⛔ Seller access required. User role:", user?.role);
    
    return (
      <Navigate 
        to="/" 
        replace 
        state={{ 
          error: "Access denied. Seller privileges required."
        }} 
      />
    );
  }

  // Authentication successful - render the protected content
  console.log("✅ Access granted to:", location.pathname);
  
  return (
    <div className="protected-content">
      {/* Optional: Add authentication banner for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-green-50 border-l-4 border-green-400 p-2 mb-2">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-green-400">🔒</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                Authenticated as: <span className="font-medium">{user?.name || user?.email || 'User'}</span>
                {user?.role && <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Role: {user.role}</span>}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Render the protected children */}
      {children}
    </div>
  );
};

export default ProtectedRoute;