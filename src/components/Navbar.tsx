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
        .navbar-backdrop {
          backdrop-filter: blur(20px);
          background: rgba(249, 250, 251, 0.85);
          transition: all 0.3s ease;
        }
        
        .dark .navbar-backdrop {
          background: rgba(17, 24, 39, 0.85);
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
            <div className="relative">
              <div className="w-12 h-12 bg-gray-800 dark:bg-gray-200 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white dark:text-gray-800 font-bold text-xl">P</span>
              </div>
            </div>
            <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              Pulse
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/events"
              className={cn(
                "font-medium transition-colors hover:text-gray-600 dark:hover:text-gray-300 relative",
                isActive('/events') ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"
              )}
            >
              Events
              {isActive('/events') && (
                <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gray-800 dark:bg-gray-200"></div>
              )}
            </Link>
            <Link
              to="/venues"
              className={cn(
                "font-medium transition-colors hover:text-gray-600 dark:hover:text-gray-300 relative",
                isActive('/venues') ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"
              )}
            >
              Venues
              {isActive('/venues') && (
                <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gray-800 dark:bg-gray-200"></div>
              )}
            </Link>
            <Link
              to="/artists"
              className={cn(
                "font-medium transition-colors hover:text-gray-600 dark:hover:text-gray-300 relative",
                isActive('/artists') ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"
              )}
            >
              Artists
              {isActive('/artists') && (
                <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gray-800 dark:bg-gray-200"></div>
              )}
            </Link>
            <Link
              to="/about"
              className={cn(
                "font-medium transition-colors hover:text-gray-600 dark:hover:text-gray-300 relative",
                isActive('/about') ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"
              )}
            >
              About
              {isActive('/about') && (
                <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gray-800 dark:bg-gray-200"></div>
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
                  className="hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <LayoutDashboard size={20} />
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <User size={20} />
            </Button>

            {!isLoggedIn ? (
              <Button
                onClick={() => setIsAuthOpen(true)}
                className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-200 dark:hover:bg-gray-300 text-white dark:text-gray-800 font-medium px-6 py-2 rounded-lg"
              >
                Sign In
              </Button>
            ) : (
              <Button
                variant="outline"
                className="border-gray-800 text-gray-800 hover:bg-gray-50 dark:border-gray-200 dark:text-gray-200 dark:hover:bg-gray-800 font-medium px-6 py-2 rounded-lg"
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
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
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
            isMenuOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
          )}
        >
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-bold text-gray-800 dark:text-gray-200">Menu</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(false)}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X size={24} />
            </Button>
          </div>

          <nav className="px-4 py-6 flex flex-col space-y-6">
            <Link
              to="/events"
              className={cn(
                "text-xl font-medium transition-colors relative",
                isActive('/events') ? "text-gray-900 dark:text-gray-100" : "hover:text-gray-600 dark:hover:text-gray-300 text-gray-700 dark:text-gray-300"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              Events
            </Link>
            <Link
              to="/venues"
              className={cn(
                "text-xl font-medium transition-colors relative",
                isActive('/venues') ? "text-gray-900 dark:text-gray-100" : "hover:text-gray-600 dark:hover:text-gray-300 text-gray-700 dark:text-gray-300"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              Venues
            </Link>
            <Link
              to="/artists"
              className={cn(
                "text-xl font-medium transition-colors relative",
                isActive('/artists') ? "text-gray-900 dark:text-gray-100" : "hover:text-gray-600 dark:hover:text-gray-300 text-gray-700 dark:text-gray-300"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              Artists
            </Link>
            <Link
              to="/about"
              className={cn(
                "text-xl font-medium transition-colors relative",
                isActive('/about') ? "text-gray-900 dark:text-gray-100" : "hover:text-gray-600 dark:hover:text-gray-300 text-gray-700 dark:text-gray-300"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>

            {isLoggedIn && (
              <Link
                to="/dashboard"
                className="text-xl font-medium hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-gray-700 dark:text-gray-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}

            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent my-4"></div>

            {!isLoggedIn ? (
              <Button
                className="w-full bg-gray-800 hover:bg-gray-900 dark:bg-gray-200 dark:hover:bg-gray-300 text-white dark:text-gray-800 font-medium py-3 rounded-lg"
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
                className="w-full border-gray-800 text-gray-800 dark:border-gray-200 dark:text-gray-200 font-medium py-3 rounded-lg"
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
                className="border-gray-800 text-gray-800 hover:bg-gray-50 dark:border-gray-200 dark:text-gray-200 dark:hover:bg-gray-800"
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