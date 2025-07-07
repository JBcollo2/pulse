import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { debounce } from 'lodash';
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
  Download,
  Mail,
  FileSpreadsheet,
  Search,
  Clock,
  Check
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
  value: string;
  label: string;
  id: number;
  symbol: string;
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
    total_revenue: number;
    base_currency: {
      code: string;
      symbol: string;
    };
    converted_revenue: number;
    converted_currency: {
      code: string;
      symbol: string;
    };
    tickets_sold_by_type: { [key: string]: number };
    revenue_by_ticket_type: { [key: string]: number };
  }>;
}

interface DashboardStats {
  originalRevenue: number;
  totalRevenue: number;
  totalTickets: number;
  exchangeRate: number;
  ticketBreakdown: Array<{
    name: string;
    value: number;
    revenue: number;
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

const CardHeader = ({ children, className = "" }) => (
  <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
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

const Select = ({ value, onChange, options, placeholder = "Select...", loading = false, className = "", isSearchable = false, searchPlaceholder = "Search...", menuPortalTarget, menuPosition, styles }) => (
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

const Input = ({ value, onChange, placeholder = "", type = "text", className = "" }) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white ${className}`}
    placeholder={placeholder}
  />
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
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>('USD');
  const [baseCurrencyCode] = useState<string>('USD');
  const [days, setDays] = useState<string>('30');
  const [recipientEmail, setRecipientEmail] = useState<string>('dk7468563@gmail.com');
  const [sendEmail, setSendEmail] = useState<boolean>(true);
  const [format, setFormat] = useState<string>('json');
  const [isFormValid, setIsFormValid] = useState(false);
  const [emailDisabled, setEmailDisabled] = useState(false);

  interface ValidationErrors {
    organizer?: string;
    event?: string;
    currency?: string;
    days?: string;
    email?: string;
  }

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [reportGenerated, setReportGenerated] = useState(false);

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
  const [downloadingPdfs, setDownloadingPdfs] = useState<Set<number>>(new Set());

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

  // Add validation function
  const validateForm = () => {
    const errors: ValidationErrors = {};
    if (!selectedOrganizer) {
      errors.organizer = 'Please select an organizer';
    }
    if (!selectedEvent) {
      errors.event = 'Please select an event';
    }
    if (!selectedCurrencyCode) {
      errors.currency = 'Please select a target currency';
    }
    const daysNumber = Number(days);
    if (!days || isNaN(daysNumber) || daysNumber <= 0) {
      errors.days = 'Please enter a valid number of days';
    }
    if (sendEmail && !recipientEmail) {
      errors.email = 'Please enter recipient email';
    }
    if (sendEmail && recipientEmail && !/\S+@\S+\.\S+/.test(recipientEmail)) {
      errors.email = 'Please enter a valid email address';
    }
    setValidationErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    setIsFormValid(isValid);
    return isValid;
  };

  // Add useEffect to validate form on changes
  useEffect(() => {
    if (!isInitialLoad) {
      validateForm();
    }
  }, [selectedOrganizer, selectedEvent, selectedCurrencyCode, days, sendEmail, recipientEmail]);

  // Add useEffect to handle initial load
  useEffect(() => {
    if (isInitialLoad && organizers.length > 0) {
      setIsInitialLoad(false);
    }
  }, [organizers, isInitialLoad]);

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

  // Modified fetchReportData function
  const fetchReportData = async () => {
    if (!validateForm()) {
      return;
    }
    setIsLoadingReport(true);
    setReportGenerated(false);
    setEmailDisabled(true); // Disable the button immediately

    try {
      const targetCurrencyId = getCurrencyIdFromCode(selectedCurrencyCode);
      const params = new URLSearchParams();
      params.append('organizer_id', selectedOrganizer);
      params.append('event_id', selectedEvent);
      if (targetCurrencyId) {
        params.append('currency_id', targetCurrencyId.toString());
        params.append('use_latest_rates', 'true');
      }
      params.append('days', days);
      if (sendEmail) {
        params.append('send_email', 'true');
        params.append('recipient_email', recipientEmail);
      }
      params.append('format', format);

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/reports`, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.status === 200) {
        if (format === 'pdf') {
          const blob = await response.data;
          const url = window.URL.createObjectURL(new Blob([blob]));
          const link = document.createElement('a');
          link.href = url;
          link.download = `report_${selectedEvent}.pdf`;
          document.body.appendChild(link);
          link.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(link);
        } else if (format === 'csv') {
          const blob = await response.data;
          const url = window.URL.createObjectURL(new Blob([blob]));
          const link = document.createElement('a');
          link.href = url;
          link.download = `report_${selectedEvent}.csv`;
          document.body.appendChild(link);
          link.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(link);
        } else {
          const reportResponse: AdminEventReportResponse = response.data;
          setReportApiResponse(reportResponse);
          const summary = reportResponse.fresh_report_data?.event_summary || {
            total_tickets_sold: 0,
            total_revenue: 0,
            total_attendees: 0,
            event_count: 0,
            report_count: 0,
            currency: 'USD',
            events: []
          };
          const currencyInfo = reportResponse.fresh_report_data?.currency_info || {
            currency: 'USD',
            currency_symbol: '$'
          };
          const aggregatedTicketBreakdown: { [key: string]: { count: number; revenue: number } } = {};
          reportResponse.existing_reports.forEach(report => {
            const currentRevenue = report.converted_revenue !== undefined && report.converted_revenue !== null
              ? report.converted_revenue
              : report.total_revenue;
            if (report.tickets_sold_by_type) {
              for (const type in report.tickets_sold_by_type) {
                aggregatedTicketBreakdown[type] = aggregatedTicketBreakdown[type] || { count: 0, revenue: 0 };
                aggregatedTicketBreakdown[type].count += report.tickets_sold_by_type[type];
              }
            }
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
            totalRevenue: summary.total_revenue,
            totalTickets: summary.total_tickets_sold,
            ticketBreakdown: ticketBreakdownArray,
            targetCurrencyCode: currencyInfo.currency,
            targetCurrencySymbol: currencyInfo.currency_symbol,
          }));
        }
        setReportGenerated(true);
        showToast('Report data loaded successfully');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          const waitTime = error.response?.data?.wait_time || 30;
          showToast(`Too many requests. Try again in ${waitTime} seconds.`, 'error');
          setTimeout(() => setEmailDisabled(false), waitTime * 1000);
        } else {
          showToast("Something went wrong while sending the report.", 'error');
          setEmailDisabled(false); // Re-enable if not a duplicate issue
        }
      } else {
        showToast("An unexpected error occurred.", 'error');
        setEmailDisabled(false); // Re-enable if not a duplicate issue
      }
      setError('Failed to fetch report data');
      setReportApiResponse(null);
      setDashboardStats({
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
  };

  const debouncedSendEmail = debounce(fetchReportData, 2000, {
    leading: true,
    trailing: false,
  });

  // Convert revenue button action (triggers re-fetch with new currency)
  const handleConvertRevenue = () => {
    if (reportApiResponse) {
      fetchReportData();
      showToast(`Attempting to convert revenue to ${selectedCurrencyCode}...`);
    } else {
      showToast('Please generate a report first.', 'error');
    }
  };

  // Download PDF for a specific event
  const downloadPDF = async (eventId: number, eventName: string) => {
    setDownloadingPdfs(prev => new Set(prev).add(eventId));
    try {
      const params = new URLSearchParams();
      params.append('organizer_id', selectedOrganizer);
      params.append('event_id', eventId.toString());
      params.append('format', 'pdf');
      const url = `${import.meta.env.VITE_API_URL}/admin/reports?${params.toString()}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `report_${eventName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);
      showToast('PDF downloaded successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download PDF';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setDownloadingPdfs(prev => {
        const updated = new Set(prev);
        updated.delete(eventId);
        return updated;
      });
    }
  };

  // Load report when organizer or event selection changes
  useEffect(() => {
    if (selectedOrganizer && selectedEvent && currencies.length > 0) {
      fetchReportData();
    }
  }, [selectedOrganizer, selectedEvent, fetchReportData, currencies]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 font-inter">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="max-w-7xl mx-auto space-y-6">
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
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600 px-8 py-6">
            <CardTitle className="flex items-center gap-4 text-2xl font-bold text-gray-800 dark:text-white">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Building className="h-6 w-6 text-white" />
              </div>
              Report Configuration
              {isInitialLoad && (
                <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading options...
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {/* Loading Overlay */}
            {isInitialLoad && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-50">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Loading Configuration Options...</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Please wait while we fetch the available options</p>
                </div>
              </div>
            )}
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Organizer Selection */}
              <div className="flex flex-col h-full">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 min-h-[20px]">
                  Organizer
                </label>
                <div className="flex-1">
                  <Select
                    value={selectedOrganizer}
                    onChange={(value: string) => {
                      setSelectedOrganizer(value);
                      setReportGenerated(false);
                    }}
                    options={organizers.map(org => ({ value: org.organizer_id.toString(), label: org.name }))}
                    placeholder="Choose organizer..."
                    loading={isLoadingOrganizers}
                    isSearchable={organizers.length > 5}
                    searchPlaceholder="Search organizers..."
                    className="w-full h-12 text-base border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    styles={{
                      menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
                      menu: (base: any) => ({ ...base, zIndex: 9999 }),
                      control: (base: any) => ({ ...base, width: '100%', minWidth: 0 })
                    }}
                  />
                  {validationErrors.organizer && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.organizer}</p>
                  )}
                </div>
              </div>
              {/* Event Selection */}
              <div className="flex flex-col h-full">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 min-h-[20px]">
                  Event
                </label>
                <div className="flex-1">
                  <Select
                    value={selectedEvent}
                    onChange={(value: string) => {
                      setSelectedEvent(value);
                      setReportGenerated(false);
                    }}
                    options={events.map(event => ({ value: event.event_id.toString(), label: event.name }))}
                    placeholder="Choose event..."
                    loading={isLoadingEvents}
                    isSearchable={events.length > 5}
                    searchPlaceholder="Search events..."
                    className={`w-full h-12 text-base border-2 ${
                      validationErrors.event
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900'
                    } rounded-xl transition-all duration-200 shadow-sm hover:shadow-md`}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    styles={{
                      menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
                      menu: (base: any) => ({ ...base, zIndex: 9999 }),
                      control: (base: any) => ({ ...base, width: '100%', minWidth: 0 })
                    }}
                  />
                  {validationErrors.event && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.event}</p>
                  )}
                </div>
              </div>
              {/* Currency Selection */}
              <div className="flex flex-col h-full">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 min-h-[20px]">
                  Currency
                </label>
                <div className="flex-1">
                  <Select
                    value={selectedCurrencyCode}
                    onChange={(value: string) => {
                      setSelectedCurrencyCode(value);
                      setReportGenerated(false);
                    }}
                    options={currencies.map(currency => ({ value: currency.value, label: currency.label }))}
                    placeholder="Choose currency..."
                    loading={isLoadingCurrencies}
                    isSearchable={currencies.length > 5}
                    searchPlaceholder="Search currencies..."
                    className={`w-full h-12 text-base border-2 ${
                      validationErrors.currency
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900'
                    } rounded-xl transition-all duration-200 shadow-sm hover:shadow-md`}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    styles={{
                      menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
                      menu: (base: any) => ({ ...base, zIndex: 9999 }),
                      control: (base: any) => ({ ...base, width: '100%', minWidth: 0 })
                    }}
                  />
                  {validationErrors.currency && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.currency}</p>
                  )}
                </div>
              </div>
              {/* Days Input */}
              <div className="flex flex-col h-full">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 min-h-[20px]">
                  Days
                </label>
                <div className="flex-1">
                  <Input
                    value={days}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setDays(e.target.value);
                      setReportGenerated(false);
                    }}
                    type="number"
                    placeholder="Enter days..."
                    className={`w-full h-12 text-base border-2 ${
                      validationErrors.days
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900'
                    } rounded-xl transition-all duration-200 shadow-sm hover:shadow-md`}
                  />
                  {validationErrors.days && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.days}</p>
                  )}
                </div>
              </div>
            </div>
            {/* Form Status Indicator */}
            {!isInitialLoad && (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-3">
                  {isFormValid ? (
                    <>
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          All required fields completed
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Ready to generate report
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Please complete all required fields
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                          {Object.keys(validationErrors).length} field(s) need attention
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={debouncedSendEmail}
                disabled={!isFormValid || isLoadingReport || isInitialLoad || emailDisabled}
                className="flex-1 h-14 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {emailDisabled ? (
                  <>
                    <Clock className="h-5 w-5 mr-3" />
                    Please wait...
                  </>
                ) : isLoadingReport ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-3" />
                    Generating Report...
                  </>
                ) : reportGenerated ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-3" />
                    Regenerate Report
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5 mr-3" />
                    Generate Report
                  </>
                )}
              </Button>
              <Button
                onClick={handleConvertRevenue}
                disabled={!reportGenerated || isLoadingReport || isLoadingExchangeRate || selectedCurrencyCode === dashboardStats.targetCurrencyCode}
                className="flex-1 h-14 bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600 hover:from-emerald-600 hover:via-green-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoadingExchangeRate ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-3" />
                    Converting...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-5 w-5 mr-3" />
                    Convert Revenue
                  </>
                )}
              </Button>
            </div>
            {/* Email and Export Section */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 border border-gray-200 dark:border-gray-600 shadow-inner">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Email Toggle */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="sendEmail"
                      checked={sendEmail}
                      onChange={(e) => {
                        setSendEmail(e.target.checked);
                        setReportGenerated(false);
                      }}
                      className="peer h-6 w-6 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 dark:border-gray-600 transition-all duration-200"
                    />
                    <Check className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200 pointer-events-none" />
                  </div>
                  <label htmlFor="sendEmail" className="text-base font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                    Send Email Notification
                  </label>
                </div>
                {/* Email Input */}
                {sendEmail && (
                  <div className="flex-grow lg:max-w-md">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        value={recipientEmail}
                        onChange={(e) => {
                          setRecipientEmail(e.target.value);
                          setReportGenerated(false);
                        }}
                        placeholder="Enter recipient email..."
                        type="email"
                        className={`pl-12 h-12 text-base border-2 ${
                          validationErrors.email
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                            : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900'
                        } rounded-xl transition-all duration-200 shadow-sm hover:shadow-md`}
                      />
                      {validationErrors.email && (
                        <p className="mt-1 text-sm text-red-500">{validationErrors.email}</p>
                      )}
                    </div>
                  </div>
                )}
                {/* Export Format */}
                <div className="flex items-center gap-4 relative z-10">
                  <label className="text-base font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    Export Format:
                  </label>
                  <Select
                    value={format}
                    onChange={(value) => {
                      setFormat(value);
                      setReportGenerated(false);
                    }}
                    options={[
                      { value: 'json', label: '📄 JSON' },
                      { value: 'pdf', label: '📋 PDF' },
                      { value: 'csv', label: '📊 CSV' }
                    ]}
                    className="w-40 h-12 text-base border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9996 }),
                      menu: (base) => ({ ...base, zIndex: 9996 }),
                      control: (base) => ({ ...base, width: '100%', minWidth: 0 })
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
        {/* Event Reports Section */}
        <Card>
          <CardHeader>
            <CardTitle>Event Reports</CardTitle>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Download PDF reports for each event</div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportApiResponse?.fresh_report_data?.event_summary?.events?.map((event) => (
                <div key={event.event_id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{event.event_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.tickets_sold} tickets sold
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => downloadPDF(event.event_id, event.event_name)}
                    disabled={downloadingPdfs.has(event.event_id)}
                    variant="outline"
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemReports;
