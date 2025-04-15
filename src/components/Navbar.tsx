import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Search, Menu, X, User, Bell, LayoutDashboard } from "lucide-react";
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import AuthCard from './AuthCard';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const location = useLocation();
  
  // Function to determine if a link is active
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-pulse-purple rounded-full animate-pulse-slow"></div>
            <div className="absolute inset-1 bg-white dark:bg-background rounded-full flex items-center justify-center">
              <span className="text-pulse-purple font-bold text-sm">P</span>
            </div>
          </div>
          <span className="text-2xl font-bold text-gradient">Pulse</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            to="/events" 
            className={cn(
              "font-medium transition-colors",
              isActive('/events') ? "text-pulse-purple" : "hover:text-pulse-purple"
            )}
          >
            Events
          </Link>
          <Link 
            to="/venues" 
            className={cn(
              "font-medium transition-colors",
              isActive('/venues') ? "text-pulse-purple" : "hover:text-pulse-purple"
            )}
          >
            Venues
          </Link>
          <Link 
            to="/artists" 
            className={cn(
              "font-medium transition-colors",
              isActive('/artists') ? "text-pulse-purple" : "hover:text-pulse-purple"
            )}
          >
            Artists
          </Link>
          <Link 
            to="/about" 
            className={cn(
              "font-medium transition-colors",
              isActive('/about') ? "text-pulse-purple" : "hover:text-pulse-purple"
            )}
          >
            About
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <ThemeToggle />
          <Button variant="ghost" size="icon">
            <Search size={20} />
          </Button>
          <Button variant="ghost" size="icon">
            <Bell size={20} />
          </Button>
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <LayoutDashboard size={20} />
            </Button>
          </Link>
          <Button variant="ghost" size="icon">
            <User size={20} />
          </Button>
          <Button onClick={() => setIsAuthOpen(true)}>Sign In</Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center space-x-2 md:hidden">
          <ThemeToggle />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={cn(
        "fixed inset-0 z-40 bg-background backdrop-blur-lg transition-transform duration-300 transform md:hidden pt-20",
        isMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <nav className="container mx-auto px-4 py-6 flex flex-col space-y-6">
          <Link 
            to="/events" 
            className={cn(
              "text-2xl font-medium transition-colors",
              isActive('/events') ? "text-pulse-purple" : "hover:text-pulse-purple"
            )}
            onClick={() => setIsMenuOpen(false)}
          >
            Events
          </Link>
          <Link 
            to="/venues" 
            className={cn(
              "text-2xl font-medium transition-colors",
              isActive('/venues') ? "text-pulse-purple" : "hover:text-pulse-purple"
            )}
            onClick={() => setIsMenuOpen(false)}
          >
            Venues
          </Link>
          <Link 
            to="/artists" 
            className={cn(
              "text-2xl font-medium transition-colors",
              isActive('/artists') ? "text-pulse-purple" : "hover:text-pulse-purple"
            )}
            onClick={() => setIsMenuOpen(false)}
          >
            Artists
          </Link>
          <Link 
            to="/about" 
            className={cn(
              "text-2xl font-medium transition-colors",
              isActive('/about') ? "text-pulse-purple" : "hover:text-pulse-purple"
            )}
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </Link>
          <Link
            to="/dashboard"
            className="text-2xl font-medium hover:text-pulse-purple transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            Dashboard
          </Link>
          <div className="h-px bg-border my-4"></div>
          <Button className="w-full" size="lg">Sign In</Button>
          <div className="flex justify-between mt-4">
            <Button variant="outline" size="icon">
              <Search size={20} />
            </Button>
            <Button variant="outline" size="icon">
              <Bell size={20} />
            </Button>
            <Button variant="outline" size="icon">
              <User size={20} />
            </Button>
          </div>
        </nav>
      </div>

      <AuthCard isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </header>
  );
};

export default Navbar;
