// import React, { useState } from 'react';
// import Navbar from '@/components/Navbar';
// import Footer from '@/components/Footer';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import {
//   BarChart,
//   Calendar,
//   Ticket,
//   Settings,
//   Users,
//   QrCode,
//   ChevronRight,
//   Bell,
//   Search,
//   Plus,
//   Menu,
//   X
// } from 'lucide-react';

// // Import your main page-level components
// import Overview from './Overview';
// import Tickets from './Tickets';
// import QRScanner from './QRScanner';
// import UserProfile from './UserProfile';
// import Admin from './Admin';
// import ManageOrganizersPage from './Manage_organizer';

// const Dashboard = () => {
//   const [activeTab, setActiveTab] = useState("overview");
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");

//   const menuItems = [
//     {
//       id: "overview",
//       name: "Overview",
//       icon: BarChart,
//       description: "Dashboard analytics",
//       color: "text-[--primary]"
//     },
//     {
//       id: "tickets",
//       name: "Tickets",
//       icon: Ticket,
//       description: "Manage event tickets",
//       color: "text-[--secondary]"
//     },
//     {
//       id: "scanner",
//       name: "QR Scanner",
//       icon: QrCode,
//       description: "Scan ticket codes",
//       color: "text-[--accent]"
//     },
//     {
//       id: "organizers",
//       name: "Organizers",
//       icon: Users,
//       description: "Manage team members",
//       color: "text-[--muted]"
//     },
//     {
//       id: "profile",
//       name: "Profile",
//       icon: Settings,
//       description: "Account settings",
//       color: "text-[--foreground]"
//     },
//     {
//       id: "admin",
//       name: "Admin",
//       icon: Settings,
//       description: "System administration",
//       color: "text-[--destructive]"
//     },
//   ];

//   const filteredMenuItems = menuItems.filter(item =>
//     item.name.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const activeMenuItem = menuItems.find(item => item.id === activeTab);

//   return (
//     <div className="min-h-screen bg-[--background] text-[--foreground]">
//       <Navbar />

//       <main className="pt-16">
//         <div className="flex">
//           {/* Sidebar */}
//           <div className={`
//             fixed md:relative top-16 md:top-0 left-0 h-[calc(100vh-4rem)] md:h-auto
//             bg-[--card]/80 backdrop-blur-xl border-r border-[--border]/60
//             shadow-xl md:shadow-none z-30 transition-all duration-300 ease-in-out
//             ${sidebarCollapsed ? 'w-16' : 'w-80'}
//           `}>
//             {/* Sidebar Header */}
//             <div className="p-6 border-b border-[--border]">
//               <div className="flex items-center justify-between">
//                 {!sidebarCollapsed && (
//                   <div className="animate-fade-in">
//                     <h2 className="text-xl font-bold bg-gradient-to-r from-[--primary] to-[--secondary] bg-clip-text text-transparent">
//                       Dashboard
//                     </h2>
//                     <p className="text-sm text-[--muted] mt-1">Manage your events</p>
//                   </div>
//                 )}
//                 <button
//                   onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
//                   className="p-2 rounded-lg hover:bg-[--muted] transition-colors duration-200"
//                 >
//                   {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
//                 </button>
//               </div>

//               {/* Search Bar */}
//               {!sidebarCollapsed && (
//                 <div className="mt-4 relative animate-fade-in">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[--muted]" />
//                   <input
//                     type="text"
//                     placeholder="Search menu..."
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     className="w-full pl-10 pr-4 py-2 text-sm bg-[--muted] border border-[--border] rounded-lg
//                              focus:outline-none focus:ring-2 focus:ring-[--primary] focus:border-transparent
//                              transition-all duration-200 text-[--foreground]"
//                   />
//                 </div>
//               )}
//             </div>

//             {/* Navigation Menu */}
//             <nav className="p-4 space-y-2 overflow-y-auto h-full">
//               {filteredMenuItems.map((item, index) => {
//                 const isActive = activeTab === item.id;
//                 return (
//                   <button
//                     key={item.id}
//                     onClick={() => setActiveTab(item.id)}
//                     className={`
//                       group relative w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm rounded-xl
//                       transition-all duration-300 ease-out transform hover:scale-[1.02]
//                       ${isActive
//                         ? "bg-gradient-to-r from-[--primary] to-[--secondary] text-[--card-foreground] shadow-lg shadow-[--primary]/25"
//                         : "hover:bg-[--muted] text-[--foreground] hover:text-[--foreground]"
//                       }
//                     `}
//                     style={{
//                       animationDelay: `${index * 50}ms`
//                     }}
//                   >
//                     {/* Icon with dynamic color */}
//                     <item.icon className={`
//                       h-5 w-5 transition-all duration-300
//                       ${isActive ? "text-[--card-foreground]" : item.color}
//                       ${sidebarCollapsed ? "mx-auto" : ""}
//                     `} />

//                     {!sidebarCollapsed && (
//                       <>
//                         <div className="flex-1 min-w-0">
//                           <div className="font-medium truncate">{item.name}</div>
//                           <div className={`text-xs truncate transition-colors duration-300 ${
//                             isActive ? "text-[--card-foreground]/80" : "text-[--muted]"
//                           }`}>
//                             {item.description}
//                           </div>
//                         </div>

//                         {/* Active indicator */}
//                         <ChevronRight className={`
//                           h-4 w-4 transition-all duration-300
//                           ${isActive ? "text-[--card-foreground] opacity-100 transform rotate-90" : "text-[--muted] opacity-0 group-hover:opacity-50"}
//                         `} />
//                       </>
//                     )}

//                     {/* Hover effect for collapsed sidebar */}
//                     {sidebarCollapsed && (
//                       <div className="absolute left-full ml-2 px-3 py-2 bg-[--foreground] text-[--card-foreground] text-sm rounded-lg
//                                     opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none
//                                     whitespace-nowrap z-50">
//                         {item.name}
//                         <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1
//                                       border-4 border-transparent border-r-[--foreground]"></div>
//                       </div>
//                     )}

//                     {/* Active tab indicator */}
//                     {isActive && (
//                       <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8
//                                     bg-[--card-foreground] rounded-l-full opacity-80"></div>
//                     )}
//                   </button>
//                 );
//               })}

//               {/* Quick Actions */}
//               {!sidebarCollapsed && (
//                 <div className="pt-6 mt-6 border-t border-[--border]">
//                   <h3 className="text-xs font-semibold text-[--muted] uppercase tracking-wider mb-3 px-4">
//                     Quick Actions
//                   </h3>
//                   <div className="space-y-2">
//                     <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[--foreground]
//                                      hover:bg-[--secondary]/10 hover:text-[--secondary] rounded-lg transition-all duration-200
//                                      group">
//                       <Plus className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
//                       Create Event
//                     </button>
//                     <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[--foreground]
//                                      hover:bg-[--accent]/10 hover:text-[--accent] rounded-lg transition-all duration-200
//                                      group">
//                       <Bell className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
//                       Notifications
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </nav>
//           </div>

//           {/* Main Content Area */}
//           <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-0 md:ml-0'}`}>
//             {/* Content Header */}
//             <div className="bg-[--card]/70 backdrop-blur-sm border-b border-[--border]/60 px-8 py-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h1 className="text-2xl font-bold text-[--foreground] flex items-center gap-3">
//                     {activeMenuItem && (
//                       <activeMenuItem.icon className={`h-6 w-6 ${activeMenuItem.color}`} />
//                     )}
//                     {activeMenuItem?.name}
//                   </h1>
//                   <p className="text-[--muted] mt-1">{activeMenuItem?.description}</p>
//                 </div>

//                 {/* Breadcrumb indicator */}
//                 <div className="hidden md:flex items-center space-x-2 text-sm text-[--muted]">
//                   <span>Dashboard</span>
//                   <ChevronRight className="h-4 w-4" />
//                   <span className="text-[--foreground] font-medium">{activeMenuItem?.name}</span>
//                 </div>
//               </div>
//             </div>

//             {/* Main Content */}
//             <div className="p-8 min-h-[calc(100vh-12rem)]">
//               <div className="animate-fade-in">
//                 {activeTab === "overview" && <Overview />}
//                 {activeTab === "tickets" && <Tickets />}
//                 {activeTab === "scanner" && <QRScanner />}
//                 {activeTab === "organizers" && <ManageOrganizersPage />}
//                 {activeTab === "profile" && <UserProfile />}
//                 {activeTab === "admin" && <Admin />}
//               </div>
//             </div>
//           </div>
//         </div>
//       </main>

//       <Footer />

//       {/* Custom CSS for animations */}
//       <style>{`
//         @keyframes fade-in {
//           from {
//             opacity: 0;
//             transform: translateY(10px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         .animate-fade-in {
//           animation: fade-in 0.3s ease-out forwards;
//         }

//         /* Smooth scrollbar */
//         ::-webkit-scrollbar {
//           width: 4px;
//         }

//         ::-webkit-scrollbar-track {
//           background: transparent;
//         }

//         ::-webkit-scrollbar-thumb {
//           background: rgb(203 213 225);
//           border-radius: 2px;
//         }

//         ::-webkit-scrollbar-thumb:hover {
//           background: rgb(148 163 184);
//         }
//       `}</style>
//     </div>
//   );
// };

// export default Dashboard;


import React, { useState, useEffect } from 'react';
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
  Home,
  TrendingUp,
  Shield,
  Sparkles,
  Zap
} from 'lucide-react';

// Mock components for demonstration
const Overview = () => <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
  <h2 className="text-2xl font-bold text-gray-800 mb-4">Overview Dashboard</h2>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Total Events</p>
          <p className="text-3xl font-bold text-blue-600">24</p>
        </div>
        <Calendar className="h-8 w-8 text-blue-500" />
      </div>
    </div>
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Active Tickets</p>
          <p className="text-3xl font-bold text-green-600">1,429</p>
        </div>
        <Ticket className="h-8 w-8 text-green-500" />
      </div>
    </div>
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Revenue</p>
          <p className="text-3xl font-bold text-purple-600">$45,280</p>
        </div>
        <TrendingUp className="h-8 w-8 text-purple-500" />
      </div>
    </div>
  </div>
</div>;

const Tickets = () => <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
  <h2 className="text-2xl font-bold text-gray-800 mb-4">Ticket Management</h2>
  <p className="text-gray-600">Manage and track all your event tickets here.</p>
</div>;

const QRScanner = () => <div className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl">
  <h2 className="text-2xl font-bold text-gray-800 mb-4">QR Code Scanner</h2>
  <p className="text-gray-600">Scan ticket QR codes for event entry.</p>
</div>;

const ManageOrganizersPage = () => <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl">
  <h2 className="text-2xl font-bold text-gray-800 mb-4">Organizer Management</h2>
  <p className="text-gray-600">Manage your team members and organizers.</p>
</div>;

const UserProfile = () => <div className="p-6 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl">
  <h2 className="text-2xl font-bold text-gray-800 mb-4">User Profile</h2>
  <p className="text-gray-600">Update your account settings and preferences.</p>
</div>;

const Admin = () => <div className="p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl">
  <h2 className="text-2xl font-bold text-gray-800 mb-4">Admin Panel</h2>
  <p className="text-gray-600">System administration and advanced settings.</p>
</div>;

// Mock Navbar and Footer components
const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200 z-40">
    <div className="flex items-center justify-between px-6 h-full">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          EventHub
        </span>
      </div>
      <div className="hidden md:flex items-center space-x-4">
        <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
          Help
        </button>
        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full"></div>
      </div>
    </div>
  </nav>
);

const Footer = () => (
  <footer className="bg-gray-50 border-t border-gray-200 py-8">
    <div className="max-w-7xl mx-auto px-6 text-center">
      <p className="text-gray-600 text-sm">
        © 2025 EventHub. Built with ❤️ for event organizers.
      </p>
    </div>
  </footer>
);

// Custom hook for dashboard logic
const useDashboardLogic = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Menu items configuration
  const menuItems = [
    {
      id: "overview",
      name: "Overview",
      icon: BarChart,
      description: "Dashboard analytics & insights",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      hoverColor: "hover:bg-blue-100",
      activeColor: "bg-gradient-to-r from-blue-500 to-blue-600"
    },
    {
      id: "tickets",
      name: "Tickets",
      icon: Ticket,
      description: "Manage event tickets",
      color: "text-green-600",
      bgColor: "bg-green-50",
      hoverColor: "hover:bg-green-100",
      activeColor: "bg-gradient-to-r from-green-500 to-green-600"
    },
    {
      id: "scanner",
      name: "QR Scanner",
      icon: QrCode,
      description: "Scan ticket codes",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      hoverColor: "hover:bg-purple-100",
      activeColor: "bg-gradient-to-r from-purple-500 to-purple-600"
    },
    {
      id: "organizers",
      name: "Organizers",
      icon: Users,
      description: "Manage team members",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      hoverColor: "hover:bg-orange-100",
      activeColor: "bg-gradient-to-r from-orange-500 to-orange-600"
    },
    {
      id: "profile",
      name: "Profile",
      icon: Settings,
      description: "Account settings",
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      hoverColor: "hover:bg-teal-100",
      activeColor: "bg-gradient-to-r from-teal-500 to-teal-600"
    },
    {
      id: "admin",
      name: "Admin",
      icon: Shield,
      description: "System administration",
      color: "text-red-600",
      bgColor: "bg-red-50",
      hoverColor: "hover:bg-red-100",
      activeColor: "bg-gradient-to-r from-red-500 to-red-600"
    },
  ];

  // Quick actions configuration
  const quickActions = [
    {
      id: "create-event",
      name: "Create Event",
      icon: Plus,
      color: "text-blue-600",
      hoverColor: "hover:bg-blue-50"
    },
    {
      id: "notifications",
      name: "Notifications",
      icon: Bell,
      color: "text-amber-600",
      hoverColor: "hover:bg-amber-50"
    },
    {
      id: "home",
      name: "Home",
      icon: Home,
      color: "text-gray-600",
      hoverColor: "hover:bg-gray-50"
    }
  ];

  // Filter menu items based on search query
  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get active menu item
  const activeMenuItem = menuItems.find(item => item.id === activeTab);

  // Handle mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  // Component rendering functions
  const renderContent = () => {
    const components = {
      overview: Overview,
      tickets: Tickets,
      scanner: QRScanner,
      organizers: ManageOrganizersPage,
      profile: UserProfile,
      admin: Admin
    };

    const Component = components[activeTab];
    return Component ? <Component /> : <Overview />;
  };

  return {
    // State
    activeTab,
    sidebarCollapsed,
    searchQuery,
    isMobile,

    // Data
    menuItems,
    quickActions,
    filteredMenuItems,
    activeMenuItem,

    // Actions
    setActiveTab,
    setSidebarCollapsed,
    setSearchQuery,

    // Render functions
    renderContent
  };
};

// Sidebar Component
const Sidebar = ({
  sidebarCollapsed,
  setSidebarCollapsed,
  searchQuery,
  setSearchQuery,
  filteredMenuItems,
  activeTab,
  setActiveTab,
  quickActions
}) => (
  <div className={`
    fixed md:relative top-16 md:top-0 left-0 h-[calc(100vh-4rem)] md:h-auto
    bg-white/95 backdrop-blur-xl border-r border-gray-200
    shadow-2xl md:shadow-none z-30 transition-all duration-500 ease-in-out
    ${sidebarCollapsed ? 'w-20' : 'w-80'}
  `}>
    {/* Sidebar Header */}
    <div className="p-6 border-b border-gray-100">
      <div className="flex items-center justify-between">
        {!sidebarCollapsed && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard
            </h2>
            <p className="text-sm text-gray-500 mt-1">Manage your events with ease</p>
          </div>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
        >
          {sidebarCollapsed ?
            <Menu className="h-5 w-5 text-gray-600 group-hover:text-gray-900" /> :
            <X className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
          }
        </button>
      </div>

      {/* Search Bar */}
      {!sidebarCollapsed && (
        <div className="mt-4 relative animate-fade-in">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-all duration-200 text-gray-700 placeholder-gray-400"
          />
        </div>
      )}
    </div>

    {/* Navigation Menu */}
    <nav className="p-4 space-y-2 overflow-y-auto flex-1">
      {filteredMenuItems.map((item, index) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`
              group relative w-full flex items-center gap-4 px-4 py-4 text-left text-sm rounded-2xl
              transition-all duration-300 ease-out transform hover:scale-[1.02] hover:shadow-lg
              ${isActive
                ? `${item.activeColor} text-white shadow-lg shadow-${item.color.split('-')[1]}-500/30`
                : `hover:bg-gray-50 text-gray-700 ${item.hoverColor}`
              }
            `}
            style={{
              animationDelay: `${index * 50}ms`
            }}
          >
            {/* Icon with background */}
            <div className={`
              p-2 rounded-xl transition-all duration-300
              ${isActive
                ? "bg-white/20"
                : `${item.bgColor} group-hover:scale-110`
              }
            `}>
              <item.icon className={`
                h-5 w-5 transition-all duration-300
                ${isActive ? "text-white" : item.color}
              `} />
            </div>

            {!sidebarCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{item.name}</div>
                  <div className={`text-xs truncate transition-colors duration-300 ${
                    isActive ? "text-white/80" : "text-gray-500"
                  }`}>
                    {item.description}
                  </div>
                </div>

                {/* Active indicator */}
                <ChevronRight className={`
                  h-4 w-4 transition-all duration-300
                  ${isActive
                    ? "text-white opacity-100 transform rotate-90"
                    : "text-gray-400 opacity-0 group-hover:opacity-70"
                  }
                `} />
              </>
            )}

            {/* Tooltip for collapsed sidebar */}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg
                            opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none
                            whitespace-nowrap z-50 shadow-xl">
                {item.name}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1
                              border-4 border-transparent border-r-gray-900"></div>
              </div>
            )}

            {/* Pulse effect for active item */}
            {isActive && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 animate-pulse"></div>
            )}
          </button>
        );
      })}

      {/* Quick Actions */}
      {!sidebarCollapsed && (
        <div className="pt-6 mt-6 border-t border-gray-100">
          <div className="flex items-center gap-2 px-4 mb-4">
            <Zap className="h-4 w-4 text-amber-500" />
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              Quick Actions
            </h3>
          </div>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <button
                key={action.id}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700
                           rounded-xl transition-all duration-200 group ${action.hoverColor}`}
              >
                <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-white transition-colors duration-200">
                  <action.icon className={`h-4 w-4 ${action.color} group-hover:scale-110 transition-transform duration-200`} />
                </div>
                {action.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  </div>
);

// Content Header Component
const ContentHeader = ({ activeMenuItem, sidebarCollapsed }) => (
  <div className="bg-white/70 backdrop-blur-sm border-b border-gray-100 px-8 py-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {activeMenuItem && (
          <div className={`p-3 rounded-2xl ${activeMenuItem.bgColor} shadow-sm`}>
            <activeMenuItem.icon className={`h-6 w-6 ${activeMenuItem.color}`} />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {activeMenuItem?.name}
          </h1>
          <p className="text-gray-600 mt-1">{activeMenuItem?.description}</p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
        <span>Dashboard</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium">{activeMenuItem?.name}</span>
      </div>
    </div>
  </div>
);

// Main Dashboard Component
const Dashboard = () => {
  const {
    activeTab,
    sidebarCollapsed,
    searchQuery,
    filteredMenuItems,
    activeMenuItem,
    quickActions,
    setActiveTab,
    setSidebarCollapsed,
    setSearchQuery,
    renderContent
  } = useDashboardLogic();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Navbar />

      <main className="pt-16">
        <div className="flex">
          <Sidebar
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredMenuItems={filteredMenuItems}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            quickActions={quickActions}
          />

          {/* Main Content Area */}
          <div className={`flex-1 transition-all duration-500 ${sidebarCollapsed ? 'ml-20' : 'ml-0 md:ml-0'}`}>
            <ContentHeader activeMenuItem={activeMenuItem} sidebarCollapsed={sidebarCollapsed} />

            {/* Main Content */}
            <div className="p-8 min-h-[calc(100vh-12rem)]">
              <div className="animate-fade-in max-w-7xl mx-auto">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Custom Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #cbd5e1, #94a3b8);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #94a3b8, #64748b);
        }

        /* Smooth transitions for all elements */
        * {
          scroll-behavior: smooth;
        }

        /* Glass morphism effect */
        .backdrop-blur-xl {
          backdrop-filter: blur(16px);
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
