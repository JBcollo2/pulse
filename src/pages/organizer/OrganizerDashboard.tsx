import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { CalendarDays, DollarSign, CheckCircle } from 'lucide-react';
import OrganizerNavigation from './OrganizerNavigation';
import OrganizerReports from './OrganizerReports'; // Now handles its own report fetching
import OrganizerStats from './OrganizerStats';     // Now handles displaying overall summary
import OrganizerProfileSettings from './OrganizerProfileSettings'; // Now handles profile data
import { debounce } from 'lodash'; // Already imported, good for search/filter if needed

// --- Interface Definitions ---
interface Event {
    id: number;
    name: string;
    date: string;
    location: string;
}

// NOTE: EventReport interface is now more relevant for OrganizerReports.tsx
// It's kept here for context if OrganizerDashboard needed to directly pass it,
// but the strategy here is for OrganizerReports to fetch its own.
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
}

const OrganizerDashboard: React.FC = () => {
    // --- State Management ---
    const [currentView, setCurrentView] = useState<'overview' | 'myEvents' | 'overallStats' | 'reports' | 'settings' | 'viewReport' | 'createEvent'>('overview');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const [successMessage, setSuccessMessage] = useState<string | undefined>();

    // Data states for views managed by OrganizerDashboard
    const [organizerEvents, setOrganizerEvents] = useState<Event[]>([]);
    const [overallSummary, setOverallSummary] = useState<OverallSummary | null>(null);

    // State for selected event when viewing a specific report
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

    // --- API Call Functions (Belong to OrganizerDashboard) ---

    // Endpoint: GET /organizer/events (Belongs to: dashboard.html)
    const fetchOrganizerEvents = useCallback(async () => {
        setIsLoading(true);
        setError(undefined);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/organizer/events`, {
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

    // Endpoint: GET /organizer/dashboard/summary (Belongs to: dashboard.html)
    const fetchOverallSummary = useCallback(async () => {
        setIsLoading(true);
        setError(undefined);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/organizer/dashboard/summary`, {
                credentials: 'include'
            });

            if (!response.ok) {
                await handleFetchError(response);
                return;
            }

            const data: OverallSummary = await response.json();
            setOverallSummary(data);
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

    // Endpoint: POST /organizer/event (Belongs to: dashboard.html - triggered by a form/modal)
    const createNewEvent = useCallback(async (eventData: { name: string, date: string, location: string, description?: string }) => {
        setIsLoading(true);
        setError(undefined);
        setSuccessMessage(undefined);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/organizer/event`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData),
                credentials: 'include'
            });

            if (!response.ok) {
                await handleFetchError(response);
                return;
            }

            const data = await response.json();
            setSuccessMessage(data.message || 'Event created successfully!');
            toast({
                title: "Success",
                description: data.message || "Event created successfully!",
                variant: "default",
            });
            fetchOrganizerEvents(); // Refresh event list after creation
            setCurrentView('myEvents'); // Navigate back to my events
        } catch (err) {
            console.error('Create event error:', err);
            setError('An unexpected error occurred while creating the event.');
            toast({
                title: "Error",
                description: 'An unexpected error occurred while creating the event.',
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [handleFetchError, toast, fetchOrganizerEvents]);

    // Logout Function
    const handleLogout = async () => {
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
            window.location.href = '/'; // Redirect to login/home after logout
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
    };

    // --- View Navigation Handlers ---
    const handleViewChange = (view: string) => {
        setCurrentView(view as any);
        setError(undefined); // Clear error messages on view change
        setSuccessMessage(undefined); // Clear success messages on view change
    };

    const handleViewReport = (eventId: number) => {
        setSelectedEventId(eventId);
        setCurrentView('viewReport');
        // OrganizerReports component will fetch the report itself based on selectedEventId
    };

    // --- useEffect for Data Fetching based on Current View ---
    useEffect(() => {
        if (currentView === 'myEvents') {
            fetchOrganizerEvents();
        } else if (currentView === 'overallStats') {
            fetchOverallSummary();
        }
        // 'viewReport' will trigger fetch in OrganizerReports based on selectedEventId change
        // 'settings' is handled by OrganizerProfileSettings internally
        // 'overview' can display basic counts from organizerEvents, no separate fetch needed for this demo
    }, [currentView, fetchOrganizerEvents, fetchOverallSummary]);

    // --- Render Logic ---
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto py-6">
                <div className="flex gap-6">
                    <div className="w-48 flex-shrink-0">
                        <OrganizerNavigation
                            currentView={currentView}
                            onViewChange={handleViewChange}
                            onLogout={handleLogout}
                            isLoading={isLoading} // Pass main dashboard loading state to navigation if needed
                        />
                    </div>
                    <div className="flex-1">
                        {/* Global Error and Success Messages */}
                        {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded border border-red-200">{error}</div>}
                        {successMessage && <div className="p-3 mb-4 bg-green-100 text-green-700 rounded border border-green-200">{successMessage}</div>}

                        {/* --- Overview Section (Belongs to: dashboard.html) --- */}
                        {currentView === 'overview' && (
                            <div className="space-y-6">
                                <h1 className="text-3xl font-bold text-foreground">Organizer Dashboard Overview</h1>
                                <p className="text-muted-foreground text-lg">
                                    Welcome to your event management dashboard. Here you can get a quick glance at your overall activities.
                                </p>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Total Events</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-3xl font-bold text-primary">
                                            {isLoading ? '...' : organizerEvents.length}
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Upcoming Events</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-3xl font-bold text-green-500">
                                            {isLoading ? '...' : organizerEvents.filter(e => new Date(e.date) > new Date()).length}
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Past Events</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-3xl font-bold text-red-500">
                                            {isLoading ? '...' : organizerEvents.filter(e => new Date(e.date) <= new Date()).length}
                                        </CardContent>
                                    </Card>
                                </div>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Quick Actions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex gap-2">
                                        <button onClick={() => handleViewChange('myEvents')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Manage Events</button>
                                        <button onClick={() => handleViewChange('overallStats')} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">View Overall Stats</button>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* --- My Events Section (Belongs to: dashboard.html) --- */}
                        {currentView === 'myEvents' && (
                            <div className="space-y-6">
                                <h1 className="text-3xl font-bold text-foreground">My Events</h1>
                                <p className="text-muted-foreground text-lg">
                                    View and manage all your past and upcoming events.
                                </p>
                                {/* Button to trigger event creation form/modal */}
                                <button
                                    onClick={() => handleViewChange('createEvent')}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mb-4"
                                >
                                    + Create New Event
                                </button>
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {isLoading ? (
                                        <p className="col-span-full text-center text-muted-foreground">Loading events...</p>
                                    ) : organizerEvents.length > 0 ? (
                                        organizerEvents.map(event => (
                                            <Card key={event.id} className="flex flex-col h-full">
                                                <CardHeader>
                                                    <CardTitle>{event.name}</CardTitle>
                                                    <CardDescription>{event.date} • {event.location}</CardDescription>
                                                </CardHeader>
                                                <CardContent className="flex-grow">
                                                    <p className="text-sm text-gray-600">Event ID: {event.id}</p>
                                                </CardContent>
                                                <div className="p-4 border-t flex gap-2 justify-end">
                                                    <button onClick={() => console.log('Edit event:', event.id)} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Edit Event</button>
                                                    <button onClick={() => handleViewReport(event.id)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">View Report</button>
                                                </div>
                                            </Card>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground col-span-full text-center">No events found. Start by creating a new event!</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* --- Overall Stats Section (Belongs to: dashboard.html) --- */}
                        {currentView === 'overallStats' && (
                            <OrganizerStats
                                overallSummary={overallSummary}
                                isLoading={isLoading}
                                error={error}
                            />
                        )}

                        {/* --- Reports Section (General navigation, links to specific reports) --- */}
                        {currentView === 'reports' && (
                            <div className="space-y-6">
                                <h1 className="text-3xl font-bold text-foreground">Event Reports</h1>
                                <p className="text-muted-foreground text-lg">
                                    Access detailed reports for individual events. Select an event from "My Events" to generate its report.
                                </p>
                                <Card>
                                    <CardContent className="p-6 text-center text-muted-foreground">
                                        <p>Reports are generated per event. Please go to "My Events" and click "View Report" for a specific event.</p>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* --- Profile Settings Section (Belongs to: profile_settings.html) --- */}
                        {currentView === 'settings' && (
                            <OrganizerProfileSettings />
                        )}

                        {/* --- View Individual Event Report Section (Belongs to: stats.html) --- */}
                        {currentView === 'viewReport' && selectedEventId !== null && (
                            <div className="space-y-6">
                                <button onClick={() => setCurrentView('myEvents')} className="mb-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                                    ← Back to My Events
                                </button>
                                <h1 className="text-3xl font-bold text-foreground">
                                    Event Report: {organizerEvents.find(e => e.id === selectedEventId)?.name || `Event ID: ${selectedEventId}`}
                                </h1>
                                <OrganizerReports
                                    eventId={selectedEventId}
                                    // isLoading and error are handled internally by OrganizerReports now
                                />
                            </div>
                        )}

                        {/* --- Create Event Section (Belongs to: dashboard.html, typically a form) --- */}
                        {currentView === 'createEvent' && (
                            <div className="space-y-6">
                                <h1 className="text-3xl font-bold text-foreground">Create New Event</h1>
                                <p className="text-muted-foreground text-lg">
                                    Fill in the details below to create a new event.
                                </p>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Event Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <form onSubmit={(e) => {
                                            e.preventDefault();
                                            const form = e.target as HTMLFormElement;
                                            const name = (form.elements.namedItem('eventName') as HTMLInputElement).value;
                                            const date = (form.elements.namedItem('eventDate') as HTMLInputElement).value;
                                            const location = (form.elements.namedItem('eventLocation') as HTMLInputElement).value;
                                            const description = (form.elements.namedItem('eventDescription') as HTMLInputElement).value;

                                            createNewEvent({ name, date, location, description });
                                        }}>
                                            <div>
                                                <label htmlFor="eventName" className="block text-sm font-medium text-gray-700">Event Name</label>
                                                <input type="text" id="eventName" name="eventName" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border" />
                                            </div>
                                            <div>
                                                <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700">Event Date</label>
                                                <input type="date" id="eventDate" name="eventDate" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border" />
                                            </div>
                                            <div>
                                                <label htmlFor="eventLocation" className="block text-sm font-medium text-gray-700">Location</label>
                                                <input type="text" id="eventLocation" name="eventLocation" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border" />
                                            </div>
                                            <div>
                                                <label htmlFor="eventDescription" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                                                <textarea id="eventDescription" name="eventDescription" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"></textarea>
                                            </div>
                                            <button type="submit" className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" disabled={isLoading}>
                                                {isLoading ? 'Creating...' : 'Create Event'}
                                            </button>
                                            <button type="button" onClick={() => setCurrentView('myEvents')} className="mt-4 ml-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                                                Cancel
                                            </button>
                                        </form>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizerDashboard;