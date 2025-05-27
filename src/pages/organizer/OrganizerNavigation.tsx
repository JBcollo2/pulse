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
  ChevronRight,
  Settings,
  Bell,
  User,
  Sparkles,
  Activity,
} from "lucide-react";

interface OrganizerNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  isLoading: boolean;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  darkMode: boolean;
}

const OrganizerNavigation: React.FC<OrganizerNavigationProps> = ({
  currentView,
  onViewChange,
  onLogout,
  isLoading,
  isExpanded,
  setIsExpanded,
  isMobileOpen,
  setIsMobileOpen,
  darkMode,
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const navigationItems = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
      color: "from-blue-500 to-cyan-500",
      bgColor: "hover:bg-blue-50",
      description: "Dashboard overview"
    },
    {
      id: "myEvents",
      label: "My Events",
      icon: CalendarDays,
      color: "from-green-500 to-emerald-500",
      bgColor: "hover:bg-green-50",
      description: "Manage your events"
    },
    {
      id: "overallStats",
      label: "Overall Stats",
      icon: BarChart2,
      color: "from-purple-500 to-violet-500",
      bgColor: "hover:bg-purple-50",
      description: "Analytics & insights"
    },
    {
      id: "reports",
      label: "Reports",
      icon: FileText,
      color: "from-orange-500 to-red-500",
      bgColor: "hover:bg-orange-50",
      description: "Generate reports"
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        isMobileOpen
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
  }, [isMobileOpen, setIsMobileOpen]);

  return (
    <>
      <div className="fixed top-6 left-6 z-50 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className={cn(
            "bg-white/80 backdrop-blur-md shadow-lg border border-gray-200/60 transition-all duration-200",
            darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-white"
          )}
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div
        ref={sidebarRef}
        className={cn(
          "fixed top-0 left-0 h-screen",
          darkMode ? "bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800" : "bg-gradient-to-br from-white via-gray-50 to-white",
          "backdrop-blur-xl border-r border-gray-200/60 shadow-2xl flex flex-col z-40",
          "transition-all duration-500 ease-in-out",
          "md:relative md:translate-x-0 md:shadow-none md:z-auto",
          isExpanded ? "md:w-72" : "md:w-20",
          isMobileOpen ? "translate-x-0 w-72" : "-translate-x-full w-72",
          "md:w-auto"
        )}
      >
        <div className="p-6 border-b border-gray-100/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl
                            flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {isExpanded && (
              <div className="animate-fade-in">
                <h2 className="font-bold text-xl bg-gradient-to-r from-gray-800 to-gray-600
                               bg-clip-text text-transparent">
                  Pulse
                </h2>
                <p className="text-xs text-gray-500 font-medium">Event Organizer</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="space-y-1">
            {navigationItems.map((item, index) => {
              const isActive = currentView === item.id;
              const isHovered = hoveredItem === item.id;

              return (
                <div
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <button
                    onClick={() => {
                      onViewChange(item.id);
                      setIsMobileOpen(false);
                    }}
                    className={cn(
                      "relative group flex items-center w-full p-3 rounded-xl text-sm font-medium",
                      "transition-all duration-300 ease-out transform hover:scale-[1.02]",
                      isActive
                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg shadow-${item.color.split('-')[1]}-500/25`
                        : `${item.bgColor} ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"} hover:shadow-md`
                    )}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    {isActive && (
                      <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-8
                                        bg-white rounded-r-full shadow-sm" />
                    )}

                    <div className={cn(
                      "relative p-2 rounded-lg transition-all duration-300",
                      isActive
                        ? "bg-white/20"
                        : isHovered
                          ? "bg-white shadow-sm"
                          : "bg-transparent"
                    )}>
                      <item.icon className={cn(
                        "h-5 w-5 transition-all duration-300",
                        isActive ? "text-white" : darkMode ? "text-gray-300" : "text-gray-600",
                        isExpanded ? "" : "mx-auto"
                      )} />
                    </div>

                    {isExpanded && (
                      <div className="flex-1 ml-3 text-left">
                        <div className="font-semibold">{item.label}</div>
                        <div className={cn(
                          "text-xs transition-colors duration-300",
                          isActive ? "text-white/80" : darkMode ? "text-gray-400" : "text-gray-500"
                        )}>
                          {item.description}
                        </div>
                      </div>
                    )}

                    {isExpanded && (
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-all duration-300",
                        isActive
                          ? "text-white opacity-100 transform rotate-90"
                          : darkMode ? "text-gray-400 opacity-0 group-hover:opacity-50" : "text-gray-400 opacity-0 group-hover:opacity-50"
                      )} />
                    )}

                    {!isExpanded && (
                      <div className={cn(
                        "absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg",
                        "opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none",
                        "whitespace-nowrap z-50 shadow-xl"
                      )}>
                        {item.label}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1
                                         border-4 border-transparent border-r-gray-900" />
                      </div>
                    )}

                    <div className={cn(
                      "absolute inset-0 rounded-xl transition-all duration-300",
                      isHovered && !isActive ? "bg-gradient-to-r from-transparent via-white/10 to-transparent" : ""
                    )} />
                  </button>
                </div>
              );
            })}
          </div>

          {isExpanded && (
            <div className={cn(
              "mt-8 p-4 rounded-xl border",
              darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100"
            )}>
              <div className="flex items-center gap-2 mb-3">
                <Activity className={cn("w-4 h-4", darkMode ? "text-indigo-400" : "text-indigo-600")} />
                <span className={cn("text-sm font-semibold", darkMode ? "text-white" : "text-indigo-900")}>Quick Stats</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className={cn(darkMode ? "text-gray-300" : "text-gray-600")}>Active Events</span>
                  <span className={cn("font-bold", darkMode ? "text-indigo-400" : "text-indigo-600")}>12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={cn(darkMode ? "text-gray-300" : "text-gray-600")}>Total Tickets</span>
                  <span className={cn("font-bold", darkMode ? "text-green-400" : "text-green-600")}>1,247</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={cn(darkMode ? "text-gray-300" : "text-gray-600")}>Revenue</span>
                  <span className={cn("font-bold", darkMode ? "text-purple-400" : "text-purple-600")}>$24.5k</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100/80 space-y-2">
          {isExpanded && (
            <div className="flex items-center gap-3 p-3 rounded-xl mb-3 bg-gray-50">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full
                               flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">John Doe</div>
                <div className="text-xs text-gray-500">Event Organizer</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-gray-200"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 p-3 transition-all duration-200 hover:shadow-sm",
              darkMode ? "hover:bg-yellow-900 text-gray-300 hover:text-yellow-400" : "hover:bg-yellow-50 text-gray-700 hover:text-yellow-700",
              !isExpanded && "justify-center"
            )}
          >
            <div className="relative">
              <Bell className={cn("h-5 w-5", darkMode ? "text-gray-300" : "text-gray-700")} />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </div>
            {isExpanded && <span className="font-medium">Notifications</span>}
          </Button>

          <Button
            onClick={() => {
              onLogout();
              setIsMobileOpen(false);
            }}
            disabled={isLoading}
            className={cn(
              "w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
              "text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
              !isExpanded && "aspect-square p-0"
            )}
          >
            <LogOut className={cn("h-5 w-5", isExpanded && "mr-2")} />
            {isExpanded && (
              <span className="font-medium">
                {isLoading ? "Logging out..." : "Logout"}
              </span>
            )}
          </Button>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }

        .overflow-y-auto::-webkit-scrollbar {
          width: 4px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: ${darkMode ? "rgb(100 116 139)" : "rgb(203 213 225)"};
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? "rgb(148 163 184)" : "rgb(148 163 184)"};
        }
      `}</style>
    </>
  );
};

export default OrganizerNavigation;
