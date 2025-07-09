import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle, FileText, RefreshCw, Globe, BarChart3 } from "lucide-react";
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

interface AdminReportsProps {
  organizerId?: number;
}

// --- AdminReports Component ---
const AdminReports: React.FC<AdminReportsProps> = ({ organizerId }) => {
  // --- State Variables ---
  const [reportData, setReportData] = useState<AdminReport | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState<boolean>(false);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // --- Helper Callbacks for Error Handling ---
  const handleOperationError = useCallback((message: string, err?: any) => {
    console.error('Operation error:', message, err);
    setError(message);
    toast({
      title: "Error",
      description: err?.message || message,
      variant: "destructive",
    });
  }, [toast]);

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

  const fetchAdminReports = useCallback(async () => {
    setIsLoadingReport(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (organizerId) params.append('organizer_id', organizerId.toString());

      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports?${params.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        handleOperationError(errorData.message || "Failed to fetch reports.", errorData);
        return;
      }
      const data = await response.json();
      setReportData(data);
      toast({
        title: "Reports Fetched",
        description: `Successfully fetched reports.`,
        variant: "default",
      });
    } catch (err: any) {
      handleOperationError("An unexpected error occurred while fetching reports.", err);
    } finally {
      setIsLoadingReport(false);
    }
  }, [organizerId, handleOperationError, toast]);

  // Fetch currencies on component mount
  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  // Fetch exchange rates when selectedCurrency changes
  useEffect(() => {
    if (selectedCurrency && selectedCurrency !== 'USD') {
      fetchExchangeRates('USD');
    } else {
      setExchangeRates(null);
    }
  }, [selectedCurrency, fetchExchangeRates]);

  // --- Main Component Render ---
  if (isLoadingCurrencies && !currencies.length) {
    return (
      <Card className={cn("max-w-3xl mx-auto my-8 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200 text-gray-800")}>
        <CardHeader>
          <CardTitle className="dark:text-gray-200 text-gray-800">Admin Report</CardTitle>
          <CardDescription className="dark:text-gray-400 text-gray-600">Loading initial data...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-[#10b981]" />
          <p className={cn("mt-4 text-lg dark:text-gray-400 text-gray-600")}>Fetching currencies and setup...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("min-h-screen p-4 md:p-6 lg:p-8 dark:bg-gray-900 dark:text-gray-200 bg-gray-50 text-gray-800")}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-500 to-[#10b981] bg-clip-text text-transparent">
              Admin Analytics Dashboard
            </h1>
            {reportData && (
              <h2 className={cn("text-xl md:text-2xl font-semibold dark:text-gray-200 text-gray-800")}>
                {reportData.organizer_name || `Organizer ID: ${organizerId}`}
              </h2>
            )}
          </div>
        </div>

        {/* Report Configuration Section */}
        <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
              <RefreshCw className="h-5 w-5" />
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
                        <SelectItem key={currency.id} value={currency.code} className="focus:bg-blue-100 dark:focus:bg-[#10b981]/20 dark:focus:text-[#10b981] data-[state=checked]:bg-[#10b981] data-[state=checked]:text-white dark:data-[state=checked]:bg-[#10b981] dark:data-[state=checked]:text-white">
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
                      <div className="text-xs text-gray-500 mt-1">
                        Source: {exchangeRates.source}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={fetchAdminReports}
              className="bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] hover:scale-105 transition-all flex items-center"
              disabled={isLoadingReport}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              {isLoadingReport ? "Fetching Reports..." : "Fetch Reports"}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Report Summary */}
        {reportData && (
          <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
                <FileText className="h-5 w-5" />
                Report Summary
              </CardTitle>
              <CardDescription className="dark:text-gray-400 text-gray-600">
                Summary of the reports for the selected organizer.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg dark:bg-gray-700 dark:border-gray-600 bg-gray-100 border-gray-300">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets Sold</p>
                <p className="text-2xl font-bold text-[#10b981]">{reportData.total_tickets_sold}</p>
              </div>
              <div className="p-4 border rounded-lg dark:bg-gray-700 dark:border-gray-600 bg-gray-100 border-gray-300">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-[#10b981]">
                  {reportData.currency_symbol} {reportData.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-4 border rounded-lg dark:bg-gray-700 dark:border-gray-600 bg-gray-100 border-gray-300">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Attendees</p>
                <p className="text-2xl font-bold text-[#10b981]">{reportData.total_attendees}</p>
              </div>
              <div className="p-4 border rounded-lg dark:bg-gray-700 dark:border-gray-600 bg-gray-100 border-gray-300">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Number of Events</p>
                <p className="text-2xl font-bold text-[#10b981]">{reportData.event_count}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
