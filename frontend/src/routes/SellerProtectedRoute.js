import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Loader from '../components/Layout/Loader';

const SellerProtectedRoute = ({ children }) => {
  const { loading: sellerLoading, isSeller, seller } = useSelector((state) => state.seller);
  const { loading: userLoading, isAuthenticated, user } = useSelector((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🛍️ Seller Route Check:', {
      path: location.pathname,
      isSeller,
      seller: seller ? 'Seller exists' : 'No seller',
      userRole: user?.role, // Use optional chaining
      userData: user
    });

    // Auto-redirect sellers from home to seller dashboard
    if (isAuthenticated && user?.role === 'seller' && location.pathname === '/') {
      console.log('🛍️ Seller accessing home, redirecting to seller dashboard');
      navigate('/seller/dashboard');
    }
  }, [location, isSeller, seller, user, isAuthenticated, navigate]);

  const isLoading = sellerLoading || userLoading;

  if (isLoading) {
    return <Loader />;
  }

  // Check if user is a seller (multiple ways)
  // Use optional chaining to prevent errors when user is undefined
  const isUserSeller = isSeller || user?.role === 'seller' || user?.isSeller;

  if (!isUserSeller) {
    console.log('❌ User is not a seller, redirecting to shop login');
    toast.error("Seller access required");
    return <Navigate to="/shop-login" state={{ from: location }} replace />;
  }

  // Additional safety check - ensure user exists
  if (!user) {
    console.log('❌ User data not available, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default SellerProtectedRoute;