import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { CalendarDays, DollarSign, CheckCircle, LayoutDashboard, BarChart2, FileText, LogOut, Menu, X, Sun, Moon } from 'lucide-react';
import OrganizerNavigation from './OrganizerNavigation';
import OrganizerReports from './OrganizerReports';
import OrganizerStats from './OrganizerStats';

// --- Interface Definitions ---
interface Event {
    id: number;
    name: string;
    date: string;
    location: string;
    description?: string;
}

interface OverallSummary {
    organizer_name: string;
    total_tickets_sold_across_all_events: number;
    total_revenue_across_all_events: string;
    events_summary: {
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

type ViewType = 'overview' | 'myEvents' | 'overallStats' | 'reports' | 'settings' | 'viewReport';

const OrganizerDashboard: React.FC = () => {
    // --- State Management ---
    const [currentView, setCurrentView] = useState<ViewType>('overview');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const [successMessage, setSuccessMessage] = useState<string | undefined>();
    const [organizerEvents, setOrganizerEvents] = useState<Event[]>([]);
    const [overallSummary, setOverallSummary] = useState<OverallSummary | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

    const { toast } = useToast();

    // --- Helper Function for API Errors ---
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

    // --- API Call Functions ---
    const fetchOrganizerEvents = useCallback(async () => {
        setIsLoading(true);
        setError(undefined);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/organizer/events`, {
                credentials: 'include'
            });

            if (!response.ok) {
                await handleFetchError(response);
                return;
            }

            const data: Event[] = await response.json();
            setOrganizerEvents(data);
        } catch (err) {
            console.error('Fetch events error:', err);
            setError('An unexpected error occurred while fetching events.');
            toast({
                title: "Error",
                description: 'An unexpected error occurred while fetching events.',
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [handleFetchError, toast]);

    const fetchOverallSummary = useCallback(async () => {
        setIsLoading(true);
        setError(undefined);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/organizer/summary`, {
                credentials: 'include'
            });

            if (!response.ok) {
                await handleFetchError(response);
                return;
            }

            const data: OverallSummary = await response.json();
            const processedData: OverallSummary = {
                ...data,
                events_summary: data.events_summary || [],
                tickets_sold_monthly_trend: data.tickets_sold_monthly_trend || [],
                revenue_monthly_trend: data.revenue_monthly_trend || [],
            };
            setOverallSummary(processedData);
            toast({
                title: "Success",
                description: "Overall summary fetched successfully.",
                variant: "default",
            });
        } catch (err) {
            console.error('Fetch overall summary error:', err);
            setError('An unexpected error occurred while fetching the overall summary.');
            toast({
                title: "Error",
                description: 'An unexpected error occurred while fetching the overall summary.',
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [handleFetchError, toast]);

    const handleLogout = useCallback(async () => {
        setIsLoading(true);
        setError(undefined);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });

            if (!response.ok) {
                await handleFetchError(response);
                return;
            }

            setSuccessMessage('Logout successful.');
            toast({
                title: "Success",
                description: "Logout successful.",
                variant: "default",
            });
            window.location.href = '/';
        } catch (err) {
            console.error('Logout error:', err);
            setError('An unexpected error occurred while logging out.');
            toast({
                title: "Error",
                description: 'An unexpected error occurred while logging out.',
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [handleFetchError, toast]);

    // --- View Navigation Handlers ---
    const handleViewChange = useCallback((view: string) => {
        if (['overview', 'myEvents', 'overallStats', 'reports', 'settings', 'viewReport'].includes(view)) {
            setCurrentView(view as ViewType);
            setError(undefined);
            setSuccessMessage(undefined);
        } else {
            console.warn(`Invalid view: ${view}`);
        }
    }, []);

    const handleViewReport = useCallback((eventId: number) => {
        setSelectedEventId(eventId);
        setCurrentView('viewReport');
    }, []);

    // --- useEffect for Data Fetching based on Current View ---
    useEffect(() => {
        if (currentView === 'myEvents') {
            fetchOrganizerEvents();
        } else if (currentView === 'overallStats') {
            fetchOverallSummary();
        }
    }, [currentView, fetchOrganizerEvents, fetchOverallSummary]);

    useEffect(() => {
        fetchOrganizerEvents();
    }, [fetchOrganizerEvents]);

    // --- Render Logic ---
    return (
        <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto py-6">
                <div className="flex gap-6">
                    <div className="w-64 flex-shrink-0">
                        <OrganizerNavigation
                            currentView={currentView}
                            onViewChange={handleViewChange}
                            onLogout={handleLogout}
                            isLoading={isLoading}
                        />
                    </div>
                    <div className="flex-1">
                        {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded border border-red-200">{error}</div>}
                        {successMessage && <div className="p-3 mb-4 bg-green-100 text-green-700 rounded border border-green-200">{successMessage}</div>}

                        {/* --- Overview Section --- */}
                        {currentView === 'overview' && (
                            <div className="space-y-6">
                                <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard Overview</h1>
                                <p className="text-gray-600 text-lg">
                                    Welcome to your event management dashboard. Here you can get a quick glance at your overall activities.
                                </p>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    <Card className="bg-white shadow-lg rounded-lg">
                                        <CardHeader>
                                            <CardTitle className="text-gray-900">Total Events</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-3xl font-bold text-purple-600">
                                            {isLoading ? '...' : organizerEvents.length}
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-white shadow-lg rounded-lg">
                                        <CardHeader>
                                            <CardTitle className="text-gray-900">Upcoming Events</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-3xl font-bold text-green-600">
                                            {isLoading ? '...' : organizerEvents.filter(e => new Date(e.date) > new Date()).length}
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-white shadow-lg rounded-lg">
                                        <CardHeader>
                                            <CardTitle className="text-gray-900">Past Events</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-3xl font-bold text-red-600">
                                            {isLoading ? '...' : organizerEvents.filter(e => new Date(e.date) <= new Date()).length}
                                        </CardContent>
                                    </Card>
                                </div>
                                <Card className="bg-white shadow-lg rounded-lg">
                                    <CardHeader>
                                        <CardTitle className="text-gray-900">Quick Actions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex gap-2">
                                        <button onClick={() => handleViewChange('myEvents')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300">View My Events</button>
                                        <button onClick={() => handleViewChange('overallStats')} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition duration-300">View Overall Stats</button>
                                        <button onClick={() => handleViewChange('reports')} className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition duration-300">View Reports</button>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* --- My Events Section --- */}
                        {currentView === 'myEvents' && (
                            <div className="space-y-6">
                                <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
                                <p className="text-gray-600 text-lg">
                                    View all your past and upcoming events and access their reports.
                                </p>
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {isLoading ? (
                                        <p className="col-span-full text-center text-gray-600">Loading events...</p>
                                    ) : organizerEvents.length > 0 ? (
                                        organizerEvents.map(event => (
                                            <Card key={event.id} className="flex flex-col h-full bg-white shadow-lg rounded-lg">
                                                <CardHeader>
                                                    <CardTitle className="text-gray-900">{event.name}</CardTitle>
                                                    <CardDescription className="text-gray-600">{event.date} • {event.location}</CardDescription>
                                                </CardHeader>
                                                <CardContent className="flex-grow">
                                                    <p className="text-sm text-gray-600">Event ID: {event.id}</p>
                                                    {event.description && (
                                                        <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                                                    )}
                                                    <div className="mt-3">
                                                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                                            new Date(event.date) > new Date()
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {new Date(event.date) > new Date() ? 'Upcoming' : 'Past Event'}
                                                        </span>
                                                    </div>
                                                </CardContent>
                                                <div className="p-4 border-t border-gray-200 flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => handleViewReport(event.id)}
                                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
                                                    >
                                                        View Report
                                                    </button>
                                                </div>
                                            </Card>
                                        ))
                                    ) : (
                                        <div className="col-span-full text-center">
                                            <p className="text-gray-600 mb-4">No events found.</p>
                                            <p className="text-sm text-gray-500">Events are managed through the main event management system.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* --- Overall Stats Section --- */}
                        {currentView === 'overallStats' && (
                            <OrganizerStats
                                overallSummary={overallSummary}
                                isLoading={isLoading}
                                error={error}
                            />
                        )}

                        {/* --- Reports Section --- */}
                        {currentView === 'reports' && (
                            <div className="space-y-6">
                                <h1 className="text-3xl font-bold text-gray-900">Event Reports</h1>
                                <p className="text-gray-600 text-lg">
                                    Access detailed reports for individual events. Select an event from "My Events" to generate its report.
                                </p>
                                <Card className="bg-white shadow-lg rounded-lg">
                                    <CardHeader>
                                        <CardTitle className="text-gray-900">How to Access Reports</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                                            <div>
                                                <h4 className="font-medium text-gray-900">Go to My Events</h4>
                                                <p className="text-sm text-gray-600">Navigate to the "My Events" section to see all your events.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                                            <div>
                                                <h4 className="font-medium text-gray-900">Select an Event</h4>
                                                <p className="text-sm text-gray-600">Click "View Report" on any event card to see detailed analytics.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                                            <div>
                                                <h4 className="font-medium text-gray-900">Analyze Performance</h4>
                                                <p className="text-sm text-gray-600">Review ticket sales, revenue, and other important metrics.</p>
                                            </div>
                                        </div>
                                        <div className="mt-6 pt-4 border-t border-gray-200">
                                            <button
                                                onClick={() => handleViewChange('myEvents')}
                                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
                                            >
                                                Go to My Events
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* --- View Individual Event Report Section --- */}
                        {currentView === 'viewReport' && selectedEventId !== null && (
                            <div className="space-y-6">
                                <button
                                    onClick={() => setCurrentView('myEvents')}
                                    className="mb-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition duration-300"
                                >
                                    ← Back to My Events
                                </button>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Event Report: {organizerEvents.find(e => e.id === selectedEventId)?.name || `Event ID: ${selectedEventId}`}
                                </h1>
                                <OrganizerReports
                                    eventId={selectedEventId}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizerDashboard;
