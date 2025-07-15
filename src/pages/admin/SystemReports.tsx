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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Settings,
  Activity,
  Bug
} from "lucide-react";
import {
  BarChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';

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
  data?: {
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
    currency_symbol: string;
  };
  fresh_report_data?: {
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
    currency_symbol: string;
  };
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const AdminReports: React.FC = () => {
  const { toast } = useToast();

  // Helper functions to extract data
  function extractEvents(data: AdminReport | null) {
    return (
      data?.events ||
      data?.data?.events ||
      data?.fresh_report_data?.events ||
      []
    );
  }

  function extractCurrency(data: AdminReport | null) {
    return (
      data?.currency_symbol ||
      data?.data?.currency_symbol ||
      data?.fresh_report_data?.currency_symbol ||
      '$'
    );
  }

  // ---------------------------------------------------------------------------
  // HOOKS & SETUP
  // ---------------------------------------------------------------------------
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    toast({
      title: type === 'success' ? "Success" : "Error",
      description: message,
      variant: type === 'success' ? "default" : "destructive",
    });
  }, [toast]);

  // ---------------------------------------------------------------------------
  // STATE VARIABLES
  // ---------------------------------------------------------------------------
  // Core Data State
  const [reportData, setReportData] = useState<AdminReport | null>(null);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);

  // Debug State
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [rawApiResponse, setRawApiResponse] = useState<any>(null);

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
    showToast(err?.message || message, 'error');
  }, [showToast]);

  const showSuccess = useCallback((message: string) => {
    console.log('Success:', message);
    setError(null);
    showToast(message, 'success');
  }, [showToast]);

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
  }, [selectedOrganizer, selectedEvent, reportFormat, targetCurrencyId, includeCharts, useLatestRates, sendEmail, recipientEmail, handleError, showSuccess]);

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
  }, [selectedOrganizer, selectedEvent, targetCurrencyId, includeCharts, useLatestRates, handleError, showSuccess]);

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
  // DEBUG COMPONENTS
  // ---------------------------------------------------------------------------
  const renderDebugInfo = () => {
    if (!debugMode) return null;
    const events = extractEvents(reportData);
    const currencySymbol = extractCurrency(reportData);
    return (
      <Alert className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
        <Bug className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <div><strong>Debug Info:</strong></div>
            <div>• Report Data exists: {reportData ? 'Yes' : 'No'}</div>
            <div>• Events count: {events.length}</div>
            <div>• Currency symbol: {currencySymbol}</div>
            <div>• Events structure valid: {events.every(e => e && typeof e === 'object' && e.event_name) ? 'Yes' : 'No'}</div>
            <details className="mt-2">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">View Raw Data</summary>
              <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(rawApiResponse, null, 2)}
              </pre>
            </details>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  // ---------------------------------------------------------------------------
  // RENDER FUNCTIONS
  // ---------------------------------------------------------------------------
  const renderConfigurationTab = () => (
    <div className="space-y-6">
      {/* Debug Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-blue-600" />
          <Label>Debug Mode</Label>
        </div>
        <Switch checked={debugMode} onCheckedChange={setDebugMode} />
      </div>
      {renderDebugInfo()}

      {/* Organizer Selection */}
      <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Organizer Selection
          </CardTitle>
        </CardHeader>
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
                      {organizers.find(o => o.organizer_id.toString() === selectedOrganizer)?.name}
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
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium">{organizer.name}</div>
                        <div className="text-sm text-gray-500">{organizer.email}</div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{organizer.event_count} events</Badge>
                        <Badge variant="outline">{organizer.report_count} reports</Badge>
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
        <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Event Selection (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event (optional)" />
              </SelectTrigger>
              <SelectContent>
                {filteredEvents.map((event) => (
                  <SelectItem key={event.event_id} value={event.event_id.toString()}>
                    {event.name} - {event.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Report Settings */}
      <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
                onClick={() => fetchExchangeRates('USD')}
                disabled={isLoadingRates}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoadingRates && "animate-spin")} />
                Refresh Rates
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Currency</Label>
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency} disabled={isLoadingCurrencies}>
                  <SelectTrigger>
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
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem
                        key={currency.id}
                        value={currency.code}
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
                  <Label>Exchange Rate (USD → {selectedCurrency})</Label>
                  <div className="p-3 rounded-lg border bg-gray-100 dark:bg-gray-700">
                    <div className="text-lg font-semibold">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Include Charts</Label>
                  <p className="text-sm text-gray-500">Add visual charts to the report</p>
                </div>
                <Switch checked={includeCharts} onCheckedChange={setIncludeCharts} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Use Latest Rates</Label>
                  <p className="text-sm text-gray-500">Use real-time exchange rates</p>
                </div>
                <Switch checked={useLatestRates} onCheckedChange={setUseLatestRates} />
              </div>
            </div>
          </div>
          <Separator />
          {/* Email Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Email Settings (Optional)</Label>
              <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
            </div>
            {sendEmail && (
              <div className="space-y-2">
                <Label>Recipient Email</Label>
                <Input
                  type="email"
                  placeholder="Enter recipient email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
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
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    JSON (View in Dashboard)
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV (Download)
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
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
          className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
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
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadReport('pdf')}
              disabled={!selectedOrganizer || isDownloading}
            >
              <File className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderResultsTab = () => {
    const events = extractEvents(reportData);
    const currencySymbol = extractCurrency(reportData);
    const validEvents = Array.isArray(events) ? events.filter(event => event && typeof event === 'object') : [];

    if (debugMode) {
      console.log('Rendering results with:', {
        reportData,
        events,
        validEvents,
        currencySymbol
      });
    }

    // Calculate totals
    const totalRevenue = validEvents.reduce((sum, event) => sum + (event.revenue || 0), 0);
    const totalAttendees = validEvents.reduce((sum, event) => sum + (event.attendees || 0), 0);
    const totalTickets = validEvents.reduce((sum, event) => sum + (event.tickets_sold || 0), 0);
    const avgRevenuePerEvent = validEvents.length > 0 ? totalRevenue / validEvents.length : 0;

    return (
      <div className="space-y-6">
        {renderDebugInfo()}

        {reportData && validEvents.length > 0 ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="shadow-md">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {validEvents.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Events</div>
                </CardContent>
              </Card>
              <Card className="shadow-md">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {currencySymbol}{totalRevenue.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                </CardContent>
              </Card>
              <Card className="shadow-md">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {totalAttendees.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Attendees</div>
                </CardContent>
              </Card>
              <Card className="shadow-md">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {currencySymbol}{avgRevenuePerEvent.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Avg Revenue</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Bar Chart */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Revenue by Event
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={validEvents}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="event_name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Attendees Line Chart */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Attendees by Event
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={validEvents}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="event_name" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="attendees" stroke="#8884d8" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats Grid */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Quick Event Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {validEvents.slice(0, 6).map((event, index) => (
                    <div key={event.event_id || `event-${index}`} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                      <div className="font-medium text-gray-900 mb-2 truncate">
                        {event.event_name}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Revenue:</span>
                          <div className="font-semibold text-green-600">
                            {currencySymbol}{(event.revenue || 0).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Attendees:</span>
                          <div className="font-semibold text-blue-600">
                            {(event.attendees || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {validEvents.length > 6 && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('config')}
                    >
                      View All {validEvents.length} Events
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Top Performing Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {validEvents
                      .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
                      .slice(0, 5)
                      .map((event, index) => (
                        <div key={event.event_id || `top-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <span className="font-medium text-gray-900 truncate">
                              {event.event_name}
                            </span>
                          </div>
                          <div className="text-green-600 font-semibold">
                            {currencySymbol}{(event.revenue || 0).toLocaleString()}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Most Attended Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {validEvents
                      .sort((a, b) => (b.attendees || 0) - (a.attendees || 0))
                      .slice(0, 5)
                      .map((event, index) => (
                        <div key={event.event_id || `attended-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <span className="font-medium text-gray-900 truncate">
                              {event.event_name}
                            </span>
                          </div>
                          <div className="text-blue-600 font-semibold">
                            {(event.attendees || 0).toLocaleString()}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card className="shadow-lg">
            <CardContent className="flex flex-col items-center justify-center h-64">
              <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center text-lg">
                No report data available
              </p>
              <p className="text-gray-400 text-center text-sm mt-2">
                Generate a report from the Configuration tab to see analytics
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  if (isLoadingCurrencies || isLoadingOrganizers) {
    return (
      <Card className="max-w-3xl mx-auto my-8">
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-green-500" />
          <p className="mt-4 text-lg text-gray-600">Loading initial data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 gap-4 w-full">
            <TabsTrigger
              value="config"
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-green-500 hover:scale-105 transition-all flex items-center justify-center rounded-md text-white font-semibold"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configuration
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-green-500 hover:scale-105 transition-all flex items-center justify-center rounded-md text-white font-semibold"
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
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
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
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", isLoadingOrganizers ? "animate-spin" : '')} />
                  Refresh Data
                </Button>
                {reportData && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('results')}
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
