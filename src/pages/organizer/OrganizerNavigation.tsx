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
  Sun,
  Moon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [isDark, setIsDark] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const navigationItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "myEvents", label: "My Events", icon: CalendarDays },
    { id: "overallStats", label: "Overall Stats", icon: BarChart2 },
    { id: "reports", label: "Reports", icon: FileText },
  ];

  const toggleSidebar = () => setIsExpanded((prev) => !prev);
  const toggleMobileMenu = () => setIsMobileOpen((prev) => !prev);
  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(!isDark);
  };

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
      {/* Desktop Toggle Button */}
      <div className="fixed top-4 left-4 z-50 hidden sm:block">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="bg-muted text-foreground hover:bg-accent"
        >
          {isExpanded ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Mobile Toggle Button */}
      <div className="fixed top-4 left-4 z-50 sm:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileMenu}
          className="bg-muted text-foreground hover:bg-accent"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(isMobileOpen || true) && (
          <motion.aside
            ref={sidebarRef}
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            className={cn(
              "fixed top-0 left-0 h-screen bg-background text-foreground shadow-lg flex flex-col justify-between z-40 transition-all duration-300",
              isExpanded ? "w-48" : "w-16",
              isMobileOpen ? "sm:hidden" : "hidden sm:flex"
            )}
          >
            {/* Navigation */}
            <div className="flex flex-col items-center mt-10 space-y-2 w-full px-2">
              {navigationItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id);
                      setIsMobileOpen(false);
                    }}
                    className={cn(
                      "relative group flex items-center w-full px-3 py-3 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-gradient-to-r from-orange-500 to-purple-500 text-white shadow"
                        : "hover:bg-muted text-muted-foreground"
                    )}
                    style={{ marginTop: '10px' }}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-purple-500 rounded-r-md" />
                    )}
                    <item.icon className="h-5 w-5 shrink-0" />
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

            {/* Bottom Controls */}
            <div className="w-full px-2 pb-6 border-t border-border space-y-2">
              {/* Theme Toggle */}
              <Button
                onClick={toggleTheme}
                variant="outline"
                className="w-full flex justify-start items-center text-sm"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span
                  className={cn(
                    "ml-3 transition-opacity duration-300",
                    isExpanded ? "opacity-100" : "opacity-0"
                  )}
                >
                  {isDark ? "Light Mode" : "Dark Mode"}
                </span>
              </Button>

              {/* Logout */}
              <Button
                onClick={() => {
                  onLogout();
                  setIsMobileOpen(false);
                }}
                className="w-full bg-red-500 hover:bg-red-600 text-white text-sm py-2 flex items-center justify-start"
                disabled={isLoading}
              >
                <LogOut className="h-5 w-5 shrink-0" />
                <span
                  className={cn(
                    "ml-3 transition-opacity duration-300",
                    isExpanded ? "opacity-100" : "opacity-0"
                  )}
                >
                  Logout
                </span>
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default OrganizerNavigation;
