import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Custom Table components since @/components/ui/table is not available
const Table = ({ children, ...props }) => (
  <div className="w-full overflow-auto">
    <table className="w-full caption-bottom text-sm" {...props}>
      {children}
    </table>
  </div>
);

const TableHeader = ({ children, ...props }) => (
  <thead {...props}>{children}</thead>
);

const TableBody = ({ children, ...props }) => (
  <tbody {...props}>{children}</tbody>
);

const TableRow = ({ children, className = "", ...props }) => (
  <tr className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className}`} {...props}>
    {children}
  </tr>
);

const TableHead = ({ children, className = "", ...props }) => (
  <th className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`} {...props}>
    {children}
  </th>
);

const TableCell = ({ children, className = "", ...props }) => (
  <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`} {...props}>
    {children}
  </td>
);
import { Search, Download, Filter, Calendar, MapPin, Clock } from 'lucide-react';

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
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
             (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        // Simulated data for demo purposes
        const mockData: Ticket[] = [
          {
            ticket_id: 1001,
            event: "Tech Conference 2025",
            date: "2025-07-15",
            time: "09:00",
            location: "Nairobi Convention Centre",
            ticket_type: "VIP",
            quantity: 2,
            price: 15000,
            status: "paid",
            purchase_date: "2025-06-01T10:30:00Z"
          },
          {
            ticket_id: 1002,
            event: "Music Festival",
            date: "2025-08-20",
            time: "18:00",
            location: "Uhuru Gardens",
            ticket_type: "General",
            quantity: 4,
            price: 3500,
            status: "pending",
            purchase_date: "2025-06-15T14:45:00Z"
          },
          {
            ticket_id: 1003,
            event: "Art Exhibition",
            date: "2025-07-30",
            time: "10:00",
            location: "National Museum",
            ticket_type: "Student",
            quantity: 1,
            price: 800,
            status: "paid",
            purchase_date: "2025-06-20T09:15:00Z"
          }
        ];
        
        setTimeout(() => {
          setTickets(mockData);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', darkMode.toString());
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleRefund = async (ticketId: number) => {
    try {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setTickets(tickets.filter(ticket => ticket.ticket_id !== ticketId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticket_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || ticket.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const totalRevenue = tickets.reduce((sum, ticket) => sum + (ticket.price * ticket.quantity), 0);
  const totalTickets = tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);

  if (loading) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading tickets...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg p-6">
                <h3 className="text-red-800 dark:text-red-400 font-semibold mb-2">Error Loading Tickets</h3>
                <p className="text-red-600 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Ticket Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage and track your event tickets
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Dark mode toggle removed - implemented elsewhere */}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalTickets}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      KES {totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <Download className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Events</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {new Set(tickets.map(t => t.event)).size}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    placeholder="Search by event, location, or ticket type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <Button 
                  variant="outline"
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tickets Table */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="text-gray-900 dark:text-gray-100">
                Ticket Sales ({filteredTickets.length} tickets)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-gray-700/50">
                    <TableRow className="border-b border-gray-200 dark:border-gray-700">
                      <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">ID</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Event</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Date & Time
                        </div>
                      </TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          Location
                        </div>
                      </TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Type</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Qty</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Price</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Status</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Purchase Date</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => (
                      <TableRow 
                        key={ticket.ticket_id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                          #{ticket.ticket_id}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-100 font-medium">
                          {ticket.event}
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400">
                          <div className="flex flex-col">
                            <span>{ticket.date ? new Date(ticket.date).toLocaleDateString() : '-'}</span>
                            <span className="text-sm flex items-center gap-1 text-gray-500 dark:text-gray-500">
                              <Clock className="h-3 w-3" />
                              {ticket.time}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400">
                          {ticket.location}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-xs font-medium">
                            {ticket.ticket_type}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400">
                          {ticket.quantity}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                          KES {ticket.price.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400 text-sm">
                          {ticket.purchase_date ? new Date(ticket.purchase_date).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRefund(ticket.ticket_id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Refund
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {filteredTickets.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-500 dark:text-gray-400">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No tickets found</p>
                    <p className="text-sm">Try adjusting your search or filter criteria</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Tickets;