// =============================================================================
// IMPORTS
// =============================================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Loader2,
  AlertCircle,
  FileText,
  RefreshCw,
  Globe,
  BarChart3,
  Download,
  Mail,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  File,
  Send,
  Eye,
  Filter,
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
  const [reportData, setReportData] = useState<AdminReport | null>(null);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);

  // Report Configuration State
  const [selectedOrganizer, setSelectedOrganizer] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [targetCurrencyId, setTargetCurrencyId] = useState<number | null>(null);
  const [reportFormat, setReportFormat] = useState<string>('json');
  const [includeCharts, setIncludeCharts] = useState<boolean>(true);
  const [useLatestRates, setUseLatestRates] = useState<boolean>(true);
  const [sendEmail, setSendEmail] = useState<boolean>(false);
  const [recipientEmail, setRecipientEmail] = useState<string>('');

  // Loading States
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [isLoadingOrganizers, setIsLoadingOrganizers] = useState<boolean>(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState<boolean>(false);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // UI State
  const [organizerSearch, setOrganizerSearch] = useState<string>('');
  const [eventSearch, setEventSearch] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('config');

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
  }, [handleError, showSuccess, toast]);

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
  }, [handleError, showSuccess, toast]);

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
  }, [handleError, showSuccess, selectedCurrency, toast]);

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
  }, [handleError, showSuccess, toast]);

  const generateReport = useCallback(async () => {
    if (!selectedOrganizer) {
      handleError('Please select an organizer');
      return;
    }
    setIsLoadingReport(true);
    try {
      const params = new URLSearchParams();
      params.append('organizer_id', selectedOrganizer);
      if (selectedEvent) params.append('event_id', selectedEvent);
      if (reportFormat !== 'json') params.append('format', reportFormat);
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
      if (reportFormat === 'json') {
        const data = await response.json();
        setReportData(data);
        setActiveTab('results');
        showSuccess('Report generated successfully');
      } else {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admin_report_${selectedOrganizer}_${new Date().toISOString().split('T')[0]}.${reportFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showSuccess(`${reportFormat.toUpperCase()} report downloaded successfully`);
      }
    } catch (err: any) {
      handleError('Failed to generate report', err);
    } finally {
      setIsLoadingReport(false);
    }
  }, [
    selectedOrganizer,
    selectedEvent,
    reportFormat,
    targetCurrencyId,
    includeCharts,
    useLatestRates,
    sendEmail,
    recipientEmail,
    handleError,
    showSuccess,
    toast
  ]);

  const downloadReport = useCallback(async (format: string) => {
    if (!selectedOrganizer) {
      handleError('Please select an organizer first');
      return;
    }
    setIsDownloading(true);
    try {
      const params = new URLSearchParams();
      params.append('organizer_id', selectedOrganizer);
      if (selectedEvent) params.append('event_id', selectedEvent);
      params.append('format', format);
      if (targetCurrencyId) params.append('currency_id', targetCurrencyId.toString());
      params.append('include_charts', includeCharts.toString());
      params.append('use_latest_rates', useLatestRates.toString());
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports?${params.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        handleError(errorData.message || `Failed to download ${format} report.`, errorData);
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin_report_${selectedOrganizer}_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showSuccess(`${format.toUpperCase()} report downloaded successfully`);
    } catch (err: any) {
      handleError(`Failed to download ${format} report`, err);
    } finally {
      setIsDownloading(false);
    }
  }, [selectedOrganizer, selectedEvent, targetCurrencyId, includeCharts, useLatestRates, handleError, showSuccess, toast]);

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
  // RENDER FUNCTIONS
  // ---------------------------------------------------------------------------
  const renderConfigurationTab = () => (
    <div className="space-y-6">
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
              <Label className="dark:text-gray-200 text-gray-800">Search Organizers</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={organizerSearch}
                  onChange={(e) => setOrganizerSearch(e.target.value)}
                  className={cn(
                    "pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800",
                    "focus:ring-2 focus:ring-green-500 focus:border-green-500",
                    "focus:outline-none focus:ring-offset-0",
                    "transition-colors duration-200",
                    // Additional green focus styling to override any purple defaults
                    "focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500",
                    "focus-visible:outline-none focus-visible:ring-offset-0"
                  )}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="dark:text-gray-200 text-gray-800">Select Organizer</Label>
              <Select value={selectedOrganizer} onValueChange={setSelectedOrganizer}>
                <SelectTrigger className={cn(
                  "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800",
                  "focus:ring-2 focus:ring-green-500 focus:border-green-500",
                  "focus:outline-none focus:ring-offset-0",
                  "transition-colors duration-200"
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
                        "hover:bg-green-50 hover:dark:bg-green-900/20 data-[highlighted]:bg-green-50 data-[highlighted]:dark:bg-green-900/20",
                        "focus:bg-green-50 focus:dark:bg-green-900/20",
                        selectedOrganizer === organizer.organizer_id.toString() && "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="font-medium">{organizer.name}</div>
                          <div className="text-sm text-gray-500">{organizer.email}</div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="dark:text-gray-200 text-gray-800">{organizer.event_count} events</Badge>
                          <Badge variant="outline" className="dark:text-gray-200 text-gray-800">{organizer.report_count} reports</Badge>
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
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Selection (Optional)
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Leave empty to generate report for all events
              </p>
            </div>
            <div className="relative">
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500",
                  "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800",
                  // Add green background when event is selected
                  selectedEvent && "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600"
                )}
                style={{
                  colorScheme: 'dark' // This helps with consistent styling in dark mode
                }}
              >
                <option value="">Select Event</option>
                {events.map((event) => (
                  <option key={event.event_id} value={event.event_id.toString()}>
                    {event.name} - {event.location} - {new Date(event.event_date).toLocaleDateString()} ({event.report_count} reports)
                  </option>
                ))}
              </select>

              {selectedEvent && (
                <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      Selected Event: {events.find(e => e.event_id.toString() === selectedEvent)?.name}
                    </p>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 ml-4">
                    {events.find(e => e.event_id.toString() === selectedEvent)?.location} - {' '}
                    {new Date(events.find(e => e.event_id.toString() === selectedEvent)?.event_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
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
                <Label className="dark:text-gray-200 text-gray-800">Target Currency</Label>
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency} disabled={isLoadingCurrencies}>
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800">
                    <SelectValue placeholder="Select currency">
                      {isLoadingCurrencies ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading currencies...
                        </div>
                      ) : (
                        selectedCurrency && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            {currencies.find(c => c.code === selectedCurrency)?.symbol} {selectedCurrency}
                          </div>
                        )
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
                    {currencies.map((currency) => (
                      <SelectItem
                        key={currency.id}
                        value={currency.code}
                        className={cn(
                          selectedCurrency === currency.code && "bg-[#10b981] text-white"
                        )}
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
              {/* Display Exchange Rate */}
              {exchangeRates && selectedCurrency && selectedCurrency !== 'USD' && (
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
                  <Label className="dark:text-gray-200 text-gray-800">Include Charts</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Add visual charts to the report</p>
                </div>
                <Switch
                  checked={includeCharts}
                  onCheckedChange={setIncludeCharts}
                  className="dark:border-gray-500 dark:bg-gray-700 data-[state=checked]:bg-[#10b981] dark:data-[state=checked]:bg-[#10b981] data-[state=checked]:text-white dark:data-[state=checked]:text-white"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="dark:text-gray-200 text-gray-800">Use Latest Rates</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Use real-time exchange rates</p>
                </div>
                <Switch
                  checked={useLatestRates}
                  onCheckedChange={setUseLatestRates}
                  className="dark:border-gray-500 dark:bg-gray-700 data-[state=checked]:bg-[#10b981] dark:data-[state=checked]:bg-[#10b981] data-[state=checked]:text-white dark:data-[state=checked]:text-white"
                />
              </div>
            </div>
          </div>
          <Separator className="dark:bg-gray-700 bg-gray-200" />
          {/* Email Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium dark:text-gray-200 text-gray-800">Email Settings</Label>
              <Switch
                checked={sendEmail}
                onCheckedChange={setSendEmail}
                className="dark:border-gray-500 dark:bg-gray-700 data-[state=checked]:bg-[#10b981] dark:data-[state=checked]:bg-[#10b981] data-[state=checked]:text-white dark:data-[state=checked]:text-white"
              />
            </div>
            {sendEmail && (
              <div className="space-y-2">
                <Label className="dark:text-gray-200 text-gray-800">Recipient Email</Label>
                <Input
                  type="email"
                  placeholder="Enter recipient email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className={cn("dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800")}
                />
              </div>
            )}
          </div>
          <Separator className="dark:bg-gray-700 bg-gray-200" />
          {/* Format Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium dark:text-gray-200 text-gray-800">Report Format</Label>
            <Select value={reportFormat} onValueChange={setReportFormat}>
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
                <SelectItem value="json" className="dark:text-gray-200 text-gray-800">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    JSON (View in Dashboard)
                  </div>
                </SelectItem>
                <SelectItem value="csv" className="dark:text-gray-200 text-gray-800">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV (Download)
                  </div>
                </SelectItem>
                <SelectItem value="pdf" className="dark:text-gray-200 text-gray-800">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4" />
                    PDF (Download)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={generateReport}
          disabled={!selectedOrganizer || isLoadingReport}
          className="flex-1 bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] hover:scale-105 transition-all flex items-center"
        >
          {isLoadingReport ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <BarChart3 className="mr-2 h-4 w-4" />
              Generate Report
            </>
          )}
        </Button>
        {reportFormat === 'json' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => downloadReport('csv')}
              disabled={!selectedOrganizer || isDownloading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] hover:scale-105 transition-all flex items-center"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadReport('pdf')}
              disabled={!selectedOrganizer || isDownloading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] hover:scale-105 transition-all flex items-center"
            >
              <File className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderResultsTab = () => (
    <div className="space-y-6">
      {reportData ? (
        <>
          {/* Events Table */}
          <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200")}>
            <CardHeader>
              <CardTitle className="dark:text-gray-200 text-gray-800">Event Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border dark:border-gray-700 border-gray-200">
                  <thead>
                    <tr className="dark:bg-gray-700 bg-gray-50">
                      <th className="border dark:border-gray-700 border-gray-200 p-2 text-left dark:text-gray-200 text-gray-800">Event Name</th>
                      <th className="border dark:border-gray-700 border-gray-200 p-2 text-left dark:text-gray-200 text-gray-800">Date</th>
                      <th className="border dark:border-gray-700 border-gray-200 p-2 text-left dark:text-gray-200 text-gray-800">Location</th>
                      <th className="border dark:border-gray-700 border-gray-200 p-2 text-right dark:text-gray-200 text-gray-800">Tickets</th>
                      <th className="border dark:border-gray-700 border-gray-200 p-2 text-right dark:text-gray-200 text-gray-800">Revenue</th>
                      <th className="border dark:border-gray-700 border-gray-200 p-2 text-right dark:text-gray-200 text-gray-800">Attendees</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.events.map((event) => (
                      <tr key={event.event_id} className="hover:dark:bg-gray-700 hover:bg-gray-50">
                        <td className="border dark:border-gray-700 border-gray-200 p-2 dark:text-gray-200 text-gray-800">{event.event_name}</td>
                        <td className="border dark:border-gray-700 border-gray-200 p-2 dark:text-gray-200 text-gray-800">
                          {new Date(event.event_date).toLocaleDateString()}
                        </td>
                        <td className="border dark:border-gray-700 border-gray-200 p-2 dark:text-gray-200 text-gray-800">{event.location}</td>
                        <td className="border dark:border-gray-700 border-gray-200 p-2 text-right dark:text-gray-200 text-gray-800">{event.tickets_sold}</td>
                        <td className="border dark:border-gray-700 border-gray-200 p-2 text-right dark:text-gray-200 text-gray-800">
                          {reportData.currency_symbol}{event.revenue.toLocaleString()}
                        </td>
                        <td className="border dark:border-gray-700 border-gray-200 p-2 text-right dark:text-gray-200 text-gray-800">{event.attendees}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200")}>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-center">
              No report data available. Generate a report from the Configuration tab.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

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
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}
        {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 gap-6 p-3 dark:bg-gray-700 dark:border-gray-600 bg-gray-200 border-gray-300">
              <TabsTrigger 
                value="config" 
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] hover:scale-105 transition-all flex items-center justify-center rounded-md"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configuration
              </TabsTrigger>
              <TabsTrigger 
                value="results" 
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] hover:scale-105 transition-all flex items-center justify-center rounded-md"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Results
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="config" className="mt-8">
              {renderConfigurationTab()}
            </TabsContent>
            
            <TabsContent value="results" className="mt-8">
              {renderResultsTab()}
            </TabsContent>
          </Tabs>
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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchOrganizers}
                  disabled={isLoadingOrganizers}
                  className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", isLoadingOrganizers ? "animate-spin" : '')} />
                  Refresh Data
                </Button>
                {reportData && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('results')}
                    className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 bg-gray-200 text-gray-800 hover:bg-gray-300"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Results
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminReports;
