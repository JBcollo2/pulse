import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  FileText,
  Loader2,
  Users,
  BarChart3,
  Calendar,
  FileDown,
  Filter,
  RefreshCw,
  TrendingUp,
  Eye,
  Clock,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

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

// Quick filter presets
const QUICK_FILTERS = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'This Year', days: 365 },
];

const SystemReports = () => {
  const [reports, setReports] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [selectedOrganizer, setSelectedOrganizer] = useState('all');
  const [stats, setStats] = useState({
    totalReports: 0,
    totalRevenue: 0,
    totalTickets: 0,
    reportsByEvent: [],
    revenueByTicketType: [],
    timeSeriesData: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOrganizers, setIsLoadingOrganizers] = useState(true);
  const [downloadingPdfs, setDownloadingPdfs] = useState(new Set());
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('overview');
  const [showFilters, setShowFilters] = useState(false);

  const toast = ({ title, description, variant = "default" }) => {
    console.log(`${title}: ${description}`);
  };

  const clearFilters = () => {
    setSelectedOrganizer('all');
    setStartDate('');
    setEndDate('');
  };

  const applyQuickFilter = (days) => {
    const today = new Date();
    let start = new Date(today);
    let end = new Date(today);

    if (days === 0) {
      start = new Date(today);
    } else if (days === 365) {
      start = new Date(today.getFullYear(), 0, 1);
    } else {
      start.setDate(today.getDate() - days + 1);
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const debounce = (func, delay) => {
    let debounceTimer;
    return function(...args) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };
  };

  const handleDateChange = (setDate) => {
    return debounce((date) => {
      if (isValidDate(date)) {
        setDate(date);
      } else {
        console.error('Invalid date');
      }
    }, 500);
  };

  const handleStartDateChange = handleDateChange(setStartDate);
  const handleEndDateChange = handleDateChange(setEndDate);

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

  const fetchReports = useCallback(async () => {
    if ((startDate && !isValidDate(startDate)) || (endDate && !isValidDate(endDate))) {
      toast({
        title: "Error",
        description: "Please enter valid dates.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let url = `${import.meta.env.VITE_API_URL}/admin/reports/summary`;
      const params = new URLSearchParams();

      if (selectedOrganizer !== 'all') {
        params.append('organizer_id', selectedOrganizer);
      }

      if (startDate) {
        params.append('start_date', startDate);
      }

      if (endDate) {
        params.append('end_date', endDate);
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
      let reportsData = Array.isArray(data.data) ? data.data : [];

      setReports(reportsData);

      const totalRevenue = reportsData.reduce((sum, report) => sum + (report.total_revenue_summary || 0), 0);
      const totalTickets = reportsData.reduce((sum, report) => sum + (report.total_tickets_sold_summary || 0), 0);

      const reportsByEvent = reportsData.reduce((acc, report) => {
        const eventName = report.event_name || 'N/A Event';
        if (!acc[eventName]) {
          acc[eventName] = { count: 0, event_id: report.event_id, revenue: 0 };
        }
        acc[eventName].count += 1;
        acc[eventName].revenue += report.total_revenue_summary || 0;
        return acc;
      }, {});

      const revenueByTicketType = reportsData.reduce((acc, report) => {
        const ticketTypeName = (report.ticket_type_name || 'UNKNOWN_TYPE').toUpperCase();
        const revenue = report.total_revenue_summary || 0;
        const tickets = report.total_tickets_sold_summary || 0;

        if (!acc[ticketTypeName]) {
          acc[ticketTypeName] = { amount: 0, tickets: 0 };
        }
        acc[ticketTypeName].amount += revenue;
        acc[ticketTypeName].tickets += tickets;
        return acc;
      }, {});

      const timeSeriesData = reportsData.reduce((acc: Record<string, { revenue: number; tickets: number }>, report) => {
        const date = new Date(report.timestamp).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { revenue: 0, tickets: 0 };
        }
        acc[date].revenue += report.total_revenue_summary || 0;
        acc[date].tickets += report.total_tickets_sold_summary || 0;
        return acc;
      }, {} as Record<string, { revenue: number; tickets: number }>);

      setStats({
        totalReports: reportsData.length,
        totalRevenue,
        totalTickets,
        reportsByEvent: Object.entries(reportsByEvent).map(([name, data]) => ({
          event_name: name,
          count: (data as { count: number; event_id: number; revenue: number }).count,
          event_id: (data as { count: number; event_id: number; revenue: number }).event_id,
          revenue: (data as { count: number; event_id: number; revenue: number }).revenue
        })),
        revenueByTicketType: Object.entries(revenueByTicketType).map(([type, data]: [string, { amount: number; tickets: number }]) => ({
          ticket_type_name: type,
          amount: data.amount,
          tickets: data.tickets
        })),
        timeSeriesData: Object.entries(timeSeriesData).map(([date, data]) => ({
          date,
          revenue: (data as { revenue: number; tickets: number }).revenue,
          tickets: (data as { revenue: number; tickets: number }).tickets
        })).sort((a, b) => a.date.localeCompare(b.date))
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
  }, [selectedOrganizer, startDate, endDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const downloadPDF = async (eventId, eventName) => {
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
      let url = `${import.meta.env.VITE_API_URL}/admin/reports/export-all`;
      const params = new URLSearchParams();

      if (selectedOrganizer !== 'all') {
        params.append('organizer_id', selectedOrganizer);
      }
      if (startDate) {
        params.append('start_date', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'text/csv',
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
      link.download = `all_system_reports_${new Date().toISOString().split('T')[0]}.csv`;
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
      <div className="space-y-6 bg-gray-900 text-white p-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
              Loading System Reports...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse bg-gray-700 rounded p-2">
                  <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-900 text-white p-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl text-white">
                  <BarChart3 className="h-6 w-6 text-blue-400" />
                  System Reports Dashboard
                </CardTitle>
                <CardDescription className="text-lg text-gray-400">
                  {selectedOrganizer === 'all'
                    ? 'Comprehensive analytics across all organizers'
                    : `Analytics for selected organizer`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  className="bg-gray-700 hover:bg-gray-600 text-white transition-all hover:scale-105"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? 'Hide' : 'Show'} Filters
                </Button>
                <Button
                  onClick={() => setViewMode(viewMode === 'overview' ? 'detailed' : 'overview')}
                  className="bg-gray-700 hover:bg-gray-600 text-white transition-all hover:scale-105"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {viewMode === 'overview' ? 'Detailed' : 'Overview'} View
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_FILTERS.map((filter) => (
                <Button
                  key={filter.label}
                  onClick={() => applyQuickFilter(filter.days)}
                  className="bg-gray-700 hover:bg-gray-600 text-white transition-all hover:scale-105"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {filter.label}
                </Button>
              ))}
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-800 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="organizer" className="text-white">Organizer</Label>
                  <Select
                    value={selectedOrganizer}
                    onValueChange={setSelectedOrganizer}
                    disabled={isLoadingOrganizers}
                  >
                    <SelectTrigger className="bg-gray-700 text-white">
                      <SelectValue placeholder="Select organizer" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 text-white">
                      <SelectItem value="all">All Organizers</SelectItem>
                      {organizers.map((organizer) => (
                        <SelectItem key={organizer.id} value={organizer.id.toString()}>
                          {organizer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-white">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="bg-gray-700 text-white border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-white">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    min={startDate}
                    className="bg-gray-700 text-white border-gray-600"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <Button
                    onClick={fetchReports}
                    className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white transition-all hover:scale-105"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Apply Filters
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={clearFilters}
                    className="bg-gray-700 hover:bg-gray-600 text-white transition-all hover:scale-105"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={exportAllReports}
                    className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white transition-all hover:scale-105"
                    disabled={isExportingAll || reports.length === 0}
                  >
                    {isExportingAll ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <FileDown className="mr-2 h-4 w-4" />
                        Export All
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700 transition-all hover:scale-105 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{stats.totalReports}</div>
            <p className="text-xs text-gray-400">Generated reports</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 transition-all hover:scale-105 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-400">Across all events</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 transition-all hover:scale-105 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Tickets</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{stats.totalTickets}</div>
            <p className="text-xs text-gray-400">Tickets sold</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 transition-all hover:scale-105 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Avg Revenue/Event</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">
              ${stats.reportsByEvent.length > 0 ? (stats.totalRevenue / stats.reportsByEvent.length).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </div>
            <p className="text-xs text-gray-400">Per event average</p>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'detailed' && stats.timeSeriesData.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Revenue & Tickets Over Time</CardTitle>
            <CardDescription className="text-gray-400">Daily trends in revenue and ticket sales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="date" stroke="#ccc" />
                  <YAxis yAxisId="left" stroke="#ccc" />
                  <YAxis yAxisId="right" orientation="right" stroke="#ccc" />
                  <Tooltip contentStyle={{ backgroundColor: "#333", border: 'none', color: 'white' }} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="tickets"
                    stackId="2"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gray-800 border-gray-700 transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-white">Reports by Event</CardTitle>
            <CardDescription className="text-gray-400">Number of reports and revenue per event</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {stats.reportsByEvent && stats.reportsByEvent.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.reportsByEvent}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis
                      dataKey="event_name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      stroke="#ccc"
                      fontSize={12}
                    />
                    <YAxis stroke="#ccc" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#333", border: 'none', color: 'white' }}
                      formatter={(value, name) => [
                        name === 'count' ? `${value} Reports` : `$${value.toLocaleString()}`,
                        name === 'count' ? 'Reports' : 'Revenue'
                      ]}
                    />
                    <Bar
                      dataKey="count"
                      fill="#8884d8"
                      name="count"
                      radius={[4, 4, 0, 0]}
                    />
                    {viewMode === 'detailed' && (
                      <Bar
                        dataKey="revenue"
                        fill="#82ca9d"
                        name="revenue"
                        radius={[4, 4, 0, 0]}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No event data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-white">Revenue by Ticket Type</CardTitle>
            <CardDescription className="text-gray-400">Revenue distribution across ticket types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {stats.revenueByTicketType && stats.revenueByTicketType.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.revenueByTicketType}
                      dataKey="amount"
                      nameKey="ticket_type_name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      label={({ ticket_type_name, percent }) => `${ticket_type_name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.revenueByTicketType.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS_BY_TICKET[entry.ticket_type_name] || FALLBACK_COLOR}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#333", border: 'none', color: 'white' }}
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No revenue data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Event Reports</CardTitle>
          <CardDescription className="text-gray-400">Download PDF reports for each event</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.reportsByEvent && stats.reportsByEvent.length > 0 ? (
              stats.reportsByEvent.map((event) => (
                <div
                  key={event.event_id}
                  className={`flex justify-between items-center p-4 border rounded-lg transition-all hover:shadow-md cursor-pointer ${
                    selectedEvent === event.event_id ? 'border-blue-400 bg-gray-700' : 'bg-gray-700 border-gray-600'
                  }`}
                  onClick={() => setSelectedEvent(event.event_id)}
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="font-medium text-white">{event.event_name}</p>
                      <p className="text-sm text-gray-400">
                        {event.count} report{event.count !== 1 ? 's' : ''} available
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadPDF(event.event_id, event.event_name);
                    }}
                    disabled={downloadingPdfs.has(event.event_id)}
                    className="bg-gray-600 hover:bg-gray-500 text-white"
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
              <p className="text-center text-gray-400">No events with reports found for the current filters.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemReports;
