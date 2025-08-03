import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useAuth, hasTabPermission } from '@/contexts/AuthContext';
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
  Loader2,
  Filter,
  CalendarDays,
  MapPin,
} from 'lucide-react';
import Overview from './Overview';
import Tickets from './Tickets';
import QRScanner from './QRScanner';
import UserProfile from './UserProfile';
import Admin from './Admin';
import ManageOrganizersPage from './Manage_organizer';
import { useToast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const hasInitializedRef = useRef(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const { toast } = useToast();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [pageSize, setPageSize] = useState(12);

  // Updated state variables for new filtering system
  const [eventSearchQuery, setEventSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("upcoming");
  const [locationFilter, setLocationFilter] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("asc");

  // Dashboard-specific advanced filters
  const [organizerCompanyFilter, setOrganizerCompanyFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  // Available filter options from API
  const [availableFilters, setAvailableFilters] = useState({
    categories: [],
    time_filters: [],
    organizers: [],
    sort_options: [],
    date_range: {
      min_date: "",
      max_date: ""
    }
  });

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;
  }, []);

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

  const fetchEvents = async (page = 1, resetPage = false) => {
    if (!user) return;
    try {
      setEventsLoading(true);
      const targetPage = resetPage ? 1 : page;

      const params = new URLSearchParams({
        page: targetPage.toString(),
        per_page: pageSize.toString(),
        dashboard: 'true',
        sort_by: sortBy,
        sort_order: sortOrder,
        time_filter: timeFilter
      });

      if (eventSearchQuery.trim()) {
        params.append('search', eventSearchQuery.trim());
      }

      if (categoryFilter && categoryFilter.trim() !== "") {
        params.append('category_id', categoryFilter.trim());
      }

      if (locationFilter.trim()) {
        params.append('location', locationFilter.trim());
      }

      if (featuredOnly) {
        params.append('featured', 'true');
      }

      if (organizerCompanyFilter.trim()) {
        params.append('organizer_company', organizerCompanyFilter.trim());
      }

      if (startDateFilter) {
        params.append('start_date', startDateFilter);
      }

      if (endDateFilter) {
        params.append('end_date', endDateFilter);
      }

      const url = `${import.meta.env.VITE_API_URL}/events?${params.toString()}`;

      const response = await fetch(url, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();

      setEvents(data.events || []);
      setTotalPages(data.pages || 1);
      setTotalEvents(data.total || 0);
      setCurrentPage(targetPage);

      if (data.available_filters) {
        setAvailableFilters(data.available_filters);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive"
      });
      setEvents([]);
      setTotalPages(1);
      setTotalEvents(0);
      setCurrentPage(1);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents(1, true);
    }
  }, [
    user,
    eventSearchQuery,
    categoryFilter,
    timeFilter,
    locationFilter,
    featuredOnly,
    organizerCompanyFilter,
    startDateFilter,
    endDateFilter,
    sortBy,
    sortOrder,
    pageSize
  ]);

  useEffect(() => {
    if (currentPage > 1 && user && !eventsLoading) {
      fetchEvents(currentPage, false);
    }
  }, [currentPage]);

  const allMenuItems = [
   {
    id: "general-overview",
    name: "General Overview",
    icon: BarChart,
    description: "Go to comprehensive dashboard analytics and system insights",
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
    if (!loading && user && user.role) {
      const tabFromUrl = searchParams.get('tab');
      let targetTab = activeTab;
      if (tabFromUrl) {
        if (hasTabPermission(user.role, tabFromUrl)) {
          targetTab = tabFromUrl;
        } else {
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('tab');
          setSearchParams(newSearchParams, { replace: true });
        }
      }
      if (!targetTab || !hasTabPermission(user.role, targetTab)) {
        const roleBasedDefaults = {
          'ADMIN': 'admin',
          'ORGANIZER': 'events',
          'SECURITY': 'scanner',
          'ATTENDEE': 'overview'
        };
        const defaultTab = roleBasedDefaults[user.role] || 'overview';
        const isAccessible = allMenuItems.find(item =>
          item.id === defaultTab && item.roles.includes(user.role)
        );
        if (isAccessible) {
          targetTab = defaultTab;
        } else {
          const firstAccessibleTab = allMenuItems.find(item =>
            item.roles.includes(user.role)
          );
          targetTab = firstAccessibleTab?.id || "overview";
        }
      }
      if (targetTab !== activeTab) {
        setActiveTab(targetTab);
      }
      const currentUrlTab = searchParams.get('tab');
      if (currentUrlTab !== targetTab) {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('tab', targetTab);
        setSearchParams(newSearchParams, { replace: true });
      }
    }
  }, [user, loading, searchParams, setSearchParams, activeTab, allMenuItems]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && mobileMenuOpen) {
        const sidebar = document.getElementById('mobile-sidebar');
        const menuButton = document.getElementById('mobile-menu-btn');
        if (sidebar && !sidebar.contains(event.target) && menuButton && !menuButton.contains(event.target)) {
          setMobileMenuOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, mobileMenuOpen]);

  useEffect(() => {
    const handleAuthStateChange = (event) => {
      if (event.detail && event.detail.action === 'logout') {
        setActiveTab('overview');
        const newSearchParams = new URLSearchParams();
        setSearchParams(newSearchParams, { replace: true });
      } else if (event.detail && event.detail.action === 'login' && event.detail.user) {
        const user = event.detail.user;
        const roleDefaults = {
          'ADMIN': 'admin',
          'ORGANIZER': 'events',
          'SECURITY': 'scanner',
          'ATTENDEE': 'overview'
        };
        const defaultTab = roleDefaults[user.role] || 'overview';
        const isAccessible = allMenuItems.find(item =>
          item.id === defaultTab && item.roles.includes(user.role)
        );
        const targetTab = isAccessible ? defaultTab : 'overview';
        setActiveTab(targetTab);
        const newSearchParams = new URLSearchParams();
        newSearchParams.set('tab', targetTab);
        setSearchParams(newSearchParams, { replace: true });
      }
    };
    window.addEventListener('auth-state-changed', handleAuthStateChange);
    return () => window.removeEventListener('auth-state-changed', handleAuthStateChange);
  }, [setSearchParams, allMenuItems]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-700 dark:text-gray-300">Loading dashboard...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Preparing your personalized experience
          </p>
        </div>
      </div>
    );
  }

  if (!loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Authentication Required
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please log in to access the dashboard.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const menuItemsForUser = user && !loading
    ? allMenuItems.filter(item => hasTabPermission(user.role, item.id))
    : [];

  const filteredMenuItems = menuItemsForUser.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeMenuItem = menuItemsForUser.find(item => item.id === activeTab);

  const handleTabChange = (tabId) => {
    if (user && !hasTabPermission(user.role, tabId)) {
      if (toast) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this section.",
          variant: "destructive"
        });
      }
      return;
    }
    setActiveTab(tabId);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', tabId);
    setSearchParams(newSearchParams, { replace: true });
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
      fetchEvents(currentPage);
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

      fetchEvents(currentPage);

      toast({
        title: "Success",
        description: "Event deleted successfully",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive"
      });
    }
  };

  const clearAllFilters = () => {
    setEventSearchQuery("");
    setCategoryFilter("");
    setTimeFilter("upcoming");
    setLocationFilter("");
    setFeaturedOnly(false);
    setOrganizerCompanyFilter("");
    setStartDateFilter("");
    setEndDateFilter("");
    setSortBy("date");
    setSortOrder("asc");
    setCurrentPage(1);
    setTimeout(() => {
      if (user) {
        fetchEvents(1, true);
      }
    }, 0);
  };

  const hasActiveFilters = eventSearchQuery !== "" ||
    categoryFilter !== "" ||
    timeFilter !== "upcoming" ||
    locationFilter !== "" ||
    featuredOnly ||
    organizerCompanyFilter !== "" ||
    startDateFilter !== "" ||
    endDateFilter !== "" ||
    sortBy !== "date" ||
    sortOrder !== "asc";

  const PaginationControls = () => {
    const getPageNumbers = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];
      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
      }
      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }
      rangeWithDots.push(...range);
      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }
      return rangeWithDots;
    };

    if (totalPages <= 1) return null;

    const handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage && !eventsLoading) {
        setCurrentPage(newPage);
      }
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalEvents)} of {totalEvents} events
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || eventsLoading}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && handlePageChange(page)}
                disabled={page === '...' || eventsLoading || page === currentPage}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  page === currentPage
                    ? 'bg-blue-500 text-white'
                    : page === '...'
                    ? 'cursor-default'
                    : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || eventsLoading}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700 dark:text-gray-300">Per page:</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            disabled={eventsLoading}
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-50"
          >
            <option value={6}>6</option>
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={48}>48</option>
          </select>
        </div>
      </div>
    );
  };

  const MyEventsComponent = () => {
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
                Manage and organize your events ({events.length} of {totalEvents} shown)
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
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Filters & Search</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search Events</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, description..."
                    value={eventSearchQuery}
                    onChange={(e) => {
                      setEventSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 dark:text-gray-200"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Range</label>
                <select
                  value={timeFilter}
                  onChange={(e) => {
                    setTimeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                >
                  {availableFilters.time_filters?.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  )) || [
                    <option key="upcoming" value="upcoming">Upcoming Events</option>,
                    <option key="today" value="today">Today</option>,
                    <option key="past" value="past">Past Events</option>,
                    <option key="all" value="all">All Events</option>
                  ]}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    const newCategoryFilter = e.target.value;
                    setCategoryFilter(newCategoryFilter);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                >
                  <option value="">All Categories</option>
                  {availableFilters.categories?.map((category) => (
                    <option key={category.id} value={category.id.toString()}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort By</label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                  >
                    {availableFilters.sort_options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    )) || [
                      <option key="date" value="date">Date</option>,
                      <option key="name" value="name">Name</option>,
                      <option key="featured" value="featured">Featured</option>,
                      <option key="created_at" value="created_at">Created</option>
                    ]}
                  </select>
                  <button
                    onClick={() => {
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium transition-colors"
                    title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
                  >
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </button>
                </div>
              </div>
            </div>
            {(user?.role === "ADMIN" || user?.role === "ORGANIZER") && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Advanced Filters</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <input
                        type="text"
                        placeholder="Filter by location..."
                        value={locationFilter}
                        onChange={(e) => {
                          setLocationFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                      />
                    </div>
                  </div>
                  {user?.role === "ADMIN" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Organizer Company</label>
                      <select
                        value={organizerCompanyFilter}
                        onChange={(e) => {
                          setOrganizerCompanyFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                      >
                        <option value="">All Organizers</option>
                        {availableFilters.organizers?.map((organizer) => (
                          <option key={organizer.id} value={organizer.company_name}>
                            {organizer.company_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <input
                        type="date"
                        value={startDateFilter}
                        onChange={(e) => {
                          setStartDateFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        min={availableFilters.date_range?.min_date}
                        max={availableFilters.date_range?.max_date}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <input
                        type="date"
                        value={endDateFilter}
                        onChange={(e) => {
                          setEndDateFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        min={startDateFilter || availableFilters.date_range?.min_date}
                        max={availableFilters.date_range?.max_date}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featuredOnly}
                      onChange={(e) => {
                        setFeaturedOnly(e.target.checked);
                        setCurrentPage(1);
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Featured events only</span>
                  </label>
                </div>
              </div>
            )}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>
                  {eventSearchQuery && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                      Search: {eventSearchQuery}
                    </span>
                  )}
                  {categoryFilter && (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                      Category: {
                        availableFilters.categories?.find(cat => cat.id.toString() === categoryFilter)?.name ||
                        `ID: ${categoryFilter}`
                      }
                    </span>
                  )}
                  {timeFilter !== "upcoming" && (
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded-full">
                      Time: {availableFilters.time_filters?.find(f => f.value === timeFilter)?.label || timeFilter}
                    </span>
                  )}
                  {locationFilter && (
                    <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded-full">
                      Location: {locationFilter}
                    </span>
                  )}
                  {featuredOnly && (
                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded-full">
                      Featured Only
                    </span>
                  )}
                  {organizerCompanyFilter && (
                    <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs rounded-full">
                      Organizer: {organizerCompanyFilter}
                    </span>
                  )}
                  {(startDateFilter || endDateFilter) && (
                    <span className="px-2 py-1 bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 text-xs rounded-full">
                      Date Range: {startDateFilter || 'Start'} - {endDateFilter || 'End'}
                    </span>
                  )}
                </div>
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <X className="h-4 w-4" />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="relative">
          {eventsLoading && (
            <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading events...</span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.length > 0 ? (
              events.map((event) => (
                <Card key={event.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-gray-900/25 transition-all duration-200 group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                        {event.name}
                        {event.featured && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                            ⭐ Featured
                          </span>
                        )}
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
                      {event.description || 'No description available'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>Date:</span>
                        <span className="text-gray-800 dark:text-gray-200 ml-auto">
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <MapPin className="h-4 w-4" />
                          <span>Location:</span>
                          <span className="text-gray-800 dark:text-gray-200 ml-auto truncate">
                            {event.location}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Building className="h-4 w-4" />
                        <span>Company:</span>
                        <span className="text-gray-800 dark:text-gray-200 ml-auto">
                          {event.organizer?.company_name || 'N/A'}
                        </span>
                      </div>
                      {event.category && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <div className="h-4 w-4 rounded-full bg-gradient-to-r from-blue-500 to-[#10b981] shadow-sm ring-1 ring-white/20"></div>
                          <span>Category:</span>
                          <span className="text-gray-800 dark:text-gray-200 ml-auto font-medium">
                            {event.category}
                          </span>
                        </div>
                      )}
                      {event.likes_count !== undefined && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <span>❤️</span>
                          <span>Likes:</span>
                          <span className="text-gray-800 dark:text-gray-200 ml-auto">
                            {event.likes_count}
                          </span>
                        </div>
                      )}
                    </div>
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
        <PaginationControls />
      </div>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "general-overview":
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
