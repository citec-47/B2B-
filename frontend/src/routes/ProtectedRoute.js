import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Loader from '../components/Layout/Loader';

const ProtectedRoute = ({ children }) => {
  const { loading, isAuthenticated, user } = useSelector((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔒 Protected Route Check:', { 
      path: location.pathname,
      isAuthenticated,
      userRole: user?.role, // Use optional chaining
      userData: user
    });

    // Auto-redirect based on role when accessing certain pages
    if (isAuthenticated && user) {
      const currentPath = location.pathname;
      
      // Auto-redirect admins from home to admin dashboard
      if (currentPath === '/' && user.role === 'admin') {
        console.log('🛡️ Admin accessing home, redirecting to admin dashboard');
        navigate('/admin/dashboard');
      }
      // Auto-redirect sellers from home to seller dashboard
      else if (currentPath === '/' && user.role === 'seller') {
        console.log('🛍️ Seller accessing home, redirecting to seller dashboard');
        navigate('/seller/dashboard');
      }
    }
  }, [location, isAuthenticated, user, navigate]);

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    console.log('❌ User not authenticated, redirecting to login');
    toast.error("Please login to access this page");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user data exists
  if (!user) {
    console.log('❌ User data not available, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Prevent wrong role access - use optional chaining
  if (location.pathname.startsWith('/admin/') && user?.role !== 'admin') {
    toast.error("Admin access required");
    
    if (user?.role === 'seller') {
      return <Navigate to="/seller/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  if (location.pathname.startsWith('/seller/') && user?.role !== 'seller') {
    toast.error("Seller access required");
    
    if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;