import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X, User, LayoutDashboard, Sparkles, Home, Calendar, MapPin, Users, Info } from "lucide-react";
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

  const navigationItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/events', label: 'Events', icon: Calendar },
    { path: '/venues', label: 'Venues', icon: MapPin },
    { path: '/artists', label: 'Artists', icon: Users },
    { path: '/about', label: 'About', icon: Info },
  ];

  return (
    <>
      <style>{`
        .navbar-backdrop {
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(51, 65, 85, 0.3);
          transition: all 0.3s ease;
        }

        .mobile-sidebar {
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #334155 100%);
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.5);
          border-right: 1px solid rgba(51, 65, 85, 0.3);
        }

        .sidebar-item {
          position: relative;
          display: flex;
          align-items: center;
          padding: 12px 20px;
          margin: 4px 12px;
          border-radius: 8px;
          transition: all 0.2s ease;
          color: #94a3b8;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
        }

        .sidebar-item:hover {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          transform: translateX(4px);
        }

        .sidebar-item.active {
          background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .sidebar-item.active::before {
          content: '';
          position: absolute;
          left: -12px;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 24px;
          background: #3b82f6;
          border-radius: 0 4px 4px 0;
        }

        .brand-glow {
          filter: drop-shadow(0 4px 8px rgba(59, 130, 246, 0.3));
        }

        .mobile-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 40;
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

      {/* Main Header */}
      <header className="fixed top-0 left-0 right-0 z-50 navbar-backdrop shadow-lg shadow-blue-500/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Brand/Logo */}
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
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-400 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-xl group-hover:shadow-cyan-500/40 transition-all duration-500 group-hover:scale-110 pulse-glow">
                <span className="text-white font-bold text-xl drop-shadow-sm">P</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 via-cyan-400/25 to-teal-300/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-300/20 to-blue-300/15 rounded-full blur-2xl opacity-0 group-hover:opacity-75 transition-all duration-700 scale-150"></div>
            </div>
            <span className="text-2xl font-bold gradient-text-animate">
              Pulse
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigationItems.slice(1).map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  "font-medium transition-all duration-300 relative px-4 py-2.5 rounded-xl group overflow-hidden",
                  isActive(path) 
                    ? "text-white bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 shadow-lg shadow-blue-500/30" 
                    : "text-gray-700 dark:text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-50 hover:via-cyan-50 hover:to-teal-50 dark:hover:from-blue-900/30 dark:hover:via-cyan-900/20 dark:hover:to-teal-900/20"
                )}
              >
                {label}
                {!isActive(path) && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-cyan-500/0 to-teal-500/0 group-hover:from-blue-500/10 group-hover:via-cyan-500/8 group-hover:to-teal-500/6 rounded-xl transition-all duration-300"></div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl transition-all duration-500"></div>
                  </>
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
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
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/70 via-cyan-50/60 to-teal-50/50 dark:from-blue-900/40 dark:via-cyan-900/30 dark:to-teal-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
              className={cn(
                "relative group transition-all duration-300 rounded-xl border border-transparent overflow-hidden",
                isMenuOpen 
                  ? "bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white shadow-lg shadow-blue-500/30"
                  : "text-slate-300 hover:text-blue-400 hover:bg-slate-700/50"
              )}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="mobile-overlay md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Menu - HiAnime Style */}
      <div 
        ref={mobileMenuRef}
        className={cn(
          "fixed top-0 left-0 bottom-0 w-64 z-50 transform transition-transform duration-300 ease-out md:hidden mobile-sidebar",
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center brand-glow">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="text-lg font-bold text-white">Pulse</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(false)}
              className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg h-8 w-8"
            >
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="py-4 flex-1 overflow-y-auto">
          {navigationItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                "sidebar-item",
                isActive(path) && "active"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              <Icon size={20} className="mr-3 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          ))}

          {isLoggedIn && (
            <Link
              to="/dashboard"
              className={cn(
                "sidebar-item",
                isActive('/dashboard') && "active"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              <LayoutDashboard size={20} className="mr-3 flex-shrink-0" />
              <span>Dashboard</span>
            </Link>
          )}

          {/* Divider */}
          <div className="mx-6 my-4 h-px bg-slate-700/50"></div>

          {/* Additional Menu Items */}
          <div className="px-6 py-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Account
            </p>
            <div
              className="sidebar-item !mx-0"
              onClick={() => {
                setIsAuthOpen(true);
                setIsMenuOpen(false);
              }}
            >
              <User size={20} className="mr-3 flex-shrink-0" />
              <span>Profile</span>
            </div>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-slate-700/50 bg-slate-900/50">
          {!isLoggedIn ? (
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
              onClick={() => {
                setIsAuthOpen(true);
                setIsMenuOpen(false);
              }}
            >
              <User size={18} />
              <span>Sign In</span>
              <Sparkles size={16} className="opacity-80" />
            </Button>
          ) : (
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg py-3"
                onClick={handleLogout}
              >
                Sign Out
              </Button>
            </div>
          )}
          
          {/* Status Indicator */}
          <div className="flex items-center justify-center mt-4 pt-4 border-t border-slate-700/30">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                isLoggedIn ? "bg-green-500" : "bg-slate-500"
              )}></div>
              <span>{isLoggedIn ? "Connected" : "Welcome"}</span>
            </div>
          </div>
        </div>
      </div>

      <AuthCard
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        toast={console.log}
      />

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

        .mobile-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 40;
        }

        .mobile-sidebar {
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #334155 100%);
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.5);
          border-right: 1px solid rgba(51, 65, 85, 0.3);
        }

        .sidebar-item {
          position: relative;
          display: flex;
          align-items: center;
          padding: 12px 20px;
          margin: 4px 12px;
          border-radius: 8px;
          transition: all 0.2s ease;
          color: #94a3b8;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
        }

        .sidebar-item:hover {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          transform: translateX(4px);
        }

        .sidebar-item.active {
          background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .sidebar-item.active::before {
          content: '';
          position: absolute;
          left: -12px;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 24px;
          background: #3b82f6;
          border-radius: 0 4px 4px 0;
        }

        .brand-glow {
          filter: drop-shadow(0 4px 8px rgba(59, 130, 246, 0.3));
        }
      `}</style>
    </>
  );
};

export default Navbar;