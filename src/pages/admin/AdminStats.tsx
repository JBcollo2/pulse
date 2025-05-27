import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Ticket, TrendingUp, DollarSign, Calendar, AlertCircle, Shield } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Stats {
  totalUsers: number;
  totalEvents: number;
  totalTickets: number;
  totalRevenue: number;
  activeEvents: number;
  totalReports: number;
  securityStaff: number;
  eventsByMonth: { month: string; count: number }[];
  revenueByMonth: { month: string; amount: number }[];
}

interface AdminStatsProps {
  darkMode: boolean; // Add the darkMode prop
}

const AdminStats: React.FC<AdminStatsProps> = ({ darkMode }) => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalEvents: 0,
    totalTickets: 0,
    totalRevenue: 0,
    activeEvents: 0,
    totalReports: 0,
    securityStaff: 0,
    eventsByMonth: [],
    revenueByMonth: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/stats`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }

        const data = await response.json();
        const statsData = data.stats || data;

        setStats({
          totalUsers: statsData.total_users || 0,
          totalEvents: statsData.total_events || 0,
          totalTickets: statsData.total_tickets || 0,
          totalRevenue: statsData.total_revenue || 0,
          activeEvents: statsData.active_events || 0,
          totalReports: statsData.total_reports || 0,
          securityStaff: statsData.security_staff || 0,
          eventsByMonth: statsData.events_by_month || [],
          revenueByMonth: statsData.revenue_by_month || []
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast({
          title: "Error",
          description: "Failed to fetch statistics",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className={darkMode ? "bg-gray-800 border-gray-700" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-8 p-6 lg:p-8 max-w-6xl mx-auto", darkMode ? "text-white" : "text-foreground")}>
      <div className="flex items-center justify-between space-y-2 flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Admin Statistics</h1>
          <p className={cn("text-lg", darkMode ? "text-gray-300" : "text-muted-foreground")}>
            A comprehensive overview of your platform's performance.
          </p>
        </div>
      </div>

      {/* --- Summary Cards --- */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className={cn(
            "transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer group",
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors duration-200" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {stats.totalUsers}
              </div>
              <p className="text-xs text-green-500 mt-1">↑ 12% increase from last month</p>
              <p className={cn("text-xs", darkMode ? "text-gray-300" : "text-muted-foreground")}>Registered users</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className={cn(
            "transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer group",
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors duration-200" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {stats.totalEvents}
              </div>
              <p className="text-xs text-green-500 mt-1">↑ 8% increase from last month</p>
              <p className={cn("text-xs", darkMode ? "text-gray-300" : "text-muted-foreground")}>All events</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className={cn(
            "transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer group",
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors duration-200" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {stats.totalTickets}
              </div>
              <p className="text-xs text-green-500 mt-1">↑ 15% increase from last month</p>
              <p className={cn("text-xs", darkMode ? "text-gray-300" : "text-muted-foreground")}>Tickets sold</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className={cn(
            "transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer group",
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground group-hover:text-green-500 transition-colors duration-200" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">
                ${stats.totalRevenue}
              </div>
              <p className="text-xs text-green-500 mt-1">↑ 15% increase from last month</p>
              <p className={cn("text-xs", darkMode ? "text-gray-300" : "text-muted-foreground")}>From all ticket sales</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* --- Monthly Trends --- */}
      <div className="grid gap-6 lg:grid-cols-2">
        {stats.eventsByMonth && stats.eventsByMonth.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className={darkMode ? "bg-gray-800 border-gray-700" : ""}>
              <CardHeader>
                <CardTitle>Events by Month</CardTitle>
                <CardDescription>Number of events created each month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.eventsByMonth} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" style={{ fontSize: '12px' }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ backgroundColor: darkMode ? "#1f2937" : "hsl(var(--card))", border: '1px solid hsl(var(--border))', borderRadius: "8px", fontSize: '14px', padding: '8px' }}
                        itemStyle={{ color: darkMode ? "#ffffff" : 'hsl(var(--foreground))' }}
                        labelStyle={{ color: darkMode ? "#9ca3af" : 'hsl(var(--muted-foreground))' }}
                        formatter={(value: number) => [`${value} Events`, 'Created']}
                      />
                      <Legend />
                      <Bar dataKey="count" fill={darkMode ? "#93c5fd" : "#3b82f6"} name="Events" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {stats.revenueByMonth && stats.revenueByMonth.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className={darkMode ? "bg-gray-800 border-gray-700" : ""}>
              <CardHeader>
                <CardTitle>Revenue by Month</CardTitle>
                <CardDescription>Total revenue generated each month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.revenueByMonth} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" style={{ fontSize: '12px' }} />
                      <YAxis tickFormatter={(value: number) => `$${value}`} />
                      <Tooltip
                        cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                        contentStyle={{ backgroundColor: darkMode ? "#1f2937" : "hsl(var(--card))", border: '1px solid hsl(var(--border))', borderRadius: "8px", fontSize: '14px', padding: '8px' }}
                        itemStyle={{ color: darkMode ? "#ffffff" : 'hsl(var(--foreground))' }}
                        labelStyle={{ color: darkMode ? "#9ca3af" : 'hsl(var(--muted-foreground))' }}
                        formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Revenue']}
                      />
                      <Legend />
                      <Bar dataKey="amount" fill={darkMode ? "#93c5fd" : "#3b82f6"} name="Revenue" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminStats;
