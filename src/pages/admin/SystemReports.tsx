import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Loader2, AlertCircle, FileText, Download, Mail, PieChart as PieChartIcon, TrendingUp, Users, DollarSign, Calendar, MapPin, Filter, BarChart3, Eye, EyeOff, RefreshCw, Globe, User, Building, Search, ChevronDown, ExternalLink } from "lucide-react";

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
}

interface ExchangeRates {
  base_currency: string;
  rates: { [key: string]: number };
  source: string;
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
  const [reportData, setReportData] = useState<AdminReport | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [selectedOrganizer, setSelectedOrganizer] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reportFormat, setReportFormat] = useState<string>('json');
  const [includeCharts, setIncludeCharts] = useState<boolean>(true);
  const [sendEmail, setSendEmail] = useState<boolean>(false);
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Mock toast function since we don't have useToast
  const toast = (options: any) => {
    console.log(options.title, options.description);
  };

  const convertCurrency = useCallback((amount: number, fromCurrency: string, toCurrency: string) => {
    if (!exchangeRates || fromCurrency === toCurrency) return amount;
    
    if (fromCurrency === 'USD' && exchangeRates.rates[toCurrency]) {
      return amount * exchangeRates.rates[toCurrency];
    } else if (toCurrency === 'USD' && exchangeRates.rates[fromCurrency]) {
      return amount / exchangeRates.rates[fromCurrency];
    }
    return amount;
  }, [exchangeRates]);

  const fetchCurrencies = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/currency/list`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to fetch currencies.");
      const data = await response.json();
      setCurrencies(data.data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  }, []);

  const fetchExchangeRates = useCallback(async (baseCurrency: string = 'USD') => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/currency/latest?base=${baseCurrency}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to fetch exchange rates.");
      const data = await response.json();
      setExchangeRates(data.data);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  }, []);

  const fetchOrganizers = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/organizers`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to fetch organizers.");
      const data = await response.json();
      setOrganizers(data.organizers || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  }, []);

  const fetchEvents = useCallback(async (organizerId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/organizers/${organizerId}/events`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to fetch events.");
      const data = await response.json();
      setEvents(data.events || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  }, []);

  const fetchAdminReports = useCallback(async () => {
    if (!selectedOrganizer) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        organizer_id: selectedOrganizer.toString(),
        format: reportFormat,
        include_charts: includeCharts.toString(),
        send_email: sendEmail.toString(),
        use_latest_rates: 'true'
      });

      if (selectedEvent) params.append('event_id', selectedEvent.toString());
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (sendEmail && recipientEmail) params.append('recipient_email', recipientEmail);

      const currency = currencies.find(c => c.code === selectedCurrency);
      if (currency) params.append('currency_id', currency.id.toString());

      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error("Failed to fetch reports.");
      
      if (reportFormat === 'csv' || reportFormat === 'pdf') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admin_report_${selectedOrganizer}_${new Date().toISOString().split('T')[0]}.${reportFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: `Report downloaded as ${reportFormat.toUpperCase()}`,
        });
      } else {
        const data = await response.json();
        setReportData(data);
        
        if (sendEmail) {
          toast({
            title: "Success",
            description: "Report generated and email sent successfully",
          });
        }
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedOrganizer, selectedEvent, startDate, endDate, reportFormat, includeCharts, sendEmail, recipientEmail, selectedCurrency, currencies]);

  useEffect(() => {
    fetchCurrencies();
    fetchOrganizers();
  }, [fetchCurrencies, fetchOrganizers]);

  useEffect(() => {
    if (selectedCurrency && selectedCurrency !== 'USD') {
      fetchExchangeRates('USD');
    }
  }, [selectedCurrency, fetchExchangeRates]);

  useEffect(() => {
    if (selectedOrganizer) {
      fetchEvents(selectedOrganizer);
      setSelectedEvent(null);
    }
  }, [selectedOrganizer, fetchEvents]);

  const filteredOrganizers = organizers.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOrganizerData = organizers.find(org => org.organizer_id === selectedOrganizer);

  const chartData = reportData?.events.map(event => ({
    name: event.event_name.length > 15 ? `${event.event_name.substring(0, 15)}...` : event.event_name,
    tickets: event.tickets_sold,
    revenue: convertCurrency(event.revenue, reportData.currency, selectedCurrency),
    attendees: event.attendees,
    reports: event.report_count
  })) || [];

  const pieData = [
    { name: 'Tickets Sold', value: reportData?.total_tickets_sold || 0, color: '#10b981' },
    { name: 'Total Attendees', value: reportData?.total_attendees || 0, color: '#3b82f6' },
    { name: 'Event Count', value: reportData?.event_count || 0, color: '#8b5cf6' },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  if (isLoading && !organizers.length) {
    return (
      <Card className="max-w-4xl mx-auto my-8">
        <CardHeader>
          <CardTitle>Admin Reports Dashboard</CardTitle>
          <CardDescription>Loading initial data...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-[#10b981]" />
          <p className="mt-4 text-lg">Fetching organizers and setup...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            Admin Analytics Dashboard
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive reporting and analytics for organizers and events
          </p>
        </div>

        {/* Configuration Panel */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Report Configuration
            </CardTitle>
            <CardDescription className="text-blue-100">
              Configure your report parameters and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <Tabs defaultValue="filters" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="filters">Filters</TabsTrigger>
                <TabsTrigger value="currency">Currency</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>
              
              <TabsContent value="filters" className="space-y-6">
                {/* Organizer Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Select Organizer</Label>
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search organizers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={selectedOrganizer?.toString() || ''} onValueChange={(value) => setSelectedOrganizer(parseInt(value))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose an organizer">
                          {selectedOrganizerData && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">{selectedOrganizerData.name}</span>
                              <Badge variant="secondary">{selectedOrganizerData.event_count} events</Badge>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {filteredOrganizers.map((organizer) => (
                          <SelectItem key={organizer.organizer_id} value={organizer.organizer_id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">{organizer.name}</div>
                                  <div className="text-xs text-gray-500">{organizer.email}</div>
                                </div>
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
                </div>

                {/* Event Selection */}
                {selectedOrganizer && (
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Select Event (Optional)</Label>
                    <Select value={selectedEvent?.toString() || ''} onValueChange={(value) => setSelectedEvent(value ? parseInt(value) : null)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All events (leave empty for summary)">
                          {selectedEvent && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {events.find(e => e.event_id === selectedEvent)?.name}
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Events (Summary Report)</SelectItem>
                        {events.map((event) => (
                          <SelectItem key={event.event_id} value={event.event_id.toString()}>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{event.name}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.location} • {new Date(event.event_date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Date Range */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Date Range (Optional)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        max={endDate || undefined}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || undefined}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="currency" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Currency Settings</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchExchangeRates('USD')}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh Rates
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currency">Display Currency</Label>
                      <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                        <SelectTrigger>
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              {currencies.find(c => c.code === selectedCurrency)?.symbol} {selectedCurrency}
                            </div>
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
                    
                    {exchangeRates && selectedCurrency !== 'USD' && (
                      <div className="space-y-2">
                        <Label>Exchange Rate (USD → {selectedCurrency})</Label>
                        <div className="p-3 rounded-lg border bg-gradient-to-r from-blue-50 to-emerald-50">
                          <div className="text-lg font-semibold text-emerald-700">
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
              </TabsContent>

              <TabsContent value="export" className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Export Options</Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="format">Export Format</Label>
                      <Select value={reportFormat} onValueChange={setReportFormat}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON (View Online)</SelectItem>
                          <SelectItem value="csv">CSV Download</SelectItem>
                          <SelectItem value="pdf">PDF Download</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Options</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="includeCharts"
                          checked={includeCharts}
                          onChange={(e) => setIncludeCharts(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="includeCharts">Include Charts</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="sendEmail"
                        checked={sendEmail}
                        onChange={(e) => setSendEmail(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="sendEmail">Send report via email</Label>
                    </div>
                    
                    {sendEmail && (
                      <div className="space-y-2">
                        <Label htmlFor="email">Recipient Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          placeholder="Enter email address"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Button
              onClick={fetchAdminReports}
              className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              disabled={isLoading || !selectedOrganizer}
            >
              {isLoading ? (
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
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <p className="font-medium">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Results */}
        {reportData && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium">Total Tickets</p>
                      <p className="text-3xl font-bold">{reportData.total_tickets_sold.toLocaleString()}</p>
                    </div>
                    <Users className="h-8 w-8 text-emerald-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
                      <p className="text-3xl font-bold">
                        {currencies.find(c => c.code === selectedCurrency)?.symbol}
                        {convertCurrency(reportData.total_revenue, reportData.currency, selectedCurrency).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Total Attendees</p>
                      <p className="text-3xl font-bold">{reportData.total_attendees.toLocaleString()}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Events</p>
                      <p className="text-3xl font-bold">{reportData.event_count}</p>
                    </div>
                    <Building className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            {includeCharts && chartData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Revenue by Event
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value, name) => [
                          name === 'revenue' ? `${currencies.find(c => c.code === selectedCurrency)?.symbol}${value.toLocaleString()}` : value,
                          name === 'revenue' ? 'Revenue' : name
                        ]} />
                        <Legend />
                        <Bar dataKey="revenue" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5" />
                      Summary Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Events Table */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Event Details
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of events and their performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-semibold">Event</th>
                        <th className="text-left p-3 font-semibold">Date</th>
                        <th className="text-left p-3 font-semibold">Location</th>
                        <th className="text-right p-3 font-semibold">Tickets</th>
                        <th className="text-right p-3 font-semibold">Revenue</th>
                        <th className="text-right p-3 font-semibold">Attendees</th>
                        <th className="text-right p-3 font-semibold">Reports</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.events.map((event, index) => (
                        <tr key={event.event_id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                          <td className="p-3">
                            <div className="font-medium text-gray-900">{event.event_name}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm text-gray-600">
                              {new Date(event.event_date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <Badge variant="secondary">{event.tickets_sold}</Badge>
                          </td>
                          <td className="p-3 text-right">
                            <div className="font-medium text-emerald-600">
                              {currencies.find(c => c.code === selectedCurrency)?.symbol}
                              {convertCurrency(event.revenue, reportData.currency, selectedCurrency).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <Badge variant="outline">{event.attendees}</Badge>
                          </td>
                          <td className="p-3 text-right">
                            <Badge variant="destructive">{event.report_count}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Additional Actions */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Actions
                </CardTitle>
                <CardDescription>
                  Additional actions for report management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setReportFormat('csv');
                      setTimeout(() => fetchAdminReports(), 100);
                    }}
                    disabled={isLoading}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export as CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setReportFormat('pdf');
                      setTimeout(() => fetchAdminReports(), 100);
                    }}
                    disabled={isLoading}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export as PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSendEmail(true);
                      setRecipientEmail('admin@example.com');
                      setTimeout(() => fetchAdminReports(), 100);
                    }}
                    disabled={isLoading}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Selected Organizer Info */}
        {selectedOrganizerData && (
          <Card className="shadow-lg bg-gradient-to-r from-blue-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Selected Organizer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Name</p>
                  <p className="text-lg font-semibold">{selectedOrganizerData.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-lg font-semibold">{selectedOrganizerData.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Phone</p>
                  <p className="text-lg font-semibold">{selectedOrganizerData.phone || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Total Events</p>
                  <p className="text-lg font-semibold text-emerald-600">{selectedOrganizerData.event_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminReports;