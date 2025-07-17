// =============================================================================
// IMPORTS
// =============================================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
// import { Switch } from "@/components/ui/switch";
// import { Badge } from "@/components/ui/badge";
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
  DollarSign,
  Calendar,
  MapPin,
  TrendingUp
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
  base_currency: string;
  rates: { [key: string]: number };
  source: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const AdminReports: React.FC = () => {
  // Hooks & Setup
  const { toast } = useToast();

  // State Variables
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [selectedOrganizer, setSelectedOrganizer] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>('all-events');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [targetCurrencyId, setTargetCurrencyId] = useState<number | null>(null);
  const [reportFormat, setReportFormat] = useState<string>('csv');
  const [includeCharts] = useState<boolean>(true);
  const [useLatestRates] = useState<boolean>(true);
  const [sendEmail] = useState<boolean>(false);
  const [recipientEmail] = useState<string>('');
  const [isLoadingOrganizers, setIsLoadingOrganizers] = useState<boolean>(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState<boolean>(false);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [organizerSearch, setOrganizerSearch] = useState<string>('');
  const [eventSearch, setEventSearch] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

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
    try {
      const url = `${import.meta.env.VITE_API_URL}/admin/organizers`;
      const params = new URLSearchParams();
      if (targetCurrencyId) {
        params.append('currency_id', targetCurrencyId.toString());
      }
      
      const response = await fetch(`${url}${params.toString() ? `?${params.toString()}` : ''}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        handleError(errorData.message || "Failed to fetch organizers.", errorData);
        return;
      }
      
      const data = await response.json();
      setOrganizers(data.organizers || []);
      showSuccess(`Loaded ${data.organizers?.length || 0} organizers successfully`);
    } catch (err) {
      handleError('Failed to fetch organizers', err);
    } finally {
      setIsLoadingOrganizers(false);
    }
  }, [handleError, showSuccess, targetCurrencyId]);

  const fetchEvents = useCallback(async (organizerId: string) => {
    if (!organizerId) return;
    setIsLoadingEvents(true);
    try {
      const url = `${import.meta.env.VITE_API_URL}/admin/organizers/${organizerId}/events`;
      const params = new URLSearchParams();
      if (targetCurrencyId) {
        params.append('currency_id', targetCurrencyId.toString());
      }
      
      const response = await fetch(`${url}${params.toString() ? `?${params.toString()}` : ''}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        handleError(errorData.message || "Failed to fetch events.", errorData);
        return;
      }
      
      const data = await response.json();
      setEvents(data.events || []);
      showSuccess(`Loaded ${data.events?.length || 0} events successfully`);
    } catch (err) {
      handleError('Failed to fetch events', err);
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [handleError, showSuccess, targetCurrencyId]);

  const fetchCurrencies = useCallback(async () => {
    setIsLoadingCurrencies(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/currency/list`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        handleError(errorData.message || "Failed to fetch currencies.", errorData);
        return;
      }
      const data = await response.json();
      setCurrencies(data.data || []);
      
      // Set default currency to KES if available, otherwise USD
      if (!selectedCurrency) {
        const kesCurrency = data.data?.find((c: Currency) => c.code === 'KES');
        const usdCurrency = data.data?.find((c: Currency) => c.code === 'USD');
        const defaultCurrency = kesCurrency || usdCurrency;
        
        if (defaultCurrency) {
          setSelectedCurrency(defaultCurrency.code);
          setTargetCurrencyId(defaultCurrency.id);
        }
      }
      
      showSuccess('Currencies loaded successfully');
    } catch (err) {
      handleError('Failed to fetch currencies', err);
    } finally {
      setIsLoadingCurrencies(false);
    }
  }, [handleError, showSuccess, selectedCurrency]);

  const fetchExchangeRates = useCallback(async (baseCurrency: string = 'USD') => {
    setIsLoadingRates(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/currency/latest?base=${baseCurrency}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        handleError(errorData.message || "Failed to fetch exchange rates.", errorData);
        return;
      }
      const data = await response.json();
      setExchangeRates(data.data);
      showSuccess(`Exchange rates updated for ${baseCurrency}`);
    } catch (err) {
      handleError('Failed to fetch exchange rates', err);
    } finally {
      setIsLoadingRates(false);
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
      
      if (targetCurrencyId) {
        params.append('currency_id', targetCurrencyId.toString());
      }
      
      params.append('include_charts', includeCharts.toString());
      params.append('use_latest_rates', useLatestRates.toString());
      params.append('send_email', sendEmail.toString());
      
      if (recipientEmail) {
        params.append('recipient_email', recipientEmail);
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        handleError(errorData.message || "Failed to generate report.", errorData);
        return;
      }

      // Handle JSON response (when email is sent)
      if (response.headers.get('content-type')?.includes('application/json')) {
        const jsonData = await response.json();
        if (jsonData.email_status === 'sent') {
          showSuccess(`Report generated and emailed to ${jsonData.email_recipient}`);
        } else if (jsonData.email_status === 'failed') {
          showSuccess('Report generated but email delivery failed');
        }
        return;
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const selectedOrganizerName = organizers.find(org => org.organizer_id.toString() === selectedOrganizer)?.name || selectedOrganizer;
      const eventSuffix = selectedEvent !== 'all-events' ? `_event${selectedEvent}` : '';
      a.download = `admin_report_${selectedOrganizerName.replace(/\s+/g, '_')}${eventSuffix}_${new Date().toISOString().split('T')[0]}.${reportFormat}`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showSuccess(`${reportFormat.toUpperCase()} report generated and downloaded successfully`);
    } catch (err) {
      handleError('Failed to generate report', err);
    } finally {
      setIsDownloading(false);
    }
  }, [selectedOrganizer, selectedEvent, reportFormat, targetCurrencyId, includeCharts, useLatestRates, sendEmail, recipientEmail, handleError, showSuccess, organizers]);

  // Effects
  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  useEffect(() => {
    if (currencies.length > 0) {
      fetchOrganizers();
    }
  }, [fetchOrganizers, currencies.length]);

  useEffect(() => {
    if (selectedOrganizer) {
      fetchEvents(selectedOrganizer);
      setSelectedEvent('all-events');
    }
  }, [selectedOrganizer, fetchEvents]);

  useEffect(() => {
    if (selectedCurrency && selectedCurrency !== 'USD') {
      fetchExchangeRates('USD');
    }
  }, [selectedCurrency, fetchExchangeRates]);

  useEffect(() => {
    if (selectedCurrency) {
      const currency = currencies.find(c => c.code === selectedCurrency);
      if (currency) {
        setTargetCurrencyId(currency.id);
      }
    }
  }, [selectedCurrency, currencies]);

  // Refresh data when currency changes
  useEffect(() => {
    if (targetCurrencyId && organizers.length > 0) {
      fetchOrganizers();
      if (selectedOrganizer) {
        fetchEvents(selectedOrganizer);
      }
    }
  }, [targetCurrencyId, fetchOrganizers, fetchEvents, selectedOrganizer]);

  // Filter Functions
  const filteredOrganizers = organizers.filter(org =>
    org.name.toLowerCase().includes(organizerSearch.toLowerCase()) ||
    org.email.toLowerCase().includes(organizerSearch.toLowerCase())
  );

  const filteredEvents = events.filter(event => {
    const nameMatch = event.name && event.name.toLowerCase().includes(eventSearch.toLowerCase());
    const locationMatch = event.location && event.location.toLowerCase().includes(eventSearch.toLowerCase());
    return nameMatch || locationMatch;
  });

  // Render
  if (isLoadingCurrencies || (isLoadingOrganizers && organizers.length === 0)) {
    return (
      <div className="min-h-screen p-4 md:p-6 lg:p-8 dark:bg-gray-900 dark:text-gray-200 bg-gray-50 text-gray-800">
        <div className="max-w-full px-4 md:px-6 lg:px-8">
          <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200")}>
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
    <div className={cn("min-h-screen p-4 md:p-6 lg:p-8 dark:bg-gray-900 dark:text-gray-200 bg-gray-50 text-gray-800")}>
      <div className="max-w-full px-4 md:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">Admin Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Generate and download comprehensive reports for organizers and events</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Organizer and Event Selection */}
          <div className="lg:col-span-1 space-y-6">
            {/* Organizer Selection */}
            <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200")}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800 text-lg">
                  <Users className="h-5 w-5" />
                  Organizer Selection
                  {isLoadingOrganizers && <Loader2 className="h-4 w-4 animate-spin" />}
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
                            {organizers.find(o => o.organizer_id.toString() === selectedOrganizer)?.name}
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
                      {filteredOrganizers.map((organizer) => (
                        <SelectItem
                          key={organizer.organizer_id}
                          value={organizer.organizer_id.toString()}
                          className={cn(
                            "dark:text-gray-200 text-gray-800 focus:bg-[#10b981] focus:text-white hover:bg-[#10b981] hover:text-white",
                            selectedOrganizer === organizer.organizer_id.toString() && "bg-[#10b981] text-white"
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{organizer.name}</div>
                              <div className="text-sm text-gray-500 truncate">{organizer.email}</div>
                              <div className="text-xs text-gray-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {organizer.event_count} events
                                <DollarSign className="h-3 w-3 ml-2" />
                                {organizer.metrics.currency_symbol}{organizer.metrics.total_revenue.toLocaleString()}
                              </div>
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
                    <Calendar className="h-5 w-5" />
                    Event Selection
                    {isLoadingEvents && <Loader2 className="h-4 w-4 animate-spin" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="dark:text-gray-200 text-gray-800 text-sm font-medium">Search Events</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by name or location..."
                        value={eventSearch}
                        onChange={(e) => setEventSearch(e.target.value)}
                        className={cn(
                          "pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800",
                          "focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] dark:focus:ring-[#10b981] dark:focus:border-[#10b981] h-11"
                        )}
                      />
                    </div>
                  </div>
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
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            All Events
                          </div>
                        </SelectItem>
                        {filteredEvents.map((event) => (
                          <SelectItem
                            key={event.event_id}
                            value={event.event_id.toString()}
                            className="dark:text-gray-200 text-gray-800 focus:bg-[#10b981] focus:text-white hover:bg-[#10b981] hover:text-white"
                          >
                            <div className="flex flex-col items-start py-1">
                              <div className="font-medium">{event.name}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                                <Calendar className="h-3 w-3 ml-2" />
                                {new Date(event.event_date).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-400 flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {event.metrics.tickets_sold} tickets
                                <DollarSign className="h-3 w-3 ml-1" />
                                {event.metrics.currency_symbol}{event.metrics.revenue.toLocaleString()}
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
                      onClick={() => fetchExchangeRates('USD')}
                      disabled={isLoadingRates}
                      className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 bg-gray-200 text-gray-800 hover:bg-gray-300"
                    >
                      <RefreshCw className={cn("h-4 w-4 mr-2", isLoadingRates && "animate-spin")} />
                      Refresh Rates
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
                    {exchangeRates && selectedCurrency && selectedCurrency !== 'USD' && (
                      <div className="space-y-2">
                        <Label className="dark:text-gray-200 text-gray-800 text-sm font-medium">Exchange Rate (USD → {selectedCurrency})</Label>
                        <div className="p-4 rounded-lg border dark:bg-gray-700 dark:border-gray-600 bg-gray-100 border-gray-300">
                          <div className="text-lg font-semibold dark:text-gray-200 text-gray-800">
                            1 USD = {exchangeRates.rates[selectedCurrency]?.toFixed(4) || 'N/A'} {selectedCurrency}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Source: {exchangeRates.source}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="dark:bg-gray-700 bg-gray-200" />

                <div className="space-y-4">
                  <Label className="text-base font-medium dark:text-gray-200 text-gray-800">Report Format</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select value={reportFormat} onValueChange={setReportFormat}>
                      <SelectTrigger className={cn(
                        "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800",
                        "focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] dark:focus:ring-[#10b981] dark:focus:border-[#10b981] h-11"
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
                        <SelectItem
                          value="csv"
                          className="dark:text-gray-200 text-gray-800 focus:bg-[#10b981] focus:text-white hover:bg-[#10b981] hover:text-white"
                        >
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4" />
                            CSV (Spreadsheet)
                          </div>
                        </SelectItem>
                        <SelectItem
                          value="pdf"
                          className="dark:text-gray-200 text-gray-800 focus:bg-[#10b981] focus:text-white hover:bg-[#10b981] hover:text-white"
                        >
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4" />
                            PDF (Document)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200")}>
              <CardContent className="p-6">
                <Button
                  onClick={generateReport}
                  disabled={!selectedOrganizer || isDownloading}
                  className="w-full bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-600 hover:to-[#0ea372] text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 hover:scale-105 text-lg"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="mr-2 h-5 w-5" />
                      Generate Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;