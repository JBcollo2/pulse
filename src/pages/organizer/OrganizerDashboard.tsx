import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import {
  CalendarDays, DollarSign, CheckCircle,
  LayoutDashboard, BarChart2, FileText, Activity, ChevronRight, Menu, X, Search, Plus, Bell, Settings
} from 'lucide-react';

import OrganizerNavigation from './OrganizerNavigation'; // Assuming this component is still used for sidebar navigation
import OrganizerReports from './OrganizerReports';
import OrganizerStats from './OrganizerStats';
import { cn } from "@/lib/utils"; // Import cn utility

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
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // For sidebar collapse
    const [searchQuery, setSearchQuery] = useState(""); // For sidebar search

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
        } else if (currentView === 'overview') {
            fetchOrganizerEvents();
            fetchOverallSummary();
        }
    }, [currentView, fetchOrganizerEvents, fetchOverallSummary]);

    // Determine upcoming and past events for overview
    const upcomingEvents = organizerEvents.filter(e => new Date(e.date) > new Date());
    const pastEvents = organizerEvents.filter(e => new Date(e.date) <= new Date());

    // Menu items for navigation (similar to Dashboard.tsx)
    const menuItems = [
        {
          id: "overview",
          name: "Overview",
          icon: LayoutDashboard, // Changed from BarChart to LayoutDashboard for consistency
          description: "Dashboard analytics",
          color: "text-blue-500" // Example color, will be overridden by active state
        },
        {
          id: "myEvents", // Changed from 'tickets'
          name: "My Events",
          icon: CalendarDays, // Changed from Ticket to CalendarDays
          description: "Manage your events",
          color: "text-green-500"
        },
        {
            id: "overallStats", // New item for your stats component
            name: "Overall Stats",
            icon: BarChart2,
            description: "View aggregate data",
            color: "text-purple-500"
        },
        {
          id: "reports",
          name: "Reports",
          icon: FileText, // Changed from Users
          description: "Generate and view reports",
          color: "text-orange-500"
        },
        {
          id: "settings",
          name: "Settings",
          icon: Settings,
          description: "Account preferences",
          color: "text-gray-500"
        },
        // 'viewReport' is a sub-view, not a main menu item
      ];

    const filteredMenuItems = menuItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeMenuItem = menuItems.find(item => item.id === currentView);


    // --- Render Logic ---
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-foreground">
            {/* Navbar Placeholder - If you have one, include it here, otherwise remove this comment */}
            {/* <Navbar /> */}

            <main className="pt-0"> {/* Adjusted pt-0 as we're handling the main structure */}
                <div className="flex">
                    {/* Sidebar */}
                    <div className={cn(
                        "fixed md:relative top-0 md:top-0 left-0 h-screen", // Use h-screen
                        "bg-white/80 backdrop-blur-xl border-r border-gray-200/60",
                        "shadow-xl md:shadow-none z-30 transition-all duration-300 ease-in-out",
                        sidebarCollapsed ? 'w-16' : 'w-80',
                        "flex flex-col" // Added flex-col to enable scrolling for content
                    )}>
                        {/* Sidebar Header */}
                        <div className="p-6 border-b border-gray-100 flex-shrink-0"> {/* flex-shrink-0 to prevent shrinking */}
                            <div className="flex items-center justify-between">
                                {!sidebarCollapsed && (
                                    <div className="animate-fade-in">
                                        <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                            Organizer Panel
                                        </h2>
                                        <p className="text-sm text-muted-foreground mt-1">Manage your events</p>
                                    </div>
                                )}
                                <button
                                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                    className="p-2 rounded-lg hover:bg-muted transition-colors duration-200"
                                >
                                    {sidebarCollapsed ? <Menu className="h-4 w-4 text-foreground" /> : <X className="h-4 w-4 text-foreground" />}
                                </button>
                            </div>

                            {/* Search Bar */}
                            {!sidebarCollapsed && (
                                <div className="mt-4 relative animate-fade-in">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search menu..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 text-sm bg-muted border border-border rounded-lg
                                                   focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                                                   transition-all duration-200"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Navigation Menu */}
                        <nav className="p-4 space-y-2 overflow-y-auto custom-scrollbar flex-grow"> {/* Added flex-grow for scrollable area */}
                            {filteredMenuItems.map((item, index) => {
                                const isActive = currentView === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleViewChange(item.id)}
                                        className={cn(
                                            `group relative w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm rounded-xl`,
                                            `transition-all duration-300 ease-out transform hover:scale-[1.02]`,
                                            isActive
                                                ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg shadow-primary/25"
                                                : "hover:bg-muted text-muted-foreground hover:text-foreground",
                                            "animate-fade-in" // Apply fade-in to menu items
                                        )}
                                        style={{
                                            animationDelay: `${index * 50}ms`
                                        }}
                                    >
                                        {/* Icon with dynamic color */}
                                        <item.icon className={cn(
                                            `h-5 w-5 transition-all duration-300`,
                                            isActive ? "text-primary-foreground" : item.color, // Keep item.color for non-active, text-primary-foreground for active
                                            sidebarCollapsed ? "mx-auto" : ""
                                        )} />

                                        {!sidebarCollapsed && (
                                            <>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">{item.name}</div>
                                                    <div className={cn(
                                                        `text-xs truncate transition-colors duration-300`,
                                                        isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                                                    )}>
                                                        {item.description}
                                                    </div>
                                                </div>

                                                {/* Active indicator */}
                                                <ChevronRight className={cn(
                                                    `h-4 w-4 transition-all duration-300`,
                                                    isActive ? "text-primary-foreground opacity-100 transform rotate-90" : "text-muted-foreground opacity-0 group-hover:opacity-50"
                                                )} />
                                            </>
                                        )}

                                        {/* Hover effect for collapsed sidebar */}
                                        {sidebarCollapsed && (
                                            <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg
                                                        opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none
                                                        whitespace-nowrap z-50">
                                                {item.name}
                                                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1
                                                            border-4 border-transparent border-r-gray-900"></div>
                                            </div>
                                        )}

                                        {/* Active tab indicator */}
                                        {isActive && (
                                            <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8
                                                        bg-primary-foreground rounded-l-full opacity-80"></div>
                                        )}
                                    </button>
                                );
                            })}

                            {/* Quick Actions */}
                            {!sidebarCollapsed && (
                                <div className="pt-6 mt-6 border-t border-border flex-shrink-0">
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-4">
                                        Quick Actions
                                    </h3>
                                    <div className="space-y-2">
                                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground
                                                    hover:bg-primary/10 hover:text-primary rounded-lg transition-all duration-200
                                                    group">
                                            <Plus className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                                            Create Event
                                        </button>
                                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground
                                                    hover:bg-secondary/10 hover:text-secondary rounded-lg transition-all duration-200
                                                    group">
                                            <Bell className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                                            Notifications
                                        </button>
                                    </div>
                                </div>
                            )}
                            {/* Logout Button in Sidebar */}
                            {!sidebarCollapsed && (
                                <div className="p-4 mt-auto pt-6 border-t border-border flex-shrink-0">
                                    <button
                                        onClick={handleLogout}
                                        disabled={isLoading}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600
                                                    hover:bg-red-50 rounded-lg transition-all duration-200 group"
                                    >
                                        <X className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                                        {isLoading ? 'Logging Out...' : 'Logout'}
                                    </button>
                                </div>
                            )}
                        </nav>
                    </div>

                    {/* Main Content Area */}
                    <div className={cn(
                        "flex-1 transition-all duration-300",
                        sidebarCollapsed ? 'ml-16' : 'ml-0 md:ml-80' // Adjusted based on sidebar width
                    )}>
                        {/* Content Header */}
                        <div className="bg-white/70 backdrop-blur-sm border-b border-border px-8 py-6 sticky top-0 z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                                        {activeMenuItem && (
                                            <activeMenuItem.icon className={`h-6 w-6 ${activeMenuItem.color}`} />
                                        )}
                                        {activeMenuItem?.name}
                                    </h1>
                                    <p className="text-muted-foreground mt-1">{activeMenuItem?.description}</p>
                                </div>

                                {/* Breadcrumb indicator */}
                                <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                                    <span>Dashboard</span>
                                    <ChevronRight className="h-4 w-4" />
                                    <span className="text-foreground font-medium">{activeMenuItem?.name}</span>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="p-8 min-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar"> {/* Added custom-scrollbar here */}
                            {/* Global error/success messages */}
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

                            {/* --- Overview Section --- */}
                            {currentView === 'overview' && (
                                <div className="space-y-8 animate-fade-in-up">
                                    <h1 className="text-4xl font-extrabold text-gradient mb-6">
                                        Organizer Dashboard Overview
                                    </h1>
                                    <p className="text-lg text-foreground max-w-2xl">
                                        Welcome, {overallSummary?.organizer_name || 'Organizer'}! Here's a quick glance at your event management activities and key metrics.
                                    </p>

                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {/* Card for Total Events */}
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

                                        {/* Card for Upcoming Events */}
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

                                        {/* Card for Past Events */}
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

                                    {/* Quick Actions Card */}
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

                                    {/* Quick Stats section */}
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

                            {/* --- My Events Section --- */}
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

                            {/* --- Overall Stats Section --- */}
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

                            {/* --- Reports Section --- */}
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

                            {/* --- View Individual Event Report Section --- */}
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

                            {/* --- Settings Section (Placeholder) --- */}
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

            {/* <Footer /> If you have one, include it here, otherwise remove this comment and the import */}

            {/* Custom CSS for animations and scrollbar (copied from Dashboard.tsx) */}
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

                .animate-fade-in-up { /* Added for section animations */
                    animation: fade-in 0.5s ease-out forwards;
                }

                /* Smooth scrollbar */
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