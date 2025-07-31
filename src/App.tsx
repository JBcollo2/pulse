// frontend/pulse/src/App.tsx

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { ThemeProvider } from "./components/ThemeProvider";
import Index from "./pages/Index";
import Events from "./pages/Events";
import Venues from "./pages/Venues";
import Artists from "./pages/Artists";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import EventDetails from "./pages/EventDetails";
import GoogleCallback from "./components/GoogleCallback";
import AuthCard from './components/AuthCard';
import PaymentStatus from "./pages/PaymentStatus";

// Import the AuthProvider and useAuth hook
import { AuthProvider, useAuth, getRoleBasedRedirect } from "./contexts/AuthContext";

const queryClient = new QueryClient();

// Enhanced ProtectedRoute component with redirect loop prevention
const DynamicProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const hasRedirectedRef = useRef(false);

  // CRITICAL: Handle role-based redirects with loop prevention
  useEffect(() => {
    // Don't do anything if still loading or already redirected
    if (loading || hasRedirectedRef.current) {
      return;
    }

    // If authenticated with role, check if we need to redirect to correct tab
    if (isAuthenticated && user && user.role) {
      const currentPath = location.pathname + location.search;
      const expectedPath = getRoleBasedRedirect(user.role);
      
      console.log(`🔍 Protected route check - Current: ${currentPath}, Expected: ${expectedPath}`);
      
      // Only redirect if we're on the base dashboard path without correct tab
      if (currentPath === '/dashboard' && expectedPath !== '/dashboard') {
        console.log(`🔄 Redirecting ${user.role} user from base dashboard to: ${expectedPath}`);
        hasRedirectedRef.current = true;
        navigate(expectedPath, { replace: true });
        
        // Reset flag after redirect
        setTimeout(() => {
          hasRedirectedRef.current = false;
        }, 1000);
      }
    }
  }, [isAuthenticated, user, location, navigate, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        <p className="ml-3 text-gray-700 dark:text-gray-300">Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to events page if not authenticated
    return <Navigate to="/events" replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

// Main App Router component with redirect loop prevention
const AppRouter: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading } = useAuth();
  const redirectCountRef = useRef(0);
  const lastRedirectRef = useRef('');
  const isInitialLoadRef = useRef(true);

  // Emergency redirect loop breaker
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    
    // Track redirect attempts to prevent infinite loops
    if (lastRedirectRef.current === currentPath) {
      redirectCountRef.current += 1;
      
      if (redirectCountRef.current > 3) {
        console.error('🚨 REDIRECT LOOP DETECTED - STOPPING ALL REDIRECTS');
        console.error('Current path:', currentPath);
        console.error('User:', user);
        console.error('Is authenticated:', isAuthenticated);
        
        // Clear any problematic localStorage
        try {
          localStorage.removeItem('auth-login');
          localStorage.removeItem('auth-logout');
        } catch (error) {
          console.warn('Could not clear localStorage:', error);
        }
        
        // Reset counter and stop further redirects
        redirectCountRef.current = 0;
        return;
      }
    } else {
      // Different path, reset counter
      redirectCountRef.current = 0;
    }
    
    lastRedirectRef.current = currentPath;
  }, [location, user, isAuthenticated]);

  // Handle initial authentication-based redirects
  useEffect(() => {
    // Skip if still loading or not initial load
    if (loading || !isInitialLoadRef.current) {
      return;
    }

    // Mark that we've handled initial load
    isInitialLoadRef.current = false;

    const currentPath = location.pathname + location.search;
    
    // If user is authenticated and on root path, redirect to their dashboard
    if (isAuthenticated && user && user.role && currentPath === '/') {
      const redirectPath = getRoleBasedRedirect(user.role);
      console.log(`🎯 Initial load: Redirecting authenticated ${user.role} user from root to: ${redirectPath}`);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, loading, location, navigate]);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/events" element={<Events />} />
      <Route path="/venues" element={<Venues />} />
      <Route path="/artists" element={<Artists />} />
      <Route path="/about" element={<About />} />
      <Route path="/payment-status" element={<PaymentStatus />} />

      {/* Protected Dashboard Routes */}
      <Route path="/" element={<DynamicProtectedRoute />}>
        <Route path="dashboard" element={<Dashboard />} />
      </Route>

      <Route path="/event/:id" element={<EventDetails />} />
      <Route path="/auth/callback/google" element={<GoogleCallback />} />
      <Route
        path="/reset-password/:token"
        element={
          <AuthCard
            isOpen={true}
            onClose={() => {}}
            initialView="reset-password"
            toast={() => {}}
          />
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Main App component
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider defaultTheme="system" storageKey="pulse-ticket-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;