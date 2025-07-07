// import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
// import { useToast } from "@/components/ui/use-toast";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select, SelectContent, SelectItem, SelectTrigger, SelectValue
// } from "@/components/ui/select";
// import {
//   Tabs, TabsContent, TabsList, TabsTrigger
// } from "@/components/ui/tabs";
// import {
//   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
//   PieChart, Pie, Cell, LineChart, Line
// } from 'recharts';
// import {
//   Loader2, AlertCircle, FileText, Download, Mail, PieChart as PieChartIcon,
//   TrendingUp, Users, DollarSign, Calendar, Globe, BarChart3, RefreshCw, ChevronDown
// } from "lucide-react";
// import { cn } from "@/lib/utils";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

// interface OrganizerReport {
//   id: number;
//   title: string;
//   total_revenue: number | null | undefined;
//   total_tickets: number;
//   total_events: number;
//   total_attendees: number;
//   report_date: string;
//   currency: string;
//   data_breakdown: {
//     events: Array<{
//       name: string;
//       revenue: number;
//       tickets: number;
//       attendees: number;
//     }>;
//     ticket_types: { [key: string]: number };
//     monthly_revenue: Array<{
//       month: string;
//       revenue: number;
//     }>;
//     payment_method_usage: { [key: string]: number };
//   };
// }

// interface Currency {
//   code: string;
//   name: string;
//   symbol: string;
// }

// interface ConvertedReport {
//   id: number;
//   original_currency: string;
//   target_currency: string;
//   original_amount: number | null | undefined;
//   converted_amount: number | null | undefined;
//   conversion_rate: number;
//   converted_at: string;
// }

// interface OrganizerReportProps {
//   darkMode: boolean;
// }

// const CHART_COLORS = [
//   '#8B5CF6', '#06D6A0', '#F59E0B', '#EF4444', '#3B82F6',
//   '#EC4899', '#10B981', '#F97316', '#6366F1', '#84CC16'
// ];

// const OrganizerReport: React.FC<OrganizerReportProps> = ({ darkMode }) => {
//   const [reports, setReports] = useState<OrganizerReport[]>([]);
//   const [selectedReport, setSelectedReport] = useState<OrganizerReport | null>(null);
//   const [currencies, setCurrencies] = useState<Currency[]>([]);
//   const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
//   const [convertedReports, setConvertedReports] = useState<ConvertedReport[]>([]); // This state is not currently used in the UI, but kept for future expansion
//   const [dateRange, setDateRange] = useState({ start: '', end: '' });
//   const [recipientEmail, setRecipientEmail] = useState('');
//   const [loading, setLoading] = useState({
//     reports: false,
//     generating: false,
//     converting: false,
//     exporting: false,
//     currencies: false
//   });
//   const [error, setError] = useState<string | null>(null);
//   const [activeChart, setActiveChart] = useState<string>('bar');
//   const { toast } = useToast();

//   const fetchCurrencies = useCallback(async () => {
//     try {
//       setLoading(prev => ({ ...prev, currencies: true }));
//       const response = await fetch(`${import.meta.env.VITE_API_URL}/api/currency/list`, {
//         credentials: 'include'
//       });
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//       const data = await response.json();
//       setCurrencies(data.data || []);
//       if (data.data && data.data.length > 0 && !selectedCurrency) {
//         setSelectedCurrency(data.data[0].code);
//       } else if (data.data && data.data.length > 0 && !data.data.some((c: Currency) => c.code === selectedCurrency)) {
//         // If the previously selected currency is no longer available, default to the first one
//         setSelectedCurrency(data.data[0].code);
//       }
//     } catch (err) {
//       console.error('Failed to fetch currencies:', err);
//       toast({
//         title: "Error fetching currencies",
//         description: "Could not load available currencies. Please try again later.",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(prev => ({ ...prev, currencies: false }));
//     }
//   }, [selectedCurrency, toast]);

//   const fetchReports = useCallback(async () => {
//     try {
//       setLoading(prev => ({ ...prev, reports: true }));
//       setError(null);
//       const response = await fetch(`${import.meta.env.VITE_API_URL}/reports`, {
//         credentials: 'include'
//       });
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//       const data = await response.json();
//       setReports(data.reports || []);
//       if (data.reports.length === 0) {
//         toast({
//           title: "No reports found",
//           description: "No reports available. Generate your first report!",
//           variant: "default",
//         });
//         setSelectedReport(null);
//       } else if (!selectedReport || !data.reports.some((report: OrganizerReport) => report.id === selectedReport.id)) {
//         // Automatically select the first report if no report is selected or if the selected report no longer exists
//         setSelectedReport(data.reports[0]);
//       }
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching reports';
//       setError(errorMessage);
//       console.error('Fetch reports error:', err);
//       toast({
//         title: "Error fetching reports",
//         description: "Failed to load reports. Please try again later.",
//         variant: "destructive",
//       });
//       setReports([]);
//       setSelectedReport(null);
//     } finally {
//       setLoading(prev => ({ ...prev, reports: false }));
//     }
//   }, [toast, selectedReport]);

//   const fetchConvertedReports = useCallback(async () => {
//     // This function is currently not directly used to display converted reports,
//     // but it could be used to populate a history of conversions if needed.
//     try {
//       const response = await fetch(`${import.meta.env.VITE_API_URL}/api/currency/reports/converted`, {
//         credentials: 'include'
//       });
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//       const data = await response.json();
//       setConvertedReports(data.data.reports || []);
//     } catch (err) {
//       console.error('Failed to fetch converted reports:', err);
//       toast({
//         title: "Error fetching converted reports",
//         description: "Could not load currency conversion history.",
//         variant: "destructive",
//       });
//     }
//   }, [toast]);

//   // Initial data fetch
//   useEffect(() => {
//     fetchCurrencies();
//     fetchReports();
//   }, [fetchCurrencies, fetchReports]);

//   const generateReport = useCallback(async () => {
//     if (!dateRange.start || !dateRange.end || !recipientEmail || !recipientEmail.includes('@')) {
//       toast({
//         title: "Missing Input",
//         description: "Please fill in all required fields with valid data.",
//         variant: "destructive",
//       });
//       return;
//     }
//     try {
//       setLoading(prev => ({ ...prev, generating: true }));
//       setError(null);
//       const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/generate`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         credentials: 'include',
//         body: JSON.stringify({
//           start_date: dateRange.start,
//           end_date: dateRange.end,
//           // If no report is selected, or if reports array is empty, default to null for event_id
//           event_id: selectedReport?.id ?? (reports.length > 0 ? reports[0].id : null),
//           ticket_type_id: null, // Assuming this is not required or can be null for a general report
//           target_currency_id: currencies.find(c => c.code === selectedCurrency)?.code ?? 'USD',
//           send_email: true,
//           recipient_email: recipientEmail,
//         })
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//       }
//       const data = await response.json();
//       await fetchReports(); // Re-fetch reports to show the newly generated one
//       setSelectedReport(data.report); // Select the newly generated report
//       toast({
//         title: "Report Generated!",
//         description: `Report "${data.report.title}" has been successfully generated and sent to ${recipientEmail}.`,
//         variant: "default",
//       });
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : 'An error occurred while generating the report';
//       setError(errorMessage);
//       console.error('Generate report error:', err);
//       toast({
//         title: "Report Generation Failed",
//         description: errorMessage,
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(prev => ({ ...prev, generating: false }));
//     }
//   }, [dateRange, fetchReports, reports, selectedReport, currencies, selectedCurrency, toast, recipientEmail]);

//   const convertRevenue = useCallback(async (reportId: number) => {
//     if (!selectedCurrency) {
//       toast({
//         title: "No Currency Selected",
//         description: "Please select a target currency for conversion.",
//         variant: "destructive",
//       });
//       return;
//     }
//     const reportToConvert = reports.find(r => r.id === reportId);
//     if (!reportToConvert) {
//       toast({
//         title: "Report Not Found",
//         description: "Could not find the report to convert.",
//         variant: "destructive",
//       });
//       return;
//     }
//     if (selectedCurrency === reportToConvert.currency) {
//       toast({
//         title: "No Conversion Needed",
//         description: `The report is already in ${selectedCurrency}.`,
//         variant: "default",
//       });
//       return;
//     }

//     try {
//       setLoading(prev => ({ ...prev, converting: true }));
//       setError(null);
//       const response = await fetch(`${import.meta.env.VITE_API_URL}/api/currency/revenue/convert`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         credentials: 'include',
//         body: JSON.stringify({
//           report_id: reportId,
//           target_currency: selectedCurrency
//         })
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//       }
//       const data = await response.json();
//       const convertedData = data.data;

//       // Update the selected report with converted revenue and currency
//       setSelectedReport(prev => prev ? {
//         ...prev,
//         total_revenue: convertedData.converted_amount,
//         currency: convertedData.target_currency,
//         // Optionally update the data_breakdown if specific event revenues were also converted
//         // For simplicity, we're only updating total_revenue here.
//       } : null);

//       // Also update the reports list
//       setReports(prevReports => prevReports.map(report =>
//         report.id === reportId
//           ? {
//             ...report,
//             total_revenue: convertedData.converted_amount,
//             currency: convertedData.target_currency,
//           }
//           : report
//       ));

//       await fetchConvertedReports(); // Update conversion history (if displayed)
//       toast({
//         title: "Conversion Successful!",
//         description: `Revenue converted to ${selectedCurrency}. New amount: ${convertedData.converted_amount.toLocaleString()} ${convertedData.target_currency}.`,
//         variant: "default",
//       });
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : 'An error occurred while converting currency';
//       setError(errorMessage);
//       console.error('Convert currency error:', err);
//       toast({
//         title: "Conversion Failed",
//         description: errorMessage,
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(prev => ({ ...prev, converting: false }));
//     }
//   }, [selectedCurrency, selectedReport, reports, fetchConvertedReports, toast]);


//   const exportReport = useCallback(async (reportId: number, format: 'pdf' | 'csv' | 'xlsx') => {
//     try {
//       setLoading(prev => ({ ...prev, exporting: true }));
//       setError(null);
//       const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/${reportId}/export?format=${format}`, {
//         credentials: 'include'
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//       }
//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = `report_${reportId}.${format === 'pdf' ? 'pdf' : (format === 'csv' ? 'csv' : 'xlsx')}`;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       window.URL.revokeObjectURL(url);
//       toast({
//         title: "Export Successful!",
//         description: `Report exported as ${format.toUpperCase()}.`,
//         variant: "default",
//       });
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : 'An error occurred while exporting the report';
//       setError(errorMessage);
//       console.error('Export report error:', err);
//       toast({
//         title: "Export Failed",
//         description: errorMessage,
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(prev => ({ ...prev, exporting: false }));
//     }
//   }, [toast]);

//   const formatNumber = (value: number | undefined | null) =>
//     value != null ? value.toLocaleString() : '0';

//   const formatChartData = useCallback((data: { [key: string]: number } | undefined) => {
//     if (!data) return [];
//     return Object.entries(data).map(([label, value], index) => ({
//       name: label,
//       value,
//       color: CHART_COLORS[index % CHART_COLORS.length],
//       percentage: 0 // Will be calculated later
//     }));
//   }, []);

//   const calculatePercentages = useCallback((data: any[]) => {
//     const total = data.reduce((sum, item) => sum + item.value, 0);
//     return data.map(item => ({
//       ...item,
//       percentage: total > 0 ? parseFloat(((item.value / total) * 100).toFixed(1)) : 0
//     }));
//   }, []);

//   const ticketsSoldChartData = useMemo(() =>
//     calculatePercentages(formatChartData(selectedReport?.data_breakdown?.ticket_types)),
//     [selectedReport, formatChartData, calculatePercentages]
//   );

//   const revenueChartData = useMemo(() =>
//     calculatePercentages(formatChartData(selectedReport?.data_breakdown?.events.reduce((acc, event) => {
//       acc[event.name] = event.revenue;
//       return acc;
//     }, {} as { [key: string]: number }))),
//     [selectedReport, formatChartData, calculatePercentages]
//   );

//   const paymentMethodChartData = useMemo(() =>
//     calculatePercentages(formatChartData(selectedReport?.data_breakdown?.payment_method_usage)),
//     [selectedReport, formatChartData, calculatePercentages]
//   );

//   const CustomTooltip = ({ active, payload, label }: any) => {
//     if (active && payload && payload.length) {
//       return (
//         <div className={cn(
//           "p-4 rounded-lg shadow-lg border backdrop-blur-sm",
//           darkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800"
//         )}>
//           <p className="font-semibold text-lg mb-2">{label}</p>
//           {payload.map((entry: any, index: number) => (
//             <div key={index} className="flex items-center gap-2 mb-1">
//               <div
//                 className="w-3 h-3 rounded-full"
//                 style={{ backgroundColor: entry.color || entry.stroke || entry.fill }}
//               />
//               <span className="text-sm">
//                 {entry.name || entry.dataKey}: {typeof entry.value === 'number' ? formatNumber(entry.value) : entry.value}
//                 {entry.unit && ` ${entry.unit}`}
//                 {entry.payload.percentage && ` (${entry.payload.percentage}%)`}
//               </span>
//             </div>
//           ))}
//         </div>
//       );
//     }
//     return null;
//   };

//   const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
//     if (percent < 0.05) return null; // Only show labels for slices larger than 5%
//     const RADIAN = Math.PI / 180;
//     const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
//     const x = cx + radius * Math.cos(-midAngle * RADIAN);
//     const y = cy + radius * Math.sin(-midAngle * RADIAN);
//     return (
//       <text
//         x={x}
//         y={y}
//         fill={darkMode ? "#ffffff" : "#000000"}
//         textAnchor={x > cx ? 'start' : 'end'}
//         dominantBaseline="central"
//         className="text-xs font-medium"
//       >
//         {`${(percent * 100).toFixed(0)}%`}
//       </text>
//     );
//   };

//   const eventsChartData = selectedReport?.data_breakdown?.events?.map(event => ({
//     name: event.name,
//     revenue: event.revenue,
//     tickets: event.tickets,
//     attendees: event.attendees
//   })) || [];

//   const monthlyRevenueData = selectedReport?.data_breakdown?.monthly_revenue || [];

//   return (
//     <div className={cn("min-h-screen p-4 md:p-6", darkMode ? "bg-gray-900 text-gray-200" : "bg-gray-50 text-gray-800")}>
//       <div className="max-w-7xl mx-auto space-y-6">
//         <div className="text-center">
//           <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
//             Organizer Reports Dashboard
//           </h1>
//           <p className={cn("mt-2", darkMode ? "text-gray-400" : "text-gray-600")}>
//             Generate, manage, and analyze your event reports
//           </p>
//         </div>

//         {/* Generate New Report Card */}
//         <Card className={cn(darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
//           <CardHeader>
//             <CardTitle className={cn("flex items-center gap-2", darkMode ? "text-gray-200" : "text-gray-800")}>
//               <BarChart3 className="h-5 w-5" />
//               Generate New Report
//             </CardTitle>
//             <CardDescription className={darkMode ? "text-gray-400" : "text-gray-600"}>
//               Create a comprehensive report for your events within a specific date range and email it.
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="flex flex-col md:flex-row gap-4 items-end">
//               <div className="flex-1">
//                 <Label htmlFor="startDate" className={darkMode ? "text-gray-200" : "text-gray-800"}>Start Date</Label>
//                 <Input
//                   id="startDate"
//                   type="date"
//                   value={dateRange.start}
//                   onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
//                   className={cn("mt-1", darkMode ? "bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-400" : "bg-gray-200 border-gray-300 text-gray-800 placeholder:text-gray-500")}
//                 />
//               </div>
//               <div className="flex-1">
//                 <Label htmlFor="endDate" className={darkMode ? "text-gray-200" : "text-gray-800"}>End Date</Label>
//                 <Input
//                   id="endDate"
//                   type="date"
//                   value={dateRange.end}
//                   onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
//                   className={cn("mt-1", darkMode ? "bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-400" : "bg-gray-200 border-gray-300 text-gray-800 placeholder:text-gray-500")}
//                 />
//               </div>
//               <div className="flex-1">
//                 <Label htmlFor="recipientEmail" className={darkMode ? "text-gray-200" : "text-gray-800"}>Recipient Email</Label>
//                 <Input
//                   id="recipientEmail"
//                   type="email"
//                   value={recipientEmail}
//                   onChange={(e) => setRecipientEmail(e.target.value)}
//                   placeholder="Enter email to receive report"
//                   className={cn("mt-1", darkMode ? "bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-400" : "bg-gray-200 border-gray-300 text-gray-800 placeholder:text-gray-500")}
//                 />
//               </div>
//               <Button
//                 onClick={generateReport}
//                 disabled={loading.generating || !dateRange.start || !dateRange.end || !recipientEmail}
//                 className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
//               >
//                 {loading.generating ? (
//                   <Loader2 className="h-4 w-4 animate-spin mr-2" />
//                 ) : (
//                   <FileText className="h-4 w-4 mr-2" />
//                 )}
//                 Generate Report
//               </Button>
//             </div>
//           </CardContent>
//         </Card>

//         {error && (
//           <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
//             <CardContent className="pt-6">
//               <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
//                 <AlertCircle className="h-4 w-4" />
//                 <p>{error}</p>
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         {/* Your Reports Card */}
//         <Card className={cn(darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
//           <CardHeader>
//             <div className="flex items-center justify-between">
//               <CardTitle className={cn("flex items-center gap-2", darkMode ? "text-gray-200" : "text-gray-800")}>
//                 <FileText className="h-5 w-5" />
//                 Your Reports
//               </CardTitle>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={fetchReports}
//                 disabled={loading.reports}
//                 className={cn(darkMode ? "text-gray-200 border-gray-600 bg-gray-700 hover:bg-gray-600" : "text-gray-800 border-gray-300 bg-gray-100 hover:bg-gray-200")}
//               >
//                 <RefreshCw className={cn("h-4 w-4 mr-2", loading.reports && "animate-spin")} />
//                 Refresh
//               </Button>
//             </div>
//           </CardHeader>
//           <CardContent>
//             {loading.reports ? (
//               <div className="flex items-center justify-center h-32">
//                 <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
//               </div>
//             ) : reports.length === 0 ? (
//               <p className={cn("text-center h-32 flex items-center justify-center", darkMode ? "text-gray-400" : "text-gray-500")}>
//                 No reports found. Generate your first report above.
//               </p>
//             ) : (
//               <div className="grid gap-4">
//                 {reports.map((report) => (
//                   <div
//                     key={report.id}
//                     className={cn(
//                       "p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md",
//                       selectedReport?.id === report.id
//                         ? "border-purple-500 ring-2 ring-purple-500/50 bg-purple-50 dark:bg-purple-900/20"
//                         : "border-gray-200 dark:border-gray-700",
//                       darkMode ? "bg-gray-800" : "bg-white"
//                     )}
//                     onClick={() => setSelectedReport(report)}
//                   >
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <h3 className={cn("font-semibold", darkMode ? "text-gray-200" : "text-gray-800")}>{report.title}</h3>
//                         <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-600")}>
//                           <Calendar className="inline-block h-3 w-3 mr-1 text-gray-500" /> {report.report_date} • <Globe className="inline-block h-3 w-3 mr-1 text-gray-500" /> {report.currency}
//                         </p>
//                       </div>
//                       <div className="flex items-center gap-2 text-right">
//                         <div>
//                           <p className="font-semibold text-green-600">
//                             {report.currency} {formatNumber(report.total_revenue)}
//                           </p>
//                           <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>
//                             <BarChart3 className="inline-block h-3 w-3 mr-1 text-gray-500" /> {report.total_events} events • <Users className="inline-block h-3 w-3 mr-1 text-gray-500" /> {report.total_tickets} tickets
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         {/* Selected Report Details and Charts */}
//         {selectedReport && (
//           <Card className={cn(darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
//             <CardHeader>
//               <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
//                 <div>
//                   <CardTitle className={cn("flex items-center gap-2", darkMode ? "text-gray-200" : "text-gray-800")}>
//                     <TrendingUp className="h-5 w-5 text-purple-500" />
//                     {selectedReport.title}
//                   </CardTitle>
//                   <CardDescription className={cn("mt-1", darkMode ? "text-gray-400" : "text-gray-600")}>
//                     Report details generated on {selectedReport.report_date}
//                   </CardDescription>
//                 </div>
//                 <div className="flex items-center gap-3 mt-2 md:mt-0">
//                   <Select value={selectedCurrency} onValueChange={setSelectedCurrency} disabled={loading.currencies}>
//                     <SelectTrigger className={cn("w-36 md:w-40", darkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-gray-200 border-gray-300 text-gray-800")}>
//                       <SelectValue placeholder="Select Currency" />
//                     </SelectTrigger>
//                     <SelectContent className={cn(darkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-gray-200 border-gray-300 text-gray-800")}>
//                       {loading.currencies && <div className="p-2 text-center"><Loader2 className="h-4 w-4 animate-spin mr-2 text-purple-500 inline-block" /> Loading...</div>}
//                       {!loading.currencies && currencies.length === 0 && <div className="p-2 text-center text-sm text-gray-500">No currencies available</div>}
//                       {currencies.map((currency) => (
//                         <SelectItem key={currency.code} value={currency.code}>
//                           {currency.code} - {currency.name}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => convertRevenue(selectedReport.id)}
//                     disabled={loading.converting || !selectedCurrency || selectedCurrency === selectedReport.currency}
//                     className={cn(darkMode ? "text-gray-200 border-gray-600 bg-gray-700 hover:bg-gray-600" : "text-gray-800 border-gray-300 bg-gray-100 hover:bg-gray-200")}
//                   >
//                     {loading.converting ? (
//                       <Loader2 className="h-4 w-4 animate-spin mr-2" />
//                     ) : (
//                       <Globe className="h-4 w-4 mr-2" />
//                     )}
//                     Convert
//                   </Button>
//                   <DropdownMenu>
//                     <DropdownMenuTrigger asChild>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         disabled={loading.exporting}
//                         className={cn(darkMode ? "text-gray-200 border-gray-600 bg-gray-700 hover:bg-gray-600" : "text-gray-800 border-gray-300 bg-gray-100 hover:bg-gray-200")}
//                       >
//                         {loading.exporting ? (
//                           <Loader2 className="h-4 w-4 animate-spin mr-2" />
//                         ) : (
//                           <Download className="h-4 w-4 mr-2" />
//                         )}
//                         Export <ChevronDown className="ml-2 h-4 w-4" />
//                       </Button>
//                     </DropdownMenuTrigger>
//                     <DropdownMenuContent className={cn(darkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800")}>
//                       <DropdownMenuItem onClick={() => exportReport(selectedReport.id, 'pdf')} className={cn(darkMode ? "focus:bg-gray-700" : "focus:bg-gray-100")}>
//                         Export as PDF
//                       </DropdownMenuItem>
//                       <DropdownMenuItem onClick={() => exportReport(selectedReport.id, 'csv')} className={cn(darkMode ? "focus:bg-gray-700" : "focus:bg-gray-100")}>
//                         Export as CSV
//                       </DropdownMenuItem>
//                       <DropdownMenuItem onClick={() => exportReport(selectedReport.id, 'xlsx')} className={cn(darkMode ? "focus:bg-gray-700" : "focus:bg-gray-100")}>
//                         Export as XLSX
//                       </DropdownMenuItem>
//                     </DropdownMenuContent>
//                   </DropdownMenu>
//                 </div>
//               </div>
//             </CardHeader>
//             <CardContent>
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//                 <Card className={cn(darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-200 border-gray-300")}>
//                   <CardContent className="pt-6 flex items-center justify-between">
//                     <div>
//                       <div className="text-2xl font-bold text-green-600">
//                         {selectedReport.currency} {formatNumber(selectedReport.total_revenue)}
//                       </div>
//                       <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>Total Revenue</p>
//                     </div>
//                     <DollarSign className="h-8 w-8 text-green-500/70" />
//                   </CardContent>
//                 </Card>
//                 <Card className={cn(darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-200 border-gray-300")}>
//                   <CardContent className="pt-6 flex items-center justify-between">
//                     <div>
//                       <div className="text-2xl font-bold text-blue-600">
//                         {selectedReport.total_events}
//                       </div>
//                       <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>Total Events</p>
//                     </div>
//                     <Calendar className="h-8 w-8 text-blue-500/70" />
//                   </CardContent>
//                 </Card>
//                 <Card className={cn(darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-200 border-gray-300")}>
//                   <CardContent className="pt-6 flex items-center justify-between">
//                     <div>
//                       <div className="text-2xl font-bold text-purple-600">
//                         {selectedReport.total_tickets}
//                       </div>
//                       <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>Total Tickets</p>
//                     </div>
//                     <Mail className="h-8 w-8 text-purple-500/70" /> {/* Using Mail icon as a generic 'tickets' icon for now, consider a specific ticket icon if available */}
//                   </CardContent>
//                 </Card>
//                 <Card className={cn(darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-200 border-gray-300")}>
//                   <CardContent className="pt-6 flex items-center justify-between">
//                     <div>
//                       <div className="text-2xl font-bold text-orange-600">
//                         {selectedReport.total_attendees}
//                       </div>
//                       <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>Total Attendees</p>
//                     </div>
//                     <Users className="h-8 w-8 text-orange-500/70" />
//                   </CardContent>
//                 </Card>
//               </div>

//               {/* Charts Section */}
//               <Tabs value={activeChart} onValueChange={setActiveChart} className="mt-8">
//                 <TabsList className={cn("grid w-full grid-cols-3", darkMode ? "bg-gray-700" : "bg-gray-200")}>
//                   <TabsTrigger
//                     value="eventsRevenue"
//                     className={cn(darkMode ? "data-[state=active]:bg-gray-900 data-[state=active]:text-gray-50 text-gray-300" : "data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-700")}
//                   >
//                     Event Revenue
//                   </TabsTrigger>
//                   <TabsTrigger
//                     value="ticketTypes"
//                     className={cn(darkMode ? "data-[state=active]:bg-gray-900 data-[state=active]:text-gray-50 text-gray-300" : "data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-700")}
//                   >
//                     Ticket Types
//                   </TabsTrigger>
//                   <TabsTrigger
//                     value="monthlyRevenue"
//                     className={cn(darkMode ? "data-[state=active]:bg-gray-900 data-[state=active]:text-gray-50 text-gray-300" : "data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-700")}
//                   >
//                     Monthly Revenue
//                   </TabsTrigger>
//                 </TabsList>
//                 <TabsContent value="eventsRevenue" className="mt-4 p-4 rounded-lg border dark:border-gray-700 dark:bg-gray-800 bg-white">
//                   <h3 className={cn("text-lg font-semibold mb-4", darkMode ? "text-gray-200" : "text-gray-800")}>Revenue by Event</h3>
//                   {eventsChartData.length > 0 ? (
//                     <ResponsiveContainer width="100%" height={300}>
//                       <BarChart data={eventsChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
//                         <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />
//                         <XAxis dataKey="name" stroke={darkMode ? "#A0AEC0" : "#4A5568"} />
//                         <YAxis stroke={darkMode ? "#A0AEC0" : "#4A5568"} />
//                         <Tooltip content={<CustomTooltip />} />
//                         <Legend />
//                         <Bar dataKey="revenue" fill="#8B5CF6" name={`Revenue (${selectedReport.currency})`} />
//                       </BarChart>
//                     </ResponsiveContainer>
//                   ) : (
//                     <p className={cn("text-center py-10", darkMode ? "text-gray-400" : "text-gray-500")}>No event revenue data available.</p>
//                   )}
//                 </TabsContent>
//                 <TabsContent value="ticketTypes" className="mt-4 p-4 rounded-lg border dark:border-gray-700 dark:bg-gray-800 bg-white">
//                   <h3 className={cn("text-lg font-semibold mb-4", darkMode ? "text-gray-200" : "text-gray-800")}>Tickets Sold by Type</h3>
//                   {ticketsSoldChartData.length > 0 ? (
//                     <ResponsiveContainer width="100%" height={300}>
//                       <PieChart>
//                         <Pie
//                           data={ticketsSoldChartData}
//                           cx="50%"
//                           cy="50%"
//                           labelLine={false}
//                           outerRadius={100}
//                           fill="#8884d8"
//                           dataKey="value"
//                           label={renderPieLabel}
//                         >
//                           {ticketsSoldChartData.map((entry, index) => (
//                             <Cell key={`cell-${index}`} fill={entry.color} />
//                           ))}
//                         </Pie>
//                         <Tooltip content={<CustomTooltip />} />
//                         <Legend />
//                       </PieChart>
//                     </ResponsiveContainer>
//                   ) : (
//                     <p className={cn("text-center py-10", darkMode ? "text-gray-400" : "text-gray-500")}>No ticket type data available.</p>
//                   )}
//                 </TabsContent>
//                 <TabsContent value="monthlyRevenue" className="mt-4 p-4 rounded-lg border dark:border-gray-700 dark:bg-gray-800 bg-white">
//                   <h3 className={cn("text-lg font-semibold mb-4", darkMode ? "text-gray-200" : "text-gray-800")}>Monthly Revenue Trend</h3>
//                   {monthlyRevenueData.length > 0 ? (
//                     <ResponsiveContainer width="100%" height={300}>
//                       <LineChart data={monthlyRevenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
//                         <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />
//                         <XAxis dataKey="month" stroke={darkMode ? "#A0AEC0" : "#4A5568"} />
//                         <YAxis stroke={darkMode ? "#A0AEC0" : "#4A5568"} />
//                         <Tooltip content={<CustomTooltip />} />
//                         <Legend />
//                         <Line type="monotone" dataKey="revenue" stroke="#3B82F6" activeDot={{ r: 8 }} name={`Revenue (${selectedReport.currency})`} />
//                       </LineChart>
//                     </ResponsiveContainer>
//                   ) : (
//                     <p className={cn("text-center py-10", darkMode ? "text-gray-400" : "text-gray-500")}>No monthly revenue data available.</p>
//                   )}
//                 </TabsContent>
//               </Tabs>

//               {/* Payment Method Usage */}
//               {paymentMethodChartData.length > 0 && (
//                 <div className="mt-8 p-4 rounded-lg border dark:border-gray-700 dark:bg-gray-800 bg-white">
//                   <h3 className={cn("text-lg font-semibold mb-4", darkMode ? "text-gray-200" : "text-gray-800")}>Payment Method Usage</h3>
//                   <ResponsiveContainer width="100%" height={250}>
//                     <PieChart>
//                       <Pie
//                         data={paymentMethodChartData}
//                         cx="50%"
//                         cy="50%"
//                         labelLine={false}
//                         outerRadius={80}
//                         fill="#8884d8"
//                         dataKey="value"
//                         label={renderPieLabel}
//                       >
//                         {paymentMethodChartData.map((entry, index) => (
//                           <Cell key={`cell-${index}`} fill={entry.color} />
//                         ))}
//                       </Pie>
//                       <Tooltip content={<CustomTooltip />} />
//                       <Legend />
//                     </PieChart>
//                   </ResponsiveContainer>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         )}
//       </div>
//     </div>
//   );
// };

// export default OrganizerReport;


import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
  Loader2, AlertCircle, FileText, Download, Mail, PieChart as PieChartIcon,
  TrendingUp, Users, DollarSign, Calendar, MapPin, Filter, BarChart3,
  Eye, EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EventReport {
  event_id: number;
  event_name: string;
  total_tickets_sold: number;
  number_of_attendees: number;
  total_revenue: number;
  event_date: string;
  event_location: string;
  tickets_sold_by_type: { [key: string]: number };
  revenue_by_ticket_type: { [key: string]: number };
  attendees_by_ticket_type: { [key: string]: number };
  payment_method_usage: { [key: string]: number };
  filter_start_date?: string;
  filter_end_date?: string;
}

interface OrganizerReportsProps {
  eventId: number;
  eventReport?: EventReport | null;
}

const CHART_COLORS = [
  '#8B5CF6', '#06D6A0', '#F59E0B', '#EF4444', '#3B82F6',
  '#EC4899', '#10B981', '#F97316', '#6366F1', '#84CC16'
];

const OrganizerReports: React.FC<OrganizerReportsProps> = ({ eventId, eventReport: initialReport = null }) => {
  const [reportData, setReportData] = useState<EventReport | null>(initialReport);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [isLoadingDownload, setIsLoadingDownload] = useState<boolean>(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeChart, setActiveChart] = useState<string>('bar');
  const [selectedView, setSelectedView] = useState<string>('overview');
  const { toast } = useToast();

  const handleOperationError = useCallback((message: string, err?: any) => {
    console.error('Operation error:', message, err);
    setError(message);
    toast({
      title: "Error",
      description: err?.message || message,
      variant: "destructive",
    });
  }, [toast]);

  const canFetchReport = useMemo(() => {
    if (!startDate || !endDate) {
      return false;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start <= end;
  }, [startDate, endDate]);

  const fetchReport = useCallback(async () => {
    if (!canFetchReport) {
      setError("Please select valid start and end dates. Start date cannot be after end date.");
      toast({
        title: "Validation Error",
        description: "Please select valid start and end dates. Start date cannot be after end date.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingReport(true);
    setError(null);
    setReportData(null);

    try {
      const params = new URLSearchParams();
      params.append('start_date', startDate);
      params.append('end_date', endDate);
      const url = `${import.meta.env.VITE_API_URL}/reports/events/${eventId}?${params.toString()}`;

      const response = await fetch(url, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        handleOperationError(errorData.message || "Failed to fetch event report.", errorData);
        return;
      }

      const data: EventReport = await response.json();
      setReportData(data);
      toast({
        title: "Report Loaded",
        description: "Event report fetched successfully.",
        variant: "default",
      });
    } catch (err: any) {
      handleOperationError("An unexpected error occurred while fetching the event report.", err);
    } finally {
      setIsLoadingReport(false);
    }
  }, [eventId, startDate, endDate, canFetchReport, handleOperationError, toast]);

  const downloadReport = useCallback(async (format: 'pdf' | 'csv') => {
    if (!canFetchReport) {
      setError("Please select valid start and end dates before downloading.");
      toast({
        title: "Validation Error",
        description: "Please select valid start and end dates before downloading.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingDownload(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('start_date', startDate);
      params.append('end_date', endDate);

      let url = '';
      if (format === 'pdf') {
        url = `${import.meta.env.VITE_API_URL}/reports/events/${eventId}/download/pdf?${params.toString()}`;
      } else if (format === 'csv') {
        url = `${import.meta.env.VITE_API_URL}/reports/events/${eventId}/export/csv?${params.toString()}`;
      } else {
        handleOperationError("Unsupported download format.");
        return;
      }

      const response = await fetch(url, {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `event_report_${eventId}.${format}`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }

        const urlBlob = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = urlBlob;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(urlBlob);

        toast({
          title: "Download Successful",
          description: `${format.toUpperCase()} report downloaded successfully!`,
          variant: "default",
        });
      } else {
        const errorData = await response.json();
        handleOperationError(errorData.message || `Failed to download ${format} report.`, errorData);
      }
    } catch (err: any) {
      handleOperationError(`An unexpected error occurred while downloading the ${format} report.`, err);
    } finally {
      setIsLoadingDownload(false);
    }
  }, [eventId, startDate, endDate, canFetchReport, handleOperationError, toast]);

  const resendReportEmail = useCallback(async () => {
    if (!canFetchReport) {
      setError("Please select valid start and end dates before resending the email.");
      toast({
        title: "Validation Error",
        description: "Please select valid start and end dates before resending the email.",
        variant: "destructive",
      });
      return;
    }

    if (!window.confirm("Are you sure you want to resend the report email? This might trigger a notification to relevant parties.")) {
      return;
    }

    setIsLoadingEmail(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('start_date', startDate);
      params.append('end_date', endDate);
      const url = `${import.meta.env.VITE_API_URL}/reports/events/${eventId}/resend-email?${params.toString()}`;

      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Email Sent",
          description: data.message || "Report email resent successfully!",
          variant: "default",
        });
      } else {
        const errorData = await response.json();
        handleOperationError(errorData.message || "Failed to resend report email.", errorData);
      }
    } catch (err: any) {
      handleOperationError('An unexpected error occurred while resending the report email.', err);
    } finally {
      setIsLoadingEmail(false);
    }
  }, [eventId, startDate, endDate, canFetchReport, handleOperationError, toast]);

  const formatChartData = useCallback((data: { [key: string]: number } | undefined) => {
    if (!data) return [];
    return Object.entries(data).map(([label, value], index) => ({
      name: label,
      value,
      color: CHART_COLORS[index % CHART_COLORS.length],
      percentage: 0
    }));
  }, []);

  const calculatePercentages = useCallback((data: any[]) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return data.map(item => ({
      ...item,
      percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
    }));
  }, []);

  const ticketsSoldChartData = useMemo(() =>
    calculatePercentages(formatChartData(reportData?.tickets_sold_by_type)),
    [reportData, formatChartData, calculatePercentages]
  );

  const revenueChartData = useMemo(() =>
    calculatePercentages(formatChartData(reportData?.revenue_by_ticket_type)),
    [reportData, formatChartData, calculatePercentages]
  );

  const paymentMethodChartData = useMemo(() =>
    calculatePercentages(formatChartData(reportData?.payment_method_usage)),
    [reportData, formatChartData, calculatePercentages]
  );

  const attendeesByTicketTypeData = useMemo(() =>
    calculatePercentages(formatChartData(reportData?.attendees_by_ticket_type)),
    [reportData, formatChartData, calculatePercentages]
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={cn(
          "p-4 rounded-lg shadow-lg border backdrop-blur-sm",
          "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200 text-gray-800"
        )}>
          <p className="font-semibold text-lg mb-2 dark:text-gray-200 text-gray-800">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm dark:text-gray-200 text-gray-800">
                {entry.name}: {entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={"#ffffff"}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (isLoadingReport && !reportData && !error) {
    return (
      <Card className={cn("max-w-3xl mx-auto my-8 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200 text-gray-800")}>
        <CardHeader>
          <CardTitle className="dark:text-gray-200 text-gray-800">Event Report</CardTitle>
          <CardDescription className="dark:text-gray-400 text-gray-600">Loading event report data...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className={cn("mt-4 text-lg dark:text-gray-400 text-gray-600")}>Fetching event insights...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("min-h-screen p-4 md:p-6 lg:p-8 dark:bg-gray-900 dark:text-gray-200 bg-gray-50 text-gray-800")}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              Event Analytics Dashboard
            </h1>
            {reportData && (
              <>
                <h2 className={cn("text-xl md:text-2xl font-semibold dark:text-gray-200 text-gray-800")}>{reportData.event_name}</h2>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm dark:text-gray-400 text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {reportData.event_date}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {reportData.event_location}
                  </div>
                </div>
              </>
            )}
          </div>

          {reportData && (
            <div className="flex flex-wrap justify-center md:justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => downloadReport('pdf')}
                disabled={isLoadingDownload || !canFetchReport}
                className="hover:scale-105 transition-transform dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                <Download className="mr-2 h-4 w-4" />
                {isLoadingDownload ? "Downloading..." : "PDF Report"}
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadReport('csv')}
                disabled={isLoadingDownload || !canFetchReport}
                className="hover:scale-105 transition-transform dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                <Download className="mr-2 h-4 w-4" />
                {isLoadingDownload ? "Downloading..." : "CSV Export"}
              </Button>
              <Button
                onClick={resendReportEmail}
                disabled={isLoadingEmail || !canFetchReport}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-500 hover:to-purple-600 hover:scale-105 transition-all"
              >
                <Mail className="mr-2 h-4 w-4" />
                {isLoadingEmail ? "Sending..." : "Email Report"}
              </Button>
            </div>
          )}
        </div>

        {/* Date Filter Section */}
        <Card className={cn("shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
              <Filter className="h-5 w-5" />
              Date Range Filter
            </CardTitle>
            <CardDescription className="dark:text-gray-400 text-gray-600">Customize your report timeframe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2 w-full">
                <Label htmlFor="startDate" className="dark:text-gray-200 text-gray-800">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={cn("transition-all hover:border-blue-500 focus:border-blue-500 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800")}
                  max={endDate || undefined}
                />
              </div>
              <div className="flex-1 space-y-2 w-full">
                <Label htmlFor="endDate" className="dark:text-gray-200 text-gray-800">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={cn("transition-all hover:border-blue-500 focus:border-blue-500 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-200 border-gray-300 text-gray-800")}
                  min={startDate || undefined}
                />
              </div>
              <Button
                onClick={fetchReport}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-500 hover:to-purple-600 w-full sm:w-auto hover:scale-105 transition-all"
                disabled={isLoadingReport || !canFetchReport}
              >
                {isLoadingReport ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <BarChart3 className="mr-2 h-4 w-4" />
                )}
                Apply Filter
              </Button>
            </div>
            {error && (
              <p className="text-red-500 text-sm mt-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {error}
              </p>
            )}
          </CardContent>
        </Card>

        {reportData ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className={cn(
                "hover:shadow-lg transition-all hover:scale-105 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200 text-gray-800"
              )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium dark:text-gray-200 text-gray-800">Total Tickets</CardTitle>
                  <FileText className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-blue-500">
                    {reportData.total_tickets_sold.toLocaleString()}
                  </div>
                  <div className="flex items-center text-xs text-green-500 mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Tickets sold
                  </div>
                </CardContent>
              </Card>

              <Card className={cn(
                "hover:shadow-lg transition-all hover:scale-105 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200 text-gray-800"
              )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium dark:text-gray-200 text-gray-800">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-green-500">
                    ${reportData.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center text-xs text-green-500 mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Revenue generated
                  </div>
                </CardContent>
              </Card>

              <Card className={cn(
                "hover:shadow-lg transition-all hover:scale-105 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200 text-gray-800"
              )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium dark:text-gray-200 text-gray-800">Attendees</CardTitle>
                  <Users className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-purple-500">
                    {reportData.number_of_attendees.toLocaleString()}
                  </div>
                  <div className="flex items-center text-xs text-green-500 mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {((reportData.number_of_attendees / reportData.total_tickets_sold) * 100).toFixed(1)}% attendance rate
                  </div>
                </CardContent>
              </Card>

              <Card className={cn(
                "hover:shadow-lg transition-all hover:scale-105 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200 text-gray-800"
              )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium dark:text-gray-200 text-gray-800">Avg. Ticket Price</CardTitle>
                  <PieChartIcon className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-red-500">
                    ${(reportData.total_revenue / reportData.total_tickets_sold).toFixed(0)}
                  </div>
                  <div className="flex items-center text-xs text-green-500 mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Average price per ticket
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="tickets">Tickets & Attendees</TabsTrigger>
                <TabsTrigger value="revenue">Revenue & Payments</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Tickets Sold Pie Chart */}
                  <Card className={cn("shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200")}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
                        <PieChartIcon className="h-5 w-5 text-blue-500" />
                        Tickets Distribution
                      </CardTitle>
                      <CardDescription className="dark:text-gray-400 text-gray-600">Breakdown of tickets sold by type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {ticketsSoldChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                          <PieChart>
                            <Pie
                              data={ticketsSoldChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={renderPieLabel}
                              outerRadius={120}
                              fill="#8884d8"
                              dataKey="value"
                              animationBegin={0}
                              animationDuration={1000}
                            >
                              {ticketsSoldChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[350px] flex items-center justify-center dark:text-gray-400 text-gray-500">
                          No ticket sales data available for this period.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Revenue Breakdown */}
                  <Card className={cn("shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200")}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
                            <DollarSign className="h-5 w-5 text-green-500" />
                            Revenue by Type
                          </CardTitle>
                          <CardDescription className="dark:text-gray-400 text-gray-600">Revenue distribution across ticket categories</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant={activeChart === 'bar' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActiveChart('bar')}
                            className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 bg-gray-200 text-gray-800 hover:bg-gray-300"
                          >
                            Bar
                          </Button>
                          <Button
                            variant={activeChart === 'pie' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActiveChart('pie')}
                            className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 bg-gray-200 text-gray-800 hover:bg-gray-300"
                          >
                            Pie
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {revenueChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                          {activeChart === 'pie' ? (
                            <PieChart>
                              <Pie
                                data={revenueChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderPieLabel}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                                animationBegin={0}
                                animationDuration={1000}
                              >
                                {revenueChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                              <Legend />
                            </PieChart>
                          ) : (
                            <BarChart data={revenueChartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip content={<CustomTooltip />} />
                              <Legend />
                              <Bar dataKey="value" fill="#8884d8" />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[350px] flex items-center justify-center dark:text-gray-400 text-gray-500">
                          No revenue data available for this period.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="tickets" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Attendees by Ticket Type */}
                  <Card className={cn("shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200")}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
                        <Users className="h-5 w-5 text-green-500" />
                        Attendees by Ticket Type
                      </CardTitle>
                      <CardDescription className="dark:text-gray-400 text-gray-600">Number of attendees associated with each ticket type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {attendeesByTicketTypeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                          <BarChart data={attendeesByTicketTypeData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[350px] flex items-center justify-center dark:text-gray-400 text-gray-500">
                          No attendee data available by ticket type for this period.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Payment Method Usage */}
                  <Card className={cn("shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200")}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
                        <DollarSign className="h-5 w-5 text-blue-500" />
                        Payment Method Usage
                      </CardTitle>
                      <CardDescription className="dark:text-gray-400 text-gray-600">Breakdown of transactions by payment method</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {paymentMethodChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                          <PieChart>
                            <Pie
                              data={paymentMethodChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={renderPieLabel}
                              outerRadius={120}
                              fill="#8884d8"
                              dataKey="value"
                              animationBegin={0}
                              animationDuration={1000}
                            >
                              {paymentMethodChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[350px] flex items-center justify-center dark:text-gray-400 text-gray-500">
                          No payment method usage data available for this period.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="revenue" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue by Ticket Type */}
                  <Card className={cn("shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200")}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        Revenue by Ticket Type
                      </CardTitle>
                      <CardDescription className="dark:text-gray-400 text-gray-600">Revenue generated from each ticket category</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {revenueChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                          <BarChart data={revenueChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[350px] flex items-center justify-center dark:text-gray-400 text-gray-500">
                          No revenue data available for this period.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Payment Method Usage */}
                  <Card className={cn("shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200")}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
                        <DollarSign className="h-5 w-5 text-blue-500" />
                        Payment Method Usage
                      </CardTitle>
                      <CardDescription className="dark:text-gray-400 text-gray-600">Breakdown of transactions by payment method</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {paymentMethodChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                          <PieChart>
                            <Pie
                              data={paymentMethodChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={renderPieLabel}
                              outerRadius={120}
                              fill="#8884d8"
                              dataKey="value"
                              animationBegin={0}
                              animationDuration={1000}
                            >
                              {paymentMethodChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[350px] flex items-center justify-center dark:text-gray-400 text-gray-500">
                          No payment method usage data available for this period.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Card className={cn("max-w-3xl mx-auto my-8 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white border-gray-200 text-gray-800")}>
            <CardHeader>
              <CardTitle className="dark:text-gray-200 text-gray-800">No Report Data</CardTitle>
              <CardDescription className="dark:text-gray-400 text-gray-600">Please select a date range and click "Apply Filter" to generate the report.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className={cn("text-center h-32 flex items-center justify-center dark:text-gray-400 text-gray-600")}>
                Once you select the dates and apply the filter, the report data and charts will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrganizerReports;