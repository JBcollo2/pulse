import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  File, // Use File as a replacement for FilePdf
  Send,
  Eye,
  Filter,
  Search,
  Settings
} from "lucide-react";

// --- Interfaces ---
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

const AdminReports: React.FC = () => {
  // --- State Variables ---
  const [reportData, setReportData] = useState<AdminReport | null>(null);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  
  // Report Configuration
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
  
  // Search and Filter
  const [organizerSearch, setOrganizerSearch] = useState<string>('');
  const [eventSearch, setEventSearch] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('config');

  // --- Helper Functions ---
  const handleError = useCallback((message: string, err?: any) => {
    console.error('Operation error:', message, err);
    setError(message);
  }, []);

  const showSuccess = useCallback((message: string) => {
    console.log('Success:', message);
    setError(null);
  }, []);

  // --- API Functions ---
  const fetchOrganizers = useCallback(async () => {
    setIsLoadingOrganizers(true);
    try {
      const response = await fetch('/admin/organizers', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch organizers');
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
      const response = await fetch(`/admin/organizers/${organizerId}/events`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch events');
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
      const response = await fetch('/api/currency/list', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch currencies');
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
      const response = await fetch(`/api/currency/latest?base=${baseCurrency}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
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

      const response = await fetch(`/admin/reports?${params.toString()}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      if (reportFormat === 'json') {
        const data = await response.json();
        setReportData(data);
        setActiveTab('results');
        showSuccess('Report generated successfully');
      } else {
        // Handle file download
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
    showSuccess
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

      const response = await fetch(`/admin/reports?${params.toString()}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to download ${format} report`);
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

  // --- Effects ---
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

  // --- Filter Functions ---
  const filteredOrganizers = organizers.filter(org => 
    org.name.toLowerCase().includes(organizerSearch.toLowerCase()) ||
    org.email.toLowerCase().includes(organizerSearch.toLowerCase())
  );

  const filteredEvents = events.filter(event => 
    event.name.toLowerCase().includes(eventSearch.toLowerCase()) ||
    event.location.toLowerCase().includes(eventSearch.toLowerCase())
  );

  // --- Render Functions ---
  const renderConfigurationTab = () => (
    <div className="space-y-6">
      {/* Organizer Selection */}
      <Card>
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
                  <SelectItem key={organizer.organizer_id} value={organizer.organizer_id.toString()}>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Event Selection (Optional)
            </CardTitle>
            <CardDescription>
              Leave empty to generate report for all events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Search Events</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or location..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Select Event</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger>
                <SelectValue placeholder="All events (or select specific event)">
                {selectedEvent && (
                  <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {events.find(e => e.event_id.toString() === selectedEvent)?.name}
                  </div>
                )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Events</SelectItem>
                {filteredEvents.map((event) => (
                <SelectItem key={event.event_id} value={event.event_id.toString()}>
                  <div className="flex items-center justify-between w-full">
                  <div>
                    <div className="font-medium">{event.name}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {event.location}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                    {new Date(event.event_date).toLocaleDateString()}
                    </Badge>
                    <Badge variant="outline">{event.report_count} reports</Badge>
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

      {/* Report Settings */}
      <Card>
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
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingRates ? 'animate-spin' : ''}`} />
                Refresh Rates
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Currency</Label>
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                  <SelectTrigger>
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
              {exchangeRates && selectedCurrency && selectedCurrency !== 'USD' && (
                <div className="space-y-2">
                  <Label>Exchange Rate (USD → {selectedCurrency})</Label>
                  <div className="p-3 rounded-lg border bg-gray-50">
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
                <Switch
                  checked={includeCharts}
                  onCheckedChange={setIncludeCharts}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Use Latest Rates</Label>
                  <p className="text-sm text-gray-500">Use real-time exchange rates</p>
                </div>
                <Switch
                  checked={useLatestRates}
                  onCheckedChange={setUseLatestRates}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Email Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Email Settings</Label>
              <Switch
                checked={sendEmail}
                onCheckedChange={setSendEmail}
              />
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

  const renderResultsTab = () => (
    <div className="space-y-6">
      {reportData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                    <p className="text-2xl font-bold text-blue-600">{reportData.total_tickets_sold}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      {reportData.currency_symbol}{reportData.total_revenue.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Attendees</p>
                    <p className="text-2xl font-bold text-purple-600">{reportData.total_attendees}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Events</p>
                    <p className="text-2xl font-bold text-orange-600">{reportData.event_count}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Events Table */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 p-2 text-left">Event Name</th>
                      <th className="border border-gray-200 p-2 text-left">Date</th>
                      <th className="border border-gray-200 p-2 text-left">Location</th>
                      <th className="border border-gray-200 p-2 text-right">Tickets</th>
                      <th className="border border-gray-200 p-2 text-right">Revenue</th>
                      <th className="border border-gray-200 p-2 text-right">Attendees</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.events.map((event) => (
                      <tr key={event.event_id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 p-2">{event.event_name}</td>
                        <td className="border border-gray-200 p-2">
                          {new Date(event.event_date).toLocaleDateString()}
                        </td>
                        <td className="border border-gray-200 p-2">{event.location}</td>
                        <td className="border border-gray-200 p-2 text-right">{event.tickets_sold}</td>
                        <td className="border border-gray-200 p-2 text-right">
                          {reportData.currency_symbol}{event.revenue.toLocaleString()}
                        </td>
                        <td className="border border-gray-200 p-2 text-right">{event.attendees}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center">
              No report data available. Generate a report from the Configuration tab.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (isLoadingCurrencies || isLoadingOrganizers) {
    return (
      <Card className="max-w-3xl mx-auto my-8">
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="mt-4 text-lg text-gray-600">Loading initial data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
              Comprehensive Admin Reports
            </h1>
            <p className="text-gray-600">
              Advanced reporting system with full API feature utilization
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Enhanced Dashboard
            </Badge>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="mt-6">
            {renderConfigurationTab()}
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            {renderResultsTab()}
          </TabsContent>
        </Tabs>

        {/* Quick Actions Footer */}
        <Card>
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
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingOrganizers ? 'animate-spin' : ''}`} />
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