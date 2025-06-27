import React, { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, Clock, CreditCard, Filter } from 'lucide-react';

interface Ticket {
  ticket_id: number;
  event: string;
  date: string;
  time: string;
  location: string;
  ticket_type: string;
  quantity: number;
  price: number;
  status: string;
  purchase_date: string;
}

const Tickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/tickets`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch tickets');
        const data = await response.json();
        setTickets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const handleExport = () => {
    // Export functionality
    console.log('Exporting tickets...');
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticket_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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
              Manage and track your event tickets
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
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
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tickets.length}</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {tickets.filter(t => t.status === 'paid').length}
                </p>
              </div>
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  KES {tickets.filter(t => t.status === 'paid').reduce((sum, t) => sum + (t.price * t.quantity), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full">
                <MapPin className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-200">
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Ticket Sales Summary
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {filteredTickets.length} of {tickets.length} tickets shown
              {statusFilter !== 'all' && (
                <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-xs">
                  {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} only
                </span>
              )}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Ticket ID</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Event</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Date & Time</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Location</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Type</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Qty</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Price</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Purchased</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr 
                    key={ticket.ticket_id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150"
                  >
                    <td className="py-4 px-6 font-medium text-gray-900 dark:text-gray-100">
                      #{ticket.ticket_id}
                    </td>
                    <td className="py-4 px-6 text-gray-900 dark:text-gray-200 font-medium">
                      {ticket.event}
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-400">
                      <div className="flex flex-col space-y-1">
                        <span className="flex items-center text-sm">
                          <Calendar className="h-3 w-3 mr-1" />
                          {ticket.date ? new Date(ticket.date).toLocaleDateString() : '-'}
                        </span>
                        <span className="flex items-center text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {ticket.time}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-400">
                      <span className="flex items-center text-sm">
                        <MapPin className="h-3 w-3 mr-1" />
                        {ticket.location}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-900 dark:text-gray-200 text-sm">
                      {ticket.ticket_type}
                    </td>
                    <td className="py-4 px-6 text-gray-900 dark:text-gray-200 font-medium">
                      {ticket.quantity}
                    </td>
                    <td className="py-4 px-6 text-gray-900 dark:text-gray-200 font-semibold">
                      KES {ticket.price.toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-400 text-sm">
                      {ticket.purchase_date ? new Date(ticket.purchase_date).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredTickets.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-2">
                <CreditCard className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">No tickets found</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                {searchTerm ? 'Try adjusting your search terms' : 'No tickets have been purchased yet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tickets;