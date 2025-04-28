import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
// Import necessary components from recharts, including Legend and LabelList
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList } from 'recharts';
import { Badge } from "@/components/ui/badge";

// Define specific colors for each ticket type
const COLORS_BY_TICKET = {
  REGULAR: '#FF8042',     // Orange
  VIP: '#FFBB28',         // Yellow
  STUDENT: '#0088FE',     // Blue
  GROUP_OF_5: '#00C49F',  // Green
  COUPLES: '#FF6699',     // Pinkish
  EARLY_BIRD: '#AA336A',  // Purple
  VVIP: '#00FF00',        // Bright Green for VVIP
  GIVEAWAY: '#CCCCCC',    // Grey
  UNKNOWN_TYPE: '#A9A9A9', // Darker Grey for unknown types
  // Add other specific ticket types and their colors here (use uppercase)
};

// Fallback color if a ticket type is not in COLORS_BY_TICKET
const FALLBACK_COLOR = COLORS_BY_TICKET.UNKNOWN_TYPE;

interface Report {
  id: number;
  event_id: number;
  event_name: string;
  ticket_type: string; // Ensure this matches the key used in COLORS_BY_TICKET (case-insensitive check is good)
  total_tickets_sold: number;
  total_revenue: number;
  created_at: string;
  // Add other fields if your backend returns them
}

interface ReportStats {
  totalReports: number;
  totalRevenue: number;
  totalTickets: number;
  reportsByEvent: { event_name: string; count: number }[];
  revenueByTicketType: { ticket_type: string; amount: number }[];
}

const SystemReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    totalReports: 0,
    totalRevenue: 0,
    totalTickets: 0,
    reportsByEvent: [],
    revenueByTicketType: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports`, {
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.message || errorData.error || `Failed with status: ${response.status}`;
           console.error('Error fetching reports:', errorMessage);
          throw new Error(errorMessage);
        }

        const data = await response.json();
        const reportsData = Array.isArray(data) ? data : (data.reports || []);

        if (!Array.isArray(reportsData)) {
             console.error('API response data is not an array:', reportsData);
             throw new Error('Invalid data format received from API');
        }

        setReports(reportsData);

        // Calculate statistics
        const totalRevenue = reportsData.reduce((sum, report) => sum + (report.total_revenue || 0), 0);
        const totalTickets = reportsData.reduce((sum, report) => sum + (report.total_tickets_sold || 0), 0);

        // Group reports by event
        const reportsByEvent = reportsData.reduce((acc: Record<string, number>, report) => {
          const eventName = report.event_name && typeof report.event_name === 'string' ? report.event_name : 'Unknown Event';
          acc[eventName] = (acc[eventName] || 0) + 1;
          return acc;
        }, {});

        // Group revenue by ticket type
        const revenueByTicketType = reportsData.reduce((acc: Record<string, number>, report) => {
          // Ensure ticket_type is a string and exists, convert to uppercase for consistent lookup
          const ticketType = report.ticket_type && typeof report.ticket_type === 'string' ? report.ticket_type.toUpperCase() : 'UNKNOWN_TYPE';
           const revenue = typeof report.total_revenue === 'number' ? report.total_revenue : 0; // Ensure revenue is a number

          acc[ticketType] = (acc[ticketType] || 0) + revenue;
          return acc;
        }, {});

        setStats({
          totalReports: reportsData.length,
          totalRevenue,
          totalTickets,
          reportsByEvent: Object.entries(reportsByEvent).map(([name, count]) => ({
            event_name: name, // Matches XAxis dataKey
            count: Number(count) // Matches Bar dataKey
          })),
          revenueByTicketType: Object.entries(revenueByTicketType).map(([type, amount]) => ({
            ticket_type: type, // This will be used by nameKey in Pie chart
            amount: Number(amount)
          }))
        });

      } catch (error) {
        console.error('Error fetching reports:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch system reports",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>System Reports</CardTitle>
            <CardDescription>Loading reports...</CardDescription>
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

  if (!isLoading && reports.length === 0) {
      return (
          <div className="space-y-6">
               <Card>
                  <CardHeader>
                     <CardTitle>System Reports</CardTitle>
                     <CardDescription>No reports available yet.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <p className="text-center text-muted-foreground">No system reports were found.</p>
                  </CardContent>
               </Card>
          </div>
      );
  }


  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Reports</CardTitle>
            <CardDescription>Number of reports generated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>Total revenue from all events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Tickets</CardTitle>
            <CardDescription>Total tickets sold</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Reports by Event Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Reports by Event</CardTitle>
            <CardDescription>Number of reports per event</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
               {stats.reportsByEvent && stats.reportsByEvent.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                       data={stats.reportsByEvent}
                       margin={{ top: 20, right: 30, left: 20, bottom: 5 }} // Added margin
                    >
                      {/* Subtle Grid Lines */}
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      {/* Styled X-Axis Ticks */}
                      <XAxis
                        dataKey="event_name"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                        style={{ fontSize: '12px' }}
                        tick={{ fill: '#aaa', fontSize: 12 }} // Applied tick styling
                      />
                      {/* Styled Y-Axis Ticks */}
                      <YAxis
                         allowDecimals={false}
                         tick={{ fill: '#aaa', fontSize: 12 }} // Applied tick styling
                      />
                      {/* Custom Tooltip */}
                      <Tooltip
                         contentStyle={{ backgroundColor: "#1a1a2e", border: 'none', borderRadius: "8px", fontSize: '14px', padding: '8px' }} // Darker tooltip style
                         formatter={(value: number) => [`${value.toLocaleString()} Reports`, 'Count']}
                         labelFormatter={(label) => `Event: ${label}`}
                      />
                      <Bar
                        dataKey="count"
                        fill="#8884d8" // Solid purple color from example
                        radius={[10, 10, 0, 0]} // Increased rounded top corners
                        animationDuration={1500} // Animation
                      >
                         {/* LabelList to display count on bars */}
                        <LabelList dataKey="count" position="top" fill="#fff" fontSize={12} /> {/* White labels from example */}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               ) : (
                   <div className="flex items-center justify-center h-full text-muted-foreground">No event report data available.</div>
               )}
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Ticket Type Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Ticket Type</CardTitle>
            <CardDescription>Revenue distribution across ticket types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex flex-col items-center justify-center">
              {stats.revenueByTicketType && stats.revenueByTicketType.length > 0 && stats.revenueByTicketType.some(data => data.amount > 0) ? (
                 <ResponsiveContainer width="100%" height={250}>
                   <PieChart>
                     <Tooltip
                       contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", fontSize: '14px', padding: '8px' }}
                       formatter={(value: number, name: string, entry: any) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, entry.payload.ticket_type]}
                     />
                     <Pie
                       data={stats.revenueByTicketType}
                       dataKey="amount"
                       nameKey="ticket_type"
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={90}
                       paddingAngle={3}
                       animationDuration={1500}
                       labelLine={true}
                       label={({ ticket_type, percent }) => `${ticket_type} ${(percent * 100).toFixed(0)}%`}
                     >
                       {stats.revenueByTicketType.map((entry, index) => (
                         <Cell
                           key={`cell-${index}`}
                           fill={COLORS_BY_TICKET[entry.ticket_type] || FALLBACK_COLOR}
                         />
                       ))}
                     </Pie>
                     <Legend
                        layout="horizontal"
                        align="center"
                        verticalAlign="bottom"
                        wrapperStyle={{ paddingTop: '10px' }}
                     />
                   </PieChart>
                 </ResponsiveContainer>
              ) : (
                   <div className="flex items-center justify-center h-full text-muted-foreground">No revenue data by ticket type available for chart.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports Table/List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Latest system reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports && reports.length > 0 ? (
                reports.map((report) => (
                  <div key={report.id} className="border-b pb-4 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{report.event_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Ticket Type: <Badge variant="outline">{report.ticket_type}</Badge>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${report.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-sm text-muted-foreground">
                          {report.total_tickets_sold} tickets sold
                        </p>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-center text-muted-foreground">No recent reports found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemReports;