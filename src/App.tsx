// frontend/pulse/src/App.tsx

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"; // <--- ADDED Navigate, Outlet
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

// Import the new AuthProvider and useAuth hook
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/AuthContext";

const queryClient = new QueryClient();

// Create a new ProtectedRoute component that uses the AuthContext
const DynamicProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth(); // 'user' is also available here if needed for specific route protection

  if (loading) {
    // You can render a loading spinner or component here
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-700 dark:text-gray-300">Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to events or a login page if not authenticated
    return <Navigate to="/events" replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};


const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* Wrap your application with AuthProvider */}
    <AuthProvider>
      <ThemeProvider defaultTheme="system" storageKey="pulse-ticket-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/events" element={<Events />} />
              <Route path="/venues" element={<Venues />} />
              <Route path="/artists" element={<Artists />} />
              <Route path="/about" element={<About />} />

              <Route path="/payment-status" element={<PaymentStatus />} />

              {/* Use the new DynamicProtectedRoute */}
              <Route path="/" element={<DynamicProtectedRoute />}>
                <Route path="dashboard" element={<Dashboard />} />
              </Route>

              <Route path="/event/:id" element={<EventDetails />} />
              <Route path="*" element={<NotFound />} />
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
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;