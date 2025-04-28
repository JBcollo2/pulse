import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
// Import icons for stats
import { CalendarDays, DollarSign, CheckCircle, BarChart2, Users, TrendingUp } from 'lucide-react';
// Import recharts components if planning graphical representation
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';


// Define a type for the expected statistics data from the backend
// This is a hypothetical structure, adjust based on your actual backend endpoint
interface OrganizerStatsData {
  totalEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  averageTicketsPerEvent?: number; // Optional stat
  eventsCreatedOverTime?: { date: string; count: number }[]; // Data for a time series chart
  ticketsSoldOverTime?: { date: string; count: number }[]; // Data for a time series chart
  revenueByEventType?: { type: string; amount: number }[]; // Data for a chart
}

const OrganizerStats: React.FC = () => {
  const [stats, setStats] = useState<OrganizerStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Error can be null

  const { toast } = useToast();

  // Placeholder for error handling function
  const handleFetchError = async (response: Response) => {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
    } catch (jsonError) {
      console.error('Failed to parse error response:', jsonError);
    }
    setError(errorMessage);
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  };

  // Function to fetch aggregated organizer statistics
  const fetchOrganizerStats = async () => {
    setIsLoading(true);
    setError(null); // Clear previous errors
    setStats(null); // Clear previous stats
    try {
      // NOTE: This endpoint is hypothetical. You need a backend endpoint
      // that provides aggregated statistics for the logged-in organizer.
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/organizer/stats`, {
        credentials: 'include', // Important for sending cookies with JWT
      });

      if (!response.ok) {
        await handleFetchError(response);
         if (response.status === 403) {
             setError("You are not authorized to view statistics.");
         } else {
             setError('Failed to fetch organizer statistics.');
         }
        return;
      }

      const data: OrganizerStatsData = await response.json();
      setStats(data);

    } catch (err) {
      console.error('Fetch organizer stats error:', err);
      setError('An unexpected error occurred while fetching statistics.');
      toast({
        title: "Error",
        description: 'An unexpected error occurred while fetching statistics.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stats when the component mounts
  useEffect(() => {
    fetchOrganizerStats();
  }, []); // Empty dependency array means this runs once on mount


  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organizer Statistics</CardTitle>
            <CardDescription>Loading statistics...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => ( // Show a few loading placeholders
                <div key={index} className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organizer Statistics</CardTitle>
            <CardDescription>Error loading statistics.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If not loading and no error, but no stats data (e.g., organizer has no events)
  if (!stats) {
     return (
        <div className="space-y-6">
           <Card>
               <CardHeader>
                   <CardTitle>Organizer Statistics</CardTitle>
                   <CardDescription>No statistics available.</CardDescription>
               </CardHeader>
               <CardContent>
                   <p>Statistics will appear here once you have created events and made sales.</p>
               </CardContent>
           </Card>
       </div>
     );
  }


  // Display the stats if data is available
  return (
    <div className="space-y-6">
      <h1>Organizer Statistics</h1>
      <p>Aggregated statistics across all your events.</p>

      {/* Summary Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events Created</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
             {/* Add comparison text if available */}
            {/* <p className="text-xs text-muted-foreground">+XX% from last period</p> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets Sold</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTicketsSold}</div>
             {/* Add comparison text if available */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue?.toFixed(2) || '0.00'}</div> {/* Added optional chaining and default */}
             {/* Add comparison text if available */}
          </CardContent>
        </Card>

         {/* Optional: Average Tickets Per Event */}
         {stats.averageTicketsPerEvent !== undefined && (
             <Card>
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <CardTitle className="text-sm font-medium">Avg Tickets per Event</CardTitle>
                 <TrendingUp className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold">{stats.averageTicketsPerEvent?.toFixed(1) || '0.0'}</div> {/* Added optional chaining and default */}
               </CardContent>
             </Card>
         )}
      </div>

       {/* Placeholder for Charts */}
       <div className="grid gap-4 md:grid-cols-2">
            {/* Example: Events Created Over Time Chart */}
           {/* {stats.eventsCreatedOverTime && stats.eventsCreatedOverTime.length > 0 && (
             <Card>
                <CardHeader><CardTitle>Events Created Over Time</CardTitle></CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.eventsCreatedOverTime}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" name="Events" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
             </Card>
           )} */}

           {/* Example: Revenue by Event Type Chart (if backend provides this) */}
            {/* {stats.revenueByEventType && stats.revenueByEventType.length > 0 && (
             <Card>
                <CardHeader><CardTitle>Revenue by Event Type</CardTitle></CardHeader>
                <CardContent>
                     <div className="h-[300px]">
                       <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={stats.revenueByEventType}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#00C49F"
                                dataKey="amount"
                                nameKey="type"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {stats.revenueByEventType.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name]}/>
                              <Legend />
                           </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
             </Card>
           )} */}
       </div>


    </div>
  );
};

export default OrganizerStats;