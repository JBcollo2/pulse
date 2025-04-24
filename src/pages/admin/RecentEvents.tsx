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

        // Calculate statistics
        const totalEvents = data.length;
        const activeEvents = data.filter(event => {
          const eventDate = new Date(event.date);
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

        // Group events by month
        const eventsByMonth = data.reduce((acc: Record<string, number>, event) => {
          const month = new Date(event.date).toLocaleString('default', { month: 'short' });
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {});

        // Group revenue by event
        const revenueByEvent = data.reduce((acc: Record<string, number>, event) => {
          const eventRevenue = event.tickets?.reduce((sum, ticket) => {
            if (ticket.payment_status === 'completed') {
              const ticketType = event.ticket_types?.find(type => type.type_name === ticket.type_name);
              return sum + ((ticket.quantity || 0) * (ticketType?.price || 0));
            }
            return sum;
          }, 0) || 0;
          acc[event.name] = (acc[event.name] || 0) + eventRevenue;
          return acc;
        }, {});

        setStats({
          totalEvents,
          activeEvents,
          totalTickets,
          totalRevenue,
          eventsByMonth: Object.entries(eventsByMonth).map(([month, count]) => ({ 
            month, 
            count: Number(count) 
          })),
          revenueByEvent: Object.entries(revenueByEvent).map(([name, amount]) => ({ 
            event_name: name, 
            amount: Number(amount) 
          }))
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
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Loading events...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Events</CardTitle>
            <CardDescription>All events created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Events</CardTitle>
            <CardDescription>Currently active events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Tickets</CardTitle>
            <CardDescription>Tickets sold across all events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>Revenue from all events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Events by Month</CardTitle>
            <CardDescription>Number of events created each month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.eventsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Event</CardTitle>
            <CardDescription>Revenue generated per event</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.revenueByEvent}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="event_name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Latest events across all organizers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.map((event) => {
              const totalTickets = (event.ticket_types || []).reduce((sum, type) => sum + (type.quantity || 0), 0);
              const ticketsSold = (event.tickets || []).reduce((sum, ticket) => 
                ticket.payment_status === 'completed' ? sum + (ticket.quantity || 0) : sum, 0);
              const revenue = (event.tickets || []).reduce((sum, ticket) => 
                ticket.payment_status === 'completed' ? sum + ((ticket.quantity || 0) * ((event.ticket_types?.[0]?.price) || 0)) : sum, 0);

              return (
                <div key={event.id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{event.name || 'Unnamed Event'}</p>
                      <p className="text-sm text-muted-foreground">
                        Organizer: {event.organizer?.company_name || 'Unknown Organizer'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {event.date ? new Date(event.date).toLocaleDateString() : 'No date set'} at {event.start_time || 'No time set'}
                        </span>
                      </div>
                      <div className="mt-2">
                        <Badge variant="default">
                          {event.date ? (new Date(event.date) > new Date() ? 'Upcoming' : 'Past') : 'No date'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${revenue.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {ticketsSold} / {totalTickets} tickets sold
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {events.length === 0 && (
              <p className="text-center text-muted-foreground">No events found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecentEvents; 