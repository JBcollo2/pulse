import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  DollarSign,
  Globe,
  ArrowUpDown,
  RefreshCw,
  Loader2,
  TrendingUp,
  Users,
  FileText,
  AlertCircle,
  ChevronDown,
  Calendar,
  Building,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

// Color scheme for charts
const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// Interfaces
interface Organizer {
  id: number;
  name: string;
}

interface Event {
  id: number;
  name: string;
  date?: string;
  status?: string;
}

interface ReportData {
  event_id: number;
  event_name: string;
  total_revenue: number;
  total_tickets: number;
  ticket_breakdown: Array<{
    ticket_type: string;
    count: number;
    revenue: number;
  }>;
  timestamp: string;
}

interface ConvertedReport {
  original_amount: number;
  converted_amount: number;
  from_currency: string;
  to_currency: string;
  exchange_rate: number;
  conversion_date: string;
}

interface DashboardStats {
  totalRevenue: number;
  convertedRevenue: number;
  totalTickets: number;
  exchangeRate: number;
  ticketBreakdown: Array<{
    name: string;
    value: number;
    revenue: number;
  }>;
}

// Custom Components
const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, disabled = false, className = "", variant = "default" }) => {
  const baseClasses = "px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2";
  const variants = {
    default: "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400",
    success: "bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Select = ({ value, onChange, options, placeholder = "Select...", loading = false, className = "" }) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading}
      className="w-full px-4 py-2 pr-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white disabled:opacity-50"
    >
      <option value="">{loading ? "Loading..." : placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
  </div>
);

const Toast = ({ message, type = "success", onClose }) => (
  <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
    type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
  }`}>
    <div className="flex items-center gap-2">
      {type === 'success' ? (
        <div className="h-4 w-4 bg-green-200 rounded-full flex items-center justify-center">
          <div className="h-2 w-2 bg-green-600 rounded-full"></div>
        </div>
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">×</button>
    </div>
  </div>
);

const SystemReports = () => {
  // State management
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [selectedOrganizer, setSelectedOrganizer] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [baseCurrency] = useState<string>('USD');

  // Data states
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [convertedReport, setConvertedReport] = useState<ConvertedReport | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalRevenue: 0,
    convertedRevenue: 0,
    totalTickets: 0,
    exchangeRate: 1,
    ticketBreakdown: []
  });

  // Loading states
  const [isLoadingOrganizers, setIsLoadingOrganizers] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string>('');

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Toast notification helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Fetch organizers
  useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        setIsLoadingOrganizers(true);
        // Simulate API call with mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockOrganizers = [
          { id: 1, name: 'EventCorp Solutions' },
          { id: 2, name: 'Premier Events Ltd' },
          { id: 3, name: 'Global Conferences Inc' },
          { id: 4, name: 'TechMeet Organizers' }
        ];
        setOrganizers(mockOrganizers);
      } catch (error) {
        setError('Failed to fetch organizers');
        console.error('Error fetching organizers:', error);
      } finally {
        setIsLoadingOrganizers(false);
      }
    };
    fetchOrganizers();
  }, []);

  // Fetch events when organizer changes
  useEffect(() => {
    const fetchEvents = async () => {
      if (!selectedOrganizer) {
        setEvents([]);
        return;
      }

      setIsLoadingEvents(true);
      try {
        // Simulate API call with mock data
        await new Promise(resolve => setTimeout(resolve, 800));
        const mockEvents = [
          { id: 1, name: 'Annual Tech Conference 2024', date: '2024-03-15', status: 'completed' },
          { id: 2, name: 'Spring Product Launch', date: '2024-04-20', status: 'completed' },
          { id: 3, name: 'Summer Networking Event', date: '2024-06-10', status: 'completed' },
          { id: 4, name: 'Q4 Business Summit', date: '2024-11-05', status: 'upcoming' }
        ];
        setEvents(mockEvents);
      } catch (error) {
        setError('Failed to fetch events');
        console.error('Error fetching events:', error);
      } finally {
        setIsLoadingEvents(false);
      }
    };
    fetchEvents();
  }, [selectedOrganizer]);

  // Fetch currencies
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        setIsLoadingCurrencies(true);
        // Simulate API call with mock data
        await new Promise(resolve => setTimeout(resolve, 600));
        const mockCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'KES', 'NGN'];
        setCurrencies(mockCurrencies);
      } catch (error) {
        setError('Failed to fetch currencies');
        console.error('Error fetching currencies:', error);
      } finally {
        setIsLoadingCurrencies(false);
      }
    };
    fetchCurrencies();
  }, []);

  // Fetch exchange rate when currency changes
  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (selectedCurrency === baseCurrency) {
        setDashboardStats(prev => ({ ...prev, exchangeRate: 1 }));
        return;
      }

      try {
        // Simulate API call with mock exchange rates
        await new Promise(resolve => setTimeout(resolve, 400));
        const mockRates = {
          EUR: 0.85,
          GBP: 0.73,
          JPY: 110.25,
          CAD: 1.25,
          AUD: 1.35,
          CHF: 0.92,
          CNY: 6.45,
          KES: 110.50,
          NGN: 415.75
        };
        const rate = mockRates[selectedCurrency] || 1;
        setDashboardStats(prev => ({
          ...prev,
          exchangeRate: rate,
          convertedRevenue: prev.totalRevenue * rate
        }));
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
        setDashboardStats(prev => ({ ...prev, exchangeRate: 1 }));
      }
    };
    fetchExchangeRate();
  }, [selectedCurrency, baseCurrency]);

  // Fetch report data
  const fetchReportData = useCallback(async () => {
    if (!selectedOrganizer || !selectedEvent) {
      showToast('Please select both organizer and event', 'error');
      return;
    }
    setIsLoadingReport(true);
    setError('');

    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Mock report data
      const mockReport = {
        event_id: parseInt(selectedEvent),
        event_name: events.find(e => e.id === parseInt(selectedEvent))?.name || 'Unknown Event',
        total_revenue: Math.floor(Math.random() * 50000) + 10000,
        total_tickets: Math.floor(Math.random() * 500) + 100,
        ticket_breakdown: [
          { ticket_type: 'VIP', count: Math.floor(Math.random() * 50) + 20, revenue: Math.floor(Math.random() * 10000) + 5000 },
          { ticket_type: 'Standard', count: Math.floor(Math.random() * 200) + 100, revenue: Math.floor(Math.random() * 15000) + 8000 },
          { ticket_type: 'Student', count: Math.floor(Math.random() * 100) + 50, revenue: Math.floor(Math.random() * 5000) + 2000 },
          { ticket_type: 'Early Bird', count: Math.floor(Math.random() * 80) + 30, revenue: Math.floor(Math.random() * 8000) + 3000 }
        ],
        timestamp: new Date().toISOString()
      };
      const ticketBreakdownArray = mockReport.ticket_breakdown.map(item => ({
        name: item.ticket_type,
        value: item.count,
        revenue: item.revenue
      }));
      setReportData(mockReport);
      setDashboardStats(prev => ({
        ...prev,
        totalRevenue: mockReport.total_revenue,
        totalTickets: mockReport.total_tickets,
        convertedRevenue: mockReport.total_revenue * prev.exchangeRate,
        ticketBreakdown: ticketBreakdownArray
      }));
      showToast('Report data loaded successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch report data';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoadingReport(false);
    }
  }, [selectedOrganizer, selectedEvent, events]);

  // Convert revenue to selected currency
  const convertRevenue = async () => {
    if (!reportData) {
      showToast('No report data to convert', 'error');
      return;
    }
    setIsConverting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const convertedAmount = reportData.total_revenue * dashboardStats.exchangeRate;

      setConvertedReport({
        original_amount: reportData.total_revenue,
        converted_amount: convertedAmount,
        from_currency: baseCurrency,
        to_currency: selectedCurrency,
        exchange_rate: dashboardStats.exchangeRate,
        conversion_date: new Date().toISOString()
      });
      setDashboardStats(prev => ({
        ...prev,
        convertedRevenue: convertedAmount
      }));
      showToast(`Revenue converted successfully to ${selectedCurrency}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to convert revenue';
      showToast(errorMessage, 'error');
    } finally {
      setIsConverting(false);
    }
  };

  // Load report when dependencies change
  useEffect(() => {
    if (selectedOrganizer && selectedEvent) {
      fetchReportData();
    }
  }, [selectedOrganizer, selectedEvent, fetchReportData]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                System Reports Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Generate comprehensive reports for events and manage currency conversions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Report Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Organizer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Organizer
                </label>
                <Select
                  value={selectedOrganizer}
                  onChange={setSelectedOrganizer}
                  options={organizers.map(org => ({ value: org.id.toString(), label: org.name }))}
                  placeholder="Choose organizer..."
                  loading={isLoadingOrganizers}
                />
              </div>
              {/* Event Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Event
                </label>
                <Select
                  value={selectedEvent}
                  onChange={setSelectedEvent}
                  options={events.map(event => ({ value: event.id.toString(), label: event.name }))}
                  placeholder="Choose event..."
                  loading={isLoadingEvents}
                />
              </div>
              {/* Currency Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Currency
                </label>
                <Select
                  value={selectedCurrency}
                  onChange={setSelectedCurrency}
                  options={currencies.map(currency => ({ value: currency, label: currency }))}
                  placeholder="Choose currency..."
                  loading={isLoadingCurrencies}
                />
              </div>
              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={fetchReportData}
                  disabled={!selectedOrganizer || !selectedEvent || isLoadingReport}
                  className="w-full"
                >
                  {isLoadingReport ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Generate Report
                </Button>

                <Button
                  onClick={convertRevenue}
                  disabled={!reportData || isConverting || selectedCurrency === baseCurrency}
                  variant="success"
                  className="w-full"
                >
                  {isConverting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <DollarSign className="h-4 w-4" />
                  )}
                  Convert Revenue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exchange Rate Display */}
        {selectedCurrency !== baseCurrency && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                <Globe className="h-6 w-6 text-blue-600" />
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Exchange Rate</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    1 {baseCurrency} = {dashboardStats.exchangeRate.toFixed(4)} {selectedCurrency}
                  </p>
                </div>
                <ArrowUpDown className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    Total Revenue ({baseCurrency})
                  </p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    ${dashboardStats.totalRevenue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    Converted Revenue ({selectedCurrency})
                  </p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {selectedCurrency === 'JPY' ? '¥' : selectedCurrency === 'EUR' ? '€' : selectedCurrency === 'GBP' ? '£' : '$'}
                    {dashboardStats.convertedRevenue.toLocaleString(undefined, {
                      minimumFractionDigits: selectedCurrency === 'JPY' ? 0 : 2,
                      maximumFractionDigits: selectedCurrency === 'JPY' ? 0 : 2
                    })}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Total Tickets Sold
                  </p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {dashboardStats.totalTickets.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                    Active Event
                  </p>
                  <p className="text-lg font-bold text-orange-700 dark:text-orange-300 truncate">
                    {reportData?.event_name || 'No Event Selected'}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {dashboardStats.ticketBreakdown.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Ticket Sales by Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardStats.ticketBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                        dataKey="name"
                        className="text-sm"
                        tick={{ fill: '#6B7280' }}
                      />
                      <YAxis
                        className="text-sm"
                        tick={{ fill: '#6B7280' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                      />
                      <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardStats.ticketBreakdown}
                        dataKey="revenue"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {dashboardStats.ticketBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Conversion History */}
        {convertedReport && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" />
                Latest Currency Conversion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Original Amount</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      ${convertedReport.original_amount.toLocaleString()} {convertedReport.from_currency}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Exchange Rate</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      1 {convertedReport.from_currency} = {convertedReport.exchange_rate.toFixed(4)} {convertedReport.to_currency}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Converted Amount</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {convertedReport.to_currency === 'JPY' ? '¥' : convertedReport.to_currency === 'EUR' ? '€' : convertedReport.to_currency === 'GBP' ? '£' : '$'}
                      {convertedReport.converted_amount.toLocaleString(undefined, {
                        minimumFractionDigits: convertedReport.to_currency === 'JPY' ? 0 : 2,
                        maximumFractionDigits: convertedReport.to_currency === 'JPY' ? 0 : 2
                      })}
                    </p>
                  </div>
                </div>
                <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Converted on: {new Date(convertedReport.conversion_date).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SystemReports;
