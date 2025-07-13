import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Ticket, TrendingUp, Building2, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Organizer {
  organizer_id: number;
  name: string;
  email: string;
  phone: string;
  event_count: number;
  report_count: number;
}

interface Event {
  event_id: number;
  name: string;
  event_date: string;
  location: string;
  report_count: number;
  revenue?: number;
  tickets_sold?: number;
}

interface ReportData {
  total_events: number;
  active_events: number;
  total_tickets_sold: number;
  total_revenue: number;
  currency: string;
  events: Event[];
  revenue_by_event: Array<{
    event_name: string;
    amount: number;
  }>;
  events_by_month: Array<{
    month: string;
    count: number;
  }>;
}

interface AdminDashboardStats {
  totalEvents: number;
  activeEvents: number;
  totalTickets: number;
  totalRevenue: number;
  currency: string;
  eventsByMonth: Array<{ month: string; count: number }>;
  revenueByEvent: Array<{ event_name: string; amount: number }>;
  recentEvents: Event[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0];
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-md">
        <p className="font-semibold text-gray-800 dark:text-gray-200">{label}</p>
        {dataItem.dataKey === 'amount' ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {`Revenue: KSH ${Number(dataItem.value).toLocaleString()}`}
          </p>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {`${dataItem.dataKey}: ${dataItem.value}`}
          </p>
        )}
      </div>
    );
  }
  return null;
};

const AdminDashboard = () => {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [selectedOrganizer, setSelectedOrganizer] = useState<string>('');
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats>({
    totalEvents: 0,
    activeEvents: 0,
    totalTickets: 0,
    totalRevenue: 0,
    currency: 'KSH',
    eventsByMonth: [],
    revenueByEvent: [],
    recentEvents: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch organizers list
  const fetchOrganizers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/organizers`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch organizers');
      }

      const data = await response.json();
      setOrganizers(data.organizers || []);
    } catch (error) {
      console.error('Error fetching organizers:', error);
      setError('Failed to load organizers');
    }
  };

  // Fetch report data for selected organizer
  const fetchReportData = async (organizerId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/reports?organizer_id=${organizerId}&format=json&include_charts=true&use_latest_rates=true`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const data: ReportData = await response.json();
      
      // Process the data to match our dashboard structure
      const processedStats: AdminDashboardStats = {
        totalEvents: data.total_events || 0,
        activeEvents: data.active_events || 0,
        totalTickets: data.total_tickets_sold || 0,
        totalRevenue: data.total_revenue || 0,
        currency: data.currency || 'KSH',
        eventsByMonth: data.events_by_month || [],
        revenueByEvent: data.revenue_by_event || [],
        recentEvents: (data.events || []).slice(0, 5)
      };

      setDashboardStats(processedStats);
      setError(null);
    } catch (error) {
      console.error('Error fetching report data:', error);
      setError('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch aggregate data for all organizers
  const fetchAggregateData = async () => {
    try {
      setIsLoading(true);
      let totalStats = {
        totalEvents: 0,
        activeEvents: 0,
        totalTickets: 0,
        totalRevenue: 0,
        currency: 'KSH',
        eventsByMonth: [] as Array<{ month: string; count: number }>,
        revenueByEvent: [] as Array<{ event_name: string; amount: number }>,
        recentEvents: [] as Event[]
      };

      // Fetch data for all organizers and aggregate
      const promises = organizers.map(async (organizer) => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/admin/reports?organizer_id=${organizer.organizer_id}&format=json&include_charts=true&use_latest_rates=true`,
            {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.error(`Error fetching data for organizer ${organizer.organizer_id}:`, error);
        }
        return null;
      });

      const results = await Promise.all(promises);
      const validResults = results.filter(result => result !== null);

      // Aggregate the data
      validResults.forEach((data: ReportData) => {
        totalStats.totalEvents += data.total_events || 0;
        totalStats.activeEvents += data.active_events || 0;
        totalStats.totalTickets += data.total_tickets_sold || 0;
        totalStats.totalRevenue += data.total_revenue || 0;
        
        // Aggregate events by month
        if (data.events_by_month) {
          data.events_by_month.forEach(monthData => {
            const existingMonth = totalStats.eventsByMonth.find(m => m.month === monthData.month);
            if (existingMonth) {
              existingMonth.count += monthData.count;
            } else {
              totalStats.eventsByMonth.push({ ...monthData });
            }
          });
        }

        // Aggregate revenue by event
        if (data.revenue_by_event) {
          totalStats.revenueByEvent.push(...data.revenue_by_event);
        }

        // Collect recent events
        if (data.events) {
          totalStats.recentEvents.push(...data.events);
        }
      });

      // Sort and limit recent events
      totalStats.recentEvents.sort((a, b) => 
        new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
      );
      totalStats.recentEvents = totalStats.recentEvents.slice(0, 5);

      // Sort revenue by event (highest first)
      totalStats.revenueByEvent.sort((a, b) => b.amount - a.amount);

      setDashboardStats(totalStats);
      setError(null);
    } catch (error) {
      console.error('Error fetching aggregate data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizers();
  }, []);

  useEffect(() => {
    if (organizers.length > 0) {
      if (selectedOrganizer) {
        fetchReportData(selectedOrganizer);
      } else {
        fetchAggregateData();
      }
    }
  }, [selectedOrganizer, organizers]);

  if (isLoading && organizers.length === 0) {
    return (
      <div className="px-4 py-6 md:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-gray-200">Loading Dashboard</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">Fetching data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
              <div className="h-[300px] bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6 md:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        <Card className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-red-600 hover:bg-red-700 text-white"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header with Organizer Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {selectedOrganizer ? `Showing data for selected organizer` : 'Showing aggregate data for all organizers'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <label className="text-sm text-gray-600 dark:text-gray-400">Filter by Organizer:</label>
          <Select value={selectedOrganizer} onValueChange={setSelectedOrganizer}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Organizers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Organizers</SelectItem>
              {organizers.map((organizer) => (
                <SelectItem key={organizer.organizer_id} value={organizer.organizer_id.toString()}>
                  {organizer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl shadow-md hover:shadow-lg transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Events
            </CardTitle>
            <Calendar className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{dashboardStats.totalEvents}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              All events created
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-md hover:shadow-lg transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Active Events
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{dashboardStats.activeEvents}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Currently upcoming events
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-md hover:shadow-lg transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tickets Sold</CardTitle>
            <Ticket className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{dashboardStats.totalTickets.toLocaleString()}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tickets across all events
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-md hover:shadow-lg transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {dashboardStats.currency} {dashboardStats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Revenue from completed sales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-xl shadow-md hover:shadow-lg transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-gray-200">Events by Month</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">Number of events created each month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] rounded-xl bg-gray-100 dark:bg-gray-700 p-2 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardStats.eventsByMonth}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar
                    dataKey="count"
                    fill="url(#colorCount)"
                    radius={[8, 8, 0, 0]}
                    isAnimationActive={true}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-md hover:shadow-lg transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-gray-200">Revenue by Event</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">Revenue generated per event (Top 10)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] rounded-xl bg-gray-100 dark:bg-gray-700 p-2 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardStats.revenueByEvent.slice(0, 10)}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="event_name" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${dashboardStats.currency} ${value}`} 
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar
                    dataKey="amount"
                    fill="url(#colorAmount)"
                    radius={[8, 8, 0, 0]}
                    isAnimationActive={true}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card className="rounded-xl shadow-md hover:shadow-lg transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-gray-200">Recent Events</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            {selectedOrganizer ? 'Latest events from selected organizer' : 'Latest events across all organizers'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardStats.recentEvents.map((event) => (
              <div key={event.event_id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm bg-white dark:bg-gray-800">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-200">{event.name}</p>
                    <div className="mt-2 flex gap-4 flex-wrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'Date not set'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {event.location || 'Location not set'}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <Badge variant="outline" className="text-xs">
                      {event.report_count} reports
                    </Badge>
                    {event.tickets_sold && (
                      <Badge variant="secondary" className="text-xs">
                        🎟️ {event.tickets_sold} tickets
                      </Badge>
                    )}
                    {event.revenue && (
                      <Badge variant="secondary" className="text-xs">
                        💰 {dashboardStats.currency} {event.revenue.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {dashboardStats.recentEvents.length === 0 && !isLoading && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No events found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;