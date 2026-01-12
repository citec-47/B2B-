// components/AuthStatus.jsx - COMPLETE UPDATED VERSION
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

const AuthStatus = () => {
  const userState = useSelector((state) => state.user);
  const sellerState = useSelector((state) => state.seller);
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("🔄 Auth Status Update:");
      console.log("👤 User State:", {
        isAuthenticated: userState?.isAuthenticated,
        isLoading: userState?.isLoading,
        user: userState?.user ? {
          name: userState.user.name,
          email: userState.user.email,
          role: userState.user.role
        } : null
      });
      
      console.log("🏪 Seller State:", {
        isAuthenticated: sellerState?.isAuthenticated,
        isLoading: sellerState?.isLoading,
        seller: sellerState?.seller ? {
          name: sellerState.seller.name,
          email: sellerState.seller.email
        } : null
      });
      
      console.log("💾 LocalStorage:", {
        userAuth: localStorage.getItem('user-auth') ? '✅ Present' : '❌ Missing',
        sellerAuth: localStorage.getItem('seller-auth') ? '✅ Present' : '❌ Missing',
        userToken: localStorage.getItem('user-token') ? '✅ Present' : '❌ Missing',
        sellerToken: localStorage.getItem('seller-token') ? '✅ Present' : '❌ Missing'
      });
      
      console.log("🍪 Cookies:", {
        hasUserToken: document.cookie.includes('user_token'),
        hasSellerToken: document.cookie.includes('seller_token')
      });
    }
  }, [userState, sellerState]);
  
  // Visual debug badge in development
  if (process.env.NODE_ENV === 'development') {
    const isUserAuth = userState?.isAuthenticated;
    const isSellerAuth = sellerState?.isAuthenticated;
    const role = isSellerAuth ? "seller" : (isUserAuth ? userState?.user?.role || "user" : "none");
    
    return (
      <div style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '11px',
        zIndex: 9999,
        fontFamily: 'monospace',
        maxWidth: '250px'
      }}>
        <div><strong>🔐 Auth Debug</strong></div>
        <div>Status: {isUserAuth || isSellerAuth ? '✅ Logged In' : '❌ Logged Out'}</div>
        <div>Role: <span style={{color: '#60a5fa'}}>{role}</span></div>
        <div>User LS: {localStorage.getItem('user-auth') ? '✅' : '❌'}</div>
        <div>Seller LS: {localStorage.getItem('seller-auth') ? '✅' : '❌'}</div>
      </div>
    );
  }
  
  return null;
};

export default AuthStatus;