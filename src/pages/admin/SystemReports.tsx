// =============================================================================
// OPTIMIZED ADMIN REPORTS - REMOVED CONVERSION API CALLS
// =============================================================================
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  Clock,
  CheckCircle
} from "lucide-react";

// =============================================================================
// INTERFACES & TYPES
// =============================================================================
interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchange_rate_from_ksh: number;
  description: string;
}

// =============================================================================
// REQUEST DEBOUNCING & CACHING UTILITIES
// =============================================================================
class RequestCache {
  private cache = new Map();
  private readonly cacheDuration = 300000; // 5 minutes cache for currencies

  get(key: string) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheDuration) {
      return cached.data;
    }
    return null;
  }

  set(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }
}

// Rate limiter for API calls
class RateLimiter {
  private lastCall = 0;
  private readonly minInterval = 1000; // 1 second minimum between calls

  async throttle<T>(apiCall: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;

    if (timeSinceLastCall < this.minInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.minInterval - timeSinceLastCall)
      );
    }

    this.lastCall = Date.now();
    return apiCall();
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const AdminReports: React.FC = () => {
  const { toast } = useToast();

  // Create instances for caching and rate limiting
  const cacheRef = useRef(new RequestCache());
  const rateLimiterRef = useRef(new RateLimiter());

  // State Variables
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedOrganizer, setSelectedOrganizer] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>('all-events');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('KES'); // Default to KES
  const [reportFormat, setReportFormat] = useState<string>('csv');
  const [includeCharts, setIncludeCharts] = useState<boolean>(true);
  const [useLatestRates, setUseLatestRates] = useState<boolean>(true);
  const [sendEmail, setSendEmail] = useState<boolean>(false);
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [groupByOrganizer, setGroupByOrganizer] = useState<boolean>(false);

  // Loading states
  const [isLoadingOrganizers, setIsLoadingOrganizers] = useState<boolean>(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Search states
  const [organizerSearch, setOrganizerSearch] = useState<string>('');
  const [eventSearch, setEventSearch] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Cache status
  const [cacheStatus, setCacheStatus] = useState<{
    currencies: boolean;
    timestamp?: Date;
  }>({
    currencies: false
  });

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================
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

  // =============================================================================
  // OPTIMIZED API FUNCTIONS
  // =============================================================================
  const fetchOrganizers = useCallback(async () => {
    const cacheKey = 'organizers';
    const cached = cacheRef.current.get(cacheKey);

    if (cached) {
      setOrganizers(cached);
      return;
    }
    setIsLoadingOrganizers(true);
    try {
      const response = await rateLimiterRef.current.throttle(async () => {
        return fetch(`${import.meta.env.VITE_API_URL}/admin/organizers`, {
          credentials: 'include'
        });
      });
      if (!response.ok) {
        const errorData = await response.json();
        handleError(errorData.message || "Failed to fetch organizers.", errorData);
        return;
      }
      const data = await response.json();
      const mappedOrganizers = (data.organizers || []).map(org => ({
        id: org.organizer_id,
        full_name: org.name,
        email: org.email,
        phone_number: org.phone,
        event_count: org.event_count,
        metrics: org.metrics
      }));
      setOrganizers(mappedOrganizers);
      cacheRef.current.set(cacheKey, mappedOrganizers);
      showSuccess('Organizers loaded successfully');
    } catch (err) {
      handleError('Failed to fetch organizers', err);
    } finally {
      setIsLoadingOrganizers(false);
    }
  }, [handleError, showSuccess]);

  const fetchEvents = useCallback(async (organizerId: string) => {
    if (!organizerId) return;
    const cacheKey = `events-${organizerId}`;
    const cached = cacheRef.current.get(cacheKey);

    if (cached) {
      setEvents(cached);
      return;
    }
    setIsLoadingEvents(true);
    try {
      const response = await rateLimiterRef.current.throttle(async () => {
        return fetch(`${import.meta.env.VITE_API_URL}/admin/organizers/${organizerId}/events`, {
          credentials: 'include'
        });
      });
      if (!response.ok) {
        const errorData = await response.json();
        handleError(errorData.message || "Failed to fetch events.", errorData);
        return;
      }
      const data = await response.json();
      const mappedEvents = (data.events || []).map(event => ({
        event_id: event.event_id,
        event_name: event.name,
        event_date: event.event_date,
        location: event.location,
        description: event.description,
        total_tickets: event.total_tickets,
        tickets_available: event.tickets_available,
        price_per_ticket: event.price_per_ticket,
        created_at: event.created_at,
        status: event.status,
        metrics: event.metrics
      }));
      setEvents(mappedEvents);
      cacheRef.current.set(cacheKey, mappedEvents);
      showSuccess('Events loaded successfully');
    } catch (err) {
      handleError('Failed to fetch events', err);
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [handleError, showSuccess]);

  const fetchCurrencies = useCallback(async () => {
    const cacheKey = 'currencies';
    const cached = cacheRef.current.get(cacheKey);

    if (cached) {
      setCurrencies(cached);
      setCacheStatus(prev => ({ ...prev, currencies: true, timestamp: new Date() }));
      return;
    }
    setIsLoadingCurrencies(true);
    try {
      const response = await rateLimiterRef.current.throttle(async () => {
        return fetch(`${import.meta.env.VITE_API_URL}/api/currency/list`, {
          credentials: 'include'
        });
      });
      if (!response.ok) {
        const errorData = await response.json();
        handleError(errorData.message || "Failed to fetch currencies.", errorData);
        return;
      }
      const data = await response.json();
      let currenciesArray = [];
      if (data.data && data.data.currencies) {
        currenciesArray = data.data.currencies;
      } else if (Array.isArray(data.data)) {
        currenciesArray = data.data;
      } else if (Array.isArray(data)) {
        currenciesArray = data;
      } else {
        console.error("Unexpected currency API response structure:", data);
        handleError("Invalid currency data format received from server");
        return;
      }
      const validCurrencies = currenciesArray.filter(currency =>
        currency &&
        typeof currency.id !== 'undefined' &&
        currency.id !== null &&
        currency.code &&
        currency.name
      );
      setCurrencies(validCurrencies);
      cacheRef.current.set(cacheKey, validCurrencies);
      setCacheStatus(prev => ({ ...prev, currencies: true, timestamp: new Date() }));
      showSuccess('Currencies loaded successfully');
    } catch (err) {
      console.error("Currency fetch error:", err);
      handleError('Failed to fetch currencies', err);
    } finally {
      setIsLoadingCurrencies(false);
    }
  }, [handleError, showSuccess]);

  const generateReport = useCallback(async () => {
    if (!selectedOrganizer) {
      handleError('Please select an organizer');
      return;
    }
    setIsDownloading(true);
    try {
      const params = new URLSearchParams();
      params.append('organizer_id', selectedOrganizer);

      if (selectedEvent && selectedEvent !== 'all-events') {
        params.append('event_id', selectedEvent);
      }

      params.append('format', reportFormat);

      // Pass currency code directly to the report API
      if (selectedCurrency) {
        params.append('currency_code', selectedCurrency);
      }

      params.append('include_charts', includeCharts.toString());
      params.append('use_latest_rates', useLatestRates.toString());
      params.append('send_email', sendEmail.toString());
      params.append('group_by_organizer', groupByOrganizer.toString());

      if (recipientEmail) {
        params.append('recipient_email', recipientEmail);
      }
      const response = await rateLimiterRef.current.throttle(async () => {
        return fetch(`${import.meta.env.VITE_API_URL}/admin/reports?${params.toString()}`, {
          credentials: 'include'
        });
      });
      if (!response.ok) {
        const errorData = await response.json();
        handleError(errorData.message || "Failed to generate report.", errorData);
        return;
      }
      // Handle different response types
      if (reportFormat === 'json') {
        const data = await response.json();
        console.log('Report data:', data);
        showSuccess('Report generated successfully');
      } else {
        // Handle file download for CSV/PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admin_report_${selectedOrganizer}_${new Date().toISOString().split('T')[0]}.${reportFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showSuccess(`${reportFormat.toUpperCase()} report generated and downloaded successfully`);
      }
    } catch (err) {
      handleError('Failed to generate report', err);
    } finally {
      setIsDownloading(false);
    }
  }, [
    selectedOrganizer,
    selectedEvent,
    reportFormat,
    selectedCurrency,
    includeCharts,
    useLatestRates,
    sendEmail,
    recipientEmail,
    groupByOrganizer,
    handleError,
    showSuccess
  ]);

  // =============================================================================
  // EFFECTS WITH OPTIMIZED LOADING
  // =============================================================================
  useEffect(() => {
    // Load organizers and currencies on mount
    fetchOrganizers();
    fetchCurrencies();
  }, [fetchOrganizers, fetchCurrencies]);

  useEffect(() => {
    if (selectedOrganizer) {
      fetchEvents(selectedOrganizer);
      setSelectedEvent('all-events');
    }
  }, [selectedOrganizer, fetchEvents]);

  // Clear cache periodically
  useEffect(() => {
    const interval = setInterval(() => {
      cacheRef.current.clear();
      setCacheStatus({ currencies: false });
    }, 300000); // Clear cache every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Filter Functions
  const filteredOrganizers = organizers.filter(org => {
    if (!org || !org.id) return false;
    const name = org.full_name || '';
    const email = org.email || '';
    return name.toLowerCase().includes(organizerSearch.toLowerCase()) ||
           email.toLowerCase().includes(organizerSearch.toLowerCase());
  });

  const filteredEvents = events.filter(event => {
    if (!event || !event.event_id) return false;
    const nameMatch = event.event_name && event.event_name.toLowerCase().includes(eventSearch.toLowerCase());
    const locationMatch = event.location && event.location.toLowerCase().includes(eventSearch.toLowerCase());
    return nameMatch || locationMatch;
  });

  // Loading screen
  if (isLoadingCurrencies || (isLoadingOrganizers && organizers.length === 0)) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-700 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen p-4 md:p-6 lg:p-8 dark:bg-gray-900 dark:text-gray-200 bg-gray-50 text-gray-800")}>
      <div className="max-w-full px-4 md:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">Admin Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Generate and download comprehensive reports for organizers and events</p>

          {/* Cache Status Indicator */}
          <div className="flex justify-center gap-4 text-sm">
            <Badge variant={cacheStatus.currencies ? "default" : "secondary"} className="flex items-center gap-1">
              {cacheStatus.currencies ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              Currencies {cacheStatus.currencies ? 'Cached' : 'Loading'}
            </Badge>
            {cacheStatus.timestamp && (
              <Badge variant="outline" className="text-xs">
                Last Updated: {cacheStatus.timestamp.toLocaleTimeString()}
              </Badge>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Organizer and Event Selection */}
          <div className="lg:col-span-1 space-y-6">
            {/* Organizer Selection */}
            <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200")}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800 text-lg">
                  <Users className="h-5 w-5" />
                  Organizer Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="dark:text-gray-200 text-gray-800 text-sm font-medium">Search Organizers</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name or email..."
                      value={organizerSearch}
                      onChange={(e) => setOrganizerSearch(e.target.value)}
                      className={cn(
                        "pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800",
                        "focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] dark:focus:ring-[#10b981] dark:focus:border-[#10b981] h-11"
                      )}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-200 text-gray-800 text-sm font-medium">Select Organizer</Label>
                  <Select value={selectedOrganizer} onValueChange={setSelectedOrganizer}>
                    <SelectTrigger className={cn(
                      "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800",
                      "focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] dark:focus:ring-[#10b981] dark:focus:border-[#10b981] h-11"
                    )}>
                      <SelectValue placeholder="Choose an organizer">
                        {selectedOrganizer && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {organizers.find(o => o.id && o.id.toString() === selectedOrganizer)?.full_name}
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
                      {filteredOrganizers.map((organizer) => (
                        <SelectItem
                          key={organizer.id}
                          value={organizer.id.toString()}
                          className={cn(
                            "dark:text-gray-200 text-gray-800 focus:bg-[#10b981] focus:text-white hover:bg-[#10b981] hover:text-white",
                            selectedOrganizer === organizer.id.toString() && "bg-[#10b981] text-white"
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{organizer.full_name}</div>
                              <div className="text-sm text-gray-500 truncate">{organizer.email}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Event Selection */}
            {selectedOrganizer && (
              <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200")}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800 text-lg">
                    Event Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Leave empty to generate report for all events
                  </p>
                  <div className="space-y-2">
                    <Label className="dark:text-gray-200 text-gray-800 text-sm font-medium">Select Event (Optional)</Label>
                    <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                      <SelectTrigger className={cn(
                        "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800",
                        "focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] dark:focus:ring-[#10b981] dark:focus:border-[#10b981] h-11"
                      )}>
                        <SelectValue placeholder="All events" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
                        <SelectItem value="all-events" className="dark:text-gray-200 text-gray-800 focus:bg-[#10b981] focus:text-white hover:bg-[#10b981] hover:text-white">
                          All Events
                        </SelectItem>
                        {filteredEvents.map((event) => (
                          <SelectItem
                            key={event.event_id}
                            value={event.event_id.toString()}
                            className="dark:text-gray-200 text-gray-800 focus:bg-[#10b981] focus:text-white hover:bg-[#10b981] hover:text-white"
                          >
                            <div className="flex flex-col items-start py-1">
                              <div className="font-medium">{event.event_name}</div>
                              <div className="text-sm text-gray-500">
                                {event.location} • {new Date(event.event_date).toLocaleDateString()}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Report Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Report Settings */}
            <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200")}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800 text-lg">
                  <Settings className="h-5 w-5" />
                  Report Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium dark:text-gray-200 text-gray-800">Currency Settings</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchCurrencies()}
                      disabled={isLoadingCurrencies}
                      className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 bg-gray-200 text-gray-800 hover:bg-gray-300"
                    >
                      <RefreshCw className={cn("h-4 w-4 mr-2", isLoadingCurrencies && "animate-spin")} />
                      Refresh
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="dark:text-gray-200 text-gray-800 text-sm font-medium">Target Currency</Label>
                      <Select value={selectedCurrency} onValueChange={setSelectedCurrency} disabled={isLoadingCurrencies}>
                        <SelectTrigger className={cn(
                          "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800",
                          "focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] dark:focus:ring-[#10b981] dark:focus:border-[#10b981] h-11"
                        )}>
                          <SelectValue placeholder="Select currency">
                            {selectedCurrency && (
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                {currencies.find(c => c.code === selectedCurrency)?.symbol} {selectedCurrency}
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
                          {currencies.map((currency) => (
                            <SelectItem
                              key={currency.id}
                              value={currency.code}
                              className="dark:text-gray-200 text-gray-800 focus:bg-[#10b981] focus:text-white hover:bg-[#10b981] hover:text-white"
                            >
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
                    <div className="space-y-2">
                      <Label className="dark:text-gray-200 text-gray-800 text-sm font-medium">Exchange Rate Info</Label>
                      <div className="p-4 rounded-lg border dark:bg-gray-700 dark:border-gray-600 bg-gray-100 border-gray-300">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedCurrency === 'KES' ?
                            'No conversion needed (base currency)' :
                            currencies.find(currency => currency.code === selectedCurrency)?.description || `Conversion will be handled by the report API using latest ${selectedCurrency} rates`
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="dark:bg-gray-700 bg-gray-200" />

                <div className="space-y-4">
                  <Label className="text-base font-medium dark:text-gray-200 text-gray-800">Report Options</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-600 border-gray-300">
                      <div className="space-y-1">
                        <Label className="dark:text-gray-200 text-gray-800 font-medium">Include Charts</Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Add visual charts to the report</p>
                      </div>
                      <Switch
                        checked={includeCharts}
                        onCheckedChange={setIncludeCharts}
                        className="data-[state=checked]:bg-[#10b981] dark:data-[state=checked]:bg-[#10b981]"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-600 border-gray-300">
                      <div className="space-y-1">
                        <Label className="dark:text-gray-200 text-gray-800 font-medium">Use Latest Rates</Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Use real-time exchange rates</p>
                      </div>
                      <Switch
                        checked={useLatestRates}
                        onCheckedChange={setUseLatestRates}
                        className="data-[state=checked]:bg-[#10b981] dark:data-[state=checked]:bg-[#10b981]"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-600 border-gray-300">
                      <div className="space-y-1">
                        <Label className="dark:text-gray-200 text-gray-800 font-medium">Group by Organizer</Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Group reports by organizer</p>
                      </div>
                      <Switch
                        checked={groupByOrganizer}
                        onCheckedChange={setGroupByOrganizer}
                        className="data-[state=checked]:bg-[#10b981] dark:data-[state=checked]:bg-[#10b981]"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="dark:bg-gray-700 bg-gray-200" />

                <div className="space-y-4">
                  <Label className="text-base font-medium dark:text-gray-200 text-gray-800">Output Format</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="dark:text-gray-200 text-gray-800 text-sm font-medium">Format</Label>
                      <Select value={reportFormat} onValueChange={setReportFormat}>
                        <SelectTrigger className={cn(
                          "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800",
                          "focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] dark:focus:ring-[#10b981] dark:focus:border-[#10b981] h-11"
                        )}>
                          <SelectValue placeholder="Select format">
                            {reportFormat && (
                              <div className="flex items-center gap-2">
                                {reportFormat === 'csv' && <FileSpreadsheet className="h-4 w-4" />}
                                {reportFormat === 'pdf' && <File className="h-4 w-4" />}
                                {reportFormat === 'json' && <File className="h-4 w-4" />}
                                {reportFormat.toUpperCase()}
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
                          <SelectItem value="csv" className="dark:text-gray-200 text-gray-800 focus:bg-[#10b981] focus:text-white hover:bg-[#10b981] hover:text-white">
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="h-4 w-4" />
                              CSV
                            </div>
                          </SelectItem>
                          <SelectItem value="pdf" className="dark:text-gray-200 text-gray-800 focus:bg-[#10b981] focus:text-white hover:bg-[#10b981] hover:text-white">
                            <div className="flex items-center gap-2">
                              <File className="h-4 w-4" />
                              PDF
                            </div>
                          </SelectItem>
                          <SelectItem value="json" className="dark:text-gray-200 text-gray-800 focus:bg-[#10b981] focus:text-white hover:bg-[#10b981] hover:text-white">
                            <div className="flex items-center gap-2">
                              <File className="h-4 w-4" />
                              JSON
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator className="dark:bg-gray-700 bg-gray-200" />

                <div className="space-y-4">
                  <Label className="text-base font-medium dark:text-gray-200 text-gray-800">Email Settings</Label>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-600 border-gray-300">
                      <div className="space-y-1">
                        <Label className="dark:text-gray-200 text-gray-800 font-medium">Send via Email</Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Email the report to a recipient</p>
                      </div>
                      <Switch
                        checked={sendEmail}
                        onCheckedChange={setSendEmail}
                        className="data-[state=checked]:bg-[#10b981] dark:data-[state=checked]:bg-[#10b981]"
                      />
                    </div>

                    {sendEmail && (
                      <div className="space-y-2">
                        <Label className="dark:text-gray-200 text-gray-800 text-sm font-medium">Recipient Email</Label>
                        <Input
                          type="email"
                          placeholder="Enter email address"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          className={cn(
                            "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800",
                            "focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] dark:focus:ring-[#10b981] dark:focus:border-[#10b981] h-11"
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generate Report Button */}
            <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200")}>
              <CardContent className="pt-6">
                <div className="flex flex-col space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold dark:text-gray-200 text-gray-800 mb-2">Generate Report</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedOrganizer ?
                        `Ready to generate report for ${organizers.find(o => o.id.toString() === selectedOrganizer)?.full_name}` :
                        'Please select an organizer to generate report'
                      }
                    </p>
                  </div>

                  <Button
                    onClick={generateReport}
                    disabled={!selectedOrganizer || isDownloading}
                    className={cn(
                      "w-full bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-600 hover:to-[#0ea372] text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 hover:scale-105 text-lg"
                    )}
                  >
                    {isDownloading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Generating Report...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Generate {reportFormat.toUpperCase()} Report
                      </div>
                    )}
                  </Button>

                  {selectedCurrency && selectedCurrency !== 'KES' && (
                    <div className="text-center">
                      <Badge variant="outline" className="text-xs">
                        <Globe className="h-3 w-3 mr-1" />
                        Report will be generated in {selectedCurrency}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
