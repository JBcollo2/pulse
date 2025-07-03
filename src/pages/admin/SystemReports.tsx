import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  DollarSign,
  Globe,
  ArrowUpDown,
  RefreshCw,
  Loader2,
  TrendingUp,
  Users,
  FileText,
  AlertCircle,
  ChevronDown,
  Calendar,
  Building,
} from "lucide-react";
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
} from 'recharts';

// Color scheme for charts
const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// Interfaces
interface Organizer {
  organizer_id: number;
  name: string;
}

interface Event {
  event_id: number;
  name: string;
  event_date?: string;
  status?: string;
}

interface CurrencyOption {
  value: string; // Currency code like 'USD'
  label: string; // Currency code like 'USD'
  id: number;    // Currency ID from backend
  symbol: string; // Currency symbol
}

interface ReportSummary {
  total_tickets_sold: number;
  total_revenue: number;
  total_attendees: number;
  event_count: number;
  report_count: number;
  currency: string;
  currency_symbol: string;
  events: Array<{
    event_id: number;
    event_name: string;
    event_date: string;
    location: string;
    tickets_sold: number;
    revenue: number;
    attendees: number;
    report_count: number;
  }>;
}

interface AdminEventReportResponse {
  event_info: {
    event_id: number;
    event_name: string;
    event_date: string;
    location: string;
    organizer_id: number;
    organizer_name: string;
  };
  fresh_report_data: {
    event_summary: ReportSummary;
    currency_info: {
      currency: string;
      currency_symbol: string;
    };
  };
  existing_reports: Array<{
    id: number;
    event_id: number;
    total_revenue: number; // Original revenue
    base_currency: {
      code: string;
      symbol: string;
    };
    converted_revenue: number; // Converted revenue if applicable
    converted_currency: {
      code: string;
      symbol: string;
    };
    tickets_sold_by_type: { [key: string]: number };
    revenue_by_ticket_type: { [key: string]: number };
  }>;
  // Other fields from the backend response can be added if needed
}

interface DashboardStats {
  originalRevenue: number; // Sum of original revenues from all reports
  totalRevenue: number; // This will be the converted revenue if a target currency is selected
  totalTickets: number;
  exchangeRate: number;
  ticketBreakdown: Array<{
    name: string;
    value: number; // Count
    revenue: number; // Revenue for this ticket type (in target currency)
  }>;
  targetCurrencyCode: string;
  targetCurrencySymbol: string;
}

// Custom Components (Tailwind CSS for styling)
const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, disabled = false, className = "", variant = "default" }) => {
  const baseClasses = "px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2";
  const variants = {
    default: "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400",
    success: "bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Select = ({ value, onChange, options, placeholder = "Select...", loading = false, className = "" }) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading}
      className="w-full px-4 py-2 pr-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white disabled:opacity-50"
    >
      <option value="">{loading ? "Loading..." : placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
  </div>
);

const Toast = ({ message, type = "success", onClose }) => (
  <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
    type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
  }`}>
    <div className="flex items-center gap-2">
      {type === 'success' ? (
        <div className="h-4 w-4 bg-green-200 rounded-full flex items-center justify-center">
          <div className="h-2 w-2 bg-green-600 rounded-full"></div>
        </div>
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">×</button>
    </div>
  </div>
);

const SystemReports = () => {
  // State management
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [selectedOrganizer, setSelectedOrganizer] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>('USD'); // Stores currency code
  const [baseCurrencyCode] = useState<string>('USD'); // Assuming original reports are in USD

  // Data states
  const [reportApiResponse, setReportApiResponse] = useState<AdminEventReportResponse | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    originalRevenue: 0,
    totalRevenue: 0,
    totalTickets: 0,
    exchangeRate: 1,
    ticketBreakdown: [],
    targetCurrencyCode: 'USD',
    targetCurrencySymbol: '$',
  });

  // Loading states
  const [isLoadingOrganizers, setIsLoadingOrganizers] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isLoadingExchangeRate, setIsLoadingExchangeRate] = useState(false);
  const [error, setError] = useState<string>('');

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Helper to get currency ID from code
  const getCurrencyIdFromCode = useCallback((code: string): number | null => {
    const currency = currencies.find(c => c.value === code);
    return currency ? currency.id : null;
  }, [currencies]);

  // Helper to get currency symbol from code
  const getCurrencySymbolFromCode = useCallback((code: string): string => {
    const currency = currencies.find(c => c.value === code);
    return currency ? currency.symbol : '$';
  }, [currencies]);

  // Toast notification helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Fetch organizers
  useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        setIsLoadingOrganizers(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/organizers`, {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setOrganizers(data.organizers || []);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch organizers';
        setError(errorMessage);
        console.error('Error fetching organizers:', error);
        showToast(errorMessage, 'error');
      } finally {
        setIsLoadingOrganizers(false);
      }
    };
    fetchOrganizers();
  }, []);

  // Fetch events when organizer changes
  useEffect(() => {
    const fetchEvents = async () => {
      if (!selectedOrganizer) {
        setEvents([]);
        return;
      }

      setIsLoadingEvents(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/organizers/${selectedOrganizer}/events`, {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setEvents(data.events || []);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch events';
        setError(errorMessage);
        console.error('Error fetching events:', error);
        showToast(errorMessage, 'error');
      } finally {
        setIsLoadingEvents(false);
      }
    };
    fetchEvents();
  }, [selectedOrganizer]);

  // Fetch currencies
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        setIsLoadingCurrencies(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/currency/list`, {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const currencyOptions: CurrencyOption[] = data.data.map((c: any) => ({
          value: c.code,
          label: c.code,
          id: c.id,
          symbol: c.symbol,
        }));
        setCurrencies(currencyOptions);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch currencies';
        setError(errorMessage);
        console.error('Error fetching currencies:', error);
        showToast(errorMessage, 'error');
      } finally {
        setIsLoadingCurrencies(false);
      }
    };
    fetchCurrencies();
  }, []);

  // Fetch exchange rate for display
  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (selectedCurrencyCode === baseCurrencyCode) {
        setDashboardStats(prev => ({ ...prev, exchangeRate: 1 }));
        return;
      }

      setIsLoadingExchangeRate(true);
      try {
        // Fetch latest rates for the base currency (USD)
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/currency/latest?base=${baseCurrencyCode}`, {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const rate = data.data?.rates?.[selectedCurrencyCode] || 1;
        setDashboardStats(prev => ({
          ...prev,
          exchangeRate: rate,
        }));
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
        setError('Failed to fetch exchange rate');
        showToast('Failed to fetch exchange rate', 'error');
        setDashboardStats(prev => ({ ...prev, exchangeRate: 1 }));
      } finally {
        setIsLoadingExchangeRate(false);
      }
    };
    fetchExchangeRate();
  }, [selectedCurrencyCode, baseCurrencyCode]);


  // Fetch report data
  const fetchReportData = useCallback(async () => {
    if (!selectedOrganizer || !selectedEvent) {
      showToast('Please select both organizer and event', 'error');
      return;
    }
    setIsLoadingReport(true);
    setError('');

    const targetCurrencyId = getCurrencyIdFromCode(selectedCurrencyCode);
    if (selectedCurrencyCode && !targetCurrencyId) {
      showToast('Selected currency not found in system.', 'error');
      setIsLoadingReport(false);
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append('organizer_id', selectedOrganizer);
      params.append('event_id', selectedEvent);
      if (targetCurrencyId) {
        params.append('currency_id', targetCurrencyId.toString());
        params.append('use_latest_rates', 'true'); // Always use latest rates for conversion
      }

      const url = `${import.meta.env.VITE_API_URL}/admin/reports?${params.toString()}`;

      const response = await fetch(url, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const reportResponse: AdminEventReportResponse = await response.json();
      setReportApiResponse(reportResponse);

      const summary = reportResponse.fresh_report_data.event_summary;
      const currencyInfo = reportResponse.fresh_report_data.currency_info;

      // Aggregate ticket breakdown from existing_reports
      const aggregatedTicketBreakdown: { [key: string]: { count: number; revenue: number } } = {};
      reportResponse.existing_reports.forEach(report => {
        // Use converted_revenue and converted_currency if available, otherwise original
        const currentRevenue = report.converted_revenue !== undefined && report.converted_revenue !== null
          ? report.converted_revenue
          : report.total_revenue;

        if (report.tickets_sold_by_type) {
          for (const type in report.tickets_sold_by_type) {
            aggregatedTicketBreakdown[type] = aggregatedTicketBreakdown[type] || { count: 0, revenue: 0 };
            aggregatedTicketBreakdown[type].count += report.tickets_sold_by_type[type];
          }
        }
        // Assuming revenue_by_ticket_type is also converted by backend if currency_id is passed
        if (report.revenue_by_ticket_type) {
            for (const type in report.revenue_by_ticket_type) {
                aggregatedTicketBreakdown[type].revenue += report.revenue_by_ticket_type[type];
            }
        }
      });

      const ticketBreakdownArray = Object.keys(aggregatedTicketBreakdown).map(type => ({
        name: type,
        value: aggregatedTicketBreakdown[type].count,
        revenue: aggregatedTicketBreakdown[type].revenue
      }));

      setDashboardStats(prev => ({
        ...prev,
        originalRevenue: reportResponse.existing_reports.reduce((sum, r) => sum + r.total_revenue, 0),
        totalRevenue: summary.total_revenue, // This is already in target currency if converted
        totalTickets: summary.total_tickets_sold,
        ticketBreakdown: ticketBreakdownArray,
        targetCurrencyCode: currencyInfo.currency,
        targetCurrencySymbol: currencyInfo.currency_symbol,
      }));
      showToast('Report data loaded successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch report data';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      setReportApiResponse(null); // Clear previous report data on error
      setDashboardStats({ // Reset dashboard stats on error
        originalRevenue: 0,
        totalRevenue: 0,
        totalTickets: 0,
        exchangeRate: 1,
        ticketBreakdown: [],
        targetCurrencyCode: 'USD',
        targetCurrencySymbol: '$',
      });
    } finally {
      setIsLoadingReport(false);
    }
  }, [selectedOrganizer, selectedEvent, selectedCurrencyCode, currencies, getCurrencyIdFromCode]);

  // Convert revenue button action (triggers re-fetch with new currency)
  const handleConvertRevenue = () => {
    // When the "Convert Revenue" button is clicked, it means the user wants to see the report
    // in the currently selected `selectedCurrencyCode`.
    // The `fetchReportData` function already handles fetching the report in the target currency.
    // So, we just need to re-trigger `fetchReportData`.
    if (reportApiResponse) { // Only re-fetch if there's an existing report to convert
        fetchReportData();
        showToast(`Attempting to convert revenue to ${selectedCurrencyCode}...`);
    } else {
        showToast('Please generate a report first.', 'error');
    }
  };

  // Load report when organizer or event selection changes
  useEffect(() => {
    // Only auto-fetch if both organizer and event are selected
    if (selectedOrganizer && selectedEvent && currencies.length > 0) {
      fetchReportData();
    }
  }, [selectedOrganizer, selectedEvent, fetchReportData, currencies]); // Add currencies as dependency for initial currency ID mapping

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 font-inter">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                System Reports Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Generate comprehensive reports for events and manage currency conversions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Report Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Organizer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Organizer
                </label>
                <Select
                  value={selectedOrganizer}
                  onChange={setSelectedOrganizer}
                  options={organizers.map(org => ({ value: org.organizer_id.toString(), label: org.name }))}
                  placeholder="Choose organizer..."
                  loading={isLoadingOrganizers}
                />
              </div>
              {/* Event Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Event
                </label>
                <Select
                  value={selectedEvent}
                  onChange={setSelectedEvent}
                  options={events.map(event => ({ value: event.event_id.toString(), label: event.name }))}
                  placeholder="Choose event..."
                  loading={isLoadingEvents}
                />
              </div>
              {/* Currency Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Currency
                </label>
                <Select
                  value={selectedCurrencyCode}
                  onChange={setSelectedCurrencyCode}
                  options={currencies.map(currency => ({ value: currency.value, label: currency.label }))}
                  placeholder="Choose currency..."
                  loading={isLoadingCurrencies}
                />
              </div>
              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={fetchReportData}
                  disabled={!selectedOrganizer || !selectedEvent || isLoadingReport}
                  className="w-full"
                >
                  {isLoadingReport ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Generate Report
                </Button>

                <Button
                  onClick={handleConvertRevenue}
                  disabled={!reportApiResponse || isLoadingReport || isLoadingExchangeRate || selectedCurrencyCode === dashboardStats.targetCurrencyCode}
                  variant="success"
                  className="w-full"
                >
                  {isLoadingReport || isLoadingExchangeRate ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <DollarSign className="h-4 w-4" />
                  )}
                  Convert Revenue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exchange Rate Display */}
        {selectedCurrencyCode !== baseCurrencyCode && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                <Globe className="h-6 w-6 text-blue-600" />
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Exchange Rate</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    1 {baseCurrencyCode} = {isLoadingExchangeRate ? '...' : dashboardStats.exchangeRate.toFixed(4)} {selectedCurrencyCode}
                  </p>
                </div>
                <ArrowUpDown className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    Original Revenue ({baseCurrencyCode})
                  </p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {baseCurrencyCode === 'JPY' ? '¥' : '$'}
                    {dashboardStats.originalRevenue.toLocaleString(undefined, {
                      minimumFractionDigits: baseCurrencyCode === 'JPY' ? 0 : 2,
                      maximumFractionDigits: baseCurrencyCode === 'JPY' ? 0 : 2
                    })}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    Converted Revenue ({dashboardStats.targetCurrencyCode})
                  </p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {dashboardStats.targetCurrencySymbol}
                    {dashboardStats.totalRevenue.toLocaleString(undefined, {
                      minimumFractionDigits: dashboardStats.targetCurrencyCode === 'JPY' ? 0 : 2,
                      maximumFractionDigits: dashboardStats.targetCurrencyCode === 'JPY' ? 0 : 2
                    })}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Total Tickets Sold
                  </p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {dashboardStats.totalTickets.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                    Active Event
                  </p>
                  <p className="text-lg font-bold text-orange-700 dark:text-orange-300 truncate">
                    {reportApiResponse?.event_info?.event_name || 'No Event Selected'}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {dashboardStats.ticketBreakdown.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Ticket Sales by Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardStats.ticketBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                        dataKey="name"
                        className="text-sm"
                        tick={{ fill: '#6B7280' }}
                      />
                      <YAxis
                        className="text-sm"
                        tick={{ fill: '#6B7280' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                        formatter={(value) => [`${value.toLocaleString()} tickets`, 'Quantity']}
                      />
                      <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Distribution ({dashboardStats.targetCurrencyCode})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardStats.ticketBreakdown}
                        dataKey="revenue"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {dashboardStats.ticketBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${dashboardStats.targetCurrencySymbol}${value.toLocaleString(undefined, { minimumFractionDigits: dashboardStats.targetCurrencyCode === 'JPY' ? 0 : 2, maximumFractionDigits: dashboardStats.targetCurrencyCode === 'JPY' ? 0 : 2 })}`, 'Revenue']}
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Conversion History - Now reflects the report's conversion */}
        {reportApiResponse && dashboardStats.totalRevenue !== dashboardStats.originalRevenue && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" />
                Report Currency Conversion Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Original Total Revenue</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      ${dashboardStats.originalRevenue.toLocaleString()} {baseCurrencyCode}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Exchange Rate (USD to {selectedCurrencyCode})</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      1 {baseCurrencyCode} = {dashboardStats.exchangeRate.toFixed(4)} {selectedCurrencyCode}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Converted Total Revenue</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {dashboardStats.targetCurrencySymbol}
                      {dashboardStats.totalRevenue.toLocaleString(undefined, {
                        minimumFractionDigits: dashboardStats.targetCurrencyCode === 'JPY' ? 0 : 2,
                        maximumFractionDigits: dashboardStats.targetCurrencyCode === 'JPY' ? 0 : 2
                      })}
                    </p>
                  </div>
                </div>
                <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Conversion applied on report generation.
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SystemReports;