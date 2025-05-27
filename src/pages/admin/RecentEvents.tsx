// import React, { useState, useEffect } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Calendar, Users, Ticket, TrendingUp } from 'lucide-react';
// import { useToast } from "@/components/ui/use-toast";
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// import { Badge } from "@/components/ui/badge";

// interface Event {
//   id: number;
//   name: string;
//   description: string;
//   date: string;
//   start_time: string;
//   end_time: string;
//   location: string;
//   image: string;
//   organizer_id: number;
//   organizer: {
//     company_name: string;
//   };
//   ticket_types: {
//     type_name: string;
//     price: number;
//     quantity: number;
//   }[];
//   tickets: {
//     quantity: number;
//     payment_status: string;
//     // Assuming ticket type name might be needed to link back to ticket_types for price
//     type_name?: string; 
//   }[];
// }

// interface EventStats {
//   totalEvents: number;
//   activeEvents: number;
//   totalTickets: number;
//   totalRevenue: number;
//   eventsByMonth: { month: string; count: number }[];
//   revenueByEvent: { event_name: string; amount: number }[];
// }

// // Custom Tooltip Component
// const CustomTooltip = ({ active, payload, label }: any) => {
//   if (active && payload && payload.length) {
//     const dataItem = payload[0];
//     return (
//       <div className="bg-white p-3 border rounded shadow-md">
//         <p className="font-semibold text-gray-800">{label}</p>
//         {dataItem.dataKey === 'amount' ? (
//            <p className="text-sm text-gray-600">{`Revenue: $${Number(dataItem.value).toLocaleString()}`}</p>
//         ) : (
//            <p className="text-sm text-gray-600">{`${dataItem.dataKey}: ${dataItem.value}`}</p>
//         )}
//       </div>
//     );
//   }
//   return null;
// };

// const RecentEvents = () => {
//   const [events, setEvents] = useState<Event[]>([]);
//   const [stats, setStats] = useState<EventStats>({
//     totalEvents: 0,
//     activeEvents: 0,
//     totalTickets: 0,
//     totalRevenue: 0,
//     eventsByMonth: [],
//     revenueByEvent: []
//   });
//   const [isLoading, setIsLoading] = useState(true);
//   const { toast } = useToast();

//   useEffect(() => {
//     const fetchEvents = async () => {
//       try {
//         // NOTE: Replace with your actual API endpoint and potentially add authentication headers
//         const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/events`, {
//           credentials: 'include',
//         });

//         if (!response.ok) {
//           const errorData = await response.json();
//           throw new Error(errorData.message || 'Failed to fetch events');
//         }

//         const data = await response.json();

//         if (!Array.isArray(data)) {
//           throw new Error('Invalid response format: expected an array of events');
//         }

//         setEvents(data);

//         // Calculate statistics
//         const totalEvents = data.length;
//         const activeEvents = data.filter(event => {
//           // Check if event.date is a valid date string before creating a Date object
//           if (!event.date) return false; 
//           const eventDate = new Date(event.date);
//           // Check for Invalid Date
//           if (isNaN(eventDate.getTime())) return false;
//           return eventDate > new Date();
//         }).length;

//         const totalTickets = data.reduce((sum, event) => {
//           return sum + (event.tickets?.reduce((ticketSum, ticket) =>
//             ticket.payment_status === 'completed' ? ticketSum + (ticket.quantity || 0) : ticketSum, 0) || 0);
//         }, 0);

//         const totalRevenue = data.reduce((sum, event) => {
//           return sum + (event.tickets?.reduce((revenueSum, ticket) => {
//             if (ticket.payment_status === 'completed') {
//               // Find the price from ticket_types based on ticket.type_name
//               const ticketType = event.ticket_types?.find(type => type.type_name === ticket.type_name);
//               return revenueSum + ((ticket.quantity || 0) * (ticketType?.price || 0));
//             }
//             return revenueSum;
//           }, 0) || 0);
//         }, 0);


//         // Group events by month
//         const eventsByMonth = data.reduce((acc: Record<string, number>, event) => {
//            if (!event.date) return acc;
//           const date = new Date(event.date);
//            if (isNaN(date.getTime())) return acc;
//           const month = date.toLocaleString('default', { month: 'short' });
//           acc[month] = (acc[month] || 0) + 1;
//           return acc;
//         }, {});

//          // Sort months chronologically (basic sorting for chart)
//         const sortedMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//         const eventsByMonthData = Object.entries(eventsByMonth)
//             .map(([month, count]) => ({ month, count: Number(count) }))
//             .sort((a, b) => sortedMonths.indexOf(a.month) - sortedMonths.indexOf(b.month));


//         // Group revenue by event
//         const revenueByEvent = data.reduce((acc: Record<string, number>, event) => {
//           const eventRevenue = event.tickets?.reduce((sum, ticket) => {
//             if (ticket.payment_status === 'completed') {
//                const ticketType = event.ticket_types?.find(type => type.type_name === ticket.type_name);
//               return sum + ((ticket.quantity || 0) * (ticketType?.price || 0));
//             }
//             return sum;
//           }, 0) || 0;
//           acc[event.name || `Event ${event.id}`] = (acc[event.name || `Event ${event.id}`] || 0) + eventRevenue;
//           return acc;
//         }, {});
//          // Convert object to array for Recharts
//         const revenueByEventData = Object.entries(revenueByEvent).map(([name, amount]) => ({
//              event_name: name,
//              amount: Number(amount)
//          }));


//         setStats({
//           totalEvents,
//           activeEvents,
//           totalTickets,
//           totalRevenue,
//           eventsByMonth: eventsByMonthData, // Use sorted data
//           revenueByEvent: revenueByEventData
//         });
//       } catch (error) {
//         console.error('Error fetching events:', error);
//         toast({
//           title: "Error",
//           description: error instanceof Error ? error.message : "Failed to fetch events",
//           variant: "destructive",
//         });
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchEvents();
//     // The dependency array includes `toast` because it's used inside the effect.
//   }, [toast]);

//   if (isLoading) {
//     return (
//       <div className="space-y-6">
//         <Card>
//           <CardHeader>
//             <CardTitle>Dashboard Loading</CardTitle>
//             <CardDescription>Fetching event data...</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {[...Array(4)].map((_, index) => (
//                 <div key={index} className="animate-pulse">
//                   <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
//                   <div className="h-3 bg-gray-200 rounded w-1/2"></div>
//                 </div>
//               ))}
//                <div className="h-[300px] bg-gray-200 rounded"></div> {/* Placeholder for chart */}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">
//               Total Events
//             </CardTitle>
//             <Calendar className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.totalEvents}</div>
//             <p className="text-xs text-muted-foreground mt-1">
//               All events created
//             </p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">
//               Active Events
//             </CardTitle>
//              {/* Using TrendingUp as an indicator, ideally this would be dynamic */}
//             <TrendingUp className="h-4 w-4 text-muted-foreground" /> 
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.activeEvents}</div>
//              <p className="text-xs text-muted-foreground mt-1">
//               Currently upcoming events
//             </p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Tickets Sold</CardTitle>
//             <Ticket className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.totalTickets}</div>
//              <p className="text-xs text-muted-foreground mt-1">
//               Tickets across all events
//             </p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
//              {/* Using Users as an indicator, ideally this would be dynamic */}
//             <Users className="h-4 w-4 text-muted-foreground" /> 
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
//              <p className="text-xs text-muted-foreground mt-1">
//               Revenue from completed sales
//             </p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Dynamic Badges Note: The original data structure does not contain previous period data to calculate percentage changes for dynamic badges. This feature is omitted as per data availability. */}

//       <div className="grid gap-6 md:grid-cols-2">
//         <Card>
//           <CardHeader>
//             <CardTitle>Events by Month</CardTitle>
//             <CardDescription>Number of events created each month</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="h-[350px]"> {/* Increased height slightly */}
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={stats.eventsByMonth}>
//                   <defs>
//                     <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
//                       <stop offset="5%" stopColor="#8884d8" stopOpacity={0.9}/>
//                       <stop offset="95%" stopColor="#8884d8" stopOpacity={0.3}/> {/* Adjusted opacity */}
//                     </linearGradient>
//                   </defs>
//                   <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" /> {/* Styled grid */}
//                   <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} /> {/* Styled axis */}
//                   <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} /> {/* Styled axis */}
//                   <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} /> {/* Custom tooltip & cursor style */}
//                   <Bar
//                     dataKey="count"
//                     fill="url(#colorCount)"
//                     radius={[8, 8, 0, 0]}
//                     isAnimationActive={true}
//                   />
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>Revenue by Event</CardTitle>
//             <CardDescription>Revenue generated per event (Top 10)</CardDescription> {/* Added Top 10 note */}
//           </CardHeader>
//           <CardContent>
//             <div className="h-[350px]"> {/* Increased height slightly */}
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={stats.revenueByEvent.slice(0, 10)}> {/* Limiting to top 10 for readability */}
//                    <defs>
//                     <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
//                       <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.9}/> {/* Green gradient */}
//                       <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.3}/> {/* Adjusted opacity */}
//                     </linearGradient>
//                   </defs>
//                   <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
//                   <XAxis dataKey="event_name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
//                   <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} /> {/* Format Y axis as currency */}
//                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} /> {/* Custom tooltip & cursor style */}
//                   <Bar
//                     dataKey="amount"
//                     fill="url(#colorAmount)"
//                     radius={[8, 8, 0, 0]}
//                      isAnimationActive={true}
//                   />
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle>Recent Events</CardTitle>
//           <CardDescription>Latest events across all organizers</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-6"> {/* Increased spacing */}
//             {events.slice(0, 5).map((event) => { // Limiting to 5 recent events
//               // Recalculate tickets sold and revenue accurately based on available data structure
//                const ticketsSold = (event.tickets || []).reduce((sum, ticket) =>
//                   ticket.payment_status === 'completed' ? sum + (ticket.quantity || 0) : sum, 0);

//                 const totalPossibleTickets = (event.ticket_types || []).reduce((sum, type) => sum + (type.quantity || 0), 0);


//                 const revenue = (event.tickets || []).reduce((sum, ticket) => {
//                     if (ticket.payment_status === 'completed') {
//                         // Find the ticket type to get the price
//                          const ticketType = event.ticket_types?.find(type => type.type_name === ticket.type_name);
//                         return sum + ((ticket.quantity || 0) * (ticketType?.price || 0));
//                     }
//                     return sum;
//                 }, 0);


//               return (
//                 <div key={event.id} className="border-b pb-6 last:border-0 last:pb-0"> {/* Adjusted padding */}
//                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
//                     <div className="mb-2 sm:mb-0">
//                       <p className="font-semibold text-lg text-gray-900">{event.name || 'Unnamed Event'}</p> {/* Larger title */}
//                       <p className="text-sm text-muted-foreground">
//                         Organizer: {event.organizer?.company_name || 'Unknown Organizer'}
//                       </p>
//                       <div className="flex items-center gap-2 mt-2 text-muted-foreground text-sm"> {/* Adjusted spacing and text size */}
//                         <Calendar className="h-4 w-4" />
//                         <span>
//                           {event.date ? new Date(event.date).toLocaleDateString() : 'No date set'} at {event.start_time || 'No time set'}
//                         </span>
//                       </div>
//                        <div className="mt-2">
//                          {event.date && new Date(event.date) > new Date() ? (
//                             <Badge variant="default">Upcoming</Badge>
//                          ) : event.date ? (
//                             <Badge variant="secondary">Past</Badge>
//                          ) : (
//                              <Badge variant="outline">No date</Badge>
//                          )}
//                        </div>
//                     </div>
//                     <div className="text-left sm:text-right">
//                       <p className="font-bold text-lg text-green-600">${revenue.toLocaleString()}</p> {/* Highlight revenue */}
//                       <p className="text-sm text-muted-foreground">
//                         {ticketsSold} / {totalPossibleTickets > 0 ? totalPossibleTickets : 'N/A'} tickets sold
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//             {events.length === 0 && !isLoading && (
//               <p className="text-center text-muted-foreground py-8">No events found</p>
//             )}
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default RecentEvents;

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
      <div className="bg-white p-3 border rounded shadow-md">
        <p className="font-semibold text-gray-800">{label}</p>
        {dataItem.dataKey === 'amount' ? (
           <p className="text-sm text-gray-600">{`Revenue: $${Number(dataItem.value).toLocaleString()}`}</p>
        ) : (
           <p className="text-sm text-gray-600">{`${dataItem.dataKey}: ${dataItem.value}`}</p>
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
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Loading</CardTitle>
            <CardDescription>Fetching event data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
               <div className="h-[300px] bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Events
            </CardTitle>
            <Calendar className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-800">{stats.totalEvents}</div>
            <p className="text-sm text-muted-foreground mt-1">
              All events created
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Active Events
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-800">{stats.activeEvents}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Currently upcoming events
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Tickets Sold</CardTitle>
            <Ticket className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-800">{stats.totalTickets}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Tickets across all events
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-800">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Revenue from completed sales
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
          <CardHeader>
            <CardTitle>Events by Month</CardTitle>
            <CardDescription>Number of events created each month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] rounded-xl bg-muted p-2 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.eventsByMonth}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
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

        <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
          <CardHeader>
            <CardTitle>Revenue by Event</CardTitle>
            <CardDescription>Revenue generated per event (Top 10)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] rounded-xl bg-muted p-2 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.revenueByEvent.slice(0, 10)}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
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

      <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Latest events across all organizers</CardDescription>
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

              return (
                <div key={event.id} className="rounded-lg border p-4 shadow-sm bg-white">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{event.name || 'Unnamed Event'}</p>
                      <p className="text-sm text-muted-foreground">
                        Organizer: {event.organizer?.company_name || 'Unknown Organizer'}
                      </p>
                      <div className="mt-2 flex gap-3 flex-wrap text-sm text-muted-foreground">
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
              <p className="text-center text-muted-foreground py-8">No events found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecentEvents;
