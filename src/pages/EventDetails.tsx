import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface TicketType {
  id: number;
  name: string;
  price: string;
  quantity?: number;
}

interface Event {
  id: number;
  name: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string | null;
  location: string;
  image: string | null;
  price?: string;
  category?: string;
}

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEventAndTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch event details
        const eventRes = await fetch(`${import.meta.env.VITE_API_URL}/events/${id}`, {
          credentials: 'include'
        });
        if (!eventRes.ok) throw new Error('Failed to fetch event');
        const eventData = await eventRes.json();
        setEvent(eventData);

        // Fetch ticket types for this event (updated endpoint)
        const ticketRes = await fetch(`${import.meta.env.VITE_API_URL}/events/${id}/ticket-types`, {
          credentials: 'include'
        });
        if (!ticketRes.ok) throw new Error('Failed to fetch ticket types');
        const ticketData = await ticketRes.json();
        setTicketTypes(ticketData.ticket_types || []);
      } catch (err) {
        setError('Could not load event or ticket types.');
      } finally {
        setLoading(false);
      }
    };
    fetchEventAndTickets();
  }, [id]);

  const handlePayWithPaystack = async (ticketTypeId: number) => {
    if (!event) return;

    try {
      const quantity = 1; // You can let user select quantity if needed

      const response = await fetch(`${import.meta.env.VITE_API_URL}/tickets`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          ticket_type_id: ticketTypeId,
          quantity,
          payment_method: "Paystack"
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.authorization_url) {
        toast({
          title: "Error",
          description: data.error || "Failed to initialize payment.",
          variant: "destructive"
        });
        return;
      }

      window.location.href = data.authorization_url;
    } catch (err) {
      toast({
        title: "Error",
        description: "Could not start payment.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span>Loading event details...</span>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error || "Event not found."}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="relative">
            <img 
              src={event.image || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'} 
              alt={event.name} 
              className="w-full h-[400px] object-cover rounded-lg shadow-lg"
            />
            {event.category && (
              <Badge 
                className="absolute top-4 left-4 bg-pulse-purple hover:bg-pulse-purple text-white" 
                variant="secondary"
              >
                {event.category}
              </Badge>
            )}
          </div>
          <Card className="p-6">
            <h1 className="text-4xl font-bold mb-4 text-gradient">{event.name}</h1>
            <div className="space-y-4 mb-6">
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-5 w-5 mr-3" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Clock className="h-5 w-5 mr-3" />
                <span>{event.start_time}{event.end_time ? ` - ${event.end_time}` : ''}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-5 w-5 mr-3" />
                <span>{event.location}</span>
              </div>
            </div>
            <CardContent className="p-0">
              <p className="text-muted-foreground mb-6">{event.description}</p>
              <div>
                <p className="text-lg font-semibold mb-2">Available Ticket Types:</p>
                {ticketTypes.length === 0 && (
                  <p className="text-muted-foreground">No ticket types available for this event.</p>
                )}
                <div className="space-y-4">
                  {ticketTypes.map((type) => (
                    <div key={type.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div>
                        <div className="font-bold">{type.name}</div>
                        <div className="text-muted-foreground">Price: <span className="font-semibold">{type.price}</span></div>
                        {typeof type.quantity === 'number' && (
                          <div className="text-xs text-muted-foreground">Available: {type.quantity}</div>
                        )}
                      </div>
                      <Button
                        className="bg-pulse-purple hover:bg-pulse-deep-purple"
                        onClick={() => handlePayWithPaystack(type.id)}
                      >
                        Pay with Paystack
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventDetails;
