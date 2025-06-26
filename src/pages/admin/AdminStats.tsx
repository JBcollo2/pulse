import React, { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Users, Ticket, TrendingUp, DollarSign, Calendar, AlertCircle, Shield } from 'lucide-react';
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
  darkMode: boolean;
}

const useAdminStatsLogic = ({ darkMode }: AdminStatsProps) => {
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

  return {
    stats,
    isLoading,
  };
};

const AdminStats: React.FC<AdminStatsProps> = ({ darkMode }) => {
  const { stats, isLoading } = useAdminStatsLogic({ darkMode });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className={cn(
              "animate-pulse rounded-lg border p-4",
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

  return (
    <div className={cn("space-y-8 p-6 lg:p-8", darkMode ? "text-white" : "text-gray-800")}>
      <div className="flex items-center justify-between space-y-2 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Admin Statistics</h1>
          <p className={cn("text-sm md:text-lg text-gray-500 dark:text-gray-400")}>
            A comprehensive overview of your platform's performance.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ scale: 1.03 }}
        >
          <div className={cn(
            "border rounded-lg shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer group p-6",
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-base font-semibold tracking-wide">Total Users</h3>
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 group-hover:scale-110 transition">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> 12% increase
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Registered users</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.03 }}
        >
          <div className={cn(
            "border rounded-lg shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer group p-6",
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-base font-semibold tracking-wide">Total Events</h3>
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900 group-hover:scale-110 transition">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-300" />
              </div>
            </div>
            <div className="text-3xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> 8% increase
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">All events</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.03 }}
        >
          <div className={cn(
            "border rounded-lg shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer group p-6",
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-base font-semibold tracking-wide">Total Tickets</h3>
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900 group-hover:scale-110 transition">
                <Ticket className="h-5 w-5 text-orange-600 dark:text-orange-300" />
              </div>
            </div>
            <div className="text-3xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> 15% increase
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Tickets sold</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ scale: 1.03 }}
        >
          <div className={cn(
            "border rounded-lg shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer group p-6",
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-base font-semibold tracking-wide">Total Revenue</h3>
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900 group-hover:scale-110 transition">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600">${stats.totalRevenue}</div>
            <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> 15% increase
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">From all ticket sales</p>
          </div>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className={cn(
            "border rounded-lg shadow-md p-6",
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <h3 className="text-base font-semibold tracking-wide">Active Events</h3>
            <div className="text-2xl font-bold">{stats.activeEvents}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Currently running events</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className={cn(
            "border rounded-lg shadow-md p-6",
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <h3 className="text-base font-semibold tracking-wide">Total Reports</h3>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total number of system reports</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <div className={cn(
            "border rounded-lg shadow-md p-6",
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <h3 className="text-base font-semibold tracking-wide">Security Staff</h3>
            <div className="text-2xl font-bold">{stats.securityStaff}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Number of registered security personnel</p>
          </div>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {stats.eventsByMonth && stats.eventsByMonth.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={cn("border rounded-lg shadow-md", darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
              <div className="p-6">
                <h3 className="text-base font-semibold tracking-wide">Events by Month</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Number of events created each month</p>
              </div>
              <div className="h-[300px] p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.eventsByMonth} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className={darkMode ? "stroke-gray-700" : "stroke-gray-200"} />
                    <XAxis dataKey="month" style={{ fontSize: '12px', fill: darkMode ? "#f9fafb" : "#4b5563" }} tickLine={false} />
                    <YAxis allowDecimals={false} style={{ fontSize: '12px', fill: darkMode ? "#f9fafb" : "#4b5563" }} tickLine={false} />
                    <Tooltip
                      wrapperClassName={darkMode ? "bg-gray-800 border-gray-700 shadow-md rounded-md p-2" : "bg-white border-gray-200 shadow-md rounded-md p-2"}
                      itemStyle={darkMode ? { color: "#f9fafb" } : { color: "#1e293b" }}
                      labelStyle={darkMode ? { color: "#9ca3af" } : { color: "#4b5563" }}
                    />
                    <Legend iconSize={12} wrapperStyle={{ bottom: 0 }} />
                    <Bar dataKey="count" fill={darkMode ? "#60a5fa" : "#3b82f6"} name="Events" barSize={30} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {stats.revenueByMonth && stats.revenueByMonth.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={cn("border rounded-lg shadow-md", darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
              <div className="p-6">
                <h3 className="text-base font-semibold tracking-wide">Revenue by Month</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total revenue generated each month</p>
              </div>
              <div className="h-[300px] p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.revenueByMonth} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className={darkMode ? "stroke-gray-700" : "stroke-gray-200"} />
                    <XAxis dataKey="month" style={{ fontSize: '12px', fill: darkMode ? "#f9fafb" : "#4b5563" }} tickLine={false} />
                    <YAxis tickFormatter={(value: number) => `$${value}`} style={{ fontSize: '12px', fill: darkMode ? "#f9fafb" : "#4b5563" }} tickLine={false} />
                    <Tooltip
                      wrapperClassName={darkMode ? "bg-gray-800 border-gray-700 shadow-md rounded-md p-2" : "bg-white border-gray-200 shadow-md rounded-md p-2"}
                      itemStyle={darkMode ? { color: "#f9fafb" } : { color: "#1e293b" }}
                      labelStyle={darkMode ? { color: "#9ca3af" } : { color: "#4b5563" }}
                      formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Revenue']}
                    />
                    <Legend iconSize={12} wrapperStyle={{ bottom: 0 }} />
                    <Bar dataKey="amount" fill={darkMode ? "#86efac" : "#22c55e"} name="Revenue" barSize={30} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminStats;
