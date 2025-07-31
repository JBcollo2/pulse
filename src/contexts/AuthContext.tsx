// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the shape of your user object, including the role
interface User {
  id: string;
  name: string; // Or username, display name
  email: string;
  role: "ADMIN" | "ORGANIZER" | "ATTENDEE" | "SECURITY"; // Ensure these match your backend enum
  full_name?: string; // Add optional full_name for display purposes
  phone_number?: string; // Add other optional fields as needed
  // Add any other user properties you get from your /auth/profile endpoint
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  // Functions to update auth state, if needed (e.g., after login/logout)
  loginUser: (userData: User) => void;
  logoutUser: () => void;
  refreshUser: () => Promise<void>; // Add refresh function
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

  // Function to fetch user profile (extracted for reusability)
  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
        method: 'GET',
        credentials: 'include' // Important for sending cookies/session
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('User profile fetched:', userData); // Debug log
        
        // Ensure the userData has the expected structure
        const normalizedUser: User = {
          id: userData.id || userData.user_id,
          name: userData.name || userData.full_name || userData.username,
          email: userData.email,
          role: userData.role,
          full_name: userData.full_name,
          phone_number: userData.phone_number,
          ...userData // Spread any additional properties
        };
        
        setUser(normalizedUser);
        setIsAuthenticated(true);
        return normalizedUser;
      } else {
        // Not authenticated or session expired
        console.log('User not authenticated or session expired');
        setUser(null);
        setIsAuthenticated(false);
        return null;
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setUser(null);
      setIsAuthenticated(false);
      return null;
    }
  };

  // This useEffect will be responsible for fetching the user profile on app load
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      await fetchUserProfile();
      setLoading(false);
    };

    initializeAuth();
  }, []); // Empty dependency array means this runs once on mount

  // Listen for custom auth state change events (from login components)
  useEffect(() => {
    const handleAuthStateChange = async (event: CustomEvent) => {
      console.log('Auth state change event received:', event.detail);
      
      if (event.detail && event.detail.user && event.detail.action === 'login') {
        const userData = event.detail.user;
        
        // Normalize the user data structure
        const normalizedUser: User = {
          id: userData.id || userData.user_id,
          name: userData.name || userData.full_name || userData.username,
          email: userData.email,
          role: userData.role,
          full_name: userData.full_name,
          phone_number: userData.phone_number,
          ...userData
        };
        
        setUser(normalizedUser);
        setIsAuthenticated(true);
        setLoading(false);
        
        console.log('User logged in via event:', normalizedUser);
      } else if (event.detail && event.detail.action === 'logout') {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        
        console.log('User logged out via event');
      } else if (event.detail && event.detail.action === 'refresh') {
        // Refresh user data from server
        await fetchUserProfile();
        setLoading(false);
      }
    };

    // Type assertion for the event listener
    const eventListener = handleAuthStateChange as EventListener;
    window.addEventListener('auth-state-changed', eventListener);
    
    return () => {
      window.removeEventListener('auth-state-changed', eventListener);
    };
  }, []);

  // Listen for storage events (useful for cross-tab logout)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth-logout') {
        // Another tab logged out, sync this tab
        setUser(null);
        setIsAuthenticated(false);
        console.log('User logged out in another tab');
      } else if (event.key === 'auth-login') {
        // Another tab logged in, refresh user data
        fetchUserProfile();
        console.log('User logged in in another tab, refreshing...');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loginUser = (userData: User) => {
    const normalizedUser: User = {
      id: userData.id || (userData as any).user_id,
      name: userData.name || userData.full_name || (userData as any).username,
      email: userData.email,
      role: userData.role,
      full_name: userData.full_name,
      phone_number: userData.phone_number,
      ...userData
    };
    
    setUser(normalizedUser);
    setIsAuthenticated(true);
    
    // Trigger storage event for cross-tab sync
    localStorage.setItem('auth-login', Date.now().toString());
    localStorage.removeItem('auth-login'); // Clean up immediately
    
    console.log('User logged in manually:', normalizedUser);
  };

  const logoutUser = async () => {
    try {
      // Make logout request to backend
      await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, { 
        method: 'POST', 
        credentials: 'include' 
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      // Clear local state regardless of backend response
      setUser(null);
      setIsAuthenticated(false);
      
      // Trigger storage event for cross-tab sync
      localStorage.setItem('auth-logout', Date.now().toString());
      localStorage.removeItem('auth-logout'); // Clean up immediately
      
      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('auth-state-changed', { 
        detail: { action: 'logout' } 
      }));
      
      console.log('User logged out');
    }
  };

  // Function to refresh user data from server
  const refreshUser = async () => {
    setLoading(true);
    try {
      const userData = await fetchUserProfile();
      if (userData) {
        console.log('User data refreshed:', userData);
      }
    } finally {
      setLoading(false);
    }
  };

  const contextValue = {
    user,
    isAuthenticated,
    loading,
    loginUser,
    logoutUser,
    refreshUser,
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

// Helper function to get role-based redirect path (can be used outside components)
export const getRoleBasedRedirect = (userRole: User['role']) => {
  const roleRedirects = {
    'ADMIN': '/dashboard?tab=admin',
    'ORGANIZER': '/dashboard?tab=events',
    'SECURITY': '/dashboard?tab=scanner',
    'ATTENDEE': '/dashboard?tab=overview'
  };
  
  return roleRedirects[userRole] || '/dashboard';
};

// Helper function to check if user has permission for a specific tab
export const hasTabPermission = (userRole: User['role'], tabId: string) => {
  const tabPermissions = {
    'overview': ['ADMIN', 'ORGANIZER', 'ATTENDEE', 'SECURITY'],
    'tickets': ['ADMIN', 'ORGANIZER'],
    'scanner': ['ADMIN', 'ORGANIZER', 'SECURITY'],
    'events': ['ADMIN', 'ORGANIZER'],
    'organizers': ['ADMIN', 'ORGANIZER'],
    'profile': ['ADMIN', 'ORGANIZER', 'ATTENDEE', 'SECURITY'],
    'admin': ['ADMIN']
  };
  
  return tabPermissions[tabId as keyof typeof tabPermissions]?.includes(userRole) || false;
};