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
  Trash2,
  TrendingUp,
  DollarSign,
  User,
  Building,
} from 'lucide-react';
import Overview from './Overview';
import Tickets from './Tickets';
import QRScanner from './QRScanner';
import UserProfile from './UserProfile';
import Admin from './Admin';
import ManageOrganizersPage from './Manage_organizer';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const { toast } = useToast();

  // State variables for filtering and sorting
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [filterCapacity, setFilterCapacity] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [eventSearchQuery, setEventSearchQuery] = useState("");

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
        setMobileMenuOpen(false);
      } else {
        setSidebarCollapsed(false);
      }
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/events`, {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data = await response.json();
        setEvents(data.events);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast({
          title: "Error",
          description: "Failed to fetch events",
          variant: "destructive"
        });
      }
    };
    if (user) {
      fetchEvents();
    }
  }, [user]);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && mobileMenuOpen) {
        const sidebar = document.getElementById('mobile-sidebar');
        const menuButton = document.getElementById('mobile-menu-btn');
        if (sidebar && !sidebar.contains(event.target) &&
            menuButton && !menuButton.contains(event.target)) {
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

  const menuItemsForUser = user
    ? allMenuItems.filter(item => item.roles.includes(user.role))
    : [];

  const filteredMenuItems = menuItemsForUser.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeMenuItem = menuItemsForUser.find(item => item.id === activeTab);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleCreateEventClick = () => {
    setEditingEvent(null);
    setShowEventDialog(true);
  };

  const handleEditEventClick = (event) => {
    setEditingEvent(event);
    setShowEventDialog(true);
  };

  const handleViewEventClick = (event) => {
    setEditingEvent(event);
    setShowEventDialog(true);
  };

  const handleEventSave = (eventData) => {
    if (editingEvent) {
      setEvents(prevEvents =>
        prevEvents.map(event => (event.id === eventData.id ? eventData : event))
      );
    } else {
      setEvents(prevEvents => [...prevEvents, eventData]);
    }
    setShowEventDialog(false);
    setEditingEvent(null);
  };

  const handleEventDelete = async (eventId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
      toast({
        title: "Success",
        description: "Event deleted successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive"
      });
    }
  };

  const MyEventsComponent = () => {
    // Add categories state
    const [categories, setCategories] = useState([]);

    // Fetch categories from backend
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/categories`, {
                    credentials: 'include' // Include cookies for authentication
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch categories');
                }

                const data = await response.json();
                setCategories(data.categories);
            } catch (error) {
                console.error('Error fetching categories:', error);
                toast({
                    title: "Error",
                    description: "Failed to fetch categories",
                    variant: "destructive"
                });
            }
        };

        fetchCategories();
    }, []);

    const getFilteredAndSortedEvents = () => {
        let filtered = events.filter(event => {
            const matchesSearch = eventSearchQuery === "" ||
                event.name.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
                event.description?.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
                event.location?.toLowerCase().includes(eventSearchQuery.toLowerCase());

            // Category filter
            let matchesCategory = true;
            if (filterCategory !== "all") {
                matchesCategory = event.category === filterCategory;
            }

            let matchesDate = true;
            if (filterDate !== "all") {
                const eventDate = new Date(event.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                eventDate.setHours(0, 0, 0, 0);

                const todayTime = today.getTime();
                const eventTime = eventDate.getTime();

                switch (filterDate) {
                    case "today":
                        matchesDate = eventTime === todayTime;
                        break;
                    case "week":
                        const oneWeekFromNow = new Date(today);
                        oneWeekFromNow.setDate(today.getDate() + 7);
                        matchesDate = eventTime >= todayTime && eventTime <= oneWeekFromNow.getTime();
                        break;
                    case "month":
                        const oneMonthFromNow = new Date(today);
                        oneMonthFromNow.setMonth(today.getMonth() + 1);
                        matchesDate = eventTime >= todayTime && eventTime <= oneMonthFromNow.getTime();
                        break;
                    case "past":
                        matchesDate = eventTime < todayTime;
                        break;
                    case "future":
                        matchesDate = eventTime > todayTime;
                        break;
                    default:
                        matchesDate = true;
                }
            }
            return matchesSearch && matchesCategory && matchesDate;
        });

        filtered.sort((a, b) => {
            let aValue, bValue;
            switch (sortBy) {
                case "name":
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case "date":
                    aValue = new Date(a.date);
                    bValue = new Date(b.date);
                    break;
                case "category":
                    aValue = a.category ? a.category.toLowerCase() : "";
                    bValue = b.category ? b.category.toLowerCase() : "";
                    break;
                default:
                    return 0;
            }
            if (sortOrder === "asc") {
                return aValue > bValue ? 1 : (aValue < bValue ? -1 : 0);
            } else {
                return aValue < bValue ? 1 : (aValue > bValue ? -1 : 0);
            }
        });
        return filtered;
    };

    const filteredEvents = getFilteredAndSortedEvents();

    const clearAllFilters = () => {
        setEventSearchQuery("");
        setFilterCategory("all");
        setFilterDate("all");
        setSortBy("date");
        setSortOrder("desc");
    };

    const hasActiveFilters = eventSearchQuery !== "" ||
        filterCategory !== "all" ||
        filterDate !== "all" ||
        sortBy !== "date" ||
        sortOrder !== "desc";

    return (
        <div className="space-y-6 animate-fade-in">
            <EventDialog
                open={showEventDialog}
                onOpenChange={setShowEventDialog}
                editingEvent={editingEvent}
                onEventCreated={handleEventSave}
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200">My Events</h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage and organize your events ({filteredEvents.length} of {events.length} shown)
                        </p>
                    </div>
                </div>
                {(user?.role === "ADMIN" || user?.role === "ORGANIZER") && (
                    <button
                        onClick={handleCreateEventClick}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Create New Event</span>
                    </button>
                )}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search Events</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, description, location..."
                                value={eventSearchQuery}
                                onChange={(e) => setEventSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 dark:text-gray-200"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                        >
                            <option value="all">All Categories</option>
                            {categories.map((category) => (
                                <option key={category.id || category.name} value={category.slug || category.name}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</label>
                        <select
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                        >
                            <option value="all">All Dates</option>
                            <option value="today">Today</option>
                            <option value="week">Next 7 Days</option>
                            <option value="month">Next 30 Days</option>
                            <option value="future">Future Events</option>
                            <option value="past">Past Events</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort By</label>
                        <div className="flex gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                            >
                                <option value="date">Date</option>
                                <option value="name">Name</option>
                                <option value="capacity">Capacity</option>
                                <option value="attendees">Attendees</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium transition-colors"
                                title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
                            >
                                {sortOrder === "asc" ? "↑" : "↓"}
                            </button>
                        </div>
                    </div>
                </div>
                {hasActiveFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={clearAllFilters}
                            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center gap-2"
                        >
                            <X className="h-4 w-4" />
                            Clear all filters
                        </button>
                    </div>
                )}
                {hasActiveFilters && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {eventSearchQuery && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-md">
                                Search: "{eventSearchQuery}"
                                <button
                                    onClick={() => setEventSearchQuery("")}
                                    className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {filterCategory !== "all" && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-md">
                                Category: {categories.find(cat => (cat.slug || cat.name) === filterCategory)?.name || filterCategory}
                                <button
                                    onClick={() => setFilterCategory("all")}
                                    className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {filterCapacity !== "all" && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-md">
                                Size: {filterCapacity === "small" ? "≤50 people" : 
                                       filterCapacity === "medium" ? "51-200 people" : 
                                       filterCapacity === "large" ? "200+ people" : 
                                       "Unlimited"}
                                <button
                                    onClick={() => setFilterCapacity("all")}
                                    className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {filterDate !== "all" && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded-md">
                                Date: {filterDate === "week" ? "Next 7 Days" : filterDate === "month" ? "Next 30 Days" : filterDate}
                                <button
                                    onClick={() => setFilterDate("all")}
                                    className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => (
                        <Card key={event.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-gray-900/25 transition-all duration-200 group">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                                        {event.name}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        {event.max_attendees && (
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                {event.current_attendees || 0}/{event.max_attendees}
                                            </span>
                                        )}
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full
                                            ${event.status === 'Active' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                                              event.status === 'Upcoming' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                                              event.status === 'Completed' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                                              'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                                            {event.status}
                                        </span>
                                    </div>
                                </div>
                                <CardDescription className="text-gray-600 dark:text-gray-400 mb-3">
                                    {event.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {/* Compact info display similar to your image */}
                                <div className="space-y-2 text-sm mb-4">
                                    {/* Date */}
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <Calendar className="h-4 w-4" />
                                        <span>Date:</span>
                                        <span className="text-gray-800 dark:text-gray-200 ml-auto">
                                            {new Date(event.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    
                                    {/* Organizer */}
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <User className="h-4 w-4" />
                                        <span>Organizer:</span>
                                        <span className="text-gray-800 dark:text-gray-200 ml-auto">
                                            {event.full_name}
                                        </span>
                                    </div>
                                    
                                    {/* Company */}
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <Building className="h-4 w-4" />
                                        <span>Company:</span>
                                        <span className="text-gray-800 dark:text-gray-200 ml-auto">
                                            {event.company_name}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Action buttons */}
                                <div className="flex gap-2">
                                    {(user?.role === "ADMIN" || user?.role === "ORGANIZER") && (
                                        <button
                                            onClick={() => handleEditEventClick(event)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-600 hover:to-[#0ea372] text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                                        >
                                            <Edit className="h-4 w-4" />
                                            Manage
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleViewEventClick(event)}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                                    >
                                        <Eye className="h-4 w-4" />
                                        View
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No events found</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {hasActiveFilters
                                ? "Try adjusting your filters to find more events."
                                : "Create your first event to get started."}
                        </p>
                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                className="mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

  const renderActiveTab = () => {
    switch (activeTab) {
      case "overview":
        return <Overview />;
      case "tickets":
        if (user && (user.role === "ADMIN" || user.role === "ORGANIZER")) {
          return <Tickets />;
        }
        return <UnauthorizedAccess />;
      case "scanner":
        if (user && (user.role === "ADMIN" || user.role === "ORGANIZER" || user.role === "SECURITY")) {
          return <QRScanner />;
        }
        return <UnauthorizedAccess />;
      case "events":
        if (user && (user.role === "ADMIN" || user.role === "ORGANIZER")) {
          return <MyEventsComponent />;
        }
        return <UnauthorizedAccess />;
      case "organizers":
        if (user && (user.role === "ADMIN" || user.role === "ORGANIZER")) {
          return <ManageOrganizersPage />;
        }
        return <UnauthorizedAccess />;
      case "profile":
        return <UserProfile />;
      case "admin":
        if (user && user.role === "ADMIN") {
          return <Admin />;
        }
        return <UnauthorizedAccess />;
      default:
        return <Overview />;
    }
  };

  const UnauthorizedAccess = () => (
    <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
      <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
      <p>You do not have permission to view this section.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Navbar />
      <main className="pt-16">
        <div className="flex relative">
          {isMobile && (
            <button
              id="mobile-menu-btn"
              onClick={toggleMobileMenu}
              className="fixed top-20 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          {isMobile && mobileMenuOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" />
          )}
          <div
            className={`
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
              {(!sidebarCollapsed || isMobile) && (
                <div className="mt-4 relative animate-fade-in">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 dark:text-gray-200"
                  />
                </div>
              )}
            </div>
            <nav className="p-2 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto h-full pb-20">
              {filteredMenuItems.map((item) => {
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
                    {sidebarCollapsed && !isMobile && (
                      <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {item.name}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 border-4 border-transparent border-r-gray-800"></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>
            {(!sidebarCollapsed || isMobile) && (user?.role === "ADMIN" || user?.role === "ORGANIZER" || user?.role === "SECURITY" || user?.role === "ATTENDEE") && (
              <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3 sm:px-4">
                  Quick Actions
                </h3>
                <div className="space-y-1 sm:space-y-2">
                  {(user?.role === "ADMIN" || user?.role === "ORGANIZER") && (
                    <button
                      onClick={handleCreateEventClick}
                      className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-gray-800 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900 hover:text-green-600 dark:hover:text-green-400 rounded-lg transition-all duration-200 group"
                    >
                      <Plus className="h-4 w-4 group-hover:scale-110 transition-transform duration-200 flex-shrink-0" />
                      <span className="truncate">Create Event</span>
                    </button>
                  )}
                  <button className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-gray-800 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition-all duration-200 group">
                    <Bell className="h-4 w-4 group-hover:scale-110 transition-transform duration-200 flex-shrink-0" />
                    <span className="truncate">Notifications</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className={`flex-1 transition-all duration-300 ${
            isMobile ? 'w-full' : sidebarCollapsed ? 'ml-0' : 'ml-0'
          }`}>
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
                <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>Dashboard</span>
                  <ChevronRight className="h-4 w-4" />
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{activeMenuItem?.name}</span>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-12rem)]">
              <div className="animate-fade-in">
                {user ? (
                  renderActiveTab()
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
        body {
          overflow-x: hidden;
        }
        @media (max-width: 768px) {
          .transition-transform {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
        }
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
