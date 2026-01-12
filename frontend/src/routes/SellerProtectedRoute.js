// routes/SellerProtectedRoute.jsx
import React from "react";
import ProtectedRoute from "./ProtectedRoute";

const SellerProtectedRoute = ({ children }) => {
  return (
    <ProtectedRoute requiredRole="seller">
      {children}
    </ProtectedRoute>
  );
};

export default SellerProtectedRoute;