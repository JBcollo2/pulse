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
  Mail,
  ListFilter,
  DollarSign,
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
  const [specificDate, setSpecificDate] = useState(''); // New state for specific date
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('overview');
  const [showFilters, setShowFilters] = useState(false);
  const [currencies, setCurrencies] = useState([]); // State for currencies
  const [selectedCurrency, setSelectedCurrency] = useState(''); // State for selected currency
  const [exchangeRates, setExchangeRates] = useState(null); // State for exchange rates
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [recipientEmails, setRecipientEmails] = useState(''); // State for recipient emails
  const [isSendingEmail, setIsSendingEmail] = useState(false); // State for email sending

  const toast = ({ title, description, variant = "default" }) => {
    console.log(`${title}: ${description}`);
    // In a real application, you'd use a toast library here (e.g., react-hot-toast)
    // For example:
    // import { toast } from 'react-hot-toast';
    // toast[variant === "destructive" ? "error" : "success"](title, { description });
  };

  const clearFilters = () => {
    setSelectedOrganizer('all');
    setStartDate('');
    setEndDate('');
    setSpecificDate('');
    setSelectedCurrency('');
    setExchangeRates(null);
    setRecipientEmails('');
  };

  const applyQuickFilter = (days) => {
    const today = new Date();
    let start = new Date(today);
    let end = new Date(today);

    if (days === 0) {
      start = new Date(today);
      setSpecificDate(today.toISOString().split('T')[0]); // Set specific date for "Today"
      setStartDate('');
      setEndDate('');
    } else if (days === 365) {
      start = new Date(today.getFullYear(), 0, 1);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
      setSpecificDate('');
    } else {
      start.setDate(today.getDate() - days + 1);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
      setSpecificDate('');
    }
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

  const handleDateChange = (setDateFunc) => {
    return debounce((date) => {
      if (isValidDate(date) || date === '') { // Allow empty string for clearing
        setDateFunc(date);
      } else {
        toast({
          title: "Invalid Date",
          description: "Please enter a valid date (YYYY-MM-DD).",
          variant: "destructive",
        });
      }
    }, 500);
  };

  const handleStartDateChange = handleDateChange(setStartDate);
  const handleEndDateChange = handleDateChange(setEndDate);
  const handleSpecificDateChange = handleDateChange(setSpecificDate);

  useEffect(() => {
    const fetchOrganizers = async () => {
      setIsLoadingOrganizers(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/organizers`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          const organizersData = Array.isArray(data.organizers) ? data.organizers : []; // Adjust based on backend
          setOrganizers(organizersData);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch organizers');
        }
      } catch (error) {
        console.error('Error fetching organizers:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch organizers",
          variant: "destructive",
        });
      } finally {
        setIsLoadingOrganizers(false);
      }
    };

    const fetchCurrencies = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/currency/list`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setCurrencies(Object.keys(data.currencies)); // Assuming data.currencies is an object of currency codes
        }
      } catch (error) {
        console.error('Error fetching currencies:', error);
        toast({
          title: "Error",
          description: "Failed to fetch currencies.",
          variant: "destructive",
        });
      }
    };

    fetchOrganizers();
    fetchCurrencies();
  }, []);

  const fetchReports = useCallback(async () => {
    if ((startDate && !isValidDate(startDate)) || (endDate && !isValidDate(endDate)) || (specificDate && !isValidDate(specificDate))) {
      toast({
        title: "Error",
        description: "Please enter valid dates.",
        variant: "destructive",
      });
      return;
    }
  
    setIsLoading(true);
    try {
      let url = `${import.meta.env.VITE_API_URL}/admin/reports`;
      const params = new URLSearchParams();
  
      if (selectedOrganizer !== 'all') {
        params.append('organizer_id', selectedOrganizer);
      }
  
      if (specificDate) {
        params.append('specific_date', specificDate);
      } else {
        if (startDate) {
          params.append('start_date', startDate);
        }
        if (endDate) {
          params.append('end_date', endDate);
        }
      }
  
      if (selectedCurrency) {
        params.append('target_currency', selectedCurrency); // Assuming backend takes currency code
      }
  
      // Always request JSON for frontend processing
      params.append('format', 'json');
  
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
      // Backend's /admin/reports endpoint directly returns a structured report
      // We need to adapt the frontend's stats calculation to this structure.
      // Assuming 'data' will now directly contain summed totals and breakdowns.
  
      type EventSummary = {
        event_name?: string;
        report_count?: number;
        total_revenue?: number;
      };
  
      type TicketTypeSummary = {
        total_revenue?: number;
        total_tickets_sold?: number;
      };
  
      type TimeSeriesData = {
        total_revenue?: number;
        total_tickets_sold?: number;
      };
  
      const totalRevenue = data.total_revenue || 0;
      const totalTickets = data.total_tickets_sold || 0;
      const reportsByEvent = Object.entries(data.event_summaries || {}).map(
        ([eventId, eventData]) => {
          const ed = eventData as EventSummary;
          return {
            event_name: ed.event_name || `Event ${eventId}`,
            count: ed.report_count || 0,
            event_id: parseInt(eventId),
            revenue: ed.total_revenue || 0,
          };
        }
      );
  
      const revenueByTicketType = Object.entries(data.ticket_type_summaries || {}).map(
        ([type, typeData]) => {
          const td = typeData as TicketTypeSummary;
          return {
            ticket_type_name: type.toUpperCase(),
            amount: td.total_revenue || 0,
            tickets: td.total_tickets_sold || 0,
          };
        }
      );
  
      // Time series data might need to be fetched separately or integrated if backend provides it
      // For now, let's assume it's part of the main report if requesting a range.
      const timeSeriesData = Object.entries(data.time_series_data || {}).map(
        ([date, dailyData]) => {
          const dd = dailyData as TimeSeriesData;
          return {
            date,
            revenue: dd.total_revenue || 0,
            tickets: dd.total_tickets_sold || 0,
          };
        }
      ).sort((a, b) => a.date.localeCompare(b.date));
  
  
      setStats({
        totalReports: data.total_reports_generated || 0, // Assuming a new field
        totalRevenue,
        totalTickets,
        reportsByEvent,
        revenueByTicketType,
        timeSeriesData
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
  }, [selectedOrganizer, startDate, endDate, specificDate, selectedCurrency]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);


  const fetchExchangeRates = useCallback(async () => {
    if (!startDate && !endDate && !specificDate) {
      toast({
        title: "Information",
        description: "Please select a date range or specific date to fetch exchange rates.",
        variant: "default",
      });
      setExchangeRates(null);
      return;
    }
    if (!selectedCurrency) {
      toast({
        title: "Information",
        description: "Please select a base currency for exchange rates.",
        variant: "default",
      });
      setExchangeRates(null);
      return;
    }

    setIsFetchingRates(true);
    setExchangeRates(null); // Clear previous rates
    try {
      let url = '';
      if (specificDate) {
        // Use latest rates for a specific date if no range is provided
        url = `${import.meta.env.VITE_API_URL}/api/currency/latest?base=${selectedCurrency}&date=${specificDate}`;
      } else if (startDate && endDate) {
        url = `${import.meta.env.VITE_API_URL}/api/currency/range/${startDate}/${endDate}?base=${selectedCurrency}`;
      } else {
        // Fallback to latest if only one date is provided or logic is ambiguous
        url = `${import.meta.env.VITE_API_URL}/api/currency/latest?base=${selectedCurrency}`;
      }

      const response = await fetch(url, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch exchange rates');
      }

      const data = await response.json();
      setExchangeRates(data.data); // Adjust based on backend response structure
      toast({
        title: "Success",
        description: "Exchange rates fetched successfully.",
      });
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch exchange rates.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingRates(false);
    }
  }, [startDate, endDate, specificDate, selectedCurrency]);

  const downloadReport = async (formatType, eventId = null, eventName = '') => {
    let filename = '';
    let mimeType = '';
    let endpoint = `${import.meta.env.VITE_API_URL}/admin/reports`;
    const params = new URLSearchParams();

    if (selectedOrganizer !== 'all') {
      params.append('organizer_id', selectedOrganizer);
    }
    if (specificDate) {
      params.append('specific_date', specificDate);
    } else {
      if (startDate) {
        params.append('start_date', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
      }
    }
    if (selectedCurrency) {
      params.append('target_currency', selectedCurrency);
    }

    params.append('format', formatType);

    if (eventId) {
      params.append('event_id', eventId);
      filename = `event_report_${eventName.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.${formatType}`;
    } else {
      // For all filtered reports
      filename = `all_system_reports_${new Date().toISOString().split('T')[0]}.${formatType}`;
    }

    endpoint += `?${params.toString()}`;

    switch (formatType) {
      case 'pdf':
        mimeType = 'application/pdf';
        setDownloadingPdfs(prev => new Set([...prev, eventId || 'all']));
        break;
      case 'csv':
        mimeType = 'text/csv';
        setIsExportingAll(true); // Re-use for generic "export all"
        break;
      case 'json':
        mimeType = 'application/json';
        setIsExportingAll(true); // Re-use for generic "export all"
        break;
      default:
        console.error("Unsupported format type:", formatType);
        return;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': mimeType,
        },
      });

      if (!response.ok) {
        let errorMessage = `Failed to download ${formatType.toUpperCase()} (${response.status})`;
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
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      window.URL.revokeObjectURL(urlBlob);
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: `${formatType.toUpperCase()} report downloaded successfully.`,
      });

    } catch (error) {
      console.error(`Error downloading ${formatType.toUpperCase()}:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to download ${formatType.toUpperCase()} report`,
        variant: "destructive",
      });
    } finally {
      if (formatType === 'pdf') {
        setDownloadingPdfs(prev => {
          const newSet = new Set(prev);
          newSet.delete(eventId || 'all');
          return newSet;
        });
      } else {
        setIsExportingAll(false);
      }
    }
  };

  const handleSendEmail = async () => {
    if (!recipientEmails) {
      toast({
        title: "Error",
        description: "Please enter recipient email(s).",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      const emailsArray = recipientEmails.split(',').map(email => email.trim()).filter(Boolean);

      let url = `${import.meta.env.VITE_API_URL}/admin/reports`;
      const params = new URLSearchParams();

      if (selectedOrganizer !== 'all') {
        params.append('organizer_id', selectedOrganizer);
      }
      if (specificDate) {
        params.append('specific_date', specificDate);
      } else {
        if (startDate) {
          params.append('start_date', startDate);
        }
        if (endDate) {
          params.append('end_date', endDate);
        }
      }
      if (selectedCurrency) {
        params.append('target_currency', selectedCurrency);
      }

      params.append('send_email', 'true');
      params.append('recipient_email', emailsArray.join(',')); // Backend expects comma-separated

      // We need to ensure the report format is handled by the backend for email attachment.
      // Assuming backend defaults to a reasonable format like PDF for email.
      // If specific format is required, add params.append('format', 'pdf');

      url += `?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET', // Backend uses GET for report generation and sending
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send report email');
      }

      toast({
        title: "Success",
        description: "Report sent to recipient(s) successfully!",
      });

    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send report email.",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Loader2 className="h-5 w-5 animate-spin text-gray-600 dark:text-white" />
              Loading System Reports...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded p-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4">
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl text-gray-900 dark:text-white">
                  <BarChart3 className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                  System Reports Dashboard
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 dark:text-gray-400">
                  {selectedOrganizer === 'all'
                    ? 'Comprehensive analytics across all organizers'
                    : `Analytics for selected organizer`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-all hover:scale-105 border border-gray-300 dark:border-gray-600"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? 'Hide' : 'Show'} Filters
                </Button>
                <Button
                  onClick={() => setViewMode(viewMode === 'overview' ? 'detailed' : 'overview')}
                  className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-all hover:scale-105 border border-gray-300 dark:border-gray-600"
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
                  className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-all hover:scale-105 border border-gray-300 dark:border-gray-600"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {filter.label}
                </Button>
              ))}
            </div>
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  <Label htmlFor="organizer" className="text-gray-900 dark:text-white">Organizer</Label>
                  <Select
                    value={selectedOrganizer}
                    onValueChange={setSelectedOrganizer}
                    disabled={isLoadingOrganizers}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Select organizer" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600">
                      <SelectItem value="all">All Organizers</SelectItem>
                      {organizers.map((organizer) => (
                        <SelectItem key={organizer.organizer_id} value={organizer.organizer_id.toString()}>
                          {organizer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specificDate" className="text-gray-900 dark:text-white">Specific Date</Label>
                  <Input
                    id="specificDate"
                    type="date"
                    value={specificDate}
                    onChange={(e) => { handleSpecificDateChange(e.target.value); setStartDate(''); setEndDate(''); }}
                    className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-gray-900 dark:text-white">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => { handleStartDateChange(e.target.value); setSpecificDate(''); }}
                    className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-gray-900 dark:text-white">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => { handleEndDateChange(e.target.value); setSpecificDate(''); }}
                    min={startDate}
                    className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-gray-900 dark:text-white">Target Currency</Label>
                  <Select
                    value={selectedCurrency}
                    onValueChange={setSelectedCurrency}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600">
                      {currencies.map((currencyCode) => (
                        <SelectItem key={currencyCode} value={currencyCode}>
                          {currencyCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-2">
                  <Button
                    onClick={fetchReports}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 dark:from-blue-600 dark:to-purple-700 dark:hover:from-blue-700 dark:hover:to-purple-800 text-white transition-all hover:scale-105"
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
                    className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-all hover:scale-105 border border-gray-300 dark:border-gray-600"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={fetchExchangeRates}
                    className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white transition-all hover:scale-105"
                    disabled={isFetchingRates || (!startDate && !endDate && !specificDate) || !selectedCurrency}
                  >
                    {isFetchingRates ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Fetching Rates...
                      </>
                    ) : (
                      <>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Get Exchange Rates
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={() => downloadReport('csv')}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 dark:from-green-600 dark:to-emerald-700 dark:hover:from-green-700 dark:hover:to-emerald-800 text-white transition-all hover:scale-105"
                    disabled={isExportingAll || stats.totalReports === 0}
                  >
                    {isExportingAll && downloadingPdfs.has('all') ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Exporting CSV...
                      </>
                    ) : (
                      <>
                        <FileDown className="mr-2 h-4 w-4" />
                        Export CSV
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => downloadReport('json')}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 dark:from-purple-600 dark:to-indigo-700 dark:hover:from-purple-700 dark:hover:to-indigo-800 text-white transition-all hover:scale-105"
                    disabled={isExportingAll || stats.totalReports === 0}
                  >
                    {isExportingAll && downloadingPdfs.has('all') ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Exporting JSON...
                      </>
                    ) : (
                      <>
                        <FileDown className="mr-2 h-4 w-4" />
                        Export JSON
                      </>
                    )}
                  </Button>
                </div>
                <div className="space-y-2 lg:col-span-4">
                  <Label htmlFor="recipientEmails" className="text-gray-900 dark:text-white">Recipient Email(s) (comma-separated)</Label>
                  <Input
                    id="recipientEmails"
                    type="email"
                    value={recipientEmails}
                    onChange={(e) => setRecipientEmails(e.target.value)}
                    placeholder="e.g., admin@example.com, report@example.com"
                    className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  />
                  <Button
                    onClick={handleSendEmail}
                    className="mt-2 bg-gradient-to-r from-pink-500 to-red-600 hover:from-pink-600 hover:to-red-700 dark:from-pink-600 dark:to-red-700 dark:hover:from-pink-700 dark:hover:to-red-800 text-white transition-all hover:scale-105"
                    disabled={isSendingEmail || stats.totalReports === 0 || !recipientEmails.trim()}
                  >
                    {isSendingEmail ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Email...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Report via Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            {exchangeRates && (
              <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 p-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <ListFilter className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                    Exchange Rates ({exchangeRates.base_currency})
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Rates for selected period from {exchangeRates.source}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.entries(exchangeRates.dates).map(([date, rates]) => (
                    <div key={date} className="mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{date}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm">
                        {Object.entries(rates).map(([currency, value]) => (
                          <Badge key={currency} variant="secondary" className="justify-center py-1 px-2">
                            {currency}: {value.toFixed(4)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                  {Object.keys(exchangeRates.dates).length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400">No exchange rates found for the selected period.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all hover:scale-105 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalReports}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Generated reports</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all hover:scale-105 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {selectedCurrency ? `${selectedCurrency} ` : '$'}
              {stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Across all events</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all hover:scale-105 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Tickets</CardTitle>
            <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalTickets}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Tickets sold</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all hover:scale-105 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Avg Revenue/Event</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {selectedCurrency ? `${selectedCurrency} ` : '$'}
              {stats.reportsByEvent.length > 0 ? (stats.totalRevenue / stats.reportsByEvent.length).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Per event average</p>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'detailed' && stats.timeSeriesData.length > 0 && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Revenue & Tickets Over Time</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Daily trends in revenue and ticket sales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-gray-600" />
                  <XAxis dataKey="date" stroke="#64748b" className="dark:stroke-gray-300" />
                  <YAxis yAxisId="left" stroke="#64748b" className="dark:stroke-gray-300" />
                  <YAxis yAxisId="right" orientation="right" stroke="#64748b" className="dark:stroke-gray-300" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: '1px solid #e2e8f0',
                      color: '#1f2937',
                      borderRadius: '8px'
                    }}
                  />
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
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Reports by Event</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Number of reports and revenue per event</CardDescription>
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
                        name === 'count' ? `${value} Reports` : `${selectedCurrency ? selectedCurrency + ' ' : '$'}${value.toLocaleString()}`,
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

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Revenue by Ticket Type</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Revenue distribution across ticket types</CardDescription>
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
                      formatter={(value) => [`${selectedCurrency ? selectedCurrency + ' ' : '$'}${value.toLocaleString()}`, 'Revenue']}
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

      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Event Reports</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">Download reports for each event</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.reportsByEvent && stats.reportsByEvent.length > 0 ? (
              stats.reportsByEvent.map((event) => (
                <div
                  key={event.event_id}
                  className={`flex flex-col sm:flex-row justify-between items-center p-4 border rounded-lg transition-all hover:shadow-md cursor-pointer ${
                    selectedEvent === event.event_id ? 'border-blue-400 bg-gray-700' : 'bg-gray-700 border-gray-600'
                  }`}
                  onClick={() => setSelectedEvent(event.event_id)}
                >
                  <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                    <FileText className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="font-medium text-white">{event.event_name}</p>
                      <p className="text-sm text-gray-400">
                        {event.count} report{event.count !== 1 ? 's' : ''} available
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadReport('pdf', event.event_id, event.event_name);
                      }}
                      disabled={downloadingPdfs.has(event.event_id)}
                      className="bg-gray-600 hover:bg-gray-500 text-white"
                    >
                      {downloadingPdfs.has(event.event_id) ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      PDF
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadReport('csv', event.event_id, event.event_name);
                      }}
                      disabled={isExportingAll}
                      className="bg-gray-600 hover:bg-gray-500 text-white"
                    >
                      {isExportingAll && downloadingPdfs.has('all') ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <FileDown className="h-4 w-4 mr-2" />
                      )}
                      CSV
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadReport('json', event.event_id, event.event_name);
                      }}
                      disabled={isExportingAll}
                      className="bg-gray-600 hover:bg-gray-500 text-white"
                    >
                      {isExportingAll && downloadingPdfs.has('all') ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      JSON
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 p-4">
                No reports found for the selected criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemReports;