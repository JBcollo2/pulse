import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { Users, Ticket, TrendingUp, DollarSign, Calendar, AlertCircle, Shield, Waypoints } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils"; // Assuming cn is a utility like clsx for conditional class joining
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

// Define the interface for the overall summary data
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

interface OrganizerStatsProps {
  overallSummary: OverallSummary | null;
  isLoading: boolean;
  error: string | undefined;
  darkMode: boolean; // Prop to control dark mode
}

const OrganizerStats: React.FC<OrganizerStatsProps> = ({ overallSummary, isLoading, error, darkMode }) => {
  const { toast } = useToast();
  const [selectedEvent, setSelectedEvent] = useState<OverallSummary['events_summary'][0] | null>(null);

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 md:p-6 lg:p-8">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className={cn(
            "animate-pulse rounded-lg border",
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded"></Skeleton>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 bg-gray-300 dark:bg-gray-700 rounded"></Skeleton>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <Card className={cn("max-w-3xl mx-auto my-8 p-4", darkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-6 w-6" /> Error Loading Statistics
          </CardTitle>
          <CardDescription className={cn(darkMode ? "text-gray-400" : "text-gray-600")}>We encountered an issue fetching your overall statistics.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 font-medium text-sm mb-4">{error}</p>
          <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-600")}>Please try again later or contact support if the issue persists.</p>
        </CardContent>
      </Card>
    );
  }

  // --- No Data State ---
  if (!overallSummary || (!overallSummary.events_summary || overallSummary.events_summary.length === 0) &&
    overallSummary.total_tickets_sold_across_all_events === 0 &&
    overallSummary.total_revenue_across_all_events === "0" &&
    (overallSummary.total_events === 0 || overallSummary.total_events === undefined)) {
    return (
      <Card className={cn("max-w-3xl mx-auto my-8 p-4", darkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800")}>
        <CardHeader>
          <CardTitle className={cn(darkMode ? "text-gray-200" : "text-gray-800")}>Overall Organizer Statistics</CardTitle>
          <CardDescription className={cn(darkMode ? "text-gray-400" : "text-gray-600")}>No comprehensive statistics available.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className={cn("text-center h-32 flex items-center justify-center", darkMode ? "text-gray-400" : "text-gray-600")}>
            It looks like there's no overall data for your organizer account yet. Start by creating an event!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-8 p-4 md:p-6 lg:p-8 max-w-6xl mx-auto", darkMode ? "text-gray-200" : "text-gray-800")}>
      <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Overall Statistics for {overallSummary.organizer_name || "Your Organization"}
          </h1>
          <p className={cn("text-lg", darkMode ? "text-gray-400" : "text-gray-600")}>
            A comprehensive overview of your performance across all events.
          </p>
        </div>
      </div>

      {/* --- Summary Cards --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ scale: 1.03 }}
        >
          <Card className={cn(
            "border rounded-lg shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer group",
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold tracking-wide">Total Tickets Sold</CardTitle>
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 group-hover:scale-110 transition">
                <Ticket className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold">{overallSummary.total_tickets_sold_across_all_events.toLocaleString()}</div>
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                12% increase
              </p>
              <p className={cn("text-xs", darkMode ? "text-gray-400" : "text-gray-500")}>Across all your events</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.03 }}
        >
          <Card className={cn(
            "border rounded-lg shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer group",
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold tracking-wide">Total Revenue</CardTitle>
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900 group-hover:scale-110 transition">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-green-600">${overallSummary.total_revenue_across_all_events}</div>
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                15% increase
              </p>
              <p className={cn("text-xs", darkMode ? "text-gray-400" : "text-gray-500")}>From all ticket sales</p>
            </CardContent>
          </Card>
        </motion.div>

        {overallSummary.total_events !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.03 }}
          >
            <Card className={cn(
              "border rounded-lg shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer group",
              darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            )}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold tracking-wide">Total Events Hosted</CardTitle>
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900 group-hover:scale-110 transition">
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold">{overallSummary.total_events}</div>
                <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  8% increase
                </p>
                <p className={cn("text-xs", darkMode ? "text-gray-400" : "text-gray-500")}>Past and upcoming</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {overallSummary.upcoming_events_count !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.03 }}
          >
            <Card className={cn(
              "border rounded-lg shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer group",
              darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            )}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold tracking-wide">Upcoming Events</CardTitle>
                <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900 group-hover:scale-110 transition">
                  <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold">{overallSummary.upcoming_events_count}</div>
                <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  5% increase
                </p>
                <p className={cn("text-xs", darkMode ? "text-gray-400" : "text-gray-500")}>Events planned</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      ---

      {/* --- Event Breakdowns --- */}
      <h2 className="text-2xl font-bold tracking-tight mt-8">Individual Event Performance</h2>
      {overallSummary.events_summary && overallSummary.events_summary.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {overallSummary.events_summary.map(event => (
            <motion.div
              key={event.event_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card
                onClick={() => setSelectedEvent(event)}
                className={cn(
                  "transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer",
                  darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                )}
              >
                <CardHeader>
                  <CardTitle className="truncate">{event.event_name}</CardTitle>
                  <CardDescription className={cn(darkMode ? "text-gray-400" : "text-gray-600")}>{event.date} at {event.location}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm font-medium">Tickets Sold: <span className="font-bold text-blue-500">{event.tickets_sold.toLocaleString()}</span></p>
                  <p className="text-sm font-medium">Revenue: <span className="font-bold text-green-500">${event.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className={cn("text-center py-8", darkMode ? "text-gray-400" : "text-gray-600")}>No detailed event breakdowns available. Create an event to see more!</p>
      )}

      ---

      {/* --- Monthly Trends --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {overallSummary.tickets_sold_monthly_trend && overallSummary.tickets_sold_monthly_trend.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className={cn(
              "border rounded-lg shadow-md",
              darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            )}>
              <CardHeader>
                <CardTitle className="text-base font-semibold tracking-wide">Monthly Tickets Sold Trend</CardTitle>
                <CardDescription className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>Tickets sold over the last few months.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={overallSummary.tickets_sold_monthly_trend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className={cn(darkMode ? "stroke-gray-700" : "stroke-gray-200")} />
                      <XAxis dataKey="month" style={{ fontSize: '12px', fill: darkMode ? "#e2e8f0" : "#4b5563" }} /> {/* Text color for XAxis */}
                      <YAxis allowDecimals={false} style={{ fontSize: '12px', fill: darkMode ? "#e2e8f0" : "#4b5563" }} /> {/* Text color for YAxis */}
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3', stroke: darkMode ? "#4a5568" : "#cbd5e1" }} // Tooltip cursor color
                        contentStyle={{ backgroundColor: darkMode ? "#1f2937" : "hsl(var(--card))", border: `1px solid ${darkMode ? "#4a5568" : "hsl(var(--border))"}`, borderRadius: "8px", fontSize: '14px', padding: '8px' }}
                        itemStyle={{ color: darkMode ? "#ffffff" : 'hsl(var(--foreground))' }}
                        labelStyle={{ color: darkMode ? "#9ca3af" : 'hsl(var(--muted-foreground))' }}
                        formatter={(value: number) => [`${value} Tickets`, 'Sold']}
                      />
                      <Legend wrapperStyle={{ color: darkMode ? "#e2e8f0" : "#4b5563" }} /> {/* Legend text color */}
                      <Line type="monotone" dataKey="tickets" stroke={darkMode ? "#93c5fd" : "#3b82f6"} activeDot={{ r: 8 }} name="Tickets Sold" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {overallSummary.revenue_monthly_trend && overallSummary.revenue_monthly_trend.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className={cn(
              "border rounded-lg shadow-md",
              darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            )}>
              <CardHeader>
                <CardTitle className="text-base font-semibold tracking-wide">Monthly Revenue Trend</CardTitle>
                <CardDescription className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>Revenue generated over the last few months.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={overallSummary.revenue_monthly_trend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className={cn(darkMode ? "stroke-gray-700" : "stroke-gray-200")} />
                      <XAxis dataKey="month" style={{ fontSize: '12px', fill: darkMode ? "#e2e8f0" : "#4b5563" }} />
                      <YAxis tickFormatter={(value: number) => `$${value}`} style={{ fontSize: '12px', fill: darkMode ? "#e2e8f0" : "#4b5563" }} />
                      <Tooltip
                        cursor={{ fill: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} // Tooltip cursor fill color
                        contentStyle={{ backgroundColor: darkMode ? "#1f2937" : "hsl(var(--card))", border: `1px solid ${darkMode ? "#4a5568" : "hsl(var(--border))"}`, borderRadius: "8px", fontSize: '14px', padding: '8px' }}
                        itemStyle={{ color: darkMode ? "#ffffff" : 'hsl(var(--foreground))' }}
                        labelStyle={{ color: darkMode ? "#9ca3af" : 'hsl(var(--muted-foreground))' }}
                        formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Revenue']}
                      />
                      <Legend wrapperStyle={{ color: darkMode ? "#e2e8f0" : "#4b5563" }} />
                      <Bar dataKey="revenue" fill={darkMode ? "#93c5fd" : "#3b82f6"} name="Revenue" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"> {/* Added z-50 to ensure it's on top */}
          <Card className={cn("w-full max-w-md", darkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800")}>
            <CardHeader>
              <CardTitle>{selectedEvent.event_name}</CardTitle>
              <CardDescription className={cn(darkMode ? "text-gray-400" : "text-gray-600")}>{selectedEvent.date} at {selectedEvent.location}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Tickets Sold: <span className="font-bold text-blue-500">{selectedEvent.tickets_sold.toLocaleString()}</span></p>
              <p className="text-sm font-medium">Revenue: <span className="font-bold text-green-500">${selectedEvent.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => setSelectedEvent(null)} className={cn(darkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white")}>Close</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OrganizerStats;