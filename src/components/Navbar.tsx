import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X, User, LayoutDashboard } from "lucide-react";
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import AuthCard from './AuthCard';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login state
  const location = useLocation();
  
  // Function to determine if a link is active
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Mock login function - in a real app this would be connected to authentication
  const handleLogin = () => {
    setIsLoggedIn(true);
    setIsAuthOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/90 border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full animate-pulse-slow"></div>
            <div className="absolute inset-1 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-500 to-indigo-600 font-bold text-lg">P</span>
            </div>
          </div>
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-600">Pulse</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            to="/events" 
            className={cn(
              "font-medium transition-colors hover:text-purple-500",
              isActive('/events') ? "text-purple-500" : "text-foreground"
            )}
          >
            Events
          </Link>
          <Link 
            to="/venues" 
            className={cn(
              "font-medium transition-colors hover:text-purple-500",
              isActive('/venues') ? "text-purple-500" : "text-foreground"
            )}
          >
            Venues
          </Link>
          <Link 
            to="/artists" 
            className={cn(
              "font-medium transition-colors hover:text-purple-500",
              isActive('/artists') ? "text-purple-500" : "text-foreground"
            )}
          >
            Artists
          </Link>
          <Link 
            to="/about" 
            className={cn(
              "font-medium transition-colors hover:text-purple-500",
              isActive('/about') ? "text-purple-500" : "text-foreground"
            )}
          >
            About
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
                className="hover:bg-purple-100 hover:text-purple-500 dark:hover:bg-purple-900/20"
              >
                <LayoutDashboard size={20} />
              </Button>
            </Link>
          )}
          
          <Button 
            variant="ghost" 
            size="icon"
            className="hover:bg-purple-100 hover:text-purple-500 dark:hover:bg-purple-900/20"
          >
            <User size={20} />
          </Button>
          
          {!isLoggedIn ? (
            <Button 
              onClick={() => setIsAuthOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
            >
              Sign In
            </Button>
          ) : (
            <Button 
              variant="outline"
              className="border-purple-300 text-purple-500 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20"
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
            className="hover:bg-purple-100 hover:text-purple-500 dark:hover:bg-purple-900/20"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={cn(
        "fixed inset-0 z-40 bg-background/95 backdrop-blur-lg transition-transform duration-300 transform md:hidden pt-20",
        isMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <nav className="container mx-auto px-4 py-6 flex flex-col space-y-6">
          <Link 
            to="/events" 
            className={cn(
              "text-xl font-medium transition-colors",
              isActive('/events') ? "text-purple-500" : "hover:text-purple-500"
            )}
            onClick={() => setIsMenuOpen(false)}
          >
            Events
          </Link>
          <Link 
            to="/venues" 
            className={cn(
              "text-xl font-medium transition-colors",
              isActive('/venues') ? "text-purple-500" : "hover:text-purple-500"
            )}
            onClick={() => setIsMenuOpen(false)}
          >
            Venues
          </Link>
          <Link 
            to="/artists" 
            className={cn(
              "text-xl font-medium transition-colors",
              isActive('/artists') ? "text-purple-500" : "hover:text-purple-500"
            )}
            onClick={() => setIsMenuOpen(false)}
          >
            Artists
          </Link>
          <Link 
            to="/about" 
            className={cn(
              "text-xl font-medium transition-colors",
              isActive('/about') ? "text-purple-500" : "hover:text-purple-500"
            )}
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </Link>
          
          {isLoggedIn && (
            <Link
              to="/dashboard"
              className="text-xl font-medium hover:text-purple-500 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
          )}
          
          <div className="h-px bg-border my-4"></div>
          
          {!isLoggedIn ? (
            <Button 
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600" 
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
              className="w-full border-purple-300 text-purple-500" 
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
              className="border-purple-300 text-purple-500 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20"
            >
              <User size={20} />
            </Button>
          </div>
        </nav>
      </div>

      <AuthCard 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
       
      />
    </header>
  );
};

export default Navbar;