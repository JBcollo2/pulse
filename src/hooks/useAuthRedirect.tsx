// src/hooks/useAuthRedirect.ts

import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getRoleBasedRedirect } from '@/contexts/AuthContext';

interface UseAuthRedirectOptions {
  redirectOnLogin?: boolean;
  redirectOnLogout?: boolean;
  logoutRedirectPath?: string;
  redirectDelay?: number;
  onRedirect?: (path: string, userRole?: string) => void;
}

export const useAuthRedirect = (options: UseAuthRedirectOptions = {}) => {
  const {
    redirectOnLogin = true,
    redirectOnLogout = true,
    logoutRedirectPath = '/',
    redirectDelay = 100,
    onRedirect
  } = options;

  const { user, isAuthenticated, loading, isContextReady } = useAuth();
  const navigate = useNavigate();

  // Handle redirect logic
  const performRedirect = useCallback((path: string, userRole?: string) => {
    console.log(`🔀 useAuthRedirect: Redirecting to ${path}${userRole ? ` for ${userRole}` : ''}`);
    
    if (onRedirect) {
      onRedirect(path, userRole);
    }
    
    setTimeout(() => {
      navigate(path, { replace: true });
    }, redirectDelay);
  }, [navigate, redirectDelay, onRedirect]);

  // Handle authentication state changes
  useEffect(() => {
    // Don't process redirects if context is not ready or still loading
    if (!isContextReady || loading) {
      return;
    }

    console.log('🔍 useAuthRedirect: Auth state check -', {
      isAuthenticated,
      userRole: user?.role,
      redirectOnLogin,
      redirectOnLogout
    });

    // Handle login redirect
    if (isAuthenticated && user && user.role && redirectOnLogin) {
      const redirectPath = getRoleBasedRedirect(user.role);
      const currentPath = window.location.pathname + window.location.search;
      
      // Only redirect if not already on the target path
      if (currentPath !== redirectPath) {
        console.log('✅ useAuthRedirect: Login detected, redirecting...');
        performRedirect(redirectPath, user.role);
      }
    }

    // Handle logout redirect
    if (!isAuthenticated && !user && redirectOnLogout) {
      const currentPath = window.location.pathname;
      
      // Only redirect if not already on the logout path and not on public pages
      if (currentPath !== logoutRedirectPath && 
          !currentPath.includes('/auth') && 
          currentPath !== '/') {
        console.log('✅ useAuthRedirect: Logout detected, redirecting...');
        performRedirect(logoutRedirectPath);
      }
    }
  }, [
    isAuthenticated, 
    user, 
    loading, 
    isContextReady,
    redirectOnLogin, 
    redirectOnLogout, 
    logoutRedirectPath, 
    performRedirect
  ]);

  return {
    isRedirecting: loading || !isContextReady,
    canAccess: isAuthenticated && user,
    userRole: user?.role
  };
};

// Additional hook for role-based route protection
export const useRoleProtection = (allowedRoles: string[]) => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const hasAccess = useCallback(() => {
    if (!isAuthenticated || !user) return false;
    return allowedRoles.includes(user.role);
  }, [isAuthenticated, user, allowedRoles]);

  useEffect(() => {
    if (!loading && isAuthenticated && user && !hasAccess()) {
      console.warn(`⚠️ useRoleProtection: Access denied for ${user.role}. Allowed roles:`, allowedRoles);
      
      // Redirect to appropriate dashboard
      const redirectPath = getRoleBasedRedirect(user.role);
      navigate(redirectPath, { replace: true });
    }
  }, [loading, isAuthenticated, user, hasAccess, navigate, allowedRoles]);

  return {
    hasAccess: hasAccess(),
    loading,
    userRole: user?.role
  };
};