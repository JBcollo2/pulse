// frontend/pulse/src/pages/Dashboard.tsx - Enhanced Responsive Version

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EventDialog } from "@/components/EventDialog"; // Assuming this is a modal for creating events
import {
  BarChart,
  Calendar,
  Ticket,
  Settings,
  Users,
  QrCode,
  ChevronRight,
  Bell,
  Search,
  Plus,
  Menu,
  X,
  UserCheck,
  ChevronLeft,
  Building2,
  Edit,
  Eye,
  TrendingUp, // Added but not used in this snippet's current logic
  DollarSign // Added but not used in this snippet's current logic
} from 'lucide-react';

// Import your main page-level components
import Overview from './Overview';
import Tickets from './Tickets';
import QRScanner from './QRScanner';
import UserProfile from './UserProfile';
import Admin from './Admin';
import ManageOrganizersPage from './Manage_organizer';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false); // State for the EventDialog

  // Check if device is mobile
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true); // Collapse sidebar on mobile
        setMobileMenuOpen(false); // Ensure mobile menu is closed initially
      } else {
        setSidebarCollapsed(false); // Expand sidebar on larger screens
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Define menu items and their associated roles
  const allMenuItems = [
    {
      id: "overview",
      name: "Overview",
      icon: BarChart,
      description: "Dashboard analytics",
      color: "text-blue-500",
      roles: ["ADMIN", "ORGANIZER", "ATTENDEE", "SECURITY"]
    },
    {
      id: "tickets",
      name: "Tickets",
      icon: Ticket,
      description: "Manage event tickets",
      color: "text-green-500",
      roles: ["ADMIN", "ORGANIZER"]
    },
    {
      id: "scanner",
      name: "QR Scanner",
      icon: QrCode,
      description: "Scan ticket codes",
      color: "text-purple-500",
      roles: ["ADMIN", "ORGANIZER", "SECURITY"]
    },
    {
      id: "events",
      name: "My Events",
      icon: Calendar,
      description: "Manage your events",
      color: "text-orange-500",
      roles: ["ADMIN", "ORGANIZER"]
    },
    {
      id: "organizers",
      name: user?.role === "ADMIN" ? "All Organizers" : "My Team",
      icon: user?.role === "ADMIN" ? Users : Building2,
      description: user?.role === "ADMIN" ? "Manage all organizers" : "Manage your team",
      color: "text-gray-500",
      roles: ["ADMIN", "ORGANIZER"]
    },
    {
      id: "profile",
      name: "Profile",
      icon: UserCheck,
      description: "Account settings",
      color: "text-gray-700",
      roles: ["ADMIN", "ORGANIZER", "ATTENDEE", "SECURITY"]
    },
    {
      id: "admin",
      name: "Admin Panel",
      icon: Settings,
      description: "System administration",
      color: "text-red-500",
      roles: ["ADMIN"]
    },
  ];

  // Effect to set the initial active tab based on user's role
  useEffect(() => {
    if (!loading && user) {
      const userRole = user.role as "ADMIN" | "ORGANIZER" | "ATTENDEE" | "SECURITY";
      const firstAccessibleTab = allMenuItems.find(item => item.roles.includes(userRole));

      if (firstAccessibleTab) {
        setActiveTab(firstAccessibleTab.id);
      } else {
        setActiveTab("overview");
      }
    }
  }, [user, loading]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && mobileMenuOpen) {
        const sidebar = document.getElementById('mobile-sidebar');
        const menuButton = document.getElementById('mobile-menu-btn');

        if (sidebar && !sidebar.contains(event.target as Node) &&
            menuButton && !menuButton.contains(event.target as Node)) {
          setMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, mobileMenuOpen]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-700 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Determine which menu items to show based on the user's role
  const menuItemsForUser = user
    ? allMenuItems.filter(item => item.roles.includes(user.role as "ADMIN" | "ORGANIZER" | "ATTENDEE" | "SECURITY"))
    : [];

  const filteredMenuItems = menuItemsForUser.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeMenuItem = menuItemsForUser.find(item => item.id === activeTab);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Enhanced Component for Organizer's Event Management with Event Creation
  const MyEventsComponent = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Event Dialog */}
      <EventDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
      />

      {/* Header Section with Create Event Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200">My Events</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and organize your events</p>
          </div>
        </div>
        <button
          onClick={() => setShowEventDialog(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500
                     hover:from-blue-600 hover:to-green-600 text-white font-medium rounded-lg
                     transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     dark:focus:ring-offset-gray-800"
        >
          <Plus className="h-5 w-5" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Example Event Cards with Enhanced Dark Mode Styling */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg
                       dark:hover:shadow-gray-900/25 transition-all duration-200 group">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-gray-800 dark:text-gray-200 group-hover:text-blue-600
                                 dark:group-hover:text-blue-400 transition-colors duration-200">
                Tech Conference 2024
              </CardTitle>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200
                                 text-xs font-medium rounded-full">
                Active
              </span>
            </div>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Annual technology conference
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date:
                </span>
                <span className="text-gray-800 dark:text-gray-200 font-medium">Dec 15, 2024</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  Tickets Sold:
                </span>
                <span className="text-gray-800 dark:text-gray-200 font-medium">250/500</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Revenue:
                </span>
                <span className="text-green-600 dark:text-green-400 font-semibold">$12,500</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Progress</span>
                <span>50%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                     style={{width: '50%'}}></div>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2
                                 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg
                                 transition-colors duration-200 focus:outline-none focus:ring-2
                                 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                <Edit className="h-4 w-4" />
                Manage
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2
                                 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600
                                 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg border
                                 border-gray-200 dark:border-gray-600 transition-colors duration-200
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                 dark:focus:ring-offset-gray-800">
                <Eye className="h-4 w-4" />
                View
              </button>
            </div>
          </CardContent>
        </Card>
        {/* Add more event cards here */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg
                       dark:hover:shadow-gray-900/25 transition-all duration-200 group">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-gray-800 dark:text-gray-200 group-hover:text-blue-600
                                 dark:group-hover:text-blue-400 transition-colors duration-200">
                Summer Music Fest
              </CardTitle>
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200
                                 text-xs font-medium rounded-full">
                Upcoming
              </span>
            </div>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Outdoor concert series
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date:
                </span>
                <span className="text-gray-800 dark:text-gray-200 font-medium">Aug 20, 2025</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  Tickets Sold:
                </span>
                <span className="text-gray-800 dark:text-gray-200 font-medium">0/1000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Revenue:
                </span>
                <span className="text-green-600 dark:text-green-400 font-semibold">$0</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Progress</span>
                <span>0%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                     style={{width: '0%'}}></div>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2
                                 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg
                                 transition-colors duration-200 focus:outline-none focus:ring-2
                                 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-800">
                <Edit className="h-4 w-4" />
                Manage
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2
                                 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600
                                 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg border
                                 border-gray-200 dark:border-gray-600 transition-colors duration-200
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                 dark:focus:ring-offset-gray-800">
                <Eye className="h-4 w-4" />
                View
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Render the appropriate component based on the active tab
  const renderActiveTab = () => {
    switch (activeTab) {
      case "overview":
        return <Overview />;
      case "tickets":
        // Ensure only allowed roles can see this
        if (user && (user.role === "ADMIN" || user.role === "ORGANIZER")) {
          return <Tickets />;
        }
        return <UnauthorizedAccess />; // Fallback for unauthorized access
      case "scanner":
        // Ensure only allowed roles can see this
        if (user && (user.role === "ADMIN" || user.role === "ORGANIZER" || user.role === "SECURITY")) {
          return <QRScanner />;
        }
        return <UnauthorizedAccess />;
      case "events":
        // Ensure only allowed roles can see this
        if (user && (user.role === "ADMIN" || user.role === "ORGANIZER")) {
          return <MyEventsComponent />;
        }
        return <UnauthorizedAccess />;
      case "organizers":
        // This component handles role-based display internally, or you can add checks here
        if (user && (user.role === "ADMIN" || user.role === "ORGANIZER")) {
          return <ManageOrganizersPage />;
        }
        return <UnauthorizedAccess />;
      case "profile":
        return <UserProfile />;
      case "admin":
        // Ensure only ADMIN can see this
        if (user && user.role === "ADMIN") {
          return <Admin />;
        }
        return <UnauthorizedAccess />;
      default:
        return <Overview />;
    }
  };

  // Simple Unauthorized Access Component (for demonstration)
  const UnauthorizedAccess = () => (
    <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
      <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
      <p>You do not have permission to view this section.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Navbar />

      <main className="pt-16"> {/* Adjust padding top to account for fixed Navbar */}
        <div className="flex relative">
          {/* Mobile Menu Button */}
          {isMobile && (
            <button
              id="mobile-menu-btn"
              onClick={toggleMobileMenu}
              className="fixed top-20 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          {/* Mobile Overlay */}
          {isMobile && mobileMenuOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" />
          )}

          {/* Sidebar */}
          <div className={`
            ${isMobile
              ? `fixed top-16 left-0 h-[calc(100vh-4rem)] z-50 transform transition-transform duration-300 ease-in-out ${
                  mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`
              : `relative h-auto transition-all duration-300 ease-in-out ${
                  sidebarCollapsed ? 'w-16' : 'w-80'
                }`
            }
            bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
            shadow-xl md:shadow-none
          `}
          id="mobile-sidebar"
          style={{ width: isMobile ? '280px' : undefined }}
          >
            {/* Sidebar Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                {(!sidebarCollapsed || isMobile) && (
                  <div className="animate-fade-in">
                    <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                      Dashboard
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your events</p>
                  </div>
                )}

                {/* Close button for mobile */}
                {isMobile ? (
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  </button>
                )}
              </div>

              {/* Search Bar */}
              {(!sidebarCollapsed || isMobile) && (
                <div className="mt-4 relative animate-fade-in">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               transition-all duration-200 text-gray-800 dark:text-gray-200"
                  />
                </div>
              )}
            </div>

            {/* Navigation Menu */}
            <nav className="p-2 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto h-full pb-20">
              {filteredMenuItems.map((item, index) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`
                      group relative w-full flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-3.5 text-left text-sm rounded-xl
                      transition-all duration-300 ease-out transform hover:scale-[1.02]
                      ${isActive
                        ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg shadow-blue-500/25"
                        : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                      }
                    `}
                  >
                    <item.icon className={`
                      h-5 w-5 transition-all duration-300 flex-shrink-0
                      ${isActive ? "text-white" : item.color}
                      ${sidebarCollapsed && !isMobile ? "mx-auto" : ""}
                    `} />

                    {(!sidebarCollapsed || isMobile) && (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.name}</div>
                          <div className={`text-xs truncate transition-colors duration-300 ${
                            isActive ? "text-white/80" : "text-gray-500 dark:text-gray-400"
                          }`}>
                            {item.description}
                          </div>
                        </div>

                        <ChevronRight className={`
                          h-4 w-4 transition-all duration-300 flex-shrink-0
                          ${isActive ? "text-white opacity-100 transform rotate-90" : "text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-50"}
                        `} />
                      </>
                    )}

                    {/* Tooltip for collapsed sidebar */}
                    {sidebarCollapsed && !isMobile && (
                      <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg
                                     opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none
                                     whitespace-nowrap z-50">
                        {item.name}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1
                                       border-4 border-transparent border-r-gray-800"></div>
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Quick Actions */}
              {(!sidebarCollapsed || isMobile) && (user?.role === "ADMIN" || user?.role === "ORGANIZER" || user?.role === "SECURITY" || user?.role === "ATTENDEE") && (
                <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3 sm:px-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-1 sm:space-y-2">
                    {(user?.role === "ADMIN" || user?.role === "ORGANIZER") && (
                      <button
                        onClick={() => setShowEventDialog(true)} // Open the EventDialog
                        className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-gray-800 dark:text-gray-200
                                 hover:bg-green-50 dark:hover:bg-green-900 hover:text-green-600 dark:hover:text-green-400 rounded-lg transition-all duration-200
                                 group"
                      >
                        <Plus className="h-4 w-4 group-hover:scale-110 transition-transform duration-200 flex-shrink-0" />
                        <span className="truncate">Create Event</span>
                      </button>
                    )}
                    <button className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-gray-800 dark:text-gray-200
                                 hover:bg-purple-50 dark:hover:bg-purple-900 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition-all duration-200
                                 group">
                      <Bell className="h-4 w-4 group-hover:scale-110 transition-transform duration-200 flex-shrink-0" />
                      <span className="truncate">Notifications</span>
                    </button>
                  </div>
                </div>
              )}
            </nav>
          </div>

          {/* Main Content Area */}
          <div className={`flex-1 transition-all duration-300 ${
            isMobile
              ? 'w-full'
              : sidebarCollapsed ? 'ml-0' : 'ml-0' // Margin is handled by flex-1 and sidebar width
          }`}>
            {/* Content Header */}
            <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 sm:gap-3">
                    {activeMenuItem && (
                      <activeMenuItem.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${activeMenuItem.color} flex-shrink-0`} />
                    )}
                    <span className="truncate">{activeMenuItem?.name}</span>
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{activeMenuItem?.description}</p>
                </div>

                {/* Breadcrumb indicator - Hidden on mobile */}
                <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>Dashboard</span>
                  <ChevronRight className="h-4 w-4" />
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{activeMenuItem?.name}</span>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-12rem)]"> {/* Adjusted min-height */}
              <div className="animate-fade-in">
                {user ? (
                  renderActiveTab() // Render active tab component
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">Please log in to view the dashboard.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Enhanced CSS for animations and responsive design */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }

        /* Smooth scrollbar */
        ::-webkit-scrollbar {
          width: 4px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: rgb(203 213 225);
          border-radius: 2px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgb(148 163 184);
        }

        .dark ::-webkit-scrollbar-thumb {
          background: rgb(75 85 99);
        }

        .dark ::-webkit-scrollbar-thumb:hover {
          background: rgb(107 114 128);
        }

        /* Prevent horizontal overflow */
        body {
          overflow-x: hidden;
        }

        /* Smooth transitions for mobile */
        @media (max-width: 768px) {
          .transition-transform {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
        }

        /* Touch improvements */
        @media (hover: none) and (pointer: coarse) {
          button:hover {
            transform: none !important;
          }

          .group:hover .group-hover\\:scale-110 {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;