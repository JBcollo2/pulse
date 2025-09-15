// frontend/pulse/src/components/OrganizerNavigation.tsx

import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  BarChart2,
  FileText,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Settings,
  User,
  Ticket,
  Search,
  Users,
  Bell,
  LogOut,
  ChevronLeft,
  Handshake,
} from "lucide-react";

type ViewType = string;

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
  badge: string | null;
  subItems?: NavigationItem[];
}

interface OrganizerNavigationProps {
  currentView: ViewType;
  onViewChange: (view: string) => void;
  onLogout: () => Promise<void>;
  isExpanded: boolean;
  setIsExpanded: Dispatch<SetStateAction<boolean>>;
  isMobileOpen: boolean;
  setIsMobileOpen: Dispatch<SetStateAction<boolean>>;
  organizerName: string;
}

const OrganizerNavigation: React.FC<OrganizerNavigationProps> = ({
  currentView,
  onViewChange,
  onLogout,
  isExpanded,
  setIsExpanded,
  isMobileOpen,
  setIsMobileOpen,
  organizerName,
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    console.log("Attempting to log out...");
    await onLogout();
    alert("Logged out!");
  };

  const navigationItems: NavigationItem[] = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
      color: "text-blue-500",
      description: "Dashboard overview",
      badge: null,
    },
    {
      id: "myEvents",
      label: "My Events",
      icon: CalendarDays,
      color: "text-purple-500",
      description: "Manage your events",
      badge: null,
    },
    {
      id: "partnerships",
      label: "Partnerships",
      icon: Handshake,
      color: "text-emerald-500",
      description: "Manage partners & collaborations",
      badge: null,
    },
    {
      id: "overallStats",
      label: "Overall Stats",
      icon: BarChart2,
      color: "text-green-500",
      description: "Analytics & insights",
      badge: null,
    },
    {
      id: "reports",
      label: "Reports",
      icon: FileText,
      color: "text-orange-500",
      description: "Generate reports",
      badge: null,
    },
  ];

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const filteredItems = navigationItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.subItems && item.subItems.some(sub =>
      sub.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.description.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );

  const handleViewChange = (view: string) => {
    onViewChange(view);
    setIsMobileOpen(false);
  };

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      
      // Auto-collapse on tablet for better space usage
      if (width >= 768 && width < 1024) {
        setIsExpanded(false);
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsExpanded]);

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

  // Handle keyboard navigation for accessibility
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen]);

  return (
    <>
      {/* Mobile Header (fixed on top for small screens) */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
              <Ticket className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-800 dark:text-gray-200">Pulse</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Event Organizer</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-3 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors rounded-lg touch-manipulation"
            aria-label={isMobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileOpen}
          >
            {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Floating Menu Button for Collapsed Desktop Sidebar - Moved Higher */}
      {!isMobile && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="fixed left-4 top-6 z-40 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          aria-label="Expand navigation menu"
        >
          <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
      )}

      {/* Main Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 h-screen flex flex-col shadow-xl bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transition-all duration-300 ease-in-out
          ${isExpanded ? "md:w-80" : "md:w-16"}
          ${isMobileOpen ? "left-0 w-80" : "-left-80 md:left-0"}
          ${isMobile ? 'mt-16' : 'mt-0'}
          md:relative md:translate-x-0 md:shadow-none md:z-auto`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo and Search Section */}
        <div className={`border-b border-gray-200 dark:border-gray-700 ${isMobile ? 'p-4' : 'p-6'}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            {(isExpanded || isMobile) && (
              <div className="flex-1 animate-fade-in">
                <h2 className="font-bold text-2xl bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                  Pulse
                </h2>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Event Organizer</p>
              </div>
            )}
            {(isExpanded || isMobile) && !isMobile && (
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                aria-label="Collapse navigation menu"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>

          {(isExpanded || isMobile) && (
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
                aria-label="Search navigation items"
              />
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar" role="menu">
          {filteredItems.map((item, index) => {
            const isActive = currentView === item.id;
            const isCategoryOpen = openCategories.has(item.id);
            const hasSubItems = item.subItems && item.subItems.length > 0;

            return (
              <div key={item.id}>
                <button
                  onClick={() => hasSubItems ? toggleCategory(item.id) : handleViewChange(item.id)}
                  className={`group relative w-full flex items-center gap-3 px-4 py-4 text-left text-sm rounded-xl transition-all duration-300 ease-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                    ${isActive
                      ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg shadow-blue-500/25"
                      : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                    }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  role="menuitem"
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className={`h-5 w-5 transition-all duration-300 flex-shrink-0
                    ${isActive ? "text-white" : item.color}
                    ${!isExpanded && !isMobile ? "mx-auto" : ""}`} />

                  {(isExpanded || isMobile) && (
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.label}</div>
                      <div className={`text-xs truncate transition-colors duration-300
                        ${isActive ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
                        {item.description}
                      </div>
                    </div>
                  )}

                  {hasSubItems && (isExpanded || isMobile) && (
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 flex-shrink-0
                      ${isCategoryOpen ? 'rotate-180' : ''} ${isActive ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
                  )}

                  {isActive && (
                    <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-l-full opacity-80" />
                  )}

                  {!isExpanded && !isMobile && hoveredItem === item.id && (
                    <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                      {item.label}
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
                    </div>
                  )}
                </button>

                {hasSubItems && (isExpanded || isMobile) && isCategoryOpen && (
                  <div className="ml-8 mt-1 space-y-1 border-l border-gray-300 dark:border-gray-600 pl-4 py-1 animate-fade-in-down">
                    {item.subItems?.map((subItem) => {
                      const isSubActive = currentView === subItem.id;
                      return (
                        <button
                          key={subItem.id}
                          onClick={() => handleViewChange(subItem.id)}
                          className={`group w-full flex items-center gap-3 px-3 py-3 text-left text-sm rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                            ${isSubActive
                              ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/20"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                            }`}
                          role="menuitem"
                        >
                          <subItem.icon className={`h-4 w-4 ${isSubActive ? "text-blue-600 dark:text-blue-400" : subItem.color}`} />
                          <span className="truncate">{subItem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile and Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {(isExpanded || isMobile) && (
            <>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-3 p-3 rounded-lg w-full transition-all duration-200 group bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-expanded={showUserMenu}
                    aria-haspopup="true"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-sm font-medium truncate text-gray-800 dark:text-gray-200">{organizerName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Event Organizer</div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${showUserMenu ? 'rotate-90' : ''} text-gray-500 dark:text-gray-400`} />
                  </button>

                  {showUserMenu && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 py-2 animate-scale-in bg-white dark:bg-gray-700">
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors duration-200 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600">
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                  Sign Out
                </button>
              </div>
            </>
          )}

          {/* Collapsed User Icon */}
          {!isExpanded && !isMobile && (
            <div className="flex justify-center">
              <button 
                onClick={() => setIsExpanded(true)}
                className="p-3 rounded-lg transition-all duration-200 group relative bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Expand menu to access user options"
                onMouseEnter={() => setHoveredItem('user')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                {hoveredItem === 'user' && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                    {organizerName}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
                  </div>
                )}
              </button>
            </div>
          )}
        </div>
      </aside>

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

        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out forwards;
        }

        .animate-fade-in-down {
          animation: fade-in-down 0.3s ease-out forwards;
        }

        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(203 213 225);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(148 163 184);
        }

        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(100 116 139);
        }

        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(71 85 105);
        }

        /* Responsive touch targets */
        @media (max-width: 767px) {
          button {
            min-height: 44px;
            min-width: 44px;
          }
        }

        /* Focus visible for better accessibility */
        .focus\:ring-2:focus {
          outline: none;
        }

        /* Smooth transitions for all interactive elements */
        * {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </>
  );
};

export default OrganizerNavigation;