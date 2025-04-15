
import React from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, Ticket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const EventDetails = () => {
  const { id } = useParams();
  
  // For now using mock data - will be replaced with API call later
  const event = {
    id: '1',
    title: 'Summer Music Festival',
    date: 'Sat, Jun 15, 2025',
    time: '2:00 PM',
    location: 'Central Park, New York',
    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    price: '$49.99',
    category: 'Music',
    description: 'Join us for an unforgettable day of music featuring top artists from around the world. Experience amazing performances, great food, and create lasting memories.',
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="relative">
            <img 
              src={event.image} 
              alt={event.title} 
              className="w-full h-[400px] object-cover rounded-lg shadow-lg"
            />
            <Badge 
              className="absolute top-4 left-4 bg-pulse-purple hover:bg-pulse-purple text-white" 
              variant="secondary"
            >
              {event.category}
            </Badge>
          </div>
          
          <Card className="p-6">
            <h1 className="text-4xl font-bold mb-4 text-gradient">{event.title}</h1>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-5 w-5 mr-3" />
                <span>{event.date}</span>
              </div>
              
              <div className="flex items-center text-muted-foreground">
                <Clock className="h-5 w-5 mr-3" />
                <span>{event.time}</span>
              </div>
              
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-5 w-5 mr-3" />
                <span>{event.location}</span>
              </div>
            </div>
            
            <CardContent className="p-0">
              <p className="text-muted-foreground mb-6">{event.description}</p>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Price starts from</p>
                  <p className="text-2xl font-bold text-pulse-purple">{event.price}</p>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-pulse-purple hover:bg-pulse-deep-purple" size="lg">
                      <Ticket className="mr-2 h-5 w-5" />
                      Buy Tickets
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Purchase Tickets</DialogTitle>
                    </DialogHeader>
                    <div className="p-6">
                      <p className="text-muted-foreground mb-4">
                        Ticket purchasing will be implemented with Supabase integration.
                      </p>
                      <Button className="w-full bg-pulse-purple hover:bg-pulse-deep-purple">
                        Continue to Purchase
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
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
