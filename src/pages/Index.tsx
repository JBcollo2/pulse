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
        // Fetch more events for the homepage with better pagination
        const response = await fetch(`${import.meta.env.VITE_API_URL}/events?per_page=15&time_filter=all`, {
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
          // First check for explicitly featured events
          const featuredUpcoming = upcomingEvents.filter((event: Event) => event.featured);
          
          if (featuredUpcoming.length > 0) {
            // Use the featured event with most likes
            const bestFeatured = featuredUpcoming.reduce(
              (prev: Event, current: Event) => (current.likes_count > prev.likes_count) ? current : prev,
              featuredUpcoming[0]
            );
            setFeaturedEvent(bestFeatured);
          } else {
            // Use the upcoming event with most likes
            const mostLikedUpcoming = upcomingEvents.reduce(
              (prev: Event, current: Event) => (current.likes_count > prev.likes_count) ? current : prev,
              upcomingEvents[0]
            );
            setFeaturedEvent(mostLikedUpcoming);
          }
        } else if (data.events.length > 0) {
          // If no upcoming events, use the most recent past event
          const sortedByDate = [...data.events].sort(
            (a: Event, b: Event) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setFeaturedEvent(sortedByDate[0]);
        } else {
          setFeaturedEvent(null);
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
  }, [toast]);

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

  // Function to get recent events for homepage display (limit to 8)
  const getRecentEvents = () => {
    const upcomingEvents = events.filter(event => new Date(event.date) >= currentDate);
    const pastEvents = events.filter(event => new Date(event.date) < currentDate);
    
    // Show upcoming events first, then recent past events
    const sortedUpcoming = upcomingEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const sortedPast = pastEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return [...sortedUpcoming, ...sortedPast].slice(0, 8);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white pt-16 transition-colors duration-300">
      <Navbar />
      
      <main>
        <div className="animate-fadeIn">
          <HeroSection />
        </div>
        
        {/* Featured Event Section */}
        <div className="bg-white dark:bg-gray-800 transition-colors duration-300">
          <div className="container mx-auto px-4 py-8 md:py-16">
            <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-10 text-center text-gray-900 dark:text-white">
                Featured Event
              </h2>
            </div>
            
            {isLoading ? (
              <div className="max-w-4xl mx-auto animate-pulse">
                <Skeleton className="h-64 md:h-[400px] w-full rounded-lg mb-4 bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700" />
                  <Skeleton className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700" />
                  <Skeleton className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            ) : featuredEvent ? (
              <div className="animate-slideUp" style={{ animationDelay: '0.4s' }}>
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
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎭</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  No Featured Events
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Check back soon for exciting upcoming events!
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Events Section */}
        <div className="bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-8">
              <div className="animate-slideUp" style={{ animationDelay: '0.6s' }}>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Recent Events
                </h2>
              </div>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="space-y-3 animate-pulse" style={{ animationDelay: `${index * 0.1}s` }}>
                    <Skeleton className="h-48 md:h-[200px] w-full rounded-lg bg-gray-200 dark:bg-gray-700" />
                    <Skeleton className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700" />
                    <Skeleton className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="animate-slideUp" style={{ animationDelay: '0.8s' }}>
                <EventsSection 
                  events={getRecentEvents()} 
                  onLike={handleLike}
                  showPastEvents={true}
                  showTabs={false}
                  showSearch={false}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Digital Tickets Section */}
        <div className="bg-white dark:bg-gray-800 transition-colors duration-300">
          <div className="container mx-auto px-4 py-8 md:py-16">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6 md:mb-10 animate-slideUp" style={{ animationDelay: '1s' }}>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4 text-gray-900 dark:text-white">
                  Digital Tickets, Real Experiences
                </h2>
                <p className="text-base md:text-xl text-gray-600 dark:text-gray-300">
                  Our tickets come to life with animations and secure QR codes for easy scanning at venues
                </p>
              </div>
              
              <div className="animate-slideUp" style={{ animationDelay: '1.2s' }}>
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
          </div>
        </div>
        
        <div className="animate-slideUp" style={{ animationDelay: '1.4s' }}>
          <CTASection />
        </div>
      </main>
      
      <Footer />
      
      {/* Custom Animation Styles */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(30px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.8s ease-out forwards;
          }
          
          .animate-slideUp {
            opacity: 0;
            animation: slideUp 0.6s ease-out forwards;
          }
          
          .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};

export default Index;