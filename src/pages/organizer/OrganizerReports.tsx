import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';

// Define specific colors for each ticket type
const COLORS_BY_TICKET = {
  REGULAR: '#FF8042',     // Orange
  VIP: '#FFBB28',         // Yellow
  STUDENT: '#0088FE',     // Blue
  GROUP_OF_5: '#00C49F',  // Green
  COUPLES: '#FF6699',     // Pinkish
  EARLY_BIRD: '#AA336A',  // Purple
  VVIP: '#00FF00',        // Bright Green for VVIP
  GIVEAWAY: '#CCCCCC',    // Grey
  UNKNOWN_TYPE: '#A9A9A9', // Darker Grey for unknown types
};

// Fallback color if a ticket type is not in COLORS_BY_TICKET
const FALLBACK_COLOR = COLORS_BY_TICKET.UNKNOWN_TYPE;

// Define the props interface for the OrganizerReports component.
interface OrganizerReportsProps {
    isLoading: boolean; // Indicates if the report data is currently being fetched.
    error: string | null; // Stores any error message if data fetching fails.
    eventReport: EventReport | null; // The actual report data for the event, can be null if not loaded or an error occurred.
}

// Define the EventReport interface for type consistency.
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
    tickets_sold_by_type_for_graph: { labels: string[], data: number[] };
    attendees_by_ticket_type_for_graph: { labels: string[], data: number[] };
    revenue_by_ticket_type_for_graph: { labels: string[], data: number[] };
    payment_method_usage_for_graph: { labels: string[], data: number[] };
}

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
    return (
        <div className="space-y-6">
            {/* Summary Card: Displays key numerical metrics at the top of the report */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Tickets Sold</CardTitle>
                        <CardDescription>Number of tickets sold</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{eventReport.total_tickets_sold}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Total Revenue</CardTitle>
                        <CardDescription>Total revenue from all events</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${eventReport.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Number of Attendees</CardTitle>
                        <CardDescription>Number of attendees</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{eventReport.number_of_attendees}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Graphical Reports Section: Displays charts for visual insights */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Tickets Sold by Type Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tickets Sold by Type</CardTitle>
                        <CardDescription>Number of tickets sold by type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                {ticketsSoldData.length > 0 ? (
                                    <BarChart
                                        data={ticketsSoldData}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                        <XAxis
                                            dataKey="name"
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                            interval={0}
                                            style={{ fontSize: '12px' }}
                                            tick={{ fill: '#aaa', fontSize: 12 }}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tick={{ fill: '#aaa', fontSize: 12 }}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "#1a1a2e", border: 'none', borderRadius: "8px", fontSize: '14px', padding: '8px' }}
                                            formatter={(value: number) => [`${value} tickets`, 'Count']}
                                            labelFormatter={(label) => `Ticket Type: ${label}`}
                                        />
                                        <Bar
                                            dataKey="value"
                                            fill="#8884d8"
                                            radius={[10, 10, 0, 0]}
                                            animationDuration={1500}
                                        >
                                            <LabelList dataKey="value" position="top" fill="#fff" fontSize={12} />
                                        </Bar>
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
                    <CardHeader>
                        <CardTitle>Revenue by Ticket Type</CardTitle>
                        <CardDescription>Revenue distribution across ticket types</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex flex-col items-center justify-center">
                            {revenueData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", fontSize: '14px', padding: '8px' }}
                                            formatter={(value: number, name: string, entry: any) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, entry.payload.name]}
                                        />
                                        <Pie
                                            data={revenueData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={3}
                                            animationDuration={1500}
                                            labelLine={true}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {revenueData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS_BY_TICKET[entry.name.toUpperCase()] || FALLBACK_COLOR}
                                                />
                                            ))}
                                        </Pie>
                                        <Legend
                                            layout="horizontal"
                                            align="center"
                                            verticalAlign="bottom"
                                            wrapperStyle={{ paddingTop: '10px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">No revenue data by ticket type available for chart.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Attendees by Ticket Type Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Attendees by Ticket Type</CardTitle>
                        <CardDescription>Number of attendees by ticket type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                {attendeesData.length > 0 ? (
                                    <BarChart
                                        data={attendeesData}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                        <XAxis
                                            dataKey="name"
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                            interval={0}
                                            style={{ fontSize: '12px' }}
                                            tick={{ fill: '#aaa', fontSize: 12 }}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tick={{ fill: '#aaa', fontSize: 12 }}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "#1a1a2e", border: 'none', borderRadius: "8px", fontSize: '14px', padding: '8px' }}
                                            formatter={(value: number) => [`${value} attendees`, 'Count']}
                                            labelFormatter={(label) => `Ticket Type: ${label}`}
                                        />
                                        <Bar
                                            dataKey="value"
                                            fill="#8884d8"
                                            radius={[10, 10, 0, 0]}
                                            animationDuration={1500}
                                        >
                                            <LabelList dataKey="value" position="top" fill="#fff" fontSize={12} />
                                        </Bar>
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
                    <CardHeader>
                        <CardTitle>Payment Method Usage</CardTitle>
                        <CardDescription>Payment method usage distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex flex-col items-center justify-center">
                            {paymentMethodData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", fontSize: '14px', padding: '8px' }}
                                            formatter={(value: number) => [`${value} transactions`, 'Count']}
                                        />
                                        <Pie
                                            data={paymentMethodData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={3}
                                            animationDuration={1500}
                                            labelLine={true}
                                            label={({ name, value }) => `${name} (${value})`}
                                        >
                                            {paymentMethodData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS_BY_TICKET[entry.name.toUpperCase()] || FALLBACK_COLOR}
                                                />
                                            ))}
                                        </Pie>
                                        <Legend
                                            layout="horizontal"
                                            align="center"
                                            verticalAlign="bottom"
                                            wrapperStyle={{ paddingTop: '10px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">No payment data available for chart.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Lists Section: Displays data in text format, complementing the charts */}
            <Card>
                <CardHeader>
                    <CardTitle>Detailed Breakdown</CardTitle>
                    <CardDescription>Detailed breakdown of event data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-sm">
                    {/* Tickets Sold by Type List */}
                    <div>
                        <h4 className="font-semibold mb-2 text-lg">Tickets Sold by Type:</h4>
                        {eventReport.tickets_sold_by_type && Object.entries(eventReport.tickets_sold_by_type).length > 0 ? (
                            <ul className="list-disc pl-5 space-y-1">
                                {Object.entries(eventReport.tickets_sold_by_type).map(([type, count]) => (
                                    <li key={type}>
                                        <Badge variant="outline">{type}</Badge>: <span className="font-medium">{count} tickets</span>
                                    </li>
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
                                    <li key={type}>
                                        <Badge variant="outline">{type}</Badge>: <span className="font-medium">${revenue?.toFixed(2) || '0.00'}</span>
                                    </li>
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
                                    <li key={type}>
                                        <Badge variant="outline">{type}</Badge>: <span className="font-medium">{count} attendees</span>
                                    </li>
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
                                    <li key={method}>
                                        <Badge variant="outline">{method}</Badge>: <span className="font-medium">{count} transactions</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground">No detailed payment method data.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default OrganizerReports;
