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
  AlertCircle,
  CheckCircle,
  Activity,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Toast notification system
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { ...notification, id }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const toast = ({ title, description, variant = "default" }) => {
    addNotification({ title, description, variant });
  };

  const clearFilters = () => {
    setSelectedOrganizer('all');
    setStartDate('');
    setEndDate('');
    setError(null);
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
    setError(null);
  };

  const isValidDate = (dateString) => {
    if (!dateString) return true;
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
        setError(null);
      } else {
        setError('Invalid date format');
      }
    }, 500);
  };

  const handleStartDateChange = handleDateChange(setStartDate);
  const handleEndDateChange = handleDateChange(setEndDate);

  useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        setIsLoadingOrganizers(true);
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/organizers`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('Access denied. Admin privileges required.');
          }
          if (response.status === 401) {
            throw new Error('Authentication failed. Please log in again.');
          }
          throw new Error(`Failed to fetch organizers: ${response.status}`);
        }

        const data = await response.json();
        const organizersData = Array.isArray(data) ? data : (data.data || []);
        setOrganizers(organizersData);

        toast({
          title: "Success",
          description: `Loaded ${organizersData.length} organizers`,
        });

      } catch (error) {
        console.error('Error fetching organizers:', error);
        setError(`Failed to load organizers: ${error.message}`);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoadingOrganizers(false);
      }
    };

    fetchOrganizers();
  }, []);

  const fetchReports = useCallback(async () => {
    if ((startDate && !isValidDate(startDate)) || (endDate && !isValidDate(endDate))) {
      setError("Please enter valid dates");
      toast({
        title: "Error",
        description: "Please enter valid dates.",
        variant: "destructive",
      });
      return;
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError("Start date cannot be after end date");
      toast({
        title: "Error",
        description: "Start date cannot be after end date.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

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

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Admin privileges required.');
        }
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }

        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `Request failed with status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.status === 'error') {
        throw new Error(data.message || 'Unknown error occurred');
      }

      let reportsData = Array.isArray(data.data) ? data.data : [];

      setReports(reportsData);

      const totalRevenue = reportsData.reduce((sum, report) => {
        const revenue = parseFloat(report.total_revenue_summary) || parseFloat(report.amount) || 0;
        return sum + revenue;
      }, 0);

      const totalTickets = reportsData.reduce((sum, report) => {
        const tickets = parseInt(report.total_tickets_sold_summary) || parseInt(report.tickets) || 0;
        return sum + tickets;
      }, 0);

      type ReportsByEventAccumulator = Record<string, { count: number; event_id: string; revenue: number; tickets: number }>;
      const reportsByEvent = reportsData.reduce((acc: ReportsByEventAccumulator, report) => {
        const eventName = report.event_name || 'Unknown Event';
        const eventId = report.event_id || Math.random().toString();

        if (!acc[eventName]) {
          acc[eventName] = {
            count: 0,
            event_id: eventId,
            revenue: 0,
            tickets: 0
          };
        }

        acc[eventName].count += 1;
        acc[eventName].revenue += parseFloat(report.total_revenue_summary) || parseFloat(report.amount) || 0;
        acc[eventName].tickets += parseInt(report.total_tickets_sold_summary) || parseInt(report.tickets) || 0;

        return acc;
      }, {} as ReportsByEventAccumulator);

      type RevenueByTicketTypeAccumulator = Record<string, { amount: number; tickets: number }>;
      const revenueByTicketType = reportsData.reduce((acc: RevenueByTicketTypeAccumulator, report) => {
        const ticketTypeName = (report.ticket_type_name || 'UNKNOWN_TYPE').toString().toUpperCase();
        const revenue = parseFloat(report.total_revenue_summary) || parseFloat(report.amount) || 0;
        const tickets = parseInt(report.total_tickets_sold_summary) || parseInt(report.tickets) || 0;

        if (!acc[ticketTypeName]) {
          acc[ticketTypeName] = { amount: 0, tickets: 0 };
        }
        acc[ticketTypeName].amount += revenue;
        acc[ticketTypeName].tickets += tickets;
        return acc;
      }, {} as RevenueByTicketTypeAccumulator);

      const timeSeriesData = reportsData.reduce((acc, report) => {
        const timestamp = report.timestamp || report.created_at || new Date().toISOString();
        const date = new Date(timestamp).toISOString().split('T')[0];
        const revenue = parseFloat(report.total_revenue_summary) || parseFloat(report.amount) || 0;
        const tickets = parseInt(report.total_tickets_sold_summary) || parseInt(report.tickets) || 0;

        if (!acc[date]) {
          acc[date] = { revenue: 0, tickets: 0 };
        }
        acc[date].revenue += revenue;
        acc[date].tickets += tickets;
        return acc;
      }, {});

      setStats({
        totalReports: reportsData.length,
        totalRevenue,
        totalTickets,
        reportsByEvent: Object.entries(reportsByEvent).map(([name, data]) => {
          const eventData = data as { count: number; event_id: string; revenue: number; tickets: number };
          return {
            event_name: name,
            count: eventData.count,
            event_id: eventData.event_id,
            revenue: eventData.revenue,
            tickets: eventData.tickets
          };
        }).sort((a, b) => b.revenue - a.revenue),
        revenueByTicketType: Object.entries(revenueByTicketType)
          .map(([type, data]) => ({
            ticket_type_name: type,
            amount: (data as { amount: number }).amount,
            tickets: (data as { tickets: number }).tickets
          }))
          .filter(item => item.amount > 0)
          .sort((a, b) => b.amount - a.amount),
        timeSeriesData: Object.entries(timeSeriesData)
          .map(([date, data]) => ({
            date,
            revenue: (data as { revenue: number; tickets: number }).revenue,
            tickets: (data as { revenue: number; tickets: number }).tickets
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
      });

      setLastUpdated(new Date());

      toast({
        title: "Success",
        description: `Loaded ${reportsData.length} reports successfully`,
      });

    } catch (error) {
      console.error('Error fetching reports:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: error.message,
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
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports/${eventId}/pdf`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/pdf',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
      });

      if (!response.ok) {
        let errorMessage = `Failed to download PDF (${response.status})`;

        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          }
        } catch {
          // If response is not JSON, use default error message
        }

        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `event_report_${eventId}_${new Date().toISOString().split('T')[0]}.pdf`;
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
        description: error.message,
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

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'text/csv',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
      });

      if (!response.ok) {
        let errorMessage = `Failed to export all reports (${response.status})`;

        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          }
        } catch {
          // If response is not JSON, use default error message
        }

        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;

      const filename = `system_reports_${selectedOrganizer !== 'all' ? `organizer_${selectedOrganizer}_` : ''}${new Date().toISOString().split('T')[0]}.csv`;
      link.download = filename;

      document.body.appendChild(link);
      link.click();

      window.URL.revokeObjectURL(urlBlob);
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: `All filtered reports exported successfully as ${filename}`,
      });

    } catch (error) {
      console.error('Error exporting all reports:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExportingAll(false);
    }
  };

  if (isLoading && !reports.length) {
    return (
      <div className="space-y-6 bg-gray-900 text-white p-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
              Loading System Reports...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse bg-gray-700 rounded p-4">
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
    <div className="space-y-6 bg-gray-900 text-white p-4 min-h-screen">
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <Alert
            key={notification.id}
            className={`w-96 ${notification.variant === 'destructive' ? 'border-red-500 bg-red-900/50' : 'border-green-500 bg-green-900/50'}`}
          >
            {notification.variant === 'destructive' ?
              <AlertCircle className="h-4 w-4" /> :
              <CheckCircle className="h-4 w-4" />
            }
            <AlertDescription>
              <strong>{notification.title}:</strong> {notification.description}
            </AlertDescription>
          </Alert>
        ))}
      </div>

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
                  {lastUpdated && (
                    <span className="ml-2 text-sm">
                      • Last updated: {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
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
                  size="sm"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {filter.label}
                </Button>
              ))}
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-800 rounded-lg border border-gray-600">
                <div className="space-y-2">
                  <Label htmlFor="organizer" className="text-white">Organizer</Label>
                  <Select
                    value={selectedOrganizer}
                    onValueChange={setSelectedOrganizer}
                    disabled={isLoadingOrganizers}
                  >
                    <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                      <SelectValue placeholder="Select organizer" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 text-white border-gray-600">
                      <SelectItem value="all">All Organizers</SelectItem>
                      {organizers.map((organizer) => (
                        <SelectItem key={organizer.id} value={organizer.id.toString()}>
                          {organizer.name || organizer.email || `Organizer ${organizer.id}`}
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
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="bg-gray-700 text-white border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-white">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Apply Filters
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="mr-2 h-4 w-4" />
                    )}
                    Export All ({reports.length})
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <Alert className="border-red-500 bg-red-900/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gray-800 border-gray-700 transition-all hover:scale-105 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{stats.totalReports.toLocaleString()}</div>
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
            <div className="text-2xl font-bold text-purple-400">{stats.totalTickets.toLocaleString()}</div>
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
            <p className="text-xs text-gray-400">Average revenue per event</p>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'overview' ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Revenue by Ticket Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.revenueByTicketType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                      label={({ ticket_type_name, percent }) => `${ticket_type_name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.revenueByTicketType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_BY_TICKET[entry.ticket_type_name] || FALLBACK_COLOR} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Reports by Event</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.reportsByEvent}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                    <XAxis dataKey="event_name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                    <Bar dataKey="revenue" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Detailed Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Event Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Tickets Sold
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {report.event_name || 'Unnamed Event'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        ${(parseFloat(report.total_revenue_summary) || parseFloat(report.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {parseInt(report.total_tickets_sold_summary) || parseInt(report.tickets) || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          onClick={() => downloadPDF(report.event_id, report.event_name)}
                          disabled={downloadingPdfs.has(report.event_id)}
                          className="bg-gray-700 hover:bg-gray-600 text-white transition-all hover:scale-105"
                        >
                          {downloadingPdfs.has(report.event_id) ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Revenue Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemReports;
