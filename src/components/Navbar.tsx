import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X, User, LayoutDashboard, Sparkles } from "lucide-react";
import { cn } from '@/lib/utils';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import AuthCard from './AuthCard';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Helper function to check if a navigation link is active
  const isActive = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Effect to check user login status on component mount
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          await response.json(); // Data is not used, but good practice to consume it
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsLoggedIn(false);
      }
    };
    checkLogin();
  }, []);

  // Handle user logout
  const handleLogout = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setIsLoggedIn(false);
        setIsMenuOpen(false);
        navigate('/');
      }
    } catch (err) {
      console.error("Logout failed:", err);
      setIsLoggedIn(false);
      setIsMenuOpen(false);
    }
  };

  // Effect to close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Effect to close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <style>{`
        .navbar-backdrop {
          backdrop-filter: blur(20px);
          background: linear-gradient(135deg, rgba(249, 250, 251, 0.95), rgba(239, 246, 255, 0.9), rgba(236, 254, 255, 0.9));
          transition: all 0.3s ease;
          border-bottom: 1px solid rgba(59, 130, 246, 0.15);
          box-shadow: 0 4px 30px rgba(59, 130, 246, 0.1);
        }
        
        .dark .navbar-backdrop {
          background: linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(30, 58, 138, 0.1), rgba(22, 78, 99, 0.1));
          border-bottom: 1px solid rgba(34, 211, 238, 0.2);
          box-shadow: 0 4px 30px rgba(34, 211, 238, 0.05);
        }

        /* Mobile menu backdrop with gradient overlay */
        .mobile-menu-backdrop {
          position: fixed;
          inset: 0;
          background: linear-gradient(135deg, rgba(30, 58, 138, 0.4), rgba(22, 78, 99, 0.3), rgba(6, 182, 212, 0.2));
          z-index: 35;
          transition: opacity 0.3s ease;
          backdrop-filter: blur(8px);
        }

        /* Enhanced gradient animations */
        .gradient-border::before {
          content: '';
          position: absolute;
          inset: 0;
          padding: 2px;
          background: linear-gradient(135deg, #3b82f6, #06b6d4, #22d3ee, #3b82f6);
          border-radius: inherit;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: xor;
          background-size: 300% 300%;
          animation: gradientShift 4s ease-in-out infinite;
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          25% { background-position: 100% 50%; }
          50% { background-position: 50% 100%; }
          75% { background-position: 0% 100%; }
        }

        .pulse-glow {
          animation: pulseGlow 2s ease-in-out infinite;
        }

        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 30px rgba(34, 211, 238, 0.4), 0 0 40px rgba(6, 182, 212, 0.2); }
        }

        .gradient-text-animate {
          background: linear-gradient(45deg, #3b82f6, #06b6d4, #22d3ee, #3b82f6);
          background-size: 300% 300%;
          animation: gradientText 3s ease-in-out infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        @keyframes gradientText {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>

      <header className="fixed top-0 left-0 right-0 z-50 navbar-backdrop shadow-lg shadow-blue-500/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Enhanced Brand/Logo with comprehensive gradient styling */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 group"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
              setIsMenuOpen(false);
            }}
          >
            <div className="relative">
              {/* Multi-layer gradient background for logo */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-400 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-xl group-hover:shadow-cyan-500/40 transition-all duration-500 group-hover:scale-110 pulse-glow">
                <span className="text-white font-bold text-xl drop-shadow-sm">P</span>
              </div>
              {/* Enhanced glow effect with multiple colors */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 via-cyan-400/25 to-teal-300/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              {/* Secondary glow layer */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-300/20 to-blue-300/15 rounded-full blur-2xl opacity-0 group-hover:opacity-75 transition-all duration-700 scale-150"></div>
            </div>
            <span className="text-2xl font-bold gradient-text-animate">
              Pulse
            </span>
          </Link>

          {/* Enhanced Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/events"
              className={cn(
                "font-medium transition-all duration-300 relative px-4 py-2.5 rounded-xl group overflow-hidden",
                isActive('/events') 
                  ? "text-white bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 shadow-lg shadow-blue-500/30" 
                  : "text-gray-700 dark:text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-50 hover:via-cyan-50 hover:to-teal-50 dark:hover:from-blue-900/30 dark:hover:via-cyan-900/20 dark:hover:to-teal-900/20"
              )}
            >
              Events
              {!isActive('/events') && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-cyan-500/0 to-teal-500/0 group-hover:from-blue-500/10 group-hover:via-cyan-500/8 group-hover:to-teal-500/6 rounded-xl transition-all duration-300"></div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl transition-all duration-500"></div>
                </>
              )}
            </Link>

            <Link
              to="/venues"
              className={cn(
                "font-medium transition-all duration-300 relative px-4 py-2.5 rounded-xl group overflow-hidden",
                isActive('/venues') 
                  ? "text-white bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-500 shadow-lg shadow-cyan-500/30" 
                  : "text-gray-700 dark:text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-cyan-50 hover:via-teal-50 hover:to-blue-50 dark:hover:from-cyan-900/30 dark:hover:via-teal-900/20 dark:hover:to-blue-900/20"
              )}
            >
              Venues
              {!isActive('/venues') && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-teal-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:via-teal-500/8 group-hover:to-blue-500/6 rounded-xl transition-all duration-300"></div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-xl transition-all duration-500"></div>
                </>
              )}
            </Link>

            <Link
              to="/artists"
              className={cn(
                "font-medium transition-all duration-300 relative px-4 py-2.5 rounded-xl group overflow-hidden",
                isActive('/artists') 
                  ? "text-white bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 shadow-lg shadow-teal-500/30" 
                  : "text-gray-700 dark:text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-teal-50 hover:via-cyan-50 hover:to-blue-50 dark:hover:from-teal-900/30 dark:hover:via-cyan-900/20 dark:hover:to-blue-900/20"
              )}
            >
              Artists
              {!isActive('/artists') && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-cyan-500/0 to-blue-500/0 group-hover:from-teal-500/10 group-hover:via-cyan-500/8 group-hover:to-blue-500/6 rounded-xl transition-all duration-300"></div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-teal-600/20 to-blue-600/20 rounded-xl transition-all duration-500"></div>
                </>
              )}
            </Link>

            <Link
              to="/about"
              className={cn(
                "font-medium transition-all duration-300 relative px-4 py-2.5 rounded-xl group overflow-hidden",
                isActive('/about') 
                  ? "text-white bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 shadow-lg shadow-blue-600/30" 
                  : "text-gray-700 dark:text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-50 hover:via-cyan-50 hover:to-teal-50 dark:hover:from-blue-900/30 dark:hover:via-cyan-900/20 dark:hover:to-teal-900/20"
              )}
            >
              About
              {!isActive('/about') && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-cyan-600/0 to-teal-600/0 group-hover:from-blue-600/10 group-hover:via-cyan-600/8 group-hover:to-teal-600/6 rounded-xl transition-all duration-300"></div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-blue-700/20 to-cyan-700/20 rounded-xl transition-all duration-500"></div>
                </>
              )}
            </Link>
          </nav>

          {/* Enhanced Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />

            {isLoggedIn && (
              <Link to="/dashboard">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "relative group transition-all duration-300 rounded-xl border border-transparent",
                    isActive('/dashboard')
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                      : "hover:bg-gradient-to-r hover:from-blue-50 hover:via-cyan-50 hover:to-teal-50 dark:hover:from-blue-900/30 dark:hover:via-cyan-900/20 dark:hover:to-teal-900/20 hover:text-blue-600 dark:hover:text-cyan-400 hover:border-blue-200/50 dark:hover:border-cyan-700/50 hover:shadow-lg hover:shadow-blue-500/15"
                  )}
                >
                  <LayoutDashboard size={20} />
                  {isActive('/dashboard') && (
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-xl blur-sm"></div>
                  )}
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="relative group hover:bg-gradient-to-r hover:from-blue-50 hover:via-cyan-50 hover:to-teal-50 dark:hover:from-blue-900/30 dark:hover:via-cyan-900/20 dark:hover:to-teal-900/20 hover:text-blue-600 dark:hover:text-cyan-400 transition-all duration-300 rounded-xl border border-transparent hover:border-blue-200/50 dark:hover:border-cyan-700/50 hover:shadow-lg hover:shadow-blue-500/15"
              onClick={() => setIsAuthOpen(true)}
            >
              <User size={20} />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-teal-500/5 rounded-xl transition-all duration-300"></div>
            </Button>

            {!isLoggedIn ? (
              <Button
                onClick={() => setIsAuthOpen(true)}
                className="relative group bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600 text-white font-medium px-8 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-300 border border-blue-400/30 hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <span>Sign In</span>
                  <Sparkles size={16} className="opacity-80" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-teal-400/15 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="relative group border-2 border-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 text-blue-600 dark:text-cyan-400 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:via-cyan-500 hover:to-teal-500 font-medium px-6 py-2.5 rounded-xl border-blue-300/60 dark:border-cyan-400/60 hover:border-transparent transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 overflow-hidden"
                onClick={handleLogout}
              >
                <span className="relative z-10">Sign Out</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-cyan-50/50 to-teal-50/50 dark:from-blue-900/30 dark:via-cyan-900/20 dark:to-teal-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
            )}
          </div>

          {/* Enhanced Mobile Menu Button */}
          <div className="flex items-center space-x-2 md:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={cn(
                "relative group transition-all duration-300 rounded-xl border border-transparent overflow-hidden",
                isMenuOpen 
                  ? "bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white shadow-lg shadow-blue-500/30"
                  : "hover:bg-gradient-to-r hover:from-blue-50 hover:via-cyan-50 hover:to-teal-50 dark:hover:from-blue-900/30 dark:hover:via-cyan-900/20 dark:hover:to-teal-900/20 hover:text-blue-600 dark:hover:text-cyan-400 hover:border-blue-200/50 dark:hover:border-cyan-700/50"
              )}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              {!isMenuOpen && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-blue-500/10 via-cyan-500/8 to-teal-500/6 rounded-xl transition-all duration-300"></div>
              )}
            </Button>
          </div>
        </div>

        {/* Enhanced Mobile Menu Backdrop */}
        {isMenuOpen && (
          <div 
            className="mobile-menu-backdrop"
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        {/* Comprehensive Mobile Menu Enhancement */}
        <div 
          ref={mobileMenuRef}
          className={cn(
            "fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] z-40 transition-all duration-500 transform md:hidden shadow-2xl shadow-blue-500/20",
            "bg-gradient-to-br from-white/98 via-blue-50/90 via-cyan-50/85 to-teal-50/80 dark:from-gray-900/98 dark:via-blue-900/30 dark:via-cyan-900/25 dark:to-teal-900/20 backdrop-blur-2xl",
            "border-l-2 border-gradient-to-b from-blue-300/40 via-cyan-300/35 to-teal-300/30 dark:from-blue-600/40 dark:via-cyan-600/35 dark:to-teal-600/30",
            isMenuOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
          )}
        >
          {/* Enhanced Mobile Menu Header */}
          <div className="flex items-center justify-between p-6 border-b-2 border-gradient-to-r from-blue-200/40 via-cyan-200/35 to-teal-200/30 dark:from-blue-700/40 dark:via-cyan-700/35 dark:to-teal-700/30 bg-gradient-to-r from-blue-50/40 via-cyan-50/35 to-teal-50/30 dark:from-blue-900/40 dark:via-cyan-900/35 dark:to-teal-900/30">
            <span className="text-2xl font-bold gradient-text-animate">
              Menu
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(false)}
              className="relative group hover:bg-gradient-to-r hover:from-blue-100 hover:via-cyan-100 hover:to-teal-100 dark:hover:from-blue-800/40 dark:hover:via-cyan-800/35 dark:hover:to-teal-800/30 hover:text-blue-600 dark:hover:text-cyan-400 transition-all duration-300 rounded-xl overflow-hidden"
            >
              <X size={24} />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-blue-500/10 via-cyan-500/8 to-teal-500/6 rounded-xl transition-all duration-300"></div>
            </Button>
          </div>

          <nav className="px-6 py-8 flex flex-col space-y-3">
            {/* The rest of the mobile menu links have been re-added and corrected. */}
            <Link
              to="/"
              className={cn(
                "text-lg font-medium transition-all duration-300 relative px-5 py-4 rounded-xl group overflow-hidden",
                isActive('/') 
                  ? "text-white bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 shadow-lg shadow-blue-500/30" 
                  : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-gradient-to-r hover:from-blue-50 hover:via-cyan-50 hover:to-teal-50 dark:hover:from-blue-900/30 dark:hover:via-cyan-900/20 dark:hover:to-teal-900/20"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
              {!isActive('/') && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-cyan-500/0 to-teal-500/0 group-hover:from-blue-500/8 group-hover:via-cyan-500/6 group-hover:to-teal-500/4 rounded-xl transition-all duration-300"></div>
                  <div className="absolute left-0 top-1/2 w-1 h-0 group-hover:h-8 bg-gradient-to-b from-blue-500 via-cyan-500 to-teal-500 rounded-full transition-all duration-300 transform -translate-y-1/2"></div>
                </>
              )}
            </Link>

            <Link
              to="/events"
              className={cn(
                "text-lg font-medium transition-all duration-300 relative px-5 py-4 rounded-xl group overflow-hidden",
                isActive('/events') 
                  ? "text-white bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 shadow-lg shadow-blue-500/30" 
                  : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-gradient-to-r hover:from-blue-50 hover:via-cyan-50 hover:to-teal-50 dark:hover:from-blue-900/30 dark:hover:via-cyan-900/20 dark:hover:to-teal-900/20"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              Events
              {!isActive('/events') && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-cyan-500/0 to-teal-500/0 group-hover:from-blue-500/8 group-hover:via-cyan-500/6 group-hover:to-teal-500/4 rounded-xl transition-all duration-300"></div>
                  <div className="absolute left-0 top-1/2 w-1 h-0 group-hover:h-8 bg-gradient-to-b from-blue-500 via-cyan-500 to-teal-500 rounded-full transition-all duration-300 transform -translate-y-1/2"></div>
                </>
              )}
            </Link>

            <Link
              to="/venues"
              className={cn(
                "text-lg font-medium transition-all duration-300 relative px-5 py-4 rounded-xl group overflow-hidden",
                isActive('/venues') 
                  ? "text-white bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-500 shadow-lg shadow-cyan-500/30" 
                  : "text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-teal-400 hover:bg-gradient-to-r hover:from-cyan-50 hover:via-teal-50 hover:to-blue-50 dark:hover:from-cyan-900/30 dark:hover:via-teal-900/20 dark:hover:to-blue-900/20"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              Venues
              {!isActive('/venues') && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-teal-500/0 to-blue-500/0 group-hover:from-cyan-500/8 group-hover:via-teal-500/6 group-hover:to-blue-500/4 rounded-xl transition-all duration-300"></div>
                  <div className="absolute left-0 top-1/2 w-1 h-0 group-hover:h-8 bg-gradient-to-b from-cyan-500 via-teal-500 to-blue-500 rounded-full transition-all duration-300 transform -translate-y-1/2"></div>
                </>
              )}
            </Link>

            <Link
              to="/artists"
              className={cn(
                "text-lg font-medium transition-all duration-300 relative px-5 py-4 rounded-xl group overflow-hidden",
                isActive('/artists') 
                  ? "text-white bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 shadow-lg shadow-teal-500/30" 
                  : "text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-cyan-400 hover:bg-gradient-to-r hover:from-teal-50 hover:via-cyan-50 hover:to-blue-50 dark:hover:from-teal-900/30 dark:hover:via-cyan-900/20 dark:hover:to-blue-900/20"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              Artists
              {!isActive('/artists') && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-cyan-500/0 to-blue-500/0 group-hover:from-teal-500/8 group-hover:via-cyan-500/6 group-hover:to-blue-500/4 rounded-xl transition-all duration-300"></div>
                  <div className="absolute left-0 top-1/2 w-1 h-0 group-hover:h-8 bg-gradient-to-b from-teal-500 via-cyan-500 to-blue-500 rounded-full transition-all duration-300 transform -translate-y-1/2"></div>
                </>
              )}
            </Link>

            <Link
              to="/about"
              className={cn(
                "text-lg font-medium transition-all duration-300 relative px-5 py-4 rounded-xl group overflow-hidden",
                isActive('/about') 
                  ? "text-white bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 shadow-lg shadow-blue-600/30" 
                  : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-gradient-to-r hover:from-blue-50 hover:via-cyan-50 hover:to-teal-50 dark:hover:from-blue-900/30 dark:hover:via-cyan-900/20 dark:hover:to-teal-900/20"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              About
              {!isActive('/about') && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-cyan-600/0 to-teal-600/0 group-hover:from-blue-600/8 group-hover:via-cyan-600/6 group-hover:to-teal-600/4 rounded-xl transition-all duration-300"></div>
                  <div className="absolute left-0 top-1/2 w-1 h-0 group-hover:h-8 bg-gradient-to-b from-blue-600 via-cyan-600 to-teal-600 rounded-full transition-all duration-300 transform -translate-y-1/2"></div>
                </>
              )}
            </Link>

            {isLoggedIn && (
              <Link
                to="/dashboard"
                className={cn(
                  "text-lg font-medium transition-all duration-300 relative px-5 py-4 rounded-xl group overflow-hidden",
                  isActive('/dashboard') 
                    ? "text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/30" 
                    : "text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-teal-400 hover:bg-gradient-to-r hover:from-emerald-50 hover:via-teal-50 hover:to-cyan-50 dark:hover:from-emerald-900/30 dark:hover:via-teal-900/20 dark:hover:to-cyan-900/20"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="flex items-center space-x-2">
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </span>
                {!isActive('/dashboard') && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-teal-500/0 to-cyan-500/0 group-hover:from-emerald-500/8 group-hover:via-teal-500/6 group-hover:to-cyan-500/4 rounded-xl transition-all duration-300"></div>
                    <div className="absolute left-0 top-1/2 w-1 h-0 group-hover:h-8 bg-gradient-to-b from-emerald-500 via-teal-500 to-cyan-500 rounded-full transition-all duration-300 transform -translate-y-1/2"></div>
                  </>
                )}
              </Link>
            )}

            {/* Enhanced Decorative Gradient Divider */}
            <div className="relative my-8">
              <div className="h-px bg-gradient-to-r from-transparent via-blue-300/60 via-cyan-400/50 via-teal-300/40 to-transparent"></div>
              <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 w-12 h-0.5 rounded-full shadow-sm shadow-cyan-400/50"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-300/50 via-cyan-300/50 to-teal-300/50 blur-sm rounded-full"></div>
              </div>
            </div>

            {/* Enhanced Authentication Buttons */}
            {!isLoggedIn ? (
              <Button
                className="w-full relative group bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600 text-white font-medium py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-300 border border-blue-400/30 overflow-hidden"
                size="lg"
                onClick={() => {
                  setIsAuthOpen(true);
                  setIsMenuOpen(false);
                }}
              >
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  <span>Sign In</span>
                  <Sparkles size={18} className="opacity-80" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-teal-400/15 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -top-1 -left-1 -right-1 -bottom-1 bg-gradient-to-r from-blue-400/30 via-cyan-400/25 to-teal-400/20 blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full relative group border-2 border-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 text-blue-600 dark:text-cyan-400 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:via-cyan-500 hover:to-teal-500 font-medium py-4 rounded-xl border-blue-300/60 dark:border-cyan-400/60 hover:border-transparent transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 overflow-hidden"
                size="lg"
                onClick={handleLogout}
              >
                <span className="relative z-10">Sign Out</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/70 via-cyan-50/60 to-teal-50/50 dark:from-blue-900/40 dark:via-cyan-900/30 dark:to-teal-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
            )}

            {/* Enhanced User Profile Button with Advanced Gradient Ring */}
            <div className="flex justify-center mt-8">
              <div className="relative group">
                {/* Multi-layer animated gradient rings */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-cyan-400 via-teal-400 to-blue-400 rounded-xl p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse">
                  <div className="bg-white dark:bg-gray-900 rounded-xl w-full h-full"></div>
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-cyan-300/30 via-teal-300/25 to-blue-300/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm"></div>
                
                <Button
                  variant="outline"
                  size="icon"
                  className="relative border-2 border-blue-300/60 dark:border-cyan-400/60 text-blue-600 dark:text-cyan-400 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:via-cyan-500 hover:to-teal-500 hover:border-transparent transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/30 w-14 h-14 rounded-xl"
                  onClick={() => setIsAuthOpen(true)}
                >
                  <User size={22} />
                </Button>
              </div>
            </div>

            {/* Additional Mobile Menu Features */}
            <div className="mt-6 pt-6 border-t border-gradient-to-r from-blue-200/30 via-cyan-200/25 to-teal-200/20 dark:from-blue-700/30 dark:via-cyan-700/25 dark:to-teal-700/20">
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-100/80 via-cyan-100/70 to-teal-100/60 dark:from-blue-900/40 dark:via-cyan-900/35 dark:to-teal-900/30 rounded-full">
                  <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {isLoggedIn ? "Connected" : "Welcome"}
                  </span>
                </div>
              </div>
            </div>
          </nav>
        </div>

        <AuthCard
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          toast={console.log}
        />
      </header>
    </>
  );
};

export default Navbar;