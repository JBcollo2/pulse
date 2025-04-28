import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
// Import icons needed for the remaining views
import { Users, CalendarDays, DollarSign, CheckCircle, Package, ListTodo, Ticket, BarChart, Home } from 'lucide-react'; // Removed Settings icon import
import OrganizerNavigation from './OrganizerNavigation';
import { Button } from '@/components/ui/button';

// Define the possible views for the organizer dashboard (Removed 'settings')
type OrganizerDashboardView = 'overview' | 'myEvents' | 'viewTicketTypes' | 'viewReport' | 'stats' | 'reports';

// Define types for event, ticket type, and report, based on your backend's output
interface OrganizerEvent {
    id: number;
    name: string;
    description: string;
    date: string; // Or Date if you parse it
    start_time: string;
    end_time: string | null;
    location: string;
    image: string | null;
    organizer_id: number;
    // Add other fields if your as_dict() includes them
    quantity_sold?: number;
}

interface TicketType {
    id: number;
    event_id: number; // Link to the event
    type_name: string;
    price: number;
    quantity: number; // Total quantity
    quantity_sold?: number;
    // Add other fields if your as_dict() includes them
}

// Type for the fetched event report data
export interface EventReport {
    event_id: number;
    event_name: string;
    event_date: string; // Or Date if you parse it
    event_location: string;
    total_tickets_sold: number;
    tickets_sold_by_type: { [key: string]: number };
    tickets_sold_by_type_for_graph: { labels: string[]; data: number[] };
    number_of_attendees: number;
    attendees_by_ticket_type: { [key: string]: number };
    attendees_by_ticket_type_for_graph: { labels: string[]; data: number[] };
    total_revenue: number;
    revenue_by_ticket_type: { [key: string]: number };
    revenue_by_ticket_type_for_graph: { labels: string[]; data: number[] };
    payment_method_usage: { [key: string]: number };
    payment_method_usage_for_graph: { labels: string[]; data: number[] };
    // Add other fields if your backend returns them
}

// Import the OrganizerReports component
import OrganizerReports from './OrganizerReports';
// Import the OrganizerStats component
import OrganizerStats from './OrganizerStats';
// Import OrganizerReportsOverview if you create a distinct overall reports component
// import OrganizerReportsOverview from './OrganizerReportsOverview';


const OrganizerDashboard: React.FC = () => {
  // State for controlling the current view
  // Initial view set to 'overview'
  const [currentView, setCurrentView] = useState<OrganizerDashboardView>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Error can be null
  const [successMessage, setSuccessMessage] = useState('');

  // State to hold the list of events created by the organizer
  const [organizerEvents, setOrganizerEvents] = useState<OrganizerEvent[]>([]);
  // State to hold the ID of the currently selected event for viewing ticket types or reports
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
   // State to hold the ticket types for the selected event
  const [eventTicketTypes, setEventTicketTypes] = useState<TicketType[]>([]);
   // State to hold the report data for the selected event
  const [eventReport, setEventReport] = useState<EventReport | null>(null);


  const { toast } = useToast();

  const handleFetchError = async (response: Response) => {
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
  };

  // Function to fetch all events created by the organizer
  const fetchOrganizerEvents = async () => {
    setIsLoading(true);
    setError(null); // Clear previous errors
    setOrganizerEvents([]); // Clear previous events
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/organizer/events`, {
        credentials: 'include',
      });

      if (!response.ok) {
        await handleFetchError(response);
         if (response.status === 403) {
             setError("You are not authorized to view your events.");
         } else {
              setError('Failed to fetch your events.');
         }
        return;
      }

      const data: OrganizerEvent[] = await response.json();
      // TODO: You might need to fetch ticket types separately or enhance the event endpoint
      // to get quantity_sold and revenue for the overview stats efficiently.
      setOrganizerEvents(data);
    } catch (err) {
      console.error('Fetch organizer events error:', err);
      setError('An unexpected error occurred while fetching your events.');
      toast({
        title: "Error",
        description: 'An unexpected error occurred while fetching your events.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch ALL ticket types and filter by selected event ID (inefficient method)
  const fetchAndFilterTicketTypes = async (eventId: number) => {
      setIsLoading(true);
      setError(null); // Clear previous errors
      setEventTicketTypes([]); // Clear previous ticket types
      setEventReport(null); // Clear report when viewing ticket types for an event
      try {
          // NOTE: This endpoint fetches ALL ticket types. Filtering is done on the frontend.
          // A more efficient approach would be a backend endpoint filtered by eventId.
          const response = await fetch(`${import.meta.env.VITE_API_URL}/ticket-types`, {
              credentials: 'include',
          });

          if (!response.ok) {
              await handleFetchError(response);
               setError('Failed to fetch ticket types.');
              return;
          }

          const result = await response.json(); // Assuming the response is { ticket_types: [...] }
          const allTicketTypes: TicketType[] = result.ticket_types || []; // Access the list

          // Filter ticket types by the selected event ID
          const filteredTicketTypes = allTicketTypes.filter(ticket => ticket.event_id === eventId);

          setEventTicketTypes(filteredTicketTypes);

      } catch (err) {
          console.error('Fetch ticket types error:', err);
          setError('An unexpected error occurred while fetching ticket types.');
          toast({
              title: "Error",
              description: 'An unexpected error occurred while fetching ticket types.',
              variant: "destructive",
          });
      } finally {
          setIsLoading(false);
      }
  };

  // Function to fetch the report for a specific event
  const fetchEventReport = async (eventId: number) => {
      setIsLoading(true);
      setError(null); // Clear previous errors
      setEventReport(null); // Clear previous report
      setEventTicketTypes([]); // Clear ticket types when viewing report for an event
      try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/event/${eventId}/report`, {
              credentials: 'include', // Important for sending cookies with JWT
          });

          if (!response.ok) {
              await handleFetchError(response);
               if (response.status === 403) {
                  setError("You are not authorized to view this report.");
              } else {
                   setError('Failed to fetch event report.');
              }
              return;
          }

          const reportData: EventReport = await response.json();
          setEventReport(reportData);

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
  };


  // Effect to fetch data when the view changes or selected event changes
  useEffect(() => {
    // Fetch organizer events only when entering the 'myEvents' or 'overview' view
    if (currentView === 'myEvents' || currentView === 'overview') {
        // Only fetch if events haven't been loaded or if explicitly refreshing 'myEvents'
       // Avoid refetching on mount if already in overview/myEvents and data exists
       if (currentView === 'myEvents' || organizerEvents.length === 0) {
            fetchOrganizerEvents();
       }
       // Clear states related to specific event views when leaving them
       setSelectedEventId(null);
       setEventTicketTypes([]);
       setEventReport(null);
       setError(null); // Clear errors specific to per-event views
    } else if (currentView === 'viewTicketTypes' && selectedEventId !== null) {
        fetchAndFilterTicketTypes(selectedEventId);
         setError(null); // Clear errors from other views
    } else if (currentView === 'viewReport' && selectedEventId !== null) {
        fetchEventReport(selectedEventId);
        setError(null); // Clear errors from other views
    }
     // Add conditions here for fetching data for other views if needed
     // Fetch stats in OrganizerStats component itself
    // else if (currentView === 'reports') {
    //    fetchOverallReports(); // Implement this if needed
    //    setError(null);
    // }


  }, [currentView, selectedEventId]); // Re-run effect when currentView or selectedEventId changes


  // Placeholder for logout function
  const handleLogout = async () => {
    setIsLoading(true);
    setError(null); // Clear errors
    setSuccessMessage('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/organizer/logout`, {
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
      // Redirect to home or login page after successful logout
      window.location.href = '/'; // Or use react-router-dom's navigate
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

  // Function to handle navigation view changes
  // Using OrganizerDashboardView type ensures only valid views can be set
  const handleViewChange = (view: OrganizerDashboardView) => {
     setCurrentView(view);
     // Clear errors/messages and potentially selected event/data when changing views
     setError(null); // Clear errors
     setSuccessMessage(''); // Clear success messages
     // If changing away from specific event views, clear selected event and data
     if (view !== 'viewTicketTypes' && view !== 'viewReport') {
          setSelectedEventId(null);
          setEventTicketTypes([]);
          setEventReport(null);
     }
  };

  // Function to handle clicking on an event to view its ticket types
  const handleViewTicketTypes = (eventId: number) => {
      setSelectedEventId(eventId);
      setCurrentView('viewTicketTypes');
  };

  // Function to handle clicking on an event to view its report
   const handleViewReport = (eventId: number) => {
       setSelectedEventId(eventId);
       setCurrentView('viewReport');
   };


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <div className="flex gap-6">
          {/* Organizer Navigation Sidebar */}
          <div className="w-48 flex-shrink-0">
            <OrganizerNavigation
              currentView={currentView}
              onViewChange={handleViewChange}
              onLogout={handleLogout}
              isLoading={isLoading}
              // Pass only valid views to navigation if OrganizerNavigation expects a specific type
              // If OrganizerNavigation just takes strings, ensure it handles unknown IDs gracefully
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Conditional Rendering based on currentView */}

            {/* Overview/Default Dashboard View */}
            {currentView === 'overview' && (
              <div className="space-y-6">
                <h1>Organizer Dashboard Overview</h1>
                <p>This is your central hub to manage all your events and track performance.</p>

                {/* Placeholder for Dashboard Stats Summary Cards (using currently available data or placeholders) */}
                <section>
                   <h2>Quick Overview</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {/* Display count from fetched events */}
                                <div className="text-2xl font-bold">{organizerEvents.length}</div>
                                <p className="text-xs text-muted-foreground">Your total events</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Tickets Sold (All Events)</CardTitle>
                                 <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                 {/* Calculate from organizerEvents if quantity_sold is reliable, or show placeholder */}
                                <div className="text-2xl font-bold"> {/* Calculate or fetch this */} 0</div>
                                <p className="text-xs text-muted-foreground">Across all your events</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue (All Events)</CardTitle>
                                 <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {/* Calculate from organizerEvents if revenue data is available, or show placeholder */}
                                <div className="text-2xl font-bold">$0.00</div>
                                <p className="text-xs text-muted-foreground">Across all your events</p>
                            </CardContent>
                        </Card>
                   </div>
                </section>

                {/* Recent Events List */}
                 <section>
                     <h2>Your Recent Events</h2>
                      {/* Show loading, error, or event list */}
                     {isLoading ? ( // Show loading state
                         <p>Loading events...</p>
                     ) : error ? ( // Show error state
                         <p className="text-red-500">Error: {error}</p>
                     ) : organizerEvents.length > 0 ? (
                          <ul>
                            {organizerEvents.slice(0, 5).map(event => (
                                <li key={event.id}>{event.name} ({event.date})</li>
                             ))}
                          </ul>
                     ) : (
                         <p>No events to display.</p>
                     )}
                     {organizerEvents.length > 5 && (
                          <Button variant="link" onClick={() => handleViewChange('myEvents')}>
                             View All Events
                          </Button>
                     )}
                 </section>

              </div>
            )}

            {/* My Events View */}
            {currentView === 'myEvents' && (
               <div className="space-y-6">
                   <h1>Your Events</h1>
                   <p>Select an event to view details or reports.</p>

                    {/* Show loading, error, or event cards */}
                   {isLoading ? (
                       <p>Loading events...</p>
                   ) : error ? (
                       <p className="text-red-500">Error: {error}</p>
                   ) : organizerEvents.length > 0 ? (
                       // Display the list of events with action buttons
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                           {organizerEvents.map(event => (
                               <Card key={event.id}>
                                   <CardHeader>
                                       {event.image && (
                                           <img src={event.image} alt={event.name} className="w-full h-32 object-cover rounded-md mb-2" />
                                       )}
                                       <CardTitle>{event.name}</CardTitle>
                                       <CardDescription>{event.location}</CardDescription>
                                   </CardHeader>
                                   <CardContent>
                                       <p className="text-sm text-muted-foreground">Date: {event.date}</p>
                                       <p className="text-sm text-muted-foreground">Time: {event.start_time} {event.end_time ? `- ${event.end_time}` : 'Till Late'}</p>
                                        {/* Add buttons for actions */}
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <Button size="sm" onClick={() => handleViewTicketTypes(event.id)}>
                                                <Ticket className="mr-1 h-4 w-4" /> Ticket Types
                                            </Button>
                                             <Button size="sm" variant="secondary" onClick={() => handleViewReport(event.id)}>
                                                <BarChart className="mr-1 h-4 w-4" /> View Report
                                            </Button>
                                            {/* Placeholder Edit/Delete buttons */}
                                            {/* <Button size="sm" variant="outline">Edit</Button> */}
                                            {/* <Button size="sm" variant="destructive">Delete</Button> */}
                                        </div>
                                   </CardContent>
                               </Card>
                           ))}
                       </div>
                   ) : (
                       <p>You haven't created any events yet.</p>
                   )}
                    {/* Button to create a new event */}
                     <Button className="mt-4">Create New Event</Button> {/* You'll need to add navigation/modal for this */}
               </div>
            )}

            {/* View Ticket Types for Selected Event */}
            {currentView === 'viewTicketTypes' && selectedEventId !== null && (
                <div className="space-y-6">
                   {/* Find the selected event to display its name */}
                   <h2>Ticket Types for "{organizerEvents.find(e => e.id === selectedEventId)?.name || 'Selected Event'}"</h2>
                   <p>Here are the ticket types available for this event.</p>
                    {/* Button to go back */}
                    <Button variant="outline" onClick={() => handleViewChange('myEvents')}>
                         Back to My Events
                     </Button>

                   {isLoading ? ( // Show loading state
                       <p>Loading ticket types...</p>
                   ) : error ? ( // Show error state
                       <p className="text-red-500">Error: {error}</p>
                   ) : eventTicketTypes.length > 0 ? (
                       // Display the list of ticket types
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {eventTicketTypes.map(ticket => (
                                <Card key={ticket.id}>
                                    <CardHeader>
                                        <CardTitle>{ticket.type_name}</CardTitle>
                                        <CardDescription>Price: ${ticket.price?.toFixed(2) || '0.00'}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">Total Quantity: {ticket.quantity}</p>
                                        <p className="text-sm text-muted-foreground">Quantity Sold: {ticket.quantity_sold || 0}</p>
                                        <p className="text-sm text-muted-foreground">Quantity Available: {ticket.quantity - (ticket.quantity_sold || 0)}</p>

                                         {/* Add buttons for Edit/Delete ticket type */}
                                         <div className="mt-4 flex gap-2">
                                            {/* <Button size="sm" variant="outline">Edit Type</Button> */}
                                            {/* <Button size="sm" variant="destructive">Delete Type</Button> */}
                                         </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                   ) : (
                       <p>No ticket types found for this event.</p>
                   )}

                     {/* Button to create a new ticket type for this event */}
                    <Button className="mt-4 ml-2">Create New Ticket Type</Button>
                </div>
            )}

            {/* View Report for Selected Event */}
            {currentView === 'viewReport' && selectedEventId !== null && (
                 <div className="space-y-6">
                     {/* Display the event name for context */}
                      <h2>Report for "{organizerEvents.find(e => e.id === selectedEventId)?.name || 'Selected Event'}"</h2>
                       <p>Detailed report for this event.</p>

                       {/* Button to go back */}
                       <Button variant="outline" onClick={() => handleViewChange('myEvents')}>
                            Back to My Events
                        </Button>

                     {/* Render the OrganizerReports component to display the report */}
                    <OrganizerReports
                         isLoading={isLoading} // Pass loading state from dashboard fetch
                         error={error}       // Pass error state from dashboard fetch
                         eventReport={eventReport} // Pass the fetched report data
                    />
                 </div>
            )}


             {/* Stats View */}
             {currentView === 'stats' && (
                <div className="space-y-6">
                     {/* Render the OrganizerStats component */}
                     <OrganizerStats />
                </div>
             )}

              {/* Reports Overview View (if distinct from per-event reports) */}
              {currentView === 'reports' && (
                <div className="space-y-6">
                     <h1>Overall Reports</h1>
                     <p>Overall reports summary or a list of available reports will appear here.</p>
                     {/* Render OrganizerReportsOverview component if created */}
                     {/* <OrganizerReportsOverview /> */}
                </div>
              )}

               {/* Settings View (Removed as requested) */}
               {/* No longer rendering the settings block */}

          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;