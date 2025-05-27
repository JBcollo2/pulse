import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import {
  CalendarDays, DollarSign, CheckCircle,
  LayoutDashboard, BarChart2, FileText, Activity, ChevronRight, Menu, X, Search, Plus, Bell, Settings, User
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
    const [organizerName, setOrganizerName] = useState('Organizer');

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
            setOrganizerName(data.organizer_name || 'Organizer');
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

    const getHeaderContent = () => {
        switch (currentView) {
            case 'overview':
                return {
                    title: "Overview",
                    description: "Dashboard analytics",
                    icon: <LayoutDashboard className="w-8 h-8 md:w-10 md:h-10 text-white" />,
                    gradient: "from-blue-500 to-blue-700"
                };
            case 'myEvents':
                return {
                    title: "My Events",
                    description: "Manage your events",
                    icon: <CalendarDays className="w-8 h-8 md:w-10 md:h-10 text-white" />,
                    gradient: "from-purple-500 to-purple-700"
                };
            case 'overallStats':
                return {
                    title: "Overall Stats",
                    description: "View aggregate data",
                    icon: <BarChart2 className="w-8 h-8 md:w-10 md:h-10 text-white" />,
                    gradient: "from-green-500 to-green-700"
                };
            case 'reports':
                return {
                    title: "Reports",
                    description: "Generate and view reports",
                    icon: <FileText className="w-8 h-8 md:w-10 md:h-10 text-white" />,
                    gradient: "from-orange-500 to-orange-700"
                };
            case 'settings':
                return {
                    title: "Settings",
                    description: "Account preferences",
                    icon: <Settings className="w-8 h-8 md:w-10 md:h-10 text-white" />,
                    gradient: "from-indigo-500 to-indigo-700"
                };
            default:
                return {
                    title: "Dashboard Overview",
                    description: "Welcome to your organizer control panel.",
                    icon: <Activity className="w-8 h-8 md:w-10 md:h-10 text-white" />,
                    gradient: "from-gray-500 to-gray-700"
                };
        }
    };

    const headerContent = getHeaderContent();

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-950 dark:via-gray-900 dark:to-gray-850 text-gray-800 dark:text-white overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-10 dark:opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }}></div>

            <div className="relative z-10 flex min-h-screen">
                <div className="fixed top-0 left-0 h-full w-72 flex-shrink-0 z-50">
                    <OrganizerNavigation
                        currentView={currentView}
                        onViewChange={handleViewChange}
                        isLoading={isLoading}
                        isExpanded={isExpanded}
                        setIsExpanded={setIsExpanded}
                        isMobileOpen={isMobileOpen}
                        setIsMobileOpen={setIsMobileOpen}
                        darkMode={darkMode}
                        organizerName={organizerName}
                    />
                </div>

                <div className="flex-1 ml-72 p-4 md:p-8">
                    <div className={cn(
                        "mb-8 p-6 md:p-8 rounded-xl shadow-lg border-none overflow-hidden",
                        "bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-60 dark:bg-opacity-40",
                        `bg-gradient-to-r ${headerContent.gradient} text-white`
                    )}>
                        <div className="flex items-center gap-6">
                            <div className="p-4 rounded-full bg-white bg-opacity-20 dark:bg-opacity-10 shadow-inner transition-transform duration-300 hover:scale-105">
                                {headerContent.icon}
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1">
                                    {headerContent.title}
                                </h1>
                                <p className="text-lg md:text-xl font-light opacity-90">
                                    {headerContent.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {currentView === 'overview' && (
                        <div className="space-y-8 animate-fade-in-up">
                            <h1 className={cn("text-4xl font-extrabold mb-6", darkMode ? "text-[--foreground]" : "text-gradient")}>
                                Organizer Dashboard Overview
                            </h1>
                            <p className={cn("text-lg max-w-2xl", darkMode ? "text-[--muted]" : "text-[--foreground]")}>
                                Welcome, {organizerName}! Here's a quick glance at your event management activities and key metrics.
                            </p>

                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                <div className={cn("border rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl", darkMode ? "bg-[--card] text-[--card-foreground] border-[--border]" : "bg-[--card] text-[--card-foreground] border-[--border]")}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-md", darkMode ? "bg-[--primary]" : "bg-[--primary]")}>
                                            <LayoutDashboard className={cn("w-5 h-5", darkMode ? "text-[--primary-foreground]" : "text-[--primary-foreground]")} />
                                        </div>
                                        <h2 className={cn("text-xl font-semibold", darkMode ? "text-[--foreground]" : "text-[--foreground]")}>Total Events</h2>
                                    </div>
                                    <p className={cn("text-4xl font-bold", darkMode ? "text-[--primary]" : "text-[--primary]")}>
                                        {isLoading ? '...' : organizerEvents.length}
                                    </p>
                                    <p className={cn("text-sm mt-1", darkMode ? "text-[--muted]" : "text-[--muted]")}>All events you've organized.</p>
                                </div>

                                <div className={cn("border rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl", darkMode ? "bg-[--card] text-[--card-foreground] border-[--border]" : "bg-[--card] text-[--card-foreground] border-[--border]")}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-md", darkMode ? "bg-[--secondary]" : "bg-[--secondary]")}>
                                            <CalendarDays className="w-5 h-5 text-[--card-foreground]" />
                                        </div>
                                        <h2 className={cn("text-xl font-semibold", darkMode ? "text-[--foreground]" : "text-[--foreground]")}>Upcoming Events</h2>
                                    </div>
                                    <p className={cn("text-4xl font-bold", darkMode ? "text-[--secondary]" : "text-[--secondary]")}>
                                        {isLoading ? '...' : upcomingEvents.length}
                                    </p>
                                    <p className={cn("text-sm mt-1", darkMode ? "text-[--muted]" : "text-[--muted]")}>Events scheduled for the future.</p>
                                </div>

                                <div className={cn("border rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl", darkMode ? "bg-[--card] text-[--card-foreground] border-[--border]" : "bg-[--card] text-[--card-foreground] border-[--border]")}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-md", darkMode ? "bg-[--destructive]" : "bg-[--destructive]")}>
                                            <CheckCircle className={cn("w-5 h-5", darkMode ? "text-[--destructive-foreground]" : "text-[--destructive-foreground]")} />
                                        </div>
                                        <h2 className={cn("text-xl font-semibold", darkMode ? "text-[--foreground]" : "text-[--foreground]")}>Past Events</h2>
                                    </div>
                                    <p className={cn("text-4xl font-bold", darkMode ? "text-[--destructive]" : "text-[--destructive]")}>
                                        {isLoading ? '...' : pastEvents.length}
                                    </p>
                                    <p className={cn("text-sm mt-1", darkMode ? "text-[--muted]" : "text-[--muted]")}>Events that have already concluded.</p>
                                </div>
                            </div>

                            <div className={cn("border rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl", darkMode ? "bg-[--card] text-[--card-foreground] border-[--border]" : "bg-[--card] text-[--card-foreground] border-[--border]")}>
                                <h2 className={cn("text-xl font-semibold mb-4", darkMode ? "text-[--foreground]" : "text-[--foreground]")}>Quick Actions</h2>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => handleViewChange('myEvents')}
                                        className={cn("px-5 py-2.5 rounded-lg hover:scale-105 shadow-md text-sm font-medium transition-all duration-300", darkMode ? "bg-[--secondary] text-[--secondary-foreground] hover:bg-[--secondary]/90" : "bg-[--secondary] text-[--secondary-foreground] hover:bg-[--secondary]/90")}
                                    >
                                        View My Events
                                    </button>
                                    <button
                                        onClick={() => handleViewChange('overallStats')}
                                        className={cn("px-5 py-2.5 rounded-lg hover:scale-105 shadow-md text-sm font-medium transition-all duration-300", darkMode ? "bg-[--primary] text-[--primary-foreground] hover:bg-[--primary]/90" : "bg-[--primary] text-[--primary-foreground] hover:bg-[--primary]/90")}
                                    >
                                        View Overall Stats
                                    </button>
                                    <button
                                        onClick={() => handleViewChange('reports')}
                                        className={cn("px-5 py-2.5 rounded-lg hover:scale-105 shadow-md text-sm font-medium transition-all duration-300", darkMode ? "bg-[--accent] text-[--accent-foreground] hover:bg-[--accent]/90" : "bg-[--accent] text-[--accent-foreground] hover:bg-[--accent]/90")}
                                    >
                                        Generate Reports
                                    </button>
                                </div>
                            </div>

                            {overallSummary && (
                                <div className={cn("border rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl", darkMode ? "bg-[--card] text-[--card-foreground] border-[--border]" : "bg-[--card] text-[--card-foreground] border-[--border]")}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Activity className={cn("w-5 h-5", darkMode ? "text-[--secondary]" : "text-[--secondary]")} />
                                        <span className={cn("text-lg font-semibold", darkMode ? "text-[--foreground]" : "text-[--foreground]")}>Summary Statistics</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
                                        <div className={cn("flex justify-between items-center p-3 rounded-lg border", darkMode ? "bg-[--muted] border-[--border]" : "bg-[--muted] border-[--border]")}>
                                            <span className={cn(darkMode ? "text-[--muted]" : "text-[--muted]")}>Total Tickets Sold</span>
                                            <span className={cn("font-bold", darkMode ? "text-[--primary]" : "text-[--primary]")}>{overallSummary.total_tickets_sold_across_all_events.toLocaleString()}</span>
                                        </div>
                                        <div className={cn("flex justify-between items-center p-3 rounded-lg border", darkMode ? "bg-[--muted] border-[--border]" : "bg-[--muted] border-[--border]")}>
                                            <span className={cn(darkMode ? "text-[--muted]" : "text-[--muted]")}>Total Revenue</span>
                                            <span className={cn("font-bold", darkMode ? "text-[--secondary]" : "text-[--secondary]")}>{overallSummary.total_revenue_across_all_events}</span>
                                        </div>
                                        <div className={cn("flex justify-between items-center p-3 rounded-lg border", darkMode ? "bg-[--muted] border-[--border]" : "bg-[--muted] border-[--border]")}>
                                            <span className={cn(darkMode ? "text-[--muted]" : "text-[--muted]")}>Total Events Analyzed</span>
                                            <span className={cn("font-bold", darkMode ? "text-[--primary]" : "text-[--primary]")}>{overallSummary.total_events || overallSummary.events_summary.length}</span>
                                        </div>
                                        <div className={cn("flex justify-between items-center p-3 rounded-lg border", darkMode ? "bg-[--muted] border-[--border]" : "bg-[--muted] border-[--border]")}>
                                            <span className={cn(darkMode ? "text-[--muted]" : "text-[--muted]")}>Events with Data</span>
                                            <span className={cn("font-bold", darkMode ? "text-[--secondary]" : "text-[--secondary]")}>{overallSummary.events_summary.length}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {currentView === 'myEvents' && (
                        <div className="space-y-8 animate-fade-in-up">
                            <h1 className={cn("text-4xl font-extrabold mb-6", darkMode ? "text-[--foreground]" : "text-gradient")}>
                                My Events
                            </h1>
                            <p className={cn("text-lg max-w-2xl", darkMode ? "text-[--muted]" : "text-[--foreground]")}>
                                View all your past and upcoming events and access their individual reports.
                            </p>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {isLoading ? (
                                    <p className={cn("col-span-full text-center", darkMode ? "text-[--muted]" : "text-[--muted]")}>Loading events...</p>
                                ) : organizerEvents.length > 0 ? (
                                    organizerEvents.map(event => (
                                        <div key={event.id} className={cn("border rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl flex flex-col h-full", darkMode ? "bg-[--card] text-[--card-foreground] border-[--border]" : "bg-[--card] text-[--card-foreground] border-[--border]")}>
                                            <h3 className={cn("text-xl font-semibold mb-2", darkMode ? "text-[--foreground]" : "text-[--foreground]")}>{event.name}</h3>
                                            <p className={cn("text-sm mb-3", darkMode ? "text-[--muted]" : "text-[--muted]")}>{event.date} • {event.location}</p>
                                            <p className={cn("text-xs mb-2", darkMode ? "text-[--muted]" : "text-[--muted]")}>Event ID: {event.id}</p>
                                            {event.description && (
                                                <p className={cn("text-sm flex-grow mb-4", darkMode ? "text-[--foreground]" : "text-[--foreground]")}>{event.description}</p>
                                            )}
                                            <div className="mt-auto pt-4 border-t flex items-center justify-between">
                                                <span className={cn(
                                                    "inline-block px-3 py-1 text-xs font-medium rounded-full",
                                                    new Date(event.date) > new Date()
                                                        ? (darkMode ? 'bg-[--secondary]/50 text-[--secondary-foreground]' : 'bg-[--secondary]/50 text-[--secondary-foreground]')
                                                        : (darkMode ? 'bg-[--muted] text-[--muted-foreground]' : 'bg-[--muted] text-[--muted-foreground]')
                                                )}>
                                                    {new Date(event.date) > new Date() ? 'Upcoming' : 'Past Event'}
                                                </span>
                                                <button
                                                    onClick={() => handleViewReport(event.id)}
                                                    className={cn("px-4 py-2 rounded-lg hover:scale-105 shadow-sm text-sm transition-all duration-300", darkMode ? "bg-[--secondary] text-[--secondary-foreground] hover:bg-[--secondary]/90" : "bg-[--secondary] text-[--secondary-foreground] hover:bg-[--secondary]/90")}
                                                >
                                                    View Report
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={cn("col-span-full text-center p-8 border rounded-xl shadow-sm", darkMode ? "bg-[--card] text-[--muted] border-[--border]" : "bg-[--card] text-[--muted] border-[--border]")}>
                                        <p className="mb-4">No events found.</p>
                                        <p className="text-sm">Events are managed through the main event management system. Once created, they will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {currentView === 'overallStats' && (
                        <div className="animate-fade-in-up">
                            <h1 className={cn("text-4xl font-extrabold mb-6", darkMode ? "text-[--foreground]" : "text-gradient")}>
                                Overall Statistics
                            </h1>
                            <p className={cn("text-lg max-w-2xl mb-8", darkMode ? "text-[--muted]" : "text-[--foreground]")}>
                                Dive into the comprehensive performance metrics across all your events.
                            </p>
                            <OrganizerStats
                                overallSummary={overallSummary}
                                isLoading={isLoading}
                                error={error}
                                darkMode={darkMode}
                            />
                        </div>
                    )}

                    {currentView === 'reports' && (
                        <div className="space-y-8 animate-fade-in-up">
                            <h1 className={cn("text-4xl font-extrabold mb-6", darkMode ? "text-[--foreground]" : "text-gradient")}>
                                Event Reports
                            </h1>
                            <p className={cn("text-lg max-w-2xl", darkMode ? "text-[--muted]" : "text-[--foreground]")}>
                                Access detailed reports for individual events. Select an event from "My Events" to generate its report.
                            </p>
                            <div className={cn("border rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl", darkMode ? "bg-[--card] text-[--card-foreground] border-[--border]" : "bg-[--card] text-[--card-foreground] border-[--border]")}>
                                <h2 className={cn("text-xl font-semibold mb-4", darkMode ? "text-[--foreground]" : "text-[--foreground]")}>How to Access Reports</h2>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <span className={cn("rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0", darkMode ? "bg-[--secondary] text-[--secondary-foreground]" : "bg-[--secondary] text-[--secondary-foreground]")}>1</span>
                                        <div>
                                            <h4 className={cn("font-semibold text-lg", darkMode ? "text-[--foreground]" : "text-[--foreground]")}>Go to My Events</h4>
                                            <p className={cn(darkMode ? "text-[--muted]" : "text-[--muted]")}>Navigate to the "My Events" section from the sidebar to see all your events.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className={cn("rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0", darkMode ? "bg-[--secondary] text-[--secondary-foreground]" : "bg-[--secondary] text-[--secondary-foreground]")}>2</span>
                                        <div>
                                            <h4 className={cn("font-semibold text-lg", darkMode ? "text-[--foreground]" : "text-[--foreground]")}>Select an Event</h4>
                                            <p className={cn(darkMode ? "text-[--muted]" : "text-[--muted]")}>Click the "View Report" button on any event card to access detailed analytics for that specific event.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className={cn("rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0", darkMode ? "bg-[--secondary] text-[--secondary-foreground]" : "bg-[--secondary] text-[--secondary-foreground]")}>3</span>
                                        <div>
                                            <h4 className={cn("font-semibold text-lg", darkMode ? "text-[--foreground]" : "text-[--foreground]")}>Analyze Performance</h4>
                                            <p className={cn(darkMode ? "text-[--muted]" : "text-[--muted]")}>Review ticket sales, revenue, attendee demographics, and other important metrics to gain insights.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 pt-6 border-t">
                                    <button
                                        onClick={() => handleViewChange('myEvents')}
                                        className={cn("px-5 py-2.5 rounded-lg hover:scale-105 shadow-md text-sm font-medium transition-all duration-300", darkMode ? "bg-[--secondary] text-[--secondary-foreground] hover:bg-[--secondary]/90" : "bg-[--secondary] text-[--secondary-foreground] hover:bg-[--secondary]/90")}
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
                                className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-lg hover:scale-105 shadow-sm text-sm transition-all duration-300", darkMode ? "bg-[--muted] text-[--muted-foreground] hover:bg-[--muted]/80" : "bg-[--muted] text-[--muted-foreground] hover:bg-[--muted]/80")}
                            >
                                <ChevronRight className="h-4 w-4 transform rotate-180" /> Back to My Events
                            </button>
                            <h1 className={cn("text-4xl font-extrabold mb-6", darkMode ? "text-[--foreground]" : "text-gradient")}>
                                Event Report: {organizerEvents.find(e => e.id === selectedEventId)?.name || `Event ID: ${selectedEventId}`}
                            </h1>
                            <OrganizerReports
                                eventId={selectedEventId}
                                darkMode={darkMode}
                            />
                        </div>
                    )}

                    {currentView === 'settings' && (
                        <div className={cn("border rounded-xl p-6 space-y-6 animate-fade-in-up transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl", darkMode ? "bg-[--card] text-[--card-foreground] border-[--border]" : "bg-[--card] text-[--card-foreground] border-[--border]")}>
                            <h1 className={cn("text-4xl font-extrabold mb-6", darkMode ? "text-[--foreground]" : "text-gradient")}>
                                Settings
                            </h1>
                            <p className={cn("text-lg", darkMode ? "text-[--muted]" : "text-[--foreground]")}>Manage your profile and dashboard preferences here.</p>
                            <p className={cn(darkMode ? "text-[--muted]" : "text-[--muted]")}>
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
