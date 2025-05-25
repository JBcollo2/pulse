import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define the interface for the event report data
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
    tickets_sold_by_type_for_graph: { labels: string[], data: number[] };
    attendees_by_ticket_type_for_graph: { labels: string[], data: number[] };
    revenue_by_ticket_type_for_graph: { labels: string[], data: number[] };
    payment_method_usage_for_graph: { labels: string[], data: number[] };
}

// Define the props interface for the OrganizerReports component
interface OrganizerReportsProps {
    eventId: number;
    eventReport?: EventReport | null; // Optional prop
}

const OrganizerReports: React.FC<OrganizerReportsProps> = ({ eventId, eventReport: initialReport = null }) => {
    const [reportData, setReportData] = useState<EventReport | null>(initialReport);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | undefined>(undefined);
    const { toast } = useToast();

    const handleFetchError = useCallback(async (response: Response) => {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
        } catch (jsonError) {
            console.error('Failed to parse error response:', jsonError);
        }
        setError(errorMessage);
        toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
        });
    }, [toast]);

    const fetchReport = useCallback(async () => {
        setIsLoading(true);
        setError(undefined);
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
                await handleFetchError(response);
                return;
            }

            const data: EventReport = await response.json();
            setReportData(data);
            toast({
                title: "Success",
                description: "Event report fetched successfully.",
                variant: "default",
            });
        } catch (err) {
            console.error('Fetch event report error:', err);
            setError('An unexpected error occurred while fetching the event report.');
            toast({
                title: "Error",
                description: 'An unexpected error occurred while fetching the event report.',
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [eventId, startDate, endDate, handleFetchError, toast]);

    useEffect(() => {
        if (eventId && !initialReport) {
            fetchReport();
        } else if (initialReport) {
            setReportData(initialReport);
        }
    }, [eventId, fetchReport, initialReport]);

    const downloadReport = useCallback(async (format: 'pdf' | 'csv') => {
        setIsLoading(true);
        setError(undefined);
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
                let filename = `event_report.${format}`;
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
                    title: "Success",
                    description: `${format.toUpperCase()} report downloaded successfully!`,
                    variant: "default",
                });
            } else {
                await handleFetchError(response);
            }
        } catch (err) {
            console.error(`Error downloading ${format} report:`, err);
            setError(`An unexpected error occurred while downloading the ${format} report.`);
            toast({
                title: "Error",
                description: `An unexpected error occurred while downloading the ${format} report.`,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [eventId, startDate, endDate, handleFetchError, toast]);

    const resendReportEmail = useCallback(async () => {
        if (!window.confirm("Are you sure you want to resend the report email?")) {
            return;
        }

        setIsLoading(true);
        setError(undefined);
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
                    title: "Success",
                    description: data.message || "Report email resent successfully!",
                    variant: "default",
                });
            } else {
                await handleFetchError(response);
            }
        } catch (err) {
            console.error('Error resending report email:', err);
            setError('An unexpected error occurred while resending the report email.');
            toast({
                title: "Error",
                description: 'An unexpected error occurred while resending the report email.',
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [eventId, startDate, endDate, handleFetchError, toast]);

    const formatChartData = (data: { [key: string]: number }) => {
        return Object.entries(data).map(([label, value]) => ({ name: label, value }));
    };

    if (isLoading) return <p>Loading report data...</p>;
    if (error) return <p className="text-red-500">Error: {error}</p>;
    if (!reportData) return <p>No report data available for this event.</p>;

    const ticketsSoldChartData = formatChartData(reportData.tickets_sold_by_type);
    const revenueChartData = formatChartData(reportData.revenue_by_ticket_type);
    const paymentMethodChartData = formatChartData(reportData.payment_method_usage);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Report Filters</h2>
            <div className="flex gap-4 items-center">
                <label htmlFor="startDate">Start Date:</label>
                <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="p-2 border rounded"
                />
                <label htmlFor="endDate">End Date:</label>
                <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="p-2 border rounded"
                />
                <button onClick={fetchReport} className="px-4 py-2 bg-blue-500 text-white rounded">
                    Apply Filter
                </button>
            </div>

            <h2 className="text-2xl font-bold">Summary</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader><CardTitle>Total Tickets Sold</CardTitle></CardHeader>
                    <CardContent className="text-3xl font-bold">{reportData.total_tickets_sold}</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Total Revenue</CardTitle></CardHeader>
                    <CardContent className="text-3xl font-bold">${reportData.total_revenue.toFixed(2)}</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Number of Attendees</CardTitle></CardHeader>
                    <CardContent className="text-3xl font-bold">{reportData.number_of_attendees}</CardContent>
                </Card>
            </div>

            <h2 className="text-2xl font-bold">Detailed Breakdown</h2>

            <Card>
                <CardHeader><CardTitle>Tickets Sold by Type</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={ticketsSoldChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8" name="Tickets Sold" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Revenue by Ticket Type</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                            <Legend />
                            <Bar dataKey="value" fill="#82ca9d" name="Revenue" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Payment Method Usage</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={paymentMethodChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#ffc658" name="Transactions" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="flex gap-4">
                <button onClick={() => downloadReport('pdf')} className="px-4 py-2 bg-red-600 text-white rounded">
                    Download PDF Report
                </button>
                <button onClick={() => downloadReport('csv')} className="px-4 py-2 bg-green-600 text-white rounded">
                    Download CSV Report
                </button>
                <button onClick={resendReportEmail} className="px-4 py-2 bg-purple-600 text-white rounded">
                    Resend Report Email
                </button>
            </div>
        </div>
    );
};

export default OrganizerReports;
