// =============================================================================
// IMPORTS
// =============================================================================
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Globe,
  Users,
  FileSpreadsheet,
  File,
  Search,
  Settings,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  TrendingUp,
  Mail,
  Download
} from "lucide-react";

// =============================================================================
// INTERFACES & TYPES
// =============================================================================
interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
}

interface Organizer {
  organizer_id: number;
  name: string;
  email: string;
  phone: string;
  event_count: number;
  metrics: {
    total_tickets_sold: number;
    total_revenue: number;
    total_attendees: number;
    currency: string;
    currency_symbol: string;
  };
}

interface Event {
  event_id: number;
  name: string;
  event_date: string;
  location: string;
  status: string;
  metrics: {
    tickets_sold: number;
    revenue: number;
    attendees: number;
    currency: string;
    currency_symbol: string;
  };
}

interface ExchangeRates {
  base: string;
  rates: { [key: string]: number };
  source: string;
}

interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================
const REPORT_FORMATS = [
  { value: 'csv', label: 'CSV (Spreadsheet)', icon: FileSpreadsheet },
  { value: 'pdf', label: 'PDF (Document)', icon: File },
  { value: 'json', label: 'JSON (Data)', icon: File }
];

const DEFAULT_CURRENCY = 'KES';

// =============================================================================
// CUSTOM HOOKS
// =============================================================================
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
async function makeApiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    } else {
      return { data: response as any };
    }
  } catch (err) {
    console.error('API Request failed:', err);
    throw err;
  }
}

const AdminReports: React.FC = () => {
  const { toast } = useToast();

  // State Variables
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [selectedOrganizer, setSelectedOrganizer] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>('all-events');
  const [selectedCurrency, setSelectedCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [reportFormat, setReportFormat] = useState<string>('csv');
  const [includeCharts, setIncludeCharts] = useState<boolean>(true);
  const [useLatestRates, setUseLatestRates] = useState<boolean>(true);
  const [sendEmail, setSendEmail] = useState<boolean>(false);
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [organizerSearch, setOrganizerSearch] = useState<string>('');
  const [eventSearch, setEventSearch] = useState<string>('');

  // Loading states
  const [isLoadingOrganizers, setIsLoadingOrganizers] = useState<boolean>(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState<boolean>(false);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Debounced search values
  const debouncedOrganizerSearch = useDebounce(organizerSearch, 300);
  const debouncedEventSearch = useDebounce(eventSearch, 300);

  // Computed values
  const targetCurrencyId = useMemo(() => {
    if (!selectedCurrency || !Array.isArray(currencies)) return null;
    const currency = currencies.find(c => c.code === selectedCurrency);
    return currency?.id || null;
  }, [selectedCurrency, currencies]);

  const selectedOrganizerData = useMemo(() => {
    if (!selectedOrganizer) return null;
    return organizers.find(org => org.organizer_id.toString() === selectedOrganizer) || null;
  }, [selectedOrganizer, organizers]);

  const selectedEventData = useMemo(() => {
    if (!selectedEvent || selectedEvent === 'all-events') return null;
    return events.find(event => event.event_id.toString() === selectedEvent) || null;
  }, [selectedEvent, events]);

  // Helper Functions
  const handleError = useCallback((message: string, err?: any) => {
    console.error('Operation error:', message, err);
    setError(message);
    toast({
      title: "Error",
      description: err?.message || message,
      variant: "destructive",
    });
  }, [toast]);

  const showSuccess = useCallback((message: string) => {
    console.log('Success:', message);
    setError(null);
    toast({
      title: "Success",
      description: message,
      variant: "default",
    });
  }, [toast]);

  // API Functions
  const fetchOrganizers = useCallback(async () => {
    setIsLoadingOrganizers(true);
    setError(null);
    try {
      const url = new URL(`${import.meta.env.VITE_API_URL}/admin/organizers`);
      if (targetCurrencyId) {
        url.searchParams.append('currency_id', targetCurrencyId.toString());
      }
      const response = await makeApiRequest<{ organizers: Organizer[] }>(url.toString());
      setOrganizers(response.data?.organizers || []);
      showSuccess(`Loaded ${response.data?.organizers?.length || 0} organizers`);
    } catch (err: any) {
      handleError('Failed to fetch organizers', err);
      setOrganizers([]);
    } finally {
      setIsLoadingOrganizers(false);
    }
  }, [targetCurrencyId, handleError, showSuccess]);

  const fetchEvents = useCallback(async (organizerId: string) => {
    if (!organizerId) {
      setEvents([]);
      return;
    }
    setIsLoadingEvents(true);
    setError(null);
    try {
      const url = new URL(`${import.meta.env.VITE_API_URL}/admin/organizers/${organizerId}/events`);
      if (targetCurrencyId) {
        url.searchParams.append('currency_id', targetCurrencyId.toString());
      }
      const response = await makeApiRequest<{ events: Event[] }>(url.toString());
      setEvents(response.data?.events || []);
      showSuccess(`Loaded ${response.data?.events?.length || 0} events`);
    } catch (err: any) {
      handleError('Failed to fetch events', err);
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [targetCurrencyId, handleError, showSuccess]);

  const fetchCurrencies = useCallback(async () => {
    setIsLoadingCurrencies(true);
    setError(null);
    try {
      const response = await makeApiRequest<Currency[]>(`${import.meta.env.VITE_API_URL}/api/currency/list`);
      const fetchedCurrencies = Array.isArray(response.data) ? response.data : [];
      setCurrencies(fetchedCurrencies);
      if (!selectedCurrency && fetchedCurrencies.length > 0) {
        const defaultCurrency = fetchedCurrencies.find(c => c.code === DEFAULT_CURRENCY) || fetchedCurrencies[0];
        setSelectedCurrency(defaultCurrency.code);
      }
      showSuccess(`Loaded ${fetchedCurrencies.length} currencies`);
    } catch (err: any) {
      handleError('Failed to fetch currencies', err);
      setCurrencies([]);
    } finally {
      setIsLoadingCurrencies(false);
    }
  }, [selectedCurrency, handleError, showSuccess]);

  const fetchExchangeRates = useCallback(async (baseCurrency: string = DEFAULT_CURRENCY) => {
    if (baseCurrency === selectedCurrency) {
      setExchangeRates(null);
      return;
    }
    setIsLoadingRates(true);
    try {
      const response = await makeApiRequest<ExchangeRates>(
        `${import.meta.env.VITE_API_URL}/api/currency/latest?base=${baseCurrency}`
      );
      setExchangeRates(response.data || null);
      showSuccess(`Exchange rates updated for ${baseCurrency}`);
    } catch (err: any) {
      handleError('Failed to fetch exchange rates', err);
      setExchangeRates(null);
    } finally {
      setIsLoadingRates(false);
    }
  }, [selectedCurrency, handleError, showSuccess]);

  const generateReport = useCallback(async () => {
    if (!selectedOrganizer) {
      handleError('Please select an organizer to generate a report.');
      return;
    }
    setIsDownloading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        organizer_id: selectedOrganizer,
        format: reportFormat,
        include_charts: includeCharts.toString(),
        use_latest_rates: useLatestRates.toString(),
        send_email: sendEmail.toString(),
      });
      if (selectedEvent && selectedEvent !== 'all-events') {
        params.append('event_id', selectedEvent);
      }
      if (targetCurrencyId && selectedCurrency !== DEFAULT_CURRENCY) {
        params.append('currency_id', targetCurrencyId.toString());
      }
      if (sendEmail && recipientEmail) {
        params.append('recipient_email', recipientEmail);
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports?${params.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      if (reportFormat.toLowerCase() === 'json') {
        const reportData = await response.json();
        console.log("JSON Report Data:", reportData);
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admin_report_${selectedOrganizer}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showSuccess('JSON report generated and downloaded successfully');
      } else {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `admin_report_${selectedOrganizer}_${new Date().toISOString().split('T')[0]}.${reportFormat}`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showSuccess(`${reportFormat.toUpperCase()} report generated and downloaded successfully`);
      }
    } catch (err: any) {
      handleError('Failed to generate report', err);
    } finally {
      setIsDownloading(false);
    }
  }, [
    selectedOrganizer,
    selectedEvent,
    reportFormat,
    targetCurrencyId,
    selectedCurrency,
    includeCharts,
    useLatestRates,
    sendEmail,
    recipientEmail,
    handleError,
    showSuccess
  ]);

  // Effects
  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  useEffect(() => {
    fetchOrganizers();
  }, [fetchOrganizers]);

  useEffect(() => {
    if (selectedCurrency && selectedCurrency !== DEFAULT_CURRENCY) {
      fetchExchangeRates(DEFAULT_CURRENCY);
    } else {
      setExchangeRates(null);
    }
  }, [selectedCurrency, fetchExchangeRates]);

  useEffect(() => {
    if (selectedOrganizer) {
      fetchEvents(selectedOrganizer);
      setSelectedEvent('all-events');
    } else {
      setEvents([]);
      setSelectedEvent('all-events');
    }
  }, [selectedOrganizer, fetchEvents]);

  // Filter Functions
  const filteredOrganizers = useMemo(() => {
    if (!debouncedOrganizerSearch) return organizers;
    return organizers.filter(org =>
      org.name.toLowerCase().includes(debouncedOrganizerSearch.toLowerCase()) ||
      org.email.toLowerCase().includes(debouncedOrganizerSearch.toLowerCase())
    );
  }, [organizers, debouncedOrganizerSearch]);

  const filteredEvents = useMemo(() => {
    if (!debouncedEventSearch) return events;
    return events.filter(event => {
      const nameMatch = event.name?.toLowerCase().includes(debouncedEventSearch.toLowerCase());
      const locationMatch = event.location?.toLowerCase().includes(debouncedEventSearch.toLowerCase());
      return nameMatch || locationMatch;
    });
  }, [events, debouncedEventSearch]);

  // Format currency value
  const formatCurrency = useCallback((amount: number, currency: string, symbol: string) => {
    return `${symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} ${currency}`;
  }, []);

  // Render
  if (isLoadingCurrencies) {
    return (
      <div className="min-h-screen p-4 md:p-6 lg:p-8 dark:bg-gray-900 dark:text-gray-200 bg-gray-50 text-gray-800">
        <div className="max-w-full px-4 md:px-6 lg:px-8">
          <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-[#10b981]" />
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Loading initial data...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 dark:bg-gray-900 dark:text-gray-200 bg-gray-50 text-gray-800">
      <div className="max-w-full px-4 md:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">
            Admin Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Generate and download comprehensive reports for organizers and events
          </p>
        </div>
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Selection */}
          <div className="lg:col-span-1 space-y-6">
            {/* Organizer Selection */}
            <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Organizer Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Search Organizers</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name or email..."
                      value={organizerSearch}
                      onChange={(e) => setOrganizerSearch(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select Organizer</Label>
                  <Select value={selectedOrganizer} onValueChange={setSelectedOrganizer}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Choose an organizer">
                        {selectedOrganizerData && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span className="truncate">{selectedOrganizerData.name}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingOrganizers ? (
                        <div className="p-4 flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        filteredOrganizers.map((organizer) => (
                          <SelectItem key={organizer.organizer_id} value={organizer.organizer_id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{organizer.name}</div>
                                <div className="text-sm text-gray-500 truncate">{organizer.email}</div>
                              </div>
                              <div className="text-xs text-gray-400 ml-2">
                                {organizer.event_count} events
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {/* Organizer Metrics */}
                {selectedOrganizerData && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Revenue:</span>
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency(
                          selectedOrganizerData.metrics.total_revenue,
                          selectedOrganizerData.metrics.currency,
                          selectedOrganizerData.metrics.currency_symbol
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tickets Sold:</span>
                      <span className="text-sm font-semibold">
                        {selectedOrganizerData.metrics.total_tickets_sold.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Attendees:</span>
                      <span className="text-sm font-semibold">
                        {selectedOrganizerData.metrics.total_attendees.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Event Selection */}
            {selectedOrganizer && (
              <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5" />
                    Event Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Select a specific event or generate report for all events
                  </p>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Search Events</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search events..."
                        value={eventSearch}
                        onChange={(e) => setEventSearch(e.target.value)}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Select Event</Label>
                    <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="All events" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-events">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            All Events
                          </div>
                        </SelectItem>
                        {isLoadingEvents ? (
                          <div className="p-4 flex items-center justify-center">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : (
                          filteredEvents.map((event) => (
                            <SelectItem key={event.event_id} value={event.event_id.toString()}>
                              <div className="flex flex-col items-start py-1">
                                <div className="font-medium">{event.name}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                  <span className="mx-1">•</span>
                                  {new Date(event.event_date).toLocaleDateString()}
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Event Metrics */}
                  {selectedEventData && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Event Revenue:</span>
                        <span className="text-sm font-bold text-green-600">
                          {formatCurrency(
                            selectedEventData.metrics.revenue,
                            selectedEventData.metrics.currency,
                            selectedEventData.metrics.currency_symbol
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Tickets Sold:</span>
                        <span className="text-sm font-semibold">
                          {selectedEventData.metrics.tickets_sold.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Status:</span>
                        <span className={cn(
                          "text-sm font-semibold flex items-center gap-1",
                          selectedEventData.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-500'
                        )}>
                          {selectedEventData.status === 'ACTIVE' ?
                            <CheckCircle className="h-3 w-3" /> :
                            <XCircle className="h-3 w-3" />
                          }
                          {selectedEventData.status}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          {/* Right Column - Report Settings */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5" />
                  Report Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Currency Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Currency Settings</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchExchangeRates(DEFAULT_CURRENCY)}
                      disabled={isLoadingRates}
                    >
                      <RefreshCw className={cn("h-4 w-4 mr-2", isLoadingRates && "animate-spin")} />
                      Refresh Rates
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Target Currency</Label>
                      <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select currency">
                            {selectedCurrency && (
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                {currencies.find(c => c.code === selectedCurrency)?.symbol} {selectedCurrency}
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.id} value={currency.code}>
                              <div className="flex items-center gap-2">
                                <span className="font-mono">{currency.symbol}</span>
                                <span className="font-medium">{currency.code}</span>
                                <span className="text-gray-500">- {currency.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {exchangeRates && selectedCurrency !== exchangeRates.base && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Exchange Rate ({exchangeRates.base} → {selectedCurrency})
                        </Label>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              1 {exchangeRates.base} = {exchangeRates.rates[selectedCurrency]?.toFixed(4)} {selectedCurrency}
                            </span>
                            <span className="text-xs text-blue-600 dark:text-blue-300">
                              {exchangeRates.source}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
                {/* Report Format Settings */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Report Format</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {REPORT_FORMATS.map((format) => {
                      const Icon = format.icon;
                      return (
                        <div
                          key={format.value}
                          className={cn(
                            "relative p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md",
                            reportFormat === format.value
                              ? "border-[#10b981] bg-[#10b981]/10 dark:bg-[#10b981]/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                          )}
                          onClick={() => setReportFormat(format.value)}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={cn(
                              "h-5 w-5",
                              reportFormat === format.value
                                ? "text-[#10b981]"
                                : "text-gray-500"
                            )} />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{format.label}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {format.value === 'csv' && 'Spreadsheet format for data analysis'}
                                {format.value === 'pdf' && 'Professional document format'}
                                {format.value === 'json' && 'Raw data format for developers'}
                              </div>
                            </div>
                          </div>
                          {reportFormat === format.value && (
                            <div className="absolute top-2 right-2">
                              <CheckCircle className="h-4 w-4 text-[#10b981]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <Separator />
                {/* Report Options */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Report Options</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Include Charts</Label>
                          <p className="text-xs text-gray-500">Add visual charts to the report</p>
                        </div>
                        <Switch
                          checked={includeCharts}
                          onCheckedChange={setIncludeCharts}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Use Latest Exchange Rates</Label>
                          <p className="text-xs text-gray-500">Apply current exchange rates</p>
                        </div>
                        <Switch
                          checked={useLatestRates}
                          onCheckedChange={setUseLatestRates}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Send via Email</Label>
                          <p className="text-xs text-gray-500">Email report to recipient</p>
                        </div>
                        <Switch
                          checked={sendEmail}
                          onCheckedChange={setSendEmail}
                        />
                      </div>
                      {sendEmail && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Recipient Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              type="email"
                              placeholder="Enter recipient email..."
                              value={recipientEmail}
                              onChange={(e) => setRecipientEmail(e.target.value)}
                              className="pl-10 h-11"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Separator />
                {/* Generate Report Button */}
                <div className="pt-4">
                  <Button
                    onClick={generateReport}
                    disabled={!selectedOrganizer || isDownloading}
                    className="w-full h-12 text-base font-medium bg-[#10b981] hover:bg-[#0d9668] text-white"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5 mr-2" />
                        Generate {reportFormat.toUpperCase()} Report
                      </>
                    )}
                  </Button>
                  {!selectedOrganizer && (
                    <p className="text-sm text-gray-500 text-center mt-2">
                      Please select an organizer to generate a report
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            {/* Report Preview/Summary */}
            {selectedOrganizerData && (
              <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5" />
                    Report Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Organizer
                          </p>
                          <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                            {selectedOrganizerData.name}
                          </p>
                        </div>
                        <Users className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800 dark:text-green-200">
                            Events
                          </p>
                          <p className="text-lg font-bold text-green-900 dark:text-green-100">
                            {selectedEvent === 'all-events' ?
                              `All ${selectedOrganizerData.event_count}` :
                              '1 Selected'
                            }
                          </p>
                        </div>
                        <Calendar className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                            Currency
                          </p>
                          <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                            {currencies.find(c => c.code === selectedCurrency)?.symbol} {selectedCurrency}
                          </p>
                        </div>
                        <Globe className="h-8 w-8 text-purple-600" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium mb-2">Report will include:</h4>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                      <li>• {selectedEvent === 'all-events' ? 'All events' : 'Selected event'} performance metrics</li>
                      <li>• Financial data converted to {selectedCurrency}</li>
                      <li>• Ticket sales and attendance statistics</li>
                      {includeCharts && <li>• Visual charts and graphs</li>}
                      {sendEmail && <li>• Email delivery to {recipientEmail || 'specified recipient'}</li>}
                      <li>• Export format: {reportFormat.toUpperCase()}</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
