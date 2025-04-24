import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge } from "@/components/ui/badge";

interface Report {
  id: number;
  event_id: number;
  event_name: string;
  ticket_type: string;
  total_tickets_sold: number;
  total_revenue: number;
  created_at: string;
}

interface ReportStats {
  totalReports: number;
  totalRevenue: number;
  totalTickets: number;
  reportsByEvent: { event_name: string; count: number }[];
  revenueByTicketType: { ticket_type: string; amount: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const SystemReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    totalReports: 0,
    totalRevenue: 0,
    totalTickets: 0,
    reportsByEvent: [],
    revenueByTicketType: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }

        const data = await response.json();
        const reportsData = Array.isArray(data) ? data : (data.reports || []);
        
        setReports(reportsData);

        // Calculate statistics
        const totalRevenue = reportsData.reduce((sum, report) => sum + (report.total_revenue || 0), 0);
        const totalTickets = reportsData.reduce((sum, report) => sum + (report.total_tickets_sold || 0), 0);

        // Group reports by event
        const reportsByEvent = reportsData.reduce((acc: Record<string, number>, report) => {
          const eventName = report.event_name || 'Unknown Event';
          acc[eventName] = (acc[eventName] || 0) + 1;
          return acc;
        }, {});

        // Group revenue by ticket type
        const revenueByTicketType = reportsData.reduce((acc: Record<string, number>, report) => {
          const ticketType = report.ticket_type || 'Unknown Type';
          acc[ticketType] = (acc[ticketType] || 0) + (report.total_revenue || 0);
          return acc;
        }, {});

        setStats({
          totalReports: reportsData.length,
          totalRevenue,
          totalTickets,
          reportsByEvent: Object.entries(reportsByEvent).map(([name, count]) => ({ 
            event_name: name, 
            count: Number(count) 
          })),
          revenueByTicketType: Object.entries(revenueByTicketType).map(([type, amount]) => ({ 
            ticket_type: type, 
            amount: Number(amount) 
          }))
        });
      } catch (error) {
        console.error('Error fetching reports:', error);
        toast({
          title: "Error",
          description: "Failed to fetch system reports",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>System Reports</CardTitle>
            <CardDescription>Loading reports...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Reports</CardTitle>
            <CardDescription>Number of reports generated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>Total revenue from all events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Tickets</CardTitle>
            <CardDescription>Total tickets sold</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reports by Event</CardTitle>
            <CardDescription>Number of reports per event</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.reportsByEvent}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="event_name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Ticket Type</CardTitle>
            <CardDescription>Revenue distribution across ticket types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.revenueByTicketType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.revenueByTicketType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Latest system reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border-b pb-4 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{report.event_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Ticket Type: <Badge variant="outline">{report.ticket_type}</Badge>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${report.total_revenue.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      {report.total_tickets_sold} tickets sold
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {reports.length === 0 && (
              <p className="text-center text-muted-foreground">No reports found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemReports; 