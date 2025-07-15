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
  Activity
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
  ResponsiveContainer
} from 'recharts';

// Interfaces and types
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

// Main Component
const AdminReports: React.FC = () => {
  // Helper functions to extract data
  const extractEvents = (data: AdminReport | null) => {
    return (
      data?.events ||
      data?.data?.events ||
      data?.fresh_report_data?.events ||
      []
    );
  };

  const extractCurrency = (data: AdminReport | null) => {
    return (
      data?.currency_symbol ||
      data?.data?.currency_symbol ||
      data?.fresh_report_data?.currency_symbol ||
      '$'
    );
  };

  // Hooks and setup
  const { toast } = useToast();

  // State variables
  const [reportData, setReportData] = useState<AdminReport | null>(null);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [selectedOrganizer, setSelectedOrganizer] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [targetCurrencyId, setTargetCurrencyId] = useState<number | null>(null);
  const [reportFormat, setReportFormat] = useState<string>('json');
  const [includeCharts, setIncludeCharts] = useState<boolean>(true);
  const [useLatestRates, setUseLatestRates] = useState<boolean>(true);
  const [sendEmail, setSendEmail] = useState<boolean>(false);
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [isLoadingOrganizers, setIsLoadingOrganizers] = useState<boolean>(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState<boolean>(false);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [organizerSearch, setOrganizerSearch] = useState<string>('');
  const [eventSearch, setEventSearch] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('config');

  // Error handling
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

  // API functions
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

  // Effects
  useEffect(() => {
    fetchOrganizers();
    fetchCurrencies();
  }, [fetchOrganizers, fetchCurrencies]);

  useEffect(() => {
    if (selectedOrganizer) {
      fetchEvents(selectedOrganizer);
      setSelectedEvent('');
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

  // Filter functions
  const filteredOrganizers = organizers.filter(org =>
    org.name.toLowerCase().includes(organizerSearch.toLowerCase()) ||
    org.email.toLowerCase().includes(organizerSearch.toLowerCase())
  );

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(eventSearch.toLowerCase()) ||
    event.location.toLowerCase().includes(eventSearch.toLowerCase())
  );

  // Render functions
  const renderConfigurationTab = () => (
    <div className="space-y-6">
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
                  "transition-colors duration-200"
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

      {selectedOrganizer && (
        <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
              <Calendar className="h-5 w-5" />
              Event Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label className="dark:text-gray-200 text-gray-800">Select Event</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger className={cn(
                  "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800",
                  "focus:ring-2 focus:ring-green-500 focus:border-green-500",
                  "focus:outline-none focus:ring-offset-0",
                  "transition-colors duration-200"
                )}>
                  <SelectValue placeholder="Choose an event" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
                  {filteredEvents.map((event) => (
                    <SelectItem
                      key={event.event_id}
                      value={event.event_id.toString()}
                      className={cn(
                        "hover:bg-green-50 hover:dark:bg-green-900/20 data-[highlighted]:bg-green-50 data-[highlighted]:dark:bg-green-900/20",
                        "focus:bg-green-50 focus:dark:bg-green-900/20",
                        selectedEvent === event.event_id.toString() && "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="font-medium">{event.name}</div>
                          <div className="text-sm text-gray-500">{event.location}</div>
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

      <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
            <Settings className="h-5 w-5" />
            Report Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="dark:text-gray-200 text-gray-800">Currency</Label>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className={cn(
                "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800",
                "focus:ring-2 focus:ring-green-500 focus:border-green-500",
                "focus:outline-none focus:ring-offset-0",
                "transition-colors duration-200"
              )}>
                <SelectValue placeholder="Choose a currency" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
                {currencies.map((currency) => (
                  <SelectItem
                    key={currency.id}
                    value={currency.code}
                    className={cn(
                      "hover:bg-green-50 hover:dark:bg-green-900/20 data-[highlighted]:bg-green-50 data-[highlighted]:dark:bg-green-900/20",
                      "focus:bg-green-50 focus:dark:bg-green-900/20",
                      selectedCurrency === currency.code && "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium">{currency.name}</div>
                        <div className="text-sm text-gray-500">{currency.code}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="include-charts" checked={includeCharts} onCheckedChange={setIncludeCharts} />
            <Label htmlFor="include-charts" className="dark:text-gray-200 text-gray-800">Include Charts</Label>
          </div>
        </CardContent>
      </Card>

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
      </div>
    </div>
  );

  const renderResultsTab = () => {
    const events = extractEvents(reportData);
    const currencySymbol = extractCurrency(reportData);
    const validEvents = Array.isArray(events) ? events.filter(event => event && typeof event === 'object') : [];
    const totalRevenue = validEvents.reduce((sum, event) => sum + (event.revenue || 0), 0);
    const totalAttendees = validEvents.reduce((sum, event) => sum + (event.attendees || 0), 0);
    const avgRevenuePerEvent = validEvents.length > 0 ? totalRevenue / validEvents.length : 0;
    const avgAttendeesPerEvent = validEvents.length > 0 ? totalAttendees / validEvents.length : 0;

    return (
      <div className="space-y-6">
        {reportData && validEvents.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="shadow-md dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {validEvents.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Events</div>
                </CardContent>
              </Card>
              <Card className="shadow-md dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {currencySymbol}{totalRevenue.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</div>
                </CardContent>
              </Card>
              <Card className="shadow-md dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {totalAttendees.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Attendees</div>
                </CardContent>
              </Card>
              <Card className="shadow-md dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {currencySymbol}{avgRevenuePerEvent.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Revenue</div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="dark:text-gray-200 text-gray-800 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Event Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={validEvents} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="event_name"
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        stroke="#6B7280"
                      />
                      <YAxis
                        yAxisId="revenue"
                        orientation="left"
                        tick={{ fontSize: 11 }}
                        stroke="#10b981"
                        tickFormatter={(value) => `${currencySymbol}${(value / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        yAxisId="attendees"
                        orientation="right"
                        tick={{ fontSize: 11 }}
                        stroke="#3B82F6"
                      />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === 'revenue') return [`${currencySymbol}${value.toLocaleString()}`, 'Revenue'];
                          if (name === 'attendees') return [value.toLocaleString(), 'Attendees'];
                          return [value, name];
                        }}
                        contentStyle={{
                          backgroundColor: '#F9FAFB',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar yAxisId="revenue" dataKey="revenue" fill="#10b981" radius={[2, 2, 0, 0]} />
                      <Line yAxisId="attendees" type="monotone" dataKey="attendees" stroke="#3B82F6" strokeWidth={2} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="dark:text-gray-200 text-gray-800 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Quick Event Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {validEvents.slice(0, 6).map((event, index) => (
                    <div key={event.event_id || `event-${index}`} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-blue-500">
                      <div className="font-medium text-gray-900 dark:text-gray-100 mb-2 truncate">
                        {event.event_name}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Revenue:</span>
                          <div className="font-semibold text-green-600 dark:text-green-400">
                            {currencySymbol}{(event.revenue || 0).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Attendees:</span>
                          <div className="font-semibold text-blue-600 dark:text-blue-400">
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
                      className="dark:bg-gray-700 dark:text-gray-200 bg-gray-200 text-gray-800"
                    >
                      View All {validEvents.length} Events
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="dark:text-gray-200 text-gray-800 text-lg">
                    Top Performing Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {validEvents
                      .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
                      .slice(0, 5)
                      .map((event, index) => (
                        <div key={event.event_id || `top-${index}`} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {event.event_name}
                            </span>
                          </div>
                          <div className="text-green-600 dark:text-green-400 font-semibold">
                            {currencySymbol}{(event.revenue || 0).toLocaleString()}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="dark:text-gray-200 text-gray-800 text-lg">
                    Most Attended Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {validEvents
                      .sort((a, b) => (b.attendees || 0) - (a.attendees || 0))
                      .slice(0, 5)
                      .map((event, index) => (
                        <div key={event.event_id || `attended-${index}`} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {event.event_name}
                            </span>
                          </div>
                          <div className="text-blue-600 dark:text-blue-400 font-semibold">
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
          <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
            <CardContent className="flex flex-col items-center justify-center h-64">
              <BarChart3 className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-center text-lg">
                No report data available
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-center text-sm mt-2">
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
        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 gap-4 w-full">
            <TabsTrigger
              value="config"
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-[#10b981] hover:scale-105 transition-all flex items-center justify-center rounded-md text-white font-semibold"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configuration
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-[#10b981] hover:scale-105 transition-all flex items-center justify-center rounded-md text-white font-semibold"
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
