import React, { useEffect, useState, useCallback } from 'react';
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
import { Sparkles, TrendingUp, Calendar, MapPin, Clock, Users, Star, Ticket } from 'lucide-react';
import { Button } from "@/components/ui/button";

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

interface LowestPriceTicket {
  id: number;
  type_name: string;
  price: number;
  currency: string;
  currency_symbol: string;
  remaining_quantity: number;
}

const Index = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null);
  const [featuredEventTicket, setFeaturedEventTicket] = useState<LowestPriceTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);
  const { toast } = useToast();

  // Get current date for filtering upcoming events
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  // Fetch lowest price ticket for featured event
  const fetchFeaturedEventTicket = useCallback(async (eventId: number) => {
    if (!eventId) return;
    
    setIsLoadingTicket(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ticket-types/lowest-price/${eventId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Featured Event Ticket API Response:', data);
        setFeaturedEventTicket(data.lowest_price_ticket);
      } else {
        console.error('Failed to fetch ticket data for featured event:', response.status);
      }
    } catch (error) {
      console.error('Error fetching lowest price ticket for featured event:', error);
    } finally {
      setIsLoadingTicket(false);
    }
  }, []);

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

  // Fetch ticket data when featured event changes
  useEffect(() => {
    if (featuredEvent) {
      fetchFeaturedEventTicket(featuredEvent.id);
    }
  }, [featuredEvent, fetchFeaturedEventTicket]);

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

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time function
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Check if event is past
  const isEventPast = (eventDate: string) => {
    return new Date(eventDate) < currentDate;
  };

  // Handle hero search
  const handleHeroSearch = (query: string) => {
    navigate(`/events?search=${encodeURIComponent(query)}`);
  };

  // Handle get tickets navigation - FIXED
  const handleGetTickets = (eventId: number) => {
    // Navigate to the events page with eventId parameter (same as working old version)
    navigate(`/events?eventId=${eventId}`);
  };

  // Custom animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.4
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 overflow-hidden transition-all duration-300">
      {/* Background Pattern - matching AdminDashboard */}
      <div className="absolute inset-0 z-0 opacity-10 dark:opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }}></div>
      
      <div className="relative z-10">
        <Navbar />
        
        <main className="relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-0"
          >
            <motion.div variants={itemVariants}>
              <HeroSection onSearch={handleHeroSearch} />
            </motion.div>
            
            {/* Enhanced Featured Event Section */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
                <motion.div variants={itemVariants}>
                  <div className="text-center mb-8 md:mb-12">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 text-white mb-4 shadow-lg shadow-blue-500/25">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm font-medium">Spotlight Event</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent mb-2">
                      Featured Event
                    </h2>
                    <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                      Don't miss out on this incredible experience
                    </p>
                  </div>
                </motion.div>
                
                {isLoading ? (
                  <motion.div variants={itemVariants} className="max-w-6xl mx-auto">
                    <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl">
                      <Skeleton className="h-[300px] sm:h-[400px] lg:h-[500px] xl:h-[600px] w-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700" />
                      <div className="absolute bottom-4 left-4 space-y-2">
                        <Skeleton className="h-6 w-60 bg-white/30 dark:bg-gray-600/30 backdrop-blur-sm rounded-lg" />
                        <Skeleton className="h-4 w-48 bg-white/30 dark:bg-gray-600/30 backdrop-blur-sm rounded-lg" />
                        <Skeleton className="h-4 w-36 bg-white/30 dark:bg-gray-600/30 backdrop-blur-sm rounded-lg" />
                      </div>
                    </div>
                  </motion.div>
                ) : featuredEvent ? (
                  <motion.div variants={itemVariants}>
                    <div className="relative max-w-6xl mx-auto">
                      {/* Featured Event Card */}
                      <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-500 group">
                        {/* Event Image */}
                        <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] xl:h-[600px] overflow-hidden">
                          <img 
                            src={featuredEvent.image || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'} 
                            alt={featuredEvent.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          
                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent"></div>
                          
                          {/* Content Overlay */}
                          <div className="absolute inset-0 p-4 sm:p-6 lg:p-8 flex flex-col justify-end">
                            <div className="max-w-full">
                              {/* Event Status Badge */}
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                {isEventPast(featuredEvent.date) ? (
                                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-300/30 backdrop-blur-sm">
                                    <span className="text-xs font-medium text-orange-200">Past Event</span>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-300/30 backdrop-blur-sm">
                                    <span className="text-xs font-medium text-green-200">Upcoming</span>
                                  </div>
                                )}
                                
                                {featuredEvent.featured && (
                                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 border border-blue-300/30 backdrop-blur-sm">
                                    <Star className="w-3 h-3 text-blue-200" />
                                    <span className="text-xs font-medium text-blue-200">Featured</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Event Title */}
                              <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-2 sm:mb-3 lg:mb-4 leading-tight">
                                {featuredEvent.name}
                              </h3>
                              
                              {/* Event Description */}
                              <p className="text-sm sm:text-base lg:text-lg text-gray-200 mb-4 sm:mb-6 max-w-2xl leading-relaxed line-clamp-2 sm:line-clamp-3">
                                {featuredEvent.description}
                              </p>
                              
                              {/* Event Meta Info Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                                <div className="flex items-center gap-2 text-gray-200 bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1.5 sm:px-3 sm:py-2">
                                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs text-gray-300 hidden sm:block">Date</p>
                                    <p className="text-xs sm:text-sm font-semibold truncate">
                                      {formatDate(featuredEvent.date)}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 text-gray-200 bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1.5 sm:px-3 sm:py-2">
                                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs text-gray-300 hidden sm:block">Time</p>
                                    <p className="text-xs sm:text-sm font-semibold truncate">
                                      {formatTime(featuredEvent.start_time)}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 text-gray-200 bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 col-span-2 sm:col-span-1">
                                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs text-gray-300 hidden sm:block">Location</p>
                                    <p className="text-xs sm:text-sm font-semibold truncate">
                                      {featuredEvent.location}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Action Buttons - FIXED NAVIGATION */}
                              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <Button
                                  onClick={() => handleGetTickets(featuredEvent.id)}
                                  disabled={featuredEventTicket?.remaining_quantity === 0}
                                  className="flex-1 sm:flex-none bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm sm:text-base"
                                >
                                  <Ticket className="w-4 h-4 mr-2" />
                                  {featuredEventTicket?.remaining_quantity === 0 ? 'Sold Out' : 'Get Tickets'}
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  onClick={() => handleLike(featuredEvent.id)}
                                  className="bg-white/10 hover:bg-white/20 text-white font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl border border-white/20 backdrop-blur-sm hover:border-white/30 transition-all duration-300 text-sm sm:text-base flex items-center justify-center gap-2"
                                >
                                  <span className="text-red-400">♥</span>
                                  <span>{featuredEvent.likes_count}</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Price Badge - More responsive positioning */}
                          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 lg:top-6 lg:right-6">
                            <div className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-2 bg-green-500/90 backdrop-blur-sm rounded-lg lg:rounded-xl border border-green-400/30 shadow-lg">
                              {isLoadingTicket ? (
                                <p className="text-white font-bold text-xs sm:text-sm lg:text-base">Loading...</p>
                              ) : featuredEventTicket ? (
                                <div className="text-center">
                                  <p className="text-white font-bold text-xs sm:text-sm lg:text-base">
                                    From {featuredEventTicket.currency_symbol || 'KSh'}{featuredEventTicket.price.toLocaleString()}
                                  </p>
                                  {featuredEventTicket.remaining_quantity <= 10 && featuredEventTicket.remaining_quantity > 0 && (
                                    <p className="text-green-200 text-xs">
                                      {featuredEventTicket.remaining_quantity} left!
                                    </p>
                                  )}
                                  {featuredEventTicket.remaining_quantity === 0 && (
                                    <p className="text-red-200 text-xs">Sold Out</p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-white font-bold text-xs sm:text-sm lg:text-base">From KSh 1,299</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div variants={itemVariants} className="text-center py-16 lg:py-24">
                    <div className="relative inline-block">
                      <div className="text-6xl lg:text-7xl mb-4 animate-bounce">🎭</div>
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-3">
                      No Featured Events
                    </h3>
                    <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400">
                      Check back soon for exciting upcoming events!
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
            
            {/* Events Section */}
            <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <div className="container mx-auto px-4 py-8 md:py-12">
                <motion.div variants={itemVariants} className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 text-white mb-4 shadow-lg shadow-blue-500/25">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">Popular Events</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                    Recent Events
                  </h2>
                </motion.div>
                
                {isLoading ? (
                  <motion.div variants={itemVariants}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                      {[...Array(8)].map((_, index) => (
                        <div key={index} className="group">
                          <div className="relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                            <Skeleton className="h-48 md:h-[200px] w-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700" />
                            <div className="p-4 space-y-2">
                              <Skeleton className="h-4 w-3/4 bg-gray-300 dark:bg-gray-600 rounded" />
                              <Skeleton className="h-3 w-1/2 bg-gray-300 dark:bg-gray-600 rounded" />
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
            
            {/* Digital Experience Section */}
            <div className="relative bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300 overflow-hidden">
              {/* Decorative Background Elements */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-500/10 to-green-500/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-20 right-20 w-48 h-48 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
              </div>
              
              <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20 relative z-10">
                <motion.div variants={itemVariants} className="text-center mb-12 md:mb-16">
                  <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 text-white mb-4 shadow-lg shadow-blue-500/25">
                    <div className="w-4 h-4 bg-white/20 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Next-Gen Technology</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                    The Future of Event Tickets
                  </h2>
                  <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
                    Experience cutting-edge digital tickets powered by AI, blockchain security, and immersive technology
                  </p>
                </motion.div>
                
                {/* Feature Grid */}
                <motion.div variants={itemVariants} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12 lg:mb-16">
                  <div className="group">
                    <div className="relative p-4 sm:p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-400/50 dark:hover:border-blue-400/50 transition-all duration-500 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:rotate-12 transition-transform duration-500 shadow-lg shadow-blue-500/25">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Blockchain Security</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Military-grade encryption with immutable blockchain verification prevents fraud</p>
                    </div>
                  </div>
                  
                  <div className="group">
                    <div className="relative p-4 sm:p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-green-400/50 dark:hover:border-green-400/50 transition-all duration-500 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:rotate-12 transition-transform duration-500 shadow-lg shadow-green-500/25">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">AR Experience</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Interactive augmented reality previews let you explore venues before events</p>
                    </div>
                  </div>
                  
                  <div className="group">
                    <div className="relative p-4 sm:p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-400/50 dark:hover:border-purple-400/50 transition-all duration-500 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:rotate-12 transition-transform duration-500 shadow-lg shadow-purple-500/25">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Instant Transfer</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Lightning-fast ticket transfers with smart contracts and automated verification</p>
                    </div>
                  </div>
                </motion.div>
                
                {/* Interactive Ticket Demo */}
                <motion.div variants={itemVariants} className="relative max-w-5xl mx-auto">
                  <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left Side - Features */}
                    <div className="space-y-6 order-2 lg:order-1">
                      <div>
                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">Revolutionary Digital Tickets</h3>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-400/50 dark:hover:border-blue-400/50 transition-all duration-300">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 animate-pulse flex-shrink-0"></div>
                            <div>
                              <h4 className="text-gray-800 dark:text-gray-200 font-semibold mb-1 text-sm sm:text-base">Animated QR Codes</h4>
                              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Dynamic, impossible-to-counterfeit QR codes with real-time validation</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-green-400/50 dark:hover:border-green-400/50 transition-all duration-300">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 animate-pulse delay-500 flex-shrink-0"></div>
                            <div>
                              <h4 className="text-gray-800 dark:text-gray-200 font-semibold mb-1 text-sm sm:text-base">Smart Notifications</h4>
                              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">AI-powered alerts for travel, weather, and event updates</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-400/50 dark:hover:border-purple-400/50 transition-all duration-300">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 animate-pulse delay-1000 flex-shrink-0"></div>
                            <div>
                              <h4 className="text-gray-800 dark:text-gray-200 font-semibold mb-1 text-sm sm:text-base">Contactless Entry</h4>
                              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">NFC and biometric scanning for seamless venue access</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 hover:scale-105">
                          Try Demo
                        </Button>
                        <Button 
                          variant="outline"
                          className="border-2 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold px-6 py-3 rounded-xl transition-all duration-300"
                        >
                          Learn More
                        </Button>
                      </div>
                    </div>
                    
                    {/* Right Side - 3D Ticket Preview */}
                    <div className="relative order-1 lg:order-2">
                      <div className="relative transform hover:scale-105 transition-transform duration-700 max-w-sm mx-auto">
                        {/* Ticket Card */}
                        <div className="relative w-full bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-900 dark:to-black rounded-2xl p-4 sm:p-6 shadow-2xl border border-gray-700/50 dark:border-gray-600/50 hover:shadow-blue-500/20 transition-all duration-500">
                          {/* Holographic Effect */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-green-400/10 to-purple-400/10 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                          
                          {/* Ticket Header */}
                          <div className="relative z-10 mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs text-gray-400 uppercase tracking-wider">Digital Ticket</div>
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg animate-pulse shadow-lg shadow-blue-500/25"></div>
                            </div>
                            <h4 className="text-white font-bold text-base sm:text-lg mb-1">Summer Music Festival 2025</h4>
                            <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-300">
                              <span>📅 Jun 15, 2025</span>
                              <span>🕐 8:00 PM</span>
                            </div>
                          </div>
                          
                          {/* Animated QR Code Area */}
                          <div className="relative mb-4">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-lg p-2 mx-auto relative overflow-hidden">
                              <div className="w-full h-full bg-gradient-to-br from-gray-900 via-blue-900 to-green-900 rounded animate-pulse"></div>
                              {/* Scanning line animation */}
                              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/50 to-transparent animate-scan"></div>
                            </div>
                            <p className="text-center text-xs text-gray-400 mt-2">Tap to scan</p>
                          </div>
                          
                          {/* Ticket Details */}
                          <div className="text-center space-y-1">
                            <p className="text-white font-semibold text-sm sm:text-base">John Doe</p>
                            <p className="text-green-400 text-xs sm:text-sm">VIP Experience</p>
                            <p className="text-gray-400 text-xs">ID: PULSE2025X7891</p>
                          </div>
                          
                          {/* Status Indicator */}
                          <div className="absolute top-2 right-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Floating Tech Elements */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full animate-float shadow-lg shadow-blue-500/25"></div>
                      <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-br from-green-500 to-green-600 rounded-full animate-bounce delay-1000 shadow-lg shadow-green-500/25"></div>
                      <div className="absolute top-1/2 -right-4 w-3 h-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full animate-pulse delay-2000 shadow-lg shadow-purple-500/25"></div>
                    </div>
                  </div>
                </motion.div>
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
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-8px);
            }
          }
          
          @keyframes scan {
            0% {
              transform: translateY(-100%);
            }
            100% {
              transform: translateY(100%);
            }
          }
          
          .animate-float {
            animation: float 4s ease-in-out infinite;
          }
          
          .animate-scan {
            animation: scan 2s ease-in-out infinite;
          }
          
          /* Line clamp utilities */
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          /* Smooth transitions for theme changes */
          * {
            transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
            transition-duration: 200ms;
          }
          
          /* Custom scrollbar matching navbar style */
          ::-webkit-scrollbar {
            width: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: rgba(156, 163, 175, 0.1);
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: linear-gradient(45deg, #3b82f6, #10b981);
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(45deg, #2563eb, #059669);
          }
          
          /* Ensure proper spacing with navbar */
          body {
            transition: padding-left 0.3s ease-in-out, padding-top 0.3s ease-in-out;
          }
          
          /* Mobile responsive adjustments */
          @media (max-width: 640px) {
            .container {
              padding-left: 1rem;
              padding-right: 1rem;
            }
          }
          
          /* Enhanced hover effects */
          .group:hover .group-hover\\:rotate-12 {
            transform: rotate(12deg);
          }
          
          /* Backdrop blur fallback */
          .backdrop-blur-sm {
            backdrop-filter: blur(4px);
          }
          
          @supports not (backdrop-filter: blur(4px)) {
            .backdrop-blur-sm {
              background-color: rgba(255, 255, 255, 0.8);
            }
            
            .dark .backdrop-blur-sm {
              background-color: rgba(31, 41, 55, 0.8);
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default Index;