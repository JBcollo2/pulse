import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Loader2, AlertCircle, FileText, Download, RefreshCw, 
  DollarSign, TrendingUp, Calendar, Globe, BarChart3, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OrganizerReport {
  id: number;
  title: string;
  total_revenue: number;
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
  original_amount: number;
  converted_amount: number;
  conversion_rate: number;
  converted_at: string;
}

const OrganizerSimpleReport: React.FC = () => {
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
    deleting: false,
    exporting: false
  });
  
  const [error, setError] = useState<string | null>(null);

  // Fetch available currencies
  const fetchCurrencies = useCallback(async () => {
    try {
      const response = await fetch('/api/currency/list', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrencies(data.currencies || []);
      }
    } catch (err) {
      console.error('Failed to fetch currencies:', err);
    }
  }, []);

  // Fetch organizer reports
  const fetchReports = useCallback(async () => {
    setLoading(prev => ({ ...prev, reports: true }));
    setError(null);
    
    try {
      const response = await fetch('/reports', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch reports');
      }
    } catch (err) {
      setError('An error occurred while fetching reports');
      console.error('Fetch reports error:', err);
    } finally {
      setLoading(prev => ({ ...prev, reports: false }));
    }
  }, []);

  // Fetch converted reports
  const fetchConvertedReports = useCallback(async () => {
    try {
      const response = await fetch('/api/currency/reports/converted', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setConvertedReports(data.converted_reports || []);
      }
    } catch (err) {
      console.error('Failed to fetch converted reports:', err);
    }
  }, []);

  // Generate new report
  const generateReport = useCallback(async () => {
    if (!dateRange.start || !dateRange.end) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(prev => ({ ...prev, generating: true }));
    setError(null);
    
    try {
      const response = await fetch('/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          start_date: dateRange.start,
          end_date: dateRange.end,
          title: `Report ${new Date().toLocaleDateString()}`
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        await fetchReports(); // Refresh reports list
        setSelectedReport(data.report);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to generate report');
      }
    } catch (err) {
      setError('An error occurred while generating the report');
      console.error('Generate report error:', err);
    } finally {
      setLoading(prev => ({ ...prev, generating: false }));
    }
  }, [dateRange, fetchReports]);

  // Convert revenue to selected currency
  const convertRevenue = useCallback(async (reportId: number) => {
    if (!selectedCurrency) return;
    
    setLoading(prev => ({ ...prev, converting: true }));
    setError(null);
    
    try {
      const response = await fetch('/api/currency/revenue/convert', {
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
      
      if (response.ok) {
        const data = await response.json();
        // Update the selected report with converted values
        if (selectedReport && selectedReport.id === reportId) {
          setSelectedReport(prev => prev ? {
            ...prev,
            total_revenue: data.converted_amount,
            currency: selectedCurrency
          } : null);
        }
        await fetchConvertedReports(); // Refresh converted reports
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to convert currency');
      }
    } catch (err) {
      setError('An error occurred while converting currency');
      console.error('Convert currency error:', err);
    } finally {
      setLoading(prev => ({ ...prev, converting: false }));
    }
  }, [selectedCurrency, selectedReport, fetchConvertedReports]);

  // Delete report
  const deleteReport = useCallback(async (reportId: number) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    
    setLoading(prev => ({ ...prev, deleting: true }));
    setError(null);
    
    try {
      const response = await fetch(`/reports/${reportId}/delete`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        await fetchReports(); // Refresh reports list
        if (selectedReport && selectedReport.id === reportId) {
          setSelectedReport(null);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete report');
      }
    } catch (err) {
      setError('An error occurred while deleting the report');
      console.error('Delete report error:', err);
    } finally {
      setLoading(prev => ({ ...prev, deleting: false }));
    }
  }, [fetchReports, selectedReport]);

  // Export report
  const exportReport = useCallback(async (reportId: number, format: 'pdf' | 'csv' | 'xlsx') => {
    setLoading(prev => ({ ...prev, exporting: true }));
    setError(null);
    
    try {
      const response = await fetch(`/reports/${reportId}/export?format=${format}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${reportId}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to export report');
      }
    } catch (err) {
      setError('An error occurred while exporting the report');
      console.error('Export report error:', err);
    } finally {
      setLoading(prev => ({ ...prev, exporting: false }));
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchCurrencies();
    fetchReports();
    fetchConvertedReports();
  }, [fetchCurrencies, fetchReports, fetchConvertedReports]);

  // Chart data transformations
  const eventsChartData = useMemo(() => {
    if (!selectedReport?.data_breakdown?.events) return [];
    return selectedReport.data_breakdown.events.map(event => ({
      name: event.name,
      revenue: event.revenue,
      tickets: event.tickets,
      attendees: event.attendees
    }));
  }, [selectedReport]);

  const ticketTypesChartData = useMemo(() => {
    if (!selectedReport?.data_breakdown?.ticket_types) return [];
    return Object.entries(selectedReport.data_breakdown.ticket_types).map(([type, count]) => ({
      name: type,
      value: count
    }));
  }, [selectedReport]);

  const monthlyRevenueData = useMemo(() => {
    if (!selectedReport?.data_breakdown?.monthly_revenue) return [];
    return selectedReport.data_breakdown.monthly_revenue;
  }, [selectedReport]);

  const COLORS = ['#8B5CF6', '#06D6A0', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Organizer Reports Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Generate, manage, and analyze your event reports
          </p>
        </div>

        {/* Report Generation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Generate New Report
            </CardTitle>
            <CardDescription>
              Create a comprehensive report for your events within a specific date range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="mt-1"
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

        {/* Error Display */}
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

        {/* Reports List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Your Reports
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchReports}
                disabled={loading.reports}
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
              <p className="text-center text-gray-500 h-32 flex items-center justify-center">
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
                        : "border-gray-200 dark:border-gray-700"
                    )}
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{report.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {report.report_date} • {report.currency}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            {report.currency} {report.total_revenue.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {report.total_events} events • {report.total_tickets} tickets
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteReport(report.id);
                          }}
                          disabled={loading.deleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Report Details */}
        {selectedReport && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {selectedReport.title}
                  </CardTitle>
                  <CardDescription>
                    Generated on {selectedReport.report_date}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => convertRevenue(selectedReport.id)}
                    disabled={loading.converting}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Convert
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportReport(selectedReport.id, 'pdf')}
                    disabled={loading.exporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedReport.currency} {selectedReport.total_revenue.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedReport.total_events}
                    </div>
                    <p className="text-sm text-gray-500">Total Events</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedReport.total_tickets}
                    </div>
                    <p className="text-sm text-gray-500">Total Tickets</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-orange-600">
                      {selectedReport.total_attendees}
                    </div>
                    <p className="text-sm text-gray-500">Total Attendees</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <Tabs defaultValue="events" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="events">Events Revenue</TabsTrigger>
                  <TabsTrigger value="tickets">Ticket Types</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly Trends</TabsTrigger>
                </TabsList>

                <TabsContent value="events">
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue by Event</CardTitle>
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
                  <Card>
                    <CardHeader>
                      <CardTitle>Ticket Types Distribution</CardTitle>
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
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Revenue Trends</CardTitle>
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

        {/* Converted Reports History */}
        {convertedReports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Currency Conversion History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {convertedReports.map((conversion) => (
                  <div key={conversion.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {conversion.original_currency} {conversion.original_amount.toLocaleString()} → {conversion.target_currency} {conversion.converted_amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Rate: {conversion.conversion_rate} • {new Date(conversion.converted_at).toLocaleDateString()}
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


