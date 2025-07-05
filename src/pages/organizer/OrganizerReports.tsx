import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Loader2, AlertCircle, FileText, Download, RefreshCw,
  DollarSign, TrendingUp, Calendar, Globe, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface OrganizerReport {
  id: number;
  title: string;
  total_revenue: number | null | undefined;
  total_tickets: number;
  total_events: number;
  total_attendees: number;
  report_date: string;
  currency: string;
  data_breakdown: {
    events: Array<{
      name: string;
      revenue: number;
      tickets: number;
      attendees: number;
    }>;
    ticket_types: { [key: string]: number };
    monthly_revenue: Array<{
      month: string;
      revenue: number;
    }>;
  };
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

interface ConvertedReport {
  id: number;
  original_currency: string;
  target_currency: string;
  original_amount: number | null | undefined;
  converted_amount: number | null | undefined;
  conversion_rate: number;
  converted_at: string;
}

interface OrganizerReportProps {
  darkMode: boolean;
}

const OrganizerReport: React.FC<OrganizerReportProps> = ({ darkMode }) => {
  const [reports, setReports] = useState<OrganizerReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<OrganizerReport | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [convertedReports, setConvertedReports] = useState<ConvertedReport[]>([]);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [loading, setLoading] = useState({
    reports: false,
    generating: false,
    converting: false,
    exporting: false,
    currencies: false
  });
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCurrencies = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, currencies: true }));
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/currency/list`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCurrencies(data.data || []);

      if (!selectedCurrency && data.data && data.data.length > 0) {
        setSelectedCurrency(data.data[0].code);
      }
    } catch (err) {
      console.error('Failed to fetch currencies:', err);
      toast({
        title: "Error fetching currencies",
        description: "Could not load available currencies. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, currencies: false }));
    }
  }, [selectedCurrency, toast]);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, reports: true }));
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/reports`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setReports(data.reports || []);

      if (data.reports.length === 0) {
        toast({
          title: "No reports found",
          description: "No reports available. Generate your first report!",
          variant: "default",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching reports';
      setError(errorMessage);
      console.error('Fetch reports error:', err);
      toast({
        title: "Error fetching reports",
        description: "Failed to load reports. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, reports: false }));
    }
  }, [toast]);

  const fetchConvertedReports = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/currency/reports/converted`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setConvertedReports(data.data.reports || []);
    } catch (err) {
      console.error('Failed to fetch converted reports:', err);
      toast({
        title: "Error fetching converted reports",
        description: "Could not load currency conversion history.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const generateReport = useCallback(async () => {
    if (!dateRange.start || !dateRange.end) {
      setError('Please select both start and end dates');
      toast({
        title: "Missing Dates",
        description: "Please select both a start and an end date to generate a report.",
        variant: "destructive",
      });
      return;
    }
    try {
      setLoading(prev => ({ ...prev, generating: true }));
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          start_date: dateRange.start,
          end_date: dateRange.end,
          event_id: selectedReport?.id ?? reports[0]?.id ?? null,
          ticket_type_id: null,
          target_currency_id: currencies.find(c => c.code === selectedCurrency)?.code ?? 'USD',
          send_email: true,
          recipient_email: 'your@email.com',
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      await fetchReports();
      setSelectedReport(data.report);

      toast({
        title: "Report Generated!",
        description: `Report "${data.report.title}" has been successfully generated.`,
        variant: "default",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while generating the report';
      setError(errorMessage);
      console.error('Generate report error:', err);
      toast({
        title: "Report Generation Failed",
        description: "Could not generate the report. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, generating: false }));
    }
  }, [dateRange, fetchReports, reports, selectedReport, currencies, selectedCurrency, toast]);

  const convertRevenue = useCallback(async (reportId: number) => {
    if (!selectedCurrency) {
      toast({
        title: "No Currency Selected",
        description: "Please select a target currency for conversion.",
        variant: "destructive",
      });
      return;
    }
    try {
      setLoading(prev => ({ ...prev, converting: true }));
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/currency/revenue/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          report_id: reportId,
          target_currency: selectedCurrency
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport(prev => prev ? {
          ...prev,
          total_revenue: data.data.converted_amount,
          currency: selectedCurrency,
        } : null);
      }

      await fetchConvertedReports();

      toast({
        title: "Conversion Successful!",
        description: `Revenue converted to ${selectedCurrency}.`,
        variant: "default",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while converting currency';
      setError(errorMessage);
      console.error('Convert currency error:', err);
      toast({
        title: "Conversion Failed",
        description: "Could not convert currency. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, converting: false }));
    }
  }, [selectedCurrency, selectedReport, fetchConvertedReports, toast]);

  const exportReport = useCallback(async (reportId: number, format: 'pdf' | 'csv') => {
    try {
      setLoading(prev => ({ ...prev, exporting: true }));
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/${reportId}/export?format=${format}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${reportId}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful!",
        description: `Report exported as ${format.toUpperCase()}.`,
        variant: "default",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while exporting the report';
      setError(errorMessage);
      console.error('Export report error:', err);
      toast({
        title: "Export Failed",
        description: "Could not export the report. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, exporting: false }));
    }
  }, [toast]);

  useEffect(() => {
    fetchCurrencies();
    fetchReports();
    fetchConvertedReports();
  }, [fetchCurrencies, fetchReports, fetchConvertedReports]);

  const formatNumber = (value: number | undefined | null) =>
    value != null ? value.toLocaleString?.() : '0';

  const eventsChartData = selectedReport?.data_breakdown?.events?.map(event => ({
    name: event.name,
    revenue: event.revenue,
    tickets: event.tickets,
    attendees: event.attendees
  })) || [];

  const ticketTypesChartData = selectedReport?.data_breakdown?.ticket_types ?
    Object.entries(selectedReport.data_breakdown.ticket_types).map(([type, count]) => ({
      name: type,
      value: count
    })) : [];

  const monthlyRevenueData = selectedReport?.data_breakdown?.monthly_revenue || [];
  const COLORS = ['#8B5CF6', '#06D6A0', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];

  return (
    <div className={cn("min-h-screen p-4 md:p-6", darkMode ? "bg-gray-900 text-gray-200" : "bg-gray-50 text-gray-800")}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Organizer Reports Dashboard
          </h1>
          <p className={cn("mt-2", darkMode ? "text-gray-400" : "text-gray-600")}>
            Generate, manage, and analyze your event reports
          </p>
        </div>
        <Card className={cn(darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", darkMode ? "text-gray-200" : "text-gray-800")}>
              <BarChart3 className="h-5 w-5" />
              Generate New Report
            </CardTitle>
            <CardDescription className={darkMode ? "text-gray-400" : "text-gray-600"}>
              Create a comprehensive report for your events within a specific date range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="startDate" className={darkMode ? "text-gray-200" : "text-gray-800"}>Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className={cn("mt-1", darkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-gray-200 border-gray-300 text-gray-800")}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="endDate" className={darkMode ? "text-gray-200" : "text-gray-800"}>End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className={cn("mt-1", darkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-gray-200 border-gray-300 text-gray-800")}
                />
              </div>
              <Button
                onClick={generateReport}
                disabled={loading.generating || !dateRange.start || !dateRange.end}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {loading.generating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>
        {error && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}
        <Card className={cn(darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className={cn("flex items-center gap-2", darkMode ? "text-gray-200" : "text-gray-800")}>
                <FileText className="h-5 w-5" />
                Your Reports
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchReports}
                disabled={loading.reports}
                className={darkMode ? "text-gray-200" : "text-gray-800"}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", loading.reports && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading.reports ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : reports.length === 0 ? (
              <p className={cn("text-center h-32 flex items-center justify-center", darkMode ? "text-gray-400" : "text-gray-500")}>
                No reports found. Generate your first report above.
              </p>
            ) : (
              <div className="grid gap-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                      selectedReport?.id === report.id
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                        : "border-gray-200 dark:border-gray-700",
                      darkMode ? "bg-gray-800" : "bg-white"
                    )}
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={cn("font-semibold", darkMode ? "text-gray-200" : "text-gray-800")}>{report.title}</h3>
                        <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-600")}>
                          {report.report_date} • {report.currency}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            {report.currency} {formatNumber(report.total_revenue)}
                          </p>
                          <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>
                            {report.total_events} events • {report.total_tickets} tickets
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        {selectedReport && (
          <Card className={cn(darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={cn("flex items-center gap-2", darkMode ? "text-gray-200" : "text-gray-800")}>
                    <TrendingUp className="h-5 w-5" />
                    {selectedReport.title}
                  </CardTitle>
                  <CardDescription className={darkMode ? "text-gray-400" : "text-gray-600"}>
                    Generated on {selectedReport.report_date}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                    <SelectTrigger className={cn("w-32", darkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-gray-200 border-gray-300 text-gray-800")}>
                      <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent className={darkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-gray-200 border-gray-300 text-gray-800"}>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => convertRevenue(selectedReport.id)}
                    disabled={loading.converting || !selectedCurrency || selectedCurrency === selectedReport.currency}
                    className={darkMode ? "text-gray-200" : "text-gray-800"}
                  >
                    {loading.converting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Globe className="h-4 w-4 mr-2" />
                    )}
                    Convert
                  </Button>
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading.exporting}
                      onClick={() => { /* This button now acts as a trigger for a dropdown */ }}
                      className={darkMode ? "text-gray-200" : "text-gray-800"}
                    >
                      {loading.exporting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Export
                    </Button>
                    <div className={cn("absolute right-0 mt-2 w-32 border rounded-md shadow-lg z-10", darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start px-3 py-2 text-sm"
                        onClick={() => exportReport(selectedReport.id, 'pdf')}
                        style={{ color: darkMode ? "white" : "black" }}
                      >
                        Export as PDF
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start px-3 py-2 text-sm"
                        onClick={() => exportReport(selectedReport.id, 'csv')}
                        style={{ color: darkMode ? "white" : "black" }}
                      >
                        Export as CSV/XLS
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className={cn(darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-200 border-gray-300")}>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedReport.currency} {formatNumber(selectedReport.total_revenue)}
                    </div>
                    <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>Total Revenue</p>
                  </CardContent>
                </Card>
                <Card className={cn(darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-200 border-gray-300")}>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedReport.total_events}
                    </div>
                    <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>Total Events</p>
                  </CardContent>
                </Card>
                <Card className={cn(darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-200 border-gray-300")}>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedReport.total_tickets}
                    </div>
                    <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>Total Tickets</p>
                  </CardContent>
                </Card>
                <Card className={cn(darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-200 border-gray-300")}>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-orange-600">
                      {selectedReport.total_attendees}
                    </div>
                    <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>Total Attendees</p>
                  </CardContent>
                </Card>
              </div>
              <Tabs defaultValue="events" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="events">Events Revenue</TabsTrigger>
                  <TabsTrigger value="tickets">Ticket Types</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly Trends</TabsTrigger>
                </TabsList>
                <TabsContent value="events">
                  <Card className={cn(darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
                    <CardHeader>
                      <CardTitle className={darkMode ? "text-gray-200" : "text-gray-800"}>Revenue by Event</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={eventsChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="revenue" fill="#8B5CF6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="tickets">
                  <Card className={cn(darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
                    <CardHeader>
                      <CardTitle className={darkMode ? "text-gray-200" : "text-gray-800"}>Ticket Types Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={ticketTypesChartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {ticketTypesChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="monthly">
                  <Card className={cn(darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
                    <CardHeader>
                      <CardTitle className={darkMode ? "text-gray-200" : "text-gray-800"}>Monthly Revenue Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyRevenueData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="revenue" fill="#06D6A0" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
        {convertedReports.length > 0 && (
          <Card className={cn(darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
            <CardHeader>
              <CardTitle className={cn("flex items-center gap-2", darkMode ? "text-gray-200" : "text-gray-800")}>
                <Globe className="h-5 w-5" />
                Currency Conversion History
              </CardTitle>
              <CardDescription className={darkMode ? "text-gray-400" : "text-gray-600"}>
                A record of your report currency conversions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {convertedReports.map((conversion) => (
                  <div key={conversion.id} className={cn("flex items-center justify-between p-3 rounded-lg", darkMode ? "bg-gray-700" : "bg-gray-50")}>
                    <div>
                      <p className="font-medium">
                        <span className={darkMode ? "text-gray-200" : "text-gray-700"}>{conversion.original_currency} {formatNumber(conversion.original_amount)}</span> → <span className="text-green-600 font-bold">{conversion.target_currency} {formatNumber(conversion.converted_amount)}</span>
                      </p>
                      <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>
                        Rate: {conversion.conversion_rate.toFixed(4)} • {new Date(conversion.converted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrganizerReport;
