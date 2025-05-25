import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { CalendarDays, DollarSign, CheckCircle } from 'lucide-react';
import OrganizerNavigation from './OrganizerNavigation';
import OrganizerReports from './OrganizerReports';
import OrganizerStats from './OrganizerStats';
import { debounce } from 'lodash';

interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
}

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

const OrganizerDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<'overview' | 'myEvents' | 'overallStats' | 'reports' | 'settings' | 'viewReport'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const [organizerEvents, setOrganizerEvents] = useState<Event[]>([]);
  const [eventReport, setEventReport] = useState<EventReport | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
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

  const fetchEventReport = useCallback(async (eventId: number) => {
    setIsLoading(true);
    setError(undefined);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/event/${eventId}/report`, {
        credentials: 'include'
      });

      if (!response.ok) {
        await handleFetchError(response);
        return;
      }

      const data: EventReport = await response.json();
      setEventReport(data);
      toast({
        title: "Success",
        description: "Event report fetched successfully.",
        variant: "default",
      });
    } catch (err) {
      console.error('Fetch event report error:', err);
      setError('An unexpected error occurred while fetching the event report.');
      toast({
        title: "Error",
        description: 'An unexpected error occurred while fetching the event report.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [handleFetchError, toast]);

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
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view as any);
    setError(undefined);
    setSuccessMessage('');
  };

  const handleViewReport = (eventId: number) => {
    setSelectedEventId(eventId);
    setCurrentView('viewReport');
    fetchEventReport(eventId);
  };

  useEffect(() => {
    if (currentView === 'myEvents') {
      fetchOrganizerEvents();
    }
  }, [currentView, fetchOrganizerEvents]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <div className="flex gap-6">
          <div className="w-48 flex-shrink-0">
            <OrganizerNavigation
              currentView={currentView}
              onViewChange={handleViewChange}
              onLogout={handleLogout}
              isLoading={isLoading}
            />
          </div>
          <div className="flex-1">
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
                    <button onClick={() => handleViewChange('myEvents')} className="px-4 py-2 bg-blue-500 text-white rounded">Manage Events</button>
                    <button onClick={() => handleViewChange('overallStats')} className="px-4 py-2 bg-gray-200 rounded">View Overall Stats</button>
                  </CardContent>
                </Card>
              </div>
            )}

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
                          <p className="text-sm text-gray-600">Event ID: {event.id}</p>
                        </CardContent>
                        <div className="p-4 border-t flex gap-2 justify-end">
                          <button onClick={() => console.log('Edit event:', event.id)} className="px-4 py-2 bg-blue-500 text-white rounded">Edit Event</button>
                          <button onClick={() => handleViewReport(event.id)} className="px-4 py-2 bg-gray-200 rounded">View Report</button>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <p className="text-muted-foreground col-span-full">No events found. Start by creating a new event!</p>
                  )}
                </div>
              </div>
            )}

            {currentView === 'overallStats' && (
              <OrganizerStats />
            )}

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

            {currentView === 'viewReport' && selectedEventId !== null && (
              <div className="space-y-6">
                <button onClick={() => setCurrentView('myEvents')} className="mb-4 px-4 py-2 bg-gray-200 rounded">
                  ← Back to My Events
                </button>
                <h1 className="text-3xl font-bold text-foreground">
                  Event Report: {organizerEvents.find(e => e.id === selectedEventId)?.name || 'Unknown Event'}
                </h1>
                <OrganizerReports
                  eventReport={eventReport}
                  isLoading={isLoading}
                  error={error}
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
