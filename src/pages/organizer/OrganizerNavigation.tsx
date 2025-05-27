import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  CalendarDays,
  BarChart2,
  FileText,
  Menu,
  X,
  ChevronRight,
  Settings,
  User,
  Sparkles,
  Activity,
  Search,
} from "lucide-react";

interface OrganizerNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isLoading: boolean;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  darkMode: boolean;
  organizerName: string;
}

const OrganizerNavigation: React.FC<OrganizerNavigationProps> = ({
  currentView,
  onViewChange,
  isLoading,
  isExpanded,
  setIsExpanded,
  isMobileOpen,
  setIsMobileOpen,
  darkMode,
  organizerName,
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const sidebarRef = useRef<HTMLDivElement>(null);

  const navigationItems = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
      color: "from-[--primary] to-[--secondary]",
      bgColor: "hover:bg-[--muted]",
      description: "Dashboard overview",
    },
    {
      id: "myEvents",
      label: "My Events",
      icon: CalendarDays,
      color: "from-[--secondary] to-[--accent]",
      bgColor: "hover:bg-[--muted]",
      description: "Manage your events",
    },
    {
      id: "overallStats",
      label: "Overall Stats",
      icon: BarChart2,
      color: "from-[--accent] to-[--muted]",
      bgColor: "hover:bg-[--muted]",
      description: "Analytics & insights",
    },
    {
      id: "reports",
      label: "Reports",
      icon: FileText,
      color: "from-[--destructive] to-[--foreground]",
      bgColor: "hover:bg-[--muted]",
      description: "Generate reports",
    },
  ];

  const filteredItems = navigationItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            "bg-[--card]/80 backdrop-blur-md shadow-lg border border-[--border]/60 transition-all duration-200",
            darkMode ? "text-[--muted]" : "text-[--foreground]"
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
          darkMode ? "bg-[--background]" : "bg-gradient-to-br from-[--card] via-[--muted] to-[--card]",
          "backdrop-blur-xl border-r border-[--border]/60 shadow-2xl flex flex-col z-40",
          "transition-all duration-500 ease-in-out",
          "md:relative md:translate-x-0 md:shadow-none md:z-auto",
          isExpanded ? "md:w-72" : "md:w-20",
          isMobileOpen ? "translate-x-0 w-72" : "-translate-x-full w-72",
          "md:w-auto"
        )}
      >
        <div className="p-6 border-b border-[--border]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[--primary] to-[--secondary] rounded-xl
                            flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-[--card-foreground]" />
            </div>
            {isExpanded && (
              <div className="animate-fade-in">
                <h2 className="font-bold text-xl bg-gradient-to-r from-[--foreground] to-[--muted]
                               bg-clip-text text-transparent">
                  Pulse
                </h2>
                <p className="text-xs text-[--muted] font-medium">Event Organizer</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-b border-[--border]">
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

        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="space-y-1">
            {filteredItems.map((item, index) => {
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
                        ? `bg-gradient-to-r ${item.color} text-[--card-foreground] shadow-lg shadow-[--primary]/25`
                        : `${item.bgColor} ${darkMode ? "text-[--muted] hover:text-[--foreground]" : "text-[--foreground] hover:text-[--foreground]"} hover:shadow-md`
                    )}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    {isActive && (
                      <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-8
                                        bg-[--card-foreground] rounded-r-full shadow-sm" />
                    )}

                    <div className={cn(
                      "relative p-2 rounded-lg transition-all duration-300",
                      isActive
                        ? "bg-[--card-foreground]/20"
                        : isHovered
                          ? "bg-[--card-foreground] shadow-sm"
                          : "bg-transparent"
                    )}>
                      <item.icon className={cn(
                        "h-5 w-5 transition-all duration-300",
                        isActive ? "text-[--card-foreground]" : darkMode ? "text-[--muted]" : "text-[--foreground]",
                        isExpanded ? "" : "mx-auto"
                      )} />
                    </div>

                    {isExpanded && (
                      <div className="flex-1 ml-3 text-left">
                        <div className="font-semibold">{item.label}</div>
                        <div className={cn(
                          "text-xs transition-colors duration-300",
                          isActive ? "text-[--card-foreground]/80" : darkMode ? "text-[--muted]" : "text-[--muted]"
                        )}>
                          {item.description}
                        </div>
                      </div>
                    )}

                    {isExpanded && (
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-all duration-300",
                        isActive
                          ? "text-[--card-foreground] opacity-100 transform rotate-90"
                          : darkMode ? "text-[--muted] opacity-0 group-hover:opacity-50" : "text-[--muted] opacity-0 group-hover:opacity-50"
                      )} />
                    )}

                    {!isExpanded && (
                      <div className={cn(
                        "absolute left-full ml-3 px-3 py-2 bg-[--foreground] text-[--card-foreground] text-sm rounded-lg",
                        "opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none",
                        "whitespace-nowrap z-50 shadow-xl"
                      )}>
                        {item.label}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1
                                         border-4 border-transparent border-r-[--foreground]"></div>
                      </div>
                    )}

                    <div className={cn(
                      "absolute inset-0 rounded-xl transition-all duration-300",
                      isHovered && !isActive ? "bg-gradient-to-r from-transparent via-[--card-foreground]/10 to-transparent" : ""
                    )} />
                  </button>
                </div>
              );
            })}
          </div>

          {isExpanded && (
            <div className={cn(
              "mt-8 p-4 rounded-xl border",
              darkMode ? "bg-[--muted] border-[--border]" : "bg-gradient-to-br from-[--muted] to-[--accent] border-[--border]"
            )}>
              <div className="flex items-center gap-2 mb-3">
                <Activity className={cn("w-4 h-4", darkMode ? "text-[--primary]" : "text-[--primary]")} />
                <span className={cn("text-sm font-semibold", darkMode ? "text-[--foreground]" : "text-[--foreground]")}>Quick Stats</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className={darkMode ? "text-[--muted]" : "text-[--muted]"} >Active Events</span>
                  <span className={cn("font-bold", darkMode ? "text-[--primary]" : "text-[--primary]")}>12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={darkMode ? "text-[--muted]" : "text-[--muted]"} >Total Tickets</span>
                  <span className={cn("font-bold", darkMode ? "text-[--secondary]" : "text-[--secondary]")}>1,247</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={darkMode ? "text-[--muted]" : "text-[--muted]"} >Reports</span>
                  <span className={cn("font-bold", darkMode ? "text-[--destructive]" : "text-[--destructive]")}>7</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[--border] space-y-2">
          {isExpanded && (
            <div className="flex items-center gap-3 p-3 rounded-xl mb-3 bg-[--muted]">
              <div className="w-8 h-8 bg-gradient-to-br from-[--foreground] to-[--muted] rounded-full
                               flex items-center justify-center">
                <User className="w-4 h-4 text-[--card-foreground]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[--foreground] truncate">{organizerName}</div>
                <div className="text-xs text-[--muted]">Event Organizer</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-[--muted]"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-[--card]/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="w-8 h-8 border-4 border-[--muted] border-t-[--primary] rounded-full animate-spin" />
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
