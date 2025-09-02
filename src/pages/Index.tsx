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
import {
  Sparkles, TrendingUp, Calendar, MapPin, Clock, Users, Star, Ticket, CreditCard,
  Smartphone, Mail, QrCode, Shield, Zap, Search, Building, ArrowRight, Heart
} from 'lucide-react';
import { Button } from "@/components/ui/button";

// Import the CityCard component from the LandingPage
const CityCard = ({ city, onSelect, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div
      className={`group relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/30 dark:border-gray-800/60 cursor-pointer`}
      onClick={() => onSelect(city.city)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={city.image || `https://source.unsplash.com/random/800x600/?${city.city}`}
          alt={city.city}
          className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {city.popular && (
          <div className="absolute top-3 right-3">
            <div className="px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg animate-pulse">
              <TrendingUp className="w-3 h-3" />
              HOT
            </div>
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white mb-1">{city.city}</h3>
          <div className="flex items-center justify-between text-white/80">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              <span className="text-sm">{city.venues || city.event_count || 0} venues</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{city.event_count} events</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
          <span>Explore {city.city}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-2">
          {(city.top_amenities || []).slice(0, 3).map((amenity, idx) => (
            <span key={idx} className="text-xs bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
              {amenity}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// StatsCard Component
const StatsCard = ({ icon, value, label, gradient }) => (
  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-gradient-to-r ${gradient} text-white shadow-lg`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        <div className="text-sm text-gray-600 dark:text-gray-300">{label}</div>
      </div>
    </div>
  </div>
);

// Floating background shapes
const FloatingShapes = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/10 via-cyan-400/10 to-blue-500/10 rounded-full blur-xl animate-pulse" />
    <div className="absolute top-60 right-20 w-24 h-24 bg-gradient-to-br from-cyan-400/10 via-blue-400/10 to-cyan-500/10 rounded-full blur-xl" />
    <div className="absolute bottom-40 left-1/3 w-40 h-40 bg-gradient-to-br from-blue-500/5 via-cyan-500/5 to-blue-500/5 rounded-full blur-2xl" />
  </div>
);

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
  const [currentQRCode, setCurrentQRCode] = useState(0);
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalVenues: 0,
    totalEvents: 0,
    activeCities: 0,
    featuredVenues: 0,
  });
  const { toast } = useToast();

  // QR Code patterns for animation
  const qrPatterns = [
    'from-gray-900 via-blue-900 to-green-900',
    'from-blue-900 via-green-900 to-purple-900',
    'from-green-900 via-purple-900 to-blue-900',
    'from-purple-900 via-blue-900 to-green-900'
  ];

  // Animate QR code pattern
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQRCode((prev) => (prev + 1) % qrPatterns.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Fetch cities and calculate stats
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/cities`, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch cities');
        const data = await response.json();
        setCities(data.cities || []);

        // Calculate stats
        const totalEvents = data.cities.reduce((sum, city) => sum + city.event_count, 0);
        const featuredVenues = data.cities.filter(city => city.popular).length;
        setStats({
          totalVenues: data.cities.length * 5,
          totalEvents,
          activeCities: data.cities.length,
          featuredVenues,
        });
      } catch (err) {
        console.error('Error fetching cities:', err);
      }
    };

    fetchCities();
  }, []);

  // Filter cities based on search
  useEffect(() => {
    const filtered = cities.filter(city =>
      city.city.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCities(filtered);
  }, [searchQuery, cities]);

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

  // Get current date for filtering upcoming events
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/events?per_page=15&time_filter=all`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }

        const data = await response.json();
        setEvents(data.events);

        // Find featured event
        const upcomingEvents = data.events.filter(
          (event: Event) => new Date(event.date) >= currentDate
        );

        if (upcomingEvents.length > 0) {
          const featuredUpcoming = upcomingEvents.filter((event: Event) => event.featured);

          if (featuredUpcoming.length > 0) {
            const bestFeatured = featuredUpcoming.reduce(
              (prev: Event, current: Event) => (current.likes_count > prev.likes_count) ? current : prev,
              featuredUpcoming[0]
            );
            setFeaturedEvent(bestFeatured);
          } else {
            const mostLikedUpcoming = upcomingEvents.reduce(
              (prev: Event, current: Event) => (current.likes_count > prev.likes_count) ? current : prev,
              upcomingEvents[0]
            );
            setFeaturedEvent(mostLikedUpcoming);
          }
        } else if (data.events.length > 0) {
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
      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === eventId
            ? { ...event, likes_count: event.likes_count + 1 }
            : event
        )
      );
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

  const handleCitySelect = (cityName) => {
    navigate(`/venues?city=${encodeURIComponent(cityName)}`);
  };

  // Function to get recent events for homepage display (limit to 8)
  const getRecentEvents = () => {
    const upcomingEvents = events.filter(event => new Date(event.date) >= currentDate);
    const pastEvents = events.filter(event => new Date(event.date) < currentDate);

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

  // Handle get tickets navigation
  const handleGetTickets = (eventId: number) => {
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
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-10 dark:opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }}></div>

      <FloatingShapes />

      <div className="relative z-10">
        <Navbar />

        <main className="relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-0"
          >
            {/* Hero Section */}
            <motion.div variants={itemVariants}>
              <HeroSection onSearch={handleHeroSearch} />
            </motion.div>

            {/* Landing Page Content - Cities Section */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
                <motion.div variants={itemVariants} className="text-center mb-8 md:mb-12">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    Explore Cities
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {filteredCities.length} cities available
                  </p>
                </motion.div>

                <div className="max-w-2xl mx-auto mb-8">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search for cities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 shadow-lg placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300"
                    />
                  </div>
                </div>

                {cities.length === 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array(6).fill(0).map((_, i) => (
                      <div key={i} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg border border-white/20 dark:border-gray-700/50 animate-pulse">
                        <div className="h-40 w-full bg-gray-200 dark:bg-gray-700" />
                        <div className="p-4">
                          <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                          <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCities.map((city, index) => (
                      <CityCard
                        key={city.city}
                        city={city}
                        onSelect={handleCitySelect}
                        index={index}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stats Section */}
            <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                  <StatsCard
                    icon={<Building className="w-6 h-6" />}
                    value={stats.totalVenues}
                    label="Total Venues"
                    gradient="from-blue-500 to-blue-600"
                  />
                  <StatsCard
                    icon={<Calendar className="w-6 h-6" />}
                    value={stats.totalEvents}
                    label="Events Hosted"
                    gradient="from-cyan-500 to-cyan-600"
                  />
                  <StatsCard
                    icon={<MapPin className="w-6 h-6" />}
                    value={stats.activeCities}
                    label="Active Cities"
                    gradient="from-emerald-500 to-emerald-600"
                  />
                  <StatsCard
                    icon={<Star className="w-6 h-6" />}
                    value={stats.featuredVenues}
                    label="Featured Venues"
                    gradient="from-amber-500 to-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Featured Event Section */}
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
                      <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-500 group">
                        <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] xl:h-[600px] overflow-hidden">
                          <img
                            src={featuredEvent.image || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'}
                            alt={featuredEvent.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent"></div>

                          <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                            <div className="bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-full flex items-center gap-2">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="font-medium text-gray-900 dark:text-gray-100">{featuredEvent.likes_count}</span>
                            </div>
                            <div className="bg-gray-800/90 dark:bg-gray-700/90 text-white px-4 py-2 rounded-full flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span className="font-medium">{formatDate(featuredEvent.date)}</span>
                            </div>
                          </div>

                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-white bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                <span className="font-medium">{featuredEvent.name}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 space-y-4">
                          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                              <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            </div>
                            <span className="text-sm font-medium truncate">{featuredEvent.location}</span>
                          </div>

                          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                              <Clock className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            </div>
                            <span className="text-sm font-medium">
                              {formatDate(featuredEvent.date)} at {formatTime(featuredEvent.start_time)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <div className="flex flex-col">
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {featuredEvent.likes_count}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  likes
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleGetTickets(featuredEvent.id)}
                                className="flex-1 bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-600 hover:to-[#0f9b76] text-white"
                              >
                                <Ticket className="w-4 h-4 mr-2" />
                                Get Tickets
                              </Button>

                              <Button
                                variant="outline"
                                onClick={() => handleLike(featuredEvent.id)}
                                className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 bg-white dark:bg-gray-800"
                              >
                                <Heart className="w-4 h-4 mr-2" />
                                Like
                              </Button>
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
                    Secure Paystack card payments, instant M-Pesa transactions, and real-time QR codes delivered via email
                  </p>
                </motion.div>

                <motion.div variants={itemVariants} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12 lg:mb-16">
                  <div className="group">
                    <div className="relative p-4 sm:p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-400/50 dark:hover:border-blue-400/50 transition-all duration-500 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:rotate-12 transition-transform duration-500 shadow-lg shadow-blue-500/25">
                        <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Paystack Payments</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Secure card payments powered by Paystack with international support and fraud protection</p>
                    </div>
                  </div>

                  <div className="group">
                    <div className="relative p-4 sm:p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-green-400/50 dark:hover:border-green-400/50 transition-all duration-500 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:rotate-12 transition-transform duration-500 shadow-lg shadow-green-500/25">
                        <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">M-Pesa Integration</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Instant mobile payments via M-Pesa for seamless transactions using your phone number</p>
                    </div>
                  </div>

                  <div className="group">
                    <div className="relative p-4 sm:p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-400/50 dark:hover:border-purple-400/50 transition-all duration-500 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:rotate-12 transition-transform duration-500 shadow-lg shadow-purple-500/25">
                        <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Email Delivery</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Digital tickets with real-time QR codes delivered instantly to your email inbox</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="relative max-w-5xl mx-auto">
                  <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="space-y-6 order-2 lg:order-1">
                      <div>
                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">Revolutionary Payment & Delivery</h3>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-400/50 dark:hover:border-blue-400/50 transition-all duration-300">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <CreditCard className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h4 className="text-gray-800 dark:text-gray-200 font-semibold mb-1 text-sm sm:text-base">Paystack Integration</h4>
                              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Pay securely with Visa, MasterCard, or any international card via Paystack's encrypted gateway</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-green-400/50 dark:hover:border-green-400/50 transition-all duration-300">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Smartphone className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h4 className="text-gray-800 dark:text-gray-200 font-semibold mb-1 text-sm sm:text-base">M-Pesa Payments</h4>
                              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Quick mobile money transactions - just enter your phone number and confirm payment</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-400/50 dark:hover:border-purple-400/50 transition-all duration-300">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Mail className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h4 className="text-gray-800 dark:text-gray-200 font-semibold mb-1 text-sm sm:text-base">Instant Email Delivery</h4>
                              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Receive your digital ticket with live QR code within seconds of payment confirmation</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 hover:scale-105">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Try Payment Demo
                        </Button>
                        <Button
                          variant="outline"
                          className="border-2 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold px-6 py-3 rounded-xl transition-all duration-300"
                        >
                          <Smartphone className="w-4 h-4 mr-2" />
                          M-Pesa Guide
                        </Button>
                      </div>
                    </div>

                    <div className="relative order-1 lg:order-2">
                      <div className="relative transform hover:scale-105 transition-transform duration-700 max-w-sm mx-auto">
                        <div className="relative w-full bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl p-4 sm:p-6 shadow-2xl border border-gray-700/50 hover:shadow-blue-500/20 transition-all duration-500 overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-green-400/10 to-purple-400/10 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                          <div className="absolute inset-0 opacity-5">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-green-500/20 to-purple-500/20 animate-pulse"></div>
                          </div>

                          <div className="relative z-10 mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                Digital Ticket
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg animate-pulse shadow-lg shadow-blue-500/25 flex items-center justify-center">
                                  <QrCode className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                </div>
                                <div className="text-xs text-green-400 font-medium">LIVE</div>
                              </div>
                            </div>
                            <h4 className="text-white font-bold text-base sm:text-lg mb-1">Summer Music Festival 2025</h4>
                            <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-300">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Jun 15, 2025
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                8:00 PM
                              </span>
                            </div>
                          </div>

                          <div className="relative mb-4">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-lg p-2 mx-auto relative overflow-hidden shadow-lg">
                              <div className={`w-full h-full bg-gradient-to-br ${qrPatterns[currentQRCode]} rounded transition-all duration-1000`}>
                                <div className="grid grid-cols-8 gap-px p-1 h-full">
                                  {[...Array(64)].map((_, i) => (
                                    <div
                                      key={i}
                                      className={`bg-black rounded-sm transition-all duration-500 ${
                                        Math.random() > 0.5 ? 'opacity-100' : 'opacity-0'
                                      }`}
                                      style={{
                                        animationDelay: `${i * 50}ms`
                                      }}
                                    ></div>
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center justify-center gap-2 mt-2">
                                <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                                <p className="text-center text-xs text-green-400 font-medium">Live • Secure • Verified</p>
                                <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse delay-1000"></div>
                              </div>
                            </div>
                          </div>

                          <div className="text-center space-y-2 mb-4">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">MJ</span>
                              </div>
                              <p className="text-white font-semibold text-sm sm:text-base">Moses Juma</p>
                            </div>
                            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-400/30">
                              <Star className="w-3 h-3 text-yellow-400" />
                              <p className="text-green-400 text-xs sm:text-sm font-medium">VIP Experience</p>
                            </div>
                            <p className="text-gray-400 text-xs font-mono">ID: PULSE2025X7891</p>
                          </div>

                          <div className="flex items-center justify-center gap-2 mb-3">
                            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/20 border border-blue-400/30">
                              <CreditCard className="w-3 h-3 text-blue-400" />
                              <span className="text-xs text-blue-400">Paystack</span>
                            </div>
                            <div className="text-gray-500 text-xs">or</div>
                            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/20 border border-green-400/30">
                              <Smartphone className="w-3 h-3 text-green-400" />
                              <span className="text-xs text-green-400">M-Pesa</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                            <Mail className="w-3 h-3" />
                            <span>Delivered via email</span>
                            <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                          </div>
                        </div>
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
              opacity: 0;
            }
            50% {
              opacity: 1;
            }
            100% {
              transform: translateY(100%);
              opacity: 0;
            }
          }

          .animate-float {
            animation: float 4s ease-in-out infinite;
          }

          .animate-scan {
            animation: scan 3s ease-in-out infinite;
          }

          /* QR Code Animation */
          @keyframes qr-update {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
            }
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

          /* Enhanced animation delays for staggered effects */
          .delay-1000 {
            animation-delay: 1s;
          }

          .delay-2000 {
            animation-delay: 2s;
          }

          .delay-3000 {
            animation-delay: 3s;
          }
        `}</style>
      </div>
    </div>
  );
};

export default Index;
