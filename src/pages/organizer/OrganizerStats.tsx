import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';

// Define the interface for the overall summary data
interface OverallSummary {
    organizer_name: string;
    total_tickets_sold_across_all_events: number;
    total_revenue_across_all_events: number;
    events_details: {
        event_id: number;
        event_name: string;
        date: string;
        location: string;
        tickets_sold: number;
        revenue: number;
    }[];
    total_events?: number;
    upcoming_events_count?: number;
    past_events_count?: number;
    tickets_sold_monthly_trend?: { month: string; tickets: number }[];
    revenue_monthly_trend?: { month: string; revenue: number }[];
}

interface OrganizerStatsProps {
    overallSummary: OverallSummary | null;
    isLoading: boolean;
    error: string | undefined;
}

const OrganizerStats: React.FC<OrganizerStatsProps> = ({ overallSummary, isLoading, error }) => {
    if (isLoading) return <p>Loading overall statistics...</p>;
    if (error) return <p className="text-red-500">Error loading overall statistics: {error}</p>;
    if (!overallSummary) return <p>No overall statistics available.</p>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Overall Organizer Statistics</h1>
            <p className="text-muted-foreground text-lg">
                A comprehensive overview of your performance across all events.
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Tickets Sold</CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold text-primary">
                        {overallSummary.total_tickets_sold_across_all_events}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold text-green-600">
                        ${overallSummary.total_revenue_across_all_events.toFixed(2)}
                    </CardContent>
                </Card>
                {overallSummary.total_events !== undefined && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Total Events</CardTitle>
                        </CardHeader>
                        <CardContent className="text-3xl font-bold text-blue-600">
                            {overallSummary.total_events}
                        </CardContent>
                    </Card>
                )}
            </div>

            <h2 className="text-2xl font-bold mt-8">Event Breakdowns</h2>
            {overallSummary.events_details.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {overallSummary.events_details.map(event => (
                        <Card key={event.event_id}>
                            <CardHeader>
                                <CardTitle>{event.event_name}</CardTitle>
                                <CardDescription>{event.date} at {event.location}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p>Tickets Sold: {event.tickets_sold}</p>
                                <p>Revenue: ${event.revenue.toFixed(2)}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <p>No event breakdowns available.</p>
            )}

            {overallSummary.tickets_sold_monthly_trend && overallSummary.tickets_sold_monthly_trend.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Tickets Sold Trend</CardTitle>
                        <CardDescription>Tickets sold over the last few months.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={overallSummary.tickets_sold_monthly_trend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="tickets" stroke="#8884d8" activeDot={{ r: 8 }} name="Tickets Sold" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {overallSummary.revenue_monthly_trend && overallSummary.revenue_monthly_trend.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Revenue Trend</CardTitle>
                        <CardDescription>Revenue generated over the last few months.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={overallSummary.revenue_monthly_trend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(value: number) => `$${value}`} />
                                    <Tooltip formatter={(value: number) => [`$${value?.toFixed(2)}`, 'Revenue']} />
                                    <Legend />
                                    <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default OrganizerStats;
