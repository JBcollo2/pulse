// import React, { useState, useEffect, useCallback } from 'react';
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { useToast } from "@/components/ui/use-toast";
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList } from 'recharts';
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Download, FileText, Loader2, Users, BarChart3, Calendar, FileDown } from "lucide-react";
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
//   const [isExportingAll, setIsExportingAll] = useState(false);
//   const [startDate, setStartDate] = useState<Date | null>(null);
//   const [endDate, setEndDate] = useState<Date | null>(null);
//   const [startTime, setStartTime] = useState<string>('');
//   const [endTime, setEndTime] = useState<string>('');
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

//   const fetchReports = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       let url = `${import.meta.env.VITE_API_URL}/admin/reports/summary`;
//       const params = new URLSearchParams();

//       if (selectedOrganizer !== 'all') {
//         params.append('organizer_id', selectedOrganizer);
//       }

//       if (startDate) {
//         params.append('start_date', startDate.toISOString().split('T')[0]);
//       }

//       if (endDate) {
//         params.append('end_date', endDate.toISOString().split('T')[0]);
//       }

//       if (startTime) {
//         params.append('start_time', startTime);
//       }

//       if (endTime) {
//         params.append('end_time', endTime);
//       }

//       if (startDate && endDate && startDate > endDate) {
//         toast({
//           title: "Date Range Error",
//           description: "Start date cannot be after end date.",
//           variant: "destructive",
//         });
//         setIsLoading(false);
//         return;
//       }

//       if (startTime && endTime && startTime > endTime) {
//         toast({
//           title: "Time Range Error",
//           description: "Start time cannot be after end time.",
//           variant: "destructive",
//         });
//         setIsLoading(false);
//         return;
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
//   }, [selectedOrganizer, startDate, endDate, startTime, endTime, toast]);

//   useEffect(() => {
//     fetchReports();
//   }, [fetchReports]);

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

//   const exportAllReports = async () => {
//     setIsExportingAll(true);
//     try {
//       let url = `${import.meta.env.VITE_API_URL}/admin/reports/export-all`;
//       const params = new URLSearchParams();

//       if (selectedOrganizer !== 'all') {
//         params.append('organizer_id', selectedOrganizer);
//       }
//       if (startDate) {
//         params.append('start_date', startDate.toISOString().split('T')[0]);
//       }
//       if (endDate) {
//         params.append('end_date', endDate.toISOString().split('T')[0]);
//       }
//       if (startTime) {
//         params.append('start_time', startTime);
//       }
//       if (endTime) {
//         params.append('end_time', endTime);
//       }

//       if (params.toString()) {
//         url += `?${params.toString()}`;
//       }

//       const response = await fetch(url, {
//         method: 'GET',
//         credentials: 'include',
//         headers: {
//           'Accept': 'text/csv',
//         },
//       });

//       if (!response.ok) {
//         let errorMessage = `Failed to export all reports (${response.status})`;
//         try {
//           const errorData = await response.json();
//           errorMessage = errorData.message || errorData.error || errorMessage;
//         } catch {
//           // If response is not JSON, use default error message
//         }
//         throw new Error(errorMessage);
//       }

//       const blob = await response.blob();
//       const urlBlob = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = urlBlob;
//       link.download = `all_system_reports_${new Date().toISOString().split('T')[0]}.csv`;
//       document.body.appendChild(link);
//       link.click();

//       window.URL.revokeObjectURL(urlBlob);
//       document.body.removeChild(link);

//       toast({
//         title: "Success",
//         description: "All filtered reports exported successfully.",
//       });

//     } catch (error) {
//       console.error('Error exporting all reports:', error);
//       toast({
//         title: "Error",
//         description: error instanceof Error ? error.message : "Failed to export all reports.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsExportingAll(false);
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

//   if (!isLoading && reports.length === 0 && (startDate || endDate || selectedOrganizer !== 'all' || startTime || endTime)) {
//     return (
//       <div className="space-y-6">
//         <Card>
//           <CardHeader>
//             <CardTitle>System Reports</CardTitle>
//             <CardDescription>No reports found for the selected filters.</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <p className="text-center text-muted-foreground">Adjust your filters and try again.</p>
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
//             <div className="flex flex-wrap items-center gap-4">
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
//                 <DatePicker
//                   selected={startDate}
//                   onChange={(date: Date) => setStartDate(date)}
//                   selectsStart
//                   startDate={startDate}
//                   endDate={endDate}
//                   placeholderText="Select a start date"
//                   className="border rounded p-2"
//                 />
//               </div>
//               <div className="flex items-center gap-2">
//                 <Label htmlFor="endDate">End Date</Label>
//                 <DatePicker
//                   selected={endDate}
//                   onChange={(date: Date) => setEndDate(date)}
//                   selectsEnd
//                   startDate={startDate}
//                   endDate={endDate}
//                   minDate={startDate}
//                   placeholderText="Select an end date"
//                   className="border rounded p-2"
//                 />
//               </div>
//               <div className="flex items-center gap-2">
//                 <Label htmlFor="startTime">Start Time</Label>
//                 <Input
//                   id="startTime"
//                   type="time"
//                   value={startTime}
//                   onChange={(e) => setStartTime(e.target.value)}
//                   className="border rounded p-2"
//                 />
//               </div>
//               <div className="flex items-center gap-2">
//                 <Label htmlFor="endTime">End Time</Label>
//                 <Input
//                   id="endTime"
//                   type="time"
//                   value={endTime}
//                   onChange={(e) => setEndTime(e.target.value)}
//                   className="border rounded p-2"
//                 />
//               </div>
//               <Button
//                 onClick={fetchReports}
//                 className="bg-gradient-to-r from-[--primary] to-[--secondary] hover:from-[--primary] hover:to-[--secondary] min-w-[140px] hover:scale-105 transition-all"
//                 disabled={isLoading}
//               >
//                 {isLoading ? (
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 ) : (
//                   <BarChart3 className="mr-2 h-4 w-4" />
//                 )}
//                 Apply Filter
//               </Button>
//               <Button
//                 onClick={exportAllReports}
//                 className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 min-w-[140px] hover:scale-105 transition-all"
//                 disabled={isExportingAll || reports.length === 0}
//               >
//                 {isExportingAll ? (
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 ) : (
//                   <FileDown className="mr-2 h-4 w-4" />
//                 )}
//                 Export All
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
//               <p className="text-center text-muted-foreground">No events with reports found for the current filters.</p>
//             )}
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default SystemReports;

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList, LineChart, Line, Area, AreaChart } from 'recharts';
import { Download, FileText, Loader2, Users, BarChart3, Calendar, FileDown, Filter, RefreshCw, TrendingUp, Clock, Search, Eye, EyeOff } from "lucide-react";

// Mock toast hook for demonstration
const useToast = () => ({
  toast: ({ title, description, variant }: any) => {
    console.log(`${variant || 'info'}: ${title} - ${description}`);
  }
});

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

// Time filter presets
const TIME_PRESETS = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 3 months', value: '3m' },
  { label: 'Last 6 months', value: '6m' },
  { label: 'This year', value: 'year' },
  { label: 'Custom', value: 'custom' }
];

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
  reportsByEvent: { event_name: string; count: number; event_id: number; revenue: number; tickets: number }[];
  revenueByTicketType: { ticket_type_name: string; amount: number }[];
  revenueByDate: { date: string; revenue: number; tickets: number }[];
  topEvents: { event_name: string; revenue: number; tickets: number }[];
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
  const [timePreset, setTimePreset] = useState<string>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('00:00');
  const [endTime, setEndTime] = useState<string>('23:59');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [sortBy, setSortBy] = useState<'revenue' | 'tickets' | 'reports'>('revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [stats, setStats] = useState<ReportStats>({
    totalReports: 0,
    totalRevenue: 0,
    totalTickets: 0,
    reportsByEvent: [],
    revenueByTicketType: [],
    revenueByDate: [],
    topEvents: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOrganizers, setIsLoadingOrganizers] = useState(false);
  const [downloadingPdfs, setDownloadingPdfs] = useState<Set<number>>(new Set());
  const [isExportingAll, setIsExportingAll] = useState(false);
  const { toast } = useToast();

  // Generate mock data for demonstration
  const generateMockData = useCallback(() => {
    const mockOrganizers = [
      { id: 1, name: 'EventPro Organizers', email: 'contact@eventpro.com' },
      { id: 2, name: 'Elite Events Co.', email: 'info@eliteevents.com' },
      { id: 3, name: 'Premier Productions', email: 'hello@premierprod.com' }
    ];

    const mockReports = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      event_id: Math.floor(Math.random() * 15) + 1,
      event_name: [
        'Tech Conference 2024', 'Music Festival Summer', 'Corporate Gala Night',
        'Charity Fundraiser', 'Art Exhibition Opening', 'Food & Wine Festival',
        'Business Summit', 'Concert Series', 'Fashion Week Event',
        'Sports Championship', 'Cultural Festival', 'Trade Show Expo',
        'Academic Conference', 'Startup Pitch Night', 'Community Celebration'
      ][Math.floor(Math.random() * 15)],
      ticket_type_id: Math.floor(Math.random() * 8) + 1,
      ticket_type_name: ['REGULAR', 'VIP', 'STUDENT', 'GROUP_OF_5', 'COUPLES', 'EARLY_BIRD', 'VVIP', 'GIVEAWAY'][Math.floor(Math.random() * 8)],
      total_tickets_sold_summary: Math.floor(Math.random() * 500) + 50,
      total_revenue_summary: Math.floor(Math.random() * 50000) + 1000,
      report_data: {},
      timestamp: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
    }));

    setOrganizers(mockOrganizers);
    return mockReports;
  }, []);

  // Calculate date range based on preset
  const getDateRange = useCallback(() => {
    const now = new Date();
    let startDate: Date;
    
    switch (timePreset) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3m':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6m':
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            start: new Date(`${customStartDate}T${startTime}`),
            end: new Date(`${customEndDate}T${endTime}`)
          };
        }
        return null;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return {
      start: startDate,
      end: now
    };
  }, [timePreset, customStartDate, customEndDate, startTime, endTime]);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const mockReports = generateMockData();
      const dateRange = getDateRange();
      
      let filteredReports = mockReports;
      
      // Apply date/time filters
      if (dateRange) {
        filteredReports = mockReports.filter(report => {
          const reportDate = new Date(report.timestamp);
          return reportDate >= dateRange.start && reportDate <= dateRange.end;
        });
      }
      
      // Apply search filter
      if (searchTerm) {
        filteredReports = filteredReports.filter(report =>
          report.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.ticket_type_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setReports(filteredReports);
      
      // Calculate comprehensive stats
      const totalRevenue = filteredReports.reduce((sum, report) => sum + report.total_revenue_summary, 0);
      const totalTickets = filteredReports.reduce((sum, report) => sum + report.total_tickets_sold_summary, 0);
      
      // Group by event with revenue data
      const eventGroups = filteredReports.reduce((acc: Record<string, any>, report) => {
        const key = `${report.event_name}-${report.event_id}`;
        if (!acc[key]) {
          acc[key] = {
            event_name: report.event_name,
            event_id: report.event_id,
            count: 0,
            revenue: 0,
            tickets: 0
          };
        }
        acc[key].count += 1;
        acc[key].revenue += report.total_revenue_summary;
        acc[key].tickets += report.total_tickets_sold_summary;
        return acc;
      }, {});
      
      const reportsByEvent = Object.values(eventGroups) as any[];
      
      // Revenue by ticket type
      const ticketTypeGroups = filteredReports.reduce((acc: Record<string, number>, report) => {
        const type = report.ticket_type_name?.toUpperCase() || 'UNKNOWN_TYPE';
        acc[type] = (acc[type] || 0) + report.total_revenue_summary;
        return acc;
      }, {});
      
      const revenueByTicketType = Object.entries(ticketTypeGroups).map(([type, amount]) => ({
        ticket_type_name: type,
        amount: Number(amount)
      }));
      
      // Revenue by date for trend analysis
      const dateGroups = filteredReports.reduce((acc: Record<string, any>, report) => {
        const date = new Date(report.timestamp).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { revenue: 0, tickets: 0 };
        }
        acc[date].revenue += report.total_revenue_summary;
        acc[date].tickets += report.total_tickets_sold_summary;
        return acc;
      }, {});
      
      const revenueByDate = Object.entries(dateGroups)
        .map(([date, data]: [string, any]) => ({
          date,
          revenue: data.revenue,
          tickets: data.tickets
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Top events by revenue
      const topEvents = reportsByEvent
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      
      setStats({
        totalReports: filteredReports.length,
        totalRevenue,
        totalTickets,
        reportsByEvent,
        revenueByTicketType,
        revenueByDate,
        topEvents
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
  }, [selectedOrganizer, timePreset, customStartDate, customEndDate, startTime, endTime, searchTerm, generateMockData, getDateRange, toast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Filtered and sorted events for display
  const sortedEvents = useMemo(() => {
    let sorted = [...stats.reportsByEvent];
    
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'revenue':
          comparison = a.revenue - b.revenue;
          break;
        case 'tickets':
          comparison = a.tickets - b.tickets;
          break;
        case 'reports':
          comparison = a.count - b.count;
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return sorted;
  }, [stats.reportsByEvent, sortBy, sortOrder]);

  const downloadPDF = async (eventId: number, eventName: string) => {
    setDownloadingPdfs(prev => new Set([...prev, eventId]));
    
    // Simulate download delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Success",
      description: `PDF report for "${eventName}" downloaded successfully`,
    });
    
    setDownloadingPdfs(prev => {
      const newSet = new Set(prev);
      newSet.delete(eventId);
      return newSet;
    });
  };

  const exportAllReports = async () => {
    setIsExportingAll(true);
    
    // Simulate export delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    toast({
      title: "Success",
      description: "All filtered reports exported successfully.",
    });
    
    setIsExportingAll(false);
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

  return (
    <div className="space-y-6">
      {/* Header Card with Enhanced Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  System Reports
                </CardTitle>
                <CardDescription>
                  {selectedOrganizer === 'all'
                    ? 'Comprehensive report analytics across all organizers'
                    : `Analytics for selected organizer`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? 'Hide' : 'Show'} Filters
                </Button>
                <Button
                  onClick={fetchReports}
                  disabled={isLoading}
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events or ticket types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Badge variant="secondary" className="px-3 py-1">
                {stats.totalReports} reports found
              </Badge>
            </div>
            
            {/* Enhanced Filter Panel */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label>Organizer</Label>
                  <Select value={selectedOrganizer} onValueChange={setSelectedOrganizer}>
                    <SelectTrigger>
                      <SelectValue />
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
                
                <div className="space-y-2">
                  <Label>Time Period</Label>
                  <Select value={timePreset} onValueChange={setTimePreset}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_PRESETS.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {timePreset === 'custom' && (
                  <>
                    <div className="space-y-2">
                      <Label>Start Date & Time</Label>
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-24"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>End Date & Time</Label>
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-24"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              Generated reports
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats.totalRevenue.toLocaleString(undefined, { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all events
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalTickets.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Tickets sold
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Revenue/Event</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${stats.reportsByEvent.length > 0 
                ? (stats.totalRevenue / stats.reportsByEvent.length).toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })
                : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per event average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      {stats.revenueByDate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trends
            </CardTitle>
            <CardDescription>Daily revenue and ticket sales over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis yAxisId="revenue" orientation="left" />
                  <YAxis yAxisId="tickets" orientation="right" />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? `$${value.toLocaleString()}` : value.toLocaleString(),
                      name === 'revenue' ? 'Revenue' : 'Tickets'
                    ]}
                  />
                  <Area
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Area
                    yAxisId="tickets"
                    type="monotone"
                    dataKey="tickets"
                    stackId="2"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Events by Revenue</CardTitle>
                <CardDescription>Highest performing events</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="tickets">Tickets</SelectItem>
                    <SelectItem value="reports">Reports</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {sortedEvents.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedEvents.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="event_name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'revenue' ? `$${value.toLocaleString()}` : value.toLocaleString(),
                        name.charAt(0).toUpperCase() + name.slice(1)
                      ]}
                    />
                    <Bar
                      dataKey={sortBy}
                      fill="#8884d8"
                      radius={[4, 4, 0, 0]}
                    >
                      <LabelList 
                        dataKey={sortBy} 
                        position="top" 
                        formatter={(value: number) => 
                          sortBy === 'revenue' ? `$${(value / 1000).toFixed(0)}k` : value.toString()
                        }
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No event data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Ticket Type</CardTitle>
            <CardDescription>Distribution across ticket categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {stats.revenueByTicketType.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
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
                      label={({ ticket_type_name, percent }) => 
                        `${ticket_type_name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {stats.revenueByTicketType.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS_BY_TICKET[entry.ticket_type_name as keyof typeof COLORS_BY_TICKET] || FALLBACK_COLOR}
                        />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No ticket type data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Event Reports Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Event Reports
              </CardTitle>
              <CardDescription>Download individual or bulk reports</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
              >
                {viewMode === 'cards' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {viewMode === 'cards' ? 'Table View' : 'Card View'}
              </Button>
              <Button
                onClick={exportAllReports}
                disabled={isExportingAll || reports.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {isExportingAll ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4 mr-2" />
                )}
                Export All ({stats.totalReports})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'cards' ? (
            <div className="space-y-4">
              {sortedEvents.length > 0 ? (
                sortedEvents.map((event) => (
                  <div key={event.event_id} className="flex justify-between items-center p-4 border rounded-lg hover:shadow-md transition-shadow bg-gradient-to-r from-background to-muted/20">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{event.event_name}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {event.count} report{event.count !== 1 ? 's' : ''}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            ${event.revenue.toLocaleString()} revenue
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {event.tickets.toLocaleString()} tickets
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-4">
                        <div className="text-sm font-medium text-green-600">
                          ${(event.revenue / event.tickets || 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">avg per ticket</div>
                      </div>
                      <Button
                        onClick={() => downloadPDF(event.event_id, event.event_name)}
                        disabled={downloadingPdfs.has(event.event_id)}
                        variant="outline"
                        size="sm"
                        className="min-w-[120px]"
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
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No events found for the current filters.</p>
                  <Button variant="outline" onClick={() => setShowFilters(true)} className="mt-4">
                    Adjust Filters
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Event Name</th>
                      <th className="text-left p-4 font-medium">Reports</th>
                      <th className="text-left p-4 font-medium">Revenue</th>
                      <th className="text-left p-4 font-medium">Tickets</th>
                      <th className="text-left p-4 font-medium">Avg/Ticket</th>
                      <th className="text-center p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEvents.length > 0 ? (
                      sortedEvents.map((event) => (
                        <tr key={event.event_id} className="border-b hover:bg-muted/20 transition-colors">
                          <td className="p-4">
                            <div className="font-medium">{event.event_name}</div>
                            <div className="text-sm text-muted-foreground">ID: {event.event_id}</div>
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary">{event.count}</Badge>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-green-600">
                              ${event.revenue.toLocaleString()}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium">{event.tickets.toLocaleString()}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium">
                              ${(event.revenue / event.tickets || 0).toFixed(2)}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <Button
                              onClick={() => downloadPDF(event.event_id, event.event_name)}
                              disabled={downloadingPdfs.has(event.event_id)}
                              variant="outline"
                              size="sm"
                            >
                              {downloadingPdfs.has(event.event_id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No events found for the current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Insights Card */}
      {stats.topEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Insights
            </CardTitle>
            <CardDescription>Key performance metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">TOP PERFORMER</h4>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-semibold">{stats.topEvents[0]?.event_name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${stats.topEvents[0]?.revenue.toLocaleString()} revenue
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">MOST POPULAR TICKET</h4>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-semibold">
                      {stats.revenueByTicketType.reduce((max, current) => 
                        current.amount > max.amount ? current : max, stats.revenueByTicketType[0]
                      )?.ticket_type_name || 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Highest revenue contribution
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">PERFORMANCE TREND</h4>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div>
                    <p className="font-semibold">
                      {stats.revenueByDate.length > 1 && 
                       stats.revenueByDate[stats.revenueByDate.length - 1]?.revenue > 
                       stats.revenueByDate[stats.revenueByDate.length - 2]?.revenue 
                        ? 'Trending Up' : 'Stable'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Recent performance
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SystemReports;