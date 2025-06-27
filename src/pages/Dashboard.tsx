import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EventDialog } from "@/components/EventDialog";
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
  TrendingUp,
  DollarSign
} from 'lucide-react';
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
  const [showEventDialog, setShowEventDialog] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
        setMobileMenuOpen(false);
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
    <div className="space-y-6">
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
      </div>
    </div>
  );

  // Render the appropriate component based on the active tab
  const renderActiveTab = () => {
    switch (activeTab) {
      case "overview":
        return <Overview />;
      case "tickets":
        return <Tickets />;
      case "scanner":
        return <QRScanner />;
      case "events":
        return <MyEventsComponent />;
      case "organizers":
        return <ManageOrganizersPage />;
      case "profile":
        return <UserProfile />;
      case "admin":
        return <Admin />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="flex flex-1">
        {/* Sidebar for desktop */}
        <div className={`hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${sidebarCollapsed ? 'w-20 overflow-hidden' : ''}`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className={`text-xl font-bold ${sidebarCollapsed ? 'hidden' : 'block'} text-gray-800 dark:text-gray-200`}>
              Pulse Dashboard
            </h1>
          </div>

          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${sidebarCollapsed ? 'hidden' : ''}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              {filteredMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${activeTab === item.id ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <item.icon className={`h-5 w-5 ${item.color} ${activeTab === item.id ? 'text-blue-600 dark:text-blue-300' : ''}`} />
                  <span className={`${sidebarCollapsed ? 'hidden' : 'block'}`}>{item.name}</span>
                  {activeTab === item.id && !sidebarCollapsed && (
                    <ChevronRight className="h-4 w-4 ml-auto text-blue-600 dark:text-blue-300" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          id="mobile-menu-btn"
          onClick={toggleMobileMenu}
          className="md:hidden fixed top-16 left-4 z-40 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
        >
          {mobileMenuOpen ? <X className="h-6 w-6 text-gray-800 dark:text-gray-200" /> : <Menu className="h-6 w-6 text-gray-800 dark:text-gray-200" />}
        </button>

        {/* Mobile sidebar */}
        {mobileMenuOpen && (
          <div
            id="mobile-sidebar"
            className="md:hidden fixed inset-0 z-30 bg-black bg-opacity-50"
          >
            <div className="w-64 bg-white dark:bg-gray-800 h-full p-4 border-r border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">Menu</h1>
                <button
                  onClick={toggleMobileMenu}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="h-6 w-6 text-gray-800 dark:text-gray-200" />
                </button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                {filteredMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${activeTab === item.id ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    <item.icon className={`h-5 w-5 ${item.color} ${activeTab === item.id ? 'text-blue-600 dark:text-blue-300' : ''}`} />
                    <span>{item.name}</span>
                    {activeTab === item.id && (
                      <ChevronRight className="h-4 w-4 ml-auto text-blue-600 dark:text-blue-300" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              {activeMenuItem && (
                <>
                  <activeMenuItem.icon className={`h-6 w-6 ${activeMenuItem.color}`} />
                  <div>
                    <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{activeMenuItem.name}</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activeMenuItem.description}</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                {sidebarCollapsed ? <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" /> : <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {renderActiveTab()}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
