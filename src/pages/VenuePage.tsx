import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  MapPin, Star, Search, Globe, Calendar, Filter, Grid, List, TrendingUp, Eye, Navigation,
  Phone, Clock, Users, Heart, Share2, Bookmark, ChevronRight, ChevronLeft, Loader2,
  Award, Camera, Music, Coffee, Wifi, Car, Utensils, ShieldCheck, Activity, Mail,
  Building, ArrowUpDown, RefreshCw, Menu, X, Ticket, Tag, ArrowRight, Zap
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Interfaces
interface Event {
  id: number;
  name: string;
  description?: string;
  date: string;
  start_time: string;
  end_time?: string;
  city: string;
  location: string;
  amenities: string[];
  image?: string;
  category?: string;
  featured: boolean;
  status?: string;
  organizer: {
    id: number;
    company_name: string;
    company_logo?: string;
    company_description?: string;
  };
  likes_count: number;
}

interface VenueLocation {
  location: string;
  city: string;
  events: Event[];
  totalEvents: number;
  uniqueAmenities: string[];
  topEvent?: Event;
  avgRating: number;
}

interface LocationFilters {
  city: string;
  location?: string;
  amenity?: string;
  time_filter: 'upcoming' | 'today' | 'past' | 'all';
  sort_by: 'date' | 'name';
  sort_order: 'asc' | 'desc';
}

// StatsCard Component (simplified)
const StatsCard = ({ icon, value, label }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-200 dark:border-gray-700">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
        {icon}
      </div>
      <div>
        <div className="text-lg font-semibold text-gray-900 dark:text-white">{value}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      </div>
    </div>
  </div>
);

// CityCard Component (simplified)
const CityCard = ({ city, onSelect, index }) => (
  <div
    className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
    onClick={() => onSelect(city.city)}
  >
    <div className="relative h-40 overflow-hidden">
      <img
        src={city.image || `https://source.unsplash.com/random/800x600/?${city.city}`}
        alt={city.city}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 text-white">
        <h3 className="text-xl font-bold">{city.city}</h3>
        <div className="flex items-center justify-between text-sm mt-1">
          <div className="flex items-center gap-1">
            <Building className="w-4 h-4" />
            <span>{city.venues || city.event_count || 0} venues</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{city.event_count} events</span>
          </div>
        </div>
      </div>
    </div>
    <div className="p-4">
      <button className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
        <span>Explore {city.city}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// VenueCard Component (simplified, no rates)
const VenueCard = ({ venue, index, onViewDetails }) => {
  const [isHovered, setIsHovered] = useState(false);
  const getAmenityIcon = (amenity: string) => {
    const iconMap = {
      'wifi': <Wifi className="w-4 h-4" />,
      'parking': <Car className="w-4 h-4" />,
      'food': <Utensils className="w-4 h-4" />,
      'music': <Music className="w-4 h-4" />,
      'coffee': <Coffee className="w-4 h-4" />,
      'security': <ShieldCheck className="w-4 h-4" />,
      'activities': <Activity className="w-4 h-4" />,
    };
    return iconMap[amenity.toLowerCase()] || <Star className="w-4 h-4" />;
  };

  const getDisplayEvent = () => {
    if (!venue.events || venue.events.length === 0) return null;
    const currentDate = new Date();
    const sortedEvents = [...venue.events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const upcomingEvent = sortedEvents.find(event => new Date(event.date).getTime() >= currentDate.getTime());
    return upcomingEvent || sortedEvents[sortedEvents.length - 1];
  };

  const getEventStats = () => {
    if (!venue.events || venue.events.length === 0) {
      return { upcoming: 0, total: venue.totalEvents || 0, nextEventDate: null };
    }
    const currentDate = new Date();
    const upcoming = venue.events.filter(event => new Date(event.date).getTime() >= currentDate.getTime()).length;
    const nextEvent = venue.events
      .filter(event => new Date(event.date).getTime() >= currentDate.getTime())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    return {
      upcoming,
      total: venue.totalEvents || venue.events.length,
      nextEventDate: nextEvent ? nextEvent.date : null
    };
  };

  const displayEvent = getDisplayEvent();
  const eventStats = getEventStats();
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

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

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onViewDetails(venue)}
    >
      <div className="relative h-48 overflow-hidden">
        {displayEvent?.image ? (
          <img
            src={displayEvent.image}
            alt={venue.location}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-4xl font-bold text-blue-600 dark:text-blue-300">
            {venue.location.charAt(0)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex justify-between items-end">
            <div className="bg-black/50 px-3 py-1 rounded-full text-sm">
              {venue.location}
            </div>
            <div className="bg-black/50 px-3 py-1 rounded-full text-sm flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{eventStats.upcoming > 0 ? `${eventStats.upcoming} upcoming` : `${eventStats.total} events`}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">{venue.location}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          {venue.city} - {eventStats.total} events hosted
          {eventStats.nextEventDate && (
            <span className="block text-blue-600 dark:text-blue-300 font-medium mt-1">
              Next event: {formatDate(eventStats.nextEventDate)}
            </span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {venue.uniqueAmenities?.slice(0, 3).map((amenity, idx) => (
            <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs">
              {getAmenityIcon(amenity)}
              <span className="capitalize">{amenity}</span>
            </div>
          ))}
          {venue.uniqueAmenities?.length > 3 && (
            <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
              +{venue.uniqueAmenities.length - 3} more
            </span>
          )}
        </div>
        <div className="flex items-center justify-between pt-2">
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{eventStats.total}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">events</div>
            {eventStats.upcoming > 0 && (
              <div className="text-sm font-medium text-blue-600 dark:text-blue-300">
                {eventStats.upcoming} upcoming
              </div>
            )}
          </div>
          <Button
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onViewDetails(venue);
            }}
          >
            <Ticket className="w-4 h-4" />
            Explore Venue
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Main VenuePage Component
const VenuePage = () => {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [venues, setVenues] = useState<VenueLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedVenue, setSelectedVenue] = useState<VenueLocation | null>(null);
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [availableFilters, setAvailableFilters] = useState({
    locations: [],
    amenities: [],
    time_filters: ['upcoming', 'today', 'past', 'all']
  });
  const [filters, setFilters] = useState<LocationFilters>({
    city: '',
    location: '',
    amenity: '',
    time_filter: 'upcoming',
    sort_by: 'date',
    sort_order: 'asc'
  });
  const [stats, setStats] = useState({
    totalVenues: 0,
    totalEvents: 0,
    activeCities: 0,
    featuredVenues: 0,
  });
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const loadMoreRef = useRef(null);

  // Fetch cities on component mount
  useEffect(() => {
    fetchCities();
  }, []);

  // Set initial city from URL params
  useEffect(() => {
    const cityFromParams = searchParams.get('city');
    if (cityFromParams && cities.length > 0) {
      setSelectedCity(cityFromParams);
      setFilters(prev => ({ ...prev, city: cityFromParams }));
    }
  }, [cities, searchParams]);

  // Fetch events when city or filters change
  useEffect(() => {
    if (selectedCity) {
      fetchCityEvents(1, true);
    }
  }, [selectedCity, filters.location, filters.amenity, filters.time_filter, filters.sort_by, filters.sort_order]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoadingMore && selectedCity) {
          fetchCityEvents(currentPage + 1, false);
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [currentPage, hasMore, isLoadingMore, selectedCity]);

  const fetchCities = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cities`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch cities');
      const data = await response.json();
      setCities(data.cities || []);
      const totalEvents = data.cities.reduce((sum, city) => sum + city.event_count, 0);
      const featuredVenues = data.cities.filter(city => city.popular).length;
      setStats({
        totalVenues: data.cities.length * 5,
        totalEvents,
        activeCities: data.cities.length,
        featuredVenues,
      });
    } catch (err) {
      setError('Failed to load cities');
      console.error('Error fetching cities:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCityEvents = async (page = 1, reset = false) => {
    if (!selectedCity) return;
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
        ...(filters.location && { location: filters.location }),
        ...(filters.amenity && { amenity: filters.amenity }),
        time_filter: filters.time_filter,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order
      });
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/events/city/${encodeURIComponent(selectedCity)}?${params}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      const venueMap = new Map();
      data.events.forEach(event => {
        const key = event.location;
        if (!venueMap.has(key)) {
          venueMap.set(key, {
            location: event.location,
            city: event.city,
            events: [],
            totalEvents: 0,
            uniqueAmenities: new Set(),
            topEvent: null,
            avgRating: 4.0 + Math.random() * 1.0
          });
        }
        const venue = venueMap.get(key);
        venue.events.push(event);
        venue.totalEvents++;
        if (event.amenities) {
          event.amenities.forEach(amenity => venue.uniqueAmenities.add(amenity));
        }
        if (!venue.topEvent || event.featured) {
          venue.topEvent = event;
        }
      });
      const processedVenues = Array.from(venueMap.values()).map(venue => ({
        ...venue,
        uniqueAmenities: Array.from(venue.uniqueAmenities)
      }));
      if (reset || page === 1) {
        setVenues(processedVenues);
        setCurrentPage(1);
      } else {
        setVenues(prev => [...prev, ...processedVenues]);
      }
      setCurrentPage(page);
      setHasMore(data.pagination.has_next);
      setAvailableFilters(data.available_filters || {
        locations: [],
        amenities: [],
        time_filters: ['upcoming', 'today', 'past', 'all']
      });
    } catch (err) {
      setError('Failed to load venues');
      console.error('Error fetching city events:', err);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setFilters(prev => ({ ...prev, city }));
    setSearchParams({ city });
    setVenues([]);
    setCurrentPage(1);
    setHasMore(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setVenues([]);
    setCurrentPage(1);
    setHasMore(true);
  };

  const handleViewDetails = (venue) => {
    setSelectedVenue(venue);
  };

  const handleGetDirections = (venue) => {
    const query = encodeURIComponent(`${venue.location}, ${venue.city}`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(mapsUrl, '_blank');
  };

  const handleShare = (venue) => {
    const shareData = {
      title: venue.location,
      text: `Check out this venue in ${venue.city}!`,
      url: window.location.href,
    };
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const filteredVenues = useMemo(() => {
    return venues.filter(venue => {
      const matchesSearch = !searchQuery ||
        venue.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.city.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [venues, searchQuery]);

  const sortedVenues = useMemo(() => {
    const sorted = [...filteredVenues];
    switch (activeTab) {
      case 'trending':
        return sorted.sort((a, b) => b.totalEvents - a.totalEvents);
      case 'top-rated':
        return sorted.sort((a, b) => b.avgRating - a.avgRating);
      case 'nearby':
        return sorted.sort(() => Math.random() - 0.5);
      default:
        return sorted;
    }
  }, [filteredVenues, activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative">
      <Navbar />
      <main className="py-12 pt-24 relative z-10">
        <div className="container mx-auto px-4">
          {!selectedCity ? (
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-center mb-16">
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                  Find Perfect<br />Event Venues
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
                  Explore thousands of unique venues across cities worldwide.
                </p>
                <div className="max-w-2xl mx-auto mb-12">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search for cities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                <StatsCard
                  icon={<Building className="w-6 h-6" />}
                  value={stats.totalVenues}
                  label="Total Venues"
                />
                <StatsCard
                  icon={<Calendar className="w-6 h-6" />}
                  value={stats.totalEvents}
                  label="Events Hosted"
                />
                <StatsCard
                  icon={<MapPin className="w-6 h-6" />}
                  value={stats.activeCities}
                  label="Active Cities"
                />
                <StatsCard
                  icon={<Star className="w-6 h-6" />}
                  value={stats.featuredVenues}
                  label="Featured Venues"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      Explore Cities
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      {cities.filter(city => city.city.toLowerCase().includes(searchQuery.toLowerCase())).length} cities available
                    </p>
                  </div>
                </div>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array(6).fill(0).map((_, i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow border border-gray-200 dark:border-gray-700 animate-pulse">
                        <div className="h-40 w-full bg-gray-200 dark:bg-gray-700" />
                        <div className="p-4 space-y-2">
                          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                          <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-20 text-red-500">
                    <p>{error}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cities
                      .filter(city => city.city.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((city, index) => (
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
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedCity('');
                      setSearchParams({});
                    }}
                    className="border-gray-200 dark:border-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Cities
                  </Button>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {selectedCity}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      {venues.length} venues found
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => fetchCityEvents(1, true)}
                    disabled={loading}
                    className="border-gray-200 dark:border-gray-700"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
              <div className="mb-8 space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search venues..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <select
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-400"
                  >
                    <option value="">All Locations</option>
                    {availableFilters.locations?.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                  <select
                    value={filters.amenity}
                    onChange={(e) => handleFilterChange('amenity', e.target.value)}
                    className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-400"
                  >
                    <option value="">All Amenities</option>
                    {availableFilters.amenities?.map(amenity => (
                      <option key={amenity} value={amenity}>{amenity}</option>
                    ))}
                  </select>
                  <select
                    value={filters.time_filter}
                    onChange={(e) => handleFilterChange('time_filter', e.target.value)}
                    className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-400"
                  >
                    <option value="upcoming">Upcoming Events</option>
                    <option value="today">Today</option>
                    <option value="past">Past Events</option>
                    <option value="all">All Events</option>
                  </select>
                  <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300'}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300'}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <TabsTrigger value="all" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">All Venues</TabsTrigger>
                  <TabsTrigger value="trending" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Trending</TabsTrigger>
                  <TabsTrigger value="top-rated" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Top Rated</TabsTrigger>
                  <TabsTrigger value="nearby" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Popular</TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="mt-6">
                  {loading ? (
                    <div className={`grid gap-6 ${
                      viewMode === 'grid'
                        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                        : 'grid-cols-1 max-w-4xl mx-auto'
                    }`}>
                      {Array(6).fill(0).map((_, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow border border-gray-200 dark:border-gray-700">
                          <Skeleton className="h-48 w-full" />
                          <div className="p-6 space-y-4">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <div className="flex gap-2">
                              <Skeleton className="h-6 w-16" />
                              <Skeleton className="h-6 w-16" />
                            </div>
                            <Skeleton className="h-10 w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {error && (
                        <div className="text-center text-red-500 py-8 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                          <div className="text-4xl mb-4">⚠️</div>
                          <p className="text-lg font-medium">{error}</p>
                        </div>
                      )}
                      {!error && sortedVenues.length === 0 && (
                        <div className="text-center py-20">
                          <div className="text-8xl mb-6">🏢</div>
                          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            No venues found
                          </h3>
                          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                            Try adjusting your search or filters
                          </p>
                          <Button
                            onClick={() => {
                              setSearchQuery('');
                              setFilters(prev => ({ ...prev, location: '', amenity: '' }));
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            Clear Filters
                          </Button>
                        </div>
                      )}
                      <div className={`grid gap-6 ${
                        viewMode === 'grid'
                          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                          : 'grid-cols-1 max-w-4xl mx-auto'
                      }`}>
                        <AnimatePresence>
                          {sortedVenues.map((venue, index) => (
                            <VenueCard
                              key={`${venue.location}-${venue.city}`}
                              venue={venue}
                              index={index}
                              onViewDetails={handleViewDetails}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                      {isLoadingMore && (
                        <div className="flex justify-center items-center py-12">
                          <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-gray-600 dark:text-gray-300">Loading more venues...</span>
                          </div>
                        </div>
                      )}
                      <div ref={loadMoreRef} className="h-10 w-full" />
                      {!hasMore && sortedVenues.length > 0 && (
                        <div className="text-center py-12">
                          <div className="inline-flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
                            <span className="text-gray-700 dark:text-gray-300">
                              You've explored all venues in {selectedCity}!
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </div>
      </main>
      {/* Venue Details Modal */}
      <Dialog open={!!selectedVenue} onOpenChange={() => setSelectedVenue(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {selectedVenue?.location}
            </DialogTitle>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="font-medium">{selectedVenue?.city}</span>
            </div>
          </DialogHeader>
          {selectedVenue && (
            <div className="space-y-6">
              {selectedVenue.topEvent?.image && (
                <div className="relative h-64 rounded-xl overflow-hidden">
                  <img
                    src={selectedVenue.topEvent.image}
                    alt={selectedVenue.location}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                    <div className="bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-full flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">{selectedVenue.avgRating.toFixed(1)}</span>
                    </div>
                    <div className="bg-gray-800/90 dark:bg-gray-700/90 text-white px-4 py-2 rounded-full flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">{selectedVenue.totalEvents} Events</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow">
                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                        <Building className="w-4 h-4" />
                      </div>
                      Venue Details
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Location:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{selectedVenue.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">City:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{selectedVenue.city}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Total Events:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{selectedVenue.totalEvents}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow">
                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                        <Award className="w-4 h-4" />
                      </div>
                      Available Amenities
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedVenue.uniqueAmenities.map((amenity, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          {(() => {
                            const iconMap = {
                              'wifi': <Wifi className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
                              'parking': <Car className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
                              'food': <Utensils className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
                              'music': <Music className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
                              'coffee': <Coffee className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
                              'security': <ShieldCheck className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
                              'activities': <Activity className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
                            };
                            return iconMap[amenity.toLowerCase()] || <Star className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
                          })()}
                          <span className="capitalize text-sm text-gray-700 dark:text-gray-300">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                          <Calendar className="w-4 h-4" />
                        </div>
                        Events at this Venue
                      </h4>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedVenue.events.length > 5 ? `Showing 5 of ${selectedVenue.events.length}` : `${selectedVenue.events.length} events`}
                      </div>
                    </div>
                    {selectedVenue.events.length > 0 ? (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {selectedVenue.events.slice(0, 10).map((event, index) => (
                          <div
                            key={event.id || index}
                            className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300 border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100 flex-1 mr-2">
                                {event.name}
                              </h5>
                              {event.status && (
                                <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                                  event.status === 'active'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : event.status === 'completed'
                                    ? 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                }`}>
                                  {event.status}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center text-xs text-gray-600 dark:text-gray-300 gap-4 mb-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(event.date).toLocaleDateString()}</span>
                              </div>
                              {event.start_time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{event.start_time}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              {event.category && (
                                <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                                  {event.category}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {selectedVenue.events.length > 10 && (
                          <div className="text-center pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/events?city=${encodeURIComponent(selectedVenue.city)}&location=${encodeURIComponent(selectedVenue.location)}`)}
                              className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              View all {selectedVenue.events.length} events
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No events scheduled at this venue</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => handleGetDirections(selectedVenue)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>
                <Button
                  onClick={() => navigate(`/events?city=${encodeURIComponent(selectedVenue.city)}&location=${encodeURIComponent(selectedVenue.location)}`)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View All Events
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShare(selectedVenue)}
                  className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 bg-white dark:bg-gray-800"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Venue
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default VenuePage;
