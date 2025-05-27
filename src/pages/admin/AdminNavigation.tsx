import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, BarChart2, Calendar, Users, Shield, UserPlus, Activity, Menu, X, Search, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

interface AdminNavigationProps {
  currentView: 'reports' | 'events' | 'nonAttendees' | 'registerAdmin' | 'registerSecurity' | 'viewAllUsers';
  onViewChange: (view: 'reports' | 'events' | 'nonAttendees' | 'registerAdmin' | 'registerSecurity' | 'viewAllUsers') => void;
  onLogout: () => void;
  isLoading: boolean;
}

const AdminNavigation: React.FC<AdminNavigationProps> = ({
  currentView,
  onViewChange,
  onLogout,
  isLoading,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Enhanced navigation items with better categorization
  const navigationItems = [
    { 
      id: 'reports', 
      label: 'System Reports', 
      icon: BarChart2, 
      description: 'View analytics & insights',
      category: 'Analytics',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      id: 'events', 
      label: 'Recent Events', 
      icon: Calendar, 
      description: 'Monitor event activity',
      category: 'Events',
      color: 'from-purple-500 to-purple-600'
    },
    { 
      id: 'viewAllUsers', 
      label: 'All Users', 
      icon: Users, 
      description: 'Manage platform users',
      category: 'User Management',
      color: 'from-green-500 to-green-600'
    },
    { 
      id: 'nonAttendees', 
      label: 'Non-Attendees', 
      icon: Users, 
      description: 'Track absent users',
      category: 'User Management',
      color: 'from-orange-500 to-orange-600'
    },
    { 
      id: 'registerAdmin', 
      label: 'Register Admin', 
      icon: UserPlus, 
      description: 'Create admin accounts',
      category: 'Administration',
      color: 'from-indigo-500 to-indigo-600'
    },
    { 
      id: 'registerSecurity', 
      label: 'Register Security', 
      icon: Shield, 
      description: 'Create security accounts',
      category: 'Administration',
      color: 'from-red-500 to-red-600'
    },
  ];

  const handleViewChange = (view: typeof currentView) => {
    onViewChange(view);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Filter navigation items based on search
  const filteredItems = navigationItems.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">Pulse Admin</h2>
              <p className="text-xs text-muted-foreground">Management Dashboard</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileMenu}
            className="p-2 hover:bg-muted/80 transition-colors"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Enhanced Sidebar */}
      <Card className={cn(
        "fixed top-0 h-screen w-80 p-0 flex flex-col shadow-2xl bg-background/95 backdrop-blur-md border-r border-border/50 z-50 transition-all duration-300 ease-in-out",
        "md:left-[-10px] md:translate-x-0 md:block",
        "left-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        
        {/* Enhanced Header */}
        <div className="p-6 border-b border-border/50 mt-16 md:mt-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-purple-500/20">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            </div>
            <div className="hidden md:block">
              <h2 className="font-bold text-xl text-foreground">Pulse Admin</h2>
              <p className="text-sm text-muted-foreground">Management Center</p>
            </div>
          </div>
        </div>

        {/* Enhanced Search Bar */}
        <div className="p-4 border-b border-border/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-border/30 rounded-xl text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
            />
          </div>
        </div>

        {/* Enhanced Navigation Items */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {filteredItems.map((item, index) => {
            const isActive = currentView === item.id;

            return (
              <div
                key={item.id}
                className="group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <button
                  onClick={() => handleViewChange(item.id as typeof currentView)}
                  className={cn(
                    "relative flex items-center gap-4 p-4 rounded-2xl text-sm font-medium transition-all duration-300 w-full overflow-hidden group-hover:scale-[1.02] transform",
                    isActive
                      ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25 ring-1 ring-purple-500/50"
                      : "hover:bg-muted/80 text-foreground hover:shadow-md hover:shadow-black/5 border border-transparent hover:border-border/50"
                  )}
                  disabled={isLoading}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
                  )}
                  
                  {/* Icon with enhanced styling */}
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
                    isActive 
                      ? "bg-white/20 text-white" 
                      : "bg-gradient-to-br " + item.color + " text-white group-hover:scale-110"
                  )}>
                    <item.icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div className="font-semibold truncate">{item.label}</div>
                    <div className={cn(
                      "text-xs truncate mt-0.5 transition-colors",
                      isActive ? "text-white/80" : "text-muted-foreground"
                    )}>
                      {item.description}
                    </div>
                  </div>

                  {/* Hover arrow indicator */}
                  <div className={cn(
                    "opacity-0 transform translate-x-2 transition-all duration-200",
                    !isActive && "group-hover:opacity-100 group-hover:translate-x-0"
                  )}>
                    <div className="w-2 h-2 bg-current rounded-full" />
                  </div>
                </button>
              </div>
            );
          })}

          {/* Enhanced Quick Stats Card */}
          <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/30 backdrop-blur-sm shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">Quick Stats</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Active Users</span>
                </div>
                <span className="font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-md text-xs">120</span>
              </div>
              
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Events</span>
                </div>
                <span className="font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-md text-xs">45</span>
              </div>
              
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Reports</span>
                </div>
                <span className="font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-md text-xs">7</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Logout Button */}
        <div className="p-4 border-t border-border/30 bg-gradient-to-r from-background to-muted/20">
          <Button
            onClick={onLogout}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-xl py-3"
          >
            <LogOut className="h-5 w-5 mr-2" />
            <span>{isLoading ? "Signing out..." : "Sign Out"}</span>
          </Button>
        </div>
      </Card>
    </>
  );
};

export default AdminNavigation;