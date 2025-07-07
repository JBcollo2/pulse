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
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
  Loader2, AlertCircle, FileText, Download, Mail, PieChart as PieChartIcon,
  TrendingUp, Users, DollarSign, Calendar, MapPin, Filter, BarChart3,
  Eye, EyeOff, RefreshCw, Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Interfaces ---
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

// Updated EventReport interface to match EventReportsResource response
interface EventReport {
  report_id: number;
  event_id: number;
  total_tickets_sold: number;
  total_revenue: number;
  number_of_attendees: number;
  report_date: string;
  pdf_download_url: string;
  csv_download_url: string;
}

// Interface for the overall response from /reports/events/{eventId}
interface EventReportsResponse {
  event_id: number;
  reports: EventReport[];
  total_reports_returned: number;
  is_limited: boolean;
  limit_applied: number | null;
  query_info: {
    specific_date?: string;
    start_date?: string;
    end_date?: string;
    is_single_day?: boolean;
    limit: number | null;
    get_all: boolean;
  };
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

// --- Constants ---
const CHART_COLORS = [
  '#06D6A0', '#3B82F6', '#F59E0B', '#EF4444',
  '#EC4899', '#10B981', '#F97316', '#6366F1', '#84CC16'
];

// --- OrganizerReports Component ---
const OrganizerReports: React.FC<OrganizerReportsProps> = ({ eventId, eventReport: initialReport = null }) => {
  // --- State Variables ---
  const [reportsData, setReportsData] = useState<EventReportsResponse | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [currentDetailedReport, setCurrentDetailedReport] = useState<any | null>(null);
  const [generatedReport, setGeneratedReport] = useState<ReportGenerationResponse | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [specificDate, setSpecificDate] = useState<string>('');
  const [useSpecificDate, setUseSpecificDate] = useState<boolean>(false);
  const [reportLimit, setReportLimit] = useState<number>(5);
  const [getAllReports, setGetAllReports] = useState<boolean>(false);
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [sendEmail, setSendEmail] = useState<boolean>(false);

  // Loading states
  const [isLoadingReportsList, setIsLoadingReportsList] = useState<boolean>(false);
  const [isLoadingDetailedReport, setIsLoadingDetailedReport] = useState<boolean>(false);
  const [isLoadingDownload, setIsLoadingDownload] = useState<boolean>(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState<boolean>(false);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState<boolean>(false);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeChart, setActiveChart] = useState<string>('bar');

  const { toast } = useToast();

  // --- Helper Callbacks for Error Handling and Data Formatting ---
  const handleOperationError = useCallback((message: string, err?: any) => {
    console.error('Operation error:', message, err);
    setError(message);
    toast({
      title: "Error",
      description: err?.message || message,
      variant: "destructive",
    });
  }, [toast]);

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

  // --- API Fetching Callbacks ---
  const fetchExchangeRates = useCallback(async (baseCurrency: string = 'USD') => {
    setIsLoadingRates(true);
    setError(null);
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
      toast({
        title: "Exchange Rates Updated",
        description: `Latest rates for ${baseCurrency} fetched successfully.`,
        variant: "default",
      });
    } catch (err: any) {
      handleOperationError("An unexpected error occurred while fetching exchange rates.", err);
    } finally {
      setIsLoadingRates(false);
    }
  }, [handleOperationError, toast]);

  const fetchCurrencies = useCallback(async () => {
    setIsLoadingCurrencies(true);
    setError(null);
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
      if (!selectedCurrency) {
        const usdCurrency = data.data?.find((c: Currency) => c.code === 'USD');
        if (usdCurrency) {
          setSelectedCurrency(usdCurrency.code);
        }
      }
    } catch (err: any) {
      handleOperationError("An unexpected error occurred while fetching currencies.", err);
    } finally {
      setIsLoadingCurrencies(false);
    }
  }, [handleOperationError, selectedCurrency]);

  const fetchEventReports = useCallback(async () => {
    setIsLoadingReportsList(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (useSpecificDate && specificDate) {
        params.append('specific_date', specificDate);
      } else if (startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      if (getAllReports) {
        params.append('get_all', 'true');
      } else if (reportLimit > 0) {
        params.append('limit', reportLimit.toString());
      } else {
        params.append('limit', '5');
      }

      const url = `${import.meta.env.VITE_API_URL}/reports/events/${eventId}?${params.toString()}`;
      const response = await fetch(url, {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        handleOperationError(errorData.error || "Failed to fetch event reports.", errorData);
        return;
      }
      const data = await response.json();
      setReportsData(data);
      if (data.reports.length > 0) {
        setSelectedReportId(data.reports[0].report_id);
      } else {
        setSelectedReportId(null);
        setCurrentDetailedReport(null);
      }
      toast({
        title: "Reports Fetched",
        description: `Found ${data.total_reports_returned} reports for event ${eventId}.`,
        variant: "default",
      });
    } catch (err: any) {
      handleOperationError("An unexpected error occurred while fetching event reports.", err);
    } finally {
      setIsLoadingReportsList(false);
    }
  }, [eventId, useSpecificDate, specificDate, startDate, endDate, getAllReports, reportLimit, handleOperationError, toast]);

  const fetchDetailedReport = useCallback(async (reportId: number, targetCurrencyId?: number) => {
    setIsLoadingDetailedReport(true);
    setError(null);
    try {
      let url = `${import.meta.env.VITE_API_URL}/reports/${reportId}`;
      if (targetCurrencyId) {
        url += `?target_currency_id=${targetCurrencyId}`;
      }
      const response = await fetch(url, {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        handleOperationError(errorData.error || "Failed to fetch detailed report.", errorData);
        return;
      }
      const data = await response.json();
      setCurrentDetailedReport(data.report);
      toast({
        title: "Detailed Report Loaded",
        description: `Displaying details for report ID: ${reportId}.`,
        variant: "default",
      });
    } catch (err: any) {
      handleOperationError("An unexpected error occurred while fetching detailed report.", err);
    } finally {
      setIsLoadingDetailedReport(false);
    }
  }, [handleOperationError, toast]);

  // Fetch currencies on component mount
  useEffect(() => {
    fetchCurrencies();
  }, []);

  // Fetch exchange rates when selectedCurrency changes
  useEffect(() => {
    if (selectedCurrency && selectedCurrency !== 'USD') {
      fetchExchangeRates('USD');
    } else {
      setExchangeRates(null);
    }
  }, [selectedCurrency, fetchExchangeRates]);

  // Fetch event reports on mount and when parameters change
  useEffect(() => {
    if (currencies.length > 0) {
      fetchEventReports();
    }
  }, [fetchEventReports, currencies.length]);

  // Fetch detailed report when selectedReportId changes
  useEffect(() => {
    if (selectedReportId) {
      const selectedCurrencyObj = currencies.find(c => c.code === selectedCurrency);
      fetchDetailedReport(selectedReportId, selectedCurrencyObj?.id);
    }
  }, [selectedReportId, fetchDetailedReport, selectedCurrency, currencies]);

  // --- Validation for Report Generation ---
  const canGenerateReport = useMemo(() => {
    if (!selectedCurrency) {
      return false;
    }
    if (useSpecificDate) {
      return !!specificDate;
    }
    if (!startDate || !endDate) {
      return false;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start <= end;
  }, [startDate, endDate, specificDate, useSpecificDate, selectedCurrency]);

  // --- New Report Generation Function ---
  const generateReport = useCallback(async () => {
    if (!canGenerateReport) {
      const message = useSpecificDate
        ? "Please select a specific date and target currency."
        : "Please select valid start and end dates and target currency. Start date cannot be after end date.";
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
    setCurrentDetailedReport(null);
    setReportsData(null);
    try {
      const selectedCurrencyObj = currencies.find(c => c.code === selectedCurrency);
      if (!selectedCurrencyObj) {
        handleOperationError("Selected currency not found in list.");
        return;
      }
      const requestBody: { [key: string]: any } = {
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
      const generateResponse = await fetch(`${import.meta.env.VITE_API_URL}/reports/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });
      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        handleOperationError(errorData.error || "Failed to generate report.", errorData);
        return;
      }
      const generateData = await generateResponse.json();
      setGeneratedReport(generateData);
      toast({
        title: "Report Generated",
        description: generateData.message,
        variant: "default",
      });
      if (generateData.email_sent) {
        toast({
          title: "Email Initiated",
          description: `Report email sent to ${recipientEmail || 'your default email'}. Check your inbox.`,
          variant: "default",
        });
      }
      await fetchEventReports();
    } catch (err: any) {
      handleOperationError("An unexpected error occurred while generating the report.", err);
    } finally {
      setIsGeneratingReport(false);
    }
  }, [eventId, canGenerateReport, useSpecificDate, specificDate, startDate, endDate, selectedCurrency, sendEmail, recipientEmail, currencies, handleOperationError, toast, fetchEventReports]);

  // Helper for downloading files from URL
  const downloadReportFromUrl = useCallback(async (reportId: string, format: string) => {
    setIsLoadingDownload(true);
    try {
      const url = `${import.meta.env.VITE_API_URL}/reports/${reportId}/export?format=${format}`;
      const response = await fetch(url, {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        handleOperationError(errorData.message || `Failed to download report.`, errorData);
        return;
      }
      const blob = await response.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = `report_${reportId}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(urlBlob);
      toast({
        title: "Download Successful",
        description: `Report downloaded successfully!`,
        variant: "default",
      });
    } catch (err: any) {
      handleOperationError(`An unexpected error occurred while downloading the report.`, err);
    } finally {
      setIsLoadingDownload(false);
    }
  }, [handleOperationError, toast]);

  // --- Memoized Chart Data ---
  const ticketsSoldChartData = useMemo(() =>
    calculatePercentages(formatChartData(currentDetailedReport?.tickets_sold_by_type)),
    [currentDetailedReport, formatChartData, calculatePercentages]
  );

  const revenueChartData = useMemo(() =>
    calculatePercentages(formatChartData(currentDetailedReport?.revenue_by_ticket_type)),
    [currentDetailedReport, formatChartData, calculatePercentages]
  );

  const paymentMethodChartData = useMemo(() =>
    calculatePercentages(formatChartData(currentDetailedReport?.payment_method_usage)),
    [currentDetailedReport, formatChartData, calculatePercentages]
  );

  const attendeesByTicketTypeData = useMemo(() =>
    calculatePercentages(formatChartData(currentDetailedReport?.attendees_by_ticket_type)),
    [currentDetailedReport, formatChartData, calculatePercentages]
  );

  // --- Recharts Custom Components ---
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currencySymbol = currentDetailedReport?.currency_symbol || '$';
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
                {entry.name}: {entry.name.toLowerCase().includes('revenue') ? `${currencySymbol}${entry.value.toLocaleString()}` : entry.value}
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

  // --- Initial Loading Spinner ---
  if (isLoadingCurrencies && !currencies.length) {
    return (
      <Card className={cn("max-w-3xl mx-auto my-8 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200 text-gray-800")}>
        <CardHeader>
          <CardTitle className="dark:text-gray-200 text-gray-800">Event Report</CardTitle>
          <CardDescription className="dark:text-gray-400 text-gray-600">Loading initial data...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-[#06D6A0]" />
          <p className={cn("mt-4 text-lg dark:text-gray-400 text-gray-600")}>Fetching currencies and setup...</p>
        </CardContent>
      </Card>
    );
  }

  // --- Main Component Render ---
  return (
    <div className={cn("min-h-screen p-4 md:p-6 lg:p-8 dark:bg-gray-900 dark:text-gray-200 bg-gray-50 text-gray-800")}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-500 to-[#06D6A0] bg-clip-text text-transparent">
              Event Analytics Dashboard
            </h1>
            <h2 className={cn("text-xl md:text-2xl font-semibold dark:text-gray-200 text-gray-800")}>
              {`Event ID: ${eventId}`}
            </h2>
          </div>
          {/* Download & Email Buttons */}
          {currentDetailedReport && (
            <div className="flex flex-wrap justify-center md:justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => downloadReportFromUrl(currentDetailedReport.report_id, 'pdf')}
                disabled={isLoadingDownload}
                className="hover:scale-105 transition-transform dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                <Download className="mr-2 h-4 w-4" />
                {isLoadingDownload ? "Downloading..." : "Download PDF"}
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadReportFromUrl(currentDetailedReport.report_id, 'csv')}
                disabled={isLoadingDownload}
                className="hover:scale-105 transition-transform dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                <Download className="mr-2 h-4 w-4" />
                {isLoadingDownload ? "Downloading..." : "Download CSV"}
              </Button>
              {generatedReport?.email_sent && (
                <Button
                  variant="outline"
                  disabled
                  className="hover:scale-105 transition-transform dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email Sent!
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Report Configuration Section */}
        <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
              <Filter className="h-5 w-5" />
              Report Configuration
            </CardTitle>
            <CardDescription className="dark:text-gray-400 text-gray-600">
              Configure your report parameters and currency preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Currency Selection */}
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
                        <SelectItem key={currency.id} value={currency.code} className="focus:bg-blue-100 dark:focus:bg-[#06D6A0]/20 dark:focus:text-[#06D6A0] data-[state=checked]:bg-[#06D6A0] data-[state=checked]:text-white dark:data-[state=checked]:bg-[#06D6A0] dark:data-[state=checked]:text-white">
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
                {exchangeRates && selectedCurrency !== exchangeRates.base_currency && (
                  <Card className="p-3 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 shadow-sm">
                    <CardDescription className="text-blue-700 dark:text-blue-300 text-sm">
                      1 {exchangeRates.base_currency} = {exchangeRates.rates[selectedCurrency]?.toFixed(4) || 'N/A'} {selectedCurrency}
                      <span className="ml-2 text-xs opacity-70"> (Source: {exchangeRates.source})</span>
                    </CardDescription>
                  </Card>
                )}
              </div>
            </div>

            {/* Date Range Selection */}
            <div className="space-y-4">
              <Label className="dark:text-gray-200 text-gray-800 text-base font-medium">Report Period</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useSpecificDate"
                  checked={useSpecificDate}
                  onCheckedChange={(checked: boolean) => {
                    setUseSpecificDate(checked);
                    if (checked) {
                      setStartDate('');
                      setEndDate('');
                    } else {
                      setSpecificDate('');
                    }
                  }}
                  className="dark:border-gray-600 dark:bg-gray-700 data-[state=checked]:bg-[#06D6A0] dark:data-[state=checked]:bg-[#06D6A0] data-[state=checked]:text-white dark:data-[state=checked]:text-white"
                />
                <label
                  htmlFor="useSpecificDate"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-300"
                >
                  Generate for a specific date
                </label>
              </div>
              {useSpecificDate ? (
                <div className="space-y-2">
                  <Label htmlFor="specificDate" className="dark:text-gray-200 text-gray-800">Specific Date</Label>
                  <Input
                    id="specificDate"
                    type="date"
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="dark:text-gray-200 text-gray-800">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="dark:text-gray-200 text-gray-800">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Report Limit and Get All Checkbox */}
            <div className="space-y-4">
              <Label className="dark:text-gray-200 text-gray-800 text-base font-medium">Report Quantity</Label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="getAllReports"
                    checked={getAllReports}
                    onCheckedChange={(checked: boolean) => {
                      setGetAllReports(checked);
                      if (checked) {
                        setReportLimit(0);
                      } else {
                        setReportLimit(5);
                      }
                    }}
                    className="dark:border-gray-600 dark:bg-gray-700 data-[state=checked]:bg-[#06D6A0] dark:data-[state=checked]:bg-[#06D6A0] data-[state=checked]:text-white dark:data-[state=checked]:text-white"
                  />
                  <label
                    htmlFor="getAllReports"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-300"
                  >
                    Get all available reports
                  </label>
                </div>
                {!getAllReports && (
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="reportLimit" className="dark:text-gray-200 text-gray-800">Number of Reports (Default 5)</Label>
                    <Input
                      id="reportLimit"
                      type="number"
                      min="1"
                      value={reportLimit}
                      onChange={(e) => setReportLimit(parseInt(e.target.value) || 0)}
                      className="w-24 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Email Configuration */}
            <div className="space-y-4">
              <Label className="dark:text-gray-200 text-gray-800 text-base font-medium">Email Options</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendEmail"
                  checked={sendEmail}
                  onCheckedChange={(checked: boolean) => setSendEmail(checked)}
                  className="dark:border-gray-600 dark:bg-gray-700 data-[state=checked]:bg-[#06D6A0] dark:data-[state=checked]:bg-[#06D6A0] data-[state=checked]:text-white dark:data-[state=checked]:text-white"
                />
                <label
                  htmlFor="sendEmail"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-300"
                >
                  Send report via email
                </label>
              </div>
              {sendEmail && (
                <div className="space-y-2">
                  <Label htmlFor="recipientEmail" className="dark:text-gray-200 text-gray-800">Recipient Email (Optional)</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    placeholder="Enter email address"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800"
                  />
                </div>
              )}
            </div>

            {/* Generate Report Button */}
            <Button
              onClick={generateReport}
              disabled={isGeneratingReport || !canGenerateReport}
              className="w-full bg-[#06D6A0] text-white hover:bg-[#05B08D] transition-colors duration-200"
            >
              {isGeneratingReport ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              {isGeneratingReport ? "Generating Report..." : "Generate New Report"}
            </Button>
            {error && (
              <div className="flex items-center p-3 text-red-700 bg-red-100 border border-red-200 rounded-md dark:bg-red-950 dark:border-red-800 dark:text-red-300">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Display List of Reports */}
        <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
              <FileText className="h-5 w-5" />
              Available Reports
            </CardTitle>
            <CardDescription className="dark:text-gray-400 text-gray-600">
              Select a report to view detailed analytics.
              {reportsData && reportsData.is_limited && (
                <span className="ml-2 text-blue-500 dark:text-blue-300">
                  (Showing latest {reportsData.limit_applied || '5'} reports)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingReportsList ? (
              <div className="flex flex-col items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-[#06D6A0]" />
                <p className="mt-2 text-gray-500 dark:text-gray-400">Loading reports...</p>
              </div>
            ) : reportsData?.reports && reportsData.reports.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reportsData.reports.map((report) => (
                  <Card
                    key={report.report_id}
                    className={cn(
                      "cursor-pointer hover:shadow-md transition-shadow duration-200 dark:bg-gray-700 dark:border-gray-600",
                      selectedReportId === report.report_id ? "border-2 border-[#06D6A0] ring-2 ring-[#06D6A0]/50" : "border border-gray-200 dark:border-gray-700"
                    )}
                    onClick={() => setSelectedReportId(report.report_id)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg dark:text-gray-200">Report ID: {report.report_id}</CardTitle>
                      <CardDescription className="dark:text-gray-400">
                        {report.report_date ? new Date(report.report_date).toLocaleDateString() : 'N/A'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm dark:text-gray-300">
                      <p>Tickets Sold: {report.total_tickets_sold}</p>
                      <p>Attendees: {report.number_of_attendees}</p>
                      <p>Revenue: {report.total_revenue?.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                <AlertCircle className="h-10 w-10 mx-auto mb-4" />
                <p className="text-lg">No reports found for this event with the current filters.</p>
                <p className="text-sm mt-2">Try adjusting the date range or generating a new report.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Report Display (Charts and Summary) */}
        {selectedReportId && currentDetailedReport ? (
          <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
                <BarChart3 className="h-5 w-5" />
                Detailed Report: {currentDetailedReport.report_id}
              </CardTitle>
              <CardDescription className="dark:text-gray-400 text-gray-600">
                Insights for the selected report generated on {new Date(currentDetailedReport.report_date).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Report Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <Card className="p-4 flex flex-col items-center dark:bg-gray-700 dark:border-gray-600">
                  <Users className="h-8 w-8 text-blue-500 mb-2" />
                  <p className="text-lg font-semibold dark:text-gray-200">Total Attendees</p>
                  <p className="text-2xl font-bold text-[#06D6A0]">
                    {currentDetailedReport.number_of_attendees?.toLocaleString() || 0}
                  </p>
                </Card>
                <Card className="p-4 flex flex-col items-center dark:bg-gray-700 dark:border-gray-600">
                  <TrendingUp className="h-8 w-8 text-yellow-500 mb-2" />
                  <p className="text-lg font-semibold dark:text-gray-200">Total Tickets Sold</p>
                  <p className="text-2xl font-bold text-[#06D6A0]">
                    {currentDetailedReport.total_tickets_sold?.toLocaleString() || 0}
                  </p>
                </Card>
                <Card className="p-4 flex flex-col items-center dark:bg-gray-700 dark:border-gray-600">
                  <DollarSign className="h-8 w-8 text-green-500 mb-2" />
                  <p className="text-lg font-semibold dark:text-gray-200">Total Revenue</p>
                  <p className="text-2xl font-bold text-[#06D6A0]">
                    {currentDetailedReport.currency_symbol}{currentDetailedReport.total_revenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </p>
                  {currentDetailedReport.currency_conversion?.conversion_applied && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      (Original: {currentDetailedReport.currency_conversion.original_currency_symbol}
                      {currentDetailedReport.currency_conversion.original_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </p>
                  )}
                </Card>
              </div>

              {/* Chart Type Selector */}
              <div className="flex justify-center mb-4">
                <Tabs value={activeChart} onValueChange={setActiveChart} className="w-auto">
                  <TabsList className="dark:bg-gray-700 bg-gray-200">
                    <TabsTrigger value="bar" className="dark:data-[state=active]:bg-[#06D6A0] dark:data-[state=active]:text-white">
                      <BarChart3 className="h-4 w-4 mr-2" /> Bar Charts
                    </TabsTrigger>
                    <TabsTrigger value="pie" className="dark:data-[state=active]:bg-[#06D6A0] dark:data-[state=active]:text-white">
                      <PieChartIcon className="h-4 w-4 mr-2" /> Pie Charts
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Charts Display */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tickets Sold by Type Chart */}
                <Card className="dark:bg-gray-700 dark:border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-lg dark:text-gray-200">Tickets Sold by Type</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      {activeChart === 'bar' ? (
                        <BarChart data={ticketsSoldChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                          <XAxis dataKey="name" stroke="#888888" tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value} />
                          <YAxis stroke="#888888" />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="value" name="Tickets Sold" fill="#06D6A0" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      ) : (
                        <PieChart width={400} height={300}>
                          <Pie
                            data={ticketsSoldChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={renderPieLabel}
                          >
                            {ticketsSoldChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Revenue by Ticket Type Chart */}
                <Card className="dark:bg-gray-700 dark:border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-lg dark:text-gray-200">Revenue by Ticket Type</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      {activeChart === 'bar' ? (
                        <BarChart data={revenueChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                          <XAxis dataKey="name" stroke="#888888" tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value} />
                          <YAxis stroke="#888888" tickFormatter={(value) => `${currentDetailedReport?.currency_symbol || '$'}${value}`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="value" name="Revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      ) : (
                        <PieChart width={400} height={300}>
                          <Pie
                            data={revenueChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={renderPieLabel}
                          >
                            {revenueChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Attendees by Ticket Type Chart */}
                <Card className="dark:bg-gray-700 dark:border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-lg dark:text-gray-200">Attendees by Ticket Type</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      {activeChart === 'bar' ? (
                        <BarChart data={attendeesByTicketTypeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                          <XAxis dataKey="name" stroke="#888888" tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value} />
                          <YAxis stroke="#888888" />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="value" name="Attendees" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      ) : (
                        <PieChart width={400} height={300}>
                          <Pie
                            data={attendeesByTicketTypeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={renderPieLabel}
                          >
                            {attendeesByTicketTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Payment Method Usage Chart */}
                <Card className="dark:bg-gray-700 dark:border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-lg dark:text-gray-200">Payment Method Usage</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      {activeChart === 'bar' ? (
                        <BarChart data={paymentMethodChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                          <XAxis dataKey="name" stroke="#888888" tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value} />
                          <YAxis stroke="#888888" />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="value" name="Transactions" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      ) : (
                        <PieChart width={400} height={300}>
                          <Pie
                            data={paymentMethodChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={renderPieLabel}
                          >
                            {paymentMethodChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        ) : (
          !isLoadingReportsList && !selectedReportId && reportsData?.reports.length === 0 && (
            <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200")}>
              <CardContent className="text-center p-8 text-gray-500 dark:text-gray-400">
                <AlertCircle className="h-10 w-10 mx-auto mb-4" />
                <p className="text-lg">No detailed report selected or available.</p>
                <p className="text-sm mt-2">Generate a new report or select one from the "Available Reports" section above.</p>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
};

export default OrganizerReports;
