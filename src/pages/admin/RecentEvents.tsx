import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Ticket, TrendingUp } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from "@/components/ui/badge";

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
    company_name: string;
  };
  ticket_types: {
    type_name: string;
    price: number;
    quantity: number;
  }[];
  tickets: {
    quantity: number;
    payment_status: string;
    type_name?: string;
  }[];
}

interface EventStats {
  totalEvents: number;
  activeEvents: number;
  totalTickets: number;
  totalRevenue: number;
  eventsByMonth: { month: string; count: number }[];
  revenueByEvent: { event_name: string; amount: number }[];
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0];
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-md">
        <p className="font-semibold text-gray-800 dark:text-gray-200">{label}</p>
        {dataItem.dataKey === 'amount' ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">{`Revenue: $${Number(dataItem.value).toLocaleString()}`}</p>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">{`${dataItem.dataKey}: ${dataItem.value}`}</p>
        )}
      </div>
    );
  }
  return null;
};

// Utility function to calculate statistics
const calculateStats = (data: Event[]) => {
  const totalEvents = data.length;
  const activeEvents = data.filter(event => {
    if (!event.date) return false;
    const eventDate = new Date(event.date);
    if (isNaN(eventDate.getTime())) return false;
    return eventDate > new Date();
  }).length;

  const totalTickets = data.reduce((sum, event) => {
    return sum + (event.tickets?.reduce((ticketSum, ticket) =>
      ticket.payment_status === 'completed' ? ticketSum + (ticket.quantity || 0) : ticketSum, 0) || 0);
  }, 0);

  const totalRevenue = data.reduce((sum, event) => {
    return sum + (event.tickets?.reduce((revenueSum, ticket) => {
      if (ticket.payment_status === 'completed') {
        const ticketType = event.ticket_types?.find(type => type.type_name === ticket.type_name);
        return revenueSum + ((ticket.quantity || 0) * (ticketType?.price || 0));
      }
      return revenueSum;
    }, 0) || 0);
  }, 0);

  const eventsByMonth = data.reduce((acc: Record<string, number>, event) => {
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

  const revenueByEvent = data.reduce((acc: Record<string, number>, event) => {
    const eventRevenue = event.tickets?.reduce((sum, ticket) => {
      if (ticket.payment_status === 'completed') {
        const ticketType = event.ticket_types?.find(type => type.type_name === ticket.type_name);
        return sum + ((ticket.quantity || 0) * (ticketType?.price || 0));
      }
      return sum;
    }, 0) || 0;
    acc[event.name || `Event ${event.id}`] = (acc[event.name || `Event ${event.id}`] || 0) + eventRevenue;
    return acc;
  }, {});

  const revenueByEventData = Object.entries(revenueByEvent).map(([name, amount]) => ({
    event_name: name,
    amount: Number(amount)
  }));

  return {
    totalEvents,
    activeEvents,
    totalTickets,
    totalRevenue,
    eventsByMonth: eventsByMonthData,
    revenueByEvent: revenueByEventData
  };
};

const RecentEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<EventStats>({
    totalEvents: 0,
    activeEvents: 0,
    totalTickets: 0,
    totalRevenue: 0,
    eventsByMonth: [],
    revenueByEvent: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/events`, {
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch events');
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('Invalid response format: expected an array of events');
        }

        setEvents(data);
        setStats(calculateStats(data));
      } catch (error) {
        console.error('Error fetching events:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch events",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="px-4 py-6 md:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-gray-200">Dashboard Loading</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">Fetching event data...</CardDescription>
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

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
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
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Revenue from completed sales
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <CardDescription className="text-gray-500 dark:text-gray-400">Revenue generated per event (Top 10)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] rounded-xl bg-gray-100 dark:bg-gray-700 p-2 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.revenueByEvent.slice(0, 10)}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="event_name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
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

      <Card className="rounded-xl shadow-md hover:shadow-lg transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-gray-200">Recent Events</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">Latest events across all organizers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.slice(0, 5).map((event) => {
              const ticketsSold = (event.tickets || []).reduce((sum, ticket) =>
                ticket.payment_status === 'completed' ? sum + (ticket.quantity || 0) : sum, 0);

              const totalPossibleTickets = (event.ticket_types || []).reduce((sum, type) => sum + (type.quantity || 0), 0);

              const revenue = (event.tickets || []).reduce((sum, ticket) => {
                if (ticket.payment_status === 'completed') {
                  const ticketType = event.ticket_types?.find(type => type.type_name === ticket.type_name);
                  return sum + ((ticket.quantity || 0) * (ticketType?.price || 0));
                }
                return sum;
              }, 0);

              return (
                <div key={event.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm bg-white dark:bg-gray-800">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-200">{event.name || 'Unnamed Event'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Organizer: {event.organizer?.company_name || 'Unknown Organizer'}
                      </p>
                      <div className="mt-2 flex gap-3 flex-wrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          🎟️ {ticketsSold} tickets sold
                        </div>
                        <div className="flex items-center gap-1">
                          💰 ${revenue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {events.length === 0 && !isLoading && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No events found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecentEvents;
