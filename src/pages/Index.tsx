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
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Calendar, MapPin } from 'lucide-react';

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

  // Custom animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        duration: 0.6
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-teal-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-white pt-16 transition-all duration-500">
      <Navbar />
      
      <main className="relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-r from-blue-500/10 to-teal-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-48 h-48 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-40 left-1/4 w-32 h-32 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 rounded-full blur-xl"></div>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <HeroSection />
          </motion.div>
          
          {/* Featured Event Section */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm transition-colors duration-300 border-y border-blue-100/50 dark:border-gray-700/50">
            <div className="container mx-auto px-4 py-8 md:py-16">
              <motion.div variants={itemVariants}>
                <div className="text-center mb-6 md:mb-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-teal-500/10 border border-blue-200/30 dark:border-gray-700/50 mb-4">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Spotlight Event</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-blue-300 dark:to-teal-400">
                    Featured Event
                  </h2>
                </div>
              </motion.div>
              
              {isLoading ? (
                <motion.div variants={itemVariants} className="max-w-4xl mx-auto">
                  <div className="relative overflow-hidden rounded-3xl">
                    <Skeleton className="h-64 md:h-[400px] w-full bg-gradient-to-r from-blue-100 to-teal-100 dark:from-gray-700 dark:to-gray-600" />
                    <div className="absolute bottom-6 left-6 space-y-2">
                      <Skeleton className="h-6 w-64 bg-white/30 dark:bg-gray-600/30 backdrop-blur-sm rounded-lg" />
                      <Skeleton className="h-4 w-48 bg-white/30 dark:bg-gray-600/30 backdrop-blur-sm rounded-lg" />
                    </div>
                  </div>
                </motion.div>
              ) : featuredEvent ? (
                <motion.div variants={itemVariants}>
                  <div className="relative max-w-4xl mx-auto">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-teal-500/20 rounded-3xl blur-xl -z-10"></div>
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
                </motion.div>
              ) : (
                <motion.div variants={itemVariants} className="text-center py-16">
                  <div className="relative inline-block">
                    <div className="text-6xl mb-4 animate-bounce">🎭</div>
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-teal-500/20 rounded-full blur-xl -z-10"></div>
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent mb-2">
                    No Featured Events
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Check back soon for exciting upcoming events!
                  </p>
                </motion.div>
              )}
            </div>
          </div>
          
          {/* Events Section */}
          <div className="bg-gradient-to-b from-gray-50/50 to-gray-100/30 dark:from-gray-900/50 dark:to-gray-900 transition-colors duration-300">
            <div className="container mx-auto px-4 py-8 md:py-12">
              <motion.div variants={itemVariants} className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200/30 dark:border-gray-700/50 mb-4">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Popular Events</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent dark:from-emerald-400 dark:via-teal-400 dark:to-blue-400">
                  Recent Events
                </h2>
              </motion.div>
              
              {isLoading ? (
                <motion.div variants={itemVariants}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {[...Array(8)].map((_, index) => (
                      <div key={index} className="group">
                        <div className="relative overflow-hidden rounded-3xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/50">
                          <Skeleton className="h-48 md:h-[200px] w-full bg-gradient-to-br from-blue-100 via-teal-100 to-emerald-100 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" />
                          <div className="p-4 space-y-2">
                            <Skeleton className="h-4 w-3/4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded" />
                            <Skeleton className="h-3 w-1/2 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div variants={itemVariants}>
                  <EventsSection 
                    events={getRecentEvents()} 
                    onLike={handleLike}
                    showPastEvents={true}
                    showTabs={false}
                    showSearch={false}
                  />
                </motion.div>
              )}
            </div>
          </div>
          
          {/* Digital Tickets Section */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm transition-colors duration-300 border-y border-teal-100/50 dark:border-gray-700/50">
            <div className="container mx-auto px-4 py-8 md:py-16">
              <div className="max-w-4xl mx-auto">
                <motion.div variants={itemVariants} className="text-center mb-6 md:mb-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-500/10 to-blue-500/10 border border-teal-200/30 dark:border-gray-700/50 mb-4">
                    <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span className="text-sm font-medium text-teal-700 dark:text-teal-300">Digital Experience</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4 bg-gradient-to-r from-teal-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent dark:from-teal-400 dark:via-blue-400 dark:to-emerald-400">
                    Digital Tickets, Real Experiences
                  </h2>
                  <p className="text-base md:text-xl text-gray-600 dark:text-gray-300">
                    Our tickets come to life with animations and secure QR codes for easy scanning at venues
                  </p>
                </motion.div>
                
                <motion.div variants={itemVariants} className="relative">
                  {/* Glow effect for ticket preview */}
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 via-blue-500/20 to-emerald-500/20 rounded-3xl blur-2xl -z-10"></div>
                  <TicketPreview
                    eventName="Summer Music Festival"
                    date="Sat, Jun 15, 2025"
                    time="2:00 PM - 11:00 PM"
                    location="Central Park, New York"
                    ticketHolder="John Doe"
                    ticketType="VIP Pass"
                    ticketId="PULSE2025X7891"
                  />
                </motion.div>
              </div>
            </div>
          </div>
          
          <motion.div variants={itemVariants}>
            <CTASection />
          </motion.div>
        </motion.div>
      </main>
      
      <Footer />
      
      {/* Enhanced Custom Animation Styles */}
      <style>{`
        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.1);
          }
          50% {
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.2);
          }
        }
        
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradientShift 8s ease infinite;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 4s ease-in-out infinite;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(107, 114, 128, 0.1);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #3b82f6, #10b981);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #2563eb, #059669);
        }
        
        /* Smooth transitions for theme changes */
        * {
          transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 200ms;
        }
      `}</style>
    </div>
  );
};

export default Index;