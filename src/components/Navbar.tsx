import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X, User, LayoutDashboard } from "lucide-react";
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import AuthCard from './AuthCard';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const location = useLocation();
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(true);
          console.log("User:", data.user);
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

  // Close mobile menu when clicking outside
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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 5px rgba(147, 51, 234, 0.3);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 20px rgba(147, 51, 234, 0.6), 0 0 30px rgba(99, 102, 241, 0.4);
            transform: scale(1.05);
          }
        }
        
        @keyframes float-bounce {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(2deg); }
          50% { transform: translateY(-1px) rotate(-1deg); }
          75% { transform: translateY(-2px) rotate(1deg); }
        }
        
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes nav-slide-in {
          from { 
            opacity: 0;
            transform: translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes mobile-menu-slide {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        
        @keyframes button-glow {
          0%, 100% { box-shadow: 0 0 5px rgba(147, 51, 234, 0.3); }
          50% { box-shadow: 0 0 15px rgba(147, 51, 234, 0.6); }
        }
        
        .logo-container {
          animation: float-bounce 4s ease-in-out infinite;
        }
        
        .logo-background {
          animation: pulse-glow 3s ease-in-out infinite;
          background: linear-gradient(135deg, #9333ea, #6366f1, #8b5cf6);
          background-size: 200% 200%;
          animation: pulse-glow 3s ease-in-out infinite, gradient-shift 6s ease infinite;
        }
        
        .logo-text {
          animation: float-bounce 4s ease-in-out infinite 0.5s;
          background: linear-gradient(45deg, #9333ea 0%, #6366f1 50%, #8b5cf6 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: float-bounce 4s ease-in-out infinite 0.5s, gradient-shift 3s ease infinite;
        }

        /* Fix for better text visibility */
        .logo-text-readable {
          background: linear-gradient(45deg, #7c3aed 0%, #6366f1 50%, #8b5cf6 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: float-bounce 4s ease-in-out infinite 0.5s;
          text-shadow: 0 0 1px rgba(147, 51, 234, 0.5);
        }

        /* Dark mode text visibility */
        .dark .logo-text-readable {
          background: linear-gradient(45deg, #a855f7 0%, #8b5cf6 50%, #c084fc 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        
        .nav-item {
          animation: nav-slide-in 0.6s ease-out;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .nav-item:hover {
          transform: translateY(-2px);
          text-shadow: 0 0 10px rgba(147, 51, 234, 0.5);
        }
        
        .mobile-menu {
          animation: mobile-menu-slide 0.3s ease-out;
        }
        
        .mobile-nav-item {
          animation: nav-slide-in 0.4s ease-out;
          transition: all 0.3s ease;
        }
        
        .mobile-nav-item:hover {
          transform: translateX(10px);
          text-shadow: 0 0 10px rgba(147, 51, 234, 0.5);
        }
        
        .animated-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .animated-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.6s;
        }
        
        .animated-button:hover::before {
          left: 100%;
        }
        
        .animated-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(147, 51, 234, 0.4);
        }
        
        .menu-button {
          transition: all 0.3s ease;
        }
        
        .menu-button:hover {
          transform: rotate(180deg);
        }
        
        .dashboard-icon {
          transition: all 0.3s ease;
        }
        
        .dashboard-icon:hover {
          transform: rotate(360deg) scale(1.1);
        }
        
        .user-icon {
          transition: all 0.3s ease;
        }
        
        .user-icon:hover {
          transform: scale(1.2);
          filter: drop-shadow(0 0 8px rgba(147, 51, 234, 0.6));
        }
        
        .navbar-backdrop {
          backdrop-filter: blur(20px);
          background: rgba(249, 250, 251, 0.85);
          transition: all 0.3s ease;
        }
        
        .dark .navbar-backdrop {
          background: rgba(17, 24, 39, 0.85);
        }
        
        .pulse-ring {
          animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
        }
        
        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        /* Mobile menu backdrop */
        .mobile-menu-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 35;
          transition: opacity 0.3s ease;
        }
      `}</style>

      <header className="fixed top-0 left-0 right-0 z-50 navbar-backdrop border-b border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative logo-container">
              <div className="absolute inset-0 logo-background rounded-full blur-sm opacity-70"></div>
              <div className="absolute inset-0 pulse-ring bg-gradient-to-r from-purple-600 to-indigo-700 rounded-full opacity-30"></div>
              <div className="relative w-12 h-12 logo-background rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl drop-shadow-lg">P</span>
              </div>
            </div>
            <span className="text-2xl font-bold logo-text-readable">
              Pulse
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/events"
              className={cn(
                "nav-item font-medium transition-colors hover:text-purple-600 relative",
                isActive('/events') ? "text-purple-600" : "text-gray-700 dark:text-gray-300"
              )}
              style={{ animationDelay: '0.1s' }}
            >
              Events
              {isActive('/events') && (
                <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-purple-600 to-indigo-700"></div>
              )}
            </Link>
            <Link
              to="/venues"
              className={cn(
                "nav-item font-medium transition-colors hover:text-purple-600 relative",
                isActive('/venues') ? "text-purple-600" : "text-gray-700 dark:text-gray-300"
              )}
              style={{ animationDelay: '0.2s' }}
            >
              Venues
              {isActive('/venues') && (
                <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-purple-600 to-indigo-700"></div>
              )}
            </Link>
            <Link
              to="/artists"
              className={cn(
                "nav-item font-medium transition-colors hover:text-purple-600 relative",
                isActive('/artists') ? "text-purple-600" : "text-gray-700 dark:text-gray-300"
              )}
              style={{ animationDelay: '0.3s' }}
            >
              Artists
              {isActive('/artists') && (
                <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-purple-600 to-indigo-700"></div>
              )}
            </Link>
            <Link
              to="/about"
              className={cn(
                "nav-item font-medium transition-colors hover:text-purple-600 relative",
                isActive('/about') ? "text-purple-600" : "text-gray-700 dark:text-gray-300"
              )}
              style={{ animationDelay: '0.4s' }}
            >
              About
              {isActive('/about') && (
                <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-purple-600 to-indigo-700"></div>
              )}
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />

            {isLoggedIn && (
              <Link to="/dashboard">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/20 dashboard-icon"
                >
                  <LayoutDashboard size={20} />
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/20 user-icon"
            >
              <User size={20} />
            </Button>

            {!isLoggedIn ? (
              <Button
                onClick={() => setIsAuthOpen(true)}
                className="animated-button bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-medium px-6 py-2 rounded-lg"
              >
                Sign In
              </Button>
            ) : (
              <Button
                variant="outline"
                className="animated-button border-purple-600 text-purple-600 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20 font-medium px-6 py-2 rounded-lg"
                onClick={() => setIsLoggedIn(false)}
              >
                Sign Out
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 md:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/20 menu-button"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Backdrop */}
        {isMenuOpen && (
          <div 
            className="mobile-menu-backdrop"
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        {/* Mobile Menu */}
        <div 
          ref={mobileMenuRef}
          className={cn(
            "fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg transition-all duration-300 transform md:hidden shadow-2xl",
            isMenuOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
            "mobile-menu"
          )}
        >
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-bold text-gray-800 dark:text-gray-200">Menu</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(false)}
              className="hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/20"
            >
              <X size={24} />
            </Button>
          </div>

          <nav className="px-4 py-6 flex flex-col space-y-6">
            <Link
              to="/events"
              className={cn(
                "mobile-nav-item text-xl font-medium transition-colors relative",
                isActive('/events') ? "text-purple-600" : "hover:text-purple-600 text-gray-700 dark:text-gray-300"
              )}
              onClick={() => setIsMenuOpen(false)}
              style={{ animationDelay: '0.1s' }}
            >
              Events
            </Link>
            <Link
              to="/venues"
              className={cn(
                "mobile-nav-item text-xl font-medium transition-colors relative",
                isActive('/venues') ? "text-purple-600" : "hover:text-purple-600 text-gray-700 dark:text-gray-300"
              )}
              onClick={() => setIsMenuOpen(false)}
              style={{ animationDelay: '0.2s' }}
            >
              Venues
            </Link>
            <Link
              to="/artists"
              className={cn(
                "mobile-nav-item text-xl font-medium transition-colors relative",
                isActive('/artists') ? "text-purple-600" : "hover:text-purple-600 text-gray-700 dark:text-gray-300"
              )}
              onClick={() => setIsMenuOpen(false)}
              style={{ animationDelay: '0.3s' }}
            >
              Artists
            </Link>
            <Link
              to="/about"
              className={cn(
                "mobile-nav-item text-xl font-medium transition-colors relative",
                isActive('/about') ? "text-purple-600" : "hover:text-purple-600 text-gray-700 dark:text-gray-300"
              )}
              onClick={() => setIsMenuOpen(false)}
              style={{ animationDelay: '0.4s' }}
            >
              About
            </Link>

            {isLoggedIn && (
              <Link
                to="/dashboard"
                className="mobile-nav-item text-xl font-medium hover:text-purple-600 transition-colors text-gray-700 dark:text-gray-300"
                onClick={() => setIsMenuOpen(false)}
                style={{ animationDelay: '0.5s' }}
              >
                Dashboard
              </Link>
            )}

            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent my-4"></div>

            {!isLoggedIn ? (
              <Button
                className="animated-button w-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-medium py-3 rounded-lg"
                size="lg"
                onClick={() => {
                  setIsAuthOpen(true);
                  setIsMenuOpen(false);
                }}
              >
                Sign In
              </Button>
            ) : (
              <Button
                variant="outline"
                className="animated-button w-full border-purple-600 text-purple-600 dark:border-purple-800 font-medium py-3 rounded-lg"
                size="lg"
                onClick={() => {
                  setIsLoggedIn(false);
                  setIsMenuOpen(false);
                }}
              >
                Sign Out
              </Button>
            )}

            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                size="icon"
                className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20 user-icon"
              >
                <User size={20} />
              </Button>
            </div>
          </nav>
        </div>

        <AuthCard
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          toast={console.log} // Add a placeholder toast function or import your actual toast
        />
      </header>
    </>
  );
};

export default Navbar;