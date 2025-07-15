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
  Settings,
  ChevronDown,
  ChevronUp
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
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    organizer: true,
    event: true,
    settings: true
  });

  // ---------------------------------------------------------------------------
  // HELPER FUNCTIONS
  // ---------------------------------------------------------------------------
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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
      handleError('Please select an organizer');
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
      if (recipientEmail) params.append('recipient_email', recipientEmail);

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
      setSelectedEvent(''); // Reset event selection
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-12 w-12 animate-spin text-[#10b981]" />
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Loading initial data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-6xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Reports</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Generate and download comprehensive reports for organizers and events
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Organizer Selection */}
        <Card className="shadow-lg">
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('organizer')}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Users className="h-5 w-5" />
                Organizer Selection
              </CardTitle>
              {expandedSections.organizer ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections.organizer && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Search Organizers</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or email..."
                    value={organizerSearch}
                    onChange={(e) => setOrganizerSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Select Organizer</Label>
                <Select value={selectedOrganizer} onValueChange={setSelectedOrganizer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an organizer">
                      {selectedOrganizer && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span className="truncate">
                            {organizers.find(o => o.organizer_id.toString() === selectedOrganizer)?.name}
                          </span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {filteredOrganizers.map((organizer) => (
                      <SelectItem
                        key={organizer.organizer_id}
                        value={organizer.organizer_id.toString()}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{organizer.name}</div>
                            <div className="text-sm text-gray-500 truncate">{organizer.email}</div>
                          </div>
                          <div className="flex gap-2 mt-1 sm:mt-0">
                            <Badge variant="outline" className="text-xs">
                              {organizer.event_count} events
                            </Badge>
                            <Badge variant="outline" className="text-xs">
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
          )}
        </Card>

        {/* Event Selection */}
        {selectedOrganizer && (
          <Card className="shadow-lg">
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleSection('event')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg sm:text-xl">
                  Event Selection (Optional)
                </CardTitle>
                {expandedSections.event ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
            {expandedSections.event && (
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Leave empty to generate report for all events
                </p>
                <div className="space-y-2">
                  <Label>Search Events</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search events..."
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Event (Optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEvents.map((event) => (
                      <SelectItem key={event.event_id} value={event.event_id.toString()}>
                        <div className="flex flex-col w-full">
                          <div className="font-medium truncate">{event.name}</div>
                          <div className="text-sm text-gray-500 truncate">
                            {event.location} - {new Date(event.event_date).toLocaleDateString()} 
                            ({event.report_count} reports)
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            )}
          </Card>
        )}

        {/* Report Settings */}
        <Card className="shadow-lg">
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('settings')}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Settings className="h-5 w-5" />
                Report Settings
              </CardTitle>
              {expandedSections.settings ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections.settings && (
            <CardContent className="space-y-6">
              {/* Currency Settings */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <Label className="text-base font-medium">Currency Settings</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchExchangeRates('USD')}
                    disabled={isLoadingRates}
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw className={cn("h-4 w-4 mr-2", isLoadingRates && "animate-spin")} />
                    Refresh Rates
                  </Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Target Currency</Label>
                    <Select value={selectedCurrency} onValueChange={setSelectedCurrency} disabled={isLoadingCurrencies}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency">
                          {selectedCurrency && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              <span>{currencies.find(c => c.code === selectedCurrency)?.symbol} {selectedCurrency}</span>
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
                              <span className="text-gray-500 hidden sm:inline">- {currency.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Display Exchange Rate */}
                  {exchangeRates && selectedCurrency && selectedCurrency !== 'USD' && (
                    <div className="space-y-2">
                      <Label>Exchange Rate (USD → {selectedCurrency})</Label>
                      <div className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-800">
                        <div className="text-base sm:text-lg font-semibold">
                          1 USD = {exchangeRates.rates[selectedCurrency]?.toFixed(4) || 'N/A'} {selectedCurrency}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Source: {exchangeRates.source}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Report Options */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Report Options</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <Label>Include Charts</Label>
                      <p className="text-sm text-gray-500">Add visual charts to the report</p>
                    </div>
                    <Switch
                      checked={includeCharts}
                      onCheckedChange={setIncludeCharts}
                      className="data-[state=checked]:bg-[#10b981]"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <Label>Use Latest Rates</Label>
                      <p className="text-sm text-gray-500">Use real-time exchange rates</p>
                    </div>
                    <Switch
                      checked={useLatestRates}
                      onCheckedChange={setUseLatestRates}
                      className="data-[state=checked]:bg-[#10b981]"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Email Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Email Settings (Optional)</Label>
                    <p className="text-sm text-gray-500">Send report via email</p>
                  </div>
                  <Switch
                    checked={sendEmail}
                    onCheckedChange={setSendEmail}
                    className="data-[state=checked]:bg-[#10b981]"
                  />
                </div>
                {sendEmail && (
                  <div className="space-y-2">
                    <Label>Recipient Email</Label>
                    <Input
                      type="email"
                      placeholder="Enter recipient email (optional)"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                    />
                    <p className="text-sm text-gray-500">
                      Leave empty to send to your account email
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Format Selection */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Report Format</Label>
                <Select value={reportFormat} onValueChange={setReportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
          )}
        </Card>

        {/* Generate Report Button */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <Button
              onClick={generateReport}
              disabled={!selectedOrganizer || isDownloading}
              className="w-full bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-600 hover:to-[#0ea372] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105 disabled:scale-100"
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
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Globe className="h-4 w-4" />
                <span className="text-center sm:text-left">
                  {currencies.length} currencies • {organizers.length} organizers
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchOrganizers}
                disabled={isLoadingOrganizers}
                className="w-full sm:w-auto"
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