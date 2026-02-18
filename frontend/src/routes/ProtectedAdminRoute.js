import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import Loader from '../components/Layout/Loader';
import axios from 'axios'; // ADD THIS IMPORT

const ProtectedAdminRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { loading, isAuthenticated, user } = useSelector((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();

  // Sync localStorage with Redux on mount
  useEffect(() => {
    console.log('🔄 Checking localStorage for auth...');
    
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token && !isAuthenticated) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('🔄 Found user in localStorage, syncing to Redux');
        
        // Set axios header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Dispatch to sync with Redux
        if (parsedUser.isSeller) {
          dispatch({ 
            type: 'SellerLoginSuccess', 
            payload: parsedUser 
          });
        } else {
          dispatch({ 
            type: 'UserLoginSuccess', 
            payload: parsedUser 
          });
        }
        
        console.log('✅ Auth synced from localStorage');
      } catch (error) {
        console.error('❌ Error syncing auth:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    console.log('🛡️ Admin Route Protection Check:', {
      path: location.pathname,
      isAuthenticated,
      userRole: user?.role,
      userData: user
    });

    // Auto-redirect admin from homepage to admin dashboard
    if (isAuthenticated && user && user.role === 'admin' && location.pathname === '/') {
      console.log('🛡️ Admin accessing home, redirecting to admin dashboard');
      navigate('/admin/dashboard');
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

  // FIXED: Check for 'admin' (lowercase) not 'Admin' (uppercase)
  if (user?.role !== 'admin') {
    console.log('❌ User is not admin, redirecting to home');
    console.log('Expected role: admin, Actual role:', user?.role);
    toast.error("Admin access required");
    
    // Redirect based on actual role
    if (user?.role === 'seller') {
      return <Navigate to="/seller/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedAdminRoute;