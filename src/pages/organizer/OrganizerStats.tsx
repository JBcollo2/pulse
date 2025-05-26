// src/components/OrganizerStats.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';
import { Users, Ticket, TrendingUp, DollarSign, Calendar, AlertCircle, Shield, Waypoints } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

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
    const { toast } = useToast();

    // --- Loading State ---
    if (isLoading) {
        return (
            <div className="space-y-6 p-6 lg:p-8 max-w-6xl mx-auto">
                <div className="flex items-center justify-between space-y-2 flex-wrap gap-4">
                    <Skeleton className="h-10 w-96" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, index) => ( // Adjusted to 4 for consistency with AdminStats
                        <Card key={index}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-4 rounded-full" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-24" />
                                <Skeleton className="h-3 w-40 mt-2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Skeleton className="h-8 w-64 mt-8" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, index) => (
                        <Card key={index}>
                            <CardHeader>
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-full" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Skeleton className="h-8 w-64 mt-8" />
                <div className="grid gap-4 md:grid-cols-2">
                    {[...Array(2)].map((_, index) => (
                        <Card key={index}>
                            <CardHeader>
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-full" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-72 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    // --- Error State ---
    if (error) {
        return (
            <Card className="max-w-3xl mx-auto my-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-6 w-6" /> Error Loading Statistics
                    </CardTitle>
                    <CardDescription>We encountered an issue fetching your overall statistics.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-destructive font-medium text-sm mb-4">{error}</p>
                    <p className="text-muted-foreground text-sm">Please try again later or contact support if the issue persists.</p>
                </CardContent>
            </Card>
        );
    }

    // --- No Data State ---
    if (!overallSummary || (!overallSummary.events_details || overallSummary.events_details.length === 0) &&
        overallSummary.total_tickets_sold_across_all_events === 0 &&
        overallSummary.total_revenue_across_all_events === 0 &&
        (overallSummary.total_events === 0 || overallSummary.total_events === undefined)) {
        return (
            <Card className="max-w-3xl mx-auto my-8">
                <CardHeader>
                    <CardTitle>Overall Organizer Statistics</CardTitle>
                    <CardDescription>No comprehensive statistics available.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground h-32 flex items-center justify-center">
                        It looks like there's no overall data for your organizer account yet. Start by creating an event!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-8 p-6 lg:p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between space-y-2 flex-wrap gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">
                        Overall Statistics for {overallSummary.organizer_name || "Your Organization"}
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        A comprehensive overview of your performance across all events.
                    </p>
                </div>
            </div>

            {/* --- Summary Cards --- */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tickets Sold</CardTitle>
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">
                            {overallSummary.total_tickets_sold_across_all_events.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Across all your events</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-green-600">
                            ${overallSummary.total_revenue_across_all_events.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">From all ticket sales</p>
                    </CardContent>
                </Card>
                {overallSummary.total_events !== undefined && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Events Hosted</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-blue-600">
                                {overallSummary.total_events}
                            </div>
                            <p className="text-xs text-muted-foreground">Past and upcoming</p>
                        </CardContent>
                    </Card>
                )}
                {overallSummary.upcoming_events_count !== undefined && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">
                                {overallSummary.upcoming_events_count}
                            </div>
                            <p className="text-xs text-muted-foreground">Events planned</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* --- Event Breakdowns --- */}
            <h2 className="text-2xl font-bold tracking-tight mt-8">Individual Event Performance</h2>
            {overallSummary.events_details && overallSummary.events_details.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {overallSummary.events_details.map(event => (
                        <Card key={event.event_id}>
                            <CardHeader>
                                <CardTitle className="truncate">{event.event_name}</CardTitle>
                                <CardDescription>{event.date} at {event.location}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <p className="text-sm font-medium">Tickets Sold: <span className="font-bold text-primary">{event.tickets_sold.toLocaleString()}</span></p>
                                <p className="text-sm font-medium">Revenue: <span className="font-bold text-green-600">${event.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground text-center py-8">No detailed event breakdowns available. Create an event to see more!</p>
            )}

            {/* --- Monthly Trends --- */}
            <div className="grid gap-6 lg:grid-cols-2">
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
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="month" style={{ fontSize: '12px' }} />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip
                                            cursor={{ strokeDasharray: '3 3' }}
                                            contentStyle={{ backgroundColor: "hsl(var(--card))", border: '1px solid hsl(var(--border))', borderRadius: "8px", fontSize: '14px', padding: '8px' }}
                                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                                            labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                                            formatter={(value: number) => [`${value} Tickets`, 'Sold']}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="tickets" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} name="Tickets Sold" strokeWidth={2} />
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
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="month" style={{ fontSize: '12px' }} />
                                        <YAxis tickFormatter={(value: number) => `$${value}`} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                                            contentStyle={{ backgroundColor: "hsl(var(--card))", border: '1px solid hsl(var(--border))', borderRadius: "8px", fontSize: '14px', padding: '8px' }}
                                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                                            labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                                            formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Revenue']}
                                        />
                                        <Legend />
                                        <Bar dataKey="revenue" fill="hsl(var(--secondary))" name="Revenue" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default OrganizerStats;