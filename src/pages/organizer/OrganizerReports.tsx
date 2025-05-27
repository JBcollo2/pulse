import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  Loader2, AlertCircle, FileText, Download, Mail, PieChart as PieChartIcon,
  TrendingUp, Users, DollarSign, Calendar, MapPin, Filter, BarChart3,
  Eye, EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";

// Define the interface for the event report data
interface EventReport {
    event_id: number;
    event_name: string;
    total_tickets_sold: number;
    number_of_attendees: number;
    total_revenue: number;
    event_date: string; // ISO 8601 string, e.g., "2024-12-31"
    event_location: string;
    tickets_sold_by_type: { [key: string]: number };
    revenue_by_ticket_type: { [key: string]: number };
    attendees_by_ticket_type: { [key: string]: number };
    payment_method_usage: { [key: string]: number };
    // New fields from backend report
    filter_start_date?: string;
    filter_end_date?: string;
}

// Define the props interface for the OrganizerReports component
interface OrganizerReportsProps {
    eventId: number;
    eventReport?: EventReport | null; // Optional prop for initial data (e.g., if passed from a parent)
    darkMode: boolean; // Add the darkMode prop
}

// Enhanced color palettes
const CHART_COLORS = [
  '#8B5CF6', '#06D6A0', '#F59E0B', '#EF4444', '#3B82F6',
  '#EC4899', '#10B981', '#F97316', '#6366F1', '#84CC16'
];

const OrganizerReports: React.FC<OrganizerReportsProps> = ({ eventId, eventReport: initialReport = null, darkMode }) => {
    const [reportData, setReportData] = useState<EventReport | null>(initialReport);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false); // Specific for report fetch
    const [isLoadingDownload, setIsLoadingDownload] = useState<boolean>(false); // Specific for downloads
    const [isLoadingEmail, setIsLoadingEmail] = useState<boolean>(false); // Specific for email resend
    const [error, setError] = useState<string | null>(null);
    const [activeChart, setActiveChart] = useState<string>('bar');
    const [selectedView, setSelectedView] = useState<string>('overview');
    const { toast } = useToast();

    // Utility function for consistent error handling
    const handleOperationError = useCallback((message: string, err?: any) => {
        console.error('Operation error:', message, err);
        setError(message); // Set the error for display in the component
        toast({
            title: "Error",
            description: err?.message || message,
            variant: "destructive",
        });
    }, [toast]);

    // Derived state to determine if a report can be fetched/downloaded/emailed
    const canFetchReport = useMemo(() => {
        if (!startDate || !endDate) {
            return false;
        }
        // Basic date validation
        const start = new Date(startDate);
        const end = new Date(endDate);
        return start <= end;
    }, [startDate, endDate]);

    const fetchReport = useCallback(async () => {
        if (!canFetchReport) {
            setError("Please select valid start and end dates. Start date cannot be after end date.");
            toast({
                title: "Validation Error",
                description: "Please select valid start and end dates. Start date cannot be after end date.",
                variant: "destructive",
            });
            return;
        }

        setIsLoadingReport(true);
        setError(null); // Clear previous errors
        setReportData(null); // Clear previous data

        try {
            const params = new URLSearchParams();
            params.append('start_date', startDate);
            params.append('end_date', endDate);
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
    }, [eventId, startDate, endDate, canFetchReport, handleOperationError, toast]);

    // Initial load: Only load if an initial report is provided. Otherwise, wait for user input.
    useEffect(() => {
        if (initialReport) {
            setReportData(initialReport);
            // If initial report has filter dates, pre-fill the date inputs
            if (initialReport.filter_start_date) setStartDate(initialReport.filter_start_date);
            if (initialReport.filter_end_date) setEndDate(initialReport.filter_end_date);
            setIsLoadingReport(false);
        }
    }, [initialReport]);

    const downloadReport = useCallback(async (format: 'pdf' | 'csv') => {
        if (!canFetchReport) {
            setError("Please select valid start and end dates before downloading.");
            toast({
                title: "Validation Error",
                description: "Please select valid start and end dates before downloading.",
                variant: "destructive",
            });
            return;
        }

        setIsLoadingDownload(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            params.append('start_date', startDate);
            params.append('end_date', endDate);

            // Corrected URL structure based on your backend routes
            let url = '';
            if (format === 'pdf') {
                url = `${import.meta.env.VITE_API_URL}/reports/events/${eventId}/download/pdf?${params.toString()}`;
            } else if (format === 'csv') {
                url = `${import.meta.env.VITE_API_URL}/reports/events/${eventId}/export/csv?${params.toString()}`;
            } else {
                handleOperationError("Unsupported download format.");
                return;
            }

            const response = await fetch(url, {
                credentials: 'include'
            });

            if (response.ok) {
                const blob = await response.blob();
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = `event_report_${eventId}.${format}`;
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename="([^"]+)"/); // Correct regex for quotes
                    if (filenameMatch && filenameMatch[1]) {
                        filename = filenameMatch[1];
                    }
                }

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
                    description: `${format.toUpperCase()} report downloaded successfully!`,
                    variant: "default",
                });
            } else {
                const errorData = await response.json();
                handleOperationError(errorData.message || `Failed to download ${format} report.`, errorData);
            }
        } catch (err: any) {
            handleOperationError(`An unexpected error occurred while downloading the ${format} report.`, err);
        } finally {
            setIsLoadingDownload(false);
        }
    }, [eventId, startDate, endDate, canFetchReport, handleOperationError, toast]);

    const resendReportEmail = useCallback(async () => {
        if (!canFetchReport) {
            setError("Please select valid start and end dates before resending the email.");
            toast({
                title: "Validation Error",
                description: "Please select valid start and end dates before resending the email.",
                variant: "destructive",
            });
            return;
        }

        if (!window.confirm("Are you sure you want to resend the report email? This might trigger a notification to relevant parties.")) {
            return;
        }

        setIsLoadingEmail(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            params.append('start_date', startDate);
            params.append('end_date', endDate);
            const url = `${import.meta.env.VITE_API_URL}/reports/events/${eventId}/resend-email?${params.toString()}`;

            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                toast({
                    title: "Email Sent",
                    description: data.message || "Report email resent successfully!",
                    variant: "default",
                });
            } else {
                const errorData = await response.json();
                handleOperationError(errorData.message || "Failed to resend report email.", errorData);
            }
        } catch (err: any) {
            handleOperationError('An unexpected error occurred while resending the report email.', err);
        } finally {
            setIsLoadingEmail(false);
        }
    }, [eventId, startDate, endDate, canFetchReport, handleOperationError, toast]);

    // Enhanced chart data formatting with color assignment
    const formatChartData = useCallback((data: { [key: string]: number } | undefined) => {
        if (!data) return [];
        return Object.entries(data).map(([label, value], index) => ({
            name: label,
            value,
            color: CHART_COLORS[index % CHART_COLORS.length],
            percentage: 0 // Will be calculated
        }));
    }, []);

    // Calculate percentages for pie charts
    const calculatePercentages = useCallback((data: any[]) => {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        return data.map(item => ({
            ...item,
            percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
        }));
    }, []);

    // Chart data with percentages
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

    // Enhanced tooltip component
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className={cn(
                    "p-4 rounded-lg shadow-lg border backdrop-blur-sm",
                    darkMode ? "bg-gray-800/90 border-gray-600 text-white" : "bg-white/90 border-gray-200"
                )}>
                    <p className="font-semibold text-lg mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-1">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm">
                                {entry.name}: {entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Custom pie chart label
    const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        if (percent < 0.05) return null; // Hide labels for slices less than 5%

        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                className="text-xs font-medium"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    // --- Loading State for initial fetch ---
    if (isLoadingReport && !reportData && !error) { // Only show full loading screen if no data/error is present
        return (
            <Card className={cn("max-w-3xl mx-auto my-8", darkMode ? "bg-gray-800 border-gray-700 text-white" : "")}>
                <CardHeader>
                    <CardTitle>Event Report</CardTitle>
                    <CardDescription>Loading event report data...</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-64">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
                    <p className={cn("mt-4 text-lg", darkMode ? "text-gray-300" : "text-muted-foreground")}>Fetching event insights...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={cn("min-h-screen p-6 lg:p-8", darkMode ? "bg-gray-900 text-white" : "bg-gray-50")}>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            Event Analytics Dashboard
                        </h1>
                        {reportData && (
                            <>
                                <h2 className="text-2xl font-semibold">{reportData.event_name}</h2>
                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
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

                    {reportData && (
                        <div className="flex flex-wrap gap-3">
                            <Button
                                variant="outline"
                                onClick={() => downloadReport('pdf')}
                                disabled={isLoadingDownload || !canFetchReport}
                                className="hover:scale-105 transition-transform"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                {isLoadingDownload ? "Downloading..." : "PDF Report"}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => downloadReport('csv')}
                                disabled={isLoadingDownload || !canFetchReport}
                                className="hover:scale-105 transition-transform"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                {isLoadingDownload ? "Downloading..." : "CSV Export"}
                            </Button>
                            <Button
                                onClick={resendReportEmail}
                                disabled={isLoadingEmail || !canFetchReport}
                                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:scale-105 transition-all"
                            >
                                <Mail className="mr-2 h-4 w-4" />
                                {isLoadingEmail ? "Sending..." : "Email Report"}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Date Filter Section */}
                <Card className={cn("shadow-lg", darkMode ? "bg-gray-800 border-gray-700" : "bg-white")}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Date Range Filter
                        </CardTitle>
                        <CardDescription>Customize your report timeframe</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="transition-all hover:border-purple-400 focus:border-purple-500"
                                    max={endDate || undefined}
                                />
                            </div>
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="transition-all hover:border-purple-400 focus:border-purple-500"
                                    min={startDate || undefined}
                                />
                            </div>
                            <Button
                                onClick={fetchReport}
                                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 min-w-[140px] hover:scale-105 transition-all"
                                disabled={isLoadingReport || !canFetchReport}
                            >
                                {isLoadingReport ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                )}
                                Apply Filter
                            </Button>
                        </div>
                        {error && (
                            <p className="text-red-500 text-sm mt-4 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" /> {error}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {reportData ? (
                    <>
                        {/* Summary Cards */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <Card className={cn(
                                "hover:shadow-lg transition-all hover:scale-105",
                                darkMode
                                    ? "bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700"
                                    : "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
                            )}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                                    <FileText className="h-4 w-4 text-purple-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                                        {reportData.total_tickets_sold.toLocaleString()}
                                    </div>
                                    <div className="flex items-center text-xs text-green-600 mt-1">
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        Tickets sold
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className={cn(
                                "hover:shadow-lg transition-all hover:scale-105",
                                darkMode
                                    ? "bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700"
                                    : "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
                            )}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                    <DollarSign className="h-4 w-4 text-blue-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                                        ${reportData.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div className="flex items-center text-xs text-green-600 mt-1">
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        Revenue generated
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className={cn(
                                "hover:shadow-lg transition-all hover:scale-105",
                                darkMode
                                    ? "bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700"
                                    : "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
                            )}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Attendees</CardTitle>
                                    <Users className="h-4 w-4 text-green-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                                        {reportData.number_of_attendees.toLocaleString()}
                                    </div>
                                    <div className="flex items-center text-xs text-green-600 mt-1">
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        {((reportData.number_of_attendees / reportData.total_tickets_sold) * 100).toFixed(1)}% attendance rate
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className={cn(
                                "hover:shadow-lg transition-all hover:scale-105",
                                darkMode
                                    ? "bg-gradient-to-br from-orange-900/50 to-orange-800/30 border-orange-700"
                                    : "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
                            )}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Avg. Ticket Price</CardTitle>
                                    <PieChartIcon className="h-4 w-4 text-orange-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                                        ${(reportData.total_revenue / reportData.total_tickets_sold).toFixed(0)}
                                    </div>
                                    <div className="flex items-center text-xs text-green-600 mt-1">
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        Average price per ticket
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Section */}
                        <Tabs defaultValue="overview" className="space-y-6">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="tickets">Tickets & Attendees</TabsTrigger>
                                <TabsTrigger value="revenue">Revenue & Payments</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-6">
                                <div className="grid gap-6 lg:grid-cols-2">
                                    {/* Tickets Sold Pie Chart */}
                                    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow", darkMode ? "bg-gray-800 border-gray-700" : "bg-white")}>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <PieChartIcon className="h-5 w-5 text-purple-600" />
                                                Tickets Distribution
                                            </CardTitle>
                                            <CardDescription>Breakdown of tickets sold by type</CardDescription>
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
                                                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                                    No ticket sales data available for this period.
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Revenue Breakdown */}
                                    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow", darkMode ? "bg-gray-800 border-gray-700" : "bg-white")}>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="flex items-center gap-2">
                                                        <DollarSign className="h-5 w-5 text-green-600" />
                                                        Revenue by Type
                                                    </CardTitle>
                                                    <CardDescription>Revenue distribution across ticket categories</CardDescription>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant={activeChart === 'bar' ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setActiveChart('bar')}
                                                    >
                                                        Bar
                                                    </Button>
                                                    <Button
                                                        variant={activeChart === 'pie' ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setActiveChart('pie')}
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
                                                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                                    No revenue data available for this period.
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="tickets" className="space-y-6">
                                <div className="grid gap-6 lg:grid-cols-2">
                                    {/* Attendees by Ticket Type */}
                                    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow", darkMode ? "bg-gray-800 border-gray-700" : "bg-white")}>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Users className="h-5 w-5 text-green-600" />
                                                Attendees by Ticket Type
                                            </CardTitle>
                                            <CardDescription>Number of attendees associated with each ticket type</CardDescription>
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
                                                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                                    No attendee data available by ticket type for this period.
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Payment Method Usage */}
                                    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow", darkMode ? "bg-gray-800 border-gray-700" : "bg-white")}>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <DollarSign className="h-5 w-5 text-blue-600" />
                                                Payment Method Usage
                                            </CardTitle>
                                            <CardDescription>Breakdown of transactions by payment method</CardDescription>
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
                                                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                                    No payment method usage data available for this period.
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="revenue" className="space-y-6">
                                <div className="grid gap-6 lg:grid-cols-2">
                                    {/* Revenue by Ticket Type */}
                                    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow", darkMode ? "bg-gray-800 border-gray-700" : "bg-white")}>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <DollarSign className="h-5 w-5 text-green-600" />
                                                Revenue by Ticket Type
                                            </CardTitle>
                                            <CardDescription>Revenue generated from each ticket category</CardDescription>
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
                                                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                                    No revenue data available for this period.
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Payment Method Usage */}
                                    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow", darkMode ? "bg-gray-800 border-gray-700" : "bg-white")}>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <DollarSign className="h-5 w-5 text-blue-600" />
                                                Payment Method Usage
                                            </CardTitle>
                                            <CardDescription>Breakdown of transactions by payment method</CardDescription>
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
                                                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                                    No payment method usage data available for this period.
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </>
                ) : (
                    <Card className={cn("max-w-3xl mx-auto my-8", darkMode ? "bg-gray-800 border-gray-700 text-white" : "")}>
                        <CardHeader>
                            <CardTitle>No Report Data</CardTitle>
                            <CardDescription>Please select a date range and click "Apply Filter" to generate the report.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className={cn("text-center h-32 flex items-center justify-center", darkMode ? "text-gray-300" : "text-muted-foreground")}>
                                Once you select the dates and apply the filter, the report data and charts will appear here.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default OrganizerReports;
