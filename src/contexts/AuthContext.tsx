// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// Define the shape of your user object, including the role
interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "ORGANIZER" | "ATTENDEE" | "SECURITY";
  full_name?: string;
  phone_number?: string;
  // Add any other user properties you get from your /auth/profile endpoint
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  // Functions to update auth state
  loginUser: (userData: User) => void;
  logoutUser: () => void;
  refreshUser: () => Promise<void>;
  // Add method to check if context is ready
  isContextReady: boolean;
}

// Create the context with an undefined default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider component to wrap your application
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isContextReady, setIsContextReady] = useState(false);

  // Function to fetch user profile (extracted for reusability)
  const fetchUserProfile = useCallback(async (): Promise<User | null> => {
    try {
      console.log('🔍 Fetching user profile...');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
        method: 'GET',
        credentials: 'include',
        // Add timeout using AbortController
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ User profile fetched successfully:', userData);
        
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
        
        // Validate required fields
        if (!normalizedUser.email || !normalizedUser.role) {
          console.error('❌ Invalid user data structure:', normalizedUser);
          throw new Error('Invalid user data received from server');
        }
        
        setUser(normalizedUser);
        setIsAuthenticated(true);
        return normalizedUser;
      } else {
        // Not authenticated or session expired
        console.log('ℹ️ User not authenticated or session expired');
        setUser(null);
        setIsAuthenticated(false);
        return null;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('❌ Profile fetch timeout');
      } else {
        console.error("❌ Failed to fetch user profile:", error);
      }
      setUser(null);
      setIsAuthenticated(false);
      return null;
    }
  }, []);

  // Enhanced initialization with better error handling
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🚀 Initializing authentication context...');
      setLoading(true);
      
      try {
        const userData = await fetchUserProfile();
        if (userData) {
          console.log('✅ Authentication context initialized with user:', userData.role);
        } else {
          console.log('ℹ️ Authentication context initialized - no user session');
        }
      } catch (error) {
        console.error('❌ Failed to initialize auth context:', error);
      } finally {
        setLoading(false);
        setIsContextReady(true);
        console.log('✅ Authentication context ready');
      }
    };

    initializeAuth();
  }, []); // Empty dependency array means this runs once on mount

  // Enhanced auth state change event listener
  useEffect(() => {
    const handleAuthStateChange = async (event: CustomEvent) => {
      console.log('🔄 Auth state change event received:', event.detail);
      
      try {
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
          
          // Validate the user data
          if (!normalizedUser.email || !normalizedUser.role) {
            console.error('❌ Invalid user data in login event:', normalizedUser);
            return;
          }
          
          setUser(normalizedUser);
          setIsAuthenticated(true);
          setLoading(false);
          
          console.log('✅ User logged in via event:', normalizedUser.role);
          
        } else if (event.detail && event.detail.action === 'logout') {
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
          
          console.log('✅ User logged out via event');
          
        } else if (event.detail && event.detail.action === 'refresh') {
          console.log('🔄 Refreshing user data via event...');
          setLoading(true);
          try {
            const userData = await fetchUserProfile();
            if (userData) {
              console.log('✅ User data refreshed via event:', userData.role);
            }
          } finally {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('❌ Error handling auth state change:', error);
        setLoading(false);
      }
    };

    // Type assertion for the event listener
    const eventListener = handleAuthStateChange as EventListener;
    window.addEventListener('auth-state-changed', eventListener);
    
    return () => {
      window.removeEventListener('auth-state-changed', eventListener);
    };
  }, [fetchUserProfile]);

  // Enhanced storage event listener for cross-tab sync
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth-logout') {
        console.log('🔄 User logged out in another tab, syncing...');
        setUser(null);
        setIsAuthenticated(false);
      } else if (event.key === 'auth-login') {
        console.log('🔄 User logged in in another tab, refreshing...');
        // Small delay to ensure backend session is ready
        setTimeout(() => {
          fetchUserProfile();
        }, 500);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchUserProfile]);

  // Enhanced loginUser function
  const loginUser = useCallback((userData: User) => {
    try {
      // Normalize user data
      const normalizedUser: User = {
        id: userData.id || (userData as any).user_id,
        name: userData.name || userData.full_name || (userData as any).username,
        email: userData.email,
        role: userData.role,
        full_name: userData.full_name,
        phone_number: userData.phone_number,
        ...userData
      };
      
      // Validate required fields
      if (!normalizedUser.email || !normalizedUser.role) {
        console.error('❌ Invalid user data provided to loginUser:', normalizedUser);
        throw new Error('Invalid user data provided');
      }
      
      setUser(normalizedUser);
      setIsAuthenticated(true);
      setLoading(false);
      
      // Trigger storage event for cross-tab sync
      try {
        localStorage.setItem('auth-login', Date.now().toString());
        setTimeout(() => localStorage.removeItem('auth-login'), 100);
      } catch (storageError) {
        console.warn('⚠️ Storage not available for cross-tab sync');
      }
      
      console.log('✅ User logged in manually:', normalizedUser.role);
    } catch (error) {
      console.error('❌ Error in loginUser:', error);
    }
  }, []);

  // Enhanced logoutUser function
  const logoutUser = useCallback(async () => {
    console.log('🚪 Logging out user...');
    
    try {
      // Make logout request to backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, { 
        method: 'POST', 
        credentials: 'include',
        signal: AbortSignal.timeout(5000) // 5 second timeout for logout
      });
      
      if (!response.ok) {
        console.warn('⚠️ Backend logout request failed, but proceeding with local logout');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('⚠️ Logout request timeout, proceeding with local logout');
      } else {
        console.error('❌ Logout request failed:', error);
      }
    } finally {
      // Clear local state regardless of backend response
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      
      // Trigger storage event for cross-tab sync
      try {
        localStorage.setItem('auth-logout', Date.now().toString());
        setTimeout(() => localStorage.removeItem('auth-logout'), 100);
      } catch (storageError) {
        console.warn('⚠️ Storage not available for cross-tab sync');
      }
      
      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('auth-state-changed', { 
        detail: { action: 'logout' } 
      }));
      
      console.log('✅ User logged out successfully');
    }
  }, []);

  // Enhanced refreshUser function with better error handling
  const refreshUser = useCallback(async () => {
    console.log('🔄 Refreshing user data...');
    setLoading(true);
    
    try {
      const userData = await fetchUserProfile();
      if (userData) {
        console.log('✅ User data refreshed successfully:', userData.role);
      } else {
        console.log('ℹ️ User data refresh - no active session');
      }
    } catch (error) {
      console.error('❌ Failed to refresh user data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  // Context value memoization for performance
  const contextValue = React.useMemo(() => ({
    user,
    isAuthenticated,
    loading,
    loginUser,
    logoutUser,
    refreshUser,
    isContextReady,
  }), [user, isAuthenticated, loading, loginUser, logoutUser, refreshUser, isContextReady]);

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