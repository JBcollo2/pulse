import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import EventsSection from '@/components/EventsSection';
import FeaturedEvent from '@/components/FeaturedEvent';
import CTASection from '@/components/CTASection';
import TicketPreview from '@/components/TicketPreview';
import Footer from '@/components/Footer';
import { useToast } from "@/components/ui/use-toast";

interface Event {
  id: number;
  name: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string | null;
  location: string;
  image: string | null;
  organizer_id: number;
  featured: boolean;
  likes_count: number;
  organizer: {
    id: number;
    company_name: string;
    company_description: string;
  };
}

const Index = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/events`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        setEvents(data);
        
        // Find the most liked event as featured
        const mostLikedEvent = data.reduce((prev: Event, current: Event) => 
          (prev.likes_count > current.likes_count) ? prev : current
        );
        setFeaturedEvent(mostLikedEvent);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast({
          title: "Error",
          description: "Failed to fetch events",
          variant: "destructive"
        });
      }
    };

    fetchEvents();
  }, []);

  const handleLike = async (eventId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${eventId}/like`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to like event');
      }

      // Update the events list with new like count
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { ...event, likes_count: event.likes_count + 1 }
            : event
        )
      );

      // Update featured event if needed
      if (featuredEvent && featuredEvent.id === eventId) {
        setFeaturedEvent(prev => prev ? { ...prev, likes_count: prev.likes_count + 1 } : null);
      }

      toast({
        title: "Success",
        description: "Event liked successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error liking event:', error);
      toast({
        title: "Error",
        description: "Failed to like event",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Navbar />
      
      <main>
        <HeroSection />
        
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold mb-10 text-center">Featured Event</h2>
          {featuredEvent && (
            <FeaturedEvent
              id={featuredEvent.id.toString()}
              title={featuredEvent.name}
              description={featuredEvent.description}
              date={new Date(featuredEvent.date).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
              time={`${featuredEvent.start_time} - ${featuredEvent.end_time || 'Till Late'}`}
              location={featuredEvent.location}
              image={featuredEvent.image || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'}
              price="Starting from $129.99"
              onLike={() => handleLike(featuredEvent.id)}
              likesCount={featuredEvent.likes_count}
            />
          )}
        </div>
        
        <EventsSection events={events} onLike={handleLike} />
        
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4">Digital Tickets, Real Experiences</h2>
              <p className="text-xl text-muted-foreground">
                Our tickets come to life with animations and secure QR codes for easy scanning at venues
              </p>
            </div>
            
            <TicketPreview
              eventName="Summer Music Festival"
              date="Sat, Jun 15, 2025"
              time="2:00 PM - 11:00 PM"
              location="Central Park, New York"
              ticketHolder="John Doe"
              ticketType="VIP Pass"
              ticketId="PULSE2025X7891"
            />
          </div>
        </div>
        
        <CTASection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
