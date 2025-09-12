import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X, User, LayoutDashboard, Sparkles, Home, Calendar, MapPin, Users, Info, Search, Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from '@/lib/utils';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import AuthCard from './AuthCard';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showNavbarOnPage, setShowNavbarOnPage] = useState<boolean>(false);
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

  // Check if we're on any page - navbar should be hidden by default on ALL pages now
  const shouldHideNavbar = true; // Changed from location.pathname !== '/' to always true

  // Effect to check user login status on component mount
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          await response.json();
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

  // Effect to close mobile menu and reset navbar visibility on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setShowNavbarOnPage(false);
  }, [location.pathname]);

  // Effect to manage body classes for proper spacing
  useEffect(() => {
    const body = document.body;
    
    if (shouldHideNavbar && !showNavbarOnPage) {
      // Hidden navbar state
      body.classList.add('navbar-hidden');
      body.classList.remove('navbar-view', 'navbar-collapsed');
    } else if ((shouldHideNavbar && showNavbarOnPage) || !shouldHideNavbar) {
      // Navbar visible - always full width now
      body.classList.add('navbar-view');
      body.classList.remove('navbar-hidden', 'navbar-collapsed');
    }

    return () => {
      body.classList.remove('navbar-view', 'navbar-hidden', 'navbar-collapsed');
    };
  }, [shouldHideNavbar, showNavbarOnPage]);

 const navigationItems = [
  { path: '/', label: 'Home', icon: Home, description: 'Welcome & overview', category: 'Main', color: 'text-blue-500' },
  { path: '/events', label: 'Events', icon: Calendar, description: 'Discover events', category: 'Discover', color: 'text-purple-500' },
  { path: '/venues', label: 'Venues', icon: MapPin, description: 'Find venues', category: 'Discover', color: 'text-green-500' },
  { path: '/partnerships', label: 'Partnerships', icon: Users, description: 'Explore partnerships & collaborations', category: 'Discover', color: 'text-orange-500' },
  { path: '/about', label: 'About', icon: Info, description: 'Learn about us', category: 'Info', color: 'text-indigo-500' },
];


  // Filter navigation items based on search query
  const filteredNavigationItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return navigationItems;
    }

    const query = searchQuery.toLowerCase().trim();
    
    return navigationItems.filter(item => 
      item.label.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  }, [searchQuery, navigationItems]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const toggleNavbarVisibility = () => {
    setShowNavbarOnPage(!showNavbarOnPage);
  };

  return (
    <>
      {/* Top Access Button - Show only when navbar is hidden */}
      {!showNavbarOnPage && (
        <div className="fixed top-4 left-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleNavbarVisibility}
            className="w-10 h-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          >
            <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Button>
        </div>
      )}

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-800 dark:text-gray-200">Pulse</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Event Discovery Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Header - Only show when navbar is visible */}
      {showNavbarOnPage && (
        <div className="hidden md:block fixed top-0 right-0 left-72 z-40 bg-white dark:bg-gray-800 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm transition-all duration-300">
          <div className="flex items-center justify-end gap-4">
            <ThemeToggle />
            
            {isLoggedIn && (
              <Link to="/dashboard">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "relative group transition-all duration-300 rounded-xl border border-transparent",
                    isActive('/dashboard')
                      ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg shadow-blue-500/25"
                      : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                  )}
                >
                  <LayoutDashboard size={20} />
                </Button>
              </Link>
            )}

            {!isLoggedIn ? (
              <Button
                onClick={() => setIsAuthOpen(true)}
                className="relative group bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium px-6 py-2 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <span>Login</span>
                  <Sparkles size={16} className="opacity-80" />
                </span>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="relative group border-2 border-blue-300 dark:border-green-400 text-blue-600 dark:text-green-400 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-green-500 font-medium px-6 py-2 rounded-xl hover:border-transparent transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25"
                onClick={handleLogout}
              >
                <span className="relative z-10">Log Out</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Left Sidebar */}
      <div className={cn(
        "fixed top-0 h-screen flex flex-col shadow-xl bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transition-all duration-300 ease-in-out w-72",
        // Mobile positioning
        isMenuOpen ? "left-0" : "-left-72",
        // Desktop positioning - now always based on showNavbarOnPage
        showNavbarOnPage ? "md:left-0" : "md:-left-72"
      )}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 mt-16 md:mt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-xl text-gray-800 dark:text-gray-200">Pulse</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Event Discovery</p>
              </div>
            </div>
            
            {/* Desktop Close Button */}
            <div className="hidden md:block">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleNavbarVisibility}
                className="w-8 h-8 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-300 hover:scale-110"
              >
                <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search navigation..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-10 py-2 text-sm bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-all duration-200 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full transition-colors"
              >
                <X className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredNavigationItems.length > 0 ? (
            filteredNavigationItems.map((item, index) => {
              const isActiveRoute = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={cn(
                    "group relative w-full flex items-center text-left text-sm rounded-xl transition-all duration-300 ease-out transform hover:scale-[1.02] gap-3 px-4 py-3.5",
                    isActiveRoute
                      ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg shadow-blue-500/25"
                      : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-all duration-300 flex-shrink-0",
                    isActiveRoute ? "text-white" : item.color
                  )} />

                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.label}</div>
                    <div className={cn(
                      "text-xs truncate transition-colors duration-300",
                      isActiveRoute ? "text-white/80" : "text-gray-500 dark:text-gray-400"
                    )}>
                      {item.description}
                    </div>
                  </div>

                  {isActiveRoute && (
                    <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-l-full opacity-80"></div>
                  )}
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No pages found</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Try searching for "events", "venues", "artists", or "home"
              </p>
              <button
                onClick={clearSearch}
                className="mt-3 text-xs text-blue-500 hover:text-blue-600 underline"
              >
                Clear search
              </button>
            </div>
          )}

          {/* Dashboard Link for Logged In Users */}
          {isLoggedIn && (
            <>
              <div className={cn(
                "my-4 bg-gray-200 dark:bg-gray-700 mx-2 h-px"
              )}></div>
              <button
                onClick={() => handleNavClick('/dashboard')}
                className={cn(
                  "group relative w-full flex items-center text-left text-sm rounded-xl transition-all duration-300 ease-out transform hover:scale-[1.02] gap-3 px-4 py-3.5",
                  isActive('/dashboard')
                    ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg shadow-blue-500/25"
                    : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                )}
              >
                <LayoutDashboard className={cn(
                  "h-5 w-5 transition-all duration-300 flex-shrink-0",
                  isActive('/dashboard') ? "text-white" : "text-emerald-500"
                )} />

                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">Dashboard</div>
                  <div className={cn(
                    "text-xs truncate transition-colors duration-300",
                    isActive('/dashboard') ? "text-white/80" : "text-gray-500 dark:text-gray-400"
                  )}>
                    Your personal space
                  </div>
                </div>

                {isActive('/dashboard') && (
                  <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-l-full opacity-80"></div>
                )}
              </button>
            </>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Account
          </h3>
          <div className="space-y-2">
            {!isLoggedIn ? (
              <Button
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/30 flex items-center justify-center py-3 space-x-2"
                onClick={() => {
                  setIsAuthOpen(true);
                  setIsMenuOpen(false);
                }}
              >
                <User size={18} />
                <span>Login</span>
                <Sparkles size={16} className="opacity-80" />
              </Button>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all duration-200 group"
              >
                <X className="h-4 w-4 group-hover:scale-110 transition-transform duration-200 flex-shrink-0" />
                <span>Log Out</span>
              </button>
            )}
          </div>
          
          {/* Status Indicator */}
          <div className="flex items-center justify-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                isLoggedIn ? "bg-green-500" : "bg-gray-500"
              )}></div>
              <span>{isLoggedIn ? "Connected" : "Welcome"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {(isMenuOpen || showNavbarOnPage) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:block"
          onClick={() => {
            setIsMenuOpen(false);
            setShowNavbarOnPage(false);
          }}
        />
      )}

      {/* Auth Modal */}
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

        .brand-glow {
          filter: drop-shadow(0 4px 8px rgba(59, 130, 246, 0.3));
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

        /* Body padding management */
        body {
          transition: padding-left 0.3s ease-in-out, padding-top 0.3s ease-in-out;
        }

        /* When navbar is visible */
        body.navbar-view {
          padding-top: 0; /* No top padding since navbar is hidden by default */
        }
        
        @media (min-width: 768px) {
          body.navbar-view {
            padding-top: 80px; /* Only add top padding on desktop when navbar is shown */
            padding-left: 288px; /* 72 * 4 = 288px for w-72 */
          }
        }

        /* When navbar is hidden (default state) */
        body.navbar-hidden {
          padding-top: 0;
          padding-left: 0;
        }
        
        /* Mobile always has top padding for mobile header */
        @media (max-width: 767px) {
          body.navbar-view,
          body.navbar-hidden {
            padding-top: 80px !important;
            padding-left: 0 !important;
          }
        }

        /* Tooltip styles for collapsed state */
        [title]:hover::after {
          content: attr(title);
          position: absolute;
          left: calc(100% + 10px);
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 1000;
          pointer-events: none;
        }
      `}</style>
    </>
  );
};

export default Navbar;