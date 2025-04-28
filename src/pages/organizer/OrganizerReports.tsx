import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Assuming useToast is available globally or not needed in this display component
// import { useToast } from "@/components/ui/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'; // Added Legend
// Assuming Badge is available globally or not needed in this display component
// import { Badge } from "@/components/ui/badge";

// Import the EventReport interface defined in OrganizerDashboard
// This interface describes the structure of the report data received from the backend.
import { EventReport } from './OrganizerDashboard';

// Define props for this component
// This component receives the report data and state from OrganizerDashboard
interface OrganizerReportsProps {
  isLoading: boolean; // Indicates if the data is currently loading
  error: string | null; // Stores any error message during fetching
  eventReport: EventReport | null; // The actual report data for the event
}

// Define colors for the pie chart slices
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#a4de6c', '#d0ed57', '#ffc658']; // More colors for charts

const OrganizerReports: React.FC<OrganizerReportsProps> = ({
  isLoading,
  error,
  eventReport
}) => {

  // Helper function to transform backend graph data format { labels: [], data: [] }
  // into the array of objects format [{ name: '...', value: ... }] expected by recharts
  const transformGraphData = (labels: string[] | undefined, data: number[] | undefined) => {
    // Ensure labels and data arrays exist and have the same length
    if (!labels || !data || labels.length !== data.length) {
      return []; // Return empty array if data is missing or mismatched
    }
    return labels.map((label, index) => ({
      name: label,       // The label for the data point (e.g., ticket type name)
      value: data[index] // The numerical value for the data point (e.g., count, revenue)
    }));
  };

  // Prepare data for charts by transforming the format from the eventReport data
  // Use optional chaining (?.) in case eventReport or its properties are null/undefined
  const ticketsSoldData = eventReport ? transformGraphData(eventReport.tickets_sold_by_type_for_graph?.labels, eventReport.tickets_sold_by_type_for_graph?.data) : [];
  const attendeesData = eventReport ? transformGraphData(eventReport.attendees_by_ticket_type_for_graph?.labels, eventReport.attendees_by_ticket_type_for_graph?.data) : [];
  const revenueData = eventReport ? transformGraphData(eventReport.revenue_by_ticket_type_for_graph?.labels, eventReport.revenue_by_ticket_type_for_graph?.data) : [];
  const paymentMethodData = eventReport ? transformGraphData(eventReport.payment_method_usage_for_graph?.labels, eventReport.payment_method_usage_for_graph?.data) : [];


  // Render different content based on the loading and error states
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Report</CardTitle>
            <CardDescription>Loading report data...</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Simple loading animation placeholder */}
            <div className="space-y-4">
              {[...Array(4)].map((_, index) => ( // Show a few loading placeholders
                <div key={index} className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Report</CardTitle>
            <CardDescription>Error loading report.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If not loading and no error, check if report data is actually available
  // (e.g., if the backend returned 404 or empty data for the report)
  if (!eventReport) {
     return (
        <div className="space-y-6">
           <Card>
               <CardHeader>
                   <CardTitle>Event Report</CardTitle>
                   <CardDescription>No report data available.</CardDescription>
               </CardHeader>
               <CardContent>
                   <p>Could not load report data for this event, or the event has no sales/scan data yet.</p> {/* More informative message */}
               </CardContent>
           </Card>
       </div>
     );
  }

  // If data is available, display the report content
  return (
    <div className="space-y-6">
        {/* Note: The main title like "Report for [Event Name]" and the "Back" button
             are handled in the parent component (OrganizerDashboard) where this component is rendered. */}

       {/* Summary Card: Displays key numerical metrics */}
       <Card>
           <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
           <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div><strong>Total Tickets Sold:</strong> {eventReport.total_tickets_sold}</div>
               <div><strong>Number of Attendees:</strong> {eventReport.number_of_attendees}</div>
               {/* Format revenue as currency, handling potential null/undefined */}
               <div><strong>Total Revenue:</strong> ${eventReport.total_revenue?.toFixed(2) || '0.00'}</div>
           </CardContent>
       </Card>

       {/* Graphical Reports Section: Displays charts */}
       <div className="grid gap-4 md:grid-cols-2">

           {/* Tickets Sold by Type Bar Chart */}
           <Card>
               <CardHeader><CardTitle>Tickets Sold by Type</CardTitle></CardHeader>
               <CardContent>
                   {/* Responsive container ensures the chart scales with its parent */}
                   <div className="h-[300px]"> {/* Define a height for the chart container */}
                       <ResponsiveContainer width="100%" height="100%">
                           {/* Render BarChart only if data exists */}
                           {ticketsSoldData.length > 0 ? (
                               <BarChart data={ticketsSoldData}>
                                   <CartesianGrid strokeDasharray="3 3" /> {/* Dashed grid lines */}
                                   <XAxis dataKey="name" /> {/* Use 'name' from the transformed data for the x-axis */}
                                   <YAxis /> {/* Y-axis for the count */}
                                   <Tooltip /> {/* Shows data details on hover */}
                                   <Legend /> {/* Legend for the bar */}
                                   <Bar dataKey="value" name="Tickets Sold" fill="#8884d8" /> {/* Use 'value' for the bar data */}
                               </BarChart>
                           ) : (
                               <div className="text-center text-muted-foreground">No ticket sales data available for chart.</div>
                           )}
                       </ResponsiveContainer>
                   </div>
               </CardContent>
           </Card>

           {/* Revenue by Ticket Type Pie Chart */}
           <Card>
               <CardHeader><CardTitle>Revenue by Ticket Type</CardTitle></CardHeader>
               <CardContent>
                   <div className="h-[300px]">
                       <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                             {/* Render Pie only if data exists */}
                             {revenueData.length > 0 ? (
                               <Pie
                                 data={revenueData}
                                 cx="50%" // Center x-coordinate
                                 cy="50%" // Center y-coordinate
                                 labelLine={false} // Hide lines connecting slices to labels
                                 outerRadius={80} // Outer radius of the pie
                                 fill="#8884d8" // Default fill color (cells will override)
                                 dataKey="value" // Use 'value' for slice size
                                 nameKey="name" // Use 'name' for tooltip and legend
                                 label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} // Label format
                               >
                                 {/* Map over data to apply specific colors to each slice */}
                                 {revenueData.map((entry, index) => (
                                   <Cell key={`cell-revenue-${index}`} fill={COLORS[index % COLORS.length]} />
                                 ))}
                               </Pie>
                             ) : (
                               <div className="text-center text-muted-foreground">No revenue data available for chart.</div>
                             )}
                               {/* Tooltip formatted to show value as currency */}
                               <Tooltip formatter={(value: number, name: string) => [`$${value?.toFixed(2) || '0.00'}`, name]} />
                               <Legend /> {/* Legend matching slice colors to names */}
                           </PieChart>
                       </ResponsiveContainer>
                   </div>
               </CardContent>
           </Card>

           {/* Attendees by Ticket Type Bar Chart (Uncommented) */}
            <Card>
               <CardHeader><CardTitle>Attendees by Ticket Type</CardTitle></CardHeader>
               <CardContent>
                   <div className="h-[300px]">
                       <ResponsiveContainer width="100%" height="100%">
                           {attendeesData.length > 0 ? (
                               <BarChart data={attendeesData}>
                                   <CartesianGrid strokeDasharray="3 3" />
                                   <XAxis dataKey="name" />
                                   <YAxis />
                                   <Tooltip />
                                   <Legend />
                                   <Bar dataKey="value" name="Attendees" fill="#00C49F" /> {/* Different color */}
                               </BarChart>
                           ) : (
                                <div className="text-center text-muted-foreground">No attendee data available for chart.</div>
                           )}
                       </ResponsiveContainer>
                   </div>
               </CardContent>
           </Card>

           {/* Payment Method Usage Pie Chart (Uncommented) */}
            <Card>
               <CardHeader><CardTitle>Payment Method Usage</CardTitle></CardHeader>
               <CardContent>
                   <div className="h-[300px]">
                       <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              {paymentMethodData.length > 0 ? (
                               <Pie
                                 data={paymentMethodData}
                                 cx="50%"
                                 cy="50%"
                                 labelLine={false}
                                 outerRadius={80}
                                 fill="#FFBB28"
                                 dataKey="value"
                                 nameKey="name"
                                 label={({ name, value }) => `${name} (${value})`} // Show name and count
                               >
                                 {paymentMethodData.map((entry, index) => (
                                   <Cell key={`cell-payment-${index}`} fill={COLORS[index % COLORS.length]} />
                                 ))}
                               </Pie>
                               ) : (
                                 <div className="text-center text-muted-foreground">No payment data available for chart.</div>
                               )}
                               <Tooltip />
                               <Legend />
                           </PieChart>
                       </ResponsiveContainer>
                   </div>
               </CardContent>
           </Card>

       </div>

       {/* Detailed Lists (Uncommented) */}
       {/* These lists show the data in text format, complementing the charts */}
       <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <h4 className="font-semibold mb-2">Tickets Sold by Type:</h4>
                    {/* Check if the object exists and has entries */}
                    {eventReport.tickets_sold_by_type && Object.entries(eventReport.tickets_sold_by_type).length > 0 ? (
                        <ul>
                           {Object.entries(eventReport.tickets_sold_by_type).map(([type, count]) => (
                               <li key={type}>{type}: {count}</li>
                           ))}
                       </ul>
                    ) : (
                         <p className="text-muted-foreground">No data.</p>
                    )}
                 </div>
                 {/* Revenue by type list */}
                 <div>
                    <h4 className="font-semibold mb-2">Revenue by Ticket Type:</h4>
                     {eventReport.revenue_by_ticket_type && Object.entries(eventReport.revenue_by_ticket_type).length > 0 ? (
                        <ul>
                           {Object.entries(eventReport.revenue_by_ticket_type).map(([type, revenue]) => (
                               <li key={type}>{type}: ${revenue?.toFixed(2) || '0.00'}</li>
                           ))}
                       </ul>
                     ) : (
                          <p className="text-muted-foreground">No data.</p>
                     )}
                 </div>
                 {/* Attendees by type list */}
                 <div>
                    <h4 className="font-semibold mb-2">Attendees by Ticket Type:</h4>
                     {eventReport.attendees_by_ticket_type && Object.entries(eventReport.attendees_by_ticket_type).length > 0 ? (
                        <ul>
                           {Object.entries(eventReport.attendees_by_ticket_type).map(([type, count]) => (
                               <li key={type}>{type}: {count}</li>
                           ))}
                       </ul>
                     ) : (
                          <p className="text-muted-foreground">No data.</p>
                     )}
                 </div>
                  {/* Payment Method Usage list */}
                 <div>
                    <h4 className="font-semibold mb-2">Payment Method Usage:</h4>
                     {eventReport.payment_method_usage && Object.entries(eventReport.payment_method_usage).length > 0 ? (
                        <ul>
                           {Object.entries(eventReport.payment_method_usage).map(([method, count]) => (
                               <li key={method}>{method}: {count}</li>
                           ))}
                       </ul>
                     ) : (
                          <p className="text-muted-foreground">No data.</p>
                     )}
                 </div>
            </CardContent>
       </Card>

        {/* Button to download PDF report (left commented as functionality is backend triggered) */}
        {/* <Button className="mt-4">Download PDF Report</Button> */}
        {/* Note: Your backend sends the PDF via email when the report is fetched.
            A separate endpoint/logic might be needed for direct download. */}

    </div>
  );
};

export default OrganizerReports;