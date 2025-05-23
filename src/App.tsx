import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import ProtectedRoute from "./components/prt";
import PaymentStatus from "./pages/PaymentStatus";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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

            <Route path="/" element={<ProtectedRoute />}>
              <Route path="dashboard" element={<Dashboard />} />
            </Route>
            
            <Route path="/event/:id" element={<EventDetails />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/auth/callback/google" element={<GoogleCallback />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
