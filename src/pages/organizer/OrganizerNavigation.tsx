import React, { useState, useEffect, useRef } from "react";
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
  Bell,
  LogOut,
} from "lucide-react";

interface OrganizerNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
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
  isExpanded,
  setIsExpanded,
  isMobileOpen,
  setIsMobileOpen,
  darkMode,
  organizerName,
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const navigationItems = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
      color: "from-violet-500 to-purple-600",
      bgColor: "hover:bg-violet-50 dark:hover:bg-violet-950/30",
      description: "Dashboard overview",
      badge: null,
    },
    {
      id: "myEvents",
      label: "My Events",
      icon: CalendarDays,
      color: "from-blue-500 to-cyan-600",
      bgColor: "hover:bg-blue-50 dark:hover:bg-blue-950/30",
      description: "Manage your events",
      badge: null,
    },
    {
      id: "overallStats",
      label: "Overall Stats",
      icon: BarChart2,
      color: "from-emerald-500 to-teal-600",
      bgColor: "hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
      description: "Analytics & insights",
      badge: null,
    },
    {
      id: "reports",
      label: "Reports",
      icon: FileText,
      color: "from-orange-500 to-red-600",
      bgColor: "hover:bg-orange-50 dark:hover:bg-orange-950/30",
      description: "Generate reports",
      badge: null,
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

      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node) &&
        showUserMenu
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileOpen, setIsMobileOpen, showUserMenu]);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-6 left-6 z-50 md:hidden">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg border rounded-xl p-3 transition-all duration-200 hover:scale-105 hover:shadow-xl
                      ${darkMode ? "border-gray-700/60" : "border-gray-200/60"}`}
        >
          {isMobileOpen ? <X size={20} className={darkMode ? "text-gray-300" : "text-gray-700"} /> : <Menu size={20} className={darkMode ? "text-gray-300" : "text-gray-700"} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-screen z-40 md:relative md:translate-x-0 md:shadow-none md:z-auto
                    ${darkMode ? "bg-gray-900/95 border-gray-800/60" : "bg-white/95 border-gray-200/60"}
                    backdrop-blur-xl border-r shadow-2xl flex flex-col
                    transition-all duration-500 ease-in-out
                    ${isExpanded ? "md:w-80" : "md:w-20"}
                    ${isMobileOpen ? "translate-x-0 w-80" : "-translate-x-full w-80"}
                    md:w-auto`}
      >
        {/* Header */}
        <div className={`p-6 border-b ${darkMode ? "border-gray-800/60" : "border-gray-200/60"}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl
                              flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            {(isExpanded || isMobileOpen) && (
              <div className="animate-fade-in">
                <h2 className="font-bold text-2xl bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400
                               bg-clip-text text-transparent">
                  Pulse
                </h2>
                <p className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Event Organizer</p>
              </div>
            )}
            {(isExpanded || isMobileOpen) && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`ml-auto p-2 rounded-lg transition-colors duration-200 hidden md:block ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
              >
                <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} ${darkMode ? "text-gray-300" : "text-gray-500"}`} />
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        {(isExpanded || isMobileOpen) && (
          <div className={`p-4 border-b ${darkMode ? "border-gray-800/60" : "border-gray-200/60"}`}>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50
                          focus:border-violet-500/50 transition-all duration-200 ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}
              />
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
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
                    className={`relative group flex items-center w-full p-4 rounded-2xl text-sm font-medium
                                transition-all duration-300 ease-out transform hover:scale-[1.02]
                                ${isActive
                                  ? `bg-gradient-to-r ${item.color} text-white shadow-lg shadow-violet-500/25`
                                  : `${item.bgColor} ${darkMode ? "text-gray-300" : "text-gray-700"} hover:shadow-md`
                                }`}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1.5 h-10
                                        bg-white rounded-r-full shadow-sm" />
                    )}

                    {/* Icon Container */}
                    <div className={`relative p-3 rounded-xl transition-all duration-300
                                     ${isActive
                                       ? "bg-white/20"
                                       : isHovered
                                         ? "bg-violet-100 dark:bg-violet-900/30"
                                         : "bg-transparent"
                                     }`}>
                      <item.icon className={`h-5 w-5 transition-all duration-300
                                             ${isActive ? "text-white" : darkMode ? "text-gray-400" : "text-gray-600"}
                                             ${isExpanded || isMobileOpen ? "" : "mx-auto"}`} />
                    </div>

                    {/* Label and Description */}
                    {(isExpanded || isMobileOpen) && (
                      <div className="flex-1 ml-4 text-left">
                        <div className="font-semibold text-base">{item.label}</div>
                        <div className={`text-xs transition-colors duration-300
                                        ${isActive ? "text-white/80" : darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {item.description}
                        </div>
                      </div>
                    )}

                    {/* Arrow Icon */}
                    {(isExpanded || isMobileOpen) && (
                      <ChevronRight className={`h-4 w-4 transition-all duration-300
                                                ${isActive
                                                  ? "text-white opacity-100 transform rotate-90"
                                                  : darkMode ? "text-gray-400 opacity-0 group-hover:opacity-50" : "text-gray-400 opacity-0 group-hover:opacity-50"
                                                }`} />
                    )}

                    {/* Tooltip for collapsed state */}
                    {!isExpanded && !isMobileOpen && (
                      <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg
                                      opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none
                                      whitespace-nowrap z-50 shadow-xl">
                        {item.label}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1
                                         border-4 border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
                      </div>
                    )}

                    {/* Hover Effect */}
                    <div className={`absolute inset-0 rounded-2xl transition-all duration-300
                                     ${isHovered && !isActive ? "bg-gradient-to-r from-transparent via-violet-500/10 to-transparent" : ""}`} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Quick Stats Widget */}
          {(isExpanded || isMobileOpen) && (
            <div className={`mt-8 p-5 rounded-2xl border ${darkMode ? "bg-gradient-to-br from-violet-950/30 to-purple-950/30 border-violet-800/60" : "bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200/60"}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-violet-500 rounded-lg">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <span className={`text-sm font-bold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Quick Stats</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Active Events</span>
                  <span className={darkMode ? "font-bold text-violet-400" : "font-bold text-violet-600"}>12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Total Tickets</span>
                  <span className={darkMode ? "font-bold text-blue-400" : "font-bold text-blue-600"}>1,247</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Reports</span>
                  <span className={darkMode ? "font-bold text-orange-400" : "font-bold text-orange-600"}>7</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Section */}
        <div className={`p-4 border-t ${darkMode ? "border-gray-800/60" : "border-gray-200/60"}`}>
          {(isExpanded || isMobileOpen) && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center gap-3 p-4 rounded-2xl w-full transition-all duration-200 group ${darkMode ? "bg-gray-800/50 hover:bg-gray-800" : "bg-gray-50 hover:bg-gray-100"}`}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full
                               flex items-center justify-center shadow-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className={`text-sm font-semibold truncate ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{organizerName}</div>
                  <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Event Organizer</div>
                </div>
                <div className="flex items-center gap-2">
                  <Bell className={`w-4 h-4 ${darkMode ? "text-gray-400 group-hover:text-gray-300" : "text-gray-400 group-hover:text-gray-600"}`} />
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${showUserMenu ? 'rotate-90' : ''} ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
                </div>
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className={`absolute bottom-full left-0 right-0 mb-2 rounded-2xl shadow-xl border py-2 animate-scale-in ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <button className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors duration-200 ${darkMode ? "text-gray-300 hover:bg-gray-700/50" : "text-gray-700 hover:bg-gray-50"}`}>
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors duration-200 ${darkMode ? "text-red-400 hover:bg-red-950/20" : "text-red-600 hover:bg-red-50"}`}>
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Collapsed State Profile */}
          {!isExpanded && !isMobileOpen && (
            <div className="flex justify-center">
              <button className={`p-3 rounded-xl transition-all duration-200 group relative ${darkMode ? "bg-gray-800/50 hover:bg-gray-800" : "bg-gray-50 hover:bg-gray-100"}`}>
                <User className={`w-5 h-5 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
                <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg
                              opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none
                              whitespace-nowrap z-50 shadow-xl">
                  {organizerName}
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1
                                   border-4 border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
                </div>
              </button>
            </div>
          )}
        </div>
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

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out forwards;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${darkMode ? "rgb(100 116 139)" : "rgb(203 213 225)"};
          border-radius: 2px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? "rgb(148 163 184)" : "rgb(148 163 184)"};
        }
      `}</style>
    </>
  );
};

export default OrganizerNavigation;
