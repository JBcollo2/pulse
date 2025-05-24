// frontend/pulse/src/pages/organizer/OrganizerReports.tsx

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

// Import the EventReport interface from OrganizerDashboard for type consistency.
// This ensures the report data structure is understood across components.
import { EventReport } from './OrganizerDashboard'; // Adjust path if necessary

// Define the props interface for the OrganizerReports component.
// This component expects specific data and state flags from its parent.
interface OrganizerReportsProps {
    isLoading: boolean; // Indicates if the report data is currently being fetched.
    error: string | null; // Stores any error message if data fetching fails.
    eventReport: EventReport | null; // The actual report data for the event, can be null if not loaded or an error occurred.
}

// Define a set of appealing colors for the pie chart slices and bar chart bars.
// These provide visual distinction for different data categories.
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#A4DE6C', '#D0ED57', '#FFC658'];

const OrganizerReports: React.FC<OrganizerReportsProps> = ({
    isLoading,
    error,
    eventReport
}) => {

    /**
     * Helper function to transform backend graph data format ({ labels: [], data: [] })
     * into the array of objects format ([{ name: '...', value: ... }]) expected by Recharts.
     * This makes the data directly consumable by the charting library.
     * @param labels An array of strings representing data labels (e.g., ticket type names).
     * @param data An array of numbers representing the corresponding values (e.g., counts, revenue).
     * @returns An array of objects formatted for Recharts, or an empty array if input is invalid.
     */
    const transformGraphData = (labels: string[] | undefined, data: number[] | undefined) => {
        // Ensure both labels and data arrays exist and have matching lengths to prevent errors.
        if (!labels || !data || labels.length !== data.length) {
            return []; // Return empty array if data is missing or mismatched.
        }
        // Map over the labels to create objects with 'name' and 'value' properties.
        return labels.map((label, index) => ({
            name: label,          // The label for the data point (e.g., ticket type name).
            value: data[index]    // The numerical value for the data point (e.g., count, revenue).
        }));
    };

    // Prepare data for each chart by transforming the raw data from `eventReport`.
    // We use optional chaining (`?.`) to safely access nested properties, returning an empty array
    // for chart data if `eventReport` or its specific graph data property is null/undefined.
    const ticketsSoldData = eventReport ? transformGraphData(eventReport.tickets_sold_by_type_for_graph?.labels, eventReport.tickets_sold_by_type_for_graph?.data) : [];
    const attendeesData = eventReport ? transformGraphData(eventReport.attendees_by_ticket_type_for_graph?.labels, eventReport.attendees_by_ticket_type_for_graph?.data) : [];
    const revenueData = eventReport ? transformGraphData(eventReport.revenue_by_ticket_type_for_graph?.labels, eventReport.revenue_by_ticket_type_for_graph?.data) : [];
    const paymentMethodData = eventReport ? transformGraphData(eventReport.payment_method_usage_for_graph?.labels, eventReport.payment_method_usage_for_graph?.data) : [];

    // --- Conditional Rendering based on component state (Loading, Error, No Data) ---

    // 1. **Loading State:** Display a loading indicator when data is being fetched.
    if (isLoading) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Event Report</CardTitle>
                        <CardDescription>Fetching report data...</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Simple loading animation placeholder */}
                        <div className="flex items-center justify-center h-48 animate-pulse text-muted-foreground">
                            <p>Loading event report data...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // 2. **Error State:** Display an error message if data fetching fails.
    if (error) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Event Report</CardTitle>
                        <CardDescription>Error loading report.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-red-500 font-semibold">Error: {error}</p>
                        <p className="text-muted-foreground mt-2">Please try refreshing the page or selecting another event.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // 3. **No Data State:** Display a message if no report data is available after loading and without errors.
    // This could happen if the event has no sales or scans yet, or if the backend returns empty data.
    if (!eventReport) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Event Report</CardTitle>
                        <CardDescription>No report data available.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Could not retrieve report data for this event, or the event has no sales or scan data yet.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // --- Main Report Content (if data is successfully loaded) ---
    // If we reach this point, `eventReport` is guaranteed to be an `EventReport` object.
    return (
        <div className="space-y-6">
            {/* The main title like "Report for [Event Name]" and the "Back" button
                are handled in the parent component (OrganizerDashboard) where this component is rendered. */}

            {/* Summary Card: Displays key numerical metrics at the top of the report */}
            <Card>
                <CardHeader>
                    <CardTitle>Event Summary</CardTitle>
                    <CardDescription>Key performance indicators for your event.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <strong>Total Tickets Sold:</strong> {eventReport.total_tickets_sold}
                    </div>
                    <div>
                        <strong>Number of Attendees:</strong> {eventReport.number_of_attendees}
                    </div>
                    <div>
                        {/* Format revenue as currency, providing '0.00' if total_revenue is null/undefined */}
                        <strong>Total Revenue:</strong> ${eventReport.total_revenue?.toFixed(2) || '0.00'}
                    </div>
                    {/* Display event date and location from the report data */}
                    {eventReport.event_date && (
                        <div><strong>Event Date:</strong> {eventReport.event_date}</div>
                    )}
                    {eventReport.event_location && (
                        <div><strong>Location:</strong> {eventReport.event_location}</div>
                    )}
                </CardContent>
            </Card>

            {/* Graphical Reports Section: Displays charts for visual insights */}
            <div className="grid gap-6 md:grid-cols-2">

                {/* Tickets Sold by Type Bar Chart */}
                <Card>
                    <CardHeader><CardTitle>Tickets Sold by Type</CardTitle></CardHeader>
                    <CardContent>
                        {/* ResponsiveContainer ensures the chart scales appropriately */}
                        <div className="h-64 md:h-72 lg:h-80"> {/* Define a fixed height for chart consistency */}
                            <ResponsiveContainer width="100%" height="100%">
                                {/* Render BarChart only if `ticketsSoldData` has entries */}
                                {ticketsSoldData.length > 0 ? (
                                    <BarChart data={ticketsSoldData}>
                                        <CartesianGrid strokeDasharray="3 3" /> {/* Dashed grid lines for background */}
                                        <XAxis
                                            dataKey="name"
                                            interval={0} // Show all labels
                                            angle={-30} // Angle labels to prevent overlap
                                            textAnchor="end" // Anchor text at the end for angled labels
                                            height={60} // Provide enough height for angled labels
                                        />
                                        <YAxis /> {/* Y-axis for the count */}
                                        <Tooltip formatter={(value: number) => [`${value} tickets`, 'Count']} /> {/* Custom tooltip for clarity */}
                                        <Legend /> {/* Legend for the bar series */}
                                        <Bar dataKey="value" name="Tickets Sold" fill={COLORS[0]} /> {/* Use 'value' for bar height */}
                                    </BarChart>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">No ticket sales data available for chart.</div>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Revenue by Ticket Type Pie Chart */}
                <Card>
                    <CardHeader><CardTitle>Revenue by Ticket Type</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-64 md:h-72 lg:h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                {revenueData.length > 0 ? (
                                    <PieChart>
                                        <Pie
                                            data={revenueData}
                                            cx="50%" // Center X-coordinate of the pie chart
                                            cy="50%" // Center Y-coordinate of the pie chart
                                            labelLine={false} // Hide lines connecting slices to labels
                                            outerRadius="80%" // Outer radius of the pie slices (relative to container)
                                            dataKey="value" // Specifies which key in data stores the slice value
                                            nameKey="name" // Specifies which key in data stores the slice name for tooltips/labels
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} // Label format (e.g., "General (50%)")
                                        >
                                            {/* Map over data to apply distinct colors to each slice */}
                                            {revenueData.map((entry, index) => (
                                                <Cell key={`cell-revenue-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        {/* Tooltip formatted to show value as currency */}
                                        <Tooltip formatter={(value: number, name: string) => [`$${value?.toFixed(2) || '0.00'}`, name]} />
                                        <Legend /> {/* Legend matching slice colors to names */}
                                    </PieChart>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">No revenue data available for chart.</div>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Attendees by Ticket Type Bar Chart */}
                <Card>
                    <CardHeader><CardTitle>Attendees by Ticket Type</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-64 md:h-72 lg:h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                {attendeesData.length > 0 ? (
                                    <BarChart data={attendeesData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={60} />
                                        <YAxis />
                                        <Tooltip formatter={(value: number) => [`${value} attendees`, 'Count']} />
                                        <Legend />
                                        <Bar dataKey="value" name="Attendees" fill={COLORS[1]} /> {/* Using a different color for distinction */}
                                    </BarChart>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">No attendee data available for chart.</div>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Method Usage Pie Chart */}
                <Card>
                    <CardHeader><CardTitle>Payment Method Usage</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-64 md:h-72 lg:h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                {paymentMethodData.length > 0 ? (
                                    <PieChart>
                                        <Pie
                                            data={paymentMethodData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius="80%"
                                            dataKey="value"
                                            nameKey="name"
                                            label={({ name, value }) => `${name} (${value})`} // Show name and count (e.g., "Credit Card (120)")
                                        >
                                            {paymentMethodData.map((entry, index) => (
                                                <Cell key={`cell-payment-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => [`${value} transactions`, 'Count']} />
                                        <Legend />
                                    </PieChart>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">No payment data available for chart.</div>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Lists Section: Displays data in text format, complementing the charts */}
            <Card>
                <CardHeader><CardTitle>Detailed Breakdown</CardTitle></CardHeader>
                <CardContent className="space-y-6 text-sm">
                    {/* Tickets Sold by Type List */}
                    <div>
                        <h4 className="font-semibold mb-2 text-lg">Tickets Sold by Type:</h4>
                        {/* Check if the object exists and has entries before mapping */}
                        {eventReport.tickets_sold_by_type && Object.entries(eventReport.tickets_sold_by_type).length > 0 ? (
                            <ul className="list-disc pl-5 space-y-1">
                                {Object.entries(eventReport.tickets_sold_by_type).map(([type, count]) => (
                                    <li key={type}>{type}: <span className="font-medium">{count} tickets</span></li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground">No detailed ticket sales data.</p>
                        )}
                    </div>

                    {/* Revenue by Ticket Type List */}
                    <div>
                        <h4 className="font-semibold mb-2 text-lg">Revenue by Ticket Type:</h4>
                        {eventReport.revenue_by_ticket_type && Object.entries(eventReport.revenue_by_ticket_type).length > 0 ? (
                            <ul className="list-disc pl-5 space-y-1">
                                {Object.entries(eventReport.revenue_by_ticket_type).map(([type, revenue]) => (
                                    <li key={type}>{type}: <span className="font-medium">${revenue?.toFixed(2) || '0.00'}</span></li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground">No detailed revenue data.</p>
                        )}
                    </div>

                    {/* Attendees by Ticket Type List */}
                    <div>
                        <h4 className="font-semibold mb-2 text-lg">Attendees by Ticket Type:</h4>
                        {eventReport.attendees_by_ticket_type && Object.entries(eventReport.attendees_by_ticket_type).length > 0 ? (
                            <ul className="list-disc pl-5 space-y-1">
                                {Object.entries(eventReport.attendees_by_ticket_type).map(([type, count]) => (
                                    <li key={type}>{type}: <span className="font-medium">{count} attendees</span></li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground">No detailed attendee data.</p>
                        )}
                    </div>

                    {/* Payment Method Usage List */}
                    <div>
                        <h4 className="font-semibold mb-2 text-lg">Payment Method Usage:</h4>
                        {eventReport.payment_method_usage && Object.entries(eventReport.payment_method_usage).length > 0 ? (
                            <ul className="list-disc pl-5 space-y-1">
                                {Object.entries(eventReport.payment_method_usage).map(([method, count]) => (
                                    <li key={method}>{method}: <span className="font-medium">{count} transactions</span></li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground">No detailed payment method data.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Note: A button to download a PDF report would typically trigger a backend endpoint
                that generates and emails/serves the PDF. The current backend implementation
                sends the PDF via email when the report is fetched. */}

        </div>
    );
};

export default OrganizerReports;