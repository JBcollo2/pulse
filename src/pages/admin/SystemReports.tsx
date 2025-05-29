// import React, { useState, useEffect } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { useToast } from "@/components/ui/use-toast";
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList } from 'recharts';
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Download, FileText, Loader2, Users, BarChart3, Calendar } from "lucide-react";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";

// // Define specific colors for each ticket type
// const COLORS_BY_TICKET = {
//   REGULAR: '#FF8042',
//   VIP: '#FFBB28',
//   STUDENT: '#0088FE',
//   GROUP_OF_5: '#00C49F',
//   COUPLES: '#FF6699',
//   EARLY_BIRD: '#AA336A',
//   VVIP: '#00FF00',
//   GIVEAWAY: '#CCCCCC',
//   UNKNOWN_TYPE: '#A9A9A9',
// };

// const FALLBACK_COLOR = COLORS_BY_TICKET.UNKNOWN_TYPE;

// interface Report {
//   id: number;
//   event_id: number;
//   event_name: string;
//   ticket_type_id: number | null;
//   ticket_type_name: string | null;
//   total_tickets_sold_summary: number;
//   total_revenue_summary: number;
//   report_data: Record<string, any>;
//   timestamp: string;
// }

// interface ReportStats {
//   totalReports: number;
//   totalRevenue: number;
//   totalTickets: number;
//   reportsByEvent: { event_name: string; count: number; event_id: number }[];
//   revenueByTicketType: { ticket_type_name: string; amount: number }[];
// }

// interface Organizer {
//   id: number;
//   name: string;
//   email: string;
// }

// const SystemReports = () => {
//   const [reports, setReports] = useState<Report[]>([]);
//   const [organizers, setOrganizers] = useState<Organizer[]>([]);
//   const [selectedOrganizer, setSelectedOrganizer] = useState<string>('all');
//   const [stats, setStats] = useState<ReportStats>({
//     totalReports: 0,
//     totalRevenue: 0,
//     totalTickets: 0,
//     reportsByEvent: [],
//     revenueByTicketType: []
//   });
//   const [isLoading, setIsLoading] = useState(true);
//   const [isLoadingOrganizers, setIsLoadingOrganizers] = useState(true);
//   const [downloadingPdfs, setDownloadingPdfs] = useState<Set<number>>(new Set());
//   const [startDate, setStartDate] = useState<string>('');
//   const [endDate, setEndDate] = useState<string>('');
//   const { toast } = useToast();

//   useEffect(() => {
//     const fetchOrganizers = async () => {
//       try {
//         const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/organizers`, {
//           credentials: 'include'
//         });

//         if (response.ok) {
//           const data = await response.json();
//           const organizersData = Array.isArray(data) ? data : (data.data || []);
//           setOrganizers(organizersData);
//         }
//       } catch (error) {
//         console.error('Error fetching organizers:', error);
//       } finally {
//         setIsLoadingOrganizers(false);
//       }
//     };

//     fetchOrganizers();
//   }, []);

//   const fetchReports = async () => {
//     setIsLoading(true);
//     try {
//       let url = `${import.meta.env.VITE_API_URL}/admin/reports/summary`;
//       const params = new URLSearchParams();

//       if (selectedOrganizer !== 'all') {
//         params.append('organizer_id', selectedOrganizer);
//       }

//       if (startDate) {
//         params.append('start_date', startDate);
//       }

//       if (endDate) {
//         params.append('end_date', endDate);
//       }

//       if (params.toString()) {
//         url += `?${params.toString()}`;
//       }

//       const response = await fetch(url, {
//         credentials: 'include'
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         const errorMessage = errorData.message || errorData.error || `Failed with status: ${response.status}`;
//         console.error('Error fetching reports:', errorMessage);
//         throw new Error(errorMessage);
//       }

//       const data = await response.json();
//       let reportsData = [];
//       if (data.status === 'success' && data.data) {
//         reportsData = Array.isArray(data.data) ? data.data : [];
//       }

//       if (!Array.isArray(reportsData)) {
//         console.error('API response data is not an array:', reportsData);
//         throw new Error('Invalid data format received from API');
//       }

//       setReports(reportsData);

//       const totalRevenue = reportsData.reduce((sum, report) => sum + (report.total_revenue_summary || 0), 0);
//       const totalTickets = reportsData.reduce((sum, report) => sum + (report.total_tickets_sold_summary || 0), 0);

//       const reportsByEvent = reportsData.reduce((acc: Record<string, { count: number; event_id: number }>, report) => {
//         const eventName = report.event_name && typeof report.event_name === 'string' ? report.event_name : 'N/A Event';
//         if (!acc[eventName]) {
//           acc[eventName] = { count: 0, event_id: report.event_id };
//         }
//         acc[eventName].count += 1;
//         return acc;
//       }, {});

//       const revenueByTicketType = reportsData.reduce((acc: Record<string, number>, report) => {
//         const ticketTypeName = report.ticket_type_name && typeof report.ticket_type_name === 'string' ? report.ticket_type_name.toUpperCase() : 'UNKNOWN_TYPE';
//         const revenue = typeof report.total_revenue_summary === 'number' ? report.total_revenue_summary : 0;

//         acc[ticketTypeName] = (acc[ticketTypeName] || 0) + revenue;
//         return acc;
//       }, {});

//       setStats({
//         totalReports: reportsData.length,
//         totalRevenue,
//         totalTickets,
//         reportsByEvent: Object.entries(reportsByEvent).map(([name, data]) => ({
//           event_name: name,
//           count: (data as { count: number; event_id: number }).count,
//           event_id: (data as { count: number; event_id: number }).event_id
//         })),
//         revenueByTicketType: Object.entries(revenueByTicketType).map(([type, amount]) => ({
//           ticket_type_name: type,
//           amount: Number(amount)
//         }))
//       });

//     } catch (error) {
//       console.error('Error fetching reports:', error);
//       toast({
//         title: "Error",
//         description: error instanceof Error ? error.message : "Failed to fetch system reports",
//         variant: "destructive",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchReports();
//   }, [selectedOrganizer, startDate, endDate, toast]);

//   const downloadPDF = async (eventId: number, eventName: string) => {
//     setDownloadingPdfs(prev => new Set([...prev, eventId]));

//     try {
//       const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports/${eventId}/pdf`, {
//         method: 'GET',
//         credentials: 'include',
//         headers: {
//           'Accept': 'application/pdf',
//         },
//       });

//       if (!response.ok) {
//         let errorMessage = `Failed to download PDF (${response.status})`;
//         try {
//           const errorData = await response.json();
//           errorMessage = errorData.message || errorData.error || errorMessage;
//         } catch {
//           // If response is not JSON, use default error message
//         }
//         throw new Error(errorMessage);
//       }

//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = `event_report_${eventId}.pdf`;
//       document.body.appendChild(link);
//       link.click();

//       window.URL.revokeObjectURL(url);
//       document.body.removeChild(link);

//       toast({
//         title: "Success",
//         description: `PDF report for "${eventName}" downloaded successfully`,
//       });

//     } catch (error) {
//       console.error('Error downloading PDF:', error);
//       toast({
//         title: "Error",
//         description: error instanceof Error ? error.message : "Failed to download PDF report",
//         variant: "destructive",
//       });
//     } finally {
//       setDownloadingPdfs(prev => {
//         const newSet = new Set(prev);
//         newSet.delete(eventId);
//         return newSet;
//       });
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="space-y-6">
//         <Card>
//           <CardHeader>
//             <CardTitle>System Reports</CardTitle>
//             <CardDescription>Loading reports...</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {[...Array(3)].map((_, index) => (
//                 <div key={index} className="animate-pulse">
//                   <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
//                   <div className="h-3 bg-gray-200 rounded w-1/2"></div>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   if (!isLoading && reports.length === 0) {
//     return (
//       <div className="space-y-6">
//         <Card>
//           <CardHeader>
//             <CardTitle>System Reports</CardTitle>
//             <CardDescription>No reports available yet.</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <p className="text-center text-muted-foreground">No system reports were found.</p>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <Card>
//         <CardHeader>
//           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//             <div>
//               <CardTitle className="flex items-center gap-2">
//                 <BarChart3 className="h-5 w-5" />
//                 System Reports
//               </CardTitle>
//               <CardDescription>
//                 {selectedOrganizer === 'all'
//                   ? 'All report summaries grouped by event'
//                   : `Report summaries for selected organizer`}
//               </CardDescription>
//             </div>
//             <div className="flex items-center gap-4">
//               <div className="flex items-center gap-2">
//                 <Users className="h-4 w-4 text-muted-foreground" />
//                 <Select
//                   value={selectedOrganizer}
//                   onValueChange={setSelectedOrganizer}
//                   disabled={isLoadingOrganizers}
//                 >
//                   <SelectTrigger className="w-[200px]">
//                     <SelectValue placeholder="Select organizer" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">All Organizers</SelectItem>
//                     {organizers.map((organizer) => (
//                       <SelectItem key={organizer.id} value={organizer.id.toString()}>
//                         {organizer.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Label htmlFor="startDate">Start Date</Label>
//                 <Input
//                   id="startDate"
//                   type="date"
//                   value={startDate}
//                   onChange={(e) => setStartDate(e.target.value)}
//                   className="border rounded p-2"
//                   max={endDate || undefined}
//                 />
//               </div>
//               <div className="flex items-center gap-2">
//                 <Label htmlFor="endDate">End Date</Label>
//                 <Input
//                   id="endDate"
//                   type="date"
//                   value={endDate}
//                   onChange={(e) => setEndDate(e.target.value)}
//                   className="border rounded p-2"
//                   min={startDate || undefined}
//                 />
//               </div>
//               <Button
//                 onClick={fetchReports}
//                 className="bg-gradient-to-r from-[--primary] to-[--secondary] hover:from-[--primary] hover:to-[--secondary] min-w-[140px] hover:scale-105 transition-all"
//                 disabled={isLoading || !startDate || !endDate}
//               >
//                 {isLoading ? (
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 ) : (
//                   <BarChart3 className="mr-2 h-4 w-4" />
//                 )}
//                 Apply Filter
//               </Button>
//             </div>
//           </div>
//         </CardHeader>
//       </Card>

//       <div className="grid gap-4 md:grid-cols-3">
//         <Card>
//           <CardHeader>
//             <CardTitle>Total Reports</CardTitle>
//             <CardDescription>Number of reports generated</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.totalReports}</div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader>
//             <CardTitle>Total Revenue</CardTitle>
//             <CardDescription>Total revenue from all events</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader>
//             <CardTitle>Total Tickets</CardTitle>
//             <CardDescription>Total tickets sold</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.totalTickets}</div>
//           </CardContent>
//         </Card>
//       </div>

//       <div className="grid gap-4 md:grid-cols-2">
//         <Card>
//           <CardHeader>
//             <CardTitle>Reports by Event</CardTitle>
//             <CardDescription>Number of reports per event</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="h-[300px]">
//               {stats.reportsByEvent && stats.reportsByEvent.length > 0 ? (
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart
//                     data={stats.reportsByEvent}
//                     margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
//                   >
//                     <CartesianGrid strokeDasharray="3 3" stroke="#444" />
//                     <XAxis
//                       dataKey="event_name"
//                       angle={-45}
//                       textAnchor="end"
//                       height={80}
//                       interval={0}
//                       style={{ fontSize: '12px' }}
//                       tick={{ fill: '#aaa', fontSize: 12 }}
//                     />
//                     <YAxis
//                       allowDecimals={false}
//                       tick={{ fill: '#aaa', fontSize: 12 }}
//                     />
//                     <Tooltip
//                       contentStyle={{ backgroundColor: "#1a1a2e", border: 'none', borderRadius: "8px", fontSize: '14px', padding: '8px' }}
//                       formatter={(value: number) => [`${value.toLocaleString()} Reports`, 'Count']}
//                       labelFormatter={(label) => `Event: ${label}`}
//                     />
//                     <Bar
//                       dataKey="count"
//                       fill="#8884d8"
//                       radius={[10, 10, 0, 0]}
//                       animationDuration={1500}
//                     >
//                       <LabelList dataKey="count" position="top" fill="#fff" fontSize={12} />
//                     </Bar>
//                   </BarChart>
//                 </ResponsiveContainer>
//               ) : (
//                 <div className="flex items-center justify-center h-full text-muted-foreground">No event report data available.</div>
//               )}
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>Revenue by Ticket Type</CardTitle>
//             <CardDescription>Revenue distribution across ticket types</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="h-[300px] flex flex-col items-center justify-center">
//               {stats.revenueByTicketType && stats.revenueByTicketType.length > 0 && stats.revenueByTicketType.some(data => data.amount > 0) ? (
//                 <ResponsiveContainer width="100%" height={250}>
//                   <PieChart>
//                     <Tooltip
//                       contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", fontSize: '14px', padding: '8px' }}
//                       formatter={(value: number, name: string, entry: any) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, entry.payload.ticket_type_name]}
//                     />
//                     <Pie
//                       data={stats.revenueByTicketType}
//                       dataKey="amount"
//                       nameKey="ticket_type_name"
//                       cx="50%"
//                       cy="50%"
//                       innerRadius={60}
//                       outerRadius={90}
//                       paddingAngle={3}
//                       animationDuration={1500}
//                       labelLine={true}
//                       label={({ ticket_type_name, percent }) => `${ticket_type_name} ${(percent * 100).toFixed(0)}%`}
//                     >
//                       {stats.revenueByTicketType.map((entry, index) => (
//                         <Cell
//                           key={`cell-${index}`}
//                           fill={COLORS_BY_TICKET[entry.ticket_type_name as keyof typeof COLORS_BY_TICKET] || FALLBACK_COLOR}
//                         />
//                       ))}
//                     </Pie>
//                     <Legend
//                       layout="horizontal"
//                       align="center"
//                       verticalAlign="bottom"
//                       wrapperStyle={{ paddingTop: '10px' }}
//                     />
//                   </PieChart>
//                 </ResponsiveContainer>
//               ) : (
//                 <div className="flex items-center justify-center h-full text-muted-foreground">No revenue data by ticket type available for chart.</div>
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle>Event Reports</CardTitle>
//           <CardDescription>Download PDF reports for each event</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             {stats.reportsByEvent && stats.reportsByEvent.length > 0 ? (
//               stats.reportsByEvent.map((event) => (
//                 <div key={event.event_id} className="flex justify-between items-center p-4 border rounded-lg">
//                   <div className="flex items-center space-x-3">
//                     <FileText className="h-5 w-5 text-blue-500" />
//                     <div>
//                       <p className="font-medium">{event.event_name}</p>
//                       <p className="text-sm text-muted-foreground">
//                         {event.count} report{event.count !== 1 ? 's' : ''} available
//                       </p>
//                     </div>
//                   </div>
//                   <Button
//                     onClick={() => downloadPDF(event.event_id, event.event_name)}
//                     disabled={downloadingPdfs.has(event.event_id)}
//                     variant="outline"
//                     size="sm"
//                   >
//                     {downloadingPdfs.has(event.event_id) ? (
//                       <>
//                         <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                         Generating...
//                       </>
//                     ) : (
//                       <>
//                         <Download className="h-4 w-4 mr-2" />
//                         Download PDF
//                       </>
//                     )}
//                   </Button>
//                 </div>
//               ))
//             ) : (
//               <p className="text-center text-muted-foreground">No events with reports found</p>
//             )}
//           </div>
//         </CardContent>
//       </Card>

//       <Card>
//         <CardHeader>
//           <CardTitle>Recent Reports</CardTitle>
//           <CardDescription>Latest system reports</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             {reports && reports.length > 0 ? (
//               reports.map((report) => (
//                 <div key={report.id} className="border-b pb-4 last:border-0">
//                   <div className="flex justify-between items-start">
//                     <div>
//                       <p className="font-medium">{report.event_name}</p>
//                       <p className="text-sm text-muted-foreground">
//                         Ticket Type: <Badge variant="outline">{report.ticket_type_name || 'N/A'}</Badge>
//                       </p>
//                       <p className="text-xs text-muted-foreground">
//                         Generated: {new Date(report.timestamp).toLocaleString()}
//                       </p>
//                     </div>
//                     <div className="text-right flex flex-col items-end space-y-2">
//                       <div>
//                         <p className="font-medium">${report.total_revenue_summary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                         <p className="text-sm text-muted-foreground">
//                           {report.total_tickets_sold_summary} tickets sold
//                         </p>
//                       </div>
//                       <Button
//                         onClick={() => downloadPDF(report.event_id, report.event_name)}
//                         disabled={downloadingPdfs.has(report.event_id)}
//                         variant="outline"
//                         size="sm"
//                       >
//                         {downloadingPdfs.has(report.event_id) ? (
//                           <Loader2 className="h-4 w-4 animate-spin" />
//                         ) : (
//                           <Download className="h-4 w-4" />
//                         )}
//                       </Button>
//                     </div>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <p className="text-center text-muted-foreground">No recent reports found</p>
//             )}
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default SystemReports;
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList, LineChart, Line } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Loader2, Users, BarChart3, Calendar, TrendingUp, Filter, X, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define specific colors for each ticket type
const COLORS_BY_TICKET = {
  REGULAR: '#FF8042',
  VIP: '#FFBB28',
  STUDENT: '#0088FE',
  GROUP_OF_5: '#00C49F',
  COUPLES: '#FF6699',
  EARLY_BIRD: '#AA336A',
  VVIP: '#00FF00',
  GIVEAWAY: '#CCCCCC',
  UNKNOWN_TYPE: '#A9A9A9',
};

const FALLBACK_COLOR = COLORS_BY_TICKET.UNKNOWN_TYPE;

interface Report {
  id: number;
  event_id: number;
  event_name: string;
  ticket_type_id: number | null;
  ticket_type_name: string | null;
  total_tickets_sold_summary: number;
  total_revenue_summary: number;
  report_data: Record<string, any>;
  timestamp: string;
}

interface ReportStats {
  totalReports: number;
  totalRevenue: number;
  totalTickets: number;
  reportsByEvent: { event_name: string; count: number; event_id: number }[];
  revenueByTicketType: { ticket_type_name: string; amount: number }[];
  revenueOverTime: { date: string; revenue: number; tickets: number }[];
  topPerformingEvents: { event_name: string; revenue: number; tickets: number; event_id: number }[];
}

interface Organizer {
  id: number;
  name: string;
  email: string;
}

const SystemReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [selectedOrganizer, setSelectedOrganizer] = useState<string>('all');
  const [stats, setStats] = useState<ReportStats>({
    totalReports: 0,
    totalRevenue: 0,
    totalTickets: 0,
    reportsByEvent: [],
    revenueByTicketType: [],
    revenueOverTime: [],
    topPerformingEvents: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOrganizers, setIsLoadingOrganizers] = useState(true);
  const [downloadingPdfs, setDownloadingPdfs] = useState<Set<number>>(new Set());
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/organizers`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          const organizersData = Array.isArray(data) ? data : (data.data || []);
          setOrganizers(organizersData);
        }
      } catch (error) {
        console.error('Error fetching organizers:', error);
      } finally {
        setIsLoadingOrganizers(false);
      }
    };

    fetchOrganizers();
  }, []);

  const processRevenueOverTime = (reportsData: Report[]) => {
    const revenueByDate = reportsData.reduce((acc: Record<string, { revenue: number; tickets: number }>, report) => {
      const date = new Date(report.timestamp).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { revenue: 0, tickets: 0 };
      }
      acc[date].revenue += report.total_revenue_summary || 0;
      acc[date].tickets += report.total_tickets_sold_summary || 0;
      return acc;
    }, {});

    return Object.entries(revenueByDate)
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        tickets: data.tickets
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const processTopPerformingEvents = (reportsData: Report[]) => {
    const eventStats = reportsData.reduce((acc: Record<string, { revenue: number; tickets: number; event_id: number }>, report) => {
      const eventName = report.event_name || 'N/A Event';
      if (!acc[eventName]) {
        acc[eventName] = { revenue: 0, tickets: 0, event_id: report.event_id };
      }
      acc[eventName].revenue += report.total_revenue_summary || 0;
      acc[eventName].tickets += report.total_tickets_sold_summary || 0;
      return acc;
    }, {});

    return Object.entries(eventStats)
      .map(([event_name, data]) => ({
        event_name,
        revenue: data.revenue,
        tickets: data.tickets,
        event_id: data.event_id
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      let url = `${import.meta.env.VITE_API_URL}/admin/reports/summary`;
      const params = new URLSearchParams();

      if (selectedOrganizer !== 'all') {
        params.append('organizer_id', selectedOrganizer);
      }

      if (startDate) {
        params.append('start_date', startDate);
      }

      if (endDate) {
        params.append('end_date', endDate);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || errorData.error || `Failed with status: ${response.status}`;
        console.error('Error fetching reports:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      let reportsData = [];
      if (data.status === 'success' && data.data) {
        reportsData = Array.isArray(data.data) ? data.data : [];
      }

      if (!Array.isArray(reportsData)) {
        console.error('API response data is not an array:', reportsData);
        throw new Error('Invalid data format received from API');
      }

      setReports(reportsData);

      const totalRevenue = reportsData.reduce((sum, report) => sum + (report.total_revenue_summary || 0), 0);
      const totalTickets = reportsData.reduce((sum, report) => sum + (report.total_tickets_sold_summary || 0), 0);

      const reportsByEvent = reportsData.reduce((acc: Record<string, { count: number; event_id: number }>, report) => {
        const eventName = report.event_name && typeof report.event_name === 'string' ? report.event_name : 'N/A Event';
        if (!acc[eventName]) {
          acc[eventName] = { count: 0, event_id: report.event_id };
        }
        acc[eventName].count += 1;
        return acc;
      }, {});

      const revenueByTicketType = reportsData.reduce((acc: Record<string, number>, report) => {
        const ticketTypeName = report.ticket_type_name && typeof report.ticket_type_name === 'string' ? report.ticket_type_name.toUpperCase() : 'UNKNOWN_TYPE';
        const revenue = typeof report.total_revenue_summary === 'number' ? report.total_revenue_summary : 0;

        acc[ticketTypeName] = (acc[ticketTypeName] || 0) + revenue;
        return acc;
      }, {});

      const revenueOverTime = processRevenueOverTime(reportsData);
      const topPerformingEvents = processTopPerformingEvents(reportsData);

      setStats({
        totalReports: reportsData.length,
        totalRevenue,
        totalTickets,
        reportsByEvent: Object.entries(reportsByEvent).map(([name, data]) => ({
          event_name: name,
          count: (data as { count: number; event_id: number }).count,
          event_id: (data as { count: number; event_id: number }).event_id
        })),
        revenueByTicketType: Object.entries(revenueByTicketType).map(([type, amount]) => ({
          ticket_type_name: type,
          amount: Number(amount)
        })),
        revenueOverTime,
        topPerformingEvents
      });

      setFiltersApplied(selectedOrganizer !== 'all' || startDate !== '' || endDate !== '');

    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch system reports",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchReports();
    }
  }, [selectedOrganizer]);

  const handleApplyFilters = () => {
    if (!startDate || !endDate) {
      toast({
        title: "Invalid Date Range",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: "Invalid Date Range",
        description: "Start date cannot be later than end date",
        variant: "destructive",
      });
      return;
    }

    fetchReports();
  };

  const clearFilters = () => {
    setSelectedOrganizer('all');
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setFiltersApplied(false);
  };

  const downloadPDF = async (eventId: number, eventName: string) => {
    setDownloadingPdfs(prev => new Set([...prev, eventId]));

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports/${eventId}/pdf`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/pdf',
        },
      });

      if (!response.ok) {
        let errorMessage = `Failed to download PDF (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use default error message
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `event_report_${eventId}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: `PDF report for "${eventName}" downloaded successfully`,
      });

    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download PDF report",
        variant: "destructive",
      });
    } finally {
      setDownloadingPdfs(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    }
  };

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

  if (!isLoading && reports.length === 0) {
    return (
      <div className="space-y-6">
        {/* Filters Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    System Reports
                  </CardTitle>
                  <CardDescription>
                    No reports found for the selected criteria
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex flex-wrap items-end gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={selectedOrganizer}
                    onValueChange={setSelectedOrganizer}
                    disabled={isLoadingOrganizers}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select organizer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Organizers</SelectItem>
                      {organizers.map((organizer) => (
                        <SelectItem key={organizer.id} value={organizer.id.toString()}>
                          {organizer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="startDate" className="text-xs">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-40"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="endDate" className="text-xs">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-40"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleApplyFilters}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Filter className="mr-2 h-4 w-4" />
                    )}
                    Apply Filters
                  </Button>

                  {filtersApplied && (
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      disabled={isLoading}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  )}

                  <Button
                    onClick={fetchReports}
                    variant="outline"
                    disabled={isLoading}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No Reports Found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or date range to see reports.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Filters Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  System Reports
                  {filtersApplied && (
                    <Badge variant="secondary" className="ml-2">
                      Filtered
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {selectedOrganizer === 'all'
                    ? 'All report summaries and analytics'
                    : `Reports for selected organizer`}
                </CardDescription>
              </div>
            </div>
            
            <div className="flex flex-wrap items-end gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={selectedOrganizer}
                  onValueChange={setSelectedOrganizer}
                  disabled={isLoadingOrganizers}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select organizer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Organizers</SelectItem>
                    {organizers.map((organizer) => (
                      <SelectItem key={organizer.id} value={organizer.id.toString()}>
                        {organizer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="startDate" className="text-xs">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="endDate" className="text-xs">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-40"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleApplyFilters}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Filter className="mr-2 h-4 w-4" />
                  )}
                  Apply Filters
                </Button>

                {filtersApplied && (
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    disabled={isLoading}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                )}

                <Button
                  onClick={fetchReports}
                  variant="outline"
                  disabled={isLoading}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <p className="text-xs text-muted-foreground">System reports generated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">From all events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Tickets sold</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Revenue/Event</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.reportsByEvent.length > 0 ? (stats.totalRevenue / stats.reportsByEvent.length).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">Average per event</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Tabbed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="downloads">Downloads</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Reports by Event</CardTitle>
                <CardDescription>Number of reports per event</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {stats.reportsByEvent && stats.reportsByEvent.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.reportsByEvent} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis
                          dataKey="event_name"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          interval={0}
                          style={{ fontSize: '12px' }}
                          tick={{ fill: '#aaa', fontSize: 12 }}
                        />
                        <YAxis allowDecimals={false} tick={{ fill: '#aaa', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#1a1a2e", border: 'none', borderRadius: "8px", fontSize: '14px', padding: '8px' }}
                          formatter={(value: number) => [`${value.toLocaleString()} Reports`, 'Count']}
                          labelFormatter={(label) => `Event: ${label}`}
                        />
                        <Bar dataKey="count" fill="#8884d8" radius={[10, 10, 0, 0]} animationDuration={1500}>
                          <LabelList dataKey="count" position="top" fill="#fff" fontSize={12} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">No event report data available.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Ticket Type</CardTitle>
                <CardDescription>Revenue distribution across ticket types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex flex-col items-center justify-center">
                  {stats.revenueByTicketType && stats.revenueByTicketType.length > 0 && stats.revenueByTicketType.some(data => data.amount > 0) ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", fontSize: '14px', padding: '8px' }}
                          formatter={(value: number, name: string, entry: any) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, entry.payload.ticket_type_name]}
                        />
                        <Pie
                          data={stats.revenueByTicketType}
                          dataKey="amount"
                          nameKey="ticket_type_name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          animationDuration={1500}
                          labelLine={true}
                          label={({ ticket_type_name, percent }) => `${ticket_type_name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {stats.revenueByTicketType.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS_BY_TICKET[entry.ticket_type_name as keyof typeof COLORS_BY_TICKET] || FALLBACK_COLOR}
                            />
                          ))}
                        </Pie>
                        <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">No revenue data by ticket type available for chart.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Trends Over Time
              </CardTitle>
              <CardDescription>Daily revenue and ticket sales trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {stats.revenueOverTime && stats.revenueOverTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.revenueOverTime} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: '#aaa', fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis yAxisId="left" tick={{ fill: '#aaa', fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: '#aaa', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1a1a2e", border: 'none', borderRadius: "8px", fontSize: '14px', padding: '8px' }}
                        labelFormatter={(value) => `Date: ${new Date(value).toLocaleDateString()}`}
                        formatter={(value: number, name: string) => [
                          name === 'revenue' ? `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value.toLocaleString(),
                          name === 'revenue' ? 'Revenue' : 'Tickets'
                        ]}
                      />
                      <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} />
                      <Line yAxisId="right" type="monotone" dataKey="tickets" stroke="#82ca9d" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">No trend data available.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Events</CardTitle>
              <CardDescription>Events ranked by total revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topPerformingEvents && stats.topPerformingEvents.length > 0 ? (
                  stats.topPerformingEvents.map((event, index) => (
                    <div key={event.event_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{event.event_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.tickets.toLocaleString()} tickets sold
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          ${event.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${(event.revenue / event.tickets).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per ticket
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">No performance data available.</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average Ticket Price</span>
                  <span className="font-medium">
                    ${stats.totalTickets > 0 ? (stats.totalRevenue / stats.totalTickets).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Events with Reports</span>
                  <span className="font-medium">{stats.reportsByEvent.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Reports per Event</span>
                  <span className="font-medium">
                    {stats.reportsByEvent.length > 0 ? (stats.totalReports / stats.reportsByEvent.length).toFixed(1) : '0'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ticket Types</span>
                  <span className="font-medium">{stats.revenueByTicketType.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.revenueByTicketType.map((type, index) => {
                    const percentage = (type.amount / stats.totalRevenue) * 100;
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{type.ticket_type_name}</span>
                          <span>{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-1000"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: COLORS_BY_TICKET[type.ticket_type_name as keyof typeof COLORS_BY_TICKET] || FALLBACK_COLOR
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="downloads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>PDF Report Downloads</CardTitle>
              <CardDescription>Download comprehensive PDF reports for each event</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.reportsByEvent && stats.reportsByEvent.length > 0 ? (
                  stats.reportsByEvent.map((event) => (
                    <div key={event.event_id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">{event.event_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.count} report{event.count !== 1 ? 's' : ''} available
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {reports.filter(r => r.event_id === event.event_id).reduce((sum, r) => sum + r.total_tickets_sold_summary, 0)} tickets
                        </Badge>
                        <Badge variant="secondary">
                          ${reports.filter(r => r.event_id === event.event_id).reduce((sum, r) => sum + r.total_revenue_summary, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Badge>
                        <Button
                          onClick={() => downloadPDF(event.event_id, event.event_name)}
                          disabled={downloadingPdfs.has(event.event_id)}
                          variant="outline"
                          size="sm"
                        >
                          {downloadingPdfs.has(event.event_id) ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No events with reports found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bulk Download Options */}
          <Card>
            <CardHeader>
              <CardTitle>Bulk Actions</CardTitle>
              <CardDescription>Download multiple reports at once</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    stats.reportsByEvent.forEach(event => {
                      downloadPDF(event.event_id, event.event_name);
                    });
                  }}
                  disabled={downloadingPdfs.size > 0 || stats.reportsByEvent.length === 0}
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All PDFs
                </Button>
                <Button
                  onClick={() => {
                    const csvContent = [
                      ['Event Name', 'Reports Count', 'Total Revenue', 'Total Tickets'],
                      ...stats.reportsByEvent.map(event => {
                        const eventReports = reports.filter(r => r.event_id === event.event_id);
                        const totalRevenue = eventReports.reduce((sum, r) => sum + r.total_revenue_summary, 0);
                        const totalTickets = eventReports.reduce((sum, r) => sum + r.total_tickets_sold_summary, 0);
                        return [event.event_name, event.count, totalRevenue, totalTickets];
                      })
                    ].map(row => row.join(',')).join('\n');

                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `system_reports_summary_${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(link);
                    link.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(link);

                    toast({
                      title: "Success",
                      description: "CSV summary downloaded successfully",
                    });
                  }}
                  disabled={stats.reportsByEvent.length === 0}
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV Summary
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemReports;