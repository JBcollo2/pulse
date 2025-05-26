import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import {
  CalendarDays, DollarSign, CheckCircle,
  LayoutDashboard, BarChart2, FileText, Activity, ChevronRight, Menu, X, Search, Plus, Bell, Settings
} from 'lucide-react';

import OrganizerNavigation from './OrganizerNavigation';
import OrganizerReports from './OrganizerReports';
import OrganizerStats from './OrganizerStats';
import { cn } from "@/lib/utils";

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
    const [currentView, setCurrentView] = useState<ViewType>('overview');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const [successMessage, setSuccessMessage] = useState<string | undefined>();
    const [organizerEvents, setOrganizerEvents] = useState<Event[]>([]);
    const [overallSummary, setOverallSummary] = useState<OverallSummary | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

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

    useEffect(() => {
        if (currentView === 'myEvents') {
            fetchOrganizerEvents();
        } else if (currentView === 'overallStats') {
            fetchOverallSummary();
        } else if (currentView === 'overview') {
            fetchOrganizerEvents();
            fetchOverallSummary();
        }
    }, [currentView, fetchOrganizerEvents, fetchOverallSummary]);

    const upcomingEvents = organizerEvents.filter(e => new Date(e.date) > new Date());
    const pastEvents = organizerEvents.filter(e => new Date(e.date) <= new Date());

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-foreground">
            <main className="pt-0">
                <div className="flex">
                    {/* Organizer Navigation */}
                    <OrganizerNavigation
                        currentView={currentView}
                        onViewChange={handleViewChange}
                        onLogout={handleLogout}
                        isLoading={isLoading}
                        isExpanded={isExpanded}
                        setIsExpanded={setIsExpanded}
                        isMobileOpen={isMobileOpen}
                        setIsMobileOpen={setIsMobileOpen}
                    />

                    {/* Main Content Area */}
                    <div className={cn(
                        "flex-1 transition-all duration-300",
                        isExpanded ? 'md:ml-72' : 'md:ml-20'
                    )}>
                        <div className="bg-white/70 backdrop-blur-sm border-b border-border px-8 py-6 sticky top-0 z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                                        {currentView === 'overview' && (
                                            <>
                                                <LayoutDashboard className="h-6 w-6 text-blue-500" />
                                                Overview
                                            </>
                                        )}
                                        {currentView === 'myEvents' && (
                                            <>
                                                <CalendarDays className="h-6 w-6 text-green-500" />
                                                My Events
                                            </>
                                        )}
                                        {currentView === 'overallStats' && (
                                            <>
                                                <BarChart2 className="h-6 w-6 text-purple-500" />
                                                Overall Stats
                                            </>
                                        )}
                                        {currentView === 'reports' && (
                                            <>
                                                <FileText className="h-6 w-6 text-orange-500" />
                                                Reports
                                            </>
                                        )}
                                        {currentView === 'settings' && (
                                            <>
                                                <Settings className="h-6 w-6 text-gray-500" />
                                                Settings
                                            </>
                                        )}
                                    </h1>
                                    <p className="text-muted-foreground mt-1">
                                        {currentView === 'overview' && 'Dashboard analytics'}
                                        {currentView === 'myEvents' && 'Manage your events'}
                                        {currentView === 'overallStats' && 'View aggregate data'}
                                        {currentView === 'reports' && 'Generate and view reports'}
                                        {currentView === 'settings' && 'Account preferences'}
                                    </p>
                                </div>

                                <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                                    <span>Dashboard</span>
                                    <ChevronRight className="h-4 w-4" />
                                    <span className="text-foreground font-medium">
                                        {currentView === 'overview' && 'Overview'}
                                        {currentView === 'myEvents' && 'My Events'}
                                        {currentView === 'overallStats' && 'Overall Stats'}
                                        {currentView === 'reports' && 'Reports'}
                                        {currentView === 'settings' && 'Settings'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 min-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
                            {error && (
                                <div className="p-4 mb-4 bg-destructive/10 border border-destructive/20 text-destructive-foreground rounded-lg shadow-sm animate-fade-in-up">
                                    <p className="font-semibold">Error:</p>
                                    <p className="text-destructive">{error}</p>
                                </div>
                            )}
                            {successMessage && (
                                <div className="p-4 mb-4 bg-green-100 border border-green-200 text-green-700 rounded-lg shadow-sm animate-fade-in-up">
                                    <p className="font-semibold">Success:</p>
                                    <p>{successMessage}</p>
                                </div>
                            )}

                            {currentView === 'overview' && (
                                <div className="space-y-8 animate-fade-in-up">
                                    <h1 className="text-4xl font-extrabold text-gradient mb-6">
                                        Organizer Dashboard Overview
                                    </h1>
                                    <p className="text-lg text-foreground max-w-2xl">
                                        Welcome, {overallSummary?.organizer_name || 'Organizer'}! Here's a quick glance at your event management activities and key metrics.
                                    </p>

                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        <div className="bg-card text-card-foreground border border-border rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md">
                                                    <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
                                                </div>
                                                <h2 className="text-xl font-semibold text-foreground">Total Events</h2>
                                            </div>
                                            <p className="text-4xl font-bold text-primary">
                                                {isLoading ? '...' : organizerEvents.length}
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-1">All events you've organized.</p>
                                        </div>

                                        <div className="bg-card text-card-foreground border border-border rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                                                    <CalendarDays className="w-5 h-5 text-white" />
                                                </div>
                                                <h2 className="text-xl font-semibold text-foreground">Upcoming Events</h2>
                                            </div>
                                            <p className="text-4xl font-bold text-green-600">
                                                {isLoading ? '...' : upcomingEvents.length}
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-1">Events scheduled for the future.</p>
                                        </div>

                                        <div className="bg-card text-card-foreground border border-border rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 bg-destructive rounded-xl flex items-center justify-center shadow-md">
                                                    <CheckCircle className="w-5 h-5 text-destructive-foreground" />
                                                </div>
                                                <h2 className="text-xl font-semibold text-foreground">Past Events</h2>
                                            </div>
                                            <p className="text-4xl font-bold text-destructive">
                                                {isLoading ? '...' : pastEvents.length}
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-1">Events that have already concluded.</p>
                                        </div>
                                    </div>

                                    <div className="bg-card text-card-foreground border border-border rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl">
                                        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                onClick={() => handleViewChange('myEvents')}
                                                className="px-5 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-all duration-300 hover:scale-105 shadow-md text-sm font-medium"
                                            >
                                                View My Events
                                            </button>
                                            <button
                                                onClick={() => handleViewChange('overallStats')}
                                                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-300 hover:scale-105 shadow-md text-sm font-medium"
                                            >
                                                View Overall Stats
                                            </button>
                                            <button
                                                onClick={() => handleViewChange('reports')}
                                                className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-all duration-300 hover:scale-105 shadow-md text-sm font-medium"
                                            >
                                                Generate Reports
                                            </button>
                                        </div>
                                    </div>

                                    {overallSummary && (
                                        <div className="bg-card text-card-foreground border border-border rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Activity className="w-5 h-5 text-secondary" />
                                                <span className="text-lg font-semibold text-foreground">Summary Statistics</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
                                                <div className="flex justify-between items-center bg-muted p-3 rounded-lg border border-border">
                                                    <span className="text-muted-foreground">Total Tickets Sold</span>
                                                    <span className="font-bold text-primary">{overallSummary.total_tickets_sold_across_all_events.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center bg-muted p-3 rounded-lg border border-border">
                                                    <span className="text-muted-foreground">Total Revenue</span>
                                                    <span className="font-bold text-green-600">{overallSummary.total_revenue_across_all_events}</span>
                                                </div>
                                                <div className="flex justify-between items-center bg-muted p-3 rounded-lg border border-border">
                                                    <span className="text-muted-foreground">Total Events Analyzed</span>
                                                    <span className="font-bold text-primary">{overallSummary.total_events || overallSummary.events_summary.length}</span>
                                                </div>
                                                <div className="flex justify-between items-center bg-muted p-3 rounded-lg border border-border">
                                                    <span className="text-muted-foreground">Events with Data</span>
                                                    <span className="font-bold text-secondary">{overallSummary.events_summary.length}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {currentView === 'myEvents' && (
                                <div className="space-y-8 animate-fade-in-up">
                                    <h1 className="text-4xl font-extrabold text-gradient mb-6">
                                        My Events
                                    </h1>
                                    <p className="text-lg text-foreground max-w-2xl">
                                        View all your past and upcoming events and access their individual reports.
                                    </p>
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {isLoading ? (
                                            <p className="col-span-full text-center text-muted-foreground">Loading events...</p>
                                        ) : organizerEvents.length > 0 ? (
                                            organizerEvents.map(event => (
                                                <div key={event.id} className="bg-card text-card-foreground border border-border rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl flex flex-col h-full">
                                                    <h3 className="text-xl font-semibold text-foreground mb-2">{event.name}</h3>
                                                    <p className="text-sm text-muted-foreground mb-3">{event.date} • {event.location}</p>
                                                    <p className="text-xs text-muted-foreground mb-2">Event ID: {event.id}</p>
                                                    {event.description && (
                                                        <p className="text-sm text-foreground flex-grow mb-4">{event.description}</p>
                                                    )}
                                                    <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                                                        <span className={cn(
                                                            "inline-block px-3 py-1 text-xs font-medium rounded-full",
                                                            new Date(event.date) > new Date()
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-muted text-muted-foreground'
                                                        )}>
                                                            {new Date(event.date) > new Date() ? 'Upcoming' : 'Past Event'}
                                                        </span>
                                                        <button
                                                            onClick={() => handleViewReport(event.id)}
                                                            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-all duration-300 hover:scale-105 shadow-sm text-sm"
                                                        >
                                                            View Report
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-full text-center p-8 bg-card border border-border rounded-xl shadow-sm">
                                                <p className="text-muted-foreground mb-4">No events found.</p>
                                                <p className="text-sm text-muted-foreground">Events are managed through the main event management system. Once created, they will appear here.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {currentView === 'overallStats' && (
                                <div className="animate-fade-in-up">
                                    <h1 className="text-4xl font-extrabold text-gradient mb-6">
                                        Overall Statistics
                                    </h1>
                                    <p className="text-lg text-foreground max-w-2xl mb-8">
                                        Dive into the comprehensive performance metrics across all your events.
                                    </p>
                                    <OrganizerStats
                                        overallSummary={overallSummary}
                                        isLoading={isLoading}
                                        error={error}
                                    />
                                </div>
                            )}

                            {currentView === 'reports' && (
                                <div className="space-y-8 animate-fade-in-up">
                                    <h1 className="text-4xl font-extrabold text-gradient mb-6">
                                        Event Reports
                                    </h1>
                                    <p className="text-lg text-foreground max-w-2xl">
                                        Access detailed reports for individual events. Select an event from "My Events" to generate its report.
                                    </p>
                                    <div className="bg-card text-card-foreground border border-border rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl">
                                        <h2 className="text-xl font-semibold text-foreground mb-4">How to Access Reports</h2>
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <span className="bg-secondary text-secondary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                                                <div>
                                                    <h4 className="font-semibold text-foreground text-lg">Go to My Events</h4>
                                                    <p className="text-muted-foreground">Navigate to the "My Events" section from the sidebar to see all your events.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <span className="bg-secondary text-secondary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                                                <div>
                                                    <h4 className="font-semibold text-foreground text-lg">Select an Event</h4>
                                                    <p className="text-muted-foreground">Click the "View Report" button on any event card to access detailed analytics for that specific event.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <span className="bg-secondary text-secondary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                                                <div>
                                                    <h4 className="font-semibold text-foreground text-lg">Analyze Performance</h4>
                                                    <p className="text-muted-foreground">Review ticket sales, revenue, attendee demographics, and other important metrics to gain insights.</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-8 pt-6 border-t border-border">
                                            <button
                                                onClick={() => handleViewChange('myEvents')}
                                                className="px-5 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-all duration-300 hover:scale-105 shadow-md text-sm font-medium"
                                            >
                                                Go to My Events
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentView === 'viewReport' && selectedEventId !== null && (
                                <div className="space-y-8 animate-fade-in-up">
                                    <button
                                        onClick={() => setCurrentView('myEvents')}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-all duration-300 hover:scale-105 shadow-sm text-sm"
                                    >
                                        <ChevronRight className="h-4 w-4 transform rotate-180" /> Back to My Events
                                    </button>
                                    <h1 className="text-4xl font-extrabold text-gradient mb-6">
                                        Event Report: {organizerEvents.find(e => e.id === selectedEventId)?.name || `Event ID: ${selectedEventId}`}
                                    </h1>
                                    <OrganizerReports
                                        eventId={selectedEventId}
                                    />
                                </div>
                            )}

                            {currentView === 'settings' && (
                                <div className="bg-card text-card-foreground border border-border rounded-xl p-6 space-y-6 animate-fade-in-up transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl">
                                    <h1 className="text-4xl font-extrabold text-gradient mb-6">
                                        Settings
                                    </h1>
                                    <p className="text-lg text-foreground">Manage your profile and dashboard preferences here.</p>
                                    <p className="text-muted-foreground">
                                        This section is under development.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }

                .animate-fade-in-up {
                    animation: fade-in 0.5s ease-out forwards;
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgb(203 213 225);
                    border-radius: 2px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgb(148 163 184);
                }
            `}</style>
        </div>
    );
};

export default OrganizerDashboard;
