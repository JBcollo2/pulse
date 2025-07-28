import React, { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, Clock, CreditCard, Filter, Users, TrendingUp, Eye } from 'lucide-react';

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

const Tickets = () => {
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'events' | 'my_tickets'>('events');

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

  const getDisplayData = () => {
    if (!ticketData) return [];
    
    let dataToDisplay: EventTicket[] = [];
    
    if (viewMode === 'my_tickets') {
      dataToDisplay = ticketData.my_tickets || [];
    } else {
      // For events view
      if (ticketData.role === 'admin' && ticketData.all_events_tickets) {
        dataToDisplay = ticketData.all_events_tickets;
      } else if (ticketData.role === 'organizer' && ticketData.my_events_tickets) {
        dataToDisplay = ticketData.my_events_tickets;
      } else {
        dataToDisplay = ticketData.my_tickets || [];
      }
    }

    // Filter data based on search and status
    return dataToDisplay.filter(event => {
      const matchesSearch = event.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.ticket_types.some(tt => tt.ticket_type.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (statusFilter === 'all') return matchesSearch;
      
      const hasMatchingStatus = event.ticket_types.some(tt => 
        tt.status?.toLowerCase() === statusFilter.toLowerCase()
      );
      
      return matchesSearch && hasMatchingStatus;
    });
  };

  const getStatsData = () => {
    if (!ticketData) return { totalTickets: 0, paidTickets: 0, totalRevenue: 0 };

    let totalTickets = 0;
    let paidTickets = 0;
    let totalRevenue = 0;

    const dataToAnalyze = ticketData.role === 'admin' && ticketData.all_events_tickets 
      ? ticketData.all_events_tickets
      : ticketData.role === 'organizer' && ticketData.my_events_tickets
      ? ticketData.my_events_tickets
      : ticketData.my_tickets;

    dataToAnalyze?.forEach(event => {
      event.ticket_types.forEach(tt => {
        if (ticketData.role === 'attendee') {
          totalTickets += tt.quantity_purchased || 0;
          if (tt.status === 'paid') {
            paidTickets += tt.quantity_purchased || 0;
            totalRevenue += tt.total_amount || 0;
          }
        } else {
          totalTickets += tt.total_quantity || 0;
          paidTickets += tt.total_quantity || 0; // Only paid tickets are returned for admin/organizer
          totalRevenue += tt.revenue || 0;
        }
      });
    });

    return { totalTickets, paidTickets, totalRevenue };
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

  const displayData = getDisplayData();
  const stats = getStatsData();
  const flattenedTickets = displayData.flatMap(event => 
    event.ticket_types.map(tt => ({
      ...tt,
      event_name: event.event_name,
      date: event.date,
      time: event.time,
      location: event.location
    }))
  );

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
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* View Mode Toggle for Admin/Organizer */}
            {(ticketData?.role === 'admin' || ticketData?.role === 'organizer') && (
              <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-1">
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

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by event, location, or ticket type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full sm:w-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none transition-colors duration-200"
              />
            </div>
            
            {ticketData?.role === 'attendee' && (
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none transition-colors duration-200 appearance-none cursor-pointer min-w-32"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
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
              </div>
              <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Events Display */}
        <div className="space-y-6">
          {displayData.map((event) => (
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
        
        {displayData.length === 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-2">
                <CreditCard className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">No tickets found</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                {searchTerm ? 'Try adjusting your search terms' : 
                 ticketData?.role === 'attendee' ? 'No tickets have been purchased yet' :
                 'No ticket sales data available'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tickets;