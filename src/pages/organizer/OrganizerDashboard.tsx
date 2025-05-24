import React, { useState, useEffect, useCallback } from 'react';
import OrganizerNavigation from './OrganizerNavigation'; // Adjust path if needed
import OrganizerReports from './OrganizerReports';      // Adjust path if needed
import OrganizerStats from './OrganizerStats';          // Import OrganizerStats
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui button
import { toast } from "@/components/ui/use-toast"; // Assuming shadcn/ui toast notifications
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // For better UI in My Events

// --- Interfaces for Data Structures ---
// These interfaces define the shape of the data you expect from your backend.
// Ensure these match your actual API responses.

export interface EventReport {
    event_id: number;
    event_name: string;
    total_tickets_sold: number;
    number_of_attendees: number;
    total_revenue: number;
    event_date: string; // e.g., "2025-07-15"
    event_location: string;
    tickets_sold_by_type: { [key: string]: number }; // e.g., { "VIP": 10, "General": 50 }
    revenue_by_ticket_type: { [key: string]: number }; // e.g., { "VIP": 2000, "General": 1500 }
    attendees_by_ticket_type: { [key: string]: number }; // e.g., { "VIP": 8, "General": 45 }
    payment_method_usage: { [key: string]: number }; // e.g., { "Credit Card": 80, "M-Pesa": 20 }
    // Data structured specifically for Recharts graphs (array of objects { name: '...', value: ... })
    tickets_sold_by_type_for_graph: { labels: string[], data: number[] };
    attendees_by_ticket_type_for_graph: { labels: string[], data: number[] };
    revenue_by_ticket_type_for_graph: { labels: string[], data: number[] };
    payment_method_usage_for_graph: { labels: string[], data: number[] };
}

export interface OrganizerEvent {
    id: number;
    name: string;
    date: string; // e.g., "2025-07-15"
    location: string;
    // Add any other event details you might display in the 'My Events' list
}

// --- OrganizerDashboard Component ---
const OrganizerDashboard: React.FC = () => {
    // State to manage the currently displayed section/view of the dashboard
    const [currentView, setCurrentView] = useState<string>('overview'); // Changed default to 'overview'

    // State to manage which event's report is being viewed
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

    // States for fetching and displaying the event report
    const [eventReport, setEventReport] = useState<EventReport | null>(null); // Stores the fetched report data
    const [isLoading, setIsLoading] = useState<boolean>(false); // True when data is being fetched
    const [error, setError] = useState<string | null>(null); // Stores any error message

    // Dummy data for organizer's events.
    // In a real application, this would be fetched from your backend.
    const [organizerEvents, setOrganizerEvents] = useState<OrganizerEvent[]>([
        { id: 1, name: 'Summer Music Fest', date: '2025-07-15', location: 'Central Park Arena' },
        { id: 2, name: 'Tech Innovations Summit', date: '2025-09-01', location: 'Convention Center Hall A' },
        { id: 3, name: 'Annual Art Exhibition', date: '2025-10-20', location: 'Grand Gallery' },
        { id: 4, name: 'Local Farmers Market', date: '2025-11-05', location: 'Town Square' },
    ]);

    // --- Data Fetching Logic (Simulated) ---

    // useCallback hook to memoize the fetchEventReport function.
    // This prevents it from being re-created on every render, which is good for performance
    // and helps with dependency arrays in useEffect.
    const fetchEventReport = useCallback(async (eventId: number) => {
        setIsLoading(true);    // Set loading state to true
        setError(null);        // Clear any previous error
        setEventReport(null);  // Clear any previous report data

        try {
            // Simulate API call delay (e.g., 1.5 seconds)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // --- IMPORTANT: Replace this dummy data logic with your actual API call ---
            /*
            // Example of how you would fetch data in a real application:
            const token = localStorage.getItem('authToken'); // Get auth token
            if (!token) {
                throw new Error("Authentication token not found.");
            }
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/organizer/events/${eventId}/report`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch report for event ID: ${eventId}.`);
            }
            const data: EventReport = await response.json();
            setEventReport(data);
            toast({ title: "Report Loaded", description: "Event report fetched successfully.", duration: 3000 });
            */

            // --- Dummy Data for demonstration ---
            let data: EventReport | null = null;
            if (eventId === 1) {
                data = {
                    event_id: 1,
                    event_name: 'Summer Music Fest',
                    total_tickets_sold: 1250,
                    number_of_attendees: 1100, // Should be less than or equal to tickets sold
                    total_revenue: 75000.50,
                    event_date: '2025-07-15',
                    event_location: 'Central Park Arena',
                    tickets_sold_by_type: { "General Admission": 1000, "VIP Pass": 200, "Early Bird": 50 },
                    revenue_by_ticket_type: { "General Admission": 50000.00, "VIP Pass": 20000.00, "Early Bird": 5000.50 },
                    attendees_by_ticket_type: { "General Admission": 950, "VIP Pass": 150, "Early Bird": 0 }, // Some early birds might not have attended yet
                    payment_method_usage: { "Credit Card": 800, "M-Pesa": 400, "PayPal": 50 },
                    tickets_sold_by_type_for_graph: { labels: ["General Admission", "VIP Pass", "Early Bird"], data: [1000, 200, 50] },
                    attendees_by_ticket_type_for_graph: { labels: ["General Admission", "VIP Pass", "Early Bird"], data: [950, 150, 0] },
                    revenue_by_ticket_type_for_graph: { labels: ["General Admission", "VIP Pass", "Early Bird"], data: [50000, 20000, 5000.50] },
                    payment_method_usage_for_graph: { labels: ["Credit Card", "M-Pesa", "PayPal"], data: [800, 400, 50] },
                };
            } else if (eventId === 2) {
                data = {
                    event_id: 2,
                    event_name: 'Tech Innovations Summit',
                    total_tickets_sold: 500,
                    number_of_attendees: 480,
                    total_revenue: 120000.00,
                    event_date: '2025-09-01',
                    event_location: 'Convention Center Hall A',
                    tickets_sold_by_type: { "Standard Pass": 400, "Premium Pass": 100 },
                    revenue_by_ticket_type: { "Standard Pass": 80000.00, "Premium Pass": 40000.00 },
                    attendees_by_ticket_type: { "Standard Pass": 390, "Premium Pass": 90 },
                    payment_method_usage: { "Credit Card": 450, "Bank Transfer": 50 },
                    tickets_sold_by_type_for_graph: { labels: ["Standard Pass", "Premium Pass"], data: [400, 100] },
                    attendees_by_ticket_type_for_graph: { labels: ["Standard Pass", "Premium Pass"], data: [390, 90] },
                    revenue_by_ticket_type_for_graph: { labels: ["Standard Pass", "Premium Pass"], data: [80000, 40000] },
                    payment_method_usage_for_graph: { labels: ["Credit Card", "Bank Transfer"], data: [450, 50] },
                };
            } else if (eventId === 3) {
                   data = {
                    event_id: 3,
                    event_name: 'Annual Art Exhibition',
                    total_tickets_sold: 200,
                    number_of_attendees: 180,
                    total_revenue: 10000.00,
                    event_date: '2025-10-20',
                    event_location: 'Grand Gallery',
                    tickets_sold_by_type: { "Adult": 150, "Student": 50 },
                    revenue_by_ticket_type: { "Adult": 8000.00, "Student": 2000.00 },
                    attendees_by_ticket_type: { "Adult": 140, "Student": 40 },
                    payment_method_usage: { "Credit Card": 100, "Cash": 100 },
                    tickets_sold_by_type_for_graph: { labels: ["Adult", "Student"], data: [150, 50] },
                    attendees_by_ticket_type_for_graph: { labels: ["Adult", "Student"], data: [140, 40] },
                    revenue_by_ticket_type_for_graph: { labels: ["Adult", "Student"], data: [8000, 2000] },
                    payment_method_usage_for_graph: { labels: ["Credit Card", "Cash"], data: [100, 100] },
                };
            }
            // If an unknown eventId is selected in dummy data, simulate no report
            if (!data) {
                throw new Error(`No report data found for event ID: ${eventId}.`);
            }

            setEventReport(data);
            toast({ title: "Report Loaded", description: "Event report fetched successfully.", duration: 3000 });

        } catch (err: any) { // Type 'any' for err as it can be string or Error object
            console.error("Failed to fetch event report:", err);
            setError(err.message || "An unknown error occurred while fetching the report.");
            toast({ variant: "destructive", title: "Report Error", description: err.message || "Failed to load event report." });
        } finally {
            setIsLoading(false); // Always reset loading state
        }
    }, []); // Empty dependency array means this function is created once

    // Effect to fetch report data when 'viewReport' is activated and an event is selected
    useEffect(() => {
        if (currentView === 'viewReport' && selectedEventId !== null && !eventReport && !isLoading) {
            fetchEventReport(selectedEventId);
        }
    }, [currentView, selectedEventId, eventReport, isLoading, fetchEventReport]); // Dependencies for useEffect

    // --- Handlers for User Interactions ---

    // Handles changing the main dashboard view (e.g., from 'My Events' to 'Reports')
    const handleViewChange = (view: string) => {
        setCurrentView(view);
        // Reset report-specific states if navigating away from 'viewReport'
        if (view !== 'viewReport') {
            setSelectedEventId(null);
            setEventReport(null);
            setError(null);
            setIsLoading(false);
        }
    };

    // Handles the action of viewing a specific event's report
    const handleViewReport = (eventId: number) => {
        setSelectedEventId(eventId);
        setCurrentView('viewReport'); // Change to the report view
        // fetchEventReport will be triggered by the useEffect due to selectedEventId change
    };

    // Handles the logout functionality (simulated)
    const handleLogout = () => {
        setIsLoading(true); // Indicate that logout is in progress
        toast({ title: "Logging out...", description: "Please wait.", duration: 2000 });

        // Simulate API call for logout (replace with actual logout logic)
        setTimeout(() => {
            console.log("Logged out successfully");
            // In a real app:
            // - Clear authentication tokens (e.g., localStorage.removeItem('authToken'))
            // - Redirect to login page (e.g., history.push('/login'))
            setIsLoading(false);
            // Reset relevant states
            setCurrentView('overview');
            setSelectedEventId(null);
            setEventReport(null);
            setError(null);
            toast({ title: "Logged Out", description: "You have been successfully logged out.", duration: 3000 });
        }, 1500); // Simulate network delay
    };

    // Find the name of the selected event for the report title
    const currentEventName = selectedEventId
        ? organizerEvents.find(e => e.id === selectedEventId)?.name || 'Unknown Event'
        : 'Loading Event Name...';

    // --- Component JSX Structure ---
    return (
        <div className="flex min-h-screen bg-background">
            {/* Left Sidebar: Organizer Navigation */}
            <OrganizerNavigation
                currentView={currentView}
                onViewChange={handleViewChange}
                onLogout={handleLogout}
                isLoading={isLoading} // Pass global loading state to disable logout button
            />

            {/* Main Content Area */}
            <main className="flex-1 p-6 lg:p-8">
                {/* Conditional rendering of content based on 'currentView' state */}

                {/* Overview Section */}
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
                                    {organizerEvents.length}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Upcoming Events</CardTitle>
                                </CardHeader>
                                <CardContent className="text-3xl font-bold text-green-500">
                                    {organizerEvents.filter(e => new Date(e.date) > new Date()).length}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Past Events</CardTitle>
                                </CardHeader>
                                <CardContent className="text-3xl font-bold text-red-500">
                                    {organizerEvents.filter(e => new Date(e.date) <= new Date()).length}
                                </CardContent>
                            </Card>
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="flex gap-2">
                                <Button onClick={() => handleViewChange('myEvents')}>Manage Events</Button>
                                <Button variant="outline" onClick={() => handleViewChange('overallStats')}>View Overall Stats</Button> {/* Updated button */}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* My Events Section */}
                {currentView === 'myEvents' && (
                    <div className="space-y-6">
                        <h1 className="text-3xl font-bold text-foreground">My Events</h1>
                        <p className="text-muted-foreground text-lg">
                            View and manage all your past and upcoming events.
                        </p>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {organizerEvents.length > 0 ? (
                                organizerEvents.map(event => (
                                    <Card key={event.id} className="flex flex-col h-full">
                                        <CardHeader>
                                            <CardTitle>{event.name}</CardTitle>
                                            <CardDescription>{event.date} • {event.location}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-grow">
                                            {/* Additional event details can go here */}
                                            <p className="text-sm text-gray-600">Event ID: {event.id}</p>
                                        </CardContent>
                                        <div className="p-4 border-t flex gap-2 justify-end">
                                            <Button size="sm" onClick={() => console.log('Edit event:', event.id)}>Edit Event</Button>
                                            <Button size="sm" variant="outline" onClick={() => handleViewReport(event.id)}>View Report</Button>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <p className="text-muted-foreground col-span-full">No events found. Start by creating a new event!</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Overall Statistics Section (using OrganizerStats component) */}
                {currentView === 'overallStats' && (
                    <OrganizerStats /> 
                )}

                {/* Reports Section (General - directs to My Events to pick an event) */}
                {currentView === 'reports' && (
                    <div className="space-y-6">
                        <h1 className="text-3xl font-bold text-foreground">Event Reports</h1>
                        <p className="text-muted-foreground text-lg">
                            Access detailed reports for individual events. Select an event from "My Events" to generate its report.
                        </p>
                        <Card>
                            <CardContent className="p-6 text-center text-muted-foreground">
                                <p>Navigate to "My Events" to select an event and click "View Report".</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Settings Section (Placeholder) */}
                {currentView === 'settings' && (
                    <div className="space-y-6">
                        <h1 className="text-3xl font-bold text-foreground">Organizer Settings</h1>
                        <p className="text-muted-foreground text-lg">
                            Manage your profile, account preferences, and other organizer-specific settings.
                        </p>
                        <Card>
                            <CardContent className="p-6 text-center text-muted-foreground">
                                <p>Settings management coming soon!</p>
                                <p>This could include profile updates, notification preferences, etc.</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Specific Event Report View */}
                {currentView === 'viewReport' && selectedEventId !== null && (
                    <div className="space-y-6">
                        {/* Back button to return to 'My Events' */}
                        <Button onClick={() => setCurrentView('myEvents')} className="mb-4">
                            ← Back to My Events
                        </Button>
                        {/* Dynamic title for the report */}
                        <h1 className="text-3xl font-bold text-foreground">
                            Event Report: {currentEventName}
                        </h1>
                        {/* OrganizerReports component is rendered here,
                            receiving the fetched report data, loading state, and error state. */}
                        <OrganizerReports
                            eventReport={eventReport}
                            isLoading={isLoading}
                            error={error}
                        />
                    </div>
                )}
            </main>
        </div>
    );
};

export default OrganizerDashboard;