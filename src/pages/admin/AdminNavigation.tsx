import React, { useState, useMemo } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogOut, BarChart2, Calendar, Users, Shield, UserPlus, Activity, Search, X, Menu, Tags, Handshake } from "lucide-react";

interface AdminNavigationProps {
  currentView: 'reports' | 'events' | 'nonAttendees' | 'registerAdmin' | 'registerSecurity' | 'viewAllUsers' | 'registerOrganizer' | 'manageCategories' | 'adminPartnership';
  onViewChange: (view: 'reports' | 'events' | 'nonAttendees' | 'registerAdmin' | 'registerSecurity' | 'viewAllUsers' | 'registerOrganizer' | 'manageCategories' | 'adminPartnership') => void;
  onLogout: () => void;
  isLoading: boolean;
  toggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
}

const AdminNavigation: React.FC<AdminNavigationProps> = ({
  currentView,
  onViewChange,
  onLogout,
  isLoading,
  toggleMobileMenu,
  isMobileMenuOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const navigationItems = [
    { id: 'reports', label: 'System Reports', icon: BarChart2, description: 'View analytics & insights', category: 'Analytics', color: 'text-blue-500' },
    { id: 'events', label: 'Recent Events', icon: Calendar, description: 'Monitor event activity', category: 'Events', color: 'text-purple-500' },
    { id: 'viewAllUsers', label: 'All Users', icon: Users, description: 'Manage platform users', category: 'User Management', color: 'text-green-500' },
    { id: 'nonAttendees', label: 'Non-Attendees', icon: Users, description: 'Track absent users', category: 'User Management', color: 'text-orange-500' },
    { id: 'adminPartnership', label: 'Partnership Hub', icon: Handshake, description: 'Manage partners & collaborations', category: 'Partnerships', color: 'text-teal-500' },
    { id: 'registerAdmin', label: 'Register Admin', icon: UserPlus, description: 'Create admin accounts', category: 'Administration', color: 'text-indigo-500' },
    { id: 'registerSecurity', label: 'Register Security', icon: Shield, description: 'Create security accounts', category: 'Administration', color: 'text-red-500' },
    { id: 'registerOrganizer', label: 'Register Organizer', icon: UserPlus, description: 'Create organizer accounts', category: 'Administration', color: 'text-yellow-500' },
    { id: 'manageCategories', label: 'Manage Categories', icon: Tags, description: 'Create & manage event categories', category: 'Events', color: 'text-pink-500' },
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
  }, [searchQuery]);

  const handleViewChange = (view: typeof currentView) => {
    onViewChange(view);
    toggleMobileMenu();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleManageCategories = () => {
    handleViewChange('manageCategories');
  };

  const handlePartnershipHub = () => {
    handleViewChange('adminPartnership');
  };

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-800 dark:text-gray-200">Pulse Admin</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Management Dashboard</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileMenu}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div className={cn(
        "fixed top-0 h-screen w-72 flex flex-col shadow-xl bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transition-all duration-300 ease-in-out",
        isMobileMenuOpen ? "left-0" : "-left-72 md:left-0"
      )}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 mt-16 md:mt-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="hidden md:block">
              <h2 className="font-bold text-xl text-gray-800 dark:text-gray-200">Pulse Admin</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Management Center</p>
            </div>
          </div>

          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search menu..."
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

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredNavigationItems.length > 0 ? (
            filteredNavigationItems.map((item, index) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id as typeof currentView)}
                  className={cn(
                    "group relative w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm rounded-xl",
                    "transition-all duration-300 ease-out transform hover:scale-[1.02]",
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg shadow-blue-500/25"
                      : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                  disabled={isLoading}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-all duration-300",
                    isActive ? "text-white" : item.color
                  )} />

                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.label}</div>
                    <div className={cn(
                      "text-xs truncate transition-colors duration-300",
                      isActive ? "text-white/80" : "text-gray-500 dark:text-gray-400"
                    )}>
                      {item.description}
                    </div>
                  </div>

                  {isActive && (
                    <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-l-full opacity-80"></div>
                  )}
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No menu items found</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Try searching for "reports", "users", "categories", "partnership", or "admin"
              </p>
              <button
                onClick={clearSearch}
                className="mt-3 text-xs text-blue-500 hover:text-blue-600 underline"
              >
                Clear search
              </button>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button
              onClick={handlePartnershipHub}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200
                hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 dark:hover:text-teal-400
                rounded-lg transition-all duration-200 group"
              disabled={isLoading}
            >
              <Handshake className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
              Partnership Hub
            </button>
            <button
              onClick={handleManageCategories}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200
                hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600 dark:hover:text-pink-400
                rounded-lg transition-all duration-200 group"
              disabled={isLoading}
            >
              <Tags className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
              Manage Categories
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200
                hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400
                rounded-lg transition-all duration-200 group"
              disabled={isLoading}
            >
              <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleMobileMenu}
        />
      )}
    </>
  );
};

export default AdminNavigation;