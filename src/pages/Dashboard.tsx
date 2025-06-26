// frontend/pulse/src/pages/Dashboard.tsx (This is the same code from the previous complete answer)

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  UserCheck
} from 'lucide-react';

// Import your main page-level components
import Overview from './Overview';
import Tickets from './Tickets';
import QRScanner from './QRScanner';
import UserProfile from './UserProfile';
import Admin from './Admin';
import ManageOrganizersPage from './Manage_organizer';
import { useAuth } from '@/contexts/AuthContext'; // Import from the new AuthContext location!

const Dashboard = () => {
  const { user, loading } = useAuth(); // Get user and loading state from AuthContext
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
      roles: ["ADMIN", "ORGANIZER", "SECURITY"] // Admin, Organizer, and SECURITY can access the scanner
    },
    {
      id: "organizers",
      name: "Organizers",
      icon: Users,
      description: "Manage team members",
      color: "text-gray-500",
      roles: ["ADMIN"] // Only Admin can manage organizers
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
      roles: ["ADMIN"] // Only Admin can access the Admin Panel
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
        setActiveTab("overview"); // Fallback
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">Loading dashboard...</p>
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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Navbar />

      <main className="pt-16">
        <div className="flex">
          {/* Sidebar */}
          <div className={`
            fixed md:relative top-16 md:top-0 left-0 h-[calc(100vh-4rem)] md:h-auto
            bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
            shadow-xl md:shadow-none z-30 transition-all duration-300 ease-in-out
            ${sidebarCollapsed ? 'w-16' : 'w-80'}
          `}>
            {/* Sidebar Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                {!sidebarCollapsed && (
                  <div className="animate-fade-in">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                      Dashboard
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your events</p>
                  </div>
                )}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </button>
              </div>

              {/* Search Bar */}
              {!sidebarCollapsed && (
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
            <nav className="p-4 space-y-2 overflow-y-auto h-full">
              {filteredMenuItems.map((item, index) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`
                      group relative w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm rounded-xl
                      transition-all duration-300 ease-out transform hover:scale-[1.02]
                      ${isActive
                        ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg shadow-blue-500/25"
                        : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 hover:text-gray-800 dark:hover:text-gray-200"
                      }
                    `}
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    {/* Icon with dynamic color */}
                    <item.icon className={`
                      h-5 w-5 transition-all duration-300
                      ${isActive ? "text-white" : item.color}
                      ${sidebarCollapsed ? "mx-auto" : ""}
                    `} />

                    {!sidebarCollapsed && (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.name}</div>
                          <div className={`text-xs truncate transition-colors duration-300 ${
                            isActive ? "text-white/80" : "text-gray-500 dark:text-gray-400"
                          }`}>
                            {item.description}
                          </div>
                        </div>

                        {/* Active indicator */}
                        <ChevronRight className={`
                          h-4 w-4 transition-all duration-300
                          ${isActive ? "text-white opacity-100 transform rotate-90" : "text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-50"}
                        `} />
                      </>
                    )}

                    {/* Hover effect for collapsed sidebar */}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg
                                   opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none
                                   whitespace-nowrap z-50">
                        {item.name}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1
                                       border-4 border-transparent border-r-gray-800"></div>
                      </div>
                    )}

                    {/* Active tab indicator */}
                    {isActive && (
                      <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8
                                     bg-white dark:bg-gray-800 rounded-l-full opacity-80"></div>
                    )}
                  </button>
                );
              })}

              {/* Quick Actions (conditionally render based on role if necessary) */}
              {!sidebarCollapsed && (user?.role === "ADMIN" || user?.role === "ORGANIZER" || user?.role === "SECURITY" || user?.role === "ATTENDEE") && (
                <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    {(user?.role === "ADMIN" || user?.role === "ORGANIZER") && ( // Only Admin/Organizer can create events
                      <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200
                                       hover:bg-green-50 dark:hover:bg-green-900 hover:text-green-600 dark:hover:text-green-400 rounded-lg transition-all duration-200
                                       group">
                        <Plus className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                        Create Event
                      </button>
                    )}
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200
                                       hover:bg-purple-50 dark:hover:bg-purple-900 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition-all duration-200
                                       group">
                      <Bell className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                      Notifications
                    </button>
                  </div>
                </div>
              )}
            </nav>
          </div>

          {/* Main Content Area */}
          <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-0 md:ml-0'}`}>
            {/* Content Header */}
            <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
                    {activeMenuItem && (
                      <activeMenuItem.icon className={`h-6 w-6 ${activeMenuItem.color}`} />
                    )}
                    {activeMenuItem?.name}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">{activeMenuItem?.description}</p>
                </div>

                {/* Breadcrumb indicator */}
                <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>Dashboard</span>
                  <ChevronRight className="h-4 w-4" />
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{activeMenuItem?.name}</span>
                </div>
              </div>
            </div>

            {/* Main Content - Conditionally Render based on activeTab and user role */}
            <div className="p-8 min-h-[calc(100vh-12rem)]">
              <div className="animate-fade-in">
                {user ? (
                  <>
                    {activeTab === "overview" && <Overview />}
                    {activeTab === "tickets" && (user.role === "ADMIN" || user.role === "ORGANIZER") && <Tickets />}
                    {activeTab === "scanner" && (user.role === "ADMIN" || user.role === "ORGANIZER" || user.role === "SECURITY") && <QRScanner />}
                    {activeTab === "organizers" && user.role === "ADMIN" && <ManageOrganizersPage />}
                    {activeTab === "profile" && <UserProfile />}
                    {activeTab === "admin" && user.role === "ADMIN" && <Admin />}
                  </>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400">Please log in to view the dashboard.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Custom CSS for animations */}
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
      `}</style>
    </div>
  );
};

export default Dashboard;