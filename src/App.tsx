// frontend/pulse/src/App.tsx

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
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

// Enhanced Loading Component
const EnhancedLoadingComponent = () => {
  const [dots, setDots] = useState('');
  const [progress, setProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('Loading session');

  // Animated dots effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Simulated progress
  useEffect(() => {
    const stages = [
      'Loading session',
      'Authenticating user',
      'Preparing dashboard',
      'Almost ready'
    ];
    
    let currentStage = 0;
    let currentProgress = 0;
    
    const progressInterval = setInterval(() => {
      currentProgress += Math.random() * 15 + 5;
      if (currentProgress > 100) currentProgress = 100;
      
      setProgress(currentProgress);
      
      // Update stage based on progress
      const stageIndex = Math.floor((currentProgress / 100) * (stages.length - 1));
      if (stageIndex !== currentStage && stageIndex < stages.length) {
        currentStage = stageIndex;
        setLoadingStage(stages[stageIndex]);
      }
      
      if (currentProgress >= 100) {
        clearInterval(progressInterval);
      }
    }, 300);

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        {/* Enhanced spinner with pulse effect */}
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          <div className="absolute animate-ping rounded-full h-6 w-6 border border-gray-400 dark:border-gray-600 opacity-30"></div>
        </div>
        
        {/* Dynamic loading text with original styling */}
        <div className="space-y-2">
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            {loadingStage}{dots}
          </p>
          
          {/* Subtle progress indicator */}
          <div className="w-48 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full bg-gray-900 dark:bg-gray-100 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Please wait while we prepare your experience
          </p>
        </div>
      </div>
    </div>
  );
};

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
    return <EnhancedLoadingComponent />;
  }

  if (!isAuthenticated) {
    // Redirect to events page if not authenticated
    return <Navigate to="/events" replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

// FIXED: App Router with login-based redirect only
const AppRouter: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading } = useAuth();
  const hasRedirectedAfterLogin = useRef(false);

  // Only redirect to dashboard immediately after login, not on every home page visit
  useEffect(() => {
    if (loading) return;

    const currentPath = location.pathname + location.search;
    
    // Check if user just logged in and is on home page
    // This should only happen once after authentication
    if (isAuthenticated && user && user.role && currentPath === '/' && !hasRedirectedAfterLogin.current) {
      // Check if this is a fresh login (not just navigating back to home)
      const justLoggedIn = sessionStorage.getItem('justLoggedIn');
      
      if (justLoggedIn) {
        const redirectPath = getRoleBasedRedirect(user.role);
        console.log(`🎯 Post-login redirect: Taking ${user.role} user to: ${redirectPath}`);
        hasRedirectedAfterLogin.current = true;
        sessionStorage.removeItem('justLoggedIn'); // Clean up
        navigate(redirectPath, { replace: true });
        
        // Reset after some time to allow future logins
        setTimeout(() => {
          hasRedirectedAfterLogin.current = false;
        }, 5000);
      }
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