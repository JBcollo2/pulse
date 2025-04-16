import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Ticket {
  id: number;
  event_id: number;
  ticket_type_id: number;
  quantity: number;
  total_price: number;
  payment_status: string;
  scanned: boolean;
  purchase_date: string;
}

const Tickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/tickets`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch tickets');
        }
        
        const data = await response.json();
        setTickets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const handleRefund = async (ticketId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to process refund');
      }

      // Update local state
      setTickets(tickets.filter(ticket => ticket.id !== ticketId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tickets</h1>
        <div className="flex gap-4">
          <Input placeholder="Search tickets..." className="w-64" />
          <Button>Export</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Sales Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>{ticket.id}</TableCell>
                  <TableCell>{ticket.event_id}</TableCell>
                  <TableCell>{ticket.quantity}</TableCell>
                  <TableCell>${ticket.total_price}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      ticket.payment_status === 'PAID' ? 'bg-green-100 text-green-800' :
                      ticket.payment_status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {ticket.payment_status}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(ticket.purchase_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRefund(ticket.id)}
                      disabled={ticket.payment_status !== 'PAID'}
                    >
                      Refund
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Tickets; 