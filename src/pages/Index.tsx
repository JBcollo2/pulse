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
          
          {/* Enhanced Large Featured Event Section */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm transition-colors duration-300 border-y border-blue-100/50 dark:border-gray-700/50">
            <div className="container mx-auto px-4 py-12 md:py-24 lg:py-32">
              <motion.div variants={itemVariants}>
                <div className="text-center mb-12 md:mb-16 lg:mb-20">
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500/10 to-teal-500/10 border border-blue-200/30 dark:border-gray-700/50 mb-6">
                    <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-base font-medium text-blue-700 dark:text-blue-300">Spotlight Event</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-blue-300 dark:to-teal-400 mb-4">
                    Featured Event
                  </h2>
                  <p className="text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                    Don't miss out on this incredible experience
                  </p>
                </div>
              </motion.div>
              
              {isLoading ? (
                <motion.div variants={itemVariants} className="max-w-7xl mx-auto">
                  <div className="relative overflow-hidden rounded-3xl lg:rounded-[2rem]">
                    <Skeleton className="h-[400px] md:h-[600px] lg:h-[700px] xl:h-[800px] w-full bg-gradient-to-r from-blue-100 to-teal-100 dark:from-gray-700 dark:to-gray-600" />
                    <div className="absolute bottom-8 left-8 space-y-3">
                      <Skeleton className="h-8 w-80 bg-white/30 dark:bg-gray-600/30 backdrop-blur-sm rounded-lg" />
                      <Skeleton className="h-6 w-64 bg-white/30 dark:bg-gray-600/30 backdrop-blur-sm rounded-lg" />
                      <Skeleton className="h-6 w-48 bg-white/30 dark:bg-gray-600/30 backdrop-blur-sm rounded-lg" />
                    </div>
                  </div>
                </motion.div>
              ) : featuredEvent ? (
                <motion.div variants={itemVariants}>
                  <div className="relative max-w-7xl mx-auto">
                    {/* Enhanced glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-teal-500/20 to-emerald-500/20 rounded-3xl lg:rounded-[2rem] blur-2xl -z-10"></div>
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-emerald-500/10 rounded-3xl lg:rounded-[2rem] blur-3xl -z-20"></div>
                    
                    {/* Large Featured Event Card */}
                    <div className="relative overflow-hidden rounded-3xl lg:rounded-[2rem] bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 shadow-2xl group hover:shadow-3xl transition-all duration-500">
                      {/* Event Image */}
                      <div className="relative h-[400px] md:h-[600px] lg:h-[700px] xl:h-[800px] overflow-hidden">
                        <img 
                          src={featuredEvent.image || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'} 
                          alt={featuredEvent.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent"></div>
                        
                        {/* Event Details Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-12">
                          <div className="max-w-4xl">
                            {/* Event Badge */}
                            {new Date(featuredEvent.date) < currentDate && (
                              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-300/30 backdrop-blur-sm mb-4">
                                <span className="text-sm font-medium text-orange-200">Past Event</span>
                              </div>
                            )}
                            
                            {/* Event Title */}
                            <h3 className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 lg:mb-6 leading-tight">
                              {featuredEvent.name}
                            </h3>
                            
                            {/* Event Description */}
                            <p className="text-base md:text-lg lg:text-xl text-gray-200 mb-6 lg:mb-8 max-w-3xl leading-relaxed">
                              {featuredEvent.description}
                            </p>
                            
                            {/* Event Meta Info */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-8 mb-6 lg:mb-8">
                              <div className="flex items-center gap-3 text-gray-200">
                                <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm">
                                  <Calendar className="w-5 h-5 lg:w-6 lg:h-6" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-300">Date & Time</p>
                                  <p className="text-base lg:text-lg font-semibold">
                                    {new Date(featuredEvent.date).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })} • {featuredEvent.start_time} - {featuredEvent.end_time || 'Till Late'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3 text-gray-200">
                                <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm">
                                  <MapPin className="w-5 h-5 lg:w-6 lg:h-6" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-300">Location</p>
                                  <p className="text-base lg:text-lg font-semibold">{featuredEvent.location}</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 lg:gap-6">
                              <button 
                                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold rounded-xl lg:rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-base lg:text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                onClick={() => navigate(`/events/${featuredEvent.id}`)}
                                disabled={featuredEventTicket?.remaining_quantity === 0}
                              >
                                {featuredEventTicket?.remaining_quantity === 0 ? 'Sold Out' : 'Get Tickets'}
                              </button>
                              
                              <button 
                                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl lg:rounded-2xl border border-white/20 backdrop-blur-sm hover:border-white/30 transition-all duration-300 text-base lg:text-lg flex items-center justify-center gap-2"
                                onClick={() => handleLike(featuredEvent.id)}
                              >
                                <span>♥</span>
                                <span>{featuredEvent.likes_count} Likes</span>
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Top Right Price Badge */}
                        <div className="absolute top-6 right-6 lg:top-8 lg:right-8">
                          <div className="px-4 py-2 lg:px-6 lg:py-3 bg-green-500/90 backdrop-blur-sm rounded-xl lg:rounded-2xl border border-green-400/30">
                            {isLoadingTicket ? (
                              <p className="text-white font-bold text-sm lg:text-base">Loading...</p>
                            ) : featuredEventTicket ? (
                              <div className="text-center">
                                <p className="text-white font-bold text-sm lg:text-base">
                                  Starting from {featuredEventTicket.currency_symbol || 'KSh'}{featuredEventTicket.price.toLocaleString()}
                                </p>
                                {featuredEventTicket.remaining_quantity <= 10 && featuredEventTicket.remaining_quantity > 0 && (
                                  <p className="text-green-200 text-xs mt-1">
                                    Only {featuredEventTicket.remaining_quantity} left!
                                  </p>
                                )}
                                {featuredEventTicket.remaining_quantity === 0 && (
                                  <p className="text-red-200 text-xs mt-1">Sold Out</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-white font-bold text-sm lg:text-base">Starting from KSh 1,299</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div variants={itemVariants} className="text-center py-24 lg:py-32">
                  <div className="relative inline-block">
                    <div className="text-8xl lg:text-9xl mb-6 animate-bounce">🎭</div>
                    <div className="absolute -inset-8 bg-gradient-to-r from-blue-500/20 to-teal-500/20 rounded-full blur-2xl -z-10"></div>
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent mb-4">
                    No Featured Events
                  </h3>
                  <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300">
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
          
          {/* Advanced Digital Experience Section */}
          <div className="relative bg-gradient-to-br from-gray-900 via-blue-900/50 to-purple-900/30 dark:from-gray-950 dark:via-blue-950/50 dark:to-purple-950/30 transition-colors duration-300 overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400/10 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-400/10 via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full animate-ping delay-1000"></div>
              <div className="absolute top-40 right-32 w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-2000"></div>
              <div className="absolute bottom-40 left-40 w-3 h-3 bg-teal-400 rounded-full animate-bounce delay-3000"></div>
              <div className="absolute bottom-60 right-20 w-2 h-2 bg-emerald-400 rounded-full animate-ping delay-500"></div>
            </div>
            
            <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 relative z-10">
              <motion.div variants={itemVariants} className="text-center mb-12 md:mb-16">
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/20 dark:border-blue-400/10 backdrop-blur-xl mb-6">
                  <div className="w-5 h-5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-base font-medium text-blue-200 dark:text-blue-300">Next-Gen Technology</span>
                </div>
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-blue-200 via-purple-200 to-teal-200 bg-clip-text text-transparent dark:from-blue-100 dark:via-purple-100 dark:to-teal-100">
                  The Future of Event Tickets
                </h2>
                <p className="text-lg md:text-xl lg:text-2xl text-blue-100/80 dark:text-blue-100/70 max-w-4xl mx-auto leading-relaxed">
                  Experience cutting-edge digital tickets powered by AI, blockchain security, and immersive AR technology
                </p>
              </motion.div>
              
              {/* Feature Grid */}
              <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-8 lg:gap-12 mb-16 lg:mb-20">
                <div className="group">
                  <div className="relative p-6 lg:p-8 rounded-2xl lg:rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-blue-400/30 transition-all duration-500 hover:transform hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl lg:rounded-3xl group-hover:from-blue-500/20 transition-all duration-500"></div>
                    <div className="relative z-10">
                      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl lg:rounded-2xl flex items-center justify-center mb-4 lg:mb-6 group-hover:rotate-12 transition-transform duration-500">
                        <svg className="w-6 h-6 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <h3 className="text-xl lg:text-2xl font-bold text-white mb-2 lg:mb-3">Blockchain Security</h3>
                      <p className="text-blue-200/80 text-sm lg:text-base leading-relaxed">Military-grade encryption with immutable blockchain verification prevents fraud and counterfeiting</p>
                    </div>
                  </div>
                </div>
                
                <div className="group">
                  <div className="relative p-6 lg:p-8 rounded-2xl lg:rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-purple-400/30 transition-all duration-500 hover:transform hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl lg:rounded-3xl group-hover:from-purple-500/20 transition-all duration-500"></div>
                    <div className="relative z-10">
                      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl lg:rounded-2xl flex items-center justify-center mb-4 lg:mb-6 group-hover:rotate-12 transition-transform duration-500">
                        <svg className="w-6 h-6 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl lg:text-2xl font-bold text-white mb-2 lg:mb-3">AR Experience</h3>
                      <p className="text-purple-200/80 text-sm lg:text-base leading-relaxed">Interactive augmented reality previews let you explore venues and artists before the event</p>
                    </div>
                  </div>
                </div>
                
                <div className="group">
                  <div className="relative p-6 lg:p-8 rounded-2xl lg:rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-teal-400/30 transition-all duration-500 hover:transform hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent rounded-2xl lg:rounded-3xl group-hover:from-teal-500/20 transition-all duration-500"></div>
                    <div className="relative z-10">
                      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl lg:rounded-2xl flex items-center justify-center mb-4 lg:mb-6 group-hover:rotate-12 transition-transform duration-500">
                        <svg className="w-6 h-6 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className="text-xl lg:text-2xl font-bold text-white mb-2 lg:mb-3">Instant Transfer</h3>
                      <p className="text-teal-200/80 text-sm lg:text-base leading-relaxed">Lightning-fast ticket transfers and resale with smart contracts and automated verification</p>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Interactive Ticket Demo */}
              <motion.div variants={itemVariants} className="relative max-w-6xl mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-teal-500/20 rounded-3xl lg:rounded-[2rem] blur-3xl -z-10"></div>
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-teal-500/10 rounded-3xl lg:rounded-[2rem] blur-2xl -z-20"></div>
                
                {/* Main Demo Container */}
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl lg:rounded-[2rem] border border-white/20 p-6 md:p-8 lg:p-12 overflow-hidden">
                  {/* Animated Grid Background */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px),
                                       linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)`,
                      backgroundSize: '20px 20px'
                    }}></div>
                  </div>
                  
                  <div className="relative z-10 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left Side - Features */}
                    <div className="space-y-6 lg:space-y-8">
                      <div>
                        <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4 lg:mb-6">Revolutionary Digital Tickets</h3>
                        <div className="space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 animate-pulse"></div>
                            <div>
                              <h4 className="text-white font-semibold mb-1">Animated QR Codes</h4>
                              <p className="text-blue-200/80 text-sm">Dynamic, impossible-to-counterfeit QR codes with real-time validation</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 animate-pulse delay-500"></div>
                            <div>
                              <h4 className="text-white font-semibold mb-1">Smart Notifications</h4>
                              <p className="text-purple-200/80 text-sm">AI-powered alerts for travel, weather, and event updates</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="w-2 h-2 bg-teal-400 rounded-full mt-2 animate-pulse delay-1000"></div>
                            <div>
                              <h4 className="text-white font-semibold mb-1">Contactless Entry</h4>
                              <p className="text-teal-200/80 text-sm">NFC and biometric scanning for seamless venue access</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                          Try Demo
                        </button>
                        <button className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 backdrop-blur-sm hover:border-white/30 transition-all duration-300">
                          Learn More
                        </button>
                      </div>
                    </div>
                    
                    {/* Right Side - 3D Ticket Preview */}
                    <div className="relative">
                      <div className="relative transform rotate-y-12 perspective-1000 hover:rotate-y-0 transition-transform duration-700">
                        {/* Ticket Card */}
                        <div className="relative w-full max-w-sm mx-auto bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-700/50 hover:shadow-blue-500/20 transition-all duration-500">
                          {/* Holographic Effect */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-teal-400/20 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                          
                          {/* Ticket Header */}
                          <div className="relative z-10 mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs text-gray-400 uppercase tracking-wider">Digital Ticket</div>
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg animate-pulse"></div>
                            </div>
                            <h4 className="text-white font-bold text-lg mb-1">Summer Music Festival 2025</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-300">
                              <span>📅 Jun 15, 2025</span>
                              <span>🕐 8:00 PM</span>
                            </div>
                          </div>
                          
                          {/* Animated QR Code Area */}
                          <div className="relative mb-4">
                            <div className="w-20 h-20 bg-white rounded-lg p-2 mx-auto relative overflow-hidden">
                              <div className="w-full h-full bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded animate-pulse"></div>
                              {/* Scanning line animation */}
                              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/50 to-transparent animate-scan"></div>
                            </div>
                            <p className="text-center text-xs text-gray-400 mt-2">Tap to scan</p>
                          </div>
                          
                          {/* Ticket Details */}
                          <div className="text-center space-y-1">
                            <p className="text-white font-semibold">John Doe</p>
                            <p className="text-purple-300 text-sm">VIP Experience</p>
                            <p className="text-gray-400 text-xs">ID: PULSE2025X7891</p>
                          </div>
                          
                          {/* Interactive Elements */}
                          <div className="absolute top-2 right-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Floating Tech Elements */}
                      <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full animate-float"></div>
                      <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full animate-bounce delay-1000"></div>
                      <div className="absolute top-1/2 -right-8 w-4 h-4 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full animate-pulse delay-2000"></div>
                    </div>
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
        
        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
        
        @keyframes rotate-y-12 {
          0% {
            transform: rotateY(12deg);
          }
          100% {
            transform: rotateY(0deg);
          }
        }
        
        @keyframes holographic {
          0%, 100% {
            background-position: 0% 50%;
            opacity: 0.3;
          }
          50% {
            background-position: 100% 50%;
            opacity: 0.7;
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
        
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
        
        .rotate-y-12 {
          transform: rotateY(12deg);
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
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