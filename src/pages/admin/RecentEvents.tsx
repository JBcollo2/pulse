import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Ticket, TrendingUp, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Event {
  id: number;
  name: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  image: string;
  organizer_id: number;
  organizer: {
    id: number;
    company_name: string;
    company_description: string;
  };
  tickets: {
    id: number;
    quantity: number;
    payment_status: string;
    ticket_type: {
      price: number;
    };
  }[];
  featured: boolean;
  likes_count: number;
  category: string | null;
}

interface Organizer {
  organizer_id: number;
  name: string;
  email: string;
  phone: string;
  event_count: number;
  report_count: number;
}

interface EventStats {
  totalEvents: number;
  activeEvents: number;
  totalTickets: number;
  totalRevenue: number;
  eventsByMonth: { month: string; count: number }[];
  revenueByEvent: { event_name: string; amount: number }[];
  topOrganizers: { organizer_name: string; revenue: number; event_count: number }[];
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0];
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-md">
        <p className="font-semibold text-gray-800 dark:text-gray-200">{label}</p>
        {dataItem.dataKey === 'amount' || dataItem.dataKey === 'revenue' ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">{`Revenue: KSh ${Number(dataItem.value).toLocaleString()}`}</p>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">{`${dataItem.dataKey}: ${dataItem.value}`}</p>
        )}
      </div>
    );
  }
  return null;
};

// Utility function to calculate statistics
const calculateStats = (events: Event[], organizers: Organizer[]): EventStats => {
  const totalEvents = events.length;
  const activeEvents = events.filter(event => {
    if (!event.date) return false;
    const eventDate = new Date(event.date);
    if (isNaN(eventDate.getTime())) return false;
    return eventDate > new Date();
  }).length;

  const totalTickets = events.reduce((sum, event) => {
    return sum + (event.tickets?.reduce((ticketSum, ticket) =>
      ticket.payment_status === 'paid' ? ticketSum + (ticket.quantity || 0) : ticketSum, 0) || 0);
  }, 0);

  const totalRevenue = events.reduce((sum, event) => {
    return sum + (event.tickets?.reduce((revenueSum, ticket) => {
      if (ticket.payment_status === 'paid') {
        return revenueSum + ((ticket.quantity || 0) * (ticket.ticket_type?.price || 0));
      }
      return revenueSum;
    }, 0) || 0);
  }, 0);

  // Events by month
  const eventsByMonth = events.reduce((acc: Record<string, number>, event) => {
    if (!event.date) return acc;
    const date = new Date(event.date);
    if (isNaN(date.getTime())) return acc;
    const month = date.toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const sortedMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const eventsByMonthData = Object.entries(eventsByMonth)
    .map(([month, count]) => ({ month, count: Number(count) }))
    .sort((a, b) => sortedMonths.indexOf(a.month) - sortedMonths.indexOf(b.month));

  // Revenue by event
  const revenueByEvent = events.reduce((acc: Record<string, number>, event) => {
    const eventRevenue = event.tickets?.reduce((sum, ticket) => {
      if (ticket.payment_status === 'paid') {
        return sum + ((ticket.quantity || 0) * (ticket.ticket_type?.price || 0));
      }
      return sum;
    }, 0) || 0;
    if (eventRevenue > 0) {
      acc[event.name || `Event ${event.id}`] = eventRevenue;
    }
    return acc;
  }, {});

  const revenueByEventData = Object.entries(revenueByEvent)
    .map(([name, amount]) => ({ event_name: name, amount: Number(amount) }))
    .sort((a, b) => b.amount - a.amount);

  // Top organizers by revenue
  const organizerRevenue = events.reduce((acc: Record<string, { revenue: number; event_count: number }>, event) => {
    const eventRevenue = event.tickets?.reduce((sum, ticket) => {
      if (ticket.payment_status === 'paid') {
        return sum + ((ticket.quantity || 0) * (ticket.ticket_type?.price || 0));
      }
      return sum;
    }, 0) || 0;
    
    const organizerName = event.organizer?.company_name || 'Unknown Organizer';
    if (!acc[organizerName]) {
      acc[organizerName] = { revenue: 0, event_count: 0 };
    }
    acc[organizerName].revenue += eventRevenue;
    acc[organizerName].event_count += 1;
    return acc;
  }, {});

  const topOrganizers = Object.entries(organizerRevenue)
    .map(([name, data]) => ({ organizer_name: name, revenue: data.revenue, event_count: data.event_count }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  return {
    totalEvents,
    activeEvents,
    totalTickets,
    totalRevenue,
    eventsByMonth: eventsByMonthData,
    revenueByEvent: revenueByEventData,
    topOrganizers
  };
};

const RecentEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [stats, setStats] = useState<EventStats>({
    totalEvents: 0,
    activeEvents: 0,
    totalTickets: 0,
    totalRevenue: 0,
    eventsByMonth: [],
    revenueByEvent: [],
    topOrganizers: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch events
        const eventsResponse = await fetch(`${import.meta.env.VITE_API_URL}/admin/events`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!eventsResponse.ok) {
          throw new Error(`Failed to fetch events: ${eventsResponse.status}`);
        }

        const eventsData = await eventsResponse.json();
        
        // Fetch organizers
        const organizersResponse = await fetch(`${import.meta.env.VITE_API_URL}/admin/organizers`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!organizersResponse.ok) {
          throw new Error(`Failed to fetch organizers: ${organizersResponse.status}`);
        }

        const organizersData = await organizersResponse.json();

        // Set data
        const eventsList = Array.isArray(eventsData) ? eventsData : eventsData.events || [];
        const organizersList = organizersData.organizers || [];
        
        setEvents(eventsList);
        setOrganizers(organizersList);
        setStats(calculateStats(eventsList, organizersList));
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="px-4 py-6 md:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-gray-200">Admin Dashboard Loading</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">Fetching event and organizer data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
              <div className="h-[300px] bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6 md:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        <Card className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-800 dark:text-red-200">Error Loading Dashboard</CardTitle>
            <CardDescription className="text-red-600 dark:text-red-400">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl shadow-md hover:shadow-lg transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Events
            </CardTitle>
            <Calendar className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{stats.totalEvents}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              All events created
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-md hover:shadow-lg transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Active Events
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{stats.activeEvents}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Currently upcoming events
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-md hover:shadow-lg transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tickets Sold</CardTitle>
            <Ticket className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{stats.totalTickets}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tickets across all events
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-md hover:shadow-lg transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">KSh {stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Revenue from completed sales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-xl shadow-md hover:shadow-lg transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-gray-200">Events by Month</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">Number of events created each month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] rounded-xl bg-gray-100 dark:bg-gray-700 p-2 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.eventsByMonth}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar
                    dataKey="count"
                    fill="url(#colorCount)"
                    radius={[8, 8, 0, 0]}
                    isAnimationActive={true}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-md hover:shadow-lg transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-gray-200">Revenue by Event</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">Top 8 events by revenue generated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] rounded-xl bg-gray-100 dark:bg-gray-700 p-2 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.revenueByEvent.slice(0, 8)}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="event_name" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `KSh ${value}`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar
                    dataKey="amount"
                    fill="url(#colorAmount)"
                    radius={[8, 8, 0, 0]}
                    isAnimationActive={true}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Organizers */}
      <Card className="rounded-xl shadow-md hover:shadow-lg transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-gray-200">Top Organizers by Revenue</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">Best performing organizers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] rounded-xl bg-gray-100 dark:bg-gray-700 p-2 shadow-inner">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topOrganizers}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis 
                  dataKey="organizer_name" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `KSh ${value}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Bar
                  dataKey="revenue"
                  fill="url(#colorRevenue)"
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={true}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card className="rounded-xl shadow-md hover:shadow-lg transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-gray-200">Recent Events</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">Latest events across all organizers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.slice(0, 8).map((event) => {
              const ticketsSold = (event.tickets || []).reduce((sum, ticket) =>
                ticket.payment_status === 'paid' ? sum + (ticket.quantity || 0) : sum, 0);

              const revenue = (event.tickets || []).reduce((sum, ticket) => {
                if (ticket.payment_status === 'paid') {
                  return sum + ((ticket.quantity || 0) * (ticket.ticket_type?.price || 0));
                }
                return sum;
              }, 0);

              return (
                <div key={event.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm bg-white dark:bg-gray-800">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-200">{event.name || 'Unnamed Event'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <Building2 className="inline h-4 w-4 mr-1" />
                        {event.organizer?.company_name || 'Unknown Organizer'}
                      </p>
                      <div className="mt-2 flex gap-4 flex-wrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {event.date ? new Date(event.date).toLocaleDateString() : 'No date'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Ticket className="h-4 w-4" />
                          {ticketsSold} tickets sold
                        </div>
                        <div className="flex items-center gap-1">
                          💰 KSh {revenue.toLocaleString()}
                        </div>
                      </div>
                      {event.location && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">📍 {event.location}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {events.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No events found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecentEvents;