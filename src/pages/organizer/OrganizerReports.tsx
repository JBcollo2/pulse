import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Loader2, AlertCircle, FileText, Download, Mail, PieChart as PieChartIcon,
  TrendingUp, Users, DollarSign, Calendar, MapPin, Filter, BarChart3,
  Eye, EyeOff, RefreshCw, Globe, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface EventReport {
  event_id: number;
  event_name: string;
  total_tickets_sold: number;
  number_of_attendees: number;
  total_revenue: number;
  event_date: string;
  event_location: string;
  tickets_sold_by_type: { [key: string]: number };
  revenue_by_ticket_type: { [key: string]: number };
  attendees_by_ticket_type: { [key: string]: number };
  payment_method_usage: { [key: string]: number };
  filter_start_date?: string;
  filter_end_date?: string;
}

interface ReportGenerationResponse {
  message: string;
  report_id: string;
  report_data_summary: {
    total_tickets_sold: number;
    total_revenue: number;
    number_of_attendees: number;
    currency: string;
    currency_symbol: string;
  };
  report_period: {
    start_date: string;
    end_date: string;
    is_single_day: boolean;
  };
  currency_conversion: {
    original_amount: number;
    original_currency: string;
    converted_amount: number;
    converted_currency: string;
    conversion_rate: number;
  };
  pdf_download_url: string;
  csv_download_url: string;
  email_sent: boolean;
}

interface OrganizerReportsProps {
  eventId: number;
  eventReport?: EventReport | null;
}

const CHART_COLORS = [
  '#8B5CF6', '#06D6A0', '#F59E0B', '#EF4444', '#3B82F6',
  '#EC4899', '#10B981', '#F97316', '#6366F1', '#84CC16'
];

const OrganizerReports: React.FC<OrganizerReportsProps> = ({ eventId, eventReport: initialReport = null }) => {
  const [reportData, setReportData] = useState<EventReport | null>(initialReport);
  const [generatedReport, setGeneratedReport] = useState<ReportGenerationResponse | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [specificDate, setSpecificDate] = useState<string>('');
  const [useSpecificDate, setUseSpecificDate] = useState<boolean>(false);
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [sendEmail, setSendEmail] = useState<boolean>(false);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [isLoadingDownload, setIsLoadingDownload] = useState<boolean>(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState<boolean>(false);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState<boolean>(false);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeChart, setActiveChart] = useState<string>('bar');
  const { toast } = useToast();

  const handleOperationError = useCallback((message: string, err?: any) => {
    console.error('Operation error:', message, err);
    setError(message);
    toast({
      title: "Error",
      description: err?.message || message,
      variant: "destructive",
    });
  }, [toast]);

  const fetchCurrencies = useCallback(async () => {
    setIsLoadingCurrencies(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/currency/list`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        handleOperationError(errorData.message || "Failed to fetch currencies.", errorData);
        return;
      }
      const data = await response.json();
      setCurrencies(data.data || []);

      const usdCurrency = data.data?.find((c: Currency) => c.code === 'USD');
      if (usdCurrency) {
        setSelectedCurrency(usdCurrency.code);
      }
    } catch (err: any) {
      handleOperationError("An unexpected error occurred while fetching currencies.", err);
    } finally {
      setIsLoadingCurrencies(false);
    }
  }, [handleOperationError]);

  const fetchExchangeRates = useCallback(async (baseCurrency: string = 'USD') => {
    setIsLoadingRates(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/currency/latest?base=${baseCurrency}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        handleOperationError(errorData.message || "Failed to fetch exchange rates.", errorData);
        return;
      }
      const data = await response.json();
      setExchangeRates(data.data);
    } catch (err: any) {
      handleOperationError("An unexpected error occurred while fetching exchange rates.", err);
    } finally {
      setIsLoadingRates(false);
    }
  }, [handleOperationError]);

  const canGenerateReport = useMemo(() => {
    if (useSpecificDate) {
      return specificDate && selectedCurrency;
    }
    if (!startDate || !endDate || !selectedCurrency) {
      return false;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start <= end;
  }, [startDate, endDate, specificDate, useSpecificDate, selectedCurrency]);

  const generateReport = useCallback(async () => {
    if (!canGenerateReport) {
      const message = useSpecificDate
        ? "Please select a specific date and currency."
        : "Please select valid start and end dates and currency. Start date cannot be after end date.";
      setError(message);
      toast({
        title: "Validation Error",
        description: message,
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingReport(true);
    setError(null);
    setGeneratedReport(null);

    try {
      const selectedCurrencyObj = currencies.find(c => c.code === selectedCurrency);
      if (!selectedCurrencyObj) {
        handleOperationError("Selected currency not found.");
        return;
      }

      const requestBody: any = {
        event_id: eventId,
        target_currency_id: selectedCurrencyObj.id,
        send_email: sendEmail,
      };

      if (useSpecificDate) {
        requestBody.specific_date = specificDate;
      } else {
        requestBody.start_date = startDate;
        requestBody.end_date = endDate;
      }

      if (sendEmail && recipientEmail) {
        requestBody.recipient_email = recipientEmail;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        handleOperationError(errorData.error || "Failed to generate report.", errorData);
        return;
      }

      const data: ReportGenerationResponse = await response.json();
      setGeneratedReport(data);

      toast({
        title: "Report Generated",
        description: data.message,
        variant: "default",
      });

      if (data.email_sent) {
        toast({
          title: "Email Sent",
          description: `Report has been sent to ${recipientEmail || 'your email'}`,
          variant: "default",
        });
      }
    } catch (err: any) {
      handleOperationError("An unexpected error occurred while generating the report.", err);
    } finally {
      setIsGeneratingReport(false);
    }
  }, [eventId, canGenerateReport, useSpecificDate, specificDate, startDate, endDate, selectedCurrency, sendEmail, recipientEmail, currencies, handleOperationError, toast]);

  const downloadReportFromUrl = useCallback(async (url: string, filename: string) => {
    setIsLoadingDownload(true);
    try {
      const response = await fetch(url, {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        handleOperationError(errorData.message || "Failed to download report.", errorData);
        return;
      }
      const blob = await response.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(urlBlob);
      toast({
        title: "Download Successful",
        description: `${filename} downloaded successfully!`,
        variant: "default",
      });
    } catch (err: any) {
      handleOperationError("An unexpected error occurred while downloading the report.", err);
    } finally {
      setIsLoadingDownload(false);
    }
  }, [handleOperationError, toast]);

  const fetchReport = useCallback(async () => {
    if (!canGenerateReport) {
      const message = useSpecificDate
        ? "Please select a specific date and currency."
        : "Please select valid start and end dates and currency. Start date cannot be after end date.";
      setError(message);
      toast({
        title: "Validation Error",
        description: message,
        variant: "destructive",
      });
      return;
    }
    setIsLoadingReport(true);
    setError(null);
    setReportData(null);
    try {
      const params = new URLSearchParams();
      if (useSpecificDate) {
        params.append('specific_date', specificDate);
      } else {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      const url = `${import.meta.env.VITE_API_URL}/reports/events/${eventId}?${params.toString()}`;
      const response = await fetch(url, {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        handleOperationError(errorData.message || "Failed to fetch event report.", errorData);
        return;
      }
      const data: EventReport = await response.json();
      setReportData(data);
      toast({
        title: "Report Loaded",
        description: "Event report fetched successfully.",
        variant: "default",
      });
    } catch (err: any) {
      handleOperationError("An unexpected error occurred while fetching the event report.", err);
    } finally {
      setIsLoadingReport(false);
    }
  }, [eventId, startDate, endDate, specificDate, useSpecificDate, canGenerateReport, handleOperationError, toast]);

  const formatChartData = useCallback((data: { [key: string]: number } | undefined) => {
    if (!data) return [];
    return Object.entries(data).map(([label, value], index) => ({
      name: label,
      value,
      color: CHART_COLORS[index % CHART_COLORS.length],
      percentage: 0
    }));
  }, []);

  const calculatePercentages = useCallback((data: any[]) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return data.map(item => ({
      ...item,
      percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
    }));
  }, []);

  const ticketsSoldChartData = useMemo(() =>
    calculatePercentages(formatChartData(reportData?.tickets_sold_by_type)),
    [reportData, formatChartData, calculatePercentages]
  );

  const revenueChartData = useMemo(() =>
    calculatePercentages(formatChartData(reportData?.revenue_by_ticket_type)),
    [reportData, formatChartData, calculatePercentages]
  );

  const paymentMethodChartData = useMemo(() =>
    calculatePercentages(formatChartData(reportData?.payment_method_usage)),
    [reportData, formatChartData, calculatePercentages]
  );

  const attendeesByTicketTypeData = useMemo(() =>
    calculatePercentages(formatChartData(reportData?.attendees_by_ticket_type)),
    [reportData, formatChartData, calculatePercentages]
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={cn(
          "p-4 rounded-lg shadow-lg border backdrop-blur-sm",
          "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200 text-gray-800"
        )}>
          <p className="font-semibold text-lg mb-2 dark:text-gray-200 text-gray-800">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm dark:text-gray-200 text-gray-800">
                {entry.name}: {entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill={"#ffffff"}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  useEffect(() => {
    if (selectedCurrency && selectedCurrency !== 'USD') {
      fetchExchangeRates('USD');
    }
  }, [selectedCurrency, fetchExchangeRates]);

  if (isLoadingReport && !reportData && !error) {
    return (
      <Card className={cn("max-w-3xl mx-auto my-8 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200 text-gray-800")}>
        <CardHeader>
          <CardTitle className="dark:text-gray-200 text-gray-800">Event Report</CardTitle>
          <CardDescription className="dark:text-gray-400 text-gray-600">Loading event report data...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className={cn("mt-4 text-lg dark:text-gray-400 text-gray-600")}>Fetching event insights...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("min-h-screen p-4 md:p-6 lg:p-8 dark:bg-gray-900 dark:text-gray-200 bg-gray-50 text-gray-800")}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              Event Analytics Dashboard
            </h1>
            {reportData && (
              <>
                <h2 className={cn("text-xl md:text-2xl font-semibold dark:text-gray-200 text-gray-800")}>{reportData.event_name}</h2>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm dark:text-gray-400 text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {reportData.event_date}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {reportData.event_location}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
              <Filter className="h-5 w-5" />
              Report Configuration
            </CardTitle>
            <CardDescription className="dark:text-gray-400 text-gray-600">Configure your report parameters and currency preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="dark:text-gray-200 text-gray-800 text-base font-medium">Currency Settings</Label>
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
                  <Label htmlFor="currency" className="dark:text-gray-200 text-gray-800">Target Currency</Label>
                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
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
                    <Label className="dark:text-gray-200 text-gray-800">Exchange Rate (USD → {selectedCurrency})</Label>
                    <div className="p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 bg-gray-100 border-gray-300">
                      <div className="text-lg font-semibold dark:text-gray-200 text-gray-800">
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

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useSpecificDate"
                  checked={useSpecificDate}
                  onCheckedChange={checked => setUseSpecificDate(checked === true)}
                />
                <Label htmlFor="useSpecificDate" className="dark:text-gray-200 text-gray-800">
                  Use specific date instead of date range
                </Label>
              </div>
              {useSpecificDate ? (
                <div className="space-y-2">
                  <Label htmlFor="specificDate" className="dark:text-gray-200 text-gray-800">Specific Date</Label>
                  <Input
                    id="specificDate"
                    type="date"
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    className={cn("transition-all hover:border-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800")}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="dark:text-gray-200 text-gray-800">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={cn("transition-all hover:border-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800")}
                      max={endDate || undefined}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="dark:text-gray-200 text-gray-800">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={cn("transition-all hover:border-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800")}
                      min={startDate || undefined}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendEmail"
                  checked={sendEmail}
                  onCheckedChange={checked => setSendEmail(checked === true)}
                />
                <Label htmlFor="sendEmail" className="dark:text-gray-200 text-gray-800">
                  Send report via email
                </Label>
              </div>
              {sendEmail && (
                <div className="space-y-2">
                  <Label htmlFor="recipientEmail" className="dark:text-gray-200 text-gray-800">Recipient Email (optional)</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="Leave empty to use your account email"
                    className={cn("transition-all hover:border-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800")}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={generateReport}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-500 hover:to-purple-600 flex-1 hover:scale-105 transition-all"
                disabled={isGeneratingReport || !canGenerateReport}
              >
                {isGeneratingReport ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                Generate Report
              </Button>

              <Button
                onClick={fetchReport}
                variant="outline"
                className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 bg-gray-200 text-gray-800 hover:bg-gray-300 flex-1"
                disabled={isLoadingReport || !canGenerateReport}
              >
                {isLoadingReport ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <BarChart3 className="mr-2 h-4 w-4" />
                )}
                Load Data for Charts
              </Button>
            </div>

            {error && (
              <p className="text-red-500 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {error}
              </p>
            )}
          </CardContent>
        </Card>

        {generatedReport && (
          <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
                <FileText className="h-5 w-5 text-green-500" />
                Generated Report Summary
              </CardTitle>
              <CardDescription className="dark:text-gray-400 text-gray-600">
                Report ID: {generatedReport.report_id}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="dark:bg-gray-700 bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Tickets</p>
                        <p className="text-2xl font-bold text-blue-500">
                          {generatedReport.report_data_summary.total_tickets_sold.toLocaleString()}
                        </p>
                      </div>
                      <FileText className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="dark:bg-gray-700 bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-500">
                          {generatedReport.report_data_summary.currency_symbol}{generatedReport.report_data_summary.total_revenue.toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="dark:bg-gray-700 bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Attendees</p>
                        <p className="text-2xl font-bold text-purple-500">
                          {generatedReport.report_data_summary.number_of_attendees.toLocaleString()}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="dark:bg-gray-700 bg-gray-50">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm text-gray-500">Currency Conversion</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-bold">
                        {generatedReport.currency_conversion.original_amount.toLocaleString()} {generatedReport.currency_conversion.original_currency}
                      </p>
                      <p className="text-sm text-gray-500">Original Amount</p>
                    </div>
                    <ArrowRight className="h-8 w-8 text-gray-500" />
                    <div>
                      <p className="text-lg font-bold">
                        {generatedReport.currency_conversion.converted_amount.toLocaleString()} {generatedReport.currency_conversion.converted_currency}
                      </p>
                      <p className="text-sm text-gray-500">Converted Amount</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">
                        {generatedReport.currency_conversion.conversion_rate.toFixed(4)}
                      </p>
                      <p className="text-sm text-gray-500">Conversion Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => downloadReportFromUrl(generatedReport.pdf_download_url, `report_${generatedReport.report_id}.pdf`)}
                  className="flex-1"
                  disabled={isLoadingDownload}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button
                  onClick={() => downloadReportFromUrl(generatedReport.csv_download_url, `report_${generatedReport.report_id}.csv`)}
                  className="flex-1"
                  disabled={isLoadingDownload}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {reportData && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tickets">Tickets & Attendees</TabsTrigger>
              <TabsTrigger value="revenue">Revenue & Payments</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className={cn("shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200")}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
                      <PieChartIcon className="h-5 w-5 text-blue-500" />
                      Tickets Distribution
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400 text-gray-600">Breakdown of tickets sold by type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {ticketsSoldChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                          <Pie
                            data={ticketsSoldChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderPieLabel}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={1000}
                          >
                            {ticketsSoldChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[350px] flex items-center justify-center dark:text-gray-400 text-gray-500">
                        No ticket sales data available for this period.
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className={cn("shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200")}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
                          <DollarSign className="h-5 w-5 text-green-500" />
                          Revenue by Type
                        </CardTitle>
                        <CardDescription className="dark:text-gray-400 text-gray-600">Revenue distribution across ticket categories</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={activeChart === 'bar' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setActiveChart('bar')}
                          className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 bg-gray-200 text-gray-800 hover:bg-gray-300"
                        >
                          Bar
                        </Button>
                        <Button
                          variant={activeChart === 'pie' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setActiveChart('pie')}
                          className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 bg-gray-200 text-gray-800 hover:bg-gray-300"
                        >
                          Pie
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {revenueChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={350}>
                        {activeChart === 'pie' ? (
                          <PieChart>
                            <Pie
                              data={revenueChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={renderPieLabel}
                              outerRadius={120}
                              fill="#8884d8"
                              dataKey="value"
                              animationBegin={0}
                              animationDuration={1000}
                            >
                              {revenueChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                          </PieChart>
                        ) : (
                          <BarChart data={revenueChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8" />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[350px] flex items-center justify-center dark:text-gray-400 text-gray-500">
                        No revenue data available for this period.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="tickets" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className={cn("shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200")}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
                      <Users className="h-5 w-5 text-green-500" />
                      Attendees by Ticket Type
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400 text-gray-600">Number of attendees associated with each ticket type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {attendeesByTicketTypeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={attendeesByTicketTypeData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[350px] flex items-center justify-center dark:text-gray-400 text-gray-500">
                        No attendee data available by ticket type for this period.
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className={cn("shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200")}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
                      <DollarSign className="h-5 w-5 text-blue-500" />
                      Payment Method Usage
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400 text-gray-600">Breakdown of transactions by payment method</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {paymentMethodChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                          <Pie
                            data={paymentMethodChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderPieLabel}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={1000}
                          >
                            {paymentMethodChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[350px] flex items-center justify-center dark:text-gray-400 text-gray-500">
                        No payment method usage data available for this period.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="revenue" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className={cn("shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200")}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      Revenue by Ticket Type
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400 text-gray-600">Revenue generated from each ticket category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {revenueChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={revenueChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[350px] flex items-center justify-center dark:text-gray-400 text-gray-500">
                        No revenue data available for this period.
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className={cn("shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200")}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
                      <DollarSign className="h-5 w-5 text-blue-500" />
                      Payment Method Usage
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400 text-gray-600">Breakdown of transactions by payment method</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {paymentMethodChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                          <Pie
                            data={paymentMethodChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderPieLabel}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={1000}
                          >
                            {paymentMethodChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[350px] flex items-center justify-center dark:text-gray-400 text-gray-500">
                        No payment method usage data available for this period.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default OrganizerReports;
