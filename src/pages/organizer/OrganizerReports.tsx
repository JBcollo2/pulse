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
  TrendingUp, DollarSign, Calendar, MapPin, Filter, BarChart3,
  Eye, EyeOff, RefreshCw, Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Interfaces ---
interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchange_rate_from_ksh?: number;
  description?: string;
  rate_source?: string;
}

interface ExchangeRates {
  base_currency: string;
  currencies: Currency[];
  total_currencies: number;
  failed_currencies?: string[] | null;
}

interface ReportData {
  total_revenue: number;
  event_name?: string;
  event_date?: string;
  event_location?: string;
  currency?: string;
  currency_symbol?: string;
  [key: string]: any;
}

interface EventReport {
  event_id: number;
  event_name: string;
  total_revenue: number;
  event_date: string;
  event_location: string;
  revenue_by_ticket_type: { [key: string]: number };
  payment_method_usage: { [key: string]: number };
  filter_start_date?: string;
  filter_end_date?: string;
  currency?: string;
  currency_symbol?: string;
}

interface Report {
  id: number;
  event_id: number;
  organizer_id: number;
  created_at: string;
  updated_at: string;
  report_date: string;
  total_revenue: number;
  currency_code: string;
  currency?: string;
  report_data: ReportData;
  currency_conversion?: {
    original_currency: string;
    target_currency: string;
    conversion_rate: number;
    conversion_successful: boolean;
    converted_amount?: number;
    converted_currency?: string;
  };
}

interface ReportGenerationResponse {
  message: string;
  report_id: string;
  report_data_summary: {
    total_revenue_original: number;
    total_revenue_converted: number;
    original_currency: string;
    target_currency: string;
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
    conversion_steps: {
      ksh_to_usd_rate: number;
      usd_to_target_rate: number;
      overall_conversion_rate: number;
    };
    conversion_successful: boolean;
  };
  download_links: {
    pdf_url: string;
    csv_url: string;
  };
  email_sent: boolean;
  chart_data: {
    revenue_by_ticket_type: { [key: string]: number };
    payment_method_usage: { [key: string]: number };
  };
}

interface EventReportsResponse {
  event_id: number;
  event_name: string;
  organizer_name: string;
  total_reports_found: number;
  reports: Report[];
  request_info: {
    requested_by_user_id: number;
    requested_by_role: string | null;
    requested_by_organizer_id: number | null;
    target_currency_id: number | null;
    request_timestamp: string;
    report_ids_returned: number[];
  };
  currency_conversion?: {
    target_currency_id: number;
    target_currency_code: string;
    conversion_applied: boolean;
  };
}

interface OrganizerReportsProps {
  eventId: number;
  eventReport?: EventReport | null;
}

// --- Constants ---
const CHART_COLORS = [
  '#10b981', '#059669', '#047857', '#065f46',
  '#064e3b', '#1f2937', '#374151', '#4b5563', '#6b7280'
];

// --- OrganizerReports Component ---
const OrganizerReports: React.FC<OrganizerReportsProps> = ({ eventId, eventReport: initialReport = null }) => {
  // --- State Variables ---
  const [reportData, setReportData] = useState<EventReport | null>(initialReport);
  const [generatedReport, setGeneratedReport] = useState<ReportGenerationResponse | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('KES');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [specificDate, setSpecificDate] = useState<string>('');
  const [useSpecificDate, setUseSpecificDate] = useState<boolean>(false);
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [sendEmail, setSendEmail] = useState<boolean>(false);
  const [reports, setReports] = useState<Report[]>([]);

  // Loading states
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [isLoadingDownload, setIsLoadingDownload] = useState<boolean>(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState<boolean>(false);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState<boolean>(false);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeChart, setActiveChart] = useState<string>('bar');
  const { toast } = useToast();

  // Initialize reportData from initialReport if available
  useEffect(() => {
    if (initialReport && !reportData) {
      setReportData(initialReport);
    }
  }, [initialReport, reportData]);

  // --- Helper Callbacks for Error Handling and Data Formatting ---
  const handleOperationError = useCallback((message: string, err?: any) => {
    setError(message);
    toast({
      title: "Error",
      description: err?.message || message,
      variant: "destructive",
    });
  }, [toast]);

  const formatChartData = useCallback((data: { [key: string]: number } | undefined) => {
    if (!data || typeof data !== 'object') {
      return [];
    }

    if (Object.keys(data).length === 0) {
      return [];
    }

    const entries = Object.entries(data).filter(([_, value]) => {
      return value != null && !isNaN(Number(value)) && Number(value) > 0;
    });

    return entries.map(([label, value], index) => ({
      name: label,
      value: Number(value) || 0,
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
  const fetchExchangeRates = useCallback(async () => {
    setIsLoadingRates(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/currency/list`, {
        credentials: 'include'
      });
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error("Response is not in JSON format");
      }
      const data = await response.json();
      if (!response.ok) {
        const errorData = data;
        handleOperationError(errorData.message || "Failed to fetch exchange rates.", errorData);
        return;
      }
      setExchangeRates(data.data);
      toast({
        title: "Exchange Rates Updated",
        description: `Latest rates for ${data.data.base_currency} fetched successfully.`,
        variant: "default",
      });
    } catch (err) {
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
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error("Response is not in JSON format");
      }
      const data = await response.json();
      if (!response.ok) {
        const errorData = data;
        handleOperationError(errorData.message || "Failed to fetch currencies.", errorData);
        return;
      }
      const currenciesData = data.data?.currencies || [];
      setCurrencies(currenciesData);
      setExchangeRates(data.data);
      if (!selectedCurrency && currenciesData.length > 0) {
        const kesCurrency = currenciesData.find((c) => c.code === 'KES');
        if (kesCurrency) {
          setSelectedCurrency('KES');
        } else {
          setSelectedCurrency(currenciesData[0].code);
        }
      }
    } catch (err) {
      handleOperationError("An unexpected error occurred while fetching currencies.", err);
    } finally {
      setIsLoadingCurrencies(false);
    }
  }, [handleOperationError, selectedCurrency]);

  const fetchReports = useCallback(async () => {
    setIsLoadingReport(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCurrency) {
        const selectedCurrencyObj = currencies.find(c => c.code === selectedCurrency);
        if (selectedCurrencyObj) {
          params.append('target_currency_id', selectedCurrencyObj.id.toString());
        }
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/events/${eventId}?${params.toString()}`, {
        credentials: 'include'
      });
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error("Response is not in JSON format");
      }
      const data = await response.json();
      if (!response.ok) {
        handleOperationError(data.error || "Failed to fetch reports.", data);
        return;
      }
      const reportsData = data.reports || [];
      setReports(reportsData);
      if (data.event_name && data.organizer_name) {
        toast({
          title: "Reports Fetched",
          description: `Successfully fetched ${reportsData.length} reports for ${data.event_name} by ${data.organizer_name}.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Reports Fetched",
          description: `Successfully fetched ${reportsData.length} reports.`,
          variant: "default",
        });
      }
    } catch (err) {
      handleOperationError("An unexpected error occurred while fetching reports.", err);
    } finally {
      setIsLoadingReport(false);
    }
  }, [eventId, selectedCurrency, currencies, handleOperationError, toast]);

  // Fetch currencies on component mount
  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

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

  // Updated memoized chart data with better data sourcing
  const revenueChartData = useMemo(() => {
    const rawData = reportData?.revenue_by_ticket_type;
    return calculatePercentages(formatChartData(rawData));
  }, [reportData, formatChartData, calculatePercentages]);

  const paymentMethodChartData = useMemo(() => {
    const rawData = reportData?.payment_method_usage;
    return calculatePercentages(formatChartData(rawData));
  }, [reportData, formatChartData, calculatePercentages]);

  // Enhanced generateReport function
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
    if (sendEmail && !recipientEmail) {
      setError("Please enter a recipient email address to send the report, or uncheck the 'Send report via email' option.");
      toast({
        title: "Validation Error",
        description: "Please enter a recipient email address to send the report, or uncheck the 'Send report via email' option.",
        variant: "destructive",
      });
      return;
    }
    setIsGeneratingReport(true);
    setError(null);
    setGeneratedReport(null);

    try {
      const requestBody: any = {
        event_id: eventId,
        target_currency: selectedCurrency,
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

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error("Response is not in JSON format");
      }

      const data = await response.json();
      if (!response.ok) {
        const errorData = data;
        handleOperationError(errorData.error || "Failed to generate report.", errorData);
        return;
      }

      if (data.chart_data) {
        const structuredReportData: EventReport = {
          event_id: eventId,
          event_name: data.event_name || 'Unknown Event',
          total_revenue: data.report_data_summary?.total_revenue_converted || 0,
          event_date: data.report_period.start_date,
          event_location: data.event_location || 'Unknown Location',
          revenue_by_ticket_type: data.chart_data.revenue_by_ticket_type || {},
          payment_method_usage: data.chart_data.payment_method_usage || {},
          currency: data.report_data_summary?.target_currency || 'KES',
          currency_symbol: data.report_data_summary?.currency_symbol || 'KSh',
        };

        setReportData(structuredReportData);
      } else {
        const fallbackReportData: EventReport = {
          event_id: eventId,
          event_name: 'Unknown Event',
          total_revenue: data.report_data_summary?.total_revenue_converted || 0,
          event_date: data.report_period.start_date,
          event_location: 'Unknown Location',
          revenue_by_ticket_type: {},
          payment_method_usage: {},
          currency: data.report_data_summary?.target_currency || 'KES',
          currency_symbol: data.report_data_summary?.currency_symbol || 'KSh',
        };

        setReportData(fallbackReportData);
      }

      setGeneratedReport(data);

      toast({
        title: "Report Generated",
        description: data.message,
        variant: "default",
      });

      if (data.email_sent) {
        toast({
          title: "Email Initiated",
          description: `Report email sent to ${recipientEmail || 'your default email'}. Check your inbox.`,
          variant: "default",
        });
      }
    } catch (err) {
      handleOperationError("An unexpected error occurred while generating the report.", err);
    } finally {
      setIsGeneratingReport(false);
    }
  }, [eventId, canGenerateReport, useSpecificDate, specificDate, startDate, endDate, selectedCurrency, sendEmail, recipientEmail, handleOperationError, toast]);

  // Updated download function to use the new URL structure
  const downloadReportFromUrl = useCallback(async (reportId: string, format: string) => {
    setIsLoadingDownload(true);
    try {
      const targetCurrencyId = selectedCurrency ?
        currencies.find(c => c.code === selectedCurrency)?.id : null;
      const params = new URLSearchParams();
      params.append('format', format);
      if (targetCurrencyId) {
        params.append('target_currency_id', targetCurrencyId.toString());
      }
      const url = `${import.meta.env.VITE_API_URL}/reports/${reportId}/export?${params.toString()}`;
      const response = await fetch(url, {
        credentials: 'include'
      });
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorData;
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = { error: `Failed to download report: Server returned status ${response.status}` };
        }
        handleOperationError(errorData.error || `Failed to download report.`, errorData);
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
        description: `Report downloaded successfully in ${format.toUpperCase()} format!`,
        variant: "default",
      });
    } catch (err) {
      handleOperationError(`An unexpected error occurred while downloading the report.`, err);
    } finally {
      setIsLoadingDownload(false);
    }
  }, [handleOperationError, toast, selectedCurrency, currencies]);

  // Updated download handlers for generated reports
  const downloadGeneratedReportPDF = useCallback(() => {
    if (generatedReport?.download_links?.pdf_url) {
      const a = document.createElement('a');
      a.href = generatedReport.download_links.pdf_url;
      a.download = `report_${generatedReport.report_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast({
        title: "Download Initiated",
        description: "PDF download started.",
        variant: "default",
      });
    }
  }, [generatedReport, toast]);

  const downloadGeneratedReportCSV = useCallback(() => {
    if (generatedReport?.download_links?.csv_url) {
      const a = document.createElement('a');
      a.href = generatedReport.download_links.csv_url;
      a.download = `report_${generatedReport.report_id}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast({
        title: "Download Initiated",
        description: "CSV download started.",
        variant: "default",
      });
    }
  }, [generatedReport, toast]);

  // --- Recharts Custom Components ---
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currencySymbol = generatedReport?.report_data_summary?.currency_symbol || 'KSh';
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
                {entry.name}: {entry.name.toLowerCase().includes('revenue') ? `${currencySymbol}${entry.value?.toLocaleString()}` : entry.value}
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

  // --- ReportCard Component ---
  const ReportCard: React.FC<{
    report: Report;
    onDownload: (reportId: string, format: string) => void;
    isDownloading: boolean;
    currencies: Currency[];
  }> = ({ report, onDownload, isDownloading, currencies }) => {
    const totalRevenue = extractRevenueData(report);
    const hasConversion = report.currency_conversion?.conversion_successful ?? false;
    const convertedRevenue = hasConversion ? report.currency_conversion?.converted_amount ?? 0 : 0;
    const displayRevenue = hasConversion && convertedRevenue > 0 ? convertedRevenue : totalRevenue;
    const { currencyCode, currencySymbol } = extractCurrencyData(report, currencies);
    const displayCurrencyCode = hasConversion ? report.currency_conversion?.converted_currency ?? report.currency_conversion?.target_currency : currencyCode;
    const displayCurrencySymbol = hasConversion ?
      currencies.find(c => c.code === displayCurrencyCode)?.symbol ?? currencySymbol :
      currencySymbol;

    const formatDate = (dateString: string | undefined) => {
      if (!dateString) return 'N/A';
      try {
        return new Date(dateString).toLocaleDateString();
      } catch {
        return dateString;
      }
    };

    const { event_name = 'Unknown Event', event_date, event_location } = report.report_data || {};

    return (
      <Card className="shadow-md hover:shadow-lg transition-all dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg dark:text-gray-200 text-gray-800">
                Report #{report.id}
              </CardTitle>
              <CardDescription className="dark:text-gray-400 text-gray-600">
                Generated on {formatDate(report.created_at)}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Event Date</p>
              <p className="text-sm font-medium dark:text-gray-200 text-gray-800">
                {formatDate(event_date ?? report.report_date)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg dark:bg-gray-700 dark:border-gray-600 bg-gray-50 border border-gray-200">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Revenue</p>
              <p className="text-lg font-bold text-[#10b981]">
                {displayCurrencySymbol}{displayRevenue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
              {hasConversion && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Converted to {displayCurrencyCode}
                </p>
              )}
            </div>
          </div>
          <div className="border-t pt-3 dark:border-gray-700 border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm dark:text-gray-300 text-gray-700">{event_name}</span>
            </div>
            {event_location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm dark:text-gray-300 text-gray-700">{event_location}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onDownload(report.id.toString(), 'pdf')}
              disabled={isDownloading}
              size="sm"
              className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white"
            >
              <Download className="mr-1 h-3 w-3" />
              PDF
            </Button>
            <Button
              onClick={() => onDownload(report.id.toString(), 'csv')}
              disabled={isDownloading}
              size="sm"
              variant="outline"
              className="flex-1 dark:border-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Download className="mr-1 h-3 w-3" />
              CSV
            </Button>
          </div>
        </CardContent>
      </Card>
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
          <Loader2 className="h-12 w-12 animate-spin text-[#10b981]" />
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
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-500 to-[#10b981] bg-clip-text text-transparent">
              Event Analytics Dashboard
            </h1>
            {(reportData || initialReport) && (
              <>
                <h2 className={cn("text-xl md:text-2xl font-semibold dark:text-gray-200 text-gray-800")}>
                  {reportData?.event_name || initialReport?.event_name || `Event ID: ${eventId}`}
                </h2>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm dark:text-gray-400 text-gray-500">
                  {(reportData?.event_date || initialReport?.event_date) && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {reportData?.event_date || initialReport?.event_date}
                    </div>
                  )}
                  {(reportData?.event_location || initialReport?.event_location) && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {reportData?.event_location || initialReport?.event_location}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
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
                  onClick={fetchExchangeRates}
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
                    <SelectTrigger className={cn(
                      "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800",
                      "focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] dark:focus:ring-[#10b981] dark:focus:border-[#10b981] h-11"
                    )}>
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
                            "dark:text-gray-200 text-gray-800 focus:bg-[#10b981] focus:text-white hover:bg-[#10b981] hover:text-white",
                            "data-[state=checked]:bg-[#10b981] data-[state=checked]:text-white dark:data-[state=checked]:bg-[#10b981] dark:data-[state=checked]:text-white"
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
                {exchangeRates && selectedCurrency && selectedCurrency !== exchangeRates.base_currency && (
                  <div className="space-y-2">
                    <Label className="dark:text-gray-200 text-gray-800">Exchange Rate ({exchangeRates.base_currency} → {selectedCurrency})</Label>
                    <div className="p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 bg-gray-100 border-gray-300">
                      <div className="text-lg font-semibold dark:text-gray-200 text-gray-800">
                        1 {exchangeRates.base_currency} = {currencies.find(c => c.code === selectedCurrency)?.exchange_rate_from_ksh?.toFixed(4) || 'N/A'} {selectedCurrency}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Source: {currencies.find(c => c.code === selectedCurrency)?.rate_source || 'API'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Date Preference */}
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
                  className="dark:border-gray-500 dark:bg-gray-700 data-[state=checked]:bg-[#10b981] dark:data-[state=checked]:bg-[#10b981] data-[state=checked]:text-white dark:data-[state=checked]:text-white"
                />
                <label
                  htmlFor="useSpecificDate"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-200 text-gray-800"
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
                    className={cn(
                      "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800",
                      "focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] dark:focus:ring-[#10b981] dark:focus:border-[#10b981]",
                      "hover:border-[#10b981] dark:hover:border-[#10b981] transition-all w-full h-11"
                    )}
                  />
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2 w-full">
                    <Label htmlFor="startDate" className="dark:text-gray-200 text-gray-800">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={cn(
                        "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800",
                        "focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] dark:focus:ring-[#10b981] dark:focus:border-[#10b981]",
                        "hover:border-[#10b981] dark:hover:border-[#10b981] transition-all w-full h-11"
                      )}
                      max={endDate || undefined}
                    />
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    <Label htmlFor="endDate" className="dark:text-gray-200 text-gray-800">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={cn(
                        "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800",
                        "focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] dark:focus:ring-[#10b981] dark:focus:border-[#10b981]",
                        "hover:border-[#10b981] dark:hover:border-[#10b981] transition-all w-full h-11"
                      )}
                      min={startDate || undefined}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Email Configuration Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendEmail"
                checked={sendEmail}
                onCheckedChange={(checked: boolean) => setSendEmail(checked)}
                className="dark:border-gray-500 dark:bg-gray-700 data-[state=checked]:bg-[#10b981] dark:data-[state=checked]:bg-[#10b981] data-[state=checked]:text-white dark:data-[state=checked]:text-white"
              />
              <label
                htmlFor="sendEmail"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-200 text-gray-800"
              >
                Send report via email
              </label>
            </div>

            {/* Recipient Email Input - Only visible if sendEmail is checked */}
            {sendEmail && (
              <div className="space-y-2">
                <Label htmlFor="recipientEmail" className="dark:text-gray-200 text-gray-800">Recipient Email</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  placeholder="e.g., reports@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className={cn(
                    "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800",
                    "focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] dark:focus:ring-[#10b981] dark:focus:border-[#10b981]",
                    "hover:border-[#10b981] dark:hover:border-[#10b981] transition-all w-full h-11"
                  )}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Leave blank to send to your account's primary email address.
                </p>
              </div>
            )}

            {/* Generate and Fetch Report Buttons */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <Button
                onClick={generateReport}
                className="bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] hover:scale-105 transition-all flex items-center"
                disabled={isGeneratingReport || !canGenerateReport || (sendEmail && !recipientEmail)}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                {isGeneratingReport ? "Generating Report..." : "Generate Report"}
              </Button>
              <Button
                onClick={fetchReports}
                className="bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] hover:scale-105 transition-all flex items-center"
                disabled={isLoadingReport}
              >
                <FileText className="mr-2 h-4 w-4" />
                {isLoadingReport ? "Fetching Reports..." : "Fetch Reports"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Generated Report Summary */}
        {generatedReport && (
          <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
                <FileText className="h-5 w-5" />
                Latest Generated Report Summary
              </CardTitle>
              <CardDescription className="dark:text-gray-400 text-gray-600">
                Summary of the most recently generated report.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg dark:bg-gray-700 dark:border-gray-600 bg-gray-100 border-gray-300">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Converted Revenue</p>
                <p className="text-2xl font-bold text-[#10b981]">
                  {generatedReport.report_data_summary.currency_symbol} {generatedReport.report_data_summary.total_revenue_converted?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Converted from {generatedReport.currency_conversion.original_currency} at rate {generatedReport.currency_conversion.conversion_steps?.overall_conversion_rate?.toFixed(4)}</p>
              </div>
              <div className="p-4 border rounded-lg dark:bg-gray-700 dark:border-gray-600 bg-gray-100 border-gray-300">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Original Revenue</p>
                <p className="text-2xl font-bold text-[#10b981]">
                  {currencies.find(c => c.code === generatedReport.currency_conversion.original_currency)?.symbol || ''} {generatedReport.report_data_summary.total_revenue_original?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">In original event currency</p>
              </div>
            </CardContent>
            <CardContent>
              <div className="flex justify-center gap-4 mt-4">
                <Button
                  onClick={downloadGeneratedReportPDF}
                  disabled={isLoadingDownload}
                  className="bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] hover:scale-105 transition-all flex items-center"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button
                  onClick={downloadGeneratedReportCSV}
                  disabled={isLoadingDownload}
                  className="bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] hover:scale-105 transition-all flex items-center"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Report Visualizations */}
        {reportData && (
          <Tabs defaultValue="revenue" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 dark:bg-gray-700 dark:border-gray-600 bg-gray-200 border-gray-300">
              <TabsTrigger value="revenue" className="dark:data-[state=active]:bg-[#10b981] dark:data-[state=active]:text-white data-[state=active]:bg-[#10b981] data-[state=active]:text-white dark:text-gray-200 text-gray-800">
                <DollarSign className="h-4 w-4 mr-2" /> Revenue
              </TabsTrigger>
              <TabsTrigger value="payments" className="dark:data-[state=active]:bg-[#10b981] dark:data-[state=active]:text-white data-[state=active]:bg-[#10b981] data-[state=active]:text-white dark:text-gray-200 text-gray-800">
                <Mail className="h-4 w-4 mr-2" /> Payment Methods
              </TabsTrigger>
            </TabsList>

            {/* Revenue Tab */}
            <TabsContent value="revenue" className="mt-4">
              <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200")}>
                <CardHeader>
                  <CardTitle className="dark:text-gray-200 text-gray-800">Revenue by Ticket Type</CardTitle>
                  <CardDescription className="dark:text-gray-400 text-gray-600">Breakdown of revenue generated from each ticket category.</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {isGeneratingReport && !revenueChartData.length ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
                      <span className="ml-2 text-gray-500 dark:text-gray-400">Loading chart data...</span>
                    </div>
                  ) : revenueChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      {activeChart === 'bar' ? (
                        <BarChart data={revenueChartData}>
                          <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700 stroke-gray-300" />
                          <XAxis dataKey="name" className="dark:text-gray-200 text-gray-800" />
                          <YAxis
                            tickFormatter={(value) => `${generatedReport?.report_data_summary?.currency_symbol || '$'}${value?.toLocaleString()}`}
                            className="dark:text-gray-200 text-gray-800"
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="value" fill="#10b981" name="Revenue" />
                        </BarChart>
                      ) : (
                        <PieChart>
                          <Pie
                            data={revenueChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
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
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      <FileText className="h-8 w-8 mb-2" />
                      <p>No revenue data available for this period.</p>
                      <p className="text-sm mt-1">Try generating a report or selecting a different date range.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment Methods Tab */}
            <TabsContent value="payments" className="mt-4">
              <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200")}>
                <CardHeader>
                  <CardTitle className="dark:text-gray-200 text-gray-800">Payment Method Usage</CardTitle>
                  <CardDescription className="dark:text-gray-400 text-gray-600">Overview of how attendees paid for their tickets.</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {isGeneratingReport && !paymentMethodChartData.length ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
                      <span className="ml-2 text-gray-500 dark:text-gray-400">Loading chart data...</span>
                    </div>
                  ) : paymentMethodChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      {activeChart === 'bar' ? (
                        <BarChart data={paymentMethodChartData}>
                          <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700 stroke-gray-300" />
                          <XAxis dataKey="name" className="dark:text-gray-200 text-gray-800" />
                          <YAxis className="dark:text-gray-200 text-gray-800" />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="value" fill="#10b981" name="Transactions" />
                        </BarChart>
                      ) : (
                        <PieChart>
                          <Pie
                            data={paymentMethodChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
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
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      <FileText className="h-8 w-8 mb-2" />
                      <p>No payment method data available for this period.</p>
                      <p className="text-sm mt-1">Try generating a report or selecting a different date range.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Reports List Section */}
        <div className="space-y-6">
          {isLoadingReport ? (
            <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200")}>
              <CardContent className="flex flex-col items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
                <p className="mt-4 text-gray-600 dark:text-gray-400">Fetching latest reports...</p>
              </CardContent>
            </Card>
          ) : reports.length === 0 ? (
            <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
                  <FileText className="h-5 w-5" />
                  Recent Reports
                </CardTitle>
                <CardDescription className="dark:text-gray-400 text-gray-600">
                  Latest 5 reports for this event
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">No reports found for this event</p>
                <Button
                  onClick={fetchReports}
                  variant="outline"
                  className="dark:border-gray-600 dark:text-gray-200"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200")}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
                      <FileText className="h-5 w-5" />
                      Recent Reports ({reports.length})
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400 text-gray-600">
                      Latest reports for this event (showing most recent first)
                    </CardDescription>
                  </div>
                  <Button
                    onClick={fetchReports}
                    variant="outline"
                    size="sm"
                    disabled={isLoadingReport}
                    className="dark:border-gray-600 dark:text-gray-200"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {reports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onDownload={downloadReportFromUrl}
                    isDownloading={isLoadingDownload}
                    currencies={currencies}
                  />
                ))}
                {reports.length === 5 && (
                  <div className="text-center pt-4 border-t dark:border-gray-700 border-gray-200">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Showing latest 5 reports. Generate a new report to see more recent data.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions
const extractRevenueData = (report: Report) => {
  const revenue = report.report_data?.total_revenue ?? report.total_revenue ?? 0;
  if (revenue === 0) {
    console.warn('No revenue found for report:', {
      reportId: report.id,
      report_data_revenue: report.report_data?.total_revenue,
      top_level_revenue: report.total_revenue,
      available_keys: Object.keys(report)
    });
  }
  return revenue;
};

const extractCurrencyData = (report: Report, currencies: Currency[]) => {
  const currencyCode = report.report_data?.currency ?? report.currency ?? report.currency_code ?? 'KES';
  const currencySymbol = report.report_data?.currency_symbol ??
                        currencies.find(c => c.code === currencyCode)?.symbol ??
                        'KSh';
  return { currencyCode, currencySymbol };
};

export default OrganizerReports;
