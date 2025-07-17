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

// Adjusted to match the AdminOrganizerListResource API response
interface Organizer {
  organizer_id: number; // Changed from 'id' to 'organizer_id'
  name: string; // Changed from 'full_name' to 'name'
  email: string;
  phone: string; // Changed from 'phone_number' to 'phone'
  event_count: number; // Added from API response
  metrics: { // Added from API response
    total_tickets_sold: number;
    total_revenue: number;
    total_attendees: number;
    currency: string;
    currency_symbol: string;
  };
}

// Adjusted to match the AdminEventListResource API response
interface Event {
  event_id: number;
  name: string; // Changed from 'event_name' to 'name'
  event_date: string;
  location: string;
  status: string; // Added from API response (Event status)
  metrics: { // Added from API response
    tickets_sold: number;
    revenue: number;
    attendees: number;
    currency: string;
    currency_symbol: string;
  };
}

// This interface seems to be for a general report data structure, not directly for API responses.
// It might be used for displaying aggregated data if you fetch and combine reports on the frontend.
// Given the current API structure, we'll mostly work with Organizer[] and Event[].
// interface AdminReport {
//   organizer_id: number;
//   organizer_name: string;
//   total_tickets_sold: number;
//   total_revenue: number;
//   total_attendees: number;
//   event_count: number;
//   report_count: number;
//   currency: string;
//   currency_symbol: string;
//   events: Array<{
//     event_id: number;
//     event_name: string;
//     event_date: string;
//     location: string;
//     tickets_sold: number;
//     revenue: number;
//     attendees: number;
//     report_count: number;
//   }>;
// }

interface ExchangeRates {
  base: string; // Changed from 'base_currency' to 'base'
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
  const [selectedCurrency, setSelectedCurrency] = useState<string>('KES'); // Default to KES as per backend logic
  const [targetCurrencyId, setTargetCurrencyId] = useState<number | null>(null);
  const [reportFormat, setReportFormat] = useState<string>('csv');
  const [includeCharts, setIncludeCharts] = useState<boolean>(true);
  const [useLatestRates, setUseLatestRates] = useState<boolean>(true);
  const [sendEmail, setSendEmail] = useState<boolean>(false);
  const [recipientEmail, setRecipientEmail] = useState<string>(''); // This might be auto-filled from user context if available
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
      // Ensure VITE_API_URL is correctly defined in your .env file (e.g., VITE_API_URL=http://localhost:5000)
      const url = new URL(`${import.meta.env.VITE_API_URL}/admin/organizers`);
      if (targetCurrencyId) {
        url.searchParams.append('currency_id', targetCurrencyId.toString());
      }
      const response = await fetch(url.toString(), {
        credentials: 'include' // Important for sending cookies/JWT
      });

      if (!response.ok) {
        const errorData = await response.json();
        handleError(errorData.message || "Failed to fetch organizers.", errorData);
        return;
      }
      const data = await response.json();
      // The backend returns { "organizers": [], "total_count": ..., "currency_info": ... }
      setOrganizers(data.organizers || []);
      showSuccess('Organizers loaded successfully');
    } catch (err) {
      handleError('Failed to fetch organizers', err);
      setOrganizers([]); // Clear organizers on error
    } finally {
      setIsLoadingOrganizers(false);
    }
  }, [handleError, showSuccess, targetCurrencyId]); // Dependency on targetCurrencyId for currency conversion

  const fetchEvents = useCallback(async (organizerId: string) => {
    if (!organizerId) {
      setEvents([]); // Clear events if no organizer selected
      return;
    }
    setIsLoadingEvents(true);
    try {
      const url = new URL(`${import.meta.env.VITE_API_URL}/admin/organizers/${organizerId}/events`);
      if (targetCurrencyId) {
        url.searchParams.append('currency_id', targetCurrencyId.toString());
      }
      const response = await fetch(url.toString(), {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        handleError(errorData.message || "Failed to fetch events.", errorData);
        return;
      }
      const data = await response.json();
      // The backend returns { "events": [], "organizer_name": ..., "summary": ..., "currency_info": ... }
      setEvents(data.events || []);
      showSuccess('Events loaded successfully');
    } catch (err) {
      handleError('Failed to fetch events', err);
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [handleError, showSuccess, targetCurrencyId]); // Dependency on targetCurrencyId

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
      // Set a default currency if not already selected
      if (!selectedCurrency && data.data && data.data.length > 0) {
        // Try to find KES or fallback to the first currency
        const kesCurrency = data.data.find((c: Currency) => c.code === 'KES');
        if (kesCurrency) {
          setSelectedCurrency(kesCurrency.code);
          setTargetCurrencyId(kesCurrency.id);
        } else {
          setSelectedCurrency(data.data[0].code);
          setTargetCurrencyId(data.data[0].id);
        }
      }
      showSuccess('Currencies loaded successfully');
    } catch (err) {
      handleError('Failed to fetch currencies', err);
      setCurrencies([]);
    } finally {
      setIsLoadingCurrencies(false);
    }
  }, [handleError, showSuccess, selectedCurrency]);

  const fetchExchangeRates = useCallback(async (baseCurrency: string = 'KES') => { // Default to KES as your backend seems to be KSH/KES based
    setIsLoadingRates(true);
    try {
      // Assuming your backend supports a 'base' query parameter for exchange rates
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/currency/latest?base=${baseCurrency}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        handleError(errorData.message || "Failed to fetch exchange rates.", errorData);
        return;
      }
      const data = await response.json();
      setExchangeRates(data.data); // Backend returns { "data": { base: "USD", rates: {...}, source: "..." } }
      showSuccess(`Exchange rates updated for ${baseCurrency}`);
    } catch (err) {
      handleError('Failed to fetch exchange rates', err);
      setExchangeRates(null);
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

      if (selectedEvent && selectedEvent !== 'all-events') {
        params.append('event_id', selectedEvent);
      }
      params.append('format', reportFormat);

      // Only append currency params if a target currency is selected and it's not the default KES (if KES is the base for backend)
      // The backend implies KES is the internal base for calculations, then converts.
      // So sending target_currency_id or code is for conversion.
      if (targetCurrencyId && currencies.find(c => c.id === targetCurrencyId)?.code !== 'KES') {
        params.append('currency_id', targetCurrencyId.toString());
      }

      params.append('include_charts', includeCharts.toString());
      params.append('use_latest_rates', useLatestRates.toString());
      params.append('send_email', sendEmail.toString()); // The backend expects 'send_email', not 'include_email'
      if (sendEmail && recipientEmail) { // Only send recipient_email if sendEmail is true
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

      // Handle different content types based on reportFormat
      if (reportFormat.toLowerCase() === 'json') {
        const reportData = await response.json();
        console.log("JSON Report Data:", reportData);
        showSuccess('JSON report generated successfully. Check console for data.');
        // If you want to display JSON data on the UI, you'd need another state variable for it.
        // For now, it's just logged.
      } else {
        // For CSV and PDF, download the blob
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `admin_report_${selectedOrganizer}_${new Date().toISOString().split('T')[0]}.${reportFormat}`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
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

    } catch (err) {
      handleError('Failed to generate report', err);
    } finally {
      setIsDownloading(false);
    }
  }, [selectedOrganizer, selectedEvent, reportFormat, targetCurrencyId, includeCharts, useLatestRates, sendEmail, recipientEmail, handleError, showSuccess, currencies]);

  // Effects
  useEffect(() => {
    fetchOrganizers();
    fetchCurrencies();
  }, [fetchOrganizers, fetchCurrencies]);

  // When selectedCurrency changes, update targetCurrencyId and possibly fetch rates
  useEffect(() => {
    if (selectedCurrency) {
      const currency = currencies.find(c => c.code === selectedCurrency);
      if (currency) {
        setTargetCurrencyId(currency.id);
        // If the selected currency is not KES (your presumed base), fetch rates from KES to it
        // Or if you always want USD as base for rates display, keep USD
        // Backend's `convert_revenue_to_currency` implies KES is internal,
        // so fetching rates from KES to target might be more accurate for display if needed.
        if (selectedCurrency !== 'KES') {
          fetchExchangeRates('KES'); // Fetch rates with KES as base
        } else {
          setExchangeRates(null); // Clear rates if KES is selected, as no conversion needed
        }
      }
    } else {
      setTargetCurrencyId(null);
      setExchangeRates(null);
    }
  }, [selectedCurrency, currencies, fetchExchangeRates]);


  useEffect(() => {
    // Refetch organizers with new currency setting
    fetchOrganizers();
    if (selectedOrganizer) {
      // Refetch events for the selected organizer with new currency setting
      fetchEvents(selectedOrganizer);
    }
  }, [targetCurrencyId]); // Re-run when targetCurrencyId changes

  useEffect(() => {
    if (selectedOrganizer) {
      fetchEvents(selectedOrganizer);
      setSelectedEvent('all-events'); // Reset event selection when organizer changes
    } else {
      setEvents([]); // Clear events if no organizer is selected
      setSelectedEvent('all-events'); // Reset event selection
    }
  }, [selectedOrganizer, fetchEvents]); // Only refetch events when selectedOrganizer changes

  // Filter Functions
  const filteredOrganizers = organizers.filter(org =>
    org.name.toLowerCase().includes(organizerSearch.toLowerCase()) || // Changed from full_name to name
    org.email.toLowerCase().includes(organizerSearch.toLowerCase())
  );

  const filteredEvents = events.filter(event => {
    const nameMatch = event.name && event.name.toLowerCase().includes(eventSearch.toLowerCase()); // Changed from event_name to name
    const locationMatch = event.location && event.location.toLowerCase().includes(eventSearch.toLowerCase());
    return nameMatch || locationMatch;
  });

  // Render
  if (isLoadingCurrencies || isLoadingOrganizers) {
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
                            {/* Changed from 'id' to 'organizer_id' and 'full_name' to 'name' */}
                            {organizers.find(o => o.organizer_id.toString() === selectedOrganizer)?.name}
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
                      {filteredOrganizers.map((organizer) => (
                        <SelectItem
                          key={organizer.organizer_id} // Changed from 'id' to 'organizer_id'
                          value={organizer.organizer_id.toString()} // Changed from 'id' to 'organizer_id'
                          className={cn(
                            "dark:text-gray-200 text-gray-800 focus:bg-[#10b981] focus:text-white hover:bg-[#10b981] hover:text-white",
                            selectedOrganizer === organizer.organizer_id.toString() && "bg-[#10b981] text-white" // Changed from 'id' to 'organizer_id'
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{organizer.name}</div> {/* Changed from full_name to name */}
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
                              <div className="font-medium">{event.name}</div> {/* Changed from event_name to name */}
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
                      onClick={() => fetchExchangeRates(selectedCurrency || 'KES')} 
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
                    {exchangeRates && selectedCurrency && selectedCurrency !== exchangeRates.base && (
                      <div className="space-y-2">
                        <Label className="dark:text-gray-200 text-gray-800 text-sm font-medium">Exchange Rate ({exchangeRates.base} → {selectedCurrency})</Label>
                        <div className="p-4 rounded-lg border dark:bg-gray-700 dark:border-gray-600 bg-gray-100 border-gray-300">
                          <div className="text-lg font-semibold dark:text-gray-200 text-gray-800">
                            1 {exchangeRates.base} = {exchangeRates.rates[selectedCurrency]?.toFixed(4) || 'N/A'} {selectedCurrency}
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
                  </div>
                </div>
                <Separator className="dark:bg-gray-700 bg-gray-200" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium dark:text-gray-200 text-gray-800">Email Settings</Label>
                    <Switch
                      checked={sendEmail}
                      onCheckedChange={setSendEmail}
                      className="data-[state=checked]:bg-[#10b981] dark:data-[state=checked]:bg-[#10b981]"
                    />
                  </div>
                  {sendEmail && (
                    <div className="space-y-2 p-4 border rounded-lg dark:border-gray-600 border-gray-300">
                      <Label className="dark:text-gray-200 text-gray-800 text-sm font-medium">Recipient Email</Label>
                      <Input
                        type="email"
                        placeholder="Enter recipient email (optional)"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className={cn(
                          "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800",
                          "focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] dark:focus:ring-[#10b981] dark:focus:border-[#10b981] h-11"
                        )}
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Leave empty to send to your account email
                      </p>
                    </div>
                  )}
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
                        {/* Only offer JSON if you plan to display it directly on the UI and not download */}
                        {/* <SelectItem
                          value="json"
                          className="dark:text-gray-200 text-gray-800 focus:bg-[#10b981] focus:text-white hover:bg-[#10b981] hover:text-white"
                        >
                          <div className="flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            JSON (API Response)
                          </div>
                        </SelectItem> */}
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