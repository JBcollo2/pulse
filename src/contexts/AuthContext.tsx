// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';

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

  // CRITICAL: Add refs to prevent multiple simultaneous operations
  const isFetchingRef = useRef(false);
  const initializationCompleteRef = useRef(false);

  // Function to fetch user profile (extracted for reusability)
  const fetchUserProfile = useCallback(async (): Promise<User | null> => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      return null;
    }
    isFetchingRef.current = true;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
        method: 'GET',
        credentials: 'include',
        // Add timeout using AbortController
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        const userData = await response.json();

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
          throw new Error('Invalid user data received from server');
        }

        setUser(normalizedUser);
        setIsAuthenticated(true);
        return normalizedUser;
      } else {
        // Not authenticated or session expired
        setUser(null);
        setIsAuthenticated(false);
        return null;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
      } else {
      }
      setUser(null);
      setIsAuthenticated(false);
      return null;
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // FIXED: Enhanced initialization with single-run guarantee
  useEffect(() => {
    const initializeAuth = async () => {
      // Prevent multiple initializations
      if (initializationCompleteRef.current) {
        return;
      }

      setLoading(true);

      try {
        const userData = await fetchUserProfile();
        if (userData) {
        } else {
        }
      } catch (error) {
      } finally {
        setLoading(false);
        setIsContextReady(true);
        initializationCompleteRef.current = true;
      }
    };
    initializeAuth();
  }, []); // Empty dependency array ensures this runs only once

  // FIXED: Enhanced auth state change event listener with debouncing
  useEffect(() => {
    let eventTimeout: NodeJS.Timeout;
    const handleAuthStateChange = async (event: CustomEvent) => {
      // Clear any pending timeout
      if (eventTimeout) {
        clearTimeout(eventTimeout);
      }
      // Debounce rapid events
      eventTimeout = setTimeout(async () => {
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
              return;
            }

            setUser(normalizedUser);
            setIsAuthenticated(true);
            setLoading(false);

          } else if (event.detail && event.detail.action === 'logout') {
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);

          } else if (event.detail && event.detail.action === 'refresh') {
            // Only refresh if not already loading
            if (!isFetchingRef.current) {
              setLoading(true);
              try {
                const userData = await fetchUserProfile();
                if (userData) {
                }
              } finally {
                setLoading(false);
              }
            }
          }
        } catch (error) {
          setLoading(false);
        }
      }, 100); // 100ms debounce
    };
    // Type assertion for the event listener
    const eventListener = handleAuthStateChange as EventListener;
    window.addEventListener('auth-state-changed', eventListener);

    return () => {
      if (eventTimeout) {
        clearTimeout(eventTimeout);
      }
      window.removeEventListener('auth-state-changed', eventListener);
    };
  }, [fetchUserProfile]);

  // FIXED: Enhanced storage event listener with debouncing
  useEffect(() => {
    let storageTimeout: NodeJS.Timeout;
    const handleStorageChange = (event: StorageEvent) => {
      // Clear any pending timeout
      if (storageTimeout) {
        clearTimeout(storageTimeout);
      }
      // Debounce rapid storage events
      storageTimeout = setTimeout(async () => {
        if (event.key === 'auth-logout') {
          setUser(null);
          setIsAuthenticated(false);
        } else if (event.key === 'auth-login') {
          // Only refresh if not already fetching
          if (!isFetchingRef.current) {
            // Small delay to ensure backend session is ready
            setTimeout(async () => {
              try {
                await fetchUserProfile();
              } catch (error) {
              }
            }, 500);
          }
        }
      }, 200); // 200ms debounce for storage events
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (storageTimeout) {
        clearTimeout(storageTimeout);
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchUserProfile]);

  // FIXED: Enhanced loginUser function with validation
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
        throw new Error('Invalid user data provided');
      }

      setUser(normalizedUser);
      setIsAuthenticated(true);
      setLoading(false);

      // Trigger storage event for cross-tab sync (with error handling)
      try {
        localStorage.setItem('auth-login', Date.now().toString());
        setTimeout(() => {
          try {
            localStorage.removeItem('auth-login');
          } catch (error) {
          }
        }, 100);
      } catch (storageError) {
      }
    } catch (error) {
    }
  }, []);

  // Enhanced logoutUser function
  const logoutUser = useCallback(async () => {
    try {
      // Make logout request to backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        signal: AbortSignal.timeout(5000) // 5 second timeout for logout
      });

      if (!response.ok) {
      }
    } catch (error) {
      if (error.name === 'AbortError') {
      } else {
      }
    } finally {
      // Clear local state regardless of backend response
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);

      // Trigger storage event for cross-tab sync
      try {
        localStorage.setItem('auth-logout', Date.now().toString());
        setTimeout(() => {
          try {
            localStorage.removeItem('auth-logout');
          } catch (error) {
          }
        }, 100);
      } catch (storageError) {
      }

      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('auth-state-changed', {
        detail: { action: 'logout' }
      }));
    }
  }, []);

  // Enhanced refreshUser function with better error handling
  const refreshUser = useCallback(async () => {
    // Don't set loading if already fetching
    if (!isFetchingRef.current) {
      setLoading(true);
    }

    try {
      const userData = await fetchUserProfile();
      if (userData) {
      } else {
      }
    } catch (error) {
    } finally {
      if (!isFetchingRef.current) {
        setLoading(false);
      }
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
