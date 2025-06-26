// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the shape of your user object, including the role
interface User {
  id: string;
  name: string; // Or username, display name
  email: string;
  role: "ADMIN" | "ORGANIZER" | "ATTENDEE" | "SECURITY"; // Ensure these match your backend enum
  // Add any other user properties you get from your /auth/profile endpoint
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  // Functions to update auth state, if needed (e.g., after login/logout)
  loginUser: (userData: User) => void;
  logoutUser: () => void;
}

// Create the context with an undefined default value, which will be provided by the AuthProvider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider component to wrap your application or specific parts
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Start as loading

  // This useEffect will be responsible for fetching the user profile on app load
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true); // Ensure loading is true when fetching starts
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
          method: 'GET',
          credentials: 'include' // Important for sending cookies/session
        });

        if (response.ok) {
          const userData = await response.json();
          // Assuming your /auth/profile returns a user object with 'role'
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // Not authenticated or session expired
          setUser(null);
          setIsAuthenticated(false);
          // Optionally clear any lingering client-side tokens/cookies if your backend requires it
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false); // Set loading to false regardless of success or failure
      }
    };

    fetchUserProfile();
  }, []); // Empty dependency array means this runs once on mount

  const loginUser = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    // You might also want to store token/user data in localStorage here if your login flow involves it
  };

  const logoutUser = () => {
    setUser(null);
    setIsAuthenticated(false);
    // On logout, you'd typically also make a backend call to clear the session/token
    // Example: fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
  };

  const contextValue = {
    user,
    isAuthenticated,
    loading,
    loginUser,
    logoutUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to consume the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};