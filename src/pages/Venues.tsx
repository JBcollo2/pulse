import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  MapPin,
  Star,
  Search,
  Globe,
  Calendar,
  Filter,
  Grid,
  List,
  TrendingUp,
  Eye,
  Navigation,
  Phone,
  Clock,
  Users,
  Heart,
  Share2,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Award,
  Camera,
  Music,
  Coffee,
  Wifi,
  Car,
  Utensils,
  ShieldCheck,
  Activity,
  Mail,
  Building,
  ArrowUpDown,
  RefreshCw,
  Menu,
  X,
  Ticket
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

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
  organizer: {
    id: number;
    company_name: string;
    company_logo?: string;
    company_description?: string;
  };
  likes_count: number;
}

interface City {
  city: string;
  event_count: number;
  top_amenities: string[];
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

// City Selection Component with Pagination
const CitySelector = ({ cities, selectedCity, onCitySelect, isLoading }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const citiesPerPage = 12;

  const filteredCities = useMemo(() => {
    return cities.filter(city =>
      city.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [cities, searchTerm]);

  const totalPages = Math.ceil(filteredCities.length / citiesPerPage);
  const startIndex = (currentPage - 1) * citiesPerPage;
  const currentCities = filteredCities.slice(startIndex, startIndex + citiesPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-100">Select City</h3>
        <span className="text-sm text-gray-400">{filteredCities.length} cities available</span>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search cities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-gray-700/80 backdrop-blur-sm border-gray-600/50 focus:border-gray-400 focus:ring-gray-400/20 text-gray-100"
        />
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentCities.map((city) => (
              <motion.button
                key={city.city}
                onClick={() => onCitySelect(city.city)}
                className={`p-4 rounded-xl border-2 transition-all duration-300 text-left relative overflow-hidden ${
                  selectedCity === city.city
                    ? 'border-gray-400 bg-gray-700/50'
                    : 'border-gray-600 hover:border-gray-400 hover:bg-gray-700/50'
                }`}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative z-10">
                  <div className="font-medium text-gray-100">{city.city}</div>
                  <div className="text-sm text-gray-400">
                    {city.event_count} venues
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {city.top_amenities.slice(0, 3).map((amenity, idx) => (
                      <span key={idx} className="text-xs bg-gray-600/50 text-gray-300 px-2 py-1 rounded-full">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-gray-600 hover:bg-gray-700/50 text-gray-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={currentPage === pageNum ? "bg-gray-600 text-gray-100" : "border-gray-600 hover:bg-gray-700/50 text-gray-100"}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="border-gray-600 hover:bg-gray-700/50 text-gray-100"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Modern Venue Card Component with updated dark, subtle styling
const VenueCard = ({ venue, index, onViewDetails }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getAmenityIcon = (amenity) => {
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
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
      className="group relative bg-gray-800/90 backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-700/50 cursor-pointer"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{
        y: -8,
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onViewDetails(venue)}
    >
      {/* Content Container */}
      <div className="relative z-10 p-0 h-full">
        {/* Image Section with Overlays */}
        <div className="relative h-56 overflow-hidden rounded-t-2xl">
          {/* Background Image */}
          {venue.topEvent?.image ? (
            <motion.img
              src={venue.topEvent.image}
              alt={venue.location}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center relative overflow-hidden">
              <span className="text-6xl font-bold text-gray-200 relative z-10 drop-shadow-2xl">
                {venue.location.charAt(0)}
              </span>
            </div>
          )}
          {/* Dark Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {/* Top Badges */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            {/* Featured Badge */}
            {venue.totalEvents > 10 && (
              <motion.div
                className="px-3 py-1 rounded-full text-xs font-bold text-white bg-gray-600 shadow-lg backdrop-blur-sm flex items-center gap-1"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              >
                <Star className="w-3 h-3 fill-current" />
                POPULAR
              </motion.div>
            )}
            {/* Action Buttons */}
            <div className="flex gap-2">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLiked(!isLiked);
                }}
                className={`p-2 rounded-full backdrop-blur-md border border-gray-400 transition-all duration-300 ${
                  isLiked
                    ? 'bg-gray-600 text-white shadow-lg scale-110'
                    : 'bg-gray-700/50 text-white hover:bg-gray-600'
                }`}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1 }}
              >
                <Heart className={`w-4 h-4 transition-all duration-300 ${isLiked ? 'fill-current' : ''}`} />
              </motion.button>
            </div>
          </div>
          {/* Bottom Info Bar */}
          <div className="absolute bottom-4 left-4 right-4">
            <motion.div
              className="flex items-center justify-between"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {/* Category Badge */}
              <div className="flex items-center gap-2 text-white bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-gray-400">
                <span>🏢</span>
                <span className="text-sm font-medium">Venue</span>
              </div>
              {/* Events Count */}
              <div className="flex items-center gap-2 text-white bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-gray-400">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">{venue.totalEvents}</span>
              </div>
            </motion.div>
          </div>
        </div>
        {/* Content Section */}
        <div className="p-6 space-y-4">
          {/* Title and Trending Indicator */}
          <div className="flex items-start justify-between gap-3">
            <motion.h3
              className="text-xl font-bold text-gray-100 leading-tight group-hover:text-white transition-all duration-500 line-clamp-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {venue.location}
            </motion.h3>
            {venue.totalEvents > 20 && (
              <motion.div
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-600 text-white text-xs font-bold flex-shrink-0"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
              >
                <TrendingUp className="w-3 h-3" />
                HOT
              </motion.div>
            )}
          </div>
          {/* Description */}
          <motion.p
            className="text-gray-300 text-sm line-clamp-3 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {venue.city} - {venue.totalEvents} events hosted at this location
          </motion.p>
          {/* Event Details */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Location */}
            <div className="flex items-center gap-3 text-gray-300">
              <div className="p-2 rounded-lg bg-gray-700 bg-opacity-50">
                <MapPin className="w-4 h-4 text-gray-200" />
              </div>
              <span className="text-sm font-medium truncate">{venue.city}</span>
            </div>
            {/* Rating */}
            <div className="flex items-center gap-3 text-gray-300">
              <div className="p-2 rounded-lg bg-gray-700 bg-opacity-50">
                <Star className="w-4 h-4 text-yellow-400" />
              </div>
              <span className="text-sm font-medium">{venue.avgRating.toFixed(1)} Rating</span>
            </div>
            {/* Events Count */}
            <div className="flex items-center gap-3 text-gray-300">
              <div className="p-2 rounded-lg bg-gray-700 bg-opacity-50">
                <Users className="w-4 h-4 text-gray-200" />
              </div>
              <span className="text-sm font-medium">{venue.totalEvents} Events</span>
            </div>
          </motion.div>
          {/* Amenities */}
          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {venue.uniqueAmenities.slice(0, 4).map((amenity, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1 px-3 py-2 bg-gray-700 bg-opacity-50 text-gray-200 rounded-full text-xs font-medium"
              >
                {getAmenityIcon(amenity)}
                <span className="capitalize">{amenity}</span>
              </div>
            ))}
            {venue.uniqueAmenities.length > 4 && (
              <span className="text-xs text-gray-400 px-3 py-2 bg-gray-700 rounded-full">
                +{venue.uniqueAmenities.length - 4} more
              </span>
            )}
          </motion.div>
          {/* Price and Action Buttons */}
          <motion.div
            className="flex items-center justify-between pt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Price and Venue Info */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-100">
                  {venue.avgRating.toFixed(1)}/5
                </span>
                <span className="text-xs text-gray-400">
                  rating
                </span>
              </div>
              <div className="space-y-1 mt-1">
                <div className="text-sm font-medium text-gray-300">
                  {venue.totalEvents} events hosted
                </div>
              </div>
            </div>
            {/* Explore Venue Button */}
            <motion.button
              className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold text-white bg-gray-600 hover:bg-gray-500 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 text-sm"
              whileTap={{ scale: 0.95 }}
              whileHover={{
                boxShadow: `0 15px 30px -8px rgba(75, 85, 99, 0.3)`,
                y: -1
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onViewDetails(venue);
              }}
            >
              <Ticket className="w-4 h-4" />
              <span>Explore Venue</span>
            </motion.button>
          </motion.div>
          {/* Share Venue Button */}
          <motion.button
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold text-gray-800 bg-white hover:bg-gray-200 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 text-sm mt-2"
            whileTap={{ scale: 0.95 }}
            whileHover={{
              boxShadow: `0 15px 30px -8px rgba(255, 255, 255, 0.2)`,
              y: -1
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Add share logic here
            }}
          >
            <Share2 className="w-4 h-4" />
            <span>Share Venue</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const Venues = () => {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [availableFilters, setAvailableFilters] = useState({
    locations: [],
    amenities: [],
    time_filters: ['upcoming', 'today', 'past', 'all']
  });
  const [filters, setFilters] = useState({
    city: '',
    location: '',
    amenity: '',
    time_filter: 'upcoming',
    sort_by: 'date',
    sort_order: 'asc'
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
      // Group events by location to create venues
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
            avgRating: 4.0 + Math.random() * 1.0 // Mock rating
          });
        }
        const venue = venueMap.get(key);
        venue.events.push(event);
        venue.totalEvents++;
        // Add amenities
        if (event.amenities) {
          event.amenities.forEach(amenity => venue.uniqueAmenities.add(amenity));
        }
        // Set top event (featured or first)
        if (!venue.topEvent || event.featured) {
          venue.topEvent = event;
        }
      });
      // Convert to array and process
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
    <div className="min-h-screen bg-gray-900 text-gray-100 relative">
      <Navbar />
      <main className="py-12 pt-24 relative z-10">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="text-5xl md:text-7xl font-bold text-gray-100 mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Discover Venues
            </motion.h1>
            <motion.p
              className="text-xl text-gray-400 max-w-2xl mx-auto mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Find the perfect venues for events in cities worldwide
            </motion.p>
          </motion.div>
          {/* City Selection */}
          {!selectedCity && (
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <CitySelector
                cities={cities}
                selectedCity={selectedCity}
                onCitySelect={handleCitySelect}
                isLoading={loading}
              />
            </motion.div>
          )}
          {/* City Events Section */}
          {selectedCity && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* City Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedCity('');
                      setSearchParams({});
                    }}
                    className="border-gray-600 hover:bg-gray-700/50 text-gray-100"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Cities
                  </Button>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-100">
                      {selectedCity}
                    </h2>
                    <p className="text-gray-400">
                      {venues.length} venues found
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => fetchCityEvents(1, true)}
                    disabled={loading}
                    className="border-gray-600 hover:bg-gray-700/50 text-gray-100"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
              {/* Filters */}
              <div className="mb-8 space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Search venues..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-gray-700/80 backdrop-blur-sm border-gray-600/50 focus:border-gray-400 focus:ring-gray-400/20 text-gray-100"
                      />
                    </div>
                  </div>
                  {/* Location Filter */}
                  <select
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="px-4 py-2 border rounded-lg bg-gray-700/80 backdrop-blur-sm border-gray-600/50 focus:border-gray-400 text-gray-100"
                  >
                    <option value="">All Locations</option>
                    {availableFilters.locations?.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                  {/* Amenity Filter */}
                  <select
                    value={filters.amenity}
                    onChange={(e) => handleFilterChange('amenity', e.target.value)}
                    className="px-4 py-2 border rounded-lg bg-gray-700/80 backdrop-blur-sm border-gray-600/50 focus:border-gray-400 text-gray-100"
                  >
                    <option value="">All Amenities</option>
                    {availableFilters.amenities?.map(amenity => (
                      <option key={amenity} value={amenity}>{amenity}</option>
                    ))}
                  </select>
                  {/* Time Filter */}
                  <select
                    value={filters.time_filter}
                    onChange={(e) => handleFilterChange('time_filter', e.target.value)}
                    className="px-4 py-2 border rounded-lg bg-gray-700/80 backdrop-blur-sm border-gray-600/50 focus:border-gray-400 text-gray-100"
                  >
                    <option value="upcoming">Upcoming Events</option>
                    <option value="today">Today</option>
                    <option value="past">Past Events</option>
                    <option value="all">All Events</option>
                  </select>
                  {/* View Toggle */}
                  <div className="flex bg-gray-700/80 backdrop-blur-sm rounded-lg border border-gray-600/50 p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={viewMode === 'grid' ? 'bg-gray-600 text-gray-100' : 'text-gray-100'}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={viewMode === 'list' ? 'bg-gray-600 text-gray-100' : 'text-gray-100'}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-gray-700/80 backdrop-blur-sm border border-gray-600/50">
                  <TabsTrigger value="all" className="data-[state=active]:bg-gray-600 data-[state=active]:text-gray-100">All Venues</TabsTrigger>
                  <TabsTrigger value="trending" className="data-[state=active]:bg-gray-600 data-[state=active]:text-gray-100">Trending</TabsTrigger>
                  <TabsTrigger value="top-rated" className="data-[state=active]:bg-gray-600 data-[state=active]:text-gray-100">Top Rated</TabsTrigger>
                  <TabsTrigger value="nearby" className="data-[state=active]:bg-gray-600 data-[state=active]:text-gray-100">Popular</TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="mt-6">
                  {loading ? (
                    <div className={`grid gap-6 ${
                      viewMode === 'grid'
                        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                        : 'grid-cols-1 max-w-4xl mx-auto'
                    }`}>
                      {Array(6).fill(0).map((_, index) => (
                        <div key={index} className="bg-gray-800/90 backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg border border-gray-700/50">
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
                        <div className="text-center text-red-500 py-8 bg-red-900/20 rounded-xl border border-red-800">
                          <div className="text-4xl mb-4">⚠️</div>
                          <p className="text-lg font-medium">{error}</p>
                        </div>
                      )}
                      {!error && sortedVenues.length === 0 && (
                        <div className="text-center py-20">
                          <div className="text-8xl mb-6">🏢</div>
                          <h3 className="text-3xl font-bold text-gray-100 mb-4">
                            No venues found
                          </h3>
                          <p className="text-lg text-gray-400 mb-8">
                            Try adjusting your search or filters
                          </p>
                          <Button
                            onClick={() => {
                              setSearchQuery('');
                              setFilters(prev => ({ ...prev, location: '', amenity: '' }));
                            }}
                            className="bg-gray-600 text-gray-100"
                          >
                            Clear Filters
                          </Button>
                        </div>
                      )}
                      {/* Venues Grid */}
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
                      {/* Loading More Indicator */}
                      {isLoadingMore && (
                        <div className="flex justify-center items-center py-12">
                          <div className="flex items-center gap-3 px-6 py-3 bg-gray-800/80 backdrop-blur-sm rounded-full border border-gray-600/50 shadow-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                            <span className="text-gray-400">Loading more venues...</span>
                          </div>
                        </div>
                      )}
                      {/* Load More Trigger */}
                      <div ref={loadMoreRef} className="h-10 w-full" />
                      {/* End Message */}
                      {!hasMore && sortedVenues.length > 0 && (
                        <div className="text-center py-12">
                          <div className="inline-flex items-center px-6 py-3 bg-gray-700/50 rounded-full border border-gray-600/50">
                            <span className="text-gray-400">
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
      <Footer />
      {/* Venue Details Modal */}
      <Dialog open={!!selectedVenue} onOpenChange={() => setSelectedVenue(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-800/95 backdrop-blur-xl border border-gray-700/50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-100">
              {selectedVenue?.location}
            </DialogTitle>
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{selectedVenue?.city}</span>
            </div>
          </DialogHeader>
          {selectedVenue && (
            <div className="space-y-6">
              {/* Hero Image */}
              {selectedVenue.topEvent?.image && (
                <div className="relative h-64 rounded-xl overflow-hidden">
                  <img
                    src={selectedVenue.topEvent.image}
                    alt={selectedVenue.location}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {/* Stats Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                    <div className="bg-gray-800/90 px-4 py-2 rounded-full flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{selectedVenue.avgRating.toFixed(1)}</span>
                    </div>
                    <div className="bg-gray-600 text-white px-4 py-2 rounded-full flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">{selectedVenue.totalEvents} Events</span>
                    </div>
                  </div>
                </div>
              )}
              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Venue Info */}
                <div className="space-y-4">
                  <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600/50">
                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Building className="w-5 h-5 text-gray-400" />
                      Venue Details
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Location:</span>
                        <span className="font-medium text-gray-100">{selectedVenue.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">City:</span>
                        <span className="font-medium text-gray-100">{selectedVenue.city}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Events:</span>
                        <span className="font-medium text-gray-100">{selectedVenue.totalEvents}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Rating:</span>
                        <span className="font-medium text-gray-100">{selectedVenue.avgRating.toFixed(1)}/5.0</span>
                      </div>
                    </div>
                  </div>
                  {/* Amenities */}
                  <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600/50">
                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Award className="w-5 h-5 text-gray-400" />
                      Available Amenities
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedVenue.uniqueAmenities.map((amenity, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 bg-gray-600/50 rounded-lg"
                        >
                          {(() => {
                            const iconMap = {
                              'wifi': <Wifi className="w-4 h-4 text-gray-400" />,
                              'parking': <Car className="w-4 h-4 text-gray-400" />,
                              'food': <Utensils className="w-4 h-4 text-gray-400" />,
                              'music': <Music className="w-4 h-4 text-gray-400" />,
                              'coffee': <Coffee className="w-4 h-4 text-gray-400" />,
                              'security': <ShieldCheck className="w-4 h-4 text-gray-400" />,
                              'activities': <Activity className="w-4 h-4 text-gray-400" />,
                            };
                            return iconMap[amenity.toLowerCase()] || <Star className="w-4 h-4 text-yellow-400" />;
                          })()}
                          <span className="capitalize text-sm text-gray-100">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Recent Events */}
                <div className="space-y-4">
                  <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600/50">
                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      Recent Events
                    </h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {selectedVenue.events.slice(0, 5).map(event => (
                        <div
                          key={event.id}
                          className="p-3 bg-gray-600/50 rounded-lg hover:bg-gray-600/80 transition-all duration-300"
                        >
                          <h5 className="font-medium text-sm mb-1 text-gray-100">{event.name}</h5>
                          <div className="flex items-center text-xs text-gray-400 gap-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(event.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{event.start_time}</span>
                            </div>
                          </div>
                          {event.category && (
                            <span className="inline-block mt-2 px-2 py-1 bg-gray-600/50 text-gray-300 text-xs rounded-full">
                              {event.category}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-600/50">
                <Button
                  onClick={() => handleGetDirections(selectedVenue)}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>
                <Button
                  onClick={() => navigate(`/events?city=${encodeURIComponent(selectedVenue.city)}&location=${encodeURIComponent(selectedVenue.location)}`)}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View All Events
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShare(selectedVenue)}
                  className="flex-1 border-gray-600 hover:bg-gray-700/50 text-gray-100"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Venue
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Venues;
