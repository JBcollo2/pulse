import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Assuming you have this or similar for date inputs
import { Label } from "@/components/ui/label"; // Assuming you have this for labels
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, AlertCircle, FileText, Download, Mail, PieChart } from "lucide-react"; // Added icons for better UX

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
    // The '_for_graph' properties seem redundant if you're transforming the object directly for Recharts
    // If your backend *only* sends data in this specific pre-formatted way, then keep them.
    // Otherwise, it's better to process 'tickets_sold_by_type' etc. directly for graphs.
    // Assuming we will process the object directly for Recharts
}

// Define the props interface for the OrganizerReports component
interface OrganizerReportsProps {
    eventId: number;
    eventReport?: EventReport | null; // Optional prop for initial data (e.g., if passed from a parent)
}

const OrganizerReports: React.FC<OrganizerReportsProps> = ({ eventId, eventReport: initialReport = null }) => {
    const [reportData, setReportData] = useState<EventReport | null>(initialReport);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null); // Changed to null for consistency
    const { toast } = useToast();

    // Utility function for consistent error handling
    const handleOperationError = useCallback((message: string, err?: any) => {
        console.error('Operation error:', message, err);
        setError(message);
        toast({
            title: "Error",
            description: err?.message || message,
            variant: "destructive",
        });
    }, [toast]);

    const fetchReport = useCallback(async () => {
        setIsLoading(true);
        setError(null); // Clear previous errors
        setReportData(null); // Clear previous data

        try {
            let url = `${import.meta.env.VITE_API_URL}/event/${eventId}/report`;
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (startDate || endDate) url += `?${params.toString()}`;

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
            setIsLoading(false);
        }
    }, [eventId, startDate, endDate, handleOperationError, toast]);

    useEffect(() => {
        // Fetch report only if eventId is provided and no initialReport is given
        if (eventId && !initialReport) {
            fetchReport();
        } else if (initialReport) {
            // If an initial report is provided, use it directly
            setReportData(initialReport);
            setIsLoading(false); // Ensure loading is false if data is pre-populated
        }
    }, [eventId, fetchReport, initialReport]);

    const downloadReport = useCallback(async (format: 'pdf' | 'csv') => {
        setIsLoading(true); // Can use a separate loading state for downloads if needed
        setError(null);

        try {
            let url = `${import.meta.env.VITE_API_URL}/event/${eventId}/report/download/${format}`;
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (startDate || endDate) url += `?${params.toString()}`;

            const response = await fetch(url, {
                credentials: 'include'
            });

            if (response.ok) {
                const blob = await response.blob();
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = `event_report_${eventId}.${format}`;
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
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
            setIsLoading(false);
        }
    }, [eventId, startDate, endDate, handleOperationError, toast]);

    const resendReportEmail = useCallback(async () => {
        if (!window.confirm("Are you sure you want to resend the report email? This might trigger a notification to relevant parties.")) {
            return;
        }

        setIsLoading(true); // Can use a separate loading state for email if needed
        setError(null);

        try {
            let url = `${import.meta.env.VITE_API_URL}/event/${eventId}/report/resend-email`;
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (startDate || endDate) url += `?${params.toString()}`;

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
            setIsLoading(false);
        }
    }, [eventId, startDate, endDate, handleOperationError, toast]);

    // Helper to format data for Recharts from object to array of { name: label, value: number }
    const formatChartData = (data: { [key: string]: number }) => {
        return Object.entries(data).map(([label, value]) => ({ name: label, value }));
    };

    // --- Loading State ---
    if (isLoading && !reportData) { // Only show full loading screen if no data is present
        return (
            <Card className="max-w-3xl mx-auto my-8">
                <CardHeader>
                    <CardTitle>Event Report</CardTitle>
                    <CardDescription>Loading event report data...</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-64">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-lg text-muted-foreground">Fetching event insights...</p>
                </CardContent>
            </Card>
        );
    }

    // --- Error State ---
    if (error) {
        return (
            <Card className="max-w-3xl mx-auto my-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-6 w-6" /> Error Loading Report
                    </CardTitle>
                    <CardDescription>We encountered an issue fetching the event report.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-destructive font-medium text-sm mb-4">{error}</p>
                    <Button onClick={fetchReport} className="w-full">
                        <Loader2 className={isLoading ? "mr-2 h-4 w-4 animate-spin" : "hidden"} />
                        Retry Loading Report
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // --- No Report Data State (after loading and no error) ---
    if (!reportData) {
        return (
            <Card className="max-w-3xl mx-auto my-8">
                <CardHeader>
                    <CardTitle>Event Report</CardTitle>
                    <CardDescription>No report data available.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground h-32 flex items-center justify-center">
                        It looks like there's no report generated for this event yet, or no data matches your filters.
                    </p>
                    <Button onClick={fetchReport} className="w-full mt-4">
                         Generate Report
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Prepare chart data (ensure default empty arrays if data is missing)
    const ticketsSoldChartData = reportData.tickets_sold_by_type ? formatChartData(reportData.tickets_sold_by_type) : [];
    const revenueChartData = reportData.revenue_by_ticket_type ? formatChartData(reportData.revenue_by_ticket_type) : [];
    const paymentMethodChartData = reportData.payment_method_usage ? formatChartData(reportData.payment_method_usage) : [];

    return (
        <div className="space-y-8 p-6 lg:p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between space-y-2 flex-wrap gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">
                        Event Report: {reportData.event_name}
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Detailed analytics for your event.
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                        Event Date: {reportData.event_date} | Location: {reportData.event_location}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        variant="outline"
                        onClick={() => downloadReport('pdf')}
                        disabled={isLoading}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        {isLoading ? "Downloading..." : "Download PDF"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => downloadReport('csv')}
                        disabled={isLoading}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        {isLoading ? "Downloading..." : "Download CSV"}
                    </Button>
                    <Button
                        onClick={resendReportEmail}
                        disabled={isLoading}
                    >
                        <Mail className="mr-2 h-4 w-4" />
                        {isLoading ? "Sending..." : "Resend Email"}
                    </Button>
                </div>
            </div>

            {/* --- Date Filters --- */}
            <Card>
                <CardHeader>
                    <CardTitle>Filter Report by Date</CardTitle>
                    <CardDescription>Adjust the time range for the report data.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <Button onClick={fetchReport} className="sm:ml-4 min-w-[120px]" disabled={isLoading}>
                            <Loader2 className={isLoading ? "mr-2 h-4 w-4 animate-spin" : "hidden"} />
                            Apply Filter
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* --- Summary Cards --- */}
            <h2 className="text-2xl font-bold tracking-tight">Summary Overview</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tickets Sold</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{reportData.total_tickets_sold}</div>
                        <p className="text-xs text-muted-foreground">+20.1% from last month</p> {/* Placeholder for dynamic data */}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <PieChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">${reportData.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">+15.5% from last month</p> {/* Placeholder for dynamic data */}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Number of Attendees</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87L16 14a4 4 0 0 0-3 3.87v2" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{reportData.number_of_attendees}</div>
                        <p className="text-xs text-muted-foreground">+5.2% from last month</p> {/* Placeholder for dynamic data */}
                    </CardContent>
                </Card>
            </div>

            {/* --- Detailed Charts --- */}
            <h2 className="text-2xl font-bold tracking-tight">Detailed Breakdown</h2>
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Tickets Sold by Type</CardTitle>
                        <CardDescription>Distribution of tickets sold across different types.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {ticketsSoldChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={ticketsSoldChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} style={{ fontSize: '12px' }} />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                                        contentStyle={{ backgroundColor: "#1e293b", border: 'none', borderRadius: "8px", fontSize: '14px', padding: '8px' }}
                                        itemStyle={{ color: '#ffffff' }}
                                        labelStyle={{ color: '#a0aec0' }}
                                        formatter={(value: number) => [`${value} Tickets`, 'Count']}
                                    />
                                    <Legend />
                                    <Bar dataKey="value" fill="hsl(var(--primary))" name="Tickets Sold" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">No ticket sales data available for this period.</div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Revenue by Ticket Type</CardTitle>
                        <CardDescription>Revenue generated from each ticket category.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {revenueChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} style={{ fontSize: '12px' }} />
                                    <YAxis tickFormatter={(value: number) => `$${value.toFixed(2)}`} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                                        contentStyle={{ backgroundColor: "#1e293b", border: 'none', borderRadius: "8px", fontSize: '14px', padding: '8px' }}
                                        itemStyle={{ color: '#ffffff' }}
                                        labelStyle={{ color: '#a0aec0' }}
                                        formatter={(value: number) => [`$${value.toFixed(2)} Revenue`, 'Amount']}
                                    />
                                    <Legend />
                                    <Bar dataKey="value" fill="hsl(var(--secondary))" name="Revenue" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">No revenue data available for this period.</div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Attendees by Ticket Type</CardTitle>
                        <CardDescription>Number of attendees associated with each ticket type.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {reportData.attendees_by_ticket_type && Object.keys(reportData.attendees_by_ticket_type).length > 0 ? (
                             <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={formatChartData(reportData.attendees_by_ticket_type)} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} style={{ fontSize: '12px' }} />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                                        contentStyle={{ backgroundColor: "#1e293b", border: 'none', borderRadius: "8px", fontSize: '14px', padding: '8px' }}
                                        itemStyle={{ color: '#ffffff' }}
                                        labelStyle={{ color: '#a0aec0' }}
                                        formatter={(value: number) => [`${value} Attendees`, 'Count']}
                                    />
                                    <Legend />
                                    <Bar dataKey="value" fill="hsl(var(--accent))" name="Attendees" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">No attendee data available by ticket type for this period.</div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Payment Method Usage</CardTitle>
                        <CardDescription>Breakdown of transactions by payment method.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {paymentMethodChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={paymentMethodChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} style={{ fontSize: '12px' }} />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                                        contentStyle={{ backgroundColor: "#1e293b", border: 'none', borderRadius: "8px", fontSize: '14px', padding: '8px' }}
                                        itemStyle={{ color: '#ffffff' }}
                                        labelStyle={{ color: '#a0aec0' }}
                                        formatter={(value: number) => [`${value} Transactions`, 'Count']}
                                    />
                                    <Legend />
                                    <Bar dataKey="value" fill="hsl(var(--info))" name="Transactions" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">No payment method usage data available for this period.</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default OrganizerReports;