import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
          method: 'GET',
          credentials: 'include'
        });

        setIsAuthenticated(response.ok);
      } catch (error) {
        console.error("Failed to verify authentication", error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    // Loading state — optionally add a spinner here
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/events" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
