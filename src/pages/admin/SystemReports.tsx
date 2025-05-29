import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Loader2, Users, BarChart3 } from "lucide-react";

// Define specific colors for each ticket type
const COLORS_BY_TICKET = {
  REGULAR: '#FF8042',    // Orange
  VIP: '#FFBB28',        // Yellow
  STUDENT: '#0088FE',    // Blue
  GROUP_OF_5: '#00C49F', // Green
  COUPLES: '#FF6699',    // Pinkish
  EARLY_BIRD: '#AA336A', // Purple
  VVIP: '#00FF00',       // Bright Green for VVIP
  GIVEAWAY: '#CCCCCC',   // Grey
  UNKNOWN_TYPE: '#A9A9A9', // Darker Grey for unknown types
  // Add other specific ticket types and their colors here (use uppercase)
};

// Fallback color if a ticket type is not in COLORS_BY_TICKET
const FALLBACK_COLOR = COLORS_BY_TICKET.UNKNOWN_TYPE;

// Updated Report interface to match the backend's as_dict() output
interface Report {
  id: number;
  event_id: number;
  event_name: string; // From Report.event.name
  ticket_type_id: number | null; // New field
  ticket_type_name: string | null; // From Report.ticket_type.type_name.value
  total_tickets_sold_summary: number; // Renamed from total_tickets_sold
  total_revenue_summary: number; // Renamed from total_revenue
  report_data: Record<string, any>; // For the JSONB field
  timestamp: string; // From Report.timestamp (ISO format)
}

interface ReportStats {
  totalReports: number;
  totalRevenue: number;
  totalTickets: number;
  reportsByEvent: { event_name: string; count: number; event_id: number }[];
  revenueByTicketType: { ticket_type_name: string; amount: number }[]; // Updated key name
}

interface Organizer {
  id: number;
  name: string;
  email: string;
}

const SystemReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [selectedOrganizer, setSelectedOrganizer] = useState<string>('all');
  const [stats, setStats] = useState<ReportStats>({
    totalReports: 0,
    totalRevenue: 0,
    totalTickets: 0,
    reportsByEvent: [],
    revenueByTicketType: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOrganizers, setIsLoadingOrganizers] = useState(true);
  const [downloadingPdfs, setDownloadingPdfs] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  // Fetch organizers for the dropdown
  useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/organizers`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          // Assuming the API returns an array of organizers or an object with organizers data
          const organizersData = Array.isArray(data) ? data : (data.data || []);
          setOrganizers(organizersData);
        }
      } catch (error) {
        console.error('Error fetching organizers:', error);
        // Don't show error toast for organizers as it's not critical
      } finally {
        setIsLoadingOrganizers(false);
      }
    };

    fetchOrganizers();
  }, []);

  // Fetch reports based on selected organizer
  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        // Build URL with optional organizer_id query parameter
        let url = `${import.meta.env.VITE_API_URL}/admin/reports/summary`;
        if (selectedOrganizer !== 'all') {
          url += `?organizer_id=${selectedOrganizer}`;
        }

        const response = await fetch(url, {
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.message || errorData.error || `Failed with status: ${response.status}`;
          console.error('Error fetching reports:', errorMessage);
          throw new Error(errorMessage);
        }

        const data = await response.json();
        
        // Handle the response structure from AdminReportResource
        let reportsData = [];
        if (data.status === 'success' && data.data) {
          // data.data should be the summary object/array from the backend
          reportsData = Array.isArray(data.data) ? data.data : [];
        }

        if (!Array.isArray(reportsData)) {
          console.error('API response data is not an array:', reportsData);
          throw new Error('Invalid data format received from API');
        }

        setReports(reportsData);

        // Calculate statistics based on the new field names
        const totalRevenue = reportsData.reduce((sum, report) => sum + (report.total_revenue_summary || 0), 0);
        const totalTickets = reportsData.reduce((sum, report) => sum + (report.total_tickets_sold_summary || 0), 0);

        // Group reports by event - now also track event_id for PDF downloads
        const reportsByEvent = reportsData.reduce((acc: Record<string, { count: number; event_id: number }>, report) => {
          const eventName = report.event_name && typeof report.event_name === 'string' ? report.event_name : 'N/A Event';
          if (!acc[eventName]) {
            acc[eventName] = { count: 0, event_id: report.event_id };
          }
          acc[eventName].count += 1;
          return acc;
        }, {});

        // Group revenue by ticket type
        const revenueByTicketType = reportsData.reduce((acc: Record<string, number>, report) => {
          // Use ticket_type_name from the backend, and convert to uppercase for consistent lookup
          const ticketTypeName = report.ticket_type_name && typeof report.ticket_type_name === 'string' ? report.ticket_type_name.toUpperCase() : 'UNKNOWN_TYPE';
          const revenue = typeof report.total_revenue_summary === 'number' ? report.total_revenue_summary : 0;

          acc[ticketTypeName] = (acc[ticketTypeName] || 0) + revenue;
          return acc;
        }, {});

        setStats({
          totalReports: reportsData.length,
          totalRevenue,
          totalTickets,
          reportsByEvent: Object.entries(reportsByEvent).map(([name, data]) => ({
            event_name: name,
            count: (data as { count: number; event_id: number }).count,
            event_id: (data as { count: number; event_id: number }).event_id
          })),
          revenueByTicketType: Object.entries(revenueByTicketType).map(([type, amount]) => ({
            ticket_type_name: type, // Matches the new key name for Pie chart
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
  }, [selectedOrganizer, toast]); // Re-fetch when organizer selection changes

  const downloadPDF = async (eventId: number, eventName: string) => {
    setDownloadingPdfs(prev => new Set([...prev, eventId]));
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports/${eventId}/pdf`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/pdf',
        },
      });

      if (!response.ok) {
        // Try to parse error message if it's JSON
        let errorMessage = `Failed to download PDF (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use default error message
        }
        throw new Error(errorMessage);
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `event_report_${eventId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: `PDF report for "${eventName}" downloaded successfully`,
      });

    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download PDF report",
        variant: "destructive",
      });
    } finally {
      setDownloadingPdfs(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    }
  };

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
      {/* Header with Organizer Filter */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                System Reports
              </CardTitle>
              <CardDescription>
                {selectedOrganizer === 'all' 
                  ? 'All report summaries grouped by event' 
                  : `Report summaries for selected organizer`
                }
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Select 
                value={selectedOrganizer} 
                onValueChange={setSelectedOrganizer}
                disabled={isLoadingOrganizers}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select organizer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizers</SelectItem>
                  {organizers.map((organizer) => (
                    <SelectItem key={organizer.id} value={organizer.id.toString()}>
                      {organizer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

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
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis
                          dataKey="event_name"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          interval={0}
                          style={{ fontSize: '12px' }}
                          tick={{ fill: '#aaa', fontSize: 12 }}
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={{ fill: '#aaa', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: "#1a1a2e", border: 'none', borderRadius: "8px", fontSize: '14px', padding: '8px' }}
                            formatter={(value: number) => [`${value.toLocaleString()} Reports`, 'Count']}
                            labelFormatter={(label) => `Event: ${label}`}
                        />
                        <Bar
                          dataKey="count"
                          fill="#8884d8"
                          radius={[10, 10, 0, 0]}
                          animationDuration={1500}
                        >
                            <LabelList dataKey="count" position="top" fill="#fff" fontSize={12} />
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
                        // Updated formatter to use ticket_type_name
                        formatter={(value: number, name: string, entry: any) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, entry.payload.ticket_type_name]}
                      />
                      <Pie
                        data={stats.revenueByTicketType}
                        dataKey="amount"
                        nameKey="ticket_type_name" // Changed from ticket_type to ticket_type_name
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        animationDuration={1500}
                        labelLine={true}
                        // Updated label to use ticket_type_name
                        label={({ ticket_type_name, percent }) => `${ticket_type_name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {stats.revenueByTicketType.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS_BY_TICKET[entry.ticket_type_name as keyof typeof COLORS_BY_TICKET] || FALLBACK_COLOR} // Corrected type access
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

      {/* Events with PDF Download */}
      <Card>
        <CardHeader>
          <CardTitle>Event Reports</CardTitle>
          <CardDescription>Download PDF reports for each event</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.reportsByEvent && stats.reportsByEvent.length > 0 ? (
                stats.reportsByEvent.map((event) => (
                  <div key={event.event_id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{event.event_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.count} report{event.count !== 1 ? 's' : ''} available
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => downloadPDF(event.event_id, event.event_name)}
                      disabled={downloadingPdfs.has(event.event_id)}
                      variant="outline"
                      size="sm"
                    >
                      {downloadingPdfs.has(event.event_id) ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </>
                      )}
                    </Button>
                  </div>
                ))
            ) : (
              <p className="text-center text-muted-foreground">No events with reports found</p>
            )}
          </div>
        </CardContent>
      </Card>

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
                          Ticket Type: <Badge variant="outline">{report.ticket_type_name || 'N/A'}</Badge> {/* Use ticket_type_name */}
                        </p>
                         <p className="text-xs text-muted-foreground">
                            Generated: {new Date(report.timestamp).toLocaleString()} {/* Display timestamp */}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end space-y-2">
                        <div>
                          <p className="font-medium">${report.total_revenue_summary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p> {/* Use total_revenue_summary */}
                          <p className="text-sm text-muted-foreground">
                            {report.total_tickets_sold_summary} tickets sold {/* Use total_tickets_sold_summary */}
                          </p>
                        </div>
                        <Button
                          onClick={() => downloadPDF(report.event_id, report.event_name)}
                          disabled={downloadingPdfs.has(report.event_id)}
                          variant="outline"
                          size="sm"
                        >
                          {downloadingPdfs.has(report.event_id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
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