// frontend/pulse/src/pages/organizer/OrganizerStats.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';

// --- Interfaces for Data Structures ---
// Define the shape of the aggregate statistics data you expect from your backend.
export interface OrganizerOverallStats {
    total_events: number;
    total_tickets_sold_all_events: number;
    total_revenue_all_events: number;
    upcoming_events_count: number;
    past_events_count: number;
    // Example for trends over time
    tickets_sold_monthly_trend: { month: string; tickets: number }[];
    revenue_monthly_trend: { month: string; revenue: number }[];
    // You can add more aggregate stats here, e.g., popular event categories, top-performing events
}

// --- OrganizerStats Component ---
const OrganizerStats: React.FC = () => {
    const [overallStats, setOverallStats] = useState<OrganizerOverallStats | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // --- Data Fetching Logic (Simulated) ---
    const fetchOverallStats = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setOverallStats(null); // Clear previous stats

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // --- IMPORTANT: Replace with your actual API call to fetch overall organizer stats ---
            /*
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error("Authentication token not found. Please log in.");
            }
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/organizer/stats/overall`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to fetch overall statistics.");
            }
            const data: OrganizerOverallStats = await response.json();
            */

            // Dummy data for demonstration
            const data: OrganizerOverallStats = {
                total_events: 15,
                total_tickets_sold_all_events: 5800,
                total_revenue_all_events: 350000.75,
                upcoming_events_count: 5,
                past_events_count: 10,
                tickets_sold_monthly_trend: [
                    { month: 'Jan', tickets: 300 },
                    { month: 'Feb', tickets: 450 },
                    { month: 'Mar', tickets: 600 },
                    { month: 'Apr', tickets: 550 },
                    { month: 'May', tickets: 800 },
                    { month: 'Jun', tickets: 900 },
                    { month: 'Jul', tickets: 700 },
                ],
                revenue_monthly_trend: [
                    { month: 'Jan', revenue: 15000 },
                    { month: 'Feb', revenue: 22000 },
                    { month: 'Mar', revenue: 30000 },
                    { month: 'Apr', revenue: 28000 },
                    { month: 'May', revenue: 40000 },
                    { month: 'Jun', revenue: 45000 },
                    { month: 'Jul', revenue: 35000 },
                ],
            };

            setOverallStats(data);
            toast({ title: "Stats Loaded", description: "Overall statistics fetched successfully.", duration: 3000 });

        } catch (err: any) {
            console.error("Failed to fetch overall stats:", err);
            setError(err.message || "An unknown error occurred while fetching overall statistics.");
            toast({ variant: "destructive", title: "Stats Error", description: err.message || "Failed to load overall statistics." });
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch overall stats on component mount
    useEffect(() => {
        fetchOverallStats();
    }, [fetchOverallStats]);

    // --- Conditional Rendering ---
    if (isLoading) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Overall Statistics</CardTitle>
                        <CardDescription>Loading your overall event performance...</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center h-48 animate-pulse text-muted-foreground">
                            <p>Loading overall statistics...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Overall Statistics</CardTitle>
                        <CardDescription>Error loading statistics.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-red-500 font-semibold">Error: {error}</p>
                        <p className="text-muted-foreground mt-2">Please try refreshing.</p>
                        <button onClick={fetchOverallStats} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                            Retry
                        </button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!overallStats) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Overall Statistics</CardTitle>
                        <CardDescription>No overall statistics available.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Could not retrieve overall statistics. This might happen if you haven't created any events yet.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // --- Main Content ---
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Overall Statistics</h1>
            <p className="text-muted-foreground text-lg">
                Gain insights into your performance across all events.
            </p>

            {/* Key Metrics Summary */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Events Managed</CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold text-primary">
                        {overallStats.total_events}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Total Tickets Sold</CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold text-green-600">
                        {overallStats.total_tickets_sold_all_events}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Total Revenue Generated</CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold text-blue-600">
                        ${overallStats.total_revenue_all_events?.toFixed(2)}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Events</CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold text-yellow-600">
                        {overallStats.upcoming_events_count}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Past Events</CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold text-gray-600">
                        {overallStats.past_events_count}
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Tickets Sold Trend */}
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Tickets Sold Trend</CardTitle>
                    <CardDescription>Tickets sold over the last few months.</CardDescription>
                </CardHeader>
                <CardContent>
                    {overallStats.tickets_sold_monthly_trend && overallStats.tickets_sold_monthly_trend.length > 0 ? (
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={overallStats.tickets_sold_monthly_trend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="tickets" stroke="#8884d8" activeDot={{ r: 8 }} name="Tickets Sold" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-72 flex items-center justify-center text-muted-foreground">No monthly ticket sales trend data.</div>
                    )}
                </CardContent>
            </Card>

            {/* Monthly Revenue Trend */}
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Revenue Trend</CardTitle>
                    <CardDescription>Revenue generated over the last few months.</CardDescription>
                </CardHeader>
                <CardContent>
                    {overallStats.revenue_monthly_trend && overallStats.revenue_monthly_trend.length > 0 ? (
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={overallStats.revenue_monthly_trend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(value: number) => `$${value}`} />
                                    <Tooltip formatter={(value: number) => [`$${value?.toFixed(2)}`, 'Revenue']} />
                                    <Legend />
                                    <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-72 flex items-center justify-center text-muted-foreground">No monthly revenue trend data.</div>
                    )}
                </CardContent>
            </Card>

            {/* You can add more complex charts or lists for other aggregate data here,
                e.g., top-performing events, events by category, average ticket price etc. */}

        </div>
    );
};

export default OrganizerStats;