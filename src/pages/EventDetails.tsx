import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, User, CreditCard, Share2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import EventMap from '@/components/EventMap';

interface TicketType {
  id: number;
  name: string;
  price: number;
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
  category?: string;
  organizer: {
    id: number;
    company_name: string;
  };
  latitude?: number;
  longitude?: number;
}

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketType, setTicketType] = useState<string>('');
  const [ticketCount, setTicketCount] = useState(1);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [buyerDetails, setBuyerDetails] = useState({
    name: '',
    email: ''
  });
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

        // Fetch ticket types for this event
        const ticketRes = await fetch(`${import.meta.env.VITE_API_URL}/events/${id}/ticket-types`, {
          credentials: 'include'
        });
        if (!ticketRes.ok) throw new Error('Failed to fetch ticket types');
        const ticketData = await ticketRes.json();
        setTicketTypes(ticketData.ticket_types || []);
        if (ticketData.ticket_types?.length > 0) {
          setTicketType(ticketData.ticket_types[0].id.toString());
        }
      } catch (err) {
        setError('Could not load event or ticket types.');
      } finally {
        setLoading(false);
      }
    };
    fetchEventAndTickets();
  }, [id]);

  const selectedTicketPrice = ticketTypes.find(t => t.id.toString() === ticketType)?.price || 0;
  const total = selectedTicketPrice * ticketCount;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleBuyTickets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tickets`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          ticket_type_id: parseInt(ticketType),
          quantity: ticketCount,
          payment_method: "Paystack",
          buyer_name: buyerDetails.name,
          buyer_email: buyerDetails.email
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
      <main className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Event Details */}
            <div className="lg:col-span-2">
              <div className="rounded-lg overflow-hidden mb-8">
                <img 
                  src={event.image || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'} 
                  alt={event.name} 
                  className="w-full h-auto object-cover"
                />
              </div>
              
              <div className="mb-8">
                {event.category && (
                  <Badge className="mb-4 bg-ticketpurple-600">{event.category}</Badge>
                )}
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.name}</h1>
                
                <div className="flex flex-wrap gap-6 mb-6 text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    <span>By {event.organizer.company_name}</span>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold mb-4">About This Event</h2>
                    <p className="text-gray-600 whitespace-pre-line">{event.description}</p>
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-bold mb-4">Location</h2>
                    <p className="text-gray-600 mb-4">{event.location}</p>
                    <EventMap 
                      location={event.location}
                      latitude={event.latitude}
                      longitude={event.longitude}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ticket Purchase */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-md sticky top-4">
                {isCheckingOut ? (
                  <div>
                    <h2 className="text-xl font-bold mb-6">Complete Your Purchase</h2>
                    <form onSubmit={handleBuyTickets}>
                      <div className="space-y-4 mb-6">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium mb-1">
                            Full Name
                          </label>
                          <Input
                            id="name"
                            type="text"
                            value={buyerDetails.name}
                            onChange={(e) => setBuyerDetails({ ...buyerDetails, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium mb-1">
                            Email
                          </label>
                          <Input
                            id="email"
                            type="email"
                            value={buyerDetails.email}
                            onChange={(e) => setBuyerDetails({ ...buyerDetails, email: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="border-t pt-4 mb-6">
                        <div className="flex justify-between mb-2">
                          <span>Subtotal</span>
                          <span>{formatCurrency(total)}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span>Service Fee</span>
                          <span>{formatCurrency(total * 0.1)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg mt-4">
                          <span>Total</span>
                          <span>{formatCurrency(total * 1.1)}</span>
                        </div>
                      </div>
                      
                      <Button type="submit" className="w-full bg-ticketpurple-600 hover:bg-ticketpurple-700">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay {formatCurrency(total * 1.1)}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full mt-2"
                        onClick={() => setIsCheckingOut(false)}
                      >
                        Back
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-xl font-bold mb-2">Tickets</h2>
                    <p className="text-gray-600 mb-6">Secure your spot now</p>
                    
                    <div className="space-y-4 mb-6">
                      <div>
                        <label htmlFor="ticketType" className="block text-sm font-medium mb-1">
                          Ticket Type
                        </label>
                        <Select value={ticketType} onValueChange={setTicketType}>
                          <SelectTrigger id="ticketType">
                            <SelectValue placeholder="Select ticket type" />
                          </SelectTrigger>
                          <SelectContent>
                            {ticketTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id.toString()}>
                                {type.name} - {formatCurrency(type.price)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label htmlFor="quantity" className="block text-sm font-medium mb-1">
                          Quantity
                        </label>
                        <Select 
                          value={ticketCount.toString()} 
                          onValueChange={(value) => setTicketCount(parseInt(value))}
                        >
                          <SelectTrigger id="quantity">
                            <SelectValue placeholder="Select quantity" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4 mb-6">
                      <div className="flex justify-between mb-2">
                        <span>{ticketTypes.find(t => t.id.toString() === ticketType)?.name} Ticket × {ticketCount}</span>
                        <span>{formatCurrency(selectedTicketPrice * ticketCount)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg mt-4">
                        <span>Subtotal</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-ticketpurple-600 hover:bg-ticketpurple-700"
                      onClick={() => setIsCheckingOut(true)}
                    >
                      Get Tickets
                    </Button>
                    
                    <div className="mt-6 flex gap-4 justify-center">
                      <Button variant="ghost" size="sm" className="text-gray-500">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventDetails;
