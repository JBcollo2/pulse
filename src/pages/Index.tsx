import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import EventsSection from '@/components/EventsSection';
import FeaturedEvent from '@/components/FeaturedEvent';
import CTASection from '@/components/CTASection';
import TicketPreview from '@/components/TicketPreview';
import Footer from '@/components/Footer';
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

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
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Get current date for filtering upcoming events
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/events?per_page=12`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        console.log('Fetched events data:', data);
        
        if (!data.events || !Array.isArray(data.events)) {
          console.error('Invalid events data structure:', data);
          setEvents([]);
          setFeaturedEvent(null);
          return;
        }
        
        setEvents(data.events);
        
        // Find featured event - prioritize upcoming events with most likes
        const upcomingEvents = data.events.filter(
          (event: Event) => new Date(event.date) >= currentDate
        );
        
        if (upcomingEvents.length > 0) {
          const mostLikedUpcoming = upcomingEvents.reduce(
            (prev: Event, current: Event) => (current.likes_count > prev.likes_count) ? current : prev,
            upcomingEvents[0]
          );
          setFeaturedEvent(mostLikedUpcoming);
        } else {
          // If no upcoming events, use the most recent past event
          const sortedByDate = [...data.events].sort(
            (a: Event, b: Event) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setFeaturedEvent(sortedByDate[0] || null);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        toast({
          title: "Error",
          description: "Failed to fetch events",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
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

  // Handler for search submissions from the hero section
  const handleHeroSearch = (query: string) => {
    navigate(`/events?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Navbar />
      
      <main>
        <HeroSection onSearch={handleHeroSearch} />
        
        <div className="container mx-auto px-4 py-8 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-10 text-center">Featured Event</h2>
          {isLoading ? (
            <div className="max-w-4xl mx-auto">
              <Skeleton className="h-64 md:h-[400px] w-full rounded-lg mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          ) : featuredEvent && (
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
              isPast={new Date(featuredEvent.date) < currentDate}
            />
          )}
        </div>
        
        {isLoading ? (
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="space-y-3">
                  <Skeleton className="h-48 md:h-[200px] w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EventsSection 
            events={events.filter(event => new Date(event.date) >= currentDate)} 
            onLike={handleLike}
            showPastEvents={true}
          />
        )}
        
        <div className="container mx-auto px-4 py-8 md:py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6 md:mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4">Digital Tickets, Real Experiences</h2>
              <p className="text-base md:text-xl text-muted-foreground">
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