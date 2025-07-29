import React, { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, MapPin, Clock, CreditCard, Filter, Users, TrendingUp, Eye, ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';

interface TicketType {
  ticket_type_id: number;
  ticket_type: string;
  price: number;
  tickets_sold?: number;
  total_quantity?: number;
  quantity_purchased?: number;
  tickets_count?: number;
  revenue?: number;
  status?: string;
  purchase_date?: string;
  total_amount?: number;
}

interface EventTicket {
  event_id: number;
  event_name: string;
  date: string | null;
  time?: string | null;
  location: string;
  ticket_types: TicketType[];
  total_tickets_sold?: number;
}

interface TicketData {
  role: 'admin' | 'organizer' | 'attendee';
  all_events_tickets?: EventTicket[];
  my_events_tickets?: EventTicket[];
  my_tickets: EventTicket[];
}

interface FilterState {
  dateRange: string;
  location: string;
  priceRange: string;
  ticketsSoldRange: string;
  revenueRange: string;
}

const Tickets = () => {
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'events' | 'my_tickets'>('events');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'all',
    location: 'all',
    priceRange: 'all',
    ticketsSoldRange: 'all',
    revenueRange: 'all'
  });

  // Sorting
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'tickets_sold' | 'revenue'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/tickets`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch tickets');
        const data = await response.json();
        setTicketData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  // Get unique locations for filter dropdown
  const uniqueLocations = useMemo(() => {
    if (!ticketData) return [];
    const dataToAnalyze = getDataSource();
    const locations = [...new Set(dataToAnalyze.map(event => event.location))];
    return locations.sort();
  }, [ticketData, viewMode]);

  const getDataSource = () => {
    if (!ticketData) return [];
    
    if (viewMode === 'my_tickets') {
      return ticketData.my_tickets || [];
    } else {
      if (ticketData.role === 'admin' && ticketData.all_events_tickets) {
        return ticketData.all_events_tickets;
      } else if (ticketData.role === 'organizer' && ticketData.my_events_tickets) {
        return ticketData.my_events_tickets;
      } else {
        return ticketData.my_tickets || [];
      }
    }
  };

  const getFilteredAndSortedData = useMemo(() => {
    const dataSource = getDataSource();
    
    // Apply basic search filter
    let filtered = dataSource.filter(event => {
      const matchesSearch = event.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.ticket_types.some(tt => tt.ticket_type.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (statusFilter !== 'all') {
        const hasMatchingStatus = event.ticket_types.some(tt => 
          tt.status?.toLowerCase() === statusFilter.toLowerCase()
        );
        return matchesSearch && hasMatchingStatus;
      }
      
      return matchesSearch;
    });

    // Apply advanced filters
    filtered = filtered.filter(event => {
      // Date range filter
      if (filters.dateRange !== 'all' && event.date) {
        const eventDate = new Date(event.date);
        const now = new Date();
        const daysDiff = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (filters.dateRange) {
          case 'upcoming':
            if (daysDiff < 0) return false;
            break;
          case 'this_week':
            if (daysDiff < 0 || daysDiff > 7) return false;
            break;
          case 'this_month':
            if (daysDiff < 0 || daysDiff > 30) return false;
            break;
          case 'past':
            if (daysDiff >= 0) return false;
            break;
        }
      }

      // Location filter
      if (filters.location !== 'all' && event.location !== filters.location) {
        return false;
      }

      // Revenue range filter (for admin/organizer)
      if (filters.revenueRange !== 'all' && ticketData?.role !== 'attendee') {
        const totalRevenue = event.ticket_types.reduce((sum, tt) => sum + (tt.revenue || 0), 0);
        switch (filters.revenueRange) {
          case 'low':
            if (totalRevenue >= 50000) return false;
            break;
          case 'medium':
            if (totalRevenue < 50000 || totalRevenue >= 200000) return false;
            break;
          case 'high':
            if (totalRevenue < 200000) return false;
            break;
        }
      }

      // Tickets sold range filter (for admin/organizer)
      if (filters.ticketsSoldRange !== 'all' && ticketData?.role !== 'attendee') {
        const totalSold = event.ticket_types.reduce((sum, tt) => sum + (tt.total_quantity || tt.tickets_sold || 0), 0);
        switch (filters.ticketsSoldRange) {
          case 'low':
            if (totalSold >= 50) return false;
            break;
          case 'medium':
            if (totalSold < 50 || totalSold >= 200) return false;
            break;
          case 'high':
            if (totalSold < 200) return false;
            break;
        }
      }

      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = a.date ? new Date(a.date).getTime() : 0;
          bValue = b.date ? new Date(b.date).getTime() : 0;
          break;
        case 'name':
          aValue = a.event_name.toLowerCase();
          bValue = b.event_name.toLowerCase();
          break;
        case 'tickets_sold':
          aValue = a.ticket_types.reduce((sum, tt) => sum + (tt.total_quantity || tt.tickets_sold || 0), 0);
          bValue = b.ticket_types.reduce((sum, tt) => sum + (tt.total_quantity || tt.tickets_sold || 0), 0);
          break;
        case 'revenue':
          aValue = a.ticket_types.reduce((sum, tt) => sum + (tt.revenue || 0), 0);
          bValue = b.ticket_types.reduce((sum, tt) => sum + (tt.revenue || 0), 0);
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [ticketData, searchTerm, statusFilter, viewMode, filters, sortBy, sortOrder]);

  // Pagination calculations
  const totalItems = getFilteredAndSortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = getFilteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, filters, sortBy, sortOrder]);

  const getStatsData = () => {
    if (!ticketData) return { totalTickets: 0, paidTickets: 0, totalRevenue: 0 };

    let totalTickets = 0;
    let paidTickets = 0;
    let totalRevenue = 0;

    const dataToAnalyze = getFilteredAndSortedData;

    dataToAnalyze.forEach(event => {
      event.ticket_types.forEach(tt => {
        if (ticketData.role === 'attendee') {
          totalTickets += tt.quantity_purchased || 0;
          if (tt.status === 'paid') {
            paidTickets += tt.quantity_purchased || 0;
            totalRevenue += tt.total_amount || 0;
          }
        } else {
          totalTickets += tt.total_quantity || 0;
          paidTickets += tt.total_quantity || 0;
          totalRevenue += tt.revenue || 0;
        }
      });
    });

    return { totalTickets, paidTickets, totalRevenue };
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setFilters({
      dateRange: 'all',
      location: 'all',
      priceRange: 'all',
      ticketsSoldRange: 'all',
      revenueRange: 'all'
    });
    setSortBy('date');
    setSortOrder('desc');
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading tickets...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 dark:text-red-400">
              <span>Error: {error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = getStatsData();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Tickets
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {ticketData?.role === 'admin' ? 'Manage all event tickets' :
               ticketData?.role === 'organizer' ? 'Manage your event tickets' :
               'View your purchased tickets'}
              <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-xs capitalize">
                {ticketData?.role}
              </span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} events
            </p>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* View Mode Toggle for Admin/Organizer */}
            {(ticketData?.role === 'admin' || ticketData?.role === 'organizer') && (
              <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-1">
                <button
                  onClick={() => setViewMode('events')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'events'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Eye className="h-4 w-4 inline mr-1" />
                  {ticketData?.role === 'admin' ? 'All Events' : 'My Events'}
                </button>
                <button
                  onClick={() => setViewMode('my_tickets')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'my_tickets'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <CreditCard className="h-4 w-4 inline mr-1" />
                  My Tickets
                </button>
              </div>
            )}

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              <input
                type="text"
                placeholder="Search events, locations, or ticket types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none transition-colors duration-200"
              />
            </div>

            {/* Sort */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                {ticketData?.role !== 'attendee' && (
                  <>
                    <option value="tickets_sold">Sort by Tickets Sold</option>
                    <option value="revenue">Sort by Revenue</option>
                  </>
                )}
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                showAdvancedFilters
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>

            {/* Items per page */}
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="all">All Dates</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="this_week">This Week</option>
                    <option value="this_month">This Month</option>
                    <option value="past">Past Events</option>
                  </select>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <select
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="all">All Locations</option>
                    {uniqueLocations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>

                {/* Tickets Sold Range (Admin/Organizer only) */}
                {ticketData?.role !== 'attendee' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tickets Sold
                    </label>
                    <select
                      value={filters.ticketsSoldRange}
                      onChange={(e) => setFilters(prev => ({ ...prev, ticketsSoldRange: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 text-sm"
                    >
                      <option value="all">All Ranges</option>
                      <option value="low">1-49 tickets</option>
                      <option value="medium">50-199 tickets</option>
                      <option value="high">200+ tickets</option>
                    </select>
                  </div>
                )}

                {/* Revenue Range (Admin/Organizer only) */}
                {ticketData?.role !== 'attendee' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Revenue
                    </label>
                    <select
                      value={filters.revenueRange}
                      onChange={(e) => setFilters(prev => ({ ...prev, revenueRange: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 text-sm"
                    >
                      <option value="all">All Ranges</option>
                      <option value="low">Below KES 50,000</option>
                      <option value="medium">KES 50,000 - 200,000</option>
                      <option value="high">Above KES 200,000</option>
                    </select>
                  </div>
                )}

                {/* Status Filter (Attendee only) */}
                {ticketData?.role === 'attendee' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Clear Filters */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {ticketData?.role === 'attendee' ? 'My Tickets' : 'Total Tickets'}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalTickets}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  From {totalItems} events
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid Tickets</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.paidTickets}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {stats.totalTickets > 0 ? Math.round((stats.paidTickets / stats.totalTickets) * 100) : 0}% completion rate
                </p>
              </div>
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full">
                <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {ticketData?.role === 'attendee' ? 'Total Spent' : 'Total Revenue'}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  KES {stats.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Avg: KES {totalItems > 0 ? Math.round(stats.totalRevenue / totalItems).toLocaleString() : 0} per event
                </p>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Events Display */}
        <div className="space-y-6">
          {paginatedData.map((event) => (
            <div key={event.event_id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-200">
              <div className="border-b border-gray-200 dark:border-gray-700 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {event.event_name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {event.date && (
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                      )}
                      {event.time && (
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {event.time}
                        </span>
                      )}
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {event.location}
                      </span>
                    </div>
                  </div>
                  {event.total_tickets_sold && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Sold</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {event.total_tickets_sold}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Ticket Type</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Price</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {ticketData?.role === 'attendee' ? 'Quantity' : 'Sold'}
                      </th>
                      {ticketData?.role === 'attendee' && (
                        <>
                          <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                          <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Purchase Date</th>
                        </>
                      )}
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {ticketData?.role === 'attendee' ? 'Total' : 'Revenue'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {event.ticket_types.map((ticketType, index) => (
                      <tr 
                        key={`${event.event_id}-${ticketType.ticket_type_id || index}`}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150"
                      >
                        <td className="py-4 px-6 font-medium text-gray-900 dark:text-gray-100">
                          {ticketType.ticket_type}
                        </td>
                        <td className="py-4 px-6 text-gray-900 dark:text-gray-200 font-semibold">
                          KES {ticketType.price.toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-gray-900 dark:text-gray-200 font-medium">
                          {ticketData?.role === 'attendee' 
                            ? ticketType.quantity_purchased 
                            : ticketType.total_quantity || ticketType.tickets_sold}
                        </td>
                        {ticketData?.role === 'attendee' && (
                          <>
                            <td className="py-4 px-6">
                              {ticketType.status && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticketType.status)}`}>
                                  {ticketType.status.charAt(0).toUpperCase() + ticketType.status.slice(1)}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-gray-600 dark:text-gray-400 text-sm">
                              {ticketType.purchase_date 
                                ? new Date(ticketType.purchase_date).toLocaleDateString()
                                : '-'}
                            </td>
                          </>
                        )}
                        <td className="py-4 px-6 text-gray-900 dark:text-gray-200 font-bold">
                          KES {(ticketType.revenue || ticketType.total_amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} events
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Quick page jump */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600 dark:text-gray-400">Go to page:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1));
                    setCurrentPage(page);
                  }}
                  className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center"
                />
                <span className="text-gray-600 dark:text-gray-400">of {totalPages}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {paginatedData.length === 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-2">
                <CreditCard className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">No events found</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                {searchTerm || Object.values(filters).some(f => f !== 'all') ? 
                  'Try adjusting your search terms or filters' : 
                  ticketData?.role === 'attendee' ? 'No tickets have been purchased yet' :
                  'No ticket sales data available'}
              </p>
              {(searchTerm || Object.values(filters).some(f => f !== 'all')) && (
                <button
                  onClick={clearAllFilters}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tickets;