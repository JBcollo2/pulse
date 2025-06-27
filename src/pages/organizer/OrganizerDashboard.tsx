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
  const [organizerName, setOrganizerName] = useState('Organizer');

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
    <div className="relative min-h-screen bg-gray-50 text-gray-800 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }}></div>

      <div className="relative z-10 flex min-h-screen">
        {/* Navigation Sidebar */}
        <div className={`fixed top-0 left-0 h-full z-50 ${isExpanded ? 'w-72' : 'w-20'} transition-all duration-300 ease-in-out`}>
          <OrganizerNavigation
            currentView={currentView}
            onViewChange={handleViewChange}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            isMobileOpen={isMobileOpen}
            setIsMobileOpen={setIsMobileOpen}
            organizerName={organizerName}
          />
        </div>

        {/* Main Content */}
        <div className={`flex-1 ${isExpanded ? 'md:ml-72' : 'md:ml-20'} p-4 pt-20 md:pt-4 transition-all duration-300 ease-in-out`}>
          {/* Header Section */}
          <div className={cn(
            "mb-8 p-6 md:p-8 rounded-xl shadow-lg border border-gray-200 overflow-hidden",
            "bg-white",
            `bg-gradient-to-r ${headerContent.gradient} text-white`
          )}>
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-full bg-white bg-opacity-20 shadow-inner transition-transform duration-300 hover:scale-105">
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

          {/* Overview Section */}
          {currentView === 'overview' && (
            <div className="space-y-8 animate-fade-in-up">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-6 text-gray-800">
                Organizer Dashboard Overview
              </h1>
              <p className="text-lg max-w-2xl text-gray-600">
                Welcome, {organizerName}! Here's a quick glance at your event management activities and key metrics.
              </p>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center shadow-md">
                      <LayoutDashboard className="w-5 h-5 text-gray-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">Total Events</h2>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-gray-800">
                    {isLoading ? '...' : organizerEvents.length}
                  </p>
                  <p className="text-sm mt-1 text-gray-600">All events you've organized.</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center shadow-md">
                      <CalendarDays className="w-5 h-5 text-gray-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">Upcoming Events</h2>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-gray-800">
                    {isLoading ? '...' : upcomingEvents.length}
                  </p>
                  <p className="text-sm mt-1 text-gray-600">Events scheduled for the future.</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center shadow-md">
                      <CheckCircle className="w-5 h-5 text-gray-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">Past Events</h2>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-gray-800">
                    {isLoading ? '...' : pastEvents.length}
                  </p>
                  <p className="text-sm mt-1 text-gray-600">Events that have already concluded.</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleViewChange('myEvents')}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:scale-105 hover:bg-gray-300 shadow-md text-sm font-medium transition-all duration-300"
                  >
                    View My Events
                  </button>
                  <button
                    onClick={() => handleViewChange('overallStats')}
                    className="px-4 py-2 bg-blue-200 text-gray-800 rounded-lg hover:scale-105 hover:bg-blue-300 shadow-md text-sm font-medium transition-all duration-300"
                  >
                    View Overall Stats
                  </button>
                  <button
                    onClick={() => handleViewChange('reports')}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:scale-105 hover:bg-gray-300 shadow-md text-sm font-medium transition-all duration-300"
                  >
                    Generate Reports
                  </button>
                </div>
              </div>

              {/* Summary Statistics */}
              {overallSummary && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-gray-600" />
                    <span className="text-lg font-semibold text-gray-800">Summary Statistics</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
                    <div className="flex justify-between items-center p-3 bg-gray-100 border border-gray-300 rounded-lg">
                      <span className="text-gray-600">Total Tickets Sold</span>
                      <span className="font-bold text-blue-600">{overallSummary.total_tickets_sold_across_all_events.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-100 border border-gray-300 rounded-lg">
                      <span className="text-gray-600">Total Revenue</span>
                      <span className="font-bold text-green-600">{overallSummary.total_revenue_across_all_events}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-100 border border-gray-300 rounded-lg">
                      <span className="text-gray-600">Total Events Analyzed</span>
                      <span className="font-bold text-blue-600">{overallSummary.total_events || overallSummary.events_summary.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-100 border border-gray-300 rounded-lg">
                      <span className="text-gray-600">Events with Data</span>
                      <span className="font-bold text-green-600">{overallSummary.events_summary.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* My Events Section */}
          {currentView === 'myEvents' && (
            <div className="space-y-8 animate-fade-in-up">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-6 text-gray-800">
                My Events
              </h1>
              <p className="text-lg max-w-2xl text-gray-600">
                View all your past and upcoming events and access their individual reports.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                  <p className="col-span-full text-center text-gray-600">Loading events...</p>
                ) : organizerEvents.length > 0 ? (
                  organizerEvents.map(event => (
                    <div key={event.id} className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl flex flex-col h-full">
                      <h3 className="text-xl font-semibold mb-2 text-gray-800">{event.name}</h3>
                      <p className="text-sm mb-3 text-gray-600">{event.date} • {event.location}</p>
                      {event.description && (
                        <p className="text-sm flex-grow mb-4 text-gray-800">{event.description}</p>
                      )}
                      <div className="mt-auto pt-4 border-t border-gray-200 flex items-center justify-between">
                        <span className={cn(
                          "inline-block px-3 py-1 text-xs font-medium rounded-full",
                          new Date(event.date) > new Date()
                            ? 'bg-gray-200 text-gray-800'
                            : 'bg-gray-300 text-gray-600'
                        )}>
                          {new Date(event.date) > new Date() ? 'Upcoming' : 'Past Event'}
                        </span>
                        <button
                          onClick={() => handleViewReport(event.id)}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:scale-105 hover:bg-gray-300 shadow-sm text-sm transition-all duration-300"
                        >
                          View Report
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center p-8 bg-white text-gray-600 border border-gray-200 rounded-xl shadow-sm">
                    <p className="mb-4">No events found.</p>
                    <p className="text-sm">Events are managed through the main event management system. Once created, they will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Overall Stats Section */}
          {currentView === 'overallStats' && (
            <div className="animate-fade-in-up">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-6 text-gray-800">
                Overall Statistics
              </h1>
              <p className="text-lg max-w-2xl mb-8 text-gray-600">
                Dive into the comprehensive performance metrics across all your events.
              </p>
              <OrganizerStats
                overallSummary={overallSummary}
                isLoading={isLoading}
                error={error}
                darkMode={false}
              />
            </div>
          )}

          {/* Reports Section */}
          {currentView === 'reports' && (
            <div className="space-y-8 animate-fade-in-up">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-6 text-gray-800">
                Event Reports
              </h1>
              <p className="text-lg max-w-2xl text-gray-600">
                Access detailed reports for individual events. Select an event from "My Events" to generate its report.
              </p>
              <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">How to Access Reports</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="bg-gray-200 text-gray-600 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                    <div>
                      <h4 className="font-semibold text-lg text-gray-800">Go to My Events</h4>
                      <p className="text-gray-600">Navigate to the "My Events" section from the sidebar to see all your events.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-gray-200 text-gray-600 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                    <div>
                      <h4 className="font-semibold text-lg text-gray-800">Select an Event</h4>
                      <p className="text-gray-600">Click the "View Report" button on any event card to access detailed analytics for that specific event.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-gray-200 text-gray-600 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                    <div>
                      <h4 className="font-semibold text-lg text-gray-800">Analyze Performance</h4>
                      <p className="text-gray-600">Review ticket sales, revenue, attendee demographics, and other important metrics to gain insights.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => handleViewChange('myEvents')}
                    className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:scale-105 hover:bg-gray-300 shadow-md text-sm font-medium transition-all duration-300"
                  >
                    Go to My Events
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* View Report Section */}
          {currentView === 'viewReport' && selectedEventId !== null && (
            <div className="space-y-8 animate-fade-in-up">
              <button
                onClick={() => setCurrentView('myEvents')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:scale-105 hover:bg-gray-300 shadow-sm text-sm transition-all duration-300"
              >
                <ChevronRight className="h-4 w-4 transform rotate-180" /> Back to My Events
              </button>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-6 text-gray-800">
                Event Report: {organizerEvents.find(e => e.id === selectedEventId)?.name || `Event ID: ${selectedEventId}`}
              </h1>
              <OrganizerReports
                eventId={selectedEventId}
                darkMode={false}
              />
            </div>
          )}

          {/* Settings Section */}
          {currentView === 'settings' && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 space-y-6 animate-fade-in-up transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-6 text-gray-800">
                Settings
              </h1>
              <p className="text-lg text-gray-600">Manage your profile and dashboard preferences here.</p>
              <p className="text-gray-600">
                This section is under development.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default OrganizerDashboard;