import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Loader2, Users, BarChart3, Calendar, FileDown } from "lucide-react"; // Added FileDown icon
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Define specific colors for each ticket type
const COLORS_BY_TICKET = {
  REGULAR: '#FF8042',
  VIP: '#FFBB28',
  STUDENT: '#0088FE',
  GROUP_OF_5: '#00C49F',
  COUPLES: '#FF6699',
  EARLY_BIRD: '#AA336A',
  VVIP: '#00FF00',
  GIVEAWAY: '#CCCCCC',
  UNKNOWN_TYPE: '#A9A9A9',
};

const FALLBACK_COLOR = COLORS_BY_TICKET.UNKNOWN_TYPE;

interface Report {
  id: number;
  event_id: number;
  event_name: string;
  ticket_type_id: number | null;
  ticket_type_name: string | null;
  total_tickets_sold_summary: number;
  total_revenue_summary: number;
  report_data: Record<string, any>;
  timestamp: string;
}

interface ReportStats {
  totalReports: number;
  totalRevenue: number;
  totalTickets: number;
  reportsByEvent: { event_name: string; count: number; event_id: number }[];
  revenueByTicketType: { ticket_type_name: string; amount: number }[];
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
  const [isExportingAll, setIsExportingAll] = useState(false); // New state for all reports export
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const { toast } = useToast();

  // Helper to validate date format (YYYY-MM-DD)
  const isValidDate = (dateString: string) => {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateString) && !isNaN(new Date(dateString).getTime());
  };

  useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/organizers`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          const organizersData = Array.isArray(data) ? data : (data.data || []);
          setOrganizers(organizersData);
        }
      } catch (error) {
        console.error('Error fetching organizers:', error);
      } finally {
        setIsLoadingOrganizers(false);
      }
    };

    fetchOrganizers();
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      let url = `${import.meta.env.VITE_API_URL}/admin/reports/summary`;
      const params = new URLSearchParams();

      if (selectedOrganizer !== 'all') {
        params.append('organizer_id', selectedOrganizer);
      }

      // Validate and append dates only if valid
      if (startDate && isValidDate(startDate)) {
        params.append('start_date', startDate);
      } else if (startDate && !isValidDate(startDate)) {
        toast({
          title: "Invalid Start Date",
          description: "Please enter the start date in YYYY-MM-DD format.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (endDate && isValidDate(endDate)) {
        params.append('end_date', endDate);
      } else if (endDate && !isValidDate(endDate)) {
        toast({
          title: "Invalid End Date",
          description: "Please enter the end date in YYYY-MM-DD format.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        toast({
          title: "Date Range Error",
          description: "Start date cannot be after end date.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }


      if (params.toString()) {
        url += `?${params.toString()}`;
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
      let reportsData = [];
      if (data.status === 'success' && data.data) {
        reportsData = Array.isArray(data.data) ? data.data : [];
      }

      if (!Array.isArray(reportsData)) {
        console.error('API response data is not an array:', reportsData);
        throw new Error('Invalid data format received from API');
      }

      setReports(reportsData);

      const totalRevenue = reportsData.reduce((sum, report) => sum + (report.total_revenue_summary || 0), 0);
      const totalTickets = reportsData.reduce((sum, report) => sum + (report.total_tickets_sold_summary || 0), 0);

      const reportsByEvent = reportsData.reduce((acc: Record<string, { count: number; event_id: number }>, report) => {
        const eventName = report.event_name && typeof report.event_name === 'string' ? report.event_name : 'N/A Event';
        if (!acc[eventName]) {
          acc[eventName] = { count: 0, event_id: report.event_id };
        }
        acc[eventName].count += 1;
        return acc;
      }, {});

      const revenueByTicketType = reportsData.reduce((acc: Record<string, number>, report) => {
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
          ticket_type_name: type,
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

  useEffect(() => {
    // Initial fetch of reports when component mounts or filters change
    fetchReports();
  }, [selectedOrganizer, toast]); // Removed startDate and endDate from dependency array to allow manual trigger by Apply Filter

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
        let errorMessage = `Failed to download PDF (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use default error message
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `event_report_${eventId}.pdf`;
      document.body.appendChild(link);
      link.click();

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

  const exportAllReports = async () => {
    setIsExportingAll(true);
    try {
      // You would call an API endpoint that generates a consolidated report (e.g., CSV or a single PDF with all data)
      // For demonstration, let's assume an endpoint that returns a CSV of all filtered reports.
      let url = `${import.meta.env.VITE_API_URL}/admin/reports/export-all`; // New API endpoint for exporting all reports
      const params = new URLSearchParams();

      if (selectedOrganizer !== 'all') {
        params.append('organizer_id', selectedOrganizer);
      }
      if (startDate && isValidDate(startDate)) {
        params.append('start_date', startDate);
      }
      if (endDate && isValidDate(endDate)) {
        params.append('end_date', endDate);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'text/csv', // Example: for CSV, adjust based on your backend
        },
      });

      if (!response.ok) {
        let errorMessage = `Failed to export all reports (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use default error message
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      link.download = `all_system_reports_${new Date().toISOString().split('T')[0]}.csv`; // Dynamic filename
      document.body.appendChild(link);
      link.click();

      window.URL.revokeObjectURL(urlBlob);
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "All filtered reports exported successfully.",
      });

    } catch (error) {
      console.error('Error exporting all reports:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to export all reports.",
        variant: "destructive",
      });
    } finally {
      setIsExportingAll(false);
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

  if (!isLoading && reports.length === 0 && (startDate || endDate || selectedOrganizer !== 'all')) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>System Reports</CardTitle>
            <CardDescription>No reports found for the selected filters.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">Adjust your filters and try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
                  : `Report summaries for selected organizer`}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-4"> {/* Changed to flex-wrap for better responsiveness */}
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
              <div className="flex items-center gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="text" // Changed to text
                  placeholder="YYYY-MM-DD" // Added placeholder
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  onBlur={() => { // Added onBlur validation
                    if (startDate && !isValidDate(startDate)) {
                      toast({
                        title: "Invalid Start Date Format",
                        description: "Please use YYYY-MM-DD format.",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="border rounded p-2"
                  maxLength={10} // Restrict length for YYYY-MM-DD
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="text" // Changed to text
                  placeholder="YYYY-MM-DD" // Added placeholder
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  onBlur={() => { // Added onBlur validation
                    if (endDate && !isValidDate(endDate)) {
                      toast({
                        title: "Invalid End Date Format",
                        description: "Please use YYYY-MM-DD format.",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="border rounded p-2"
                  maxLength={10} // Restrict length for YYYY-MM-DD
                />
              </div>
              <Button
                onClick={fetchReports}
                className="bg-gradient-to-r from-[--primary] to-[--secondary] hover:from-[--primary] hover:to-[--secondary] min-w-[140px] hover:scale-105 transition-all"
                disabled={isLoading} // Disable only during fetching, not just for date presence
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <BarChart3 className="mr-2 h-4 w-4" />
                )}
                Apply Filter
              </Button>
              <Button
                onClick={exportAllReports} // New button for exporting all reports
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 min-w-[140px] hover:scale-105 transition-all"
                disabled={isExportingAll || reports.length === 0}
              >
                {isExportingAll ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="mr-2 h-4 w-4" />
                )}
                Export All
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

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

      <div className="grid gap-4 md:grid-cols-2">
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
                      formatter={(value: number, name: string, entry: any) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, entry.payload.ticket_type_name]}
                    />
                    <Pie
                      data={stats.revenueByTicketType}
                      dataKey="amount"
                      nameKey="ticket_type_name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      animationDuration={1500}
                      labelLine={true}
                      label={({ ticket_type_name, percent }) => `${ticket_type_name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.revenueByTicketType.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS_BY_TICKET[entry.ticket_type_name as keyof typeof COLORS_BY_TICKET] || FALLBACK_COLOR}
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
              <p className="text-center text-muted-foreground">No events with reports found for the current filters.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemReports;