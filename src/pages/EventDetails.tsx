import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, User, CreditCard, Share2, Phone } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import EventMap from '@/components/EventMap';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface TicketType {
  id: number;
  type_name: string;  // Changed from 'name' to 'type_name'
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
  const [buyButtonDisabled, setBuyButtonDisabled] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [buyerDetails, setBuyerDetails] = useState({
    name: '',
    email: '',
    phone_number: '' // Added phone number for M-Pesa
  });
  const { toast } = useToast();

  // Debugging helper for inspecting API URLs
  const logAPIUrl = (url: string) => {
    console.log(`API URL: ${url}`);
    // Also log any environment variables being used
    console.log(`VITE_API_URL: ${import.meta.env.VITE_API_URL}`);
  };
  useEffect(() => {
    const fetchEventAndTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching event details for ID:", id);

        // Fetch event details
        const eventRes = await fetch(`${import.meta.env.VITE_API_URL}/events/${id}`, {
          credentials: 'include'
        });

        console.log("Event API response status:", eventRes.status);

        if (!eventRes.ok) {
          const errorText = await eventRes.text();
          console.error("Event API error:", errorText);
          throw new Error(`Failed to fetch event: ${errorText}`);
        }

        const eventData = await eventRes.json();
        console.log("Event data received:", eventData);
        setEvent(eventData);

        // Fetch ticket types for this event
        console.log("Fetching ticket types for event ID:", id);

        // Log the exact URL being called
          const ticketTypesUrl = `${import.meta.env.VITE_API_URL}/events/${id}/ticket-types`;
        console.log("Ticket types URL:", ticketTypesUrl);
          const ticketRes = await fetch(ticketTypesUrl, {
            credentials: 'include'
          });

        console.log("Ticket types API response status:", ticketRes.status);

          if (!ticketRes.ok) {
          const errorText = await ticketRes.text();
          console.error("Ticket types API error:", errorText);
          throw new Error(`Failed to fetch ticket types: ${errorText}`);
        }
            const ticketData = await ticketRes.json();
        console.log("Ticket types data received:", ticketData);

        // Check the structure of the response
        if (!ticketData.ticket_types && Array.isArray(ticketData)) {
          // If the response is an array directly
          console.log("Ticket data is an array, not an object with ticket_types property");
          setTicketTypes(ticketData);
          if (ticketData.length > 0) {
            setTicketType(ticketData[0].id.toString());
          }
      } else {
          // Handle the expected structure
          setTicketTypes(ticketData.ticket_types || []);
          if (ticketData.ticket_types?.length > 0) {
            setTicketType(ticketData.ticket_types[0].id.toString());
      }
        }
    } catch (err) {
        console.error("Error fetching event data:", err);
        setError('Could not load event or ticket types. ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndTickets();
  }, [id]);

  // Also fetch user profile to pre-fill buyer details
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          setBuyerDetails({
            name: userData.full_name || '',
            email: userData.email || '',
            phone_number: userData.phone_number || ''
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
  };

    fetchUserProfile();
  }, []);

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

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    // Show payment method selection dialog
    setShowPaymentDialog(true);
    
    // Disable the buy button for 20 seconds
    setBuyButtonDisabled(true);
    setTimeout(() => {
      setBuyButtonDisabled(false);
    }, 20000);
  };

  const handlePaymentMethodSelect = async (method: string) => {
    setShowPaymentDialog(false);
    
    if (!event) return;

    try {
      console.log("Purchasing ticket with payment method:", method);
      
      const ticketData = {
        event_id: event.id,
        ticket_type_id: parseInt(ticketType),
        quantity: ticketCount,
        payment_method: method,
        buyer_name: buyerDetails.name,
        buyer_email: buyerDetails.email,
        phone_number: buyerDetails.phone_number
      };
      
      console.log("Ticket purchase data:", ticketData);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tickets`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Payment error response:", errorData);
        throw new Error(errorData.error || "Payment initialization failed");
      }

      const data = await response.json();
      console.log("Payment response:", data);
      
      if (method === "Paystack" && data.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = data.authorization_url;
      } else if (method === "Mpesa") {
        // For M-Pesa, show a message to check phone
        toast({
          title: "M-Pesa Payment Initiated",
          description: "Please check your phone for STK push notification and complete the payment",
          duration: 10000,
        });
      } else {
        toast({
          title: "Payment Initiated",
          description: "Your payment is being processed",
        });
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Could not start payment.",
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
                
                <div className="flex flex-wrap gap-6 mb-6 text-muted-foreground">
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
                    <p className="text-muted-foreground whitespace-pre-line">{event.description}</p>
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-bold mb-4">Location</h2>
                    <p className="text-muted-foreground mb-4">{event.location}</p>
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
              <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md sticky top-4 border border-border">
                {isCheckingOut ? (
                  <div>
                    <h2 className="text-xl font-bold mb-6">Complete Your Purchase</h2>
                    <form onSubmit={handleProceedToPayment}>
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
                            className="bg-background"
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
                            className="bg-background"
                          />
                        </div>
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium mb-1">
                            Phone Number (for M-Pesa)
                          </label>
                          <Input
                            id="phone"
                            type="tel"
                            value={buyerDetails.phone_number}
                            onChange={(e) => setBuyerDetails({ ...buyerDetails, phone_number: e.target.value })}
                            required
                            className="bg-background"
                          /> 
                        </div>
                      </div>
                      
                      <div className="border-t border-border pt-4 mb-6">
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

                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        disabled={buyButtonDisabled}
                      >
                        {buyButtonDisabled ? (
                          <>Processing...</>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Proceed to Payment
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full mt-2 border-border"
                        onClick={() => setIsCheckingOut(false)}
                      >
                        Back
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-xl font-bold mb-2">Tickets</h2>
                    <p className="text-muted-foreground mb-6">Secure your spot now</p>
                    
                    {ticketTypes.length > 0 ? (
                      <>
                        <div className="space-y-4 mb-6">
                          <div>
                            <label htmlFor="ticketType" className="block text-sm font-medium mb-1">
                              Ticket Type
                            </label>
                            <Select value={ticketType} onValueChange={setTicketType}>
                              <SelectTrigger id="ticketType" className="bg-background">
                                <SelectValue placeholder="Select ticket type" />
                          </SelectTrigger>
                          <SelectContent>
                                {ticketTypes.map((type) => (
                                  <SelectItem key={type.id} value={type.id.toString()}>
                                    <span className="font-medium">{type.type_name}</span> - {formatCurrency(type.price)}
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
                              <SelectTrigger id="quantity" className="bg-background">
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

                        <div className="border-t border-border pt-4 mb-6">
                          <div className="flex justify-between mb-2">
                            <span>
                              {ticketTypes.find(t => t.id.toString() === ticketType)?.type_name} × {ticketCount}
                            </span>
                            <span>{formatCurrency(selectedTicketPrice * ticketCount)}</span>
              </div>
                          <div className="flex justify-between font-bold text-lg mt-4">
                            <span>Subtotal</span>
                            <span>{formatCurrency(total)}</span>
          </div>
                      </div>
                        <Button
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                          onClick={() => setIsCheckingOut(true)}
            >
                          Get Tickets
            </Button>
                      </>
                    ) : (
                      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 my-4 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-600">
                        <p className="font-bold">No tickets available</p>
                        <p>There are currently no tickets available for this event.</p>
            <Button
                          variant="outline"
                          className="mt-4 w-full border-yellow-500 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-600 dark:text-yellow-200 dark:hover:bg-yellow-900/50"
                          onClick={() => {
                            window.location.reload();
                          }}
            >
                          Refresh
            </Button>
          </div>
                    )}
          
                    <div className="mt-6 flex gap-4 justify-center">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
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
      
      {/* Payment Method Selection Dialog */}
      <AlertDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <AlertDialogContent className="bg-card text-card-foreground border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Select Payment Method</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Choose your preferred payment method to complete your purchase.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="grid grid-cols-2 gap-4 my-4">
            <Button
              onClick={() => handlePaymentMethodSelect("Mpesa")}
              className="flex flex-col h-28 bg-green-600 hover:bg-green-700 text-white"
            >
              <Phone className="h-6 w-6 mb-2" />
              <span className="font-bold text-base">M-Pesa</span>
              <span className="text-xs mt-1">Pay with mobile money</span>
            </Button>
            
            <Button
              onClick={() => handlePaymentMethodSelect("Paystack")}
              className="flex flex-col h-28 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CreditCard className="h-6 w-6 mb-2" />
              <span className="font-bold text-base">Paystack</span>
              <span className="text-xs mt-1">Pay with card</span>
            </Button>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border bg-background hover:bg-accent hover:text-accent-foreground">
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Footer />
    </div>
  );
};

export default EventDetails;