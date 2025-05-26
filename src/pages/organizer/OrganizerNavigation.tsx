import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  LayoutDashboard,
  CalendarDays,
  BarChart2,
  FileText,
  Menu,
  X,
} from "lucide-react";

interface OrganizerNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  isLoading: boolean;
}

const OrganizerNavigation: React.FC<OrganizerNavigationProps> = ({
  currentView,
  onViewChange,
  onLogout,
  isLoading,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const navigationItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "myEvents", label: "My Events", icon: CalendarDays },
    { id: "overallStats", label: "Overall Stats", icon: BarChart2 },
    { id: "reports", label: "Reports", icon: FileText },
  ];

  const toggleSidebar = () => {
    setIsExpanded((prev) => !prev);
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen((prev) => !prev);
  };

  // Close mobile drawer when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsMobileOpen(false);
      }
    };

    if (isMobileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileOpen]);

  return (
    <>
      {/* Toggle Button (Desktop) */}
      <div className="fixed top-4 left-4 z-50 hidden sm:block">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="bg-[#1e1b2e] text-white hover:bg-[#2a263d]"
        >
          {isExpanded ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Toggle Button (Mobile) */}
      <div className="fixed top-4 left-4 z-50 sm:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileMenu}
          className="bg-[#1e1b2e] text-white hover:bg-[#2a263d]"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed top-0 left-0 h-screen bg-[#1e1b2e] text-white shadow-lg flex flex-col justify-between transition-all duration-300 z-40",
          isExpanded ? "w-48" : "w-16",
          isMobileOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        )}
      >
        {/* Navigation Items */}
        <div className="flex flex-col items-center mt-6 space-y-2 w-full px-2">
          {navigationItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  setIsMobileOpen(false); // auto close on mobile
                }}
                className={cn(
                  "relative group flex items-center w-full px-3 py-3 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-r from-orange-500 to-purple-500 text-white shadow"
                    : "hover:bg-[#2a263d] text-gray-400"
                )}
              >
                {/* Active Indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-purple-500 rounded-r-md" />
                )}

                {/* Icon */}
                <item.icon className="h-5 w-5 shrink-0" />

                {/* Label */}
                <span
                  className={cn(
                    "ml-3 whitespace-nowrap transition-opacity duration-300",
                    isExpanded ? "opacity-100" : "opacity-0"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <div className="w-full px-2 pb-6 border-t border-[#2c2a40]">
          <Button
            onClick={() => {
              onLogout();
              setIsMobileOpen(false);
            }}
            className="w-full bg-red-500 hover:bg-red-600 text-white text-sm py-2 mt-4 flex items-center justify-start"
            disabled={isLoading}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span
              className={cn(
                "ml-3 whitespace-nowrap transition-opacity duration-300",
                isExpanded ? "opacity-100" : "opacity-0"
              )}
            >
              Logout
            </span>
          </Button>
        </div>
      </aside>
    </>
  );
};

export default OrganizerNavigation;
