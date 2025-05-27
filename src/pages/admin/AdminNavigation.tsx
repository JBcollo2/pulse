import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, BarChart2, Calendar, Users, Shield, UserPlus, Activity, Menu, X } from "lucide-react";

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

  // Define navigation items with IDs matching AdminDashboard's currentView states
  const navigationItems = [
    { id: 'reports', label: 'System Reports', icon: BarChart2, description: 'View system reports' },
    { id: 'events', label: 'Recent Events', icon: Calendar, description: 'Monitor recent event activity' },
    { id: 'viewAllUsers', label: 'View All Users', icon: Users, description: 'Manage all platform users' },
    { id: 'nonAttendees', label: 'Non-Attendees', icon: Users, description: 'Identify non-attending users' },
    { id: 'registerAdmin', label: 'Register Admin', icon: UserPlus, description: 'Create new admin accounts' },
    { id: 'registerSecurity', label: 'Register Security', icon: Shield, description: 'Create new security accounts' },
  ];

  const handleViewChange = (view: typeof currentView) => {
    onViewChange(view);
    setIsMobileMenuOpen(false); // Close mobile menu on selection
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile Header - Visible only on small screens */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-[--border] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[--primary] to-[--secondary] rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-[--card-foreground]" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Admins</h2>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileMenu}
            className="p-2"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Overlay - Appears when menu is open on mobile */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Positioned fixed and responsive */}
      <Card className={cn(
        "fixed top-0 h-screen w-70 p-0 flex flex-col shadow-lg bg-background text-[--card-foreground] z-50 transition-transform duration-300 ease-in-out",
        // Desktop positioning: always visible, slightly off-left
        "md:left-[-10px] md:translate-x-0 md:block",
        // Mobile positioning and animation: slides in from left
        "left-0",
        isMobileMenuOpen
          ? "translate-x-0"
          : "-translate-x-full"
      )}>
        {/* Header/Logo section for the sidebar */}
        <div className="p-4 border-b border-[--border] mt-16 md:mt-0"> {/* mt-16 for mobile to clear fixed header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[--primary] to-[--secondary] rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-5 h-5 text-[--card-foreground]" />
            </div>
            <div className="hidden md:block"> {/* Hidden on mobile, visible on desktop */}
              <h2 className="font-bold text-xl">Admins</h2>
              <p className="text-xs text-[--muted]">Manage platform activities</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleViewChange(item.id as typeof currentView)} // Type assertion for safety
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors w-full",
                  isActive
                    ? "bg-gradient-to-r from-[--primary] to-[--secondary] text-[--card-foreground] shadow-lg"
                    : "hover:bg-[--muted] text-[--foreground]"
                )}
                disabled={isLoading}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1 text-left min-w-0">
                  <div className="font-semibold truncate">{item.label}</div>
                  <div className="text-xs text-[--muted] truncate hidden sm:block">{item.description}</div>
                </div>
              </button>
            );
          })}

          {/* Quick Stats Card - Example/Placeholder */}
          <div className="mt-8 p-4 rounded-xl border bg-[--muted] border-[--border]">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-[--primary] flex-shrink-0" />
              <span className="text-sm font-semibold text-[--foreground]">Quick Stats</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[--muted-foreground]">Active Users</span>
                <span className="font-bold text-[--primary]">120</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[--muted-foreground]">Total Events</span>
                <span className="font-bold text-[--secondary]">45</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[--muted-foreground]">Reports</span>
                <span className="font-bold text-[--destructive]">7</span>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-[--border]">
          <Button
            onClick={onLogout}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[--destructive] to-[--destructive] text-[--card-foreground] shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            <LogOut className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="truncate">{isLoading ? "Logging out..." : "Logout"}</span>
          </Button>
        </div>
      </Card>
    </>
  );
};

export default AdminNavigation;