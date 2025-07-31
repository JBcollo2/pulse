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

// FIXED: Simplified ProtectedRoute that only protects dashboard
const DashboardProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const hasRedirectedRef = useRef(false);

  // Only handle role-based redirects for dashboard access
  useEffect(() => {
    if (loading || hasRedirectedRef.current) {
      return;
    }

    // Only redirect if user is on base dashboard without a tab
    if (isAuthenticated && user && user.role && location.pathname === '/dashboard' && !location.search) {
      const expectedPath = getRoleBasedRedirect(user.role);
      console.log(`🔄 Redirecting ${user.role} user from base dashboard to: ${expectedPath}`);
      hasRedirectedRef.current = true;
      navigate(expectedPath, { replace: true });
      
      setTimeout(() => {
        hasRedirectedRef.current = false;
      }, 1000);
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

// FIXED: Simplified App Router without aggressive redirects
const AppRouter: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading } = useAuth();

  // REMOVED: All the aggressive redirect logic that was preventing navigation

  // Only handle initial root redirect
  useEffect(() => {
    if (loading) return;

    const currentPath = location.pathname + location.search;
    
    // Only redirect from root path when user is authenticated
    if (isAuthenticated && user && user.role && currentPath === '/') {
      const redirectPath = getRoleBasedRedirect(user.role);
      console.log(`🎯 Initial load: Redirecting authenticated ${user.role} user from root to: ${redirectPath}`);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, loading, location.pathname, navigate]);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/events" element={<Events />} />
      <Route path="/venues" element={<Venues />} />
      <Route path="/artists" element={<Artists />} />
      <Route path="/about" element={<About />} />
      <Route path="/payment-status" element={<PaymentStatus />} />

      {/* Protected Dashboard Routes - Only dashboard is protected */}
      <Route path="/" element={<DashboardProtectedRoute />}>
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