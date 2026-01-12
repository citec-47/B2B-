// routes/ProtectedAdminRoute.jsx - YOUR FILE (keep this name)
import React from "react";
import ProtectedRoute from "./ProtectedRoute";

const ProtectedAdminRoute = ({ children }) => {
  return (
    <ProtectedRoute requiredRole="admin">
      {children}
    </ProtectedRoute>
  );
};

export default ProtectedAdminRoute;