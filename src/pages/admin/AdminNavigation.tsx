import React from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogOut, BarChart2, Calendar, Users, Shield, UserPlus, Activity, Search, X, Menu } from "lucide-react";

interface AdminNavigationProps {
  currentView: 'reports' | 'events' | 'nonAttendees' | 'registerAdmin' | 'registerSecurity' | 'viewAllUsers';
  onViewChange: (view: 'reports' | 'events' | 'nonAttendees' | 'registerAdmin' | 'registerSecurity' | 'viewAllUsers') => void;
  onLogout: () => void;
  isLoading: boolean;
  toggleMobileMenu: () => void;
  isMobileMenuOpen: boolean; // Added missing prop
}

const AdminNavigation: React.FC<AdminNavigationProps> = ({
  currentView,
  onViewChange,
  onLogout,
  isLoading,
  toggleMobileMenu,
  isMobileMenuOpen, // Added missing prop
}) => {
  const navigationItems = [
    { id: 'reports', label: 'System Reports', icon: BarChart2, description: 'View analytics & insights', category: 'Analytics', color: 'text-blue-500' },
    { id: 'events', label: 'Recent Events', icon: Calendar, description: 'Monitor event activity', category: 'Events', color: 'text-purple-500' },
    { id: 'viewAllUsers', label: 'All Users', icon: Users, description: 'Manage platform users', category: 'User Management', color: 'text-green-500' },
    { id: 'nonAttendees', label: 'Non-Attendees', icon: Users, description: 'Track absent users', category: 'User Management', color: 'text-orange-500' },
    { id: 'registerAdmin', label: 'Register Admin', icon: UserPlus, description: 'Create admin accounts', category: 'Administration', color: 'text-indigo-500' },
    { id: 'registerSecurity', label: 'Register Security', icon: Shield, description: 'Create security accounts', category: 'Administration', color: 'text-red-500' },
  ];

  const handleViewChange = (view: typeof currentView) => {
    onViewChange(view);
    toggleMobileMenu();
  };

  return (
    <>
      {/* Mobile Header */}
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

      {/* Sidebar Navigation */}
      <div className={cn(
        "fixed top-0 h-screen w-72 flex flex-col shadow-xl bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transition-all duration-300 ease-in-out",
        // Mobile menu visibility
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
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-all duration-200 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item, index) => {
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
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="space-y-2">
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

      {/* Mobile Overlay */}
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