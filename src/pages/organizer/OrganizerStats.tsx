import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { Users, Ticket, TrendingUp, DollarSign, Calendar, AlertCircle, Shield, Waypoints } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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
  darkMode: boolean;
}

const OrganizerStats: React.FC<OrganizerStatsProps> = ({ overallSummary, isLoading, error, darkMode }) => {
  const { toast } = useToast();
  const [selectedEvent, setSelectedEvent] = useState<OverallSummary['events_summary'][0] | null>(null);

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className={cn(
              "animate-pulse rounded-lg border p-4 md:p-6",
              darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            )}
          >
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
              </h3>
            </div>
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className={cn("max-w-3xl mx-auto my-8 p-4", darkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800")}>
        <div className="border rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <AlertCircle className="h-6 w-6" />
            <h2 className="text-xl font-bold">Error Loading Statistics</h2>
          </div>
          <p className={cn("mb-4", darkMode ? "text-gray-400" : "text-gray-600")}>We encountered an issue fetching your overall statistics.</p>
          <p className="text-red-500 font-medium text-sm mb-4">{error}</p>
          <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-600")}>Please try again later or contact support if the issue persists.</p>
        </div>
      </div>
    );
  }

  // --- No Data State ---
  if (!overallSummary || (!overallSummary.events_summary || overallSummary.events_summary.length === 0) &&
    overallSummary.total_tickets_sold_across_all_events === 0 &&
    overallSummary.total_revenue_across_all_events === "0" &&
    (overallSummary.total_events === 0 || overallSummary.total_events === undefined)) {
    return (
      <div className={cn("max-w-3xl mx-auto my-8 p-4", darkMode ? "text-gray-200" : "text-gray-800")}>
        <div className={cn("border rounded-lg shadow-md p-4 md:p-6", darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
          <h2 className={cn("text-xl font-bold mb-2", darkMode ? "text-gray-200" : "text-gray-800")}>Overall Organizer Statistics</h2>
          <p className={cn("mb-4", darkMode ? "text-gray-400" : "text-gray-600")}>No comprehensive statistics available.</p>
          <p className={cn("text-center h-32 flex items-center justify-center", darkMode ? "text-gray-400" : "text-gray-600")}>
            It looks like there's no overall data for your organizer account yet. Start by creating an event!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 p-4 md:p-6 lg:p-8", darkMode ? "text-white" : "text-gray-800")}>
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
            Overall Statistics for {overallSummary.organizer_name || "Your Organization"}
          </h1>
          <p className={cn("text-sm md:text-base lg:text-lg", darkMode ? "text-gray-400" : "text-gray-500")}>
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
          className="w-full"
        >
          <div className={cn(
            "border rounded-lg shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer group p-4 md:p-6",
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-base font-semibold tracking-wide">Total Tickets Sold</h3>
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 group-hover:scale-110 transition">
                <Ticket className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold">{overallSummary.total_tickets_sold_across_all_events.toLocaleString()}</div>
            <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> 12% increase
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Across all your events</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.03 }}
          className="w-full"
        >
          <div className={cn(
            "border rounded-lg shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer group p-4 md:p-6",
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-base font-semibold tracking-wide">Total Revenue</h3>
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900 group-hover:scale-110 transition">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-green-600">${overallSummary.total_revenue_across_all_events}</div>
            <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> 15% increase
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">From all ticket sales</p>
          </div>
        </motion.div>

        {overallSummary.total_events !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.03 }}
            className="w-full"
          >
            <div className={cn(
              "border rounded-lg shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer group p-4 md:p-6",
              darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            )}>
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-base font-semibold tracking-wide">Total Events Hosted</h3>
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900 group-hover:scale-110 transition">
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold">{overallSummary.total_events}</div>
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> 8% increase
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Past and upcoming</p>
            </div>
          </motion.div>
        )}

        {overallSummary.upcoming_events_count !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.03 }}
            className="w-full"
          >
            <div className={cn(
              "border rounded-lg shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer group p-4 md:p-6",
              darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            )}>
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-base font-semibold tracking-wide">Upcoming Events</h3>
                <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900 group-hover:scale-110 transition">
                  <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold">{overallSummary.upcoming_events_count}</div>
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> 5% increase
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Events planned</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* --- Event Breakdowns --- */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-4">Individual Event Performance</h2>
        {overallSummary.events_summary && overallSummary.events_summary.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {overallSummary.events_summary.map(event => (
              <motion.div
                key={event.event_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full"
              >
                <div
                  onClick={() => setSelectedEvent(event)}
                  className={cn(
                    "border rounded-lg shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer p-4 md:p-6",
                    darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                  )}
                >
                  <div className="mb-4">
                    <h3 className="text-base md:text-lg font-semibold truncate">{event.event_name}</h3>
                    <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-600")}>{event.date} at {event.location}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Tickets Sold: <span className="font-bold text-blue-500">{event.tickets_sold.toLocaleString()}</span></p>
                    <p className="text-sm font-medium">Revenue: <span className="font-bold text-green-500">${event.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className={cn("text-center py-8", darkMode ? "text-gray-400" : "text-gray-600")}>No detailed event breakdowns available. Create an event to see more!</p>
        )}
      </div>

      {/* --- Monthly Trends --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {overallSummary.tickets_sold_monthly_trend && overallSummary.tickets_sold_monthly_trend.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <div className={cn("border rounded-lg shadow-md", darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
              <div className="p-4 md:p-6">
                <h3 className="text-base font-semibold tracking-wide">Monthly Tickets Sold Trend</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tickets sold over the last few months.</p>
              </div>
              <div className="h-[300px] p-4 md:p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={overallSummary.tickets_sold_monthly_trend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className={cn(darkMode ? "stroke-gray-700" : "stroke-gray-200")} />
                    <XAxis dataKey="month" style={{ fontSize: '12px', fill: darkMode ? "#f9fafb" : "#4b5563" }} tickLine={false} />
                    <YAxis allowDecimals={false} style={{ fontSize: '12px', fill: darkMode ? "#f9fafb" : "#4b5563" }} tickLine={false} />
                    <Tooltip
                      wrapperClassName={darkMode ? "bg-gray-800 border-gray-700 shadow-md rounded-md p-2" : "bg-white border-gray-200 shadow-md rounded-md p-2"}
                      itemStyle={darkMode ? { color: "#f9fafb" } : { color: "#1e293b" }}
                      labelStyle={darkMode ? { color: "#9ca3af" } : { color: "#4b5563" }}
                      formatter={(value: number) => [`${value} Tickets`, 'Sold']}
                    />
                    <Legend iconSize={12} wrapperStyle={{ bottom: 0 }} />
                    <Line type="monotone" dataKey="tickets" stroke={darkMode ? "#60a5fa" : "#3b82f6"} activeDot={{ r: 8 }} name="Tickets Sold" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {overallSummary.revenue_monthly_trend && overallSummary.revenue_monthly_trend.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <div className={cn("border rounded-lg shadow-md", darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
              <div className="p-4 md:p-6">
                <h3 className="text-base font-semibold tracking-wide">Monthly Revenue Trend</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Revenue generated over the last few months.</p>
              </div>
              <div className="h-[300px] p-4 md:p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overallSummary.revenue_monthly_trend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className={cn(darkMode ? "stroke-gray-700" : "stroke-gray-200")} />
                    <XAxis dataKey="month" style={{ fontSize: '12px', fill: darkMode ? "#f9fafb" : "#4b5563" }} tickLine={false} />
                    <YAxis tickFormatter={(value: number) => `$${value}`} style={{ fontSize: '12px', fill: darkMode ? "#f9fafb" : "#4b5563" }} tickLine={false} />
                    <Tooltip
                      wrapperClassName={darkMode ? "bg-gray-800 border-gray-700 shadow-md rounded-md p-2" : "bg-white border-gray-200 shadow-md rounded-md p-2"}
                      itemStyle={darkMode ? { color: "#f9fafb" } : { color: "#1e293b" }}
                      labelStyle={darkMode ? { color: "#9ca3af" } : { color: "#4b5563" }}
                      formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Revenue']}
                    />
                    <Legend iconSize={12} wrapperStyle={{ bottom: 0 }} />
                    <Bar dataKey="revenue" fill={darkMode ? "#86efac" : "#22c55e"} name="Revenue" barSize={30} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={cn("w-full max-w-md border rounded-lg shadow-md p-4 md:p-6", darkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800")}>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{selectedEvent.event_name}</h3>
              <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-600")}>{selectedEvent.date} at {selectedEvent.location}</p>
            </div>
            <div className="space-y-2 mb-6">
              <p className="text-sm font-medium">Tickets Sold: <span className="font-bold text-blue-500">{selectedEvent.tickets_sold.toLocaleString()}</span></p>
              <p className="text-sm font-medium">Revenue: <span className="font-bold text-green-500">${selectedEvent.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setSelectedEvent(null)} className={cn(darkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white")}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerStats;