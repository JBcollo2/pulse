import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Ticket, TrendingUp, DollarSign } from 'lucide-react'; // Added DollarSign
import { useToast } from "@/components/ui/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils"; // Import cn for conditional class joining
import { motion } from "framer-motion"; // For animations

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

interface RecentEventsProps {
  darkMode: boolean; // Add darkMode prop for consistent theming
}

// Custom Tooltip Component for Recharts
const CustomTooltip = ({ active, payload, label, darkMode }: any) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0];
    return (
      <div className={cn(
        "p-3 border rounded-md shadow-lg text-sm",
        darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"
      )}>
        <p className={cn("font-semibold", darkMode ? "text-gray-200" : "text-gray-800")}>{label}</p>
        {dataItem.dataKey === 'amount' ? (
          <p className={cn(darkMode ? "text-gray-300" : "text-gray-600")}>
            {`Revenue: $${Number(dataItem.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </p>
        ) : (
          <p className={cn(darkMode ? "text-gray-300" : "text-gray-600")}>
            {`${dataItem.dataKey === 'count' ? 'Events' : dataItem.dataKey}: ${dataItem.value}`}
          </p>
        )}
      </div>
    );
  }
  return null;
};

const RecentEvents: React.FC<RecentEventsProps> = ({ darkMode }) => {
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

        // Calculate statistics
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
        })).sort((a,b) => b.amount - a.amount); // Sort by amount descending for "Top X"

        setStats({
          totalEvents,
          activeEvents,
          totalTickets,
          totalRevenue,
          eventsByMonth: eventsByMonthData,
          revenueByEvent: revenueByEventData
        });
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
      <div className={cn("space-y-6 p-6", darkMode ? "text-white" : "text-foreground")}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <Card
              key={index}
              className={cn(
                "animate-pulse rounded-lg border",
                darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className={cn(darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
          <CardHeader>
            <CardTitle>Loading Charts...</CardTitle>
            <CardDescription>Fetching chart data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-8 p-6 lg:p-8", darkMode ? "text-white" : "text-foreground")}>
      <div className="flex items-center justify-between space-y-2 flex-wrap gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Event Overview</h2>
          <p className={cn("text-sm md:text-lg text-muted-foreground")}>
            A snapshot of your event platform's current status.
          </p>
        </div>
      </div>

      {/* --- Summary Cards --- */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className={cn(
            "border rounded-lg shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer group",
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className={cn("h-5 w-5 text-muted-foreground group-hover:text-blue-500 transition-colors duration-200", darkMode ? "text-gray-400 group-hover:text-blue-400" : "")} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalEvents}</div>
              <p className={cn("text-xs", darkMode ? "text-gray-300" : "text-muted-foreground")}>All events created</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className={cn(
            "border rounded-lg shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer group",
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Events</CardTitle>
              <TrendingUp className={cn("h-5 w-5 text-muted-foreground group-hover:text-green-500 transition-colors duration-200", darkMode ? "text-gray-400 group-hover:text-green-400" : "")} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeEvents}</div>
              <p className={cn("text-xs", darkMode ? "text-gray-300" : "text-muted-foreground")}>Currently upcoming events</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className={cn(
            "border rounded-lg shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer group",
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets Sold</CardTitle>
              <Ticket className={cn("h-5 w-5 text-muted-foreground group-hover:text-orange-500 transition-colors duration-200", darkMode ? "text-gray-400 group-hover:text-orange-400" : "")} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalTickets}</div>
              <p className={cn("text-xs", darkMode ? "text-gray-300" : "text-muted-foreground")}>Tickets across all events</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className={cn(
            "border rounded-lg shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer group",
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className={cn("h-5 w-5 text-muted-foreground group-hover:text-emerald-500 transition-colors duration-200", darkMode ? "text-gray-400 group-hover:text-emerald-400" : "")} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p className={cn("text-xs", darkMode ? "text-gray-300" : "text-muted-foreground")}>Revenue from completed sales</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* --- Charts --- */}
      <div className="grid gap-6 lg:grid-cols-2">
        {stats.eventsByMonth && stats.eventsByMonth.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className={cn("border rounded-lg shadow-md", darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Events by Month</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">Number of events created each month</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.eventsByMonth}>
                    <defs>
                      <linearGradient id="colorEventCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={darkMode ? "#60a5fa" : "#3b82f6"} stopOpacity={0.9}/>
                        <stop offset="95%" stopColor={darkMode ? "#60a5fa" : "#3b82f6"} stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className={darkMode ? "stroke-gray-700" : "stroke-gray-200"} />
                    <XAxis dataKey="month" stroke={darkMode ? "#f9fafb" : "#4b5563"} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke={darkMode ? "#f9fafb" : "#4b5563"} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip darkMode={darkMode} />} cursor={{ fill: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
                    <Bar
                      dataKey="count"
                      fill="url(#colorEventCount)"
                      radius={[8, 8, 0, 0]}
                      isAnimationActive={true}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {stats.revenueByEvent && stats.revenueByEvent.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className={cn("border rounded-lg shadow-md", darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Revenue by Event</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">Top 10 revenue-generating events</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.revenueByEvent.slice(0, 10)}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={darkMode ? "#86efac" : "#22c55e"} stopOpacity={0.9}/>
                        <stop offset="95%" stopColor={darkMode ? "#86efac" : "#22c55e"} stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className={darkMode ? "stroke-gray-700" : "stroke-gray-200"} />
                    <XAxis dataKey="event_name" stroke={darkMode ? "#f9fafb" : "#4b5563"} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke={darkMode ? "#f9fafb" : "#4b5563"} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Tooltip content={<CustomTooltip darkMode={darkMode} />} cursor={{ fill: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
                    <Bar
                      dataKey="amount"
                      fill="url(#colorAmount)"
                      radius={[8, 8, 0, 0]}
                      isAnimationActive={true}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* --- Recent Events List --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Card className={cn("border rounded-lg shadow-md", darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Recent Events</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">Latest events across all organizers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
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

                const eventDate = event.date ? new Date(event.date) : null;
                const isUpcoming = eventDate && !isNaN(eventDate.getTime()) && eventDate > new Date();

                return (
                  <div key={event.id} className={cn("border-b pb-6 last:border-0 last:pb-0", darkMode ? "border-gray-700" : "border-gray-200")}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <div className="mb-2 sm:mb-0">
                        <p className={cn("font-semibold text-lg", darkMode ? "text-white" : "text-gray-900")}>{event.name || 'Unnamed Event'}</p>
                        <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-muted-foreground")}>
                          Organizer: {event.organizer?.company_name || 'Unknown Organizer'}
                        </p>
                        <div className={cn("flex items-center gap-2 mt-2 text-sm", darkMode ? "text-gray-400" : "text-muted-foreground")}>
                          <Calendar className="h-4 w-4" />
                          <span>
                            {eventDate ? eventDate.toLocaleDateString() : 'No date set'} at {event.start_time || 'No time set'}
                          </span>
                        </div>
                        <div className="mt-2">
                          {isUpcoming ? (
                            <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Upcoming</Badge>
                          ) : eventDate ? (
                            <Badge className="bg-gray-500 hover:bg-gray-600 text-white">Past</Badge>
                          ) : (
                            <Badge variant="outline" className={darkMode ? "border-gray-600 text-gray-400" : ""}>No date</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <p className={cn("font-bold text-xl", darkMode ? "text-green-400" : "text-green-600")}>
                          ${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-muted-foreground")}>
                          {ticketsSold} / {totalPossibleTickets > 0 ? totalPossibleTickets : 'N/A'} tickets sold
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {events.length === 0 && !isLoading && (
                <p className={cn("text-center py-8", darkMode ? "text-gray-400" : "text-muted-foreground")}>No events found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default RecentEvents;