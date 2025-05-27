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
    const [darkMode, setDarkMode] = useState(false);

    const { toast } = useToast();

    // Load dark mode preference from localStorage on component mount
    useEffect(() => {
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode) {
            setDarkMode(JSON.parse(savedDarkMode));
        }
    }, []);

    // Save dark mode preference to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }, [darkMode]);

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
        <div className={cn("min-h-screen flex", darkMode ? "bg-gray-900 text-white" : "bg-gradient-to-br from-slate-50 via-white to-slate-100 text-foreground")}>
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
                darkMode={darkMode}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                <div className={cn("sticky top-0 z-10 px-8 py-6", darkMode ? "bg-gray-800/70" : "bg-white/70 backdrop-blur-sm border-b border-border")}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-3">
                                {currentView === 'overview' && (
                                    <>
                                        <LayoutDashboard className={cn("h-6 w-6", darkMode ? "text-blue-400" : "text-blue-500")} />
                                        Overview
                                    </>
                                )}
                                {currentView === 'myEvents' && (
                                    <>
                                        <CalendarDays className={cn("h-6 w-6", darkMode ? "text-green-400" : "text-green-500")} />
                                        My Events
                                    </>
                                )}
                                {currentView === 'overallStats' && (
                                    <>
                                        <BarChart2 className={cn("h-6 w-6", darkMode ? "text-purple-400" : "text-purple-500")} />
                                        Overall Stats
                                    </>
                                )}
                                {currentView === 'reports' && (
                                    <>
                                        <FileText className={cn("h-6 w-6", darkMode ? "text-orange-400" : "text-orange-500")} />
                                        Reports
                                    </>
                                )}
                                {currentView === 'settings' && (
                                    <>
                                        <Settings className={cn("h-6 w-6", darkMode ? "text-gray-400" : "text-gray-500")} />
                                        Settings
                                    </>
                                )}
                            </h1>
                            <p className={cn("mt-1", darkMode ? "text-gray-300" : "text-muted-foreground")}>
                                {currentView === 'overview' && 'Dashboard analytics'}
                                {currentView === 'myEvents' && 'Manage your events'}
                                {currentView === 'overallStats' && 'View aggregate data'}
                                {currentView === 'reports' && 'Generate and view reports'}
                                {currentView === 'settings' && 'Account preferences'}
                            </p>
                        </div>

                        <div className="hidden md:flex items-center space-x-2 text-sm">
                            <span className={darkMode ? "text-gray-300" : "text-muted-foreground"}>Dashboard</span>
                            <ChevronRight className={cn("h-4 w-4", darkMode ? "text-gray-300" : "text-muted-foreground")} />
                            <span className={cn("font-medium", darkMode ? "text-white" : "text-foreground")}>
                                {currentView === 'overview' && 'Overview'}
                                {currentView === 'myEvents' && 'My Events'}
                                {currentView === 'overallStats' && 'Overall Stats'}
                                {currentView === 'reports' && 'Reports'}
                                {currentView === 'settings' && 'Settings'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className={cn("p-8 flex-1 min-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar", darkMode ? "bg-gray-900" : "bg-white")}>
                    {error && (
                        <div className={cn("p-4 mb-4 rounded-lg shadow-sm animate-fade-in-up", darkMode ? "bg-destructive/10 border-destructive/20 text-destructive-foreground" : "bg-destructive/10 border border-destructive/20 text-destructive-foreground")}>
                            <p className="font-semibold">Error:</p>
                            <p className={darkMode ? "text-destructive-foreground" : "text-destructive"}>{error}</p>
                        </div>
                    )}
                    {successMessage && (
                        <div className={cn("p-4 mb-4 rounded-lg shadow-sm animate-fade-in-up", darkMode ? "bg-green-900/10 border-green-900/20 text-green-400" : "bg-green-100 border border-green-200 text-green-700")}>
                            <p className="font-semibold">Success:</p>
                            <p>{successMessage}</p>
                        </div>
                    )}

                    {currentView === 'overview' && (
                        <div className="space-y-8 animate-fade-in-up">
                            <h1 className={cn("text-4xl font-extrabold mb-6", darkMode ? "text-white" : "text-gradient")}>
                                Organizer Dashboard Overview
                            </h1>
                            <p className={cn("text-lg max-w-2xl", darkMode ? "text-gray-300" : "text-foreground")}>
                                Welcome, {overallSummary?.organizer_name || 'Organizer'}! Here's a quick glance at your event management activities and key metrics.
                            </p>

                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                <div className={cn("border rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl", darkMode ? "bg-gray-800 text-card-foreground border-gray-700" : "bg-card text-card-foreground border-border")}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-md", darkMode ? "bg-primary" : "bg-primary")}>
                                            <LayoutDashboard className={cn("w-5 h-5", darkMode ? "text-primary-foreground" : "text-primary-foreground")} />
                                        </div>
                                        <h2 className={cn("text-xl font-semibold", darkMode ? "text-white" : "text-foreground")}>Total Events</h2>
                                    </div>
                                    <p className={cn("text-4xl font-bold", darkMode ? "text-primary" : "text-primary")}>
                                        {isLoading ? '...' : organizerEvents.length}
                                    </p>
                                    <p className={cn("text-sm mt-1", darkMode ? "text-gray-300" : "text-muted-foreground")}>All events you've organized.</p>
                                </div>

                                <div className={cn("border rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl", darkMode ? "bg-gray-800 text-card-foreground border-gray-700" : "bg-card text-card-foreground border-border")}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-md", darkMode ? "bg-green-600" : "bg-green-500")}>
                                            <CalendarDays className="w-5 h-5 text-white" />
                                        </div>
                                        <h2 className={cn("text-xl font-semibold", darkMode ? "text-white" : "text-foreground")}>Upcoming Events</h2>
                                    </div>
                                    <p className={cn("text-4xl font-bold", darkMode ? "text-green-400" : "text-green-600")}>
                                        {isLoading ? '...' : upcomingEvents.length}
                                    </p>
                                    <p className={cn("text-sm mt-1", darkMode ? "text-gray-300" : "text-muted-foreground")}>Events scheduled for the future.</p>
                                </div>

                                <div className={cn("border rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl", darkMode ? "bg-gray-800 text-card-foreground border-gray-700" : "bg-card text-card-foreground border-border")}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-md", darkMode ? "bg-destructive" : "bg-destructive")}>
                                            <CheckCircle className={cn("w-5 h-5", darkMode ? "text-destructive-foreground" : "text-destructive-foreground")} />
                                        </div>
                                        <h2 className={cn("text-xl font-semibold", darkMode ? "text-white" : "text-foreground")}>Past Events</h2>
                                    </div>
                                    <p className={cn("text-4xl font-bold", darkMode ? "text-destructive" : "text-destructive")}>
                                        {isLoading ? '...' : pastEvents.length}
                                    </p>
                                    <p className={cn("text-sm mt-1", darkMode ? "text-gray-300" : "text-muted-foreground")}>Events that have already concluded.</p>
                                </div>
                            </div>

                            <div className={cn("border rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl", darkMode ? "bg-gray-800 text-card-foreground border-gray-700" : "bg-card text-card-foreground border-border")}>
                                <h2 className={cn("text-xl font-semibold mb-4", darkMode ? "text-white" : "text-foreground")}>Quick Actions</h2>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => handleViewChange('myEvents')}
                                        className={cn("px-5 py-2.5 rounded-lg hover:scale-105 shadow-md text-sm font-medium transition-all duration-300", darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-secondary text-secondary-foreground hover:bg-secondary/90")}
                                    >
                                        View My Events
                                    </button>
                                    <button
                                        onClick={() => handleViewChange('overallStats')}
                                        className={cn("px-5 py-2.5 rounded-lg hover:scale-105 shadow-md text-sm font-medium transition-all duration-300", darkMode ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-primary text-primary-foreground hover:bg-primary/90")}
                                    >
                                        View Overall Stats
                                    </button>
                                    <button
                                        onClick={() => handleViewChange('reports')}
                                        className={cn("px-5 py-2.5 rounded-lg hover:scale-105 shadow-md text-sm font-medium transition-all duration-300", darkMode ? "bg-gray-600 text-gray-200 hover:bg-gray-500" : "bg-accent text-accent-foreground hover:bg-accent/90")}
                                    >
                                        Generate Reports
                                    </button>
                                </div>
                            </div>

                            {overallSummary && (
                                <div className={cn("border rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl", darkMode ? "bg-gray-800 text-card-foreground border-gray-700" : "bg-card text-card-foreground border-border")}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Activity className={cn("w-5 h-5", darkMode ? "text-secondary" : "text-secondary")} />
                                        <span className={cn("text-lg font-semibold", darkMode ? "text-white" : "text-foreground")}>Summary Statistics</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
                                        <div className={cn("flex justify-between items-center p-3 rounded-lg border", darkMode ? "bg-gray-700 border-gray-600" : "bg-muted border-border")}>
                                            <span className={cn(darkMode ? "text-gray-300" : "text-muted-foreground")}>Total Tickets Sold</span>
                                            <span className={cn("font-bold", darkMode ? "text-primary" : "text-primary")}>{overallSummary.total_tickets_sold_across_all_events.toLocaleString()}</span>
                                        </div>
                                        <div className={cn("flex justify-between items-center p-3 rounded-lg border", darkMode ? "bg-gray-700 border-gray-600" : "bg-muted border-border")}>
                                            <span className={cn(darkMode ? "text-gray-300" : "text-muted-foreground")}>Total Revenue</span>
                                            <span className={cn("font-bold", darkMode ? "text-green-400" : "text-green-600")}>{overallSummary.total_revenue_across_all_events}</span>
                                        </div>
                                        <div className={cn("flex justify-between items-center p-3 rounded-lg border", darkMode ? "bg-gray-700 border-gray-600" : "bg-muted border-border")}>
                                            <span className={cn(darkMode ? "text-gray-300" : "text-muted-foreground")}>Total Events Analyzed</span>
                                            <span className={cn("font-bold", darkMode ? "text-primary" : "text-primary")}>{overallSummary.total_events || overallSummary.events_summary.length}</span>
                                        </div>
                                        <div className={cn("flex justify-between items-center p-3 rounded-lg border", darkMode ? "bg-gray-700 border-gray-600" : "bg-muted border-border")}>
                                            <span className={cn(darkMode ? "text-gray-300" : "text-muted-foreground")}>Events with Data</span>
                                            <span className={cn("font-bold", darkMode ? "text-secondary" : "text-secondary")}>{overallSummary.events_summary.length}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {currentView === 'myEvents' && (
                        <div className="space-y-8 animate-fade-in-up">
                            <h1 className={cn("text-4xl font-extrabold mb-6", darkMode ? "text-white" : "text-gradient")}>
                                My Events
                            </h1>
                            <p className={cn("text-lg max-w-2xl", darkMode ? "text-gray-300" : "text-foreground")}>
                                View all your past and upcoming events and access their individual reports.
                            </p>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {isLoading ? (
                                    <p className={cn("col-span-full text-center", darkMode ? "text-gray-300" : "text-muted-foreground")}>Loading events...</p>
                                ) : organizerEvents.length > 0 ? (
                                    organizerEvents.map(event => (
                                        <div key={event.id} className={cn("border rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl flex flex-col h-full", darkMode ? "bg-gray-800 text-card-foreground border-gray-700" : "bg-card text-card-foreground border-border")}>
                                            <h3 className={cn("text-xl font-semibold mb-2", darkMode ? "text-white" : "text-foreground")}>{event.name}</h3>
                                            <p className={cn("text-sm mb-3", darkMode ? "text-gray-300" : "text-muted-foreground")}>{event.date} • {event.location}</p>
                                            <p className={cn("text-xs mb-2", darkMode ? "text-gray-300" : "text-muted-foreground")}>Event ID: {event.id}</p>
                                            {event.description && (
                                                <p className={cn("text-sm flex-grow mb-4", darkMode ? "text-gray-300" : "text-foreground")}>{event.description}</p>
                                            )}
                                            <div className="mt-auto pt-4 border-t flex items-center justify-between">
                                                <span className={cn(
                                                    "inline-block px-3 py-1 text-xs font-medium rounded-full",
                                                    new Date(event.date) > new Date()
                                                        ? (darkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-800')
                                                        : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-muted text-muted-foreground')
                                                )}>
                                                    {new Date(event.date) > new Date() ? 'Upcoming' : 'Past Event'}
                                                </span>
                                                <button
                                                    onClick={() => handleViewReport(event.id)}
                                                    className={cn("px-4 py-2 rounded-lg hover:scale-105 shadow-sm text-sm transition-all duration-300", darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-secondary text-secondary-foreground hover:bg-secondary/90")}
                                                >
                                                    View Report
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={cn("col-span-full text-center p-8 border rounded-xl shadow-sm", darkMode ? "bg-gray-800 text-gray-300 border-gray-700" : "bg-card text-muted-foreground border-border")}>
                                        <p className="mb-4">No events found.</p>
                                        <p className="text-sm">Events are managed through the main event management system. Once created, they will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {currentView === 'overallStats' && (
                        <div className="animate-fade-in-up">
                            <h1 className={cn("text-4xl font-extrabold mb-6", darkMode ? "text-white" : "text-gradient")}>
                                Overall Statistics
                            </h1>
                            <p className={cn("text-lg max-w-2xl mb-8", darkMode ? "text-gray-300" : "text-foreground")}>
                                Dive into the comprehensive performance metrics across all your events.
                            </p>
                            <OrganizerStats
                                overallSummary={overallSummary}
                                isLoading={isLoading}
                                error={error}
                                darkMode={darkMode} // Pass the darkMode prop here
                            />
                        </div>
                    )}

                    {currentView === 'reports' && (
                        <div className="space-y-8 animate-fade-in-up">
                            <h1 className={cn("text-4xl font-extrabold mb-6", darkMode ? "text-white" : "text-gradient")}>
                                Event Reports
                            </h1>
                            <p className={cn("text-lg max-w-2xl", darkMode ? "text-gray-300" : "text-foreground")}>
                                Access detailed reports for individual events. Select an event from "My Events" to generate its report.
                            </p>
                            <div className={cn("border rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl", darkMode ? "bg-gray-800 text-card-foreground border-gray-700" : "bg-card text-card-foreground border-border")}>
                                <h2 className={cn("text-xl font-semibold mb-4", darkMode ? "text-white" : "text-foreground")}>How to Access Reports</h2>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <span className={cn("rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0", darkMode ? "bg-gray-700 text-gray-200" : "bg-secondary text-secondary-foreground")}>1</span>
                                        <div>
                                            <h4 className={cn("font-semibold text-lg", darkMode ? "text-white" : "text-foreground")}>Go to My Events</h4>
                                            <p className={cn(darkMode ? "text-gray-300" : "text-muted-foreground")}>Navigate to the "My Events" section from the sidebar to see all your events.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className={cn("rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0", darkMode ? "bg-gray-700 text-gray-200" : "bg-secondary text-secondary-foreground")}>2</span>
                                        <div>
                                            <h4 className={cn("font-semibold text-lg", darkMode ? "text-white" : "text-foreground")}>Select an Event</h4>
                                            <p className={cn(darkMode ? "text-gray-300" : "text-muted-foreground")}>Click the "View Report" button on any event card to access detailed analytics for that specific event.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className={cn("rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0", darkMode ? "bg-gray-700 text-gray-200" : "bg-secondary text-secondary-foreground")}>3</span>
                                        <div>
                                            <h4 className={cn("font-semibold text-lg", darkMode ? "text-white" : "text-foreground")}>Analyze Performance</h4>
                                            <p className={cn(darkMode ? "text-gray-300" : "text-muted-foreground")}>Review ticket sales, revenue, attendee demographics, and other important metrics to gain insights.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 pt-6 border-t">
                                    <button
                                        onClick={() => handleViewChange('myEvents')}
                                        className={cn("px-5 py-2.5 rounded-lg hover:scale-105 shadow-md text-sm font-medium transition-all duration-300", darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-secondary text-secondary-foreground hover:bg-secondary/90")}
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
                                className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-lg hover:scale-105 shadow-sm text-sm transition-all duration-300", darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-muted text-muted-foreground hover:bg-muted/80")}
                            >
                                <ChevronRight className="h-4 w-4 transform rotate-180" /> Back to My Events
                            </button>
                            <h1 className={cn("text-4xl font-extrabold mb-6", darkMode ? "text-white" : "text-gradient")}>
                                Event Report: {organizerEvents.find(e => e.id === selectedEventId)?.name || `Event ID: ${selectedEventId}`}
                            </h1>
                            <OrganizerReports
                                eventId={selectedEventId}
                                darkMode={darkMode}
                            />
                        </div>
                    )}

                    {currentView === 'settings' && (
                        <div className={cn("border rounded-xl p-6 space-y-6 animate-fade-in-up transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl", darkMode ? "bg-gray-800 text-card-foreground border-gray-700" : "bg-card text-card-foreground border-border")}>
                            <h1 className={cn("text-4xl font-extrabold mb-6", darkMode ? "text-white" : "text-gradient")}>
                                Settings
                            </h1>
                            <p className={cn("text-lg", darkMode ? "text-gray-300" : "text-foreground")}>Manage your profile and dashboard preferences here.</p>
                            <p className={cn(darkMode ? "text-gray-300" : "text-muted-foreground")}>
                                This section is under development.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrganizerDashboard;
