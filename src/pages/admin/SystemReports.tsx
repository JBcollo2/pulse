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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Globe,
  Mail,
  Users,
  DollarSign,
  FileSpreadsheet,
  File,
  Search,
  Settings
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
  report_count: number;
}

interface Event {
  event_id: number;
  name: string;
  event_date: string;
  location: string;
  report_count: number;
}

interface ExchangeRates {
  base_currency: string;
  rates: { [key: string]: number };
  source: string;
}

// Although AdminReport interface is defined, it's not directly used for state management of report data
// in this component, as the report is downloaded as a file. Keeping it for reference/completeness.
interface AdminReport {
  organizer_id: number;
  organizer_name: string;
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

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const AdminReports: React.FC = () => {
  // ---------------------------------------------------------------------------
  // HOOKS & SETUP
  // ---------------------------------------------------------------------------
  const { toast } = useToast();

  // ---------------------------------------------------------------------------
  // STATE VARIABLES
  // ---------------------------------------------------------------------------
  // Core Data State
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);

  // Report Configuration State
  const [selectedOrganizer, setSelectedOrganizer] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [targetCurrencyId, setTargetCurrencyId] = useState<number | null>(null);
  const [reportFormat, setReportFormat] = useState<string>('csv');
  const [includeCharts, setIncludeCharts] = useState<boolean>(true);
  const [useLatestRates, setUseLatestRates] = useState<boolean>(true);
  const [sendEmail, setSendEmail] = useState<boolean>(false);
  const [recipientEmail, setRecipientEmail] = useState<string>('');

  // Loading States
  const [isLoadingOrganizers, setIsLoadingOrganizers] = useState<boolean>(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState<boolean>(false);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // UI State
  const [organizerSearch, setOrganizerSearch] = useState<string>('');
  const [eventSearch, setEventSearch] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // HELPER FUNCTIONS
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // API FUNCTIONS
  // ---------------------------------------------------------------------------
  const fetchOrganizers = useCallback(async () => {
    setIsLoadingOrganizers(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/organizers`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        handleError(errorData.message || "Failed to fetch organizers.", errorData);
        return;
      }
      const data = await response.json();
      setOrganizers(data.organizers || []);
      showSuccess('Organizers loaded successfully');
    } catch (err: any) {
      handleError('Failed to fetch organizers', err);
    } finally {
      setIsLoadingOrganizers(false);
    }
  }, [handleError, showSuccess]);

  const fetchEvents = useCallback(async (organizerId: string) => {
    if (!organizerId) return;
    setIsLoadingEvents(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/organizers/${organizerId}/events`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        handleError(errorData.message || "Failed to fetch events.", errorData);
        return;
      }
      const data = await response.json();
      setEvents(data.events || []);
      showSuccess('Events loaded successfully');
    } catch (err: any) {
      handleError('Failed to fetch events', err);
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [handleError, showSuccess]);

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
      // Set default currency to USD if not already selected
      if (!selectedCurrency) {
        const usdCurrency = data.data?.find((c: Currency) => c.code === 'USD');
        if (usdCurrency) {
          setSelectedCurrency(usdCurrency.code);
          setTargetCurrencyId(usdCurrency.id);
        }
      }
      showSuccess('Currencies loaded successfully');
    } catch (err: any) {
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
    } catch (err: any) {
      handleError('Failed to fetch exchange rates', err);
    } finally {
      setIsLoadingRates(false);
    }
  }, [handleError, showSuccess]);

  const generateReport = useCallback(async () => {
    if (!selectedOrganizer) {
      handleError('Please select an organizer to generate a report.');
      return;
    }
    setIsDownloading(true);
    try {
      const params = new URLSearchParams();
      params.append('organizer_id', selectedOrganizer);
      if (selectedEvent) params.append('event_id', selectedEvent);
      params.append('format', reportFormat);
      if (targetCurrencyId) params.append('currency_id', targetCurrencyId.toString());
      params.append('include_charts', includeCharts.toString());
      params.append('use_latest_rates', useLatestRates.toString());
      params.append('send_email', sendEmail.toString());
      if (sendEmail && recipientEmail) params.append('recipient_email', recipientEmail);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports?${params.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        handleError(errorData.message || "Failed to generate report.", errorData);
        return;
      }

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
    } catch (err: any) {
      handleError('Failed to generate report', err);
    } finally {
      setIsDownloading(false);
    }
  }, [selectedOrganizer, selectedEvent, reportFormat, targetCurrencyId, includeCharts, useLatestRates, sendEmail, recipientEmail, handleError, showSuccess]);

  // ---------------------------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetchOrganizers();
    fetchCurrencies();
  }, [fetchOrganizers, fetchCurrencies]);

  useEffect(() => {
    if (selectedOrganizer) {
      fetchEvents(selectedOrganizer);
      setSelectedEvent(''); // Reset event selection when organizer changes
    } else {
      setEvents([]); // Clear events if no organizer is selected
    }
  }, [selectedOrganizer, fetchEvents]);

  useEffect(() => {
    // Only fetch rates if a currency is selected and it's not already USD (as USD is usually the base)
    if (selectedCurrency && selectedCurrency !== 'USD' && useLatestRates) {
      fetchExchangeRates('USD'); // Assuming USD is the base for exchange rates
    } else if (selectedCurrency === 'USD') {
      setExchangeRates(null); // Clear rates if USD is selected
    }
  }, [selectedCurrency, fetchExchangeRates, useLatestRates]);

  useEffect(() => {
    if (selectedCurrency) {
      const currency = currencies.find(c => c.code === selectedCurrency);
      if (currency) {
        setTargetCurrencyId(currency.id);
      }
    } else {
      setTargetCurrencyId(null);
    }
  }, [selectedCurrency, currencies]);

  // ---------------------------------------------------------------------------
  // FILTER FUNCTIONS
  // ---------------------------------------------------------------------------
  const filteredOrganizers = organizers.filter(org =>
    org.name.toLowerCase().includes(organizerSearch.toLowerCase()) ||
    org.email.toLowerCase().includes(organizerSearch.toLowerCase())
  );

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(eventSearch.toLowerCase()) ||
    event.location.toLowerCase().includes(eventSearch.toLowerCase())
  );

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  if (isLoadingCurrencies || isLoadingOrganizers) {
    return (
      <Card className={cn("max-w-3xl mx-auto my-8 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200")}>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-[#10b981]" />
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Loading initial data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("min-h-screen p-4 md:p-6 lg:p-8 dark:bg-gray-900 dark:text-gray-200 bg-gray-50 text-gray-800")}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">Generate and download comprehensive reports for organizers and events</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Organizer Selection */}
        <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
              <Users className="h-5 w-5" />
              Organizer Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organizer-search" className="dark:text-gray-200 text-gray-800">Search Organizers</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="organizer-search"
                  placeholder="Search by name or email..."
                  value={organizerSearch}
                  onChange={(e) => setOrganizerSearch(e.target.value)}
                  className={cn(
                    "pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800",
                    "focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  )}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="select-organizer" className="dark:text-gray-200 text-gray-800">Select Organizer</Label>
              <Select value={selectedOrganizer} onValueChange={setSelectedOrganizer}>
                <SelectTrigger id="select-organizer" className={cn(
                  "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800",
                  "focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                  {filteredOrganizers.length === 0 && (
                    <SelectItem value="no-organizers" disabled>
                      No organizers found.
                    </SelectItem>
                  )}
                  {filteredOrganizers.map((organizer) => (
                    <SelectItem
                      key={organizer.organizer_id}
                      value={organizer.organizer_id.toString()}
                      className={cn(
                        "hover:bg-green-50 hover:dark:bg-green-900/20",
                        selectedOrganizer === organizer.organizer_id.toString() && "bg-green-50 dark:bg-green-900/20"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="font-medium">{organizer.name}</div>
                          <div className="text-sm text-gray-500">{organizer.email}</div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                            {organizer.event_count} events
                          </Badge>
                          <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                            {organizer.report_count} reports
                          </Badge>
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
                Event Selection (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Leave empty to generate report for all events associated with the selected organizer.
              </p>
              <div className="space-y-2">
                <Label htmlFor="event-search" className="dark:text-gray-200 text-gray-800">Search Events</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="event-search"
                    placeholder="Search by name or location..."
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    className={cn(
                      "pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800",
                      "focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    )}
                    disabled={isLoadingEvents}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="select-event" className="dark:text-gray-200 text-gray-800">Select Event</Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent} disabled={isLoadingEvents}>
                  <SelectTrigger id="select-event" className={cn(
                    "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800",
                    "focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  )}>
                    <SelectValue placeholder={isLoadingEvents ? "Loading events..." : "Select an event (Optional)"}>
                      {selectedEvent && (
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          {events.find(e => e.event_id.toString() === selectedEvent)?.name}
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
                    <SelectItem value="">Select Event (Optional)</SelectItem>
                    {isLoadingEvents ? (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading events...
                        </div>
                      </SelectItem>
                    ) : filteredEvents.length === 0 ? (
                      <SelectItem value="no-events" disabled>
                        No events found for this organizer or search.
                      </SelectItem>
                    ) : (
                      filteredEvents.map((event) => (
                        <SelectItem
                          key={event.event_id}
                          value={event.event_id.toString()}
                          className={cn(
                            "hover:bg-green-50 hover:dark:bg-green-900/20",
                            selectedEvent === event.event_id.toString() && "bg-green-50 dark:bg-green-900/20"
                          )}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full text-left">
                            <div className="font-medium">{event.name}</div>
                            <div className="text-sm text-gray-500">
                              {event.location} • {new Date(event.event_date).toLocaleDateString()}
                              <Badge variant="outline" className="ml-2 dark:border-gray-600 dark:text-gray-300">
                                {event.report_count} reports
                              </Badge>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Settings */}
        <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
              <Settings className="h-5 w-5" />
              Report Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Currency Settings */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <Label className="text-base font-medium dark:text-gray-200 text-gray-800">Currency Settings</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchExchangeRates('USD')}
                  disabled={isLoadingRates || !useLatestRates} // Disable if not using latest rates
                  className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", isLoadingRates && "animate-spin")} />
                  Refresh Rates
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target-currency" className="dark:text-gray-200 text-gray-800">Target Currency</Label>
                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency} disabled={isLoadingCurrencies}>
                    <SelectTrigger id="target-currency" className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800">
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
                      {isLoadingCurrencies ? (
                        <SelectItem value="loading" disabled>
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading currencies...
                          </div>
                        </SelectItem>
                      ) : (
                        currencies.map((currency) => (
                          <SelectItem key={currency.id} value={currency.code}>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{currency.symbol}</span>
                              <span className="font-medium">{currency.code}</span>
                              <span className="text-gray-500">- {currency.name}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {/* Display Exchange Rate */}
                {exchangeRates && selectedCurrency && selectedCurrency !== 'USD' && useLatestRates && (
                  <div className="space-y-2">
                    <Label className="dark:text-gray-200 text-gray-800">Exchange Rate (USD → {selectedCurrency})</Label>
                    <div className="p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 bg-gray-100 border-gray-300">
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

            {/* Report Options */}
            <div className="space-y-4">
              <Label className="text-base font-medium dark:text-gray-200 text-gray-800">Report Options</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="include-charts" className="dark:text-gray-200 text-gray-800">Include Charts</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add visual charts to the report</p>
                  </div>
                  <Switch
                    id="include-charts"
                    checked={includeCharts}
                    onCheckedChange={setIncludeCharts}
                    className="data-[state=checked]:bg-[#10b981]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="use-latest-rates" className="dark:text-gray-200 text-gray-800">Use Latest Rates</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Use real-time exchange rates for conversions</p>
                  </div>
                  <Switch
                    id="use-latest-rates"
                    checked={useLatestRates}
                    onCheckedChange={setUseLatestRates}
                    className="data-[state=checked]:bg-[#10b981]"
                  />
                </div>
              </div>
            </div>

            <Separator className="dark:bg-gray-700 bg-gray-200" />

            {/* Email Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium dark:text-gray-200 text-gray-800">Email Settings (Optional)</Label>
                <Switch
                  checked={sendEmail}
                  onCheckedChange={setSendEmail}
                  className="data-[state=checked]:bg-[#10b981]"
                />
              </div>
              {sendEmail && (
                <div className="space-y-2">
                  <Label htmlFor="recipient-email" className="dark:text-gray-200 text-gray-800">Recipient Email</Label>
                  <Input
                    id="recipient-email"
                    type="email"
                    placeholder="Enter recipient email (optional)"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Leave empty to send the report to your account email.
                  </p>
                </div>
              )}
            </div>

            <Separator className="dark:bg-gray-700 bg-gray-200" />

            {/* Format Selection */}
            <div className="space-y-4">
              <Label htmlFor="report-format" className="text-base font-medium dark:text-gray-200 text-gray-800">Report Format</Label>
              <Select value={reportFormat} onValueChange={setReportFormat}>
                <SelectTrigger id="report-format" className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      CSV (Spreadsheet)
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4" />
                      PDF (Document)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Generate Report Button */}
        <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200")}>
          <CardContent className="p-6">
            <Button
              onClick={generateReport}
              disabled={!selectedOrganizer || isDownloading}
              className="w-full bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-600 hover:to-[#0ea372] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Generate & Download Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions Footer */}
        <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200")}>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Globe className="h-4 w-4" />
                <span>
                  {currencies.length} currencies available • {organizers.length} organizers loaded
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchOrganizers}
                disabled={isLoadingOrganizers}
                className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoadingOrganizers && "animate-spin")} />
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminReports;